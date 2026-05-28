import { z } from 'zod';
import { RRule } from 'rrule';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';
import { applyDirection } from '@/lib/financas/currencyInput';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import {
  splitInstallmentAmount,
  installmentDates,
} from '@/lib/financas/installmentSplit';
import type { Card, Installment, Transaction } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de finanças (Story 3.11 — FR23)
 *
 * Regista 6 tools de domínio `'finance'` no `toolRegistry` singleton:
 *   - `criar_financa_variavel`   — regista uma transação variável (compra/receita)
 *   - `criar_financa_recorrente` — cria uma recorrência financeira (renda, subscrição)
 *   - `criar_cartao`             — cria um cartão de crédito
 *   - `criar_parcelada`          — regista uma compra parcelada em N prestações
 *   - `consultar_balanco`        — consulta saldo total ou de uma conta
 *   - `consultar_categoria`      — consulta gastos numa categoria num mês
 *
 * NOTA NOMES ASCII (DEV-DECISION D-NAMES): os nomes das tools são ASCII puro
 * (sem `ç`/acentos) por imposição dupla — (1) `TOOL_NAME_PATTERN` do registry
 * (`registry.ts:27` = `/^[a-z][a-z0-9_]*$/`) e (2) Anthropic tool-calling spec
 * (`^[a-zA-Z0-9_-]{1,64}$`). Os nomes do FR23/story com cedilha
 * (`criar_finança_*`, `consultar_balanço`) seriam rejeitados pelo registry E
 * partiriam a chamada à API em produção. A semântica PT-PT vive nas `description`
 * (que aceitam acentos). Ver Dev Agent Record.
 *
 * Edge-safety (ADR-1, DEV-DECISION D1 da Story 2.10): este módulo NÃO importa
 * `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*` NEM `@/lib/shared/recurrence`
 * (todos puxam o singleton Dexie). Todas as operações de DB usam `ctx.db`
 * injectado (`ExecutionContext.db: NexusDB`). Helpers importados são PUROS e
 * Edge-safe: `applyDirection`/`formatCurrency` (`lib/financas/*`),
 * `splitInstallmentAmount`/`installmentDates` (`lib/financas/installmentSplit`),
 * e `RRule` de `'rrule'` (lib JS pura — apenas a classe, não o motor da Story 3.4).
 *
 * Contrato de schema (fonte da verdade `types/db.ts`, cruzado no fix-story v1.1):
 * - `Transaction` (10 campos): `amount` COM SINAL (negativo=saída, positivo=entrada),
 *   `category: string` (nome literal, NÃO id), só `createdAt` (sem `updatedAt`).
 * - `Card` (6 campos): `id, name, accountId, closingDay, dueDay, limit`.
 * - `FinanceRecurrence` (8 campos): par com `Recurrence` (`ownerType: 'transaction'`,
 *   `ownerId === financeRecurrence.id`) — cross-link exigido por `runFinanceRecurrenceEngine`.
 *
 * Trace canónico:
 * - PRD-NEXUS-V2.md §6.3 — FR23
 * - architecture-v2.md §7.4 — inventário 6 tools Epic 3
 * - Story 2.10 (`tasks.ts`/`projects.ts`) — padrão de registo replicado
 *
 * Constitution:
 * - Article IV (No Invention): campos derivam estritamente de `types/db.ts`
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...` (+ `rrule` package)
 */

// ═══════════════════════════════════════════════════════════════════
// FREQ_MAP — espelha lib/shared/recurrence.ts:40-45 (NÃO importar esse módulo,
// que puxa Dexie; aqui só usamos a classe `RRule` da lib pura).
// ═══════════════════════════════════════════════════════════════════

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const;

// ═══════════════════════════════════════════════════════════════════
// argsSchemas (source: FR23 + types/db.ts; decisão @po §3 — montante cêntimos)
// ═══════════════════════════════════════════════════════════════════

const CriarFinancaVariavelArgs = z.object({
  montante: z.number().int().positive('montante deve ser positivo em cêntimos'),
  direction: z.enum(['in', 'out']),
  categoriaNome: z.string().min(1),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve ser YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
  descricao: z.string().max(500).default(''),
  cartaoNome: z.string().nullable().default(null),
  contaId: z.string().nullable().default(null),
});

const CriarFinancaRecorrenteArgs = z.object({
  montante: z.number().int().positive('montante deve ser positivo em cêntimos'),
  direction: z.enum(['in', 'out']),
  categoriaNome: z.string().min(1),
  recorrencia: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().int().min(1).default(1),
    dayOfMonth: z.number().int().min(1).max(31).nullable().default(null),
  }),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dataInicio deve ser YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
  descricao: z.string().max(500).default(''),
  cartaoNome: z.string().nullable().default(null),
  contaId: z.string().nullable().default(null),
});

const CriarCartaoArgs = z.object({
  nome: z.string().min(1).max(200),
  contaId: z.string().uuid('contaId deve ser UUID válido'),
  fechamentoDia: z.number().int().min(1).max(31),
  vencimentoDia: z.number().int().min(1).max(31),
  limiteEuros: z.number().positive().nullable().default(null),
});

const CriarParceladaArgs = z.object({
  cartaoNome: z.string().min(1),
  totalMontante: z.number().int().positive('totalMontante deve ser positivo em cêntimos'),
  parcelas: z.number().int().min(2).max(72),
  descricao: z.string().min(1).max(500),
  categoriaNome: z.string().min(1),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dataInicio deve ser YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
});

const ConsultarBalancoArgs = z.object({
  contaNome: z.string().nullable().default(null),
});

const ConsultarCategoriaArgs = z.object({
  categoriaNome: z.string().min(1),
  mesIso: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'mesIso deve ser YYYY-MM')
    .nullable()
    .default(null),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos de resultado
// ═══════════════════════════════════════════════════════════════════

type CriarFinancaVariavelResult = { id: string; mensagem: string };
type CriarFinancaRecorrenteResult = {
  id: string;
  recurrenceId: string;
  mensagem: string;
};
type CriarCartaoResult = { id: string; nome: string; mensagem: string };
type CriarParceladaResult = {
  installmentId: string;
  nParcelas: number;
  mensagem: string;
};
type ContaResumo = { nome: string; balanceCentimos: number; formatted: string };
type ConsultarBalancoResult = {
  totalCentimos: number;
  formattedTotal: string;
  contas: ContaResumo[];
  mensagem: string;
};
type ConsultarCategoriaResult = {
  categoriaNome: string;
  totalCentimos: number;
  formattedTotal: string;
  count: number;
  mesIso: string;
  mensagem: string;
};

const CriarFinancaVariavelResultSchema = z.object({
  id: z.string(),
  mensagem: z.string(),
});
const CriarFinancaRecorrenteResultSchema = z.object({
  id: z.string(),
  recurrenceId: z.string(),
  mensagem: z.string(),
});
const CriarCartaoResultSchema = z.object({
  id: z.string(),
  nome: z.string(),
  mensagem: z.string(),
});
const CriarParceladaResultSchema = z.object({
  installmentId: z.string(),
  nParcelas: z.number(),
  mensagem: z.string(),
});
const ConsultarBalancoResultSchema = z.object({
  totalCentimos: z.number(),
  formattedTotal: z.string(),
  contas: z.array(
    z.object({
      nome: z.string(),
      balanceCentimos: z.number(),
      formatted: z.string(),
    })
  ),
  mensagem: z.string(),
});
const ConsultarCategoriaResultSchema = z.object({
  categoriaNome: z.string(),
  totalCentimos: z.number(),
  formattedTotal: z.string(),
  count: z.number(),
  mesIso: z.string(),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// Helper de registo (idêntico ao de tasks.ts — Story 2.10)
// ═══════════════════════════════════════════════════════════════════

function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

// ═══════════════════════════════════════════════════════════════════
// Helpers de resolução por nome (inline, não exportados, Edge-safe)
// ═══════════════════════════════════════════════════════════════════

/** Substring match case-insensitive em qualquer direcção. */
function fuzzyMatches(candidate: string, input: string): boolean {
  const a = candidate.toLowerCase();
  const b = input.toLowerCase();
  return a.includes(b) || b.includes(a);
}

/**
 * Resolve uma categoria pelo nome → devolve o `name` canónico (string).
 * `Transaction.category`/`FinanceRecurrence.category` guardam o nome literal
 * (não um id — `Category` não tem `id`). Política [A4]: 0 matches → erro
 * estruturado com a lista; múltiplos → o mais curto (mais específico).
 */
async function resolveCategoriaByNome(
  nome: string,
  ctx: ExecutionContext
): Promise<string> {
  const cats = await ctx.db.categories.toArray();
  const matches = cats.filter((c) => fuzzyMatches(c.name, nome));
  if (matches.length === 0) {
    const lista = cats.map((c) => c.name).join(', ');
    throw new Error(
      `Categoria não encontrada: "${nome}". Disponíveis: ${lista}`
    );
  }
  return matches.reduce((a, b) => (a.name.length <= b.name.length ? a : b)).name;
}

/**
 * Resolve um cartão pelo nome → devolve a `Card`. Política [A5]: 0 matches →
 * erro; ≥2 matches → erro de ambiguidade (nunca criar com cartão errado).
 */
async function resolveCartaoByNome(
  nome: string,
  ctx: ExecutionContext
): Promise<Card> {
  const cards = await ctx.db.cards.toArray();
  const matches = cards.filter((c) => fuzzyMatches(c.name, nome));
  if (matches.length === 0) {
    throw new Error(`Cartão não encontrado: "${nome}"`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Cartão ambíguo: "${nome}" corresponde a ${matches.length} cartões (${matches
        .map((c) => c.name)
        .join(', ')}). Especifica o nome completo.`
    );
  }
  return matches[0];
}

