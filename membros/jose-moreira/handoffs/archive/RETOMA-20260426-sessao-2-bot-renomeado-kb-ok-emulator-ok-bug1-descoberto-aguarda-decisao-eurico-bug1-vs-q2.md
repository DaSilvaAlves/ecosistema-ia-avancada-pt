# RETOMA — Sessão 2 do dia 26/04: Bot renomeado, KB verificada, emulator OK, BUG 1 NOVO descoberto, aguarda decisão do Eurico (Opção A: corrigir BUG 1 primeiro vs Opção B: Q2 primeiro)

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
> **Este handoff é do projecto MOREIRA e está em `membros/jose-moreira/handoffs/` — localização correcta.**

---

## METADADOS

```yaml
from_agent: ux-design-expert (Uma)
to_agent: any (preferencialmente continuar com Uma para manter coerência de estado bot)
created: 2026-04-26 (sessão 2 do mesmo dia natural)
status: consumed
consumed: true
consumed_at: 2026-04-28T18:40:00+01:00
consumed_by: ux-design-expert (Uma) — Sessão 3 do dia 27-28/04 (terminal anterior fechou por update do PC, retomou tarde-noite 27/04 ~22:30 e parou madrugada 28/04 ~01:30, Eurico voltou às 18:37 para receber handoff)
project: jose-moreira (membros/jose-moreira/)
session_type: bot-renomeado-kb-verificada-emulator-ok-bug-novo-descoberto-aguarda-decisao-eurico
branch: main
cwd_previsto: C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\handoffs
handoff_anterior_CONSUMIDO_NESTA_SESSAO: RETOMA-20260426-bot-clonado-importado-no-botpress-cloud-pronto-para-q2.md (movido para archive/)
handoffs_PARALELOS_NAO_MEXER:
  - RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md (FLUXO PRD das 5 respostas — paralelo, NÃO mexer aqui)
next_critical_action: "PERGUNTAR AO EURICO IMEDIATAMENTE — Opção A (corrigir BUG 1 das variáveis vazias no welcome PRIMEIRO) ou Opção B (aplicar Q2 do capture File no Apoio_Humano_PT PRIMEIRO)? Depois executar com MICRO-PASSOS detalhados (Eurico precisa de click-by-click, tabula tudo)."
```

---

## AVISOS CRÍTICOS — LER ANTES DE QUALQUER COISA

### 1. EM QUE BOT ESTAMOS — confirmação técnica inegociável

| Recurso | ID | Onde vive | Estado |
|---------|-----|-----------|--------|
| Bot **CLONE** (onde mexemos) | `f75bba80-2ca0-4143-a412-1cc8280919ce` | `Eurico Alves's Workspace` (do Eurico) | ACTIVO — renomeado para `Moreira-v1-trabalho` |
| Bot **ORIGINAL** do Moreira | `e7e5db81-ad3c-45e2-bf25-033d76b04059` | Workspace do Moreira (sem acesso nosso) | INTOCÁVEL |
| Pacote `.bpz` original | — | `membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz/` | INTOCÁVEL — referência |
| Pacote `.bpz` clone descompactado | — | `membros/jose-moreira/03-codigo/v1-trabalho.bpz/` | mantém para diff |
| Pacote `.bpz` clone re-zipado (importado) | — | `membros/jose-moreira/03-codigo/Moreira-v1-trabalho.bpz` | foi importado no Cloud com sucesso |

**URL do bot clone no Studio:** `https://studio.botpress.cloud/f75bba80-2ca0-4143-a412-1cc8280919ce/flows/wf-main`

### 2. DOIS FLUXOS PARALELOS MOREIRA — NÃO CONFUNDIR

- **Fluxo PRD (RETOMA 25/04):** consolidação `resposta-moreira-v3.md` aguarda 4 decisões META do Eurico (mapa mercado v2, 4 pontos urgentes .bpz, agenda Zoom, próximos passos). **NÃO MEXER aqui.**
- **Fluxo BOT (este handoff + handoff anterior consumido):** clone do `.bpz` + import no Botpress Cloud + corrigir bugs no Studio. **ESTE é o que está activo.**

### 3. ERRO DE RACIOCÍNIO QUE A AGENTE ANTERIOR (UMA) FEZ NESTA SESSÃO — NÃO REPETIR

