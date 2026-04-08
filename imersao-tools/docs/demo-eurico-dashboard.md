# Nexus — O Teu Command Center com IA

> De demo da imersao a produto monetizavel
> Construido ao vivo na imersao 11-12 Abril 2026 — depois evolui para produto real

---

## Visao

**O unico command center pessoal que te da um briefing matinal com IA.**

Todos os dias, profissionais perdem 15-30 minutos a abrir tabs, verificar emails, ler noticias, e organizar o dia. O Nexus agrega tudo num unico ecra — e usa IA para resumir o que importa.

**Diferenciador:** Nao e um agregador de bookmarks. E o ponto de convergencia — onde todas as tuas ferramentas se encontram, com IA a resumir o que importa AGORA.

---

## Publico-alvo

| Perfil | Dor principal | Valor do Nexus |
|--------|---------------|------------------|
| Fundadores / CEOs | 10+ tabs abertas, perdem contexto entre ferramentas | Um ecra, zero context-switching |
| Developers | GitHub + CI + feeds + tarefas dispersas | Tudo visivel sem sair do browser |
| Gestores de projecto | Emails + calendarios + tarefas espalhadas | Briefing matinal com prioridades |
| Freelancers | Multiplos clientes, zero organizacao | Dashboard por projecto/cliente |
| Equipas remotas | Falta de visibilidade sobre o dia da equipa | Dashboard partilhado com tarefas comuns |

---

## 1. BRIEF (Expressao → Brief — 5 min)

### Expressao bruta (M1)

"Todos os dias acordo e tenho de abrir 6 tabs: Gmail, Feedly, GitHub, Vercel, Supabase, Analytics. Perco 15 minutos so a ver o que aconteceu. Quero uma pagina unica onde vejo tudo de uma vez — noticias de IA, estado dos meus deploys, emails importantes, e as minhas tarefas do dia. Nao precisa de ser bonito — precisa de ser util."

### QA 1 — Pontos cegos

| # | Ponto cego | Resposta |
|---|-----------|----------|
| 1 | Quais feeds de noticias concretos? | Hacker News, TechCrunch AI, The Verge AI — configuravel pelo utilizador |
| 2 | "Emails importantes" — como filtrar? | Gmail API: emails nao lidos com label "Priority" (v2: widget real) |
| 3 | "Estado dos deploys" — quantos projectos? | 3 projectos Vercel activos — GitHub API para commits e PRs |
| 4 | Onde ficam as tarefas? | Multiplas listas com categorias + localStorage (v1) / Supabase sync (v2) |
| 5 | Precisa de autenticacao? | MVP: nao (pessoal). V2: sim (Supabase auth para sync multi-dispositivo) |
| 6 | E se a IA pudesse resumir as noticias? | Killer feature — Claude API resume 15 artigos em 3 frases |
| 7 | Funciona em mobile? | PWA — instala como app nativa, funciona offline |
| 8 | Pode ser personalizado? | Onboarding: nome, feeds, widgets, tema — sem tocar em codigo |

### Brief aprovado

**O que quero construir:** Um command center pessoal que agrega feeds, tarefas, dados de projectos e briefing IA num so ecra — personalizavel e instalavel como app.

**Que problema resolve:** Eliminar 15-30 minutos diarios de context-switching. Ter tudo visivel num relance, com IA a destacar o que importa.

**Referencias:** Arc Browser (new tab), Notion (daily dashboard), Raycast (command center), Momentum (extensao Chrome).

**O que NAO e:** Nao e um CRM. Nao e um gestor de projectos. Nao substitui ferramentas — agrega-as.

**Checklist QA 2:** APROVADO — pronto para detalhar.

---

## 2. PRD TECNICO — MVP (o que se constroi na demo + 48h depois)

### Stack

| Tecnologia | Razao |
|------------|-------|
| React 19 + Vite | Rapido de construir, facil de deploy |
| Tailwind CSS v4 | Dark mode nativo, utility-first, responsivo sem esforco |
| localStorage | Persistencia offline de tarefas e configuracoes (fallback) |
| Supabase (v2) | Auth social + sync de dados entre dispositivos |
| Supabase Edge Functions | Proxy RSS proprio (substitui allorigins) + resumo IA |
| Claude API (Haiku) | Resumo matinal das noticias — rapido e barato |
| Vercel | Deploy gratuito, edge functions, analytics |

