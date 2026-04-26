# Resposta às 5 questões — Sr. José Moreira (Clientes_Chatbot)

> Versão final consolidada (v3) — 25/04/2026
> Substitui v2 e v1.

---

Caro Sr. Moreira,

Recebi as suas 5 questões e dediquei o tempo necessário a cada uma — abri o `.bpz` que partilhou, conferi o `bot.json` linha a linha e cruzei com a documentação oficial do Botpress. Vai aqui a resposta às cinco questões pela ordem em que enviou, com as recomendações concretas que considero mais sólidas.

---

## Q1. Upload que some — o ícone aparece em modo anónimo, desaparece em navegação normal

### O que está correcto no seu lado

Confirmei a configuração pública do seu webchat (o ficheiro `20260323112227-A7N2XPSU.json` que o Botpress gera quando publica). A opção **`allowFileUpload`** está **activada**. O **Vision Agent** no bot também está **ligado**. Ou seja, a configuração do lado do bot **está correcta**. Se o ícone aparece em modo anónimo, é porque o sistema está preparado para o mostrar — o código sabe que há upload.

### Porque acontece

O padrão "anónimo funciona, normal não" raramente é problema do bot. Em modo anónimo (ou janela privada), o browser:

- Ignora **cache local** (carrega tudo fresh)
- **Desactiva as extensões** por defeito (no Chrome desktop)
- Parte de uma sessão limpa, sem cookies nem localStorage anteriores

Portanto o que está a esconder o ícone em modo normal é quase de certeza **local do seu browser** — ou um ficheiro antigo em cache, ou uma extensão a bloquear elementos em `botpress.cloud`. A configuração do bot está bem.

### Plano de teste — por ordem, pare assim que resolver

**Se testar em Desktop (Chrome/Edge/Firefox):**

1. No link do chat, fazer **hard reload**: `Ctrl + Shift + R`
2. Se não resolver: `F12` > separador **Application** > **Storage** > **Clear site data** (para `botpress.cloud` e `bpcontent.cloud`) > reabrir link
3. Se não resolver: abrir o **mesmo link noutro browser** onde não tem extensões instaladas (Edge ou Firefox limpos). Se o ícone aparecer, a causa é uma extensão no Chrome — as suspeitas habituais são uBlock Origin, AdBlock Plus, Privacy Badger, Ghostery

**Se testar em Chrome Android (mobile):**

1. Menu (3 pontos) > **Settings** > **Privacy and security** > **Clear browsing data** > escolher **Cached images and files** e **Cookies and site data** (últimas 24h chega). Fechar a aba. Reabrir o link do chat. Testar
2. Se não resolver: instalar temporariamente o **Firefox** ou **Edge** no telemóvel e abrir o mesmo link. Se aparecer, é cache-específica do Chrome

**Se mesmo assim falhar:**

Aí sim é bug do widget Botpress v3.6 — mas é residual. Nesse caso abrimos ticket no suporte Botpress com os passos reproduzidos. A configuração do seu bot está correcta, portanto o ónus é deles.

### O que NÃO precisa de fazer

Não precisa de voltar ao Studio para "activar" a opção de upload — **já está activa**. E não há nenhuma regra do Botpress que desactive upload só para utilizadores identificados (isso não existe). Se alguém lhe sugerir mexer na configuração do bot para resolver isto, está a procurar no sítio errado.

### Para quando replicar noutros clientes

Este não é bug do seu bot em particular — é o mesmo comportamento que vai ver em qualquer chatbot Botpress publicado via shareable URL. Para as próximas replicações, a única nota é: **confirmar no Studio que `allowFileUpload` está ligado** antes de publicar o bot para o cliente. Fica como item de checklist de entrega — não precisa de fix especial.

Quando fizer os testes, diga-me em que passo resolveu — isso ajuda-me a construir a checklist de diagnóstico para os próximos bots dos seus clientes.

---

## Q2. Skip no apoio humano — permitir saltar o upload e avançar para o agente

### O que está a acontecer no bot hoje

No nó `Apoio_Humano_PT` há duas perguntas em sequência:

1. Primeiro pede a descrição da dúvida: *"Por favor, descreva a sua dúvida."*
2. Depois pede o ficheiro: *"Se desejar, pode anexar aqui um print screen ou documento sobre o problema."*

O texto diz "se desejar" — sugere opcional. Mas tecnicamente o capture File do Botpress é **estrito**: só aceita URL de ficheiro. Se o utilizador escrever "não tenho", "skip" ou qualquer texto, o capture não reconhece, pede outra vez, e após 2 retries fica sem saída definida (a sua configuração tem `handleFailure: false`). Ou seja, o prompt **convida** a anexar, mas o motor **exige** um upload para avançar. É por isso que o utilizador encalha.

Isto confirma-se na documentação oficial do Botpress: o capture File não tem botão nativo de "skip".

### A mesma coisa acontece no `Human_Support_EN`

Os dois nodes são gémeos — mesmo padrão, mesma variável de ficheiro partilhada. Qualquer correcção tem de ser feita em **ambos**, senão a versão inglesa fica inconsistente. Menciono já para não se esquecer no Studio.

### Solução recomendada — Choice antes do File

Adicionar um **Capture Information → Choice** antes do capture File actual, com botões claros:

- Pergunta: *"Quer anexar um print ou documento sobre o problema?"*
- Opção 1 (label): **"Sim, quero anexar"** → value: `sim`
- Opção 2 (label): **"Não, seguir para o agente"** → value: `nao`

Depois configurar a transição condicional:
- Se o utilizador escolher **"Não"** → transição directa para a mensagem *"Um assistente entrará no chat em breve."* (saltar o capture File)
- Se escolher **"Sim"** → continua para o capture File como já está

Assim o utilizador tem controlo explícito: ou anexa, ou pressiona um botão e vai directo para o atendimento. Sem texto livre, sem confusão com o motor.

**No Studio (passos concretos):**

1. Abrir o flow `wf-main`, nó `Apoio_Humano_PT`
2. Entre a 2ª instrução (o capture File actual) e a mensagem "Um assistente entrará no chat em breve", **inserir uma nova instrução Capture Information** com:
   - **Question:** "Quer anexar um print ou documento sobre o problema?"
   - **Choices** (ligar o toggle): adicionar as duas opções acima
3. Mover o capture File para dentro do ramo "Sim" do Choice (transição condicional). Assim só dispara se o utilizador escolher anexar
4. Repetir tudo no `Human_Support_EN` com os textos em inglês
5. Guardar e testar no emulador em ambos os caminhos (sim/não)

Tempo estimado: 20 a 30 minutos para os dois nós.

### Alternativa mais simples — activar `handleFailure`

Se não quiser adicionar o Choice, a via mínima é:

1. No capture File, ligar a flag **"Add transition to handle failure"** (`handleFailure: true` no JSON)
2. Definir a failure transition para o mesmo sítio onde já vai o caminho "sim" (a mensagem de assistente)

Com isto, se o utilizador não conseguir anexar após as 2 tentativas de retry, o bot avança em vez de encalhar. É mais rápido de implementar mas a UX é pior — o utilizador passa por 3 prompts antes de seguir em frente. Recomendo só se não quiser tocar na estrutura do nó.

### Para quando replicar noutros clientes

O padrão Choice antes do capture File deve fazer parte do **esqueleto mestre** desde o início. Cada cliente herda já esta UX, sem ter de decidir caso a caso. Pode ficar no seu template Botpress exportável como regra: *"qualquer capture File sempre precedido de Choice Sim/Não"*.

### O que NÃO precisa fazer

Não precisa de alterar o capture File em si — só inserir um Choice antes. E não existe "flag optional" para ligar no capture File — isso não existe no Botpress v3 (já confirmei na doc oficial). Se alguém lhe propuser essa via, vai perder tempo a procurar algo que não está no produto.

---

## Q3. Replicação — é viável usar este esqueleto para várias empresas na versão gratuita?

### Resposta directa

Usar o mesmo esqueleto para várias empresas é **tecnicamente possível**, mas o plano gratuito do Botpress **não foi feito para isso**. A viabilidade depende de como se organiza e de quanto cada bot vai falar com a IA. Vamos aos números reais.