**Erro cometido:** A Uma decidiu unilateralmente "ignoramos o BUG 1 das variáveis vazias porque está fora do scope das 5 Qs do PRD". O Eurico corrigiu explicitamente:

> _"bom afinal estamos a mecher em que bot? pensava que tinhamos colonado, quer dizer se tem bugs com bugs vai ficar"_

**Princípio correcto que o agente novo DEVE seguir:**
- O propósito do clone é **corrigir tudo o que se descobre como bug**, não apenas as 5 Qs do PRD.
- As 5 Qs são o **ponto de partida** (vinham do PRD validado), mas qualquer bug descoberto durante navegação/teste é **candidato a fix nesta sessão**.
- Cada fix vai a `mandatory-change-log.md`.
- **Antes de filtrar inputs**, confirmar com o Eurico — não decidir sozinho.

### 4. EURICO PRECISA DE MICRO-PASSOS (CLICK-BY-CLICK)

Citação directa nesta sessão:

> _"OK MAS AGORA NÃO ENTEDO NADA PRECISO DE UM PASSO A PASSO BEM DETALHADO"_

**Lições aprendidas:**
- Listar AC + tempos estimados não basta — Eurico precisa de instruções de "clica neste botão", "escreve este texto", "carrega Enter", "espera X segundos".
- Sempre dar UM passo de cada vez. Esperar confirmação ("feito" ou screenshot) antes de avançar.
- Em screenshots, descrever o que se vê na resposta para confirmar alinhamento.
- Se algo correr mal, perguntar antes de improvisar.

### 5. NÃO VIOLAR REGRAS ACTIVAS

- `feedback_moreira_no_hallucinations.md` — zero invenção; só `bot.json` clonado ou doc oficial Botpress contam
- `feedback_no_projected_business_models.md` — zero preço/parceria/split inventado
- `mandatory-change-log.md` — toda alteração ao bot vai a tabela "Antes / Depois" + commit
- `language-standards.md` — PT-PT formal-cordial (Moreira tratou Eurico por "Sr. Eurico Alves")
- `handoff-location.md` — handoffs do Moreira vivem em `membros/jose-moreira/handoffs/` (3 blocos obrigatórios)

---

## ESTADO ACTUAL — RESUMO EXECUTIVO

### O que foi feito na Sessão 2 (26/04, ~22:30-23:30)

| # | Acção | Onde | Estado |
|---|-------|------|--------|
| 1 | Renomeado bot `New Agent` → `Moreira-v1-trabalho` via Bot Settings → "Chatbot Name" | Botpress Cloud Studio | ✅ confirmado por screenshot (header em cima passou a `Moreira-v1-trabalho` após F5) |
| 2 | Verificada Knowledge Base | Botpress Cloud Studio (sidebar livro 📖) | ✅ existe `Imported Knowledge Base 1` (URL `/kb/kb_01KQ38AADREHZE86ZGEVZ0ZFTD`) com **1 entrada Rich Text File criada há 21 dias** (bate com export Moreira de 15/Abril); **status `Disabled`** com bullet rosa — não foi activada |
| 3 | Teste emulator com `olá` | Botpress Cloud Studio (painel direito) | ✅ bot arrancou, transitou `Mensagem_ao_Cliente` → `PoliticaPrivacidade`, política renderizou em PT+EN, botões `Aceito/I Accept` + `Recuso/I Decline` apareceram, está a aguardar input no `Capturing Variable respostaPolitica` |
| 4 | Aplicar Q2 (capture File no Apoio_Humano_PT) | NÃO COMEÇADO | ❌ aguarda decisão Eurico (A vs B) |
| 5 | Diagnosticar BUG 1 (variáveis vazias welcome) | NÃO COMEÇADO | ❌ aguarda decisão Eurico (A vs B) |

### O que NÃO foi feito (próximo)

- ❌ Decidir Opção A (BUG 1 primeiro) vs Opção B (Q2 primeiro) — **ESTE É O BLOQUEADOR**
- ❌ Aplicar BUG 1 ou Q2 conforme decisão
- ❌ Investigar status `Disabled` da KB (bug ou escolha?)
- ❌ Re-export do bot corrigido como `Moreira-v1-trabalho-com-q2-aplicado.bpz` (só depois de Q2 aplicado)

---

## BUGS IDENTIFICADOS — REGISTO LIMPO

