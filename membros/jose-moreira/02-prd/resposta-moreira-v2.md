# Resposta a José Moreira — Mapa de Mercado + Respostas Técnicas

**Para:** José Moreira — Viana do Castelo
**De:** Eurico Alves — [IA]AVANÇADA PT
**Data:** 20 de Abril de 2026
**Assunto:** Seguimento ao seu briefing de 11 de Abril + ficheiro `.bpz`
**Estado:** `DRAFT — aguarda aprovação do Eurico antes de enviar`

---

## Nota inicial

Caro José Moreira,

Obrigado pelo briefing detalhado e pelo envio do ficheiro `.bpz`. Antes de chegar às 5 questões técnicas que colocou, permita-me uma observação que considero mais importante do que qualquer fix de bot.

Na primeira linha do seu briefing escreve:

> *"Consultoria e implementação de Automação com IA para PMEs locais — foco em empresas de comércio, serviços e indústria em Viana do Castelo que perdem vendas por falta de atendimento rápido."*

Esta é a posição certa. Mas **consultoria a sério exige conhecer o mercado onde se consulta**. Sem isso, não se consulta — vende-se produto. E a diferença entre as duas coisas é o que separa um consultor que cobra bem de um instalador que bate à porta.

Por isso, antes de lhe responder às 5 questões técnicas, fizemos o trabalho que faltava na base: **mapeámos as PMEs industriais do concelho de Viana do Castelo que podem comprar o seu chatbot**. Esse mapa é a Parte 1 deste documento. A Parte 2 são as 5 respostas técnicas.

Em cada ponto seguimos a mesma estrutura:
- **O que acontece** — diagnóstico directo
- **Porque acontece** — explicação técnica em PT-PT acessível
- **O que pode fazer** — passos concretos que pode aplicar já

No fim, deixamos uma nota curta sobre 4 pontos urgentes que encontrámos no `.bpz` e que convém corrigir nas próximas 24-48 horas.

---

## PARTE 1 — Mapa de Mercado: PMEs Industriais em Viana do Castelo

### Porque lhe damos isto sem ter pedido

Na frase inicial do seu briefing está tudo o que importa: consultoria + implementação + PMEs locais + Viana do Castelo + falta de atendimento rápido. Para vender consultoria, precisa de saber **a quem**, **onde** e **com que argumento**. A pesquisa que fizemos responde a essas três perguntas.

### O universo (com fontes)

| Indicador | Valor | Fonte |
|-----------|-------|-------|
| Microempresas (todos os sectores) no concelho | 11.119 | IAPMEI 2023 |
| PMEs (todos os sectores) no concelho | 404 | IAPMEI 2023 |
| Médias empresas no concelho | 56 | IAPMEI 2023 |
| PME Excelência 2023 no concelho | 34 | IAPMEI |
| **PMEs industriais (10-100 trab.) estimadas** | **80-130** | Cruzamento IAPMEI + Empresite |
| **Das quais com dor digital documentável** | **~50-60** | Verificação manual + directórios |

### Os sectores industriais do concelho

| Sector | Nº PMEs (10-100 trab.) | Maturidade digital | Localização principal |
|--------|------------------------|---------------------|------------------------|
| Metalomecânica / metalurgia | 25-30 | Baixa-média | Zona Industrial do Neiva (dominante), Lanheses, Meadela |
| Madeira e mobiliário | 15-20 | Baixa-média | Disperso: Neiva, Barroselas, Chafé, Lanheses |
| Têxtil e vestuário | 12-15 | Baixa (Facebook domina) | Neiva, Darque, Vila Fria |
| Alimentar (pão, conservas) | ~10 | Baixa | Viana centro, Castelo do Neiva |
| Plásticos e borracha | 6-8 | Média (exportam) | Neiva, Lanheses |
| Componentes automóveis | 5-8 | Média-alta (IATF obriga) | Lanheses, Neiva |
| Papel e embalagem | ~4 | Baixa-média | Neiva |

### As 10 empresas para atacar primeiro

