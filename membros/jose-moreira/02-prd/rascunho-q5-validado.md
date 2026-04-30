# Q5 — AGENTE HUMANO VS BASEKNOWLEDGE (VALIDADA)

> **Estado:** APROVADA pelo Eurico em 22/04/2026
> **Validação independente de v2:** sim — v2 só consultada no fim para comparar
> **Evidência dura:** bot.json + 3 WebFetch ao doc oficial Botpress

---

## Frase exacta do Moreira (briefing)

> "AGENTE HUMANO VS BASEKNOWLEDGE: No nó 'Apoio_Humano_PT', como posso garantir que a conversa de um agente humano se torne visível no chatbot, em vez de ser um texto retirado da base de conhecimento (Baseknowledge)?"

---

## Q5. AGENTE HUMANO VS BASEKNOWLEDGE — o que realmente está a acontecer

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

Vantagens: resolve exactamente a pergunta do Sr. — agente humano responde visivelmente no chat, KB fica silenciosa durante handoff.
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

## Factos-chave confirmados (evidência)

| Facto | Certeza | Fonte |
|-------|---------|-------|
| `KnowledgeAgent.answerManually: true` — KB NÃO responde automaticamente | 100% | bot.json linha 5366 + doc Botpress: *"your bot won't automatically provide answers in the conversation"* |
| Respostas da KB ficam em `{{turn.KnowledgeAgent.answer}}` — só aparecem se o flow decidir usar | 100% | Doc Botpress oficial (Knowledge Agent) |
| `conversation.handoff = true` escrito em 2 acções (nós `Apoio_Humano_PT` + `Human_Support_EN`) | 100% | bot.json linhas 4690, 4904 |
| No flow actual, nenhuma acção/hook LÊ `conversation.handoff` — flag é inerte | 100% | bot.json inteiro procurado |
| Hooks `track_iterations` (after_llmz) e `inject_learnings` (before_llmz) são do sistema `agi/improvement` — NÃO tocam handoff nem KB | 100% | bot.json linhas 5308-5345 |
| Human Handoff nativo requer plano Plus ($89/mês) ou superior | 100% | Doc Botpress: *"This feature requires a Botpress Plus plan or higher"* |
| HITL requer integração HITL (nativa) OU Zendesk — Slack NÃO é HITL oficial | 100% | Doc Botpress HITL Agent |
| HITL Agent antigo (v1) está deprecated — novos bots usam HITL Plugin | 100% | Doc Botpress HITL Agent: *"deprecated and is no longer available to new accounts"* |
| Bot do Moreira NÃO tem HITL instalado nem canal humano conectado | 100% | bot.json (sem integração hitl) |

---

## Erros v2 identificados (3)

1. **V2 propõe hook `before_llmz_execution` para bypassar a KB durante handoff** — desnecessário. `answerManually: true` já controla a KB. V2 não percebeu que a KB já estava em modo passivo
2. **V2 recomenda Opção B (hook) + email fallback como Fase 1** — inverte a prioridade. O email é a solução principal (Caminho A), não fallback. O hook é irrelevante se a KB já está manual
3. **V2 apresenta 4 opções (Inbox, hook, Slack/WhatsApp, nó "Aguardar") sem distinguir que Slack/WhatsApp NÃO é HITL nativo** — confunde "notificação externa ao Moreira" com "handoff real no webchat". São coisas diferentes

---

## Regras aplicadas

- ✅ Uma questão de cada vez, validada com evidência dura
- ✅ Só comparar com v2 no fim (aplicado)
- ✅ `feedback_moreira_no_hallucinations` — zero invenção, tudo com linha do bot.json ou citação doc oficial
- ✅ PT-PT formal-cordial ("o Sr.", "o Sr. Moreira")
- ✅ Sem termos proibidos ("curso", "fácil", "automático", "revolucionário", "garantido")
- ✅ Reconhecimento honesto de que o pressuposto da pergunta do Moreira tinha um erro — explicado sem condescendência
