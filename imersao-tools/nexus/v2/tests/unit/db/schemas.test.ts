import { describe, it, expect } from 'vitest';
import {
  TaskSchema,
  ProjectSchema,
  RecurrenceSchema,
  TagSchema,
} from '@/lib/db/schemas';

/**
 * Nexus v2 — DB schemas Zod tests (Story 2.1 / AC12)
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
