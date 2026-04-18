# RETOMA-COMPLETO — FitCoach AI (Cliente: Telmo Cerveira)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 14/04/2026
**Sessão:** @ux-design-expert (Uma) + Eurico
**Motivo do handoff:** Contexto a atingir limite — migração para terminal novo
**Cliente:** Telmo Cerveira (+351 918 700 778, trcerveira@gmail.com)
**Operador inicial:** Eurico (contas pessoais, test mode Stripe, modo "mostrar ao cliente")

---

## 1. Contexto Inicial — O que é este projecto

### 1.1 Origem

Telmo é cliente pago do Eurico. Pediu um **Personal Trainer Virtual** (app web) para democratizar acesso a treino personalizado em Portugal:
- **Problema:** PT presencial custa 200-300 €/mês, inacessível para a maioria
- **Solução:** App com planos gerados por IA, Trial 7 dias → 7,99 €/mês via Stripe
- **Público:** Adultos 25-45 em PT/EU, nível iniciante-intermédio
- **Diferenciador:** Planos adaptados ao equipamento real (casa/ginásio)

### 1.2 Pipeline ORIGINAI (base)

O projecto nasceu como teste real do pipeline pedagógico ORIGINAI:
- P1 Briefing → P2 Prompt Pesquisa → P3 Pesquisa x3 → P4 PRD Final → P5 Construção → P6 Deploy
- PRD final em `imersao-tools/docs/teste-telmo/docs/prd-final.md`
- Briefing em `imersao-tools/docs/teste-telmo/docs/briefing-base.json`

Mas 14/04/2026 mudou de scope: **Telmo virou CLIENTE** (não só teste pedagógico).
Eurico disse *"ESQUECE TUDO O QUE FALAMOS. É ASSIM O TELMO É UM CLIENTE E VAMOS DESENVOLVER O PROJETO PARA ELE JÁ. TEMOS QUE ENTREGAR O MAIS RÁPIDO POSSIVEL"*.

### 1.3 Modelo de entrega actual

Para MOSTRAR ao Telmo funcionando — **não produção plena**:
- Contas Supabase, Anthropic, Vercel do Eurico (não do Telmo)
- Stripe a SALTAR (não configurado nesta fase, disse Eurico "Stripe não precisa nada disto nesta fase")
- URL público: `https://fitcoach-ai-lake.vercel.app`

---

## 2. Estado Inicial do Código (quando a sessão começou)

### 2.1 Localização

```
C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\docs\teste-telmo\fitcoach-ai\
```

### 2.2 Stack existente

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Estilo | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| IA | Claude API (Anthropic) |
| Exercícios | ~~ExerciseDB API~~ (ficou offline — substituído por catálogo local) |
| Pagamentos | Stripe Checkout + Webhook (configurado mas não activo) |
| Deploy | Vercel |

### 2.3 O que já estava feito (~60% MVP) quando começou

- 8 páginas scaffolded (Landing, Login, Onboarding, Dashboard, Workout, Exercises, Progress, Profile)
- Auth Google via Supabase + `handle_new_user` trigger
- Schema SQL com 4 tabelas (`profiles`, `workout_plans`, `workout_logs`, `weight_entries`) + RLS
- 2 API routes: `generate-plan.ts`, `create-checkout.ts`
- 6 atoms UI (Button, Card, Input, Select, Badge, Spinner)
- Hooks: `useAuth`, `useWorkout`, `useProgress`

### 2.4 Gaps críticos identificados no audit inicial

| # | Gap | Estado atual |
|---|-----|--------------|
| 1 | Navegação `/treinos` quebrada (rota é `/exercicios`) | ✅ Corrigido |
| 2 | Footer `© 2024` desactualizado | ✅ `© 2026` |
| 3 | Testemunhos FAKE ("Miguel, 31", "Sara, 26") — risco legal | ✅ Substituído por "Como funciona" |
| 4 | Modelo Claude `claude-sonnet-4-20250514` (inexistente) | ✅ `claude-sonnet-4-5` |
| 5 | `generate-plan` NÃO guardava em `workout_plans` | ✅ Agora persiste |
| 6 | Sem webhook Stripe | ✅ Criado (não activo nesta fase) |
| 7 | Sem disclaimers de saúde | ✅ Obrigatório no onboarding |
| 8 | Sem Termos/Privacidade | ✅ Páginas criadas |
| 9 | Trial expirado não bloqueava | ✅ Enforcement server-side |
| 10 | Sem verify-checkout | ✅ Criado |

