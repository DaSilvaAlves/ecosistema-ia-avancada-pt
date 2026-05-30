# Nexus v2 — Architecture Document

**Autor:** Aria (architect)
**Data:** 04/05/2026
**Versão:** 1.0 (architecture inicial pós-PRD v2)
**Estado:** Draft — pendente validação @po
**Trace:**
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (96 FRs, 24 NFRs, 8 Epics)
- `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` (verdict CONCERNS, gaps G3/G4)
- `imersao-tools/nexus/src/` (código v1 inspeccionado linha-a-linha)
- `.aiox-core/constitution.md` (Article IV — No Invention)
- `.claude/rules/design-system-ia-avancada.md` (paleta, tipografia)

---

## 1. Sumário e Decisões Fechadas

Este documento resolve os gaps técnicos G3 e G4 identificados pela validação PO, e estabelece o blueprint completo de architecture para o Nexus v2. **Não reabre decisões já tomadas pelo Eurico** (Stack Next.js 15, Sonnet 4.6+Haiku 4.5, Web Push, Web Speech, Vercel KV, Telegram Bot, etc.).

### Decisões Architecturais — Sumário (ADR-style)

| # | Decisão | Justificação | Trade-off aceite |
|---|---------|--------------|------------------|
| ADR-1 | **Edge Runtime** para `/api/anthropic/proxy`, `/api/agent/prompt`, `/api/telegram/webhook`. **Node Runtime** para `/api/auth/*`, `/api/google/*`, `/api/ocr/receipt`, `/api/push/*` | Edge para latência baixa em chat/streaming + globalDistribution. Node para SDKs que precisam de Node APIs (`googleapis`, `web-push`, `crypto.createHmac` para Telegram, base64 ops grandes em OCR) | Edge tem cold-start menor mas limita SDKs. Aceitável: split por endpoint |
| ADR-2 | **Persistência: IndexedDB via Dexie 4 desde dia 1**, com migration `localStorage v1 → IndexedDB`. localStorage só para `auth.session`, `ui.theme`, `chat.draft` (< 100KB combinado) | Dataset estimado 6 meses ≈ 3MB chega ao limite localStorage (5MB). FRs analíticos (FR21 projecção 30d, FR26 heatmap, FR45/53 full-text) precisam de queries/índices que localStorage não tem. Dexie é 24KB gzip, type-safe, suporta schema versioning | Aprendizagem Dexie (1-2h). Vale: PRD evita refactor mid-project (Risco #3 do PRD) |
| ADR-3 | **Markdown editor: Tiptap 2.x** (não lexical). Headless, baseado em ProseMirror, 30+ extensions oficiais. Suporta tasks/lists/code/links nativamente | Lexical (Meta) é mais novo e tem menos extensões prontas para markdown PT-PT. Tiptap tem track-record em apps de produtividade (Notion-like). Bundle: ~110KB gzip vs Lexical ~80KB — diferença não-crítica | Bundle ligeiramente maior (~30KB) |
| ADR-4 | **Testing: Vitest 1.x + Playwright 1.x + MSW 2 (Mock Service Worker)** para mocks Anthropic/Google/Telegram. Cobertura 60% packages core (cérebro/tarefas/finanças) | MSW intercepta a nível de fetch em Vitest Node. Para Playwright (browser real) ver ADR-8 (`page.route()` em endpoint interno) — MSW Node não intercepta browser context | Setup MSW (~2h) + estratégia dupla unit/E2E (ADR-8) |
| ADR-5 | **Tool Registry pattern**: registo declarativo central (`/lib/agent/tools/registry.ts`) onde cada Epic adiciona as suas tools. Discovery por domínio. Schema Zod para args/returns | PRD §6.1 lista 17+ intents distribuídos por 8 epics. Sem registry central, cada Epic acaba a tocar no executor. Registry permite que cada Epic só toque no seu próprio domínio | Boilerplate inicial (~1 story em Epic 1). ROI alto a partir do Epic 2 |
| ADR-6 | **KV namespacing independente para Undo vs ConfirmationProvider**: `nexus:undo:run:*` (Story 1.7) vs `nexus:agent:confirm:*` (Story 1.8). Partilham cliente `kv` mas namespaces distintos | Evita acoplamento entre módulos com TTLs diferentes (Undo 30s, Confirm 60s). Permite evolução independente | Detalhe vive in-story (`stories/active/1.7.story.md`) |
| ADR-7 | **Cross-process ConfirmationProvider via KV polling** (`KvConfirmationProvider`): Edge process A emite `preview_request` → escreve em KV → Edge process B (rota `/api/agent/confirm`) escreve confirmação → A faz polling KV até resolver | Permite que `runAgent` (Edge stateless) coordene confirmação UI sem partilhar memória entre processos | Polling adiciona latência (~100ms). Detalhe in-story (`stories/active/1.8.story.md`) e em `lib/agent/kv-confirmation-provider.ts` |
| ADR-8 | **Mocking E2E via Playwright `page.route()` em endpoint INTERNO** (`/api/agent/prompt`) — não em `api.anthropic.com`. Cobre Story 1.10 regression suite (50 prompts PT-PT) | MSW Node não intercepta browser fetch (Playwright). `page.route()` em endpoint interno é a fronteira natural do Nexus, evita coupling com SDK Anthropic, e permite modo staging real (`USE_REAL_API=true`) | Mocks têm de manter fidelidade ao protocolo `ExecutorSSEEvent`. Detalhe em §5.5 abaixo |
| **ADR-9** | **Tool-calling executor corre CLIENT-SIDE (browser), com `ctx.db` = instância Dexie real.** O Edge mantém APENAS `/api/anthropic/proxy` (segredo da API key + streaming). O loop classifier→executor→tools passa a ser orquestrado em `useAgentStream` no browser. **Supersede a implicação do ADR-1 de que `/api/agent/prompt` orquestra a execução de tools** (mantém-se Edge só para o proxy de inferência). | **Bug de produção (30/05/2026):** o executor Edge injectava `ctx.db = null` (Edge não tem IndexedDB) mas as tools chamam `ctx.db.tasks/projects/...` directamente → `Cannot read properties of null`. As **tools de leitura** (`listar_tarefas`, `listar_atrasadas`, `consultar_balanco`, `consultar_categoria`, `consultar_projecto`) precisam de **dados reais do Dexie re-injectados como `tool_result` a meio do loop** — o command pattern (server emite, cliente aplica) só serve escritas e exigiria round-trip KV por cada leitura (latência ADR-7 × N). Num app local-first single-user, os dados estão NO browser → orquestrar onde a data vive. | Refactor do executor (mover `toolCallingLoop`+`buildExecutionContext` para client; `/api/agent/prompt` fica thin/removido). **Simplifica** ADR-6/ADR-7 (undo + confirmation passam a in-process no browser, sem KV polling cross-process). A fidelidade de mocks E2E (ADR-8) mantém-se na fronteira `/api/anthropic/proxy`. |

---

## 2. System Context (C4 Level 1)

```
                    ┌──────────────────────────────────────┐
                    │  Eurico (single-user)                │
                    │  Browser Chrome/Edge + Telegram      │
                    └────────┬─────────────────┬───────────┘
                             │                 │
                  HTTPS/WSS  │                 │ Telegram updates
                             ▼                 ▼
                    ┌──────────────────────────────────────┐
                    │       Nexus v2 — Next.js 15          │
                    │   (Vercel: Edge + Node Functions)    │
                    │                                      │
                    │  ┌──────────────────────────────┐   │
                    │  │ Frontend (App Router/RSC)    │   │
                    │  │  - Chat-first UI             │   │
                    │  │  - Sidebar widgets v1        │   │
                    │  │  - PWA + Service Worker      │   │
                    │  │  - IndexedDB (Dexie)         │   │
                    │  └──────────────────────────────┘   │
                    │  ┌──────────────────────────────┐   │
                    │  │ Backend (API routes)         │   │
                    │  │  - Edge: agent, telegram,    │   │
                    │  │    anthropic-proxy           │   │
                    │  │  - Node: auth, oauth, ocr,   │   │
                    │  │    push                      │   │
                    │  └──────────────────────────────┘   │
                    └────────┬───────────┬─────────────┬───┘
                             │           │             │
                ┌────────────▼┐  ┌───────▼─────┐  ┌────▼────────┐
                │ Anthropic   │  │ Google      │  │ Telegram    │
                │ Sonnet 4.6  │  │ Calendar +  │  │ Bot API     │
                │ Haiku 4.5   │  │ Gmail       │  │             │
                │ Vision      │  │ (OAuth)     │  │             │
                └─────────────┘  └─────────────┘  └─────────────┘

                Vercel KV (free 10MB) ── refresh tokens, push subscriptions, audit log overflow
```

---

## 3. Repository Layout (paralelo a v1)

Conforme decisão Eurico (handoff §"Stack final"): "Build não destrói código v1 — reuso de widgets". Estrutura proposta:

```
imersao-tools/nexus/
├── src/                       # v1 INTOCADO durante migração (Vite + React 19)
│   └── ...                    # tudo o que existe hoje
├── v2/                        # Nova app Next.js 15 (Epic 0 Story 0.1)
│   ├── app/                   # App Router
│   │   ├── (auth)/login/page.tsx
│   │   ├── (app)/page.tsx     # /  → Chat principal
│   │   ├── (app)/tasks/       # vista Kanban/lista/calendário
│   │   ├── (app)/finance/
│   │   ├── (app)/habits/
│   │   ├── (app)/journal/
│   │   ├── (app)/knowledge/
│   │   ├── (app)/settings/
│   │   ├── api/
│   │   │   ├── anthropic/proxy/route.ts        # Edge
│   │   │   ├── agent/prompt/route.ts           # Edge (streaming)
│   │   │   ├── telegram/webhook/route.ts       # Edge
│   │   │   ├── auth/login/route.ts             # Node
│   │   │   ├── auth/logout/route.ts            # Node
│   │   │   ├── google/oauth/[provider]/route.ts # Node
│   │   │   ├── google/calendar/sync/route.ts   # Node
│   │   │   ├── google/gmail/classify/route.ts  # Node
│   │   │   ├── ocr/receipt/route.ts            # Node (base64)
│   │   │   ├── push/subscribe/route.ts         # Node (web-push)
│   │   │   └── push/send/route.ts              # Node (cron callable)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── chat/              # ChatPanel, MessageList, InputBox, ToolCard
│   │   ├── widgets/           # PORTADOS de v1: Greeting, Pomodoro, GitHub, Markets, Links, Goodnight, Morning
│   │   ├── tasks/             # Kanban, Calendar, List, TaskModal
│   │   ├── finance/
│   │   ├── habits/
│   │   ├── journal/
│   │   ├── knowledge/
│   │   └── ui/                # Botões, modais, primitives
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── classifier.ts              # Haiku 4.5
│   │   │   ├── executor.ts                # Sonnet 4.6 function calling
│   │   │   ├── tools/
│   │   │   │   ├── registry.ts            # registo central
│   │   │   │   ├── tasks.ts               # tools tarefas (Epic 2)
│   │   │   │   ├── finance.ts             # tools finanças (Epic 3)
│   │   │   │   ├── habits.ts              # tools hábitos (Epic 4)
│   │   │   │   ├── journal.ts             # (Epic 5)
│   │   │   │   ├── knowledge.ts           # (Epic 5)
│   │   │   │   ├── calendar.ts            # (Epic 6)
│   │   │   │   ├── gmail.ts               # (Epic 6)
│   │   │   │   ├── telegram.ts            # (Epic 6)
│   │   │   │   └── receipt.ts             # (Epic 7)
│   │   │   ├── audit.ts                   # Dexie tabela agent_runs
│   │   │   └── undo.ts                    # 30s window
│   │   ├── db/
│   │   │   ├── client.ts                  # Dexie singleton
│   │   │   ├── schema.ts                  # Tabelas + indexes + versioning
│   │   │   └── migrations/                # localStorage v1 → IndexedDB v2
│   │   ├── auth/
│   │   │   ├── session.ts                 # cookie HttpOnly + verify
│   │   │   └── password.ts                # bcrypt compare contra env hash
│   │   ├── google/
│   │   │   ├── oauth.ts                   # googleapis OAuth2 client
│   │   │   ├── calendar.ts                # API wrapper
│   │   │   └── gmail.ts
│   │   ├── push/
│   │   │   ├── vapid.ts
│   │   │   └── subscription.ts            # Vercel KV
│   │   ├── markets/                       # PORTADO de v1 (Yahoo via allorigins.win)
│   │   ├── github/                        # PORTADO de v1
│   │   └── shared/
│   │       ├── format.ts                  # PT-PT (€1.234,56, 14/03/2026)
│   │       ├── recurrence.ts              # rrule wrapper
│   │       └── env.ts                     # validação env Zod
│   ├── hooks/
│   │   ├── useDexie.ts                    # query reativa Dexie + React 19
│   │   ├── usePomodoro.ts                 # PORTADO de v1
│   │   ├── usePush.ts                     # subscription state
│   │   └── useVoice.ts                    # Web Speech API
│   ├── public/
│   │   ├── sw.js                          # Service Worker manual (não Workbox)
│   │   ├── manifest.json
│   │   └── icons/
│   ├── styles/
│   │   ├── globals.css                    # Design system [IA]AVANÇADA PT
│   │   └── tokens.css                     # CSS custom properties (#04040A, etc.)
│   ├── tests/
│   │   ├── unit/                          # Vitest
│   │   ├── e2e/                           # Playwright
│   │   ├── mocks/                         # MSW handlers (anthropic, google, telegram)
│   │   └── fixtures/
│   ├── package.json                       # NEW (separado de v1)
│   ├── next.config.ts
│   ├── tsconfig.json                      # strict, paths "@/*"
│   ├── tailwind.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   └── .env.example                       # zero secrets, lista variáveis
└── docs/                                  # já existe — PRD, validations, handoffs
```

**Após Epic 0 estabilizar (todos os widgets v1 portados, build verde, deploy Vercel funcional), Epic 8 Story 8.10 elimina `src/` v1.** Decisão deferida para que ocorra apenas quando v2 cobrir 100% da utilidade actual.

---

## 4. Resolução do Gap G3

### 4.1 Edge vs Node Runtime — decisão por endpoint

| Endpoint | Runtime | Razão | Limite |
|----------|---------|-------|--------|
| `/api/anthropic/proxy` | **Edge** | Proxy thin de Anthropic (passa headers, streaming SSE) | <1s overhead, 25MB resp body |
| `/api/agent/prompt` | **Edge** | Streaming token-by-token do executor + tool calls | 30s timeout (suficiente para multi-intent) |
| `/api/telegram/webhook` | **Edge** | Latência Telegram exige resposta <5s; webhook só faz fan-out a outros endpoints | 30s timeout |
| `/api/auth/login` | **Node** | bcrypt requer crypto Node; cookie via `next/headers` é universal | `nodejs20.x` |
| `/api/auth/logout` | **Node** | Idem (consistência) | — |
| `/api/google/oauth/*` | **Node** | `googleapis` SDK precisa Node (`http`, `crypto`) | — |
| `/api/google/calendar/sync` | **Node** | Idem; pode tomar 5-10s em sync delta | — |
| `/api/google/gmail/classify` | **Node** | Idem; chamadas batch ao Gmail | — |
| `/api/ocr/receipt` | **Node** | Recebe base64 (até 4MB); chama Anthropic Vision; precisa de FormData parsing robusto | 4.5MB body |
| `/api/push/subscribe` | **Node** | `web-push` lib usa Node crypto | — |
| `/api/push/send` | **Node** | Idem; chamado via Vercel Cron | — |

**Regra geral:** Edge se só faz fetch+stream sem SDKs Node-only. Node se usa SDKs nativos ou body parsing complexo.

### 4.2 IndexedDB lib: Dexie 4

Razão da escolha:

| Opção | Bundle | Type-safe | Schema versioning | Reactividade | Veredicto |
|-------|--------|-----------|-------------------|--------------|-----------|
| Raw IndexedDB API | 0KB | ❌ | ❌ manual | ❌ manual | Rejeitado — boilerplate massivo |
| `idb` (Jake Archibald) | ~5KB | parcial | manual | ❌ | Aceitável mas faz pouco |
| **Dexie 4** | ~24KB gzip | ✅ TypeScript first-class | ✅ versão+upgrade hooks | ✅ liveQuery + `useLiveQuery` hook | **ESCOLHIDO** |
| RxDB | 100KB+ | ✅ | ✅ | ✅ | Rejeitado — overkill, sync é principal feature e não precisamos |

Dexie + `dexie-react-hooks`:

```ts
// lib/db/client.ts
import Dexie, { Table } from 'dexie';

export class NexusDB extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  transactions!: Table<Transaction, string>;
  habits!: Table<Habit, string>;
  habit_logs!: Table<HabitLog, string>;
  goals!: Table<Goal, string>;
  reminders!: Table<Reminder, string>;
  journal_entries!: Table<JournalEntry, string>;
  knowledge_areas!: Table<KnowledgeArea, string>;
  knowledge_notebooks!: Table<KnowledgeNotebook, string>;
  knowledge_notes!: Table<KnowledgeNote, string>;
  agent_runs!: Table<AgentRun, string>;
  chat_messages!: Table<ChatMessage, string>;

  constructor() {
    super('nexus_v2');
    this.version(1).stores({
      tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt',
      projects: 'id, status, createdAt',
      transactions: 'id, accountId, cardId, category, date, recurrenceId, [accountId+date]',
      habits: 'id, frequency, category, createdAt',
      habit_logs: 'id, habitId, date, [habitId+date]',
      goals: 'id, status, deadline',
      reminders: 'id, fireAt, status, [status+fireAt]',
      journal_entries: 'id, date, mood',
      knowledge_areas: 'id, name',
      knowledge_notebooks: 'id, areaId',
      knowledge_notes: 'id, notebookId, *tags, updatedAt',
      agent_runs: 'id, timestamp, [timestamp+status]',
      chat_messages: 'id, conversationId, timestamp, [conversationId+timestamp]',
    });
  }
}

export const db = new NexusDB();
```

### 4.3 Markdown editor: Tiptap 2

```bash
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-link @tiptap/extension-placeholder
```

Justificação contra Lexical:
- Tiptap tem 14k+ stars, Lexical tem 18k+ — ambos saudáveis
- Tiptap tem 30+ extensões oficiais incluindo `task-list` (necessário para diário FR42-46 e Brain Dump FR47-50 que produzem checkboxes)
- Lexical é mais novo (Meta 2022), API ainda em mudanças mais frequentes
- Tiptap suporta serialização JSON E Markdown out-of-box; Lexical exige parser custom para Markdown
- Bundle: Tiptap base ~110KB gzip, Lexical ~80KB — diferença ~30KB irrelevante para uso interno

**Uso restrito:** apenas Diário (FR42), Brain Dump (FR47), Notas de Conhecimento (FR51-52). Restantes campos textuais permanecem `<textarea>` simples.

### 4.4 Migration localStorage v1 → IndexedDB v2

Story dedicada (Epic 2 Story 2.2) corre **uma única vez** no primeiro carregamento de v2:

```ts
// lib/db/migrations/v1-to-v2.ts
const MIGRATION_FLAG_KEY = 'nexus_v1_migrated_to_v2';

export async function migrateV1ToV2(): Promise<MigrationResult> {
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return { migrated: 0, status: 'already-done' };
  }

  const v1Tasks = JSON.parse(localStorage.getItem('nexus_tasks') ?? '[]') as V1Task[];
  const v1Notes = JSON.parse(localStorage.getItem('nexus_notes') ?? '[]') as V1Note[];
  const v1Config = JSON.parse(localStorage.getItem('nexus_config') ?? '{}') as Partial<V1Config>;

  const tasksV2: TaskV2[] = v1Tasks.map(t => ({
    id: t.id,
    title: t.text,
    description: '',
    priority: t.priority,
    status: t.status ?? (t.done ? 'done' : 'todo'),
    dueDate: t.dueDate ?? null,
    projectId: null,
    tags: [],
    context: t.context ?? null,
    lastWorkedAt: t.lastWorkedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: Date.now(),
  }));

  await db.transaction('rw', db.tasks, db.knowledge_notes, async () => {
    await db.tasks.bulkAdd(tasksV2);
    // notas v1 (free-text) viram notas knowledge sem caderno (caderno default "_inbox")
    // ...
  });

  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  // localStorage v1 mantém-se para rollback emergência (Epic 8 Story 8.10 limpa)
  return { migrated: tasksV2.length, status: 'success' };
}
```

**Idempotência garantida pelo flag.** Se Eurico tiver dados em v1 que ainda não tenham sido migrados (ex: criou tarefas em v1 mesmo após v2 deploy), a migration corre uma vez e não duplica.

---

## 5. Resolução do Gap G4 — Test Strategy

### 5.1 Stack de testing

| Layer | Tool | Cobertura alvo |
|-------|------|----------------|
| Unit | Vitest 1.x + jsdom | 60% packages core (`lib/agent/*`, `lib/db/*`, `lib/shared/*`) |
| Component | Vitest + @testing-library/react | Smoke nos componentes core (ChatPanel, TaskCard, modais críticos) |
| Integration | Vitest + MSW + fake-indexeddb | Tools cérebro end-to-end (classifier → executor → DB) |
| E2E | Playwright (Chromium) | 5 fluxos críticos: login, primeiro prompt multi-intent, criar tarefa via UI, OAuth Google mock, deploy smoke |
| Manual | Eurico | OCR recibo real, voice mode, push browser, Telegram |

### 5.2 Mock Service Worker (MSW) handlers

**Decisão:** MSW corre **apenas em Vitest** (`setupFiles`). Para Playwright (browser real), Story 1.10 estabeleceu **ADR-8** (ver §5.5) — interceptar o endpoint INTERNO `POST /api/agent/prompt` via `page.route()`, em vez de tentar reutilizar handlers MSW Node (que não interceptam browser fetch).

```ts
// tests/mocks/handlers/anthropic.ts
import { http, HttpResponse } from 'msw';

export const anthropicHandlers = [
  // Classifier (Haiku) — devolve intents fixos para prompts canónicos do test set
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as AnthropicRequest;
    const userMsg = body.messages.find(m => m.role === 'user')?.content as string;

    if (userMsg.includes('paguei €78,70') && userMsg.includes('amanhã reunião 15h')) {
      return HttpResponse.json({
        id: 'msg_test_multi',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [{
          type: 'tool_use',
          id: 'toolu_1',
          name: 'criar_finança_variavel',
          input: { valor: 78.70, descricao: 'supermercado', categoria: 'Mercearia' },
        }, {
          type: 'tool_use',
          id: 'toolu_2',
          name: 'criar_evento_calendar',
          input: { titulo: 'reunião', data: 'tomorrow', hora: '15:00' },
        }],
        stop_reason: 'tool_use',
        usage: { input_tokens: 100, output_tokens: 50 },
      });
    }
    // fallback
    return HttpResponse.json({ /* ... */ });
  }),
];

// tests/mocks/handlers/google.ts — Calendar + Gmail
// tests/mocks/handlers/telegram.ts — Bot API
```

### 5.3 Test set canónico (50 prompts PT-PT)

Story 1.10 (PRD) cria conjunto fixo de 50 prompts em `tests/fixtures/prompts-pt-pt.json` para regression testing. Cada prompt tem `expected_intents` e `expected_tools_called`. Permite medir métrica do PRD AC1: "intent accuracy >= 85%". Ficheiro vive em git, é a baseline.

### 5.4 Cobertura — proibições

- **Coverage gate de 60%** APENAS em `lib/agent/`, `lib/db/`, `lib/shared/` — não na UI (uso pessoal, não justifica)
- Vercel preview build NÃO é bloqueado por cobertura (apenas tests passing). PR para `main` exige cobertura.
- E2E Playwright corre apenas no GitHub Actions pre-merge — não em cada `npm run dev`.

### 5.5 ADR-8 — Mocking E2E Strategy (Playwright `page.route()` em endpoint interno)

**Status:** Accepted (Story 1.10, 09/05/2026)

**Context.** Story 1.10 introduz a E2E regression suite (50 prompts PT-PT) executada via Playwright em browser real (Chromium). Os MSW handlers existentes (`tests/mocks/handlers/anthropic.ts`) servem **apenas Vitest Node** — não são interceptados pelo Playwright porque correm em runtime diferente do dev server Next.js. Esta restrição não estava documentada no ADR-4 original (que assumia "mesmos handlers, dois consumidores") e foi descoberta empiricamente durante a implementação da Story 1.10.

**Decision.** Para testes E2E que exercitam o pipeline de chat completo, usar **Playwright `page.route()`** para interceptar o endpoint **INTERNO** `POST /api/agent/prompt` (em vez de `https://api.anthropic.com/v1/messages`).

Implementação canónica:

| Ficheiro | Linhas | Responsabilidade |
|----------|--------|------------------|
| `tests/e2e/regression/helpers/route-handler.ts` | ~75 | `installMockRoute(page, fixturePrompts)` regista `page.route('**/api/agent/prompt', ...)`; matching por `prompt` exacto via `Map`; 404 explícito em mismatches |
| `tests/e2e/regression/helpers/mock-events.ts` | ~310 | 21 `mockProfile` builders que produzem sequências de `ExecutorSSEEvent` (`meta`, `tool_start`, `tool_complete`, `tool_error`, `text_delta`, `preview_request`, `done`) consistentes com `lib/agent/executor.ts:185-209` |
| `tests/fixtures/prompts-pt-pt.json` | ~520 | 50 prompts PT-PT em 11 categorias, cada um com `mockProfile` declarativo |

**Vantagens:**

- Endpoint interno é a **fronteira natural** do Nexus (entry point único do pipeline) — mocking aqui é semanticamente mais limpo que mockar a SDK Anthropic
- Mock determinístico replicável (mesma sequência SSE em qualquer máquina)
- Sem coupling com SDK Anthropic interno (changes no SDK não quebram suite E2E)
- Permite testes de comportamento da UI (ToolCards, UndoToast, preview gates) sem latência LLM
- Modo staging (`USE_REAL_API=true`) **desactiva** o `page.route()` — request vai ao server real para o subset de prompts taggeados `@real-api` (5 prompts canónicos)

**Desvantagens:**

- Não valida o pipeline server-side `runAgent` em CI (já coberto por unit tests Story 1.5)
- Mocks têm de manter fidelidade ao protocolo `ExecutorSSEEvent` (validado em type-check via `helpers/types.ts`)

**Performance Budgets (sub-decisão consolidada):**

| Ambiente | Target p95 | Origem |
|----------|------------|--------|
| **CI** (`page.route()` mock) | `< 2s` | Inferência operacional — sem latência LLM real |
| **Staging** (`USE_REAL_API=true`, subset `@real-api`) | `< 6s` | PRD §10 AC5 (linha 428) + NFR1 (linha 274) |

**Alternativas consideradas e rejeitadas:**

1. **Reutilizar MSW Node server para Playwright** — Não funciona; MSW Node não intercepta browser fetch
2. **Configurar MSW browser worker** (service worker) — Adiciona complexidade infraestrutural; service worker em CI requer extra setup
3. **Mockar `https://api.anthropic.com` directamente em Playwright** — Acoplamento ao SDK; quebra a abstração do endpoint interno
4. **Configurar dev server com `MOCK_MODE=true`** — Invasivo (modifica produção code para teste); rejeitado

**Trace:**

- Story 1.10 — implementação (`tests/e2e/regression/`)
- PO Validation 09/05/2026 — Should-Fix SF1 originalmente pedia ADR formal (numerado erradamente como ADR-7 — corrigido aqui para ADR-8 porque ADR-7 já existe — Story 1.8 KV polling)
- QA Gate 09/05/2026 — F-CONCERNS-3 (este ADR)
- Workflow CI: `.github/workflows/e2e-regression.yml` (bloqueante no PR para `main`)

---

## 6. Modelo de Dados (alto-nível)

DDL detalhado é responsabilidade do `@data-engineer` se for chamado. Aqui dou esquema lógico para cada Epic. Todas as tabelas vivem em IndexedDB via Dexie.

### 6.1 Epic 1 — Cérebro

```ts
interface AgentRun {
  id: string;                    // uuid
  timestamp: number;             // epoch ms
  prompt: string;                // texto original
  intents: string[];             // ['criar_tarefa','criar_finança_variavel']
  toolCalls: ToolCall[];         // todos os tool calls executados
  status: 'success' | 'partial' | 'failed' | 'reverted';
  durationMs: number;
  modelClassifier: string;       // 'claude-haiku-4-5'
  modelExecutor: string;         // 'claude-sonnet-4-6'
  inputTokens: number;
  outputTokens: number;
  errorMessage?: string;
}

interface ToolCall {
  toolName: string;
  args: unknown;                 // validado por Zod schema da tool
  result: unknown;
  durationMs: number;
  reverted: boolean;
}

interface ChatMessage {
  id: string;
  conversationId: string;        // 1 conversation = 1 sessão de chat (default 'main')
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  agentRunId?: string;           // FK para AgentRun
  timestamp: number;
}
```

### 6.2 Epic 2 — Tarefas

```ts
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  dueDate: string | null;        // ISO date YYYY-MM-DD
  projectId: string | null;
  tags: string[];
  context: string | null;        // "onde parei"
  lastWorkedAt: number | null;
  recurrenceId: string | null;   // FK Recurrence
  parentTaskId: string | null;   // se for instância recorrente
  createdAt: number;
  updatedAt: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'done';
  startDate: string;
  deadline: string | null;
  createdAt: number;
}

interface Recurrence {
  id: string;
  rule: string;                  // RRULE string (rrule lib)
  startDate: string;
  endDate: string | null;
  ownerType: 'task' | 'transaction' | 'habit' | 'reminder';
  ownerId: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}
```

### 6.3 Epic 3 — Finanças

```ts
interface Account {
  id: string;
  name: string;                  // "Millennium principal"
  type: 'checking' | 'savings' | 'cash';
  balance: number;               // EUR cêntimos (1234,56 → 123456)
  createdAt: number;
}

interface Card {
  id: string;
  name: string;                  // "Visa Millennium"
  accountId: string;
  closingDay: number;            // dia do mês fecho fatura (1-31)
  dueDay: number;                // dia do mês pagamento
  limit: number | null;
}

interface Transaction {
  id: string;
  amount: number;                // cêntimos. Negativo = saída, positivo = entrada
  category: string;              // "Mercearia"
  description: string;
  date: string;                  // ISO date
  accountId: string | null;
  cardId: string | null;
  recurrenceId: string | null;
  installmentId: string | null;  // se for parcela de compra parcelada
  createdAt: number;
}

interface Installment {
  id: string;
  cardId: string;
  totalAmount: number;
  installments: number;          // total ex: 12
  startDate: string;
  description: string;
}

interface Category {
  name: string;                  // PK
  color: string;
  icon: string;
  isDefault: boolean;
}
```

### 6.4 Epics 4-7 — sumário

```ts
interface Habit { /* nome, frequencia (RRULE), categoria, métrica opcional */ }
interface HabitLog { /* habitId, date, value? */ }
interface Goal { /* título, prazo, tipo (numeric|boolean), target, current, milestones[] */ }
interface Reminder { /* texto, fireAt, recurrenceId?, channels: ('push'|'telegram')[] */ }
interface JournalEntry { /* date, mood (1-5), bodyMarkdown, structuredAI? */ }
interface KnowledgeArea { /* name, color, icon */ }
interface KnowledgeNotebook { /* areaId, name */ }
interface KnowledgeNote { /* notebookId, title, bodyMarkdown, tags[], sourceUrl? */ }
```

OAuth tokens, Telegram bot config, Push subscriptions vivem em **Vercel KV** (não IndexedDB):

```
nexus:auth:session:<sessionId>      → { userId, expiresAt }
nexus:google:tokens                  → { accessToken, refreshToken, expiresAt }
nexus:push:subscriptions             → [{ endpoint, keys: { p256dh, auth } }]
nexus:telegram:bot                   → { token, chatId, webhookSet }
nexus:cache:gmail:classify:<msgId>   → { bucket, classifiedAt } (TTL 7d)
```

---

## 7. Tool Registry Pattern (ADR-5 detalhado)

### 7.1 Razão

O cérebro multi-intent (Epic 1) precisa de uma forma uniforme de:
1. Saber **quais tools existem** para o classifier prompt (Haiku) e o executor prompt (Sonnet)
2. Validar **args** de cada tool contra schema antes de executar
3. **Permitir cada Epic adicionar tools** sem tocar no executor

### 7.2 Contract

```ts
// lib/agent/tools/registry.ts
import { z } from 'zod';

export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;                              // 'criar_tarefa'
  description: string;                       // PT-PT, vai para prompt
  domain: 'tasks' | 'finance' | 'habits' | 'journal' | 'knowledge'
        | 'calendar' | 'gmail' | 'telegram' | 'receipt' | 'meta';
  argsSchema: z.ZodType<TArgs>;
  resultSchema: z.ZodType<TResult>;
  requiresPreview: boolean;                  // true = sempre preview antes
  reversible: boolean;                       // true = guarda inverse para undo
  execute: (args: TArgs, ctx: ExecutionContext) => Promise<TResult>;
  reverse?: (args: TArgs, result: TResult, ctx: ExecutionContext) => Promise<void>;
}

export interface ExecutionContext {
  userId: 'eurico';
  db: NexusDB;
  kv: VercelKV;
  fetch: typeof fetch;
  logger: Logger;
  runId: string;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(def: ToolDefinition) {
    if (this.tools.has(def.name)) throw new Error(`Tool ${def.name} já registada`);
    this.tools.set(def.name, def);
  }

  get(name: string): ToolDefinition | undefined { return this.tools.get(name); }
  byDomain(domain: string): ToolDefinition[] { /* ... */ }

  // Para Anthropic function calling
  toAnthropicTools(): AnthropicTool[] {
    return [...this.tools.values()].map(t => ({
      name: t.name,
      description: t.description,
      input_schema: zodToJsonSchema(t.argsSchema),
    }));
  }
}

export const toolRegistry = new ToolRegistry();
```

### 7.3 Exemplo — Epic 2 regista tools de tarefas

```ts
// lib/agent/tools/tasks.ts
import { z } from 'zod';
import { toolRegistry } from './registry';
import { db } from '@/lib/db/client';

const CriarTarefaArgs = z.object({
  titulo: z.string().min(1).max(200),
  prioridade: z.enum(['alta', 'media', 'baixa']).default('media'),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  projecto: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
});

toolRegistry.register({
  name: 'criar_tarefa',
  description: 'Cria uma nova tarefa. Use para qualquer pedido de "criar/adicionar/lembrar de fazer X".',
  domain: 'tasks',
  argsSchema: CriarTarefaArgs,
  resultSchema: z.object({ id: z.string(), titulo: z.string() }),
  requiresPreview: false,
  reversible: true,
  execute: async (args, ctx) => {
    const id = crypto.randomUUID();
    await ctx.db.tasks.add({
      id,
      title: args.titulo,
      priority: args.prioridade === 'alta' ? 'high' : args.prioridade === 'baixa' ? 'low' : 'medium',
      status: 'todo',
      dueDate: args.prazo,
      projectId: args.projecto,
      tags: args.tags,
      description: '',
      context: null,
      lastWorkedAt: null,
      recurrenceId: null,
      parentTaskId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id, titulo: args.titulo };
  },
  reverse: async (_args, result, ctx) => {
    await ctx.db.tasks.delete(result.id);
  },
});
```

### 7.4 Inventário inicial de tools (por Epic)

| Epic | Tools | Count |
|------|-------|-------|
| 2 | criar_tarefa, completar_tarefa, listar_tarefas, listar_atrasadas, vincular_tarefa_projecto, criar_projecto, consultar_projecto | 7 |
| 3 | criar_finança_variavel, criar_finança_recorrente, criar_cartao, criar_parcelada, consultar_balanço, consultar_categoria | 6 |
| 4 | criar_habito, registar_habito_concluido, consultar_evolucao_habito, criar_meta, actualizar_meta, consultar_metas, criar_lembrete, listar_lembretes, cancelar_lembrete | 9 |
| 5 | criar_entrada_diario, consultar_diario, pesquisar_diario, brain_dump, criar_area, criar_caderno, criar_nota, pesquisar_conhecimento, pesquisar_web_e_criar_nota | 9 |
| 6 | criar_evento_calendar, actualizar_evento_calendar, listar_eventos, listar_emails_importantes, criar_draft_gmail, arquivar_email, enviar_telegram | 7 |
| 7 | processar_recibo | 1 |
| **Total** | | **39 tools** |

Anthropic Sonnet 4.6 suporta tool count elevado, mas envio em paralelo de 39 schemas em cada prompt é caro em tokens. **Optimização (NFR economia de tokens):** classifier (Haiku) primeiro decide domínio, executor (Sonnet) recebe apenas tools desse domínio + tools `meta` (consultar_*). Assim cada chamada tem ~10 tools em vez de 39.

---

## 8. Streaming e UX do Cérebro

```
User digita → POST /api/agent/prompt (Edge, SSE response)
                │
                ├─ classifier (Haiku) ──▶ { domains: ['tasks','finance'], confidence: 0.92 }
                │
                ├─ executor (Sonnet, stream=true)
                │     ├─ tool_use: criar_tarefa(...) ───▶ executa via registry ───▶ event
                │     ├─ tool_use: criar_finança_variavel(...) ───▶ executa ───▶ event
                │     └─ text resumo final ─▶ event
                │
                └─ persist ChatMessage + AgentRun → IndexedDB (no client após receber stream)
```

Eventos SSE enviados ao client:
- `meta` — { runId, classifierResult }
- `tool_start` — { toolName, args }
- `tool_complete` — { toolName, result }
- `tool_error` — { toolName, error }
- `text_delta` — { delta }
- `done` — { totals: { intents, toolCalls, durationMs } }

UI:
- Cards de tools aparecem em tempo real (loading → success/error)
- Texto final streamado word-by-word
- Toast de undo aparece após `done` durante 30s, com countdown visível

---

## 9. Segurança

### 9.1 Auth flow

```
Login:
  POST /api/auth/login { password }
    → bcrypt.compare(password, env.NEXUS_PASSWORD_HASH)
    → if ok: gerar sessionId (crypto.randomUUID), gravar em KV com TTL 30d
    → Set-Cookie: nexus_session=<sessionId>; HttpOnly; Secure; SameSite=Strict; Path=/
    → 200 { ok: true }

Middleware (next.config.ts):
  Match /(?!api/auth/|_next/|favicon).*
  Verifica cookie → KV lookup → 200 ou redirect /login

API auth:
  Cada handler chama getSession() de lib/auth/session.ts
  Se inválido → 401
```

### 9.2 Secrets em Vercel env

| Var | Valor | Visibilidade |
|-----|-------|--------------|
| `ANTHROPIC_API_KEY` | sk-ant-... | server-only |
| `NEXUS_PASSWORD_HASH` | bcrypt hash da password do Eurico | server-only |
| `GOOGLE_OAUTH_CLIENT_ID` | ... | server-only |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ... | server-only |
| `GOOGLE_OAUTH_REDIRECT_URI` | https://nexus-eurico.vercel.app/api/google/oauth/callback | server-only |
| `TELEGRAM_BOT_TOKEN` | ... | server-only |
| `TELEGRAM_CHAT_ID` | ID Telegram do Eurico | server-only |
| `WEB_PUSH_VAPID_PUBLIC` | base64 | **público** (NEXT_PUBLIC_* prefix) |
| `WEB_PUSH_VAPID_PRIVATE` | base64 | server-only |
| `KV_REST_API_URL` | https://*.upstash.io | server-only |
| `KV_REST_API_TOKEN` | ... | server-only |
| `SESSION_SECRET` | random 32 bytes hex | server-only (cookie sign) |

`.env.example` lista todas com descrição PT-PT, sem valores. Vercel UI tem todos os valores.

### 9.3 Rate limiting (NFR9)

Edge Middleware (`middleware.ts`) usa Vercel KV para sliding-window por IP:

```
Limite: 60 req/min por IP em /api/*
Implementação: KV INCR + EXPIRE
Resposta 429 com header Retry-After
```

### 9.4 CSP + Security Headers

`next.config.ts` define:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), camera=(), geolocation=()
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src 'self' fonts.gstatic.com;
  img-src 'self' data: blob: https://avatars.githubusercontent.com;
  connect-src 'self' https://api.anthropic.com https://api.telegram.org;
  frame-ancestors 'none';