### Os limites de hoje (Abril 2026)

Confirmei na página oficial de pricing do Botpress, plano Pay-as-you-go (gratuito):

| Item | Free | Plus | Team |
|------|------|------|------|
| Custo | 0 USD + AI Spend | 89 USD/mês | 495 USD/mês |
| Bots por workspace | **1** | 2 | 3 |
| Mensagens recebidas/mês | 500 | 5.000 | 50.000 |
| Crédito de IA mensal | 5 USD | 5 USD | 5 USD |
| AI Spend máx (overage) | 100 USD/mês | 100 USD/mês | 500 USD/mês |
| Colaboradores | 1 seat | 2 seats | 3 seats |

Dois factos que mudam tudo:

1. **Free = 1 bot por workspace.** Não são 5, não são 2. É um. Se quiser ter 10 clientes com 10 bots só seus, na conta free não cabe — precisa de 10 workspaces separados ou um plano pago
2. **O crédito de 5 USD de IA é o mesmo em todos os planos.** Cada conversa com a base de conhecimento consome tokens (a sua Base de Conhecimento usa gpt-4-turbo). Uma conversa média pode custar entre 5 e 15 cêntimos americanos. 5 USD chegam para 30 a 100 conversas por mês, depois entra AI Spend pago. Isto aplica-se quer esteja em Free, Plus ou Team

### A estrutura técnica actual — o que é genérico vs específico

No esqueleto que construiu, cruzo o que é **reutilizável** vs o que **tem de mudar cliente a cliente**:

**Reutilizável (fica igual entre clientes):**
- Estrutura dos 33 nós do `wf-main` (RGPD, captura de dados, menu, apoio humano PT/EN)
- Os 4 fluxos (`wf-main`, `wf-error`, `wf-timeout`, `wf-conversation-end`)
- Os hooks `track_iterations` e `inject_learnings`
- Configuração do KnowledgeAgent, VisionAgent, TranslatorAgent
- Lógica de handoff para agente humano

**Específico por cliente (tem de mudar sempre):**
- 3 variáveis de ambiente: `AIRTABLE_PAT`, `BASE_ID`, `TABLE_ID` — cada cliente tem a sua base Airtable e o seu token
- 7+ blocos de texto com placeholders já escritos por si — `[Nome da Empresa]` na saudação, `[Serviço A/B/C]` no menu, `IBAN PT50 XXXX...` nos pagamentos, `[Rua, Número, Código Postal]` na localização, coordenadas GPS, carreiras de autocarro, email `financeiro@empresa.pt`, etc.
- O conteúdo da Base de Conhecimento (o documento HTML) — é o que o `KnowledgeAgent` consulta
- A tabela `MailingListsEmailsTable` (se o cliente quiser a sua própria lista de leads)

Contei pelo menos 30 a 60 pontos distintos a preencher por cliente se for feito à mão. Não é impossível — mas também não é clonar e publicar em 5 minutos.

### Modelos de replicação viáveis

**Modelo A — Cada cliente tem a sua conta gratuita, o Sr. é colaborador**

O cliente cria a conta dele no Botpress (gratuito), o Sr. é adicionado como o único colaborador. Vantagens:
- Cada cliente tem os seus 500 msgs/mês e os seus 5 USD de AI credit — não acumulam no Sr.
- O cliente é dono técnico do bot — reduz o risco de lock-in no seu lado
- Custo zero para o Sr. enquanto o cliente não precisar mais do que a free tier dá

Desvantagens:
- O cliente tem de criar conta Botpress (5 min, mas tem de fazer)
- Se o cliente ultrapassar 500 msgs ou 5 USD de IA, é o cliente que decide se paga o AI Spend ou upgrade

**Modelo B — Todos os bots na sua conta Plus (89 USD/mês)**

O Sr. cria o bot para cada cliente dentro da sua própria conta Plus. Limitado a 2 bots.

Só viável com 1 a 2 clientes. Depois disso, upgrade para Team (495 USD/mês) para 3 bots. Acima de 3, múltiplas subscrições ou múltiplos workspaces.

