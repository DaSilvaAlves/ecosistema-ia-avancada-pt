# HANDOFF — Comunidade [IA]AVANÇADA PT
**Data:** 2026-03-10
**Para continuar:** "Lê o HANDOFF-COMUNIDADE e continua o projecto"

---

## Estado Actual: MVP ONLINE ✅

A comunidade está em produção e funcional.

---

## URLs e Acessos

| Serviço | URL / Valor |
|---------|-------------|
| **Comunidade (produção)** | https://comunidade-ia-avancada-pt.vercel.app *(verificar URL final)* |
| **Vercel projecto** | comunidade (dashboard Vercel) |
| **Supabase projecto** | imersao-ia-profiler |
| **Supabase URL** | https://hpqowjelvtejbutyvojo.supabase.co |
| **Supabase Anon Key** | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcW93amVsdnRlamJ1dHl2b2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzcyNjEsImV4cCI6MjA4NzU1MzI2MX0.045EKU7I7A6Reap0qiVcNXbXuvElmOnjO7lLMwnwluw |
| **WhatsApp Eurico** | +351 932 066 328 |
| **Email** | euricojsalves@gmail.com |

---

## Ficheiros do Projecto

**Localização:** `C:\Users\XPS\Documents\imersao-tools\comunidade\`

```
comunidade/
├── index.html              ← Login + registo (Supabase Auth)
├── dashboard.html          ← Área de membros principal
├── curso-aiox.html         ← Curso AIOX Básico (3 lições)
├── curso-geniailidade.html ← Zona Gen[IA]lidade (3 lições + quiz)
├── config.js               ← Credenciais Supabase (já configuradas)
└── supabase-setup.sql      ← SQL já executado (não correr de novo)
```

---

## Arquitectura Técnica

**Stack:** Vanilla JS + HTML + Supabase CDN + Vercel (zero build step, zero frameworks)

**Supabase:**
- Tabela `profiles`: id, email, nome, tier (free/premium), stripe_id, created_at
- Trigger automático: cria perfil com `tier='free'` em cada novo registo
- RLS activado: utilizador só vê o seu próprio perfil

**Tiers:**
- `free` → acesso a: Zona Gen[IA]lidade, Apresente-se, News
- `premium` → acesso a: tudo (AIOX Básico, Claude Code, Biblioteca de Prompts)

**Para dar premium manualmente (Supabase → SQL Editor):**
```sql
UPDATE public.profiles SET tier = 'premium' WHERE email = 'email@pessoa.com';
```

---

## Conteúdo Existente

### Cursos publicados:
1. **Zona Gen[IA]lidade** (FREE)
   - Lição 1: Os 4 Níveis de Uso da IA
   - Lição 2: As 8 Ferramentas em 8 Minutos
   - Lição 3: Quiz interactivo — Em que Nível estás?

2. **AIOX Básico** (PREMIUM)
   - Lição 1: O que é o AIOX e porque existe
   - Lição 2: Instalação passo a passo
   - Lição 3: O teu primeiro agente — @dev em acção

### Cursos a criar (marcados como "em breve"):
- Claude Code Essencial → ficheiro: `curso-claude.html`
- Biblioteca de Prompts → ficheiro: `biblioteca.html`

---

## O que Falta Fazer (por prioridade)

### URGENTE — Esta semana
- [ ] Confirmar URL final do Vercel e actualizar Supabase Redirect URL
- [ ] Enviar link às ~20 pessoas da lista de espera
- [ ] Dar `tier='premium'` manualmente a quem pagar (via Supabase SQL)
- [ ] Criar `curso-claude.html` (Claude Code Essencial — 4 lições)

### IMPORTANTE — Semana 2
- [ ] Integrar Stripe para pagamentos automáticos
  - Produto: Premium Mensal (28€)
  - Produto: Premium Anual (188€)
  - Webhook: actualiza `tier` no Supabase quando pagamento confirmado
- [ ] Página de upgrade real (substituir o `alert()` do botão "Tornar-me Premium")
- [ ] Ligar MailerLite: quando alguém se regista → entra na lista automaticamente

### FUTURO — Mês 2
- [ ] `biblioteca.html` — Biblioteca de Prompts (50+ prompts)
- [ ] Feed/comunidade simples (posts partilhados entre membros)
- [ ] Domínio próprio: comunidade.iaavancada.pt
- [ ] Dashboard de admin para Eurico (ver membros, tiers, stats)

---

## Contexto do Produto

**O que é:** Comunidade premium de IA no Nível 4, em português (PT-PT)
**Criador:** Eurico Alves — Orquestrador de IA & Interfaces Humanizadas
**Diferenciador:** Acesso exclusivo ao framework AIOX + ensino de orquestração de agentes

**Funil completo:**
```
Lead Magnet PDF (gratuito)
    ↓
Lista de espera (comunidade-ia-pt.vercel.app)
    ↓
Comunidade [IA]AVANÇADA PT ← ESTAMOS AQUI
    ↓
Imersão IA Avançada (888€)
    ↓
Mentoria Individual (1.888€+)
```

**Modelo de preços (terminam sempre em 8):**
- Free: 0€
- Premium Mensal: 28€/mês
- Premium Anual: 188€/ano
- Imersão: 888€ (produto separado)
- Mentoria: sob consulta (1.888-2.888€)

---

## Documentos de Referência

| Documento | Localização |
|-----------|-------------|
| PRD completo | `C:\Users\XPS\Documents\imersao-tools\PRD-COMUNIDADE-IA-AVANCADA-PT.md` |
| Estrutura Circle.so (referência) | `C:\Users\XPS\Documents\imersao-tools\CIRCLE-ESTRUTURA.md` |
| Projecto Imersão (contexto) | `C:\Users\XPS\Documents\imersao-tools\HANDOFF_08032026.md` |
| Landing page Imersão | `C:\Users\XPS\Documents\imersao-tools\landing-page\index.html` |

---

## Design System

```css
--bg: #04040A          /* fundo escuro */
--cyan: #00F5FF        /* cor primária */
--magenta: #FF006E     /* cor secundária */
--gold: #FFB800        /* destaque */
--purple: #9D00FF      /* gradiente */
--white: #F0F4FF       /* texto */
--grey: #8892A4        /* texto secundário */
```
**Fontes:** Inter (corpo) + JetBrains Mono (código/labels)
**Estilo:** Dark quantum, glassmorphism, partículas animadas no fundo

---

## Notas Importantes

1. **n8n não é ensinado directamente** — o ensino é "como criar uma squad AIOX que gera workflows n8n por ti"
2. **AIOX** = framework proprietário do Eurico, exclusivo para membros premium, funciona com Claude Code 100%
3. **"Feito é melhor que perfeito"** — filosofia do projecto, não over-engineer
4. **Nunca mencionar:** Lovable, AI Studio, dependências Claude PRO para o utilizador final
5. **Preços terminam sempre em 8**
6. **Língua:** PT-PT Portugal (nunca PT-BR nas comunicações)

---

## Próxima Sessão — Começar por:

```
1. Verificar que o URL do Vercel está correcto
2. Criar curso-claude.html (Claude Code Essencial)
3. Implementar Stripe (pagamentos automáticos)
```

*HANDOFF gerado em 2026-03-10*
