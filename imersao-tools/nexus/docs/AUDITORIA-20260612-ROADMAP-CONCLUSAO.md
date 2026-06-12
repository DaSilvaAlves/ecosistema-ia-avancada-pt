# Auditoria completa Nexus v2 — roadmap de conclusão

> Criado por Orion (`@aiox-master`) a 12/06/2026, a pedido do Eurico.
> Fonte de verdade do escopo para terminar o projecto. Actualizar checkboxes à medida que os itens fecham.

## Estado na data da auditoria

| Dimensão | Estado |
|----------|--------|
| Epics | 5/9 Done (0-4) · Epic 5 em curso (6/13) · Epics 6-8 por iniciar |
| FRs do PRD | 62/96 Done (65%) · 5 em curso · 29 por fazer |
| Gates técnicos | Typecheck PASS · Lint PASS (1 warning) · 1582/1582 unit tests · Build PASS |
| npm audit (prod deps) | 14 vulnerabilidades: 2 critical (cadeia `request` via `node-telegram-bot-api`), 1 high (Next.js 15.5.15), 11 moderate |
| Débitos | 0 Alta · 2 Média (D6, D7) · 10 Baixa |

## P0 — urgente

- [x] **P0.1** `npm audit fix` em `v2/` — Next.js 15.5.15 → 15.5.19, high resolvido. **PR #65 MERGED em main** (`9661d6f8`, 12/06/2026), CI+CodeRabbit verdes, gates locais 4/4 PASS (typecheck, 1582/1582 vitest, build, audit). Criticals da cadeia `request` (node-telegram-bot-api) + 12 moderate ficam decididos no Epic 6.
- [x] **P0.2** D7 **já estava resolvido** — hotfix executor system prompt PT-PT em main desde 18/05/2026 (PR #26, commit `755375a0`, `lib/agent/prompts/executor-system.ts`). A retro Epic 4 (acção A5) só não tinha a confirmação registada — fica registada aqui.
- [x] **P0.3** `@architect` ratificou as 5 decisões `[D-5.7-*]` (MECHANISM, SHAPE, TOOLS, SCOPE, PERSIST) — Architect Gate de Entrada da Story 5.7 **EXECUTADO 12/06/2026** (Aria): (A) proxy JSON síncrono, wire/domínio separados (`enrichWithIds`), (A) JSON ad-hoc, scope confirmado, persist pós-sucesso. Registado em `stories/active/5.7.story.md` §Ratificação (v0.2). Epic 5 destrancado — próximo: `@po *validate 5.7` → `@dev`.

## P1 — qualidade (antes de fechar Epic 5)

- [ ] **P1.1** F.1 (Epic 0): coverage threshold 25% → 60% — testes em `lib/shared/env.ts`, `format.ts`, `recurrence.ts`, `themes.ts`.
- [ ] **P1.2** F.2 (Epic 0): reactivar 2 testes E2E skipped em `auth.spec.ts` (fix `getByRole('alert')` strict mode + KV mock em CI).
- [ ] **P1.3** Limpeza menor: import não utilizado `v2/app/api/auth/logout/route.ts:1`; migrar `next lint` → ESLint CLI (deprecated no Next 16); `outputFileTracingRoot` no `next.config`.

## P2 — débitos agrupáveis

- [ ] **P2.1** D6: story técnica de delete projecto com cascata (convenção já fixada no Epic 4 S.1).
- [ ] **P2.2** Housekeeping finanças: D-3.3-1, D-3.4-1/2, D-3.5-1 numa story única.
- [ ] **P2.3** Epic 4 residual: D-4.7-1 (push prompt no onboarding), D-4.8-1 (recorrência série server-side), D-4.8-2 (rotação CRON_SECRET).
- [ ] **P2.4** Criar regra `internal-state-contract-gate.md` (acção A1 retro Epic 4) **antes do Epic 6**.

## Scope restante para terminar

| Bloco | Stories | FRs | Estimativa |
|-------|---------|-----|------------|
| Epic 5 restante (5.7-5.13) | 7 + 1 draft | FR46, FR48-FR50, FR52-FR57 | 40-50h |
| Epic 6 — OAuth Google Calendar/Gmail + Telegram bot | ~17 | FR58-FR76 | 50-60h |
| Epic 7 — Voice + OCR recibos | ~10 | FR77-FR85 | 30-35h |
| Epic 8 — Hardening + PWA offline + backup + CI/CD | ~10 | FR86-FR96 | 40-50h |

Timeline nominal (cadência Epics 1-4): Epic 5 fecha fim de Junho; projecto completo fim de Agosto 2026 (~160-180h restantes).

## Sequência acordada com o Eurico (12/06/2026)

1. P0.1 + P0.2 (hotfix único)
2. P0.3 — Architect Gate da 5.7
3. `/sdc 5.7` até Done
4. P1.1 + P1.2 intercaladas como story técnica durante o Epic 5

## Referências

- Relatórios de origem: auditoria de scope (PRD `docs/PRD-NEXUS-V2.md` §9-10), auditoria técnica (gates em `v2/`), auditoria de débitos (`docs/EPIC-0-FOLLOW-UP-DEBT.md`, `docs/retrospectives/`, QA gates).
- Handoff activo: `docs/handoffs/RETOMA-20260611-story-5.7-DRAFTED-architect-gate-entrada.md`.