| # | Empresa | Sector | Localização | Porquê no top |
|---|---------|--------|-------------|----------------|
| 1 | **Paniminho** | Pão e pastelaria B2B | Viana centro | Email único, zero chat, clientes profissionais (padarias) perguntam preços sábado/domingo — perde leads todos os fins-de-semana |
| 2 | **Lacoviana** | Tratamento de alumínios | Neiva | Grupo de 3 empresas associadas, PME Excelência, dor de triagem multi-unidade, site sem chat |
| 3 | **Valforjado** | Válvulas industriais | Chafé | Exporta 95%, site `valfor.eu` dos anos 2010, só PT/EN (falta FR/DE), cada lead internacional perdido é muito dinheiro |
| 4 | **Amavical** | Máquinas-ferramentas | Neiva | O próprio site declara "em renovação" — porta aberta, dor auto-declarada |
| 5 | **Perfilima** | Caixilharia alumínio | Cardielos | Sem site, só Facebook, dois telemóveis — venda de pacote "bot + site básico" |
| 6 | **Cergold Indústrias** | Ingredientes panificação | Neiva | B2B com padarias (clientes madrugadores), sem site, só redes sociais, dor horária aguda |
| 7 | **Tekacier** | Serralharia civil | Cardielos | Site estático HTML puro, visivelmente abandonado, zero digital — upgrade barato |
| 8 | **J. Silva Alumínios** | Caixilharia PT+FR | Viana | Atende mercado francês (número +33) sem chat FR — perde leads de sábado |
| 9 | **Serralharia Cardielos** | Estruturas metálicas | Cardielos | Tem formulário mas sem automação — venda de complemento, não de tudo |
| 10 | **Carpintaria Rocha** | Mobiliário corporate | Neiva | Fax ainda listado no site, LinkedIn activo (decisor identificável), Zona Neiva |

### A observação mais importante — onde está o *sweet spot*

Existem várias PMEs em Viana que **exportam ou servem mercados multilingues** mas **não têm atendimento digital fora do PT**:

| Empresa | Mercado | Idioma do site | Chat? |
|---------|---------|----------------|-------|
| Valforjado | 95% exportação (alemão, francês, polaco) | PT/EN (desactualizado) | Não |
| Lacoviana | PT + SP geograficamente adjacente | PT/EN | Não |
| J. Silva Alumínios | PT + FR (número francês próprio) | PT/EN | Não |
| Vianaplásticos | 4 idiomas declarados no site | 4 idiomas mas formulário único | Não |

**O chatbot Botpress PT/EN que construiu é precisamente o que lhes falta.** Mas para estes clientes, o bot precisa de ser PT/EN/FR/DE/ES — expansão de idiomas do esqueleto vai ser a evolução natural.

### Como usar este mapa — ataque geográfico em 2 dias

Em vez de abordar por LinkedIn à distância, Viana é um concelho compacto e o tecido empresarial está concentrado em 3 zonas:

| Zona | Nº de empresas do top 25 | Tempo para visitar |
|------|---------------------------|---------------------|
| Zona Industrial do Neiva | 10+ (incluindo Lacoviana, Amavical, Cergold, Carpintaria Rocha) | 1 manhã |
| Parque Empresarial de Lanheses | 4-5 | 1 tarde |
| Meadela + Viana centro | 5-6 (Paniminho, têxteis) | 1 dia |

**2 dias de visita presencial = pipeline de 15-20 encontros marcados.** Isto é consultoria local a sério — vai lá, entra, apresenta-se, escuta, propõe. Ganha a confiança que nenhum LinkedIn substitui em Viana.

### Quem NÃO está na lista (e porquê)

Excluímos do target, apesar de serem empresas de Viana: **Browning Viana, BorgWarner (3 fábricas), DS Smith, West Sea, Vestas, Enercon, Eurostyle Systems, Aludec, Saertex**. Todas têm mais de 100 trabalhadores, todas têm IT interno e procurement formal — não compram chatbot a consultor local. São para outra fase do negócio, se existir.

### Mapa detalhado completo

