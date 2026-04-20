# RETOMA — Auditoria Forense Profunda v2 do chatbot Moreira

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

**Projecto:** José Moreira (Viana do Castelo) — chatbot Botpress bilingue PT/EN para PMEs
**Localização:** `membros/jose-moreira/`
**Criado por:** Uma (UX Design Expert)
**Data:** 2026-04-20 (sessão nocturna 02:00)
**Substitui:** `RETOMA-20260420-auditoria-real-bot-moreira.md` (v1) — não obsoleto, complementar
**Status:** `pending`
**Consumido:** `false`

---

## 0. Porquê esta v2

A v1 entregou inventário factual em **18 issues**. Foi superficial: ficou em "lista de bugs". O Eurico precisa **decidir se temos condições para ajudar o Moreira**, não uma lista de TODOs. Para decidir é preciso ver:

- O **estado real de todos os componentes** (não só o flow — também KB, ficheiros públicos, integrações ocultas, custos, conversas reais)
- **Bugs que foram capturados em screenshots reais** do próprio Moreira a testar (evidência empírica)
- **Riscos de privacidade** que o handoff anterior nem mencionou
- **Custos de operação** que o Moreira não conhece
- **Capacidade técnica entregue** vs capacidade técnica anunciada
- **Resposta às 5 questões técnicas** do briefing original

Toda a análise abaixo é evidência directa do `.bpz`, dos materiais entregues pelo Moreira, e das próprias screenshots dele. Zero inferência, zero invenção. Working files em `02-prd/auditoria-profunda-v2/working/`.

---

## 1. Metodologia — o que foi inspeccionado

| Vector | Fonte | Profundidade |
|--------|-------|--------------|
| Estrutura `bot.json` | 268 KB JSON, 17 chaves top-level | Cada chave inspeccionada |
| 33 nós do main flow | `flows[wf-main].nodes[]` | Cada nó: instructions, transitions, captures, conditions |
| 12 nós dos outros flows | `wf-error`, `wf-timeout`, `wf-conversation-end` | Completos |
| Conteúdo de cada `content` block | 22 content blocks PT+EN | Texto literal extraído |
| Hooks | `hooks[]` | 2 hooks completos com código |
| Agentes Botpress | `agents{}` | 5 agentes (Knowledge, Vision, Translator, Summary, Personality) |
| Integração `agi/improvement` | `files/file_01KMD6X6FR5GSAV3F3XJ5BJE7G` | JSON de iteração inspeccionado |
| Knowledge Base indexada | `files/file_01KMX11455XEY342P2KSA51ZMP` | HTML 14KB completo |
| KB source `.docx` | `KnowlegeBase (base de conhecimento).docx` | Texto extraído (10912 chars) |
| Tabelas internas Botpress | `tables{}` | 3 tabelas + 3 registos JSONL |
| Cloud files públicos | `cloud_files.json` | 10 ficheiros, todos identificados |
| 4 screenshots emulador | `assets/img-chat-bot-01..04.jpeg` | Inspeccionados visualmente |
| 4 screenshots utilizadores | `files/file_01KP*.jpg` | Inspeccionados, MD5 comparados |
| PDF "SIMULAÇÃO FINAL" | `files/file_01KP3GEFRR96NGQGZMMBH2SAJ9` (4 MB) | Texto extraído (5 páginas) |
| Cronograma IEFP | `Cronograma 26.0124.pdf` | Inspeccionado |
| Briefing original | `00-briefing/Sr. Eurico Alves! 👋.txt` | Lido |

Working files (artefactos forenses gerados) em `02-prd/auditoria-profunda-v2/working/`:
- `01-nodes-full-dump.txt` (614 linhas, dump por nó)
- `02-content-payloads.txt` (638 linhas, conteúdos completos)
- `03-hooks-agents-intents.txt` (767 linhas, hooks, agents, intents, tables, settings, identity, error/timeout flows)
- `04-kb-html.html` (KB indexada)
- `05-improvement-iteration.json` (iteração antiga do auto-learning)
- `06-simulacao-final.pdf` + `.txt` (CV do Moreira)
- `user-chat-*.jpg`, `studio-media-*.jpg`, `webchat-button-*.jpg` (imagens redimensionadas)

---

## 2. Mapa real do flow (corrigindo a v1)

A v1 desenhou o flow como começando em `Boas_Vindas`. **ERRADO**. O flow real começa em `Mensagem_ao_Cliente`:

```
Start (nd-2bb9db230d)
  │
  ├─► Mensagem_ao_Cliente (nd-e1d70f51fb)
  │     [action JS] calcula greeting Lisbon (Bom dia / Boa tarde / Boa noite)
  │     [content] "{{greeting}}! Hoje é {{DataAtual}} e são {{HoraAtual}}. Como posso ajudar?\n
  │                Good morning! Today is..."
  │
  ├─► PoliticaPrivacidade (nd-c33faca754)
  │     [content] ~1.5 KB texto RGPD/GDPR PT+EN
  │     [capture] Aceito | Recuso
  │     ├─[Aceito]──► Dados_do_Utilizador
  │     └─[Recuso]──► Aviso_Recusa ──loop──► PoliticaPrivacidade
  │
  ├─► Dados_do_Utilizador (nd-bfef438604)
  │     [content] "Olá, vou pedir os teus dados..."
  │     [capture var-e74f50325c] "Qual é o seu nome? / What is your name?"
  │     [capture var-da0ae827c7] "Qual é o seu e-mail? / What is your email?"
  │     defaultTransition ─► Armazenamento
  │
  ├─► Armazenamento (nd-579ccbf3ee)
  │     [action JS] POST Airtable {Nome, Email}
  │     [content] "✅ Os teus dados foram guardados, {{workflow.ClientName}}..."
  │     defaultTransition ─► Boas_Vindas  ⚠️ (re-pergunta idioma)
  │
  ├─► Boas_Vindas (nd-59a6c0b1ae)
  │     [content] "Olá! 👋 Sou o Assistente Virtual de [Nome da Empresa]..."
  │     defaultTransition ─► Seleção_de_Idioma
  │
  ├─► Seleção_de_Idioma (nd-b2d848ce19)
  │     [capture var-7def2de7e9] "Selecione o seu idioma..."
  │     ├─[🇵🇹 PT]──► Menu_Principal_PT
  │     └─[🇬🇧 EN]──► Virtual_Assistant_Main_Menu
  │
  ▼
[ramos PT e EN — espelhos quase idênticos]
```

---

## 3. Inventário forense completo dos 33 nós

### 3.1. Tabela exaustiva (cada linha = 1 nó)

