# RETOMA — 04/06/2026: ESTADO REAL VERIFICADO — BOT PRONTO, NÃO ENTREGUE, TOKEN AINDA EXPOSTO NO REMOTE

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## REGRA DE OURO DESTE HANDOFF

**NÃO ADIVINHAR. NADA.** Este projecto tem dinheiro e tempo do Eurico investidos. Cada afirmação abaixo está marcada como:

- ✅ **FACTO VERIFICADO** — confirmado por comando/leitura nesta sessão (04/06)
- ❓ **A VERIFICAR** — desconhecido; o próximo terminal TEM de confirmar antes de agir
- ⚠️ **DECISÃO DO EURICO** — não avançar sem ele decidir

Se algo não está marcado como ✅, NÃO o trates como verdade. Pergunta ou verifica.

---

## TL;DR

| Pergunta | Resposta | Tipo |
|----------|----------|------|
| O bot está consertado? | SIM — 7 bugs fechados, auditoria 15/15 PASS (sessão 7, 30/04-01/05) | ✅ |
| O bot foi entregue ao Moreira? | **NÃO** — confirmado pelo Eurico nesta sessão (04/06) | ✅ |
| Qual `.bpz` é o de entrega? | **Ambíguo** — há um Apr 30 (handoff diz que é este) e um May 01 mais recente não documentado | ❓ |
| O token Airtable ainda está exposto? | **SIM** — no commit `7bf5af58` (GitHub público) + `index.html` local (2 ocorrências) | ✅ |
| Há trabalho técnico em falta no bot? | NÃO bloqueante. BUG 5 (variáveis duplicadas) e BUG 7 (placeholders) ficaram em aberto, não impedem funcionamento | ✅ (do handoff sessão 7) |
| Quanto tempo parado? | Desde 01/05 — mais de 1 mês sem commits no scope Moreira | ✅ |

---

## METADADOS

```yaml
from_agent: aiox-master (Orion)
to_agent: any (próximo terminal — provavelmente @devops para token, ou Eurico para entrega)
created: 2026-06-04
status: pending
consumed: false
project: jose-moreira (membros/jose-moreira/)
branch_git_actual: feat/nexus-v2-story-4.9-sw-push-handler (NOTA: branch é do Nexus v2, NÃO do Moreira — o repo é mono-repo, a branch é global)
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\handoffs
handoff_anterior: archive/RETOMA-20260501-sessao-7-auditoria-bot-15-15-pass-push-ok-mas-token-airtable-leak-historico-precisa-decisao.md (consumido, decisão Opção 1)
ultimo_commit_moreira: c24e524b "chore(moreira): consume Sessões 6+7 — Opção 1 escolhida, bot pronto para entrega"
```

---

## NOTA SOBRE A BRANCH GIT (para não causar confusão como hoje)

A sessão de hoje abriu em `membros/jose-moreira/handoffs/` mas o git mostrou a branch `feat/nexus-v2-story-4.9-sw-push-handler`. **Isto é normal e não é erro:** a pasta do Moreira faz parte do mono-repo `ecosistema-ia-avancada-pt`; a branch é estado global do repo, partilhada por tudo. A branch `feat/nexus-v2-...` é trabalho do Nexus v2 (outro projecto), não do Moreira. O trabalho do Moreira foi feito em `main`. **Não associes a branch activa ao Moreira.**

---

## ESTADO VERIFICADO (04/06/2026)

### ✅ O que está FEITO e confirmado

1. **Bot Botpress consertado** — 7 bugs fechados (BUG 1, 2-PT, 2-EN, 3, 4, 4b, 6), auditoria 15/15 PASS na sessão 7. Fonte: handoff sessão 7, secção "AUDITORIA 15/15 PASS".
2. **Decisão de entrega tomada** — Opção 1 (D pura): entregar `.bpz` ao Moreira, deixar a rotação do token para ele. Consumida no commit `c24e524b`.
3. **Trabalho preservado no git** — tudo committed e pushed em `main` (commits `6cca6379`, `f8073136`, `c24e524b`).
4. **Working tree scope Moreira limpo** — só ficheiros untracked (`01-pesquisa/.claude/` e `03-codigo/_extract_may01/`), nada modificado pendente.

### ✅ O que está PENDENTE (e é o trabalho real a fazer)

1. **ENTREGA AO MOREIRA — NÃO FOI FEITA.** Eurico confirmou hoje (04/06). Este é o passo principal.
2. **TOKEN AIRTABLE AINDA EXPOSTO.** Verificado hoje:
   - `index.html` local tem 2 ocorrências do padrão PAT
   - Commit `7bf5af58` continua no histórico → token visível em `https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/blob/main/membros/jose-moreira/04-landing/auditoria-bot/index.html`
   - A Opção 1 assumia que o Moreira rotacionaria após receber o bot. Como **nunca recebeu**, o token está exposto há +1 mês. **Isto agravou-se com o tempo.**

### ❓ O que está POR VERIFICAR (próximo terminal confirma ANTES de agir)

