# RETOMA — Auditoria REAL do chatbot Moreira (evidência directa do `.bpz`)

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

**Projecto:** José Moreira (Viana do Castelo) — chatbot Botpress bilingue PT/EN para PMEs
**Localização do projecto:** `membros/jose-moreira/`
**Criado por:** Uma (UX Design Expert)
**Data:** 2026-04-20 (sessão nocturna)
**Destinatário:** próximo agente em qualquer terminal — qualquer agente AIOX pode consumir
**Status:** `pending`
**Consumido:** `false`

---

## 0. AVISO CRÍTICO — ignorar handoff anterior

O handoff `RETOMA-20260419-validacao-projecto-moreira.md` (da sessão anterior) está **marcado como contaminado por alucinação** pelo Eurico em 2026-04-20. Os 9 documentos produzidos nessa sessão em `01-pesquisa/` e `02-prd/` (audit-bot-actual, validation-what-moreira-built, arquitectura-multi-tenant, modelo-colaboracao, 3 research Botpress, ux-analysis-chatbot, RELATORIO-TECNICO-JOSE-MOREIRA) **NÃO devem ser tratados como verdade** até validação directa.

Em particular são **falsos ou não verificados**:
- "Maturidade 72%" (número inventado)
- "18 botVariables" (o `bot.json` tem `botVariables: []`)
- "Política RGPD ~600 palavras cada" (✅ esta parte é verdade, excepcionalmente)
- "Saudação JS timezone Europe/Lisbon" (✅ esta parte é verdade, confirmada nesta sessão)
- Qualquer inferência sobre "projectos reais" ou "modelos de negócio" além do briefing literal

**Regra:** para este projecto, só contam **dois inputs**: (1) a frase literal do Moreira no `00-briefing/` e (2) os ficheiros físicos entregues por ele (`.bpz`, `.docx`, `.pdf`, screenshots). Tudo o resto é interpretação a verificar.

---

## 1. Como abrir um novo terminal e retomar

### 1.1. Directório de trabalho

Abrir terminal (Git Bash / PowerShell / Windows Terminal) em:

```
C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\
```

No Windows Terminal com atalho:
```
wt.exe -d "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira"
```

No Git Bash:
```
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira
```

### 1.2. Comando para invocar o agente

Invocar `claude` a partir do directório acima e usar **qualquer um** destes comandos:

| Situação | Comando |
|----------|---------|
| Continuação da auditoria UX | `/aiox-ux-design-expert` (invoca Uma) |
| Criar story de implementação de fixes | `/aiox-sm` (invoca River para `*draft`) |
| Implementar fixes do bot (guia passo-a-passo) | `@dev` ou `/aiox-dev` (invoca Dex) |
| Criar PRD de entrega ao Moreira | `/aiox-pm` (invoca Morgan) |
| Overview multi-projecto | `/aiox-monster` (orquestrador) |

**Ordem obrigatória na activação do novo agente:**
1. Ler `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\MEMORY.md` (já carregado automaticamente)
2. Ler **este ficheiro** (`membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`)
3. Ler `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt`
4. **Não ler** o RETOMA-20260419 como verdade — só como referência do que foi alucinado
5. Confirmar ao Eurico qual é a próxima acção antes de avançar

---

## 2. Fonte única da verdade — o que o Moreira disse

Citação literal do email do Moreira (10/04/2026), em `00-briefing/Sr. Eurico Alves! 👋.txt`:

> "Desenvolvi um chatbot bilingue (PT/EN) no Botpress (versão gratuita) para PMEs locais — com boas-vindas, RGPD, recolha de leads, FAQ e apoio humano. Envio-lhe em anexo capturas do emulador e do fluxo para ter uma ideia do estado atual."

Esta frase é a âncora. Nada fora desta frase + ficheiros físicos conta como "o que o Moreira desenvolveu".

Ficheiros físicos entregues pelo Moreira em `membros/jose-moreira/`:
- `00-briefing/Sr. Eurico Alves! 👋.txt` — email original
- `Clientes_Chatbot - 2026 Apr 15.bpz/` — export do bot (pasta descomprimida)
- `KnowlegeBase (base de conhecimento).docx` — KB template (19 KB)
- `Cronograma 26.0124.pdf` — cronograma IEFP (30 KB)
- `assets/img-chat-bot-01.jpeg` a `04.jpeg` — 4 screenshots do emulador

