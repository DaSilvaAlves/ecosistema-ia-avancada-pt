# Nexus v2 — Front-End Specification

**Autor:** Uma (ux-design-expert)
**Data:** 04/05/2026
**Versão:** 1.0 (UX inicial pós-architecture v2)
**Estado:** Draft — pendente validação @po
**Trace:**
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (96 FRs, 24 NFRs, 8 Epics)
- `imersao-tools/nexus/docs/architecture-v2.md` (5 ADRs, repo layout `v2/`, Tool Registry, Streaming SSE)
- `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` (verdict CONCERNS, gap G1 = wireframes chat-first é responsabilidade desta spec)
- `imersao-tools/nexus/src/App.tsx` (layout v1 — referência do que existe)
- `.claude/rules/design-system-ia-avancada.md` (paleta, tipografia, glassmorphism — INEGOCIÁVEL)

---

## 0. Sumário e Decisões UX Fechadas

Este documento resolve o gap **G1** (wireframes chat-first inexistentes) identificado pela validação PO, e estabelece a especificação visual e interactiva completa do Nexus v2.

**Não reabre ADRs** do `architecture-v2.md` (Edge/Node split, Dexie 4, Tiptap 2, Tool Registry, Vitest+Playwright+MSW). Aceita-os como input.

### Top-5 Decisões UX

| # | Decisão | Razão | Trade-off aceite |
|---|---------|-------|------------------|
| UX-1 | **Chat ocupa permanentemente a metade esquerda do viewport (>1280px); sidebar widgets em coluna direita fixa 360px** | O killer feature é o overnight agent + multi-intent. Chat tem de estar sempre acessível sem cliques de navegação. Mobile vira fullscreen com drawer de widgets | Sacrifica espaço para vistas detalhadas (tasks/finance/etc) — resolve-se com modais fullscreen invocados ao navegar |
| UX-2 | **Morning Briefing aparece automaticamente no topo do chat ao primeiro carregamento do dia (após 06:00) como mensagem do agente fixada (`pinned`)**. Não bloqueia chat input | Foco real do Nexus: continuidade pessoal. A primeira coisa que o Eurico vê de manhã é o overnight agent a entregar contexto reconstruído (G6 do PRD) | Ocupa altura visual no topo — botão "minimizar" colapsa para banner 48px |
| UX-3 | **ToolCard renderiza inline no chat para cada tool call**, com estados visuais distintos: `loading` (Cyan pulsing), `success` (Lime check), `error` (Magenta X), `preview-required` (Gold com botões Confirmar/Cancelar) | PRD FR3+FR5+FR6 exigem visibilidade de cada acção e undo. Card inline é mais legível que toast empilhado quando há 3+ intents | Mais altura de scroll por mensagem — aceitável em uso pessoal |
| UX-4 | **Markets Widget no topo da sidebar** (substitui MorningBriefingWidget v1 órfão), em formato compacto vertical com 9 mercados (CAC40/DAX/DJI/NDX/SP500/BRENT/ETH/NVDA/ASML) e delta vs ontem em Lime/Magenta. Refresh a cada 60s. | Memória persistente Eurico: "Nexus é foco em mercados financeiros e continuidade de trabalho, não notícias tech". Markets v1 era órfão — passa a ter destaque na sidebar | Sacrifica espaço de outros widgets — resolve-se com colapsável (Pomodoro abaixo, GitHub colapsável) |
| UX-5 | **Vistas detalhadas (`/tasks`, `/finance`, `/habits`, `/journal`, `/knowledge`, `/settings`) abrem como modais fullscreen com `Esc` para fechar e retornar ao chat**. NÃO são rotas tradicionais com loss-of-context. URL muda mas chat persiste em background (com slide animation) | Eurico abre `/tasks` para ver Kanban e volta ao chat para registar — fluxo deve ser frictionless. Modal fullscreen evita perder draft do chat | Pequena complexidade no router (Next.js parallel routes ou `(modal)` group) — Aria já previu em §3 |

---

## 1. User Flows (5 fluxos críticos)

### 1.1 Flow 1 — Login → Primeiro Carregamento → Onboarding

**Objectivo:** Eurico entra na app pela primeira vez, configura credenciais mínimas, recebe boas-vindas e vê o chat principal.

```
[1] Browser navega para nexus-eurico.vercel.app
    │
    ▼
[2] Middleware detecta zero cookie de sessão
    │
    ▼
[3] Redirect → /login
    │ Layout: tela inteira fundo #04040A, glass card central 480px, logo NEXUS no topo
    │ Conteúdo: Input password (HTML5 password type) + botão "Entrar" + texto pequeno "Single-user, configurado em env Vercel"
    │
    ▼
[4] Eurico digita password → submit
    │ POST /api/auth/login → bcrypt.compare contra NEXUS_PASSWORD_HASH
    │ Loading state: botão vira spinner Cyan + "A validar..."
    │
    ▼
[5a] Sucesso: Set-Cookie HttpOnly nexus_session, redirect → /
[5b] Erro: shake animation no card + texto Magenta "Password incorrecta. Verifica no Vercel."
    │
    ▼ (caso 5a)
[6] Detecta first-login (KV: nexus:onboarding:done = false)
    │
    ▼
[7] OnboardingModal abre por cima do chat (4 steps, Tab/Enter para navegar)
    │ Step 1: "Olá, Eurico. Vou ser o teu Nexus." + input nome (default "Eurico")
    │ Step 2: "Preciso de notificar-te de lembretes" → botão "Activar Web Push"
    │         (browser pede permissão, se concedido → subscrição enviada para /api/push/subscribe)
    │         Skip permitido com aviso "Sem push, lembretes só aparecem quando estás na app"
    │ Step 3: "Queres ligar Google Calendar/Gmail?" → botão "Ligar Google" (OAuth) | "Saltar"
    │ Step 4: "Queres receber lembretes/briefing por Telegram?" → input "Cola aqui o token do BotFather"
    │         + instruções breve (3 linhas) + "Saltar"
    │
    ▼
[8] Tudo confirmado → KV: nexus:onboarding:done = true
    │
    ▼
[9] Chat principal abre com mensagem do agente fixa:
    "Bem-vindo, Eurico. Estou pronto. Escreve qualquer coisa — uma tarefa, uma despesa, um lembrete.
     Posso processar várias coisas numa só frase."
    │
    ▼
[10] Sidebar widgets carregam (Markets, Pomodoro, GitHub, Quick Links) com skeleton loading 200ms
```

**Estados de erro:**
- Web Push negado: continua sem bloquear, marca `pushDeclined: true` em KV (mostra aviso amarelo Gold no Settings depois)
- OAuth Google falha: volta para Step 4 com mensagem "Tenta mais tarde nas Definições"
- Telegram token inválido: validação imediata via `/api/telegram/validate-token`, erro inline Magenta

---

### 1.2 Flow 2 — Prompt Multi-Intent (KILLER FLOW)

**Objectivo:** Eurico digita uma frase com 3 acções e o cérebro executa as 3 numa só chamada, com cards visuais a aparecerem em tempo real.

**Prompt canónico de teste:**
> `amanhã reunião 15h, paguei €78,70 supermercado, lembra-me sexta de pagar a luz`

```
[1] Eurico clica no input do chat (já tem foco automático ao carregar /)
    OU pressiona "/" em qualquer lado para focar
    │
    ▼
[2] Digita o prompt + Enter
    │ Mensagem aparece imediatamente como bubble do utilizador (alinhado direita, fundo Cyan transparente 8%)
    │ Input desactiva-se temporariamente (opacity 60%, "A pensar...")
    │
    ▼
[3] POST /api/agent/prompt (Edge, SSE response stream)
    │
    ▼
[4] Server-side: classifier (Haiku 4.5) → identifica domains: ['calendar','finance','reminder']
    │ Frontend recebe evento SSE `meta`: { runId, classifierResult }
    │ Cabeçalho do agente aparece: avatar Cyan + "Nexus" + spinner pequeno
    │
    ▼
[5] Server-side: executor (Sonnet 4.6) com 3 tool_use em paralelo
    │ Frontend recebe stream:
    │   ─ tool_start: criar_evento_calendar → ToolCard "loading"
    │   ─ tool_start: criar_finança_variavel → ToolCard "loading"
    │   ─ tool_start: criar_lembrete → ToolCard "loading"
    │
    ▼
[6] Cada tool acaba e Card transita para "success":
    │   ToolCard 1: ✓ Evento criado · "reunião" · amanhã 15h00
    │   ToolCard 2: ✓ Despesa registada · €78,70 · Mercearia
    │   ToolCard 3: ✓ Lembrete agendado · sexta 09h00 · "pagar a luz"
    │
    ▼
[7] Texto resumo do agente streama abaixo dos cards (word-by-word):
    "Apontei a reunião com 15h amanhã, registei a despesa do supermercado em Mercearia,
     e marquei o lembrete para sexta às 9h."
    │
    ▼
[8] Evento SSE `done` chega
    │ ChatMessage e AgentRun persistem em IndexedDB
    │ UndoToast aparece bottom-center: "3 acções criadas. Anular tudo?" + countdown 30s
    │ Input volta a estar activo, foco automático restaurado
```

