# RETOMA — Moreira: 5 respostas TODAS REVISADAS com 7 micro-edições aplicadas, aguarda 4 decisões meta antes de consolidar v3

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: any
created: 2026-04-25
status: consumed
consumed: true
consumed_at: 2026-04-26
consumed_by: ux-design-expert (Uma)
consumed_reason: "4 decisões meta resolvidas, v3 consolidada, peça HTML hiperpersonalizada criada, handoff novo a Gage para deploy Vercel"
superseded_by: RETOMA-20260426-deploy-vercel-auditoria-html.md
project: jose-moreira (membros/jose-moreira/)
session_type: revisao-final-5-respostas-aguarda-4-decisoes-meta
questoes_totais: 5
questoes_revisadas: 5  # TODAS
edicoes_aplicadas: 7
rascunhos_validados: 5
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\02-prd
handoff_anterior: RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md (consumido nesta sessão 25/04)
next_critical_action: "Eurico responde 4 decisões meta UMA A UMA → Uma consolida resposta-moreira-v3.md"
```

---

## ⚠️ AVISO CRÍTICO (LER PRIMEIRO)

Regras activas para qualquer trabalho Moreira:

1. **As 5 respostas estão TODAS revisadas e validadas** — Q1 a Q5, com 7 micro-edições aplicadas. Cada facto duro foi confirmado linha-a-linha no `bot.json` e via WebFetch ao doc oficial Botpress. Listagem completa abaixo.
2. **NÃO re-abrir as 5 respostas** — estão fechadas. Mexer só se Eurico identificar erro factual concreto.
3. **NÃO consolidar v3 sem as 4 decisões do Eurico** — meta-decisões sobre estrutura/extras (mapa mercado, .bpz, agenda, próximos passos).
4. **Critério único do Eurico:** "dar a informação certa". Edições de tom só se servirem clareza factual; nunca por estética isolada.
5. **PT-PT formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves" + "Um abraço". Manter "o Sr.", evitar "tu".
6. **Regra `feedback_no_projected_business_models`** — não inventar preço/parceria/split. Q4 já aplicou Caminho B aprovado.
7. **Regra `feedback_moreira_no_hallucinations`** — zero invenção. Se não há linha do bot.json ou citação de doc oficial, não vai.
8. **Sem termos proibidos:** "curso", "fácil", "automático", "revolucionário", "garantido".

---

## ESTADO ACTUAL — RESUMO EXECUTIVO

### As 5 respostas — todas validadas E revisadas

| Q | Tema | Estado | Edições aplicadas 25/04 | Ficheiro |
|---|------|--------|-------------------------|----------|
| Q1 | UPLOAD QUE SOME | ✅ Revisada | 2 (frase Vision + percentagem) | `02-prd/rascunho-q1-validado.md` |
| Q2 | SKIP NO APOIO HUMANO | ✅ Revisada | 2 (transição condicional + PT-PT) | `02-prd/rascunho-q2-validado.md` |
| Q3 | REPLICAÇÃO | ✅ Revisada | 1 (coluna AI Spend máx na tabela) | `02-prd/rascunho-q3-validado.md` |
| Q4 | AUTORIA E CONTROLO | ✅ Revisada | 2 (33→45 nodes + URL doc 404) | `02-prd/rascunho-q4-validado.md` |
| Q5 | AGENTE HUMANO VS BASEKNOWLEDGE | ✅ Revisada | 0 (factos 100% verificados) | `02-prd/rascunho-q5-validado.md` |

**Total: 7 micro-edições aplicadas ao longo da sessão. Detalhe linha-a-linha abaixo.**

### O que aconteceu na sessão 25/04 (Uma)

1. Consumido handoff `RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md`
2. Eurico pediu revisar as 5 respostas uma a uma antes de consolidar v3 — para "dar a informação certa" ao Moreira
3. Para cada Q: leitura do rascunho → análise crítica → verificações reais (Grep no bot.json, WebFetch a botpress.com/pricing e doc oficial) → diff proposto → aplicação após aprovação
4. Q1, Q2, Q3, Q4 com edições aprovadas e aplicadas. Q5 sem edições (factos 100% sólidos)
5. Eurico pediu handoff detalhado para continuar noutro terminal — este ficheiro

---

## 📝 ALTERAÇÕES APLICADAS NA SESSÃO 25/04 — registo linha-a-linha (regra `mandatory-change-log.md`)

### Q1 — `02-prd/rascunho-q1-validado.md` (2 edições)

| # | Linha | Antes | Depois | Razão |
|---|-------|-------|--------|-------|
| 1 | 14 | "A opção `allowFileUpload` está activada. O Vision Agent no bot também está ligado, **com extracção de conteúdo de imagens on**. Ou seja, a configuração do lado do bot está correcta." | "A opção `allowFileUpload` está activada. O Vision Agent no bot também está ligado. Ou seja, a configuração do lado do bot está correcta." | Sub-afirmação não-confirmada removida no momento. Verificação posterior mostrou que `VisionAgent.extractionEnabled: true` (linha 5383 bot.json) era de facto verdadeiro — mas como não traz valor para resolver o problema do upload, mantemos a frase mais curta |
| 2 | 41 | "Aí sim é bug do widget Botpress v3.6 — mas é residual **(menos de 10% de probabilidade)**. Nesse caso abrimos ticket no suporte Botpress" | "Aí sim é bug do widget Botpress v3.6 — mas é residual. Nesse caso abrimos ticket no suporte Botpress" | "Menos de 10%" é número solto sem fonte — risco de soar inventado |

### Q2 — `02-prd/rascunho-q2-validado.md` (2 edições)

| # | Linha | Antes | Depois | Razão |
|---|-------|-------|--------|-------|
| 3 | 47 | "3. No capture File actual, ligar a condição: *'executar apenas se a resposta anterior = sim'* — **alternativa mais limpa**: mover o capture File para dentro do ramo 'sim' usando uma transição condicional do Choice" | "3. Mover o capture File para dentro do ramo 'Sim' do Choice (transição condicional). Assim só dispara se o utilizador escolher anexar" | Texto original oferecia duas hipóteses sobrepostas. Escolhida a abordagem nativa Botpress (ramo Sim do Choice) |
| 4 | 51 | "Tempo estimado: 20 a 30 minutos **pelos** dois nós." | "Tempo estimado: 20 a 30 minutos **para os** dois nós." | PT-PT mais natural |

### Q3 — `02-prd/rascunho-q3-validado.md` (1 edição)

| # | Linha | Antes | Depois | Razão |
|---|-------|-------|--------|-------|
| 5 | Tabela limites (linhas 20-26) | Tabela com 5 linhas (Custo, Bots, Mensagens, AI Credit, Colaboradores) | Tabela com 6 linhas — adicionada nova linha **`AI Spend máx (overage) | 100 USD/mês | 100 USD/mês | 500 USD/mês`** entre AI Credit e Colaboradores | Fechar a história financeira para o Moreira tomar decisão informada. Confirmado via WebFetch botpress.com/pricing |

### Q4 — `02-prd/rascunho-q4-validado.md` (2 edições)

| # | Linha | Antes | Depois | Razão |
|---|-------|-------|--------|-------|
| 6 | 23 | "- Os 4 flows, **os 33 nodes**, os 2 hooks LLMz — tudo gravado no seu nome" | "- Os 4 flows (Main, Error, Timeout, Conversation End), **45 nodes no total (33 só no flow Main)**, 2 hooks LLMz — tudo gravado no seu nome" | Discrepância factual: total bot = 45 nodes (grep `"id": "nd-` retornou 45), os 33 são só do wf-main. Adicionados nomes humanos dos flows (Studio mostra-os assim) |
| 7 | 83 (tabela evidência) | "6 roles Botpress: Viewer / Billing Manager / Developer / Manager / Administrator / Owner | 100% | **botpress.com/docs/cloud/admin-dashboard/managing-workspaces**" | "6 roles Botpress: Viewer / Billing Manager / Developer / Manager / Administrator / Owner | 100% | **Studio → Workspace settings → Members (verificável visualmente)**" | URL doc oficial retornou 404 (URL pode ter mudado). Substituído por referência visual no Studio que o Moreira pode validar sozinho |

