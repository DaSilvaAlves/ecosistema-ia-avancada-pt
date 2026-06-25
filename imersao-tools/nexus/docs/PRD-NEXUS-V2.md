# Nexus v2 — Product Requirements Document (PRD)

**Autor:** Orion (aiox-master) por directiva do Eurico
**Data:** 04/05/2026
**Versão:** 1.0 (MVP — Migração v1→v2 com 15 módulos)
**Estado:** Draft (pré-validação @po, pré-arquitectura @architect)
**Trace:** `imersao-tools/nexus/src/` (v1 funcional), conversa com Eurico 04/05/2026, `project_nexus_vision.md`, `JARVIS.txt` (referência conceptual — Jarvis NÃO é desenvolvido aqui).

---

## 1. Sumário Executivo

**O Nexus v2 é o assistente pessoal interno do Eurico — chat-first com cérebro multi-intent, integrado com Google Calendar/Gmail e Telegram, single-user, zero custos externos, deployed em Vercel.**

- **Mercado:** Nenhum. Uso pessoal interno do Eurico. Não é SaaS, não é multi-tenant, não é para vender.
- **Inspiração:** Néctar (Brasil) e brief do `meu-jarvis` (SaaS separado, fora deste projecto). Conceptualmente próximo, executivamente independente.
- **Diferenciador vs Nexus v1:** chat AI multi-intent no centro (substitui dashboard passivo), 15 módulos novos, backend mínimo Vercel Functions (resolve API key insegura no browser).
- **Constraint inegociável:** ZERO subscriptions ou custos recorrentes externos além da API key Anthropic já existente.

---

## 2. Background e Mudanças vs v1

### 2.1 Estado actual (Nexus v1, 08/04/2026)

| Componente | Estado | Decisão v2 |
|-----------|--------|-----------|
| Vite + React 19 + localStorage | Funcional | **Migra para Next.js 15 + Vercel Functions** |
| API key Anthropic no browser | Risco — `anthropic-dangerous-direct-browser-access` | **Move para server-side env** |
| Dashboard 8 widgets (Greeting/Morning/Goodnight/Tasks/Notes/Links/GitHub/Pomodoro) | Funcional | **Mantém widgets, descem para sidebar** |
| MarketsWidget órfão (criado, não montado) | 🟡 | **Monta na sidebar v2** |
| BriefingWidget + FeedWidget órfãos | 🟡 | **Apaga** (substituídos por chat) |
| Pomodoro independente | Funcional | **Mantém + opção de associar a tarefa** |
| Onboarding 4 steps | Funcional | **Adapta para v2 (login simples + welcome)** |

### 2.2 Mudança fundamental: paradigma

**v1:** Dashboard passivo. Cada widget é um silo. Interagir = clicar em botões.
**v2:** Chat central como ecrã principal. Uma frase ("paguei €78,70 no continente, amanhã reunião 15h, lembra-me sexta de pagar a luz") cria 3 acções de uma vez. Widgets descem para sidebar/painéis secundários.

### 2.3 Decisões finais do Eurico (04/05/2026)

| Decisão | Valor |
|---------|-------|
| Paradigma | Chat-first (substitui dashboard) |
| Stack | Next.js 15 + Vercel Functions + localStorage (ou IndexedDB) |
| Reuso código | Construir só no Nexus. Jarvis fora deste repo |
| Módulos | 15 (todos: cérebro, tarefas, finanças, hábitos, projectos, lembretes, metas, diário, brain dump, conhecimento, calendar, gmail, telegram, voice, OCR) |
| Custos | Zero externos. Tudo gratuito ou já incluído |
| Canal alternativo a WhatsApp | **Telegram Bot API** (oficial, gratuita) |
| Lembretes | Web Push API (browser nativo) |
| Voice | Web Speech API (browser nativo, Chrome/Edge) |
| Pesquisa web | Anthropic web search (incluída) ou DuckDuckGo |
| Deploy | Vercel |
| Auth | Single-user (password simples ou magic link) — uso interno |

---

## 3. Goals

| # | Goal | Métrica de sucesso |
|---|------|--------------------|
| G1 | Substituir dashboard v1 por chat-first com cérebro multi-intent funcional em PT-PT | Prompt "X, Y, Z" cria 3 entidades correctas em 1 chamada |
| G2 | Cobrir 15 módulos (tarefas, finanças, hábitos, projectos, lembretes, metas, diário, brain dump, conhecimento, calendar, gmail, telegram, voice, OCR, briefing) | Cada módulo tem CRUD + tool do cérebro |
| G3 | Eliminar API key Anthropic do browser | Key só em Vercel env, nunca chega ao client |
| G4 | Zero subscriptions externas | Apenas API key Anthropic já existente; tudo o resto gratuito |
| G5 | Deploy contínuo Vercel sem fricção | Push main → deploy < 2 min |
| G6 | Briefing matinal puxa estado real do dia anterior | Tarefas concluídas + finanças + hábitos + Gmail importante + eventos calendário |
| G7 | Funcionar offline em modo degradado | PWA + service worker; chat exige conectividade mas dashboard lê localStorage |

---

## 4. Persona única — Eurico

| Dimensão | Detalhe |
|----------|---------|
| Idade/perfil | Consultor de implementação de IA, fundador da [IA]AVANÇADA PT, freelancer |
| Stack diária | Múltiplos terminais Claude Code, AIOX, projectos paralelos (membros, comunidade, imersão, voz-ai-pt) |
| Hardware | RTX 3050 Ti 4GB VRAM, Windows 11 Pro, browsers Chrome/Edge |
| Trabalha até | 4-5h da madrugada |
| Dor declarada | Reconstruir contexto de manhã (15-30 min); despesas espalhadas em 4 sítios; esquecimentos por falta de hub central; Gmail desorganizado |
| Tom preferido | Directo, PT-PT, "fala como quem já fez", sem floreados |
| Feedback histórico | Nunca instalar mais ferramentas; nunca fechar terminais; nunca inventar dados |

**Não há persona 2 nem 3.** Multi-tenancy é decisão arquitectural rejeitada.

---

## 5. Constraints e Assumptions

### 5.1 Constraints inegociáveis

