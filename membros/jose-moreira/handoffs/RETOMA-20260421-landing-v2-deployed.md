# RETOMA 21/04/2026 — Landing V2 do José Moreira deployed side-by-side

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Frontmatter

| Campo | Valor |
|-------|-------|
| Data | 2026-04-21 |
| De | @devops (Gage) |
| Para | Eurico (validação humana) + @devops próxima sessão |
| Projecto | Landing José Moreira (V2 side-by-side) |
| Estado | V2 DEPLOYED — aguarda validação visual Eurico para decidir substituição V1→V2 |
| Commit | `c45f2a948bedb51c224a6454f351329215abd558` |
| Branch | `main` |

---

## O que foi feito nesta sessão

Deploy da V2 da landing do José Moreira em modo side-by-side (V1 intocada, V2 num URL paralelo). Redesign AIDA feito por @ux-design-expert em sessão anterior foi empurrado para produção para o Eurico poder comparar as duas versões live antes de decidir a substituição final.

## Alterações realizadas

| Ficheiro | Tipo | Antes | Depois | Razão |
|----------|------|-------|--------|-------|
| `membros/jose-moreira/04-landing/index-v2.html` | NOVO | — | 78 943 bytes, 2 339 linhas | Redesign V2 AIDA entregue por @ux-design-expert |
| `membros/jose-moreira/04-landing/assets/moreira.jpg` | NOVO | — | 25 881 bytes, 400x400 | Foto pública do Moreira, fornecida pelo Eurico |
| `membros/jose-moreira/.gitignore` | MODIFICADO | `assets/` (ignora tudo) | `assets/**` + excepção `!04-landing/assets/moreira.jpg` | Permitir foto pública da landing; outros assets continuam protegidos |

V1 (`index.html`, 1627 linhas, 51 908 bytes, commit `b5e8279`) NÃO foi modificada. Continua servida em `/` no URL de produção.

## Commit details

```
c45f2a9 feat(moreira): landing v2 side-by-side com redesign AIDA
```

3 files changed, 2389 insertions(+), 1 deletion(-)

Push: `fd4e293..c45f2a9` → `origin/main` (sem `--force`, fast-forward).

## URLs

| Versão | URL | Status HTTP | Nota |
|--------|-----|-------------|------|
| V1 (live, inalterada) | https://04-landing-wine.vercel.app/ | 200 | Continua a servir `index.html` |
| V2 (preview novo) | https://04-landing-wine.vercel.app/index-v2.html | ver secção "Deploy Vercel" | Depende de deploy automático |

## Deploy Vercel

| Campo | Valor |
|-------|-------|
| Projecto | `04-landing` |
| Project ID | `prj_LbqJb16UO4NpMB1zPuqmZjG1PS0r` |
| Org | `team_Z7HN1UF28iHpUxCnZ4gT7wMF` |
| Deployment ID | `dpl_8VcfppEZpDQSYYzo2FRHvtH6RZKu` |
| Target | production |
| Ready state | READY |
| Deploy URL (directo) | https://04-landing-j9zzx6rsj-euricojsalves-4744s-projects.vercel.app |
| Alias | https://04-landing-wine.vercel.app |
| Build time | 8s |

**Nota operacional:** O auto-deploy Git→Vercel NÃO disparou no push (após push `c45f2a9` esperei ~90s e último deploy listado continuava de 20h atrás). Foi necessário forçar deploy manual com `vercel --prod --yes`. Vale a pena @devops próxima sessão investigar se o webhook Git→Vercel deste projecto está activo em `vercel.com/euricojsalves-4744s-projects/04-landing/settings/git`. Se desligado, re-ligar o repo `DaSilvaAlves/ecosistema-ia-avancada-pt` no dashboard.

