# RETOMA — Respostas às 5 questões do Moreira (Q1 validada, Q2-Q5 pendentes)

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: any
created: 2026-04-21T01:55:00+01:00
status: consumed
consumed: true
consumed_at: 2026-04-21T (sessão ux-design-expert que aprovou Q1/Q2/Q3 e iniciou Q4)
consumed_by: ux-design-expert (Uma)
superseded_by: RETOMA-20260421-q1-q2-q3-aprovadas-q4-aguarda-caminho-comercial-q5-pendente.md
project: jose-moreira (membros/jose-moreira/)
session_type: validacao-tecnica-profunda
questoes_totais: 5
questoes_validadas: 1  # apenas Q1
questoes_pendentes: 4  # Q2, Q3, Q4, Q5
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\02-prd
```

---

## ⚠️ AVISO CRÍTICO ANTES DE CONTINUAR (LER PRIMEIRO)

O Eurico está **muito receoso** de enganos. Já existem 2 versões anteriores (v1 e v2) que foram descartadas/são erradas. Ele pediu explicitamente:

1. **Uma questão de cada vez** — não avançar para a próxima enquanto a actual não estiver validada com certeza ≥ 90%
2. **Análise profunda com evidência dura** — cruzar bot.json real + config webchat via fetch + imagens do Moreira + doc oficial Botpress
3. **Só no fim comparar com a v2** — para não enviesar a análise pela v2
4. **Nunca inventar** — se não há evidência, admitir incerteza
5. **Sem pressa** — preferimos 1 resposta certa a 5 erradas

**NÃO USAR a `resposta-moreira-v2.md` como base.** A v2 tem erros factuais confirmados. Detalhes mais abaixo.

---

## CONTEXTO DO PROJECTO

### Quem é o Moreira
- **José Moreira**, de Viana do Castelo, cliente REAL do Eurico
- Ligou ao Eurico em 10/04/2026, enviou briefing em 18/04/2026
- Desenvolveu um chatbot **bilingue PT/EN no Botpress (versão gratuita)** para PMEs locais
- Negócio dele: Consultoria e implementação de Automação com IA para PMEs (indústria/comércio em Viana)
- Cliente-alvo dele: PMEs industriais que perdem vendas por falta de atendimento fora de horas
- Propôs divulgar a comunidade [IA]AVANÇADA PT no LinkedIn — **já publicou o post** (21/04 ou antes)
- Quer agendar Zoom esta semana: Ter 21 a partir das 13h | Qui 23 a partir das 18h | Sex 24 a partir das 18h

### As 5 questões técnicas do Moreira (briefing original)
Ficheiro: `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt`

| # | Tema | Frase exacta (verificar sempre) |
|---|------|--------------------------------|
| 1 | UPLOAD QUE SOME | "O ícone de upload aparece em modo anónimo, mas desaparece em navegação normal — como resolver? (ver imagens)" |
| 2 | SKIP NO APOIO HUMANO | "No nó 'Apoio_Humano_PT', como permitir que o utilizador salte o upload do ficheiro e avance diretamente para o agente, mesmo sem enviar imagem?" |
| 3 | REPLICAÇÃO | "É viável usar este 'esqueleto' para várias empresas na versão gratuita do Botpress?" |
| 4 | AUTORIA E CONTROLO | "Como integrar os seus anúncios e suporte técnico sem que eu perca a autoria e o controlo estratégico do chatbot?" |
| 5 | AGENTE HUMANO VS BASEKNOWLEDGE | "No nó 'Apoio_Humano_PT', como posso garantir que a conversa de um agente humano se torne visível no chatbot, em vez de ser um texto retirado da base de conhecimento (Baseknowledge)?" |

### Histórico de tentativas de resposta

| Versão | Path | Estado | Usar como fonte? |
|--------|------|--------|------------------|
| v1 | `02-prd/respostas-5-questoes-moreira-v1-DESCONTINUADO.md` | DESCONTINUADA pelo Eurico | ❌ Não |
| v2 | `02-prd/resposta-moreira-v2.md` | **TEM ERROS FACTUAIS CONFIRMADOS** | ❌ Não como base. Só como referência para comparar no fim |
| v3 (em construção) | — | A construir com validação profunda | Sim (depois de cada questão validada) |

---

## PROTOCOLO DE TRABALHO ACORDADO

### Fluxo por questão

```
1. Reler frase exacta da questão no briefing (não resumir)
2. Consultar bot.json real (extraído do .bpz)
3. Consultar config webchat (via WebFetch ao configUrl público)
4. Consultar imagens que o Moreira anexou (screenshots)
5. Consultar doc oficial Botpress (WebSearch/WebFetch)
6. SÓ NO FIM: ler secção correspondente da v2 para comparar
7. Produzir veredicto com certeza por camada (table)
8. Redigir rascunho da resposta para o Moreira
9. Apresentar ao Eurico para aprovação
10. Se aprovado → passar à próxima. Se não → iterar.
```

### Regras inegociáveis

- **Sem inventar factos.** Se o bot.json não diz, não digo.
- **Sem seguir a v2.** A v2 inventou coisas (regra para "utilizadores identificados" — NÃO EXISTE no Botpress).
- **PT-PT obrigatório** (regra `language-standards.md`).
- **Sem "garantido", "fácil", "revolucionário", "automático", "curso"** — tom do Eurico (regra `whatsapp-copy-rules.md`).
- **Tom do Eurico com o Moreira: formal-cordial, directo, conversa entre pares** — Moreira tratou o Eurico por "Sr. Eurico Alves" + "Um abraço".

---

## FONTES DE VERDADE (paths exactos)

### Material do bot real do Moreira

| Recurso | Path | Nota |
|---------|------|------|
| **bot.json** (ficheiro-fonte principal) | `Clientes_Chatbot - 2026 Apr 15.bpz/bot.json` | 268KB, 5624 linhas, JSON válido. Contém flows, hooks, agents, tables, config |
| Cloud files metadata | `Clientes_Chatbot - 2026 Apr 15.bpz/cloud_files.json` | Lista ficheiros anexos (imagens, KB, PDF) |
| Config webchat público | `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` | Fetch via WebFetch — NÃO está no .bpz |
| Link shareable público do bot | `https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` | Pode abrir no browser para testar comportamento real |
| Screenshots do Moreira | `02-prd/auditoria-profunda-v2/working/user-chat-2026-04-*.jpg` + `webchat-button-image.jpg` + `studio-media-Imagem1.jpg` | 4 screenshots de conversas + FAB image |
| Base de conhecimento HTML | `Clientes_Chatbot - 2026 Apr 15.bpz/files/file_01KMX11455XEY342P2KSA51ZMP` | Rich Text File da KB |
| Dumps forenses antigos | `02-prd/auditoria-profunda-v2/working/01-05-*.txt` | **USAR COM CAUTELA** — foram interpretados, não são cru 100%. Sempre que possível confirmar no bot.json |

### Estrutura do bot.json (extraída e validada)

**4 Flows:**
- `wf-main` (33 nodes, PT+EN bilingue)
- `wf-error`, `wf-timeout`, `wf-conversation-end`

**Nodes-chave em `wf-main`** (para Q2 e Q5):
- `Apoio_Humano_PT` (índice [28] no array nodes)
- `Human_Support_EN` (índice [29] no array nodes — confirmei que é o 29, tem Raw Input + question "Please upload a screenshot...")

**2 Hooks custom (LLMz):**
- `track_iterations` (after_llmz_execution)
- `inject_learnings` (before_llmz_execution)

**5 Agents:**
| Agent | Estado | Config relevante |
|-------|--------|------------------|
| SummaryAgent | DISABLED | — |
| KnowledgeAgent | **ENABLED** | `answerManually=True`, strategy=hybrid, chunks=50, bestModel=gpt-4-turbo |
| VisionAgent | **ENABLED** | `extractionEnabled=True` |
| TranslatorAgent | on | detectLanguage=True |
| PersonalityAgent | vazio | — |

**3 Tables:**
- `Int_Improvement_Feedback_Table` (auto)
- `RouterAgentTable` (auto)
- `MailingListsEmailsTable` (custom — criada pelo Moreira para leads)

**3 Config variables (CRÍTICO para Q3):**
- `AIRTABLE_PAT` (token 82 chars) — PAT pessoal do Moreira
- `BASE_ID` (17 chars)
- `TABLE_ID` (16 chars)
- → O bot está ligado à **Airtable pessoal do Moreira**. Não é portável sem mudar estas 3 variáveis por cliente.

### Regras de navegação para sessão nova

| Antes de fazer | Fazer |
|----------------|-------|
| Responder qualquer questão | Reler a frase exacta da questão no briefing |
| Citar um comportamento técnico | Verificar no bot.json + configUrl + doc oficial |
| Seguir uma afirmação da v2 | Nunca. Usar v2 apenas como referência de comparação, não como base |
| Activar MCP ou tools externas | Preferir tools nativas (Read, Grep, Glob, Bash, WebFetch, WebSearch) |

---

## Q1 — UPLOAD QUE SOME — **VALIDADA** ✅ (rascunho pronto, à espera de aprovação do Eurico)

### Frase exacta do Moreira

> "UPLOAD QUE SOME: O ícone de upload aparece em modo anónimo, mas desaparece em navegação normal — como resolver? (ver imagens)"

### Factos confirmados com evidência dura

| Camada | Descoberta | Certeza | Fonte |
|--------|-----------|---------|-------|
| Config webchat server-side | `"allowFileUpload": true` (JÁ está activo) | 100% | WebFetch ao configUrl |
| Bot pronto para imagens | `VisionAgent.enabled=true`, `extractionEnabled=true` | 100% | bot.json |
| Sintoma reproduzido | 4 screenshots (todos Chrome Android) mostram composer só com microfone, sem clip. Todas as conversas estão em PT e chegaram ao prompt "Se desejar, pode anexar aqui um print screen ou documento sobre o problema" | 100% | `02-prd/auditoria-profunda-v2/working/user-chat-2026-04-*.jpg` |
| Causa = cache ou extensão | ~90% | Padrão clássico "anónimo ok, normal não" + doc Botpress reconhece configUrl staleness |
| Causa = bug do widget v3.6 | ~10% residual | Sem issue específico aberto sobre clip não aparecer |

### Onde a v2 falha na Q1 (NÃO REPETIR)

| Afirmação da v2 | Problema |
|----------------|----------|
| "Cache do browser — navegação normal carrega versão antiga sem `allowFileUpload: true`" | Meio-correcto. Cache é hipótese válida, **mas assume que a flag estava off na versão antiga — sem evidência**. A flag actual está TRUE |
| "Propriedade `allowFileUpload` — pode existir regra que desactiva upload para utilizadores identificados" | **INVENTADO.** Não existe tal regra na API Botpress |
| "Passo 1: abrir Studio, activar 'Allow file upload'" | **Redundante.** Já está activado. O Moreira vai perder tempo e sentir-se mal |
| Não menciona extensões de browser | Omissão grave — "funciona anónimo, não normal" é assinatura típica de extensão |
| Não menciona testar noutro browser | Omissão |
| Não distingue Desktop vs Mobile | Omissão — todas as imagens do Moreira são Chrome Android |

### Rascunho aprovado pela Uma (ux-design-expert), pendente de aprovação do Eurico

```markdown
## Q1. UPLOAD QUE SOME — O ícone aparece em modo anónimo, desaparece em navegação normal

