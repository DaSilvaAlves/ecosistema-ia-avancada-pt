# RETOMA — Nexus v2 — Epic 0 — Deploy Produção FECHADO

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 2026-05-04
**Agente responsável:** Gage (devops)
**Projecto:** `imersao-tools/nexus/v2/`
**Estado Epic 0:** **100% FECHADO EM PRODUÇÃO**

---

## TL;DR

Nexus v2 está LIVE em produção. Build READY, alias custom configurado, todos os smoke tests passam (login 200, redirect 307, login API 401 sem auth válido). Commit local `1cbe2f3a` foi pushed para `main`. Epic 0 oficialmente fechado.

---

## URL Produção

| Endpoint | URL |
|----------|-----|
| **Domínio principal (alias)** | https://imersao.ia.expressia.pt |
| Deployment URL Vercel | https://imercao-ia-bo1jjnuby-euricojsalves-4744s-projects.vercel.app |
| Deployment ID | `dpl_ELxFZo1Gc5qSaZwDhxGF5p1wZia5` |
| Status | ● Ready (production) |
| Build duration | 55s |

> Nota: O domínio `nexus-eurico.vercel.app` referido na missão **não existe** no projecto. O alias real configurado é `imersao.ia.expressia.pt` (custom domain).

---

## Status Checks (3/3 PASS)

| Check | Comando | Esperado | Resultado |
|-------|---------|----------|-----------|
| Login renders | `curl -I https://imersao.ia.expressia.pt/login` | 200 | **200 OK** |
| Root redirect | `curl -I https://imersao.ia.expressia.pt/` | 307 → /login | **307 → /login** |
| Login API auth | `POST /api/auth/login` com password incorrecta | 401 | **401 + `{"error":"Password incorrecta. Verifica no Vercel."}`** |

---

## Env Vars em produção (8/8 confirmadas)

| Variável | Origem |
|----------|--------|
| `ANTHROPIC_API_KEY` | Manual |
| `SESSION_SECRET` | Manual |
| `NEXUS_PASSWORD_HASH` | bcrypt da password do Eurico |
| `KV_REST_API_URL` | Auto via Upstash |
| `KV_REST_API_TOKEN` | Auto |
| `KV_REST_API_READ_ONLY_TOKEN` | Auto |
| `KV_URL` | Auto |
| `REDIS_URL` | Auto |

---

## Push do commit local

| Campo | Valor |
|-------|-------|
| Commit SHA | `1cbe2f3a` |
| Mensagem | `chore(nexus-v2): F.3 done — Vercel root directory configured via CLI` |
| Push | `git push origin main` → `556552b5..1cbe2f3a  main -> main` |
| Status remoto | OK, em sincronia com origin/main |

---

## Comando de deploy executado

Da raiz do repo:

```
vercel --prod --yes --archive=tgz
```

Justificação do `--archive=tgz`: o repo tem 16 353 ficheiros (>15 000 limite Vercel). Sem `--archive=tgz` o upload falhou com `missing_archive`. Com `--archive=tgz` o deploy completou em 3m com build de 54s.

---

## Vercel project (referência)

| Campo | Valor |
|-------|-------|
| Project name | `imercao-ia-pt` |
| Project ID | `prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU` |
| Org ID | `team_Z7HN1UF28iHpUxCnZ4gT7wMF` |
| Root directory | `imersao-tools/nexus/v2` |
| Framework | Next.js |
| Node version | 24.x |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-deploy-producao.md`. PROJECTO A QUE SE REFERE: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## F.3 — Vercel root directory configured (FECHADO)

**Prova:**
- `.vercel/project.json` na raiz com `projectId`, `orgId`, `projectName: imercao-ia-pt`
- Build Vercel respeita root dir `imersao-tools/nexus/v2` (build logs mostram detecção Next.js correcta)
- `Building: Build Completed in /vercel/output [54s]` e `Production: https://imercao-ia-jwtlmfq4g-...vercel.app [3m]`
- Commit `1cbe2f3a` regista a configuração via CLI

---

## Epic 0 — Resumo Final

| Story | Estado | Prova |
|-------|--------|-------|
| F.1 → F.10 (10 stories Next.js + auth + widgets + tests + CI) | Done | Commit `c362b171` |
| F.3 (Vercel root directory) | Done | Commit `1cbe2f3a` + deploy READY |
| Deploy produção | **Done** | URL live + smoke tests PASS |

**Epic 0: 100% fechado em produção.**

---

## Limpeza pendente (acção do Eurico)

| Item | Estado | Notas |
|------|--------|-------|
| `.tmp-bcrypt/` removido | Conteúdo eliminado, pasta vazia | Pasta vazia ainda existe (Device busy — agente está cwd dentro). Após fechar este terminal: `rmdir .tmp-bcrypt` ou ignorar (é vazia) |
| `.tmp-bcrypt/` em `.gitignore` | **SIM** (commit pendente) | Adicionada entrada `.tmp-bcrypt/` em `.gitignore`. Stage `M .gitignore` está pendente — Eurico decide se commita ou descarta |
| `.tmp-bcrypt/` no histórico git | **NUNCA esteve committed** | `git ls-files \| grep tmp-bcrypt` → vazio |

---

## Próximo passo

| Próximo agente | Acção | Quando |
|----------------|-------|--------|
| **`@sm`** | Arrancar Epic 1 — `*draft` da primeira story do Epic 1 | Quando Eurico der ordem |

Epic 0 não tem mais nada a fazer. Sistema estável, em produção, autenticação a funcionar. Eurico só precisa testar com a password real para confirmar.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `imersao-tools/nexus` (v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-deploy-producao.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (devops)
DATA: 04/05/2026