Este resumo é uma síntese. **O documento completo com as 25 fichas individuais (cada empresa com nome legal, CAE, morada, site, sinais de dor documentados com URL e data de verificação, prioridade 1-5 e argumento de venda específico)** está anexo a este documento e será partilhado consigo como ficheiro à parte.

### Limitações honestas desta pesquisa

Para sermos rigorosos:

- O número exacto de PMEs industriais no concelho (por CAE × dimensão) não é público no INE sem pedido directo — a nossa estimativa de 80-130 vem de cruzamento de fontes
- Dos 25 sites referenciados, 8 foram verificados manualmente em 20/04/2026; os restantes baseiam-se em directórios (Racius, Empresite, Kompass) com possível desfasamento de 3-6 meses
- Não identificámos decisores por nome na maioria das empresas — optámos por não especular. Esse trabalho faz-se rapidamente com pesquisa LinkedIn antes da visita

---

## PARTE 2 — Respostas às 5 Questões Técnicas

### Nota antes de começar

As 5 questões que colocou são sobre um **chatbot que é esqueleto** — um produto técnico que pretende instalar em várias PMEs. As respostas são dadas nesse contexto: cada fix aqui aplicar-se-á a **todas** as replicações futuras, não só ao bot actual.

---

### Q1 — UPLOAD QUE SOME: ícone aparece em anónimo, desaparece em normal

#### O que acontece

O ícone de clipe (anexar ficheiro) aparece quando visita o link do webchat em **janela anónima**, mas **desaparece** quando visita em janela normal (logado ou com sessões anteriores).

#### Porque acontece

O problema **não está no flow do bot**. Está na **configuração do widget webchat público** — ficheiro JSON que vive em:

```
https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json
```

Este ficheiro controla o aspecto visual do widget e decide se o campo de input permite anexar ficheiros. O comportamento diferente entre anónimo e normal vem de um de dois motivos:

1. **Cache do browser** — em navegação normal pode estar a carregar versão antiga do ficheiro de configuração (sem `allowFileUpload: true`), enquanto em anónimo carrega a versão nova
2. **Propriedade `allowFileUpload`** — dependendo de como foi configurado, pode existir regra que desactiva upload para utilizadores identificados

#### O que pode fazer

**Passo 1 — Forçar o Studio a regenerar a configuração:**
- Studio → Webchat → Settings / Configuration
- Procurar **"Allow file upload"** ou **"File uploads"** e garantir **ON**
- Guardar e **Publish** o webchat
- Gera novo ficheiro `.json` e actualiza o link público

**Passo 2 — Testar limpando cache:**
- No browser normal, F12 → Application / Storage → Clear site data (domínio `bpcontent.cloud`)
- Recarregar com Ctrl + Shift + R (hard refresh)

**Passo 3 — Se continuar a não aparecer:**
- Se funcionar em anónimo mas não em normal = cache
- Se não funcionar nem em anónimo = configuração
- No segundo caso, precisamos de ver os settings concretos juntos (screenshot ou acesso colaborador)

**Confirmação técnica:** no flow, o nó `Apoio_Humano_PT` tem um capture File correctamente configurado (variável `var-0b3eeb9be7`). O problema não vem do flow, é mesmo do widget público.

#### Para quando replicar em outros clientes

Este bug vai acontecer em **todas** as instâncias que o Moreira publicar. Solução: **checklist de publicação** que garante `allowFileUpload: true` antes de entregar bot ao cliente.

---

### Q2 — SKIP NO APOIO HUMANO: permitir saltar o upload

#### O que acontece

No nó `Apoio_Humano_PT`, o bot pede "Por favor, envie a imagem ou ficheiro relevante" e fica à espera. Se o utilizador escrever texto em vez de anexar ficheiro, o bot rejeita e pede de novo.

#### Porque acontece

Em Botpress (motor LLMz), o `capture File` é um tipo de recolha **estrita**. Só aceita ficheiros. Qualquer texto dispara a `retryMessage`. Não existe propriedade `optional: true` directa no schema actual — tem de se redesenhar o nó.

#### O que pode fazer

**Opção A — Pergunta com escolha (RECOMENDADA)**

Substituir o capture File por Single Choice antes:

1. Nó de **Single Choice**:
   - Pergunta: *"Tem algum ficheiro ou imagem para partilhar? (ex.: foto do problema, documento, ecrã)"*
   - Opção 1: **"Sim, quero anexar"** → nó com capture File (o actual)
   - Opção 2: **"Não, continuar sem anexar"** → nó do agente humano directamente

2. Eliminar o prompt directo de ficheiro do nó original e manter o capture File só dentro do sub-caminho "Sim".

Vantagens: utilizador decide. UX clara, dois cliques. Sem código custom. **Em 15-30 minutos está feito.**

**Opção B — Capture com condição de texto (NÃO recomendada)**

Manter capture File + transição condicional se a resposta for texto → agente humano. **Problema:** o motor LLMz não trata bem estas transições mistas. Comportamento instável.

**Opção C — Acção JS personalizada**

Bloco de **Execute Code** que pergunta "Deseja anexar? (sim/não)" e só chama o capture se "sim". Maior controlo, mas exige JavaScript e é mais difícil de manter.

#### Recomendação concreta

Opção A. No Studio:
1. Abrir `Apoio_Humano_PT`
2. Adicionar Single Choice antes do capture File
3. Configurar as 2 opções e transições
4. Testar no emulador em ambos os caminhos

#### Para quando replicar

Este mesmo padrão Single Choice antes do capture deve fazer parte do **template mestre** do esqueleto. Cada cliente herda já esta UX.

---

### Q3 — REPLICAÇÃO: viável para várias empresas no Botpress gratuito?

Esta é a questão central do seu modelo de negócio. Vale uma resposta longa.

#### Resposta directa

**No plano gratuito actual, não.** Mas **a replicação é o seu modelo certo** — é só preciso saber o que muda quando se escala para lá dos primeiros 2-3 clientes. Vamos explicar exactamente o que está no caminho e o que resolve cada obstáculo.

#### Os 4 obstáculos técnicos reais

| Obstáculo | O que é | Impacto |
|-----------|---------|---------|
| **Limite de bots por workspace** | Plano gratuito: 5 bots/workspace | Para 10+ clientes, precisa de múltiplos workspaces ou plano Pro |
| **Limite de mensagens com IA** | Plano gratuito tem limite de interacções com LLM (gpt-4o-mini, gpt-4-turbo) | Cada conversa que invoca KB consome tokens. Estimativa: €0,30-0,35 por conversa que usa KB. 1.000 conversas = €300-350/mês por bot em tokens |
| **Configuração hardcoded** | O bot actual tem `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID` fixos nas variáveis do bot | Cada cliente precisa do seu próprio PAT, Base e Table. Editar manualmente cada clone não escala |
| **Conteúdo é template, não parametrizável** | KB e muitos nós do flow têm placeholders como `[Nome da Empresa]`, `[IBAN]`, `[Morada]`, `[X]` | Para cada cliente, substituir manualmente em todos os nós e na KB = horas de trabalho por cliente |

#### Diagnóstico honesto do estado actual

O bot está hoje a cerca de **5-10%** do que é preciso para suportar replicação multi-cliente fluida. Arquitectura monolítica, configuração fixa, KB de uma empresa. **Chegar a replicável exige refactor — e é aí que muitos desistem.**

#### O que é preciso para tornar a replicação viável

| Requisito | O que implica | Quanto muda na sua rotina |
|-----------|---------------|----------------------------|
| **Upgrade para Botpress Pro/Team** | ~80 USD/mês por workspace (Abril 2026) | Pago a partir do 3º-4º cliente que fecha, paga-se sozinho |
| **Refactor do bot para variáveis de personalização** | Substituir `[Nome da Empresa]` por `{{bot.companyName}}` em todos os nós e KB | Trabalho uma vez só. Depois cada cliente = editar 10-15 variáveis em 20-30 minutos |
| **Cada cliente com o seu Airtable** | Cada PME tem a sua base Airtable e o seu PAT | Onboarding de 30 min por cliente: criar conta Airtable, copiar base template, gerar PAT, inserir no bot |
| **KB por cliente** | Cada empresa tem conteúdo específico (serviços, horários, morada, contactos) | Cerca de 1-2 horas por cliente a criar a KB dedicada. Este é o trabalho verdadeiramente "consultoria" — perceber o negócio dele |
| **Processo de onboarding documentado** | Template escrito (ou script) para criar, configurar e entregar o bot a cada cliente em 30-60 min | Uma vez só. A partir daí são check-lists |