### O que está correcto no seu lado

Confirmei a configuração pública do seu webchat (o ficheiro `20260323112227-A7N2XPSU.json` que o Botpress gera quando publica). A opção **`allowFileUpload`** está **activada**. O **Vision Agent** no bot também está **ligado**, com extracção de conteúdo de imagens on. Ou seja, a configuração do lado do bot **está correcta**. Se o ícone aparece em modo anónimo, é porque o sistema está preparado para o mostrar — o código sabe que há upload.

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

Aí sim é bug do widget Botpress v3.6 — mas é residual (menos de 10% de probabilidade). Nesse caso abrimos ticket no suporte Botpress com os passos reproduzidos. A configuração do seu bot está correcta, portanto o ónus é deles.

### O que NÃO precisa de fazer

Não precisa de voltar ao Studio para "activar" a opção de upload — **já está activa**. E não há nenhuma regra do Botpress que desactive upload só para utilizadores identificados (isso não existe). Se alguém lhe sugerir mexer na configuração do bot para resolver isto, está a procurar no sítio errado.

### Para quando replicar noutros clientes

Este não é bug do seu bot em particular — é o mesmo comportamento que vai ver em qualquer chatbot Botpress publicado via shareable URL. Para as próximas replicações, a única nota é: **confirmar no Studio que `allowFileUpload` está ligado** antes de publicar o bot para o cliente. Fica como item de checklist de entrega — não precisa de fix especial.