| # | Bug | Onde | Severidade | Origem | Plano |
|---|-----|------|------------|--------|-------|
| 1 | Variáveis `{{workflow.greeting}}`, `{{dataAtual}}`, `{{horaAtual}}` aparecem **vazias** no welcome PT+EN ("! Hoje é e são . Como posso ajudar?" / "Good evening! Today is and it is . How can I help you?") | Flow `Mensagem_ao_Cliente`, nó "Display Current Date and Time with Greeting in Portuguese" | **ALTA** — primeira coisa que utilizador vê | Existia no original; herdado pelo clone | Diagnosticar Action JS / Hook que devia popular variáveis. Aguarda decisão A vs B. |
| 2 | `capture File` no `Apoio_Humano_PT` encalha utilizador se não anexar (Q2 do PRD) | Flow `Apoio_Humano_PT` (e gémeo `Human_Support_EN`) | **ALTA** — bloqueia handoff humano | Existia no original; bug conhecido (rascunho-q2-validado.md) | Inserir Capture Information com Choice Sim/Não antes do capture File; mover capture File para ramo "Sim". 20-30 min PT+EN. Aguarda decisão A vs B. |
| 3 | KB importou como `Disabled` (bullet rosa visível no canto superior direito do painel KB) | Imported Knowledge Base 1 | **MÉDIA** — KB existe mas bot não a usa para responder | Pode ter sido escolha do Moreira no export ou efeito do import; **a investigar** | Investigar: ver bot.json original `embed.kb*` ou propriedades da KB. Decidir se activamos. Próxima sessão. |

**Bugs adicionais possíveis** que ainda NÃO foram identificados visualmente (estimativa baseada em leitura da auditoria 20/04):
- Sub-menus podem ter inconsistências PT vs EN (réplicas que divergiram)
- Hooks Llmz custom (2 hooks, ainda não inspeccionados)
- Variáveis `clientName`/`ClientName` (capitalização inconsistente — duplicadas?)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260426-sessao-2-bot-renomeado-kb-ok-emulator-ok-bug1-descoberto-aguarda-decisao-eurico-bug1-vs-q2.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## DECISÃO PENDENTE DO EURICO — APRESENTAR LOGO NA SESSÃO NOVA

**Pergunta para o Eurico:** "Sr. Eurico, antes de continuar a corrigir o bot, preciso da sua decisão. Encontrámos 2 bugs altos que precisam de fix. Por qual quer que comecemos?"

### Opção A — Corrigir BUG 1 primeiro (recomendado pela Uma)

**Acção:** Diagnosticar nó "Display Current Date and Time with Greeting in Portuguese" no flow `Mensagem_ao_Cliente`. Provavelmente é uma Action JS que usa variáveis nunca declaradas, ou um hook que devia correr antes mas não corre.

**Tempo estimado:** 10-15 min para diagnóstico + 5-10 min para fix.

**Por que recomendado:** BUG 1 é a **primeira coisa** que o utilizador vê quando arranca o bot. Se entregamos o `.bpz` ao Moreira com Q2 corrigido mas o welcome diz `"Hoje é e são ."`, o Moreira fica imediatamente desconfiado da qualidade. Impacto na percepção é maior do que Q2.

### Opção B — Aplicar Q2 primeiro (priority contratual do PRD)

**Acção:** Inserir Capture Information com Choice Sim/Não antes do `capture File` no nó `Apoio_Humano_PT`; replicar em `Human_Support_EN`. Detalhe técnico está em `02-prd/rascunho-q2-validado.md`.

**Tempo estimado:** 20-30 min para PT+EN + 5 min para teste emulator.

**Por que B faz sentido:** Q2 é o que o Moreira validou no PRD. Tem prioridade contratual.

### Opção C — Ambos na mesma sessão (se houver tempo)

**Acção:** Bug 1 (15 min) → testar → Q2 (30 min) → testar → re-export.

**Tempo total estimado:** ~60 min se tudo correr bem.

---

## CONTEXTO TÉCNICO — para o agente novo

### Nó "Display Current Date and Time" — referência para BUG 1

Vive em flow `Mensagem_ao_Cliente`. No canvas mostra o ícone ⚡ (raio) + `</>`. É um Card que executa código JavaScript. O código devia popular as variáveis:
- `workflow.greeting` (ex: "Olá", "Bom dia")
- `dataAtual` (ex: "26/04/2026")
- `horaAtual` (ex: "23:30")

