# Runbook — Deploy Contínuo Vercel (preview por PR + produção automática em `main`)

**Projecto:** Nexus v2
**Produção:** `https://imersao.ia.expressia.pt`
**Região Vercel:** `fra1` (Frankfurt) — confirmada na plataforma em 15/07/2026 (ver §2)
**Conta Vercel:** `euricojsalves-4744's projects` (`team_Z7HN1UF28iHpUxCnZ4gT7wMF`, Hobby tier)
**Projecto Vercel:** `imercao-ia-pt` (`prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU`)
**Story:** 9.10 (Epic 9 — hardening/operacionalização, NFR19/NFR20, PRD §10)
**Autoridade de deploy:** `@devops` (Gage) — autoridade exclusiva de operações Vercel/git remote
**Autoridade de decisão de negócio (estratégia de deploy):** Eurico
**Última actualização:** 15/07/2026

---

## 1. Contexto

O Nexus v2 está em produção contínua em `https://imersao.ia.expressia.pt` desde 04/05/2026 (Epic 0). O deploy contínuo **já existe e funciona** via **Git Integration nativa da Vercel** — este runbook **formaliza e documenta** o pipeline que já está a correr, não o cria de raiz (Epic 9 é hardening, não FR funcional novo).

A estratégia de deploy foi confirmada pelo Eurico em 15/07/2026: **Git Integration nativa com auto-promote de `main`** — exactamente a configuração já em vigor. Explicitamente **não** se desenha migração para um workflow GitHub Actions gated (ex: `vercel deploy --prod` disparado só após os checks do CI passarem). A automação nativa da Vercel já dá o comportamento desejado, porque `main` está protegido por branch protection (Stories 9.8/9.9): um commit só chega a `main` depois de um PR passar pelo CI bloqueante. Não há lacuna de gating a fechar.

Este runbook serve dois propósitos operacionais:
1. Documentar como o deploy funciona, para que qualquer agente ou o Eurico saiba o fluxo exacto (push → build → produção).
2. Documentar o procedimento de **rollback** para incidentes de produção (reversão rápida via plataforma).

> **Rastreabilidade:** cada afirmação factual deste runbook tem fonte — um comando corrido contra a plataforma Vercel (API REST / CLI, evidência recolhida em 15/07/2026) ou uma secção de `architecture-v2.md`. Não há suposição.

---

## 2. Configuração do projecto (referência — já correcta, não alterar)

[Source: `architecture-v2.md` §13.2 + verificação directa da plataforma Vercel em 15/07/2026]

| Item | Valor | Fonte |
|------|-------|-------|
| Vercel Account / Team | `euricojsalves-4744's projects` (`team_Z7HN1UF28iHpUxCnZ4gT7wMF`) | `architecture-v2.md` §13.2 |
| Project Name / ID | `imercao-ia-pt` (`prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU`) | Vercel API |
| GitHub repo | `DaSilvaAlves/ecosistema-ia-avancada-pt` | Git Integration (`link.gitType=github`) |
| **Production Branch** | **`main`** (`productionBranch=main`) | Git Integration — define `main` como branch de produção. A prova de que o auto-deploy on-push está de facto ligado é a evidência do §3 (os deployments de produção consecutivos `GIT:main@sha`), não este campo por si só |
| **Root Directory** | **`imersao-tools/nexus/v2`** | Crítico — sem isto o build falha a tentar compilar a raiz do monorepo |
| Framework Preset | `nextjs` (auto-detectado) | Lê `next.config.ts` na root directory |
| Build Command | `npm run build` | `imersao-tools/nexus/v2/vercel.json` |
| Install Command | `npm install` | `imersao-tools/nexus/v2/vercel.json` |
| **Região** | **`fra1` (Frankfurt)** | `vercel.json` `regions:["fra1"]` **e** deployment de produção activo (`regions:["fra1"]` na API v13, 15/07/2026) |
| Function timeout | 300s default | `architecture-v2.md` §13.2 |

> **Nota de divergência documental (resolvida neste commit, documentação apenas — não é acção de deploy):** `architecture-v2.md` §13.2 registava `Functions region: iad1 (Washington)` como a config **observada em 04/05/2026**. A região **actual** confirmada na plataforma em 15/07/2026 é `fra1` (Frankfurt) — declarada em `imersao-tools/nexus/v2/vercel.json` (`regions:["fra1"]`) e confirmada no deployment de produção activo via Vercel API v13. A entrada `iad1` era histórica/desactualizada; a região real é `fra1`. Esta story documenta a região real aqui e não altera `vercel.json` (AC7). A divergência documental **foi resolvida neste mesmo commit da Story 9.10**: o `@architect` corrigiu a entrada de `architecture-v2.md` §13.2 (`iad1 (Washington)` → `fra1 (Frankfurt)`, com nota datada 15/07/2026) no gate de saída.