Quando fizer os testes, diga-me em que passo resolveu — isso ajuda-me a construir a checklist de diagnóstico para os próximos bots dos seus clientes.
```

### Decisões a tomar para Q1 quando o Eurico retomar

- [ ] Aprovar rascunho Q1 como está
- [ ] Ou: editar tom/conteúdo antes de aceitar
- [ ] Onde guardar: apenas no ficheiro final `resposta-moreira-v3.md` (NÃO no v2) — criar só quando as 5 estiverem validadas. Alternativamente, criar um `rascunho-q1-validado.md` para guardar já se o Eurico preferir

---

## Q2 — SKIP NO APOIO HUMANO — **PENDENTE**

### Frase exacta do Moreira

> "SKIP NO APOIO HUMANO: No nó 'Apoio_Humano_PT', como permitir que o utilizador salte o upload do ficheiro e avance diretamente para o agente, mesmo sem enviar imagem?"

### O que precisa de ser feito na sessão nova

1. **Ler o node `Apoio_Humano_PT` completo do bot.json** (está em `flows[3].nodes[28]` — confirmar pelo nome). Tem de ver:
   - Quantas instruções tem
   - Quais são `capture` (raw input)
   - Se o prompt de upload está configurado como `optional` ou `required`
   - Quais as `transitions`
2. **Ler também `Human_Support_EN`** (índice 29) — para garantir que a resposta se aplica aos dois
3. Consultar doc Botpress sobre **como tornar um capture opcional** ou **adicionar botão de skip**
4. Só no fim comparar com a secção Q2 da v2 (`resposta-moreira-v2.md` linha 173+)
5. Redigir rascunho
6. Apresentar ao Eurico

### Observação pré-validação (não é resposta, é pista)

O `Human_Support_EN` tem uma `instructions[0]` de tipo `capture`, entityId `prompts://RawInput/v1`, com question "Please describe your query." — e depois `instructions[1]` com a question "Please upload a screenshot...". O mais provável é que a solução seja **tornar `instructions[1]` opcional** via property `skipIfAlreadyFilled` ou **adicionar choice com opção "Saltar"** ou **usar transitions**.