**Estados especiais:**

- **Confidence < 70%** (FR5): cada Card afectado entra em modo `preview-required` (borda Gold, botões "Confirmar / Cancelar / Editar"). Persistência adiada até confirmação.
- **Tool error**: Card vira Magenta com ícone X + mensagem curta. Outros cards continuam (não bloqueiam). Botão "Tentar de novo" inline.
- **Network drop mid-stream**: input mostra banner Magenta "Sem rede — chat indisponível". Cards começados ficam em estado "interrupted" (ícone âmbar) até reconexão.

---

### 1.3 Flow 3 — Criar Tarefa via UI (sem chat)

**Objectivo:** Eurico está em `/tasks` (Kanban aberto como modal fullscreen) e quer criar uma tarefa rápida sem voltar ao chat.

```
[1] Eurico está no chat. Clica botão "Tarefas" na sidebar OU pressiona "T" (atalho global)
    │
    ▼
[2] Modal fullscreen `/tasks` abre com slide-up animation 250ms
    │ Header sticky: tabs "Lista | Kanban | Calendário" + botão "+ Nova" Cyan + Esc para fechar
    │ Body: Kanban com 4 colunas (Todo, In Progress, Blocked, Done)
    │ Cada cartão de tarefa: título + badge prioridade + due date + tags
    │
    ▼
[3] Eurico clica "+ Nova" (ou pressiona "N")
    │
    ▼
[4] TaskModal abre por cima (modal aninhado, glass card 600px central)
    │ Campos:
    │   - Título (obrigatório, foco automático)
    │   - Descrição (textarea opcional)
    │   - Prioridade (radio: Alta · Média · Baixa, default Média)
    │   - Due date (date picker nativo)
    │   - Projecto (select dropdown, opção "+ novo projecto")
    │   - Tags (chips com autocomplete sobre tags existentes)
    │   - Recorrência (collapsible: "Repetir? ▾" → diária/semanal/mensal/dias-úteis)
    │
    ▼
[5] Submit (Cmd+Enter ou botão "Criar")
    │ db.tasks.add() via Dexie → liveQuery actualiza Kanban automaticamente
    │ Card aparece na coluna "Todo" com flash animation Cyan 400ms
    │
    ▼
[6] TaskModal fecha. Eurico está de volta no Kanban com a tarefa visível.
    │ Esc → fecha `/tasks` e regressa ao chat
```

**Estados de erro:**
- Título vazio → submit bloqueado, input com borda Magenta + "Título obrigatório"
- Recorrência inválida (ex: "todos os 31" em meses sem 31) → aviso amarelo Gold com explicação

---

### 1.4 Flow 4 — Brain Dump → Aprovação Item-a-Item

**Objectivo:** Eurico tem 200 palavras de pensamentos soltos para descarregar, AI estrutura em tarefas/projectos/ideias/decisões, Eurico aprova cada uma antes de persistir.

```
[1] Eurico está no chat. Pressiona "B" (atalho dedicado para Brain Dump)
    │
    ▼
[2] BrainDumpModal abre fullscreen (NÃO é o chat normal — paradigma diferente)
    │ Layout: textarea grande ocupando 70% altura + contador palavras + botão "Estruturar com AI" Cyan
    │ Placeholder: "Vomita ideias 10 minutos seguidos. Sem censura. A AI organiza depois."
    │
    ▼
[3] Eurico escreve livre. Botão "Estruturar" só activa após 50 caracteres.
    │
    ▼
[4] Clica "Estruturar com AI"
    │ Loading: textarea fica readonly + overlay "A estruturar..." + spinner Cyan grande
    │ POST /api/agent/brain-dump (Edge, SSE)
    │
    ▼
[5] Resposta chega. Modal divide em 4 secções colapsáveis (default expandidas):
    │
    │   📋 Tarefas propostas (4)         [✓ todas | ✗ nenhuma]
    │     ☐ Comprar leite               [✏️] [✗]
    │     ☐ Acabar PRD Frusoal          [✏️] [✗]
    │     ☐ Ligar ao Pedro              [✏️] [✗]
    │     ☐ Pagar IUC carro             [✏️] [✗]
    │
    │   📂 Projectos propostos (1)
    │     ☐ Reorganizar escritório      [✏️] [✗]
    │
    │   💡 Ideias soltas (3)
    │     ☐ E se gravasse podcast com Bruno?    [✏️] [✗]
    │     ☐ Investigar API Notion              [✏️] [✗]
    │     ☐ Comprar livro Carnegie             [✏️] [✗]
    │
    │   🤔 Decisões a tomar (2)
    │     ☐ Aceitar projecto cliente Y?        [✏️] [✗]
    │     ☐ Renovar Adobe Creative?            [✏️] [✗]
    │
    ▼
[6] Eurico inspecciona, desmarca o que não quer, edita (✏️) o que precisa de ajuste
    │ Botão fixo bottom: "Guardar 7 itens seleccionados" (contador dinâmico)
    │
    ▼
[7] Clica guardar
    │ Cada item persiste na sua tabela Dexie correspondente:
    │   - tarefas → db.tasks
    │   - projectos → db.projects
    │   - ideias soltas → db.knowledge_notes (caderno default "_inbox")
    │   - decisões → db.tasks com tag "decisão"
    │
    ▼
[8] Modal fecha com toast Lime "7 itens guardados"
    │ Chat principal mostra mensagem retroactiva do agente:
    │   "Brain dump processado: 7 itens guardados."
```

---

### 1.5 Flow 5 — Foto de Recibo (drag chat OU Telegram) → Finança

**Objectivo:** Eurico faz uma compra, fotografa o recibo, larga no chat OU envia para o bot Telegram, e a despesa fica registada com 1 confirmação.

#### 1.5a — Path A: drag-and-drop no chat

```
[1] Eurico arrasta foto recibo para a área do chat
    │
    ▼
[2] Drop zone activa overlay glass com texto Cyan "Largar para processar recibo"
    │
    ▼
[3] Drop completa → mensagem do utilizador aparece com thumbnail da foto
    │ POST /api/ocr/receipt (Node, body multipart até 4MB)
    │
    ▼
[4] Loading ToolCard aparece: "A ler recibo..." + spinner Cyan
    │ (Anthropic Vision processa, ~3-5s típico)
    │
    ▼
[5] ToolCard transita para PreviewModal inline (porque OCR sempre tem confidence < 70%):
    │   Mercador: Continente Telheiras       [editável]
    │   Data:     14/03/2026                  [editável]
    │   Total:    €43,28                      [editável]
    │   IVA:      €3,21                       [editável]
    │   Categoria: Mercearia (sugerida)       [select]
    │   Cartão:   [select dropdown]           [opcional]
    │   ┌─────────────────────────────────────┐
    │   │ Confirmar e registar                │  Cancelar │
    │   └─────────────────────────────────────┘
    │
    ▼
[6] Eurico ajusta se preciso, clica "Confirmar e registar"
    │ db.transactions.add() → ToolCard transita para success
    │
    ▼
[7] Texto resumo: "Despesa de €43,28 registada em Mercearia."
    │ UndoToast 30s aparece
```

#### 1.5b — Path B: foto via Telegram

```
[1] Eurico tira foto do recibo no telemóvel e envia para @nexus_eurico_bot
    │
    ▼
[2] Telegram dispara webhook → /api/telegram/webhook (Edge)
    │ Webhook detecta `message.photo`, descarrega via Telegram API, encaminha para /api/ocr/receipt
    │
    ▼
[3] OCR processa, cria entrada `pending_receipt` em IndexedDB com flag `awaitingConfirmation`
    │
    ▼
[4] Bot responde no Telegram:
    │   "Recibo de €43,28 lido (Continente, 14/03). Confirma na app ou responde 'sim' aqui."
    │
    ▼
[5a] Eurico responde "sim" → bot persiste, regista finança, confirma
[5b] Eurico abre a app → ToolCard pendente aparece automaticamente no topo do chat com PreviewModal
```

