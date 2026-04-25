# Progresso — Dia 3 de execução do Pacote Casa Pública InovCitrus

> Cumpre regra `mandatory-change-log.md` — registo factual de tudo o que foi produzido nesta sessão, ficheiro a ficheiro.

---

## Sessão

| Campo | Valor |
|-------|-------|
| Data | 25/04/2026 (continuação imediata após Dia 2) |
| Agente | `@ux-design-expert` (Uma) |
| Foco | Identidade visual sóbria + Next.js 14 scaffold + componentes |
| Bloqueador | Nenhum — decisão Q1 (wordmark Inter sem ícone) confirmada |

---

## Identidade visual definida

Fonte de inspiração: [frusoal.pt](https://www.frusoal.pt/) (extracção via WebFetch — paleta laranja-citrino + verde algarvio identificada).

| Token | Valor | Uso |
|-------|-------|-----|
| `citrus` | `#E8A53C` | Primário — laranja citrino maduro |
| `citrus-dark` | `#C68420` | Hover, links, destaque |
| `citrus-light` | `#F5C570` | Backgrounds suaves |
| `algarve` | `#5A8C45` | Secundário — verde algarvio sóbrio |
| `algarve-dark` | `#3F6A2E` | Variante escura |
| `algarve-light` | `#8AB16C` | Variante clara |
| `ink` | `#1A1A1A` | Texto principal |
| `ink-muted` | `#3A3A3A` | Texto corpo |
| `ink-subtle` | `#6B6B6B` | Metadados |
| `surface` | `#FFFFFF` | Fundo neutro |
| `surface-warm` | `#FAF8F4` | Fundo página (off-white quente) |
| `surface-border` | `#E5E2DA` | Linhas separação |
| Tipografia headings | Inter (400/500/600/700/800) | Sans-serif moderno sóbrio |
| Tipografia mono | JetBrains Mono | Código (raro) |

**Wordmark:** "Frusoal" (regular weight 400) + "**InovCitrus**" (bold weight 700), sem ícone, sem decoração.

---

## Stack técnica fixada

| Camada | Tecnologia | Versão | Razão |
|--------|------------|--------|-------|
| Framework | Next.js | 14.2.13 (App Router) | Standard mercado · suporte i18n nativo · Vercel optimizado |
| React | React | 18.3.1 | Padrão Next.js 14 |
| Estilização | Tailwind CSS | 3.4.10 | Tokens controlados sem CSS solto |
| Typography plugin | @tailwindcss/typography | 0.5.15 | Renderização markdown estilizada |
| Markdown loader | gray-matter + remark + remark-html + remark-gfm | 4 / 15 / 16 / 4 | Frontmatter + tables + GFM features |
| Linguagem | TypeScript | 5.5.4 | Type safety |
| Hosting | Vercel | — | Decisão D2 |

---

## Ficheiros criados nesta sessão (Dia 3)

### Configuração

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `inovcitrus-site/package.json` | 32 | Dependências Next.js + Tailwind + remark + tipos |
| `inovcitrus-site/tsconfig.json` | 26 | TypeScript strict + path alias `@/*` |
| `inovcitrus-site/next.config.mjs` | 6 | Next.js config (strict mode, no powered-by header) |
| `inovcitrus-site/postcss.config.mjs` | 6 | Tailwind + autoprefixer |
| `inovcitrus-site/tailwind.config.ts` | 49 | Paleta InovCitrus + tipografia Inter + maxWidth tokens |
| `inovcitrus-site/.gitignore` | 30 | Padrão Next.js + Vercel |
| `inovcitrus-site/vercel.json` | 21 | Config Vercel + security headers |

### Lib (núcleo de i18n + conteúdo)

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `src/lib/i18n.ts` | 80 | 4 locales · slug-keys · etiquetas UI por língua · type guards |
| `src/lib/content.ts` | 38 | Loader markdown · gray-matter · remark · stripSourceComments (remove `<!-- F0X -->` antes de renderizar) |

### Componentes

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `src/components/Wordmark.tsx` | 25 | Wordmark tipográfico Frusoal+InovCitrus (variantes header/footer) |
| `src/components/Header.tsx` | 35 | Header com Wordmark + navegação primária + LanguageSwitcher |
| `src/components/Footer.tsx` | 42 | Footer com Wordmark + parceiros + nota institucional + copyright |
| `src/components/LanguageSwitcher.tsx` | 41 | Switcher 4 línguas com `usePathname` (preserva slug ao trocar idioma) |
| `src/components/MarkdownContent.tsx` | 24 | Renderizador HTML com classes prose customizadas (paleta InovCitrus) |

### App routes

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `src/app/layout.tsx` | 18 | Root layout · metadata global |
| `src/app/page.tsx` | 6 | Redirect `/` → `/pt` (defaultLocale) |
| `src/app/globals.css` | 50 | Tailwind layers + Google Fonts Inter + JetBrains Mono + skip-link |
| `src/app/[locale]/layout.tsx` | 33 | Layout por locale · Header · Footer · skip-link · `generateStaticParams` |
| `src/app/[locale]/page.tsx` | 24 | Home (carrega `01-home.md` por locale) |
| `src/app/[locale]/[slug]/page.tsx` | 33 | Páginas slug (project/structure/repository/contacts) · `generateStaticParams` para todos locale × slug |

### Documentação

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `inovcitrus-site/README.md` | 91 | Stack · estrutura · comandos · identidade · princípios · próximos dias |

**Total Dia 3:** 17 ficheiros · ~625 linhas de código · scaffold Next.js completo pronto para build no Dia 4.

---

## Arquitectura de rotas

```
/                                    → redirect /pt
/pt                                  → 01-home.md (PT)
/pt/project                          → 02-projecto-trienal.md (PT)
/pt/structure                        → 03-estrutura-parceiros.md (PT)
/pt/repository                       → 04-repositorio.md (PT)
/pt/contacts                         → 05-contactos.md (PT)
/en, /en/project, /en/structure, /en/repository, /en/contacts   → mesmo, EN
/es, /es/project, /es/structure, /es/repository, /es/contacts   → mesmo, ES
/fr, /fr/project, /fr/structure, /fr/repository, /fr/contacts   → mesmo, FR
```

Total: 4 línguas × 5 páginas = **20 rotas estáticas** geradas via `generateStaticParams`.

**Decisão de rotas:** slug-keys canónicos (`project`, `structure`, `repository`, `contacts`) — não slugs traduzidos. Razão: simplificar manutenção, garantir que `LanguageSwitcher` consegue trocar de idioma sem mapear slug por idioma.

---

## Características implementadas

| Característica | Detalhe |
|----------------|---------|
| Acessibilidade | Skip-link visível ao foco · `aria-current` no LanguageSwitcher · `aria-label` no Wordmark · `lang` attribute correcto por locale |
| SEO | Metadata por página (título do frontmatter) · `metadataBase` configurado · `alternate` links via App Router (futuro) |
| Performance | Static generation (SSG) total · `dynamicParams = false` · zero JS desnecessário no cliente (só LanguageSwitcher é Client Component) |
| Manutenibilidade | Conteúdo separado de código · adicionar nova língua = adicionar `content/{nova}/` + entry em `i18n.ts` |
| Rastreabilidade científica | `<!-- F0X -->` em markdown · removidos antes de render via `stripSourceComments` em `src/lib/content.ts` · IDs preservados no frontmatter `sources: [F0X, F0Y]` |
| Responsividade | Tailwind responsive classes · header empilha em mobile · prose `max-w-prose` (70ch) limitado |

---

## Princípios respeitados

| Regra / decisão | Como aplicada |
|-----------------|----------------|
| Decisão D3 (Pedro primeiro, depois InPP) | Footer mostra parceiros como links externos · zero logos InPP · só nome textual + URL |
| `frusoal-source-of-truth.md` | `<!-- F0X -->` rastreabilidade preservada no source mas ocultada do HTML |
| Identidade visual sóbria | Sem cores fluorescentes · paleta extraída do site Frusoal · tipografia Inter neutra |
| Sem ruptura estética | Verde + laranja institucionais · tipografia sans-serif simples · linhas finas neutras |
| `output-format-standards.md` | Zero emojis no UI · tom institucional |
| `language-standards.md` (PT-PT) | Etiquetas UI em PT são "início", "ficheiro", "utilizador"-friendly · não "inicio" / "archivo" |

---

## Próximo passo (Dia 4)

| Tarefa | Output |
|--------|--------|
| `npm install` no `inovcitrus-site/` | `node_modules/` · `package-lock.json` |
| `npm run build` | `.next/` · 20 rotas estáticas geradas |
| `npm run dev` | Validação local em http://localhost:3000 |
| Smoke test 4 línguas + skip link + responsividade | Captura de ecrã para validação Eurico |
| Correcção de eventuais erros de build | Estável |

---

## Decisões em aberto

| # | Decisão | Quem decide |
|---|---------|--------------|
| O1 | ✓ resolvido | Wordmark Inter tipográfico sem ícone (default Q1 confirmado) |
| O2 | Foto da sede em construção em Tavira | Eurico (passa foto se houver — Dia 4 ou 5) |
| O3 | URL Vercel exacto | Uma confirma Dia 5 ao registar projecto |

---

## Estado acumulado Dias 1+2+3

| Dia | Ficheiros | Linhas | Foco |
|-----|-----------|--------|------|
| 1 | 8 | ~800 | Conteúdo PT + estrutura + fontes F01-F08 |
| 2 | 18 | ~1.700 | Conteúdo EN/ES/FR + fontes F09-F16 |
| 3 | 17 | ~625 | Identidade visual + Next.js scaffold completo |
| **Acumulado** | **43** | **~3.125** | **Pronto para build (Dia 4)** |

---

*Fim do registo Dia 3 — scaffold Next.js completo. Próximo: install + build (Dia 4).*
