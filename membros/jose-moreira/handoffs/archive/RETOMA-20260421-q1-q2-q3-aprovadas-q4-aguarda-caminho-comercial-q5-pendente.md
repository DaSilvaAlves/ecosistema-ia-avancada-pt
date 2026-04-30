# RETOMA — Moreira Q1/Q2/Q3 APROVADAS, Q4 aguarda decisão comercial, Q5 pendente

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: any
created: 2026-04-21T (fim de sessão com contexto low)
status: consumed
consumed: true
consumed_at: 2026-04-22
consumed_by: ux-design-expert (Uma)
consumed_session: "Q4 Caminho B aprovado + Q5 validada e aprovada. Superseded por RETOMA-20260422-5-questoes-aprovadas-aguarda-4-decisoes-antes-de-v3.md"
project: jose-moreira (membros/jose-moreira/)
session_type: validacao-tecnica-profunda-continuacao
questoes_totais: 5
questoes_aprovadas: 3  # Q1, Q2, Q3
questoes_parcialmente_validadas: 1  # Q4 (parte técnica validada, parte comercial aguarda decisão do Eurico)
questoes_pendentes: 1  # Q5
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\02-prd
handoff_anterior: RETOMA-20260421-q1-validada-q2-q5-pendentes.md (consumido nesta sessão)
```

---

## ⚠️ AVISO CRÍTICO (LER PRIMEIRO)

O Eurico está **muito receoso** de enganos. Já existem 2 versões anteriores (v1 e v2) descartadas. Regras:

1. **Uma questão de cada vez** — não avançar sem validação ≥90%
2. **Evidência dura** — bot.json real + configUrl + screenshots + doc Botpress oficial
3. **Só comparar com v2 no fim** — não enviesar
4. **NUNCA inventar** — se não há evidência, admitir incerteza
5. **NÃO PROJECTAR MODELO DE NEGÓCIO** — regra activa `feedback_no_projected_business_models.md`
6. **PT-PT formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves" + "Um abraço"

---

## ESTADO ACTUAL — RESUMO EXECUTIVO

| Q | Tema | Estado | Aprovada pelo Eurico? | Rascunho guardado |
|---|------|--------|------------------------|--------------------|
| Q1 | UPLOAD QUE SOME | VALIDADA ✅ | SIM — sessão 21/04 | `02-prd/rascunho-q1-validado.md` |
| Q2 | SKIP NO APOIO HUMANO | VALIDADA ✅ | SIM — sessão 21/04 | `02-prd/rascunho-q2-validado.md` |
| Q3 | REPLICAÇÃO | VALIDADA ✅ | SIM — sessão 21/04 | `02-prd/rascunho-q3-validado.md` |
| Q4 | AUTORIA E CONTROLO | PARTE TÉCNICA VALIDADA ✅ / PARTE COMERCIAL AGUARDA EURICO 🟡 | Parcial | Rascunho técnico pronto in-handoff (abaixo). Parte comercial pendente |
| Q5 | AGENTE HUMANO VS BASEKNOWLEDGE | PENDENTE | — | — |

### Ordem de execução recomendada na sessão nova

1. **Resolver Q4 (secção comercial)** — Eurico escolhe caminho A/B/C, agente redige secção e consolida rascunho Q4 completo
2. **Atacar Q5** — validar, redigir, apresentar, aprovar
3. **Consolidar `resposta-moreira-v3.md`** com as 5 questões validadas, só depois de tudo aprovado
4. **Não tocar em v2** — é referência histórica

---

## FRASES EXACTAS DAS 5 QUESTÕES (briefing)

Ficheiro: `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt`

| # | Tema | Frase exacta |
|---|------|--------------|
| 1 | UPLOAD QUE SOME | "O ícone de upload aparece em modo anónimo, mas desaparece em navegação normal — como resolver? (ver imagens)" |
| 2 | SKIP NO APOIO HUMANO | "No nó 'Apoio_Humano_PT', como permitir que o utilizador salte o upload do ficheiro e avance diretamente para o agente, mesmo sem enviar imagem?" |
| 3 | REPLICAÇÃO | "É viável usar este 'esqueleto' para várias empresas na versão gratuita do Botpress?" |
| 4 | AUTORIA E CONTROLO | "Como integrar os seus anúncios e suporte técnico sem que eu perca a autoria e o controlo estratégico do chatbot?" |
| 5 | AGENTE HUMANO VS BASEKNOWLEDGE | "No nó 'Apoio_Humano_PT', como posso garantir que a conversa de um agente humano se torne visível no chatbot, em vez de ser um texto retirado da base de conhecimento (Baseknowledge)?" |

---

## Q1 — UPLOAD QUE SOME — APROVADA ✅

### Factos-chave confirmados

| Facto | Certeza | Fonte |
|-------|---------|-------|
| `allowFileUpload: true` no webchat (JÁ activo) | 100% | WebFetch `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` |
| `VisionAgent.enabled=true`, `extractionEnabled=true` | 100% | bot.json |
| 4 screenshots Moreira — todos Chrome Android, composer sem clip | 100% | `02-prd/auditoria-profunda-v2/working/user-chat-*.jpg` |
| Causa = cache local ou extensão browser | ~90% | Padrão clássico "anónimo ok, normal não" |

### Erros v2 identificados (3)

1. Assume flag OFF — está TRUE
2. Inventa "regra que desactiva upload para utilizadores identificados" — NÃO existe
3. Omite extensões browser + especificidade Chrome Android

### Rascunho

Ficheiro pronto: **`membros/jose-moreira/02-prd/rascunho-q1-validado.md`**

---

## Q2 — SKIP NO APOIO HUMANO — APROVADA ✅

### Factos-chave confirmados

| Facto | Certeza | Fonte |
|-------|---------|-------|
| `Apoio_Humano_PT` tem 4 instructions (capture Raw Input → capture File → send msg → action handoff) | 100% | bot.json linhas 4491-4703 |
| `Human_Support_EN` espelho em inglês, partilha `variableId: var-0b3eeb9be7` | 100% | bot.json linhas 4705-4917 |
| Capture File: `handleFailure: false`, `skipIfAlreadyFilled: false`, `transitions: []`, `choice.options: []` | 100% | bot.json |
| Prompt real PT: *"Se desejar, pode anexar aqui um print screen ou documento sobre o problema."* | 100% | bot.json linha 4584 |
| Prompt real EN: *"Please upload a screenshot or document related to your issue if you wish."* | 100% | bot.json linha 4799 |
| Botpress: File Upload não tem botão skip nativo | 100% | docs.botpress.com capture-information |
| Mecanismos legítimos de skip: `handleFailure: true`, Choices, Skip-if-filled | 100% | Mesma fonte |
| Solução recomendada: Choice capture ANTES do File capture | ≥95% | Análise + doc + prática comunidade |

### Erros v2 identificados (4)

1. Frase inventada: "Por favor, envie a imagem ou ficheiro relevante" — NÃO é o texto real
2. Afirma "motor LLMz não trata bem transições mistas" sem evidência
3. Omite `handleFailure: true` como alternativa
4. Não alerta para simetria obrigatória PT/EN

### Rascunho

Ficheiro pronto: **`membros/jose-moreira/02-prd/rascunho-q2-validado.md`**

---

## Q3 — REPLICAÇÃO — APROVADA ✅

### Factos-chave confirmados (Botpress Cloud 2026)

| Plano | Custo | Bots | Msgs/mês | AI Credit | Seats | Vector |
|-------|-------|------|----------|-----------|-------|--------|
| Pay-as-You-Go (Free) | $0 + AI Spend | **1** | 500 | $5 | 1 | 100MB |
| Plus | $89/mês | 2 | 5.000 | $5 | 2 | 1GB |
| Team | $495/mês | 3 | 50.000 | $5 | 3 | 2GB |
| Managed | $1.245/mês | Team+ | Team+ | $5 | Team+ | Team+ |

Fonte: botpress.com/pricing verificado em 21/04/2026 via WebFetch.

### Outros factos confirmados

- 3 env vars críticas no bot do Moreira: `AIRTABLE_PAT` (82 chars), `BASE_ID: app7S6wEWqhpQgMEV`, `TABLE_ID` (16 chars)
- 7+ secções de texto com placeholders tipo `[Nome da Empresa]`, `[Serviço A/B/C]`, `IBAN PT50 XXXX...`, `[Rua, Número]`, `[Nome da Paragem]`, carreiras `[X] e [X]`, coordenadas GPS, `financeiro@empresa.pt`
- Estimativa: 30-60 placeholders distintos a preencher por cliente
- KB HTML: ficheiro único `file_01KMX11455XEY342P2KSA51ZMP` — específico de uma empresa
- AI credit $5 ~= 30-100 conversas gpt-4-turbo / mês

### Modelos de replicação propostos no rascunho

- **Modelo A (recomendado):** cada cliente tem conta Free própria, Moreira é colaborador — escala sem upgrade, reduz lock-in
- **Modelo B:** bots na conta Plus do Moreira ($89/mês) — limitado a 2 bots
- **Modelo C:** Enterprise — só para 10+ clientes

### Erros v2 identificados (5)

1. "5 bots/workspace no Free" — ERRADO. É 1
2. "Plano Pro a $80/mês" — Plano Pro NÃO existe. Plus é $89, Team é $495
3. "setup 300-700€ + mensalidade 80-150€/mês" — pricing INVENTADO que o Moreira NÃO pediu (viola regra)
4. "25-30 targets, 5-10 clientes ano 1, 1.000€/mês recorrente" — projecções de mercado inventadas
5. Cálculos de payback baseados em preços inventados

### Rascunho

Ficheiro pronto: **`membros/jose-moreira/02-prd/rascunho-q3-validado.md`**

---

## Q4 — AUTORIA E CONTROLO — PARTE TÉCNICA APROVADA 🟡 / PARTE COMERCIAL AGUARDA EURICO

### Factos-chave confirmados

| Facto | Certeza | Fonte |
|-------|---------|-------|
| Email Moreira: `josemmoreira1@gmail.com` | 100% | bot.json linha 5600 |
| workspaceUserId: `0947e877-3373-45f2-8983-5c385007d6b1` | 100% | Mesma linha |
| Bot ID: `e7e5db81-ad3c-45e2-bf25-033d76b04059` | 100% | bot.json linha 9 |
| Airtable Base ID: `app7S6wEWqhpQgMEV` | 100% | bot.json linha 16 |
| 6 roles Botpress: Viewer / Billing Manager / Developer / Manager / Administrator / Owner | 100% | botpress.com docs managing-workspaces |

### Rascunho da PARTE TÉCNICA (aprovada e pronta a usar — copiar direto quando finalizar)

```markdown
## Q4. AUTORIA E CONTROLO — integrar anúncios e suporte sem perder autoria