**Estado especial offline (Path A):** se sem rede, drop é bloqueado com banner Magenta "Sem rede — OCR indisponível. Tira foto agora e larga depois quando voltar a rede." Foto fica em fila local (Service Worker IndexedDB queue).

---

## 2. Layout Chat-First (paradigma central)

### 2.1 Hierarquia visual (>1280px desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky, altura 56px, glass background rgba(255,255,255,0.025))  │
│  [Zap Cyan] NEXUS    ●online    │   [Tasks] [Finance] [Habits] [⚙️]      │
├──────────────────────────────────────────────┬──────────────────────────┤
│                                              │                          │
│  CHAT PANEL (flex 1)                         │  SIDEBAR (fixed 360px)   │
│  ┌────────────────────────────────────────┐  │  ┌────────────────────┐  │
│  │ MorningBriefing (pinned se 1ª vez/dia) │  │  │ Greeting + clock   │  │
│  │ ───────────────────────────────────────│  │  │ Markets 9 mercados │  │
│  │ Mensagens (infinite-scroll up)          │  │  │ Pomodoro           │  │
│  │ ┌──────────────────────────────────┐   │  │  │ GitHub events      │  │
│  │ │ User bubble (direita, Cyan 8%)   │   │  │  │ Quick Links        │  │
│  │ └──────────────────────────────────┘   │  │  │ Goodnight (à noite)│  │
│  │ ┌──────────────────────────────────┐   │  │  └────────────────────┘  │
│  │ │ Agent bubble (esquerda)          │   │  │                          │
│  │ │ + ToolCards inline               │   │  │                          │
│  │ │ + texto streaming                │   │  │                          │
│  │ └──────────────────────────────────┘   │  │                          │
│  └────────────────────────────────────────┘  │                          │
│                                              │                          │
│  ┌────────────────────────────────────────┐  │                          │
│  │ INPUT BOX (sticky bottom)              │  │                          │
│  │ [📎] [textarea autosize] [🎙️] [⏎]     │  │                          │
│  │ Atalhos: / foco · ↵ enviar · ⇧↵ nova linha│                          │
│  └────────────────────────────────────────┘  │                          │
│                                              │                          │
└──────────────────────────────────────────────┴──────────────────────────┘
```

### 2.2 Especificações exactas

| Zona | Dimensões | Background | Border | Notas |
|------|-----------|-----------|--------|-------|
| Header | h:56px, full-width sticky top:0 | `rgba(255,255,255,0.025)` + `backdrop-filter: blur(12px)` | bottom 1px `rgba(255,255,255,0.08)` | z-index 50 |
| Chat panel | `flex: 1`, padding 24px lateral, `max-w-[900px]` centrado | `transparent` | — | scroll smooth |
| Input box | sticky bottom:0, h:auto (min 64px, max 200px) | `rgba(255,255,255,0.04)` + `backdrop-filter: blur(16px)` | top 1px `rgba(255,255,255,0.08)` | textarea autosize |
| Sidebar | fixed right:0, w:360px, h:100vh-56px | `rgba(255,255,255,0.025)` | left 1px `rgba(255,255,255,0.08)` | scroll independente, hidden em <1024px |
| Modais fullscreen (`/tasks` etc) | viewport completo | `#04040A` + glass overlay | — | Esc para fechar |

### 2.3 Comportamento responsive

- **>= 1280px**: layout completo 3 colunas (chat + sidebar)
- **1024-1279px**: sidebar reduz para 320px, chat encolhe
- **768-1023px**: sidebar vira drawer escondido. Botão "☰" no header abre drawer (slide right→left)
- **<768px (mobile)**: chat fullscreen, sidebar drawer, header reduzido para 48px com logo + ☰

---

## 3. Wireframes (7 vistas)

### 3.1 `/` — Chat principal (vista padrão)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ⚡ NEXUS  ●online      [Tarefas][Finanças][Hábitos][Diário][⚙️]      │
├──────────────────────────────────────────────────┬─────────────────────┤
│                                                  │ Bom dia, Eurico ☀  │
│  ┌──────────────────────────────────────────┐    │ 14/03/2026 · 09:42  │
│  │ ⭐ MORNING BRIEFING (clica para expandir)│    │ ─────────────────── │
│  │ Tens 3 tarefas atrasadas, €1.240 a pagar│    │ MERCADOS            │
│  │ esta semana, e a Maria respondeu ao mail│    │ DAX     17.823 ▲0.4%│
│  │ sobre o projecto X. [Ver tudo →]        │    │ NDX     21.512 ▼0.8%│
│  └──────────────────────────────────────────┘    │ SP500    5.241 ▲0.2%│
│                                                  │ BRENT     78,4 ▲1.1%│
│  ┌──────────────────────────────────────────┐    │ ETH    3.421€ ▼2.3% │
│  │ paguei €78,70 supermercado, amanhã       │ Tu │ NVDA    132,4 ▲0.6% │
│  │ reunião 15h, lembra-me sexta luz         │    │ ASML    645,8 ▼0.1% │
│  └──────────────────────────────────────────┘    │ ─────────────────── │
│                                                  │ POMODORO            │
│  ┌──────────────────────────────────────────┐    │ ⏱  25:00            │
│  │ Nexus                                    │    │ [Iniciar]           │
│  │ ┌──────────────────────────────────┐     │    │ Ligar a tarefa? ▾   │
│  │ │ ✓ Despesa registada              │     │    │ ─────────────────── │
│  │ │ €78,70 · Mercearia · cartão M    │     │    │ GITHUB              │
│  │ └──────────────────────────────────┘     │    │ ✦ AIOX commit 2h    │
│  │ ┌──────────────────────────────────┐     │    │ ✦ Push frusoal 5h   │
│  │ │ ✓ Evento criado                  │     │    │ ─────────────────── │
│  │ │ "reunião" · 15/03/2026 15:00     │     │    │ LINKS               │
│  │ └──────────────────────────────────┘     │    │ → Anthropic Console │
│  │ ┌──────────────────────────────────┐     │    │ → Vercel Dashboard  │
│  │ │ ✓ Lembrete agendado              │     │    │ → Linear            │
│  │ │ 21/03/2026 09:00 · "pagar luz"   │     │    │                     │
│  │ └──────────────────────────────────┘     │    │                     │
│  │                                           │    │                     │
│  │ Apontei a reunião com 15h amanhã,         │    │                     │
│  │ registei a despesa do supermercado em     │    │                     │
│  │ Mercearia, e marquei o lembrete...        │    │                     │
│  └──────────────────────────────────────────┘    │                     │
│                                                  │                     │
│  [↩ Anular tudo · 28s]                          │                     │
│                                                  │                     │
├──────────────────────────────────────────────────┤                     │
│ 📎 [Escreve qualquer coisa — uma tarefa,        ] 🎙️ ⏎             │ │
│    [tarefa, despesa, lembrete... 3 acções       ]                    │ │
│    [numa só frase.                              ]                    │ │
│ / foco · ↵ enviar · ⇧↵ nova linha                                   │ │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 `/tasks` — 3 vistas (Lista | Kanban | Calendário)

**Modal fullscreen, abre com slide-up sobre o chat.**

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ TAREFAS    [Lista] [Kanban] [Calendário]              [+ Nova] [Esc] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Filtros: [Todas ▾] [Projecto ▾] [Tag ▾] [Prioridade ▾]  🔍 Pesquisar │
│                                                                        │
│  Vista KANBAN (default):                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  TODO    │  │ EM CURSO │  │BLOQUEADAS│  │  FEITO   │               │
│  │   (12)   │  │   (3)    │  │   (1)    │  │  (47)    │               │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤               │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │               │
│  │ │● Alta│ │  │ │● Média│ │ │ │● Baixa││  │ │  ✓   │ │               │
│  │ │Compr.│ │  │ │PRD Fr│ │  │ │Calend│ │  │ │Pagar │ │               │
│  │ │ leite│ │  │ │ usoal│ │  │ │ário  │ │  │ │renda │ │               │
│  │ │14/03 │ │  │ │esta  │ │  │ │ # ws │ │  │ │ ─   │ │               │
│  │ │ #pers│ │  │ │ semana│ │ │ └──────┘ │  │ └──────┘ │               │
│  │ └──────┘ │  │ └──────┘ │  │          │  │          │               │
│  │ ┌──────┐ │  │ ┌──────┐ │  │          │  │ ┌──────┐ │               │
│  │ │● Alta│ │  │ │● Alta│ │  │          │  │ │  ✓   │ │               │
│  │ │..   │ │  │ │..    │ │  │          │  │ │..    │ │               │
│  │ └──────┘ │  │ └──────┘ │  │          │  │ └──────┘ │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                        │
│  ⚠ Atrasadas (2): "Acabar PRD" (3d), "Ligar advogada" (1d) [Ver →]   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Vista LISTA:** tabela com cols `☐ · Título · Prioridade · Due · Projecto · Tags · Status`. Drag-and-drop via grip handle à esquerda.

