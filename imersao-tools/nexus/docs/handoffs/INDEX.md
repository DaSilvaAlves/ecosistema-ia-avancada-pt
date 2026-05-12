# Nexus v2 — Handoff Index

Fonte de verdade para handoffs pendentes e arquivados do projecto Nexus v2.
Ver regra canónica: `.claude/rules/handoff-central.md`

---

## Pending

| Ficheiro | De | Para | Data | Próxima acção |
|---------|-----|------|------|--------------|
| [RETOMA-20260512-pr-14-merged-epic-1-in-main.md](RETOMA-20260512-pr-14-merged-epic-1-in-main.md) | `@devops` | `@po` | 12/05/2026 | Pax (`@po`) — PR #14 squash-merged em main (merge commit `5514b310`, branch eliminada). Epic 1 (Cérebro Multi-Intent) **10/10 COMPLETO em main**. Próxima acção recomendada: `@po *retrospective epic-1` (5 iter de Story 1.10 têm lições importantes: mock vs real protocol, testIgnore Playwright, cookie sharing E2E). |

---

## Archived

| Ficheiro | De | Para | Consumido | Por |
|---------|-----|------|----------|-----|
| [RETOMA-20260512-story-1.10-closed-epic-1-completed.md](archive/RETOMA-20260512-story-1.10-closed-epic-1-completed.md) | `@po` | any | 12/05/2026 | Gage (`@devops`) — PR #14 squash-merged (commit `5514b310`), branch eliminada, origin/main actualizado. Closure commit `ee6d3a70` (rename `active/` → `completed/` + Status Done + Change Log v1.0) push'ed antes do merge. CI no head SHA `ee6d3a70` 7/7 essential checks SUCCESS. Handoff de saída `RETOMA-20260512-pr-14-merged-epic-1-in-main.md` criado para `@po *retrospective epic-1`. |
| [RETOMA-20260512-story-1.10-iter5-pushed-ci-watch.md](archive/RETOMA-20260512-story-1.10-iter5-pushed-ci-watch.md) | `@devops` | `@po` | 12/05/2026 | Pax (`@po`) — CI verde validado (15/15 jobs SUCCESS, `50-prompt regression` PASS 3m28s, run `25734110978`). Story 1.10 marcada Done (v1.0 Change Log), Tasks 6+8 checked, story movida `active/` → `completed/`. Epic 1 fecha 10/10. Handoff de saída `RETOMA-20260512-story-1.10-closed-epic-1-completed.md` criado para Eurico decidir próximo passo. |
| [RETOMA-20260511-story-1.10-iter5-fix-ready-for-push.md](archive/RETOMA-20260511-story-1.10-iter5-fix-ready-for-push.md) | `@dev` | `@devops` | 12/05/2026 | Gage (`@devops`) — re-check gates críticos PASS (regression 50 tests, test:e2e 6 tests), CR local SKIPPED (incompat WSL+linked-worktree Windows), push'ed `c2978465..7ba0e781`, tip remoto `7ba0e781a0231555991d02b08e05a755846ea43b`. Handoff de saída para `@po` criado para watch CI + `*close-story 1.10`. |
| [RETOMA-20260511-story-1.10-pr-14-iter5-ci-red-regression-suite-no-tests-found.md](archive/RETOMA-20260511-story-1.10-pr-14-iter5-ci-red-regression-suite-no-tests-found.md) | `@po` | `@dev` | 11/05/2026 | Dex (`@dev`) — hipótese principal confirmada por reprodução local (`--list` devolve 0 tests com testIgnore activo). Opção A aplicada em 3 commits (`3ca33962` fix testIgnore, `8674f0a4` scope test:e2e, `7ba0e781` docs File List + Change Log v0.9). 5/5 gates locais PASS. Handoff de saída para `@devops` criado. |
| [RETOMA-20260511-story-1.10-iter4-fix-ready-for-push.md](RETOMA-20260511-story-1.10-iter4-fix-ready-for-push.md) | `@dev` | `@devops` | 11/05/2026 | Gage (`@devops`) — quality gates PASS (lint 1 warning pré-existente, typecheck clean, vitest 321/321), CodeRabbit local skip por incompatibilidade WSL/Windows-worktree (CR vai correr no PR automaticamente), push'ed 4 commits `2b3d7d2a..c2978465` em `feat/nexus-v2-story-1.10-e2e-regression`, PR #14 actualizado. Aguarda CI verde → handoff para `@po *close-story 1.10`. Ficheiro físico ainda em pending location (committado em `7d1c0612` na branch da story — cleanup final ao merge) |
| [RETOMA-20260511-story-1.10-pr-14-ci-fail-investigar-fix.md](archive/RETOMA-20260511-story-1.10-pr-14-ci-fail-investigar-fix.md) | `@po` | `@dev` | 11/05/2026 | Dex (`@dev`) — investigação completa: H1 (path workflow) descartada, H2 (submódulo orfão) confirmada mas não-bloqueante, root cause real era mock SSE protocol (já fixed em Iter 3 `21f91867` local) + 2º root cause em `nexus-v2-ci.yml` (Iter 4 testIgnore `887e6c2f`). 4 commits ahead aguarda push |
| [RETOMA-20260509-hotfix-classifier-fences-pronto-para-devops-push.md](archive/RETOMA-20260509-hotfix-classifier-fences-pronto-para-devops-push.md) | `@dev` | `@devops` | 09/05/2026 | Gage (`@devops`) — push'ed branch `fix/nexus-v2-classifier-strip-markdown-fences`, PR #15 aberto contra main, aguarda CR + decisão Eurico merge |
| [RETOMA-20260509-bug-classifier-json-markdown-fences.md](archive/RETOMA-20260509-bug-classifier-json-markdown-fences.md) | Claude Code | `@dev` | 09/05/2026 | Dex (@dev) — hotfix implementado em `765e422c`, handoff saída criado para @devops e consumido por Gage no push |
| [RETOMA-20260508-story-1.9-pr-12-iter2-status-success-aguarda-decisao-eurico-merge.md](archive/RETOMA-20260508-story-1.9-pr-12-iter2-status-success-aguarda-decisao-eurico-merge.md) | `@devops` | Eurico | 08/05/2026 | Eurico — aprovou Opção A merge waived; Gage (@devops) executou `gh pr merge 12 --admin --squash --delete-branch`, squash `2eecb5fd` no main, Vercel production SUCCESS |
| [RETOMA-20260508-story-1.9-pr-12-iter2-fixes-aplicados-aguarda-cr-iter2.md](archive/RETOMA-20260508-story-1.9-pr-12-iter2-fixes-aplicados-aguarda-cr-iter2.md) | `@dev` | `@devops` | 08/05/2026 | Gage (@devops) — push'ed `2f22b585` (7 commits), CR Iter 2 CHANGES_REQUESTED (4 doc-nits + 1 nitpick), CR status head SHA SUCCESS, escalação Eurico |
| [RETOMA-20260508-story-1.9-pr-12-iter1-changes-requested-aguarda-dev-fixes.md](archive/RETOMA-20260508-story-1.9-pr-12-iter1-changes-requested-aguarda-dev-fixes.md) | `@devops` | `@dev` | 08/05/2026 | Dex (@dev) — Iter 2 fixes aplicados (4 majors + 5 minors + 4 nitpicks), 22 tests novos, 5/5 quality gates PASS |
| [RETOMA-20260508-story-1.9-ready-for-review-aguarda-devops-push.md](archive/RETOMA-20260508-story-1.9-ready-for-review-aguarda-devops-push.md) | `@dev` | `@devops` | 08/05/2026 | Gage (@devops) — push'ed `fb4ed57f`, PR #12 aberto, CR Iter 1 CHANGES_REQUESTED |
| [RETOMA-20260508-story-1.9-validated-pronto-dev.md](archive/RETOMA-20260508-story-1.9-validated-pronto-dev.md) | `@po` | `@dev` | 08/05/2026 | Dex (@dev) — Story 1.9 implementada · 5/5 quality gates PASS |
| [RETOMA-20260508-story-1.9-drafted-aguarda-po-validate.md](archive/RETOMA-20260508-story-1.9-drafted-aguarda-po-validate.md) | `@sm` | `@po` | 08/05/2026 | Pax (@po) — GO 10/10, Story 1.9 Ready |
| [RETOMA-20260508-story-1.9-merged-pronto-story-1.10.md](archive/RETOMA-20260508-story-1.9-merged-pronto-story-1.10.md) | `@devops` | `@sm` | 08/05/2026 | River (@sm) — Story 1.10 Draft criada 08/05/2026 |
| [RETOMA-20260508-story-1.8-merged-pronto-story-1.9.md](archive/RETOMA-20260508-story-1.8-merged-pronto-story-1.9.md) | `@devops` | `@sm` | 08/05/2026 | River (@sm) — Story 1.9 Draft criada |
| [RETOMA-20260508-story-1.8-pr-11-iter2-status-success-aguarda-decisao-eurico-merge.md](archive/RETOMA-20260508-story-1.8-pr-11-iter2-status-success-aguarda-decisao-eurico-merge.md) | `@devops` | Eurico | — | — |
| [RETOMA-20260508-story-1.8-pr-11-iter2-fixes-aplicados-aguarda-cr-iter2.md](archive/RETOMA-20260508-story-1.8-pr-11-iter2-fixes-aplicados-aguarda-cr-iter2.md) | `@dev` | `@devops` | — | — |
| [RETOMA-20260508-story-1.8-pr-11-iter1-changes-requested-aguarda-dev-fixes.md](archive/RETOMA-20260508-story-1.8-pr-11-iter1-changes-requested-aguarda-dev-fixes.md) | `@devops` | `@dev` | — | — |
| [RETOMA-20260508-story-1.8-ready-for-review-aguarda-devops-push.md](archive/RETOMA-20260508-story-1.8-ready-for-review-aguarda-devops-push.md) | `@dev` | `@devops` | — | — |
| [RETOMA-20260508-story-1.7-ready-for-review-aguarda-devops-push.md](archive/RETOMA-20260508-story-1.7-ready-for-review-aguarda-devops-push.md) | `@dev` | `@devops` | — | — |
| [RETOMA-20260508-story-1.7-pr-10-iter1-changes-requested-aguarda-dev-fixes.md](archive/RETOMA-20260508-story-1.7-pr-10-iter1-changes-requested-aguarda-dev-fixes.md) | `@devops` | `@dev` | — | — |
| [RETOMA-20260508-story-1.7-approved-aguarda-dev-develop.md](archive/RETOMA-20260508-story-1.7-approved-aguarda-dev-develop.md) | `@po` | `@dev` | — | — |