### Onde está a autoria do seu bot hoje — tecnicamente

O bot é seu. Não é formalidade, é facto verificável nos ficheiros:

- Bot `e7e5db81-ad3c-45e2-bf25-033d76b04059` criado e gerido por `josemmoreira1@gmail.com` no seu workspace
- Os 4 flows, os 33 nodes, os 2 hooks LLMz — tudo gravado no seu nome
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
```

### 🟡 DECISÃO PENDENTE DO EURICO — parte comercial ("integrar anúncios e suporte")

O Moreira perguntou literalmente: *"Como integrar os seus anúncios e suporte técnico sem que eu perca a autoria e o controlo estratégico do chatbot?"*

Ele abriu porta mas não especificou formato. 3 caminhos possíveis — Eurico escolhe:

| Caminho | Essência | Quando faz sentido |
|---------|----------|--------------------|
| **A. Modo comunidade actual** | "Não tenho formato comercial hoje. Acompanhamento técnico gratuito entre pares. Se aparecer formato, falamos." | Mantém Acolhe-Adapta-Rentabiliza. Zero compromisso de ambos |
| **B. Porta aberta para parceria futura** | Caminho A + "Quando tiveres 2-3 clientes pagantes, retomamos conversa sobre formato (afiliação, co-marketing, etc.)" | Condicional, horizonte aberto sem inventar preço |
| **C. Proposta concreta já** | Definir formato já: split X%, pacote Y€/mês, link afiliação no bot | **Contra regra** `feedback_no_projected_business_models.md` |

**Leitura das regras de memória:**
- `feedback_no_projected_business_models.md` → proíbe C (não inventar modelos)
- `feedback_community_acolhe_adapta_model.md` → recomenda A ou B

**Uma (a minha) inclinação:** Caminho B (leve preferência sobre A). Mas decisão é do Eurico.

### Erros v2 identificados (2)

1. "Contrato simples de 1 página por cliente" + texto proposto — assume decisão que é do Eurico
2. "Não temos formato estruturado de parceria comercial" — afirmação de posição do Eurico que a v2 inventou em vez de esperar validação

### Próxima acção Q4

**Na sessão nova, agente DEVE:**

1. Perguntar ao Eurico: "Caminho A, B ou C para a secção comercial da Q4?"
2. Com base na escolha, redigir a secção "Sobre integrar os seus anúncios e suporte" em coerência com o caminho
3. Juntar à parte técnica acima
4. Apresentar Q4 completa ao Eurico para aprovação final
5. Se aprovado → guardar em `02-prd/rascunho-q4-validado.md`

---

## Q5 — AGENTE HUMANO VS BASEKNOWLEDGE — PENDENTE

### Frase exacta

> "AGENTE HUMANO VS BASEKNOWLEDGE: No nó 'Apoio_Humano_PT', como posso garantir que a conversa de um agente humano se torne visível no chatbot, em vez de ser um texto retirado da base de conhecimento (Baseknowledge)?"

### Pistas pré-validação (confirmadas nesta sessão)

- `KnowledgeAgent.enabled = true`, `KnowledgeAgent.answerManually = true` (bot.json)
- Nó `Apoio_Humano_PT` termina com action `conversation.handoff = true` (bot.json linha 4690)
- Mas no flow actual NÃO há gate que impeça a KB de responder depois da flag handoff
- Em Botpress, `handoff = true` é sinal para o **sistema de webchat**, não para o motor LLMz do flow
- Falta: (a) agente humano real conectado OU (b) gate no flow que bypassa KB quando handoff=true

### O que v2 propôs (ainda não validado independentemente)

4 opções:
- A. Inbox oficial Botpress (plano Pro)
- B. Gate no flow via hook `before_llmz_execution`
- C. Canal externo Slack/WhatsApp
- D. Nó "Aguardar resposta humana"

A v2 recomenda fase 1 = Opção B + email fallback. Fase 2 = Opção C. Fase 3 = Opção A.

**NÃO seguir a v2 como base.** Validar independentemente:

### O que precisa ser feito na sessão nova (protocolo Q5)

1. Reler a frase exacta do Moreira no briefing
2. Ler hook `track_iterations` + `inject_learnings` no bot.json para perceber se algum deles já gere o bypass
3. Consultar doc Botpress oficial sobre `conversation.handoff` e comportamento do KnowledgeAgent quando handoff activo
4. Verificar se no plano Free o Botpress Inbox funciona ou está limitado
5. Considerar a realidade do Moreira: **quem é o agente humano?** O Moreira, o cliente PME, ninguém?
6. Cross-check com hooks: o bot tem `answerManually=true` mas a v2 diz que a KB continua a intervir — confirmar comportamento
7. Só no fim comparar com v2 Q5 (`resposta-moreira-v2.md` linha 347+)
8. Redigir rascunho
9. Apresentar ao Eurico

### Nota crítica

A flag `answerManually=true` já pode estar parcialmente a resolver. Agente novo DEVE:
- Verificar se `answerManually=true` impede a KB de responder até o Moreira aprovar manualmente
- Se sim, a pergunta do Moreira pode ser: "como fazer a resposta do AGENTE ser injectada no chat?" (em vez de "como impedir a KB?")
- Nesse caso a resposta muda: KB já está controlada, o que falta é o canal de agente humano

---

## ERROS v2 — CONSOLIDADO ATÉ AGORA

### Q1 (3 erros)
1. Assume flag OFF — está TRUE
2. Inventa regra para "utilizadores identificados" (não existe)
3. Omite extensões browser + Chrome Android

### Q2 (4 erros)
1. Frase do prompt inventada
2. "LLMz instável" sem evidência
3. Omite `handleFailure: true`
4. Não alerta simetria PT/EN

### Q3 (5 erros)
1. "5 bots/workspace free" (é 1)
2. "Plano Pro $80" (não existe — é Plus $89)
3. Pricing clientes inventado (300-700€ setup, 80-150€/mês)
4. Projecções de mercado (25-30 targets, 5-10 clientes ano 1)
5. Cálculos de payback baseados em números inventados

### Q4 (2 problemas)
1. Contrato 1 página assumido como decisão
2. Posição do Eurico sobre parceria inventada

### Q5 (ainda não validado — tarefa do próximo)

---

## PROTOCOLO DE TRABALHO (inalterado)

### Fluxo por questão

```
1. Reler frase exacta da questão no briefing (não resumir)
2. Consultar bot.json real (extraído do .bpz)
3. Consultar config webchat (via WebFetch ao configUrl público)
4. Consultar imagens que o Moreira anexou (screenshots)
5. Consultar doc oficial Botpress (WebSearch/WebFetch)
6. SÓ NO FIM: ler secção correspondente da v2 para comparar
7. Produzir veredicto com certeza por camada
8. Redigir rascunho
9. Apresentar ao Eurico para aprovação
10. Se aprovado → guardar em `02-prd/rascunho-q{N}-validado.md` + passar à próxima
```

### Regras inegociáveis

- **Sem inventar factos.** Se o bot.json não diz, não digo
- **Sem seguir a v2.** V2 tem erros confirmados
- **PT-PT obrigatório**
- **Sem "garantido", "fácil", "revolucionário", "automático", "curso"**
- **Tom formal-cordial** — Moreira tratou o Eurico por "Sr. Eurico Alves"
- **NÃO PROJECTAR MODELO DE NEGÓCIO** sem o Moreira propor formato concreto

---

## FONTES DE VERDADE (paths críticos)

### Material do bot

| Recurso | Path | Nota |
|---------|------|------|
| **bot.json** | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/bot.json` | 268KB, 5624 linhas |
| Cloud files metadata | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/cloud_files.json` | Lista anexos |
| Config webchat público | `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` | Fetch via WebFetch |
| Link shareable público | `https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=<url_acima>` | Testar no browser |
| Screenshots Moreira | `membros/jose-moreira/02-prd/auditoria-profunda-v2/working/user-chat-*.jpg` + `webchat-button-image.jpg` | 4 screenshots Chrome Android |
| KB HTML | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/files/file_01KMX11455XEY342P2KSA51ZMP` | Rich Text File |