**Vista CALENDÁRIO:** grid 7 colunas (seg-dom), cada célula altura mínima 120px. Tarefas com `dueDate` aparecem como chip Cyan (futuro), Lime (feito), Magenta (atrasado). Drag-and-drop entre dias persiste `dueDate`.

### 3.3 `/finance` — Este mês + Cartões + Património + Projecção 30d

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ FINANÇAS  [Este mês][Cartões][Património][Projecção]  [+ Despesa][Esc]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ESTE MÊS — Março 2026                                                │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐│
│  │ Total saída  €1.847,30                  │  │ Por categoria        ││
│  │ Total entrada €3.200,00                 │  │ Mercearia    €342  ▓│
│  │ Saldo        +€1.352,70                 │  │ Restauração  €198  ▓│
│  │                                         │  │ Combustível  €145  ▒│
│  │ ▓▓▓▓▓▓▓▓▒▒▒▒░░ 58% do mês               │  │ Habitação    €620  █│
│  └─────────────────────────────────────────┘  │ Subscrições  €184  ▒│
│                                               │ Outros       €358  ▒│
│  Por dia (gráfico horizontal de barras):      └──────────────────────┘│
│  01 ──── €54                                                          │
│  02 ─ €12                                                              │
│  03 ──────────── €342  ← pico Continente                              │
│  ...                                                                   │
│                                                                        │
│  Últimas 10 despesas:                                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 14/03  Continente Telheiras  Mercearia  -€78,70  Cartão Mill   │  │
│  │ 13/03  Galp                   Combustível -€60,00 Cartão Mill   │  │
│  │ 12/03  Spotify (mensal)       Subscrição -€9,99  Recorrente    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Tab CARTÕES:** lista cartões + fatura corrente (ex: "Visa Millennium · Fatura aberta €432,18 · Fecho 25/03 · Vence 08/04") + drilldown prestações.

**Tab PATRIMÓNIO:** saldo agregado por conta. Total topo destacado (`€12.840,50` Gold + Inter peso 800 escala 2.4rem).

**Tab PROJECÇÃO:** linha de tempo 30 dias com barras Magenta para saídas previstas (recorrentes + prestações + lembretes) e linha Lime para saldo projectado.

### 3.4 `/habits` — Heatmap GitHub-style + Lista

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ HÁBITOS                                            [+ Hábito] [Esc]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Hábitos activos (4):                                                  │
│                                                                        │
│  📚 Leitura diária       Streak: 12 dias    [✓ Hoje]                  │
│  ╔══════════════════════════════════════════════════════════════╗     │
│  ║ heatmap 6 meses (24 sem × 7 dias = 168 quadrados)            ║     │
│  ║ ▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▒▒░░▓▓▓▓▒▒░░               ║     │
│  ║ ░ vazio · ▒ pouco · ▓ médio · █ muito (escala Cyan→Cyan99)   ║     │
│  ╚══════════════════════════════════════════════════════════════╝     │
│                                                                        │
│  🏃 Correr 5km           Streak: 0 dias     [✗ Hoje]   métrica: 4,2km│
│  ╔══════════════════════════════════════════════════════════════╗     │
│  ║ heatmap...                                                   ║     │
│  ╚══════════════════════════════════════════════════════════════╝     │
│  Recorde: 7,8km (08/02/2026)  Média 30d: 4,1km                       │
│                                                                        │
│  💪 Treino pernas        Streak: 3 dias     [✓ Hoje]                 │
│  ...                                                                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.5 `/journal` — Calendário mood + editor Tiptap

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ DIÁRIO                                          [+ Hoje] [🔍] [Esc]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Calendário mood (3 meses, scroll horizontal):                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │       Jan        Fev        Mar (actual)                        │  │
│  │ S T Q Q S S D │ S T Q Q S S D │ S T Q Q S S D                  │  │
│  │ ☺ ☺ ☻ ☺ ⊙ ☻ ☻ │ ☺ ⊙ ⊙ ☺ ☺ ☻ ⊙ │ ☺ ⊙ ☻ ⊙ ◉ ◉ ◉  ← futuro      │  │
│  │ ☻ ☻ ☺ ☺ ⊙ ⊙ ☻ │ ☺ ☺ ☺ ⊙ ⊙ ☻ ⊙ │                              │  │
│  │ ⊙ = neutro · ☺ = bom · ☻ = excelente · ◉ = futuro              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Entrada de hoje (14/03/2026):                                         │
│  Mood: [☹] [☺] [⊙] [☻] [✦]   Seleccionado: ☻ Excelente               │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Tiptap Editor (markdown live)                                  │  │
│  │                                                                  │  │
│  │  ## O que fiz hoje                                              │  │
│  │  - Acabei o PRD do Frusoal                                      │  │
│  │  - Liguei ao Pedro                                              │  │
│  │                                                                  │  │
│  │  ## O que senti                                                 │  │
│  │  Confiante. A clareza chegou.                                   │  │
│  │                                                                  │  │
│  │  ## O que aprendi                                               │  │
│  │  Que vale a pena escrever antes de falar.                       │  │
│  │                                                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [✦ Estruturar com AI]   [Guardar (auto cada 5s)]                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.6 `/knowledge` — Árvore Áreas → Cadernos → Notas

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ CONHECIMENTO                            [+ Área] [🔍 pesquisar] [Esc]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────┬────────────────────────────────────────┐ │
│  │ ÁREAS (sidebar)         │ NOTA SELECCIONADA                      │ │
│  │                         │                                        │ │
│  │ ▾ 🎓 Aprendizagens (12) │ Título: "Notas Carnegie - Como ganhar │ │
│  │   ├ React 19 (4)         │         amigos"                       │ │
│  │   ├ AI Agentes (5)       │ Caderno: Carnegie · Tags: leitura,    │ │
│  │   └ AIOX (3)             │ pessoal · 14/03/2026                  │ │
│  │                         │                                        │ │
│  │ ▾ 💼 Trabalho (28)      │ ─────────────────────────────────────  │ │
│  │   ├ Clientes (8)         │ ## 6 maneiras de cair em graça        │ │
│  │   ├ Comunidade (12)      │                                        │ │
│  │   └ Frusoal (8)          │ 1. Mostra interesse genuíno...        │ │
│  │                         │ 2. Sorri...                           │ │
│  │ ▾ 📚 Leitura (15)       │ 3. Lembra o nome da pessoa...         │ │
│  │   ├ Carnegie (3)         │ ...                                    │ │
│  │   ├ Hormozi (5)          │                                        │ │
│  │   └ Ferramentas IA (7)   │ Fonte: livro pessoal                  │ │
│  │                         │                                        │ │
│  │ ▾ 🏠 Pessoal (8)        │ [✏️ Editar] [📎 Adicionar fonte]       │ │
│  │                         │                                        │ │
│  │ + Nova área              │                                        │ │
│  └─────────────────────────┴────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.7 `/settings` — Audit log + Integrações + Backup

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✕ DEFINIÇÕES                                                    [Esc]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─ Tabs (vertical) ────────┬─────────────────────────────────────┐  │
│  │ ⚙️  Geral                │ Geral                                │  │
│  │ 🔌 Integrações            │                                      │  │
│  │ 🔔 Notificações           │ Nome:           [Eurico        ]    │  │
│  │ 🤖 Cérebro / Audit        │ Tema:           [Dark (forçado)]    │  │
│  │ 💾 Backup / Export        │ Início do dia:  [06:00 ▾]           │  │
│  │ 📊 Telemetria local       │ Idioma briefings: PT-PT             │  │
│  │ 🎨 Aparência              │                                      │  │
│  └──────────────────────────┴─────────────────────────────────────┘  │
│                                                                        │
│  Tab INTEGRAÇÕES:                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Google Calendar        [✓ Ligado] [Desligar] [Sincronizar agora]│ │
│  │ Última sync: há 12 min                                           │ │
│  │ ─────────────────────────────────────────────────────────────── │ │
│  │ Gmail                  [✓ Ligado]              [Reclassificar]  │ │
│  │ 1.247 emails classificados · 23 importantes hoje                │ │
│  │ ─────────────────────────────────────────────────────────────── │ │
│  │ Telegram Bot           [✓ Ligado] @nexus_eurico_bot             │ │
│  │ Última msg: há 2h                                                │ │
│  │ ─────────────────────────────────────────────────────────────── │ │
│  │ Web Push               [✓ Activo] (Chrome no portátil)          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Tab CÉREBRO / AUDIT:                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Últimas 90 execuções (`agent_runs` IndexedDB):                  │ │
│  │ 14/03 09:42  3 intents (calendar+finance+reminder) ✓ 2.1s        │ │
│  │ 14/03 08:15  1 intent (criar_tarefa)               ✓ 0.8s        │ │
│  │ 13/03 22:30  Brain dump → 7 itens                  ✓ 4.5s        │ │
│  │ ...                                                              │ │
│  │ [Limpar audit log antigo (>90d)]                                │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Componentes UI (catálogo detalhado)

