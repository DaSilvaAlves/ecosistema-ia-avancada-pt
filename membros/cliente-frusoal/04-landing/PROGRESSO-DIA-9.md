# Progresso Dia 9 — 26/04/2026 (noite) — Brandbook InovCitrus "Atlas Citrícola"

> Cumpre regra obrigatória `.claude/rules/mandatory-change-log.md` — registo de TODAS as alterações com antes/depois e razão.
>
> **Sessão:** Uma (`@ux-design-expert`) · 26/04/2026 (noite)
> **Contexto:** Eurico pediu para estudar o brandbook expressia.pt e fazer um igual para a Frusoal. Decidido fazer brandbook do **InovCitrus** (não Frusoal-mãe). Trabalho UAU.
> **Conceito aprovado:** "Atlas Citrícola" — sistema científico-agrícola que respeita 45 anos da Frusoal e antecipa 36 meses de investigação · validado por Eurico ("ok avança")
> **Trabalho prévio detectado mid-sessão:** Sessão 26/04 (tarde) implementou `/abertura` para Pedro Madeira — descoberto antes de commit. Sem conflito técnico mas reportado ao Eurico para confirmação.

---

## Resumo do que foi feito

Implementado o **brandbook InovCitrus completo** no scaffold Next.js, em 4 línguas (PT/EN/ES/FR), com 8 secções anchor inspiradas na estrutura do design-system.expressia.pt mas com identidade e componentes próprios. Página acessível em:

- `https://inovcitrus.vercel.app/pt/identidade` (após deploy)
- `https://inovcitrus.vercel.app/en/identidade`
- `https://inovcitrus.vercel.app/es/identidade`
- `https://inovcitrus.vercel.app/fr/identidade`

Adicional: tokens DTCG W3C exportados em `/tokens/inovcitrus-tokens.dtcg.json` para integração com Figma Tokens, Style Dictionary, etc.

---

## Conceito visual

**Atlas Citrícola** — assinatura visual onde a tradição de 45 anos da Frusoal encontra o rigor de plate botânico do séc. XIX, traduzido em código moderno. Inspiração: gravuras científicas, cartografia, livro de campo. NÃO cyber. NÃO cosplay do brandbook expressia.pt. Identidade própria.

**Diferenciais vs design-system.expressia.pt:**

| Critério | Expressia.pt | InovCitrus |
|---|---|---|
| Assinatura visual | Dark Cockpit + Cyan Glow | Atlas Citrícola — Solar/Plate/Selo IGP |
| Par tipográfico | Inter + JetBrains Mono | **Fraunces** (display serif) + Inter + JetBrains Mono |
| Componentes únicos | Glass cards genéricos | **Plate Card · Cronos · Ficha Praga · Tabela Científica · Quote F-Bloco** |
| Spec técnica | Conceptual (sem CSS vars reais) | **Completa: CSS vars + Tailwind config + tokens DTCG W3C** |
| Acessibilidade | Tabela contraste estática | **Live ContrastBadge component com AA/AAA verificados** |
| Showcase | Mockups referenciados | **Componentes vivos (live demo) + code snippets visíveis** |

---

## Alterações realizadas

### Documentação produzida (audit + specs em `04-landing/inovcitrus-brandbook-audit/`)

| # | Ficheiro | Linhas | Função |
|---|----------|--------|--------|
| 1 | `AUDIT-NOTES.md` | ~150 | Audit visual Frusoal-mãe + Gomo + Biogomo · cores reais hex · validação paleta |
| 2 | `PALETA-EXTENDIDA.md` | ~210 | Paleta v2.0 final · 11 cores · ratios WCAG calculados manualmente |
| 3 | `TIPOGRAFIA.md` | ~290 | Par tipográfico final · escalas · estratégia de carregamento |
| 4 | `COMPONENTES.md` | ~470 | Spec dos 5 componentes assinatura + secundários + motion tokens |
| 5 | `Gomo.png` (download) | — | Logo Gomo descarregado para audit |
| 6 | `Biogomo.png` (download) | — | Logo Biogomo descarregado para audit |
| 7 | `frusoal-logo.png` (download) | — | Logo Frusoal-mãe descarregado |
| 8 | `Frusoal-photo.jpg` (download) | — | Fotografia institucional Frusoal |
| 9 | `barra-certificacoes.png` (download) | — | Barra PRR + República Portuguesa + UE |

### Site Next.js (em `04-landing/inovcitrus-site/`)

#### Modificados

