/**
 * Nexus v2 — ToolCard component tests (Story 1.9 AC10 + AC11)
 *
 * Cobertura mínima 85% lines (AC11).
 *
 * Verifica os 6 estados (loading, success, error, preview-required, reverted,
 * interrupted), interacções (Confirmar/Cancelar/Tentar de novo) e foco
 * automático do botão "Confirmar" em preview-required (AC9).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCard } from '@/components/chat/ToolCard';

describe('ToolCard', () => {
  it('renderiza estado loading com texto "a processar"', () => {
    render(<ToolCard toolName="criar_evento" state="loading" args={{ titulo: 'reunião' }} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText(/a processar/i)).toBeInTheDocument();
  });

  it('renderiza estado success com result formatado', () => {
    render(
      <ToolCard
        toolName="criar_evento"
        state="success"
        args={{ titulo: 'reunião' }}
        result={{ id: 'ev-1' }}
      />
    );
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText(/criar_evento/)).toBeInTheDocument();
    expect(screen.getByText(/ev-1/)).toBeInTheDocument();
  });

  it('renderiza estado error com mensagem e botão "Tentar de novo"', () => {
    const onRetry = vi.fn();
    render(
      <ToolCard
        toolName="criar_evento"
        state="error"
        args={{ titulo: 'reunião' }}
        error="Network falhou"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText(/Network falhou/)).toBeInTheDocument();
    expect(screen.getAllByText(/falhou/i).length).toBeGreaterThanOrEqual(2);
    const retryBtn = screen.getByRole('button', { name: /tentar acção de novo/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza estado preview-required com botões Confirmar e Cancelar', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ToolCard
        toolName="criar_evento"
        state="preview-required"
        args={{ titulo: 'reunião' }}
        confidence={0.5}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByRole('button', { name: /confirmar e gravar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByText(/confidence: 50%/i)).toBeInTheDocument();
  });

  it('clicar "Confirmar" invoca onConfirm callback', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ToolCard
        toolName="criar_evento"
        state="preview-required"
        args={{}}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /confirmar e gravar/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('clicar "Cancelar" invoca onCancel callback', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ToolCard
        toolName="criar_evento"
        state="preview-required"
        args={{}}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar acção/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renderiza estado reverted com strikethrough', () => {
    render(<ToolCard toolName="criar_evento" state="reverted" args={null} />);
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByText(/anulado/i)).toBeInTheDocument();
  });

  it('renderiza estado interrupted com aviso', () => {
    render(
      <ToolCard
        toolName="executor"
        state="interrupted"
        args={null}
        error="Limite de iterações atingido"
      />
    );
    expect(screen.getByText(/interrompida/i)).toBeInTheDocument();
    expect(screen.getByText(/limite de iterações/i)).toBeInTheDocument();
  });

  it('AC9 — botão Confirmar tem foco automático em preview-required', () => {
    render(
      <ToolCard
        toolName="criar_evento"
        state="preview-required"
        args={{}}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const confirmBtn = screen.getByRole('button', { name: /confirmar e gravar/i });
    expect(document.activeElement).toBe(confirmBtn);
  });

  it('AC9 — article tem aria-label descritivo', () => {
    render(<ToolCard toolName="criar_evento" state="loading" args={{}} />);
    expect(
      screen.getByRole('article', { name: /tool criar_evento.*loading/i })
    ).toBeInTheDocument();
  });

  it('estado preview-required SEM confidence omite badge', () => {
    render(
      <ToolCard
        toolName="criar_evento"
        state="preview-required"
        args={{}}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByText(/confidence:/i)).not.toBeInTheDocument();
  });

  it('estado error SEM onRetry NÃO mostra botão "Tentar de novo"', () => {
    render(
      <ToolCard toolName="criar_evento" state="error" args={{}} error="Falhou" />
    );
    expect(
      screen.queryByRole('button', { name: /tentar acção de novo/i })
    ).not.toBeInTheDocument();
  });
});