---

## Q3 — REPLICAÇÃO — **PENDENTE**

### Frase exacta do Moreira

> "REPLICAÇÃO: É viável usar este 'esqueleto' para várias empresas na versão gratuita do Botpress?"

### O que precisa de ser feito na sessão nova

1. Avaliar limites da versão gratuita Botpress Cloud (quantos bots, quanta KB, quantos users) — consultar doc oficial
2. Mapear o que é **genérico** no bot do Moreira vs o que é **específico**:
   - Genérico: estrutura 33 nodes PT/EN, RGPD, FAQ, menu, apoio humano — pode ser template
   - Específico POR CLIENTE: `AIRTABLE_PAT`, `BASE_ID`, `TABLE_ID`, conteúdo da KB, menu de serviços, contactos, horários, webhooks
3. Propor fluxo de replicação:
   - Export `.bpz` como template
   - Para cada cliente novo: import `.bpz`, editar 3 env vars, editar KB, editar identidade/branding
   - Tempo estimado por replicação: ? (precisa de experimentação)
4. Limites conhecidos:
   - Versão gratuita: 1 workspace? 1 bot? Confirmar
   - Se precisar workspace por cliente → cada cliente tem de criar conta Botpress e o Moreira é colaborador
5. Comparar com Q3 da v2