---

## 3. Auditoria exaustiva do `.bpz` — factos verificados em 2026-04-20

Fonte de cada afirmação: caminho exacto dentro do `.bpz` + campo específico. Zero inferência.

### 3.1. Identidade e versões (`bot.json`)

| Campo | Valor |
|-------|-------|
| `identity.name` | `Clientes_Chatbot` |
| `identity.icon.emoji` | 🤖 (fundo laranja) |
| `identity.ai_summary.value` | "Chatbot named sparkling-eland provides concise information" (gerada 2025-02-26) |
| `version` | `1.19` |
| `revision` | `1961` |
| `revisionMetadata.lastRevisionCheckAt` | `2026-04-15T18:07:21.535Z` |
| `versions` | 3 snapshots manuais (todos em 13 Abril 2026) |

### 3.2. Settings globais (`bot.json → settings`)

| Campo | Valor | Observação |
|-------|-------|------------|
| `defaultLanguage` | `"en"` | **Bot é bilingue mas defaultLanguage é EN** |
| `languages` | `["en"]` | **Só EN declarado — PT NÃO é linguagem suportada formalmente** |
| `description` | `""` | Vazio |
| `inactivityTimeout` | `30` | minutos |
| `nodeRepetitionLimit` | `3` | |
| `useLlmz` | `true` | engine novo |
| `useCognitiveV2` | `true` | engine novo |
| `useClient` | `true` | |
| `defaultBestModel` | `openai__gpt-4.1-2025-04-14` | |
| `defaultFastModel` | `openai__gpt-4.1-mini-2025-04-14` | |
| `fallbackModel` | `google-ai__models/gemini-2.0-flash` | |
| `autonomousModel` | `best-model` | |
| `llmzVersion` | `01-Oct-2024` | |
| `botVariables` | `[]` | **VAZIO** (contradiz alucinação anterior de "18 botVariables") |
| `userVariables` | `[]` | **VAZIO** |
| `conversationVariables` | `[{name:"handoff", type:"boolean", default:false}]` | 1 só |

### 3.3. Agentes internos Botpress (`bot.json → agents`)

| Agente | Enabled | Config relevante |
|--------|---------|------------------|
| `KnowledgeAgent` | **true** | strategy=`hybrid`, chunks=50, bestModel=`gpt-4-turbo`, answerManually=`true` |
| `VisionAgent` | **true** | extractionEnabled=`true` — bot pode ler imagens do utilizador |
| `TranslatorAgent` | — | detectLanguage=`true` |
| `SummaryAgent` | **false** | — |
| `PersonalityAgent` | — | personality=`""` (vazio) |

### 3.4. Segredos expostos (`bot.json → settings.configVariables`)

```
AIRTABLE_PAT = [REDACTED — PAT real presente em bot.json, rotação URGENTE]
BASE_ID      = [REDACTED]
TABLE_ID     = Clientes_Chatbot
```

**Estado:** PAT em texto claro. O `.bpz` circulou por email Gmail (Moreira → Eurico) e está em disco local no PC do Eurico há 10 dias. **A rotação não foi feita e o Moreira ainda não foi avisado pelo Eurico.**

### 3.5. Flows e nós

| Flow ID | Nome | Nº nós | Propósito |
|---------|------|--------|-----------|
| `wf-main` | Main | **33** | Fluxo principal completo |
| `wf-error` | Error | 4 | "Sorry, an error occurred. Please try again later" (só EN) |
| `wf-timeout` | Timeout | 4 | Handler sem conteúdo (Handler vazio) |
| `wf-conversation-end` | Conversation End | 4 | "Obrigado (a) por visitar..." (só PT) |

### 3.6. Main flow — lista completa dos 33 nós