1. **Qual `.bpz` entregar?** Há três:
   - `Moreira-v1-trabalho.bpz` — 5,59 MB (25/04, baseline pré-fixes — NÃO entregar)
   - `Moreira-v1-trabalho - 2026 Apr 30.bpz` — 8,56 MB (30/04, o que o handoff sessão 7 indica como entrega, md5 `7ec21d753320caa96b1698515c725f57`)
   - `Moreira-v1-trabalho - 2026 May 01.bpz` — 7,34 MB (01/05 19:23, **MAIS RECENTE, não documentado em nenhum handoff**)
   - O `_extract_may01/bot.json` tem 292KB vs 268KB do baseline. É maior → tem conteúdo adicional, mas **NÃO está confirmado o que mudou** entre Apr 30 e May 01. O próximo terminal deve comparar os dois antes de decidir qual entregar.
2. **O Moreira deu sinal de vida no último mês?** Desconhecido. Pode haver contexto fora do repo (WhatsApp, email).

### ⚠️ DECISÕES QUE SÓ O EURICO PODE TOMAR

1. **Como tratar o token exposto** — agora que passou +1 mês:
   - (a) Entregar já + pedir rotação urgente ao Moreira (Opção 1 original) — mas a janela de exposição já é grande
   - (b) Limpar o histórico git (`git filter-repo` + force-push) ANTES de entregar — remove o token do GitHub público
   - (c) Sanitizar só o `index.html` num commit normal (não remove do histórico, mas para de agravar)
   - Recomendação do Orion: **(b) ou (c) primeiro**, depois entregar. O token está exposto há demasiado tempo para o ignorar mais.
2. **Qual `.bpz` é o canónico** — depende do que mudou no May 01 (ver ❓ acima).
3. **BUG 7 (placeholders `[Nome da Empresa]`)** — preencher antes de entregar (entrega premium) ou deixar o Moreira preencher.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260604-estado-real-bot-pronto-nao-entregue-token-ainda-exposto.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## PRÓXIMO PASSO RECOMENDADO (para o próximo terminal)

Ordem sugerida — **mas confirmar com o Eurico antes de cada passo, sem adivinhar**:

1. **Perguntar ao Eurico o estado real fora do repo:** o Moreira foi contactado no último mês? Há urgência de entrega?
2. **Resolver o token PRIMEIRO** (decisão ⚠️ acima). É o item que piora com o tempo. Delegar a `@devops/Gage` se for limpeza de histórico (push/force-push é exclusivo dele).
3. **Confirmar o `.bpz` canónico** — comparar Apr 30 vs May 01 (`@dev` extrai e faz diff dos `bot.json`), reportar a diferença, Eurico decide.
4. **Entregar** — Eurico envia o `.bpz` confirmado + mensagem com aviso de rotação (template pronto no handoff da sessão 7, secção "Step 3 — Mensagem ao Moreira").

---

## FICHEIROS-CHAVE

| Ficheiro | Para quê |
|----------|----------|
| `membros/jose-moreira/handoffs/archive/RETOMA-20260501-sessao-7-...md` | Handoff anterior completo (auditoria 15/15, 4 opções, template de mensagem ao Moreira) |
| `membros/jose-moreira/03-codigo/Moreira-v1-trabalho - 2026 Apr 30.bpz` | Candidato a entrega (handoff sessão 7 indica este) |
| `membros/jose-moreira/03-codigo/Moreira-v1-trabalho - 2026 May 01.bpz` | Candidato mais recente, NÃO documentado — verificar |
| `membros/jose-moreira/04-landing/auditoria-bot/index.html` | **Contém o token exposto** — alvo de sanitização/limpeza |
| `membros/jose-moreira/01-pesquisa/.claude/agent-memory/aiox-devops/project_moreira_pat_leak.md` | Nota original do leak (20/04) |

---

## REGRAS ACTIVAS A RESPEITAR

- `feedback_moreira_no_hallucinations.md` — ZERO invenção. Só `bot.json` clonado ou doc oficial Botpress contam
- `feedback_handoffs_detail.md` — handoffs com decisões exactas, citações do Eurico, contexto concreto
- `feedback_no_sr_treatment.md` — tratamento informal directo com o Eurico (sem "Sr."/"Senhor")
- `mandatory-change-log.md` — toda alteração ao bot vai a tabela "Antes/Depois" + commit
- `handoff-location.md` — este handoff segue os 3 blocos obrigatórios
- `agent-authority.md` — push/force-push é EXCLUSIVO de `@devops/Gage`
- `comunidade-safety.md` — não aplicável aqui (é projecto Moreira, não comunidade), mas mesmo rigor de teste antes de qualquer entrega

---

## CITAÇÃO DO EURICO (04/06 — porque este handoff existe)

> *"espera lá deixa de adivinhar isto é serio, não pode ser tratado desta maneira está aqui o meu dinheiro e muito tempo investido para agora estares a tentar adivinhar. vamos lá ver se não volta a acontecer, cria um handoff para começarmos em outro terminal sem asneiras nem adivinhações"*

**Lição para o próximo terminal:** este projecto não tolera palpites. Verifica tudo. Marca o que não sabes. Pergunta ao Eurico em vez de assumir. O bot está pronto — o que falta é entrega + token, e ambos exigem decisão dele, não adivinhação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `jose-moreira` (Moreira)
- LOCALIZAÇÃO CORRECTA: `membros/jose-moreira/handoffs/RETOMA-20260604-...md`
- LOCALIZAÇÃO ACTUAL: `membros/jose-moreira/handoffs/RETOMA-20260604-estado-real-bot-pronto-nao-entregue-token-ainda-exposto.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Orion (aiox-master)`
DATA: `04/06/2026`

---

**Fim do handoff.** O bot está pronto. Falta entregar e resolver o token. Sem adivinhações — verifica e pergunta.
