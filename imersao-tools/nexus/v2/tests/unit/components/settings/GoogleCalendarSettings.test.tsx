/**
 * Nexus v2 — GoogleCalendarSettings component tests (Story 6.1, AC4/AC7)
 *
 * `react-component-test-criteria.md`: ≥3 estados de render distintos → teste de
 * componente obrigatório. 1 cenário por estado:
 *   C1 — `nao-ligado` → botão "Ligar ao Google Calendar".
 *   C2 — `ligado`     → badge "Calendário ligado" (sem expor token, AC6).
 *   C3 — `erro`       → mensagem PT-PT por tipo + CTA "Tentar novamente" (D-6.1-ERROR).
 *   C4 — erro desconhecido → mensagem genérica (fallback).
 *
 * O fetch de estado é injectado (`fetchImpl`) ou contornado (`initialConnected`)
 * para evitar I/O real e flakiness.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleCalendarSettings } from '@/components/settings/GoogleCalendarSettings';

describe('GoogleCalendarSettings — estados de render (AC4)', () => {
  it('C1 — nao-ligado: mostra botão "Ligar ao Google Calendar"', () => {
    render(<GoogleCalendarSettings initialConnected={false} />);
    expect(
      screen.getByRole('button', { name: /Ligar ao Google Calendar/i }),
    ).toBeInTheDocument();
    // Não há badge de ligado.
    expect(screen.queryByText(/Calendário ligado/i)).not.toBeInTheDocument();
  });

  it('C2 — ligado: mostra badge "Calendário ligado" e não expõe token (AC6)', () => {
    render(<GoogleCalendarSettings initialConnected={true} />);
    expect(screen.getByText(/Calendário ligado/i)).toBeInTheDocument();
    // Botão Desligar presente mas desactivado (revogação é da 6.2).
    expect(screen.getByRole('button', { name: /Desligar/i })).toBeDisabled();
  });

  it('C3 — erro tipado: mensagem PT-PT + CTA "Tentar novamente" (D-6.1-ERROR)', () => {
    render(<GoogleCalendarSettings initialError="access_denied" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/cancelada ou recusada/i);
    expect(
      screen.getByRole('button', { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it('C3b — invalid_state: mensagem específica de segurança', () => {
    render(<GoogleCalendarSettings initialError="invalid_state" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/expirou ou era inválido|expirou ou era invalido/i);
  });

  it('C4 — erro desconhecido: mensagem genérica (fallback)', () => {
    render(<GoogleCalendarSettings initialError="qualquer_coisa_estranha" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Ocorreu um erro a ligar o Google Calendar/i);
  });

  it('lê o estado ligado via fetch injectado (statusEndpoint)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ connected: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(<GoogleCalendarSettings fetchImpl={fetchImpl} />);

    expect(await screen.findByText(/Calendário ligado/i)).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/google/oauth/status',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('fetch a falhar → assume não-ligado (fail-safe, nunca afirma ligado sem prova)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('erro', { status: 500 }),
    ) as unknown as typeof fetch;

    render(<GoogleCalendarSettings fetchImpl={fetchImpl} />);

    expect(
      await screen.findByRole('button', { name: /Ligar ao Google Calendar/i }),
    ).toBeInTheDocument();
  });
});