| # | Constraint | Origem |
|---|-----------|--------|
| C1 | **Single-user** — só Eurico acede | Directiva 04/05/2026 |
| C2 | **Zero custos externos** além da API key Anthropic | Directiva 04/05/2026 (resposta D) |
| C3 | **PT-PT exclusivo** | `language-standards.md` |
| C4 | **Design system [IA]AVANÇADA PT** (background `#04040A`, glassmorphism, Inter + JetBrains Mono) | `design-system-ia-avancada.md` |
| C5 | **Constitution AIOX** — story-driven, agent authority, quality first, no invention | `.aiox-core/constitution.md` |
| C6 | **Telegram Bot API** (não WhatsApp) | Directiva 04/05/2026 (resposta A) |
| C7 | **Web Push** (não SMS, não email externo) para notificações | Directiva 04/05/2026 (resposta B) |
| C8 | **Web Speech API** para voice (não Whisper backend) | Directiva 04/05/2026 (resposta C) |
| C9 | Deploy Vercel | Directiva 04/05/2026 (resposta E) |
| C10 | **Build não destrói código v1 existente** — reuso de widgets como componentes | Custo de retrabalho |

### 5.2 Assumptions a validar com @architect

- Browser do Eurico suporta Web Push (Chrome/Edge confirmado)
- Browser do Eurico suporta Web Speech API recognition (Chrome/Edge confirmado, Safari/Firefox limitado)
- localStorage suficiente para dataset pessoal (estimativa: < 5MB para 6 meses de uso) — fallback IndexedDB se exceder
- Vercel Functions free tier suporta volume estimado (< 1000 invocações/dia)
- Telegram Bot pode ser criado e mantido pelo Eurico (BotFather)
- Claude Sonnet 4.6 + Haiku 4.5 (já existente em código v1) cobrem todos os intents

---

## 6. Functional Requirements

### 6.1 Cérebro multi-intent (chat-first)

- **FR1:** Layout principal é chat com input always-visible no centro do ecrã. Trace: directiva P1=C.
- **FR2:** Sistema aceita prompt PT-PT em texto e classifica em 1+ intents simultâneas dentre: `criar_tarefa`, `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `criar_lembrete`, `criar_evento_calendar`, `criar_habito`, `registar_habito_concluido`, `criar_meta`, `criar_projecto`, `vincular_tarefa_projecto`, `criar_entrada_diario`, `brain_dump`, `criar_conhecimento_area`, `criar_conhecimento_caderno`, `consultar_dados`. Trace: JARVIS.txt L9-15.
- **FR3:** Quando há múltiplas intents, executa todas e devolve resumo agregado. Trace: JARVIS.txt L11-15.
- **FR4:** Cada execução cria entrada em `audit_log` com prompt original, intents, params, resultado. Trace: prudência.
- **FR5:** Confidence < 70% → preview antes de persistir. Trace: PRD Jarvis FR4.
- **FR6:** Botão undo (toast 30s) reverte última acção do agente. Trace: PRD Jarvis FR6.
- **FR7:** Sistema suporta consultas analíticas: "como estão as minhas finanças este mês", "que tarefas tenho atrasadas". Trace: JARVIS.txt L24-31.
- **FR8:** Histórico de chat persistente em localStorage (últimas 100 mensagens, com paginação infinite scroll).

### 6.2 Tarefas v2

- **FR9:** CRUD de tarefas com: título, descrição, prioridade (alta/média/baixa), due date, projecto opcional, tags, status (todo/in-progress/blocked/done), context ("onde parei"), `lastWorkedAt`. Trace: JARVIS.txt L94-101 + Nexus v1 actual.
- **FR10:** Recorrência configurável: diária, semanal, mensal, dias úteis, fim-de-semana, dia específico do mês. Trace: JARVIS.txt L122-129.
- **FR11:** 3 vistas: lista (existente em v1), Kanban (nova, colunas customizáveis), calendário semanal (nova). Trace: JARVIS.txt L100-101.
- **FR12:** Drag-and-drop entre dias na vista calendário e entre colunas na vista Kanban. Trace: JARVIS.txt L96-101.
- **FR13:** Tarefas atrasadas destacadas e listadas em secção dedicada do dashboard. Trace: JARVIS.txt L96.
- **FR14:** Tags globais (criar, listar, filtrar). Trace: JARVIS.txt L102.
- **FR15:** Tools cérebro: `criar_tarefa`, `completar_tarefa`, `listar_tarefas`, `listar_atrasadas`, `vincular_tarefa_projecto`. Trace: JARVIS.txt L7-15.

### 6.3 Finanças

- **FR16:** Transações financeiras variáveis com: valor (EUR formato PT-PT `€1.234,56`), categoria, data, descrição, conta/cartão opcional. Trace: JARVIS.txt L114-116.
- **FR17:** Finanças recorrentes (renda, internet, assinaturas) com mesma estrutura de recorrência das tarefas. Trace: JARVIS.txt L116, 122-129.
- **FR18:** Contas bancárias (com saldo) e cartões de crédito com fecho de fatura e dia de vencimento. Trace: JARVIS.txt L116-119.
- **FR19:** Compras parceladas vinculadas a cartão, geram N transações futuras automaticamente. Trace: JARVIS.txt L116-118.
- **FR20:** Vista Património: saldo agregado por banco/conta com drilldown. Trace: JARVIS.txt L117-119.
- **FR21:** Vista mensal: análise por categoria, por dia, total entrado vs saído, projecção 30 dias incluindo recorrentes e prestações. Trace: JARVIS.txt L29-30, 119-120.
- **FR22:** Categorias default PT (Mercearia, Restauração, Combustível, Saúde, Habitação, Educação, Lazer, Subscrições, Serviços, Outros). Trace: PRD Jarvis FR Epic 4.
- **FR23:** Tools cérebro: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria`. Trace: JARVIS.txt L114-129.

### 6.4 Hábitos

