# RETOMA — Frusoal InovCitrus: Dia 6 entregue, roadmap PDF + kit imprensa prontos, próximo Dia 7 (revisão final + envelope físico + handoff entrega)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

> **ESTE HANDOFF É AUTO-SUFICIENTE.** Foi escrito para um agente em terminal fresh, sem contexto da conversa, conseguir continuar Dia 7 sem precisar de inventar nem perguntar. Se algo aqui contradiz outro documento, este prevalece (mais recente).

---

## Índice

1. Resumo executivo
2. Primeira acção do próximo agente — passo a passo obrigatório
3. Decisões consolidadas (D1-D3, Q1-Q5, O1-O8) com razão e estado
4. Princípios inegociáveis (recapitulados)
5. Estado completo Dias 1-6 (inventário consolidado)
6. Stack técnica e ambiente (versões exactas)
7. URLs produção e endpoints
8. Plano Dia 7 — comandos exactos
9. Como gerar `press-release-pt.pdf` (Dia 7 secção A)
10. Como compilar `PARA-IMPRIMIR/` envelope físico (Dia 7 secção B)
11. Como criar `README-EURICO.md` final (Dia 7 secção C)
12. Como criar handoff "pronto para Eurico entregar ao Pedro" (Dia 7 secção D)
13. Erros previsíveis e mitigação
14. Memórias relevantes
15. Erros que NÃO podem repetir
16. Fontes F01-F16 (rastreabilidade)
17. Compromissos finais (Dia 7)
18. Troubleshooting frequente (FAQ)
19. Estado git e o que falta fazer commit

---

## 1. Resumo executivo

Sessão 25/04/2026 (continuação imediata após Dia 5) executou Dia 6 do Pacote Casa Pública Frusoal InovCitrus. **Roadmap PDF visual 36 meses** gerado (1 página A4 paisagem, 147 KB) — script Node ESM standalone (`generate-roadmap-pdf.mjs`) reusa Chrome headless já existente, lê `roadmap/roadmap-data.json`, renderiza 3 colunas (2026/2027/2028) × 2 faixas (Marcos+Operações cima · Actos comunicativos baixo) com símbolos por track (● científico · ◆ operacional · ▲ comunicativo) e paleta InovCitrus. **Kit imprensa completo** (7 ficheiros · ~52 KB) em `inovcitrus-kit-imprensa/`: 2 wordmarks SVG (colorido com `#C68420` em "InovCitrus" + mono preto puro), paleta swatches PNG (1280×720 com 6 cores institucionais), press-releases modelo PT/EN com placeholders explícitos e zero "em nome da InPP", README com instruções para a Frusoal. **Zero ferramentas novas instaladas** — Chrome reutilizado tanto para PDF como para PNG screenshot, cumpre `feedback_no_more_tools.md`. **Eurico validou visualmente Dia 6 e autorizou continuação para Dia 7.** Próximo: revisão final, envelope físico `PARA-IMPRIMIR/`, handoff "pronto para Eurico entregar ao Pedro".

**Acumulado dos 6 dias:** 52+ ficheiros · ~3.420 linhas conteúdo · 4 línguas · 20 rotas estáticas em produção · 5 PDFs imprimíveis (4 ficha técnica + 1 roadmap) · kit imprensa com 7 peças · zero invenção · zero "em nome da InPP".

---

## 2. Primeira acção do próximo agente — passo a passo obrigatório

**ORDEM EXACTA. NÃO SALTAR PASSOS. NÃO INVENTAR.**

### 2.1 Activação

1. Activar `@ux-design-expert` (Uma) — continuidade directa
2. Reportar ao utilizador: **"Detectei handoff pending RETOMA-20260425 Dia 6 Frusoal InovCitrus — roadmap PDF + kit imprensa prontos. Vou avançar Dia 7 = revisão final + envelope físico PARA-IMPRIMIR + handoff entrega."**

### 2.2 Leitura obrigatória antes de qualquer código

Por esta ordem exacta:

1. `.claude/rules/frusoal-source-of-truth.md` — regra inegociável
2. `.claude/rules/handoff-location.md` — regra handoff
3. `.claude/rules/handoff-central.md` — protocolo cross-terminal
4. `membros/cliente-frusoal/prompt-original.md` — posicionamento "consultor de implementação de IA"
5. **Este handoff integralmente** (`RETOMA-20260425-dia-6-...md`)
6. `membros/cliente-frusoal/04-landing/FONTES.md` — F01-F16
7. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-{1,2,3,4,5,6}.md` — change log integral
8. `membros/cliente-frusoal/04-landing/inovcitrus-pdfs/scripts/generate-pdfs.mjs` — template ficha técnica
9. `membros/cliente-frusoal/04-landing/inovcitrus-pdfs/scripts/generate-roadmap-pdf.mjs` — template roadmap
10. `membros/cliente-frusoal/04-landing/inovcitrus-kit-imprensa/press-release-pt.md` — input para PDF press-release Dia 7
11. `membros/cliente-frusoal/04-landing/inovcitrus-kit-imprensa/README.md` — kit imprensa actual

### 2.3 Verificação ambiente

```bash
node --version       # >= 18.17 (testado v22.22.2 OK)
npm --version        # qualquer versão recente (testado 10.9.7 OK)

# Chrome para PDF gen
ls -la "/c/Program Files/Google/Chrome/Application/chrome.exe"
# Deve existir.

# Vercel CLI já autenticado como euricojsalves-4744
npx vercel whoami
```

### 2.4 Verificação estado actual antes de tocar em algo

```bash
# Site live funciona?
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app
# Esperado: 307

curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app/pt
# Esperado: 200

# 5 PDFs existem? (4 ficha técnica + 1 roadmap)
ls -la /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/output/
# Esperado: ficha-tecnica-scirtothrips-{pt,en,es,fr}.pdf + roadmap-36-meses.pdf

