import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { server } from '../../../mocks/server';
import {
  GMAIL_INBOX_MOCK_EMAILS,
  GMAIL_INBOX_SCENARIO_HEADER,
} from '../../../mocks/handlers/google';
import { GmailWidget } from '@/components/widgets/GmailWidget';

/**
 * Story 6.9 — GmailWidget component tests (T3, AC1/AC3/AC5/AC6).
 *
 * `react-component-test-criteria.md`: ≥4 estados de render distintos → 1 cenário por
 * estado. Os estados são HTTP-status-based na origem (AC2/AC3): o componente ramifica
 * em `!response.ok`, nunca em 200+`emails:[]` ambíguo.
 *   C-loading    — fetch pendente → "A carregar inbox…" (aria-live).
 *   C-empty      — 200 { emails: [] } → "Inbox limpa", SEM CTA de ligação.
 *   C-content    — 200 com lista → emails com assunto/remetente/badge (FALSIFICÁVEL).
 *   C-erro-oauth — 401 → CTA "Ligar ao Gmail" (role=alert).
 *   C-erro-fetch — 503 → erro transitório "tenta de novo" (role=alert) [OBS-6.9-1].
 *   C-trigger    — botão "Actualizar inbox" → POST classify → re-fetch → content.
 *   C-fidelity   — via MSW real (mock-protocol-fidelity): shape `{ emails: [...] }`.
 */

/** `fetch` injectável que resolve uma `Response` por chamada (ordem das chamadas). */
function sequentialFetch(responses: Response[]): typeof fetch {
  let i = 0;
  return vi.fn(async () => responses[Math.min(i++, responses.length - 1)]) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CONTENT_EMAILS = [
  {
    id: 'm1',
    bucket: 'importante',
    subject: '[URGENTE] Resposta necessária hoje',
    from: 'paulo@cliente.pt',
    date: 'Wed, 18 Jun 2026 09:00:00 +0100',
    classifiedAt: 1_750_000_000_000,
  },
  {
    id: 'm2',
    bucket: 'responder_hoje',
    subject: 'Podes confirmar a reunião?',
    from: 'ana@equipa.pt',
    date: 'Wed, 18 Jun 2026 08:30:00 +0100',
    classifiedAt: 1_750_000_000_001,
  },
];

describe('GmailWidget — estados de render (AC3)', () => {
  it('C-loading: fetch pendente → "A carregar inbox…" com aria-live', () => {
    // fetch que nunca resolve → fica em loading.
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    render(<GmailWidget fetchImpl={fetchImpl} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/A carregar inbox/i);
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('C-empty: 200 { emails: [] } → "Inbox limpa" e SEM CTA de ligação', async () => {
    const fetchImpl = sequentialFetch([jsonResponse({ emails: [] })]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    expect(await screen.findByText(/Inbox limpa/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ligar ao Gmail/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('C-content: 200 com lista → assunto/remetente/badges visíveis', async () => {
    const fetchImpl = sequentialFetch([jsonResponse({ emails: CONTENT_EMAILS })]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    expect(await screen.findByText(/\[URGENTE\] Resposta necessária hoje/)).toBeInTheDocument();
    expect(screen.getByText(/paulo@cliente\.pt/)).toBeInTheDocument();
    expect(screen.getByText(/Podes confirmar a reunião\?/)).toBeInTheDocument();
    // Labels PT-PT (D-FUZZY) dos 2 buckets.
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Para responder hoje')).toBeInTheDocument();
  });

  it('C-content FALSIFICÁVEL: falha se a lista vier vazia quando devia estar populada', async () => {
    const fetchImpl = sequentialFetch([jsonResponse({ emails: CONTENT_EMAILS })]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(CONTENT_EMAILS.length);
    expect(items.length).toBeGreaterThan(0);
  });

  it('C-erro-oauth: 401 → CTA "Ligar ao Gmail" com role=alert', async () => {
    const fetchImpl = sequentialFetch([jsonResponse({ error: 'not_connected' }, 401)]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ligar ao Gmail/i })).toBeInTheDocument();
  });

  it('C-erro-fetch: 503 → erro transitório (distinto do 401, [OBS-6.9-1])', async () => {
    const fetchImpl = sequentialFetch([jsonResponse({ error: 'gmail_unavailable' }, 503)]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Não foi possível obter a inbox/i);
    // 503 NÃO mostra o CTA de ligação (CTA oposto ao 401).
    expect(screen.queryByRole('link', { name: /Ligar ao Gmail/i })).not.toBeInTheDocument();
  });
});

describe('GmailWidget — trigger "Actualizar inbox" (AC5, [D-6.9-TRIGGER])', () => {
  it('clique → POST classify → re-fetch → content', async () => {
    // 1.º GET inbox (vazia) → empty; depois clique: POST classify ok → GET inbox com lista.
    const fetchImpl = sequentialFetch([
      jsonResponse({ emails: [] }), // mount: empty
      jsonResponse({ ok: true, classified: 2, fromCache: 0, total: 2 }), // POST classify
      jsonResponse({ emails: CONTENT_EMAILS }), // re-fetch GET inbox
    ]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    await screen.findByText(/Inbox limpa/i);

    fireEvent.click(screen.getByRole('button', { name: /Actualizar inbox/i }));

    expect(await screen.findByText(/\[URGENTE\] Resposta necessária hoje/)).toBeInTheDocument();
    // O POST classify foi disparado (opt-in, R4).
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/google/gmail/classify',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('POST classify !ok → erro (anti-M4: nunca trata !response.ok como sucesso)', async () => {
    const fetchImpl = sequentialFetch([
      jsonResponse({ emails: [] }), // mount: empty
      jsonResponse({ error: 'gmail_unavailable' }, 503), // POST classify falha
    ]);
    render(<GmailWidget fetchImpl={fetchImpl} />);
    await screen.findByText(/Inbox limpa/i);

    fireEvent.click(screen.getByRole('button', { name: /Actualizar inbox/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Não foi possível obter a inbox/i);
  });
});

describe('GmailWidget — fidelidade de protocolo via handler MSW (C5)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('consome o handler MSW real { emails: EmailSummary[] } e renderiza content', async () => {
    // Resolve a Response do handler MSW INTERNO (`GET /api/google/gmail/inbox`) a
    // partir de uma URL absoluta e injecta-a no widget. Prova que o componente
    // consome o shape REAL `{ emails: EmailSummary[] }` (mock-protocol-fidelity.md):
    // falharia se o handler usasse `messages` em vez de `emails`, ou um `bucket`
    // traduzido em vez do identificador ASCII.
    const mswResponse = await fetch(
      'http://localhost/api/google/gmail/inbox',
      { headers: { [GMAIL_INBOX_SCENARIO_HEADER]: 'content' } },
    );
    expect(mswResponse.status).toBe(200);
    const fetchImpl = vi.fn(async () => mswResponse.clone()) as unknown as typeof fetch;

    render(<GmailWidget fetchImpl={fetchImpl} />);

    await waitFor(() =>
      expect(screen.getByText(GMAIL_INBOX_MOCK_EMAILS[0].subject)).toBeInTheDocument(),
    );
    expect(screen.getByText(GMAIL_INBOX_MOCK_EMAILS[0].from)).toBeInTheDocument();
    // O bucket ASCII real é mapeado para a label PT-PT — prova o contrato wire.
    expect(screen.getByText('Importante')).toBeInTheDocument();
  });
});