### Briefing Moreira

- `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` (frases exactas das 5 questões)

### Rascunhos aprovados (guardar zelosamente)

- `membros/jose-moreira/02-prd/rascunho-q1-validado.md`
- `membros/jose-moreira/02-prd/rascunho-q2-validado.md`
- `membros/jose-moreira/02-prd/rascunho-q3-validado.md`

### Referências (NÃO usar como base)

- `membros/jose-moreira/02-prd/resposta-moreira-v2.md` — V2 com erros, só comparar
- `membros/jose-moreira/02-prd/respostas-5-questoes-moreira-v1-DESCONTINUADO.md` — V1 descontinuada

### Doc Botpress oficial

- https://www.botpress.com/docs/learn/reference/cards/capture-information
- https://botpress.com/pricing
- https://botpress.com/docs/cloud/admin-dashboard/managing-workspaces

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

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md`. ESTÁ DENTRO DA PASTA DO PROJECTO MOREIRA. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` E `.claude/rules/workspace-governance.md` PARA DETALHES.

---

## PRÓXIMA ACÇÃO RECOMENDADA (sessão nova)

### Primeira resposta do agente que assumir

```
Li o INDEX + handoff RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md.

Estado:
- Q1, Q2, Q3 aprovadas — rascunhos em `02-prd/rascunho-q{N}-validado.md`
- Q4: parte técnica pronta (no handoff). Parte comercial aguarda tua escolha: A, B ou C
- Q5: pendente

Para avançares:
- Escolhes caminho comercial Q4 (A / B / C)? Ou preferes atacar Q5 primeiro?
```