# Kit imprensa 7 ficheiros?
ls -la /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-kit-imprensa/
# Esperado: README.md, paleta-swatches.{html,png}, press-release-{pt,en}.md, wordmark-inovcitrus.svg, wordmark-inovcitrus-mono.svg
```

Se algum destes falha → PARAR e diagnosticar antes de Dia 7. Provavelmente Eurico precisa de fazer algo manualmente.

### 2.5 Comandos Dia 7 (resumo — detalhes nas secções 9-12)

```bash
# A. Press release PT em PDF (ver secção 9)
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
node scripts/generate-press-release-pdf.mjs   # criar este script — ver secção 9

# B. Compilar PARA-IMPRIMIR/ (ver secção 10)
mkdir -p output/PARA-IMPRIMIR
# copiar 7 PDFs com nomes numerados — ver secção 10

# C. README-EURICO.md (ver secção 11)
# Criar em PARA-IMPRIMIR/0-README-EURICO.md

# D. Handoff "pronto para Eurico entregar" (ver secção 12)
```

### 2.6 Reportar ao Eurico

Após Dia 7 completo apresentar:
- Estrutura `PARA-IMPRIMIR/` com 7 PDFs numerados
- README-EURICO.md aberto
- Próximo passo (Eurico imprime · monta envelope · entrega ao Pedro)

### 2.7 Criar `PROGRESSO-DIA-7.md`

Mesmo formato dos Dias 1-6. Em `04-landing/PROGRESSO-DIA-7.md`. Decisões resolvidas (O5? O6? O7? O8?) registadas.

### 2.8 Criar handoff "pronto para entrega"

Ver secção 12. Marca o fecho do pacote casa pública.

---

## 3. Decisões consolidadas (D1-D3, Q1-Q5, O1-O8)

| ID | Decisão | Origem | Razão | Estado |
|----|---------|--------|-------|--------|
| **D1** | Pacote completo 7 dias úteis (Site + Ficha técnica 4 línguas + Roadmap 36 meses + Kit imprensa) | Eurico 25/04/2026 | "Trabalho de casa entregue gera curiosidade que abre porta. Pedro não tem tempo para conversa de café com promessa." | Em execução — 6/7 dias entregues |
| **D2** | Hosting Vercel | Eurico 25/04/2026 | Custo zero · deploy automático · sem registo `.pt` | ✓ Resolvido Dia 5 (alias `inovcitrus.vercel.app`) |
| **D3** | Mostrar a Pedro **primeiro**, depois à InPP | Eurico 25/04/2026 | Pedro é o cliente, decide como/quando comunicar com InPP. **Implicação: zero "em nome da InPP". Logos InPP/CCDR proibidos até autorização formal.** | Em vigor permanente |
| **Q1** | Wordmark tipográfico Frusoal-aligned, sem ícone, Inter weights 400/700 | Default aceite Dia 1 | Sóbrio, harmoniza com Frusoal, escala em PDFs | ✓ Implementado Dia 3 e Dia 6 |
| **Q2** | Página "Equipa" omitida, substituída por "Estrutura" (só entidades) | Default aceite Dia 1 | Postal não menciona nomes técnicos do polo I&D — não inventar | ✓ Implementado Dia 1 |
| **Q3** | URL Vercel: tentar `inovcitrus.vercel.app` primeiro | Default aceite Dia 1 | Confirmar disponibilidade no Dia 5 | ✓ Resolvido Dia 5 — `inovcitrus.vercel.app` conseguido |
| **Q4** | Página "Sede" vaga: "em construção em Tavira", sem morada/foto | Default aceite Dia 1 | Postal só refere "Tavira" — não inventar | ✓ Implementado Dia 1 (presente nas 4 línguas) |
| **Q5** | Não registar `inovcitrus.pt` agora | Default aceite Dia 1 | Custo zero. Se Pedro avançar, regista-se depois (15€/ano) | Em vigor |
| **O1** | Identidade visual InovCitrus | Resolvido Dia 3 | Wordmark Inter tipográfico (Q1 default) | ✓ |
| **O2** | Foto da sede em construção em Tavira | Pendente | Eurico passa foto se houver, antes de Dia 7 | ⚠ Pendente (default: omitir foto, manter vago) |
| **O3** | URL Vercel exacto | Resolvido Dia 5 | `inovcitrus.vercel.app` conseguido como alias automático | ✓ |
| **O4** | Bump Next CVE | Resolvido Dia 5 | 14.2.13 → 14.2.35 (latest patched mesmo minor) | ✓ |
| **O5** | PDFs ficha técnica saíram 6-7 páginas A4 (RETOMA estimava 4) | Pendente Eurico | Aceitar 6-7 ou condensar para 4-5 (font 10.5pt → 10pt, margens 18mm → 14mm) | ⚠ Pendente |
| **O6** | Lighthouse a11y/perf scores em produção | Pendente Eurico | Validar `https://inovcitrus.vercel.app/pt` no Chrome DevTools, alvo a11y ≥ 95 | ⚠ Pendente |
| **O7** (Dia 6) | Roadmap PDF actual ou ajuste de layout | Pendente Eurico | Aceitar 1 página A4 paisagem actual (147 KB · 3 colunas × 2 faixas) ou pedir ajustes (mais espaço descrição vs mais condensado) | ⚠ Pendente — Eurico vai abrir e decidir |
| **O8** (Dia 6) | Wordmark colorido com `#C68420` em "InovCitrus" ou tudo `#1A1A1A` mais sóbrio | Pendente Eurico | Decisão estética entre "identidade própria" (citrus-dark) vs "alinhamento total Frusoal" (preto suave) | ⚠ Pendente — Eurico vai abrir SVG e decidir |

---

## 4. Princípios inegociáveis (recapitulados)

### 4.1 Posicionamento