---

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/docs/teste-telmo/fitcoach-ai/docs/RETOMA-COMPLETO.md`. ESTÁ NO SÍTIO CORRECTO (pasta do projecto FitCoach AI). CONSULTAR `.claude/rules/handoff-location.md` antes de o mover.

---

## 3. Trabalho Realizado — Histórico Completo por Commit

### Commit 1 — `052b194` — `feat: initial production-ready FitCoach AI`

**5 blocos de trabalho consolidados num commit único:**

#### Bloco A: Bug fixes rápidos
- `DashboardPage.tsx:256` — `/treinos` → `/exercicios`
- `LandingPage.tsx` — footer `© 2024` → `© 2026` + links Termos/Privacidade
- `LandingPage.tsx` — secção testemunhos fake → "Como funciona" (3 passos)
- `api/generate-plan.ts:76` — modelo Claude `claude-sonnet-4-20250514` → `claude-sonnet-4-5`

#### Bloco B: Pipeline IA funcional
- `api/generate-plan.ts` — reescrita completa:
  - Usa `SUPABASE_SERVICE_ROLE_KEY` para buscar profile autoritativamente (não confia no cliente)
  - Downgrade automático trial→free quando expirado
  - Enforcement free = 1 plano/semana (retorna 403 `plan_limit_reached`)
  - Persiste em `workout_plans` (upsert por `user_id + week_start`)
  - Devolve o registo completo (não só JSON do Claude)
- `src/hooks/useWorkout.ts` — nova classe `PlanLimitReachedError`, body simplificado para `{userId}`

#### Bloco C: Pagamento end-to-end (Stripe)
- `api/create-checkout.ts` — refactor para SDK Stripe oficial (era fetch manual)
- `api/verify-checkout.ts` (novo) — confirma pagamento idempotente no return URL
- `api/stripe-webhook.ts` (novo) — signature verification + 4 eventos:
  - `checkout.session.completed` → plan='pro'
  - `customer.subscription.updated` → pro/free conforme status
  - `customer.subscription.deleted` → plan='free'
  - `invoice.payment_failed` → log
- `src/pages/ProfilePage.tsx` — handler `handleUpgrade()` ligado ao botão
- Detecção de `?checkout=success&session_id=…` → chama verify-checkout
- Schema: adicionadas `stripe_customer_id`, `stripe_subscription_id` com migrations idempotentes

#### Bloco D: Legal + UX
- `OnboardingWizard.tsx` step 6 — checkbox obrigatório health_consent:
  - Caixa "AVISO IMPORTANTE" + texto médico
  - Links para `/termos` e `/privacidade`
  - Validação bloqueia se não aceitar
- `src/pages/TermsPage.tsx` (novo) — 10 secções (aceitação, saúde, pagamento, limitação responsabilidade, RGPD, cancelamento, jurisdição PT)
- `src/pages/PrivacyPage.tsx` (novo) — 8 secções RGPD com tabela de subprocessadores (Supabase UE, Anthropic EUA, Stripe UE/EUA, Vercel, Google)
- Banners "Ver opções Pro" no Dashboard e WorkoutPage quando atinge limite
- Schema: `health_consent` boolean + `health_consent_at` timestamp

#### Bloco E: Handoff técnico
- `README.md` completo — 5 passos setup zero (Supabase → Anthropic → Stripe → Vercel → Webhook)
- `.env.example` actualizado com 8 env vars
- Deps adicionadas: `stripe`, `@vercel/node`, `micro`
- `.gitignore` reforçado (cobre `.env`, `.env.local`, `.env.production`, `.vercel`)

### Commit 2 — `5d9b1fc` — `feat(auth): switch from Google OAuth to email magic link`

**Razão:** Eurico atingiu limite de projectos no Google Cloud Console (3 de 3). Em vez de pedir aumento ou reutilizar iaMenu, mudámos para magic link email — zero dependência de Google Cloud.

**Alterações:**
- `useAuth.tsx` — `signInWithGoogle` → `signInWithEmail` via `supabase.auth.signInWithOtp`
- `LoginPage.tsx` — botão Google → form email + ecrã de confirmação pós-envio
- `LandingPage.tsx` — `onClick={signInWithGoogle}` → `onClick={goToLogin}` (navega para /login)

### Commit 3 — `effa2ca` — `chore(dev): use port 5200 for vite dev/preview`

**Razão:** Default Vite 5173 colidia com projecto iamenu do Eurico noutros terminais. 5200 está fora do range reservado ao pipeline Imersão (5190-5196).

**Alterações:**
- `vite.config.ts` — `server.port: 5200 + strictPort: true`, mesmo para `preview`

### Commit 4 — `c9aeb38` — `fix: replace offline ExerciseDB API + onboarding error visibility`

**Razão 1:** `https://exercisedb-api.vercel.app` devolve 402 "Payment required" / `DEPLOYMENT_DISABLED`. API gratuita foi descontinuada em 2026-04.