### Arquitectura de widgets

O Nexus usa um sistema modular de widgets. Cada widget e um componente React independente que:
- Recebe props de configuracao (tamanho, posicao, dados)
- Persiste o seu estado em localStorage (offline) ou Supabase (sync)
- Pode ser adicionado/removido/reorganizado pelo utilizador

```
┌─────────────────────────────────────────────────────┐
│                    WIDGET SYSTEM                    │
│                                                     │
│  WidgetGrid (CSS Grid, drag & drop)                │
│  ├── Widget (wrapper com resize/remove/configure)   │
│  │   ├── WidgetHeader (titulo + accoes)             │
│  │   └── WidgetContent (conteudo especifico)        │
│  └── AddWidgetButton (catalogo de widgets)          │
└─────────────────────────────────────────────────────┘
```

### Widgets MVP (8 widgets)

#### W1 — Greeting + Clock
- Saudacao com hora do dia ("Bom dia, [Nome]")
- Relogio em tempo real (hh:mm:ss)
- Data actual completa
- Timezone configuravel

#### W2 — Briefing IA (killer feature)
- Resume as top 10 noticias dos feeds configurados em 3-5 frases
- Gera automaticamente ao abrir o dashboard (1x por dia, cached)
- Botao "Regenerar" para refrescar
- Modelo: Claude Haiku (rapido, barato — ~0,001€ por resumo)
- Fallback: se sem API key, mostra os titulos sem resumo

#### W3 — Tarefas
- Multiplas listas: "Hoje", "Esta semana", "Pessoal" (configuravel)
- Input para adicionar tarefa + prioridade (alta/media/baixa)
- Checkbox para marcar como feito
- Contador "X de Y completas"
- Botao limpar completas
- Arrasto para reordenar
- Persistencia localStorage (v1) / Supabase (v2)

#### W4 — Feed de noticias
- Feeds RSS configuraveis (defaults: Hacker News, TechCrunch AI, The Verge)
- Titulo + link + fonte + tempo relativo
- Maximo 5 noticias por feed (configuravel)
- Auto-refresh a cada 30 min
- Proxy: Supabase Edge Function (v2) / allorigins (v1)
- Filtro por feed / todos
- Clique abre em nova tab

#### W5 — GitHub Activity
- Ultimos 5 commits do utilizador (GitHub API, token no localStorage)
- PRs abertos (com count)
- Contribuicoes da semana (heatmap simplificado)
- Link directo para cada repo/PR

#### W6 — Links rapidos
- Grid de N botoes com icone (configuravel)
- Defaults: GitHub, Vercel, Supabase, Gmail, Claude, Comunidade
- Hover com glow
- Utilizador adiciona/remove/reordena
- Suporte a favicon automatico

#### W7 — Pomodoro / Focus Timer
- Timer 25/5 (configuravel)
- Contador de sessoes do dia
- Liga a uma tarefa activa (opcional)
- Notificacao sonora ao terminar
- Historico de sessoes (hoje/semana)

#### W8 — Notas rapidas (Scratchpad)
- Bloco de texto livre com markdown basico
- Auto-save a cada 5 segundos
- Maximo 3 notas pinadas
- Util para ideias rapidas, links, lembretes

### Widgets V2 (pos-MVP)

