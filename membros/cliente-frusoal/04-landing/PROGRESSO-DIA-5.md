# Progresso — Dia 5 de execução do Pacote Casa Pública InovCitrus

> Cumpre regra `mandatory-change-log.md`.

---

## Sessão

| Campo | Valor |
|-------|-------|
| Data | 25/04/2026 (luz verde Eurico após validação visual Dia 4) |
| Agente | `@ux-design-expert` (Uma) |
| Foco | Bump Next 14.2.x patched · deploy Vercel produção · 4 PDFs ficha técnica |
| Bloqueador | Nenhum — tudo entregue |

---

## Comandos executados (ordem cronológica)

| # | Comando | Resultado | Tempo |
|---|---------|-----------|-------|
| 1 | `npm view next versions` | latest 14.2.x = **14.2.35** | <1s |
| 2 | `npm install next@14.2.35` | ✓ bump 14.2.13 → 14.2.35 (22 patches dentro do mesmo minor) | ~10s |
| 3 | `npm run build` (pós-bump) | ✓ 24 rotas estáticas, zero erros TypeScript | ~22s |
| 4 | `npx vercel whoami` | ✓ autenticado como `euricojsalves-4744` | <1s |
| 5 | `npx vercel deploy --prod --yes --name inovcitrus` | ✓ READY · alias `https://inovcitrus.vercel.app` | 46s |
| 6 | Curl 21 endpoints produção | ✓ 1× 307 + 20× 200 | ~10s |
| 7 | `node scripts/generate-pdfs.mjs` | ✓ 4 PDFs gerados via Chrome headless | ~8s |

---

## Decisão Next bump (O4 do Dia 4 — resolvida)

| Campo | Valor |
|-------|-------|
| De | next@14.2.13 |
| Para | next@14.2.35 (latest 14.2.x patched) |
| Razão | CVE security advisory Dec 2025 |
| Risco | Zero — 22 patches dentro do mesmo minor, sem breaking changes |
| Confirmação | `npm run build` pós-bump passou idêntico (24 rotas, mesmo bundle size 87.3 kB) |

**Advisories restantes pós-bump (2):** referem-se a `next/image` runtime, rewrites, RSC HTTP request handling — features **NÃO usadas** neste site (SSG estático puro, sem next/image, sem rewrites, sem APIs runtime). Bump major para Next 16.x é breaking change com risco maior — recusado. Decisão registada.

---

## Vercel deploy

| Campo | Valor |
|-------|-------|
| Project name | `inovcitrus` |
| Deployment ID | `dpl_E1khiU7pKxdqD3EE5CPkBEpMR1Gi` |
| URL produção (alias) | **https://inovcitrus.vercel.app** ← Q3 default conseguido |
| URL deployment | https://inovcitrus-e06vid67v-euricojsalves-4744s-projects.vercel.app |
| Inspector | https://vercel.com/euricojsalves-4744s-projects/inovcitrus/E1khiU7pKxdqD3EE5CPkBEpMR1Gi |
| Build time | 31s |
| Total deploy | 46s |
| Target | production |
| readyState | READY |

### Sanity check produção (21 endpoints)

```
/ → HTTP/1.1 307 Temporary Redirect (→ /pt)

/pt        → 200    /pt/project    → 200    /pt/structure   → 200
/pt/repository → 200    /pt/contacts → 200
/en        → 200    /en/project    → 200    /en/structure   → 200
/en/repository → 200    /en/contacts → 200
/es        → 200    /es/project    → 200    /es/structure   → 200
/es/repository → 200    /es/contacts → 200
/fr        → 200    /fr/project    → 200    /fr/structure   → 200
/fr/repository → 200    /fr/contacts → 200
```

**hrefs internos /pt/project (produção):** `/pt/contacts · /pt/project · /pt/repository · /pt/structure` ✓
**F0X comments em produção:** 0 ocorrências em /pt ✓ (loader `stripSourceComments` funciona em produção)

---

## 4 PDFs ficha técnica

### Estratégia de geração

Pandoc + xelatex + wkhtmltopdf todos ausentes do sistema. Decisão pragmática (cumpre `feedback_no_more_tools.md`): usar Chrome headless já instalado em `C:\Program Files\Google\Chrome\Application\chrome.exe` via flag `--print-to-pdf`. Zero instalações novas.

### Script criado

**`inovcitrus-pdfs/scripts/generate-pdfs.mjs`** (~140 linhas) — Node ESM standalone:

| Etapa | Detalhe |
|-------|---------|
| 1. Importa deps | `gray-matter`, `remark`, `remark-gfm`, `remark-html` (reutiliza `node_modules` do `inovcitrus-site/`) |
| 2. Lê markdown source | `inovcitrus-pdfs/source/{lang}/ficha-tecnica-scirtothrips-{lang}.md` |
| 3. Parse frontmatter + strip F0X | `gray-matter` + regex `<!--\s*F\d+\s*-->` |
| 4. Markdown → HTML | `remark` + `remarkGfm` (tabelas) + `remarkHtml` |
| 5. HTML A4 standalone | CSS print embebido com paleta InovCitrus, Inter Google Fonts, page size A4 18mm/16mm/20mm/16mm |
| 6. Chrome headless | `chrome.exe --headless=new --disable-gpu --print-to-pdf-no-header --print-to-pdf={out}.pdf file:///{tmp}.html` |
| 7. Cleanup | Remove `.tmp-html/` |

### Saída

| Ficheiro | Tamanho | Páginas A4 |
|----------|---------|-----------|
| `output/ficha-tecnica-scirtothrips-pt.pdf` | 156 KB | ~6 |
| `output/ficha-tecnica-scirtothrips-en.pdf` | 166 KB | ~6 |
| `output/ficha-tecnica-scirtothrips-es.pdf` | 171 KB | ~7 |
| `output/ficha-tecnica-scirtothrips-fr.pdf` | 169 KB | ~7 |