### Q5 — `02-prd/rascunho-q5-validado.md` (0 edições)

Nenhuma. Os 9 factos da tabela de evidência (linhas 91-101) confirmados a 100% via Grep no bot.json. Aprovado tal qual está.

---

## 🔍 VERIFICAÇÕES EXECUTADAS — factos confirmados na sessão 25/04

### Q1 — UPLOAD QUE SOME

| Facto | Resultado | Fonte |
|-------|-----------|-------|
| `VisionAgent.enabled: true` | ✅ Confirmado | bot.json linha 5380 |
| `VisionAgent.extractionEnabled: true` | ✅ Confirmado (mas omitido no texto final) | bot.json linha 5383 |
| `allowFileUpload: true` no configUrl público | ✅ Confirmado | WebFetch a `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` |
| Domínios no configUrl | ✅ `bpcontent.cloud` (storage) + `botpress.com` (footer) | WebFetch |

### Q2 — SKIP NO APOIO HUMANO

| Facto | Resultado | Fonte |
|-------|-----------|-------|
| Frase PT capture 1: "Por favor, descreva a sua dúvida." | ✅ Exacta | bot.json linha 4512 |
| Frase PT capture 2: "Se desejar, pode anexar aqui um print screen ou documento sobre o problema." | ✅ Exacta | bot.json linha 4584 |
| `maxRetries: 2` em todos os captures | ✅ Confirmado (40+ captures, todos iguais) | bot.json |
| `handleFailure: false` em todos os captures | ✅ Confirmado | bot.json |

