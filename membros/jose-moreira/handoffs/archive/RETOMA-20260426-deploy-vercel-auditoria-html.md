# RETOMA — Moreira: Deploy Vercel da auditoria HTML hiperpersonalizada

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: devops (Gage)
created: 2026-04-26
status: consumed
consumed: true
consumed_at: 2026-04-26
consumed_by: devops (Gage)
project: jose-moreira (membros/jose-moreira/)
session_type: deploy-vercel-auditoria-html
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
handoff_anterior: RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md (consumido nesta sessão 26/04)
next_critical_action: "Commit + push + deploy Vercel da pasta isolada `04-landing/auditoria-bot/`"
priority: alta — Eurico quer link partilhável para enviar ao Moreira hoje
vercel_url_production: https://moreira-auditoria-bot.vercel.app
vercel_url_deploy: https://moreira-auditoria-akinlen02-euricojsalves-4744s-projects.vercel.app
vercel_inspector: https://vercel.com/euricojsalves-4744s-projects/moreira-auditoria-bot/DxnHU6cnJaMp91bagmmmsf8Qet4T
commit_hash: 7bf5af58
```

---

## ⚠️ CONTEXTO RÁPIDO (para Gage)

Este é o projecto Moreira. José Moreira é cliente real do Eurico, mentorado da comunidade [IA]AVANÇADA PT, possível futuro sócio.

**O que acabou de ser feito (sessão Uma 25-26/04):**
1. Auditoria das 5 respostas técnicas ao Moreira concluída em v3 markdown (`02-prd/resposta-moreira-v3.md`) com 7 micro-edições aplicadas e re-validadas
2. Eurico decidiu que markdown é "ultrapassado" e quer entregar peça hiperpersonalizada à altura da era da IA
3. Uma construiu HTML standalone (61 KB) seguindo design system [IA]AVANÇADA PT — fundo escuro `#04040A`, glassmorphism, cyan/gold/magenta/lime, Inter + JetBrains Mono
4. Uma gerou PDF imprimível (1.4 MB) via Chrome headless `--print-to-pdf` em tema escuro preservado

**O que precisa de ti (Gage):**
- Commit dos 3+ ficheiros novos
- Deploy Vercel da pasta `04-landing/auditoria-bot/` como projecto isolado (NÃO interferir com a landing principal em prod)
- Devolver URL ao Eurico para ele partilhar com o Moreira

---

## FICHEIROS A COMMITAR

### Novos (untracked)

| Ficheiro | Tamanho | Propósito |
|----------|---------|-----------|
| `membros/jose-moreira/04-landing/auditoria-bot/index.html` | 61 KB | HTML standalone com 5 Q&A + 2 alertas + roadmap |
| `membros/jose-moreira/04-landing/auditoria-bot/output/Auditoria-Bot-Moreira.pdf` | 1.4 MB | PDF imprimível tema escuro |
| `membros/jose-moreira/handoffs/RETOMA-20260426-deploy-vercel-auditoria-html.md` | este | Handoff |

### Modificados (já em git)

| Ficheiro | Alteração |
|----------|-----------|
| `membros/jose-moreira/02-prd/resposta-moreira-v3.md` | 2 micro-edições (Q3 "gpt-4-turbo" precisão + Q5 reutilizar `{{workflow.ClientEmail}}`) |
| `docs/HANDOFF-INDEX.md` | Adicionada linha pending + arquivada handoff 25/04 |

### Outros untracked não relacionados (NÃO commitar nesta sessão)

Há vasto trabalho untracked do projecto Frusoal e outros — NÃO incluir neste commit. Manter scope focado só no Moreira.

---

## COMMIT SUGERIDO (mensagem)