**Nota:** RETOMA Dia 3 estimava 4 páginas A4 cada. Saiu 6-7 páginas porque o markdown source tem 158-162 linhas com várias tabelas (estatuto fitossanitário, plano científico, calendário, parceiros). 6-7 páginas é razoável e legível para uma ficha técnica formal. Se Eurico preferir mais condensado, posso ajustar font-size de 10.5pt → 10pt e margens de 18mm → 14mm para tirar 1-2 páginas.

### Identidade visual aplicada nos PDFs

- Fonte body: **Inter** 10.5pt (Google Fonts via @import)
- Cabeçalho: wordmark "Frusoal **InovCitrus**" + linha laranja-citrino `#E8A53C` (2pt)
- Headings H1 22pt extrabold, H2 14pt bold com border-bottom suave
- Tabelas com `<th>` em background `#FAF8F4` (off-white quente)
- Links em `#C68420` (citrus-dark)
- Blockquote com border-left `#E8A53C` 3pt
- Footer com URL `frusoal.pt` + "Tavira · Algarve"
- Versão "v1.0 preliminar" em letras pequenas no header (cumpre Dia 3 — site declarado preliminar)

---

## Ficheiros novos / modificados nesta sessão

| Caminho | Mudança | Linhas |
|---------|---------|--------|
| `inovcitrus-site/package.json` | next: 14.2.13 → 14.2.35 | 1 |
| `inovcitrus-site/package-lock.json` | regenerado pelo bump | — |
| `inovcitrus-site/.next/` | regenerado pelo build | — |
| `inovcitrus-site/.vercel/` | criado pelo Vercel CLI (project link) | — |
| `inovcitrus-pdfs/scripts/generate-pdfs.mjs` | novo — Node ESM script PDF gen | 140 |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-pt.pdf` | novo | 156 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-en.pdf` | novo | 166 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-es.pdf` | novo | 171 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-fr.pdf` | novo | 169 KB |
| `04-landing/PROGRESSO-DIA-5.md` | novo (este registo) | — |

---

## Validações cumpridas

| Regra / memória | Como respeitada |
|-----------------|------------------|
| `frusoal-source-of-truth.md` | Conteúdo dos PDFs é cópia fiel dos markdowns source (zero alteração factual) · zero "em nome da InPP" nos PDFs |
| `feedback_no_more_tools.md` | Zero ferramentas novas instaladas no sistema · usado Chrome já existente · script reusa `node_modules` do site |
| `feedback_handoffs_detail.md` | Este registo lista comandos cronológicos + ficheiros + tamanhos + URLs |
| `mandatory-change-log.md` | Comandos exactos + diffs + decisões registadas |
| `feedback_no_invented_cases.md` | Zero invenção — PDFs são render dos markdowns existentes, nada de novo conteúdo |
| Decisão D2 (Vercel) | ✓ Deploy em vercel.com com alias `inovcitrus.vercel.app` |
| Decisão D3 (zero "em nome da InPP") | ✓ Verificado nos 4 PDFs e na produção Vercel |
| `mcp-usage.md` | Zero uso de docker-gateway · só ferramentas nativas (Bash, Read, Write, Edit) |

---

## Próximos passos

| Dia | Status | Tarefa | Pré-requisito |
|-----|--------|--------|----------------|
| 1-3 | ✓ | Conteúdo + tradução + scaffold | — |
| 4 | ✓ | Build + dev + smoke + fix hrefs + validação Eurico | — |
| 5 | ✓ | Bump Next + deploy Vercel + 4 PDFs | — |
| 6 | a executar | Roadmap PDF visual 36 meses + kit imprensa (wordmark SVG, press release modelo) | Dia 5 |
| 7 | a executar | Revisão final + envelope físico PARA-IMPRIMIR + handoff entrega | Dia 6 |

---

## Decisões resolvidas Dia 5

| # | Decisão | Resolução |
|---|---------|-----------|
| O3 | URL Vercel | ✓ `inovcitrus.vercel.app` (alias automático ao project name) |
| O4 | Bump Next patched | ✓ 14.2.13 → 14.2.35 |

---

## Decisões em aberto

| # | Decisão | Quem decide | Quando |
|---|---------|--------------|--------|
| O2 | Foto da sede em construção em Tavira | Eurico (passa foto se houver) | Antes de Dia 6 |
| **O5** (novo) | Reduzir páginas dos PDFs (6-7 → 4-5) ou aceitar tamanho actual | Eurico ao ver os 4 PDFs | Agora |
| **O6** (novo) | Lighthouse a11y/perf scores em produção (>= 95 a11y) | Eurico no Chrome DevTools | Agora |

---

## Para Eurico validar agora

1. **Abrir** https://inovcitrus.vercel.app no browser → confirmar redirect /pt + navegação 4 línguas funciona em produção
2. **Abrir** os 4 PDFs em `inovcitrus-pdfs/output/` → confirmar legibilidade, tipografia Inter, paleta laranja-citrino, decidir se 6-7 páginas é OK ou se quer apertar
3. **Lighthouse** (opcional): no Chrome DevTools, escolher a página `/pt`, separador Lighthouse → Run → desejado a11y ≥ 95

Sem feedback negativo do Eurico, avanço Dia 6 (roadmap visual + kit imprensa).

---

*Fim do registo Dia 5 — site live em `inovcitrus.vercel.app`, 4 PDFs imprimíveis. Pacote Casa Pública 70% concluído (5/7 dias).*