### Q3 — REPLICAÇÃO

| Facto | Resultado | Fonte |
|-------|-----------|-------|
| Pricing Pay-as-you-go | $0, 1 bot, 500 msgs/mês, $5 AI credit, 1 seat, AI Spend máx $100 | WebFetch botpress.com/pricing |
| Pricing Plus | $89, 2 bots, 5K msgs/mês, $5 AI credit, 2 seats, AI Spend máx $100 | WebFetch botpress.com/pricing |
| Pricing Team | $495, 3 bots, 50K msgs/mês, $5 AI credit, 3 seats, AI Spend máx $500 | WebFetch botpress.com/pricing |
| 4 flows com nomes humanos: Main, Error, Timeout, Conversation End | ✅ Confirmados | bot.json IDs `wf-error` (linha 47), `wf-timeout` (172), `wf-conversation-end` (269), `wf-main` (383) |
| KnowledgeAgent usa `gpt-4-turbo` para conversas com KB | ✅ Confirmado | bot.json linha 5368: `"bestModel": "gpt-4-turbo"` |
| `defaultBestModel: openai__gpt-4.1-2025-04-14` | ✅ Confirmado | bot.json linha 23 |
| `defaultFastModel: openai__gpt-4.1-mini-2025-04-14` (usado pelos captures) | ✅ Confirmado | bot.json linha 24 |

### Q4 — AUTORIA E CONTROLO

| Facto | Resultado | Fonte |
|-------|-----------|-------|
| Bot ID: `e7e5db81-ad3c-45e2-bf25-033d76b04059` | ✅ Confirmado | bot.json linha 9 |
| Email Moreira: `josemmoreira1@gmail.com` | ✅ Confirmado | bot.json linha 5600 |
| workspaceUserId: `0947e877-3373-45f2-8983-5c385007d6b1` | ✅ Confirmado | bot.json linhas 5503, 5552, 5553, 5600 |
| Airtable BASE_ID: `app7S6wEWqhpQgMEV` | ✅ Confirmado | bot.json linha 16 |
| 2 hooks LLMz (`track_iterations` + `inject_learnings`) | ✅ Confirmados | bot.json linhas 5310 + 5328 |
| **45 nodes totais (não 33)** | ⚠️ Grep `"id": "nd-` retornou 45 ocorrências. Os 33 são só do wf-main/Main | bot.json (correção aplicada) |
| URL doc Botpress workspace roles | ⚠️ 404 hoje (URL mudou ou foi removida) | `botpress.com/docs/cloud/admin-dashboard/managing-workspaces` retorna 404 |

### Q5 — AGENTE HUMANO VS BASEKNOWLEDGE

| Facto | Resultado | Fonte |
|-------|-----------|-------|
| `KnowledgeAgent.answerManually: true` | ✅ Confirmado | bot.json linha 5366 |
| `conversation.handoff = true` em 2 acções | ✅ Confirmado | bot.json linha **4690** (`nd-c8ccfc4867` Apoio_Humano_PT) + linha **4904** (`nd-d3e1d24fd9` Human_Support_EN) |
| **Ninguém LÊ `conversation.handoff`** — flag confirmadamente inerte | ✅ Confirmado | Grep `conversation.handoff` retornou apenas 2 escritas, zero leituras |
| Bot **NÃO tem HITL instalado** | ✅ Confirmado | Grep `hitl|HITL|"handoff": true` → 0 matches |
| Hook `track_iterations` `after_llmz_execution`, integration `agi/improvement` v1.0.2 | ✅ Confirmado | bot.json linhas 5310-5325 |
| Hook `inject_learnings` `before_llmz_execution`, integration `agi/improvement` v1.0.2 | ✅ Confirmado | bot.json linhas 5328-5343 |
| Hooks NÃO tocam handoff/KB | ✅ Confirmado | Código dos hooks lido — só traçam iterações LLMz e injectam learnings no prompt |

