import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  SystemEntityGuard,
  isSystemArea,
  isSystemNotebook,
} from '@/components/conhecimento/SystemEntityGuard';
import {
  SYSTEM_AREA_ID,
  INBOX_NOTEBOOK_ID,
  DECISAO_TAG_ID,
} from '@/lib/brain-dump/approval-persistencia';

/**
 * Nexus v2 — SystemEntityGuard tests (Story 5.9 — T11 / C3, AC5/AC6/AC8/AC9)
 *
 * Cobre os guards de entidades de sistema: a área "Sistema" e o `_inbox` são
 * não-elimináveis E não-renomeáveis (C3). Inclui o caso **negativo** obrigatório
 * (T11): entidades de utilizador NÃO são bloqueadas. Verifica também que o guard
 * desactiva os botões filhos (eliminar + editar) via a render-prop.
 */

afterEach(cleanup);

describe('isSystemArea (guard de área de sistema — T11)', () => {
  it('reconhece SYSTEM_AREA_ID como área de sistema', () => {
    expect(isSystemArea(SYSTEM_AREA_ID)).toBe(true);
  });

  it('NÃO bloqueia uma área de utilizador (caso negativo)', () => {
    expect(isSystemArea(crypto.randomUUID())).toBe(false);
    expect(isSystemArea('00000000-0000-4000-8000-000000000099')).toBe(false);
  });

  it('NÃO confunde o id do _inbox nem o da tag decisao com a área de sistema', () => {
    expect(isSystemArea(INBOX_NOTEBOOK_ID)).toBe(false);
    expect(isSystemArea(DECISAO_TAG_ID)).toBe(false);
  });
});

describe('isSystemNotebook (guard de caderno de sistema — T11)', () => {
  it('reconhece INBOX_NOTEBOOK_ID como caderno de sistema', () => {
    expect(isSystemNotebook(INBOX_NOTEBOOK_ID)).toBe(true);
  });

  it('NÃO bloqueia um caderno de utilizador (caso negativo)', () => {
    expect(isSystemNotebook(crypto.randomUUID())).toBe(false);
  });

  it('NÃO confunde o id da área de sistema com o caderno de sistema', () => {
    expect(isSystemNotebook(SYSTEM_AREA_ID)).toBe(false);
  });
});

describe('SystemEntityGuard (render-prop — desactiva eliminar E renomear, C3)', () => {
  function renderGuard(isSystem: boolean): { onEdit: () => void; onDelete: () => void } {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <SystemEntityGuard isSystem={isSystem} tooltip="Área de sistema">
        {({ disabled, tooltip }) => (
          <>
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled}
              title={tooltip}
              aria-label="Editar"
            >
              editar
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              title={tooltip}
              aria-label="Eliminar"
            >
              eliminar
            </button>
          </>
        )}
      </SystemEntityGuard>,
    );
    return { onEdit, onDelete };
  }

  it('(sistema) desactiva editar E eliminar com tooltip PT-PT', () => {
    renderGuard(true);
    const editBtn = screen.getByRole('button', { name: 'Editar' });
    const deleteBtn = screen.getByRole('button', { name: 'Eliminar' });
    expect(editBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
    expect(editBtn).toHaveAttribute('title', 'Área de sistema');
    expect(deleteBtn).toHaveAttribute('title', 'Área de sistema');
  });

  it('(sistema) cliques NÃO disparam os handlers (botões disabled)', () => {
    const { onEdit, onDelete } = renderGuard(true);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('(utilizador, caso negativo) NÃO desactiva e o tooltip fica vazio', () => {
    const { onEdit, onDelete } = renderGuard(false);
    const editBtn = screen.getByRole('button', { name: 'Editar' });
    const deleteBtn = screen.getByRole('button', { name: 'Eliminar' });
    expect(editBtn).not.toBeDisabled();
    expect(deleteBtn).not.toBeDisabled();
    expect(editBtn).toHaveAttribute('title', '');
    fireEvent.click(editBtn);
    fireEvent.click(deleteBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