- **FR24:** CRUD de hábitos: nome, frequência (diária, X vezes por semana, dias específicos), categoria, horário opcional. Trace: JARVIS.txt L102-109.
- **FR25:** Registo diário de hábito concluído (check manual ou via cérebro). Trace: JARVIS.txt L60-67.
- **FR26:** Heatmap calendário (estilo GitHub contributions) por hábito, últimos 6 meses. Trace: JARVIS.txt L108.
- **FR27:** Para hábitos com métricas (ex: "treino de pernas", "X km corrida", "Y páginas lidas"): permite registar valor + ver evolução mensal e recordes. Trace: JARVIS.txt L104-108.
- **FR28:** Tools cérebro: `criar_habito`, `registar_habito_concluido`, `consultar_evolucao_habito`. Trace: JARVIS.txt L60-67.

### 6.5 Projectos

- **FR29:** CRUD de projectos: nome, descrição, status (activo/pausado/concluído), data início, data prazo opcional. Trace: JARVIS.txt L110-111.
- **FR30:** Tarefas podem vincular-se a 0 ou 1 projecto. Trace: JARVIS.txt L111.
- **FR31:** Vista projecto: tarefas vinculadas com vista lista + Kanban. Trace: JARVIS.txt L110-111.
- **FR32:** Tools cérebro: `criar_projecto`, `vincular_tarefa_projecto`, `consultar_projecto`.

### 6.6 Lembretes

- **FR33:** CRUD lembretes: texto, horário, recorrência opcional (igual a tarefas). Trace: JARVIS.txt L111-114.
- **FR34:** Notificação **Web Push** disparada no horário marcado. Trace: directiva B.
- **FR35:** Subscrição Web Push pedida no onboarding (utilizador autoriza). Trace: técnico.
- **FR36:** Notificação contém texto do lembrete + botão "marcar feito" + botão "snooze 10min".
- **FR37:** Lembretes podem também ser entregues via **Telegram bot** (FR70). Trace: directiva A.
- **FR38:** Tools cérebro: `criar_lembrete`, `listar_lembretes`, `cancelar_lembrete`.

### 6.7 Metas

- **FR39:** CRUD metas: título, descrição, prazo, métrica (numérica ou booleana), valor target, valor actual, milestones opcionais. Trace: JARVIS.txt L120.
- **FR40:** Vista meta: progress bar + histórico de updates + milestones. Trace: standard de indústria.
- **FR41:** Tools cérebro: `criar_meta`, `actualizar_meta`, `consultar_metas`.

### 6.8 Diário

- **FR42:** Entrada de diário diária: texto livre markdown, mood (1-5), data automática. Trace: JARVIS.txt L83-85.
- **FR43:** Cérebro AI propõe estrutura ao texto livre quando > 100 caracteres (ex: separa em "fiz", "senti", "aprendi"). Trace: JARVIS.txt L83.
- **FR44:** Vista calendário com indicador de mood por dia (heatmap colorido). Trace: standard.
- **FR45:** Pesquisa full-text nas entradas. Trace: standard.
- **FR46:** Tools cérebro: `criar_entrada_diario`, `consultar_diario`, `pesquisar_diario`.

### 6.9 Brain Dump

- **FR47:** Input texto livre ("vomita ideias 10 min seguidos"). Trace: JARVIS.txt L83-85.
- **FR48:** AI estrutura output em: tarefas propostas, projectos propostos, ideias soltas, decisões a tomar. Trace: JARVIS.txt L84.
- **FR49:** Utilizador aprova item-a-item antes de persistir como tarefa/projecto/nota. Trace: prudência.
- **FR50:** Tool cérebro: `brain_dump`.

### 6.10 Conhecimento

- **FR51:** Hierarquia: Áreas → Cadernos → Notas (markdown). Trace: JARVIS.txt L72-82.
- **FR52:** CRUD de áreas, cadernos, notas. Trace: JARVIS.txt L72-82.
- **FR53:** Pesquisa full-text em notas. Trace: standard.
- **FR54:** Tag global system partilhado com tarefas. Trace: standard.
- **FR55:** **Pesquisa web** integrada via Anthropic web search (incluída na API key) ou fallback DuckDuckGo HTML scraping. Trace: directiva D + JARVIS.txt L72-82.
- **FR56:** Cérebro pode pesquisar web e criar notas automaticamente: "pesquisa Artemis 2 e cria área Espaço com caderno Artemis 2". Trace: JARVIS.txt L72-82.
- **FR57:** Tools cérebro: `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota`.

### 6.11 Google Calendar (2-way sync)

- **FR58:** OAuth flow Google (scope `calendar`) iniciado pelo utilizador nas definições. Trace: directiva.
- **FR59:** Sync 2-way: eventos criados no Nexus aparecem no Google Calendar e vice-versa. Trace: JARVIS.txt L32-42.
- **FR60:** Refresh token armazenado server-side (Vercel KV gratuito ou env). Trace: segurança.
- **FR61:** Cérebro: "amanhã 15h reunião com Paulo" cria evento via tool `criar_evento_calendar` que usa Google Calendar API. Trace: JARVIS.txt L32-42.
- **FR62:** Tools cérebro: `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos`.

### 6.12 Gmail (importante vs descartável)

- **FR63:** OAuth flow Google (scope `gmail.modify`) iniciado pelo utilizador. Trace: directiva.
- **FR64:** Inbox classificada por AI em: **Importante** (resposta necessária), **Para responder hoje**, **Pode esperar**, **Descartável**. Trace: visão 08/04/2026.
- **FR65:** Classificação corre em background (Vercel Cron ou trigger manual) para últimos N emails. Trace: técnico.
- **FR66:** Vista Gmail no dashboard: lista de **Importantes + Para responder hoje** apenas. Resto fica oculto por defeito. Trace: visão 08/04.
- **FR67:** Cérebro: "responde à Maria a confirmar reunião sexta" cria draft no Gmail. Trace: ambição.
- **FR68:** Tools cérebro: `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email`.

### 6.13 Telegram Bot

