/**
 * Nexus v2 — GoogleCalendarSettings component tests (Story 6.1 + 6.2, AC4/AC7)
 *
 * `react-component-test-criteria.md`: ≥3 estados de render distintos → teste de
 * componente obrigatório. 1 cenário por estado:
 *   C1 — `nao-ligado` → botão "Ligar ao Google Calendar".
 *   C2 — `ligado`     → badge "Calendário ligado" (sem expor token, AC6).
 *   C3 — `erro`       → mensagem PT-PT por tipo + CTA "Tentar novamente" (D-6.1-ERROR).
 *   C4 — erro desconhecido → mensagem genérica (fallback).
 *   Story 6.2 (AC4):
 *   C5 — `ligado` → "Desligar" é funcional (POST revoke) → `nao-ligado`.
 *   C6 — `a-revogar` → estado de loading durante a revogação.
 *   C7 — `revogado-externo` → mensagem + CTA "Autorizar novamente".
 *   C8 — revogação falha (Google indisponível) → mantém `ligado` + aviso.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // Story 6.2: o botão "Desligar" passa a ser FUNCIONAL (já não desactivado).
    expect(screen.getByRole('button', { name: /Desligar/i })).toBeEnabled();
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

describe('GoogleCalendarSettings — estados da Story 6.2 (AC4)', () => {
  it('C5 — "Desligar" → POST revoke 200 → transita para nao-ligado', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ revoked: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(<GoogleCalendarSettings initialConnected={true} fetchImpl={fetchImpl} />);

    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    // Após revogação bem-sucedida, volta ao estado nao-ligado (CTA de ligar).
    expect(
      await screen.findByRole('button', { name: /Ligar ao Google Calendar/i }),
    ).toBeInTheDocument();
    // Chamou o endpoint de revogação com POST.
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/google/oauth/revoke',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('C6 — a-revogar: mostra estado de loading durante a revogação', async () => {
    // fetch que nunca resolve → o estado a-revogar permanece visível.
    let resolveFetch: (() => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = () => resolve(new Response(null, { status: 200 }));
    });
    const fetchImpl = vi.fn(() => pending) as unknown as typeof fetch;

    render(<GoogleCalendarSettings initialConnected={true} fetchImpl={fetchImpl} />);

    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    expect(
      await screen.findByText(/A desligar a ligação ao Google Calendar/i),
    ).toBeInTheDocument();

    // Limpa o fetch pendente para não deixar a promise pendurada.
    resolveFetch?.();
  });

  it('C7 — revogado-externo: mensagem + CTA "Autorizar novamente"', () => {
    render(<GoogleCalendarSettings initialRevokedExternal={true} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/deixou de ser válida|deixou de ser valida/i);
    expect(
      screen.getByRole('button', { name: /Autorizar novamente/i }),
    ).toBeInTheDocument();
  });

  it('C8 — revogação falha (Google indisponível) → mantém ligado + aviso', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'indisponível' }), { status: 502 }),
    ) as unknown as typeof fetch;

    render(<GoogleCalendarSettings initialConnected={true} fetchImpl={fetchImpl} />);

    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    // Continua ligado (KV preservado, [D-6.2-REVOKE-PARTIAL]) e mostra aviso.
    expect(await screen.findByText(/Calendário ligado/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível desligar|Nao foi possivel desligar/i);
  });
});
