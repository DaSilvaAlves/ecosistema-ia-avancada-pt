# RETOMA — Landing v2 do José Moreira (melhorias sobre v1 em produção)

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.**
> **ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR A REGRA.**
> **HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.**
> **ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/` — correcto segundo `workspace-governance.md` (handoffs de membro ficam com o membro).**

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Data de criação** | 21/04/2026 |
| **From agent** | `@ux-design-expert` (Uma) |
| **To agent** | `@ux-design-expert` ou `@dev` (depende do que o Eurico definir primeiro) |
| **Membro** | José Moreira (Viana do Castelo) |
| **Ponto do pipeline** | `04-landing/` — v1 em produção, v2 a planear |
| **Terminal** | Sessão anterior muito baixa em contexto — razão desta migração |
| **Estado geral** | Landing v1 online e funcional. Pesquisa de mercado também online. Sem bloqueadores técnicos — falta decisão do Eurico sobre *o que* melhorar. |

---

## Contexto absoluto antes de tocar em seja o que for

**O Moreira é um membro REAL da comunidade [IA]AVANÇADA PT.** Tudo o que aqui está construído é entregue a ele. Não é exercício, não é protótipo.

**Descrição canónica do Moreira (única frase que ele próprio escreveu sobre o projecto):**
> *"Desenvolvo chatbots Botpress PT/EN para PMEs."*

**O que é a landing:** porta de entrada dele para vender o serviço a PMEs industriais do concelho de Viana do Castelo. A v1 em produção foi construída com decisões fortes já tomadas (stack, tom, visual, conteúdo).

**Regra crítica de memória (Eurico):**
- ✓ Nunca projectar modelo de negócio que o Moreira não pediu
- ✓ Nunca inventar métricas, arquitecturas, clientes
- ✓ Respeitar o tom PT-PT conservador e de respeito ("o senhor") já estabelecido na v1

---

## Estado actual — tudo o que está online neste momento

### Landing v1 (em produção)

| Campo | Valor |
|-------|-------|
| **URL pública** | https://04-landing-wine.vercel.app |
| **Projecto Vercel** | `04-landing` (ID `prj_LbqJb16UO4NpMB1zPuqmZjG1PS0r`, org `team_Z7HN1UF28iHpUxCnZ4gT7wMF`) |
| **Vercel inspector** | https://vercel.com/euricojsalves-4744s-projects/04-landing |
| **Ficheiro fonte** | `membros/jose-moreira/04-landing/index.html` (1627 linhas, standalone) |
| **Commit de deploy** | `b5e8279` em `main` |
| **Último deploy** | 20/04/2026 via @devops |

### Pesquisa de mercado (também online, contexto para a landing)

| Campo | Valor |
|-------|-------|
| **URL** | https://01-pesquisa-moreira.vercel.app (noindex) |
| **Conteúdo** | Mapa de 90–120 PMEs industriais do concelho de Viana, target list rankeado pelo Atlas |
| **Utilidade para v2** | Fonte viva para decidir *quem é o público-alvo exacto* da landing v2 — pode influenciar copy, sector-default, exemplos |

---

## Stack técnica da landing v1 (NÃO MUDAR SEM RAZÃO)

| Camada | Escolha | Porquê | Status |
|--------|---------|--------|--------|
| **HTML** | Standalone single-file | Deploy directo Vercel, zero build | ✓ manter |
| **Reactividade** | Alpine.js 3.13.5 via CDN | 10KB gzip, suficiente para a calculadora + selector de sector | ✓ manter |
| **Tipografia** | Inter (UI) + Fraunces (serif editorial) via Google Fonts | Combinação editorial sóbria, não é a paleta da comunidade | ✓ manter |
| **Bot demo** | iframe Botpress v3.6 | Mostra o produto a funcionar | ✓ manter (configUrl único partilhado) |
| **Forms** | HTML nativo + Alpine `@submit.prevent` | — | ⚠️ formulário **não ligado** a backend |
| **Deploy** | Vercel, `vercel --prod` directo na pasta | — | ✓ manter |

---

## Design system da landing v1 — decisão deliberada

**CRÍTICO:** O comentário literal no ficheiro (linha 46 de `index.html`) diz:

```css
/* DESIGN TOKENS — premium sóbrio, zero relação com design system da comunidade.
   Esta é a marca do José Moreira, não do [IA]AVANÇADA PT. */