Para diagnosticar, abrir o nó (duplo clique) e ver o JavaScript dentro. Provavelmente:
- Variáveis não estão declaradas no schema do bot
- Hook que devia correr antes não corre
- Código tem typo ou referência a API que não existe

Variáveis visíveis na sidebar Variables (todas "Not set"):
- `handoff` (CONVERSATION)
- `clientEmail`, `ClientEmail`, `clientName`, `ClientName`, `dataAtual`, `horaAtual` (WORKFLOW)

**Dica:** `clientName` (lowercase c) e `ClientName` (PascalCase) ambas existem — sintoma de inconsistência. Pode estar relacionado com o BUG 1 (script usa `dataAtual` mas talvez devesse ser `DataAtual` ou similar). VERIFICAR.

### Nó `Apoio_Humano_PT` — referência para Q2

Estado actual no flow (do `02-prd/rascunho-q2-validado.md`):
1. Capture Information: *"Por favor, descreva a sua dúvida."* (texto livre)
2. Capture File: *"Se desejar, pode anexar aqui um print screen ou documento sobre o problema."* ← **encalha aqui**
3. Mensagem: *"Um assistente entrará no chat em breve."*

Estado desejado após Q2:
1. Capture Information: *"Por favor, descreva a sua dúvida."* (igual)
2. **NOVO** Capture Information com Choice Sim/Não:
   - Pergunta: *"Quer anexar um print ou documento sobre o problema?"*
   - Choice 1: `Sim, quero anexar` / value `sim`
   - Choice 2: `Não, seguir para o agente` / value `nao`
3. Branch condicional:
   - Se `sim` → Capture File (existente) → Mensagem assistente
   - Se `nao` → Mensagem assistente directamente

Replicar em `Human_Support_EN` com:
- Question: *"Do you want to attach a screenshot or document about the issue?"*
- Choice 1: `Yes, I want to attach` / `yes`
- Choice 2: `No, proceed to agent` / `no`

**Onde está no canvas:** RETOMA anterior confirmou que `Apoio_Humano_PT` existe no canvas como sub-menu junto a `Pagamentos`, `Suporte_Tecnico`, `Entrega_e_Prazos` etc. **Está fora do viewport actual** — agente novo precisa de fazer **zoom out (Ctrl + −)** ou usar **fit to screen** para encontrá-lo.

---

## CITAÇÕES EXACTAS DO EURICO — Sessão 2 (26/04 ~22:30-23:30)

Por ordem cronológica:

1. _"OK MAS AGORA NÃO ENTEDO NADA PRECISO DE UM PASSO A PASSO BEM DETALHADO"_ (após primeira tentativa de explicar plano completo de uma vez)

2. _"HUMMM NÃO ME PARECE"_ (depois de Uma confirmar que renomeação foi feita — Eurico desconfiou porque o header ainda dizia "New Agent" antes do refresh)

3. _"TÁ"_ (depois do refresh F5 e o header mudar para `Moreira-v1-trabalho`)

4. _"bom afinal estamos a mecher em que bot? pejnsava que tinhamos colonado, quer dizer se tem bugs com bugs vai ficar NÃO mexemos — está fora das 5 Qs do Moreira (anotamos para handoff futuro: Q-extra: variáveis de data/hora vazias no welcome)."_ (Eurico desafiou a decisão da Uma de "não mexer" no BUG 1 — REPREENSÃO LEGÍTIMA, agente novo deve aprender com isto)

5. _"eu assim não tenho condições para continuar, nada disso, vamos migrar para outro terminal este já está a dar barraca, contexto very low, assim não saimos daqui. prepara um HANDOFF bem detalhado com estes pontos e continuar sem enganos e sem estas confusãoe., afinal andamos a fazer sem saber ao certo o que estamos a fazer. HANDOFF"_ (decisão final de migrar terminal)

---

## ALTERAÇÕES APLICADAS NESTA SESSÃO 2 — registo linha-a-linha (regra `mandatory-change-log.md`)

### Filesystem (host)

