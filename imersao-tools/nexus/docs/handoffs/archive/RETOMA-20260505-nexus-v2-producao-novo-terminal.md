# RETOMA — Nexus v2 em produção, continuar em novo terminal

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (lê primeiro)

Em 04-05/05/2026 fechei o **Epic 0 do Nexus v2** completo: do PRD à produção. App está LIVE em **https://imersao.ia.expressia.pt** com login funcional. PR #2 mergeada em `main`. Há 4 stories de débito técnico (F.1, F.2, F.3 ✅ DONE, F.4) registadas em `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` que devem ser endereçadas no Epic 1.

Esta sessão acumulou frustração com PowerShell escape e bcrypt — o handoff abaixo evita repetir esses erros.

**Próximo passo natural:** invocar `@sm` para criar a primeira story do Epic 1 (chat agent + tool calling em cima do proxy Anthropic da Story 0.5). Mas primeiro, em sessão dedicada, faz sentido fechar **F.4** (Google link 404) porque é UX-bloqueador no primeiro login.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 — sistema de continuidade pessoal Eurico |
| Localização | `imersao-tools/nexus/` |
| Sessões | 04/05/2026 + 05/05/2026 |
| Agente que sai | `claude-code` orquestrador (esta sessão) |
| Agente que entra | Eurico em novo terminal — depois invoca AIOX consoante tarefa |
| Estado | **PRODUÇÃO LIVE** · Epic 0 fechado · Epic 1 pronto a arrancar |

---

## Estado actual exacto

### Produção
- **URL:** https://imersao.ia.expressia.pt
- **Status:** ● Ready (deploy `imercao-ia-2m33qq6rb` em produção)
- **Login:** funciona com a password que escolheste em 04/05/2026 (`NexusAlgarve2025` no momento — podes mudar)
- **Endpoints validados:**
  - `GET /login` → 200
  - `GET /` → 307 → `/login` (middleware OK)
  - `POST /api/auth/login` com password correcta → 200 + `Set-Cookie nexus_session` (Max-Age 30d)
  - `POST /api/auth/login` com password errada → 401

### Bugs conhecidos em produção
- `/api/google/oauth/google` → **404** (Story F.4) — clicar no passo Google do OnboardingModal leva aqui. **Workaround:** usar botão Skip/✗ ou ir directamente a `/`.

### Vercel
- **Project:** `imercao-ia-pt` (`prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU`) sob `euricojsalves-4744s-projects`
- **Root directory:** `imersao-tools/nexus/v2`
- **Framework:** Next.js 15
- **SSO protection:** desactivada (acesso público a previews)
- **Region:** `fra1` (Frankfurt)
- **Auto-deploy:** ON (push para `main` dispara deploy)
- **Env vars (8 em production):**
  - `ANTHROPIC_API_KEY` (sk-ant-...)
  - `NEXUS_PASSWORD_HASH` (bcrypt $2b$10$...)
  - `SESSION_SECRET` (96 hex chars)
  - `KV_REST_API_URL` + `KV_REST_API_TOKEN` + `KV_REST_API_READ_ONLY_TOKEN` + `KV_URL` + `REDIS_URL` (Upstash KV ligado via Vercel marketplace)

### Git
- **Branch principal:** `main`
- **Último commit relevante:** `1cbe2f3a chore(nexus-v2): F.3 done — Vercel root directory configured via CLI`
- **PR #2:** MERGED — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2
- **Branch `feat/nexus-v2-epic-0`:** apagada do remoto (squash merge fechou-a)

### Stories
- **Epic 0:** 10/10 stories em `imersao-tools/nexus/docs/stories/completed/0.{1..10}.story.md` com status **Done**
- **Epic 1:** ainda não draftado

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-nexus-v2-producao-novo-terminal.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Como continuar em novo terminal — passo a passo

### Passo 1 — Abrir terminal no sítio certo

**Para qualquer trabalho no Nexus, abre o terminal aqui:**

