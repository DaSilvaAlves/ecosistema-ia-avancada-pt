/**
 * Nexus v2 — GmailSettings component tests (Story 6.7, T4/T6, AC4/AC7)
 *
 * `react-component-test-criteria.md`: ≥3 estados de render distintos → teste de
 * componente obrigatório. 1 cenário por estado:
 *   C1 — `nao-ligado` → botão "Ligar ao Gmail".
 *   C2 — `ligado`     → badge "Gmail ligado" + aviso tudo-ou-nada (sem expor token).
 *   C3 — `erro`       → mensagem PT-PT por tipo + CTA "Tentar novamente" (D-6.1-ERROR).
 *   C4 — erro desconhecido → mensagem genérica (fallback).
 *   C5 — "Desligar" → POST revoke 200 → transita para nao-ligado.
 *   C6 — `a-revogar` → estado de loading durante a revogação.
 *   C7 — revogação falha (Google indisponível) → mantém `ligado` + aviso.
 *   C8 — lê `gmailConnected` via fetch injectado (statusEndpoint).
 *   C9 — fetch a falhar → assume não-ligado (fail-safe).
 *   C10 — botão "Ligar" inicia o fluxo incremental `?scope=gmail`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GmailSettings } from '@/components/settings/GmailSettings';

describe('GmailSettings — estados de render (AC4)', () => {
  it('C1 — nao-ligado: mostra botão "Ligar ao Gmail"', () => {
    render(<GmailSettings initialGmailConnected={false} />);
    expect(screen.getByRole('button', { name: /Ligar ao Gmail/i })).toBeInTheDocument();
    expect(screen.queryByText(/Gmail ligado/i)).not.toBeInTheDocument();
  });

  it('C2 — ligado: mostra badge "Gmail ligado", aviso tudo-ou-nada e botão Desligar', () => {
    render(<GmailSettings initialGmailConnected={true} />);
    expect(screen.getByText(/Gmail ligado/i)).toBeInTheDocument();
    expect(screen.getByText(/mesma autorização Google do Calendar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desligar/i })).toBeEnabled();
  });

  it('C3 — erro tipado: mensagem PT-PT + CTA "Tentar novamente" (D-6.1-ERROR)', () => {
    render(<GmailSettings initialError="access_denied" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/cancelada ou recusada/i);
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('C3b — invalid_state: mensagem específica de segurança', () => {
    render(<GmailSettings initialError="invalid_state" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /expirou ou era inválido|expirou ou era invalido/i,
    );
  });

  it('C4 — erro desconhecido: mensagem genérica (fallback)', () => {
    render(<GmailSettings initialError="coisa_estranha" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Ocorreu um erro a ligar o Gmail/i);
  });

  it('C8 — lê gmailConnected via fetch injectado (statusEndpoint)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ gmailConnected: true, calendarConnected: true, connected: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(<GmailSettings fetchImpl={fetchImpl} />);

    expect(await screen.findByText(/Gmail ligado/i)).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/google/oauth/status',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('C8b — status com gmailConnected:false → nao-ligado (calendar-só não conta como Gmail)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ gmailConnected: false, calendarConnected: true, connected: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(<GmailSettings fetchImpl={fetchImpl} />);

    expect(await screen.findByRole('button', { name: /Ligar ao Gmail/i })).toBeInTheDocument();
  });

  it('C9 — fetch a falhar → assume não-ligado (fail-safe)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('erro', { status: 500 }),
    ) as unknown as typeof fetch;

    render(<GmailSettings fetchImpl={fetchImpl} />);

    expect(await screen.findByRole('button', { name: /Ligar ao Gmail/i })).toBeInTheDocument();
  });
});

describe('GmailSettings — fluxo de ligação/revogação (AC1/AC4)', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { assign: vi.fn() } as unknown as Location);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('C10 — "Ligar ao Gmail" inicia o fluxo incremental ?scope=gmail', () => {
    render(<GmailSettings initialGmailConnected={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Ligar ao Gmail/i }));
    expect(window.location.assign).toHaveBeenCalledWith('/api/google/oauth/start?scope=gmail');
  });

  it('C5 — "Desligar" → POST revoke 200 → transita para nao-ligado', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ revoked: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(<GmailSettings initialGmailConnected={true} fetchImpl={fetchImpl} />);
    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    expect(await screen.findByRole('button', { name: /Ligar ao Gmail/i })).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/google/oauth/revoke',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('C6 — a-revogar: mostra estado de loading durante a revogação', async () => {
    let resolveFetch: (() => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = () => resolve(new Response(null, { status: 200 }));
    });
    const fetchImpl = vi.fn(() => pending) as unknown as typeof fetch;

    render(<GmailSettings initialGmailConnected={true} fetchImpl={fetchImpl} />);
    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    expect(await screen.findByText(/A desligar a ligação ao Gmail/i)).toBeInTheDocument();
    resolveFetch?.();
  });

  it('C7 — revogação falha (Google indisponível) → mantém ligado + aviso', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'indisponível' }), { status: 502 }),
    ) as unknown as typeof fetch;

    render(<GmailSettings initialGmailConnected={true} fetchImpl={fetchImpl} />);
    fireEvent.click(screen.getByRole('button', { name: /Desligar/i }));

    expect(await screen.findByText(/Gmail ligado/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Não foi possível desligar|Nao foi possivel desligar/i,
    );
  });
});