- **Consultor de implementação de IA**, não vendor SaaS, não fornecedor de ferramentas, não package provider.
- A "casa pública" é entregue ao Pedro como **trabalho de casa nosso**, não como fait accompli nem como "venda".
- Tom: **par consultivo**, factual, com fontes. Pedro tem 65 anos e 45 anos de empresa.

### 4.2 Conteúdo

- **Zero invenção.** Cada afirmação rastreada a fonte pública (URL + data) em `04-landing/FONTES.md`.
- **Zero linguagem vendor.** Proibido: "combo", "pacote", "package", "ROI 6 meses", "75% PRR", "quick win", "revolucionário", "garantido", "plug-and-play", "out-of-the-box".
- **Zero conteúdo em nome da InPP.** InPP só por citação verbatim de fonte pública + cross-tag textual.
- **PT-PT estrito** no master. EN/ES/FR são paráfrases informadas por fontes regionais oficiais.

### 4.3 Visual

- **Identidade alinhada com Frusoal actual** — sem ruptura estética. Pedro é praticante.
- **Sem cores fluorescentes.** Sem tipografia tech ou display.
- **Sem logos de terceiros** sem autorização formal — só nomes textuais.

### 4.4 Operacional

- **Custo zero** (Vercel `.vercel.app`, fontes Google grátis, sem registo `.pt`, Chrome já instalado).
- **Site declarado preliminar** (versão 1.0 pré-publicação).
- **Repositório científico vazio mas estruturado** — sem inventar resultados.
- **Zero ferramentas novas no PC** — cumpre `feedback_no_more_tools.md`. Pandoc/MiKTeX/Puppeteer/Chromium *foram considerados e recusados*.

---

## 5. Estado completo Dias 1-6 (inventário consolidado)

### 5.1 Conteúdo escrito (Dias 1+2)

| Locale | Páginas site | Ficha técnica |
|--------|---------------|----------------|
| PT (master) | 5 (`01-home`, `02-projecto-trienal`, `03-estrutura-parceiros`, `04-repositorio`, `05-contactos`) | `ficha-tecnica-scirtothrips-pt.md` |
| EN | 5 (mesma estrutura) | `ficha-tecnica-scirtothrips-en.md` |
| ES | 5 (mesma estrutura) | `ficha-tecnica-scirtothrips-es.md` |
| FR | 5 (mesma estrutura) | `ficha-tecnica-scirtothrips-fr.md` |
| **Total** | **20 markdowns** | **4 markdowns** |

### 5.2 Scaffold Next.js (Dia 3)

| Tipo | Ficheiros |
|------|-----------|
| Config (package.json, tsconfig, next.config, postcss, tailwind, .gitignore, vercel.json) | 7 |
| Lib (i18n.ts, content.ts) | 2 |
| Componentes (Wordmark, Header, Footer, LanguageSwitcher, MarkdownContent) | 5 |
| App routes (layout root, page redirect, globals.css, [locale] layout, [locale] page, [locale]/[slug] page) | 6 |
| README | 1 |
| **Total Dia 3** | **17** |

### 5.3 Build + smoke + bug fix (Dia 4)

- `npm install` Next 14.2.13 + 209 packages adicionais
- `npm run build` ✓ 24 rotas estáticas
- Smoke test 17/18 ✓ (T17 consola delegado a Eurico — confirmou OK)
- Bug fix: 19 hrefs internos quebrados em 11 markdowns (slugs traduzidos `/repositorio` → slug-keys canónicos `/{locale}/repository`) — corrigido em 13 Edits paralelos

### 5.4 Bump + deploy + 4 PDFs (Dia 5)

- Bump Next 14.2.13 → 14.2.35 (latest patched mesmo minor, resolve CVE Dec 2025)
- Deploy Vercel produção (`https://inovcitrus.vercel.app`, alias automático Q3 conseguido)
- 21 endpoints validados (1× 307 + 20× 200)
- `scripts/generate-pdfs.mjs` (~140 linhas) — Chrome headless para 4 PDFs ficha técnica
- 4 PDFs gerados: PT 156 KB · EN 166 KB · ES 171 KB · FR 169 KB (6-7 páginas A4 cada)

### 5.5 Roadmap PDF + kit imprensa (Dia 6)

- `scripts/generate-roadmap-pdf.mjs` (~270 linhas) — Chrome headless para roadmap A4 paisagem
- `output/roadmap-36-meses.pdf` — 147 KB · 1 página A4 paisagem
- `inovcitrus-kit-imprensa/` — 7 ficheiros:
  - `wordmark-inovcitrus.svg` (555 B · colorido com `#C68420` em "InovCitrus")
  - `wordmark-inovcitrus-mono.svg` (555 B · tudo `#000000`)
  - `paleta-swatches.html` (4.7 KB · source HTML)
  - `paleta-swatches.png` (30 KB · 1280×720 · 6 swatches via Chrome screenshot)
  - `press-release-pt.md` (4.7 KB · modelo PT-PT v1.0 preliminar)
  - `press-release-en.md` (4.6 KB · modelo EN equivalente)
  - `README.md` (3.6 KB · instruções de uso para Frusoal)

### 5.6 Acumulado

| Dia | Ficheiros | Linhas / KB | Foco |
|-----|-----------|-------------|------|
| 1 | 8 | ~800 linhas | Conteúdo PT + estrutura + fontes F01-F08 |
| 2 | 18 | ~1.700 linhas | Conteúdo EN/ES/FR + fontes F09-F16 |
| 3 | 17 | ~625 linhas | Identidade visual + Next.js scaffold completo |
| 4 | 1 PROGRESSO + 19 fixes | — | Build + dev + smoke test 18 testes + correcção hrefs |
| 5 | 1 script + 4 PDFs + bump deps | ~140 linhas + 670 KB PDFs | Bump Next 14.2.35 + deploy Vercel + 4 PDFs ficha técnica |
| 6 | 1 script + 7 ficheiros kit + 1 PDF + 1 PROGRESSO | ~270 linhas + 200 KB artefactos | Roadmap PDF visual + kit imprensa completo |
| **Total** | **52+** | **~3.420 linhas + ~870 KB artefactos** | **Pacote casa pública 86% concluído (6/7)** |