---

## 🟡 4 DECISÕES META PENDENTES — apresentar UMA A UMA

O Eurico quer rever cada uma com a mesma vara de medir das 5 respostas: **dar a informação certa ao Moreira sem inventar**. Apresentar **uma de cada vez**, com contexto, opções e impacto. Aguardar resposta antes de avançar para a seguinte.

### Decisão 1 — Mapa de mercado (Parte 1 da v2)

**Contexto:** A v2 abria com um "Mapa de mercado PME Viana do Castelo" com projecções, número de empresas, segmentos alvo. O Moreira **não pediu mapa de mercado** no briefing — pediu 5 perguntas técnicas específicas.

| Opção | Acção | Risco |
|-------|-------|-------|
| **1a** | Manter mapa tal qual v2 | Repete projecções inventadas v2 (5 erros consolidados) |
| **1b** | Reescrever adaptado ao tom validado das 5 questões (formal-cordial, zero invenção, sem projecções de adopção) | Trabalho extra, mas tom certo. Continua a oferecer algo que o Moreira não pediu |
| **1c** | Omitir completamente | Resposta foca no que o Moreira pediu; respeita `feedback_no_projected_business_models` |

**Inclinação Uma:** **1c** (omitir). O Moreira pediu 5 perguntas técnicas. Adicionar mapa de mercado é projectar valor que ele não pediu e arrisca repetir os erros da v2.

### Decisão 2 — 4 pontos urgentes detectados pela v2 no `.bpz`

**Contexto:** A v2 identificou 4 problemas no ficheiro `.bpz` do Moreira:

1. **PAT Airtable exposto** no .bpz (linha 5600 do bot.json) — deve revogar e rodar
2. **Foto pessoal pública** na KB HTML — tornar privada
3. **PDF com CV** na KB — apagar se não é para conhecimento do bot
4. **Variáveis inconsistentes** `clientName` vs `ClientName` — bug funcional (Airtable pode receber Nome vazio)

| Opção | Acção | Risco |
|-------|-------|-------|
| **2a** | Re-verificar agora no bot.json + cloud_files.json + KB se ainda são válidos e incluir no v3 os que forem confirmados | Tempo extra, mas máxima correcção |
| **2b** | Omitir todos | Não são as 5 perguntas do Moreira — pode parecer scope creep |
| **2c** | Incluir apenas o ponto **(1) PAT exposto** — é risco de segurança real, os outros são opcionais | Equilíbrio: dev responsável sinaliza segurança mesmo não pedido |

**Inclinação Uma:** **2c** com nota curta. Ponto 1 (PAT) é risco de segurança que qualquer dev responsável sinaliza ao entregar auditoria — mesmo não pedido. Os outros 3 são escopo extra, omitir.

**Acção obrigatória se 2a ou 2c:** o agente que consolida v3 DEVE re-verificar no bot.json que os factos ainda são válidos antes de incluir. Greps:
- `clientName` (case-sensitive) e `ClientName`
- `pat`, `AIRTABLE_PAT`, `Bearer\s+pat` para confirmar exposição
- Abrir `cloud_files.json` para ver se foto/PDF ainda listados

### Decisão 3 — Agenda Zoom

**Contexto:** Hoje é **25/04/2026**. As 3 datas que a v2 propunha (Ter 21, Qui 23, Sex 24) **já passaram TODAS**. Precisa de novas datas reais.

| Opção | Acção |
|-------|-------|
| **3a** | 2 datas próximas — Eurico indica 2 slots concretos (ex: Seg 28 + Ter 29) |
| **3b** | 3 opções — Eurico indica 3 slots para o Moreira escolher |
| **3c** | Sem agenda Zoom — só enviar respostas escritas; Moreira pede reunião se quiser |

**Inclinação Uma:** depende do Eurico. Se houver disponibilidade real, **3a** (2 slots simples) é o mais prático para fechar a entrega. Se a agenda estiver apertada, **3c** é honesto.

