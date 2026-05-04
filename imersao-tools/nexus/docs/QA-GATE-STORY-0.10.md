# QA Gate — Story 0.10: CI + Vercel config

**Story ID:** 0.10
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC4, AC6, AC8 cumpridos. AC5/AC7 (criar projecto Vercel + env vars) são acções manuais Eurico — documentadas em `v2/README.md` e nas Tasks 5-8. |
| 2 | Tests passing | PASS (preparados) | CI corre Vitest + Playwright quando trigger. Step grep `sk-ant-` em `.next/static/` valida NFR5 (PRD Epic 0 AC4). |
| 3 | Lint + typecheck | PASS (config) | Job `lint-typecheck` define `npm run lint` + `npm run typecheck`. Falha CI se exit code !=0. |
| 4 | NFRs respeitadas | PASS | Paths filter `imersao-tools/nexus/v2/**` evita disparar CI em outros projectos do mono-repo (boa prática). NFR5 verificado por grep no bundle. |
| 5 | Security review | PASS | Env de teste em CI usa keys fake (`sk-ant-test-fake-not-real`, hash bcrypt placeholder, SESSION_SECRET 64 zeros). Nada que exponha valores reais. Workflow não usa secrets sensíveis para Epic 0. |
| 6 | Architecture conformance | PASS | 3 jobs paralelos exactos como `architecture-v2.md §13`: lint-typecheck, unit-tests, e2e. Node 20 + cache npm + actions/setup-node@v4 + actions/checkout@v4 — versões correntes. Upload de artefactos de coverage e Playwright report. |
| 7 | Article IV (No Invention) | PASS | Workflow segue arch §13 fielmente. `regions: ['fra1']` em `vercel.json` — escolha justificada (AD-Dex-5: Frankfurt mais próximo de Portugal, latência <60ms para Algarve). |

---

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| AD-Dex-5 (`regions: ['fra1']` Frankfurt) | **ACEITE**. Justificativa de latência válida — Frankfurt é a região Vercel mais próxima geograficamente de Portugal. Não há ADR formal sobre região; decisão pragmática. **Directiva:** se Eurico mudar de localização (ex: viagem), avaliar `cdg1` (Paris) como alternativa. |

## Observações

- Job `e2e` faz `npm run build` + verifica grep `sk-ant-` em `.next/static/` — gate NFR5 efectivo. Em caso de falha, `exit 1` bloqueia merge.
- `paths` filter inclui ambos `imersao-tools/nexus/v2/**` e `.github/workflows/nexus-v2-ci.yml` — correcto (alterar workflow re-dispara CI).
- `working-directory: imersao-tools/nexus/v2` aplicado consistentemente em todos os 3 jobs.
- `cache-dependency-path: imersao-tools/nexus/v2/package-lock.json` — npm cache scope correcto para mono-repo. **Caveat:** `package-lock.json` ainda não existe (Eurico tem que correr `npm install` uma vez para gerá-lo) — primeiro CI vai falhar até isto acontecer. Documentado nas Tasks 5-8 do README.
- `vercel.json` minimalista e correcto. `framework: "nextjs"`, build/dev/install commands explícitos, regions Frankfurt.
- `README.md` documenta passos manuais Eurico claramente.

## Decisão

**PASS.** CI workflow bem estruturado, paths filter eficiente, gate NFR5 (grep `sk-ant-`) funcional. Tarefas manuais Eurico (Vercel project + env vars) bem documentadas. Quando Eurico configurar e fizer primeiro push, o pipeline arranca.