| # | Path | Antes | Depois | Razão |
|---|------|-------|--------|-------|
| 1 | `membros/jose-moreira/handoffs/RETOMA-20260426-sessao-2-bot-renomeado-kb-ok-emulator-ok-bug1-descoberto-aguarda-decisao-eurico-bug1-vs-q2.md` | não existia | criado (este ficheiro) | Novo handoff da Sessão 2 |
| 2 | `membros/jose-moreira/handoffs/RETOMA-20260426-bot-clonado-importado-no-botpress-cloud-pronto-para-q2.md` | `consumed: false`, status `pending`, na pasta pending | `consumed: true`, status `consumed`, movido para `archive/` | Handoff anterior foi consumido por esta Sessão 2 (renomeação + KB + emulator executados) |
| 3 | `docs/HANDOFF-INDEX.md` | tabela Pending tinha linha do RETOMA antigo de 26/04 | linha removida de Pending; nova linha adicionada no topo de Pending para este RETOMA; linha antiga adicionada em Archived | Sincronização com regra `handoff-central.md` |

### Botpress Cloud Studio (bot `f75bba80-2ca0-4143-a412-1cc8280919ce`)

| # | Recurso | Antes | Depois | Como |
|---|---------|-------|--------|------|
| 4 | Bot name | `New Agent` | `Moreira-v1-trabalho` | Bot Settings → secção General options → Chatbot Name → editado + Enter |
| 5 | KB status | (não verificado antes) | confirmado: `Imported Knowledge Base 1`, 1 Rich Text File há 21 dias, status `Disabled` (bullet rosa) | Sidebar 📖 → click → painel KB |
| 6 | Emulator state | sem conversa | conversa iniciada com `olá`; transitou `Mensagem_ao_Cliente` → `PoliticaPrivacidade`; está a aguardar input em `Capturing Variable respostaPolitica` | Painel direito Emulator → Type a message → `olá` → Enter |

### Bugs descobertos

| # | Bug | Severidade | Acção pendente |
|---|-----|------------|----------------|
| BUG 1 (NOVO) | Variáveis vazias no welcome | ALTA | Aguarda decisão Opção A vs B do Eurico |
| BUG 2 (Q2 conhecido) | capture File encalha no Apoio_Humano_PT | ALTA | Aguarda decisão Opção A vs B do Eurico |
| BUG 3 | KB Disabled após import | MÉDIA | Investigar próxima sessão |

---

## CAMINHOS DE FICHEIROS RELEVANTES

```
membros/jose-moreira/
├── Clientes_Chatbot - 2026 Apr 15.bpz/   ← ORIGINAL — INTOCÁVEL
│   └── bot.json                           (268 KB — contém AIRTABLE_PAT)
├── 02-prd/
│   ├── rascunho-q1-validado.md            (UPLOAD QUE SOME — diagnóstico)
│   ├── rascunho-q2-validado.md            (SKIP NO APOIO HUMANO — fonte do plano Q2)
│   ├── rascunho-q3-validado.md            (REPLICAÇÃO — não mexe bot)
│   ├── rascunho-q4-validado.md            (AUTORIA — não mexe bot)
│   ├── rascunho-q5-validado.md            (AGENTE HUMANO VS KB — não mexe bot)
│   └── resposta-moreira-v3.md             (PRD consolidado — fluxo PARALELO, não mexer)
├── 03-codigo/
│   ├── v1-trabalho.bpz/                   ← clone descompactado (mantém para diff)
│   └── Moreira-v1-trabalho.bpz            ← zip importado no Cloud
└── handoffs/
    ├── RETOMA-20260420-auditoria-profunda-v2.md   (referência)
    ├── RETOMA-20260420-auditoria-real-bot-moreira.md (referência)
    ├── RETOMA-20260425-revisao-5-respostas-completa-aguarda-4-decisoes-meta.md (FLUXO PRD — não mexer)
    ├── RETOMA-20260426-sessao-2-bot-renomeado-kb-ok-emulator-ok-bug1-descoberto-aguarda-decisao-eurico-bug1-vs-q2.md  ← ESTE
    └── archive/
        └── RETOMA-20260426-bot-clonado-importado-no-botpress-cloud-pronto-para-q2.md  (consumido nesta Sessão 2)
```

---

## PRÓXIMA ACÇÃO CRÍTICA — para o agente que recebe na sessão nova

**Para o agente que arranca a Sessão 3 (provavelmente Uma novamente para manter coerência):**

### Passo 0 — Activação

1. **Ler este RETOMA INTEIRO** (todas as secções acima)
2. **Ler `02-prd/rascunho-q2-validado.md`** (fonte técnica do Q2)
3. **NÃO ler** o RETOMA archived a menos que precises de detalhes do clone+import (já estão resumidos aqui)