**Razão 2:** Onboarding passo 6 "Começar" não fazia nada visualmente — `updateProfile` podia falhar silenciosamente.

**Alterações:**
- `src/lib/exercises-data.ts` (novo) — catálogo local com 48 exercícios:
  - Cobre todos os body parts: peito, costas, pernas, ombros, braços, core, glúteos, antebraços, cardio, mobilidade
  - 3 níveis de equipment: peso corporal, halteres, barra, barra fixa, máquina
  - GIFs de wger.de (open source CC-BY-SA)
  - Campos idênticos à antiga API (id, name, bodyPart, equipment, gifUrl, target, secondaryMuscles, instructions)
- `src/lib/exercisedb.ts` — substituído fetch por leitura do catálogo + delay 120ms
- `src/pages/OnboardingPage.tsx` — try/catch + banner vermelho quando submit falha

### Commit 5 — `ee78810` — `fix(routing): redirect to /onboarding when profile is empty`

**Razão:** O trigger `handle_new_user` do Supabase cria profile imediatamente ao signup com `name = ''`. O routing anterior assumia "tem profile = onboarding feito" e mandava directo para /dashboard com "Olá, !" (nome vazio).

**Alterações:**
- `App.tsx` — novo helper `hasCompletedOnboarding(profile)` que verifica `name.trim().length > 0`
- `PublicRoute` e `ProtectedRoute` usam o helper
- `ProtectedRoute` aceita prop `requireOnboarding` (default true); rota `/onboarding` passa `false` para não entrar em loop

---

## 4. Estado Actual (14/04/2026 ~20:30 PT)

### 4.1 Git

| Estado | Valor |
|--------|-------|
| Repo | `github.com/DaSilvaAlves/fitcoach-ai` (privado) |
| Branch | `main` |
| Último commit | `ee78810` |
| Working tree | Limpo (todos os changes pushed) |
| Remote sincronizado | ✅ |

### 4.2 Deploy Vercel

| Parâmetro | Valor |
|-----------|-------|
| Dashboard | https://vercel.com/euricojsalves-4744s-projects/fitcoach-ai |
| URL Production | https://fitcoach-ai-lake.vercel.app |
| URL Preview | https://fitcoach-n5sbz8c6e-euricojsalves-4744s-projects.vercel.app |
| URL Git branch | https://fitcoach-ai-git-main-euricojsalves-4744s-projects.vercel.app |
| Plano | Hobby (free tier) |

### 4.3 Env Vars configuradas no Vercel (Production)

| Variável | Estado | Comentário |
|----------|--------|-----------|
| `VITE_SUPABASE_URL` | ✅ | `https://gitcblghucmpzizpxxki.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | JWT válido até 2036-03-13 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | JWT válido até 2036-03-13 |
| `ANTHROPIC_API_KEY` | ✅ | `sk-ant-api03-…` (5€ crédito inicial) |
| `STRIPE_SECRET_KEY` | ❌ Não configurado | Stripe saltado nesta fase |
| `STRIPE_PRICE_ID` | ❌ Não configurado | Idem |
| `STRIPE_WEBHOOK_SECRET` | ❌ Não configurado | Idem |
| `VITE_APP_URL` | ❌ Não configurado | Código usa `window.location.origin` como fallback |

### 4.4 Supabase

| Parâmetro | Valor |
|-----------|-------|
| Dashboard | https://supabase.com/dashboard/project/gitcblghucmpzizpxxki |
| Ref | `gitcblghucmpzizpxxki` |
| Org | `euricoalvesia@gmail.com's Org` |
| Região | `AWS eu-west-1` |
| Plano | Free (⚠️ pausa automática após 7 dias sem actividade) |
| Schema | Aplicado ✅ (4 tabelas + RLS + trigger `handle_new_user`) |