| Widget | Integracao | Complexidade |
|--------|-----------|-------------|
| W9 — Gmail | Google API: emails nao lidos com label Priority | Alta |
| W10 — Google Calendar | Google API: proximos 5 eventos do dia | Alta |
| W11 — Analytics pessoal | Metricas internas: tarefas/semana, focus time, streaks | Media |
| W12 — Meteo | OpenWeatherMap API: meteo da cidade configurada | Baixa |
| W13 — Vercel Deploys | Vercel API: estado dos ultimos deploys | Media |
| W14 — Calendario/Agenda | Vista semanal com eventos e deadlines | Alta |

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [N] Nexus    Bom dia, Eurico      [Config] [+]  │
│             Terca, 8 Abril 2026 · 09:14            │
├───────────────────┬─────────────────────────────────┤
│                   │                                 │
│  BRIEFING IA      │  FEED NOTICIAS                 │
│  ─────────────    │  ─────────────                 │
│  "Hoje destaque   │  ▸ OpenAI lanca modelo...      │
│   para o novo     │  ▸ Vercel anuncia...           │
│   modelo da       │  ▸ React 20 roadmap...         │
│   Anthropic..."   │  ▸ Supabase Vector...          │
│                   │  ▸ GitHub Copilot X...         │
│  [Regenerar]      │  [HN] [TC] [TV] [Todos]       │
│                   │                                 │
├───────────────────┼─────────────────────────────────┤
│                   │                                 │
│  TAREFAS HOJE     │  GITHUB                        │
│  ─────────────    │  ─────────────                 │
│  ☑ Review PR #42  │  feat: add widget... · 2h      │
│  □ Deploy v2.1    │  fix: proxy RSS... · 5h        │
│  □ Email parceiro │  3 PRs abertos                 │
│  [+ Nova tarefa]  │  ████░░░ 23 contrib/semana     │
│  2/4 completas    │                                 │
│                   │                                 │
├───────────────────┼────────────┬────────────────────┤
│                   │            │                    │
│  LINKS RAPIDOS    │  POMODORO  │  NOTAS             │
│  [GitHub] [Vercel]│  25:00     │  - Ligar ao Joao   │
│  [Supabase]       │  [Start]   │  - Rever proposta  │
│  [Gmail] [Claude] │  3 sessoes │  - Ideia: widget   │
│  [Comunidade]     │  hoje      │    de quotes       │
│  [+ Adicionar]    │            │                    │
│                   │            │                    │
└───────────────────┴────────────┴────────────────────┘
```

### Onboarding (primeira visita)

```
Passo 1: "Como te chamas?" → Nome para a saudacao
Passo 2: "Que feeds acompanhas?" → Checkboxes + custom URL
Passo 3: "Links rapidos" → Arrastar para adicionar
Passo 4: "Tema" → Escolher entre 4 temas
Passo 5: "API keys (opcional)" → GitHub token, Claude API key
```

Dados guardados em localStorage. Skip disponivel em todos os passos.

### Temas visuais

| Tema | Fundo | Accent | Vibe |
|------|-------|--------|------|
| Midnight (default) | #04040A | #00F5FF (cyan) | Escuro, tech, profissional |
| Warm Dark | #1a1410 | #FFB800 (gold) | Escuro quente, acolhedor |
| Deep Purple | #0d0618 | #9D00FF (purple) | Escuro, criativo, IA |
| Arctic | #f0f4ff | #0066ff (blue) | Claro, limpo, minimal |

Todos os temas usam CSS custom properties — mudar tema e trocar 5 variaveis.

### Design

- Glassmorphism em cards: `background: rgba(255,255,255,0.03)` + `border: 1px solid rgba(255,255,255,0.08)`
- Fonte: Inter (body) + JetBrains Mono (numeros, badges, codigo)
- Border-radius: 12px em cards, 20px em badges, 6px em botoes
- Transicoes: `0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Responsivo: 3 colunas desktop, 2 tablet, 1 mobile (CSS Grid)
- PWA: service worker para offline + manifest para instalacao

### Criterios de sucesso — MVP

- [ ] Pagina carrega em <2s (Lighthouse Performance >90)
- [ ] 8 widgets funcionais com dados reais
- [ ] Onboarding personalizavel (nome, feeds, links, tema)
- [ ] Briefing IA gera resumo das noticias (com fallback)
- [ ] Tarefas persistem ao recarregar (localStorage)
- [ ] GitHub widget mostra commits e PRs reais
- [ ] 4 temas visuais funcionais
- [ ] PWA instalavel em mobile e desktop
- [ ] Deployed no Vercel com URL publica
- [ ] Funciona offline (tarefas e notas)
- [ ] Responsivo: desktop, tablet, mobile
- [ ] Atalhos de teclado: N (nova tarefa), / (pesquisa), T (timer)

### Criterios de sucesso — V2

- [ ] Auth Supabase (Google + GitHub login)
- [ ] Sync de dados entre dispositivos
- [ ] Proxy RSS via Supabase Edge Function (sem allorigins)
- [ ] Widgets Gmail e Calendar (Google API)
- [ ] Analytics pessoal ("esta semana completaste X tarefas")
- [ ] Drag & drop para reorganizar widgets
- [ ] Exportar/importar configuracao como JSON
- [ ] Widget meteo com OpenWeatherMap