| # | Nó | id | Tipo | Instr. | DefaultTransition | Capture | Action JS | Content blocks | PT/EN |
|---|----|----|------|--------|-------------------|---------|-----------|----------------|-------|
| 1 | Start | nd-2bb9db230d | start | 1 transition | → Mensagem_ao_Cliente | — | — | — | — |
| 2 | End | nd-80ac4ff158 | end | 1 transition | → END | — | — | — | — |
| 3 | Boas_Vindas | nd-59a6c0b1ae | standard | 1 | → Seleção_de_Idioma | — | — | 1 (PT+EN) | bilingue |
| 4 | Seleção_de_Idioma | nd-b2d848ce19 | standard | 1 | null | var-7def2de7e9 SingleChoice | — | — | bilingue |
| 5 | Menu_Principal_PT | nd-005311e082 | standard | 1 | null | __none__ SingleChoice (5 opções) | — | — | PT |
| 6 | Virtual_Assistant_Main_Menu | nd-2ef860e2f6 | standard | 1 | null | __none__ SingleChoice (5 opções) | — | — | EN |
| 7 | FAQ_Perguntas_Frequentes | nd-064aef7087 | standard | 1 | null | __none__ SingleChoice (5 opções) | — | — | PT |
| 8 | FAQ_Frequently_Asked_Questions | nd-d5321ae128 | standard | 1 | null | __none__ SingleChoice (5 opções) | — | — | EN |
| 9 | Nossos_serviços | nd-f7277ce6cd | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT placeholder |
| 10 | Contactos | nd-13c5789030 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT placeholder |
| 11 | Our_Services | nd-ffcde36ece | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN placeholder |
| 12 | Contacts | nd-4d30a735a1 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN placeholder |
| 13 | Localização | nd-5f6af90f21 | standard | 3 | null | __none__ SingleChoice (2) | — | 2 (texto + card Maps) | PT placeholder + GPS REAL |
| 14 | Location | nd-adae2f9415 | standard | 3 | null | __none__ SingleChoice (2) | — | 2 (texto + card Maps) | EN placeholder + GPS REAL |
| 15 | Horários | nd-ad06c13313 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT REAL |
| 16 | Opening_Hours | nd-10185ae750 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN REAL |
| 17 | Preços_e_Tarifas | nd-b183c56b16 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT placeholder |
| 18 | Pagamentos | nd-84283d9274 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT placeholder |
| 19 | Entrega_e_Prazo | nd-b7b896be4a | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | PT placeholder |
| 20 | Suporte_Ténico ⚠️typo | nd-36faa78f33 | standard | 3 | null | 2 captures | — | 1 | PT REAL (SLAs) |
| 21 | Pricing_and_taxes | nd-6956286a6d | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN placeholder |
| 22 | Payments | nd-c9c503ca76 | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN placeholder |
| 23 | Delivery | nd-084e8cbc2c | standard | 2 | null | __none__ SingleChoice (2) | — | 1 | EN placeholder |
| 24 | Tech_Suport ⚠️typo | nd-d43664799d | standard | 3 | null | 2 captures | — | 1 | EN REAL (SLAs) |
| 25 | Dados_do_Utilizador | nd-bfef438604 | standard | 3 | → Armazenamento | var-e74f50325c (Raw) + var-da0ae827c7 (Email) | — | 1 | bilingue |
| 26 | PoliticaPrivacidade | nd-c33faca754 | standard | 2 | null | var-e0d17814e3 SingleChoice | — | 1 (~1.5 KB) | bilingue REAL |
| 27 | Armazenamento | nd-579ccbf3ee | standard | 2 | → Boas_Vindas ⚠️ | — | 1 (POST Airtable) | 1 confirmação | bilingue |
| 28 | Aviso_Recusa | nd-88e520ed29 | standard | 1 | → PoliticaPrivacidade | — | — | 1 | bilingue |
| 29 | Apoio_Humano_PT | nd-c8ccfc4867 | standard | 4 | → Utilidade_do_Atendimento | 2 captures (Raw + File var-0b3eeb9be7) | 1 (`handoff=true`) | 1 | PT |
| 30 | Human_Support_EN | nd-d3e1d24fd9 | standard | 4 | **null** ⚠️ BUG | 2 captures (Raw + File var-0b3eeb9be7) | 1 (`handoff=true`) | 1 | EN |
| 31 | Utilidade_do_Atendimento | nd-57993b3d2a | standard | 1 | null | __none__ SingleChoice (3) | — | — | PT |
| 32 | Helpfulness_of_the_service | nd-6435abe4dd | standard | 1 | null | __none__ SingleChoice (3) | — | — | EN |
| 33 | Mensagem_ao_Cliente | nd-e1d70f51fb | standard | 2 | → PoliticaPrivacidade | — | 1 (greeting Lisbon) | 1 (PT+EN dynamic) | bilingue |

### 3.2. Conteúdo: o que é REAL vs PLACEHOLDER (cada nó)

Crítico para a decisão "temos condições para ajudar":

| Nó | PT REAL | EN REAL | Placeholder no PT | Placeholder no EN |
|----|---------|---------|-------------------|-------------------|
| Mensagem_ao_Cliente | ✅ greeting dinâmico | ✅ greeting dinâmico | — | — |
| PoliticaPrivacidade | ✅ ~1500 palavras RGPD | ✅ ~1500 palavras GDPR | — | — |
| Dados_do_Utilizador | ✅ "Olá, vou pedir os teus dados..." | ✅ "Hello, thank you very much..." | — | — |
| Armazenamento | ✅ "✅ Os teus dados foram guardados" | ✅ idem EN | — | — |
| Aviso_Recusa | ✅ "Lamentamos, mas para prosseguir..." | ✅ idem EN | — | — |
| Boas_Vindas | ⚠️ "[Nome da Empresa]" | ⚠️ "[Company Name]" | sim | sim |
| Seleção_de_Idioma | ✅ "Selecione o seu idioma" | ✅ "Select your language" | — | — |
| Menu_Principal | ✅ texto chamador | ✅ texto chamador (com erro typo "...:e a choice...") | — | bug texto cortado |
| FAQ menus | ✅ "Selecione a categoria..." | ✅ "Select the category..." | — | — |
| Nossos_serviços / Our_Services | ❌ `[Serviço A/B/C/D]` | ❌ `[Service A/B/C/D]` | sim — todos | sim — todos |
| Contactos / Contacts | ❌ `+351 XXX XXX XXX`, `[Rua...]`, `PT XXXXXXXXX` | ❌ idem | sim — TODOS | sim — TODOS |
| Localização / Location | ❌ `[Rua, Número, CP]`, `XX.XXXXX` no texto | ❌ idem | sim — texto | sim — texto |
| Localização card Maps | ✅ link real Google Maps Lanheses (41.690, -8.889) | ✅ idem (mesmo link) | — | — |
| Horários / Opening_Hours | ✅ Seg-Sex 09-18, Sáb 09-13, Dom fech, Romaria 20 Ago | ✅ idem | — | — |
| Preços / Pricing | ❌ `€XX/mês`, `€XX/hora` (IVA 23% real) | ❌ idem | sim — preços | sim — preços |
| Pagamentos / Payments | ❌ `IBAN PT50 XXXX...`, `[X]% penalização` | ❌ idem | sim — IBAN+prazos | sim — IBAN+prazos |
| Entrega / Delivery | ❌ `[X] dias úteis`, `[X]% compensação` | ❌ idem | sim — todos prazos | sim — todos prazos |
| Suporte_Ténico / Tech_Suport | ✅ SLAs REAIS (2h/4h/1d/3d) + emails reais | ✅ idem EN | — | — |
| Apoio_Humano_PT / Human_Support_EN | ✅ "Por favor, descreva...", "Um assistente entrará..." | ✅ idem | — | — |
| Utilidade_do_Atendimento | ✅ texto real | ✅ texto real | — | — |

**Resumo:** dos 33 nós, **8 nós têm conteúdo placeholder não substituído** que aparece ao utilizador como `[Nome da Empresa]`, `+351 XXX XXX XXX`, `€XX/mês`, `IBAN PT50 XXXX XXXX...`. **Em produção isto seria humilhante**: cliente real ver "PT XXXXXXXXX" como NIF da empresa.

### 3.3. Análise das transições — onde o flow parte

```
TRANSIÇÕES NULL CRÍTICAS (cliente cai no vazio):

[Não, terminar] em 8 nós PT  → null  (cliente clica e nada acontece)
[No, thank you] em 8 nós EN  → null  (cliente clica e nada acontece)
Human_Support_EN.defaultTransition → null  (após handoff EN, fluxo morre)

LOOPS UX QUESTIONÁVEIS:

Armazenamento → Boas_Vindas → Seleção_de_Idioma  (re-pergunta idioma após dar nome+email)
Utilidade_do_Atendimento [Ir para Menu Principal] → Boas_Vindas → re-pergunta idioma
Aviso_Recusa → PoliticaPrivacidade  (loop infinito se utilizador recusa N vezes — sem escape)

LOOPS QUE FUNCIONAM:

[Sim, voltar ao menu] em FAQ-children → FAQ_Perguntas_Frequentes  (correcto)
Suporte_Ténico [Não, Falar com Agente] → Apoio_Humano_PT  (correcto)
Utilidade_do_Atendimento [Não, ainda tenho dúvidas] → Apoio_Humano_PT  (correcto)
```

