import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  BrainDumpApprovalView,
  type ApprovedItemPayload,
} from '@/components/brain-dump/BrainDumpApprovalView';
import type { BrainDumpParsed } from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — BrainDumpApprovalView tests (Story 5.8 — AC2/AC6/AC7)
 *
 * Estados de render distintos (`react-component-test-criteria.md`, ≥3 obrigatório):
 * todos seleccionados (default) / parcialmente seleccionado / 0 seleccionados (botão
 * desactivado) / saving (controlos desactivados) / item em edição inline.
 * a11y: checkboxes (`role="checkbox"`/`aria-checked`), aria-label dos botões ✏️/✗,
 * contador dinâmico no botão Guardar.
 */

function parsedFixture(): BrainDumpParsed {
  return {
    tarefas: [
      { id: 't1', texto: 'comprar tinta' },
      { id: 't2', texto: 'ligar ao contabilista' },
    ],
    projectos: [{ id: 'p1', texto: 'renovar o escritório' }],
    ideias: [],
    decisoes: [{ id: 'd1', texto: 'mudar de banco?' }],
  };
}

function setup(overrides: Partial<Parameters<typeof BrainDumpApprovalView>[0]> = {}) {
  const onSave = vi.fn();
  render(
    <BrainDumpApprovalView
      parsed={parsedFixture()}
      saving={false}
      onSave={onSave}
      {...overrides}
    />,
  );
  return { onSave };
}

afterEach(cleanup);

describe('BrainDumpApprovalView', () => {
  it('(todos seleccionados) contador = total de itens propostos', () => {
    setup();
    // 4 itens propostos (2 tarefas + 1 projecto + 1 decisão).
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '4 itens seleccionados',
    );
  });

  it('(a11y) cada item tem checkbox com aria-checked=true por default', () => {
    setup();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'true'));
  });

  it('(parcialmente seleccionado) desmarcar um item decrementa o contador', () => {
    setup();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '3 itens seleccionados',
    );
  });

  it('botão ✗ rejeita (desmarca) o item', () => {
    setup();
    const rejectBtn = screen.getByRole('button', {
      name: 'Rejeitar item: comprar tinta',
    });
    fireEvent.click(rejectBtn);
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '3 itens seleccionados',
    );
  });

  it('(0 seleccionados) desmarcar todos desactiva o botão Guardar', () => {
    setup();
    screen.getAllByRole('checkbox').forEach((cb) => fireEvent.click(cb));
    const saveBtn = screen.getByTestId('brain-dump-save-button');
    expect(saveBtn).toHaveTextContent('0 itens seleccionados');
    expect(saveBtn).toBeDisabled();
  });

  it('controlo bulk "✗ nenhuma" desmarca todo o bucket', () => {
    setup();
    const noneBtn = screen.getByRole('button', {
      name: /não seleccionar nenhuma das tarefas propostas/i,
    });
    fireEvent.click(noneBtn);
    // 2 tarefas desmarcadas → 4 - 2 = 2.
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '2 itens seleccionados',
    );
  });

  it('controlo bulk "✓ todas" remarca o bucket', () => {
    setup();
    const noneBtn = screen.getByRole('button', {
      name: /não seleccionar nenhuma das tarefas propostas/i,
    });
    fireEvent.click(noneBtn);
    const allBtn = screen.getByRole('button', {
      name: /seleccionar todas as tarefas propostas/i,
    });
    fireEvent.click(allBtn);
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '4 itens seleccionados',
    );
  });

  it('(edição inline) editar o texto e o item editado é o que se guarda', () => {
    const { onSave } = setup();
    const editBtn = screen.getByRole('button', {
      name: 'Editar item: comprar tinta',
    });
    fireEvent.click(editBtn);
    const input = screen.getByTestId('brain-dump-approval-edit-t1');
    fireEvent.change(input, { target: { value: 'comprar tinta branca' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    fireEvent.click(screen.getByTestId('brain-dump-save-button'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0] as ApprovedItemPayload[];
    const tarefa = payload.find((p) => p.bucket === 'tarefas' && p.texto.includes('branca'));
    expect(tarefa).toEqual({ bucket: 'tarefas', texto: 'comprar tinta branca' });
  });

  it('(edição inline) reabrir o editor mostra o texto trimado, não o draft antigo', () => {
    setup();
    const editBtn = screen.getByRole('button', {
      name: 'Editar item: comprar tinta',
    });
    fireEvent.click(editBtn);
    const input = screen.getByTestId('brain-dump-approval-edit-t1');
    fireEvent.change(input, { target: { value: '  comprar tinta branca  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Reabrir o editor: o input deve mostrar o texto JÁ trimado (resync).
    const editBtn2 = screen.getByRole('button', {
      name: 'Editar item: comprar tinta branca',
    });
    fireEvent.click(editBtn2);
    expect(screen.getByTestId('brain-dump-approval-edit-t1')).toHaveValue(
      'comprar tinta branca',
    );
  });

  it('(edição inline) editar para vazio trata o item como desmarcado (não conta)', () => {
    setup();
    const editBtn = screen.getByRole('button', {
      name: 'Editar item: comprar tinta',
    });
    fireEvent.click(editBtn);
    const input = screen.getByTestId('brain-dump-approval-edit-t1');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // O item editado para vazio deixa de contar (4 - 1 = 3).
    expect(screen.getByTestId('brain-dump-save-button')).toHaveTextContent(
      '3 itens seleccionados',
    );
  });

  it('onSave recebe os itens seleccionados com bucket + texto', () => {
    const { onSave } = setup();
    // Desmarca a decisão; guarda os 3 restantes.
    fireEvent.click(
      screen.getByRole('button', { name: 'Rejeitar item: mudar de banco?' }),
    );
    fireEvent.click(screen.getByTestId('brain-dump-save-button'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0] as ApprovedItemPayload[];
    expect(payload).toHaveLength(3);
    expect(payload).toContainEqual({ bucket: 'tarefas', texto: 'comprar tinta' });
    expect(payload).toContainEqual({ bucket: 'projectos', texto: 'renovar o escritório' });
    expect(payload.some((p) => p.bucket === 'decisoes')).toBe(false);
  });

  it('(saving) controlos desactivados e botão Guardar bloqueado', () => {
    setup({ saving: true });
    expect(screen.getByTestId('brain-dump-save-button')).toBeDisabled();
    screen.getAllByRole('checkbox').forEach((cb) => expect(cb).toBeDisabled());
  });
});
