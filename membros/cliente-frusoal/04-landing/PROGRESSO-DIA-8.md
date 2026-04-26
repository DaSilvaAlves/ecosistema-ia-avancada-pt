# Progresso Dia 8 — 26/04/2026 — Página `/abertura` para Pedro Madeira

> Cumpre regra obrigatória `.claude/rules/mandatory-change-log.md` — registo de TODAS as alterações com antes/depois e razão.
>
> **Sessão:** Uma (`@ux-design-expert`) · 26/04/2026 (tarde)
> **Contexto:** pivot 26/04 — entrega 100% online interligada · UM URL para Pedro aceder a TUDO
> **Validação prévia:** PRD `02-prd/PRD-GENESE-E-ABERTURA-PEDRO.md` validado pelo Eurico (D1-D10) · COPY `02-prd/COPY-ABERTURA-PEDRO-PT.md` validado (C1-C6 com defaults aplicados)

---

## Resumo do que foi feito

Implementada a **página HTML para Pedro Madeira** no scaffold Next.js InovCitrus, em **4 línguas** (PT/EN/ES/FR), seguindo os 8 beats narrativos do PRD. Página acessível em:

- `https://inovcitrus.vercel.app/pt/abertura` (após deploy)
- `https://inovcitrus.vercel.app/en/abertura`
- `https://inovcitrus.vercel.app/es/abertura`
- `https://inovcitrus.vercel.app/fr/abertura`

A página integra: Hero · 7 beats narrativos · grid de 9 cards de material (site + 6 PDFs + kit + fontes) · accordion das F01-F16 · bloco de contacto · rodapé assinatura.

Todos os 6 PDFs e o kit imprensa foram copiados para `public/material/` para serem servidos pelo site.

---

## Alterações realizadas

### Ficheiros novos criados

| # | Ficheiro | Linhas | Função |
|---|----------|--------|--------|
| 1 | `02-prd/PRD-GENESE-E-ABERTURA-PEDRO.md` | ~570 | PRD da abertura · génese honesta · 14 secções |
| 2 | `02-prd/COPY-ABERTURA-PEDRO-PT.md` | ~250 | Copy literal PT validado por Eurico (C1-C6) |
| 3 | `inovcitrus-site/src/data/abertura/types.ts` | 65 | Interfaces TypeScript do conteúdo |
| 4 | `inovcitrus-site/src/data/abertura/pt.ts` | 235 | Conteúdo PT (master) — Hero · 7 beats · 9 cards · F01-F16 · contacto · rodapé |
| 5 | `inovcitrus-site/src/data/abertura/en.ts` | 130 | Conteúdo EN (tradução) |
| 6 | `inovcitrus-site/src/data/abertura/es.ts` | 130 | Conteúdo ES (tradução) |
| 7 | `inovcitrus-site/src/data/abertura/fr.ts` | 130 | Conteúdo FR (tradução) |
| 8 | `inovcitrus-site/src/data/abertura/index.ts` | 18 | Barrel + selector por locale |
| 9 | `inovcitrus-site/src/components/abertura/Hero.tsx` | 27 | Componente Hero (greeting + message + context) |
| 10 | `inovcitrus-site/src/components/abertura/Beat.tsx` | 38 | Componente Beat (número mono + heading + parágrafos) — destaque visual no Beat 6 |
| 11 | `inovcitrus-site/src/components/abertura/MaterialGrid.tsx` | 88 | Grid 3-col responsive de cards de material com KindBadge |
| 12 | `inovcitrus-site/src/components/abertura/SourcesAccordion.tsx` | 64 | Accordion HTML nativo `<details>` listando F01-F16 |
| 13 | `inovcitrus-site/src/components/abertura/ContactBlock.tsx` | 51 | Bloco de contacto · placeholder visível para preencher |
| 14 | `inovcitrus-site/src/app/[locale]/abertura/page.tsx` | 70 | Página · `generateStaticParams` · metadata `noindex` |

### Ficheiros copiados (para `inovcitrus-site/public/material/`)