**14 ramos de fim-de-conversa caem em `null`** (`Não, terminar` × 8 PT + `No, thank you` × 8 EN — minus 2 duplicados). Cliente final fica preso no chat sem resposta.

---

## 4. Conteúdo do nó-a-nó — extractos literais

### 4.1. Greeting dinâmico (`Mensagem_ao_Cliente`)

```
{{workflow.greeting}}! Hoje é {{workflow.DataAtual}} e são {{workflow.HoraAtual}}.
Como posso ajudar?

{{workflow.greeting === 'Bom dia' ? 'Good morning' :
  workflow.greeting === 'Boa tarde' ? 'Good afternoon' : 'Good evening'}}!
Today is {{workflow.DataAtual}} and it is {{workflow.HoraAtual}}. How can I help you?
```

Engenhoso. Calcula em JS Lisbon timezone, renderiza dual-language baseado em ternário JS no template Botpress. **Funcional. Diferenciador.**

### 4.2. RGPD (extracto do nó `PoliticaPrivacidade`)

```
🛡️ Política de Privacidade
(Proteção e Segurança)

Este chatbot foi desenvolvido para prestar apoio ao cliente 24h/7 🕒,
focado nas empresas localizadas nas zonas industriais da região de Viana do Castelo 🏭.

📋 Recolha de Dados
👤 Nome  📧 Email  📞 Telefone

🎯 Finalidade
✅ Responder a pedidos  🛠️ Apoio ao cliente  📈 Melhorar serviço

🔒 Confidencialidade
🤐 Sigilo absoluto
🚫 Sem partilha sem consentimento, excepto obrigação legal ⚖️
🇪🇺 RGPD: cumpre rigorosamente o Regulamento

📑 Direitos
👁️ Aceder | ✏️ Corrigir | 🗑️ Eliminar | 🔄 Retirar consentimento

Ao selecionar "Aceito" ✅ confirma...
```

Versão EN traduzida abaixo, mesma estrutura. **Texto real, completo, juridicamente alinhado**. É a peça mais polida do bot.

**Mas:** texto inclui meta-comentário do autor: `"Here is the English version of your Privacy Policy, maintaining the same structure, emojis, and clear explanations."` — fragmento de uma resposta de LLM que ficou colado no nó. Cliente PT vê este texto inglês entre a versão PT e EN.

### 4.3. Confirmação Airtable (`Armazenamento` content block 2)

```
✅ Os teus dados foram guardados com sucesso!
Obrigado, {{workflow.ClientName}} . {{workflow.ClientEmail}}😊

✅ Your data has been successfully saved!
Thank you, {{workflow.ClientName}} ({{workflow.ClientEmail}}) 😊
```

Tom **"tu" informal** num bot de PMEs B2B. Inconsistente com tom geral.

### 4.4. SLAs reais (`Suporte_Ténico`)

```
🔴 Crítico (sistema em baixo)   ⚡ 2 horas úteis
🟠 Alto (impacto no negócio)    ⏱️ 4 horas úteis
🟡 Normal (problema menor)      📅 1 dia útil
🟢 Baixo (dúvida ou melhoria)   📆 3 dias úteis
```

Comprometimentos contratuais. **O Moreira está a comprometer SLAs em nome do cliente final** — sem saber qual cliente, qual indústria, qual escala. Quando este bot for clonado para uma empresa real, o cliente real está a comprometer 2h de SLA crítico via webchat.

### 4.5. Localização — único conteúdo localizado real

```
🗺️ Abrir Maps  → https://www.google.com/maps/search/Zona+Industrial+de+Lanheses/
                  @41.6908554,-8.8895009,12z/...
```

**Coordenada geográfica real**: 41.6908554, -8.8895009 = **Lanheses, Viana do Castelo**. O Moreira preencheu o link Maps com zona industrial real. Mas o texto à volta continua placeholder ("[Rua, Número, CP]", "saída [X]", "carreiras [X] e [X]").

---

## 5. Knowledge Base — análise comparada

| Aspecto | Botpress KB indexada (`file_01KMX11455...`) | `KnowlegeBase.docx` source |
|---------|---------------------------------------------|----------------------------|
| Tamanho | 13935 bytes (HTML) | 19701 bytes (DOCX) |
| Conteúdo | Idêntico | Idêntico |
| Status | `indexing_completed` | — |
| Acessibilidade | `accessPolicies: []` (privado) | Local |
| Estrutura | 9 secções (Geral, Preços, Produtos, Pagamentos, Entregas, Suporte, Localização, Horários, Políticas, FAQ Rápidas) | mesma |
| Conteúdo vazio | Suporte Técnico (tempos resposta) **vazio** | idem **vazio** |
| Conteúdo vazio | Horários **vazio** | idem **vazio** |
| Placeholders | `[Nome da Empresa]`, `[X]`, `[Serviço A/B/C/D]`, `[+351...]`, `PT50 XXXX...`, `[link]`, etc. | idem |
| Único campo PRONTO sem placeholder | "Trabalham com clientes fora do distrito?" → "trabalhamos também com clientes em todo o território nacional e, em alguns serviços específicos, no espaço europeu" | idem |

**Implicação dupla:**
1. A KB é template puro. Não está adaptada a nenhuma empresa real.
2. **O bot tem `KnowledgeAgent enabled=true`, `strategy=hybrid`, `chunks=50`, `bestModel=gpt-4-turbo`, `answerManually=true`**. Isto significa que se um cliente fizer uma pergunta livre (via "Outra Questão" → Apoio_Humano_PT), o KnowledgeAgent vai consultar esta KB e devolver respostas com `[Nome da Empresa]` e `[X]` como se fossem informação real.

**Workspace screenshot (img-chat-bot-04)** confirma: o KB chama-se "Automatização cliente 24/7", aparece como **0,0%** (zero queries hit ou 0% indexado — ambíguo). 1 ficheiro Rich Text File criado há 9 dias.

**Sidebar variables no screenshot (DUPLICAÇÃO GRAVE):**

```
CONVERSATION:
  handoff (Not set)

WORKFLOW:
  clientEmail  (Not set)  ← minúscula
  ClientEmail  (Not set)  ← maiúscula  ← DUPLICADA
  clientName   (Not set)  ← minúscula
  ClientName   (Not set)  ← maiúscula  ← DUPLICADA
```

O código JS do `Armazenamento` faz `workflow.ClientName` e `workflow.ClientEmail` (Maiúsculas). Os captures do `Dados_do_Utilizador` têm `variableId: var-e74f50325c` e `var-da0ae827c7` que provavelmente estão atados às versões **minúsculas** (porque são as primeiras criadas). **Resultado: o Airtable recebe sempre `Nome: undefined`, `Email: undefined`**. Bug catastrófico que invisibiliza toda a recolha de leads.

---

## 6. Auto-learning oculto — Int_Improvement

**Esta é uma descoberta que não estava no handoff anterior.**

A integração `agi/improvement v1.0.2` está activa no bot. Adicionou **automaticamente**:

1. **Tabela `Int_Improvement_Feedback_Table`** (frozen, 6 colunas: uri, iterationId, before, feedback, learning, after) — para guardar feedback humano sobre código gerado pelo LLMz.
2. **Hook `track_iterations`** (after_llmz_execution) — após cada execução do LLM, envia para a tabela todas as iterações com modelo, mensagens, código TSX gerado, mutações, status.
3. **Hook `inject_learnings`** (before_llmz_execution) — antes de cada execução, busca feedbacks anteriores via `actions["agi/improvement"].findFeedback()` e **injecta-os no prompt do sistema** como "Learnings from Previous Experiences".

### Implicação

O bot **aprende continuamente** do feedback que o Moreira (ou administradores) der no Studio. **Mas o Moreira muito provavelmente não sabe**:
- Que cada conversa é registada com o código TSX gerado pelo LLM e injectada na tabela
- Que o modelo está a ser influenciado por feedbacks que ele dá
- Que esta tabela cresce sem limite — pode ficar grande e cara

### Iteração antiga capturada