// ═══════════════════════════════════════════════════════════════════
// criar_financa_variavel (FR23 — trace: PRD §6.3, Epic 3 AC4)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarFinancaVariavelArgs>, CriarFinancaVariavelResult>({
    name: 'criar_financa_variavel',
    description:
      'Regista uma transação financeira variável (compra, pagamento, receita). Use para "paguei X", "gastei X", "recebi X", "registar despesa de X".',
    domain: 'finance',
    argsSchema: CriarFinancaVariavelArgs,
    resultSchema: CriarFinancaVariavelResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const category = await resolveCategoriaByNome(args.categoriaNome, ctx);
      let cardId: string | null = null;
      let cartaoNome: string | null = null;
      if (args.cartaoNome !== null) {
        const card = await resolveCartaoByNome(args.cartaoNome, ctx);
        cardId = card.id;
        cartaoNome = card.name;
      }
      const amount = applyDirection(
        args.montante,
        args.direction === 'out' ? 'saida' : 'entrada'
      );
      const id = crypto.randomUUID();
      const tx: Transaction = {
        id,
        amount,
        category,
        description: args.descricao,
        date: args.data,
        accountId: args.contaId,
        cardId,
        recurrenceId: null,
        installmentId: null,
        createdAt: Date.now(),
      };
      await ctx.db.transactions.add(tx);
      const cartaoMsg = cartaoNome !== null ? ` com cartão ${cartaoNome}` : '';
      return {
        id,
        mensagem: `Transação de ${formatCurrency(Math.abs(amount))} criada na categoria ${category}${cartaoMsg}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.transactions.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// criar_financa_recorrente (FR23 — sequência canónica Story 3.4)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<
    z.infer<typeof CriarFinancaRecorrenteArgs>,
    CriarFinancaRecorrenteResult
  >({
    name: 'criar_financa_recorrente',
    description:
      'Cria uma finança recorrente (renda, assinatura, salário). Use para "adiciona recorrente X por mês", "assinatura de X por Y€", "renda mensal de X€".',
    domain: 'finance',
    argsSchema: CriarFinancaRecorrenteArgs,
    resultSchema: CriarFinancaRecorrenteResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const category = await resolveCategoriaByNome(args.categoriaNome, ctx);
      let cardId: string | null = null;
      if (args.cartaoNome !== null) {
        cardId = (await resolveCartaoByNome(args.cartaoNome, ctx)).id;
      }
      const amount = applyDirection(
        args.montante,
        args.direction === 'out' ? 'saida' : 'entrada'
      );
      const recurrenceId = crypto.randomUUID();
      const financeRecurrenceId = crypto.randomUUID();
      // RRULE iCal string — round-trip com RRule.fromString do motor (Story 3.4).
      const rule = new RRule({
        freq: FREQ_MAP[args.recorrencia.frequency],
        interval: args.recorrencia.interval,
        ...(args.recorrencia.dayOfMonth !== null
          ? { bymonthday: [args.recorrencia.dayOfMonth] }
          : {}),
        dtstart: new Date(`${args.dataInicio}T00:00:00.000Z`),
      }).toString();
      await ctx.db.transaction(
        'rw',
        ctx.db.recurrences,
        ctx.db.financeRecurrences,
        async () => {
          await ctx.db.recurrences.add({
            id: recurrenceId,
            rule,
            startDate: args.dataInicio,
            endDate: null,
            ownerType: 'transaction',
            ownerId: financeRecurrenceId,
          });
          await ctx.db.financeRecurrences.add({
            id: financeRecurrenceId,
            amount,
            category,
            description: args.descricao,
            accountId: args.contaId,
            cardId,
            recurrenceId,
            createdAt: Date.now(),
          });
        }
      );
      return {
        id: financeRecurrenceId,
        recurrenceId,
        mensagem: `Recorrência de ${formatCurrency(Math.abs(amount))} criada na categoria ${category}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.transaction(
        'rw',
        ctx.db.recurrences,
        ctx.db.financeRecurrences,
        async () => {
          await ctx.db.financeRecurrences.delete(result.id);
          await ctx.db.recurrences.delete(result.recurrenceId);
        }
      );
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// criar_cartao (FR23)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarCartaoArgs>, CriarCartaoResult>({
    name: 'criar_cartao',
    description:
      'Cria um novo cartão de crédito associado a uma conta. Use para "cria o cartão X", "adiciona cartão Visa com fecho dia N".',
    domain: 'finance',
    argsSchema: CriarCartaoArgs,
    resultSchema: CriarCartaoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const conta = await ctx.db.accounts.get(args.contaId);
      if (conta === undefined) {
        throw new Error(`Conta "${args.contaId}" não encontrada`);
      }
      const limit =
        args.limiteEuros !== null ? Math.round(args.limiteEuros * 100) : null;
      const id = crypto.randomUUID();
      const card: Card = {
        id,
        name: args.nome,
        accountId: args.contaId,
        closingDay: args.fechamentoDia,
        dueDay: args.vencimentoDia,
        limit,
      };
      await ctx.db.cards.add(card);
      return { id, nome: args.nome, mensagem: `Cartão "${args.nome}" criado.` };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.cards.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// criar_parcelada (FR23 — atomicidade replicada inline da Story 3.6)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarParceladaArgs>, CriarParceladaResult>({
    name: 'criar_parcelada',
    description:
      'Regista uma compra parcelada em N vezes associada a um cartão. Use para "comprei X em Np vezes", "parcelei Y em Z prestações".',
    domain: 'finance',
    argsSchema: CriarParceladaArgs,
    resultSchema: CriarParceladaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const card = await resolveCartaoByNome(args.cartaoNome, ctx);
      const category = await resolveCategoriaByNome(args.categoriaNome, ctx);
      const montantes = splitInstallmentAmount(args.totalMontante, args.parcelas);
      const datas = installmentDates(args.dataInicio, args.parcelas);
      const installmentId = crypto.randomUUID();
      const now = Date.now();
      const installment: Installment = {
        id: installmentId,
        cardId: card.id,
        totalAmount: args.totalMontante,
        installments: args.parcelas,
        startDate: args.dataInicio,
        description: args.descricao,
      };
      const transactions: Transaction[] = montantes.map((m, i) => ({
        id: crypto.randomUUID(),
        amount: -m, // parcela é saída → sinal negativo
        category,
        description: args.descricao,
        date: datas[i],
        accountId: null,
        cardId: card.id,
        recurrenceId: null,
        installmentId,
        createdAt: now,
      }));
      await ctx.db.transaction(
        'rw',
        ctx.db.installments,
        ctx.db.transactions,
        async () => {
          await ctx.db.installments.add(installment);
          await ctx.db.transactions.bulkAdd(transactions);
        }
      );
      return {
        installmentId,
        nParcelas: args.parcelas,
        mensagem: `Compra parcelada de ${formatCurrency(args.totalMontante)} em ${args.parcelas}× de ${formatCurrency(montantes[0])} criada.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.transaction(
        'rw',
        ctx.db.installments,
        ctx.db.transactions,
        async () => {
          await ctx.db.installments.delete(result.installmentId);
          // `installmentId` NÃO está indexado em `transactions` (client.ts) —
          // usar `filter()` (full-scan), mesmo padrão de `deleteInstallmentCascade`
          // (Story 3.6 installments.ts:166).
          await ctx.db.transactions
            .filter((t) => t.installmentId === result.installmentId)
            .delete();
        }
      );
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// consultar_balanco (FR23 — read-only)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ConsultarBalancoArgs>, ConsultarBalancoResult>({
    name: 'consultar_balanco',
    description:
      'Consulta o saldo total ou de uma conta específica. Use para "quanto tenho?", "qual o saldo da conta X?", "saldo total".',
    domain: 'finance',
    argsSchema: ConsultarBalancoArgs,
    resultSchema: ConsultarBalancoResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const accounts = await ctx.db.accounts.toArray();
      const filtered =
        args.contaNome !== null
          ? accounts.filter((a) => fuzzyMatches(a.name, args.contaNome!))
          : accounts;
      const totalCentimos = filtered.reduce((sum, a) => sum + a.balance, 0);
      const contas: ContaResumo[] = filtered.map((a) => ({
        nome: a.name,
        balanceCentimos: a.balance,
        formatted: formatCurrency(a.balance),
      }));
      return {
        totalCentimos,
        formattedTotal: formatCurrency(totalCentimos),
        contas,
        mensagem: `Tens ${formatCurrency(totalCentimos)} em ${contas.length} conta(s).`,
      };
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// consultar_categoria (FR23 — read-only)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ConsultarCategoriaArgs>, ConsultarCategoriaResult>({
    name: 'consultar_categoria',
    description:
      'Consulta quanto foi gasto numa categoria num mês. Use para "quanto gastei em mercearia?", "despesas de combustível este mês", "total em restauração em Maio".',
    domain: 'finance',
    argsSchema: ConsultarCategoriaArgs,
    resultSchema: ConsultarCategoriaResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const category = await resolveCategoriaByNome(args.categoriaNome, ctx);
      const mesIso = args.mesIso ?? new Date().toISOString().slice(0, 7);
      const firstDay = `${mesIso}-01`;
      const lastDay = `${mesIso}-31`; // limite lexicográfico — datas ISO comparam como string
      const all = await ctx.db.transactions.toArray();
      const matches = all.filter(
        (t) => t.category === category && t.date >= firstDay && t.date <= lastDay
      );
      const totalCentimos = matches.reduce((sum, t) => sum + t.amount, 0);
      return {
        categoriaNome: category,
        totalCentimos,
        formattedTotal: formatCurrency(Math.abs(totalCentimos)),
        count: matches.length,
        mesIso,
        mensagem: `Gastaste ${formatCurrency(Math.abs(totalCentimos))} em ${category} em ${mesIso} (${matches.length} transacções).`,
      };
    },
  })
);
