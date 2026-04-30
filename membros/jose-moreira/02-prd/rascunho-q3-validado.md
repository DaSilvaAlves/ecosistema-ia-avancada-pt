# Rascunho Q3 validado — REPLICAÇÃO

> **Estado:** Aprovado pelo Eurico em 21/04/2026 (sessão ux-design-expert).
> Fonte técnica: bot.json (config variables, placeholders) + botpress.com/pricing (Abril 2026).
> Este ficheiro é o texto pronto a incluir na resposta final ao Moreira.
> Não sobrescrever sem nova aprovação.

---

## Q3. REPLICAÇÃO — é viável usar este esqueleto para várias empresas na versão gratuita?

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
2. **O crédito de 5 USD de IA é o mesmo em todos os planos.** Cada conversa com a base de conhecimento consome tokens (o seu bot usa gpt-4-turbo). Uma conversa média pode custar entre 5 e 15 cêntimos americanos. 5 USD chegam para 30 a 100 conversas por mês, depois entra AI Spend pago. Isto aplica-se quer esteja em Free, Plus ou Team

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