- **FR69:** Bot Telegram criado pelo utilizador via BotFather; token armazenado em Vercel env. Trace: directiva A.
- **FR70:** Bot recebe mensagens texto/voz/foto do utilizador e envia para `/api/telegram/webhook`. Trace: técnico.
- **FR71:** Mensagens texto vão directas para o cérebro multi-intent. Trace: JARVIS.txt L13-14.
- **FR72:** Mensagens voz transcrevidas (Web Speech API alternativa: Anthropic? — decisão @architect) e processadas pelo cérebro. Trace: JARVIS.txt L33-39.
- **FR73:** Fotos com texto identificado como recibo passam para OCR (FR81) e criam finança. Trace: JARVIS.txt L43-46.
- **FR74:** Bot envia lembretes (FR37) e briefings matinais (FR75) ao utilizador. Trace: directiva.
- **FR75:** Briefing matinal automático às 07h-09h (configurável) entregue por Telegram com o estado do dia. Trace: visão 08/04.
- **FR76:** Tool cérebro: `enviar_telegram` (responder ao próprio utilizador via bot).

### 6.14 Voice mode

- **FR77:** Botão "ligar voz" no chat principal. Trace: JARVIS.txt L56-71.
- **FR78:** Web Speech API recognition (browser nativo Chrome/Edge) transcreve voz para texto. Trace: directiva C.
- **FR79:** Texto transcrito vai directo para o cérebro multi-intent. Trace: JARVIS.txt L60-67.
- **FR80:** Resposta do cérebro pode ser falada via Web Speech API synthesis. Trace: JARVIS.txt L66-67.

### 6.15 OCR de recibos

- **FR81:** Endpoint `/api/ocr/receipt` recebe foto, devolve dados estruturados (data, total, IVA, mercador, items se possível). Trace: JARVIS.txt L43-46.
- **FR82:** Implementação via **Claude Vision** (incluído na API key Anthropic) — sem custos extra. Trace: directiva (zero custos).
- **FR83:** UI: arrastar foto para o chat OU enviar via Telegram bot (FR73). Trace: JARVIS.txt L43-46.
- **FR84:** Resultado mostra preview e cria finança variável quando confirmado. Trace: JARVIS.txt L46-50.
- **FR85:** Tool cérebro: `processar_recibo` (recebe URL/base64 da foto).

### 6.16 Briefing matinal e nocturno

- **FR86:** **Goodnight** (mantido v1, melhorado): clicar antes de dormir → snapshot completo + AI gera briefing para o dia seguinte. Trace: Nexus v1 + visão 08/04.
- **FR87:** **Morning briefing** automático ao 1º carregamento da app de manhã (após 06h, primeira vez do dia). Trace: visão 08/04.
- **FR88:** Briefing puxa: tarefas pendentes/atrasadas, calendário do dia, hábitos pendentes, lembretes do dia, balanço financeiro último 7 dias, emails importantes do Gmail, mercados financeiros (delta vs ontem), 1 nota de diário recente. Trace: visão 08/04.
- **FR89:** Briefing entregue também por Telegram (FR75). Trace: directiva A.

### 6.17 Auth e setup

- **FR90:** Login simples por **password única** (configurada em env Vercel) ou magic link (futuro). Trace: directiva (uso interno).
- **FR91:** Sem registos públicos. Sem multi-utilizador. Trace: directiva (single-user).
- **FR92:** Setup inicial cria identidade default ("Eurico"), pede API key Anthropic (validada server-side), pede subscrição Web Push, oferece OAuth Google (Calendar + Gmail) opcional, oferece bot Telegram opcional. Trace: pragmatismo.

### 6.18 Widgets v1 mantidos

- **FR93:** GitHub events (mantém widget v1). Trace: v1.
- **FR94:** Markets financeiros (CAC40/DAX/DJI/NDX/SP500/BRENT/ETH/NVDA/ASML — agora montado, era órfão em v1). Trace: visão 08/04.
- **FR95:** Pomodoro (mantém + novo: pode associar-se a uma tarefa específica antes de iniciar). Trace: v1 + decisão Eurico anterior.
- **FR96:** Quick Links (mantém widget v1). Trace: v1.

---

## 7. Non-Functional Requirements

### Performance
- **NFR1:** Latência p95 prompt cérebro multi-intent < 6s. Trace: PRD Jarvis NFR1.
- **NFR2:** Latência p95 CRUD localStorage < 50ms.
- **NFR3:** First Contentful Paint < 2s em 4G.
- **NFR4:** Histórico de chat carrega progressivamente (paginação infinite scroll).

### Segurança
- **NFR5:** API key Anthropic exclusivamente em Vercel env, NUNCA no client.
- **NFR6:** Tokens OAuth (Google) armazenados em Vercel KV ou env encrypted.
- **NFR7:** Token Telegram bot exclusivamente server-side.
- **NFR8:** Login session via cookie HttpOnly + SameSite=strict.
- **NFR9:** Rate limit nas Vercel Functions: 60 req/min por IP.

### Privacidade
- **NFR10:** Dados pessoais (notas, finanças, hábitos, diário, emails Gmail) **NÃO saem do localStorage do Eurico** excepto:
  - Quando enviados ao cérebro AI (Anthropic) com retenção zero (header `anthropic-beta` se aplicável)
  - Quando sincronizados com Google Calendar/Gmail por opt-in explícito
- **NFR11:** Logs Vercel NÃO contêm conteúdo de prompts em claro — apenas hash + intents detectadas.
- **NFR12:** Nada de telemetria externa (sem Google Analytics, sem Plausible). Trace: privacidade pessoal.

### Observabilidade
- **NFR13:** Logs Vercel + dashboard Vercel para latência funções.
- **NFR14:** Audit log de cérebro acessível via UI de definições.

### Qualidade
- **NFR15:** ESLint config + TypeScript strict mode.
- **NFR16:** Vitest para units, Playwright para E2E (fluxos críticos: login, prompt multi-intent, criar tarefa via UI).
- **NFR17:** Cobertura tests >= 60% em packages core (cérebro, tarefas, finanças). Mais leve que Jarvis (uso interno, pessoal).
- **NFR18:** CodeRabbit review activo; CRITICAL bloqueia merge.

### Operabilidade
- **NFR19:** Deploy main → Vercel < 2 min.
- **NFR20:** Rollback Vercel < 30s (UI nativa).
- **NFR21:** PWA com service worker para modo offline degradado (dashboard/widgets lêem localStorage; chat precisa de rede).
- **NFR22:** Backup local export JSON disponível em definições (cumpre boa prática mesmo sem GDPR).