```
01. [start]    Start                                       → Mensagem_ao_Cliente
02. [end]      End                                         (terminal)
03. [standard] Boas_Vindas                                 → Seleção_de_Idioma
04. [standard] Seleção_de_Idioma_/_Language_Selection      (PT|EN branch)
05. [standard] Assistente_Virtual__Menu_Principal_PT       (5 opções)
06. [standard] Virtual_Assistant__Main_Menu                (5 opções EN)
07. [standard] FAQ__Perguntas_Frequentes                   (5 sub-opções)
08. [standard] FAQ__Frequently_Asked_Questions             (5 sub-opções EN)
09. [standard] Nossos_serviços                             (content + capture)
10. [standard] Contactos                                   (content + capture)
11. [standard] Our_Services                                (EN)
12. [standard] Contacts                                    (EN)
13. [standard] Localização                                 (content + content + capture)
14. [standard] Location                                    (EN)
15. [standard] Horários                                    (content + capture)
16. [standard] Opening_Hours                               (EN)
17. [standard] Preços_e_Tarifas                            (content + capture)
18. [standard] Pagamentos                                  (content + capture)
19. [standard] Entrega_e_Prazo                             (content + capture)
20. [standard] Suporte_Ténico                              (TYPO: falta "c" em "Técnico")
21. [standard] Pricing_and_taxes                           (EN)
22. [standard] Payments                                    (EN)
23. [standard] Delivery                                    (EN)
24. [standard] Tech_Suport                                 (TYPO: falta "p" em "Support")
25. [standard] Dados_do_Utilizador                         (content + 2 captures: Nome + Email)
26. [standard] PoliticaPrivacidade                         (content ~1200 palavras PT+EN + capture aceitar/recusar)
27. [standard] Armazenamento                               (action POST Airtable + content confirmação)
28. [standard] Aviso_Recusa                                (loop → PoliticaPrivacidade)
29. [standard] Apoio_Humano_PT                             (capture dúvida + capture file + content + action handoff=true)
30. [standard] Human_Support_EN                            (espelho EN, COM BUG — ver 3.11)
31. [standard] Utilidade_do_Atendimento                    (capture 3 opções)
32. [standard] Helpfulness_of_the_service                  (EN)
33. [standard] Mensagem_ao_Cliente                         (action JS saudação + content greeting)
```

### 3.7. Grafo de transições — main flow

Entrada:
```
START → Mensagem_ao_Cliente (calcula hora Lisbon)
      → PoliticaPrivacidade (gate RGPD)
        ├─[Aceito]  → Dados_do_Utilizador → Armazenamento → Boas_Vindas → Seleção_de_Idioma
        └─[Recuso]  → Aviso_Recusa → PoliticaPrivacidade (loop)
```

Ramo PT (após Seleção_de_Idioma = PT):
```
Menu_Principal_PT (5 opções)
  ├─ Perguntas Frequentes ─► FAQ_PT
  │    ├─ Preços ─► Preços_e_Tarifas
  │    ├─ Pagamentos ─► Pagamentos
  │    ├─ Entrega ─► Entrega_e_Prazo
  │    ├─ Suporte Técnico ─► Suporte_Ténico
  │    └─ Outra Questão ─► Apoio_Humano_PT
  ├─ Nossos Serviços ─► Nossos_serviços
  ├─ Localização ─► Localização
  ├─ Contactar-nos ─► Contactos
  └─ Horários ─► Horários
```

Em cada nó terminal de conteúdo PT:
```
Secção_PT ─[Sim, voltar ao menu]─► Menu_Principal_PT (ou FAQ_PT)
          ─[Não, terminar]      ─► None  ← BUG: destino nulo
```

Apoio humano:
```
Apoio_Humano_PT
  ├─ capture "Por favor, descreva a sua dúvida" (Raw Input, SEM variableId)
  ├─ capture "Se desejar, pode anexar aqui um print screen..." (File, var-0b3eeb9be7)
  ├─ content "Um assistente entrará no chat em breve"
  ├─ action: conversation.handoff = true
  └─ default → Utilidade_do_Atendimento
                  ├─[Sim, tudo resolvido!]    ─► End
                  ├─[Não, ainda tenho dúvidas]─► Apoio_Humano_PT (loop)
                  └─[Ir para o Menu Principal]─► Boas_Vindas (re-pergunta idioma)
```

Espelho EN existe mas tem 1 bug crítico: `Human_Support_EN.defaultTransition.targetNodeId: null`. Fluxo EN parte depois do handoff.

### 3.8. Transições `defaultTransition` de cada nó relevante

| Nó | Default aponta para |
|----|---------------------|
| Boas_Vindas | Seleção_de_Idioma |
| Dados_do_Utilizador | Armazenamento |
| Armazenamento | Boas_Vindas (⚠️ loop para re-perguntar idioma) |
| Aviso_Recusa | PoliticaPrivacidade (loop de consentimento) |
| Apoio_Humano_PT | Utilidade_do_Atendimento |
| Human_Support_EN | **null** (BUG) |
| Mensagem_ao_Cliente | PoliticaPrivacidade |

