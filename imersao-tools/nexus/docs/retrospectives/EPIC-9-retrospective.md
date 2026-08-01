# Retrospectiva — Epic 9 Nexus v2 (Hardening + Deploy + PWA)

> **Autor:** Pax (`@po`) | **Data:** 01/08/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (12 PRs mergeados #101-#113; closure final Story 9.10 `8a555104`)
> **Período:** 01/07/2026 → 16/07/2026 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-8-retrospective.md` + `EPIC-6` + `EPIC-5` + `EPIC-4` + `EPIC-3` + `EPIC-2` + `EPIC-1`
> **Estado de fecho:** **11/11 unidades de âmbito Done — Epic 9 FECHADO.** Último epic de hardening do roadmap PRD §9. Waiver rate **0/11 (0%)**.

---

## 1. Sumário executivo

- **11/11 unidades Done** em `main` (9.11, 9.1a+9.1b, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10), decompostas directamente do PRD §10 Epic 9 (9.1-9.10) mais uma story técnica não-PRD (9.11, débito `REC-8.6-ISOLAMENTO-TESTES` da acção A3 da retro Epic 8). **Waiver rate final: 0/11 (0%)** — 6.ª série consecutiva de 0% (Epic 2, 4, 5, 6, 8, 9).
- **A regra nascida da retro anterior evitou, no seu primeiro uso real, exactamente o erro que a originou.** A 9.10 aplicou `production-state-verification-gate.md` (A1 Epic 8) **no arranque**: a verificação contra a plataforma Vercel revelou que o auto-deploy on-push em `main` **já estava operacional** (Git Integration nativa, 12 deployments `GIT:main@sha`) e que o `4e2b1c4`/J-6 estava superado. A story re-escopou-se de *implementação* para *formalização* (runbook + evidência) **antes** do investimento — o oposto simétrico da 8.6, que descobriu a premissa evaporada só no gate final. **É a primeira validação mensurável do ciclo retrospectiva → regra → prevenção.** Ver §3.1 e §5.1.
- **A tripla PWA fechou como cadeia contratada, não como três stories soltas.** A 9.3 (Service Worker) deixou por escrito dois inputs cross-story obrigatórios para a 9.5 — o **contrato de dois sinais offline** (`503 {offline:true}` para GET vs `TypeError` nativo para não-GET) e `[D-9.3-NO-PRECACHE]` — e a 9.5 consumiu-os sem os re-derivar. O mesmo padrão repetiu-se no backup: a 9.6 **fixou o contrato-formato do ZIP** como input estável da 9.7. Ver §3.4.
- **O `internal-state-contract-gate.md` (A1 Epic 4) apanhou na 9.7 um silent-partial-loss que a atomicidade nativa da biblioteca não cobria.** O `@dev` descobriu que o `importInto` do `dexie-export-import` **não reverte** um JSON truncado (o parser em streaming comita dados parciais sem lançar). Resolveu-se com defesa em 2 camadas (`assertBackupParseable` pre-parse total antes de qualquer escrita + transacção nativa), e o AC10f prova a propriedade observável **estado ANTES ≡ estado DEPOIS**. Numa story de restore destrutivo, era a classe de bug com maior custo possível. Ver §3.5.
- **Dois bugs latentes foram corrigidos de passagem, ambos do tipo "mentira silenciosa".** A 9.2 apanhou que o job `e2e` do `nexus-v2-ci.yml` corria com `NEXUS_PASSWORD_HASH` placeholder (E2E que nunca poderia autenticar de verdade); a 9.5 apanhou que o `Header` mostrava `● online` em Lime hardcoded — **mentia sempre**, inclusive offline. Ver §3.6.
- **O hard-stop §8 foi excedido uma vez — na 9.10, com `Authorized-by: Eurico` no Iter 3.** É a primeira vez desde o Epic 5 que uma story precisa de Iter 3, e aconteceu numa story **docs-only** (runbook + 1 linha de correcção documental). Não é falha de processo — a autorização foi obtida como manda o §8 — mas expõe que o hard-stop foi calibrado para código e o perfil de findings de documentação de infra é diferente. Ver §5.2.
- **Nenhuma regra nova é proposta por este epic.** Como no Epic 6, o epic correu inteiramente dentro das regras existentes e não expôs ponto cego genuíno. Propor regra sem padrão observado seria cerimónia. Ver §7 nota de autoridade.
- **Tensão registada honestamente: "roadmap MVP completo" carece de reconciliação.** O `EPIC-9.md` declara o roadmap MVP do PRD §9 completo, mas o **Epic 7 (Voice + OCR) está 4/10** — o sub-âmbito OCR (7.5-7.10) nunca arrancou. O Epic 9 é o último epic **de hardening**; o roadmap §9 inclui o Epic 7. Isto é decisão de âmbito do Eurico + `@pm`, não uma afirmação a corrigir por conta própria. Ver §6.1 e **A1**.

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Unidades de âmbito do epic | 11 | 9.1-9.10 (PRD §10) + 9.11 (débito Epic 8 A3, não-PRD) |
| Unidades Done | **11/11** | Todas em `main` |
| PRs mergeados | **12** | A 9.1 foi dividida operacionalmente em 9.1a + 9.1b (2 PRs para 1 unidade) |
| Stories com GO de validação / gate à 1.ª passagem | **11/11** | Nenhuma rejeitada na validação de entrada |
| Stories com iterações CR ≤2 | **10/11** | Excepção: 9.10 (Iter 3 autorizado) |
| Stories que ultrapassaram o hard-stop §8 | **1 (9.10)** | Com `Authorized-by: Eurico` — 1.ª vez desde o Epic 5 |
| Waiver rate ("merge waived") | **0/11 (0%)** | Alvo do epic cumprido. O waiver M1 da 9.10 (env vars `KV_*`/VAPID não expandidos) foi **pré-adjudicado e justificado** pelo `@architect` — 0 waivers substantivos |
| Re-scope / correct-course | **1 (9.10)** | **Preventivo, no arranque** — não tardio como na 8.6 |
| Criticals de segurança escapados ao gate | **0** | — |
| ADRs base reabertos | **0** | ADR-1 a ADR-10 intactos |

> **Nota "quality gate" vs "CodeRabbit":** distinção mantida desde a retro Epic 1 — o quality gate AIOX (PO Validation / QA Gate / Architect Gate / gate `@dev`) é camada distinta das iterações CodeRabbit no PR. Como nos Epics 6 e 8, o CR `--base main` no gate de saída (`cr-base-main-no-gate-saida`) reduziu findings a montante, e o CR server-side no PR continuou a apanhar o que o local não apanha (9.4: 1 Major real — ícones a regenerar por request).

### 2.2 — Distribuição por story (detalhe)

| Story | Âmbito (NFR) | Executor → Gate | Gate AIOX | Iter CR (PR) | Resultado | Dívida |
|-------|--------------|-----------------|-----------|--------------|-----------|--------|
| 9.11 — Isolamento full-suite (não-PRD, débito Epic 8 A3) | Determinismo da suite | `@dev` → `@architect` | PASS (+ refino AC3 `60b8e021`) | — | Causa-raiz = **timing flake sob carga**, não contaminação; `testTimeout`/`hookTimeout` 5000→20000ms; 5 corridas 2536 PASS/0 FAIL | — |
| 9.1a — Cobertura rotas proxy + cérebro | NFR17 | `@dev` → `@qa` | PASS | CR `--base main` **0 findings** | Rotas proxy 45,61%/69,64% → **100% lines/91,66% branch**; cérebro 95,64%; global 89,1% | — |
| 9.1b — Cobertura package finanças | NFR17 | `@dev` → `@qa` | PASS | 1 iter (3 Major **refutados** como falso positivo) | Finanças 81,53% lines / 78,66% branch / 75,00% funcs; 3× `test:unit` 2617 PASS/0 FAIL. **Fecha a unidade 9.1** | — |
| 9.2 — E2E caminho crítico | NFR17 | `@dev` → `@qa` | **PASS score 100** (8/8 AC reproduzidos, não reportados) | 1 Minor documental não-bloqueador | login→prompt→tarefa→`reload()`→persistência Dexie no CI regular. **AC5 corrigiu bug latente de env do job `e2e`** | — |
| 9.3 — Service Worker + cache strategy | NFR21 | `@dev` → `@architect` | PASS-condicional Confiança Alta (R4 por diff; 3 eixos PASS) | CR-1/CR-3 aplicados (`971c0740`); settled SUCCESS 1 Minor | Network-first `/api/*` GET + cache-first `/_next/static/**` + `activate` versionado; handlers `push`/`notificationclick` **byte-a-byte intactos**. **Abre a cadeia PWA** | REC-9.3-CACHE-PUT-WAITUNTIL (Baixa) |
| 9.4 — Manifest PWA + ícones | NFR21, NFR24 | `@ux-design-expert` → `@dev` | PASS 12/12 | **CR server-side 1 Major** (ícones regeneravam por request → `force-static`, head `a2261270`) + 2 doc; final APPROVED | `app/manifest.ts` + 4 rotas `ImageResponse` (zero binário); `middleware.ts`/`sw.js` intocados por diff. **AC9 Lighthouse deferido a produção** | — |
| 9.5 — Modo offline degradado | NFR21 | `@dev` → `@architect` | PASS Confiança Alta (3 eixos contra código real) | CR final SUCCESS 1 Minor | `useOnlineStatus` + `OfflineBanner`; chat **não finge sucesso** (`TypeError` preservado ponta-a-ponta). **Corrige `● online` hardcoded do `Header`**. **Fecha a tripla PWA** | REC-9.5-CONST-COVERAGE (Baixa) |
| 9.6 — Backup export ZIP | NFR22 | `@dev` → `@qa` | PASS Confiança Alta, **11/11 AC por execução real** | CR `--base main` **0 findings** | `exportDB()` 22 tabelas → `nexus-db-export.json` cru + `notas.md`, ZIP via `fflate zipSync`. **AC6 sem secrets por construção**. **Fixa o contrato-formato para a 9.7** | REC-9.6-MD-FENCE + REC-9.6-TEST-ASSERT (Baixa) |
| 9.7 — Restore import ZIP | NFR22 | `@dev` → `@architect` | PASS Confiança Alta (3 eixos; **anti-M4 ratificado por execução**) | CR final `--base main` APPROVED, 0 actionable | Defesa 2 camadas (`assertBackupParseable` + transacção); AC10f prova **estado ANTES ≡ DEPOIS**; GAP-9.4 resolvido. **Fecha o round-trip NFR22** | REC-9.7-CONFIRM-MODAL + REC-9.7-SEMANTIC-VALIDATE (Baixa); REC-9.7-ACT-FLUSH resolvido pré-merge |
| 9.8 — GitHub Actions CI bloqueante | NFR18 | `@devops` → `@architect` | **RE-GATE** PASS Confiança Alta (head `8ac20ee5`, Iter 2) | CR `--base main` 0 findings + server-side resolvido | Path-filter `dorny/paths-filter@v3` + timeouts + least-privilege; AC5 empírico ~2m52s. **AC4 branch protection ACTIVADA 05/07** (4 contexts, consentimento do Eurico); **C2 provado** via PR #106 | REC-9.8-PERSIST-CREDENTIALS (Baixa); **REC-REPO-HYGIENE-GITLINKS (Média)** |
| 9.9 — CodeRabbit obrigatório | NFR18 | `@devops` → `@qa` | PASS 9/9 | — | `CodeRabbit` como **5.º required context** (contexts 4→5), verificado por `gh api`. **GAP honesto (AC3):** veto por severidade fica ao nível de processo, não automatizado na plataforma | — |
| 9.10 — Vercel preview + prod automatizado | NFR19 | `@devops` → `@architect` | PASS Confiança Alta | **Iter 3** (`Authorized-by: Eurico`); final APPROVED 0 actionable | **Story de FORMALIZAÇÃO** — verificação de produção no arranque desbloqueou-a. Runbook + evidência + `iad1`→`fra1`. NFR19: 4/5 <2min (mediana ~1m38s). **AC6 deferido**; `[GAP-9.10-1]` fora de âmbito | — |

**Síntese:** 0 waivers substantivos em 11 unidades / 12 PRs. Uma story ultrapassou o hard-stop §8 (9.10, autorizada). Distribuição de gates: **`@architect` 6** (9.11, 9.3, 9.5, 9.7, 9.8, 9.10 — território bloqueador de `not-tested-trailer-rules.md` e estado distribuído), **`@qa` 5** (9.1a, 9.1b, 9.2, 9.6, 9.9), **`@dev` 1** (9.4, UI pura com executor `@ux-design-expert`). Todos os pares respeitaram `separation-of-roles.md` — em especial as 9.8/9.9/9.10, executadas por `@devops`, cujo gate subiu a `@architect`/`@qa` (nunca `@devops` a auto-aprovar CI/deploy que ele próprio configurou).

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| `EPIC-9.md` criado por `@pm` (Morgan) | 01/07/2026 |
| 1.ª story merged (9.11, PR #101 `0e7bd6d0`) | 01/07/2026 18:00 |
| Última story merged (9.10, PR #113 `26a22080`) | 16/07/2026 11:37 |
| Closure commit final (`8a555104`) | 16/07/2026 11:47 |
| **Duração total** | **~16 dias corridos** |
| PRs/dia (média) | ~0,75 (12 PRs / 16 dias) |
| Dias com 2 merges | **3** — 03/07 (9.1a+9.1b), 04/07 (9.2+9.8), 08/07 (9.5+9.6) |
| Hiatos sem merge | **2 × ~3,8 dias** — 08/07→12/07 e 12/07→16/07 |

> O ritmo é **irregular por natureza do trabalho, não por bloqueio**: os primeiros 8 dias entregaram 10 dos 12 PRs (cobertura, E2E, CI, CodeRabbit, tripla PWA, backup); os dois hiatos finais correspondem às duas stories de maior análise — a 9.7 (restore destrutivo, análise de ciclo de vida em 3 eixos + descoberta do silent-partial-loss) e a 9.10 (verificação de estado de produção contra a plataforma + Iter 3 de CR). Comparação: Epic 6 ~6 dias/17 stories (~2,67/dia), Epic 8 ~6 dias/6 stories (~1,0/dia). O Epic 9 é mais lento por PR porque 6 das 11 unidades exigiram Architect Gate com análise formal.

### 2.4 — Cronologia de merges em main

| Ordem | Story | PR | Squash commit | Closure | Data de merge |
|-------|-------|-----|---------------|---------|---------------|
| 1 | 9.11 — Isolamento full-suite | #101 | `0e7bd6d0` (+`60b8e021`) | `d8f4d0bf` | 01/07/2026 |
| 2 | 9.1a — Cobertura proxy + cérebro | #102 | `b21bb0c2` | `abbb0963` | 03/07/2026 |
| 3 | 9.1b — Cobertura finanças | #103 | `88f18b43` | `f06df1c5` | 03/07/2026 |
| 4 | 9.2 — E2E caminho crítico | #104 | `66486112` | `08e66f6a` | 04/07/2026 |
| 5 | 9.8 — CI bloqueante | #105 | `fe028edc` | `87141211` (+`5d790e38`, `06715dca`) | 04/07/2026 |
| 6 | 9.9 — CodeRabbit obrigatório | #107 | `ca4764be` | `f7cf11a2` | 05/07/2026 |
| 7 | 9.3 — Service Worker | #108 | `733e1424` | `3eb36553` | 06/07/2026 |
| 8 | 9.4 — Manifest PWA + ícones | #109 | `b4d200cc` | `d1cec3f9` | 07/07/2026 |
| 9 | 9.5 — Modo offline degradado | #110 | `f7f420c3` | `ee2c620f` | 08/07/2026 |
| 10 | 9.6 — Backup export ZIP | #111 | `08e9c171` | `6ac0a426` | 08/07/2026 |
| 11 | 9.7 — Restore import ZIP | #112 | `f6ac9f99` | `bab96e49` | 12/07/2026 |
| 12 | 9.10 — Deploy contínuo (formalização) | #113 | `26a22080` | `8a555104` | 16/07/2026 |

> **O PR #106 não é uma story** — foi um PR não-Nexus usado deliberadamente como **prova C2 da 9.8**: demonstrou que um PR fora do âmbito Nexus continua mesclável com os checks Nexus a SKIPPED (`mergeStateStatus=CLEAN`), validando que a branch protection não bloqueia o resto do monorepo.
>
> A ordem de execução **respeitou a sequência sugerida do `EPIC-9.md` §10**: 9.11 primeiro (determinismo antes de endurecer cobertura e instituir CI), depois 9.1a→9.1b, E2E e CI/CodeRabbit em paralelo, a cadeia PWA 9.3→9.4→9.5 em ordem de dependência, o par backup 9.6→9.7, e a 9.10 no fim (dependente da verificação de produção).

### 2.5 — Evolução da suite de testes

> Snapshots datados (convenção A5 do Epic 3 — as contagens vivem no Change Log/Dev Record de cada story, não são recalculadas aqui).

| Marco | Testes (vitest) | Fonte |
|-------|-----------------|-------|
| Baseline pré-Epic 9 (fecho Epic 8) | **2536** | Retro Epic 8 §2.5 / QA Gate 8.6 |
| Story 9.11 (5 corridas determinísticas) | 2536 PASS / 0 FAIL | Story 9.11 (`stories/completed/9.11.story.md`) |
| Story 9.1b | 2617 | Story 9.1b (3× `test:unit`) |
| Story 9.6 | **2662** | Story 9.6 (232 ficheiros, 0 fail) |
| Story 9.7 | +13 testes (8 lib + 5 componente) | Story 9.7 — total pós-9.7 não citado nas fontes; **não inventado** |

**Delta Epic 9: ≥+126 testes** (2536 → 2662 no último snapshot citado, mais os 13 da 9.7 e os da 9.10 — a 9.10 é docs-only, não acrescenta testes). Crescimento coerente com um epic de hardening: o grosso vem da cobertura (9.1a rotas proxy + 9.1b os 10 componentes CRUD de finanças, ~6.145 linhas de UI antes a 0%) e do backup/restore (9.6+9.7).

**O ganho mais relevante do epic não é a contagem — é o determinismo.** A 9.11 fechou `REC-8.6-ISOLAMENTO-TESTES` diagnosticando a causa-raiz correcta: **timing flake sob carga** (o 1.º `await import()` de rotas pesadas esgotava `testTimeout` 5000ms com CPU saturada), **não** contaminação cross-test como se assumia no Epic 8 (o Vitest 2.x isola por ficheiro). O fix foi `testTimeout`/`hookTimeout` 20000ms com concorrência intacta e zero skips. Sem isto, o CI bloqueante da 9.8 teria herdado ~10 flakes e o gate seria ruído em vez de sinal.

### 2.6 — Cobertura (NFR17) e estado da plataforma

| Item | Estado no fecho |
|------|-----------------|
| Cobertura rotas proxy (`app/api/anthropic/**`, `app/api/openai/**`) | 45,61%/69,64% → **100% lines / 91,66% branch** (9.1a) |
| Package cérebro | **95,64%** (9.1a) |
| Package finanças | **81,53% lines / 78,66% branch / 75,00% funcs** (9.1b) — ≥60% nas 4 métricas |
| Cobertura global | **89,1%** (9.1a), thresholds 60% intactos |
| Branch protection de `main` | **ACTIVA — 5 required contexts** (`Detect Nexus v2 Changes` + 3 jobs CI + `CodeRabbit`), `strict=false`, `enforce_admins=false` |
| Deploy contínuo | **Auto-deploy on-push `main` operacional** (Git Integration nativa, `productionBranch=main`); NFR19 4/5 <2min, mediana ~1m38s; região `fra1` |
| Env vars de produção (nomes) | `ANTHROPIC_API_KEY` + KV/Redis + `SESSION_SECRET` + `NEXUS_PASSWORD_HASH` + `CRON_SECRET` + VAPID. **Sem** `OPENAI_API_KEY`/`LLM_PROVIDER` — coerente com o cutover deferido do Epic 8 |

---

## 3. Loved — o que funcionou bem

### 3.1 — A regra da retro anterior evitou, no 1.º uso, o erro que a originou (validação mensurável do ciclo)

`production-state-verification-gate.md` nasceu da acção A1 da retro Epic 8, escrita **por causa** da 8.6: uma story que percorreu o pipeline inteiro sobre uma premissa que tinha evaporado, descoberta só no gate final. Na 9.10 — a primeira story de estado LIVE desde então — a verificação correu **no arranque**, contra a plataforma, com os 4 itens obrigatórios registados com evidência: env vars por nome, SHA activo (`bab96e4`), reconciliação do `4e2b1c4`/J-6 (**superado**), e estado do auto-deploy (**ON**, Git Integration nativa).

**O resultado foi o inverso simétrico da 8.6:** a premissa confirmou-se, revelou-se que o pipeline já existia, e a story re-escopou-se de "implementar deploy contínuo" para "formalizar o pipeline em vigor" **antes** de qualquer investimento. Um comando contra a plataforma poupou uma implementação inteira e produziu, em vez dela, um runbook (`docs/runbooks/deploy-continuo-vercel.md`) que documenta o que realmente acontece.

**Evidência:** `EPIC-9.md` §10 bloco "ÚLTIMA UNIDADE" (tabela dos 4 itens verificados 15/07/2026); story 9.10 (evidência de verificação). **Esta é a primeira vez em nove epics que uma regra criada por uma retrospectiva é observada a prevenir a sua própria origem.** Vale como validação do ciclo retro → regra → aplicação enquanto mecanismo, não só como boa prática declarada.

### 3.2 — Waiver 0% pela 6.ª vez consecutiva, no epic com mais gates `@architect`

O Epic 9 fechou **0/11 waived**. Seis das onze unidades passaram por Architect Gate (território bloqueador de `not-tested-trailer-rules.md`: config de CI, test-runner, deploy; e estado distribuído: SW, offline, restore destrutivo) — a maior densidade de gates `@architect` de qualquer epic até hoje. **Evidência:** tabela §2.2.

As dívidas que surgiram foram **registadas explicitamente** (8 débitos Baixa + 1 Média, §4), nunca silent-waived. O único waiver formal (M1 da 9.10, env vars `KV_*`/VAPID não expandidos para nomes literais) foi **pré-adjudicado e justificado** pelo `@architect`: `KV_*` é um set fixo da integração Vercel KV — notação precisa, não invenção (Constitution Art. IV). Zero waivers substantivos.

### 3.3 — O hard-stop §8 foi antecipado, não sofrido: o split 9.1a/9.1b

Na validação da 9.1, o `@po` recomendou dividir a story: a cobertura do package finanças eram ~6.145 linhas de UI nunca testadas (10 componentes CRUD + 3 páginas), e um PR único ultrapassaria com alta probabilidade as 2 iterações CR do hard-stop §8. O Eurico ratificou o split (01/07/2026). **Resultado: 9.1a mergeou com CR 0 findings; a 9.1b com 1 iteração (3 Major refutados como falso positivo). Nenhuma das duas ultrapassou o hard-stop.**

O padrão a reter: **o hard-stop §8 é uma métrica de gestão de risco de execução, utilizável para decidir a granularidade da story no draft — não apenas um travão accionado a posteriori.** A story original ficou preservada como histórico (`stories/active/9.1.story.md`, marcada SUPERSEDED), e o critério de fecho do epic manteve as 11 unidades de âmbito (a linha 9.1 lê-se "9.1a **e** 9.1b Done").

### 3.4 — Contratos cross-story escritos: a cadeia PWA e o par backup/restore

Duas cadeias de dependência foram tratadas com **contrato explícito por escrito na story a montante**, em vez de re-derivação a jusante:

| Cadeia | Contrato fixado a montante | Consumido a jusante |
|--------|---------------------------|---------------------|
| PWA (9.3 → 9.5) | **Contrato de dois sinais offline** — `503 {offline:true}` para GET interceptado (discriminar pelo **body**, não só pelo `status===503`) vs `TypeError` nativo para não-GET (passa directo). Mais `[D-9.3-NO-PRECACHE]` (cache-first sobre assets hashed não dá navegação offline) | A 9.5 tratou os dois sinais honestamente sem os re-descobrir; a análise de ciclo de vida provou que as classes online / offline-read / offline-write / erro-real-servidor **nunca colapsam** |
| Backup (9.6 → 9.7) | **Contrato-formato do ZIP** — `nexus-db-export.json` (output **cru** de `exportDB()`, byte-a-byte, importável via `importInto()`) + `notas.md` (legível, **não** re-importável) | A 9.7 importou o formato exacto sem re-derivar; o `EPIC-9.md` §5 regista que "o contrato-formato é estável e não precisa de ser re-derivado no draft da 9.7" |

**O efeito é reduzir a superfície de invenção entre stories acopladas.** Quando a story a jusante herda um contrato escrito, o gate a jusante verifica conformidade em vez de redesenhar — e o desalinhamento silencioso entre duas stories da mesma cadeia deixa de ser possível.

### 3.5 — O `internal-state-contract-gate` apanhou um silent-partial-loss que a biblioteca não cobria (9.7)

A 9.7 é a story de maior risco do epic: escrita **destrutiva** client-side sobre as 22 tabelas Dexie. A análise de ciclo de vida em 3 eixos (`internal-state-contract-gate.md`, A1 Epic 4) produziu um achado que nenhum gate estrutural teria apanhado: **a atomicidade nativa do `importInto` não reverte um JSON truncado** — o parser em streaming comita dados parciais sem lançar, deixando a base num estado a meio. É exactamente o anti-padrão M4 da 4.9 (falha tratada como sucesso), na sua forma mais cara.

A resolução foi **defesa em 2 camadas**: Camada 1 `assertBackupParseable` (`JSON.parse` do texto **completo** antes de qualquer escrita — a base nem sequer é limpa) + Camada 2 a transacção nativa (nunca `noTransaction`). E o AC10f não testa a implementação, testa a **propriedade observável**: *estado ANTES ≡ estado DEPOIS* para entrada truncada.

Os 3 eixos deram ainda: 6 classes de entrada com desfecho honesto e distinto, 5 `RestoreError.reason` mapeados 1:1 para 5 mensagens PT-PT sem genérico ambíguo, e confirmação destrutiva a bloquear **toda** a escrita. **A regra nascida da 4.9 continua a pagar-se quatro epics depois.**

### 3.6 — Dois bugs latentes do tipo "mentira silenciosa" corrigidos de passagem

| Story | Bug latente | Porque importava |
|-------|-------------|------------------|
| 9.2 (AC5) | O job `e2e` do `nexus-v2-ci.yml` corria com `NEXUS_PASSWORD_HASH` **placeholder** | Um E2E de autenticação que nunca poderia autenticar de verdade — verde sem significar nada. Corrigido para hash real de `nexus-test-password` + `TEST_PASSWORD` (cópia de `e2e-regression.yml`), **provado em CI real** |
| 9.5 (AC2) | O `Header` mostrava `● online` em Lime **hardcoded** | **Mentia sempre** — inclusive offline. É o mesmo anti-padrão que a story vinha corrigir no chat (não fingir sucesso), a viver no próprio indicador de estado |

Ambos são da mesma família: **um sinal que aparenta ser verdade e nunca o foi.** Que tenham aparecido num epic de hardening é apropriado — é precisamente o tipo de coisa que só se encontra quando se olha para a infraestrutura de qualidade em vez de para a funcionalidade.

### 3.7 — Diferimento honesto, repetidamente, sem silent-waive

O epic deferiu seis coisas, e **listou-as todas explicitamente** com dono e razão — nenhuma foi waived em silêncio:

| Diferido | Onde | Razão registada |
|----------|------|-----------------|
| AC9 (Lighthouse ≥85 mobile/90 desktop + Add-to-Home real) | 9.4 | Exige Chrome/Edge reais sobre produção — Eurico + `@devops` (padrão 4.9 AC13) |
| AC6 (merge real dispara deploy + domínio serve novo SHA) | 9.10 | Verificação manual pós-deploy — Eurico + `@devops` |
| `[D-9.5-NO-APP-SHELL]` — cold-start offline | 9.5 | **Fora do NFR21**: o layout autenticado faz `cookies()`+`redirect` server-side, não há shell estático seguro para pré-cachear. Resolvido-por-diferimento, ratificado pelo `@architect` — **não é GAP aberto** |
| AC3 — veto por severidade CRITICAL automatizado na plataforma | 9.9 | Classe de decisão distinta (política de review do monorepo inteiro), não coberta pelo consentimento da 9.8 — incógnita para o Eurico |
| `[GAP-9.10-1]` — eliminar `src/` v1 legacy | 9.10 | Condição de arch insatisfazível hoje (`migration-smoke.spec.ts` não existe); ortogonal ao deploy; não é AC de fecho — débito técnico próprio |
| `REC-8.6-CUTOVER-DEFERIDO` (herdado) | Epic 8 | Alavanca on-demand; produção viva via Anthropic |

**A distinção entre "não entregue" e "delimitado com razão registada" é o que separa um fecho honesto de um atalho.** O caso mais fino é o `[D-9.5-NO-APP-SHELL]`: em vez de deixar um GAP aberto que sugerisse entrega em falta, o `@architect` ratificou que o cold-start offline está fora do NFR21 e reconciliou a redacção no `EPIC-9.md` §10.

### 3.8 — Aplicação efectiva das regras nascidas de epics anteriores

| Regra / acção anterior | Estado no Epic 9 |
|------------------------|------------------|
| **A1 Epic 8 — `production-state-verification-gate.md`** | **Validada por prevenção na 9.10** (§3.1). Primeira aplicação real; funcionou como desenhada |
| **A2 Epic 8 — amenda a `handoff-central.md` (verificar contra estado real)** | Aplicada no arranque do epic e nesta própria retrospectiva (o handoff de 16/07 foi cruzado com `git log`/`git status` antes de qualquer acção) |
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Crítica na 9.3 (4 classes de estado offline), 9.5 (3 eixos contra código real) e **9.7** (anti-M4 ratificado por execução, §3.5) |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplicada na 9.2 (E2E mantém fidelidade a `ExecutorSSEEvent` na fronteira `/api/anthropic/proxy`, ADR-8) |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Banner offline (9.5) com múltiplos estados → teste de componente; `RestoreSettings`/`BackupSettings` (4 estados cada) idem |
| **A6 Epic 1 — `separation-of-roles.md`** | 11/11. Caso notável: 9.8/9.9/9.10 executadas por `@devops` → gate subiu a `@architect`/`@qa`; 9.4 executada por `@ux-design-expert` → gate `@dev` |
| **A1 Epic 5 + A1 Epic 6 — `cr-base-main-no-gate-saida`** | Crítica em 9.3 (SW toca fetch de toda a app), 9.8 (CI) e 9.10 (deploy). Confirmado de novo que **não substitui** o CR server-side: a 9.4 teve 1 Major real apanhado só no PR |
| **`not-tested-trailer-rules.md`** | Contexto bloqueador em 9.8/9.11 (CI + test-runner) → `Evidence:` exigido, nunca `Not-tested:`. Na 9.10 **não se activou** porque AC7 provou por diff que nenhuma config de deploy foi tocada |
| **`merge-authority.md`** | 12/12 merges feitos pelo agente (`@devops`/`@aiox-master`); **zero merges manuais pedidos ao Eurico** |
| **A3 Epic 8 — destino do débito `REC-8.6-ISOLAMENTO-TESTES`** | **Cumprida** — entrou como 9.11 e fechou (§2.5) |

**O ciclo retrospectiva → regra → aplicação produziu resultados pela 7.ª vez consecutiva.** Nenhuma regra existente foi violada em nenhuma das 11 unidades.

---

## 4. Os débitos não-bloqueadores

Nenhum é bloqueador. O Epic 9 gerou **8 débitos Baixa + 1 Média**, todos registados no Change Log da story respectiva no momento em que surgiram.

### 4.1 — Débitos gerados pelo Epic 9

| # | Débito | Severidade | Origem | Recomendação |
|---|--------|-----------|--------|--------------|
| REC-9.3-CACHE-PUT-WAITUNTIL | Envolver `cache.put` do fetch handler em `event.waitUntil().catch()` para o write sobreviver ao ciclo de vida do fetch event | Baixa | 9.3 (CR Minor) | Housekeeping do SW |
| REC-9.5-CONST-COVERAGE | Cobertura de `layout-constants.ts` | Baixa | 9.5 (CR Minor) | Housekeeping |
| REC-9.6-MD-FENCE | Escaping de code-fence no `notas.md` gerado | Baixa | 9.6 (CR Minor) | Housekeeping |
| REC-9.6-TEST-ASSERT | Reforço de asserção em teste do export | Baixa | 9.6 (CR Minor) | Housekeeping |
| REC-9.7-CONFIRM-MODAL | `window.confirm` em vez de modal do design-system | Baixa | 9.7 | UI polish — o design-system tem padrão próprio (`design-system-ia-avancada.md`) |
| REC-9.7-SEMANTIC-VALIDATE | Validação semântica (vs sintáctica) do backup — só relevante para ficheiro adversarial | Baixa | 9.7 | Avaliar se o modelo de ameaça o justifica (single-user, ficheiro do próprio) |
| REC-9.7-ACT-FLUSH | — | — | 9.7 | **Resolvido pré-merge** |
| REC-9.8-PERSIST-CREDENTIALS | `persist-credentials` no checkout do CI | Baixa | 9.8 | Hardening de CI |
| **REC-REPO-HYGIENE-GITLINKS** | Higiene de gitlinks/submódulos do monorepo | **Média** | 9.8 | **O único Média do epic.** Liga-se ao ruído recorrente de `git status` (submódulos `comunidade`/`starter-builder` sempre sujos, ~150 untracked) que obriga a `git add` ficheiro-a-ficheiro em todas as stories |

### 4.2 — Débito de âmbito registado no fecho

| ID | Descrição | Decisão |
|----|-----------|---------|
| `[GAP-9.10-1]` | Eliminar `src/` v1 legacy | **FORA DE ÂMBITO** (decisão `@po`, 16/07): a condição de arch §16 (eliminar só se `tests/e2e/migration-smoke.spec.ts` passar) é **insatisfazível hoje** — esse ficheiro não existe; é ortogonal ao deploy (produção só constrói `v2/` via `rootDirectory`); não é AC de fecho do epic. Débito técnico próprio para decisão futura do Eurico — requer criar o smoke test primeiro **ou** decidir eliminar sem esse gate |

### 4.3 — Backlog herdado, ainda sem destino

| Origem | Estado |
|--------|--------|
| Débitos Baixa dos Epics 3-6 (D-3.x, D-4.x, D6) | Acumulados — sem destino desde a A3 da retro Epic 6 |
| `REC-8.4-CR-1` (rate-limit proxy) + `REC-ADR10-PROXY-DRY` | Ligados entre si; sem destino desde o Epic 8 |
| `REC-8.6-CUTOVER-DEFERIDO` | Alavanca on-demand (Eurico + `@devops`) — **não é débito de qualidade** |
| P1.3/P2.x da auditoria 12/06 | Sem destino |

> **A acção A3 da retro Epic 8 pedia explicitamente "decidir o destino do backlog Baixa" no arranque do Epic 9.** A parte que dizia respeito ao isolamento de testes foi cumprida (virou a 9.11); a parte do backlog acumulado **não foi decidida** — ficou como incógnita (d) do `EPIC-9.md` §10 e atravessou o epic inteiro sem resolução. O epic acrescentou-lhe mais 8 Baixa + 1 Média. Ver §6.2 e **A3**.

---

## 5. Learned — lições do epic

### 5.1 — Uma verificação barata no arranque pode converter uma story de implementação numa de formalização (e isso é entrega, não desvio)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 9.10, arranque (15/07/2026) |
| **Contexto** | A 9.10 estava desenhada como "implementar deploy contínuo Vercel (preview + prod automatizado, NFR19)". A `production-state-verification-gate.md` obrigou a verificar o estado real **antes** de desenhar. A verificação mostrou que o auto-deploy on-push em `main` já estava operacional há muito (Git Integration nativa, 12 deployments `GIT:main@sha`) e que o `4e2b1c4`/J-6 estava superado |
| **Lição** | Quando a verificação de estado **confirma** a premissa e revela que a capacidade já existe, a resposta correcta não é declarar a story desnecessária nem inventar implementação para a justificar — é **re-escopá-la para formalizar o que existe**: runbook operacional, evidência registada, correcção da documentação divergente (aqui, `iad1`→`fra1` em `architecture-v2.md` §13.2). O valor entregue muda de natureza (de código para conhecimento operacional transmissível), mas continua a ser valor real — e o NFR fica **medido** (4/5 deployments <2min, mediana ~1m38s) em vez de assumido |
| **Acção** | Sem regra nova — padrão positivo. Registar em memória de projecto (**A5**) |

### 5.2 — O hard-stop §8 foi calibrado para código; uma story docs-only tem outro perfil de findings (observação, ainda não padrão)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 9.10 — Iter 3 de CR com `Authorized-by: Eurico` |
| **Contexto** | A 9.10 é **docs-only**: um runbook novo, a story, e 1 linha de correcção em `architecture-v2.md`. Zero código de aplicação, zero config de deploy (AC7 provado por diff). Mesmo assim precisou de 3 iterações CR — a mais das 12 unidades do epic — e de autorização humana explícita. O waiver M1 (env vars `KV_*`/VAPID não expandidas para nomes literais) é sintomático: em documentação de infra, os findings do CR são sobre **precisão factual e completude de enumeração**, não sobre correcção de lógica |
| **Lição** | O hard-stop §8 (máx. 2 iterações CR) foi desenhado contra o risco de *código a ser retrabalhado em ciclo*. Numa story docs-only esse risco não existe — o retrabalho é redacção. Aplicar o mesmo limiar produz uma escalada de autorização humana por um motivo que não é o que a regra visa proteger. **Mas uma ocorrência não é um padrão.** Criar agora uma excepção ao §8 para stories docs-only seria legislar sobre um caso único |
| **Acção** | **Observar, não legislar.** Registar a observação; se uma segunda story docs-only voltar a exceder o §8 por findings de redacção, propor então a clarificação. Ver **A2** — deliberadamente uma acção de observação, não de criação de regra |

### 5.3 — Distinguir "gate de presença" de "gate de veto" evita reclamar uma garantia que não se tem (9.9)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 9.9 — AC3, `CodeRabbit` como 5.º required context |
| **Contexto** | O NFR18 diz "CodeRabbit obrigatório; CRITICAL bloqueia". A 9.9 entregou o `CodeRabbit` como required context em `main` — o que garante que **a revisão tem de completar** antes do merge. Não garante que um finding CRITICAL **bloqueie** o merge: esse veto vive ao nível de processo (`merge-authority.md` condições 2/3), executado pelo agente, não pela plataforma |
| **Lição** | Havia aqui uma tentação óbvia: dar o AC por satisfeito porque "o CodeRabbit é obrigatório agora". A story escolheu registar a distinção como **GAP honesto** e classificar a automação-na-plataforma do veto por severidade (via `required_pull_request_reviews`) como incógnita fora-de-âmbito para o Eurico — porque é uma **classe de decisão distinta**: política de review de todo o monorepo, não coberta pelo consentimento dado na 9.8 para os checks Nexus. **Um consentimento dado para um âmbito não se estende a um âmbito maior por conveniência** |
| **Acção** | Sem regra nova — padrão positivo; a incógnita fica registada com dono (Eurico). Ver **A4** |

### 5.4 — O contrato escrito entre stories acopladas elimina a re-derivação (e o desalinhamento silencioso)

| Item | Detalhe |
|------|---------|
| **Onde** | 9.3→9.5 (dois sinais offline) e 9.6→9.7 (contrato-formato do backup) |
| **Contexto** | Em ambos os casos, a story a montante fixou por escrito — no `EPIC-9.md` e na própria story — o contrato que a story a jusante consumiria. A 9.5 não re-derivou como distinguir "sem rede" de "erro do servidor"; a 9.7 não re-derivou o formato do ZIP |
| **Lição** | Em cadeias de dependência dentro do mesmo epic, **o output da story a montante deve incluir o contrato explícito que a jusante consome** — não apenas o código que o implementa. Sem isso, a story a jusante re-deriva, e a re-derivação é onde nasce o desalinhamento silencioso entre duas peças que deviam encaixar. É o mesmo princípio do `external-contract-identifiers.md` (A4 Epic 3) aplicado a contratos **internos entre stories**, e complementa o `internal-state-contract-gate.md` (que cobre o estado, não o contrato de formato) |
| **Acção** | Sem regra nova — o padrão já é praticado e está documentado no `EPIC-9.md` §5. Reforço em **A2** (observação) |

### 5.5 — O CR `--base main` no gate de saída continua a não substituir o CR server-side (confirmação, 3.ª vez)

| Item | Detalhe |
|------|---------|
| **Onde** | 9.4 (PR #109) |
| **Contexto** | O gate de saída correu como manda o `cr-base-main-no-gate-saida`. Mesmo assim, o CR server-side apanhou **1 Major real**: as 4 rotas de ícone `ImageResponse` regeneravam a imagem **a cada request** — resolvido com `dynamic:'force-static'` no head `a2261270` |
| **Lição** | Confirmação directa da A1 do Epic 5/6 e da §5.5 da retro Epic 8, agora pela 3.ª vez consecutiva. O `--base main` local é um filtro **a montante obrigatório**, nunca o último. O CR no PR mantém-se parte não-opcional do ciclo de fecho |
| **Acção** | Sem regra nova — regra existente revalidada. Ver **A2** |

### 5.6 — Diagnosticar a causa-raiz certa vale mais do que aplicar o fix esperado (9.11)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 9.11 |
| **Contexto** | O débito `REC-8.6-ISOLAMENTO-TESTES` foi herdado do Epic 8 com um diagnóstico presumido: **contaminação cross-test** por estado global partilhado (MSW handlers/singletons não resetados) — chegou a estar escrito assim no `EPIC-9.md` §5. A 9.11 investigou e concluiu outra coisa: **timing flake sob carga** (o 1.º `await import()` de rotas pesadas esgotava `testTimeout` 5000ms com CPU saturada); o Vitest 2.x já isola por ficheiro, logo contaminação não era possível daquela forma |
| **Lição** | O fix "esperado" (resets de MSW, isolamento forçado, `--no-threads`) teria custado concorrência e complexidade sem tocar a causa. O fix correcto foram **duas linhas** (`testTimeout`/`hookTimeout` 20000ms) com concorrência intacta e zero skips, provado com 5 corridas 2536 PASS/0 FAIL. **Um débito herdado traz consigo o diagnóstico de quem o registou — e esse diagnóstico é uma hipótese, não um facto.** Vale a pena re-diagnosticar antes de implementar, sobretudo quando o débito atravessou um epic |
| **Acção** | Sem regra nova — padrão positivo. Liga-se ao princípio geral de verificar premissas herdadas (mesma família da A1/A2 do Epic 8) |

---

## 6. Lacked — o que faltou

### 6.1 — A afirmação "roadmap MVP completo" não foi reconciliada com o Epic 7 a 4/10

O `EPIC-9.md` declara, no fecho, "**o roadmap MVP (PRD §9) está completo — o Nexus v2 está production-ready**". A primeira metade carece de reconciliação: o roadmap do PRD §9 é `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8 → 9`, e o **Epic 7 (Voice + OCR) está 4/10** — o sub-âmbito Voice fechou 4/4 (7.1-7.4, até 25/06), mas o **sub-âmbito OCR (7.5-7.10) nunca arrancou**, incluindo a 7.9 (foto recibo Telegram → OCR → finança, herdeira da 6.15 diferida no Epic 6).

Nada disto invalida o fecho do Epic 9 nem o estado production-ready: o Epic 9 é o último epic **de hardening**, o Epic 7 corre em paralelo por design (`EPIC-9.md` §2: "Corre em paralelo com Epic 7"), e a coluna "Bloqueia" do Epic 9 está vazia. Mas **"último epic do roadmap" e "roadmap completo" não são a mesma afirmação**, e a diferença entre elas é exactamente 6 stories de OCR.

Isto é decisão de âmbito — não se resolve por reescrita de documentação. — **Acção A1**.

### 6.2 — As incógnitas (c), (d) e (e) atravessaram o epic inteiro sem decisão

O `EPIC-9.md` §10 registou cinco incógnitas que exigiam decisão do Eurico/`@pm`/`@po`. No fecho:

| Incógnita | Estado real no fecho |
|-----------|----------------------|
| (a) Razão do cérebro estar via Anthropic / estado do saldo | **Resolvida de facto, não formalmente.** A verificação da 9.10 confirmou `ANTHROPIC_API_KEY` presente e sem `OPENAI_API_KEY`/`LLM_PROVIDER`, coerente com o cutover deferido. O cérebro está vivo. A decisão explícita de manter/comutar continua por registar |
| (b) Reconciliar o `4e2b1c4`/J-6 | **RESOLVIDA** pela 9.10 — superado; produção segue `main` normalmente |
| (c) FR86-FR96 — funcional vs hardening (GAP-9.6) | **Em aberto** — nunca decidida |
| (d) Destino do backlog de débitos Baixa | **Em aberto** — nunca decidida (herdada da A3 do Epic 8, agora com mais 9 débitos) |
| (e) Estado das vulnerabilidades npm (2 critical `request`/`node-telegram-bot-api`, 11 moderate) | **Em aberto** — nunca confirmada com `npm audit` actual |

**O epic fez o correcto ao não as assumir** (Constitution Art. IV — assumir défice funcional inexistente era o risco R7, e não se materializou). Mas "não assumir" e "deixar sem dono nem gatilho" são coisas diferentes: (d) já vinha por decidir do Epic 8 e (c)/(e) atravessaram o Epic 9 do arranque ao fecho sem nunca terem sido postas ao Eurico como pergunta fechada. — **Acções A3 e A4**.

### 6.3 — As verificações manuais de produção deferidas nunca foram consolidadas

O epic deferiu, com razão registada, verificações que só são possíveis em Chrome/Edge reais sobre produção: AC9 da 9.4 (Lighthouse ≥85 mobile/90 desktop + Add-to-Home-Screen), AC3 do epic (PWA instalável), AC6 da 9.10 (merge real dispara deploy + domínio serve o novo SHA). A estas juntam-se as herdadas de epics anteriores pelo mesmo padrão (AC13 da 4.9, AC6 da 7.3, AC8 da 7.4).

Individualmente cada diferimento é honesto e não-bloqueante. **Em conjunto, formam uma fila de verificação de produção que ninguém agendou** — e o Nexus v2 é declarado production-ready com essa fila por correr. São ~30 minutos numa sessão única. — **Acção A6**.

### 6.4 — O ruído do repositório continua a impor `git add` ficheiro-a-ficheiro em todas as stories

Todas as stories do epic (e todos os handoffs) repetem a mesma instrução: **NUNCA `git add -A`** — por causa dos submódulos permanentemente sujos (`comunidade`, `starter-builder`) e de ~150 ficheiros untracked fora de âmbito (`PO-VALIDATION-*`, `PR-BODY-*`, `.agent/`, `.codex/`, backups `*.backup*`). O débito **REC-REPO-HYGIENE-GITLINKS** (Média, 9.8) aponta para a parte dos gitlinks.

É a única fricção operacional que atravessou o epic inteiro sem nunca ser endereçada, e é a que tem maior probabilidade de causar um commit errado numa sessão distraída. — Entra em **A3** (destino do backlog) com prioridade sobre os Baixa.

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion). `@po` (Pax) **propõe**; `@aiox-master` cria. Antes de propor, verificou-se a cobertura das regras existentes (`production-state-verification-gate`, `internal-state-contract-gate`, `not-tested-trailer-rules`, `separation-of-roles`, `cr-base-main-no-gate-saida`/`coderabbit-integration`, `external-contract-identifiers`, `mock-protocol-fidelity`, `merge-authority`, `handoff-central`, `react-component-test-criteria`).
>
> **O Epic 9 propõe ZERO regras novas.** O epic correu inteiramente dentro das regras em vigor, e a única candidata a regra (§5.2 — hard-stop §8 em stories docs-only) tem **uma única ocorrência**. Legislar sobre um caso único é cerimónia, não governança. A A2 é deliberadamente uma acção de **observação com gatilho**, não de criação. Precedente: o Epic 6 também gerou 0 regras novas.

| # | Acção | Owner | Tipo | Nova regra ou reforço? | Deadline | Done quando |
|---|-------|-------|------|------------------------|----------|-------------|
| **A1** | **Reconciliar o âmbito do MVP com o Epic 7 (4/10).** O `EPIC-9.md` declara o roadmap MVP completo, mas o sub-âmbito OCR (7.5-7.10, 6 stories, incl. a 7.9 herdeira da 6.15) nunca arrancou. Decisão binária do Eurico: **(a)** o OCR faz parte do MVP → o MVP não está completo e o Epic 7 retoma; **(b)** o OCR é reclassificado como pós-MVP → o `EPIC-7.md` e o `EPIC-9.md` são reconciliados para o dizer explicitamente. **Não resolver por reescrita de documentação** — é decisão de âmbito | **Eurico** + `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (âmbito/roadmap) | NÃO | Próxima sessão de decisão | Decisão registada e `EPIC-7.md`/`EPIC-9.md` reconciliados com ela |
| **A2** | **Observar (não legislar) três padrões**: (i) hard-stop §8 em stories **docs-only** — se uma 2.ª story docs-only exceder o §8 por findings de redacção, propor então clarificação ao §8 (§5.2); (ii) **contrato cross-story escrito** entre stories acopladas do mesmo epic — praticado com sucesso 2× (9.3→9.5, 9.6→9.7), candidato a padrão documentado se se repetir (§5.4); (iii) `cr-base-main-no-gate-saida` **revalidada pela 3.ª vez** — mantém-se sem alteração (§5.5) | `@po` (Pax) regista; `@aiox-master` (Orion) avalia se/quando o gatilho disparar | **OBSERVAÇÃO** (gatilho explícito) | **NÃO** — deliberadamente sem regra nova | Contínuo | Os 3 padrões estão registados nesta retro com gatilho; nenhuma regra criada sem 2.ª ocorrência |
| **A3** | **Decidir finalmente o destino do backlog de débitos** — pendente desde a A3 do Epic 6, repetido na A3 do Epic 8, nunca decidido (incógnita (d) do Epic 9). Inventário actual: 8 Baixa + 1 Média do Epic 9 (§4.1), `[GAP-9.10-1]` (§4.2), Baixa dos Epics 3-6, `REC-8.4-CR-1`+`REC-ADR10-PROXY-DRY`, P1.3/P2.x da auditoria. **Prioridade recomendada: `REC-REPO-HYGIENE-GITLINKS` (Média) primeiro** — é a fricção operacional que atravessa todas as stories (§6.4). Destino: story de housekeeping única, ou backlog formal declarado como tal | `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (backlog) | NÃO | Antes de qualquer trabalho novo | Cada débito tem destino explícito (story criada **ou** backlog assumido por escrito) |
| **A4** | **Fechar as incógnitas (a), (c), (e) com resposta ou com dono+gatilho.** (a) registar a decisão explícita de manter Anthropic (a verificação da 9.10 já dá o facto — falta a decisão); (c) FR86-FR96: confirmar quais estão Done (Epic 0) e se o briefing AI (FR86-89) precisa de story funcional própria — **fora de qualquer epic de hardening**; (e) correr `npm audit` actual e confirmar o estado das 2 critical (`request` via `node-telegram-bot-api`) + 11 moderate. Juntar a incógnita da 9.9 AC3 (automação do veto por severidade no monorepo) | **Eurico** + `@pm` (Morgan) + `@devops` (Gage) para (e) | **PROCESSO** (incógnitas) | NÃO | Próxima sessão de decisão | Cada incógnita tem resposta registada **ou** dono + gatilho explícitos |
| **A5** | **Memory log:** actualizar a memória do projecto com Epic 9 = 11/11 Done, waiver 0/11, PRs #101-#113, closure `8a555104`, branch protection ACTIVA (5 contexts), tripla PWA + round-trip backup completos, deploy contínuo formalizado (NFR19 mediana ~1m38s), e referência a esta retrospectiva. Incluir o padrão positivo §5.1 (verificação no arranque → re-scope para formalização) | `@aiox-master` (Orion) ou Eurico | **MEMÓRIA** | NÃO | 01/08/2026 | `MEMORY.md` actualizado com entrada que refere este documento |
| **A6** | **Agendar uma sessão única de verificação manual de produção**, fechando a fila acumulada de AC deferidos: AC9 da 9.4 (Lighthouse ≥85 mobile / 90 desktop + Add-to-Home-Screen em Chrome/Edge), AC3 do epic (PWA instalável), AC6 da 9.10 (merge real → deploy → domínio serve novo SHA), e os herdados AC13 da 4.9, AC6 da 7.3, AC8 da 7.4. Todos sobre `https://imersao.ia.expressia.pt`. Estimativa ~30 min | **Eurico** + `@devops` (Gage) | **PROCESSO** (verificação) | NÃO | Antes de declarar o MVP verificado end-to-end | Resultado de cada AC registado na story respectiva |

### Acções que requerem `@aiox-master` (Orion) — resumo

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A2** | **OBSERVAÇÃO com gatilho** — nenhuma regra criada; avaliar se a 2.ª ocorrência aparecer | **PROPOSTA** — `@po` regista; `@aiox-master` avalia no gatilho |
| **A5** | **MEMÓRIA** — actualizar `MEMORY.md` com o fecho do Epic 9 | **PROPOSTA** — `@aiox-master` ou Eurico |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. **O Epic 9 não propõe nenhuma.** É o 2.º epic (depois do 6) a fechar sem gerar regra nova — sinal de que o corpo de regras cobre o território que o projecto pisa actualmente.

---

## 8. Comparação Epic 1 vs 2 vs 3 vs 4 vs 5 vs 6 vs 8 vs 9

> Epic 7 (Voice + OCR) continua aberto (4/10) e não entra na comparação de fecho — ver §6.1 e A1.

| Métrica | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 | Epic 6 | Epic 8 | **Epic 9** | Tendência |
|---------|--------|--------|--------|--------|--------|--------|--------|------------|-----------|
| Unidades de âmbito | 10 | 10 | 11 | 10 | 13 | 17 | 6 | **11** | — |
| Unidades Done | 10 | 10 | 11 | 10 | 13 | 16/17 | 6/6 | **11/11** | completo |
| PRs mergeados | — | — | — | — | — | — | 6 | **12** | 9.1 dividida em 2 PRs |
| Duração | 7 dias | ~6 dias | ~8 dias | ~9 dias | ~8 dias | ~6 dias | ~6 dias | **~16 dias** | mais longo — 6 Architect Gates |
| Waiver rate | 50% (5/10) | 0% | 9,1% (1/11) | 0% | 0% | 0% (0/16) | 0% (0/6) | **0% (0/11)** | **6.ª série a 0%** |
| Validação/gate GO à 1.ª passagem | — | — | — | 9/10 | 13/13 | 16/16 | 6/6 | **11/11** | mantido |
| Stories que ultrapassaram o hard-stop §8 | 1 | 1 | 4 | 2 | 1 | 0 | 0 | **1 (9.10, autorizada)** | 1.ª desde o Epic 5 |
| Criticals de segurança escapados ao gate | — | 0 | 0 | 0 | 1 (5.11) | 0 | 0 | **0** | mantido |
| ADRs base reabertos | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | mantido |
| Débitos Média/Alta gerados | — | 2 | 0 | 0 | 0 | 0 | 1 (Média) | **1 (Média — repo hygiene)** | estável |
| Contrato externo de protocolo novo | não | não | não | sim (Web Push) | sim (fetch web) | sim (OAuth+Telegram) | sim (OpenAI wire) | **não** (hardening) | — |
| Delta de testes | — | — | +260 | +395 | +513 | +456 | ~+130 | **≥+126** | hardening, não features |
| Correct-course / re-scope | 0 | 0 | 0 | 0 | 0 | 0 | 1 (8.6, **no gate final**) | **1 (9.10, no ARRANQUE)** | **prevenção vs reacção** |
| Acções da retro anterior aplicadas | n/a | A1,A2,A6 | A2,A6,A1 | A3,A4,A6,A1 | A1-A5 (Epic 4) | A1-A6 (Epic 5) | A1-A6 (Epic 6) | **A1,A2,A3,A4,A5,A6 (Epic 8)** | ciclo validado 7× |
| Regras novas geradas | — | — | 1 | 1 | 1 | **0** | 1 (A1) | **0** | 2.º epic sem regra nova |

**Conclusão da comparação:** o Epic 9 é o **epic mais lento por unidade** (~16 dias/11 unidades) e é-o por boa razão — **6 das 11 unidades exigiram Architect Gate com análise formal** (config de CI/deploy/test-runner e estado distribuído em SW/offline/restore destrutivo), a maior densidade de gates de arquitectura de qualquer epic. Mesmo assim fechou **11/11 com 0% de waiver**, mantendo a série a zero pela 6.ª vez consecutiva e sem nenhum Critical de segurança escapado.

A diferença qualitativa face ao Epic 8 está numa única célula da tabela: **o re-scope aconteceu no arranque, não no gate final.** No Epic 8, a premissa evaporada foi descoberta depois de seis dias de trabalho; no Epic 9, a mesma classe de erro foi apanhada por um comando antes de qualquer investimento — porque a regra escrita na retrospectiva anterior obrigou a verificar. **É a primeira validação empírica de que o ciclo retro → regra → prevenção fecha.**

O que o epic entregou de facto: **a tripla PWA completa** (SW + instalabilidade + offline honesto), o **round-trip de backup** (export + restore com anti-silent-loss ratificado por execução), **CI bloqueante com branch protection activa** (5 required contexts), **cobertura ≥60% nos três packages core**, **E2E do caminho crítico** e o **deploy contínuo medido e documentado**. Mais dois bugs latentes de "mentira silenciosa" corrigidos de passagem (§3.6). O que ficou por fechar não é qualidade — é **decisão de âmbito**: o Epic 7 a 4/10 face à declaração de "roadmap MVP completo" (A1), o backlog de débitos sem destino pela terceira retrospectiva consecutiva (A3), e três incógnitas que atravessaram o epic sem serem postas ao Eurico como pergunta fechada (A4).

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — push do closure commit desta retrospectiva (docs-only). O closure da Story 9.10 (`8a555104`) já está em `main`; esta retrospectiva é um commit docs adicional. **`git add` ficheiro-a-ficheiro** (§6.4).
2. **`@aiox-master` (Orion) ou Eurico** — executa **A5**: actualiza `MEMORY.md` com Epic 9 = 11/11 Done, waiver 0/11, e o padrão positivo §5.1.
3. **Eurico + `@pm` (Morgan) + `@po` (Pax)** — executam **A1** (reconciliação MVP ↔ Epic 7 4/10). **É a decisão que condiciona todo o trabalho seguinte** — determina se o próximo passo é `@sm *draft 7.5` (OCR) ou trabalho pós-MVP.
4. **`@pm` (Morgan) + `@po` (Pax)** — executam **A3** (destino do backlog de débitos, com `REC-REPO-HYGIENE-GITLINKS` primeiro) e **A4** (fechar incógnitas (a)/(c)/(e) + a da 9.9 AC3).
5. **Eurico + `@devops` (Gage)** — executam **A6**: sessão única de verificação manual de produção (~30 min) sobre `https://imersao.ia.expressia.pt`, fechando a fila de AC deferidos acumulada desde a 4.9.
6. **`@po` (Pax)** — mantém **A2** em observação; nenhuma regra criada sem 2.ª ocorrência do padrão.

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Acções A1-A6 com owner + tipo + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, sem quality gate sobre si mesma. Regista que 11/11 unidades respeitaram executor ≠ gate, incl. `@devops` executor → `@architect`/`@qa` gate nas 9.8/9.9/9.10 — OK |
| `merge-authority.md` | Regista que os 12 merges (PRs #101-#113) foram feitos pelo agente (`@devops`/`@aiox-master`), **zero merges manuais pedidos ao Eurico** — OK |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master`; `@po` propõe, não cria. **Este epic não propõe nenhuma regra** — OK |
| `production-state-verification-gate.md` | A regra é o tema central de §3.1/§5.1; a sua aplicação na 9.10 foi verificada contra o `EPIC-9.md` §10 (tabela dos 4 itens) — OK |
| `handoff-central.md` (amenda A2 Epic 8) | O handoff de 16/07 (stale, 16 dias) foi **cruzado com o estado real** (`git log`, `git status`, sincronia com `origin`) antes de esta retrospectiva arrancar — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivam de `git log --format="%h %ai %s"` real (PRs #101-#113 + closures), `EPIC-9.md` (§5 tabela de stories, §10 fecho, §7 GAPs, incógnitas a-e, riscos R1-R8), `EPIC-7.md` (estado 4/10) e `retrospectives/EPIC-1..8`. Onde uma métrica não existia nas fontes, **não foi inventada**: o total de testes pós-9.7 não é citado (só o delta +13 que a story declara), e as contagens intermédias por story não desagregadas não foram estimadas. A incógnita (a) é classificada como "resolvida de facto, não formalmente" — não como resolvida |

---

**Documento criado por:** Pax (`@po`) em 01/08/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #101-#113 + closures 9.11→9.10 + closure final `8a555104`); `git status`/`git rev-parse` (sincronia `main` ↔ `origin/main` em `8a555104`)
- `imersao-tools/nexus/docs/EPIC-9.md` (estado FECHADO 11/11, §5 tabela de 12 linhas/11 unidades + nota de numeração 9.1a/9.1b, §6 AC de epic, §7 GAP-9.1 a GAP-9.6, §8 lições aplicadas + hard-stop, §9 quality gates, §10 fecho + bloco "ÚLTIMA UNIDADE" + incógnitas (a)-(e) + riscos R1-R8)
- `imersao-tools/nexus/docs/EPIC-7.md` (estado "Em curso — 4/10", sub-âmbito Voice 4/4, OCR 7.5-7.10 por iniciar) — para §6.1/A1
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260716-EPIC-9-FECHADO-11de11-nexus-v2-production-ready.md` (estado do repo, decisões a não reabrir, temas sugeridos para esta retro)
- `imersao-tools/nexus/docs/retrospectives/EPIC-1/2/3/4/5/6/8-retrospective.md` (formato e baseline comparativa da §8)
- `.claude/rules/` (production-state-verification-gate, internal-state-contract-gate, not-tested-trailer-rules, separation-of-roles, merge-authority, handoff-central, external-contract-identifiers, output-format-standards, language-standards, workspace-governance) — verificadas para distinguir "regra nova" de "reforço/observação"