### Compatibilidade
- **NFR23:** Browsers suportados: Chrome 110+, Edge 110+, Firefox 110+. Safari não é prioritário (Web Speech limitado).
- **NFR24:** Mobile responsive (Eurico usa por vezes telemóvel) — não nativo, mas via PWA.

---

## 8. Technical Assumptions

### 8.1 Service Architecture

**Monolito Next.js full-stack na Vercel.**
- Frontend: App Router + RSC + Client Components onde necessário.
- Backend: Vercel Functions (Edge Runtime preferido para latência baixa em chat).
- Persistência: localStorage v2 (com migration de v1) ou IndexedDB se exceder 5MB.
- Sem base de dados relacional no MVP — uso interno, single-user, dataset pequeno.
- Vercel KV (free tier 10MB) para tokens OAuth e cache de chamadas API caras.

### 8.2 Stack final

| Camada | Tech | Justificação |
|--------|------|-------------|
| Framework | Next.js 15 App Router + TypeScript strict | Directiva Eurico |
| Styling | Tailwind 4 (já existe v1) | Manter |
| UI Components | Componentes custom (já existem v1) + lucide-react | Manter |
| AI Executor | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Multi-intent function calling |
| AI Classifier | Claude Haiku 4.5 (`claude-haiku-4-5`) | Já em código v1, mantém |
| Drag-drop | dnd-kit | Padrão React, mantido |
| Datas/Recorrência | date-fns + rrule | Padrão indústria |
| Markdown editor | tiptap ou lexical (decisão @architect) | Conhecimento + Diário |
| Push | Web Push API + VAPID self-generated | Zero custos |
| Voice | Web Speech API browser | Zero custos |
| OAuth Google | googleapis SDK | Calendar + Gmail |
| Telegram | node-telegram-bot-api ou fetch direct | Bot API oficial gratuita |
| Storage tokens | Vercel KV | Free tier 10MB suficiente |
| Tests | Vitest + Playwright | Padrão moderno |
| CI | GitHub Actions + Vercel preview | Padrão |

### 8.3 Decisões deferidas para @architect

- Edge Runtime vs Node Runtime nas Functions
- IndexedDB lib (Dexie? idb? raw?)
- Markdown editor final
- Estratégia de migration localStorage v1 → v2
- Estrutura packages monorepo (vai ser monorepo? único package?)
- Estrutura de auditoria do cérebro (tabela em IndexedDB?)
- Telemetria local (algum dashboard mínimo?)

---

## 9. Epic List

| # | Épico | Goal | Bloqueia |
|---|-------|------|----------|
| **0** | Migração estrutural | Vite→Next.js 15 + Vercel Functions + AI key server-side + layout chat-first + auth single-user | Tudo |
| **1** | Cérebro multi-intent | Function calling com classifier + executor + preview + undo + audit log | 5, 7, 11, 12, 13 |
| **2** | Tarefas v2 + Projectos | Recorrência + Kanban + calendário + projectos + tools cérebro | 4 |
| **3** | Finanças completas | Variáveis + recorrentes + cartões + prestações + património + projecção 30d + tools cérebro | 12 |
| **4** | Hábitos + Metas + Lembretes | Heatmap + recorrência + Web Push + tools cérebro | — |
| **5** | Diário + Brain Dump + Conhecimento | AI organiza + áreas/cadernos/notas + pesquisa web + tools cérebro | — |
| **6** | OAuth Google (Calendar + Gmail) + Telegram Bot | Sync calendário 2-way + classificação Gmail + canal Telegram + tools cérebro | 7 |
| **7** | Voice + OCR | Web Speech (browser) + Claude Vision (recibo→finança) + integração Telegram | — |
| **8** | Migração de Provider de Inferência | Dual-provider OpenAI (Anthropic→OpenAI) atrás das interfaces existentes — flag `LLM_PROVIDER`, factory, `OpenAIExecutor`/`OpenAIClassifier`, proxy Edge, parity cross-provider, cutover (ADR-10) | — |
| **9** | Hardening + Deploy + PWA | Tests + service worker offline + deploy Vercel + backup export | — |

> **Nota (25/06/2026):** o **Epic 8 = Migração de Provider** foi inserido em resposta a um gatilho de produção (saldo Anthropic esgotado — `400 credit balance too low`); o Hardening, antes reservado como Epic 8, deslizou para **Epic 9**. Decisão ratificada pelo Eurico. Fonte: `ADR-10-dual-provider-openai-migration.md` + `EPIC-8.md`.

**Ordem sugerida:** 0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8 → 9.
**Paralelizável:** 2 e 3 podem correr em paralelo se @sm criar stories independentes.

---

## 10. Epic Details

### Epic 0 — Migração Estrutural

**Goal:** Migrar Vite→Next.js 15 sem perder código v1. Estabelecer Vercel Functions + AI key server-side. Layout chat-first com sidebar de widgets.

**Stories sugeridas:**
- 0.1 Setup Next.js 15 App Router em pasta paralela (`imersao-tools/nexus/v2/`); manter v1 em `nexus/` intocado durante migração
- 0.2 Migrar `themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts` para v2 sem alterar lógica
- 0.3 Migrar widgets v1 (Greeting, Goodnight, Morning, Tasks, Notes, Links, GitHub, Pomodoro, Markets) para componentes Next.js
- 0.4 Criar layout chat-first: ChatPanel central + Sidebar widgets à direita + header
- 0.5 Mover chamadas Anthropic do client para `/api/anthropic/proxy` (Vercel Function)
- 0.6 Login simples (password única env-based) com cookie sessão
- 0.7 Onboarding v2: pede password, valida, oferece subscrição Web Push, oferece OAuth Google (skip), oferece Telegram bot (skip)
- 0.8 Apagar `BriefingWidget.tsx` e `FeedWidget.tsx` (órfãos)
- 0.9 Configurar ESLint + TypeScript strict + Vitest + Playwright
- 0.10 Configurar Vercel deploy (preview + prod)

**AC Epic 0:**
- AC1: `npm run build` Next.js compila zero erros
- AC2: Login funciona; sem cookie, redirect para login
- AC3: Chat é o ecrã principal; widgets v1 todos visíveis na sidebar
- AC4: API key Anthropic NÃO aparece no bundle do client (verificável)
- AC5: Deploy Vercel funcional com domínio Vercel default
- AC6: PageSpeed Lighthouse score >= 80 mobile

