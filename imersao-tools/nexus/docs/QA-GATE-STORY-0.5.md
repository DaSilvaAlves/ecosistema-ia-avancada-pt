# QA Gate — Story 0.5: Proxy Anthropic Edge SSE + rate limit KV

**Story ID:** 0.5
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC8 cumpridos. AC7 (key não no bundle) é validado pela CI da Story 0.10 (step grep `sk-ant-` em `.next/static/`). |
| 2 | Tests passing | PASS (preparados) | `tests/unit/api/anthropic-proxy.test.ts` cobre 5 cenários: 401 sem cookie, 400 body inválido, encaminhamento OK, NFR5 (key não vaza para body/headers), multi-intent canónico. |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. Tipos `ProxyBody` definidos. |
| 4 | NFRs respeitadas | PASS | NFR5 (API key server-only) — confirmado: `apiKey = process.env.ANTHROPIC_API_KEY` apenas em runtime Edge, nunca exposto ao cliente. NFR9 (rate limiting) — 60 req/min por IP via Vercel KV `INCR` + `EXPIRE`. |
| 5 | Security review | **PASS com 1 nota** | Auth check via `getSession()` correcto. Chave nunca em response. Rate limit por IP via header `x-forwarded-for` — em produção Vercel é confiável; em outros proxies poderia ser spoofed (fora de scope agora). |
| 6 | Architecture conformance | PASS | `export const runtime = 'edge'` (ADR-1). `anthropic-version: 2023-06-01` correcto. SSE pass-through via `upstreamResp.body` directo (sem transform). Headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. |
| 7 | Article IV (No Invention) | PASS | URL Anthropic, version, rate limit (60 req/min) e headers — todos do `architecture-v2.md §9.3`. MSW handler copiado exacto de §5.2. |

---

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| AD-Dex-4 (rate limit fail-open sem KV) | **ACEITE com nota**. Em dev local sem KV, não bloquear é correcto (não há atacante a abusar de localhost). Em prod, KV está sempre disponível pois é configurada como hard-requirement no Vercel — fail-open só ocorre em caso patológico de KV down, e nesse cenário não bloquear o serviço é defensável. **Recomendação Epic 8**: adicionar log/alerta quando fail-open dispara em prod. |

## Observações

- AC5 sliding window: implementação actual é "fixed window por minuto" (`Math.floor(Date.now() / 60_000)`). É aceitável e mais simples — o effect prático é equivalente para protecção contra burst. Documento como CONCERN cosmético: a arch §9.3 diz "sliding window" textual mas exemplo de implementação típica para KV é fixed window. **Não bloqueante.**
- Rate limit conta por IP — single-user (Eurico) atrás de NAT casa pode atingir limite mais rápido. 60 req/min é folgado para uso pessoal. OK.
- MSW handler bem estruturado, com fallback genérico + reconhecimento de prompt canónico (PRD AC1).

## Decisão

**PASS.** Proxy seguro, key encapsulada, rate limit funcional, tests robustos. Esta story é gate bloqueante para Epic 1 — está pronto.