#### Auth — URL Configuration

| Campo | Valor |
|-------|-------|
| Site URL | `https://fitcoach-ai-lake.vercel.app` |
| Redirect URLs | `https://fitcoach-ai-lake.vercel.app/**` |
|  | `https://*-euricojsalves-4744s-projects.vercel.app/**` |
|  | `http://localhost:5200/**` |
| Providers | Email activo (magic link OTP); Google desactivado |

### 4.5 O que funciona (confirmado manualmente)

- ✅ Landing page renderiza com hero, features, pricing
- ✅ Login com magic link envia email (template Supabase)
- ✅ Email confirma e cria sessão
- ✅ Dashboard carrega com stats vazios para novo utilizador
- ✅ Rota `/exercicios` deve carregar 48 exercícios locais (não testado directamente após último push)

### 4.6 O que ainda pode falhar (a validar no próximo terminal)

| # | Possível problema | Como validar | Se falhar, fazer |
|---|-------------------|-------------|------------------|
| 1 | Onboarding não finaliza | Tentar completar 6 passos + Começar | Ver banner vermelho com erro (agora visível) |
| 2 | Geração de plano | Clicar "Gerar o teu primeiro plano" | Verificar F12 Console + logs Vercel |
| 3 | Routing /onboarding loop | Ir a /onboarding com profile incompleto | Já fixado no `ee78810` |
| 4 | ExerciseDB GIFs não carregam | Ir a /exercicios | GIFs vêm de wger.de (pode ter rate limit) |

### 4.7 Últimos screenshots do Eurico antes da migração

- ✅ Dashboard carrega com "Olá, !" (antes do fix routing — nome vazio porque onboarding não estava completo)
- ✅ Exercícios tinha erro "Erro ao carregar exercícios" (antes da substituição da API)
- ⚠️ Dashboard com spinner eterno (investigar se reproduz após redeploy do `ee78810`)

---

## 5. Próximos Passos Concretos (para novo terminal)

### 5.1 Validar fluxo end-to-end

1. Abrir `https://fitcoach-ai-lake.vercel.app` (em aba anónima/limpa)
2. Clicar **Começar Grátis** → introduzir email
3. Abrir email → clicar link mágico
4. Esperado: redirect para `/onboarding` automaticamente (fix do `ee78810`)
5. Completar 6 passos + aceitar health consent + **Começar**
6. Esperado: redirect `/dashboard` com "Olá, **[nome]**!"
7. Clicar **Gerar o teu primeiro plano** → Claude gera plano
8. Ir a `/exercicios` → ver 48 exercícios locais com GIFs
9. Ir a `/progresso` → registar peso de teste
10. Ir a `/perfil` → ver trial countdown (7 dias)

### 5.2 Se algum passo falhar

| Passo | Como debugar |
|-------|-------------|
| 1-4 Auth | F12 → Console → procurar `sb-…` em localStorage |
| 5 Onboarding | Agora mostra banner vermelho com erro real (try/catch já adicionado) |
| 7 Gerar plano | Logs Vercel: `vercel logs fitcoach-ai --follow` ou dashboard web |
| 8 Exercises | Se GIFs não aparecem, substituir `wger.de` por imagens locais/placeholder |

### 5.3 Melhorias opcionais (não bloqueadores)

- [ ] Configurar Stripe TEST mode (quando o Eurico quiser testar fluxo pagamento)
- [ ] Domínio personalizado (ex: `fitcoach.pt` via Vercel Settings → Domains)
- [ ] Custom Supabase email templates (tom mais próximo do brand)
- [ ] Logo próprio em vez do ícone Dumbbell
- [ ] Code splitting (bundle actual 262 KB gzip)
- [ ] Fix lint warnings pre-existentes (2 em `useAuth.tsx` + `useProgress.ts`)

### 5.4 Antes de entregar ao Telmo

- [ ] Reactivar Stripe (test mode pelo menos) para demo completa com pagamento
- [ ] Preparar video/screencast mostrando o fluxo
- [ ] Decidir se Telmo fica com ownership do repo ou só com acesso
- [ ] Transferir contas (Supabase, Anthropic, Vercel) para Telmo ou manter no Eurico

---

## 6. Ficheiros-Chave (mapa mental)