### Passo 1 — Saudar Eurico e apresentar a decisão

Em PT-PT formal-cordial, dizer algo como:

> "Sr. Eurico, retomei a sessão. Estado: bot `Moreira-v1-trabalho` (clone `f75bba80-...`) está renomeado, KB tem 1 entrada Rich Text File mas veio Disabled, emulator confirmou que motor arranca. Identifiquei 2 bugs altos para corrigir: BUG 1 (variáveis vazias no welcome — `{{workflow.greeting}}`, `{{dataAtual}}`, `{{horaAtual}}`) e BUG 2 (Q2 — capture File encalha no Apoio_Humano_PT). Por qual prefere começar — Opção A (BUG 1 primeiro), Opção B (Q2 primeiro), ou Opção C (ambos)?"

### Passo 2 — Conforme escolha

**Se A (BUG 1):**
1. Pedir ao Eurico para localizar nó "Display Current Date and Time with Greeting in Portuguese" no flow `Mensagem_ao_Cliente` (canvas wf-main, perto do Start)
2. Pedir screenshot do nó aberto (duplo clique)
3. Inspeccionar JavaScript dentro
4. Diagnosticar e corrigir
5. Re-testar `olá` no emulator

**Se B (Q2):**
1. Pedir ao Eurico para fazer zoom out no canvas (Ctrl + − várias vezes ou botão `−` no canto inferior direito)
2. Localizar visualmente nó `Apoio_Humano_PT` (entre os sub-menus PT, perto de `Pagamentos`/`Suporte_Tecnico`)
3. Pedir screenshot
4. Abrir nó (duplo clique)
5. Pedir screenshot dos Cards dentro
6. Inserir novo Capture Information com Choice Sim/Não antes do capture File (instruções click-by-click)
7. Mover transição: capture File só dispara se Sim
8. Replicar em `Human_Support_EN`
9. Re-testar emulator

**Se C (ambos):** A → testar → B → testar → re-export.

### Passo 3 — Re-export quando todos os bugs estiverem corrigidos

Sidebar Botpress icon → Import / Export → **Export** → guardar como `03-codigo/Moreira-v1-trabalho-com-bugs-corrigidos.bpz`.

### Passo 4 — Criar próximo handoff

Marcar este RETOMA como consumed + mover para archive + criar novo RETOMA com os bugs corrigidos + decidir com Eurico se entregamos `.bpz` ao Moreira ou esperamos pelas 4 decisões META do fluxo PRD paralelo.

---

## REGRAS ACTIVAS PARA QUALQUER TRABALHO MOREIRA

1. PT-PT formal-cordial (Moreira tratou Eurico por "Sr. Eurico Alves" + "Um abraço"). Manter "o Sr.", evitar "tu" com Moreira.
2. Regra `feedback_no_projected_business_models` — não inventar preço/parceria/split.
3. Regra `feedback_moreira_no_hallucinations` — zero invenção. Só `bot.json` ou doc oficial Botpress contam.
4. Sem termos proibidos: "curso", "fácil", "automático", "revolucionário", "garantido".
5. Trabalhar SEMPRE no clone (`f75bba80-...`) — NUNCA no bot original do Moreira.
6. Cada alteração ao bot tem de constar em handoff próximo seguindo `mandatory-change-log.md`.
7. **Eurico precisa de MICRO-PASSOS click-by-click** — nunca dar plano completo de uma vez.
8. **Antes de filtrar inputs/decisões**, perguntar ao Eurico — não decidir sozinho que algo está fora de scope.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `jose-moreira` (membros/jose-moreira/)
- LOCALIZAÇÃO CORRECTA: `membros/jose-moreira/handoffs/`
- LOCALIZAÇÃO ACTUAL: `membros/jose-moreira/handoffs/RETOMA-20260426-sessao-2-bot-renomeado-kb-ok-emulator-ok-bug1-descoberto-aguarda-decisao-eurico-bug1-vs-q2.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: ux-design-expert (Uma)
DATA: 26/04/2026 (Sessão 2 — terminada por contexto baixo + frustração legítima do Eurico com erro de raciocínio do agente)

---

*Fim do handoff — agente novo: lê tudo, apresenta Opção A/B/C ao Eurico, executa com micro-passos. NÃO repetir erros desta sessão.*