Todos os 3 URLs confirmados a responder 200 (teste via `curl -sI`):
- `https://04-landing-wine.vercel.app/` — V1 (inalterada)
- `https://04-landing-wine.vercel.app/index-v2.html` — V2 (novo)
- `https://04-landing-wine.vercel.app/assets/moreira.jpg` — foto pública

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260421-landing-v2-deployed.md`. É O LOCAL CORRECTO (handoff de membro dentro da pasta do membro, conforme `workspace-governance.md` R4). SE ALGUMA VEZ FOR MOVIDO PARA FORA, CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próximos passos (em ordem)

### Passo 1 — Eurico valida V2 live (humano)

Abrir no browser:
- https://04-landing-wine.vercel.app/index-v2.html (V2 preview)
- https://04-landing-wine.vercel.app/ (V1 live, para comparar)

Verificar:
- Render correcto em desktop e mobile
- Todas as 6 secções funcionam
- Foto do Moreira carrega
- Âncora `#privacidade` funcional
- Nenhum erro na consola F12

### Passo 2 — Decisão do Eurico

| Decisão | Acção próxima |
|---------|---------------|
| V2 aprovada | @devops faz substituição V1→V2 (Passo 3) |
| V2 precisa ajustes | @ux-design-expert retoma trabalho no `index-v2.html`, novo commit |
| Rejeitar V2 | `git rm index-v2.html` + commit |

### Passo 3 — Substituição V1→V2 (quando Eurico aprovar)

@devops executa (NÃO executar nesta sessão — aguarda Eurico):

```bash
cd membros/jose-moreira/04-landing/
git mv index.html index-v1-backup.html
git mv index-v2.html index.html
git add index.html index-v1-backup.html
git commit -m "feat(moreira): promover V2 da landing para produção (V1 → backup)"
git push origin main
```

### Passo 4 — Ligar form a Airtable (separado)

Pendente de:
1. Rotação do Airtable PAT (o anterior ficou em histórico git de handoffs — auditoria `RETOMA-20260420-auditoria-profunda-v2.md`)
2. Novo PAT configurado como env var Vercel
3. Endpoint serverless ou fetch directo no form V2

---

## Regras aplicadas nesta sessão

| Regra | Como foi respeitada |
|-------|---------------------|
| `agent-authority.md` | @devops fez push e deploy exclusivo |
| `comunidade-safety.md` | Deploy side-by-side — V1 intocada, sem risco de down |
| NUNCA `git add -A` | Staging selectivo: apenas 3 ficheiros explicitamente pretendidos |
| `mandatory-change-log.md` | Tabela antes/depois no commit message e neste handoff |
| `handoff-location.md` | Handoff dentro de `membros/jose-moreira/handoffs/` |
| `workspace-governance.md` R4 | Handoff de membro no directório do membro |
| `language-standards.md` | Commit e handoff em PT-PT |
| Pre-commit hook | Passou — `[main c45f2a9]` |

## Decisões autónomas documentadas

| Decisão | Razão | Alternativa rejeitada |
|---------|-------|------------------------|
| Commit directo a `main` (sem branch feature + PR) | Workflow consistente deste projecto (ver `5271de3`, `b5e8279`, `fd4e293` todos directos a main) | Branch feature + PR cerimónia desnecessária para side-by-side deploy |
| Adicionar excepção no `.gitignore` para `moreira.jpg` | Foto é conteúdo público intencional da landing (não dado pessoal sensível), V2 já referencia no OG meta | Force-add com `git add -f` — mais frágil, perde a intenção no tempo |
| NÃO incluir PRD `resposta-moreira-v2.md` nem handoffs novos no commit | Estão fora do scope "deploy landing V2" | Commit misto — perderia clareza e risco de incluir acidentalmente secrets |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Landing José Moreira (V2 deploy)
- LOCALIZAÇÃO CORRECTA: `membros/jose-moreira/handoffs/RETOMA-20260421-landing-v2-deployed.md`
- LOCALIZAÇÃO ACTUAL: `membros/jose-moreira/handoffs/RETOMA-20260421-landing-v2-deployed.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: @devops (Gage)
DATA: 21/04/2026