```
fitcoach-ai/
├── api/                                    # Vercel serverless
│   ├── generate-plan.ts                    # ⭐ Claude + Supabase server-side + enforcement planos
│   ├── create-checkout.ts                  # Stripe checkout (inactivo)
│   ├── verify-checkout.ts                  # Valida pagamento return (inactivo)
│   └── stripe-webhook.ts                   # Webhook Stripe (inactivo)
├── src/
│   ├── App.tsx                             # ⭐ Routing + hasCompletedOnboarding helper
│   ├── pages/
│   │   ├── LandingPage.tsx                 # Hero + features + pricing
│   │   ├── LoginPage.tsx                   # Magic link email
│   │   ├── OnboardingPage.tsx              # ⭐ try/catch + banner erro
│   │   ├── DashboardPage.tsx               # Stats + treino de hoje
│   │   ├── WorkoutPage.tsx                 # Plano semanal (dias colapsáveis)
│   │   ├── ExercisesPage.tsx               # Base 48 exercícios locais
│   │   ├── ProgressPage.tsx                # Peso + gráfico 90 dias
│   │   ├── ProfilePage.tsx                 # Edit + upgrade + signout
│   │   ├── TermsPage.tsx                   # 10 secções legais
│   │   └── PrivacyPage.tsx                 # RGPD + 8 secções
│   ├── components/
│   │   ├── onboarding/OnboardingWizard.tsx # ⭐ 6 passos + health_consent
│   │   ├── layout/{Layout,Navbar}.tsx
│   │   ├── ui/{Button,Card,Input,Select,Badge,Spinner}.tsx
│   │   └── workout/ExerciseCard.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx                     # ⭐ signInWithEmail (magic link)
│   │   ├── useWorkout.ts                   # ⭐ PlanLimitReachedError
│   │   └── useProgress.ts
│   ├── lib/
│   │   ├── supabase.ts                     # Client init
│   │   ├── exercisedb.ts                   # ⭐ Agora lê do catálogo local
│   │   ├── exercises-data.ts               # ⭐ Catálogo 48 exercícios
│   │   └── utils.ts                        # cn() + formatters
│   └── types/index.ts                      # ⭐ UserProfile + health_consent + stripe_*
├── supabase-schema.sql                     # ⭐ 4 tabelas + RLS + trigger + migrations
├── vercel.json                             # SPA rewrites
├── vite.config.ts                          # Porta 5200
├── .env.example                            # Template 8 env vars
├── .env                                    # Real (gitignored — tem chaves reais Supabase + Anthropic)
├── README.md                               # ⭐ 5 passos setup do zero
├── docs/
│   └── RETOMA-COMPLETO.md                  # ⭐ ESTE FICHEIRO
└── package.json                            # deps: stripe, supabase, react19, vite8, tailwind4
```

---

## 7. Comandos Úteis

### Local dev

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\docs\teste-telmo\fitcoach-ai"
npm install
npm run dev            # Porta 5200 (http://localhost:5200)
npx tsc -b             # Type check
npm run build          # Produção
npm run lint           # ESLint
```

Para API routes funcionarem localmente, usar **Vercel CLI** em vez do `npm run dev`:
```bash
npm i -g vercel
vercel dev
```

### Git

```bash
git status
git log --oneline | head -10
git push origin main            # EXCLUSIVO @devops — não fazer directamente
```

### Vercel

```bash
# Ver logs em tempo real
vercel logs https://fitcoach-ai-lake.vercel.app --follow