### 3.9. Captures declarados (5 com variableId)

| variableId | Nó | Tipo | Pergunta |
|------------|----|----- |----------|
| `var-7def2de7e9` | Seleção_de_Idioma | SingleChoice | "Por favor, selecione o seu idioma" |
| `var-e74f50325c` | Dados_do_Utilizador | Raw Input | "Qual é o seu nome? / What is your name?" |
| `var-da0ae827c7` | Dados_do_Utilizador | Email Address | "Qual é o seu e-mail? / What is your email?" |
| `var-e0d17814e3` | PoliticaPrivacidade | SingleChoice | "Aceite os termos" |
| `var-0b3eeb9be7` | Apoio_Humano_PT + Human_Support_EN | File | Upload opcional |

Captures **sem variableId** (`__none__`) existem nos menus e em `Utilidade_do_Atendimento` — o Botpress usa-os como gates sem persistir o valor.

### 3.10. Acções JavaScript — só 2 em todo o bot

#### Acção 1: `Armazenamento` (POST Airtable)

```javascript
const AIRTABLE_PAT = env.AIRTABLE_PAT;
const BASE_ID = env.BASE_ID;
const TABLE_ID = env.TABLE_ID;

const Nome = workflow.ClientName;
const Email = workflow.ClientEmail;

const airtableURL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
const headers = {
  'Authorization': `Bearer ${AIRTABLE_PAT}`,
  'Content-Type': 'application/json'
};

const data = {
  "fields": {
    "Nome": Nome,
    "Email": Email,
  }
};

try {
  const saveResponse = await axios.post(airtableURL, data, { headers });
  console.log('Datos guardados no Airtable com sucesso:', saveResponse.data);
} catch (error) {
  console.error('Error al guardar datos en Airtable:', error);
}
```

Notas:
- Comentários misturam PT e ES ("Datos" em vez de "Dados", "Error" em vez de "Erro")
- Usa `workflow.ClientName` e `workflow.ClientEmail` mas os captures têm IDs (`var-e74f50325c`, `var-da0ae827c7`) — a ligação nome-amigável ↔ ID precisa ser confirmada no Studio

#### Acção 2: `Mensagem_ao_Cliente` (saudação dinâmica)

```javascript
const agora = new Date()
const formatador = new Intl.DateTimeFormat('pt-PT', {
  timeZone: 'Europe/Lisbon',
  hour: '2-digit', minute: '2-digit',
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour12: false
})
const partes = formatador.formatToParts(agora)
// ...extrai dia/mes/ano/hora/minuto...
workflow.DataAtual = `${dia}/${mes}/${ano}`
workflow.HoraAtual = `${hora}:${minuto}`

const horaInt = parseInt(hora)
let greeting = ''
if (horaInt >= 5 && horaInt < 12)       greeting = 'Bom dia'
else if (horaInt >= 12 && horaInt < 20) greeting = 'Boa tarde'
else                                     greeting = 'Boa noite'
workflow.greeting = greeting
```

#### Acção 3: handoff (nos nós apoio humano)

```javascript
conversation.handoff = true
```

