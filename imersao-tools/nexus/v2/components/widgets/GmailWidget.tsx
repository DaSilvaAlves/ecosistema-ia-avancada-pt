'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { WidgetCard } from './WidgetCard';
import type { EmailSummary } from '@/app/api/google/gmail/inbox/route';

/**
 * Nexus v2 — GmailWidget: vista Gmail no dashboard (Story 6.9, T2 — FR66)
 *
 * Widget da Sidebar que mostra APENAS os emails classificados em `importante` +
 * `responder_hoje` (FR66 — `pode_esperar`/`descartavel` ocultos por defeito). Lê do
 * contrato KV da 6.8 via a route Node `GET /api/google/gmail/inbox` (6.9). Integrado
 * em `SidebarWidgets.tsx` entre `GitHubWidget` e `QuickLinksWidget` ([D-6.9-LOCATION]).
 *
 * [D-6.9-TRIGGER] (híbrido): leitura PASSIVA no mount (`GET inbox`, custo zero de
 * tokens — o cron 6.5 alimenta a KV) + botão "Actualizar inbox" OPT-IN que dispara
 * `POST /api/google/gmail/classify` e re-lê. NUNCA classify automático on-mount
 * (R4 EPIC-6 — custo de tokens). `!response.ok` nunca tratado como sucesso (anti-M4).
 *
 * Estados de render (`react-component-test-criteria.md` — ≥3 distintos):
 *   - `loading`    — fetch em curso (mount ou re-fetch pós-"Actualizar"); `aria-live`.
 *   - `empty`      — 200 `{ emails: [] }`: inbox limpa, SEM CTA de ligação (não é erro).
 *   - `content`    — 200 com lista: emails com remetente, assunto, badge de bucket.
 *   - `erro-oauth` — 401 (`not_connected`/`token_revoked`): CTA para ligar o Gmail;
 *                    `role="alert"`.
 *   - `erro-fetch` — 503 / rede: erro transitório "tenta de novo" ([OBS-6.9-1],
 *                    mantido separado — CTA oposto ao 401). `role="alert"`.
 *
 * Distinção `empty` vs `erro-oauth` é HTTP-status-based na origem (AC2): o componente
 * ramifica em `!response.ok` (401→`erro-oauth`, 503→`erro-fetch`), nunca em
 * 200+`emails:[]` ambíguo. Sem 2.ª chamada ao `/status` (resolve [GAP-6.9-EMPTY-VS-
 * NOT-CONNECTED]).
 *
 * Labels PT-PT (padrão D-FUZZY): o identificador ASCII (`importante`/`responder_hoje`)
 * vive na KV; a grafia humana ("Importante"/"Para responder hoje") vive aqui na UI.
 *
 * Design system (`design-system-ia-avancada.md`): glassmorphism via `WidgetCard`,
 * Cyan `#00F5FF` (acção), Lime `#39FF14`, Magenta `#FF006E` (erro), Grey `#8892A4`,
 * branco `#F0F4FF`, Inter; badges JetBrains Mono. Props injectáveis para teste.
 *
 * Trace: AC1/AC3/AC4/AC5/AC6; [D-6.9-LOCATION]; [D-6.9-TRIGGER]; padrão `GmailSettings.tsx`
 * (6.7) + `GitHubWidget.tsx` (widget da Sidebar).
 */

type RenderState =
  | 'loading'
  | 'empty'
  | 'content'
  | 'erro-oauth'
  | 'erro-fetch';

/** Buckets visíveis na vista (FR66 — só estes 2; `pode_esperar`/`descartavel` ocultos). */
const VISIBLE_BUCKETS = ['importante', 'responder_hoje'] as const;

/** Labels humanas PT-PT por bucket (D-FUZZY — identificador ASCII → grafia na UI). */
const BUCKET_LABEL: Record<EmailSummary['bucket'], string> = {
  importante: 'Importante',
  responder_hoje: 'Para responder hoje',
};

/** Cor do badge por bucket (gold/destaque para urgente, cyan para responder). */
const BUCKET_COLOR: Record<EmailSummary['bucket'], string> = {
  importante: '#FFB700',
  responder_hoje: '#00F5FF',
};

/**
 * Fallback seguro de label/cor (anti-#7): mesmo que um bucket inesperado escape ao
 * guard, o acesso a `BUCKET_LABEL[bucket]`/`BUCKET_COLOR[bucket]` nunca renderiza
 * `undefined`. Defesa em profundidade — a route já filtra na origem, mas o cliente
 * não deve assumir o contrato.
 */
const FALLBACK_BUCKET_LABEL = 'Email';
const FALLBACK_BUCKET_COLOR = '#8892A4';

function bucketLabel(bucket: EmailSummary['bucket']): string {
  return BUCKET_LABEL[bucket] ?? FALLBACK_BUCKET_LABEL;
}

function bucketColor(bucket: EmailSummary['bucket']): string {
  return BUCKET_COLOR[bucket] ?? FALLBACK_BUCKET_COLOR;
}

/**
 * Schema Zod mínimo do payload de `GET inbox` (anti-#6): valida o shape em runtime
 * em vez de confiar num cast `as`. Cada email tem de ter os campos de `EmailSummary`
 * e um `bucket` ∈ buckets visíveis (anti-#7 — filtragem por buckets conhecidos na
 * fronteira de dados). Itens malformados são descartados silenciosamente (não fazem
 * crashar a vista — degrada a `empty` se nenhum sobreviver). Espelha o padrão Zod já
 * usado na 6.8 (`GmailClassifyWireSchema`).
 */
const EmailSummarySchema = z.object({
  id: z.string(),
  bucket: z.enum(VISIBLE_BUCKETS),
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  classifiedAt: z.number(),
});

