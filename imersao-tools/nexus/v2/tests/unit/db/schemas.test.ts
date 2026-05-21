import { describe, it, expect } from 'vitest';
import {
  TaskSchema,
  ProjectSchema,
  RecurrenceSchema,
  TagSchema,
  AccountSchema,
  CardSchema,
  TransactionSchema,
  InstallmentSchema,
  CategorySchema,
} from '@/lib/db/schemas';

/**
 * Nexus v2 — DB schemas Zod tests (Story 2.1 / AC12 + Story 3.1 / AC14)
 *
 * Casos negativos focados — happy-path está coberto pelos repo tests.
 */

function validTask() {
  return {
    id: crypto.randomUUID(),
    title: 'X',
    description: '',
    priority: 'medium' as const,
    status: 'todo' as const,
    dueDate: null,
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function validProject() {
  return {
    id: crypto.randomUUID(),
    name: 'Projecto',
    description: '',
    status: 'active' as const,
    startDate: '2026-05-15',
    deadline: null,
    createdAt: Date.now(),
  };
}

function validRecurrence() {
  return {
    id: crypto.randomUUID(),
    rule: 'FREQ=WEEKLY',
    startDate: '2026-05-15',
    endDate: null,
    ownerType: 'task' as const,
    ownerId: crypto.randomUUID(),
  };
}

function validTag() {
  return {
    id: crypto.randomUUID(),
    name: 'Trabalho',
    color: '#00F5FF',
  };
}

describe('TaskSchema', () => {
  it('aceita Task válida (happy path sanity)', () => {
    expect(() => TaskSchema.parse(validTask())).not.toThrow();
  });

  it('rejeita Task sem title', () => {
    const invalid = { ...validTask(), title: '' };
    expect(() => TaskSchema.parse(invalid)).toThrow(/Título é obrigatório/);
  });

  it('rejeita Task com status fora do enum', () => {
    const invalid = { ...validTask(), status: 'cancelado' };
    expect(() => TaskSchema.parse(invalid)).toThrow();
  });

  it('rejeita Task com priority fora do enum', () => {
    const invalid = { ...validTask(), priority: 'urgente' };
    expect(() => TaskSchema.parse(invalid)).toThrow();
  });

  it('rejeita Task com id que não é UUID', () => {
    const invalid = { ...validTask(), id: '123' };
    expect(() => TaskSchema.parse(invalid)).toThrow(/UUID/);
  });

  it('rejeita Task com createdAt negativo', () => {
    const invalid = { ...validTask(), createdAt: -1 };
    expect(() => TaskSchema.parse(invalid)).toThrow();
  });
});

describe('ProjectSchema', () => {
  it('aceita Project válido', () => {
    expect(() => ProjectSchema.parse(validProject())).not.toThrow();
  });

  it('rejeita Project sem name', () => {
    const invalid = { ...validProject(), name: '' };
    expect(() => ProjectSchema.parse(invalid)).toThrow(/Nome do projecto é obrigatório/);
  });

  it('rejeita Project com status fora do enum', () => {
    const invalid = { ...validProject(), status: 'archived' };
    expect(() => ProjectSchema.parse(invalid)).toThrow();
  });

  it('rejeita Project sem startDate', () => {
    const invalid = { ...validProject(), startDate: '' };
    expect(() => ProjectSchema.parse(invalid)).toThrow(/Data de início é obrigatória/);
  });
});

describe('RecurrenceSchema', () => {
  it('aceita Recurrence válida', () => {
    expect(() => RecurrenceSchema.parse(validRecurrence())).not.toThrow();
  });

  it('rejeita Recurrence com ownerType inválido', () => {
    const invalid = { ...validRecurrence(), ownerType: 'projecto' };
    expect(() => RecurrenceSchema.parse(invalid)).toThrow();
  });

  it('rejeita Recurrence sem rule', () => {
    const invalid = { ...validRecurrence(), rule: '' };
    expect(() => RecurrenceSchema.parse(invalid)).toThrow(/Regra RRULE é obrigatória/);
  });

  it('rejeita Recurrence sem ownerId', () => {
    const invalid = { ...validRecurrence(), ownerId: '' };
    expect(() => RecurrenceSchema.parse(invalid)).toThrow(/ownerId é obrigatório/);
  });

  it('aceita todos os ownerType válidos do enum', () => {
    (['task', 'transaction', 'habit', 'reminder'] as const).forEach((ownerType) => {
      expect(() =>
        RecurrenceSchema.parse({ ...validRecurrence(), ownerType })
      ).not.toThrow();
    });
  });
});

describe('TagSchema', () => {
  it('aceita Tag válida', () => {
    expect(() => TagSchema.parse(validTag())).not.toThrow();
  });

  it('rejeita Tag sem name', () => {
    const invalid = { ...validTag(), name: '' };
    expect(() => TagSchema.parse(invalid)).toThrow(/Nome da tag é obrigatório/);
  });

  it('rejeita Tag sem color', () => {
    const invalid = { ...validTag(), color: '' };
    expect(() => TagSchema.parse(invalid)).toThrow(/Cor da tag é obrigatória/);
  });

  it('rejeita Tag com id que não é UUID', () => {
    const invalid = { ...validTag(), id: 'tag-1' };
    expect(() => TagSchema.parse(invalid)).toThrow(/UUID/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Epic 3 — Finanças (Story 3.1 / AC14)
// ═══════════════════════════════════════════════════════════════════

function validAccount() {
  return {
    id: crypto.randomUUID(),
    name: 'Conta à ordem',
    type: 'checking' as const,
    balance: 100000,
    createdAt: Date.now(),
  };
}

function validCard() {
  return {
    id: crypto.randomUUID(),
    name: 'Cartão Crédito',
    accountId: crypto.randomUUID(),
    closingDay: 25,
    dueDay: 10,
    limit: 500000,
  };
}

function validTransaction() {
  return {
    id: crypto.randomUUID(),
    amount: -1500,
    category: 'Mercearia',
    description: 'Compra',
    date: '2026-05-15',
    accountId: null,
    cardId: null,
    recurrenceId: null,
    installmentId: null,
    createdAt: Date.now(),
  };
}

function validInstallment() {
  return {
    id: crypto.randomUUID(),
    cardId: crypto.randomUUID(),
    totalAmount: 120000,
    installments: 12,
    startDate: '2026-05-15',
    description: 'Compra parcelada',
  };
}

function validCategory() {
  return {
    name: 'Mercearia',
    color: '#39FF14',
    icon: 'shopping-cart',
    isDefault: true,
  };
}

describe('AccountSchema', () => {
  it('aceita Account válida', () => {
    expect(() => AccountSchema.parse(validAccount())).not.toThrow();
  });

  it('rejeita Account sem name', () => {
    const invalid = { ...validAccount(), name: '' };
    expect(() => AccountSchema.parse(invalid)).toThrow(/Nome da conta é obrigatório/);
  });

  it('rejeita Account com type fora do enum', () => {
    const invalid = { ...validAccount(), type: 'investimento' };
    expect(() => AccountSchema.parse(invalid)).toThrow();
  });

  it('rejeita Account com balance decimal (cêntimos devem ser inteiros)', () => {
    const invalid = { ...validAccount(), balance: 100.5 };
    expect(() => AccountSchema.parse(invalid)).toThrow(/inteiro em cêntimos/);
  });
});

describe('CardSchema', () => {
  it('aceita Card válido', () => {
    expect(() => CardSchema.parse(validCard())).not.toThrow();
  });

  it('aceita Card com limit null', () => {
    expect(() => CardSchema.parse({ ...validCard(), limit: null })).not.toThrow();
  });

  it('rejeita Card com accountId não-UUID', () => {
    // Story 3.1 Iter 2 (CodeRabbit #7) — accountId validado como UUID.
    expect(() => CardSchema.parse({ ...validCard(), accountId: '' })).toThrow(
      /accountId deve ser UUID válido/,
    );
    expect(() => CardSchema.parse({ ...validCard(), accountId: 'conta-1' })).toThrow(
      /accountId deve ser UUID válido/,
    );
  });

  it('rejeita Card com closingDay fora do intervalo 1-31', () => {
    expect(() => CardSchema.parse({ ...validCard(), closingDay: 0 })).toThrow(/Dia de fecho/);
    expect(() => CardSchema.parse({ ...validCard(), closingDay: 32 })).toThrow(/Dia de fecho/);
  });
});

describe('TransactionSchema', () => {
  it('aceita Transaction válida (amount negativo = saída)', () => {
    expect(() => TransactionSchema.parse(validTransaction())).not.toThrow();
  });

  it('aceita Transaction com amount positivo (entrada)', () => {
    expect(() => TransactionSchema.parse({ ...validTransaction(), amount: 50000 })).not.toThrow();
  });

  it('rejeita Transaction com amount decimal (cêntimos devem ser inteiros)', () => {
    const invalid = { ...validTransaction(), amount: 15.99 };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/inteiro em cêntimos/);
  });

  it('rejeita Transaction sem category', () => {
    const invalid = { ...validTransaction(), category: '' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/Categoria é obrigatória/);
  });

  // Story 3.1 Iter 2 (CodeRabbit #7) — IDs de referência validados como UUID.
  it('rejeita Transaction com accountId não-UUID', () => {
    const invalid = { ...validTransaction(), accountId: 'conta-1' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/accountId deve ser UUID válido/);
  });

  it('rejeita Transaction com cardId não-UUID', () => {
    const invalid = { ...validTransaction(), cardId: 'cartao-1' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/cardId deve ser UUID válido/);
  });

  // Story 3.1 Iter 3 (CodeRabbit #4) — recurrenceId/installmentId validados como UUID.
  it('rejeita Transaction com recurrenceId não-UUID', () => {
    const invalid = { ...validTransaction(), recurrenceId: 'recorrencia-1' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/recurrenceId deve ser UUID válido/);
  });

  it('rejeita Transaction com installmentId não-UUID', () => {
    const invalid = { ...validTransaction(), installmentId: 'parcela-1' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/installmentId deve ser UUID válido/);
  });

  it('aceita Transaction com IDs de referência null (campos opcionais)', () => {
    expect(() => TransactionSchema.parse(validTransaction())).not.toThrow();
  });

  it('aceita Transaction com IDs de referência UUID válidos', () => {
    const valid = {
      ...validTransaction(),
      accountId: crypto.randomUUID(),
      cardId: crypto.randomUUID(),
      recurrenceId: crypto.randomUUID(),
      installmentId: crypto.randomUUID(),
    };
    expect(() => TransactionSchema.parse(valid)).not.toThrow();
  });

  // Story 3.1 Iter 2 (CodeRabbit #8) — date validada como ISO 8601 (índices Dexie).
  it('rejeita Transaction com date em formato não-ISO', () => {
    const invalid = { ...validTransaction(), date: '15/05/2026' };
    expect(() => TransactionSchema.parse(invalid)).toThrow(/ISO 8601/);
  });

  it('aceita Transaction com date ISO 8601 (YYYY-MM-DD e com componente de tempo)', () => {
    expect(() =>
      TransactionSchema.parse({ ...validTransaction(), date: '2026-05-15' }),
    ).not.toThrow();
    expect(() =>
      TransactionSchema.parse({ ...validTransaction(), date: '2026-05-15T10:30:00Z' }),
    ).not.toThrow();
  });
});

describe('InstallmentSchema', () => {
  it('aceita Installment válido', () => {
    expect(() => InstallmentSchema.parse(validInstallment())).not.toThrow();
  });

  it('rejeita Installment com cardId não-UUID', () => {
    // Story 3.1 Iter 2 (CodeRabbit #7) — cardId validado como UUID.
    expect(() =>
      InstallmentSchema.parse({ ...validInstallment(), cardId: '' }),
    ).toThrow(/cardId deve ser UUID válido/);
    expect(() =>
      InstallmentSchema.parse({ ...validInstallment(), cardId: 'cartao-1' }),
    ).toThrow(/cardId deve ser UUID válido/);
  });

  it('rejeita Installment com installments <= 0', () => {
    expect(() => InstallmentSchema.parse({ ...validInstallment(), installments: 0 })).toThrow(
      /maior que zero/,
    );
    expect(() => InstallmentSchema.parse({ ...validInstallment(), installments: -3 })).toThrow(
      /maior que zero/,
    );
  });

  it('rejeita Installment com installments decimal', () => {
    const invalid = { ...validInstallment(), installments: 12.5 };
    expect(() => InstallmentSchema.parse(invalid)).toThrow();
  });

  // Story 3.1 Iter 2 (CodeRabbit #8) — startDate validada como ISO 8601.
  it('rejeita Installment com startDate em formato não-ISO', () => {
    const invalid = { ...validInstallment(), startDate: '15/05/2026' };
    expect(() => InstallmentSchema.parse(invalid)).toThrow(/ISO 8601/);
  });
});

describe('CategorySchema', () => {
  it('aceita Category válida', () => {
    expect(() => CategorySchema.parse(validCategory())).not.toThrow();
  });

  it('rejeita Category sem name', () => {
    const invalid = { ...validCategory(), name: '' };
    expect(() => CategorySchema.parse(invalid)).toThrow(/Nome da categoria é obrigatório/);
  });

  it('rejeita Category sem color', () => {
    const invalid = { ...validCategory(), color: '' };
    expect(() => CategorySchema.parse(invalid)).toThrow(/Cor da categoria é obrigatória/);
  });

  it('rejeita Category com isDefault não-booleano', () => {
    const invalid = { ...validCategory(), isDefault: 'sim' };
    expect(() => CategorySchema.parse(invalid)).toThrow();
  });
});