| # | Ficheiro | Antes | Depois | Razão |
|---|----------|-------|--------|-------|
| 10 | `tailwind.config.ts` | 4 grupos de cores (citrus, algarve, ink, surface) | + 5 cores funcionais (solar, pomar, tinta, critico, pergaminho) + fontFamily display + fontSize escala completa + motion tokens + borderRadius + boxShadow | Foundation para componentes do brandbook |
| 11 | `src/app/globals.css` | 7 CSS vars + import Inter+JBMono | + 16 CSS vars · + import Fraunces · + classes utilitárias hatch-divider + solar-mark + tabular-nums · + focus-visible global | Foundation tokens + classes assinatura |
| 12 | `src/lib/i18n.ts` | nav: home/project/structure/repository/contacts | + `identity: 'Sistema Visual'` em PT/EN/ES/FR | Adicionar nav link para brandbook |
| 13 | `src/components/Header.tsx` | navItems com 4 entries | + entry `identity` apontando para `/{locale}/identidade` | Tornar brandbook acessível na navegação principal |

#### Novos · Componentes brand (em `src/components/brand/`)

| # | Ficheiro | Linhas | Função |
|---|----------|--------|--------|
| 14 | `PlateCard.tsx` | ~110 | Card com moldura · selo Solar corner · 4 variantes (default/featured/dark/compact) |
| 15 | `Cronos.tsx` | ~80 | Timeline científica horizontal/vertical · markers past/present/future com glow Solar |
| 16 | `QuoteFBloco.tsx` | ~75 | Citação com fonte F-source rastreada · 3 variantes |
| 17 | `TabelaCientifica.tsx` | ~70 | Tabela com cabeçalhos mono uppercase · footnotes · hover row · tabular-nums |
| 18 | `FichaPraga.tsx` | ~75 | Ficha estilo plate botânico · metadata · sections paragraph/list · sources |
| 19 | `Swatch.tsx` | ~30 | Preview de cor com nome · token · hex · rgb · uso |
| 20 | `ContrastBadge.tsx` | ~30 | Badge AA/AAA/FAIL automático baseado em ratio + scale |
| 21 | `TypeSpecimen.tsx` | ~40 | Specimen tipográfico configurável · Display/Sans/Mono |
| 22 | `IdentitySidebar.tsx` | ~30 | Sidebar nav anchor com 8 secções · sticky em desktop |
| 23 | `Section.tsx` | ~25 | Section wrapper com numeração · título Display L · intro · hatch divider |

#### Novo · Página

| # | Ficheiro | Linhas | Função |
|---|----------|--------|--------|
| 24 | `src/app/[locale]/identidade/page.tsx` | ~340 | Brandbook completo · 8 secções (manifesto, identidade, paleta, tipografia, componentes, tokens, aplicações, acessibilidade) · 4 línguas via `generateStaticParams` |

#### Novo · Tokens DTCG

| # | Ficheiro | Linhas | Função |
|---|----------|--------|--------|
| 25 | `public/tokens/inovcitrus-tokens.dtcg.json` | ~210 | Export W3C DTCG draft format · color · typography · spacing · borderRadius · shadow · motion · breakpoints |

### Kit imprensa (em `04-landing/inovcitrus-kit-imprensa/`)

| # | Ficheiro | Antes | Depois | Razão |
|---|----------|-------|--------|-------|
| 26 | `paleta-swatches.html` | 6 cores núcleo · 1 grupo | 11 cores (6 núcleo + 5 funcional) · 2 grupos · Fraunces no H1 · gradient Solar Sweep | Sincronizar kit imprensa com paleta v2.0 |

---

## Decisões tomadas (e razão)

| # | Decisão | Razão |
|---|---------|-------|
| **D1** | Brandbook é do InovCitrus (não Frusoal-mãe) | Frusoal-mãe tem identidade própria (Gomo/Biogomo) — esse trabalho é dos developers da frusoal.pt. InovCitrus é o nosso território. |
| **D2** | Conceito "Atlas Citrícola" (não Dark Cockpit) | InovCitrus tem público sóbrio (Pedro 65 anos) e tema agrícola. Cyber não encaixa. Plate botânico encaixa. |
| **D3** | Adicionar Fraunces como display serif | Eleva Inter sem quebrar — Fraunces tem ressonância clássica + modernidade legível. Variable font · 1 ficheiro · diacríticos PT/EN/ES/FR. |
| **D4** | Manter paleta núcleo v1.0 intocada | Foi bem desenhada e alinha com Frusoal-mãe sem chocar. Zero alteração nas 6 cores. |
| **D5** | Ajustar Tinta `#1B3A57` → `#1B2A4E` | Audit revelou conflito potencial com azul-petróleo Biogomo `#3F9EA8` |
| **D6** | Ajustar Crítico `#A23E2E` → `#8B2E22` | Audit revelou conflito potencial com vermelho-coral Gomo `#E84B3B` |
| **D7** | 5 componentes assinatura próprios | Plate Card · Cronos · Ficha Praga · Tabela Científica · Quote F-Bloco — únicos ao tema InovCitrus |
| **D8** | Live ContrastBadge component | Onde expressia.pt mostra tabela estática · InovCitrus mostra badges dinâmicos AA/AAA |
| **D9** | Tokens DTCG W3C exportados | Onde expressia.pt não tem · InovCitrus tem · pronto para Figma/Style Dictionary |
| **D10** | Adicionar `/identidade` ao header nav | Brandbook é demonstração pública · não privado como `/abertura`. Faz parte da casa pública InovCitrus. |
| **D11** | Code snippet visível na secção Tokens | Mostra a infraestrutura técnica · prova do rigor |