**Modelo C — Workspace Enterprise**

Preço por negociação. Relevante só a partir de 10+ clientes com bots pesados.

### O trabalho de refactor antes de replicar

Antes de ir ao 2º cliente, compensa fazer uma coisa uma vez só: **substituir os 30-60 placeholders de texto por variáveis parametrizáveis** do Botpress (`{{bot.companyName}}`, `{{bot.iban}}`, `{{bot.phone}}`, etc.). Depois, para cada novo cliente, só se preenchem as variáveis no painel do bot — sem tocar nos nós.

Tempo de refactor: estimo 4 a 8 horas para um bot desta dimensão (depende da sua familiaridade com o Studio). A partir daí, cada cliente novo é:

- Clonar o bot template
- Editar as 3 env vars (Airtable)
- Preencher as 30-60 variáveis de empresa no painel
- Substituir o documento da KB
- Testar em PT e EN

Estimativa por cliente depois do refactor: 1 a 2 horas.

### Então é ou não é viável?

É viável. Com estas notas:

1. **Free tier serve para protótipo e para o 1º cliente** a baixo volume. Não serve para 5 clientes em paralelo na mesma conta
2. **Recomendo o Modelo A** (cada cliente tem a sua conta). Escala sem upgrade do seu lado e reduz lock-in
3. **O refactor de placeholders é o investimento de tempo uma vez só** que transforma o esqueleto num verdadeiro template
4. **Fique atento ao AI Spend** — é aí que a conta escala, não nos planos fixos. Com a KB activa e gpt-4-turbo, um bot com 100 conversas/mês pode facilmente ultrapassar os 5 USD de crédito incluídos

### O que NÃO vou fazer nesta resposta

Não vou sugerir-lhe quanto cobrar aos seus clientes nem projectar ganhos mensais — essa é decisão sua, depende do valor que entrega e da dor concreta que resolve em cada PME. Assim que tiver um número que queira testar, podemos validar se está coerente com os custos técnicos que mostrei acima.

---

## Q4. Autoria e controlo — integrar anúncios e suporte sem perder autoria

### Onde está a autoria do seu bot hoje — tecnicamente

O bot é seu. Não é formalidade, é facto verificável nos ficheiros:

- Bot `e7e5db81-ad3c-45e2-bf25-033d76b04059` criado e gerido por `josemmoreira1@gmail.com` no seu workspace
- Os 4 flows (Main, Error, Timeout, Conversation End), 45 nodes no total (33 só no flow Main), 2 hooks LLMz — tudo gravado no seu nome
- A base Airtable `app7S6wEWqhpQgMEV` está na sua conta pessoal, o PAT é seu
- O `.bpz` é um snapshot seu — exportável e portável só por quem tenha acesso ao workspace

Ninguém pode alterar nem apagar nada disto sem autorização sua explícita. A autoria está protegida por design. A pergunta real é: como manter isto assim quando começar a partilhar acessos (clientes, parceiros, consultores)?

### Os roles do Botpress — o que dar e a quem

O Botpress tem 6 níveis de colaborador. Os relevantes para o seu cenário:

| Role | O que pode fazer | Quando atribuir |
|------|------------------|-----------------|
| Viewer | Só vê o bot, não toca em nada | Cliente que quer ver conversas / observador externo |
| Developer | Cria, vê, actualiza. Só apaga o que criou | Outro dev que o ajuda em tarefas concretas |
| Manager | Cria, vê, actualiza, apaga tudo. Vê auditoria e billing | Sócio operacional de confiança |
| Administrator | Tudo + adiciona/remove colaboradores + billing | Só o Sr. |

Regra simples: **Admin é só seu.** Qualquer outra pessoa (cliente, parceiro, consultor) entra no máximo como Viewer. Se precisar de ajuda em tarefas técnicas, concede Developer temporariamente e o Sr. revê antes de publicar. Nunca Admin a ninguém além do Sr.

### Como proteger a autoria em cada cenário

Três coisas simples, independentes do formato comercial:

1. **Workspace sempre em nome do Sr.** Se um cliente quiser criar o bot em nome da empresa dele, use o Modelo A da Q3 (cliente tem conta própria gratuita, o Sr. entra como colaborador). O seu workspace-mestre, onde vive o esqueleto template, fica sempre seu
2. **Viewer por defeito** para clientes e terceiros. Níveis superiores só quando há necessidade concreta e temporária
3. **Exportar o `.bpz` regularmente** e guardar localmente. É o seu código-fonte. Se um dia houver problema no Botpress cloud, o Sr. tem o bot em ficheiro para reimportar noutro workspace

### Sobre integrar os meus anúncios e suporte técnico

Hoje, entre nós, não existe formato comercial estruturado. O acompanhamento que o Sr. tem é técnico, entre pares, e foi essa a condição desde que entrou na comunidade [IA]AVANÇADA PT — construímos ferramentas em conjunto, resolvemos problemas concretos, partilhamos o que aprendemos. Zero contrato, zero comissão, zero obrigação mútua.

Isto não é por distracção. É intencional. O Sr. está no início do caminho prático com o bot — tem 1 bot, flow em produção, KB configurada, Airtable ligado. Ainda não tem clientes pagantes em operação. Enquanto esse for o quadro, qualquer proposta minha de modelo comercial seria prematura e, sinceramente, pouco honesta.

O que faz sentido fazer agora:
- Continuar a refinar o bot com o meu apoio técnico, sem custo
- O Sr. testar o esqueleto com 1 ou 2 empresas reais (Modelo A da Q3 — cada cliente no Free dele, Sr. como colaborador)
- Cobrar o que o Sr. entender ao cliente final — esse valor é integralmente seu, a autoria é sua, o controlo é seu

Quando o Sr. tiver 2 ou 3 clientes pagantes a operar, retomamos a conversa sobre formato de parceria com dados reais: quanto tempo o Sr. gasta por cliente, quanto recebe, onde o meu input acelera, e se faz sentido alguma fórmula conjunta — seja co-marketing (Sr. aparece como caso da comunidade), afiliação voluntária (link para a comunidade no bot, se quiser), ou outra coisa que não imaginámos ainda. Qualquer uma dessas hipóteses parte de números reais do Sr., não de projecções minhas.

O que não vai acontecer, em caso algum:
- Eu colocar anúncios meus dentro do bot do Sr. sem a sua aprovação explícita
- Pedir comissão sobre clientes que o Sr. angariar
- Exigir exclusividade ou limitar o que pode construir
- Propor modelo comercial sem o Sr. ter dados concretos sobre a sua operação

A autoria fica protegida por design no Botpress (secção acima). O lado comercial fica em pausa voluntária até o Sr. ter base para decidir em igualdade.

Se em qualquer momento sentir que esta conversa precisa de formato mais claro, diga. O ritmo é o seu.

---

## Q5. Agente humano vs Baseknowledge — o que realmente está a acontecer

### Primeiro, uma boa notícia sobre a KB

O Sr. temeu que a base de conhecimento (Baseknowledge) estivesse a intercetar respostas quando devia ser um humano a responder. Olhei linha a linha ao bot.json e encontrei o seguinte:

A sua configuração do Knowledge Agent tem `answerManually: true`. Segundo a documentação oficial do Botpress, isto significa exactamente:

> *"When this option is enabled, your bot won't automatically provide answers in the conversation. The answers it generates will be saved to a dedicated variable which you can use manually in the conversation at a later point."*

Traduzido: a KB **não** responde sozinha no chat. Ela gera respostas e guarda-as numa variável (`{{turn.KnowledgeAgent.answer}}`) — mas só aparecem se o Sr. (ou o flow) decidir explicitamente usá-las. No bot actual, não há nenhum nó que esteja a injectar essa variável na conversa depois do handoff.

Portanto, a preocupação "a KB vai responder em vez do agente humano" **não é um problema real no seu bot hoje**. A KB já está em modo passivo.

### O que é um problema real