### Depois de escolher caminho Q4

1. Redigir secção "Sobre integrar os seus anúncios e suporte" conforme A/B/C
2. Consolidar Q4 completa (parte técnica + secção comercial)
3. Apresentar ao Eurico
4. Se aprovado → guardar em `02-prd/rascunho-q4-validado.md`

### Q5

1. Reler briefing + abrir bot.json
2. Verificar comportamento real de `KnowledgeAgent.answerManually=true` vs `conversation.handoff=true`
3. Ler hooks `track_iterations` e `inject_learnings`
4. Consultar doc Botpress sobre handoff + KB
5. Só no fim comparar com v2 Q5
6. Redigir → apresentar → aprovar → guardar

### Consolidação final (apenas depois das 5 aprovadas)

Criar `membros/jose-moreira/02-prd/resposta-moreira-v3.md` juntando os 5 rascunhos validados na ordem correcta, mais:

- Mapa de mercado (Parte 1) — decidir se incluir, adaptar, ou omitir
- Nota final sobre 4 pontos urgentes encontrados no `.bpz` (v2 linhas 405-416): **Revisar se ainda são válidos:**
  - PAT Airtable exposto no .bpz → revogar
  - Foto pessoal pública na KB → tornar privada
  - PDF com CV na KB → apagar
  - Variáveis `clientName` vs `ClientName` inconsistentes → bug funcional (Airtable recebe Nome vazio)