**Bloqueante:** Eurico tem de **dar as datas exactas** se escolher 3a ou 3b.

### Decisão 4 — Próximos passos concretos para o Moreira

**Contexto:** Com base nas 5 questões validadas, listar 3 a 5 (ou mais) passos concretos que o Moreira deve executar.

| Opção | Lista proposta | Foco |
|-------|----------------|------|
| **4a** | Lista curta (3): testar webchat em modo normal sem extensões (Q1), activar `handleFailure: true` no capture (Q2), definir Caminho A ou B para Q5 (email ou HITL) | Triagem rápida |
| **4b** | Lista média (5): Q1 + Q2 + Q3 Modelo A (primeiro cliente com conta própria gratuita) + Q4 roles (Viewer por defeito) + Q5 Caminho A (implementação email) | Cobre as 5 questões com 1 acção cada |
| **4c** | Lista longa (7+): incluir também auditoria segurança (se 2c), exportar `.bpz`, rever KB, etc. | Mais completo, risco de sobrecarregar |

**Inclinação Uma:** **4b**. Cobre as 5 questões com acção concreta sem sobrecarregar. 5 passos em 1 página é ritmo que o Moreira consegue executar.

---

## RESUMO EXECUTIVO DAS 5 RESPOSTAS (já consolidadas para v3)

### Q1 — UPLOAD QUE SOME
**Veredicto:** Causa é cache local ou extensão de browser Chrome Android. `allowFileUpload: true` JÁ activo no webchat (verificado via WebFetch ao configUrl). Não há "regra que desactiva upload para utilizadores identificados" (v2 inventou). Plano de teste: hard reload → clear cache → outro browser. Se mesmo assim falhar, abrir ticket Botpress.

### Q2 — SKIP NO APOIO HUMANO
**Veredicto:** File Upload não tem skip nativo no Botpress. Solução recomendada: Choice capture ANTES do File capture, com botões "Sim, quero anexar" / "Não, seguir para o agente". Mover o capture File para o ramo "Sim". Alternativa mínima: `handleFailure: true`. Simetria obrigatória PT/EN (partilham `variableId: var-0b3eeb9be7`).

### Q3 — REPLICAÇÃO
**Veredicto:** 3 modelos (A: cada cliente com conta Free + Moreira como colaborador; B: bots na conta Plus $89/mês limitado a 2 bots; C: Enterprise). Plano Free = 1 bot / 500 msgs / $5 AI credit / AI Spend máx $100. Plano "Pro" não existe — é Plus ($89) ou Team ($495). Tabela completa actualizada com coluna AI Spend máx. Refactor de placeholders (4-8h uma vez) reduz cada cliente novo a 1-2h.

### Q4 — AUTORIA E CONTROLO
**Veredicto técnico:** Autoria protegida por design no Botpress. Bot, Airtable PAT e workspace tudo em nome do Moreira. **45 nodes totais, 33 só no flow Main, 4 flows (Main/Error/Timeout/Conversation End), 2 hooks LLMz.** 6 roles Botpress — Admin é só do Moreira; clientes/terceiros entram no máximo como Viewer. Exportar `.bpz` regularmente.

**Veredicto comercial (Caminho B aprovado):** Acompanhamento técnico gratuito entre pares hoje. Porta aberta para parceria futura quando Moreira tiver 2-3 clientes pagantes em operação. Zero anúncios do Eurico no bot dele sem aprovação. Zero comissão sobre clientes dele.

### Q5 — AGENTE HUMANO VS BASEKNOWLEDGE
**Veredicto:** O pressuposto da pergunta tem um erro. `KnowledgeAgent.answerManually: true` JÁ impede a KB de responder automaticamente. Problema real: `conversation.handoff = true` é flag inerte — escrita em 2 nós (linhas 4690 + 4904) mas ninguém a lê. Não há agente humano conectado.

**3 caminhos:**
- **A. Email/WhatsApp assíncrono** (Free, zero custo) — recomendado para começar
- **B. HITL nativo Botpress** (Plus $89/mês) — quando volume >30-50 conversas/mês ou 2-3 clientes pagantes
- **C. Zendesk** — só se já for cliente Zendesk (não é o caso, ignorar)

Hooks `track_iterations` + `inject_learnings`: sistema `agi/improvement` v1.0.2, NÃO tocam handoff nem KB. Ignorar nesta decisão.

---