O problema real é outro: quando o fluxo chega a `Apoio_Humano_PT` ou `Human_Support_EN`, a última acção executa `conversation.handoff = true`. Esta é a convenção do Botpress para sinalizar "preciso de humano". O bot pede o ficheiro, marca a flag, e... termina.

Olhei todo o bot.json à procura de quem LÊ essa flag. **Ninguém a lê.** Não há hook, não há integração, não há dashboard conectado. Resultado: o utilizador fica à espera, e o Sr. nem fica a saber que alguém precisa de resposta.

Para um agente humano real responder dentro do webchat, tecnicamente existem três caminhos — com custos e complexidades diferentes.

### Caminho A — Handoff assíncrono por email/WhatsApp (zero custo, hoje)

Onde vive: no Free, com o bot actual.

Como funciona:
1. No nó `Apoio_Humano_PT` (e no `Human_Support_EN`), antes do upload do ficheiro, capturar o email ou telefone do utilizador
2. Adicionar uma acção a seguir ao `conversation.handoff = true`: enviar email para o Sr. (`josemmoreira1@gmail.com`) com o transcript da conversa + email/telefone do utilizador, ou disparar webhook para a sua conta WhatsApp Business
3. O bot diz ao utilizador: *"Recebi o seu pedido. Vou reencaminhar para a equipa humana. Será contactado dentro de X horas por email ou telefone."*
4. O Sr. responde directamente por email ou WhatsApp, fora do webchat

Vantagens: zero custo adicional, implementação simples, mantém controlo total.
Limitações: não é conversa em tempo real dentro do webchat. O utilizador sai do chat e fala consigo por outro canal.

### Caminho B — HITL nativo no Botpress (plano Plus $89/mês)

Onde vive: requer subir do Free para Plus.

Como funciona:
1. Subscrever Plus ($89/mês — 5.000 mensagens/mês, 2 bots, 1GB vector)
2. Instalar a integração **HITL (oficial Botpress)** no workspace
3. Adicionar o HITL Plugin ao bot
4. No nó `Apoio_Humano_PT`, em vez de `conversation.handoff = true`, invocar a acção HITL (abre ticket)
5. O Sr. entra no Botpress Desk (dashboard), vê a conversa em tempo real, assume o ticket, e responde directamente no webchat como se fosse o bot

Vantagens: resolve exactamente a sua pergunta — agente humano responde visivelmente no chat, KB fica silenciosa durante handoff.
Limitações: $89/mês recorrente. Faz sentido quando o volume justificar (por exemplo, >50 conversas/mês que requerem handoff, ou quando tiver 2-3 clientes pagantes).

Citação da doc oficial (limitação do plano):

> *"This feature requires a Botpress Plus plan or higher."*

### Caminho C — Integração Zendesk

Só faz sentido se o Sr. (ou o cliente final) já for cliente Zendesk. Não é o caso. Ignore.

### Recomendação pragmática

**Comece pelo Caminho A.** Resolve o problema real (ninguém sabe que há pedido humano) sem custo adicional, usa infra que o Sr. já tem (email + telefone). Para 90% dos pedidos, um utilizador que escreve "preciso de ajuda humana" está a pedir um contacto — não uma conversa síncrona no webchat. Email ou WhatsApp resolve, provavelmente melhor que o webchat.

**Migre para o Caminho B quando:**
- Tiver 2 ou 3 clientes PME pagantes a operar com o bot
- O volume de pedidos de apoio humano ultrapassar ~30 a 50 por mês
- Algum dos clientes pedir especificamente chat em tempo real no site

Fique com isto em mente: `answerManually: true` continua a proteger o chat da KB no Caminho A e no Caminho B. Essa parte já está resolvida. O que estamos a resolver agora é o canal para o humano entrar.

### Nota adicional — os dois hooks presentes no bot (`track_iterations` e `inject_learnings`)

Não têm nada a ver com handoff ou KB. Fazem parte do sistema interno `agi/improvement` do Botpress — são mecanismos de aprendizagem contínua: `track_iterations` grava dados de execução do LLMz, `inject_learnings` injecta aprendizagens passadas no prompt. Não interferem em nada na questão do agente humano. Ignore-os nesta decisão.