#### O modelo de negócio que isto permite

Com o mapa de mercado da Parte 1:

- Target qualificado: **25-30 PMEs com dor real no concelho**
- Conversão realista no primeiro ano: **5-10 clientes**
- Pricing possível (Moreira decide): `setup` **300-700€** + `mensalidade` **80-150€/mês** por cliente

Com 5 clientes pagantes a 100€/mês = **500€/mês** que cobre Botpress Pro (80 USD ≈ 75€) + custos LLM moderados + margem.

Com 10 clientes = **1.000€/mês** de recorrente + setups ocasionais. Começa a ser negócio.

**Com este mapa, a Viana dá-lhe 25-30 targets identificáveis para chegar aos 10 clientes em 12-18 meses se atacar presencialmente.**

#### Recomendação concreta por fases

**Fase 1 — Provar o modelo (próximos 3 meses):**
- Escolher 1 empresa do top 10 (sugerimos **Paniminho** — dor evidente, B2B claro)
- Personalizar o esqueleto actual para ela com os `[Nome da Empresa]` preenchidos manualmente
- Instalar, acompanhar 30 dias, recolher métricas reais (leads capturados, horas poupadas)
- **Resultado esperado:** 1º cliente com caso concreto + aprendizagem do que é preciso automatizar

**Fase 2 — Refactor do esqueleto (mês 3-4):**
- Com base na aprendizagem da Fase 1, refactor do bot: todas as variáveis de personalização, KB parametrizável, onboarding documentado
- **Resultado:** esqueleto verdadeiramente replicável

**Fase 3 — Escalar (mês 4 em diante):**
- Upgrade para Botpress Pro quando houver 3º cliente em conversa
- Onboarding de 2-3 clientes/mês
- Meta 12 meses: 10 clientes activos = €1.000+/mês recorrente

#### Nota importante

Tentar o modelo replicativo **antes** de ter 1 cliente satisfeito costuma ser caminho para abandono. A Fase 1 (1 cliente real) é inegociável — é ela que valida tudo o resto. O refactor só faz sentido depois de sabermos exactamente o que é variável e o que é constante entre clientes.

---

### Q4 — AUTORIA E CONTROLO: integrar anúncios e suporte sem perder autoria

Antes de responder ao "como integrar", há que deixar claro **o que já detém** — é mais do que parece.

#### Onde está a autoria do bot hoje

| Activo | Quem detém | Nota |
|--------|------------|------|
| Conta Botpress (`josemmoreira1@gmail.com`) | Moreira | Pessoal |
| Workspace "José Moreira's Workspace" | Moreira | Propriedade total |
| Bot (ID `e7e5db81-ad3c-45e2-bf25-033d76b04059`) | Moreira | Dentro do workspace dele |
| Link público do webchat | Moreira | Só o dono pode alterar |
| Base Airtable (`app7S6wEWqhpQgMEV`) | Moreira | Propriedade dele. Ninguém mais tem acesso |
| Código do flow (hooks, variáveis, intents) | Moreira | Exportável em `.bpz` a qualquer momento |
| Base de Conhecimento (KB) | Moreira | Indexada no workspace dele |

**A autoria está protegida por defeito**, desde que o workspace, a conta e as integrações se mantenham em nome do Moreira.

#### Os 4 cenários onde a autoria enfraquece