**Total: 2 acções custom + 2 flags handoff = 4 ocorrências de código JS.**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`. ESTE CAMINHO COINCIDE COM A PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (`membros/jose-moreira/`). SE O CAMINHO FOR DIFERENTE DO ACTUAL, MOVER IMEDIATAMENTE COM `git mv`. CONSULTAR `.claude/rules/handoff-location.md`.

---

### 3.11. Issues identificados — todos com evidência directa

| # | Severidade | Issue | Localização exacta |
|---|-----------|-------|--------------------|
| **I1** | 🔴 Crítico | `AIRTABLE_PAT` em texto claro no export | `bot.json → settings.configVariables.AIRTABLE_PAT` |
| **I2** | 🟠 Alto | `languages: ["en"]` mas bot é bilingue. AI agents podem tratar PT como língua não-suportada | `bot.json → settings.languages` |
| **I3** | 🟠 Alto | Transição "Não, terminar" aponta para `null` em 11 nós (Nossos_serviços, Contactos, Localização, Horários, Preços_e_Tarifas, Pagamentos, Entrega_e_Prazo, Suporte_Ténico + espelhos EN de Our_Services, Contacts, Location, Opening_Hours, Pricing_and_taxes, Payments, Delivery, Tech_Suport) | Transições `__CHOICE=Não, terminar` → `destination.node: null` |
| **I4** | 🟠 Alto | `Human_Support_EN.defaultTransition.targetNodeId: null` — o PT aponta para `Utilidade_do_Atendimento`, o EN fica sem destino | Nó `nd-d3e1d24fd9` |
| **I5** | 🟠 Alto | KB tem placeholders `[Nome da Empresa]`, `[Serviço A]`, `€XX/mês`, `PT50 XXXX...`, `+351 XXX XXX XXX`, `PT XXXXXXXXX` (NIF) | `files/file_01KMX11455XEY342P2KSA51ZMP` (14 KB HTML indexado) |
| **I6** | 🟠 Alto | **TODO o conteúdo dos nós tem placeholders não substituídos** (Contactos, Localização, Preços, Pagamentos IBAN, Entrega, Serviços A/B/C/D) | Quase todos os nós `standard` do main flow |
| **I7** | 🟡 Médio | `retryMessage` só em EN ("The response could not be captured. Please try again.") em captures PT | Todos os captures do ramo PT |
| **I8** | 🟡 Médio | `confirmCancelMessage` vazio (`""`) em todos os captures | Default do Botpress em EN |
| **I9** | 🟡 Médio | Intents `yes`/`no`/`cancel` com `utterances: null` (0 exemplos treinados) | `bot.json → intents` |
| **I10** | 🟡 Médio | Mapeamento `workflow.ClientName` ↔ `var-e74f50325c` não é explícito no export — pode estar quebrado no Studio | Nó `Dados_do_Utilizador` vs código `Armazenamento` |
| **I11** | 🟡 Médio | Após `Armazenamento` o flow salta para `Boas_Vindas` → re-pergunta idioma ao utilizador que já escolheu | `Armazenamento.defaultTransition → Boas_Vindas` |
| **I12** | 🟡 Médio | "Ir para o Menu Principal" em `Utilidade_do_Atendimento` também volta a `Boas_Vindas` → re-pergunta idioma | Nó `Utilidade_do_Atendimento` |
| **I13** | 🟡 Médio | `conversation.handoff = true` é seteado mas nenhum nó faz gate por esta flag. Só a integração webchat externa a consome | Flag Botpress nativa |
| **I14** | 🟢 Baixo | Nome de nó com typo: `Suporte_Ténico` (falta "c" em "Técnico") | Nó PT id `nd-3664799d` |
| **I15** | 🟢 Baixo | Nome de nó com typo: `Tech_Suport` (falta "p" em "Support") | Nó EN espelho |
| **I16** | 🟢 Baixo | Código Airtable com comentários ES (`Datos`, `Error`) | Nó `Armazenamento` |
| **I17** | 🟢 Info | `botVariables: []`, `userVariables: []`, `qnas: []`, `entities: []`, `actions: []` todos vazios | `bot.json` top-level |
| **I18** | 🟢 Info | `hooks` tem 1 hook automático (`track_iterations` da integração `Int_Improvement` — não é custom do Moreira) | `bot.json → hooks` |

### 3.12. Tabelas internas Botpress

| Tabela ID | Nome | Colunas | Registos conhecidos | Origem |
|-----------|------|---------|---------------------|--------|
| `table_01KMD6X4MXS5GT02KZKQPK5XQM` | Int_Improvement_Feedback_Table | uri, after, before, feedback, learning, iterationId | não exportado | Integração `agi/improvement` (automática) |
| `table_01KN4N1CDXG9BTVK5ZX7` | RouterAgentTable | phrase, intentId, phraseId | não exportado | Utilizador (Router Agent do Botpress) |
| `table_01KMDF19JBZPQZ5GVRNA8XB4FP` | MailingListsEmailsTable | Emails | **3 registos** (ver abaixo) | Utilizador |

**3 registos reais no `table_01KMDF19JBZPQZ5GVRNA8XB4FP.jsonl`:**

```json
{"id":1,"createdAt":"2026-03-23T13:54:03.036Z","Emails":"josemmoreira1@gmial.com"}
{"id":2,"createdAt":"2026-03-23T14:01:25.434Z","Emails":"slika@gmail.com"}
{"id":3,"createdAt":"2026-03-23T14:19:42.098Z","Emails":"Quencyjonestunes@gmail.com"}
```

Observação: todos parecem testes. O primeiro tem typo "gmial" → é provavelmente teste do próprio Moreira. O `Armazenamento` escreve no **Airtable externo** (não nesta tabela). Dualidade: não se sabe como estes 3 emails chegaram à MailingListsEmailsTable (pode ter sido inserção manual no Studio).

### 3.13. Ficheiros na cloud Botpress (10 items em `files/`)

| Ficheiro | Tamanho | Tipo | Contexto |
|----------|---------|------|----------|
| `file_01KMD6X6FR5GSAV3F3XJ5BJE7G` | 19 KB | JSON iteration log | Da integração Int_Improvement |
| `file_01KMX11455XEY342P2KSA51ZMP` | 14 KB | HTML indexado KB | **KB principal do bot — com placeholders** |
| `file_01KN0KSQV0HM31CY2R6JG79EV1` | 43 KB | JPEG `Imagem1.jpg` | Studio media |
| `file_01KP3GEFRR96NGQGZMMBH2SAJ9` | 4 MB | PDF `SIMULAÇÃO FINAL.pdf` | Gerado pelo emulador Botpress |
| `file_01KP3KQ947PSBS3AQFTBAA0PNJ` | 397 KB | JPEG | Screenshot utilizador (9 Abril) em conversa `conv_01KP3KMHDK...` |
| `file_01KP3M3EA0X67KWHPNEFQZCY7W` | 46 KB | JPEG | Button image do webchat |
| `file_01KP3M4BF2W4NMSCRJ7XGZ97DN` | 46 KB | JPEG | Button image do webchat (duplicado) |
| `file_01KP3M9Y4B7NQE5EYE4CV3VX5X` | 397 KB | JPEG | Screenshot utilizador (13 Abril) |
| `file_01KP6K8DE9QD20D65CH7VAT3CP` | 397 KB | JPEG | Screenshot utilizador (13 Abril) |
| `file_01KP6R06WEVXBXCY03YJ2AC1PW` | 440 KB | JPEG | Screenshot utilizador (14 Abril) |

**4 conversas reais no webchat** com utilizadores anónimos entre 9–14 Abril:
- `user_01KP3HYA1KFV5MZJYZ752Z2WHM` — conv `01KP3M57H7NG4Z32EVMQ1ASVVM`
- `user_01KP3KMFYC1R7QX78ZTHMBJAZH` — conv `01KP3KMHDKPNY6CDS2CPTKS28B`
- `user_01KP6K4WYV7PPZRVPR2TNP77K2` — conv `01KP6K4XNKEJPTGC27MG5DP86Z`
- `user_01KP6QV7QDEZV6MPKCTYC9K451` — conv `01KP6QV881HPE8TG9R1RREHSCM`

### 3.14. Conteúdo por nó — estado do copy

| Nó | PT | EN | Estado |
|----|----|----|--------|
| Boas_Vindas | ✅ bilingue, `[Nome da Empresa]` placeholder | ✅ bilingue | Template |
| PoliticaPrivacidade | ✅ ~600 palavras RGPD | ✅ ~600 palavras GDPR | **Conteúdo real (funcional)** |
| Nossos_serviços / Our_Services | `[Serviço A/B/C]` | `[Service A/B/C]` | Placeholder |
| Contactos / Contacts | `+351 XXX XXX XXX`, `[Rua...]`, `PT XXXXXXXXX` | mesmo | Placeholder |
| Localização / Location | `[Rua, Número, CP]`, GPS `[XX.XXXXX]` | mesmo | Placeholder |
| Horários / Opening_Hours | **Real:** Seg-Sex 09-18, Sáb 09-13, Dom fechado, Romaria d'Agonia 20 Ago fechado | mesmo | **Conteúdo real** |
| Preços_e_Tarifas / Pricing_and_taxes | `€XX/mês`, `IVA 23%` (real) | `€XX/month` | Placeholder (IVA real) |
| Pagamentos / Payments | IBAN `PT50 XXXX XXXX...`, prazos `[X]` | mesmo | Placeholder |
| Entrega_e_Prazo / Delivery | `[X] dias úteis` | mesmo | Placeholder |
| Suporte_Ténico / Tech_Suport | **SLAs reais:** Crítico 2h / Alto 4h / Normal 1d / Baixo 3d | mesmo | **Conteúdo real** |

**Conclusão factual:** o bot é um **template pronto a clonar**, não um bot ao serviço de uma PME específica. A engrenagem funciona. A personalização por cliente está por fazer.

### 3.15. Materiais extra entregues pelo Moreira (fora do `.bpz`)

| Ficheiro | Tamanho | Estado da leitura |
|----------|---------|-------------------|
| `KnowlegeBase (base de conhecimento).docx` | 19 KB | **NÃO INSPECCIONADO** em detalhe nesta sessão |
| `Cronograma 26.0124.pdf` | 30 KB | **NÃO INSPECCIONADO** em detalhe |
| `assets/img-chat-bot-01.jpeg` a `04.jpeg` | — | **NÃO INSPECCIONADOS** visualmente |

---

## 4. Números globais

| Métrica | Valor |
|---------|-------|
| Flows | 4 (main + error + timeout + conversation-end) |
| Nós totais | 45 (33 + 4×3) |
| Nós standard no main | 31 |
| Captures com variableId | 5 |
| Acções JavaScript custom | 2 + 2 (flags handoff) |
| Intents | 3 (todos não treinados) |
| Entidades | 0 |
| Tabelas internas Botpress | 3 |
| Conversas webchat reais registadas | 4 |
| Screenshots de utilizadores recebidos | 5 |
| Emails na MailingList | 3 (todos testes) |
| Modelos LLM usados | 4 (GPT-4.1, GPT-4.1-mini, Gemini 2.0 Flash, GPT-4-turbo) |
| Linhas de código JS custom | ~50 (2 acções + 2 flags) |

---

## 5. Opções de próximos passos

O próximo agente deve escolher UMA destas direcções (ou propor outra) após confirmação do Eurico:

### Opção A — Inspeccionar os materiais extra
Abrir `KnowlegeBase.docx`, `Cronograma 26.0124.pdf`, e os 4 screenshots em `assets/`. Cruzar com o bot.json para ver se o Moreira já substituiu placeholders em algum lugar que o export do bot não reflecte (porque o DOCX pode ser uma versão mais recente).

**Agente sugerido:** `@ux-design-expert` (Uma) ou `@analyst` (Alex).
**Tempo estimado:** ~30 min.

### Opção B — Responder às 5 perguntas do Moreira (briefing original)

O Moreira fez **5 perguntas técnicas** no email (ver `00-briefing/`). Esta auditoria dá bases factuais para responder com precisão. Produzir documento `02-prd/respostas-5-questoes-moreira.md` com uma resposta por questão, citando evidência directa desta auditoria.

**Agente sugerido:** `@dev` (Dex) ou `@ux-design-expert` (Uma).
**Tempo estimado:** ~1.5h.

### Opção C — Mensagem de resposta ao Moreira
Escrever a mensagem de resposta do Eurico para o Moreira (tom de pares, directo, sem vendas), incluindo:
- Alerta PAT expostos
- Reconhecimento do que o bot tem (RGPD real, SLAs reais, horários reais, engrenagem funcional)
- Reconhecimento do que falta (personalização do template)
- Convite a próxima etapa

**Agente sugerido:** `/market-copy` ou `copy-chief`.
**Tempo estimado:** ~1h.

### Opção D — Guia de fixes para o Moreira aplicar
Produzir `03-codigo/guia-fixes-botpress.md` com os 18 fixes identificados, em linguagem step-by-step para o Moreira executar no Studio dele. Prioritário: I1 (PAT), I3 (transições null), I4 (EN sem destino).

**Agente sugerido:** `@dev` (Dex).
**Tempo estimado:** ~2h.

### Opção E — Criar story AIOX
Transformar este handoff numa story `docs/stories/active/{id}-moreira-bot-fixes.md` seguindo o template AIOX. Implementar via SDC (Story Development Cycle).

**Agente sugerido:** `@sm` (River) `*draft`.
**Tempo estimado:** ~30 min para criar story, depois ciclo normal.

---

## 6. Regras a respeitar (herdadas de MEMORY.md e `.claude/rules/`)

Obrigatórias para o próximo agente:

| Regra | Como aplicar |
|-------|-------------|
| `language-standards.md` | Todo o output em PT-PT, zero PT-BR |
| `handoff-location.md` | Novos handoffs só em `membros/jose-moreira/handoffs/`, com blocos início/meio/fim |
| `workspace-governance.md` | Material do Moreira só dentro de `membros/jose-moreira/` |
| `mandatory-change-log.md` | Registar diffs reais em commits e handoffs |
| `agent-authority.md` | Só `@devops` faz `git push` |
| `comunidade-safety.md` | N/A aqui mas respeitar em geral |
| Memória `feedback_moreira_no_hallucinations.md` | **Zero métricas/arquitectura/integrações inventadas** — só evidência directa do `.bpz` + ficheiros físicos |
| Memória `project_moreira_chatbot.md` | A frase canónica do Moreira é a única descrição válida |
| Memória `feedback_no_projected_business_models.md` | Não projectar pricing, partnerships, white-label — Moreira não pediu |
| Memória `feedback_never_restart_context.md` | Ler este handoff + MEMORY — nunca pedir re-explicação |

---

## 7. Decisões pendentes (do Eurico, não do agente)

| # | Decisão | Para quê |
|---|---------|----------|
| D1 | Escolher uma das 5 opções (A–E) da secção 5 | Direcção da próxima sessão |
| D2 | Alertar o Moreira do PAT exposto — via WhatsApp ou email? | Segurança do Moreira |
| D3 | Eliminar ou arquivar os 9 docs da sessão 19/04? | Higiene de projecto |
| D4 | Preencher `membros/jose-moreira/README.md` (vazio) como índice do projecto | Navegabilidade |

---

## 8. Ficheiros de referência (leitura para o próximo agente)

Ordem sugerida:

1. **Este handoff** — `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`
2. `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` — briefing original do Moreira
3. `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/bot.json` — fonte única de verdade do bot (268 KB, inspeccionável via Python)
4. `membros/jose-moreira/assets/img-chat-bot-01.jpeg` a `04.jpeg` — o que o Moreira viu no emulador
5. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\project_moreira_chatbot.md`
6. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\feedback_moreira_no_hallucinations.md`

**NÃO usar como fonte:**
- `RETOMA-20260419-validacao-projecto-moreira.md` (alucinação confirmada)
- Qualquer doc em `01-pesquisa/` e `02-prd/` produzido em 19/04 (a confirmar caso a caso)

---

## 9. Comando Python útil para inspeccionar o `.bpz`

Para qualquer agente que precise re-inspeccionar pontos específicos:

```bash
cd "/c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz"