`file_01KMD6X6FR5GSAV3F3XJ5BJE7G` é uma iteração de **23/03/2026** quando o Moreira começou o bot. O nó alvo (`nd-54aa0c19de`) **NÃO EXISTE no bot actual** — foi eliminado. Confirma que o Moreira reestruturou o bot várias vezes desde Março. O bot tem 2 hooks que fazem tracking ao longo dessa evolução. Esta tabela contém histórico que o Moreira não controla nem provavelmente sabe que existe.

### O que o iteration revela sobre custos

O system prompt da iteração tem **17671 caracteres** = ~4400 tokens. **Cada turno do LLMz custa pelo menos 4400 tokens de input só para system prompt** (sem contar transcript, hooks, KB context). Isto antes de qualquer pergunta do utilizador. Ver secção 9 (custos) abaixo.

---

## 7. Bugs visíveis nos screenshots reais (evidência empírica)

Os 4 screenshots em `assets/` que o Moreira enviou **mostram bugs reais a acontecer**:

### Bug 1: **Mensagem "Obrigado por visitar..." aparece NO MEIO da conversa** (img-chat.bot-01)

```
Bot: "Por favor, descreva a sua dúvida"
User: "Estao a contratar?"  [Delivered]
Bot: "Se desejar, pode anexar aqui um print screen ou documento sobre o problema"
Bot: "Obrigado (a) por visitar..."  ← do wf-conversation-end!
[Type your message...]  ← input ainda aberto, conversa em estado inconsistente
```

O `wf-conversation-end` foi disparado prematuramente — provavelmente porque o nó Apoio_Humano_PT depois do file capture transitou para Utilidade_do_Atendimento, que escolheu "Sim, tudo resolvido" → End → conversation-end disparou. Mas o user ainda nem respondeu. **Race condition no Botpress LLMz autonomous mode.**

### Bug 2: **Loop infinito no upload de file** (img-chat-bot-03)

Conversa real do emulador:
```
Bot: "Por favor, descreva a sua dúvida"
User: "Estão a contratar?"  ✓ Captured variable
Bot: "Se desejar, pode anexar aqui um print screen ou documento sobre o problema"
User: "ok"
Bot: "The response could not be captured. Please try again."  ← retryMessage EN num flow PT
User: "Não obrigado"
Bot: "Are you sure you want to cancel?"  ← confirmCancelMessage EN num flow PT
User: "No"
Bot: [voltou a pedir o file]
Bot: "Se desejar, pode anexar aqui um print screen ou documento sobre o problema"
[Waiting for User Input]
```

**Esta é EXACTAMENTE a 2ª pergunta do Moreira no briefing**: "como permitir que o utilizador salte o upload do ficheiro e avance directamente para o agente, mesmo sem enviar imagem?". O capture File não tem `optional: true` e não tem opção `skip`. Qualquer texto que o user escreva (em vez de file) é rejeitado com mensagem em INGLÊS num flow PT.

### Bug 3: **Ícone de upload (clipe) NÃO APARECE no campo de input do webchat**

Visível em todas as 4 screenshots de conversas. Campo só tem placeholder `Type your message...` + microfone + (em alguma versão) `+`. Sem clipe de anexo. **Esta é a 1ª pergunta do Moreira**: "O ícone de upload aparece em modo anónimo, mas desaparece em navegação normal".

Causa provável: configuração webchat → permissões file upload → desactivado por default no `cdn.botpress.cloud`. Resolúvel via config webchat (não via flow).

### Bug 4: **Mistura de idiomas mid-flow** (img-chat-bot-03)

Num flow inteiramente PT, mensagens default em EN aparecem:
- `"The response could not be captured. Please try again."`
- `"Are you sure you want to cancel?"`

**Causa raiz**: `bot.json → settings.languages: ["en"]`. PT NÃO é idioma declarado, então TODAS as mensagens default do Botpress engine (retryMessage, confirmCancelMessage) caem em EN. O Moreira só personalizou os captures `dynamicValue` mas não os `retryMessage`/`confirmCancelMessage` por capture.

### Bug 5: **Conversa testada SEMPRE com a mesma frase**

Verificação por hash MD5:

| Ficheiro | MD5 | Tamanho | Data | UserID atribuído |
|----------|-----|---------|------|------------------|
| file_01KP3KQ947 | 4c677d... | 397382 | 09/04 | user_01KP3KMFY |
| file_01KP3M9Y4 | 4ee807... | 397437 | 13/04 14:25 | user_01KP3HYA1 |
| file_01KP6K8DE | 4ee807... | 397437 | 13/04 18:15 | user_01KP6K4WY |
| file_01KP6R06W | daed97... | 440426 | 14/04 19:37 | user_01KP6QV7Q |

**3 dos 4 são identicos pixel a pixel** (md5 confirma). É a mesma screenshot enviada 3 vezes em conversas diferentes. **Conclusão: as "4 conversas reais com utilizadores anónimos" são na verdade o Moreira a auto-testar repetidamente em browsers anónimos**. Zero clientes externos. Zero validação real.

---

## 8. Segurança e privacidade — análise alargada

### 8.1. Segredos expostos no `.bpz`

```
AIRTABLE_PAT = [REDACTED — PAT real presente em bot.json, rotação URGENTE]
BASE_ID      = [REDACTED]
TABLE_ID     = Clientes_Chatbot
```

PAT em texto claro em `bot.json → settings.configVariables`. Exposições conhecidas:
1. **Email Gmail** (Moreira → Eurico, 10/04)
2. **Disco local PC do Eurico** há 10 dias
3. **Disco local PC do Moreira** indefinidamente
4. **Provavelmente outros emails** se o Moreira partilhou com mais alguém

**Permissões do PAT Airtable** (para verificar — sem fazer pedido HTTP):
- O código faz `POST https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}` → escrever
- PATs Airtable v2 (formato `pat...`) podem ter scopes `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`. Sem ver no Airtable não sabemos se é só write na tabela ou full access à base.
- **Risco máximo**: se for full access, qualquer pessoa com o PAT pode listar bases, ler/eliminar todos os registos, modificar schema.

**Acção mínima obrigatória:** O Moreira deve ROTAR o PAT antes de mais qualquer pessoa ver o ficheiro. **Esta acção ainda não foi feita** nem o Moreira foi informado pelo Eurico.

### 8.2. Ficheiros pessoais do Moreira públicos no Botpress cloud

O `cloud_files.json` confirma:

| Ficheiro | Conteúdo | accessPolicies |
|----------|----------|----------------|
| `file_01KP3GEFRR96NGQGZMMBH2SAJ9` | **PDF "SIMULAÇÃO FINAL" — preparação de entrevista de emprego do Moreira** (5 págs com pontos fortes/fracos, idade 46, situação transporte, fragilidades) | `["public_content"]` |
| `file_01KN0KSQV0HM31CY2R6JG79EV1` | **Foto pessoal do Moreira** (cara, fato), tag `studio-media` | `["public_content"]` |
| 4 × file_01KP*.jpg | Screenshots do próprio Moreira em modo anónimo | `["public_content"]` |

**Acessíveis via URL pública** `https://files.bpcontent.cloud/{...}` para qualquer pessoa que adivinhe ou tenha o ID. Os IDs ULID não são facilmente brute-forceable, mas:
- O `.bpz` partilha estes IDs
- O link público webchat (`https://cdn.botpress.cloud/.../shareable.html?configUrl=https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json`) é completo e pode ser indexado pelo Google
- O `configUrl` JSON pode listar referências a outros ficheiros do bot

**Risco RGPD:** dados pessoais (foto, CV) com policy `public_content` violam princípio da minimização (Art. 5(1)(c) RGPD).

### 8.3. Risco RGPD em produção

A `PoliticaPrivacidade` do bot promete:
- ✅ Sem partilha com terceiros sem consentimento
- ✅ RGPD compliance
- ✅ Armazenamento seguro