---

## 3. PROMPT DE CONSTRUCAO (copiar e colar)

### Prompt completo para Claude Code / Gemini CLI

```
Cria um command center pessoal chamado "Nexus" em React 19 + Vite + Tailwind CSS v4.
O nome "Nexus" significa ponto de convergencia — onde todas as tuas ferramentas se encontram.

CONCEITO:
Dashboard pessoal que agrega feeds, tarefas, actividade GitHub, e briefing IA num unico ecra. Sistema modular de widgets. Cada widget e um componente independente.

DESIGN:
- Tema default "Midnight": fundo #04040A, accent cyan #00F5FF
- 4 temas via CSS custom properties (Midnight, Warm Dark, Deep Purple, Arctic)
- Cards com glassmorphism: bg rgba(255,255,255,0.03), border rgba(255,255,255,0.08), border-radius 12px, backdrop-filter blur(12px)
- Fontes: Inter (body/UI) + JetBrains Mono (numeros, badges, codigo) — importar do Google Fonts
- Responsivo: CSS Grid — 3 colunas desktop (>1200px), 2 tablet (768-1200px), 1 mobile (<768px)
- Transicoes: 0.25s cubic-bezier(0.4, 0, 0.2, 1)

ONBOARDING (primeira visita):
- Modal de 5 passos: nome, feeds RSS, links rapidos, tema, API keys (opcional)
- Guardar em localStorage com chave "nexus_config"
- Botao Skip em todos os passos
- Mostrar apenas na primeira visita (flag "nexus_onboarded")

8 WIDGETS:

1. GREETING + CLOCK — Saudacao com hora ("Bom dia/Boa tarde/Boa noite, [Nome]") + relogio tempo real (hh:mm:ss) + data completa + timezone do browser

2. BRIEFING IA — Buscar titulos dos feeds configurados, enviar para Claude API (modelo claude-haiku-4-5-20251001) com prompt "Resume estas 10 noticias em 3-5 frases concisas em portugues, destacando o mais relevante". Cached em localStorage por 12h. Botao "Regenerar". Se nao tiver API key, mostrar mensagem "Configura a API key nas definicoes para activar o resumo IA" com os titulos em lista simples como fallback.

3. TAREFAS — 3 listas default ("Hoje", "Esta semana", "Pessoal"), editavel. Input com placeholder "Nova tarefa..." + selector de prioridade (alta=vermelho, media=amarelo, baixa=verde). Checkbox para marcar feito. Contador "X/Y completas". Botao limpar completas. Persistencia localStorage. Reordenar por drag (HTML5 drag API, sem lib externa).

4. FEED NOTICIAS — Buscar RSS de N fontes configuradas via https://api.allorigins.win/get?url=FEED_URL. Defaults: Hacker News (https://hnrss.org/frontpage?count=5), TechCrunch AI (https://techcrunch.com/category/artificial-intelligence/feed/), The Verge AI (https://www.theverge.com/rss/ai-artificial-intelligence/index.xml). Parser DOMParser no browser. Mostrar: titulo + fonte (badge) + tempo relativo. Filtro por fonte. Auto-refresh 30 min.

5. GITHUB ACTIVITY — Se GitHub token configurado: fetch ultimos 5 commits (GET /users/{username}/events), PRs abertos (GET /search/issues?q=author:{username}+type:pr+state:open), contribuicoes da semana (contar eventos dos ultimos 7 dias). Se sem token: mostrar placeholder com instrucoes. Username extraido do token via GET /user.

6. LINKS RAPIDOS — Grid de botoes com icone (lucide-react). Defaults: GitHub, Vercel, Supabase, Gmail, Claude, Comunidade. Cada link: {nome, url, icone}. Botao "+ Adicionar" abre mini-form (nome + URL). Hover: box-shadow glow com accent color. Configuravel nas definicoes.

7. POMODORO — Timer 25:00 countdown. Botoes: Start/Pause/Reset. Pausa de 5 min automatica apos cada sessao. Contador "X sessoes hoje" (reset a meia-noite). Som de notificacao (Web Audio API, beep sintetizado — sem ficheiro externo). Barra de progresso circular em SVG.

8. NOTAS RAPIDAS — Textarea com auto-save (debounce 3s) em localStorage. Maximo 3 notas (tabs). Suporte basico: texto simples. Placeholder: "Ideias, lembretes, links..."

ATALHOS DE TECLADO:
- N: abrir input de nova tarefa (focus)
- /: abrir pesquisa global (se implementada)
- T: start/pause pomodoro timer
- Escape: fechar modais

FICHEIROS PROTEGIDOS (nao sobrescrever):
src/main.tsx, package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vercel.json, index.html

ESTRUTURA:
src/
  components/
    layout/         → Header, WidgetGrid
    widgets/        → GreetingWidget, BriefingWidget, TasksWidget, FeedWidget, GitHubWidget, LinksWidget, PomodoroWidget, NotesWidget
    onboarding/     → OnboardingModal, steps/
    ui/             → Button, Card, Badge, Input, Modal
  hooks/            → useLocalStorage, useRssFeed, useGitHub, usePomodoro, useBriefing
  lib/              → config.ts, themes.ts, rss-proxy.ts, claude-api.ts, github-api.ts
  types/            → index.ts (interfaces para Config, Task, FeedItem, GitHubEvent, Widget)
  styles/           → tailwind base + custom animations
  App.tsx           → Layout principal + widget grid + onboarding check

REGRAS:
- Zero backend — tudo no browser (v1)
- localStorage para toda a persistencia
- Sem login/autenticacao (v1)
- Sem dependencias externas alem de react, lucide-react, e tailwind
- Todos os widgets tem estado de loading e estado de erro
- PWA: adicionar manifest.json + service worker basico para offline
```

