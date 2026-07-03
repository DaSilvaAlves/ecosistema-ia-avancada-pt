/**
 * Nexus v2 — Session helpers (Node runtime)
 *
 * Sessão stateful em Vercel KV — cookie HttpOnly contém apenas sessionId.
 * KV TTL 30d. Logout invalida no KV (não apenas no client).
 *
 * Conforme architecture-v2.md §9.1.
 */

const SESSION_COOKIE = 'nexus_session';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias

interface SessionData {
  sessionId: string;
  createdAt: number;
  userId: 'eurico';
}

interface SessionCheckResult {
  valid: boolean;
  sessionId?: string;
  userId?: 'eurico';
}

/**
 * KV REST helpers — falham silenciosamente se config ausente (dev local).
 */
async function kvFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  return fetch(`${kvUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${kvToken}`,
    },
  });
}

/**
 * Cria sessão no KV e devolve sessionId para gravar em cookie.
 */
export async function createSession(): Promise<string> {
  const sessionId = crypto.randomUUID();
  const data: SessionData = {
    sessionId,
    createdAt: Date.now(),
    userId: 'eurico',
  };

  const kvKey = `nexus:auth:session:${sessionId}`;
  const resp = await kvFetch(`/set/${encodeURIComponent(kvKey)}/${encodeURIComponent(JSON.stringify(data))}?ex=${SESSION_TTL_SECONDS}`, {
    method: 'POST',
  });

  if (!resp) {
    // Dev sem KV: aceita sessão (mas perde-se em redeploy)
    console.warn('[auth] KV não configurado — sessão em memória apenas (dev mode).');
  }

  return sessionId;
}

/**
 * Valida cookie de sessão contra KV.
 * Devolve `{ valid: false }` se cookie ausente, sessão inválida ou KV indisponível em produção.
 *
 * Em dev local sem KV (process.env.KV_REST_API_URL ausente), aceita qualquer cookie não vazio
 * para permitir desenvolvimento sem configurar Upstash.
 */
export async function getSession(req: Request): Promise<SessionCheckResult> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const sessionId = sessionMatch?.[1];

  if (!sessionId) return { valid: false };

  // Dev local — sem KV, qualquer cookie não vazio é válido
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { valid: true, sessionId, userId: 'eurico' };
  }

  // Prod — KV lookup
  const kvKey = `nexus:auth:session:${sessionId}`;
  const resp = await kvFetch(`/get/${encodeURIComponent(kvKey)}`);
  if (!resp || !resp.ok) return { valid: false };

  try {
    const json = (await resp.json()) as { result: string | null };
    if (!json.result) return { valid: false };

    const data = JSON.parse(json.result) as SessionData;
    return { valid: true, sessionId: data.sessionId, userId: data.userId };
  } catch {
    return { valid: false };
  }
}

/**
 * Elimina sessão no KV (logout).
 */
export async function destroySession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const kvKey = `nexus:auth:session:${sessionId}`;
  await kvFetch(`/del/${encodeURIComponent(kvKey)}`, { method: 'POST' });
}

/**
 * Constrói o header `Set-Cookie` para a sessão.
 * HttpOnly + Secure + SameSite=Strict (NFR8).
 */
export function buildSessionCookie(sessionId: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${SESSION_COOKIE}=${sessionId}`,
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Constrói header `Set-Cookie` para apagar a sessão (logout).
 */
export function buildClearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');
}

export { SESSION_COOKIE };