### Observação pré-validação (não é resposta)

Se o plano do Moreira é ser o **implementador único** (ele cria, ele gere), a estrutura mais simples é: **um workspace Botpress por cliente** (free tier tem 1 workspace por conta gratuita) + Moreira convidado como colaborador. Isto scale-a bem mas depende do cliente criar conta. Alternativa: Moreira cria todos os bots na sua conta e o cliente só acede via chatbot público — mas aí há lock-in, e o Moreira é tecnicamente o "owner" dos bots → resolver isto tem impacto directo em Q4 (autoria e controlo).

**Q3 e Q4 estão LIGADAS.** Não responder isoladamente sem pensar nas duas juntas.

---

## Q4 — AUTORIA E CONTROLO — **PENDENTE**

### Frase exacta do Moreira

> "AUTORIA E CONTROLO: Como integrar os seus anúncios e suporte técnico sem que eu perca a autoria e o controlo estratégico do chatbot?"

### O que precisa de ser feito na sessão nova

1. Entender o que o Moreira quer: ele quer **inserir os anúncios e suporte do Eurico dentro do chatbot dele**, sem deixar de ser o autor técnico e estratégico
2. Perceber o modelo de negócio: quem recebe o dinheiro quando um cliente do Moreira subscreve algo do Eurico? **NÃO inventar — só responder se ele propôs no briefing ou em conversas anteriores. Se não propôs, NÃO projectar modelo de negócio** (regra de memória `feedback_no_projected_business_models.md`)
3. Opções técnicas:
   - Adicionar uma secção no menu tipo "Ferramentas e formações" que linka para a comunidade do Eurico
   - Hook de afiliado (se houver)
   - Espaço dedicado no workflow que nunca é editado pelo Moreira
4. Comparar com Q4 da v2

### Regra crítica para Q4

**NÃO PROJECTAR MODELO DE NEGÓCIO** que o Moreira não pediu. Se a v2 inventou split de receita, parceria, revenue share ou preço, **NÃO REPETIR**. O Moreira só perguntou "como integrar anúncios e suporte sem perder autoria". Responder ao que foi perguntado, não mais.

---

## Q5 — AGENTE HUMANO VS BASEKNOWLEDGE — **PENDENTE**

### Frase exacta do Moreira

> "AGENTE HUMANO VS BASEKNOWLEDGE: No nó 'Apoio_Humano_PT', como posso garantir que a conversa de um agente humano se torne visível no chatbot, em vez de ser um texto retirado da base de conhecimento (Baseknowledge)?"

### O que precisa de ser feito na sessão nova

1. **Ler a config completa do `KnowledgeAgent`** no bot.json. Confirmei já:
   - `enabled = true`
   - `answerManually = true` ← **ISTO É CRÍTICO**. Esta flag significa "o KB Agent responde manualmente, não automaticamente"
2. Verificar se existe **human handoff integration** no Botpress gratuito (é feature premium?). Se não existir no tier free → dar alternativa
3. Interpretar o que o Moreira quer exactamente: ele quer **tirar a KB do caminho** quando o fluxo é "apoio humano". É possível que **a config actual dele JÁ esteja parcialmente correcta** (`answerManually=true` significa que o KB não responde sem confirmação manual)
4. Comparar com Q5 da v2

### Observação pré-validação (não é resposta)

