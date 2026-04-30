# RETOMA — Moreira 5 questões TODAS aprovadas, aguarda 4 decisões antes de consolidar v3

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: any
created: 2026-04-22
status: consumed
consumed: true
consumed_at: 2026-04-25
consumed_by: ux-design-expert (Uma)
superseded_by: RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md
project: jose-moreira (membros/jose-moreira/)
session_type: consolidacao-v3-aguarda-4-decisoes
questoes_totais: 5
questoes_aprovadas: 5  # TODAS
rascunhos_guardados: 5
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\02-prd
handoff_anterior: RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md (consumido 22/04/2026)
next_critical_action: "Eurico responde 4 decisões antes de consolidar resposta-moreira-v3.md"
```

---

## ⚠️ AVISO CRÍTICO (LER PRIMEIRO)

Regras activas para qualquer trabalho Moreira:

1. **Uma questão de cada vez** — todas validadas, mas consolidação em v3 exige autorização explícita
2. **Evidência dura** — bot.json real + configUrl + screenshots + doc Botpress oficial
3. **Só comparar com v2 no fim** — já feito, 16 erros v2 identificados (ver abaixo)
4. **NUNCA inventar** — se não há evidência, admitir incerteza
5. **NÃO PROJECTAR MODELO DE NEGÓCIO** — regra activa `feedback_no_projected_business_models.md`
6. **PT-PT formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves" + "Um abraço"
7. **NÃO consolidar v3 sem autorização explícita do Eurico**

---

## ESTADO ACTUAL — RESUMO EXECUTIVO

### As 5 questões estão TODAS validadas e guardadas

| Q | Tema | Estado | Ficheiro |
|---|------|--------|----------|
| Q1 | UPLOAD QUE SOME | APROVADA ✅ 21/04 | `02-prd/rascunho-q1-validado.md` |
| Q2 | SKIP NO APOIO HUMANO | APROVADA ✅ 21/04 | `02-prd/rascunho-q2-validado.md` |
| Q3 | REPLICAÇÃO | APROVADA ✅ 21/04 | `02-prd/rascunho-q3-validado.md` |
| Q4 | AUTORIA E CONTROLO (técnica + comercial Caminho B) | APROVADA ✅ 22/04 | `02-prd/rascunho-q4-validado.md` |
| Q5 | AGENTE HUMANO VS BASEKNOWLEDGE | APROVADA ✅ 22/04 | `02-prd/rascunho-q5-validado.md` |

### O que aconteceu na sessão 22/04 (Uma)

1. Consumido handoff anterior (Q4 parte técnica aprovada + Q5 pendente)
2. Eurico escolheu **Caminho B para Q4 comercial** (porta aberta sem preço inventado)
3. Uma redigiu Q4 secção comercial Caminho B
4. Uma consultou bot.json linhas 5305-5386 (hooks `track_iterations`, `inject_learnings`, `KnowledgeAgent`) + 3 WebFetch ao doc oficial Botpress (HITL, Knowledge Agent, llms.txt index)
5. Uma redigiu Q5 completa com factos duros
6. Eurico aprovou ambas ("ok aprovo")
7. Uma guardou `rascunho-q4-validado.md` + `rascunho-q5-validado.md`

---

## 🟡 DECISÕES PENDENTES — 4 PONTOS ANTES DE CONSOLIDAR v3

O Eurico deve responder aos 4 pontos abaixo antes de qualquer agente criar `resposta-moreira-v3.md`. Sem estas decisões, a consolidação arrisca repetir erros v2.

### Ponto 1 — Mapa de mercado (Parte 1 da v2)

A v2 abria com um "Mapa de mercado PME Viana do Castelo" com projecções, número de empresas, segmentos alvo. Decisão a tomar:

| Opção | Essência |
|-------|----------|
| **1a** | Manter mapa de mercado tal qual v2 |
| **1b** | Reescrever o mapa adaptado ao tom validado das 5 questões (formal-cordial, zero invenção, sem projecções de adopção) |
| **1c** | Omitir completamente — o Moreira não pediu mapa de mercado, e isto viola `feedback_no_projected_business_models.md` |

**Inclinação Uma:** Opção 1c (omitir). O Moreira pediu 5 perguntas técnicas específicas, não pediu análise de mercado. Adicionar isso é projectar valor que ele não pediu. Mas decisão é do Eurico.

### Ponto 2 — 4 pontos urgentes detectados pela v2 no `.bpz`

A v2 identificou 4 problemas no ficheiro `.bpz` do Moreira:

1. **PAT Airtable exposto** no .bpz (linha 5600 do bot.json) → deve revogar e rodar
2. **Foto pessoal pública** na KB HTML → tornar privada
3. **PDF com CV** na KB → apagar se não é para conhecimento do bot
4. **Variáveis inconsistentes** `clientName` vs `ClientName` → bug funcional (Airtable pode receber Nome vazio)

| Opção | Essência |
|-------|----------|
| **2a** | Re-verificar agora no bot.json + cloud_files.json + KB se ainda são válidos e incluir no v3 os que forem confirmados |
| **2b** | Omitir — não são as 5 perguntas do Moreira, é adicionar escopo que ele não pediu |
| **2c** | Incluir apenas o ponto (1) PAT exposto — é risco de segurança real, os outros são opcionais |

**Inclinação Uma:** Opção 2c com nota curta. Ponto 1 (PAT) é risco de segurança que qualquer dev responsável sinaliza ao entregar auditoria — mesmo não pedido. Os outros 3 são escopo extra, omitir.

**Acção obrigatória se 2a ou 2c:** agente novo DEVE re-verificar no bot.json que os factos ainda são válidos antes de incluir. Grep por:
- `clientName` (case-sensitive) e `ClientName`
- `pat` ou `AIRTABLE_PAT` para confirmar exposição
- Abrir `cloud_files.json` para ver se foto/PDF ainda listados

### Ponto 3 — Agenda Zoom

Hoje é 22/04/2026 (terça já passou). V2 propunha 3 opções: Ter 21, Qui 23, Sex 24. Opções em aberto:

| Opção | Datas propostas |
|-------|-----------------|
| **3a** | Qui 24 abr 18:00 + Sex 25 abr 18:00 |
| **3b** | Qui 24 abr + Sáb 26 abr |
| **3c** | 3 opções diferentes — Eurico dá datas |
| **3d** | Sem agenda Zoom — só enviar respostas escritas, Moreira pede reunião se quiser |

**Inclinação Uma:** Opção 3a (2 opções simples, manhã ou tarde/noite). Mas decisão depende da disponibilidade real do Eurico.

**NOTA:** hoje é 22/04, portanto Qui 23 também é opção válida se o Eurico quiser ritmo rápido. Confirmar.

### Ponto 4 — Próximos passos concretos para o Moreira

Com base nas 5 questões validadas, listar 3 a 5 passos concretos que o Moreira deve executar. Opções:

| Opção | Lista proposta |
|-------|----------------|
| **4a** | Lista curta (3): testar webchat em modo normal sem extensões (Q1), activar `handleFailure: true` no capture (Q2), definir Caminho A ou B para Q5 (email ou HITL) |
| **4b** | Lista média (5): Q1 + Q2 + Q3 Modelo A (primeiro cliente com conta própria gratuita) + Q4 roles (Viewer por defeito) + Q5 Caminho A (implementação email) |
| **4c** | Lista longa (7+): incluir também auditoria segurança (se 2c), exportar `.bpz`, rever KB, etc. |

**Inclinação Uma:** Opção 4b. Cobre as 5 questões com acção concreta sem sobrecarregar. 5 passos em 1 página é ritmo que o Moreira consegue executar.

---

## AS 5 RESPOSTAS VALIDADAS — RESUMO EXECUTIVO

### Q1 — UPLOAD QUE SOME

Ficheiro: `02-prd/rascunho-q1-validado.md`

**Veredicto:** Causa é cache local ou extensão de browser Chrome Android. `allowFileUpload: true` JÁ activo no webchat (verificado via WebFetch ao configUrl). Não há "regra que desactiva upload para utilizadores identificados" (v2 inventou).

**Erros v2:** 3 (assume flag OFF, inventa regra, omite extensões)

### Q2 — SKIP NO APOIO HUMANO

Ficheiro: `02-prd/rascunho-q2-validado.md`

**Veredicto:** File Upload não tem skip nativo no Botpress. Solução recomendada: Choice capture ANTES do File capture. Alternativa: `handleFailure: true`. Simetria obrigatória PT/EN (partilham `variableId: var-0b3eeb9be7`). Prompt PT exacto: *"Se desejar, pode anexar aqui um print screen ou documento sobre o problema."*

**Erros v2:** 4 (frase inventada, afirmação "LLMz instável" sem evidência, omite handleFailure, não alerta simetria)

### Q3 — REPLICAÇÃO

Ficheiro: `02-prd/rascunho-q3-validado.md`

**Veredicto:** 3 modelos de replicação (A: cada cliente com conta própria gratuita + Moreira como colaborador; B: bots na conta Plus $89/mês limitado a 2 bots; C: Enterprise). Plano Free = 1 bot / 500 msgs / $5 AI credit / 100MB vector. Plano "Pro" não existe — é Plus ($89) ou Team ($495).

**Erros v2:** 5 (bots por workspace Free errado, "Plano Pro" inventado, pricing clientes inventado, projecções de mercado inventadas, cálculos payback)

### Q4 — AUTORIA E CONTROLO

Ficheiro: `02-prd/rascunho-q4-validado.md`

**Veredicto técnico:** Autoria protegida por design no Botpress (workspace em nome do Moreira, 4 flows, 33 nodes, PAT Airtable). 6 roles Botpress — Admin é só do Moreira; clientes/terceiros entram no máximo como Viewer. Exportar `.bpz` regularmente.

**Veredicto comercial (Caminho B aprovado):** Acompanhamento técnico gratuito entre pares hoje. Porta aberta para parceria futura quando Moreira tiver 2-3 clientes pagantes em operação — co-marketing, afiliação voluntária, ou outra fórmula a desenhar com dados reais. Zero anúncios do Eurico no bot dele sem aprovação explícita. Zero comissão sobre clientes dele.

**Erros v2:** 2 (contrato 1 página assumido como decisão, posição comercial inventada)

### Q5 — AGENTE HUMANO VS BASEKNOWLEDGE

Ficheiro: `02-prd/rascunho-q5-validado.md`

**Veredicto:** O pressuposto da pergunta tem um erro. `KnowledgeAgent.answerManually: true` JÁ impede a KB de responder automaticamente (doc oficial: *"your bot won't automatically provide answers in the conversation"*). Problema real: `conversation.handoff = true` é flag inerte — escrita em 2 nós mas ninguém a lê. Não há agente humano conectado.

**3 caminhos:**
- **A. Email/WhatsApp assíncrono** (Free, zero custo) — recomendado para começar
- **B. HITL nativo Botpress** (Plus $89/mês) — quando volume >30-50 conversas/mês ou 2-3 clientes pagantes
- **C. Zendesk** — só se já for cliente Zendesk (não é o caso, ignorar)

**Hooks `track_iterations` + `inject_learnings`:** Sistema `agi/improvement`, NÃO tocam handoff nem KB. Ignorar nesta decisão.

**Erros v2:** 3 (propõe hook desnecessário porque answerManually já controla, inverte prioridade email/hook, confunde Slack/WhatsApp com HITL nativo)

---

## ERROS v2 CONSOLIDADO — 17 NO TOTAL

| Questão | Erros v2 | Detalhes |
|---------|----------|----------|
| Q1 | 3 | Flag OFF (é TRUE), regra inventada, omite extensões |
| Q2 | 4 | Frase prompt inventada, "LLMz instável" sem evidência, omite handleFailure, não alerta simetria |
| Q3 | 5 | Bots/workspace errado, "Plano Pro" não existe, pricing clientes inventado, projecções mercado, cálculos payback |
| Q4 | 2 | Contrato assumido, posição comercial inventada |
| Q5 | 3 | Hook redundante (answerManually já resolve), inverte prioridade email/hook, confunde Slack com HITL |

**TOTAL:** 17 erros factuais identificados na v2. **NÃO usar v2 como base em nada.**

---

## PRÓXIMA ACÇÃO RECOMENDADA (sessão nova)

### Primeira resposta do agente que assumir

```
Li o INDEX + handoff RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md.

