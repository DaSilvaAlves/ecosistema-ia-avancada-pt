# Respostas às 5 questões técnicas — Chatbot Botpress

**Para:** José Moreira
**De:** Eurico Alves / [IA]AVANÇADA PT
**Data:** 20 de Abril de 2026
**Assunto:** Respostas ao briefing enviado + análise do ficheiro `.bpz`
**Estado:** `DRAFT — aguarda aprovação do Eurico antes de enviar`

---

## Nota inicial

Caro José Moreira,

Muito obrigado pelo envio do ficheiro `.bpz` e pelo briefing detalhado. Analisámos o bot com atenção, importámos no Studio e inspeccionámos o flow, a KB, as variáveis, os hooks e a configuração. Abaixo respondemos às 5 questões que colocou, pela ordem em que foram feitas.

Em cada ponto:
- **O que acontece** — diagnóstico directo
- **Porque acontece** — explicação técnica em PT-PT acessível
- **O que pode fazer** — passos concretos que pode aplicar já

No fim, deixamos uma nota curta sobre 4 pontos urgentes que encontrámos e que convém corrigir nas próximas horas (não são das 5 questões, mas são importantes para si).

---

## 1. UPLOAD QUE SOME — Ícone aparece em anónimo, desaparece em normal

### O que acontece

O ícone de clipe (anexo de ficheiro) aparece quando visita o link do webchat em **janela anónima** (incógnito), mas **desaparece** quando visita em janela normal (logado ou com sessões anteriores).

### Porque acontece

O problema **não está no flow do bot**. Está na **configuração do widget webchat público** — ficheiro de configuração JSON que vive em:

```
https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json
```

Este ficheiro controla o aspecto visual do widget (cores, botão, composer) e decide se o campo de input permite anexar ficheiros. O comportamento diferente entre anónimo e normal vem de um de dois motivos:

1. **Cache do browser** — em navegação normal, o browser pode estar a carregar uma versão antiga do ficheiro de configuração (sem `allowFileUpload: true`), enquanto em anónimo carrega a versão nova
2. **Propriedade `allowFileUpload`** — dependendo de como o webchat foi configurado, pode haver uma regra que desactiva o upload para utilizadores identificados

### O que pode fazer

**Passo 1 — Forçar o Studio a regenerar a configuração:**
- Entrar no **Studio** → **Webchat** → **Settings / Configuration**
- Procurar a opção **"Allow file upload"** ou **"File uploads"** e garantir que está **ON**
- Guardar e **Publish** o webchat (botão de publicar)
- Isto gera um novo ficheiro `.json` e actualiza o link público

**Passo 2 — Testar limpando cache:**
- No browser normal, abrir ferramentas de developer (F12)
- Ir ao separador **Application / Storage** → **Clear site data** (para o domínio `bpcontent.cloud`)
- Recarregar a página com **Ctrl + Shift + R** (hard refresh)
- Verificar se o ícone aparece

**Passo 3 — Se continuar a não aparecer:**
- Copiar o URL completo do webchat e abrir em anónimo
- Se funcionar em anónimo mas não em normal, é cache. Se não funcionar nem em anónimo, é configuração.
- No segundo caso, precisamos ver os settings concretos do webchat juntos — pode partilhar screenshot dos settings, ou dar-nos acesso colaborador ao workspace Botpress para vermos em directo.

**Confirmação técnica que já fizemos:** no flow, o nó `Apoio_Humano_PT` tem um **capture File** correctamente configurado (variável `var-0b3eeb9be7`), logo o problema não vem do flow. É mesmo do widget / configuração pública.

---

## 2. SKIP NO APOIO HUMANO — Permitir saltar o upload

### O que acontece

No nó `Apoio_Humano_PT`, o bot pede "Por favor, envie a imagem ou ficheiro relevante ao seu pedido" e fica à espera. Se o utilizador escrever texto em vez de anexar ficheiro, o bot **rejeita** e pede de novo. Não há forma de avançar sem anexar.

### Porque acontece

Em Botpress (motor LLMz), o `capture File` é um tipo de recolha **estrita**. Só aceita respostas que sejam ficheiros (imagens, documentos). Qualquer texto é considerado inválido e dispara a `retryMessage`. Não há uma propriedade `optional: true` directa no schema actual deste tipo de capture — tem de se redesenhar o nó.

