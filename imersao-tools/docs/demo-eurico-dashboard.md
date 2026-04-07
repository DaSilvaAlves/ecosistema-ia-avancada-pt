# Demo Eurico — Dashboard Pessoal | Fase 3

> Projecto demo para a imersao 11-12 Abril 2026
> O Eurico usa este material para demonstrar o metodo ORIGINAI ao vivo

---

## 1. BRIEF (Expressao → Brief — 5 min)

### Expressao bruta (M1)

"Todos os dias acordo e tenho de abrir 6 tabs: Gmail, Feedly, GitHub, Vercel, Supabase, Analytics. Perco 15 minutos so a ver o que aconteceu. Quero uma pagina unica onde vejo tudo de uma vez — noticias de IA, estado dos meus deploys, emails importantes, e as minhas tarefas do dia. Nao precisa de ser bonito — precisa de ser util."

### QA 1 — Pontos cegos

| # | Ponto cego | Resposta |
|---|-----------|----------|
| 1 | Quais feeds de noticias concretos? | Hacker News, TechCrunch AI, The Verge AI |
| 2 | "Emails importantes" — como filtrar? | Apenas emails nao lidos com label "Priority" |
| 3 | "Estado dos deploys" — quantos projectos? | 3 projectos Vercel activos |
| 4 | Onde ficam as tarefas? | Lista simples com checkbox — localStorage |
| 5 | Precisa de autenticacao? | Nao — e pessoal, corre local ou deployed sem login |

### Brief aprovado

**O que quero construir:** Um dashboard pessoal que agrega num so ecra os feeds de noticias de IA, tarefas do dia, e links rapidos para os meus projectos.

**Que problema resolve:** Eliminar os 15 minutos diarios a abrir tabs e perder contexto. Ter tudo visivel num relance.

**Referencias:** Homecreen.me, Start.me, Momentum (extensao Chrome).

**O que NAO e:** Nao e um CRM. Nao tem login. Nao tem base de dados. Nao tem API propria.

**Checklist QA 2:** APROVADO — pronto para detalhar.

---

## 2. PRD TECNICO (Detalhamento → PRD — 5 min)

### Stack

| Tecnologia | Razao |
|------------|-------|
| React 19 + Vite | Rapido de construir, facil de deploy |
| Tailwind CSS | Styling rapido, dark mode nativo |
| localStorage | Persistencia de tarefas sem backend |
| RSS proxy (allorigins) | Contornar CORS nos feeds |
| Vercel | Deploy gratuito em 1 minuto |

### Features (4 blocos)

#### Bloco 1 — Header
- Saudacao com hora do dia ("Bom dia, Eurico")
- Data actual
- Citacao motivacional aleatoria

#### Bloco 2 — Tarefas do dia
- Input para adicionar tarefa
- Lista com checkbox (marcar como feito)
- Persistencia em localStorage
- Contador "X de Y completas"

#### Bloco 3 — Feed de noticias
- 3 feeds RSS (Hacker News, TechCrunch AI, The Verge)
- Titulo + link + data
- Maximo 5 noticias por feed
- Auto-refresh a cada 30 min

#### Bloco 4 — Links rapidos
- Grid de 6 botoes com icone
- Links: GitHub, Vercel, Supabase, Gmail, Claude, Comunidade
- Hover com glow

### Layout

```
┌─────────────────────────────────────┐
│         Bom dia, Eurico             │
│      Segunda, 11 Abril 2026        │
├──────────────┬──────────────────────┤
│  TAREFAS     │  FEED NOTICIAS      │
│  □ Tarefa 1  │  ▸ Titulo noticia 1 │
│  ☑ Tarefa 2  │  ▸ Titulo noticia 2 │
│  □ Tarefa 3  │  ▸ Titulo noticia 3 │
│  [+ Nova]    │                     │
├──────────────┴──────────────────────┤
│  LINKS RAPIDOS                     │
│  [GitHub] [Vercel] [Supabase]      │
│  [Gmail]  [Claude] [Comunidade]    │
└─────────────────────────────────────┘
```

### Design