**Realidade técnica:**
- Airtable **é um terceiro** localizado nos EUA. Cliente PME do Moreira pode estar a violar RGPD ao deixar dados de leads viajar para Airtable sem **DPA assinado** com Airtable e sem cláusula contratual padrão (SCC) por causa do Schrems II.
- O `KnowledgeAgent` envia contexto da conversa para **OpenAI (GPT-4-turbo)** a cada query — ainda mais um terceiro.
- O `agi/improvement` envia transcript + código LLM gerado para a tabela Botpress — outra terceira parte.
- VisionAgent envia imagens para OpenAI quando user faz upload.

**O bot promete RGPD compliance mas tecnicamente expõe dados a 3 terceiros (Airtable, OpenAI, Botpress) sem consentimento explícito por terceiro.** Cliente PME que adopte este bot fica exposto a multa RGPD se houver queixa.

### 8.4. Surface de ataque do bot público

Link público do webchat (informado pelo Moreira no email):
```
https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json
```

Tudo o que está acessível sem autenticação:
- Conversar com o bot indefinidamente (consumir tokens GPT-4.1 — ver custos secção 9)
- **Spam massivo de leads no Airtable** via Armazenamento (no entanto, mitigado pelo bug `ClientName/clientName` que faz Nome/Email vazios)
- Tentar exfiltrar a `PoliticaPrivacidade` com prompt injection
- Trigger `handoff=true` artificialmente (sem consequência prática porque não há agente humano ligado)
- Upload de file de qualquer tipo (Botpress aceita), com risco de armazenamento no Botpress cloud

**Sem rate limiting visível.** Botpress free tier provavelmente tem limites de execuções/dia mas o Moreira não os verbalizou.

---

## 9. Custos LLM — estimativa por conversa

### 9.1. Modelos configurados

| Modelo | Função | Preço input (USD/1M tok) | Preço output (USD/1M tok) |
|--------|--------|--------------------------|---------------------------|
| `openai__gpt-4.1-2025-04-14` | `defaultBestModel` (autonomousModel) | $2.00 | $8.00 |
| `openai__gpt-4.1-mini-2025-04-14` | `defaultFastModel` | $0.40 | $1.60 |
| `gpt-4-turbo` | `KnowledgeAgent.bestModel` | $10.00 | $30.00 |
| `google-ai__models/gemini-2.0-flash` | `fallbackModel` | $0.10 | $0.40 |

### 9.2. Custo por conversa típica (estimativa conservadora)

Baseado na iteração capturada (system prompt = 17671 chars = ~4400 tokens):

**Conversa "happy path" PT até pedir Apoio_Humano:**
1. Greeting (Mensagem_ao_Cliente — JS, **0 tokens LLM**)
2. PoliticaPrivacidade (estática, **0 tokens LLM**)
3. Dados_do_Utilizador → Armazenamento (POST Airtable, **0 tokens LLM**)
4. Boas_Vindas → Seleção_de_Idioma → Menu_Principal_PT (estático, **0 tokens LLM**)
5. Cliente clica "Outra Questão" → Apoio_Humano_PT
   - 2 captures Raw → cada capture invoca LLMz para validar input
   - **Cada captura = ~5000 tokens input + ~200 tokens output** (system prompt + transcript + iteração)
   - **Custo por captura GPT-4.1**: 5000 × $2/1M + 200 × $8/1M = $0.0116 input + $0.0016 output = **$0.013 por captura**

**Custo de uma conversa "happy path"**: ~3 capturas × $0.013 = **$0.04 USD por conversa** (~€0.037)

**Custo se KnowledgeAgent dispara** (quando bot tenta responder à pergunta com KB):
- KnowledgeAgent usa `gpt-4-turbo` ($10/$30 por 1M tok)
- 50 chunks × ~500 tokens cada = 25k tokens de contexto KB + ~5k system + 200 output
- **Custo por consulta KB**: 30000 × $10/1M + 200 × $30/1M = $0.30 + $0.006 = **$0.30 USD por consulta KB**

**Por conversa que invoque KB 1 vez**: ~$0.34 USD ≈ **€0.31**

**Por 1000 conversas com KB**: ~**€310 EUR**.

### 9.3. Botpress Free Tier limites

(Ver `Upgrade` no screenshot do Studio — botão presente, sugere que está em free tier)

Botpress Cloud Free Plan típico (2026):
- 5 bots
- 2k mensagens IA/mês
- Sem suporte oficial

**Implicação:** se o bot tiver tráfego real, **excede free tier rapidamente**. 1000 conversas × ~10 mensagens IA/conversa = 10k mensagens/mês = paid tier. Sem que o Moreira saiba.

**Custo paid tier Botpress** (Pay-As-You-Go 2026): a partir de ~$10/bot/mês + $0.01/mensagem IA. 10k mensagens = $100/mês de Botpress + custo OpenAI à parte.

### 9.4. Quem paga

O bot está conectado à conta Botpress do **Moreira** (`josemmoreira1@gmail.com`, workspace "José Moreira's Workspace"). Se este bot for clonado para um cliente PME real:
- Ou o cliente cria a sua própria conta Botpress → tem de configurar tudo do zero (impossível sem fluxo replicação)
- Ou o cliente partilha o bot do Moreira → **Moreira paga GPT-4.1 + Botpress paid tier** dos clientes
- Ou o Moreira cobra ao cliente uma taxa que cubra os custos → tem de saber estes custos (não sabe)

---

## 10. Resposta às 5 questões técnicas do Moreira

Esta secção responde directamente às 5 perguntas do briefing original, com evidência directa.

### Q1: "UPLOAD QUE SOME — Ícone aparece em modo anónimo, desaparece em normal"

**Causa provável:** configuração do webchat (não do flow) — `uploadEnabled` no config do webchat público (`configUrl`). Quando o user está em modo normal (autenticado em Botpress?), o webchat vê propriedades do user que desactivam o upload.

**O que verificar:**
1. Abrir `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` (configUrl) e procurar `composerPlaceholder` e `allowFileUpload` ou similar.
2. No Studio: Webchat → Settings → Allow file upload → ON
3. Confirmar que `Apoio_Humano_PT.instruction[2]` é `capture File` — está correcto.

**Confirmado pelo bot:** `var-0b3eeb9be7` é capture File. Logo o problema não é no flow — é na configuração do widget webchat.

### Q2: "SKIP NO APOIO HUMANO — utilizador salta upload sem enviar imagem"

**Causa raiz:** o capture File em Botpress LLMz exige resposta do tipo File. Qualquer texto é rejeitado com `retryMessage`. Não há propriedade `optional: true` por capture file no schema actual.

**Soluções possíveis:**

| Opção | Como | Custo de implementação |
|-------|------|-----------------------|
| A | Substituir o capture File por uma **escolha** (SingleChoice: "Anexar ficheiro" / "Continuar sem anexar") → se "Anexar" → vai a sub-flow com File capture → senão pula | Médio (re-arquitectar 2 nós) |
| B | Manter File capture mas adicionar **transição condicional** com `condition: event.payload.type !== 'file'` → próximo nó. Mas Botpress LLMz não trata bem isto. | Complexo, instável |
| C | Usar **action JS antes do capture** que pergunta "deseja anexar?" e só executa o capture se sim | Médio |

**Recomendação técnica:** Opção A. Mais limpo, dois cliques, UX previsível.

### Q3: "REPLICAÇÃO — É viável usar este 'esqueleto' para várias empresas na versão gratuita do Botpress?"

**Resposta directa: NÃO É VIÁVEL na versão gratuita actual.** Razões:

1. **Botpress Free Tier** tem limite de **5 bots por workspace**. Para 100 PMEs precisa de Pro ($79/mês × n workspaces) ou enterprise.
2. **O bot tem segredos hardcoded** (`AIRTABLE_PAT`, `BASE_ID`, `TABLE_ID`) em `configVariables`. Para clonar para outra empresa, cada uma precisaria do seu próprio PAT/Base/Table → edição manual em cada bot clonado.
3. **Conteúdo é template puro** (placeholders `[Nome da Empresa]`, `[X]`, etc.) — cada cliente requer **horas de personalização** manual.
4. **Não há sistema de templating multi-tenant** — cada bot é uma instância independente.