Estado:
- 5 questões TODAS aprovadas com rascunhos em `02-prd/rascunho-q{1,2,3,4,5}-validado.md`
- Pronto para consolidar `resposta-moreira-v3.md` — aguarda 4 decisões tuas:

  1. Mapa de mercado v2? (1a manter / 1b reescrever / 1c omitir)
  2. 4 pontos urgentes .bpz? (2a todos re-verificados / 2b omitir / 2c só PAT)
  3. Agenda Zoom? (3a Qui 24+Sex 25 / 3b Qui 24+Sáb 26 / 3c outras datas / 3d sem agenda)
  4. Próximos passos? (4a lista 3 / 4b lista 5 / 4c lista 7+)

Inclinações Uma: 1c, 2c, 3a, 4b. Mas decisão é tua.

Diz-me as 4 escolhas e consolido v3.
```

### Depois das 4 decisões — protocolo para consolidar v3

1. **Re-verificar** (se Ponto 2 = 2a ou 2c):
   - Grep `clientName` e `ClientName` no bot.json para confirmar inconsistência
   - Grep `pat`, `AIRTABLE_PAT` no bot.json para confirmar exposição
   - Abrir `cloud_files.json` para ver se foto/PDF ainda listados
   - Só incluir factos confirmados hoje

2. **Consolidar `resposta-moreira-v3.md`** na ordem:
   - Saudação formal-cordial ("Sr. Eurico Alves", "Um abraço")
   - [Opcional se 1a ou 1b] Mapa de mercado
   - Q1 (do rascunho-q1-validado.md)
   - Q2 (do rascunho-q2-validado.md)
   - Q3 (do rascunho-q3-validado.md)
   - Q4 (do rascunho-q4-validado.md — técnica + comercial)
   - Q5 (do rascunho-q5-validado.md)
   - [Opcional se 2a ou 2c] Nota sobre pontos urgentes .bpz
   - Próximos passos (3 ou 5 ou 7+ conforme Ponto 4)
   - Agenda Zoom (ou omitir se 3d)
   - Fecho cordial

3. **Apresentar ao Eurico** para aprovação final antes de guardar como `resposta-moreira-v3.md`

4. **Se aprovado:** guardar, e Eurico envia ao Moreira

### Não fazer na sessão nova

- Consolidar v3 sem as 4 decisões do Eurico
- Adicionar conteúdo além dos 5 rascunhos + o que o Eurico autorizar
- Tocar em `resposta-moreira-v2.md` (é referência histórica)
- Re-abrir debate sobre as 5 questões aprovadas — estão fechadas

---

## FONTES DE VERDADE (paths críticos)

### Rascunhos validados (fonte directa para v3)

- `membros/jose-moreira/02-prd/rascunho-q1-validado.md`
- `membros/jose-moreira/02-prd/rascunho-q2-validado.md`
- `membros/jose-moreira/02-prd/rascunho-q3-validado.md`
- `membros/jose-moreira/02-prd/rascunho-q4-validado.md` ← **NOVO**
- `membros/jose-moreira/02-prd/rascunho-q5-validado.md` ← **NOVO**

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

- https://botpress.com/docs/get-started/manage-your-agent/human-handoff.md
- https://botpress.com/docs/studio/concepts/agents/hitl-agent.md
- https://botpress.com/docs/studio/concepts/agents/knowledge-agent.md
- https://botpress.com/docs/llms.txt (index)
- https://botpress.com/pricing

### Factos confirmados do bot (cross-check rápido)

| Chave | Valor |
|-------|-------|
| Bot ID | `e7e5db81-ad3c-45e2-bf25-033d76b04059` |
| Email Moreira | `josemmoreira1@gmail.com` |
| workspaceUserId | `0947e877-3373-45f2-8983-5c385007d6b1` |
| Airtable BASE_ID | `app7S6wEWqhpQgMEV` |
| Apoio_Humano_PT nodeId | `nd-c8ccfc4867` |
| Human_Support_EN nodeId | `nd-d3e1d24fd9` |
| Variável File partilhada | `var-0b3eeb9be7` |
| Hook track_iterations | `hk-99mudt` (after_llmz_execution, agi/improvement) |
| Hook inject_learnings | `hk-1q8lg5q` (before_llmz_execution, agi/improvement) |
| KnowledgeAgent answerManually | `true` (bot.json linha 5366) |
| conversation.handoff variable | `var-bdc2744422` (boolean, conversation scope) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md`. ESTÁ DENTRO DA PASTA DO PROJECTO MOREIRA. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` E `.claude/rules/workspace-governance.md` PARA DETALHES.

---

## PROTOCOLO DE TRABALHO (inalterado)

### Regras inegociáveis

- **Sem inventar factos.** Se o bot.json não diz, não digo
- **Sem seguir a v2.** V2 tem 17 erros confirmados
- **PT-PT obrigatório**
- **Sem "garantido", "fácil", "revolucionário", "automático", "curso"**
- **Tom formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves"
- **NÃO PROJECTAR MODELO DE NEGÓCIO** sem o Moreira propor formato concreto
- **NÃO consolidar v3 sem as 4 decisões do Eurico**

---

## CHECKLIST DE SELF-AUDIT DESTE HANDOFF

- [x] Path correcto: `membros/jose-moreira/handoffs/` ✅
- [x] Nomenclatura: `RETOMA-YYYYMMDD-slug.md` ✅
- [x] Data correcta: 20260422 ✅
- [x] Aviso inicial da regra handoff-location incluído ✅
- [x] Lembrete do meio incluído ✅
- [x] Confirmação final incluída ✅
- [x] 5 questões referenciadas com estado e ficheiro ✅
- [x] 4 decisões pendentes claramente marcadas com opções ✅
- [x] Inclinações Uma declaradas (mas decisão é do Eurico) ✅
- [x] Factos confirmados com path/URL das fontes ✅
- [x] 17 erros v2 consolidados ✅
- [x] Rascunhos Q1-Q5 referenciados com path ✅
- [x] Regras de tom e comunicação incluídas ✅
- [x] Próxima acção detalhada ✅
- [x] Referência ao briefing original ✅
- [x] IDs/factos confirmados do bot listados ✅
- [x] PT-PT ✅

### Pontos de risco que ficam no handoff

1. **4 decisões do Eurico são bloqueantes** — agente novo NÃO deve consolidar v3 sem elas
2. **Re-verificar antes de incluir 4 pontos urgentes** — o .bpz é de 2026 Apr 15, os factos podem ter mudado se o Moreira já tocou neles
3. **Agenda Zoom precisa actualização** — 21 e 23 de Abril já passaram no momento da leitura, confirmar com Eurico
4. **Próximos passos devem ser accionáveis** — não listas abstractas, mas acções concretas (ex: "activar handleFailure: true no nó X" em vez de "melhorar capture")

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** jose-moreira (José Moreira, cliente real do Eurico, Viana do Castelo)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md`
- **COINCIDEM?** SIM ✅

AGENTE RESPONSÁVEL: `ux-design-expert (Uma)`
DATA: 22/04/2026
TERMINAL: terminal actual (Eurico pediu handoff para continuar noutro terminal)
HANDOFF ANTERIOR: `RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md` (consumido nesta sessão — a arquivar)

---

## FIM DO HANDOFF

Se estás a ler isto numa sessão nova: **começa pela secção "PRÓXIMA ACÇÃO RECOMENDADA"** acima. O que o Eurico precisa de ti é responder às 4 decisões para consolidares o v3. Nada mais. As 5 questões estão fechadas.