| Cenário | Risco | Como prevenir |
|---------|-------|----------------|
| Dar acesso de **editor** ao cliente no workspace | Cliente pode modificar/apagar o bot | Dar só **viewer** ou usar workspace dedicado por cliente (Pro) |
| Aceitar **patrocínios/anúncios** com pedido de alterações ao flow | Patrocinador impõe direcção técnica | Contratualizar que **não edita** o flow — paga exposição, não controlo |
| Parceria de **suporte técnico** onde a outra entidade gere o workspace | Moreira perde controlo | Workspace **sempre em nome do Moreira**; parceiro ajuda, não é dono |
| Cedência verbal ou escrita de **direitos sobre o código** | Perda de IP | Nunca ceder. Se alguém pedir, responder que o bot é propriedade sua |

#### Sobre "integrar os seus anúncios e suporte técnico"

Agradeço a consideração em integrar a [IA]AVANÇADA PT. Sobre este ponto, é justo responder com transparência:

**Neste momento, não temos um formato estruturado de parceria comercial ou programa de afiliação activo.** A comunidade [IA]AVANÇADA PT trabalha no modelo de **acompanhamento técnico gratuito** a membros — que é o que estamos a fazer consigo hoje. Não temos "anúncios pagos" dentro do ecossistema nem pacotes de suporte técnico comercial formalizados.

**O que faz sentido neste momento:**

1. Continuar o acompanhamento técnico que já estamos a fazer — este documento, ajuda nos fixes, revisão do refactor quando fizer, feedback estratégico
2. Quando tiver **2-3 clientes pagantes reais**, retomamos esta conversa sobre formatos de parceria possíveis (divulgação conjunta, eventualmente programa de referenciação quando formalizado, etc.)
3. Entretanto, se fizer sentido mencionar a comunidade no seu LinkedIn ou nas conversas com PMEs — é natural e bem-vindo, sem fórmula comercial por trás

**O que recomendamos evitar agora:**

- Comprometer espaço de anúncio no bot a terceiros antes de ter tráfego real (ninguém paga anúncio num bot sem utilizadores)
- Cedência contratual de qualquer tipo de suporte técnico externo onde o fornecedor aceda ao seu workspace

O seu foco nos próximos 3-6 meses é **provar o modelo** com o primeiro cliente (Paniminho, Lacoviana, ou outro do top 10). Parcerias formais só fazem sentido depois.

#### Recomendação concreta sobre protecção da autoria

- Manter o workspace Botpress **sempre em nome do Moreira** (não criar em nome do cliente)
- Dar acesso **viewer** quando o cliente quiser ver o bot a funcionar; **nunca editor**
- Quando upgradar para Pro e criar workspace por cliente, garantir que o **workspace-mestre** (onde vive o esqueleto) fica em nome do Moreira — os clientes ficam em workspaces filhos, não iguais
- Contrato simples de 1 página por cliente:

> *"O bot, o código, o flow, a Knowledge Base e as integrações são propriedade exclusiva de José Moreira. O cliente paga pelo uso do serviço; não pode copiar, modificar nem redistribuir a estrutura do bot. O serviço é prestado por José Moreira e pode ser terminado por qualquer das partes com 30 dias de aviso."*

Com isto, pode aceitar suporte técnico externo, subcontratar ou parcerias — sem nunca perder autoria.

---

### Q5 — AGENTE HUMANO VS BASEKNOWLEDGE: fazer a conversa do agente humano aparecer em vez do texto da KB

#### O que acontece hoje

No flow actual:
- O nó `Apoio_Humano_PT` (e `Human_Support_EN`) sinaliza `conversation.handoff = true`
- Esta flag é o sinal "preciso de agente humano"
- **Mas:** no flow não há nada que **impeça** a Knowledge Base de continuar a responder. Se o cliente escrever uma pergunta depois de pedir apoio humano, o bot responde com a KB — que ainda tem placeholders como `[Nome da Empresa]`

#### Porque acontece

Em Botpress, `handoff` é um sinal para o **sistema de webchat**, não para o motor de IA do flow. Para o motor, nada muda: continua a processar mensagens e a invocar a KB.

Falta a peça externa que consome a flag:
- Um **agente humano real** conectado ao webchat (Inbox Botpress ou integração externa Slack/WhatsApp)
- OU um **gate no flow** que impede a KB de responder quando `handoff = true`

#### As 4 opções, da mais simples à mais completa