- Próximos passos para o Moreira
- Agenda Zoom (Ter 21 > 13:00, Qui 23 > 18:00, Sex 24 > 18:00 — NOTA: hoje é 21/04, se sessão continuar após 21 actualizar opções)

### Não fazer na sessão nova

- Assumir que caminho comercial Q4 é o A sem perguntar ao Eurico
- Tocar em `resposta-moreira-v2.md` sem instrução explícita
- Criar `resposta-moreira-v3.md` sem autorização do Eurico e sem as 5 Q validadas
- Atacar Q5 antes de resolver Q4 comercial (excepto se Eurico pedir)

---

## CHECKLIST DE SELF-AUDIT DESTE HANDOFF

- [x] Path correcto: `membros/jose-moreira/handoffs/` ✅
- [x] Nomenclatura: `RETOMA-YYYYMMDD-slug.md` ✅
- [x] Data correcta: 20260421 ✅
- [x] Aviso inicial da regra handoff-location incluído ✅
- [x] Lembrete do meio incluído ✅
- [x] Confirmação final incluída ✅
- [x] Todas as 5 questões referenciadas com frase EXACTA ✅
- [x] Status de cada questão claro ✅
- [x] Factos confirmados com path/URL das fontes ✅
- [x] Erros v2 listados por questão ✅
- [x] Rascunhos Q1/Q2/Q3 referenciados com path ✅
- [x] Rascunho Q4 parte técnica incluído inline ✅
- [x] Decisão pendente Q4 claramente marcada com 3 opções ✅
- [x] Regras de tom e comunicação incluídas ✅
- [x] Próxima acção detalhada ✅
- [x] Referência ao briefing original ✅
- [x] IDs/factos confirmados do bot listados ✅
- [x] PT-PT ✅

