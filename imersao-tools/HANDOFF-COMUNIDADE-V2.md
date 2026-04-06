# HANDOFF — Comunidade [IA]AVANÇADA PT · Dashboard v2
**Data:** 2026-03-11
**Para continuar:** `Lê C:/Users/XPS/Documents/imersao-tools/HANDOFF-COMUNIDADE-V2.md e continua o projecto`
**Arranque rápido:** `/aios-god-mode` → depois `@dev`

---

## ESTADO ACTUAL ✅

### O que foi feito HOJE (11/03/2026)

| Ficheiro | Estado | Commit |
|---------|--------|--------|
| `comunidade/dashboard.html` | ✅ Redesign completo — v2 | `5afe6f9` |
| `HANDOFF-COMUNIDADE.md` | ✅ Criado | — |

### Dashboard v2 — o que existe
- **Layout:** sidebar esquerda + top nav + sidebar direita (estilo Circle.so)
- **8 vistas:** Feed, Apresente-se, News IA, Desafio AIOX, Perguntas, Cursos, Ferramentas, Agenda
- **Hero banner canvas:** matrix rain cyan/magenta + 8 agentes IA (@dev @qa @architect @pm @analyst @data-eng @devops @ux) com conexões e data packets animados
- **Frequências subliminar no hero:** 741 (cyan·fixo), 520 (magenta·fixo), ∞ (dourado·orbital no topo) — NÃO MEXER
- **Ferramentas pipeline:** 6 ferramentas com status online/local
- **Auth:** Supabase (config.js já configurado)
- **Design:** quantum dark (--cyan #00F5FF / --magenta #FF006E / --gold #FFB800 / --purple #9D00FF)

---

## FICHEIROS DO PROJECTO

```
C:/Users/XPS/Documents/imersao-tools/comunidade/
├── index.html              ← Login + registo (Supabase Auth) ✅ OK
├── dashboard.html          ← Área de membros v2 ✅ REDESENHADO HOJE
├── curso-aiox.html         ← AIOX Básico (3 lições) ✅ OK
├── curso-geniailidade.html ← Gen[IA]lidade (3 lições + quiz) ✅ OK
├── config.js               ← Credenciais Supabase ✅ OK
├── supabase-setup.sql      ← Já executado — NÃO CORRER DE NOVO
├── curso-claude.html       ← ❌ A CRIAR (próxima tarefa)
└── biblioteca.html         ← ❌ A CRIAR (futuro)
```

---

## CREDENCIAIS E ACESSOS

| Serviço | Valor |
|---------|-------|
| Supabase URL | `https://hpqowjelvtejbutyvojo.supabase.co` |
| Supabase Anon | `eyJhbGci...` (em config.js) |
| Vercel projecto | `comunidade` (conta euricojsalves-4744) |
| URL produção | https://comunidade-ia-pt.vercel.app |
| Dar premium manual | `UPDATE public.profiles SET tier = 'premium' WHERE email = 'x@x.com';` |
| WhatsApp Eurico | +351 932 066 328 |

---

## PRÓXIMAS TAREFAS (por prioridade)

### 🔴 P0 — Imediato

#### TAREFA 1: `curso-claude.html` — Claude Code Essencial
**Agente:** `@dev`
**Ficheiro a criar:** `C:/Users/XPS/Documents/imersao-tools/comunidade/curso-claude.html`

**Estrutura (4 lições):**
```
Lição 1: O que é o Claude Code e porque muda tudo
Lição 2: Instalação e configuração (Windows + WSL)
Lição 3: Comandos essenciais — do /help ao @dev
Lição 4: O teu primeiro projecto com agentes
```
**Referência de design:** copiar estrutura de `curso-aiox.html` (mesma estética quantum dark)
**Tier:** PREMIUM (verificar `isPremium()` no topo, redirecionar se free)

#### TAREFA 2: Página de Upgrade — substituir `alert()`
**Agente:** `@dev`
**Ficheiro:** `dashboard.html`
**O que fazer:** substituir `goUpgrade()` que faz `alert()` por uma modal real ou página dedicada `upgrade.html`
**Conteúdo:** planos 28€/mês e 188€/ano, botão que abre WhatsApp ou Stripe (quando disponível)

---

### 🟡 P1 — Esta semana

#### TAREFA 3: Stripe — Pagamentos automáticos
**Agente:** `@dev` para integração, `@devops` para webhook
**O que fazer:**
- Produto 1: Premium Mensal — 28€/mês
- Produto 2: Premium Anual — 188€/ano (termina em 8!)
- Webhook Stripe → actualiza `tier = 'premium'` no Supabase
- Página de checkout: `upgrade.html`
**Referência:** `/stripe-integration` skill disponível

#### TAREFA 4: Deploy para Vercel
**Agente:** `@devops`
**Comando:**
```bash
cd C:/Users/XPS/Documents/imersao-tools/comunidade
vercel --prod
```
**Verificar antes:** URL do Vercel → actualizar Supabase Auth Redirect URLs

#### TAREFA 5: MailerLite — Registo automático
**Agente:** `@dev`
**Ficheiro:** `index.html` (função `doRegister()`)
**O que fazer:** após registo com sucesso, chamar MailerLite API para adicionar email à lista

---

### 🟢 P2 — Médio prazo

| Tarefa | Detalhe |
|--------|---------|
| `biblioteca.html` | 50+ prompts organizados por categoria |
| Feed real (Supabase) | Substituir posts hardcoded por tabela `community_posts` |
| Domínio próprio | `comunidade.iaavancada.pt` |
| Dashboard admin | Ver membros, tiers, stats (para Eurico) |

---

## ARQUITECTURA TÉCNICA

```
Stack: Vanilla JS + HTML + Supabase CDN + Vercel (zero build step)

Supabase:
  tabela profiles: id, email, nome, tier (free/premium), stripe_id, created_at
  trigger: cria perfil tier='free' em cada novo registo
  RLS: utilizador só vê o próprio perfil

Auth flow:
  index.html → login/registo Supabase
  dashboard.html → requireAuth() → getProfile() → renderiza por tier
```

---

## DESIGN SYSTEM (NÃO ALTERAR)

```css
--bg: #04040A          /* fundo escuro */
--cyan: #00F5FF        /* cor primária */
--magenta: #FF006E     /* cor secundária */
--gold: #FFB800        /* destaque */
--purple: #9D00FF      /* gradiente */
--white: #F0F4FF       /* texto */
--grey: #8892A4        /* texto secundário */
Fontes: Inter (corpo) + JetBrains Mono (código/labels)
Estilo: Dark quantum, glassmorphism, partículas animadas
```

**Hero banner canvas — NÃO MEXER:**
- Frequências 741 (cyan), 520 (magenta), ∞ (dourado orbital no topo) — subliminar intencional
- Agentes + matrix rain + data packets — cena completa e aprovada pelo Eurico
- Commit: `5afe6f9`

---

## REGRAS DO EURICO (SEMPRE SEGUIR)

- Língua: **PT-PT Portugal** (nunca PT-BR, nunca inglês na UI)
- Preços: **terminam sempre em 8** (28€, 188€, 888€)
- Design: dark quantum — nunca light mode, nunca cores claras
- Nunca mencionar: Lovable, AI Studio
- Commits/deploys: confirmar antes
- Filosofia: "Mais vale feito que perfeito"

---

## OUTROS PROJECTOS ACTIVOS (contexto)

Ver `MASTER.md` para o mapa completo de 5 repos.

| Projecto | Path | Estado |
|---------|------|--------|
| Comunidade (este) | `imersao-tools/comunidade/` | ✅ v2 online |
| Landing page | `imersao-tools/landing-page/` | ✅ Online Vercel |
| Student Profiler | `imersao-tools/student-profiler/` | ✅ Online Vercel |
| Starter Builder | `imersao-tools/starter-builder/` | ✅ Local 5192 |
| AIOS Compiler | `imersao-build/packages/aios-compiler/` | ✅ Local 5194 |
| Prompt Optimizer | `imersao-build/packages/prompt-optimizer/` | ✅ Local 5193 |

---

## COMO ARRANCAR A PRÓXIMA SESSÃO

```
1. Abre o Claude Code
2. Escreve: /aios-god-mode
3. Depois: @dev
4. Diz: "Lê o HANDOFF-COMUNIDADE-V2 e cria o curso-claude.html"
```

Ou para deploy imediato:
```
1. /aios-god-mode
2. @devops
3. "Lê o HANDOFF-COMUNIDADE-V2 e faz deploy da comunidade para Vercel"
```

---

*Gerado em 2026-03-11 · AIOX God Mode v3.0*
*Commit actual: 5afe6f9 · Branch: master*
