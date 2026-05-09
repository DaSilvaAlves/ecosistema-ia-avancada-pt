# Nexus v2 — Handoff Index

Fonte de verdade para handoffs pendentes e arquivados do projecto Nexus v2.
Ver regra canónica: `.claude/rules/handoff-central.md`

---

## Pending

| Ficheiro | De | Para | Data | Próxima acção |
|---------|-----|------|------|--------------|
| [RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md](RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md) | `@sm` | `@po` | 08/05/2026 | `@po *validate-story-draft 1.10` — última story do Epic 1. Draft criada com 4 DECISIONS-NEEDED (D1: mock vs real API, D2: pass rate threshold, D3: CI integration, D4: performance budget). Epic 1: 9/10 Done + 1 Draft |

---

## Archived

| Ficheiro | De | Para | Consumido | Por |
|---------|-----|------|----------|-----|
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