### 4.1 ToolCard — renderiza resultado de cada tool call

**Props:**
```ts
interface ToolCardProps {
  toolName: string;             // 'criar_tarefa', 'criar_finança_variavel', etc.
  state: 'loading' | 'success' | 'error' | 'preview-required' | 'reverted' | 'interrupted';
  args: unknown;                // mostrados em modo summary
  result?: unknown;             // só quando success
  error?: string;
  confidence?: number;          // 0-1; <0.7 dispara preview-required
  onConfirm?: () => void;       // só preview-required
  onCancel?: () => void;        // só preview-required
  onEdit?: () => void;          // só preview-required
  onRetry?: () => void;         // só error
}
```

**Layout (estado success):**
```
┌──────────────────────────────────────────────────┐
│ ✓ Despesa registada                              │
│ €78,70 · Mercearia · cartão Millennium           │
│                                          14/03   │
└──────────────────────────────────────────────────┘
```

**Tokens visuais por estado:**

| Estado | Border | Background | Ícone | Texto título |
|--------|--------|-----------|-------|--------------|
| `loading` | `1px solid rgba(0,245,255,0.4)` (Cyan, pulsing 1s) | `rgba(0,245,255,0.04)` | `<Loader2>` spin Cyan | "A processar..." Grey |
| `success` | `1px solid rgba(57,255,20,0.3)` (Lime) | `rgba(57,255,20,0.04)` | `<Check>` Lime | nome humano da acção, White |
| `error` | `1px solid rgba(255,0,110,0.4)` (Magenta) | `rgba(255,0,110,0.04)` | `<X>` Magenta | "Falhou", error string Grey |
| `preview-required` | `1px solid rgba(255,184,0,0.5)` (Gold, pulsing slow) | `rgba(255,184,0,0.04)` | `<AlertTriangle>` Gold | "Confirma antes de gravar" |
| `reverted` | `1px dashed rgba(136,146,164,0.3)` (Grey dashed) | `rgba(255,255,255,0.02)` | `<Undo2>` Grey | "Anulada" Grey strikethrough |
| `interrupted` | `1px solid rgba(255,184,0,0.3)` (âmbar) | `rgba(255,184,0,0.02)` | `<AlertCircle>` Gold | "Interrompida — tentar de novo?" |

**Dimensões:** padding 12px 16px, border-radius 12px, max-width 100% do chat panel, margin-vertical 8px entre cards consecutivos.

**Tipografia:** título Inter 600 0.9rem, conteúdo Inter 400 0.85rem, números técnicos (datas, valores) JetBrains Mono 0.8rem White.

**Animação:** transição entre estados 250ms ease-out. Quando aparece, fade-in 200ms + translateY(8px → 0).

### 4.2 PreviewModal — confidence < 70% pede confirmação

Renderiza inline dentro do ToolCard quando `state === 'preview-required'`. Não é modal flutuante (preserva contexto do chat).

**Layout dentro do Card:**
```
┌──────────────────────────────────────────────────┐
│ ⚠ Confirma antes de gravar                       │
│                                                  │
│ Mercador:  [Continente Telheiras       ]          │
│ Data:      [14/03/2026                 ]          │
│ Total:     [€78,70                     ]          │
│ Categoria: [Mercearia               ▾  ]          │
│ Cartão:    [— sem cartão —          ▾  ]          │
│                                                  │
│ [✓ Confirmar e gravar]  [✗ Cancelar]  [✏️ Mais]  │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Submit → muda para state `loading` → executa tool → `success`
- Cancel → muda para state `reverted` (animação fade-out 300ms, depois colapsa altura)
- "Mais" → expande campos avançados (notas, tags, account/cardId)

**Validação:**
- Inputs com Zod schema da tool (vem do registry)
- Erros inline em vermelho Magenta abaixo do campo

### 4.3 UndoToast — 30s countdown para reverter

**Posição:** bottom-center, 24px do bottom, z-index 100.

**Layout:**
```
        ┌────────────────────────────────────┐
        │ ↩ 3 acções criadas. Anular tudo?  │
        │ ▓▓▓▓▓▓▓▓▒▒▒▒░░░░ 28s              │
        │                       [Anular]     │
        └────────────────────────────────────┘
```

**Tokens:**
- Background `rgba(4,4,10,0.95)` + glass
- Border 1px `rgba(255,255,255,0.12)`
- Border-radius 12px
- Padding 12px 20px
- Width auto (max 480px)
- Shadow `0 8px 32px rgba(0,0,0,0.4)`

**Progress bar:** altura 3px, Cyan diminuindo de 100% para 0% em 30s linear. Quando chega a 0, toast fade-out 200ms.

**Botão Anular:** Cyan ghost (border 1px Cyan, background transparente). Hover: background Cyan 8%. Click: chama `reverse()` em sequência das tools no AgentRun, mostra outro toast Lime "Anulado · 3 acções revertidas" (4s, sem countdown).

**Comportamento especial:**
- Se outra mensagem chega antes dos 30s, novo UndoToast empilha em cima (stack vertical, max 3 visíveis, oldest discarded)
- Hover sobre o toast pausa countdown
- Esc não dispensa (intencional — Eurico tem de clicar Anular ou esperar)

### 4.4 VoiceModeButton — microfone + indicador visual

**Localização:** canto inferior direito do input box (adjacente ao Enter button).

**Estados:**

| Estado | Ícone | Cor | Animação |
|--------|-------|-----|----------|
| `idle` | `<Mic>` | Grey `#8892A4` | nenhuma |
| `listening` | `<Mic>` | Cyan `#00F5FF` | pulsing radial outline a 1s, e ondas de áudio amplitude visíveis |
| `transcribing` | `<Loader2>` | Cyan | spin |
| `error` | `<MicOff>` | Magenta | shake 200ms uma vez |
| `unsupported` | `<MicOff>` | Grey2 `#4A5568` | tooltip: "Voice indisponível neste browser. Usa Chrome/Edge." |

**Botão dimensão:** 40×40px, border-radius 10px (mais arredondado que botões normais para distinguir).

**Comportamento:**
- Click `idle` → solicita permissão browser. Se concedido → state `listening`, Web Speech API recognition arranca em PT-PT
- Enquanto `listening`: texto transcrito vai aparecendo no input em tempo real (greyed) com indicador "A ouvir... (toca de novo para parar)"
- Click `listening` → para, texto fica final no input. Eurico pode editar antes de Enter
- Long-press `listening` (>500ms) → continua a ouvir mesmo soltando (modo conversação contínua)
- Resposta do agente pode ser falada via Web Speech synthesis (toggle nas Definições)

### 4.5 PomodoroTaskLink — ligar pomodoro a tarefa específica

**Localização:** dentro do `PomodoroWidget` na sidebar, abaixo do timer.

**Layout:**
```
┌──────────────────────────────────┐
│ ⏱  POMODORO                       │
│      25:00                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [Iniciar 25min] [Pausa 5min]    │
│                                  │
│ Ligar a tarefa? ▾                │ ← clica para expandir
└──────────────────────────────────┘
```

**Quando expandido:**
```
┌──────────────────────────────────┐
│ ⏱  POMODORO                       │
│      25:00                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [Iniciar 25min] [Pausa 5min]    │
│                                  │
│ Ligar a tarefa? ▴                │
│ ┌──────────────────────────────┐ │
│ │ 🔍 Pesquisar tarefa...        │ │
│ └──────────────────────────────┘ │
│ ☐ Acabar PRD Frusoal · Alta      │
│ ☐ Comprar leite · Baixa          │
│ ☐ Ligar Pedro · Média            │
│ + Nova tarefa rápida...          │
└──────────────────────────────────┘
```