### Prompt rapido (se o tempo apertar na demo)

```
Command center pessoal "Nexus" (ponto de convergencia das tuas ferramentas) em React 19 + Vite + Tailwind.
Fundo escuro (#04040A), glassmorphism, cyan accent. 4 temas. Onboarding com nome e feeds.
8 widgets: saudacao+relogio, briefing IA (Claude Haiku), tarefas com localStorage e prioridades, feed RSS via allorigins (HN + TechCrunch + Verge), GitHub activity (commits + PRs via API), links rapidos configuráveis, pomodoro timer com som, notas rapidas.
Atalhos: N (tarefa), T (timer). PWA instalavel. Zero backend. Responsivo.
```

---

## 4. PLANO B (se o demo falhar ao vivo)

Se a construcao falhar durante a demo:

1. **Ter o repo ja criado no GitHub** com o codigo funcional
2. **Ter o Vercel deploy ja feito** com URL publica
3. Mostrar o resultado final e explicar: "Isto e o que a IA construiu em 20 minutos"
4. Voltar ao Brief e PRD para mostrar o processo

### Preparar antes da imersao

- [ ] Correr o prompt completo no Claude Code e guardar o repo
- [ ] Deploy no Vercel — guardar URL
- [ ] Testar em mobile (PWA install)
- [ ] Testar com GitHub token real
- [ ] Testar briefing IA com Claude API key
- [ ] Screenshot/video do resultado para fallback
- [ ] Preparar API keys de demo (Anthropic + GitHub)

---

## 5. ROTEIRO DO DEMO (20 min)

| Min | Accao | O que dizer |
|-----|-------|-------------|
| 0-2 | Mostrar a dor | "Todos os dias abro 6 tabs. 15 minutos perdidos. Isto e a MINHA dor." |
| 2-5 | Escrever Brief | "Sem IA. Papel e caneta. Esgoto o cerebro." (mostrar template) |
| 5-7 | QA 1 com IA | Colar rascunho no Claude. "A IA nao inventa — encontra os meus pontos cegos." |
| 7-10 | Detalhar | Mostrar os 8 widgets. "Agora sei EXACTAMENTE o que quero." |
| 10-12 | Criar PRD | "Isto e o que a IA precisa. Clareza antes de execucao." |
| 12-17 | Construir | Colar prompt no Claude Code. Ver o codigo a aparecer. |
| 17-19 | Deploy | `git push` + Vercel auto-deploy |
| 19-20 | Resultado | Abrir URL. "Ha 20 minutos nao tinha nada. Agora tenho um command center com IA." |

**Momento wow (minuto 18):** Abrir o Nexus no telemovel, mostrar que e PWA, mostrar o briefing IA a resumir as noticias. "Isto foi construido por IA — mas a direcao foi MINHA."

---

## 6. ESTRATEGIA DE MONETIZACAO