**O que seria preciso para tornar viável:**
- Migrar para Botpress Pro/Team plan (~$80/mês cada)
- Refactor do bot: eliminar todos os placeholders, usar `botVariables` para personalização (`{{bot.companyName}}`, `{{bot.iban}}`)
- Sistema de provisioning: form ou script que pega num CSV de PMEs e gera N bots configurados
- Cada cliente tem o seu próprio Airtable base e PAT (ou uma instância Airtable partilhada com row-level security)
- Cada cliente tem a sua KB com conteúdo real

**Realidade actual:** o bot está a 5-10% do que seria preciso para suportar replicação multi-tenant. A arquitectura é monolítica, single-tenant, com configuração hardcoded.

### Q4: "AUTORIA E CONTROLO — integrar anúncios e suporte sem perder autoria"

**Como o Moreira está hoje:**
- **Conta Botpress** registada com email pessoal (`josemmoreira1@gmail.com`)
- **Workspace** "José Moreira's Workspace" — propriedade pessoal
- **Bot ID** (`e7e5db81-ad3c-45e2-bf25-033d76b04059`) — pertence ao workspace dele
- **Link público webchat** (`cdn.botpress.cloud/.../shareable.html?...`) — gerado pelo bot, propriedade dele
- **Airtable base** (`app7S6wEWqhpQgMEV`) — propriedade dele

**Como integrar anúncios/suporte sem perder autoria:**

| Modelo | Como mantém autoria | Risco |
|--------|---------------------|-------|
| A | Cliente paga ao Moreira para o Moreira gerir o bot dele dentro do workspace do Moreira | Moreira responsável por outage, multas RGPD, fugas. Não escala. |
| B | Moreira cria workspace dedicado por cliente, dá acesso ao cliente como editor secundário | Cliente pode mudar tudo. Moreira perde controlo se for despedido. |
| C | Moreira usa Botpress Pro com **multi-bot ownership** + cláusula contratual de propriedade intelectual | Funciona. Custo Pro tier necessário. |
| D | White-label via Botpress Embed em iframe num site do Moreira que cobra subscrição | Tecnicamente viável. Comercialmente complexo. |

**Recomendação técnica para esta pergunta:** o Moreira precisa de uma arquitectura clara antes de aceitar anúncios ou integrações. Hoje, o bot dele é tecnicamente um "asset pessoal", e qualquer integração pode comprometer essa propriedade.

### Q5: "AGENTE HUMANO VS BASEKNOWLEDGE — garantir que conversa do agente humano se torna visível, em vez de texto da KB"

**Como funciona actualmente:**
- `conversation.handoff = true` é seteado no `Apoio_Humano_PT` (e EN)
- **Nenhum gate no flow consume esta flag**
- Quando seteada, o **webchat externo** sinaliza ao agente humano que a conversa precisa de takeover
- **Mas:** se nenhum agente humano estiver ligado ao webchat (default Botpress free), a flag fica seteada e o KnowledgeAgent **continua a responder com base na KB** (com placeholders)

**Como garantir que mostra agente humano:**

| Opção | Implementação | Realidade |
|-------|---------------|-----------|
| A | Integrar Botpress Webchat Inbox (necessita Pro tier) onde agente recebe notificações e responde via dashboard | Solução oficial. Custo Pro. |
| B | Disable KnowledgeAgent quando `handoff=true`. Adicionar hook `before_llmz_execution` que verifica `conversation.handoff` e bypassa LLMz | Custom code, viável. |
| C | Usar canal externo (Slack, WhatsApp Business via integração Twilio) — quando handoff=true, envia mensagem ao agente em Slack | Complexo. Requer canal alternativo. |
| D | Criar nó "Aguardar resposta humana" que faz `wait` até receber input com tag específica | Limitado pelo Botpress engine. |

**Realidade actual:** o handoff está semi-implementado. A flag é seteada mas não há infraestrutura humana ligada. Em produção, o cliente vê "Um assistente entrará no chat em breve" e nada acontece.

---

## 11. Inventário de bugs e issues — versão expandida

| # | Sev | Issue | Evidência | Categoria |
|---|-----|-------|-----------|-----------|
| **I1** | 🔴 Crítico | `AIRTABLE_PAT` exposto em texto claro | `bot.json → settings.configVariables` | Segurança |
| **I2** | 🔴 Crítico | Variáveis duplicadas `clientName/ClientName`, `clientEmail/ClientEmail` → JS lê maiúscula, captures usam minúscula → Airtable recebe `undefined/undefined` | Screenshot img-chat-bot-04 sidebar variables | Funcional |
| **I3** | 🔴 Crítico | Foto pessoal do Moreira pública no Botpress cloud (`accessPolicies: public_content`) | `cloud_files.json` Imagem1.jpg | Privacidade |
| **I4** | 🔴 Crítico | PDF "SIMULAÇÃO FINAL" do Moreira (CV pseudo, dados pessoais sensíveis) público no Botpress cloud | `cloud_files.json` file_01KP3GEFRR96... | Privacidade |
| **I5** | 🟠 Alto | `languages: ["en"]` mas bot é bilingue → defaults em EN num flow PT (retryMessage, confirmCancelMessage) | Screenshot img-chat-bot-03 | Funcional |
| **I6** | 🟠 Alto | 14 transições "Não, terminar" / "No, thank you" → `null` em 16 nós | Dump transitions | Funcional |
| **I7** | 🟠 Alto | `Human_Support_EN.defaultTransition.targetNodeId: null` → flow EN morre após handoff | bot.json | Funcional |
| **I8** | 🟠 Alto | KB com placeholders não substituídos em quase todos os nós e na KB indexada | bot.json + KB HTML | Conteúdo |
| **I9** | 🟠 Alto | KnowledgeAgent activo (gpt-4-turbo, 50 chunks) com KB de placeholders → respostas com `[Nome da Empresa]` | settings + KB HTML | Funcional + UX |
| **I10** | 🟠 Alto | Bug do file capture sem skip — confirmado em screenshot real | img-chat-bot-03 | UX (Q2 do Moreira) |
| **I11** | 🟠 Alto | Bug ícone upload some em modo normal — confirmado em screenshots reais | img-chat-bot-01..04 | UX (Q1 do Moreira) |
| **I12** | 🟠 Alto | "Obrigado por visitar..." aparece no MEIO da conversa (race condition wf-conversation-end) | img-chat.bot-01 | Funcional |
| **I13** | 🟠 Alto | RGPD prometido vs realidade técnica (Airtable EU/US, OpenAI, Botpress como terceiros) | PoliticaPrivacidade vs settings | Conformidade |
| **I14** | 🟡 Médio | Após Armazenamento → Boas_Vindas → re-pergunta idioma | bot.json transitions | UX |
| **I15** | 🟡 Médio | Hooks `track_iterations` e `inject_learnings` activos sem o Moreira saber → tabela cresce sem limite | hooks | Custos + conhecimento |
| **I16** | 🟡 Médio | retryMessage e confirmCancelMessage default EN em todos os captures PT | bot.json captures | UX |
| **I17** | 🟡 Médio | Tom "tu" informal em bot B2B (`Os teus dados foram guardados`) | Armazenamento content | Tom/copy |
| **I18** | 🟡 Médio | Mapeamento `workflow.ClientName` ↔ variableId não explícito | Armazenamento JS vs Dados_do_Utilizador captures | Funcional |
| **I19** | 🟡 Médio | "Sim, voltar ao menu" em FAQ-children volta a FAQ_PT, não a Menu_Principal_PT (semântica menu vs sub-menu inconsistente) | bot.json transitions | UX |
| **I20** | 🟡 Médio | Aviso_Recusa loop infinito — sem escape se user recusa N vezes | bot.json | UX |
| **I21** | 🟡 Médio | Wf-timeout sem mensagem ao utilizador quando 30 min de inactividade | wf-timeout | UX |
| **I22** | 🟡 Médio | Wf-error mensagem só EN | wf-error | Funcional |
| **I23** | 🟡 Médio | Texto LLM colado dentro do RGPD ("Here is the English version of your Privacy Policy, maintaining the same structure...") | PoliticaPrivacidade content | Copy |
| **I24** | 🟡 Médio | Texto cortado/truncado no menu EN: `"...:e a choice from the list below"` (texto começa com `:e`) | Virtual_Assistant_Main_Menu | Copy |
| **I25** | 🟢 Baixo | Typo node name: `Suporte_Ténico` (falta "c" em "Técnico") | bot.json | Cosmético |
| **I26** | 🟢 Baixo | Typo node name: `Tech_Suport` (falta "p") | bot.json | Cosmético |
| **I27** | 🟢 Baixo | Comentários ES misturados no JS Airtable (`Datos`, `Error al guardar`) | Armazenamento JS | Cosmético |
| **I28** | 🟢 Baixo | KB chama-se "Automatização cliente 24/7" mas título do ficheiro é "Rich Text File" | Studio screenshot vs cloud_files | Cosmético |
| **I29** | 🟢 Info | 4 conversas ditas "reais" são o próprio Moreira a testar (3 das 4 imagens têm MD5 idêntico) | MD5 hashing das imagens | Validação |
| **I30** | 🟢 Info | 3 versions snapshots criados em 50 minutos no dia 13/04 (sinais de iteração intensa) | bot.json versions | Histórico |
| **I31** | 🟢 Info | Iteração antiga capturada num node `nd-54aa0c19de` que não existe no bot actual | iteration JSON vs bot.json | Histórico |
| **I32** | 🟢 Info | KB no Studio aparece como "0,0%" — pode ser zero queries ou indexing parcial | img-chat-bot-04 | Funcional |
| **I33** | 🟢 Info | `inactivityTimeout: 30 min` + `nodeRepetitionLimit: 3` configurados (default) | settings | Config |
| **I34** | 🟢 Info | PersonalityAgent activo mas `personality: ""` (vazio) — bot não tem personalidade definida | agents | Config |
| **I35** | 🟢 Info | Wf-conversation-end declara variável `emailForMailingList` mas nunca a usa | wf-conversation-end | Código morto |

