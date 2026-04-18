# FitCoach Landing — Oferta Telmo Cerveira

Landing page persuasiva standalone (HTML estático + Tailwind CDN) para o Telmo Cerveira
promover o **FitCoach AI** em tráfego frio (Instagram, TikTok, WhatsApp).

**Estrutura:** funil AIDA com 10 secções · Design system IA AVANÇADA PT (dark + cyan + glassmorphism).

---

## Estrutura AIDA

| # | Secção | Função | Arquétipo |
|---|--------|--------|-----------|
| 1 | Hero | Hook + CTA primário | **Attention** |
| 2 | Problema (3 dores) | Agitação | **Interest** |
| 3 | Solução em 3 passos | Visão concreta | **Interest** → Desire |
| 4 | Demo video (placeholder) | Prova visual | **Desire** |
| 5 | Testemunho Telmo + 3 mini | Prova social | **Desire** |
| 6 | Tabela comparativa (540€ vs 80€ vs 7,99€) | Ancoragem de valor | **Desire** |
| 7 | Preço + Oferta Telmo (4,99€ vitalício) | Oferta | **Action** |
| 8 | FAQ (8 objecções tratadas) | Remove fricção | Action |
| 9 | Garantia (3 pilares) | Reduz risco | Action |
| 10 | CTA final | Última hipótese | **Action** |

---

## Oferta configurada (4,99€ vitalício)

| Item | Valor normal | Oferta Telmo |
|------|-------------|--------------|
| Trial | 7 dias | **30 dias** |
| Preço Pro | 7,99€/mês | **4,99€/mês vitalício** |
| Limite | — | **Primeiros 100 utilizadores** |
| Tracking | — | `?ref=telmo` em todos os CTAs |

Todos os CTAs apontam para `https://fitcoach-ai-lake.vercel.app/login?ref=telmo`.

---

## O que falta preencher (placeholders obrigatórios antes de tráfego pago)

| # | Elemento | Onde |
|---|----------|------|
| 1 | Foto real do Telmo | Secção 5 — substituir `<div>` com iniciais "TC" por `<img src="..." />` |
| 2 | Video demo (Loom ou YouTube) | Secção 4 — substituir placeholder por `<iframe>` |
| 3 | Testemunho real do Telmo (aprovado por ele) | Secção 5 — blockquote principal |
| 4 | 3 testemunhos de clientes reais | Secção 5 — cards "Marco / Rita / João" (fictícios) |
| 5 | OG image (`og-telmo.png`, 1200x630) | Meta tags `<head>` |
| 6 | Links legais (Termos, Privacidade) | Footer |
| 7 | **Stripe:** criar código promocional `TELMO` com desconto recorrente (4,99€) | Painel Stripe |
| 8 | **Supabase:** tracking do `?ref=telmo` no signup para contagem dos 100 | SQL + trigger |

---

## Deploy em 2 minutos

### Opção A — Vercel (recomendado)

```bash
cd membros/telmo/04-landing-fitcoach
npx vercel --prod
```

Primeira vez, pede para criar projecto. Escolhe:
- Framework: **Other**
- Build command: (vazio)
- Output directory: `.`

### Opção B — GitHub Pages / Netlify

Upload da pasta ou push para repo novo → apontar para `index.html`.

### Opção C — Subdomínio do FitCoach AI

Se quiseres usar `telmo.fitcoach-ai-lake.vercel.app` ou `/telmo`, o `@devops` pode configurar
no projecto Vercel existente.

---

## Edição de copy

Tudo está em `index.html` (single-file). Cada secção está marcada com um comentário grande:

```html
<!-- ═══════════════════════════════════════════
     1. HERO — ATTENTION
     ═══════════════════════════════════════════ -->
```

Podes editar texto directamente sem rebuild. Guardar = deploy imediato (se em Vercel).

---

## Design system (IA AVANÇADA PT)

- **Fundo:** `#04040A` (dark inegociável)
- **Cyan (acção):** `#00F5FF` — CTAs, links, destaques
- **Gold (oferta):** `#FFB800` — oferta Telmo, ratings
- **Purple (IA):** `#9D00FF` — gradientes tech
- **Lime (sucesso):** `#39FF14` — checkmarks, "grátis"
- **Magenta (alerta):** `#FF006E` — dores, "pára de pagar"
- **Fontes:** Inter (body) + JetBrains Mono (badges/labels)

---

## Métricas a medir depois do deploy

| Métrica | Tool |
|---------|------|
| Conversão landing → signup | Google Analytics / Plausible |
| Cliques em CTA "Activar oferta Telmo" | GTM event |
| Scroll depth (onde abandonam) | Hotjar / Microsoft Clarity |
| % trial → Pro após 30 dias | Stripe + Supabase |

---

**Próximo passo:** substituir placeholders (foto Telmo + video + testemunhos reais) antes de começar tráfego pago.