**Quality gates:** lint + typecheck + test + build + manual smoke.

---

### Epic 1 — Cérebro Multi-Intent

**Goal:** Implementar function calling capaz de classificar e executar 1+ intents PT-PT em paralelo, com preview, undo, audit log.

**Stories sugeridas:**
- 1.1 Schema audit log em IndexedDB (`agent_runs`)
- 1.2 Provider abstraction Anthropic (executor + classifier)
- 1.3 Tool registry: lista de tools disponíveis (vazia inicialmente, povoada por epics seguintes)
- 1.4 Classifier: prompt PT-PT → intents + confidence
- 1.5 Executor: executa tools em sequência ou paralelo
- 1.6 Preview-then-confirm para confidence < 70%
- 1.7 Undo mechanism (storage 30s + endpoint reverse)
- 1.8 Endpoint `/api/agent/prompt` com auth + rate limit + telemetria
- 1.9 UI: chat input + streaming response + cards de acções criadas + toast undo
- 1.10 Conjunto manual de 50 prompts PT-PT para regression testing

**AC Epic 1:**
- AC1: Prompt "amanhã reunião 15h, paguei €78,70 supermercado" cria 1 evento (mock) + 1 finança (mock) numa única execução
- AC2: Prompt ambíguo dispara preview de confirmação
- AC3: `agent_runs` regista cada execução completa
- AC4: Undo reverte última operação dentro de 30s; após 30s não é possível
- AC5: Latência p95 < 6s em batch de 50 prompts de teste
- AC6: Tools registry suporta adicionar tools dinamicamente nos epics seguintes

**Quality gates:** Epic 0 + benchmark intent accuracy >= 85% (não 90% como Jarvis — aceita tolerância em uso pessoal).

---

### Epic 2 — Tarefas v2 + Projectos

**Goal:** CRUD completo de tarefas com recorrência, 3 vistas, projectos, tools cérebro integradas.

**Stories sugeridas:**
- 2.1 Schema `tasks`, `task_recurrences`, `tags`, `task_tags`, `projects`
- 2.2 Migration localStorage v1 (`nexus_tasks`) → v2 schema
- 2.3 Vista lista (refactor v1)
- 2.4 Vista Kanban com colunas customizáveis e dnd-kit
- 2.5 Vista calendário semanal com drag entre dias
- 2.6 Sistema tags global
- 2.7 Geração instâncias recorrentes (cron client-side via `setInterval` ou `requestIdleCallback`)
- 2.8 CRUD projectos
- 2.9 Vista projecto (lista + Kanban filtrado)
- 2.10 Tools cérebro: `criar_tarefa`, `completar_tarefa`, `listar_tarefas`, `listar_atrasadas`, `vincular_tarefa_projecto`, `criar_projecto`, `consultar_projecto`

**AC Epic 2:**
- AC1: Migration v1→v2 não perde tarefas existentes
- AC2: Criar tarefa via UI ou via cérebro tem mesmo resultado persistido
- AC3: Recorrência semanal/mensal/dias-úteis funciona em horizonte 90 dias
- AC4: Drag-and-drop em Kanban e calendário persiste sem reload
- AC5: Tarefa pode ter projecto OU não (opcional)

**Quality gates:** Epic 1 + manual UX validation.

---

### Epic 3 — Finanças Completas

**Goal:** Finanças completas com cartões, prestações, recorrentes, património, projecção. Tools cérebro integradas.