| # | Origem | Destino | Tamanho |
|---|--------|---------|---------|
| 15 | `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-pt.pdf` | `public/material/` | 160 KB |
| 16 | `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-en.pdf` | `public/material/` | 170 KB |
| 17 | `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-es.pdf` | `public/material/` | 176 KB |
| 18 | `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-fr.pdf` | `public/material/` | 174 KB |
| 19 | `inovcitrus-pdfs/output/roadmap-36-meses.pdf` | `public/material/` | 147 KB |
| 20 | `inovcitrus-pdfs/output/press-release-pt.pdf` | `public/material/` | 113 KB |
| 21 | `inovcitrus-kit-imprensa/wordmark-inovcitrus.svg` | `public/material/kit/` | 555 B |
| 22 | `inovcitrus-kit-imprensa/wordmark-inovcitrus-mono.svg` | `public/material/kit/` | 555 B |
| 23 | `inovcitrus-kit-imprensa/paleta-swatches.png` | `public/material/kit/` | 30 KB |
| 24 | `inovcitrus-kit-imprensa/paleta-swatches.html` | `public/material/kit/` | 4.7 KB |
| 25 | `inovcitrus-kit-imprensa/press-release-pt.md` | `public/material/kit/` | 4.7 KB |
| 26 | `inovcitrus-kit-imprensa/press-release-en.md` | `public/material/kit/` | 4.6 KB |
| 27 | `inovcitrus-kit-imprensa/README.md` | `public/material/kit/` | 3.6 KB |

### Ficheiros NÃO modificados (intencionalmente)

| Ficheiro | Razão |
|----------|-------|
| `src/lib/i18n.ts` | Página `/abertura` é rota fixa, não dinâmica via `slugFiles` · não aparece no nav (URL é só para Pedro) |
| `src/components/Header.tsx` | Sem nav link para `/abertura` por design — URL personalizado para Pedro |
| `src/components/Footer.tsx` | Mantém parceiros institucionais (Frusoal, InnovPlantProtect) sem alteração |
| `next.config.mjs` | Sem alterações de config necessárias |
| `tailwind.config.ts` | Reusa paleta InovCitrus existente (citrus, algarve, ink, surface) |

---

## Decisões tomadas (e razão)

| # | Decisão | Razão |
|---|---------|-------|
| **D1** | Rota explícita `/abertura` (não dinâmica) | Página tem layout custom, não cabe em markdown puro |
| **D2** | Conteúdo em TS (não markdown ou JSON) | Type-safety completo, mais fácil manter consistência entre 4 línguas |
| **D3** | NÃO adicionar `/abertura` ao header nav | URL é privado para Pedro, não navegação genérica |
| **D4** | `robots: noindex, nofollow` | Página pessoal · não deve aparecer em buscas |
| **D5** | Beat 6 com border-left citrus + bg suave | Destaque visual do "momento da honestidade desarmante" sem ser ostensivo |
| **D6** | Accordion `<details>` HTML nativo (sem JS) | Funciona sem JavaScript · acessibilidade pura · sem dependências |
| **D7** | Card de fontes com `href="#fontes"` interno | Pedro não sai da página · âncora suave |
| **D8** | Contact block com placeholder `[contacto a definir antes do envio]` | C5 do PRD — Eurico preenche antes de partilhar URL |
| **D9** | Páginas estáticas (`generateStaticParams`) | Performance · SEO · cacheable |
| **D10** | Hero com Opção A (validada) | "Pedro, isto é para ti" + contexto |

---

## Validação técnica

### Build local

```
npm run build
✓ Compiled successfully
✓ Generating static pages (28/28)
+ /[locale]/abertura → 4 rotas estáticas geradas (pt, en, es, fr)
```

Total de rotas no site: **28** (anteriormente 24 · +4 novas para abertura).

### Servidor local de produção

Executado `npx next start -p 3010` em background.

| Endpoint | HTTP | Confirma |
|----------|------|----------|
| `/pt/abertura` | 200 | Página PT renderiza |
| `/en/abertura` | 200 | Página EN renderiza |
| `/es/abertura` | 200 | Página ES renderiza |
| `/fr/abertura` | 200 | Página FR renderiza |
| `/pt` | 200 | Site institucional intacto |
| `/material/roadmap-36-meses.pdf` | 200 | PDF servido correctamente |
| `/material/kit/wordmark-inovcitrus.svg` | 200 | Kit servido correctamente |

### Lint/typecheck

Build incluiu `Linting and checking validity of types ...` sem erros reportados — TypeScript válido.

---

## Pendente para validação Eurico

1. **Validação visual** das 4 línguas (`http://localhost:3010/{pt,en,es,fr}/abertura`)
2. **Decisão sobre contacto** — telefone/email/WhatsApp a mostrar antes de enviar a Pedro
3. **Aprovação para deploy** — push para GitHub via `@devops` desencadeia auto-deploy Vercel
4. **Decisão sobre URL final** — manter `inovcitrus.vercel.app/{locale}/abertura` ou registar `inovcitrus.pt`