### Modelo freemium

| Plano | Preco | Inclui |
|-------|-------|--------|
| **Free** | 0€ | 4 widgets, 1 tema, localStorage, sem IA |
| **Pro** | 8€/mes | 8+ widgets, 4 temas, briefing IA, GitHub widget, sync Supabase |
| **Team** | 18€/mes/membro | Tudo do Pro + dashboard partilhado + widgets de equipa |

### Vias de receita adicionais

| Via | Modelo | Potencial |
|-----|--------|-----------|
| Templates de dashboard | Venda unica 5-15€ | Templates por nicho (dev, CEO, freelancer, marketer) |
| Widgets marketplace | Revenue share 70/30 | Comunidade cria widgets, marketplace com pagamento |
| White-label | Licenca anual 500-2000€ | Empresas personalizam com logo e cores para equipas |
| API de briefing IA | Pay-per-use 0,01€/resumo | Outros produtos usam o engine de resumo |

### Custos estimados (por 1000 utilizadores activos)

| Item | Custo mensal |
|------|-------------|
| Vercel Pro | 20€ |
| Supabase Pro | 25€ |
| Claude Haiku (1000 resumos/dia) | ~30€ |
| Dominio + DNS | 1€ |
| **Total** | ~76€/mes |

**Break-even:** 10 utilizadores Pro (80€/mes) cobrem toda a infraestrutura de 1000 users.

### Metricas de sucesso (produto)

| Metrica | Target MVP | Target 6 meses |
|---------|-----------|-----------------|
| MAU (Monthly Active Users) | 100 | 1.000 |
| DAU/MAU ratio | 30% | 50% |
| Conversao free→pro | — | 5% |
| Churn mensal pro | — | <5% |
| NPS | — | >50 |
| Tempo medio por sessao | 3 min | 5 min |

---

## 7. ROADMAP

### Fase 1 — MVP (demo + 1 semana)

- [ ] 8 widgets funcionais
- [ ] Onboarding personalizavel
- [ ] 4 temas visuais
- [ ] Briefing IA com Claude Haiku
- [ ] PWA com offline
- [ ] Deploy Vercel

### Fase 2 — Produto (semanas 2-4)

- [ ] Auth Supabase (Google + GitHub)
- [ ] Sync de dados multi-dispositivo
- [ ] Proxy RSS via Supabase Edge Function
- [ ] Widget Gmail (Google API)
- [ ] Widget Calendar (Google API)
- [ ] Analytics pessoal
- [ ] Drag & drop de widgets

### Fase 3 — Monetizacao (meses 2-3)

- [ ] Stripe integration (planos free/pro/team)
- [ ] Landing page com copy e conversao
- [ ] Templates marketplace
- [ ] Widget meteo
- [ ] Exportar/importar configuracao
- [ ] Modo equipa (dashboard partilhado)

### Fase 4 — Escala (meses 4-6)

- [ ] White-label para empresas
- [ ] API publica de widgets
- [ ] Widgets marketplace (terceiros)
- [ ] Integracao Slack, Linear, Notion
- [ ] Mobile app nativa (React Native ou Capacitor)
- [ ] AI briefing avancado (analise de tendencias semanal)

---

## 8. CONCORRENCIA E DIFERENCIACAO

| Concorrente | O que faz | Onde o Nexus ganha |
|-------------|-----------|---------------------|
| Notion | Workspace all-in-one | Nexus e mais focado e rapido — zero setup para overview diario |
| Arc Browser (new tab) | Pagina inicial bonita | Nexus tem IA, tarefas, e dados reais de GitHub |
| Momentum | Extensao Chrome com foco | Nexus tem feeds, GitHub, briefing IA — mais funcional |
| Start.me | Agregador de bookmarks | Nexus tem widgets activos com dados reais, nao links estaticos |
| Raycast | Command center macOS | Nexus e web — funciona em qualquer SO e dispositivo |
| Homer/Heimdall | Self-hosted dashboards | Nexus tem IA, nao precisa de servidor, PWA nativa |

**Posicionamento:** "Nexus — o ponto de convergencia. O Raycast da web — com IA."

---

*PRD v2.0 — Nexus*
*De demo Imersao IA Portugal a produto monetizavel*
*Metodo ORIGINAI — [IA]AVANCADA PT*
*Actualizado: 08/04/2026*