```

**⚠️ A regra global `design-system-ia-avancada.md` NÃO se aplica a esta landing.** Aplica-se apenas a `imersao-tools/comunidade/*.html`. A landing do Moreira é marca própria dele.

### Paleta oficial da landing v1

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#0a0a0a` | Fundo primário (preto quente, não o `#04040A` da comunidade) |
| `--bg-elevated` | `#141414` | Cards elevados |
| `--bg-raised` | `#1c1c1c` | Cards em hover / activo |
| `--text` | `#f5f0e8` | Texto principal (creme, não branco puro) |
| `--text-muted` | `#8a8a8a` | Texto secundário |
| `--text-dim` | `#5a5a5a` | Placeholders, labels |
| `--accent` | `#c9a66b` | Dourado caqui (único destaque de marca) |
| `--accent-strong` | `#d9b87f` | Hover do dourado |
| `--warning` | `#c44d36` | Terra cotta para alertas/urgência |

**Zero cyan, zero magenta, zero lime.** A marca Moreira é deliberadamente mais sóbria, editorial e conservadora — adequada a empresários industriais de Viana.

---

## Estrutura actual da v1 (9 secções)

| # | Secção | Linha (aprox.) | O que faz |
|---|--------|---------------|-----------|
| 1 | Hero | 1058–1075 | Hora viva + headline dinâmica (muda com sector) |
| 2 | Selector sector | 1080–1117 | Indústria / Comércio / Serviços — condiciona copy seguinte |
| 3 | Calculadora sangria | 1122–1200 | Clientes perdidos/semana × ticket médio × 52 = €/ano |
| 4 | Bot demo | 1205–1231 | iframe Botpress funcional |
| 5 | Quem é Moreira | 1236–1282 | Bio + LinkedIn + foto placeholder |
| 6 | Entrega 3 passos | 1287–1327 | Escuta → Construção → Afinação |
| 7 | FAQ | 1332–1400 | 7 perguntas reais |
| 8 | CTA final | 1405–1478 | WhatsApp (funcional) + formulário (não ligado) |
| 9 | Footer | 1483–1496 | Viana + LinkedIn + `#privacidade` (âncora quebrada) |

---

## Pendências / dívidas identificadas na v1 — candidatos óbvios para v2

Estas são **observações factuais** do código actual, **não são decisões de scope**. O Eurico é quem decide o que entra na v2.

### ALTO impacto (visíveis no ecrã do Moreira/clientes dele)

| # | Pendência | Evidência no código | Onde |
|---|-----------|---------------------|------|
| P1 | **Foto do Moreira ainda é placeholder** | `<!-- TODO: substituir por foto real do José Moreira em Viana do Castelo -->` (linha 1239) | `index.html:1239` |
| P2 | **Formulário não está ligado a backend** | Atributo `data-pendente="ligar-a-airtable"` (linha 1448) — submissão não guarda nada | `index.html:1448` + JS em `<script>` após linha 1501 |
| P3 | **Secção `#privacidade` referenciada mas inexistente** | Link `<a href="#privacidade">Tratamento de dados</a>` no footer (linha 1493) vai para âncora que não existe | `index.html:1493` |
| P4 | **Bot demo genérico** | iframe usa um `configUrl` único, não adapta-se ao sector escolhido | `index.html:1219` |

### MÉDIO impacto (qualidade/conversão)

| # | Pendência | Observação |
|---|-----------|------------|
| P5 | **Sem SEO estruturado** | Só tem meta description + OG title. Falta JSON-LD `LocalBusiness` / `Person`, sitemap, robots.txt |
| P6 | **Sem analytics nem eventos** | Não há Plausible/Umami/GA4 — impossível medir conversão real |
| P7 | **Sem testimunhos/provas sociais** | Totalmente vazio de social proof (o Moreira pode já ter 1-2 clientes a referenciar) |
| P8 | **CTA WhatsApp não diferencia por sector** | A pre-message é genérica, podia mencionar sector escolhido se `sector !== null` |
| P9 | **Calculadora não guarda resultado** | O valor calculado não é enviado junto com o contacto no formulário — perde-se informação qualificada |
| P10 | **Âncora de scroll não tem offset** | Nav fixo não existe, mas secções longas podem ficar ocultas atrás de navegação futura |

### BAIXO impacto (polish)

| # | Pendência | Observação |
|---|-----------|------------|
| P11 | Favicon SVG inline com monograma "JM" — funciona mas é básico |
| P12 | Sem favicon para Apple/PWA (`apple-touch-icon`) |
| P13 | Sem `manifest.json` |
| P14 | Animação de entrada só existe em `fadeInUp` — sem scroll-reveal por secção |
| P15 | Sem skip-link para acessibilidade |

---

## ⚠️ AVISO DE SEGURANÇA — herdado de incidente anterior (20/04)

**Durante o deploy anterior descobriu-se um Airtable PAT real leakado em 2 ficheiros de handoff do Moreira.** O @devops fez redacção imediata nos docs git (`[REDACTED]`) e reescreveu history, MAS:

> **O token continua válido e precisa de rotação real no Airtable.**
> **Está referenciado em `bot.json` local (não committed).**
> **Antes de ligar o formulário da landing v2 a Airtable, rotacionar o PAT, e usar Vercel Environment Variable — NUNCA hardcoded no HTML/JS.**

Ver: `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md` (PAT já redacted, mas referência histórica).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260421-landing-v2-melhorias.md`. PROJECTO A QUE SE REFERE = `membros/jose-moreira/04-landing/`. A localização está correcta segundo `workspace-governance.md` (handoffs de membro em `membros/{nome}/handoffs/`). NÃO MOVER.

---

## O que o Eurico pediu, literalmente

> *"preciso de um HANDOFF bem detalhado para melhorar esta landingpage, melhorar. landing v2"*

**Nada mais.** Não especificou:
- O que concretamente quer melhorar
- Se v2 é iteração sobre v1 ou novo conceito
- Se há prazo ou contexto de campanha
- Se há feedback do próprio Moreira para incorporar

**→ Primeira acção do próximo agente: perguntar ao Eurico qual é o âmbito concreto da v2.**
**→ Usar a tabela de pendências P1–P15 acima como menu numerado para ele escolher rapidamente.**
**→ Nunca projectar scope (regra Eurico: "Nunca projectar modelo de negócio em membros").**

---

## Ficheiros críticos + paths absolutos

| Tipo | Path absoluto |
|------|---------------|
| **Landing v1 em produção** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\04-landing\index.html` |
| **Vercel linkage** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\04-landing\.vercel\project.json` (não committed, reutilizável) |
| **Pesquisa de mercado** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\01-pesquisa\mapa-mercado-pme-industrial-viana.md` |
| **Briefing original Moreira** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\00-briefing\Sr. Eurico Alves! 👋.txt` |
| **PRD do chatbot (contexto produto)** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\02-prd\` (ver subpastas) |
| **Cronograma PDF** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\Cronograma 26.0124.pdf` |
| **Base de conhecimento bot** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\KnowlegeBase (base de conhecimento).docx` |
| **Handoffs anteriores** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\handoffs\RETOMA-20260420-*.md` (4 ficheiros) |
| **Assets (logos, fotos)** | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\assets\` |

---

## Regras aplicáveis — LER ANTES DE AGIR

| Regra | Onde | Porquê importa aqui |
|-------|------|---------------------|
| `handoff-location.md` | `.claude/rules/` | Qualquer novo handoff fica em `membros/jose-moreira/handoffs/` |
| `workspace-governance.md` | `.claude/rules/` | Tudo do Moreira fica dentro de `membros/jose-moreira/`. Nunca fora |
| `design-system-ia-avancada.md` | `.claude/rules/` | **NÃO se aplica** à landing do Moreira — é marca própria dele (ler comentário na linha 46 do HTML) |
| `mandatory-change-log.md` | `.claude/rules/` | Qualquer alteração DEVE ser documentada ficheiro:linha antes/depois |
| `language-standards.md` | `.claude/rules/` | PT-PT em tudo. O tom da landing é conservador — "o senhor", não "tu" |
| `comunidade-safety.md` | `.claude/rules/` | **NÃO se aplica** directamente (não é o dashboard da comunidade), mas a filosofia de testar antes de push aplica-se |
| `agent-authority.md` | `.claude/rules/` | `@dev` implementa, `@devops` faz push + deploy. `@ux-design-expert` cria especificação |
| Memória `project_moreira_chatbot.md` | `.claude/.../memory/` | Frase canónica do Moreira — nunca expandir sem base factual |
| Memória `feedback_moreira_no_hallucinations.md` | `.claude/.../memory/` | Zero métricas/arquitectura/maturidade inventadas |
| Memória `feedback_no_projected_business_models.md` | `.claude/.../memory/` | Não propor pricing, split, parcerias que o Moreira não pediu |
| Memória `feedback_community_acolhe_adapta_model.md` | `.claude/.../memory/` | Landing do Moreira pode virar template reutilizável no futuro — escrever código limpo |

---

## Workflow recomendado para o próximo agente

1. **Ler este handoff inteiro** (este ficheiro)
2. **Abrir a landing v1 em produção** → https://04-landing-wine.vercel.app
3. **Ler `index.html` completo** em `membros/jose-moreira/04-landing/` — são 1627 linhas, vale a pena para ter a arquitectura toda na cabeça
4. **Ler a pesquisa** em https://01-pesquisa-moreira.vercel.app para perceber o público-alvo factual
5. **Perguntar ao Eurico** qual é o âmbito da v2:
   - Apresentar a tabela P1–P15 acima como **menu numerado**
   - Pedir-lhe para seleccionar os itens a incluir
   - Perguntar se há **feedback directo do Moreira** que deve ser incorporado
   - Perguntar se **foto e testimunhos** estão disponíveis (bloqueiam P1, P7)
   - Perguntar se **a landing continua no mesmo URL** (`04-landing-wine.vercel.app`) ou se v2 vai para staging separado
6. **Só DEPOIS** escrever especificação v2 (`@ux-design-expert`) ou implementar (`@dev`)
7. **Fazer branch** `feat/moreira-landing-v2` antes de tocar no ficheiro
8. **Commits atómicos** por pendência P-número + `mandatory-change-log.md` aplicado
9. **Testar localmente** (abrir `index.html` no browser) ANTES de push
10. **Passar a `@devops`** para deploy — Vercel reutiliza a linkagem em `.vercel/` local

---

## Pontos de decisão que o próximo agente pode tomar sozinho

- **Não precisa de aprovação do Eurico:** refactors internos de CSS, correcção de P3 (âncora `#privacidade` quebrada), acessibilidade (skip-link, `aria-*`), correcção de bugs
- **Precisa de aprovação do Eurico:** qualquer mudança de copy (tom estabelecido), mudança de paleta/tipografia, alteração de estrutura (secções), integração com serviços externos (Airtable, analytics), alteração de CTA/WhatsApp

---

## Estado git no momento desta sessão

- **Branch:** `main`
- **Último commit relevante:** `b5e8279` (landing v1 deploy) e `fd4e293` (gitignore .vercel 01-pesquisa)
- **Repo com alterações pendentes noutros lugares** — NUNCA usar `git add -A` ou `git add .` por causa do histórico de leak do Airtable PAT
- **Staging selectivo obrigatório:** `git add membros/jose-moreira/04-landing/` apenas

---

## Assinatura do handoff anterior (contexto cumulativo)

| Agente | Acção | Data |
|--------|-------|------|
| `@analyst` (Atlas) | Pesquisa PME Viana recolhida | 20/04 |
| `@ux-design-expert` (Uma) | Landing v1 entregue (anterior, fora deste handoff) | ~19/04 |
| `@ux-design-expert` (Uma) | Pesquisa convertida para HTML + DS [IA]AVANÇADA PT | 20/04 |
| `@devops` (Gage) | Deploy landing v1 + deploy pesquisa | 20/04 |
| `@ux-design-expert` (Uma) | **Este handoff para v2** | 21/04 |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md` + `.claude/rules/workspace-governance.md`.

- **PROJECTO A QUE SE REFERE:** José Moreira — landing em `membros/jose-moreira/04-landing/`
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/` (regra `workspace-governance.md` — handoffs de membro com o membro)
- **LOCALIZAÇÃO ACTUAL:** `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira\handoffs\RETOMA-20260421-landing-v2-melhorias.md`
- **COINCIDEM?** SIM

NÃO MOVER. NÃO DUPLICAR. REFERENCIAR A PARTIR DAQUI.

**AGENTE RESPONSÁVEL:** `@ux-design-expert` (Uma)
**DATA:** 21/04/2026