```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

NÃO abras dentro de `imersao-tools/nexus/v2/` para gerir projecto Vercel — o Vercel CLI lê `.vercel/project.json` da raiz do repo. Se precisares de correr `npm install`/`npm run dev`/`npm test` aí dentro, faz `cd imersao-tools\nexus\v2` SÓ para esses comandos.

### Passo 2 — Iniciar Claude Code

```powershell
claude
```

(ou abrir VSCode/IDE com Claude Code já aberto e activar conversação.)

### Passo 3 — Mensagem inicial ao Claude

Cola este texto exacto na primeira mensagem para o Claude carregar o contexto rapidamente:

```
Estou a continuar trabalho no Nexus v2 (sistema pessoal Eurico, em produção em https://imersao.ia.expressia.pt). Lê primeiro o handoff `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-nexus-v2-producao-novo-terminal.md` para contexto completo. Depois espera a minha próxima instrução.
```

O Claude vai ler o handoff e ficar pronto. Não percas tempo a re-explicar.

---

## Que agente AIOX chamar consoante tarefa

| O que queres fazer | Agente | Comando |
|--------------------|--------|---------|
| Criar 1ª story do Epic 1 | `@sm` (River) | `@sm *draft` ou `@sm *create-story` |
| Validar story criada | `@po` (Pax) | `@po *validate-story-draft 1.1` |
| Implementar uma story | `@dev` (Dex) | `@dev *develop 1.1` |
| QA gate em story implementada | `@qa` (Quinn) | `@qa *qa-gate 1.1` |
| Commit + push + PR | `@devops` (Gage) | `@devops *push` |
| Decisão arquitectural nova | `@architect` (Aria) | `@architect *decide` |
| UX/UI specs novos | `@ux-design-expert` (Uma) | `@ux-design-expert *spec` |
| Migration / schema DB | `@data-engineer` (Dara) | `@data-engineer *migration` |
| Pesquisa/análise externa | `@analyst` (Alex) | `@analyst *research <topic>` |
| Visão multi-projecto | `@monster` | `@monster *status` |
| Não sabes próximo passo | `@monster` | `@monster *next` |

**Regra de ouro:** se a tarefa for "implementar código" → `@dev`. Se for "fazer push" → `@devops`. Se for "criar story" → `@sm`. NUNCA misturar.

---

## Próximos passos sugeridos (escolhe um)

### Opção A — Fechar F.4 primeiro (recomendado, 30min)
O bug do Google link 404 vai irritar-te sempre que entrares no Nexus. Fix rápido:

```
@sm — cria a story F.4 do EPIC-0-FOLLOW-UP-DEBT.md como story formal `0.11.story.md`. Eu prefiro Opção B (disable temporário do passo Google no OnboardingModal).
```

Depois `@po` valida → `@dev` implementa → `@qa` gate → `@devops` push.

### Opção B — Arrancar Epic 1 já
Story 0.5 (proxy Anthropic Edge SSE) desbloqueou todas as features chat-first. Epic 1 trata de:
- Chat agent funcional (multi-turn)
- Tool calling (39 tools registadas no Tool Registry)
- Morning Briefing real (em vez de mensagem placeholder)
- Tarefas/finanças/recibos via chat

```
@sm — arranca Epic 1 do PRD-NEXUS-V2.md §10. Cria a story 1.1 (chat agent base com SSE streaming).
```

### Opção C — Fechar débito Epic 0 todo (3-5h)
F.1 (coverage 60%+) + F.2 (re-activar 2 e2e tests) + F.4 (Google link). `@sm` cria 3 stories em paralelo.

---

## Acessos rápidos

| Recurso | URL |
|---------|-----|
| Nexus produção | https://imersao.ia.expressia.pt |
| Vercel dashboard | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt |
| Vercel env vars | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt/settings/environment-variables |
| Vercel deployments | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt/deployments |
| GitHub repo | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt |
| GitHub PR #2 (mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2 |
| Anthropic Console | https://console.anthropic.com/settings/keys |
| Upstash console (KV) | https://console.upstash.com |

---

## Comandos úteis para cabeça-fria

### Gerir password do Nexus
```powershell
# Gerar novo hash bcrypt (usa o script ficheiro, NÃO command-line escape):
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\.tmp-bcrypt
node hash.js
# Escreve a password (visível na consola — máquina pessoal, OK), Enter, copia hash

# Substituir no Vercel:
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
vercel env rm NEXUS_PASSWORD_HASH production --yes
vercel env add NEXUS_PASSWORD_HASH production --sensitive
# Cola hash → Enter

# Redeploy:
vercel --prod --archive=tgz --yes
```

### Verificar estado produção
```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
vercel ls imercao-ia-pt          # deploys recentes
vercel env ls                     # env vars production
curl -I https://imersao.ia.expressia.pt/login   # smoke test
```

### Trabalho local Next.js
```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\nexus\v2
npm install                       # instalar deps (1ª vez)
npm run dev                       # localhost:3000
npm test                          # Vitest
npm run lint                      # ESLint
npm run typecheck                 # TS strict check
```

---

## Anti-padrões aprendidos nesta sessão (NÃO REPETIR)

| Erro cometido | Causa | Como evitar |
|---------------|-------|-------------|
| `node -e "..."` longo com aspas duplas em PowerShell | PowerShell partiu o comando em 2 linhas, deu SyntaxError "Expected ',', got 'nd'" | **Sempre criar script `.js` ficheiro** (`hash.js`) e correr `node script.js`, nunca `node -e "..."` longo |
| Passar password como `process.argv[1]` ao node | PowerShell expande `$`, remove aspas, pode alterar a string | **Pipe via stdin** (`$plain | node ...`) ou ler com `readline` no script |
| `Read-Host -AsSecureString` + conversão NetworkCredential | Pode introduzir caracteres invisíveis ao passar para argv | Usar `readline` directo no node (visível na consola é OK em máquina pessoal) |
| `vercel --prod` sem `--archive=tgz` | Repo tem 16 353 ficheiros, limite Vercel 15K | **Sempre `vercel --prod --archive=tgz --yes`** |
| `vercel env rm` sem `--yes` em pipe | Pediu confirmação mas pipe `printf 'y\n'` confundiu CLI | **Usar flag `--yes`** directamente |
| `O` vs `0` em hash bcrypt copiado | Fonte do terminal pode confundir | **Sempre copiar do terminal directamente**, nunca digitar manualmente |
| Apagar env var antes de gerar hash novo | Deixou o sistema sem auth se a geração falhasse | **Gerar hash novo PRIMEIRO**, validar com `bcrypt.compareSync`, só depois rm + add |
| Confiar no comando "à primeira" | Por economia, gastei mais tempo a debugar | **Validar localmente** com `bcrypt.compareSync(plain, hash) === true` antes de meter em produção |

---

## Documentos de referência (lê só se precisares)

| Doc | Quando ler |
|-----|------------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (675 linhas) | Antes de criar story Epic 1 — tem 96 FRs, 24 NFRs, 8 Epics |
| `imersao-tools/nexus/docs/architecture-v2.md` (1164 linhas) | Antes de tomar decisão técnica nova — tem 5 ADRs imutáveis |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` (1281 linhas) | Antes de mexer em UI — tem 5 UX-ADRs imutáveis |
| `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` | Antes de Epic 1 arrancar — F.1, F.2, F.4 pendentes |
| `imersao-tools/nexus/docs/stories/completed/0.{1..10}.story.md` | Para ver como uma story Done parece (referência futura) |
| `imersao-tools/nexus/docs/QA-GATE-STORY-0.{1..10}.md` | Para ver como qa-gates parecem |
| `.claude/rules/handoff-location.md` | Antes de criar handoff novo |
| `.claude/rules/agent-authority.md` | Antes de invocar agente errado |
| `.claude/rules/workspace-governance.md` | Antes de criar pasta nova no repo |

---

## NÃO REABRIR (decisões fechadas)

- 5 ADRs Architecture v2 (Edge/Node split, Dexie 4, Tiptap 2, Vitest+MSW, Tool Registry com Zod)
- 5 UX-ADRs Front-end Spec v2 (chat permanente metade esquerda, Morning Briefing pinned, ToolCard inline, Markets Widget topo sidebar, vistas como modais fullscreen)
- Domínio produção: `imersao.ia.expressia.pt`
- Repo layout: `v2/` paralelo a `src/` v1 (NÃO destruir v1)
- Auth: single-user com password gate (não Vercel SSO, não OAuth — decisão original PRD)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-nexus-v2-producao-novo-terminal.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `claude-code` orquestrador (não persona AIOX específica — sessão multi-agente)
DATA: 05/05/2026