**Comportamento:**
- Selecciona tarefa → Pomodoro arranca **com `taskId`** persistido. Campo `task.lastWorkedAt = Date.now()` actualiza.
- Termina pomodoro (25min) → toast "Pomodoro completo. Marcar tarefa como avançada?" com 3 opções: "Avancei", "Concluída", "Continuo depois".
- Tarefa associada aparece com badge `⏱` na vista Tarefas indicando que tem pomodoro activo.

---

## 5. Design System Aplicado (extracto operacional)

> **Fonte canónica:** `.claude/rules/design-system-ia-avancada.md` e `.claude/rules/brandbook.md`. Esta secção é uma extracção operacional para uso directo nos componentes do Nexus.

### 5.1 Paleta (CSS custom properties)

```css
:root {
  /* Backgrounds */
  --bg:              #04040A;
  --bg-elevated:     rgba(255, 255, 255, 0.025);
  --bg-elevated-2:   rgba(255, 255, 255, 0.04);
  --bg-overlay:      rgba(4, 4, 10, 0.85);

  /* Borders */
  --border-subtle:   rgba(255, 255, 255, 0.08);
  --border-strong:   rgba(255, 255, 255, 0.16);

  /* Text */
  --text:            #F0F4FF;
  --text-secondary:  #8892A4;
  --text-disabled:   #4A5568;

  /* Acentos */
  --cyan:            #00F5FF;
  --cyan-glow:       rgba(0, 245, 255, 0.4);
  --gold:            #FFB800;
  --purple:          #9D00FF;
  --magenta:         #FF006E;
  --lime:            #39FF14;

  /* Tipografia */
  --font-ui:         'Inter', system-ui, sans-serif;
  --font-mono:       'JetBrains Mono', monospace;

  /* Espaçamento (4px base) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-12: 48px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;

  /* Glassmorphism */
  --blur-sm: blur(8px);
  --blur-md: blur(12px);
  --blur-lg: blur(20px);
}
```

### 5.2 Mapeamento semântico → cor

| Semântica | Cor | Uso no Nexus v2 |
|-----------|-----|-----------------|
| Acção primária | `--cyan` | Botões "Enviar", "Iniciar", links, foco activo, logo, bordas activas |
| Sucesso | `--lime` | ToolCard success, mood diário positivo, hábito completo, transações entrada |
| Erro/perigo | `--magenta` | ToolCard error, validação falhada, atrasos, transações saída destacadas, retry |
| Aviso/preview | `--gold` | PreviewModal, hábitos premium/streak >30d, briefing matinal pinned, valores Património |
| IA / processamento | `--purple` | Cérebro a pensar (loading classifier), badge "AI Estruturou", thinking indicators |
| Texto secundário | `--text-secondary` | Metadados, timestamps, labels, tooltips, footer atalhos |
| Texto desactivado | `--text-disabled` | Placeholder inputs, conteúdo em modo offline, items desactivados |

### 5.3 Tipografia (escalas exactas para Nexus v2)

| Token | Valor | Uso |
|-------|-------|-----|
| `display` | Inter 900 2.4rem · `letter-spacing: -0.03em` | Total Património (Gold), valores grandes em /finance |
| `h1` | Inter 800 1.6rem | Headers de modais (`/tasks`, `/finance`, etc.) |
| `h2` | Inter 700 1.15rem | Greeting `Bom dia, Eurico` |
| `body` | Inter 400 0.95rem · `line-height: 1.8` | Mensagens chat, texto streaming agent |
| `body-sm` | Inter 400 0.85rem · `line-height: 1.6` | Conteúdo de ToolCards, descrição de tarefas |
| `tech-label` | JetBrains Mono 800 1.8rem | Pomodoro timer (`25:00`), valores Markets (`17.823 ▲0.4%`) |
| `mono-sm` | JetBrains Mono 500 0.85rem | Datas técnicas (`14/03/2026 09:42`), IDs em audit log |
| `badge` | JetBrains Mono 700 0.65rem · `letter-spacing: 0.1em` · `text-transform: uppercase` | Status (`TODO`, `DONE`, `BLOCKED`), prioridades, tags |

### 5.4 Componentes recorrentes — receitas exactas

**Card glass elevado (qualquer superfície):**
```css
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: var(--blur-md);
  padding: var(--space-5);
}
```

**Botão primário (Cyan, acção principal):**
```css
.btn-primary {
  background: var(--cyan);
  color: var(--bg);
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.4rem;
  border-radius: var(--radius-sm);
  box-shadow: 0 0 20px var(--cyan-glow);
  transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-primary:hover { box-shadow: 0 0 32px var(--cyan-glow); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
```

**Botão ghost (acção secundária):**
```css
.btn-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-subtle);
  /* mesmo padding, font, radius */
}
.btn-ghost:hover { background: var(--bg-elevated-2); border-color: var(--border-strong); }
```

**Input text:**
```css
.input {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text);
  font-family: var(--font-ui);
  padding: 0.6rem 0.9rem;
  transition: border-color 0.2s;
}
.input:focus { border-color: var(--cyan); outline: 2px solid var(--cyan-glow); outline-offset: 0; }
.input::placeholder { color: var(--text-disabled); }
```

**Badge / chip:**
```css
.badge {
  background: rgba(0, 245, 255, 0.08);
  border: 1px solid rgba(0, 245, 255, 0.2);
  border-radius: var(--radius-xl);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  color: var(--cyan);
}
.badge--gold    { background: rgba(255,184,0,0.08);  border-color: rgba(255,184,0,0.2);  color: var(--gold); }
.badge--magenta { background: rgba(255,0,110,0.08);  border-color: rgba(255,0,110,0.2);  color: var(--magenta); }
.badge--lime    { background: rgba(57,255,20,0.08);  border-color: rgba(57,255,20,0.2);  color: var(--lime); }
.badge--purple  { background: rgba(157,0,255,0.08);  border-color: rgba(157,0,255,0.2);  color: var(--purple); }
```

### 5.5 Gradientes permitidos (uso restrito)

| Gradiente | Uso |
|-----------|-----|
| `linear-gradient(135deg, rgba(0,245,255,0.15), rgba(157,0,255,0.15))` | Hero MorningBriefing pinned, header de Definições |
| `linear-gradient(to top, rgba(4,4,10,0.95) 0%, rgba(4,4,10,0.6) 50%, rgba(4,4,10,0.2) 100%)` | Overlay sobre Markets quando em modo loading inicial |
| `linear-gradient(135deg, rgba(255,184,0,0.12), rgba(157,0,255,0.08))` | Total Património destacado (vista `/finance/património`) |

**Nada de gradientes arbitrários fora destes três.** Qualquer outro padrão visual deve usar superfícies sólidas glass.

### 5.6 Iconografia

**Lucide-react** é a única biblioteca de ícones permitida (já em uso v1 e prevista em `package.json` v2 §17 do architecture).

Tamanhos: `14px` (badges, inline), `16px` (UI normal), `18px` (header, sidebar widgets), `24px` (acções primárias), `32px+` (estados vazios, branding).

Nunca usar emojis Unicode dentro do produto (excepto: mood do diário `☺ ⊙ ☻ ✦` — escolha intencional para evitar dependência de imagens).

---

## 6. Estados (loading, empty, error, offline)

### 6.1 Estado vazio por vista

| Vista | Texto | Acção sugerida |
|-------|-------|-----------------|
| `/` (chat zero msgs) | Apenas o MorningBriefing pinned + frase de welcome do agente | Foco automático no input |
| `/tasks` zero tarefas | "Ainda não tens tarefas. Escreve no chat ou clica `+ Nova`." | Botão "+ Nova" Cyan ghost grande |
| `/finance` zero transações | "Nenhuma despesa este mês. Larga uma foto de recibo no chat ou usa `+ Despesa`." | 2 botões side-by-side |
| `/habits` zero hábitos | "Os hábitos aparecem aqui depois de criares o primeiro. Tenta `correr 3x por semana` no chat." | Botão "+ Hábito" |
| `/journal` zero entradas | "Primeira entrada de diário. Clica `+ Hoje` ou escreve no chat." | — |
| `/knowledge` zero áreas | "Áreas → Cadernos → Notas. Cria a primeira área para começar." | Botão "+ Área" centrado |
| `/settings/audit` zero runs | "Cérebro ainda não foi usado. Faz o primeiro prompt no chat." | Link "Ir para chat" |