---

## 6. Stack técnica e ambiente (versões exactas)

### 6.1 `package.json` actual em `inovcitrus-site/`

```json
{
  "next": "14.2.35",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "tailwindcss": "3.4.10",
  "@tailwindcss/typography": "0.5.15",
  "gray-matter": "4.0.3",
  "remark": "15.0.1",
  "remark-html": "16.0.1",
  "remark-gfm": "4.0.0",
  "typescript": "5.5.4"
}
```

### 6.2 Versões do ambiente requeridas

| Tool | Mínimo | Testado |
|------|--------|---------|
| Node.js | ≥ 18.17 | v22.22.2 |
| npm | ≥ 9.x | 10.9.7 |
| Chrome | qualquer recente | path: `C:\Program Files\Google\Chrome\Application\chrome.exe` |

### 6.3 Vercel autenticação

```bash
npx vercel whoami
# Esperado: euricojsalves-4744
```

### 6.4 Advisories Next 14.2.35 (pós-bump)

2 advisories restantes referem-se a `next/image`, rewrites, RSC HTTP request handling — features **NÃO usadas** neste site (SSG estático puro). Bump major para Next 16.x foi recusado (breaking change). **Não correr `npm audit fix --force` sem aviso.**

---

## 7. URLs produção e endpoints

### 7.1 URLs principais

| URL | Função |
|-----|--------|
| https://inovcitrus.vercel.app | Root (redirect 307 → `/pt`) |
| https://inovcitrus.vercel.app/pt | Home PT |
| https://inovcitrus.vercel.app/en | Home EN |
| https://inovcitrus.vercel.app/es | Home ES |
| https://inovcitrus.vercel.app/fr | Home FR |
| https://vercel.com/euricojsalves-4744s-projects/inovcitrus | Inspector Vercel |

### 7.2 21 endpoints validados em produção

```
/ → 307 (→ /pt)

/{locale} → 200    (4× 200)
/{locale}/project → 200    (4× 200)
/{locale}/structure → 200    (4× 200)
/{locale}/repository → 200    (4× 200)
/{locale}/contacts → 200    (4× 200)
```

### 7.3 Sanity check rápido

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app
# 307

curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app/pt
# 200
```

---

## 8. Plano Dia 7 — comandos exactos

### 8.1 Visão geral

```bash
# A. Press release PT em PDF (1 página A4, baseado em press-release-pt.md)
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
# Criar scripts/generate-press-release-pdf.mjs (ver secção 9)
node scripts/generate-press-release-pdf.mjs

# B. Compilar PARA-IMPRIMIR/ (ver secção 10)
mkdir -p output/PARA-IMPRIMIR
cp output/press-release-pt.pdf output/PARA-IMPRIMIR/1-press-release-pt.pdf
cp output/ficha-tecnica-scirtothrips-pt.pdf output/PARA-IMPRIMIR/2-ficha-tecnica-scirtothrips-pt.pdf
cp output/ficha-tecnica-scirtothrips-en.pdf output/PARA-IMPRIMIR/3-ficha-tecnica-scirtothrips-en.pdf
cp output/ficha-tecnica-scirtothrips-es.pdf output/PARA-IMPRIMIR/4-ficha-tecnica-scirtothrips-es.pdf
cp output/ficha-tecnica-scirtothrips-fr.pdf output/PARA-IMPRIMIR/5-ficha-tecnica-scirtothrips-fr.pdf
cp output/roadmap-36-meses.pdf output/PARA-IMPRIMIR/6-roadmap-36-meses.pdf

# C. README-EURICO.md (ver secção 11)
# Criar em output/PARA-IMPRIMIR/0-README-EURICO.md

# D. PROGRESSO-DIA-7.md
# Criar em 04-landing/PROGRESSO-DIA-7.md (mandatory change log)

# E. RETOMA "pronto para Eurico entregar" (ver secção 12)
# Criar em membros/cliente-frusoal/docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md
```

### 8.2 Output esperado Dia 7

```
04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/
├── 0-README-EURICO.md                       (instruções)
├── 1-press-release-pt.pdf                   (1 página A4)
├── 2-ficha-tecnica-scirtothrips-pt.pdf      (~6 páginas A4)
├── 3-ficha-tecnica-scirtothrips-en.pdf      (~6 páginas A4)
├── 4-ficha-tecnica-scirtothrips-es.pdf      (~7 páginas A4)
├── 5-ficha-tecnica-scirtothrips-fr.pdf      (~7 páginas A4)
└── 6-roadmap-36-meses.pdf                   (1 página A4 paisagem)
```

Total: 7 PDFs · ~30 páginas A4 imprimíveis.

### 8.3 Resoluções Eurico antes de Dia 7

Antes de avançar Dia 7, Eurico deve confirmar (ou alterar):

- **O5**: Aceitar PDFs ficha técnica 6-7 páginas ou pedir condensação? (Default: aceitar)
- **O6**: Lighthouse a11y/perf em `https://inovcitrus.vercel.app/pt` ≥ 95? (Default: aceitar como está)
- **O7**: Roadmap PDF actual OK ou ajustar layout? (Default: aceitar)
- **O8**: Wordmark colorido com citrus-dark ou tudo preto? (Default: aceitar colorido)
- **O2**: Foto sede Tavira disponível? (Default: omitir, manter vago)

Se Eurico aceitar todos os defaults, Dia 7 pode avançar imediatamente. Se quiser ajustes, registar em `PROGRESSO-DIA-7.md` antes de prosseguir.