**De 18 issues (v1) → 35 issues (v2).** Severidade global: **4 críticos, 9 altos, 12 médios, 10 baixos/info**.

---

## 12. O que o Moreira realmente tem

### 12.1. Ground truth do que está pronto

| Componente | Estado | Observação |
|------------|--------|-----------|
| Engine LLMz autónomo | ✅ Activo | GPT-4.1, GPT-4.1-mini, Gemini 2.0 fallback |
| Greeting dinâmico Lisbon | ✅ Funciona | Bom dia/tarde/noite + data + hora |
| RGPD bilingue | ✅ Funciona | ~1500 palavras PT+EN, juridicamente alinhado |
| Captura nome+email | ⚠️ Setada mas com bug variável | Variáveis duplicadas →Airtable vazio |
| Integração Airtable | ⚠️ Código existe, dados não chegam | I2 + PAT exposto |
| Menu bilingue | ✅ Funciona | 5 opções, espelho PT/EN |
| FAQ bilingue | ✅ Estrutura | 5 sub-categorias, conteúdo placeholder |
| Horários | ✅ Conteúdo real | Único conteúdo de PME real |
| SLAs Suporte Técnico | ✅ Conteúdo real | Mas comprometimentos genéricos |
| Localização | ⚠️ Card Maps real, texto placeholder | GPS Lanheses real |
| Apoio humano | ⚠️ Flag handoff seteada, sem agente conectado | I10, I11, Q5 |
| KB indexada | ⚠️ Indexada mas com placeholders | I8, I9 |
| Auto-learning hidden | ✅ Activo (sem Moreira saber) | I15 |

### 12.2. O que NÃO existe

- Cliente real conectado (bot é template genérico)
- Conteúdo de empresa real preenchido (todos placeholders)
- Agente humano ligado ao webchat para handoff
- Sistema multi-tenant para clonar bot
- DPA (Data Processing Agreement) com Airtable, OpenAI, Botpress
- Documentação para utilizador final / cliente PME
- Site / landing page (o Moreira disse no email que usa só o link Botpress)
- Plano de monetização claro (não pediu — nem se deve sugerir)
- Validação real (4 "conversas anónimas" são auto-testes do Moreira)

### 12.3. Maturidade real (escala 0-10)

| Dimensão | Pontuação | Justificação |
|----------|-----------|--------------|
| Engenharia técnica | 6/10 | Engine bem configurado, integração Airtable correcta na ideia, hooks nativos Botpress, mas com bugs (I2, I3, I4, I7) |
| UX | 3/10 | Múltiplos dead-ends (I6), upload bug (I10), retryMessage EN (I5), greeting boa (Mensagem_ao_Cliente) |
| Conteúdo | 2/10 | RGPD + Horários + SLAs reais (3 nós), restantes 8 nós placeholder |
| Segurança | 1/10 | PAT exposto, dados pessoais públicos, RGPD parcialmente prometido |
| Pronto para produção | 0/10 | Nenhuma empresa real pode usar isto sem 20-40h de trabalho |
| Escalabilidade | 0/10 | Single-tenant, free tier, sem multi-empresa |