```
feat(moreira): auditoria HTML hiperpersonalizada + PDF imprimivel para envio ao cliente

Construido HTML standalone (61 KB) seguindo design system [IA]AVANCADA PT:
- 6 seccoes: hero personalizado + snapshot bot + 2 alertas urgentes + 5 Q&A + roadmap + fecho
- Hiperpersonalizacao real: bot ID, email Moreira, base Airtable, linhas exactas do .bpz
- Glassmorphism, fundo #04040A, cyan/gold/magenta/lime, Inter + JetBrains Mono
- Sub-blocos <details>/<summary> nativos para colapsar conteudo (sem JS)
- Mobile-first responsive + @media print preservando tema escuro
- 2 alertas: PAT Airtable exposto + ClientName variaveis inconsistentes

PDF gerado via Chrome headless --print-to-pdf (1.4 MB, A4, tema escuro).

Pasta isolada para deploy Vercel separado da landing principal:
  membros/jose-moreira/04-landing/auditoria-bot/

Constraint: design-system-ia-avancada.md - fundo escuro nao-negociavel
Constraint: feedback_no_projected_business_models - sem prometer parceria/comissao
Constraint: feedback_moreira_no_hallucinations - cada facto com linha do bot.json
Confidence: high
Scope-risk: narrow
Directive: NAO sobrescrever 04-landing/index.html (e a landing v2 em prod)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## PROCEDIMENTO DE DEPLOY

### Passo 1 — Criar projecto Vercel isolado

Há já um `.vercel/` em `04-landing/` que aponta para a landing principal (José Moreira / página venda). **NÃO usar esse**.

Criar novo projecto Vercel apontando para `membros/jose-moreira/04-landing/auditoria-bot/`:

```bash
cd "membros/jose-moreira/04-landing/auditoria-bot"
vercel deploy --prod \
  --name moreira-auditoria-bot \
  --yes
```

Alternativa: importar via Vercel dashboard apontando ao subpath `membros/jose-moreira/04-landing/auditoria-bot/` no monorepo do ecosistema.

### Passo 2 — Confirmar configuração

| Item | Valor esperado |
|------|----------------|
| Project name | `moreira-auditoria-bot` |
| Root directory | `membros/jose-moreira/04-landing/auditoria-bot/` |
| Framework preset | Other / Static |
| Build command | (vazio — é HTML estático) |
| Output directory | `.` (raiz da subpasta) |
| Install command | (vazio) |

### Passo 3 — robots.txt opcional

O HTML já tem `<meta name="robots" content="noindex, nofollow">`. Para reforçar privacidade, criar `04-landing/auditoria-bot/robots.txt`:

```
User-agent: *
Disallow: /
```

### Passo 4 — Devolver URL ao Eurico

URL final deve ser do tipo:
- `https://moreira-auditoria-bot.vercel.app/`
- ou `https://moreira-auditoria-bot-{hash}.vercel.app/` (preview)

Reportar ao Eurico com:
1. URL de produção
2. URL de preview se existir
3. Confirmação que `noindex` está activo (não vai aparecer no Google)

---

## QUALITY GATES ANTES DO PUSH

- [ ] `git status` mostra apenas os ficheiros listados acima como staged
- [ ] Nenhum ficheiro do projecto Frusoal incluído no commit
- [ ] `git diff --stat` mostra alterações localizadas em `membros/jose-moreira/`
- [ ] HTML abre em browser desktop sem erros (validação visual)
- [ ] PDF abre em leitor PDF padrão sem corrupção
- [ ] CodeRabbit pre-PR (não obrigatório para HTML estático mas pode correr)

---

## REGRAS APLICADAS

- ✅ `handoff-location.md` — handoff em `membros/jose-moreira/handoffs/`
- ✅ `agent-authority.md` — Uma delega push/deploy a Gage (devops)
- ✅ `workspace-governance.md` — material do membro fica em `membros/jose-moreira/`
- ✅ `design-system-ia-avancada.md` — fundo escuro preservado no PDF
- ✅ `feedback_no_projected_business_models.md` — Q4 não inventa split/comissão
- ✅ `feedback_moreira_no_hallucinations.md` — todos os factos com linha do bot.json verificada hoje
- ✅ `feedback_governance_never_blocks_execution.md` — proposta concreta com 1 path

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260426-deploy-vercel-auditoria-html.md`. ESTÁ DENTRO DA PASTA DO PROJECTO MOREIRA. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** jose-moreira (José Moreira, cliente real, possível futuro sócio)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260426-deploy-vercel-auditoria-html.md`
- **COINCIDEM?** SIM ✅

AGENTE RESPONSÁVEL: `ux-design-expert (Uma)`
DATA: 26/04/2026
HANDOFF ANTERIOR: `RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md` (consumido nesta sessão — a arquivar)

---

## FIM DO HANDOFF

Gage, quando assumires:
1. Lê este handoff completo
2. Executa commit + push + deploy Vercel conforme procedimento acima
3. Devolve URL ao Eurico
4. Marca este handoff como `consumed: true`, move para `archive/`, actualiza INDEX

Tempo estimado: 10-15 minutos.