A flag `answerManually=true` já indica que o Moreira fez bem parte do trabalho. A questão é: quando o utilizador está no fluxo `Apoio_Humano_PT`, **a KB ainda intercepta?** Ou a flag já desactiva isso?

---

## ERROS DA v2 — LISTA COMPLETA (NÃO REPETIR)

Até agora identifiquei 1 categoria de erros na v2 (Q1). Faltam validar os erros das Q2-Q5.

### v2 Q1 — 3 erros identificados

1. **Assume flag OFF sem verificar** — a flag `allowFileUpload` está TRUE, não é preciso "activar no Studio"
2. **Inventa regra inexistente** — "regra que desactiva upload para utilizadores identificados" não existe no Botpress
3. **Omite extensões + mobile** — não cobre os 2 vectores mais prováveis do problema

### Potenciais erros na v2 Q2-Q5

Ainda não validados. Ao entrar em cada questão, o agente novo deve:
1. Primeiro validar independentemente (com bot.json + docs)
2. Só no fim comparar com a v2 e listar erros
3. Registar no handoff seguinte

---

## REGRAS ESPECÍFICAS PARA A SESSÃO NOVA

### Antes de qualquer trabalho

1. Ler `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` — o briefing original do Moreira
2. Ler este handoff inteiro
3. Confirmar com o Eurico qual o próximo passo: aprovar Q1 primeiro? Ou atacar Q2?

### Ao validar cada questão

1. **Começar pela frase exacta** do Moreira (copiar, não resumir)
2. Consultar `bot.json` e `configUrl` antes de interpretar comportamentos
3. Cruzar com imagens do Moreira quando aplicável
4. Consultar doc oficial Botpress
5. **Só no fim** comparar com v2

### Tom das respostas para o Moreira

- PT-PT europeu, sem brasileirismos
- Formal-cordial (ele usa "Sr. Eurico Alves" + "Um abraço")
- Directo, entre pares — não professor, não vendedor
- Proibido: "curso", "fácil", "automático", "revolucionário", "garantido"
- Começar pelo que o Moreira fez BEM (Carnegie)
- Dar protocolo claro com passos ordenados e condições de paragem

### Gestão de ficheiros

- **NÃO sobrescrever** `resposta-moreira-v2.md`. É a referência histórica.
- **NÃO criar** `resposta-moreira-v3.md` até as 5 questões estarem validadas
- Se o Eurico quiser guardar rascunhos intermédios, usar: `02-prd/rascunho-q{N}-validado.md`
- Actualizar este handoff com o progresso (status de cada questão, erros da v2 identificados)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260421-q1-validada-q2-q5-pendentes.md`. ESTÁ DENTRO DA PASTA DO PROJECTO MOREIRA. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` E `.claude/rules/workspace-governance.md` PARA DETALHES.

---

## PRÓXIMA ACÇÃO RECOMENDADA

**Quando o Eurico retomar numa nova sessão:**

1. Primeira mensagem dele provavelmente será algo tipo "vamos continuar o Moreira" ou similar
2. Agente responde: "Li o handoff. Q1 tem rascunho pronto à espera de aprovação. Validamos Q1 primeiro (aprovar/ajustar) e depois atacamos Q2? Ou preferes outro caminho?"
3. Se o Eurico aprovar Q1 → guardar rascunho em `02-prd/rascunho-q1-validado.md` e iniciar Q2
4. Se o Eurico quiser editar Q1 → aplicar edições, re-validar, e só depois avançar

### Não fazer na primeira resposta da sessão nova

- Assumir que Q1 está aprovada — NÃO ESTÁ
- Tocar na v2 sem instrução explícita
- Atacar várias questões em simultâneo
- Criar `resposta-moreira-v3.md` sem autorização

---

## CHECKLIST DE SELF-AUDIT DESTE HANDOFF (passo obrigatório antes de entregar)