---

## 9. Como gerar `press-release-pt.pdf` (Dia 7 secção A)

### 9.1 Estratégia

Usar mesmo padrão de `generate-pdfs.mjs` (Dia 5) e `generate-roadmap-pdf.mjs` (Dia 6): Node ESM standalone que lê markdown, renderiza HTML A4, chama Chrome headless `--print-to-pdf`.

### 9.2 Template do script

Criar `inovcitrus-pdfs/scripts/generate-press-release-pdf.mjs`:

```javascript
#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PDF_ROOT = resolve(__dirname, '..');
const SITE_ROOT = resolve(PDF_ROOT, '..', 'inovcitrus-site');
const KIT_DIR = resolve(PDF_ROOT, '..', 'inovcitrus-kit-imprensa');
const OUTPUT_DIR = resolve(PDF_ROOT, 'output');
const TMP_DIR = resolve(PDF_ROOT, '.tmp-html');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PRINT_CSS = `
@page { size: A4; margin: 18mm 18mm 20mm 18mm; }
@media print { html, body { background: #ffffff !important; } }
* { box-sizing: border-box; }
html, body { background: #ffffff; color: #1A1A1A; font-family: 'Inter', sans-serif; font-size: 10.5pt; line-height: 1.55; margin: 0; padding: 0; }
.doc { max-width: 174mm; margin: 0 auto; }
.doc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6pt; border-bottom: 2pt solid #E8A53C; margin-bottom: 14pt; }
.doc-header .wordmark { font-size: 12pt; }
.doc-header .wordmark .frusoal { font-weight: 400; }
.doc-header .wordmark .inovcitrus { font-weight: 800; color: #C68420; }
.doc-header .meta { font-size: 8pt; color: #6B6B6B; letter-spacing: 0.06em; text-transform: uppercase; }
h1 { font-size: 19pt; font-weight: 800; margin: 0 0 8pt 0; line-height: 1.2; }
h2 { font-size: 12pt; font-weight: 700; margin: 14pt 0 4pt 0; padding-bottom: 3pt; border-bottom: 1px solid #E5E2DA; }
p { margin: 5pt 0; color: #3A3A3A; }
strong { color: #1A1A1A; }
a { color: #C68420; text-decoration: none; }
.doc-footer { margin-top: 14pt; padding-top: 6pt; border-top: 1pt solid #E5E2DA; font-size: 8pt; color: #6B6B6B; display: flex; justify-content: space-between; }
`;

async function loadDeps() {
  const m = (rel) => `file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/${rel}`;
  const [matterMod, remarkMod, remarkHtmlMod, remarkGfmMod] = await Promise.all([
    import(m('gray-matter/index.js')),
    import(m('remark/index.js')),
    import(m('remark-html/index.js')),
    import(m('remark-gfm/index.js')),
  ]);
  return {
    matter: matterMod.default ?? matterMod,
    remark: remarkMod.remark ?? remarkMod.default,
    remarkHtml: remarkHtmlMod.default ?? remarkHtmlMod,
    remarkGfm: remarkGfmMod.default ?? remarkGfmMod,
  };
}

async function buildHtml(deps) {
  const mdPath = join(KIT_DIR, 'press-release-pt.md');
  const raw = await readFile(mdPath, 'utf8');
  const { content, data } = deps.matter(raw);
  const processed = await deps.remark().use(deps.remarkGfm).use(deps.remarkHtml).process(content);
  const bodyHtml = processed.toString();

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8" />
<title>${data.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>${PRINT_CSS}</style>
</head><body>
<div class="doc">
  <header class="doc-header">
    <div class="wordmark"><span class="frusoal">Frusoal </span><span class="inovcitrus">InovCitrus</span></div>
    <div class="meta">Press release · v1.0 preliminar</div>
  </header>
  ${bodyHtml}
  <footer class="doc-footer">
    <span>Frusoal InovCitrus · Tavira · Algarve</span>
    <span>frusoal.pt · inovcitrus.vercel.app</span>
  </footer>
</div></body></html>`;
}

function chromePrintToPdf(htmlPath, pdfPath) {
  return new Promise((res, rej) => {
    const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--print-to-pdf-no-header', `--print-to-pdf=${pdfPath}`, `file:///${htmlPath.replaceAll('\\', '/')}`];
    const proc = spawn(CHROME_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', rej);
    proc.on('close', (code) => {
      if (code === 0 && existsSync(pdfPath)) res();
      else rej(new Error(`Chrome exit ${code}; stderr: ${stderr.slice(0, 400)}`));
    });
  });
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
  const deps = await loadDeps();
  const html = await buildHtml(deps);
  const htmlPath = join(TMP_DIR, 'press-release-pt.html');
  const pdfPath = join(OUTPUT_DIR, 'press-release-pt.pdf');
  await writeFile(htmlPath, html, 'utf8');
  await chromePrintToPdf(htmlPath, pdfPath);
  console.log(`✓ ${pdfPath}`);
  await rm(TMP_DIR, { recursive: true, force: true });
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
```

### 9.3 Output esperado

`output/press-release-pt.pdf` — 1-2 páginas A4, ~80-120 KB. Mantém placeholders `[DATA]` `[email]` `[telefone]` — Eurico/Frusoal preenchem antes de envio.

---

## 10. Como compilar `PARA-IMPRIMIR/` envelope físico (Dia 7 secção B)

### 10.1 Estrutura final

```
04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/
├── 0-README-EURICO.md                       (instruções — Eurico abre primeiro)
├── 1-press-release-pt.pdf                   (1-2 páginas A4)
├── 2-ficha-tecnica-scirtothrips-pt.pdf      (~6 páginas A4)
├── 3-ficha-tecnica-scirtothrips-en.pdf      (~6 páginas A4)
├── 4-ficha-tecnica-scirtothrips-es.pdf      (~7 páginas A4)
├── 5-ficha-tecnica-scirtothrips-fr.pdf      (~7 páginas A4)
└── 6-roadmap-36-meses.pdf                   (1 página A4 paisagem)
```

Numeração começa em 0 para o README ficar visível como primeiro item, depois 1-6 na ordem de leitura sugerida (press → fichas → roadmap).

### 10.2 Comandos

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
mkdir -p output/PARA-IMPRIMIR

cp output/press-release-pt.pdf            output/PARA-IMPRIMIR/1-press-release-pt.pdf
cp output/ficha-tecnica-scirtothrips-pt.pdf output/PARA-IMPRIMIR/2-ficha-tecnica-scirtothrips-pt.pdf
cp output/ficha-tecnica-scirtothrips-en.pdf output/PARA-IMPRIMIR/3-ficha-tecnica-scirtothrips-en.pdf
cp output/ficha-tecnica-scirtothrips-es.pdf output/PARA-IMPRIMIR/4-ficha-tecnica-scirtothrips-es.pdf
cp output/ficha-tecnica-scirtothrips-fr.pdf output/PARA-IMPRIMIR/5-ficha-tecnica-scirtothrips-fr.pdf
cp output/roadmap-36-meses.pdf            output/PARA-IMPRIMIR/6-roadmap-36-meses.pdf

# Listar para verificar
ls -la output/PARA-IMPRIMIR/
```

---

## 11. Como criar `README-EURICO.md` final (Dia 7 secção C)

Criar em `output/PARA-IMPRIMIR/0-README-EURICO.md`. Template completo:

```markdown
# Envelope físico — Casa Pública Frusoal InovCitrus

Pacote pronto para entrega ao Pedro Madeira (sócio-gerente Frusoal).

## O que está aqui (ordem de impressão)

| # | Ficheiro | Páginas | Língua |
|---|----------|---------|--------|
| 1 | press-release-pt.pdf | 1-2 | PT |
| 2 | ficha-tecnica-scirtothrips-pt.pdf | ~6 | PT |
| 3 | ficha-tecnica-scirtothrips-en.pdf | ~6 | EN |
| 4 | ficha-tecnica-scirtothrips-es.pdf | ~7 | ES |
| 5 | ficha-tecnica-scirtothrips-fr.pdf | ~7 | FR |
| 6 | roadmap-36-meses.pdf | 1 (A4 paisagem) | PT |

Total: ~30 páginas A4 imprimíveis.

## Sugestão de uso

- Imprime os PDFs em papel branco gramado (idealmente 100g+)
- Mete num envelope A4 sóbrio
- Anexa cartão escrito à mão (estilo Eurico): "Pedro, fizemos isto. Está aqui se fizer sentido. Eurico."
- Entrega em mão ou deixa na recepção da Frusoal em VN Cacela
- URL: https://inovcitrus.vercel.app — Pedro pode aceder no telemóvel/portátil

## Sinais de "abrir porta" pós-entrega

- Pedro responde em <48h
- Pergunta "isto fica?" / "quanto custa?"
- Marca conversa formal

## Sinais de "não está para aí virado"

- Sem resposta em 7 dias → não insistir, não follow-up agressivo
- Eurico encontra-o noutro contexto e não traz o tema → adiar

## Recursos

- Site público: https://inovcitrus.vercel.app
- Fontes consultadas (defesa em Q&A): membros/cliente-frusoal/04-landing/FONTES.md
- Ficheiros source: membros/cliente-frusoal/04-landing/

## Ordem de leitura sugerida pelo Pedro

1. Roadmap 36 meses (primeiro impacto visual · 1 página)
2. Press release (5 segundos para perceber o que é · 1-2 páginas)
3. Ficha técnica PT (utilidade imediata · ~6 páginas)
4. Site (quando Pedro tiver 5 min, abre telemóvel)

## O que NÃO está aqui (intencionalmente)

- Logos InPP, CCDR — não autorizados, substituídos por nome textual
- Foto sede Tavira — sede em construção, sem foto disponível
- Página "equipa" — Pedro decide quem nomear publicamente, não nós
- Datas exactas dos marcos — calendário representativo do desenho trienal
- Preços, propostas, "combos" — isto é trabalho de casa nosso, não venda

---

*Pacote produzido por Eurico (consultor de implementação de IA) entre 23/04 e 25/04 de 2026. Casa pública InovCitrus v1.0 preliminar — aguarda validação formal Frusoal antes de publicação ampla.*
```

---

## 12. Como criar handoff "pronto para Eurico entregar" (Dia 7 secção D)

Criar em `membros/cliente-frusoal/docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md`. Estrutura sugerida:

| Secção | Conteúdo |
|--------|----------|
| Resumo executivo | "Pacote casa pública Frusoal InovCitrus pronto para entrega ao Pedro Madeira. 7 PDFs em PARA-IMPRIMIR/ + site live + 4 línguas. Eurico imprime, mete em envelope, entrega." |
| O que está pronto | Inventário completo Dias 1-7 |
| O que falta fazer (Eurico) | Imprimir, montar envelope, escrever cartão à mão, entregar |
| Decisões consolidadas | Todas resolvidas (D1-D3, Q1-Q5, O1-O8) |
| Sinais pós-entrega | "Abrir porta" vs "não está para aí virado" |
| Próximo passo da relação | Aguardar resposta Pedro (timeout 7 dias) |
| Estado git | Untracked Dias 1-7 — Eurico decide quando commit + push |
| Handoff fecho | Marca o fim do trabalho de casa de Uma — bola passa para Eurico (acção humana) |

Após criar o handoff Dia 7, mover este handoff (Dia 6) para `docs/archive/`.

---

## 13. Erros previsíveis e mitigação

| Erro | Probabilidade | Causa | Mitigação |
|------|---------------|-------|-----------|
| `node_modules/` apagado entre sessões | Baixa | Cleanup ou disco cheio | Re-correr `npm install` em `inovcitrus-site/` |
| Chrome bloqueado por antivirus | Baixa-média | Antivirus paranoico | Tentar Edge (`msedge.exe`) como fallback |
| `gray-matter` import path falha | Baixa | Reorganização node_modules | Verificar caminho `node_modules/gray-matter/index.js` no `SITE_ROOT` |
| Press release PT sai > 2 páginas | Média | Conteúdo extenso | Reduzir tamanho fonte 10.5pt → 10pt ou margens 18mm → 14mm |
| Vercel auth expirou | Baixa | Token renovação | `npx vercel login` |
| PDFs Dia 5/6 não existem ao iniciar Dia 7 | Baixa | Apagados | Re-correr `node scripts/generate-pdfs.mjs` + `generate-roadmap-pdf.mjs` |

---

## 14. Memórias relevantes

| Memória | Relevância para Dia 7 |
|---------|----------------------|
| `feedback_no_more_tools.md` | **Crítica** — usar Chrome headless já existente, NÃO instalar Pandoc/Puppeteer |
| `frusoal-source-of-truth.md` | Press-release PT já lido — só rendering, zero novo conteúdo factual |
| `feedback_nunca_combo_clientes_comerciais.md` | README-EURICO usa linguagem consultiva, zero "combo" |
| `feedback_no_invented_cases.md` | Nada a inventar no Dia 7 — só compilação de artefactos existentes |
| `feedback_governance_never_blocks_execution.md` | Avançar Dia 7 sem pedir aprovações múltiplas |
| `agent-authority.md` | Eurico decide commit · push é exclusivo de `@devops` |
| `handoff-location.md` | Handoff Dia 7 vai em `membros/cliente-frusoal/docs/` |
| `mandatory-change-log.md` | PROGRESSO-DIA-7.md regista comandos exactos |

---

## 15. Erros que NÃO podem repetir

| Erro | Origem | Como evitar Dia 7 |
|------|--------|-------------------|
| "Combo" / linguagem vendor | 23/04 | README-EURICO já validado · usar mesmo tom |
| Inventar conteúdo factual | Sistémico | Press-release PT já existe — não adicionar nada novo |
| Logos InPP/CCDR sem autorização | Risco actual | Já documentado no README-EURICO secção "O que NÃO está aqui" |
| Instalar ferramentas novas | Dia 5 (resolvido) | Chrome headless já validado para PDF gen |
| Inventar datas exactas marcos | Risco actual | Roadmap já tem disclaimer "Calendário representativo" |
| Slugs traduzidos em URLs | Dia 4 (resolvido) | Não tocado no Dia 7 |
| Avançar sem ler prompt original | Sistémico | Secção 2.2 deste handoff |

---

## 16. Fontes F01-F16 — URLs exactos (rastreabilidade)

Lista preservada do Dia 5 — fontes não mudaram no Dia 6:

| ID | Fonte | URL completo | Data consulta |
|----|-------|--------------|----------------|
| F01 | Postal do Algarve — lançamento InovCitrus | https://postal.pt/edicaopapel/frusoal-lanca-centro-de-id-para-a-citricultura-e-avanca-com-estudo-sobre-praga-nos-pomares-do-algarve/ | 23/04/2026 |
| F02 | DRAP Algarve — praga emergente PDF | https://www.drapalgarve.gov.pt/images/destaques/Praga_de_introd_recente_-_Citrinos_Algarve.pdf | 23/04/2026 |
| F03 | AJAP — sessão técnica DGAV/DRAP | https://ajap.pt/sessao-sobre-a-nova-praga-de-quarentena-scirtothrips-aurantii/ | 23/04/2026 |
| F04 | Site oficial Frusoal | https://www.frusoal.pt/ | 23/04/2026 |
| F05 | Site InovPlantProtect | https://iplantprotect.pt/produtos-e-servicos/ | 24/04/2026 |
| F06 | Frusoal Fruit Fly Protec | https://www.frusoal.pt/fruit-fly-protec/ | 23/04/2026 |
| F07 | Prompt original | `membros/cliente-frusoal/prompt-original.md` | sempre disponível |
| F08 | InovCitrus.txt (síntese factual) | `membros/cliente-frusoal/InovCitrus.txt` | 24/04/2026 |
| F09 | EPPO Global Database overview | https://gd.eppo.int/taxon/SCITAU | 25/04/2026 |
| F10 | EPPO Datasheet completa | https://gd.eppo.int/taxon/SCITAU/datasheet | 25/04/2026 |
| F11 | EFSA Pest categorisation 2018 | https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5188 | 25/04/2026 |
| F12 | Junta de Andalucía RAIF | https://www.juntadeandalucia.es/agriculturapescaaguaydesarrollorural/raif/scirtothrips-aurantii-faure/ | 25/04/2026 |
| F13 | BOJA Resolución 13/12/2020 | https://www.juntadeandalucia.es/boja/2020/244/40.html | 25/04/2026 |
| F14 | Plan Nacional Contingencia MAPA 2024 | https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/organismos-nocivos/otras-plagas-cuarentena/ | 25/04/2026 |
| F15 | CABI Compendium | https://www.cabidigitallibrary.org/doi/abs/10.1079/cabicompendium.49061 | 25/04/2026 |
| F16 | Reglamento UE 2019/2072 Anexo II Parte A | publications.europa.eu (citação regulatória) | 25/04/2026 |

---

## 17. Compromissos finais (Dia 7)

| Compromisso | Cumprimento |
|-------------|--------------|
| Cada afirmação rastreada a fonte | ✓ Dias 1-2 + cross-check Dia 7 |
| Site Vercel funcional 4 línguas | ✓ Dia 5 — `https://inovcitrus.vercel.app` |
| 4 PDFs ficha técnica imprimíveis | ✓ Dia 5 |
| Roadmap PDF visual | ✓ Dia 6 |
| Kit imprensa | ✓ Dia 6 |
| Press release PT em PDF | Dia 7 |
| Envelope físico compilado (PARA-IMPRIMIR/) | Dia 7 |
| README-EURICO.md final | Dia 7 |
| Handoff "pronto para Eurico entregar" | Dia 7 |
| Zero invenção · zero "em nome da InPP" · zero logos não-autorizados | ✓ Sempre |
| Zero ferramentas novas instaladas | ✓ Dias 5+6 (cumprido) — manter no Dia 7 |

---

## 18. Troubleshooting frequente (FAQ)

### Q: Press release PT sai > 2 páginas A4

A: Reduzir font-size de 10.5pt → 10pt OU margens de 18mm → 14mm em `PRINT_CSS` do `generate-press-release-pdf.mjs`. Se ainda sair > 2 páginas, condensar conteúdo do `press-release-pt.md` removendo parágrafos opcionais (e.g. encurtar "Sobre a Frusoal").

### Q: Eurico decidiu condensar PDFs ficha técnica para 4-5 páginas (O5)

A: Editar `generate-pdfs.mjs`:
- Linha PRINT_CSS `font-size: 10.5pt` → `font-size: 10pt`
- Linha PRINT_CSS `@page { margin: 18mm 16mm 20mm 16mm }` → `margin: 14mm 14mm 16mm 14mm`
- Re-correr `node scripts/generate-pdfs.mjs`
- Verificar páginas com `pdfinfo` ou abrir em Acrobat

### Q: Eurico decidiu wordmark tudo preto (O8)

A: Editar `wordmark-inovcitrus.svg`:
- Trocar `fill="#C68420"` → `fill="#1A1A1A"` na tag `<text>` "InovCitrus"
- Re-gerar paleta-swatches.png se quiser que reflicta no header

### Q: Como adicionar foto sede Tavira (O2) ao envelope

A:
1. Eurico passa foto em `04-landing/inovcitrus-kit-imprensa/foto-sede-tavira.jpg`
2. Criar página A4 simples com foto + caption "Sede em construção em Tavira" + footer institucional
3. Adicionar ao PARA-IMPRIMIR/ como `7-foto-sede-tavira.pdf`
4. Actualizar README-EURICO.md tabela

### Q: Como criar `PROGRESSO-DIA-7.md` correctamente

A: Mesmo formato dos Dias 1-6. Estrutura:
1. Sessão (data, agente, foco, bloqueador)
2. Comandos executados (cronológico)
3. Decisões resolvidas no Dia 7 (O5/O6/O7/O8 etc.)
4. Ficheiros criados/modificados
5. Validações cumpridas (regras seguidas)
6. Estado acumulado Dias 1-7
7. Próximos passos (que agora ficam com Eurico — humano)

### Q: Quando criar handoff Dia 7?

A: Imediatamente após `PARA-IMPRIMIR/` estar compilado e `0-README-EURICO.md` validado. Marca formalmente o "trabalho de casa de Uma terminou — bola passa para Eurico".

---

## 19. Estado git e o que falta fazer commit

### 19.1 Estado actual

```bash
$ git status --porcelain membros/cliente-frusoal/
?? membros/cliente-frusoal/
```

**TODA a pasta `membros/cliente-frusoal/` continua untracked.** Trabalho dos Dias 1-6 (e Dia 7 quando feito) NÃO foi committed ainda. Agente Dia 7 deve **NÃO fazer commit sem ordem explícita do Eurico** (regra `agent-authority.md` — apenas `@devops` faz push, e neste caso `@dev` pode fazer commit local mas não push).

### 19.2 Quando Eurico aprovar para commit

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt

# Verificar gitignores excluem node_modules/, .next/, .vercel/
cat membros/cliente-frusoal/04-landing/inovcitrus-site/.gitignore

# Stage tudo da Frusoal
git add membros/cliente-frusoal/

# Commit (delegar a @devops para push)
git commit -m "feat(frusoal): pacote casa pública InovCitrus v1 — site live + 5 PDFs + roadmap + kit imprensa + envelope físico

Dias 1-7: 5 páginas × 4 línguas + ficha técnica × 4 + roadmap data + scaffold + build + deploy
Dia 5: bump Next 14.2.35 + deploy Vercel + 4 PDFs ficha técnica
Dia 6: roadmap PDF + kit imprensa (wordmarks + paleta + press releases)
Dia 7: press release PDF + PARA-IMPRIMIR/ + README-EURICO

Site live: https://inovcitrus.vercel.app
PDFs: 04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/

Constraint: prompt-original.md fonte da verdade
Constraint: zero \"em nome da InPP\" (decisão D3)
Constraint: zero ferramentas novas instaladas (Chrome headless reutilizado)
Confidence: high
Scope-risk: narrow"

# @devops faz push depois (não obrigatório — pacote é entregue offline)
```

### 19.3 Estrutura de commits sugerida (alternativa granular — 1 commit por dia)

Detalhada na secção 21.4 do handoff Dia 5. Não repetir aqui — referência cruzada.

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER OUTPUT FRUSOAL, LER:
1. `.claude/rules/frusoal-source-of-truth.md`
2. `membros/cliente-frusoal/prompt-original.md`
3. **Este handoff integralmente**
4. `04-landing/FONTES.md`
5. `04-landing/PROGRESSO-DIA-{1,2,3,4,5,6}.md`

VIOLAÇÃO = PARAR · DESCARTAR · REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-6-roadmap-kit-imprensa-pronto-proximo-dia-7.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-6-roadmap-kit-imprensa-pronto-proximo-dia-7.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026