---

## O que NÃO foi feito (intencionalmente · espera Eurico)

| Não fiz | Razão |
|---------|-------|
| Commit local | Espera validação visual antes de commit |
| Push para GitHub | Push é exclusivo `@devops` (regra `agent-authority.md`) |
| Deploy Vercel | Cascata: validar → commit → push → auto-deploy |
| Preenchimento de contacto real | C5 ainda pendente — Eurico decide número/email |
| Tradução das fontes (F01-F16) por idioma | Texto dos títulos das fontes mantém PT em todas as línguas (são referências bibliográficas — convenção académica) |
| Modificação dos beats | Aprovados literalmente · não tocar |

---

## Próximos passos (sugeridos)

1. Eurico abre `http://localhost:3010/pt/abertura` e valida visualmente · regista feedback
2. Eurico decide contacto (D8 do PRD)
3. Uma aplica feedback se houver
4. Uma adiciona contacto real
5. `@devops` faz commit + push + auto-deploy
6. Eurico valida URL público antes de partilhar com Pedro

---

## Iteração 2 — correcções pós-feedback Eurico (26/04/2026 fim-de-tarde)

Após primeira validação visual, Eurico apontou 4 bugs. Todos corrigidos.

### Bug 1 — Tratamento informal a Pedro Madeira

Pedro tem 65 anos, sócio-gerente, merece tratamento formal mesmo conhecendo Eurico desde infância.

| Língua | Antes | Depois |
|--------|-------|--------|
| PT | "isto é para ti" · "te chegou" · "fizeste-me" · "vê quando quiseres" | "isto é para si" · "lhe chegou" · "fez-me" · "veja quando quiser" |
| ES | "esto es para ti" · "tú" · "mira" | "esto es para usted" · "le/su" · "mire" |
| FR | "c'est pour toi" · "tu" · "regarde" | "c'est pour vous" · "vous" · "regardez" |
| EN | (mantém — "you" é neutro) | (sem alteração) |

Ficheiros modificados: `src/data/abertura/{pt,es,fr}.ts` (hero, beats 1/5/6/7, metaTitle).

### Bug 2 — Cards abriam na mesma aba

Pedro perdia contexto da página `/abertura` ao clicar num card.

Mudei todos os 8 cards de material para `external: true` → `target="_blank" rel="noopener noreferrer"`. Excepção: card "Fontes" continua âncora interna `#fontes`.

### Bug 3 — Card "Kit imprensa" abria README.md em texto puro

Antes: `href: '/material/kit/README.md'` → markdown raw em fundo preto, sem estilo.

Agora: `href: '/{locale}/kit-imprensa'` → página real Next.js com layout visual, badge formato, descrição, botão Descarregar, pré-visualização inline da paleta.

Ficheiro novo: `src/app/[locale]/kit-imprensa/page.tsx` (4 línguas hardcoded no próprio ficheiro · ~200 linhas).

### Bug 4 — PDFs forçavam download em vez de mostrar inline

Removido `download: true` em todos os PDFs. Browser decide — geralmente mostra inline em nova aba.

### Build pós-correcção

```
npm run build
✓ Compiled successfully
36 rotas estáticas (eram 28 · +4 kit-imprensa +4 identidade)
```

### Smoke test pós-correcção

| URL | HTTP |
|-----|------|
| `/{pt,en,es,fr}/abertura` | 200 × 4 |
| `/{pt,en,es,fr}/kit-imprensa` | 200 × 4 |
| `/pt/identidade` (criada por Eurico em paralelo) | 200 |
| `/material/*.pdf` | 200 |
| `/material/kit/wordmark-inovcitrus.svg` | 200 |
| `/material/kit/paleta-swatches.png` | 200 |

### Verificação literal do tratamento PT

Curl ao HTML servido confirmou:
- `<title>Pedro, isto é para si · Frusoal InovCitrus</title>`
- 0 ocorrências de `contigo`, `pediste`, `tua`, `mostrar-te`, `fizeste-me`
- 10× `lhe`, 2× `consigo`, 2× `veja`, 6× `quiser` ✓

---

*Change log Dia 8 · 26/04/2026 · Uma (`@ux-design-expert`) · cumpre `mandatory-change-log.md` e `frusoal-source-of-truth.md`*
*Iteração 2 (fim-de-tarde) · correcções de tratamento formal + bugs UX após feedback Eurico*