```

Microfone permitido (Web Speech API) — câmara/geolocation negados explicitamente.

### 9.5 Telegram webhook signature

Telegram não assina webhook com HMAC; verificação de origem é feita por **secret token**:

```ts
// app/api/telegram/webhook/route.ts (Edge)
const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return new Response('forbidden', { status: 403 });
}
```

Webhook é registado uma vez via `setWebhook` com `secret_token` correspondente.

---

## 10. Performance Budget

| Item | Alvo | Como medir |
|------|------|-----------|
| Bundle JS inicial (route /) | < 200KB gzip | Next.js bundle analyzer em CI |
| FCP (4G simulada) | < 2s | Lighthouse CI |
| LCP | < 2.5s | Lighthouse CI |
| CLS | < 0.1 | Lighthouse CI |
| p95 prompt cérebro | < 6s | Vercel Analytics + custom log |
| p95 CRUD Dexie | < 50ms | client telemetry (em audit log próprio) |
| Cold start Edge function | < 200ms | Vercel logs |
| Cold start Node function | < 800ms | Vercel logs |

Bundle analyzer (`@next/bundle-analyzer`) está no Epic 8 hardening.

---

## 11. Service Worker e PWA

**Decisão:** Service Worker **manual** em `public/sw.js`, **não Workbox**. Razão: o uso é simples (cache static + fallback offline + push handler) e Workbox adiciona complexidade desnecessária.

```js
// public/sw.js (esboço)
const CACHE_VER = 'nexus-v2-1';
const STATIC_CACHE = `static-${CACHE_VER}`;
const RUNTIME_CACHE = `runtime-${CACHE_VER}`;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll([
    '/', '/manifest.json', '/icons/192.png', '/icons/512.png',
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => !k.endsWith(CACHE_VER)).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // network-first para /api/*
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ offline: true }), {
      status: 503, headers: { 'content-type': 'application/json' },
    })));
    return;
  }
  // cache-first para assets
  e.respondWith(caches.match(e.request).then(cached => cached ?? fetch(e.request)));
});

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? { title: 'Nexus', body: 'Notificação' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icons/192.png', actions: [
      { action: 'done', title: 'Marcar feito' },
      { action: 'snooze', title: 'Snooze 10min' },
    ],
    data: { reminderId: data.reminderId },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'done') { /* postMessage ao client ou fetch /api/reminders/done */ }
  if (e.action === 'snooze') { /* idem snooze */ }
});
```

Manifest minimal:

```json
{
  "name": "Nexus", "short_name": "Nexus",
  "start_url": "/", "display": "standalone",
  "background_color": "#04040A", "theme_color": "#00F5FF",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 12. Observabilidade

| Sinal | Localização | Retenção |
|-------|-------------|----------|
| Vercel function logs | Vercel UI | 30 dias |
| `agent_runs` table | IndexedDB local | indefinida (limpeza manual em Settings) |
| Vercel Analytics | Vercel UI | 30 dias |
| Audit log UI | `/settings/audit` | mostra `agent_runs` últimos 90d |

**NFR11 (privacidade logs):** prompts NÃO vão em claro para Vercel logs. Apenas:
- `runId`, `intents detectadas`, `durationMs`, `tokens`, `status`

Conteúdo cru fica só em IndexedDB local do Eurico.

---

## 13. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml (esboço)
name: CI
on: [pull_request, push]
jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci --prefix v2
      - run: npm run lint --prefix v2
      - run: npm run typecheck --prefix v2

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci --prefix v2
      - run: npm run test:unit --prefix v2 -- --coverage
      - uses: codecov/codecov-action@v4
        with: { files: v2/coverage/coverage-final.json }

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci --prefix v2
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e --prefix v2

  coderabbit:
    if: github.event_name == 'pull_request'
    uses: ./.github/workflows/coderabbit.yml
```

Vercel:
- Branch `main` → production deploy
- Cada PR → preview deploy
- Rollback via Vercel UI (NFR20: <30s)

### 13.2 Deploy / Infrastructure — Vercel Project Configuration

> **Decisão Eurico 04/05/2026 (Story F.3 do `EPIC-0-FOLLOW-UP-DEBT.md`):** Opção A — configuração via Vercel UI (executada via CLI/API por delegação ao `@devops`).

| Item | Valor | Observações |
|------|-------|-------------|
| Vercel Account | `euricojsalves-4744's projects` (`team_Z7HN1UF28iHpUxCnZ4gT7wMF`) | Hobby tier |
| Project Name | `imercao-ia-pt` | `prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU` |
| GitHub repo | `DaSilvaAlves/ecosistema-ia-avancada-pt` | branch produção `main` |
| **Root Directory** | **`imersao-tools/nexus/v2`** | Crítico — sem isto build falha a tentar compilar a raiz do monorepo |
| Framework Preset | `nextjs` (auto-detectado) | Lê `next.config.ts` na root directory |
| Node Version | `24.x` | |
| `sourceFilesOutsideRootDirectory` | `true` | Permite usar workspace root para acessos cross-package |
| `ssoProtection` | `null` (desactivada) | Era default Vercel — desactivada para permitir acesso público a previews |
| Functions region | `iad1` (Washington) | Default Vercel — adequado para single-user no Algarve |
| Function timeout | 300s default | Suficiente para chat cérebro Sonnet 4.6 |

#### Como reproduzir esta configuração

A configuração foi feita via API REST autenticada (CLI Vercel não expõe `rootDirectory` como flag directa):

```bash
# 1. Listar projectos para identificar o id
vercel projects ls

# 2. Linkar pasta local ao projecto (cria .vercel/project.json na raiz do repo)
cd ecosistema-ia-avancada-pt
vercel link --yes --project imercao-ia-pt

# 3. Configurar root directory + framework via Vercel API
curl -X PATCH \
  "https://api.vercel.com/v9/projects/{projectId}?teamId={teamId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"imersao-tools/nexus/v2","framework":"nextjs"}'

# 4. Trigger preview deploy (a partir da raiz do repo, não da pasta v2)
vercel --yes --archive=tgz
```

**Nota importante:** o `vercel deploy` deve ser corrido a partir da **raiz do repo** (não de dentro de `imersao-tools/nexus/v2/`) porque o Vercel concatena `cwd + rootDirectory`. O ficheiro `.vercel/project.json` (com `projectId` e `orgId`) deve viver na raiz do monorepo.

#### Validação executada (04/05/2026)

| Check | Resultado |
|-------|-----------|
| Build Vercel | READY (58s) — Next.js 15 detectado, todas as rotas compiladas |
| `GET /login` | HTTP 200 (página de login serve) |
| `GET /` | HTTP 307 → `/login` (middleware redirige correctamente) |
| Preview URL | `https://imercao-ia-qye5zybyl-euricojsalves-4744s-projects.vercel.app` |

#### Pendente (fora de F.3)

Env vars críticas NÃO estão configuradas — runtime de chat cérebro/auth/Telegram/KV irá falhar até serem definidas. Lista canónica em §9.2.

---

## 14. Vercel Free Tier — limites e plano

| Recurso | Free Tier | Estimativa Nexus |
|---------|-----------|------------------|
| Bandwidth | 100GB/mês | < 1GB (single-user) |
| Function invocations | 100k/mês | ~3-5k (chat + sync + cron) |
| Function duration | 100GB-h/mês | < 1GB-h |
| Edge functions | 1M req/mês | ~5k |
| Cron jobs | 2 | suficiente (1 sync calendar diário, 1 push lembretes) |
| KV (Upstash) | 10MB / 10k req/dia | suficiente (tokens + cache) |

**Conclusão:** zero custos no horizonte do uso pessoal. Constraint C2 cumprida.

---

## 15. Integração com FRs/NFRs do PRD

Tabela de cobertura — cada NFR tem componente architectural responsável:

| NFR | Resolução architectural |
|-----|-------------------------|
| NFR1 (latência p95 <6s cérebro) | Edge runtime + classifier→executor split + tool registry com domain filtering |
| NFR2 (CRUD <50ms) | Dexie com índices apropriados (schema §6) |
| NFR3 (FCP <2s) | Next.js 15 App Router + RSC + bundle <200KB |
| NFR4 (chat infinite scroll) | Dexie pagination via `db.chat_messages.where('[conversationId+timestamp]').reverse().offset(N).limit(20)` |
| NFR5 (key Anthropic só server) | `/api/anthropic/proxy` + `/api/agent/prompt` Edge |
| NFR6 (OAuth tokens KV) | §9.2 |
| NFR7 (Telegram bot só server) | env + Edge webhook |
| NFR8 (cookie HttpOnly) | §9.1 |
| NFR9 (rate 60/min) | §9.3 |
| NFR10 (dados não saem do localStorage) | IndexedDB local + opt-in explícito Google sync |
| NFR11 (logs sem prompts crus) | §12 |
| NFR12 (sem telemetria externa) | sem Vercel Analytics no prod (se decidir off); sem GA |
| NFR13 (logs Vercel) | nativo |
| NFR14 (audit UI) | `/settings/audit` componente sobre `agent_runs` Dexie |
| NFR15 (ESLint+TS strict) | Story 0.9 |
| NFR16 (Vitest+Playwright) | §5 |
| NFR17 (cobertura 60%) | §5.4 |
| NFR18 (CodeRabbit) | §13 + Epic 8 |
| NFR19 (deploy <2min) | Vercel default |
| NFR20 (rollback <30s) | Vercel UI |
| NFR21 (PWA offline) | §11 |
| NFR22 (backup export) | Epic 8 Story 8.6 — Dexie `db.export()` (dexie-export-import) → JSON → ZIP |
| NFR23 (Chrome/Edge/FF 110+) | suportado por Next 15 + APIs nativas |
| NFR24 (mobile responsive) | Tailwind responsive utilities + PWA |

---

## 16. Estratégia de Implementação por Epic

Mantém ordem do PRD (0→1→2→3→4→5→6→7→8) mas explicita pontos críticos por Epic:

### Epic 0 — Pontos críticos arch
- Story 0.1 cria `v2/` mas **não toca `src/` v1**. Dois `package.json` separados. CI corre nos dois durante Epic 0.
- Story 0.5 (proxy Anthropic) é **bloqueante** — sem isto Epic 1 não arranca
- Story 0.9 instala Vitest+Playwright+MSW de uma só vez
- Acceptance: build verde + login funcional + Vercel preview deploy verde

### Epic 1 — Pontos críticos arch
- Story 1.1 cria tabela `agent_runs` com schema do §6.1 acima
- Story 1.3 cria `toolRegistry` vazio com helpers (`toAnthropicTools`, `byDomain`)
- Story 1.4 (classifier) usa `claude-haiku-4-5-20251001` que já está em `GoodnightWidget` v1 — reusa
- Story 1.5 implementa loop: classifier → executor (com tools filtradas por domínio) → persiste agent_run
- Story 1.10 conjunto 50 prompts vai para `tests/fixtures/prompts-pt-pt.json` (NÃO em código de produção)

### Epic 2 — Pontos críticos arch
- Story 2.1 schema vai para Dexie version 2 (incremento ao schema base)
- Story 2.2 migration localStorage→IndexedDB corre uma vez (idempotente, §4.4)
- Story 2.7 instâncias recorrentes geradas pelo **motor client-side** `lib/shared/recurrence.ts`, activado via `useEffect` one-shot no mount da page `/tarefas` (cron client-side, alinhado com PRD §10 L446 + EPIC-2 §7). O motor é **agnóstico ao mecanismo de activação** — função pura sobre Dexie. Decisão formal: **GAP-1 resolvido — ver `docs/stories/active/2.7.story.md` ADR-2.7-1**. A activação via ServiceWorker/Background Sync foi rejeitada para o Epic 2 (KISS + uso pessoal com tab sempre aberto); fica como migração condicional para o Epic 4 se o Background Sync de lembretes a justificar.

### Epic 3 — Pontos críticos arch
- **Cêntimos como integers** (`amount: number` em cêntimos). Format PT-PT só na UI. Evita float arithmetic.
- Compras parceladas geram N transações **com `installmentId` partilhado** (permite drilldown)
- Recurrence engine (`lib/shared/recurrence.ts`) é partilhado tarefas/finanças/hábitos — wrapper sobre `rrule`

### Epic 4 — Pontos críticos arch
- VAPID keys geradas uma vez via `web-push generate-vapid-keys` em local, postas em env Vercel
- Service Worker tem handler `push` (§11)
- Cron Vercel diário 06:00 chama `/api/push/schedule-day` que lê `reminders` do dia e agenda envios

### Epic 5 — Pontos críticos arch
- Tiptap config: extensions limitados (StarterKit + TaskList + Link + Placeholder). Sem images iniciais (Epic 8 se necessário)
- Brain Dump usa Sonnet com tools `criar_tarefa`/`criar_projecto`/`criar_nota` em modo **preview obrigatório** (`requiresPreview: true` por chamada)
- Pesquisa web: tentar Anthropic web search (a partir do Sonnet 4); fallback DuckDuckGo HTML scraping (`lib/shared/web-search-ddg.ts` server-side)

### Epic 6 — Pontos críticos arch
- OAuth state é **assinado** com `SESSION_SECRET` para CSRF protection
- Calendar sync 2-way: Nexus mantém `googleCalendarId` em cada `Event` local. Conflict resolution: **Google wins** em caso de modificação dos dois lados (uso interno aceita)
- Gmail classifier corre via **Vercel Cron** a cada 30 min em `/api/google/gmail/classify` — apenas emails novos não classificados (cache em KV)
- Telegram bot setWebhook configurado one-time via script `npm run setup:telegram`

### Epic 7 — Pontos críticos arch
- Web Speech: Chrome/Edge OK; Firefox tem bug intermitente em PT-PT — documentar como suportado mas não garantido
- OCR: Anthropic Vision via `/api/ocr/receipt` (Node) — body limit 4.5MB. UI valida tamanho antes de upload.
- Foto via Telegram (FR73): webhook detecta `message.photo`, baixa via Telegram API, encaminha para `/api/ocr/receipt`

### Epic 8 — Pontos críticos arch
- Bundle analyzer activado em CI (gate informativo, não bloqueante)
- Backup ZIP: `dexie-export-import` plugin → JSON; service worker zipia e devolve blob
- **Story 8.10 elimina `src/` v1** apenas se `tests/e2e/migration-smoke.spec.ts` passar

---

## 17. Pacotes npm a adicionar (vista total)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^4.0.0",
    "dexie-export-import": "^4.0.0",
    "@tiptap/react": "^2.10.0",
    "@tiptap/pm": "^2.10.0",
    "@tiptap/starter-kit": "^2.10.0",
    "@tiptap/extension-task-list": "^2.10.0",
    "@tiptap/extension-task-item": "^2.10.0",
    "@tiptap/extension-link": "^2.10.0",
    "@tiptap/extension-placeholder": "^2.10.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^4.1.0",
    "rrule": "^2.8.0",
    "zod": "^3.23.0",
    "googleapis": "^144.0.0",
    "node-telegram-bot-api": "^0.66.0",
    "web-push": "^3.6.0",
    "@vercel/kv": "^3.0.0",
    "lucide-react": "^0.469.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/postcss": "^4.1.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "msw": "^2.6.0",
    "fake-indexeddb": "^6.0.0",
    "@playwright/test": "^1.48.0",
    "@next/bundle-analyzer": "^15.0.0",
    "zod-to-json-schema": "^3.23.0"
  }
}
```

---

## 18. Riscos arquitecturais e mitigações

| # | Risco | Severidade | Mitigação |
|---|-------|-----------|-----------|
| AR1 | Edge runtime não suportar lib X | Alta | Manter qualquer endpoint Node se SDK exigir; matriz §4.1 |
| AR2 | Dexie schema migration falhar mid-upgrade | Média | Versão sempre incrementa, `upgrade()` em transaction, fallback localStorage v1 mantido até Epic 8 |
| AR3 | Tool registry tornar-se dump-of-tools sem coesão | Média | Lint rule custom: cada tool deve ter `domain` válido + Zod schema + descrição PT-PT >50 chars. Cobertura no test set canónico. |
| AR4 | Vercel KV exceder 10MB free | Baixa | TTL agressivo no cache Gmail (7d). Push subs tipicamente <5KB cada |
| AR5 | OAuth Google requer verification se >100 users | Baixa | Single-user — sempre <100. Documentar em README de setup |
| AR6 | Anthropic Vision falhar em recibos PT (com IVA, etc.) | Média | Prompt OCR explicita campos PT-PT (NIF, IVA, total, mercador). Fallback: utilizador edita manualmente |
| AR7 | Web Speech PT-PT inconsistente Firefox | Baixa | Documentar Chrome/Edge como suportados; Firefox best-effort |

---

## 19. Resposta aos gaps PO

| Gap | Resolvido em |
|-----|--------------|
| **G3** Edge vs Node + IndexedDB lib + markdown editor | §4.1 (matriz Edge/Node), §4.2 (Dexie 4), §4.3 (Tiptap 2) |
| **G4** Test scaffold + mocks Anthropic/Google/Telegram | §5 (estratégia completa), §5.2 (MSW handlers) |

**G1 (wireframes)** e **G2 (domínio)** ficam fora deste documento — `@ux-design-expert` resolve G1 em `front-end-spec-v2.md` (paralelo), Eurico responde G2.

---

## 20. Checklist Architect (auto-validação)

- [x] Todas as decisões inegociáveis do PRD (C1-C10) respeitadas
- [x] G3 e G4 da PO validation totalmente fechados
- [x] Edge vs Node decidido por endpoint (matriz §4.1)
- [x] IndexedDB lib decidida com trade-off (Dexie 4)
- [x] Markdown editor decidido (Tiptap 2)
- [x] Test scaffold completo (Vitest+Playwright+MSW+fake-indexeddb)
- [x] Tool Registry pattern documentado com contract
- [x] Schema lógico de cada Epic mapeado
- [x] Vercel KV layout definido
- [x] Service Worker manual (sem Workbox) com handlers push/fetch
- [x] CSP + security headers definidos
- [x] Performance budget com alvos numéricos
- [x] CI/CD pipeline completo
- [x] Vercel free tier validado contra estimativa de uso
- [x] Cobertura cruzada PRD NFRs → componentes architecturais
- [x] Riscos architecturais identificados com mitigação
- [x] Stack final em `package.json` projectado
- [x] Sem invenção de features — tudo trace ao PRD
- [x] PT-PT em todo o documento
- [x] Sem menções a Jarvis (constraint C11)

---

## 21. Próximos Passos

1. **Eurico:** decide G2 (domínio Vercel default `nexus-eurico.vercel.app` ou subdomínio `nexus.avancada.expressia.pt`)
2. **@ux-design-expert (Uma):** consome este documento + PRD para produzir `front-end-spec-v2.md` com wireframes chat-first (resolve G1)
3. **@po (Pax):** valida este `architecture-v2.md` (10-point checklist)
4. **@sm (River):** após PASS de PO, parte Epic 0 em stories 0.1-0.10 baseadas neste documento
5. **@dev (Dex):** implementa Story 0.1 quando @po validar

---

*Architecture v1.0 produzida por Aria (architect) em 04/05/2026, em resposta directa ao handoff `RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md`. Designed para zero ambiguidade técnica em Epic 0.*