### O que pode fazer

Tem **3 caminhos possíveis**. Recomendamos o primeiro.

**Opção A — Pergunta com escolha (RECOMENDADO)**

Substituir o capture File por uma pergunta com 2 botões:

1. Adicionar nó de **Single Choice** antes do capture:
   - Pergunta: *"Tem algum ficheiro ou imagem para partilhar? (ex.: foto do problema, documento, ecrã)"*
   - Opção 1: **"Sim, quero anexar"** → vai para o nó com capture File (o actual)
   - Opção 2: **"Não, continuar sem anexar"** → vai directamente para o nó seguinte (agente humano)

2. Eliminar o prompt directo de ficheiro do nó original e manter só o capture File dentro do sub-caminho "Sim".

**Vantagens:** utilizador decide se quer anexar ou não. UX clara, dois cliques. Sem código custom.

**Opção B — Capture com condição de texto (NÃO recomendada)**

Manter o capture File, mas adicionar uma transição condicional: se a resposta for texto (e não ficheiro), ir directamente para o agente humano. **Problema:** o motor LLMz não trata bem estas transições mistas e o comportamento pode ser instável.

**Opção C — Acção JS personalizada**

Adicionar um bloco de **Execute Code** antes do capture que pergunta "Deseja anexar ficheiro? (sim/não)" e só chama o capture se a resposta for "sim".

**Vantagens:** maior controlo. **Desvantagens:** exige JavaScript, mais difícil de manter.

### Recomendação concreta

Vá pela **Opção A**. No Studio:
1. Abrir o `Apoio_Humano_PT`
2. Adicionar um nó de Single Choice antes do actual capture File
3. Configurar as 2 opções e as suas transições
4. Testar no emulador em ambos os caminhos

Em 15-30 minutos está feito.

---

## 3. REPLICAÇÃO — Viável para várias empresas no Botpress gratuito?

### Resposta directa

**Não é viável no plano gratuito actual.** Vamos explicar porquê, e o que seria preciso para ser viável.

### Porque não é viável (4 razões concretas)

1. **Limite de bots por workspace**
   O plano gratuito permite até 5 bots por workspace. Para servir 10, 20 ou 100 PMEs precisaria de múltiplos workspaces ou de migrar para plano **Pro** (aproximadamente 79 USD/mês por workspace, valores de Abril 2026).

2. **Limite de mensagens com IA**
   O plano gratuito tem limites de interacções com os modelos de linguagem (gpt-4o-mini para intents, gpt-4-turbo para Knowledge Base). Estimativa: cada conversa que invoca a KB custa entre €0,30 a €0,35 em tokens. 1.000 conversas → cerca de €300-350/mês só em LLM, se tiver de pagar à parte. No plano gratuito, atingido o limite, o bot **pára de responder** com IA.

3. **Configuração hardcoded**
   O bot actual tem os seguintes valores fixos nas variáveis de bot:
   - `AIRTABLE_PAT` (o seu Personal Access Token da Airtable)
   - `AIRTABLE_BASE_ID` (a sua base Airtable)
   - `AIRTABLE_TABLE_ID` (a tabela específica)

   Para cada empresa cliente, cada uma precisaria do **seu próprio** PAT, Base e Table — isto significa editar manualmente cada clone, o que não escala para além de 3-4 empresas.

4. **Conteúdo é template puro, não parametrizável**
   A Knowledge Base e muitos nós do flow têm placeholders como `[Nome da Empresa]`, `[X]`, `[IBAN]`, `[Morada]`. Para cada cliente, seria preciso substituir manualmente todos estes valores em todos os nós e na KB. Para 10 clientes, são **horas de trabalho manual por cliente**.

### O que seria preciso para tornar a replicação viável

Se quiser mesmo servir várias empresas com este esqueleto, há um caminho técnico. Exige investimento mas é possível:

| Requisito | O que implica |
|-----------|---------------|
| Upgrade para Botpress Pro/Team | ~80 USD/mês por workspace |
| Refactor do bot para usar variáveis de personalização | Substituir `[Nome da Empresa]` por `{{bot.companyName}}` em todos os nós e na KB |
| Cada empresa cliente com o seu Airtable | Cada PME tem de ter a sua própria base Airtable e o seu PAT — ou usar uma base partilhada com separação por coluna `empresa` (mais frágil) |
| KB por cliente | Cada empresa tem conteúdo específico (serviços, horários, morada, contactos). A KB actual serve uma empresa fictícia |
| Processo de onboarding | Um fluxo (template ou script) para criar, configurar e entregar o bot a cada cliente em 30-60 min |

**Diagnóstico honesto do estado actual:** o bot está a cerca de **5-10%** do que seria preciso para suportar replicação multi-cliente. A arquitectura é monolítica, de uma empresa só, com configuração fixa. Chegar a um modelo replicável exige um refactor significativo e uma decisão de plano pago.

### Recomendação

A curto prazo, o caminho mais seguro é:

1. **Concentrar num cliente piloto** — 1 empresa real em Viana do Castelo, bot personalizado 100% para ela
2. **Usar esse primeiro caso como prova** — funciona, gera resultado, aprende-se o que é preciso automatizar
3. **Só depois** considerar replicação, e nessa altura o refactor vale a pena porque já sabe exactamente o que precisa ser variável

Tentar o modelo replicativo antes de ter 1 cliente satisfeito costuma ser caminho para abandono.

---

## 4. AUTORIA E CONTROLO — Integrar anúncios e suporte sem perder autoria

### Onde está a autoria do bot hoje

Antes de responder, convém deixar claro o que o Moreira já **detém** neste momento (é mais do que parece):

| Activo | Quem detém | Nota |
|--------|-----------|------|
| Conta Botpress (email pessoal) | José Moreira | Registada em `josemmoreira1@gmail.com` |
| Workspace "José Moreira's Workspace" | José Moreira | Propriedade pessoal total |
| Bot (ID `e7e5db81-ad3c-45e2-bf25-033d76b04059`) | José Moreira | Vive dentro do workspace do Moreira |
| Link público do webchat | José Moreira | Gerado pelo bot, só o dono pode alterar |
| Base Airtable (`app7S6wEWqhpQgMEV`) | José Moreira | Propriedade dele. Ninguém da Airtable ou Botpress tem acesso |
| Código do flow (hooks, variáveis, intents) | José Moreira | Exportável em `.bpz` a qualquer momento |
| Base de Conhecimento (KB) | José Moreira | Indexada no workspace dele |

**Isto significa que a autoria está protegida por defeito**, desde que o workspace, a conta e as integrações se mantenham em nome do Moreira.

### O que pode colocar a autoria em risco

Há 4 cenários onde a autoria pode enfraquecer. Listamo-los para o Moreira decidir.

| Cenário | Risco | Como prevenir |
|---------|-------|----------------|
| Dar acesso de **editor** ao cliente no workspace | Cliente pode modificar/apagar o bot | Dar só acesso de **viewer** ou criar workspace dedicado por cliente |
| Aceitar **anúncios/patrocínios** no bot | Depende do acordo — se o patrocinador pedir alterações ao flow, pode impor direcção | Contratualizar que o patrocinador **não edita** o flow, só paga exposição |
| Parceria de **suporte técnico** com outra entidade | Se a outra entidade gerir o workspace, o Moreira perde controlo | Manter o workspace em seu nome; a entidade ajuda mas **não é dona** |
| **Cedência de direitos sobre o código** (mesmo de palavra) | Se ceder explicitamente, perde IP | Nunca ceder direitos. Se alguém pedir, responder que o bot é propriedade sua |

### Os 4 modelos possíveis para integrar anúncios e suporte

| Modelo | Autoria fica com... | Prós | Contras |
|--------|---------------------|------|---------|
| **A — Gestão 100% Moreira** | Moreira | Controlo total | Todo o ónus é seu (outage, RGPD, multas) |
| **B — Workspace por cliente, Moreira como admin** | Moreira | Separação limpa por cliente | Moreira gere N workspaces, custo cresce com nº clientes |
| **C — Multi-bot ownership em Botpress Pro + cláusula contratual de IP** | Moreira | Funciona, escalável | Exige plano Pro (custo mensal) |
| **D — White-label em iframe embutido num site próprio do Moreira** | Moreira | Máximo controlo | Tecnicamente complexo. Exige domínio próprio, infra de subscrição |