---

## Pontos urgentes detectados no `.bpz`

Enquanto revia o `.bpz` para responder às suas 5 questões, notei dois pontos que não fazem parte das perguntas mas que vale a pena partilhar — qualquer dev responsável sinaliza ao entregar uma auditoria.

### 1. Personal Access Token do Airtable exposto no `.bpz`

O token Airtable que liga o bot à sua base aparece em texto claro dentro do `bot.json` (linha 15):

```
"AIRTABLE_PAT": "patQLv7Sp4JRQ55fv.fe674..."
```

Significa que qualquer pessoa que receba o `.bpz` (incluindo eu, neste momento) tem acesso completo à sua base Airtable. Recomendo:

1. Entrar em [airtable.com/create/tokens](https://airtable.com/create/tokens) e **revogar o token actual** (`patQLv7Sp4JRQ55fv...`)
2. Gerar novo PAT com os mesmos scopes (provavelmente `data.records:read`, `data.records:write`, `schema.bases:read`)
3. Substituir no Botpress: Studio → bot settings → Variables → `AIRTABLE_PAT`
4. Testar uma submissão de formulário no bot para confirmar que continua a gravar no Airtable

Tempo: 5 minutos. Custo: zero. Antes de partilhar o `.bpz` com mais alguém, fazer este passo.

### 2. Variáveis de nome do cliente inconsistentes

No bot existem três variáveis com nomes parecidos:

- `workflowclientName` (linha 430)
- `clientName` (linha 444)
- `ClientName` (linha 479)

Os nós de saída da mensagem de sucesso usam `{{workflow.ClientName}}` (PascalCase). Se algum nó do flow gravar em `clientName` (camelCase) e outro ler de `ClientName`, o nome chega vazio ao Airtable e ao utilizador.

Recomendação: padronizar para uma só variável (`ClientName`, que é a usada nos templates de output) e remover as duplicadas. Tempo: 10-15 minutos, em ambiente de teste primeiro para garantir que nenhuma referência fica órfã.

---

## Próximos passos concretos — 5 acções, uma por questão

Sugiro esta ordem de execução:

1. **(Q1) Diagnóstico do upload em modo normal.** Antes de assumir bug do Botpress: hard reload (`Ctrl+Shift+R`) → limpar cache → testar noutro browser sem extensões. 90% das vezes resolve. Se não, abrimos ticket.

2. **(Q2) Adicionar Choice antes do capture File** nos nós `Apoio_Humano_PT` e `Human_Support_EN`. Tempo: 20-30 min. Em alternativa mínima: activar `handleFailure: true` no capture File.

3. **(Q3) Adoptar Modelo A para clientes novos** — cada cliente cria conta Botpress gratuita própria, o Sr. entra como Manager ou Developer. Antes do 2º cliente, fazer o refactor de 30-60 placeholders para variáveis Botpress (4-8h uma vez só → 1-2h por cliente novo daí em diante).

4. **(Q4) Hierarquia de roles + backup regular.** Qualquer pessoa que aceda ao bot do Sr. entra como Viewer; só promove a Developer/Manager temporariamente quando há tarefa concreta. Exportar `.bpz` mensalmente como backup local.

5. **(Q5) Implementar Caminho A para handoff humano.** Reutilizar o email já capturado em `{{workflow.ClientEmail}}` (fase RGPD) e enviar notificação para `josemmoreira1@gmail.com` com transcript + contacto do utilizador. Resolve o problema sem custo, sem fricção adicional para quem pede ajuda. Caminho B (HITL Plus $89/mês) entra quando volume justificar.

Aos quais acresce o ponto urgente do PAT Airtable acima — esse é prioritário, faça-o antes de tudo o resto.

---

## Disponibilidade

Fico ao seu dispor para acompanhar a implementação destes pontos no ritmo que preferir. Se quiser revisitar alguma das respostas, pedir esclarecimento, ou apoio na configuração concreta dos nós no Studio, basta dizer — respondo por aqui ou marcamos uma chamada quando for útil para si.

---

Um abraço,
Eurico

[IA]AVANÇADA PT
