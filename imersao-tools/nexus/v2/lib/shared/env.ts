import { z } from 'zod';

/**
 * Nexus v2 — Validação de env vars (Zod)
 *
 * Conforme architecture-v2.md §9.2.
 * Lança erro claro em arranque se var obrigatória ausente.
 *
 * Server-only (não importar em ficheiros client). Variáveis
 * `NEXT_PUBLIC_*` são acessíveis ao client por design Next.js.
 */

/**
 * Story 8.1 (ADR-10 §1.2/§3.2) — providers de inferência suportados pela
 * feature flag dual-provider. Single source of truth do enum.
 */
export const LLM_PROVIDERS = ['anthropic', 'openai'] as const;
export type LLMProvider = (typeof LLM_PROVIDERS)[number];

const ServerEnvObject = z.object({
  // Story 8.1 [ADR-10 S1] — a key de cada provider é OPCIONAL no objecto base;
  // a obrigatoriedade é CONDICIONAL ao `LLM_PROVIDER` activo (ver `.refine` da
  // key do provider abaixo). Assim, um deployment OpenAI não exige
  // ANTHROPIC_API_KEY e vice-versa. O `.min(10)` aplica-se só quando presente.
  ANTHROPIC_API_KEY: z
    .string()
    .min(10, 'ANTHROPIC_API_KEY ausente ou demasiado curta')
    .optional(),
  NEXUS_PASSWORD_HASH: z.string().min(10, 'NEXUS_PASSWORD_HASH ausente'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET ausente ou demasiado curta'),

  // Story 8.1 [ADR-10 S1] — feature flag dual-provider (server-only). Escolhe a
  // implementação na factory. Default 'anthropic' = comportamento byte-a-byte
  // o de hoje (retrocompat total; 2400+ testes verdes por construção).
  LLM_PROVIDER: z.enum(LLM_PROVIDERS).default('anthropic'),

  // Story 8.1 [ADR-10 S1, NFR5/D-8.1-SECRET] — key OpenAI (secret server-only,
  // espelha ANTHROPIC_API_KEY). NUNCA `NEXT_PUBLIC_*` — não pode entrar no client
  // bundle. Opcional no objecto base; obrigatória só quando LLM_PROVIDER=openai
  // (refine abaixo). Provisionada em prod via Vercel UI. NUNCA logada (NFR5).
  OPENAI_API_KEY: z
    .string()
    .min(10, 'OPENAI_API_KEY ausente ou demasiado curta')
    .optional(),

  // Opcionais em dev (preenchidas em prod via Vercel UI)
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  WEB_PUSH_VAPID_PRIVATE: z.string().optional(),

  // Story 4.8 — segredo partilhado que protege `/api/push/dispatch` (chamado
  // pelo scheduler, sem cookie de sessão). Opcional em dev (o dispatch recusa-se
  // a operar se ausente); provisionado pelo @devops em prod. NUNCA logado (NFR5).
  CRON_SECRET: z.string().optional(),

  // Story 6.16 [D-6.16-BRIEFING-SCHEDULE] — janela horária do briefing matinal
  // (hora local de Lisboa, `[start, end[`). Config estática (não estado) → env,
  // não KV (evita leitura KV no caminho quente). Default 7/9 quando ausentes.
  // `z.coerce.number()`: as env vars chegam sempre como string; coerce converte.
  BRIEFING_HOUR_START: z.coerce.number().int().min(0).max(23).optional(),
  BRIEFING_HOUR_END: z.coerce.number().int().min(0).max(24).optional(),

  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

// Story 6.16 [D-6.16-BRIEFING-SCHEDULE] — quando ambas as horas estão definidas,
// `start` tem de ser estritamente menor que `end`. Caso contrário a janela
// `[start, end[` é vazia e o briefing devolve `outside_window` em TODAS as
// execuções, silenciosamente. Validar aqui falha no arranque (não em runtime).
const ServerEnvSchema = ServerEnvObject.refine(
  (env) =>
    env.BRIEFING_HOUR_START === undefined ||
    env.BRIEFING_HOUR_END === undefined ||
    env.BRIEFING_HOUR_START < env.BRIEFING_HOUR_END,
  {
    message:
      'BRIEFING_HOUR_START tem de ser menor que BRIEFING_HOUR_END (janela [start, end[ vazia caso contrário)',
    path: ['BRIEFING_HOUR_START'],
  },
)
  // Story 8.1 [ADR-10 S1/AC4] — a key do provider ACTIVO é obrigatória; a do
  // outro provider não. LLM_PROVIDER tem default 'anthropic' (sempre definido
  // pós-parse), por isso este refine resolve sempre um provider concreto.
  // Mantém o fail-loud de arranque para Anthropic (retrocompat) e estende-o à
  // OpenAI sem exigir as duas keys ao mesmo tempo.
  .refine(
    (env) =>
      env.LLM_PROVIDER === 'openai'
        ? Boolean(env.OPENAI_API_KEY)
        : Boolean(env.ANTHROPIC_API_KEY),
    {
      message:
        'Key do provider activo ausente — define ANTHROPIC_API_KEY (LLM_PROVIDER=anthropic) ou OPENAI_API_KEY (LLM_PROVIDER=openai)',
      path: ['LLM_PROVIDER'],
    },
  );

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC: z.string().optional(),

  // Story 8.1 [ADR-10 §3.4/D-8.1-FLAGS] — espelho PÚBLICO de LLM_PROVIDER, lido
  // pelo `client-executor.ts` no browser para escolher o transport (Story 8.4).
  // Apenas o NOME do provider é público (não um secret). TEM de concordar com
  // LLM_PROVIDER (server) — ver `assertProviderFlagsAgree`. Default 'anthropic'.
  NEXT_PUBLIC_LLM_PROVIDER: z.enum(LLM_PROVIDERS).default('anthropic'),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;

let _serverEnv: ServerEnv | null = null;

/**
 * Lê e valida env vars server-side.
 * Em modo `test`, vars críticas são opcionais (mocks resolvem).
 *
 * @throws Error com lista de campos inválidos se algo falhar
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  if (process.env.NODE_ENV === 'test') {
    // Test mode: tolera ausências, retorna parsed-best-effort.
    // `.partial()` é do `ZodObject` base (o `.refine()` produz `ZodEffects`,
    // que não expõe `.partial()`); o refine start<end não é crítico em test.
    const result = ServerEnvObject.partial().safeParse(process.env);
    _serverEnv = (result.success ? result.data : {}) as ServerEnv;
    return _serverEnv;
  }

  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Env vars inválidas:\n${issues}`);
  }
  _serverEnv = result.data;
  return _serverEnv;
}

export function getPublicEnv(): PublicEnv {
  return PublicEnvSchema.parse({
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC: process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC,
    // Story 8.1 — cablar a flag pública. Sem isto, a `.default('anthropic')` do
    // schema nunca via o valor real de `process.env` (campo não passado → undefined
    // → default), mascarando um `NEXT_PUBLIC_LLM_PROVIDER=openai` definido.
    NEXT_PUBLIC_LLM_PROVIDER: process.env.NEXT_PUBLIC_LLM_PROVIDER,
  });
}

/**
 * Story 8.1 (AC1/AC2, CONCERN @po #1) — resolve o provider activo lendo
 * `process.env.LLM_PROVIDER` DIRECTAMENTE (Edge-safe, sem parse global do schema),
 * com o mesmo default 'anthropic' do schema.
 *
 * Fail-loud: um valor desconhecido (ex: 'foobar') **não** cai silenciosamente
 * para 'anthropic' — lança `Error` PT-PT claro. Ausente → 'anthropic' (válido).
 * É a leitura canónica usada pela factory no caminho quente.
 */
export function resolveLLMProvider(): LLMProvider {
  const raw = process.env.LLM_PROVIDER ?? 'anthropic';
  if (raw !== 'anthropic' && raw !== 'openai') {
    throw new Error(
      `LLM_PROVIDER inválido: "${raw}" — valores aceites: 'anthropic' | 'openai' ` +
        `(ausente → 'anthropic'). Corrige a variável de ambiente.`
    );
  }
  return raw;
}

/**
 * Story 8.1 (AC5/D-8.1-FLAGS) — asserção de concordância das flags no boot do
 * server. `NEXT_PUBLIC_LLM_PROVIDER` (client transport) TEM de igualar
 * `LLM_PROVIDER` (server upstream); um mismatch faria o client construir um body
 * de um provider e postá-lo no proxy do outro. Fail-loud em mismatch (não
 * silencioso). Lê `process.env` directamente (Edge-safe); ambas ausentes →
 * ambas 'anthropic' → concordam. Reusa `resolveLLMProvider` para validar também
 * o enum de cada flag (valor inválido em qualquer uma → erro).
 *
 * Invocada lazy pela factory na primeira resolução de provider (ponto de
 * arranque server-side; ver Dev Notes da Story 8.1).
 */
export function assertProviderFlagsAgree(): void {
  const server = resolveLLMProvider();

  const rawPublic = process.env.NEXT_PUBLIC_LLM_PROVIDER ?? 'anthropic';
  if (rawPublic !== 'anthropic' && rawPublic !== 'openai') {
    throw new Error(
      `NEXT_PUBLIC_LLM_PROVIDER inválido: "${rawPublic}" — valores aceites: ` +
        `'anthropic' | 'openai' (ausente → 'anthropic').`
    );
  }

  if (server !== rawPublic) {
    throw new Error(
      `Mismatch de flags de provider: LLM_PROVIDER='${server}' mas ` +
        `NEXT_PUBLIC_LLM_PROVIDER='${rawPublic}'. As duas TÊM de concordar — ` +
        `o transport client (NEXT_PUBLIC_*) e o upstream server (LLM_PROVIDER) ` +
        `escolhem o mesmo provider. Alinha ambas (ADR-10 §3.4).`
    );
  }
}