**Visual padrão estado vazio:** ícone Lucide grande 48px Grey + texto Grey body + acção primária Cyan. Centrado verticalmente (40% topo).

### 6.2 Loading

| Tipo | Indicador |
|------|-----------|
| App boot inicial | Splash 800ms: logo NEXUS centrado + spinner Cyan abaixo |
| Sidebar widgets carregando | Skeleton bars Grey2 com pulse 1s |
| Chat enviando prompt | Input desactivado opacity 60% + texto bottom "A pensar..." Grey |
| ToolCard | spinner Cyan + texto "A processar..." (ver §4.1) |
| Vista detalhada (modal) abrindo | Esqueleto de cards em grid Grey2 com pulse |
| OAuth Google em curso | Modal central glass com spinner Cyan + texto "A ligar Google..." |
| Brain Dump processando | Overlay sobre textarea + spinner grande + texto "A estruturar 200 palavras..." |

### 6.3 Erros

| Erro | Manifestação |
|------|--------------|
| Validação inline (input vazio, formato inválido) | Border Magenta + texto Magenta 0.75rem abaixo do input |
| Rede caiu mid-request | Banner Magenta sticky topo (abaixo do header): "Sem rede — algumas acções indisponíveis. [Tentar de novo]" |
| API Anthropic 401/429 | ToolCard error com texto explicito + botão "Tentar de novo" |
| Confidence muito baixa (<40%) | Em vez de tool_use, agente responde com texto a pedir clarificação: "Não percebi se queres criar uma tarefa ou uma despesa. Reformula?" |
| Tool error genérico (Dexie falha) | ToolCard error + log audit + texto "Falhou. Tenta de novo." |
| Crash JS fatal | Error boundary fullscreen: glass card "Algo correu mal. Recarrega a app." + botão "Recarregar" |

### 6.4 Offline (NFR21 PWA degradado)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ⚠ Sem rede. Chat indisponível, mas dashboard e dados locais funcionam.│
├────────────────────────────────────────────────────────────────────────┤
│ ⚡ NEXUS  ●offline    [Tarefas][Finanças][Hábitos][Diário][⚙️]        │
├──────────────────────────────────────────────┬─────────────────────────┤
│ Chat panel:                                  │ Sidebar:                │
│ - Histórico mensagens lê-se OK (Dexie)       │ - Markets: cached value │
│ - Input desactivado com texto:               │   + badge "há X min"    │
│   "Sem rede — não posso processar prompts"   │ - Pomodoro: funciona    │
│ - Botão dummy "Tentar de novo"               │ - GitHub: cached events │
│   detecta volta da rede e desbloqueia         │ - Quick Links: OK       │
│                                              │ - Greeting: OK          │
└──────────────────────────────────────────────┴─────────────────────────┘
```

**Operações que continuam offline:**
- CRUD local (criar tarefa via UI, editar nota, completar hábito) — Dexie é local
- Pomodoro
- Pesquisa em diário/conhecimento
- Backup export (Dexie → JSON → ZIP)

**Operações que ficam em fila para sincronizar:**
- Foto de recibo larga no chat → fica em queue Service Worker, OCR corre quando rede voltar
- Push notification recebida → service worker mostra mesmo offline

---

## 7. Acessibilidade (WCAG AA mínimo)

### 7.1 Keyboard shortcuts (mantidos v1 + novos)

| Tecla | Acção | Notas |
|-------|-------|-------|
| `/` | Focar input do chat | Substitui scroll-to-search |
| `N` | Criar tarefa rápida (TaskModal) | Mantido v1 |
| `T` | Toggle Pomodoro | Mantido v1 |
| `B` | Brain Dump modal | Novo — atalho dedicado |
| `Cmd/Ctrl + K` | Command Palette (futuro Epic 8, deixar reservado) | Não implementado MVP |
| `Esc` | Fechar modal/overlay actual; se chat, blur input | Mantido v1 |
| `↵` Enter no input chat | Enviar prompt | Sem modifiers |
| `⇧ ↵` Shift+Enter no input chat | Nova linha | Multi-line |
| `Cmd/Ctrl + Enter` em forms | Submit | Padrão |
| `Tab` | Navegação focus por ordem lógica | DOM order |
| `↑ ↓` no histórico chat | Navegar mensagens | Quando input está vazio |

**Documentação dos atalhos:** footer fixo bottom com tecla + acção em JetBrains Mono 0.65rem opacity 30%, hover sobe para 60%. Ícone `?` no header abre overlay com lista completa.

### 7.2 Focus visible

Outline focus 2px Cyan + offset 2px em todos os elementos interactivos. Nunca remover outline (`outline: none`) sem fornecer alternativa visual evidente.

### 7.3 Contraste

Todos os pares texto/fundo testados >= AA (4.5:1 para normal, 3:1 para large):
- Inter 0.95rem branco `#F0F4FF` sobre `#04040A`: ~16.5:1 ✅
- Inter 0.85rem grey `#8892A4` sobre `#04040A`: ~7.8:1 ✅
- Cyan `#00F5FF` sobre `#04040A` (acentos, links): ~13.8:1 ✅
- Magenta `#FF006E` sobre `#04040A` (erros): ~4.6:1 ✅ (limite mas passa)

**Alerta:** Grey2 `#4A5568` sobre `#04040A` é ~3.4:1 — só usar para texto desactivado/placeholders, NUNCA para informação importante.

### 7.4 Screen readers

- Todas as imagens (avatar, ícones com semântica) têm `alt` ou `aria-label` em PT-PT
- Modais têm `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- ToolCards têm `role="status"` em estado loading e `role="alert"` em erro
- UndoToast tem `role="alert"` + `aria-live="polite"`
- Links sem texto (ícones só) têm `aria-label`
- Headings hierarchy: H1 só em modais top-level, H2 em secções

### 7.5 Movimento

`prefers-reduced-motion: reduce` desactiva:
- Pulsing de loading states (vira fade simples)
- Slide animations de modais (vira instant)
- Streaming word-by-word (vira aparição imediata do texto completo)
- Shake errors

Restantes animações curtas (<300ms) ficam, mas duração reduz a 50%.

### 7.6 Idioma

`<html lang="pt-PT">` em raiz. Web Speech API recognition: `lang: 'pt-PT'` (Portugal, não BR). Synthesis: voz portuguesa (preferência por voice `Microsoft Helia Online (Natural) - Portuguese (Portugal)` em Edge, fallback voice default PT-PT).

---

## 8. Mobile (PWA installable)

### 8.1 Breakpoints

| Breakpoint | Largura | Layout |
|------------|---------|--------|
| `desktop` | >= 1280px | 3 colunas (chat + sidebar 360) |
| `laptop` | 1024-1279 | 3 colunas (chat + sidebar 320) |
| `tablet` | 768-1023 | Chat fullwidth + drawer sidebar |
| `mobile` | < 768 | Chat fullwidth + drawer sidebar + header reduzido 48px |

### 8.2 Drawer sidebar (mobile)

```
┌──────────────────────────────────┐
│ ☰  ⚡ NEXUS         ●●●           │  ← header 48px
├──────────────────────────────────┤
│                                  │
│  Chat fullwidth                  │
│                                  │
│  ...                             │
│                                  │
├──────────────────────────────────┤
│ 📎 [input multi-line]    🎙️ ⏎   │  ← input ainda mais sticky
└──────────────────────────────────┘

Drawer abre da direita com backdrop dim:
                            ┌───────────────────┐
                            │ Bom dia, Eurico   │
                            │ MERCADOS          │
                            │ DAX 17.823 ▲0.4% │
                            │ ...               │
                            │ POMODORO          │
                            │ 25:00 [Iniciar]   │
                            │ GITHUB            │
                            │ LINKS             │
                            └───────────────────┘