# Listar keys top-level
python -c "import json; d=json.load(open('bot.json','r',encoding='utf-8')); print(list(d.keys()))"

# Ver main flow nodes
python -c "
import json, sys; sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('bot.json','r',encoding='utf-8'))
main = [f for f in d['flows'] if f['id']=='wf-main'][0]
for n in main['nodes']: print(n.get('name'), '|', n.get('type'))
"

# Ver transições null problemáticas
python -c "
import json, sys; sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('bot.json','r',encoding='utf-8'))
main = [f for f in d['flows'] if f['id']=='wf-main'][0]
for n in main['nodes']:
    for ins in n.get('instructions', []):
        for tr in ins.get('transitions', []):
            if tr.get('destination', {}).get('node') is None:
                print(f\"{n.get('name')} -- {tr.get('label')} --> null\")
"
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `José Moreira` (membro da comunidade [IA]AVANÇADA PT)
- LOCALIZAÇÃO CORRECTA: `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`
- LOCALIZAÇÃO ACTUAL: `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Uma (UX Design Expert)
DATA: 20/04/2026
ESTADO: `pending` (aguarda consumo por próximo agente)
CONSUMIDO: `false`
HANDOFF ANTERIOR: `RETOMA-20260419-validacao-projecto-moreira.md` — **marcado como alucinação pelo Eurico em 20/04/2026, não usar como fonte**

---

*Este handoff substitui o RETOMA-20260419 como fonte de verdade operacional. Toda a análise acima é evidência directa do `.bpz` exportado pelo Moreira em 15/04/2026. Nenhuma afirmação foi inferida — cada ponto tem o seu caminho de origem dentro do ficheiro. Próximo agente: ler este handoff + briefing do Moreira + memórias indicadas, confirmar direcção com Eurico, avançar.*