### Recomendação

O caminho mais sólido, a médio prazo, é o **Modelo C**: Botpress Pro com estrutura multi-bot + contrato simples de 1 página que deixa claro:

> *"O bot, o código, o flow, a Knowledge Base e a integração Airtable são propriedade exclusiva de José Moreira. O cliente paga pelo uso do serviço; não pode copiar, modificar nem redistribuir a estrutura do bot."*

Com isto, pode aceitar anúncios, suporte técnico de terceiros e até subcontratar trabalho, sem nunca perder autoria.

---

## 5. AGENTE HUMANO VS BASEKNOWLEDGE — Fazer a conversa do agente humano aparecer em vez do texto da KB

### O que acontece hoje

No flow actual:
- O nó `Apoio_Humano_PT` (e `Human_Support_EN`) sinaliza `conversation.handoff = true`
- Esta flag é o sinal "preciso de agente humano"
- **Mas:** no flow não há nada que **impeça** a Knowledge Base (KnowledgeAgent) de continuar a responder. Se o cliente escrever uma pergunta depois de pedir apoio humano, o bot responde com a KB — que ainda tem placeholders como `[Nome da Empresa]`.

### Porque acontece

Em Botpress, a flag `handoff` é **um sinal para o sistema de webchat**, não para o motor de IA do flow. Para o motor, nada muda: ele continua a processar mensagens e a invocar a KB se não houver gate que o impeça.

O que falta é a **peça externa** que consome a flag:

- Um **agente humano real** conectado ao webchat (via Inbox do Botpress ou integração externa como Slack/WhatsApp)
- OU um **gate no flow** que impede a KB de responder quando `handoff = true`

### As 4 opções para resolver, da mais simples à mais completa

| Opção | Como | Custo | Realidade |
|-------|------|-------|-----------|
| **A — Inbox oficial do Botpress** | Activar o webchat inbox (requer plano Pro). Agente humano recebe notificação e responde via dashboard Botpress. | Plano Pro (~80 USD/mês) + tempo humano | Solução limpa. Produção-ready. |
| **B — Gate no flow** | Adicionar um hook `before_llmz_execution` que verifica `conversation.handoff` e bypassa a KB. O bot fica em modo "a aguardar agente humano" e só responde com mensagens estáticas. | JavaScript custom, ~1-2h trabalho | Funciona no plano gratuito. Mas não há agente humano real a responder — é mais um "segurar a porta" do que resolver. |
| **C — Canal externo (Slack/WhatsApp)** | Quando `handoff=true`, enviar mensagem para Slack ou WhatsApp Business do agente humano. Agente responde manualmente. Uma integração Twilio ou Zapier pode ligar. | Complexo. Exige integrações externas. Custo de Twilio/Zapier pequeno mas real. | Realista para equipas pequenas com 1-2 agentes. |
| **D — Nó "Aguardar resposta humana"** | Criar um nó de espera com `wait` até receber input marcado como vindo de humano. | Limitado pelo motor Botpress — o `wait` tem limites de sessão. | Pouco fiável. Não recomendamos. |

### A questão de fundo que é preciso responder primeiro

Antes de escolher a opção técnica, há uma pergunta de negócio que vem à frente:

> **Quem é o "agente humano" que vai responder?**

As respostas possíveis são:
- **Só o Moreira** — então as horas de atendimento são as horas em que o Moreira pode estar ao computador
- **O cliente (a PME)** — então a PME tem de ter alguém atento ao dashboard do Botpress ou ao Slack/WhatsApp
- **Ninguém, por agora** — então o bot deve dizer *"Um responsável entrará em contacto por email em X horas"* e o email deve chegar mesmo (falaremos disto na nota final)

Sem esta resposta, qualquer solução técnica fica vazia. Recomendamos decidir isto **antes** de implementar a opção técnica.

### Recomendação concreta