## ERROS v2 CONSOLIDADO — 17 NO TOTAL

| Questão | Erros v2 |
|---------|----------|
| Q1 | 3 (Flag OFF, regra inventada, omite extensões) |
| Q2 | 4 (Frase prompt inventada, "LLMz instável" sem evidência, omite handleFailure, não alerta simetria) |
| Q3 | 5 (Bots/workspace errado, "Plano Pro" não existe, pricing clientes inventado, projecções mercado, cálculos payback) |
| Q4 | 2 (Contrato assumido, posição comercial inventada) |
| Q5 | 3 (Hook redundante, inverte prioridade email/hook, confunde Slack com HITL) |

**TOTAL: 17 erros factuais identificados na v2. NÃO usar v2 como base em nada.**

---

## PRÓXIMA ACÇÃO RECOMENDADA — terminal novo

### Primeira resposta do agente que assumir

```
Li o INDEX + handoff RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md.

Estado:
- 5 respostas TODAS revisadas com 7 micro-edições aplicadas
- Rascunhos validados em `02-prd/rascunho-q{1,2,3,4,5}-validado.md`
- Pronto para consolidar `resposta-moreira-v3.md` — aguarda 4 decisões meta tuas:

  1. Mapa de mercado v2? (1a manter / 1b reescrever / 1c omitir)
  2. 4 pontos urgentes .bpz? (2a todos re-verificados / 2b omitir / 2c só PAT)
  3. Agenda Zoom? (3a 2 slots / 3b 3 slots / 3c sem agenda) — bloqueante: precisa datas reais
  4. Próximos passos? (4a lista 3 / 4b lista 5 / 4c lista 7+)

Inclinações Uma: 1c, 2c, 3 a definir contigo, 4b. Decisão é tua.

Vamos UMA A UMA. Começamos pela Decisão 1?
```

### Depois das 4 decisões — protocolo para consolidar v3

1. **Re-verificar** (se Decisão 2 = 2a ou 2c):
   - Grep `clientName` e `ClientName` no bot.json para confirmar inconsistência
   - Grep `pat`, `AIRTABLE_PAT`, `Bearer\s+pat` no bot.json para confirmar exposição
   - Abrir `cloud_files.json` para ver se foto/PDF ainda listados
   - Só incluir factos confirmados hoje

2. **Consolidar `resposta-moreira-v3.md`** na ordem:
   - Saudação formal-cordial ("Sr. Eurico Alves", "Um abraço")
   - [Opcional se 1a ou 1b] Mapa de mercado
   - Q1 (do `rascunho-q1-validado.md` — JÁ revisado)
   - Q2 (do `rascunho-q2-validado.md` — JÁ revisado)
   - Q3 (do `rascunho-q3-validado.md` — JÁ revisado)
   - Q4 (do `rascunho-q4-validado.md` — JÁ revisado, técnica + comercial Caminho B)
   - Q5 (do `rascunho-q5-validado.md` — JÁ revisado)
   - [Opcional se 2a ou 2c] Nota sobre pontos urgentes .bpz
   - Próximos passos (3 ou 5 ou 7+ conforme Decisão 4)
   - Agenda Zoom (ou omitir se 3c)
   - Fecho cordial

3. **Apresentar ao Eurico** para aprovação final antes de guardar como `resposta-moreira-v3.md`

4. **Se aprovado:** guardar; Eurico envia ao Moreira

### O que NÃO fazer na sessão nova

- Consolidar v3 sem as 4 decisões do Eurico
- Adicionar conteúdo além dos 5 rascunhos + o que o Eurico autorizar
- Re-abrir as 5 respostas — estão fechadas e revisadas
- Tocar em `resposta-moreira-v2.md` (é referência histórica)
- Apresentar várias decisões em simultâneo — Eurico quer **uma a uma** com método

---

## FONTES DE VERDADE (paths críticos)

### Rascunhos validados E revisados (fonte directa para v3)

- `membros/jose-moreira/02-prd/rascunho-q1-validado.md` ← **REVISTO 25/04 (2 edições)**
- `membros/jose-moreira/02-prd/rascunho-q2-validado.md` ← **REVISTO 25/04 (2 edições)**
- `membros/jose-moreira/02-prd/rascunho-q3-validado.md` ← **REVISTO 25/04 (1 edição)**
- `membros/jose-moreira/02-prd/rascunho-q4-validado.md` ← **REVISTO 25/04 (2 edições)**
- `membros/jose-moreira/02-prd/rascunho-q5-validado.md` ← **REVISTO 25/04 (0 edições — factos 100% sólidos)**