const InboxPayloadSchema = z.object({
  emails: z.array(z.unknown()).optional(),
});

/**
 * Valida o payload do `GET inbox` em runtime e devolve só os emails bem-formados
 * dos buckets visíveis. Descarta itens malformados ou de buckets inesperados sem
 * lançar (anti-#6/#7). Devolve `[]` se o payload não for sequer um objecto válido.
 */
function parseInbox(json: unknown): EmailSummary[] {
  const outer = InboxPayloadSchema.safeParse(json);
  if (!outer.success) return [];
  const raw = outer.data.emails ?? [];
  const emails: EmailSummary[] = [];
  for (const item of raw) {
    const parsed = EmailSummarySchema.safeParse(item);
    if (parsed.success) emails.push(parsed.data);
  }
  return emails;
}

export interface GmailWidgetProps {
  /** Endpoint de leitura da vista. Default: route real. */
  inboxEndpoint?: string;
  /** Endpoint de trigger de reclassificação. Default: route real. */
  classifyEndpoint?: string;
  /** `fetch` injectável para teste. Default: `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
}

const REFRESH_BUTTON_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(0,245,255,0.4)',
  color: '#00F5FF',
  padding: '0.4rem 0.9rem',
  borderRadius: 6,
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const CONNECT_BUTTON_STYLE: React.CSSProperties = {
  background: '#00F5FF',
  color: '#04040A',
  padding: '0.4rem 0.9rem',
  borderRadius: 6,
  border: 'none',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.72rem',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start',
  textDecoration: 'none',
};

/** Mapeia o HTTP status de uma resposta não-ok ao estado de erro do componente. */
function errorStateForStatus(status: number): RenderState {
  return status === 401 ? 'erro-oauth' : 'erro-fetch';
}

export function GmailWidget({
  inboxEndpoint = '/api/google/gmail/inbox',
  classifyEndpoint = '/api/google/gmail/classify',
  fetchImpl,
}: GmailWidgetProps): React.ReactElement {
  const [state, setState] = useState<RenderState>('loading');
  const [emails, setEmails] = useState<EmailSummary[]>([]);

  const loadInbox = useCallback(async (): Promise<void> => {
    const doFetch = fetchImpl ?? globalThis.fetch;
    setState('loading');
    try {
      const res = await doFetch(inboxEndpoint, { credentials: 'same-origin' });
      if (!res.ok) {
        // anti-M4: `!response.ok` NUNCA é sucesso. 401→erro-oauth, 503→erro-fetch.
        setState(errorStateForStatus(res.status));
        return;
      }
      // anti-#6/#7: valida o shape em runtime (Zod) em vez de confiar num cast `as`;
      // descarta itens malformados e de buckets inesperados (defesa em profundidade).
      const list = parseInbox(await res.json());
      setEmails(list);
      setState(list.length === 0 ? 'empty' : 'content');
    } catch {
      // Rede caiu / JSON inválido → erro transitório.
      setState('erro-fetch');
    }
  }, [inboxEndpoint, fetchImpl]);

  useEffect(() => {
    // Leitura passiva no mount (custo zero de tokens — [D-6.9-TRIGGER]).
    void loadInbox();
  }, [loadInbox]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    const doFetch = fetchImpl ?? globalThis.fetch;
    setState('loading');
    try {
      // Opt-in: só o clique dispara classify (R4 — custo de tokens).
      const res = await doFetch(classifyEndpoint, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        // anti-M4: trata `!response.ok` como erro em ambas as chamadas.
        setState(errorStateForStatus(res.status));
        return;
      }
    } catch {
      setState('erro-fetch');
      return;
    }
    // Sucesso da classify → re-lê a vista actualizada.
    await loadInbox();
  }, [classifyEndpoint, fetchImpl, loadInbox]);

  return (
    <WidgetCard title="Gmail">
      {state === 'loading' && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, color: '#8892A4', fontSize: '0.8rem' }}
        >
          A carregar inbox…
        </p>
      )}

      {state === 'erro-oauth' && (
        <div
          role="alert"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <p style={{ margin: 0, color: '#FF006E', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Liga o teu Gmail para veres os emails importantes aqui.
          </p>
          <a href="/settings" style={CONNECT_BUTTON_STYLE}>
            Ligar ao Gmail
          </a>
        </div>
      )}

      {state === 'erro-fetch' && (
        <div
          role="alert"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <p style={{ margin: 0, color: '#FF006E', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Não foi possível obter a inbox neste momento. Tenta novamente.
          </p>
          <button type="button" style={REFRESH_BUTTON_STYLE} onClick={handleRefresh}>
            Actualizar inbox
          </button>
        </div>
      )}

      {state === 'empty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, color: '#39FF14', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Inbox limpa — sem emails urgentes.
          </p>
          <button type="button" style={REFRESH_BUTTON_STYLE} onClick={handleRefresh}>
            Actualizar inbox
          </button>
        </div>
      )}

      {state === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {emails.map((email) => (
              <li
                key={email.id}
                style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    border: `1px solid ${bucketColor(email.bucket)}`,
                    color: bucketColor(email.bucket),
                    borderRadius: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.06em',
                    padding: '0.12rem 0.5rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {bucketLabel(email.bucket)}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.78rem',
                    color: '#F0F4FF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {email.subject || '(sem assunto)'}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    color: '#8892A4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {email.from || '(remetente desconhecido)'}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" style={REFRESH_BUTTON_STYLE} onClick={handleRefresh}>
            Actualizar inbox
          </button>
        </div>
      )}
    </WidgetCard>
  );
}
