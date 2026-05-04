# Nexus v2

> ATENÇÃO — ESTE README É PARA O PROJECTO `imersao-tools/nexus/v2/`.
> Não confundir com o Nexus v1 em `imersao-tools/nexus/src/` (Vite/React 19).
> v1 fica intocado durante toda a Epic 0 (architecture-v2.md §3 + constraint C10).

Assistente pessoal de continuidade — chat-first, multi-intent, single-user (Eurico). Stack Next.js 15 App Router + TypeScript strict + Tailwind 4 + Dexie 4. Deploy Vercel free tier em `nexus-eurico.vercel.app`.

## Setup local

```bash
cd imersao-tools/nexus/v2
npm install
cp .env.example .env.local
# preenche .env.local com chaves reais
npm run dev   # arranca em http://localhost:3001
```

## Setup Vercel (primeira vez)

1. **Criar projecto** na Vercel UI (Settings → Import Git Repository).
2. **Root Directory:** `imersao-tools/nexus/v2`
3. **Framework Preset:** Next.js (detectado automaticamente).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** `.next` (default).

### Variáveis de ambiente

Em **Settings → Environment Variables**, adicionar (ver `.env.example` para descrição completa):

| Variável | Notas |
|----------|-------|
| `ANTHROPIC_API_KEY` | sk-ant-... (server-only, NFR5) |
| `NEXUS_PASSWORD_HASH` | bcrypt da password do Eurico (gerar com `node -e "console.log(require('bcryptjs').hashSync('tua-pass', 10))"`) |
| `SESSION_SECRET` | random 32 bytes hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Upstash KV (criar via Marketplace Vercel) |
| `GOOGLE_OAUTH_*` | Configurado em Epic 6 |
| `TELEGRAM_*` | Configurado em Epic 6 |
| `WEB_PUSH_VAPID_*` | Configurado em Epic 4 |

## Comandos

```bash
npm run dev          # dev server porta 3001
npm run build        # production build
npm run lint         # ESLint v9 flat config
npm run typecheck    # tsc --noEmit
npm run test:unit    # Vitest unit + jsdom
npm run test:e2e     # Playwright Chromium
npm run test:coverage # com coverage gate 60% em lib/agent, lib/db, lib/shared
npm run test:ci      # lint + typecheck + unit (gate pre-push local)
```

## Estrutura

Conforme architecture-v2.md §3:

```
v2/
├── app/                 # Next.js App Router
│   ├── (auth)/login/    # Login page (Story 0.6)
│   ├── (app)/           # Rotas autenticadas
│   ├── api/             # Edge + Node routes
│   └── layout.tsx       # Root (PT-PT, fonts)
├── components/
│   ├── chat/            # ChatPanel, MessageList, InputBox, OnboardingModal
│   ├── ui/              # Header, Sidebar, SidebarDrawer
│   └── widgets/         # Markets (UX-4 topo), Pomodoro, GitHub, etc.
├── lib/
│   ├── auth/            # password + session
│   ├── db/              # Dexie 4 client + migrations
│   ├── markets/         # PORTADO de v1
│   ├── github/          # PORTADO de v1
│   └── shared/          # format, env, recurrence, themes
├── hooks/
├── styles/
└── tests/
    ├── unit/            # Vitest
    ├── e2e/             # Playwright
    └── mocks/           # MSW
```

## Constraints

- **PT-PT exclusivo** (`language-standards.md`)
- **Design system [IA]AVANÇADA PT** — fundo `#04040A`, paleta inegociável (`design-system-ia-avancada.md`)
- **Single-user** (Eurico) — sem registo público
- **Zero custos** além da chave Anthropic
- **Constitution AIOX** Article IV — No Invention

## Deploy

Push em `main` → deploy produção `nexus-eurico.vercel.app`. Cada PR → preview deploy. CI (`nexus-v2-ci.yml`) corre lint + typecheck + unit + E2E + grep "sk-ant-" no bundle client (NFR5).