### Material do bot

| Recurso | Path | Nota |
|---------|------|------|
| **bot.json** | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/bot.json` | 268KB, 5624 linhas |
| Cloud files | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/cloud_files.json` | Lista anexos |
| Config webchat | `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` | Fetch via WebFetch |
| Screenshots Moreira | `membros/jose-moreira/02-prd/auditoria-profunda-v2/working/user-chat-*.jpg` | 4 screenshots Chrome Android |
| KB HTML | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/files/file_01KMX11455XEY342P2KSA51ZMP` | Rich Text File |

### Briefing Moreira

- `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` (frases exactas das 5 questões)

### Referências (NÃO usar como base)

- `membros/jose-moreira/02-prd/resposta-moreira-v2.md` — V2 com 17 erros, só referência histórica
- `membros/jose-moreira/02-prd/respostas-5-questoes-moreira-v1-DESCONTINUADO.md` — V1 descontinuada

### Doc Botpress oficial (URLs validados nesta sessão)

- ✅ `https://botpress.com/pricing` — pricing actualizado
- ⚠️ `https://botpress.com/docs/cloud/admin-dashboard/managing-workspaces` — **404 hoje** (URL movido)
- ⚠️ `https://botpress.com/docs/get-started/manage-your-agent/workspaces` — **404 hoje**
- ✅ `https://botpress.com/docs/get-started/manage-your-agent/human-handoff.md` (validado em sessão 22/04)
- ✅ `https://botpress.com/docs/studio/concepts/agents/hitl-agent.md` (validado em sessão 22/04)
- ✅ `https://botpress.com/docs/studio/concepts/agents/knowledge-agent.md` (validado em sessão 22/04)
- ✅ `https://botpress.com/docs/llms.txt` (index)

### Factos confirmados do bot (cross-check rápido)

| Chave | Valor |
|-------|-------|
| Bot ID | `e7e5db81-ad3c-45e2-bf25-033d76b04059` (linha 9) |
| Email Moreira | `josemmoreira1@gmail.com` (linha 5600) |
| workspaceUserId | `0947e877-3373-45f2-8983-5c385007d6b1` (linhas 5503, 5552, 5553, 5600) |
| Airtable BASE_ID | `app7S6wEWqhpQgMEV` (linha 16) |
| Apoio_Humano_PT nodeId | `nd-c8ccfc4867` |
| Human_Support_EN nodeId | `nd-d3e1d24fd9` |
| Variável File partilhada | `var-0b3eeb9be7` |
| `conversation.handoff = true` | linhas **4690** (PT) + **4904** (EN) — apenas escritas, ninguém lê |
| Hook `track_iterations` | `hk-99mudt`, `after_llmz_execution`, integration `agi/improvement` v1.0.2 (linha 5310) |
| Hook `inject_learnings` | `hk-1q8lg5q`, `before_llmz_execution`, integration `agi/improvement` v1.0.2 (linha 5328) |
| `KnowledgeAgent.answerManually` | `true` (linha 5366) |
| `KnowledgeAgent.bestModel` | `gpt-4-turbo` (linha 5368) |
| `KnowledgeAgent.context` | usa `{{conversation.SummaryAgent.summary}}` + `{{conversation.SummaryAgent.transcript}}` (linha 5367) |
| `defaultBestModel` (workspace) | `openai__gpt-4.1-2025-04-14` (linha 23) |
| `defaultFastModel` (workspace, usado em captures) | `openai__gpt-4.1-mini-2025-04-14` (linha 24) |
| `VisionAgent.enabled` | `true` (linha 5380) |
| `VisionAgent.extractionEnabled` | `true` (linha 5383) |
| **Total nodes no bot** | **45** (grep `"id": "nd-`) |
| **Nodes só no flow Main (`wf-main`)** | **33** (validado na Q3) |
| 4 flows | `wf-error` (linha 47, "Error") + `wf-timeout` (172, "Timeout") + `wf-conversation-end` (269, "Conversation End") + `wf-main` (383, "Main") |
| 2 frases PT capture | "Por favor, descreva a sua dúvida." (4512) + "Se desejar, pode anexar aqui um print screen ou documento sobre o problema." (4584) |
| `maxRetries` | **2** (em todos os captures) |
| `handleFailure` | **false** (em todos os captures) |
| `allowFileUpload` (configUrl público) | `true` (confirmado WebFetch) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md`. ESTÁ DENTRO DA PASTA DO PROJECTO MOREIRA. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` E `.claude/rules/workspace-governance.md` PARA DETALHES.