# Forçar redeploy sem cache
# Dashboard → Deployments → ⋮ → Redeploy → UNCHECK "Use existing Build Cache"
```

---

## 8. Aprendizagens / Gotchas desta Sessão

| Lição | Contexto | Implicação |
|-------|----------|-----------|
| **Vite `VITE_*` é build-time** | Env vars adicionadas depois do deploy não aparecem no bundle. Precisa **Redeploy sem cache**. | Sempre adicionar env vars ANTES do primeiro deploy |
| **Supabase `Site URL` vs `Redirect URLs`** | Se o URL da app não estiver nos Redirect URLs, o Supabase ignora `emailRedirectTo` e usa o Site URL default (localhost:3000) | Adicionar `**` wildcards para cobrir preview deployments |
| **Trigger `handle_new_user` cria profile vazio** | O routing não pode assumir "profile existe = onboarding feito" | Usar `hasCompletedOnboarding(profile)` que verifica `name` |
| **ExerciseDB API offline** | Dependência externa gratuita descontinuada | Sempre ter fallback local para dependências terceiras gratuitas |
| **Stripe requer SDK para webhook** | Signature verification precisa da lib `stripe` (não basta fetch) | Dep obrigatória mesmo que só use 1 endpoint |
| **Wildcards Supabase** | Formato `/**` (dois asteriscos), não `/*` | Evitar reescrever URL por cada preview deployment |
| **Google OAuth limite de projectos** | Eurico tinha 3 projectos Google Cloud e não pode criar mais | Magic link email é alternativa sem dependência Google |
| **Porta 5173 ocupada pelo iamenu** | Outros projectos do Eurico usam 5173 | Forçar porta 5200 via `vite.config.ts` strictPort |

---

## 9. Regras e Memórias Criadas/Actualizadas

### Memória actualizada
- `project_teste_telmo.md` — Telmo = cliente (não teste pedagógico), projecto em ~99% MVP

### Memória criada
- `feedback_99_percent_ready_projects.md` — filosofia de entregar 99% prontos (mas NÃO se aplica ao Telmo por ser cliente externo)

### Regras relevantes (lidas mas não alteradas)
- `comunidade-safety.md` — não afecta (fitcoach não é comunidade/dashboard)
- `design-system-ia-avancada.md` — copy segue tom (directo, PT-PT, "tu")
- `handoff-location.md` — seguida (este handoff está no local correcto)
- `brandbook.md` — tom aplicado (sem "curso", "fácil", "automático")

---

## 10. Contas e Credenciais — Onde estão

### Supabase
- Login: `euricoalvesia@gmail.com`
- Projecto: `fitcoach-ai` (ref `gitcblghucmpzizpxxki`)

### Anthropic
- Login: `euricojsalves@gmail.com`
- Crédito actual: 5€ inicial (gasto ~0,01€ por geração de plano)

### Stripe
- NÃO configurado nesta fase

### Vercel
- Login: `DaSilvaAlves` (GitHub OAuth)
- Projecto: `fitcoach-ai`

### GitHub
- User: `DaSilvaAlves`
- Repo: `fitcoach-ai` (privado)
- Acesso: Eurico (owner)

### `.env` local
- Localização: `imersao-tools/docs/teste-telmo/fitcoach-ai/.env`
- **GITIGNORED** — contém chaves reais Supabase URL/anon/service_role + Anthropic
- **NUNCA commitar**

---

## 11. Como Retomar no Novo Terminal

### Passo 1 — Activar agente correcto

```
/aiox-ux-design-expert
```

Ou se já tiver outra persona, usar `@ux-design-expert` + `*exit` antes.

### Passo 2 — Dizer uma das seguintes

> **"Continuar FitCoach Telmo. Lê o RETOMA-COMPLETO.md."**

ou

> **"Continuar teste FitCoach. Está deployado em fitcoach-ai-lake.vercel.app. O último commit foi `ee78810`."**

### Passo 3 — A sessão nova deve

1. Ler `imersao-tools/docs/teste-telmo/fitcoach-ai/docs/RETOMA-COMPLETO.md` (este ficheiro)
2. Verificar `git log --oneline | head -5` para confirmar commit actual
3. Perguntar ao Eurico: "Qual o próximo passo? Validar fluxo end-to-end? Reactivar Stripe? Outra coisa?"

### Passo 4 — Validações iniciais obrigatórias

- [ ] `git status` → working tree limpo?
- [ ] `git log origin/main..HEAD` → 0 commits pendentes?
- [ ] Abrir `fitcoach-ai-lake.vercel.app` → renderiza?
- [ ] Esperar output do Eurico sobre estado actual de testes

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** FitCoach AI (cliente Telmo)
- **LOCALIZAÇÃO CORRECTA:** `imersao-tools/docs/teste-telmo/fitcoach-ai/docs/RETOMA-COMPLETO.md`
- **LOCALIZAÇÃO ACTUAL:** `imersao-tools/docs/teste-telmo/fitcoach-ai/docs/RETOMA-COMPLETO.md`
- **COINCIDEM?** `SIM` ✅

**AGENTE RESPONSÁVEL:** @ux-design-expert (Uma)
**DATA:** 14/04/2026

---

*Fim do handoff. Bom trabalho para o próximo terminal. — Uma 💝*