**Stories sugeridas:**
- 3.1 Schema `accounts`, `cards`, `transactions`, `recurrences`, `installments`, `categories`
- 3.2 Categorias default PT (10 categorias mínimas)
- 3.3 CRUD transações variáveis (UI + tool)
- 3.4 CRUD recorrências
- 3.5 CRUD cartões com fecho fatura + dia vencimento
- 3.6 Compras parceladas (gera N transações futuras)
- 3.7 Vista "este mês" (categoria/dia/total)
- 3.8 Vista cartões (fatura corrente + próxima + prestações)
- 3.9 Vista património (saldo agregado por conta)
- 3.10 Geração diária recorrentes + prestações (cron client ao primeiro carregamento do dia)
- 3.11 Tools cérebro: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria`

**AC Epic 3:**
- AC1: Compra parcelada €1.200 em 12x cria 12 transações futuras de €100 cada
- AC2: Recorrente "renda dia 8" gera transação automática mensal
- AC3: Vista mensal mostra projecção 30 dias incluindo recorrentes e prestações
- AC4: Cérebro: "paguei €78,70 no supermercado com cartão Millennium" cria transação correctamente associada
- AC5: Valores em formato PT-PT (`€1.234,56`)

**Quality gates:** Epic 1 + revisão manual cálculos fatura/prestações.

---

### Epic 4 — Hábitos + Metas + Lembretes

**Goal:** CRUD com recorrência + Web Push notifications + tools cérebro.

**Stories sugeridas:**
- 4.1 Schema `habits`, `habit_logs`, `goals`, `goal_milestones`, `reminders`
- 4.2 CRUD hábitos com frequência configurável
- 4.3 Heatmap calendário (estilo GitHub) por hábito
- 4.4 Métricas opcionais por hábito (ex: km, páginas, peso)
- 4.5 CRUD metas com progress bar + milestones
- 4.6 CRUD lembretes com recorrência
- 4.7 Setup Web Push: VAPID keys, subscrição browser, endpoint `/api/push/send`
- 4.8 Cron client schedule: ao primeiro carregamento do dia, regista próximos lembretes a disparar
- 4.9 Service Worker handler de push notifications (mostra notificação + botões marcar feito/snooze)
- 4.10 Tools cérebro: `criar_habito`, `registar_habito_concluido`, `consultar_evolucao_habito`, `criar_meta`, `actualizar_meta`, `consultar_metas`, `criar_lembrete`, `listar_lembretes`, `cancelar_lembrete`

**AC Epic 4:**
- AC1: Hábito "leitura diária" registado 30 dias seguidos mostra heatmap correcto
- AC2: Lembrete às 15h dispara push notification às 15h (com tolerância 60s)
- AC3: Botão "marcar feito" no push fecha lembrete sem abrir app
- AC4: Cérebro "lembra-me sexta às 10h de pagar a luz" cria lembrete correcto

**Quality gates:** Epic 1 + teste manual push em Chrome + Edge.

---

### Epic 5 — Diário + Brain Dump + Conhecimento

**Goal:** Editor markdown + AI organiza texto livre + áreas/cadernos/notas + pesquisa web.

**Stories sugeridas:**
- 5.1 Schema `journal_entries`, `brain_dumps`, `knowledge_areas`, `knowledge_notebooks`, `knowledge_notes`
- 5.2 Editor markdown (tiptap ou lexical, decisão @architect)
- 5.3 CRUD diário + mood + heatmap mood
- 5.4 Diário AI estrutura (prompt: separar fiz/senti/aprendi quando texto > 100 chars)
- 5.5 Pesquisa full-text diário
- 5.6 Brain Dump UI: textarea grande + botão "estruturar"
- 5.7 Brain Dump AI parser → output estruturado (tarefas/projectos/ideias/decisões)
- 5.8 Brain Dump approval flow: utilizador aprova item-a-item antes de persistir
- 5.9 CRUD áreas/cadernos/notas (3 níveis)
- 5.10 Pesquisa full-text conhecimento
- 5.11 Pesquisa web via Anthropic web search ou DuckDuckGo HTML
- 5.12 Cérebro: "pesquisa Artemis 2 e cria área Espaço com caderno Artemis" — fluxo completo
- 5.13 Tools cérebro: `criar_entrada_diario`, `consultar_diario`, `pesquisar_diario`, `brain_dump`, `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota`

**AC Epic 5:**
- AC1: Diário aceita markdown com formatação preservada
- AC2: Brain dump 200 palavras gera output estruturado em < 8s
- AC3: Áreas/cadernos/notas suportam 3 níveis com pesquisa cruzada
- AC4: Pesquisa web cria nota com resumo + fonte URL

**Quality gates:** Epic 1 + escolha definitiva de markdown editor.

---

### Epic 6 — Google Calendar + Gmail + Telegram

**Goal:** Integrações externas via OAuth e bot API. Sync 2-way calendário, classificação Gmail, canal Telegram.

**Stories sugeridas:**
- 6.1 OAuth flow Google (Calendar scope) — UI definições + callback handler
- 6.2 Refresh token storage Vercel KV
- 6.3 Sync calendário pull (eventos Google → Nexus)
- 6.4 Sync calendário push (eventos Nexus → Google)
- 6.5 Cron Vercel diário para sync delta
- 6.6 Tool cérebro: `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos`
- 6.7 OAuth flow Google (Gmail scope `gmail.modify`)
- 6.8 Classifier Gmail: lê últimos 50 emails, AI classifica em 4 buckets
- 6.9 Vista Gmail no dashboard (Important + To Reply)
- 6.10 Tool cérebro: `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email`
- 6.11 Telegram bot setup: BotFather token em env, webhook `/api/telegram/webhook`
- 6.12 Webhook handler: parse mensagens texto/voz/foto e roteia
- 6.13 Texto → cérebro multi-intent
- 6.14 Voz → transcrição (Anthropic se disponível, ou Web Speech client-side se utilizador estiver na app)
- 6.15 Foto → OCR (depende Epic 7)
- 6.16 Bot envia lembretes (FR37) e briefing matinal automático (FR75)
- 6.17 Tool cérebro: `enviar_telegram`

**AC Epic 6:**
- AC1: OAuth Google completa em < 60s
- AC2: Evento criado no Nexus aparece no Google Calendar em < 30s
- AC3: Classificação Gmail tem precisão >= 80% em conjunto manual de 30 emails
- AC4: Bot Telegram responde a "olá" em < 3s
- AC5: Lembrete agendado dispara push browser E mensagem Telegram

**Quality gates:** Epic 1 + revisão segurança tokens OAuth.

---

### Epic 7 — Voice + OCR

**Goal:** Modo voz browser + OCR recibos via Claude Vision.

**Stories sugeridas:**
- 7.1 Componente VoiceMode: botão microfone, indicador visual, stream
- 7.2 Web Speech API recognition (PT-PT) → texto
- 7.3 Texto vai directo para cérebro multi-intent
- 7.4 Web Speech API synthesis (PT-PT) lê resposta do cérebro
- 7.5 Endpoint `/api/ocr/receipt` que recebe foto, chama Claude Vision com prompt PT-PT
- 7.6 Prompt OCR: extrai data, total, IVA, mercador, items (best-effort)
- 7.7 UI drag-and-drop foto no chat
- 7.8 Resultado OCR → preview + criar finança variável on confirm
- 7.9 Integração com Telegram (FR73): foto recibo via Telegram → OCR → finança auto
- 7.10 Tool cérebro: `processar_recibo`

**AC Epic 7:**
- AC1: Voice "criar tarefa comprar leite" cria tarefa correctamente em Chrome/Edge
- AC2: Foto recibo Continente extrai total + data correctos em >= 80% dos testes
- AC3: Foto via Telegram → finança criada sem intervenção UI

**Quality gates:** Epic 1 + manual testing 10 recibos reais (zero invenção).

---

### Epic 8 — Migração de Provider de Inferência (dual-provider OpenAI)

> **Epic não previsto no roadmap original**, inserido em 25/06/2026 em resposta a um gatilho de produção (saldo Anthropic esgotado — `400 credit balance too low`, cérebro em prod down). **Sem FR novo** — é uma migração de infra/arquitectura da camada de inferência, derivada do **ADR-10** (aceite em `main`, decisor Eurico — NÃO reabrir). Detalhe completo em `EPIC-8.md`.

**Goal:** Migrar a inferência de Anthropic para OpenAI sob modelo **dual-provider com feature flag** (`LLM_PROVIDER` = `anthropic` | `openai`), sem partir o caminho Anthropic nem os ~2400 testes. A OpenAI é adicionada em paralelo atrás das interfaces `ClassifierProvider`/`ExecutorProvider` existentes; a Anthropic mantém-se como fallback. Critério: correcção, não uptime (ADR-10 §1.2.3).

**Stories (6 — ADR-10 §8):**
- 8.1 Fundação: interface, flag `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER`, `OPENAI_API_KEY`, factory, `toolsToOpenAIShape`, defaults OpenAI, dep `openai` (gate `@architect`)
- 8.2 `OpenAIExecutor` (server, streaming, reagregação `tool_calls` por `index`, `toOpenAIMessages`) (gate `@architect`)
- 8.3 `OpenAIClassifier` (server, JSON nativo `response_format:json_object`) (gate `@architect`)
- 8.4 Proxy `/api/openai/proxy` (Edge) + `OpenAIInferenceTransport` + selecção client + `sse-lines.ts` (gate `@architect`, CR `--base main`)
- 8.5 MSW `handlers/openai.ts` (SSE fiel) + suite de parity cross-provider (gate `@qa` → `@architect` se autorar fixtures)
- 8.6 Cutover em produção + smoke test + runbook de rollback (gate `@qa` + manual; deploy `@devops`)

**AC Epic 8 (ADR-10):**
- AC1: Com `LLM_PROVIDER` ausente/`anthropic`, comportamento byte-a-byte o de hoje; ~2400 testes verdes por construção
- AC2: Com `LLM_PROVIDER=openai`, `LLMStreamEvent`/`ExecutorSSEEvent` idênticos aos da Anthropic nos 6 cenários de parity
- AC3: Produção responde via OpenAI após cutover; runbook de rollback testado
- AC4: `OPENAI_API_KEY` server-only (NFR5); proxy OpenAI Edge com upstream constante (sem SSRF)

**Quality gates:** Epic 1 + não-regressão Anthropic (~2400 verdes) + parity cross-provider falsificável + CR `--base main` nas stories sensíveis (8.1 secret/env, 8.4 endpoint Edge).

---

### Epic 9 — Hardening + Deploy + PWA

**Goal:** Production-ready: tests, PWA offline, deploy contínuo, backup.

**Stories sugeridas:**
- 9.1 Cobertura tests >= 60% packages core (cérebro, tarefas, finanças)
- 9.2 E2E Playwright: login → primeiro prompt → criar tarefa via UI → verificar
- 9.3 Service Worker registro + cache strategy (network-first para chat, cache-first para assets)
- 9.4 Manifest PWA + ícones todos os tamanhos
- 9.5 Modo offline degradado: banner + dashboard lê localStorage, chat mostra "sem rede"
- 9.6 Backup: botão export ZIP em definições (JSON + markdown notas)
- 9.7 Restore: botão import ZIP em definições
- 9.8 GitHub Actions CI: lint + typecheck + test bloqueante em PRs
- 9.9 CodeRabbit setup + review obrigatório
- 9.10 Vercel preview deploys + production deploy automatizado em main

**AC Epic 9:**
- AC1: Tests passam em CI < 5 min
- AC2: Lighthouse score >= 85 mobile, 90 desktop
- AC3: PWA instalável (Add to Home Screen funciona Chrome/Edge)
- AC4: Backup export devolve ZIP com todos os dados
- AC5: Restore importa ZIP e reconstrói estado

**Quality gates:** todos os anteriores + CodeRabbit zero CRITICAL.

---

## 11. Riscos Top 5

| # | Risco | Severidade | Mitigação |
|---|-------|-----------|-----------|
| 1 | Web Speech API recognition em PT-PT é imprecisa em Chrome | Média | Fallback: utilizador escreve em vez de falar; reavaliar Whisper backend só se for crítico |
| 2 | Custo tokens Anthropic dispara com voice + multi-intent + classificações Gmail | Alta | Cache agressiva resultados classifier; limitar Gmail classifier a emails novos não classificados; rate limit por dia |
| 3 | localStorage > 5MB força migração IndexedDB | Baixa | Estimativa: 6 meses de uso intensivo ~3MB. Fallback Dexie em Epic 9 (Hardening) se necessário |
| 4 | OAuth Google requer aprovação verification se >100 utilizadores; <100 funciona em test mode | Baixa | Single-user — sempre < 100, fica sempre em test mode. Documentar |
| 5 | Telegram Bot perde mensagens se webhook Vercel cair | Baixa | Telegram retry built-in 24h; logs Vercel suficientes para debug |

---

## 12. Next Steps

### 12.1 Ordem de handoff

1. **@po** valida este PRD (10-point checklist) — PRD-NEXUS-V2.md
2. **@architect** produz `docs/architecture-v2.md` cobrindo: schema localStorage v2, edge vs node runtime, markdown editor final, Vercel KV layout, tool registry pattern, migration strategy v1→v2
3. **@ux-design-expert** produz `docs/front-end-spec-v2.md` com wireframes chat-first, sidebar widgets, modais hábitos/finanças/conhecimento — respeitando design system [IA]AVANÇADA PT (`#04040A`, glassmorphism, Inter + JetBrains Mono)
4. **@sm** parte Epic 0 em stories (story 0.1, 0.2, ... 0.10)
5. **@po** valida primeira story (0.1)
6. **@dev** implementa Epic 0 sequencialmente
7. **@qa** quality gate Epic 0 antes de Epic 1
8. **@devops** deploy Vercel + setup CI

### 12.2 Validação imediata pedida ao Eurico

Antes de @po validar o PRD, confirma:
- (a) Esta lista de 96 FRs é o âmbito correcto — adicionar/remover algum?
- (b) A ordem dos epics 0→1→2→3→4→5→6→7→8 está OK ou queres reordenar?
- (c) Aprovas escrita paralela de architecture (Aria) e front-end-spec (Uma) por enquanto, deixando @sm para depois?

### 12.3 Localização ficheiros

| Ficheiro | Path |
|---------|------|
| Este PRD | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` |
| Architecture (a criar) | `imersao-tools/nexus/docs/architecture-v2.md` |
| Front-end Spec (a criar) | `imersao-tools/nexus/docs/front-end-spec-v2.md` |
| Stories | `imersao-tools/nexus/docs/stories/{N.M}.story.md` |
| Handoffs | `imersao-tools/nexus/docs/handoffs/RETOMA-*.md` (regra `handoff-location.md`) |

---

*PRD preparado por Orion (aiox-master) em 04/05/2026. Pronto para validação @po.*