---

## PROTOCOLO DE TRABALHO (inalterado desde 22/04)

### Regras inegociáveis

- **Sem inventar factos.** Se o bot.json não diz, não digo
- **Sem seguir a v2.** V2 tem 17 erros confirmados
- **PT-PT obrigatório**
- **Sem "garantido", "fácil", "revolucionário", "automático", "curso"**
- **Tom formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves"
- **NÃO PROJECTAR MODELO DE NEGÓCIO** sem o Moreira propor formato concreto
- **NÃO consolidar v3 sem as 4 decisões do Eurico**
- **CRITÉRIO ÚNICO DO EURICO:** "dar a informação certa". Edições só se servem clareza factual
- **APRESENTAR DECISÕES UMA A UMA** — não despejar as 4 de uma vez

---

## CHECKLIST DE SELF-AUDIT DESTE HANDOFF

- [x] Path correcto: `membros/jose-moreira/handoffs/` ✅
- [x] Nomenclatura: `RETOMA-YYYYMMDD-slug.md` ✅
- [x] Data correcta: 20260425 ✅
- [x] Aviso inicial da regra handoff-location incluído ✅
- [x] Lembrete do meio incluído ✅
- [x] Confirmação final incluída ✅
- [x] 5 respostas referenciadas com estado (TODAS revisadas) ✅
- [x] **7 edições registadas linha-a-linha** (regra `mandatory-change-log.md`) ✅
- [x] Verificações executadas com resultado e fonte ✅
- [x] 4 decisões pendentes claramente marcadas com opções ✅
- [x] Inclinações Uma declaradas (mas decisão é do Eurico) ✅
- [x] Factos confirmados com path/URL/linhas das fontes ✅
- [x] 17 erros v2 consolidados ✅
- [x] Rascunhos Q1-Q5 referenciados com path + nota "REVISTO 25/04" ✅
- [x] Regras de tom e comunicação incluídas ✅
- [x] Próxima acção detalhada com primeira resposta para terminal novo ✅
- [x] Referência ao briefing original ✅
- [x] IDs/factos confirmados do bot listados (com linhas) ✅
- [x] PT-PT ✅

### Pontos de risco que ficam no handoff

1. **4 decisões do Eurico são bloqueantes** — agente novo NÃO deve consolidar v3 sem elas
2. **Decisão 3 (Agenda) precisa de DATAS REAIS** — datas v2 (Ter 21, Qui 23, Sex 24) já passaram. Eurico tem de dar slots concretos
3. **Re-verificar antes de incluir 4 pontos urgentes** — se Decisão 2 = 2a ou 2c, agente DEVE re-greppar bot.json + cloud_files.json
4. **URL doc Botpress workspace roles 404** — afirmação dos 6 roles validada visualmente; se Moreira pedir link, dizer "Studio → Workspace settings → Members"
5. **NÃO apresentar 4 decisões em simultâneo** — Eurico quer método uma-a-uma como nas 5 respostas
6. **Próximos passos devem ser accionáveis** — não listas abstractas (ex: "activar handleFailure: true no nó X" em vez de "melhorar capture")

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** jose-moreira (José Moreira, cliente real do Eurico, Viana do Castelo)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md`
- **COINCIDEM?** SIM ✅

AGENTE RESPONSÁVEL: `ux-design-expert (Uma)`
DATA: 25/04/2026
TERMINAL: terminal actual (sessão muito baixa, Eurico pediu handoff para continuar noutro terminal)
HANDOFF ANTERIOR: `RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md` (consumido nesta sessão — a arquivar)

---

## FIM DO HANDOFF

Se estás a ler isto numa sessão nova: **começa pela secção "PRÓXIMA ACÇÃO RECOMENDADA"** acima. As 5 respostas estão **TODAS revisadas com 7 edições aplicadas e factos 100% verificados**. O que o Eurico precisa de ti agora é responder às 4 decisões meta **uma a uma**, no mesmo método cuidadoso que usámos para revisar as 5 respostas. Depois consolidas v3. Nada mais.

**Pergunta de abertura ao Eurico:** "Pronto para a Decisão 1 — Mapa de mercado?"