### Pontos de risco que ficam no handoff

1. **Q4 caminho comercial é decisão do Eurico** — agente não pode escolher sozinho
2. **Q5 pode ter solução mais simples do que v2 propõe** se `answerManually=true` já bypassa KB — confirmar antes de recomendar gate complexo
3. **4 pontos urgentes da v2 (PAT, foto, PDF, `clientName`)** — confirmar se ainda são válidos antes de meter no v3
4. **Mapa de mercado da v2 (Parte 1)** — decidir inclusão com base no tom escolhido em Q4 comercial

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** jose-moreira (José Moreira, cliente real do Eurico, Viana do Castelo)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md`
- **COINCIDEM?** SIM ✅

AGENTE RESPONSÁVEL: `ux-design-expert (Uma)`
DATA: 21/04/2026
TERMINAL: terminal actual (context low — Eurico pediu handoff para continuar noutro terminal)
HANDOFF ANTERIOR: `RETOMA-20260421-q1-validada-q2-q5-pendentes.md` (consumido nesta sessão — a arquivar)

---

## FIM DO HANDOFF

Se estás a ler isto numa sessão nova: **começa pela secção "PRÓXIMA ACÇÃO RECOMENDADA"** acima. A decisão crítica imediata é o caminho comercial Q4 (A, B ou C). Pergunta ao Eurico antes de avançar.