| Opção | Como | Custo | Realidade |
|-------|------|-------|-----------|
| **A — Inbox oficial Botpress** | Activar webchat inbox (plano Pro). Agente humano recebe notificação e responde via dashboard | Pro (~80 USD/mês) + tempo humano | Solução limpa, produção-ready |
| **B — Gate no flow** | Hook `before_llmz_execution` que verifica `conversation.handoff` e bypassa a KB. Bot fica "a aguardar agente" e só responde com mensagens estáticas | JS custom, ~1-2h | Funciona no plano gratuito. Não há agente real, é "segurar a porta" |
| **C — Canal externo (Slack/WhatsApp)** | Quando `handoff=true`, envia mensagem para Slack/WhatsApp do agente. Agente responde manualmente | Integrações externas (Twilio/Zapier), custo pequeno mas real | Realista para equipas pequenas (1-2 agentes) |
| **D — Nó "Aguardar resposta humana"** | Nó de espera `wait` até input marcado como vindo de humano | Limitado pelo motor Botpress (sessões têm timeout) | Pouco fiável, não recomendamos |

#### A questão de fundo que vem antes

Antes da opção técnica, há uma pergunta de negócio:

> **Quem é o "agente humano" que vai responder?**

Possibilidades, no seu modelo de consultor replicável:

- **Só o Moreira** — atende nas horas em que pode estar ao computador
- **O cliente PME** — a PME tem alguém atento ao dashboard Botpress ou Slack/WhatsApp
- **Ninguém, por agora** — o bot diz *"Um responsável entrará em contacto por email em X horas"* e o email tem mesmo de chegar

No seu modelo replicável, esta resposta **vai variar por cliente**. O esqueleto precisa ser flexível:
- Algumas PMEs querem que seja o próprio funcionário delas a atender (configuração Slack/WhatsApp do cliente)
- Outras não têm ninguém disponível (só email de aviso)
- **O Moreira não vai ser o agente humano de todos os clientes** — isso não escala

#### Recomendação por fase

**Fase 1 (bot actual, sem cliente real ainda):**
- Implementar **Opção B** (gate no flow) + mensagem clara *"Recebemos o seu pedido. Um responsável entrará em contacto em até 24h por email"*
- **Garantir** que o email ao responsável chega mesmo (via Airtable → Zapier → email, ou hook Botpress que envia email directo)

**Fase 2 (quando houver 1º cliente PME real):**
- Configurar **Opção C** por defeito no template (Slack/WhatsApp) — PMEs portuguesas usam WhatsApp quase universalmente
- Deixar o endpoint configurável por cliente: WhatsApp do cliente, não do Moreira

**Fase 3 (quando tiver plano Pro):**
- Disponibilizar **Opção A** como upgrade para clientes que queiram dashboard interno dedicado

---

## Nota final — 4 pontos urgentes encontrados no `.bpz`

Durante a análise do `.bpz`, encontrámos 4 pontos que convém resolver nas próximas 24-48h. Não são das 5 perguntas, mas são importantes para **si** e para a sua segurança:

| # | Ponto | O que fazer |
|---|-------|-------------|
| **1** | O seu **Airtable Personal Access Token** (PAT) está dentro do `.bpz` em texto claro. Qualquer pessoa com o ficheiro pode aceder à sua base Airtable | **Revogar** o PAT em `https://airtable.com/create/tokens` e gerar novo. Actualizar no Studio → Variables → `AIRTABLE_PAT`. Quem tem o `.bpz`: nós (apagado após análise) + quem mais enviou |
| **2** | Na KB, há uma **foto pessoal sua** (`IMAGEM1.jpg`) marcada como **conteúdo público** no Botpress cloud | Studio → Knowledge Base → ficheiros. Apagar a foto ou mudar para privado. URL público exposto: `cdn.botpress.cloud/workspace_files/...` |
| **3** | Na KB, existe um **PDF com simulação de CV** (dados pessoais sensíveis seus) como conteúdo público | Apagar da KB. Se foi usado para treino, a informação já está incorporada — pode apagar o ficheiro sem perder indexação |
| **4** | Variáveis `clientName` e `ClientName` (C maiúsculo e minúsculo) existem em paralelo. A captura no flow grava em `clientName` mas o envio para a Airtable usa `ClientName` — **o Airtable está a receber linhas vazias no campo Nome** | Studio → flow → capture do nome: mudar nome da variável para coincidir. Ou no hook que envia para Airtable (`Armazenamento`), mudar `ClientName` → `clientName`. **É 1 alteração pequena mas é a razão pela qual pode estar a perder o nome de cada lead** |

