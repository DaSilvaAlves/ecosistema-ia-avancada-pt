# Nexus v2 — Handoff Index

Fonte de verdade para handoffs pendentes e arquivados do projecto Nexus v2.
Ver regra canónica: `.claude/rules/handoff-central.md`

---

## Pending

| Ficheiro | De | Para | Data | Próxima acção |
|---------|-----|------|------|--------------|
| [RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md](RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md) | `@aiox-master` | `@dev` | 09/05/2026 | PR #14 abriu OK mas CI VERMELHO em 2 jobs (`50-prompt regression` + `Playwright E2E + bundle key check`) com root cause única: 401 `loginViaApi` em todos os 50 prompts. Hash bate localmente (`bcryptjs.compareSync` true) e env está hardcoded no workflow + visível nos CI logs — server retorna 401 e não 500, logo env chega ao server mas comparação falha. `@dev` investiga env propagation step→`npm run dev`→`route.ts` (suspeita-se dollar-sign expansion ou newline trailing). Fix recomendado: mover hash para `gh secret set NEXUS_PASSWORD_HASH`. PR: https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14 |

---

## Archived

| Ficheiro | De | Para | Consumido | Por |
|---------|-----|------|----------|-----|
| [RETOMA-20260509-story-1.10-pr-14-aguarda-ci-verde-close-story-OBSOLETO.md](archive/RETOMA-20260509-story-1.10-pr-14-aguarda-ci-verde-close-story-OBSOLETO.md) | `@devops` | Eurico → `@po` | 09/05/2026 | `@aiox-master` (Orion) — handoff arquivado por ficar obsoleto: assumia CI verde mas CI ficou vermelho; substituído por `RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md` |
| [RETOMA-20260509-story-1.10-po-validation-decisions-ready.md](archive/RETOMA-20260509-story-1.10-po-validation-decisions-ready.md) | `@po` (sessão A) | `@po` (sessão B) | 09/05/2026 | Pax (@po) — escreveu PO-VALIDATION-STORY-1.10.md (GO conditional 8/10) com D1–D4 resolvidos e 5 fixes F1–F5 listados |
| [RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md](archive/RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md) | `@sm` | `@po` | 09/05/2026 | Pax (@po) — validate-story-draft executado; 4 DECISIONS-NEEDED resolvidos via fundamentação canónica PRD+Architecture; CONCERNS resolvido em cascade @sm→@qa→@architect→@dev→@qa→@architect→@dev→@devops |
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