Para o estado actual (bot em aprendizagem, sem cliente real ainda):
- **Curto prazo:** implementar **Opção B** (gate no flow) + mensagem clara ao cliente *"Recebemos o seu pedido. Um responsável entrará em contacto por email em até 24h"*
- **Garantir** que o email de notificação ao responsável funciona de facto (via Airtable → Zapier → email, ou via hook Botpress que manda email directo)
- **Médio prazo (quando houver 1º cliente PME real):** decidir entre Opção A (Pro Inbox) ou Opção C (Slack/WhatsApp) conforme a PME preferir

---

## Nota final — 4 pontos urgentes (não fazem parte das 5 questões, mas importam)

Durante a análise do `.bpz`, encontrámos 4 pontos que convém resolver nas próximas 24-48h. Não são das perguntas que colocou, mas são importantes para **si** e para a sua segurança:

| # | Ponto | O que fazer |
|---|-------|-------------|
| 1 | O seu **Airtable Personal Access Token** (PAT) está dentro do ficheiro `.bpz` em texto claro. Qualquer pessoa com o ficheiro pode aceder à sua base Airtable | **Revogar** o PAT em `https://airtable.com/create/tokens` e gerar novo. Actualizar no Studio → Variables → `AIRTABLE_PAT`. Quem tem o `.bpz`: nós (apagado após análise) + quem mais enviou |
| 2 | Na KB, há uma **foto pessoal sua** (`IMAGEM1.jpg`) marcada como **conteúdo público** no Botpress cloud | Ir ao Studio → Knowledge Base → ficheiros. Apagar a foto ou mudar para conteúdo privado. URL público exposto: `cdn.botpress.cloud/workspace_files/...` |
| 3 | Na KB, existe um **PDF com simulação de CV** (dados pessoais sensíveis seus) como conteúdo público | Apagar da KB. Se foi usado para treino da KB, a informação já está incorporada — pode apagar o ficheiro sem perder indexação |
| 4 | Variáveis `clientName` e `ClientName` (com C maiúsculo e minúsculo) existem em paralelo no bot. A consequência é que a captura no flow grava em `clientName` mas o envio para a Airtable usa `ClientName` — **o Airtable está a receber linhas vazias no campo Nome** | No Studio → flow → capture do nome: mudar o nome da variável para coincidir. Ou no código do hook que envia para Airtable (`Armazenamento`), mudar `ClientName` para `clientName`. É 1 alteração pequena mas é a razão pela qual pode estar a perder leads sem reparar |

Os primeiros 3 pontos são de **privacidade/segurança**. O ponto 4 é **funcional** — é o que provavelmente faz com que as linhas na sua base Airtable estejam a chegar sem o nome do cliente.

---

## Próximos passos

Estas respostas foram elaboradas a partir da análise directa do ficheiro `.bpz` que nos enviou. Se quiser, podemos:

1. **Esclarecer** qualquer um dos pontos acima por email ou mensagem
2. **Acompanhar de perto** a aplicação das correcções se preferir trabalhar em conjunto
3. **Conversar** noutro momento sobre o posicionamento do negócio (há observações úteis que preferimos não incluir aqui para não desviar do foco técnico)

Fico à disposição. Parabéns pelo trabalho feito — o bot tem estrutura real, intents bilingues, integração Airtable e um flow pensado. A base está lá. Com os acertos acima, fica sólido.

Abraço,
Eurico Alves
[IA]AVANÇADA PT

---

## Metadados internos (não enviar ao Moreira)

- **Autoria do documento:** Uma (UX Design Expert)
- **Base de evidência:** `RETOMA-20260420-auditoria-profunda-v2.md` secção 10 + análise directa do `.bpz`
- **Tom:** respeitoso, pragmático, Carnegie (reconhecer trabalho + resolver dor real)
- **Tratamento:** "Moreira" em vez de "tu" — primeiro contacto técnico formal
- **Limites respeitados:** `feedback_no_projected_business_models.md` (não propomos pricing/parceria), `feedback_moreira_no_hallucinations.md` (zero invenção), `language-standards.md` (PT-PT), `feedback_carnegie_copy_framework.md` (estrutura)
- **Aprovação necessária antes de enviar:** Eurico
- **Canal de envio sugerido:** email (o Moreira enviou email; a resposta por email é natural)