---

## 3. Como funciona — fluxo de deploy de produção

O deploy de produção é **totalmente automático**. Nenhum passo manual (`vercel --prod`, redeploy no Dashboard) é necessário no fluxo normal.

```
PR aprovado + CI verde
        │
        ▼
merge/push a `main`  ──────────────────────────────┐
        │                                          │
        ▼                                          │
Vercel Git Integration deteta o commit em `main`   │  (webhook GitHub → Vercel)
        │                                          │
        ▼                                          │
build automático:                                  │
  • Root Directory: imersao-tools/nexus/v2         │
  • Install: npm install                           │
  • Build: npm run build (Next.js)                 │
  • Região de funções: fra1                        │
        │                                          │
        ▼                                          │
estado READY  ─────────────────────────────────────┘
        │
        ▼
auto-promote a produção (sem passo manual)
        │
        ▼
`imersao.ia.expressia.pt` serve o novo SHA
```

**Evidência de que o auto-deploy on-push está ligado** (15/07/2026): os deployments de produção mais recentes são **todos** `GIT:main@<sha>`, cada um correspondendo a um merge a `main`. Amostra (target=production, API v6):

| Ordem | SHA | Story | Estado | Timestamp (UTC) |
|-------|-----|-------|--------|-----------------|
| 1 (mais recente) | `bab96e4` | 9.7 (close) | READY | 2026-07-12T19:25:39Z |
| 2 | `f6ac9f9` | 9.7 | READY | 2026-07-12T15:24:06Z |
| 3 | `6ac0a42` | 9.6 (close) | READY | 2026-07-08T20:59:12Z |
| 4 | `08e9c17` | 9.6 | READY | 2026-07-08T20:42:46Z |
| 5 | `ee2c620` | 9.5 (close) | READY | 2026-07-08T18:57:09Z |

Não há deployments de produção com origem manual/CLI recente — todos têm `meta.githubCommitRef=main`, provando a Git Integration nativa.

Aliases de produção activos (deployment `bab96e4`, API v13): `imersao.ia.expressia.pt` (domínio primário), `ia-avancada-pt.vercel.app`, `imercao-ia-pt-euricojsalves-4744s-projects.vercel.app`, `imercao-ia-pt-git-main-euricojsalves-4744s-projects.vercel.app`.

---

## 4. Preview deploys por PR

Cada PR (branch != `main`) **normalmente gera** automaticamente um **preview deploy** com alias próprio derivado do nome da branch, isolado da produção (o preview não é uma garantia absoluta — pode ser suprimido por `.vercelignore`, limites de plano ou filtros de deploy). Isto permite validar visualmente uma story antes do merge.

**Evidência (15/07/2026):** 12 preview deployments nos últimos 30 registos. Exemplo concreto:

| Item | Valor |
|------|-------|
| Branch | `feat/9.7-restore-import-zip` (Story 9.7, PR #112) |
| Deployment | `imercao-ia-6i08y7yre-euricojsalves-4744s-projects.vercel.app` |
| SHA | `43f3fcd` |
| Estado | READY |
| Alias git-branch | `imercao-ia-pt-git-feat-97-r-b63da8-euricojsalves-4744s-projects.vercel.app` |

> Nota: a Vercel trunca nomes de branch longos no alias git e acrescenta um hash curto (por isso `feat-97-r-b63da8` em vez do nome completo). O alias é estável durante a vida do PR e é sempre o **último** commit da branch que fica servido.

Os previews são públicos (`ssoProtection=null`, `architecture-v2.md` §13.2) — não exigem login Vercel para inspeccionar.

---

## 5. Procedimento de rollback (NFR20 — <30s)

O rollback é **nativo da plataforma** e reverte a produção para um deployment anterior já construído (sem novo build). Mapeado a NFR20 (`PRD-NEXUS-V2.md` L305: "Rollback Vercel <30s (UI nativa)"; `architecture-v2.md` §13.1 L997). Este runbook **documenta** o procedimento; não implementa rollback novo.

### 5.1 Via Vercel Dashboard (Instant Rollback — via recomendada)

> **Limitação do plano Hobby (confirmada em `vercel.com/docs/instant-rollback`):** o **Instant Rollback** reverte a produção **apenas para o deployment de produção imediatamente anterior** — **não** permite escolher um SHA antigo arbitrário. Para regressar a um deployment mais antigo do que o imediatamente anterior, é preciso **Promote to Production** desse deployment concreto (Dashboard) ou `vercel promote <url>` (CLI, §5.2), que refaz a atribuição de alias sem rebuild.

1. Abrir o Dashboard: **Vercel → projecto `imercao-ia-pt` → Deployments**.
2. Identificar o deployment de produção **imediatamente anterior** (o penúltimo `GIT:main@sha` em estado READY) — é esse o alvo do Instant Rollback. Se o "bom conhecido" for mais antigo do que o imediatamente anterior, usar antes **Promote to Production** sobre esse deployment concreto.
3. No deployment de produção **actual**, abrir o menu de contexto (`⋯`) → **Instant Rollback** (repõe o imediatamente anterior). Para um alvo mais antigo, usar **Promote to Production** sobre o deployment escolhido.
4. Confirmar. A operação é **instantânea** (troca de alias, sem rebuild) — cumpre o NFR20 <30s.
5. Verificar que `imersao.ia.expressia.pt` volta a servir o SHA pretendido.

> **AVISO pós-rollback (confirmado em `vercel.com/docs/instant-rollback`):** depois de um Instant Rollback, a Vercel **desliga o auto-assign do domínio de produção**. Enquanto o rollback estiver activo, os merges seguintes a `main` **deixam de republicar automaticamente** a produção (o build continua a correr, mas o domínio de produção não é reatribuído ao novo deployment). Para retomar o auto-deploy normal é obrigatório fazer **Undo Rollback** no Dashboard ou `vercel promote <novo-deployment-url>` do deployment desejado. Não esquecer este passo — caso contrário, um fix mergeado a `main` após o rollback parece "não fazer deploy".

### 5.2 Via CLI

```bash
# Reverter a produção para o deployment de produção imediatamente anterior
vercel rollback

# OU promover explicitamente um deployment concreto (por URL) a produção
vercel promote <deployment-url>
```

Ambos os comandos operam sobre deployments **já construídos** (troca de alias), pelo que são quase instantâneos — não desencadeiam novo build. Requerem CLI autenticado na conta/team correctos.

### 5.3 Nota sobre o alcance do rollback

O rollback reverte o **código servido** (o build anterior). **Não** reverte:
- alterações de **env vars / secrets** (essas persistem no projecto; se a regressão veio de uma env var, corrigir a env var e redeployar);
- alterações de **dados** do utilizador (IndexedDB local / KV / Redis) — o rollback é só do frontend/serverless code.

Se a regressão foi causada por uma env var, ver o procedimento de flip de env vars em `runbooks/cutover-openai-rollback.md` §4 (padrão análogo).

---

## 6. Env vars de produção (nomes, sem valores)

[Source: verificação `vercel env ls --environment production`, 15/07/2026 — nomes apenas]

Os **valores** vivem **exclusivamente no Vercel Dashboard** (Settings → Environment Variables) e **nunca** neste runbook, em commits, ou em chat (NFR5 / `not-tested-trailer-rules.md`). Nomes confirmados em produção:

| Nome | Natureza |
|------|----------|
| `ANTHROPIC_API_KEY` | server-only — provider de inferência activo |
| `KV_*` (conjunto Vercel KV) | server-only — cache/estado KV |
| `REDIS_URL` | server-only — Redis |
| `SESSION_SECRET` | server-only — assinatura de sessão/OAuth state |
| `NEXUS_PASSWORD_HASH` | server-only — auth single-user |
| `CRON_SECRET` | server-only — protecção dos endpoints de cron |
| `WEB_PUSH_VAPID_PRIVATE` | server-only — chave privada VAPID (Web Push) |
| `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` | pública (browser) — chave pública VAPID |

> **Ausência intencional:** **não** existe `OPENAI_API_KEY` nem `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER` em produção — consistente com o Epic 8 (cutover OpenAI deferido on-demand, não activado; provider activo = Anthropic). Ver `runbooks/cutover-openai-rollback.md` para o procedimento de cutover, se algum dia for accionado.

---

## 7. Medição de duração de build+deploy (NFR19 — <2 min)

[Source: Vercel API v6 `deployments` (`buildingAt`/`ready`/`createdAt`), 15/07/2026 — 5 deployments de produção mais recentes]

NFR19 (`PRD-NEXUS-V2.md` L304; `architecture-v2.md` §15 L1095): "Deploy `main` → Vercel <2 min" (<120s).

| # | SHA | Story | `created → ready` | `build → ready` | Cumpre <120s? |
|---|-----|-------|-------------------|-----------------|---------------|
| 1 | `bab96e4` | 9.7 | 96,7s (1m37s) | 95,3s (1m35s) | Sim |
| 2 | `f6ac9f9` | 9.7 | 98,7s (1m39s) | 97,7s (1m38s) | Sim |
| 3 | `6ac0a42` | 9.6 | 133,2s (2m13s) | 129,8s (2m10s) | **Não** (outlier) |
| 4 | `08e9c17` | 9.6 | 99,9s (1m40s) | 98,0s (1m38s) | Sim |
| 5 | `ee2c620` | 9.5 | 93,0s (1m33s) | 91,4s (1m31s) | Sim |

**Veredicto:** 4 dos 5 deployments cumprem o NFR19 (<120s), com mediana de `build→ready` ≈ 97,7s (~1m38s) — folgadamente dentro do alvo. **Um outlier** (`6ac0a42`, 2m10s de build) excede a fronteira dos 2 min.

Este outlier é uma **observação factual de infraestrutura Vercel** (o build excedeu 2 min), não uma regressão de código a corrigir nesta story (AC5). A **causa** do excesso **não foi medida/instrumentada** — a hipótese mais provável é **variabilidade da fila/recursos** da plataforma Vercel (Hobby tier) e não uma alteração no código do Nexus, dado que o código-fonte dos 5 deployments é comparável (todos stories de docs/features pequenas do Epic 9). Fica registado como **hipótese**, não como causa confirmada por instrumentação. A recomendação, se a fronteira dos 2 min se tornar crítica, é reduzir o tempo de build (cache de dependências / upgrade de tier), fora do âmbito desta story.

---

## 8. Checklist de verificação manual pós-merge (AC6 — deferida a produção)

Padrão de verificação só-de-produção (AC13 da 4.9 / AC9 da 9.4 / AC6 da 7.3). Não bloqueia o merge da Story 9.10 — é confirmação operacional contínua, a executar no **próximo merge real a `main`** após a 9.10, pelo Eurico + `@devops`:

- [ ] Após o merge de um PR a `main`, abrir **Vercel → Deployments** e confirmar que um novo deployment de produção `GIT:main@<sha>` **dispara automaticamente** (sem acção manual).
- [ ] Confirmar que o deployment atinge estado **READY** dentro do tempo medido no §7 (mediana ~1m38s; alerta se exceder ~2m30s de forma recorrente).
- [ ] Aceder a `https://imersao.ia.expressia.pt` e confirmar que serve o **novo SHA** (ex: uma alteração visível da story mergeada está presente).
- [ ] Registar o SHA + duração observada como evidência do ciclo (opcionalmente na story ou num handoff).

---

## 9. Contacto de escalação

| Papel | Contacto |
|-------|----------|
| Dono do produto / autoriza estratégia e rollback | Eurico — `euricojsalves@gmail.com` |
| Executor de deploy/rollback/redeploy | `@devops` (Gage) — autoridade exclusiva Vercel/git remote |

Escalar ao Eurico se: um deploy de produção falhar (estado ERROR persistente), a duração de build degradar sistematicamente muito acima de 2 min, ou houver dúvida sobre executar um rollback (secção 5).

---

## 10. Referências

| Referência | Onde |
|------------|------|
| Config base do projecto Vercel | `architecture-v2.md` §13.1 / §13.2 |
| NFR19 (deploy <2min) / NFR20 (rollback <30s) | `PRD-NEXUS-V2.md` L304-305; `architecture-v2.md` §15 L1095-1096 |
| Procedimento de flip de env vars (cutover/rollback de provider) | `runbooks/cutover-openai-rollback.md` |
| Regra de evidência para config de deploy | `.claude/rules/not-tested-trailer-rules.md` |
| Verificação de estado de produção no arranque | `.claude/rules/production-state-verification-gate.md` |
| Story de origem deste runbook | `docs/stories/active/9.10.story.md` |