- Fundo escuro (#0a0a0f)
- Cards com glassmorphism
- Accent: cyan (#00F5FF)
- Fonte: Inter
- Responsivo (mobile: blocos empilhados)

### Criterio de sucesso

- [ ] Pagina carrega em <2s
- [ ] Tarefas persistem ao recarregar
- [ ] Feeds mostram noticias reais
- [ ] Links rapidos abrem em nova tab
- [ ] Deployed no Vercel com URL publica
- [ ] Funciona em mobile

---

## 3. PROMPT DE CONSTRUCAO (copiar e colar)

### Prompt para Claude Code / Gemini CLI

```
Cria um dashboard pessoal em React 19 + Vite + Tailwind CSS.

DESIGN:
- Fundo escuro (#0a0a0f)
- Cards com glassmorphism (rgba(255,255,255,0.03) + border rgba(255,255,255,0.08))
- Cor de destaque: cyan (#00F5FF)
- Fonte: Inter (importar do Google Fonts)
- Responsivo: 2 colunas em desktop, 1 coluna em mobile

4 BLOCOS:

1. HEADER — Saudacao com hora ("Bom dia/Boa tarde/Boa noite, Eurico") + data actual + citacao motivacional aleatoria de uma lista de 10

2. TAREFAS DO DIA — Input para adicionar tarefa + lista com checkbox + persistencia em localStorage + contador "X de Y completas" + botao de limpar completas

3. FEED DE NOTICIAS — Buscar RSS de 3 fontes via https://api.allorigins.win/get?url=FEED_URL:
   - Hacker News: https://hnrss.org/frontpage?count=5
   - TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
   - The Verge AI: https://www.theverge.com/rss/ai-artificial-intelligence/index.xml
   Mostrar titulo + link + tempo relativo. Maximo 5 por feed. Parser DOMParser no browser.

4. LINKS RAPIDOS — Grid de 6 botoes com hover glow:
   - GitHub (github.com)
   - Vercel (vercel.com)
   - Supabase (supabase.com)
   - Gmail (mail.google.com)
   - Claude (claude.ai)
   - Comunidade (comunidade.avancada.expressia.pt)

REGRAS:
- Zero backend — tudo no browser
- localStorage para tarefas
- allorigins.win como proxy RSS (sem CORS issues)
- Sem login, sem autenticacao
- package.json, vite.config.ts, index.html ja existem — nao sobrescrever
- Tudo dentro de src/ — componentes separados por bloco
```

### Prompt simplificado (se o tempo apertar)

```
Dashboard pessoal em React + Vite + Tailwind. Fundo escuro, glassmorphism, cyan como accent.
4 blocos: saudacao com hora, tarefas com localStorage, feed RSS via allorigins proxy (Hacker News + TechCrunch + The Verge), e grid de 6 links rapidos.
Zero backend. Responsivo. Pronto para deploy no Vercel.
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
- [ ] Testar em mobile
- [ ] Screenshot do resultado para fallback

---

## 5. ROTEIRO DO DEMO (20 min)

| Min | Accao | O que dizer |
|-----|-------|-------------|
| 0-2 | Mostrar a dor | "Todos os dias abro 6 tabs. 15 minutos perdidos. Isto e a MINHA dor." |
| 2-5 | Escrever Brief | "Sem IA. Papel e caneta. Esgoto o cerebro." (mostrar template) |
| 5-7 | QA 1 com IA | Colar rascunho no Claude. "A IA nao inventa — encontra os meus pontos cegos." |
| 7-10 | Detalhar | Mostrar os 4 blocos. "Agora sei EXACTAMENTE o que quero." |
| 10-12 | Criar PRD | "Isto e o que a IA precisa. Clareza antes de execucao." |
| 12-17 | Construir | Colar prompt no Claude Code. Ver o codigo a aparecer. |
| 17-19 | Deploy | `git push` + Vercel auto-deploy |
| 19-20 | Resultado | Abrir URL. "Ha 20 minutos nao tinha nada. Agora tenho isto." |

---

*Demo preparado por Uma (UX) — 07/04/2026*
*Metodo ORIGINAI — [IA]AVANCADA PT*