- [x] Path correcto: `membros/jose-moreira/handoffs/` ✅
- [x] Nomenclatura: `RETOMA-YYYYMMDD-slug.md` ✅
- [x] Data correcta: 20260421 (hoje é 21/04/2026) ✅
- [x] Aviso inicial da regra handoff-location incluído ✅
- [x] Lembrete do meio incluído ✅
- [x] Confirmação final (abaixo) incluída ✅
- [x] Todas as 5 questões referenciadas com frase EXACTA do Moreira ✅
- [x] Status de cada questão claro (Q1=rascunho validado/Q2-Q5=pendentes) ✅
- [x] Factos confirmados com path das fontes ✅
- [x] Erros da v2 listados ✅
- [x] Regras de tom e comunicação para Moreira incluídas ✅
- [x] Próxima acção clara ✅
- [x] Referência ao briefing original ✅
- [x] PT-PT ✅

### Pontos de risco que ficam no handoff

1. **Q3 e Q4 estão ligadas** — não responder isoladamente. Assinalado.
2. **Q5 pode já estar parcialmente resolvida pela config `answerManually=true`** — agente novo deve confirmar antes de propor fix. Assinalado.
3. **Dumps forenses em `auditoria-profunda-v2/working/*.txt`** são interpretações, não cru. Usar com cautela. Assinalado.
4. **NÃO PROJECTAR MODELO DE NEGÓCIO** na Q4 (regra activa). Assinalado.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** jose-moreira (José Moreira, cliente real do Eurico, Viana do Castelo)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260421-q1-validada-q2-q5-pendentes.md`
- **COINCIDEM?** SIM ✅

AGENTE RESPONSÁVEL: `ux-design-expert (Uma)`
DATA: 21/04/2026
TERMINAL: terminal anterior (a migrar para terminal novo devido a context low)
SESSÃO SEGUINTE: terminal limpo, aguardando Eurico

---

## ANEXOS — REFERÊNCIAS ÚTEIS PARA QUEM RECEBER

### Paths críticos (cwd base: `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt`)

| Propósito | Path relativo |
|-----------|---------------|
| Briefing Moreira | `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` |
| bot.json (fonte) | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/bot.json` |
| v2 (referência, NÃO USAR como base) | `membros/jose-moreira/02-prd/resposta-moreira-v2.md` |
| v1 (descontinuada) | `membros/jose-moreira/02-prd/respostas-5-questoes-moreira-v1-DESCONTINUADO.md` |
| Screenshots Moreira | `membros/jose-moreira/02-prd/auditoria-profunda-v2/working/user-chat-*.jpg` |
| Este handoff | `membros/jose-moreira/handoffs/RETOMA-20260421-q1-validada-q2-q5-pendentes.md` |
| Landing do Moreira (já publicada) | `membros/jose-moreira/04-landing/` + Vercel |
| Pesquisa mercado | `membros/jose-moreira/01-pesquisa/mapa-mercado-pme-industrial-viana.md` |

### URLs importantes

| URL | Propósito |
|-----|-----------|
| `https://files.bpcontent.cloud/2026/03/23/11/20260323112227-A7N2XPSU.json` | Config webchat público do Moreira (fetch para confirmar flags) |
| `https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=<url_acima>` | Link do chat público (testar em browser) |
| `https://botpress.com/docs/webchat/react-library/get-started` | Doc oficial Composer + allowFileUpload |
| `https://botpress.com/docs/cloud/getting-started/share-your-chatbot` | Doc shareable webchat |

### Disponibilidade Zoom do Moreira (do briefing)

| Dia | Horário |
|-----|---------|
| Ter 21/04 | A partir das 13:00 |
| Qui 23/04 | A partir das 18:00 |
| Sex 24/04 | A partir das 18:00 |
| Seg 20/04 | (já passou) |

---

## FIM DO HANDOFF

Se estás a ler isto numa sessão nova: **começa pela secção "PRÓXIMA ACÇÃO RECOMENDADA"** acima. Não avances sem aprovação explícita do Eurico sobre Q1.