---

## Validação técnica

### Build local

```
npm run build
✓ Compiled successfully
✓ Generating static pages (32/32)
+ /[locale]/identidade → 4 rotas estáticas geradas (pt, en, es, fr)
+ /[locale]/abertura → 4 rotas (do trabalho prévio Dia 8)
```

Total de rotas no site: **32** (Dia 8 tinha 28 · +4 novas para identidade).

### Lint/typecheck

Build passou: `Linting and checking validity of types ...` sem erros reportados — TypeScript válido em todos os 11 componentes brand novos + página `/identidade`.

### Verificações WCAG (calculadas manualmente · documentadas em PALETA-EXTENDIDA.md)

| Combinação | Ratio | Compliance |
|---|---|---|
| Ink #1A1A1A on Surface warm #FAF8F4 | 16.4 | AAA |
| Tinta #1B2A4E on Surface warm | 13.3 | AAA |
| Crítico #8B2E22 on Surface warm | 7.9 | AAA |
| Algarve dark #3F6A2E on Surface warm | 6.0 | AA |
| Surface warm on Ink (invertido) | 16.4 | AAA |
| Solar on Ink | 12.2 | AAA |
| Pergaminho on Ink | 14.7 | AAA |

---

## Detecção de trabalho prévio (mid-sessão)

Antes de commit, executei `git status` e detectei trabalho da sessão anterior do dia (Dia 8 manhã/tarde) que não tinha sido committado:

- `02-prd/PRD-GENESE-E-ABERTURA-PEDRO.md`
- `02-prd/COPY-ABERTURA-PEDRO-PT.md`
- `04-landing/PROGRESSO-DIA-8.md`
- `inovcitrus-site/src/app/[locale]/abertura/`
- `inovcitrus-site/src/components/abertura/`
- `inovcitrus-site/src/data/abertura/`
- `inovcitrus-site/public/material/` (PDFs + kit copiados)

**Análise:** trabalho `/abertura` é a página principal de entrega para Pedro Madeira (URL personalizado, fora do nav). Brandbook `/identidade` é demonstração pública da casa InovCitrus (no nav). **Não há conflito técnico** (build de 32 rotas inclui ambos).

**Acção tomada:** parei antes de commit para reportar ao Eurico e confirmar:
- Que o brandbook é complementar (não duplicado) ao trabalho `/abertura`
- Sugestão: adicionar link cruzado da `/abertura` para `/identidade` (Pedro pode explorar sistema visual se quiser ver "como pensamos visualmente")
- Sugestão: commit faz-se quando Eurico aprovar

---

## Pendente para validação Eurico

1. **Confirmação de não-conflito** com `/abertura` (descoberta tardia)
2. **Validação visual** das 4 línguas do brandbook (`http://localhost:3010/{pt,en,es,fr}/identidade`)
3. **Decisão sobre link cruzado** `/abertura` → `/identidade` (sugestão: SIM, com tom convidativo discreto)
4. **Aprovação para commit + push** (push delegado a `@devops`)

---

## O que NÃO foi feito (intencionalmente · espera Eurico)

| Não fiz | Razão |
|---------|-------|
| Commit local | Espera validação visual + confirmação não-conflito com `/abertura` |
| Push para GitHub | Push é exclusivo `@devops` (regra `agent-authority.md`) |
| Modificação da página `/abertura` | Outra sessão · não toco sem alinhar |
| Link cruzado `/abertura` → `/identidade` | Aguarda decisão Eurico (D8 sugerida) |
| Iniciar dev server local | Eurico tem múltiplos terminais (memória `feedback_never_close_terminals`) — Eurico inicia se quiser ver localmente |

---

## Próximos passos (sugeridos)

1. Eurico revê este documento + screenshots/build output
2. Eurico decide: commit isolado do brandbook OU commit conjunto com `/abertura` (recomendo conjunto — coerência)
3. Eurico decide sobre link cruzado `/abertura` → `/identidade`
4. Aplicar feedback se houver
5. `@devops` faz commit + push + auto-deploy Vercel
6. Validar URL público `https://inovcitrus.vercel.app/pt/identidade`

---

*Change log Dia 9 · 26/04/2026 (noite) · Uma (`@ux-design-expert`) · cumpre `mandatory-change-log.md` e `frusoal-source-of-truth.md`*