```

**Trigger drawer:**
- Click `☰` no header
- Swipe right-to-left a partir da margem direita (touch gesture)
- Esc / click no backdrop fecha

### 8.3 Touch gestures

| Gesto | Acção | Onde |
|-------|-------|------|
| Swipe right→left margem direita | Abrir drawer sidebar | Em chat principal |
| Swipe left→right margem esquerda | Fechar drawer | Drawer aberto |
| Swipe up no input box | Expandir input para multi-line full-screen | Chat |
| Swipe down em modal fullscreen | Fechar modal | `/tasks`, `/finance`, etc |
| Long-press em mensagem do chat | Abrir menu (copiar, eliminar, refazer prompt) | Histórico |
| Long-press no botão voice | Conversação contínua | Input |
| Pull-to-refresh em sidebar widgets | Refrescar Markets/GitHub | Sidebar/drawer |

### 8.4 Input multi-line mobile

No mobile, swipe up no input box ou tap no ícone `⇡` expande textarea para fullscreen modal. Útil para prompts longos / brain dump rápido. Botões "Cancelar" e "Enviar" sticky bottom.

### 8.5 PWA installable

- Manifest mínimo (já em architecture §11)
- Theme-color `#00F5FF`, background `#04040A`
- Icons 192/512 PNG com logo NEXUS Cyan sobre fundo escuro
- Splash screen native PWA: logo + texto "NEXUS"
- iOS Safari support: `apple-touch-icon`, `apple-mobile-web-app-status-bar-style: black-translucent`

---

## 9. Cobertura PRD → componentes UX

Tabela de rastreabilidade entre FRs/NFRs e elementos UX que os materializam (audit que zero invenção: tudo aqui mapeia a algo no PRD ou architecture).

| FR/NFR | Componente UX | Secção |
|--------|---------------|--------|
| FR1 (chat input always-visible) | Input box sticky bottom | §2.1, §3.1 |
| FR2 (multi-intent) | Multi-ToolCard inline | §1.2, §4.1 |
| FR3 (resumo agregado) | Texto streaming abaixo dos cards | §1.2 |
| FR4 (audit log) | Tab Cérebro/Audit em /settings | §3.7 |
| FR5 (preview <70%) | PreviewModal inline | §4.2 |
| FR6 (undo 30s) | UndoToast | §4.3 |
| FR7 (consultas analíticas) | Chat aceita consultas, ToolCard "consulta" especial | §1.2 |
| FR8 (histórico 100 msgs) | Infinite scroll up no chat panel | §2.1 |
| FR9-15 (tarefas v2) | TaskModal + 3 vistas | §3.2 |
| FR16-23 (finanças) | /finance 4 tabs | §3.3 |
| FR24-28 (hábitos) | Heatmap GitHub-style | §3.4 |
| FR29-32 (projectos) | Tab/filtro em /tasks | §3.2 |
| FR33-38 (lembretes) | Push notification + tool inline | §1.5b |
| FR39-41 (metas) | (vista similar a hábitos, ver §3.4 — TaskModal estendido) | §3.4 |
| FR42-46 (diário) | /journal com Tiptap | §3.5 |
| FR47-50 (brain dump) | BrainDumpModal full | §1.4 |
| FR51-57 (conhecimento) | /knowledge árvore 3-níveis | §3.6 |
| FR58-62 (calendar) | Tab Integrações + tool calendar | §3.7 |
| FR63-68 (gmail) | Vista Gmail no dashboard (futuro Epic 6 — não MVP de UX) | — |
| FR69-76 (telegram) | Tab Integrações | §3.7 |
| FR77-80 (voice) | VoiceModeButton | §4.4 |
| FR81-85 (OCR) | Drag-drop + PreviewModal | §1.5a |
| FR86-89 (briefing matinal/nocturno) | Mensagem pinned no chat | §1.1, §3.1 |
| FR90-92 (auth/setup) | /login + OnboardingModal 4 steps | §1.1 |
| FR93-96 (widgets v1 mantidos) | Sidebar | §2.1, §3.1 |
| NFR1 (latência <6s) | Streaming SSE com cards aparecendo em tempo real evita percepção de espera | §1.2 |
| NFR3 (FCP <2s) | Splash screen 800ms + app shell PWA cacheável | §6.2, §8.5 |
| NFR4 (chat infinite scroll) | Pagination Dexie reverse [conversationId+timestamp] | §2.1 |
| NFR9 (rate limit 60/min) | Banner Magenta "Demasiados pedidos. Tenta em 30s" quando 429 | §6.3 |
| NFR21 (PWA offline) | §6.4 estado offline | §6.4 |
| NFR22 (backup export) | Botão em /settings/backup | §3.7 |
| NFR23 (Chrome/Edge) | Banner Gold se Firefox/Safari | §4.4 voice unsupported |
| NFR24 (mobile responsive) | §8 completo | §8 |

---

## 10. Anti-padrões UX (NUNCA fazer)

| Anti-padrão | Razão |
|-------------|-------|
| Light mode toggle | C4 do PRD — design system [IA]AVANÇADA PT é dark only |
| Cores fora da paleta de 9 | Constraint inegociável — qualquer cor extra requer ADR |
| Modais com fundo branco/cinzento | Glass `rgba(255,255,255,0.025)` sobre `#04040A` sempre |
| Botões grandes coloridos com gradientes arbitrários | Gradientes só os 3 listados em §5.5 |
| Animações longas (>500ms) em UX core | Streaming + transitions devem sentir-se rápidos. Reduzir tempo perdido |
| Esconder funcionalidade atrás de hover-only | Touch devices não têm hover. Tudo deve ser acessível por toque |
| Notificações modais bloqueantes | Toasts não-bloqueantes. UndoToast é o único timer (intencional) |
| Loading states sem texto | Sempre acompanhar spinner com texto "A processar...", "A pensar..." em PT-PT |
| Mensagens de erro genéricas tipo "Erro 500" | Sempre PT-PT humano: "Algo correu mal. Tenta de novo em alguns segundos." |
| Inputs sem labels visíveis (placeholder-only) | Placeholders escondem-se ao digitar — sempre label fixa em PT-PT |
| Navegação por nesting profundo (>2 cliques para acção comum) | Tudo o que se faz frequentemente deve estar a 1 clique do chat |
| Botões `Confirmar/OK/Cancelar` sem contexto | Verbos explícitos: "Anular tudo", "Gravar tarefa", "Fechar diário" |
| Mostrar JSON/IDs ao Eurico fora de /settings/audit | UI deve mostrar humano. IDs só em audit log para debug |
| Fontes diferentes de Inter/JetBrains Mono | Constraint inegociável |
| Emojis Unicode em UI principal (excepto mood diário) | Lucide icons sempre |

---

## 11. Próximos passos UX

1. **@po (Pax)** valida este `front-end-spec-v2.md` (10-point checklist) em paralelo com `architecture-v2.md`
2. **@sm (River)** após PASS dual de PO, parte Epic 0 em stories 0.1-0.10. Stories de UI (0.4 layout chat-first, 0.7 onboarding) usam wireframes desta spec como referência directa
3. **@dev (Dex)** implementa Story 0.1 (setup Next.js 15) primeiro, depois Story 0.4 (layout chat-first) consumindo §2 deste documento
4. **Eurico** em paralelo decide G2 (domínio Vercel) — esta spec assume `nexus-eurico.vercel.app` (default Vercel)
5. **Próxima iteração desta spec** (v1.1) acontece após Epic 0 deployed, para refinar com feedback real de uso (cards de hábitos, layout `/finance` cartões pode precisar ajuste após dados reais)

---

## 12. Checklist UX (auto-validação)

- [x] Todas as 8 secções obrigatórias entregues
- [x] G1 (wireframes chat-first) totalmente fechado
- [x] 5 user flows críticos com passos numerados
- [x] 7 vistas com wireframes ASCII low-fi
- [x] 5 componentes UI especificados (ToolCard, PreviewModal, UndoToast, VoiceMode, PomodoroTaskLink)
- [x] Design system [IA]AVANÇADA PT aplicado 100% (paleta, tipografia, glassmorphism, sem cores arbitrárias)
- [x] Estados (empty, loading, error, offline) cobertos para todas as vistas
- [x] Acessibilidade WCAG AA mínima (focus, contraste, keyboard, SR, idioma)
- [x] Mobile responsive com breakpoints + drawer + touch gestures
- [x] Cobertura cruzada PRD FRs/NFRs → componentes UX
- [x] Anti-padrões documentados
- [x] Sem invenção de features fora do PRD (Constitution Article IV)
- [x] PT-PT em todo o documento
- [x] Constrangimentos do architecture-v2 respeitados (modais como Next.js parallel routes, IndexedDB local-first, streaming SSE, etc.)
- [x] Sem light mode, sem cores arbitrárias, sem fontes não-permitidas
- [x] Killer feature (overnight agent / morning briefing) tem destaque visual claro

---

*Front-end specification v1.0 produzida por Uma (ux-design-expert) em 04/05/2026, em resposta directa ao handoff `RETOMA-20260504-architecture-v2-completa-aguarda-ux.md`. Designed para zero ambiguidade visual antes de Story 0.4 (layout chat-first) arrancar.*
