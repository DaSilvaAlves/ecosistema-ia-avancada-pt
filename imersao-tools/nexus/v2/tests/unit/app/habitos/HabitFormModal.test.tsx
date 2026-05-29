import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Habit } from '@/types/db';
import { HabitFormModal } from '@/components/habitos/HabitFormModal';

/**
 * Nexus v2 — HabitFormModal tests (Story 4.2 — AC5/AC10)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — modo create: campos vazios.
 *   C2 — modo edit: pré-preenche com initialValue.
 *   C3 — submissão com campo obrigatório vazio: erro de validação, sem onSubmit.
 */

describe('HabitFormModal (Story 4.2 / AC5)', () => {
  afterEach(() => cleanup());

  // ── C1 — modo create ──
  it('C1 — create: renderiza campos vazios e título "Novo hábito"', () => {
    render(
      <HabitFormModal mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novo hábito' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('');
    expect(screen.getByLabelText(/^Frequência/)).toHaveValue('');
    expect(screen.getByLabelText(/^Categoria/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  // ── C2 — modo edit ──
  it('C2 — edit: pré-preenche os campos a partir de initialValue', () => {
    const initial: Partial<Habit> = {
      name: 'Leitura diária',
      frequency: 'FREQ=DAILY',
      category: 'Pessoal',
      time: '07:30',
    };
    render(
      <HabitFormModal
        mode="edit"
        initialValue={initial}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Editar hábito' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Leitura diária');
    expect(screen.getByLabelText(/^Frequência/)).toHaveValue('FREQ=DAILY');
    expect(screen.getByLabelText(/^Categoria/)).toHaveValue('Pessoal');
    expect(screen.getByLabelText('Horário (opcional)')).toHaveValue('07:30');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  // ── C3 — submissão inválida ──
  it('C3 — submeter com nome vazio mostra erro de validação e NÃO chama onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <HabitFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    // Preenche frequência e categoria, deixa nome vazio.
    fireEvent.change(screen.getByLabelText(/^Frequência/), {
      target: { value: 'FREQ=DAILY' },
    });
    fireEvent.change(screen.getByLabelText(/^Categoria/), {
      target: { value: 'Saúde' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Nome do hábito é obrigatório/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('C3b — submissão válida chama onSubmit com o patch e fecha', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <HabitFormModal mode="create" onClose={onClose} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText(/^Nome/), {
      target: { value: 'Correr' },
    });
    fireEvent.change(screen.getByLabelText(/^Frequência/), {
      target: { value: 'FREQ=WEEKLY' },
    });
    fireEvent.change(screen.getByLabelText(/^Categoria/), {
      target: { value: 'Desporto' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Correr',
      frequency: 'FREQ=WEEKLY',
      category: 'Desporto',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('C3d — edit: limpar o horário emite time:undefined com a chave PRESENTE no patch', async () => {
    // Defesa-em-profundidade (CR Iter 3): em modo edit, limpar o campo de
    // horário tem de emitir explicitamente `time: undefined` no patch (chave
    // presente) — é assim que a Dexie remove a chave. Se o modal regredisse para
    // OMITIR a chave (o bug do CR), a asserção `'time' in patch` falharia e o
    // valor não seria `undefined`. Teste não-tautológico: prova a presença da
    // chave e o valor undefined, não apenas que onSubmit foi chamado.
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const initial: Partial<Habit> = {
      name: 'Leitura diária',
      frequency: 'FREQ=DAILY',
      category: 'Pessoal',
      time: '07:30',
    };
    render(
      <HabitFormModal
        mode="edit"
        initialValue={initial}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    // Limpa o horário pré-preenchido.
    fireEvent.change(screen.getByLabelText('Horário (opcional)'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const patch = onSubmit.mock.calls[0][0] as Partial<Habit>;
    // Chave presente (não omitida) — falha se o modal regredir para omitir.
    expect('time' in patch).toBe(true);
    expect(patch.time).toBeUndefined();
    // Os restantes campos mantêm-se.
    expect(patch).toMatchObject({
      name: 'Leitura diária',
      frequency: 'FREQ=DAILY',
      category: 'Pessoal',
    });
  });

  it('C3e — edit: alterar o horário emite o novo valor no patch', async () => {
    // Contraprova do C3d: com horário definido, a chave `time` carrega o valor
    // novo (garante que o ramo edit não força sempre undefined).
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const initial: Partial<Habit> = {
      name: 'Correr',
      frequency: 'FREQ=DAILY',
      category: 'Desporto',
      time: '07:30',
    };
    render(
      <HabitFormModal
        mode="edit"
        initialValue={initial}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Horário (opcional)'), {
      target: { value: '08:15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const patch = onSubmit.mock.calls[0][0] as Partial<Habit>;
    expect('time' in patch).toBe(true);
    expect(patch.time).toBe('08:15');
  });

  it('C3c — horário em formato inválido mostra erro HH:MM', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <HabitFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/^Frequência/), {
      target: { value: 'FREQ=DAILY' },
    });
    fireEvent.change(screen.getByLabelText(/^Categoria/), { target: { value: 'C' } });
    fireEvent.change(screen.getByLabelText('Horário (opcional)'), {
      target: { value: '25:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/HH:MM/);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