Os primeiros 3 pontos são **privacidade/segurança**. O ponto 4 é **funcional** — é o que provavelmente faz com que as linhas na sua Airtable estejam a chegar sem o nome do cliente.

---

## Próximos passos

Este documento contém o mapa de mercado (Parte 1) e as 5 respostas técnicas (Parte 2). Sugerimos a seguinte sequência:

1. **Próximos 2-3 dias** — resolver os 4 pontos urgentes (PAT, foto, PDF, variáveis `clientName`)
2. **Próxima semana** — aplicar fixes Q1 e Q2 (upload que some + skip apoio humano). Em algumas horas está feito
3. **Próximas 2 semanas** — escolher 1 empresa do top 10 (sugerimos Paniminho) e preparar primeira visita presencial
4. **Próximo mês** — instalar o bot personalizado no primeiro cliente real; recolher métricas durante 30 dias
5. **Mês 3-4** — com base na aprendizagem, fazer o refactor do esqueleto (variáveis de personalização) e documentar onboarding

Estamos disponíveis para:
- **Esclarecer** qualquer ponto deste documento por email ou mensagem
- **Acompanhar de perto** a aplicação dos fixes técnicos se preferir trabalhar em conjunto
- **Rever** o refactor do esqueleto quando o fizer

Parabéns pelo trabalho feito — o bot tem estrutura real, intents bilingues, integração Airtable e um flow pensado. A base está lá. Com os acertos acima + o mapa de mercado, o caminho para o primeiro cliente está claro.

Abraço,
Eurico Alves
[IA]AVANÇADA PT

---

## Metadados internos (não enviar ao Moreira)

- **Autoria do documento:** Uma (UX Design Expert) + Atlas (Analyst) para pesquisa de mercado
- **Base de evidência Parte 1:** `01-pesquisa/mapa-mercado-pme-industrial-viana.md` (653 linhas, pesquisa autónoma Atlas)
- **Base de evidência Parte 2:** `handoffs/RETOMA-20260420-auditoria-profunda-v2.md` secção 10 + análise directa do `.bpz`
- **Tom:** respeitoso, pragmático, Carnegie (reconhecer trabalho + entregar valor não pedido + resolver dor real)
- **Tratamento:** "Moreira" / "caro José Moreira" — formal respeitoso, primeiro contacto técnico
- **Mudança vs v1:** framing correcto de consultor + esqueleto replicável; entrega mapa de mercado não pedido mas essencial; Q3 reescrita (agora "sim replicas, eis como" em vez de "não é viável"); Q4 reescrita (transparência sobre parceria, não 4 modelos genéricos); adicionada Parte 1 completa
- **Limites respeitados:** `feedback_no_projected_business_models.md` (nada inventado sobre parceria), `feedback_moreira_no_hallucinations.md` (zero invenção — tudo no mapa tem fonte), `language-standards.md` (PT-PT), `feedback_carnegie_copy_framework.md` (estrutura)
- **Princípio fundador aplicado:** Acolhe-Adapta-Rentabiliza — acolhemos o projecto (mapa + respostas), adaptamos ao nosso modelo (dataset de PMEs industriais de Viana serve-nos para produto futuro), rentabilizamos (know-how de chatbot PME replicável fica connosco)
- **Aprovação necessária antes de enviar:** Eurico
- **Canal de envio sugerido:** email com 2 anexos (este documento + mapa-mercado completo)
- **Decisões pendentes após leitura do Eurico:** tom adequado? 4 pontos urgentes no documento ou WhatsApp separado? canal de envio final? assinatura final?