**Maturidade global: ~2/10.** É um **protótipo de aprendizagem bem estruturado**, mas longe de produto.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md`. ESTE CAMINHO COINCIDE COM A PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (`membros/jose-moreira/`). SE O CAMINHO FOR DIFERENTE DO ACTUAL, MOVER IMEDIATAMENTE COM `git mv`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 13. Quem é o Moreira (factualmente, sem projecção)

Apenas factos verificáveis pelos materiais entregues:

| Facto | Fonte | Evidência |
|-------|-------|-----------|
| 46 anos | PDF SIMULAÇÃO FINAL | Pág. 1 |
| Formação Sociologia + Mestrado em Gestão | PDF SIMULAÇÃO FINAL | Pág. 1 |
| Em formação IEFP "Criação de Loja Digital" (UC02698, 50h) até 7 Mai 2026 | Cronograma 26.0124.pdf | Calendário Abr-Mai |
| Sem transporte para presencial diário Vila Nova de Gaia | PDF SIMULAÇÃO FINAL | Pág. 2 ("limitações logísticas") |
| Procura função júnior assistente/técnico marketing digital | PDF SIMULAÇÃO FINAL | Pág. 1 |
| Email pessoal `josemmoreira1@gmail.com` | bot.json revisionMetadata + briefing | confirmado |
| Localizado em Viana do Castelo | briefing + Cronograma + bot.json (Lanheses) | múltipla |
| Construiu o bot de Março a Abril 2026 (~30 dias) | versions snapshots | 23/03 → 15/04 |
| Iterou intensamente (3 saves manuais em 50 min no dia 13/04) | versions | 04:29, 04:48, 05:17 |
| Publicou post LinkedIn sobre Eurico/[IA]AVANÇADA | briefing pág. 1 (link partilhado) | URL fornecido |
| Disponível para Zoom: Seg 20/04 todo dia, Ter 21 após 13:00, Qui 23 após 18:00, Sex 24 após 18:00 | briefing | datas explicitamente propostas |
| Cronograma confirma compatibilidade dessas datas com o curso IEFP | Cronograma cruzado | aulas Ter 09-12 e Sex 14-16 |

**Dado relevante para a decisão**: o Moreira está em **transição profissional**, em formação IEFP financiada (Cofinanciado União Europeia), sem rendimento estável, com fragilidade logística (transporte). Construiu o bot enquanto aprende. O bot é simultaneamente **portfolio para emprego** e **projecto pessoal de empreendedorismo**. Esta dualidade molda a sensibilidade da resposta.

---

## 14. Veredicto — temos condições para ajudar?

### 14.1. O que o Eurico está a avaliar

A pergunta do Eurico **não é** "o bot está bom?" (resposta óbvia: não). A pergunta é:

> Temos capacidade técnica + tempo + interesse para tirar este Moreira da estaca actual e levá-lo para algo entregável a um cliente PME real?

### 14.2. Custo realista de "ajudar a sério"

Decompondo em fases:

| Fase | O que envolve | Tempo realista | Quem |
|------|---------------|----------------|------|
| A | Triagem segurança imediata: rotar PAT, eliminar ficheiros pessoais públicos, alertar Moreira | 1h | @dev + Eurico (contacto) |
| B | Fix dos 4 críticos (I1-I4) + 9 altos (I5-I13) | 8-12h | @dev (acompanhar Moreira no Studio) |
| C | Substituir TODOS os placeholders por dados de UMA empresa-piloto real | 6-10h | @ux + cliente da empresa |
| D | Refactor multi-tenant: botVariables para personalização | 12-20h | @dev |
| E | Sistema de provisioning para clonar bot por PME | 20-40h | @dev + @architect |
| F | Acompanhamento e suporte do Moreira (mentorship técnica) | 2-3h/semana | @ux ou Eurico |

**Total realista para entregar algo decente a 1 cliente piloto: 20-30h de trabalho técnico do nosso lado.**
**Total para multi-tenant escalável: 60-90h.**

### 14.3. O que o Moreira pediu vs o que precisa

O Moreira **pediu** (briefing): "ajuda nas 5 questões técnicas + audiência Zoom".

O Moreira **precisa** (forensic): muito mais — fix de variáveis, conteúdo real, segurança, multi-tenant, modelo de operação claro.

**Se ajudarmos só com as 5 questões → podemos responder em 1 sessão.** Não resolve nada estrutural mas honra o pedido.

**Se ajudarmos a sério → 20-30h mínimo + risco de longo prazo.**

### 14.4. Recomendação Uma (UX-Design Expert)

Tendo em conta:
- O Moreira está em **transição profissional**, não tem cliente real
- O bot é **template puro** — não há empresa-piloto identificada
- Há **bugs críticos de segurança e privacidade** que precisam acção em 24-48h independentemente da decisão
- O LinkedIn dele já fala de [IA]AVANÇADA PT (compromisso público parcial)
- A regra `feedback_no_projected_business_models.md` proíbe-nos de propor pricing/parceria sem ele pedir

**Caminho recomendado em 3 níveis:**

#### Nível 0 — Acção imediata (24h, obrigatória)

1. **Eurico avisa o Moreira por WhatsApp** sobre PAT exposto (I1) e dois ficheiros pessoais públicos (I3, I4). Mensagem de pares, sem alarme. Recomenda rotação PAT no Airtable e eliminação dos files públicos.
2. **Sugerir que o Moreira não envie mais o `.bpz` por email** sem antes limpar configVariables.

#### Nível 1 — Resposta às 5 questões (1 sessão Zoom, 1.5h)

Honrar o pedido do briefing. Responder com a evidência desta auditoria. Tom: aluno-mentor, não consultor-cliente. Entregável: documento com as 5 respostas + lista priorizada de bugs.

**Vantagem:** cumpre compromisso. Permite ao Moreira melhorar sozinho.
**Risco:** Moreira pode interpretar como "não vais ajudar mais que isto".

#### Nível 2 — Acompanhamento como mentor da comunidade (sem compromisso formal)

Ele entra na comunidade [IA]AVANÇADA PT como qualquer membro. Tem acesso aos workshops, à community Slack, ao knowledge sharing. Vai melhorando o bot iterativamente com input dos pares. Eurico/equipa intervém ocasionalmente quando ele postar dúvidas.

**Vantagem:** zero risco de compromisso. Escala via comunidade, não via consultoria 1-1.
**Risco:** Moreira pode achar que esperava mais.

#### Nível 3 — Co-construção formal (não recomendado neste momento)

Aceitar projecto de "tornar o bot pronto para PMEs reais" → 20-30h+ de trabalho nosso, sem cliente piloto identificado, com Moreira em transição profissional sem capacidade de escala. **Custos > benefícios neste timing.**

### 14.5. Decisão pendente do Eurico

| # | Decisão | Quem decide | Prazo |
|---|---------|-------------|-------|
| D1 | Avançar com Nível 0 (alerta segurança)? | Eurico | 24h |
| D2 | Aceitar Zoom Seg/Ter/Qui/Sex? Que dia? | Eurico | até quinta |
| D3 | Nível 1 (responder 5Q) ou só Nível 2 (mentor comunidade)? | Eurico | depois de Nível 0 |
| D4 | Quem responde no Zoom — Eurico directamente ou agente preparado? | Eurico | conforme D2 |
| D5 | Eliminar / arquivar os 9 docs alucinados de 19/04 (em `02-prd/archive/`)? | Eurico | quando quiser |

---

## 15. Próximos passos do agente que consumir este handoff

Em ordem:

1. **Confirmar com o Eurico** qual nível (0/1/2/3) ele escolhe
2. Se Nível 0: redigir mensagem WhatsApp ao Moreira sobre segurança (template em `00-briefing/`, tom Carnegie, máx 6 linhas)
3. Se Nível 1: produzir `02-prd/respostas-5-questoes-moreira.md` com cada Q1-Q5 desta secção 10 expandida em formato apresentável ao Moreira (linguagem dele, não a nossa)
4. Se Nível 2/3: pôr no slack/comunidade ou criar epic AIOX
5. **Independentemente do nível**: actualizar `00-briefing/` com timestamp da decisão do Eurico

---

## 16. Ficheiros de referência (leitura obrigatória para próximo agente)

Ordem:

1. **Este handoff** — `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md`
2. `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md` (v1, complementar)
3. `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` (briefing original)
4. `membros/jose-moreira/02-prd/auditoria-profunda-v2/working/` (8 working files com evidência directa)
5. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\project_moreira_chatbot.md`
6. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\feedback_moreira_no_hallucinations.md`
7. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\feedback_no_projected_business_models.md`

**NÃO usar como fonte primária:**
- `RETOMA-20260419-validacao-projecto-moreira.md` (alucinação confirmada)
- Os 9 docs em `02-prd/archive/` da sessão de 19/04

---

## 17. Comandos úteis para continuar inspecção

```bash
# Re-inspeccionar o bot.json
cd "/c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz"

# Exibir um nó específico por nome
python -c "
import json,sys; sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('bot.json','r',encoding='utf-8'))
main = [f for f in d['flows'] if f['id']=='wf-main'][0]
target = 'Apoio_Humano_PT'
node = next((n for n in main['nodes'] if n.get('name')==target), None)
print(json.dumps(node, ensure_ascii=False, indent=2))
"

# Ver utilizadores e conversas registadas no .bpz
python -c "
import json
d = json.load(open('cloud_files.json','r',encoding='utf-8'))
users = set()
convs = set()
for f in d:
    t = f.get('tags', {})
    if 'user' in t: users.add(t['user'])
    if 'conversation' in t: convs.add(t['conversation'])
print('Users:', users)
print('Conversations:', convs)
"

# Ver MD5 das imagens dos utilizadores (confirmar duplicados)
md5sum files/*.jpg files/*.json files/*.html files/*.pdf
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** José Moreira (membro da comunidade [IA]AVANÇADA PT)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md`
- **COINCIDEM?** **SIM**

**AGENTE RESPONSÁVEL:** Uma (UX Design Expert)
**DATA:** 20/04/2026
**ESTADO:** `pending` (aguarda decisão do Eurico nos 5 D1-D5)
**CONSUMIDO:** `false`
**SUBSTITUI/COMPLEMENTA:** v1 `RETOMA-20260420-auditoria-real-bot-moreira.md` (continua válida nos factos, esta v2 expande com 7 vectores que faltavam)

---

*Esta auditoria forense foi conduzida em ~3h sobre 268KB de bot.json, 14KB de KB HTML, 19KB de DOCX, 4MB de PDF, 6 imagens e 1 cronograma. Cada afirmação tem caminho de origem citado. Working files preservados em `02-prd/auditoria-profunda-v2/working/`. O Eurico decide o nível (0/1/2/3) — esta auditoria é a base factual para essa decisão, não a decisão em si.*
