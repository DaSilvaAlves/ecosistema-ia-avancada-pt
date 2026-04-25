# RETOMA — Frusoal InovCitrus: Dia 5 entregue, site live em produção, 4 PDFs ficha técnica gerados, próximo Dia 6 (roadmap visual + kit imprensa)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

> **ESTE HANDOFF É AUTO-SUFICIENTE.** Foi escrito para um agente em terminal fresh, sem contexto da conversa, conseguir continuar Dias 6-7 sem precisar de inventar nem perguntar. Se algo aqui contradiz outro documento, este prevalece (mais recente).

---

## Índice

1. Resumo executivo
2. Primeira acção do próximo agente — passo a passo obrigatório
3. Decisões consolidadas (D1-D3, Q1-Q5, O1-O6) com razão
4. Princípios inegociáveis (recapitulados)
5. Estado completo Dias 1+2+3+4+5 (inventário ficheiro a ficheiro)
6. Stack técnica (versões exactas pós-bump)
7. Estrutura completa de pastas pós-Dia 5
8. URLs produção e endpoints
9. Identidade visual — tokens, paleta, tipografia (recapitulação)
10. Bug fix Dia 4 — hrefs internos (referência histórica)
11. Plano restante Dias 6-7 — comandos exactos
12. Como gerar roadmap PDF visual 36 meses (Dia 6 secção A)
13. Como criar kit imprensa (Dia 6 secção B)
14. Como compilar o envelope físico de entrega (Dia 7)
15. Erros previsíveis e mitigação
16. Memórias relevantes (lista completa de leitura obrigatória)
17. Erros que NÃO podem repetir (acumulado de 5 sessões)
18. Fontes F01-F16 — URLs exactos
19. Compromissos finais
20. Troubleshooting frequente (FAQ)
21. Estado git e o que falta fazer commit

---

## 1. Resumo executivo

Sessão 25/04/2026 (continuação imediata após Dia 4) executou Dia 5 do Pacote Casa Pública Frusoal InovCitrus. **Bump Next 14.2.13 → 14.2.35** (latest patched do mesmo minor — resolve CVE security advisory Dec 2025). **Deploy Vercel em produção** com URL alias `https://inovcitrus.vercel.app` (Q3 default conseguido — Eurico está autenticado como `euricojsalves-4744`). **21 endpoints validados em produção** (1× 307 + 20× 200). **4 PDFs ficha técnica gerados** via Chrome headless (zero ferramentas novas instaladas — cumpre `feedback_no_more_tools.md`). Total Dia 5: 1 ficheiro novo (`scripts/generate-pdfs.mjs`), 4 PDFs (156-171 KB cada, 6-7 páginas A4), `package.json` bumpado, deploy Vercel link criado. **Próximo:** Dia 6 = roadmap PDF 36 meses (1 página A4 paisagem) + kit imprensa (wordmark SVG, press release modelo, paleta swatches); Dia 7 = revisão final + envelope físico + handoff entrega.

**Acumulado dos 5 dias:** 44+ ficheiros · ~3.150+ linhas conteúdo · 4 línguas · 20 rotas estáticas em produção · 4 PDFs imprimíveis · zero invenção · zero "em nome da InPP".

---

## 2. Primeira acção do próximo agente — passo a passo obrigatório

**ORDEM EXACTA. NÃO SALTAR PASSOS. NÃO INVENTAR.**

### 2.1 Activação

1. Activar `@ux-design-expert` (Uma) — continuidade directa
2. Reportar ao utilizador: **"Detectei handoff pending RETOMA-20260425 Dia 5 Frusoal InovCitrus — site live em https://inovcitrus.vercel.app, 4 PDFs OK. Vou avançar Dia 6 = roadmap visual + kit imprensa."**

### 2.2 Leitura obrigatória antes de qualquer código

Por esta ordem exacta:

1. `.claude/rules/frusoal-source-of-truth.md` — regra inegociável
2. `.claude/rules/handoff-location.md` — regra handoff
3. `.claude/rules/handoff-central.md` — protocolo cross-terminal
4. `membros/cliente-frusoal/prompt-original.md` — posicionamento "consultor de implementação de IA"
5. **Este handoff integralmente** (RETOMA-20260425-dia-5-site-live-pdfs-ok-proximo-dia-6.md)
6. `membros/cliente-frusoal/04-landing/FONTES.md` — F01-F16 com URLs
7. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-1.md`
8. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-2.md`
9. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-3.md`
10. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-4.md`
11. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-5.md`
12. `membros/cliente-frusoal/04-landing/inovcitrus-site/README.md`
13. `membros/cliente-frusoal/04-landing/inovcitrus-pdfs/roadmap/roadmap-data.json` (input do Dia 6 secção A)
14. `membros/cliente-frusoal/04-landing/inovcitrus-pdfs/scripts/generate-pdfs.mjs` (template para script Dia 6)

### 2.3 Verificação ambiente

```bash
node --version       # >= 18.17 (testado v22.22.2 OK)
npm --version        # qualquer versão recente (testado 10.9.7 OK)

# Chrome para PDF gen
ls -la "/c/Program Files/Google/Chrome/Application/chrome.exe"
# Deve existir. Caso contrário, fallback Edge:
ls -la "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

# Vercel CLI já instalado e autenticado como euricojsalves-4744
npx vercel whoami
```

Se Chrome não existe e Edge sim, alterar `CHROME_PATH` no script Dia 6 para o path do msedge.exe.

### 2.4 Verificação estado actual antes de tocar em algo

```bash
# Site live funciona?
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app
# Esperado: 307 (redirect /pt)

curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app/pt
# Esperado: 200

# 4 PDFs existem?
ls -la /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/output/
# Esperado: 4 ficheiros .pdf, ~150-180 KB cada
```

Se algum destes falha → PARAR e diagnosticar antes de Dia 6. Provavelmente Eurico precisa de fazer algo manualmente.

### 2.5 Comandos Dia 6 (resumo — detalhes nas secções 12-13)

```bash
# A. Roadmap PDF 36 meses (1 página A4 paisagem)
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
node scripts/generate-roadmap-pdf.mjs   # criar este script — ver secção 12

# B. Kit imprensa
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/
mkdir -p inovcitrus-kit-imprensa
# criar 6+ ficheiros — ver secção 13
```

### 2.6 Reportar ao Eurico

Após Dia 6 completo apresentar:
- Roadmap PDF aberto
- Kit imprensa listado (`ls inovcitrus-kit-imprensa/`)
- Wordmark SVG visualizado
- Próximo passo (Dia 7: revisão final + envelope físico + handoff entrega)

### 2.7 Criar `PROGRESSO-DIA-6.md`

Mesmo formato dos Dias 1-5. Em `04-landing/PROGRESSO-DIA-6.md`. Decisões resolvidas (O5? O6?) registadas.

### 2.8 Quando Eurico aprovar visualmente, avançar Dia 7

(Ver secção 14 — envelope físico.)

---

## 3. Decisões consolidadas (preservadas, inegociáveis)

| ID | Decisão | Origem | Razão | Estado |
|----|---------|--------|-------|--------|
| **D1** | Pacote completo 7 dias úteis (Site + Ficha técnica 4 línguas + Roadmap 36 meses) | Eurico 25/04/2026 | "Trabalho de casa entregue gera curiosidade que abre porta. Pedro não tem tempo para conversa de café com promessa." | Em execução — 5/7 dias entregues |
| **D2** | Hosting Vercel | Eurico 25/04/2026 | Custo zero · deploy automático · sem registo `.pt` | ✓ Resolvido Dia 5 (alias `inovcitrus.vercel.app`) |
| **D3** | Mostrar a Pedro **primeiro**, depois à InPP | Eurico 25/04/2026 | Pedro é o cliente, decide como/quando comunicar com InPP. **Implicação: zero "em nome da InPP". Logos InPP/CCDR proibidos até autorização formal.** | Em vigor permanente |
| **Q1** | Wordmark tipográfico Frusoal-aligned, sem ícone, Inter weights 400/700 | Default aceite Dia 1 | Sóbrio, harmoniza com Frusoal, escala em PDFs | ✓ Implementado Dia 3 |
| **Q2** | Página "Equipa" omitida, substituída por "Estrutura" (só entidades) | Default aceite Dia 1 | Postal não menciona nomes técnicos do polo I&D — não inventar | ✓ Implementado Dia 1 |
| **Q3** | URL Vercel: tentar `inovcitrus.vercel.app` primeiro | Default aceite Dia 1 | Confirmar disponibilidade no Dia 5 | ✓ Resolvido Dia 5 — `inovcitrus.vercel.app` conseguido |
| **Q4** | Página "Sede" vaga: "em construção em Tavira", sem morada/foto | Default aceite Dia 1 | Postal só refere "Tavira" — não inventar | ✓ Implementado Dia 1 (presente nas 4 línguas) |
| **Q5** | Não registar `inovcitrus.pt` agora | Default aceite Dia 1 | Custo zero. Se Pedro avançar, regista-se depois (15€/ano) | Em vigor |
| **O1** | Identidade visual InovCitrus | Resolvido Dia 3 | Wordmark Inter tipográfico (Q1 default) | ✓ |
| **O2** | Foto da sede em construção em Tavira | Pendente | Eurico passa foto se houver, antes de Dia 6 | ⚠ Pendente (default: omitir foto, manter vago) |
| **O3** | URL Vercel exacto | Resolvido Dia 5 | `inovcitrus.vercel.app` conseguido como alias automático | ✓ |
| **O4** | Bump Next CVE | Resolvido Dia 5 | 14.2.13 → 14.2.35 (latest patched mesmo minor) | ✓ |
| **O5** (novo Dia 5) | PDFs ficha técnica saíram 6-7 páginas A4 (RETOMA estimava 4) | Pendente Eurico | Eurico decide: aceitar 6-7 ou condensar para 4-5 (font 10.5pt → 10pt, margens 18mm → 14mm) | ⚠ Pendente |
| **O6** (novo Dia 5) | Lighthouse a11y/perf scores em produção | Pendente Eurico | Validar `https://inovcitrus.vercel.app/pt` no Chrome DevTools, alvo a11y ≥ 95 | ⚠ Pendente |

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
- **Zero ferramentas novas no PC** — cumpre `feedback_no_more_tools.md`. Pandoc/MiKTeX/Puppeteer/Chromium *foram considerados e recusados* (ver Dia 5).

---

## 5. Estado completo Dias 1+2+3+4+5 (inventário ficheiro a ficheiro)

### 5.1 Dia 1 (8 ficheiros, ~800 linhas) — Conteúdo PT + estrutura + fontes

| Caminho | Linhas | Função |
|---------|--------|--------|
| `04-landing/FONTES.md` | 110 (final) | Rastreabilidade global F01-F16 |
| `04-landing/PROGRESSO-DIA-1.md` | 100 | Mandatory change log Dia 1 |
| `04-landing/inovcitrus-site/content/pt/01-home.md` | 65 | Home PT |
| `04-landing/inovcitrus-site/content/pt/02-projecto-trienal.md` | 113 | Projecto trienal PT |
| `04-landing/inovcitrus-site/content/pt/03-estrutura-parceiros.md` | 91 | Estrutura PT |
| `04-landing/inovcitrus-site/content/pt/04-repositorio.md` | 82 | Repositório PT |
| `04-landing/inovcitrus-site/content/pt/05-contactos.md` | 71 | Contactos PT |
| `04-landing/inovcitrus-pdfs/source/pt/ficha-tecnica-scirtothrips-pt.md` | 158 | Ficha técnica PT |
| `04-landing/inovcitrus-pdfs/roadmap/roadmap-data.json` | 152 | Dados roadmap 36 meses (12 marcos × 23 actos) |

### 5.2 Dia 2 (18 ficheiros, ~1.700 linhas) — Traduções EN/ES/FR

15 páginas (3 línguas × 5) + 3 fichas técnicas + PROGRESSO-DIA-2.md.

Fichas técnicas EN/ES/FR ancoradas em fontes regionais oficiais:
- EN: EPPO/EFSA terminology (F09, F10, F11, F15)
- ES: RAIF Junta de Andalucía + MAPA + BOJA 2020 (F12, F13, F14)
- FR: OEPP terminology (F09)

### 5.3 Dia 3 (17 ficheiros, ~625 linhas) — Identidade visual + Next.js scaffold

Configurações + lib + componentes + app routes + README. Ver PROGRESSO-DIA-3.md para inventário completo.

### 5.4 Dia 4 (1 ficheiro novo + 19 fixes em 11 markdowns) — Build + smoke test + bug fix

| Caminho | Acção |
|---------|-------|
| `04-landing/PROGRESSO-DIA-4.md` | Novo, ~250 linhas |
| `inovcitrus-site/content/pt/01-home.md` | 2 hrefs corrigidos (linhas 54, 67) |
| `inovcitrus-site/content/pt/02-projecto-trienal.md` | 2 hrefs corrigidos (96, 107) |
| `inovcitrus-site/content/pt/03-estrutura-parceiros.md` | 2 hrefs corrigidos (94, 100) |
| `inovcitrus-site/content/pt/04-repositorio.md` | 1 href corrigido (85) |
| `inovcitrus-site/content/en/01-home.md` | 1 href corrigido (55) |
| `inovcitrus-site/content/es/01-home.md` | 2 hrefs corrigidos (55, 68) |
| `inovcitrus-site/content/es/02-projecto-trienal.md` | 2 hrefs corrigidos (100, 111) |
| `inovcitrus-site/content/es/03-estrutura-parceiros.md` | 2 hrefs corrigidos (95, 101) |
| `inovcitrus-site/content/es/04-repositorio.md` | 1 href corrigido (86) |
| `inovcitrus-site/content/fr/01-home.md` | 1 href corrigido (55) |
| `inovcitrus-site/content/fr/02-projecto-trienal.md` | 1 href corrigido (99) |
| `inovcitrus-site/content/fr/03-estrutura-parceiros.md` | 2 hrefs corrigidos (95, 101) |

19 hrefs total. Detalhes na secção 10.

Plus runtime artifacts (gitignored): `node_modules/`, `package-lock.json`, `.next/`.

### 5.5 Dia 5 (5 ficheiros novos + bump deps) — Bump + Vercel deploy + 4 PDFs

| Caminho | Acção | Tamanho |
|---------|-------|---------|
| `inovcitrus-site/package.json` | next: 14.2.13 → 14.2.35 | 1 linha alterada |
| `inovcitrus-site/package-lock.json` | regenerado | — |
| `inovcitrus-site/.vercel/` | criado pelo Vercel CLI (project link) | — |
| `inovcitrus-pdfs/scripts/generate-pdfs.mjs` | novo — Node ESM script PDF gen | 140 linhas |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-pt.pdf` | novo, ~6 páginas A4 | 156 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-en.pdf` | novo, ~6 páginas A4 | 166 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-es.pdf` | novo, ~7 páginas A4 | 171 KB |
| `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-fr.pdf` | novo, ~7 páginas A4 | 169 KB |
| `04-landing/PROGRESSO-DIA-5.md` | novo | ~200 linhas |

### 5.6 Acumulado

| Dia | Ficheiros | Linhas conteúdo | Status |
|-----|-----------|------------------|--------|
| 1 | 8 | ~800 | ✓ |
| 2 | 18 | ~1.700 | ✓ |
| 3 | 17 | ~625 | ✓ |
| 4 | 1 + 19 fixes | ~250 | ✓ |
| 5 | 1 (script) + 4 PDFs + bump + 1 progresso | ~340 + 4 PDFs | ✓ |
| **Total** | **44+ ficheiros** | **~3.150+ linhas + 4 PDFs + site live** | **5/7 dias** |

---

## 6. Stack técnica (versões exactas pós-bump Dia 5)

### 6.1 `package.json` actual em `inovcitrus-site/`

```json
{
  "dependencies": {
    "next": "14.2.35",                  ← BUMPED Dia 5 (era 14.2.13)
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "gray-matter": "4.0.3",
    "remark": "15.0.1",
    "remark-html": "16.0.1",
    "remark-gfm": "4.0.0"
  },
  "devDependencies": {
    "@types/node": "20.16.0",
    "@types/react": "18.3.5",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.20",
    "postcss": "8.4.45",
    "tailwindcss": "3.4.10",
    "@tailwindcss/typography": "0.5.15",
    "typescript": "5.5.4"
  }
}
```

### 6.2 Versões do ambiente requeridas

| Componente | Versão mínima | Testado |
|-----------|----------------|---------|
| Node.js | ≥ 18.17 | v22.22.2 |
| npm | ≥ 9 | 10.9.7 |
| OS | Windows / macOS / Linux | Windows 11 |
| Browser para PDF gen | Chrome ou Edge headless | Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Vercel CLI | qualquer recente | 51.2.1 |

### 6.3 Vercel autenticação

Account: `euricojsalves-4744`. Já autenticado. Project criado: `inovcitrus`. Linked em `inovcitrus-site/.vercel/`. Para redeploy: `npx vercel --prod` (sem mais prompts).

### 6.4 Advisories Next 14.2.35 (pós-bump)

`npm audit` reporta 2 advisories restantes referentes a:
- `next/image` runtime (DoS via remotePatterns, unbounded disk cache)
- HTTP request smuggling em rewrites
- RSC HTTP request deserialization

**TODAS estas features NÃO são usadas neste site** (SSG estático puro, sem next/image, sem rewrites, sem APIs runtime). Bump major para Next 16.x é breaking change com risco maior. Decisão Dia 5: ficar em 14.2.35.

Se Eurico mudar de ideias e quiser bump major: ver `npm audit fix --force` mas requer testes adicionais (App Router tem mudanças entre 14 e 15/16).

---

## 7. Estrutura completa de pastas pós-Dia 5

```
membros/cliente-frusoal/
├── prompt-original.md                              ← FONTE DA VERDADE (não tocar)
├── claude-pesquisa.txt                             ← Pesquisa LLM (37K, base v1)
├── preplexity-pesquisa.txt                         ← Pesquisa LLM (42K, base v1)
├── gpt-pesquisa.txt                                ← Pesquisa LLM (5K, base v1)
├── dossier-frusoal-v1.md                           ← Dossier consolidado (válido)
├── InovCitrus.txt                                  ← Análise factual InovCitrus
├── 02-prd/
│   └── archive/
│       └── prd-v2-obsoleto-pre-descoberta-inpp.md
├── 04-landing/                                     ← TRABALHO ACTIVO Dias 1-7
│   ├── FONTES.md                                   ← F01-F16 (110 linhas)
│   ├── PROGRESSO-DIA-1.md
│   ├── PROGRESSO-DIA-2.md
│   ├── PROGRESSO-DIA-3.md
│   ├── PROGRESSO-DIA-4.md
│   ├── PROGRESSO-DIA-5.md                          ← Dia 5 ✓
│   ├── inovcitrus-site/                            ← Next.js project DEPLOYED
│   │   ├── package.json (next 14.2.35)
│   │   ├── package-lock.json
│   │   ├── tsconfig.json · next.config.mjs
│   │   ├── postcss.config.mjs · tailwind.config.ts
│   │   ├── vercel.json · .gitignore · README.md
│   │   ├── .vercel/                                ← Vercel project link (gitignored)
│   │   ├── node_modules/                           ← gitignored
│   │   ├── .next/                                  ← gitignored (build artefactos)
│   │   ├── content/
│   │   │   ├── pt/  (5 .md, hrefs corrigidos Dia 4)
│   │   │   ├── en/  (5 .md, hrefs corrigidos Dia 4)
│   │   │   ├── es/  (5 .md, hrefs corrigidos Dia 4)
│   │   │   └── fr/  (5 .md, hrefs corrigidos Dia 4)
│   │   ├── public/                                 ← Vazio (Dia 6 entra wordmark SVG se aplicável)
│   │   └── src/
│   │       ├── lib/{i18n,content}.ts
│   │       ├── components/{Wordmark,Header,Footer,LanguageSwitcher,MarkdownContent}.tsx
│   │       └── app/
│   │           ├── layout.tsx · page.tsx · globals.css
│   │           └── [locale]/
│   │               ├── layout.tsx · page.tsx
│   │               └── [slug]/page.tsx
│   ├── inovcitrus-pdfs/
│   │   ├── source/
│   │   │   ├── pt/ficha-tecnica-scirtothrips-pt.md
│   │   │   ├── en/ficha-tecnica-scirtothrips-en.md
│   │   │   ├── es/ficha-tecnica-scirtothrips-es.md
│   │   │   └── fr/ficha-tecnica-scirtothrips-fr.md
│   │   ├── roadmap/
│   │   │   └── roadmap-data.json                   ← Input do Dia 6 secção A
│   │   ├── scripts/
│   │   │   ├── generate-pdfs.mjs                   ← Dia 5 ✓
│   │   │   └── generate-roadmap-pdf.mjs            ← Dia 6 (criar)
│   │   └── output/                                  ← 4 PDFs ficha técnica ✓ + roadmap pendente
│   │       ├── ficha-tecnica-scirtothrips-pt.pdf  (156 KB)
│   │       ├── ficha-tecnica-scirtothrips-en.pdf  (166 KB)
│   │       ├── ficha-tecnica-scirtothrips-es.pdf  (171 KB)
│   │       └── ficha-tecnica-scirtothrips-fr.pdf  (169 KB)
│   └── inovcitrus-kit-imprensa/                    ← VAZIO — Dia 6 secção B preenche
└── docs/
    ├── RETOMA-20260425-dia-5-site-live-pdfs-ok-proximo-dia-6.md   ← ESTE handoff
    └── archive/
        ├── RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md
        ├── RETOMA-20260425-dia-1-pacote-completo-conteudo-pt.md
        ├── RETOMA-20260425-dia-2-traducoes-en-es-fr-completas.md
        └── RETOMA-20260425-dia-3-scaffold-nextjs-pronto-para-build.md
```

---

## 8. URLs produção e endpoints

### 8.1 URLs principais

| Recurso | URL |
|---------|-----|
| **Site produção (alias)** | **https://inovcitrus.vercel.app** |
| Site produção (deployment URL) | https://inovcitrus-e06vid67v-euricojsalves-4744s-projects.vercel.app |
| Vercel inspector | https://vercel.com/euricojsalves-4744s-projects/inovcitrus/E1khiU7pKxdqD3EE5CPkBEpMR1Gi |
| Deployment ID | `dpl_E1khiU7pKxdqD3EE5CPkBEpMR1Gi` |

### 8.2 21 endpoints validados em produção (1× 307 + 20× 200)

```
/                       → 307 (redirect /pt)
/pt                     → 200    /pt/project    → 200
/pt/structure           → 200    /pt/repository → 200
/pt/contacts            → 200
/en                     → 200    /en/project    → 200
/en/structure           → 200    /en/repository → 200
/en/contacts            → 200
/es                     → 200    /es/project    → 200
/es/structure           → 200    /es/repository → 200
/es/contacts            → 200
/fr                     → 200    /fr/project    → 200
/fr/structure           → 200    /fr/repository → 200
/fr/contacts            → 200
```

### 8.3 Sanity check rápido

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app/pt
# Esperado: 200, ~300-400ms response time
```

---

## 9. Identidade visual — tokens, paleta, tipografia (recapitulação)

### 9.1 Paleta Tailwind (alinhada com `frusoal.pt`)

| Token | Valor hex | Uso |
|-------|-----------|-----|
| `citrus` | `#E8A53C` | Primário — laranja citrino maduro |
| `citrus-dark` | `#C68420` | Hover, links activos, destaque |
| `citrus-light` | `#F5C570` | Backgrounds suaves |
| `algarve` | `#5A8C45` | Secundário — verde algarvio sóbrio |
| `algarve-dark` | `#3F6A2E` | Variante escura |
| `algarve-light` | `#8AB16C` | Variante clara |
| `ink` | `#1A1A1A` | Texto principal (headings) |
| `ink-muted` | `#3A3A3A` | Texto corpo |
| `ink-subtle` | `#6B6B6B` | Metadados, footer copyright |
| `surface` | `#FFFFFF` | Cards, header bg |
| `surface-warm` | `#FAF8F4` | Body bg (off-white quente) |
| `surface-border` | `#E5E2DA` | Linhas, divisores |

### 9.2 Tipografia

| Família | Pesos | Carregamento |
|---------|-------|--------------|
| **Inter** | 400, 500, 600, 700, 800 | Google Fonts via `globals.css` |
| **JetBrains Mono** | 400, 500 | Google Fonts (uso raro — código) |

### 9.3 Wordmark

```
[Frusoal regular 400] [InovCitrus bold 700]
```

Cor header: `text-ink` (com hover `text-citrus-dark`)
Cor footer: `text-ink-muted`
Sem ícone. Sem decoração.

### 9.4 PDFs (CSS print)

- Fonte body: Inter 10.5pt (Google Fonts via @import)
- Page A4, margens 18mm/16mm/20mm/16mm
- Header com wordmark + linha laranja-citrino `#E8A53C` 2pt
- H1 22pt extrabold · H2 14pt bold com border-bottom suave
- Tabelas `<th>` em background `#FAF8F4`
- Links em `#C68420`
- Blockquote com border-left `#E8A53C` 3pt
- Footer com `frusoal.pt` + "Tavira · Algarve"

---

## 10. Bug fix Dia 4 — hrefs internos (referência histórica)

Causa raiz: markdowns Dias 1+2 usavam slugs traduzidos (`/repositorio`, `/es/proyecto-trienal`, `/fr/referentiel`), mas scaffold Dia 3 fixou slug-keys canónicos em inglês (`project`, `structure`, `repository`, `contacts`).

19 hrefs corrigidos em 11 markdowns. Validado pós-fix com curl + grep. Build re-passou. Detalhes em PROGRESSO-DIA-4.md.

**Pertinente para Dia 6:** se acrescentares conteúdo novo nos markdowns, **usa sempre `/{locale}/{slug-key-canónico}`** (ex: `/pt/project`, `/en/repository`). Nunca traduzas o slug na URL.

---

## 11. Plano restante Dias 6-7 — comandos exactos

### 11.1 Dia 6 — Roadmap PDF visual + kit imprensa

```bash
# A. Roadmap visual 36 meses
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/

# Criar scripts/generate-roadmap-pdf.mjs (ver secção 12)
# Correr:
node scripts/generate-roadmap-pdf.mjs

# Output: output/roadmap-36-meses.pdf (1 página A4 paisagem)

# B. Kit imprensa
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/
mkdir -p inovcitrus-kit-imprensa

# Criar 6+ ficheiros (ver secção 13):
# - wordmark-inovcitrus.svg
# - wordmark-inovcitrus-mono.svg
# - press-release-pt.md
# - press-release-en.md
# - paleta-swatches.html (gera PNG via Chrome)
# - README.md

# C. Criar PROGRESSO-DIA-6.md
```

**Output esperado Dia 6:**
- `inovcitrus-pdfs/output/roadmap-36-meses.pdf` (1 página A4 paisagem)
- `inovcitrus-kit-imprensa/` com 6+ ficheiros
- `PROGRESSO-DIA-6.md`

### 11.2 Dia 7 — Revisão final + envelope físico + handoff entrega

```bash
# A. Checklist revisão final (ver secção 14)
# B. Compilar pasta PARA-IMPRIMIR/
# C. Criar handoff "pronto para Eurico entregar" (RETOMA-20260...-dia-7-pacote-pronto-...md)
# D. Considerar git commit do trabalho Dias 1-7 (TUDO está untracked actualmente — ver secção 21)
```

---

## 12. Como gerar roadmap PDF visual 36 meses (Dia 6 secção A)

### 12.1 Input: `inovcitrus-pdfs/roadmap/roadmap-data.json`

Já existe desde Dia 1. 152 linhas. Estrutura: 12 marcos científicos × 23 actos comunicativos × 36 meses (Q1 2026 → Q4 2028).

### 12.2 Estratégia

Usar a mesma abordagem do `generate-pdfs.mjs` Dia 5: Node ESM standalone que gera HTML e chama Chrome `--headless --print-to-pdf`.

### 12.3 Template do script

Criar `inovcitrus-pdfs/scripts/generate-roadmap-pdf.mjs`:

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
const ROADMAP_JSON = resolve(PDF_ROOT, 'roadmap', 'roadmap-data.json');
const OUTPUT_DIR = resolve(PDF_ROOT, 'output');
const TMP_DIR = resolve(PDF_ROOT, '.tmp-html');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PRINT_CSS = `
@page { size: A4 landscape; margin: 12mm; }
@media print { html, body { background: #ffffff !important; } }
* { box-sizing: border-box; }
html, body { background: #ffffff; color: #1A1A1A; font-family: 'Inter', sans-serif; font-size: 9pt; line-height: 1.4; margin: 0; padding: 0; }
.doc { display: flex; flex-direction: column; height: calc(297mm - 24mm); }
.doc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6pt; border-bottom: 2pt solid #E8A53C; margin-bottom: 12pt; }
.doc-header .wordmark .frusoal { font-weight: 400; font-size: 12pt; }
.doc-header .wordmark .inovcitrus { font-weight: 800; font-size: 12pt; }
.doc-header .meta { font-size: 8pt; color: #6B6B6B; letter-spacing: 0.04em; text-transform: uppercase; }
h1 { font-size: 16pt; font-weight: 800; margin: 0 0 8pt 0; color: #1A1A1A; }
.timeline { flex: 1; display: grid; grid-template-columns: 80mm 1fr; gap: 4mm; }
.timeline-axis { display: grid; grid-template-rows: 1fr 1fr; }
.timeline-row { padding: 6pt; border: 1pt solid #E5E2DA; }
.timeline-row.science { background: rgba(90, 140, 69, 0.06); border-left: 3pt solid #5A8C45; }
.timeline-row.communication { background: rgba(232, 165, 60, 0.06); border-left: 3pt solid #E8A53C; }
.year-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; }
.year-block { border: 1pt solid #E5E2DA; padding: 6pt; }
.year-block h3 { font-size: 10pt; font-weight: 700; margin: 0 0 4pt 0; color: #1A1A1A; }
.year-block ul { list-style: disc inside; margin: 0; padding: 0; font-size: 8pt; color: #3A3A3A; }
.year-block li { margin: 1pt 0; }
.legend { display: flex; gap: 12pt; font-size: 8pt; color: #6B6B6B; margin-top: 8pt; }
.legend-item { display: flex; align-items: center; gap: 4pt; }
.legend-swatch { width: 10pt; height: 10pt; border-radius: 2pt; }
.legend-swatch.science { background: #5A8C45; }
.legend-swatch.communication { background: #E8A53C; }
.disclaimer { font-size: 7pt; color: #6B6B6B; margin-top: 6pt; font-style: italic; }
.doc-footer { padding-top: 6pt; border-top: 1pt solid #E5E2DA; font-size: 7pt; color: #6B6B6B; display: flex; justify-content: space-between; }
`;

async function buildRoadmapHtml() {
  const raw = await readFile(ROADMAP_JSON, 'utf8');
  const data = JSON.parse(raw);

  // ADAPTAR à estrutura real de roadmap-data.json — ver o ficheiro:
  // Provavelmente tem campos como: milestones[], communications[], year, quarter, etc.
  // Aqui é um esqueleto — o agente Dia 6 deve LER o JSON primeiro para adaptar.

  // Esqueleto:
  const headerMeta = 'Roadmap 36 meses · 2026-2028 · v1.0 preliminar';
  const title = 'Frusoal InovCitrus — Calendário do Projecto Trienal';

  // Construir HTML organizando por ano (2026, 2027, 2028) e dois eixos (científico vs comunicação).
  // ... implementação pelo agente Dia 6 com base no JSON real ...

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="doc">
    <header class="doc-header">
      <div class="wordmark"><span class="frusoal">Frusoal </span><span class="inovcitrus">InovCitrus</span></div>
      <div class="meta">${headerMeta}</div>
    </header>
    <h1>${title}</h1>
    <!-- IMPLEMENTAR: timeline com 2 eixos (científico verde + comunicação laranja) × 3 anos -->
    <div class="legend">
      <div class="legend-item"><span class="legend-swatch science"></span>Marcos científicos</div>
      <div class="legend-item"><span class="legend-swatch communication"></span>Actos comunicativos</div>
    </div>
    <p class="disclaimer">Calendário representativo do desenho trienal. Datas exactas e marcos científicos serão definidos pela equipa científica do projecto.</p>
    <footer class="doc-footer">
      <span>Frusoal InovCitrus · Tavira · Algarve · Portugal</span>
      <span>frusoal.pt · inovcitrus.vercel.app</span>
    </footer>
  </div>
</body>
</html>`;
}

function chromePrintToPdf(htmlPath, pdfPath) {
  return new Promise((res, rej) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--print-to-pdf-no-header',
      `--print-to-pdf=${pdfPath}`,
      `file:///${htmlPath.replaceAll('\\', '/')}`,
    ];
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
  const html = await buildRoadmapHtml();
  const htmlPath = join(TMP_DIR, 'roadmap-36-meses.html');
  const pdfPath = join(OUTPUT_DIR, 'roadmap-36-meses.pdf');
  await writeFile(htmlPath, html, 'utf8');
  await chromePrintToPdf(htmlPath, pdfPath);
  console.log(`✓ ${pdfPath}`);
  await rm(TMP_DIR, { recursive: true, force: true });
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
```

### 12.4 Layout do roadmap (decisão de design)

| Elemento | Detalhe |
|----------|---------|
| Orientação | A4 paisagem |
| Margens | 12mm |
| Eixo temporal | Horizontal — 2026 / 2027 / 2028 (3 colunas iguais) |
| Eixo vertical | 2 linhas: marcos científicos (verde algarve) em cima, actos comunicativos (laranja citrus) em baixo |
| Header | Wordmark + "Roadmap 36 meses · v1.0 preliminar" |
| Título | "Frusoal InovCitrus — Calendário do Projecto Trienal" |
| Legenda | Verde = marcos científicos · Laranja = actos comunicativos |
| Disclaimer | "Calendário representativo. Datas exactas serão definidas pela equipa científica do projecto." |
| Footer | "Frusoal InovCitrus · Tavira · Algarve · Portugal · frusoal.pt · inovcitrus.vercel.app" |

### 12.5 Output esperado

`output/roadmap-36-meses.pdf` — 1 página A4 paisagem, ~80-150 KB, sóbria, paleta InovCitrus, legível impressa.

---

## 13. Como criar kit imprensa (Dia 6 secção B)

### 13.1 Estrutura `inovcitrus-kit-imprensa/`

```
inovcitrus-kit-imprensa/
├── README.md                            ← instruções de uso (Pedro pode usar livremente)
├── wordmark-inovcitrus.svg              ← Wordmark Inter regular+bold (cor citrus)
├── wordmark-inovcitrus-mono.svg         ← Variante monocromática preto
├── paleta-swatches.png                   ← Imagem com 6 swatches da paleta + hex
├── press-release-pt.md                  ← Modelo press release lançamento (PT)
└── press-release-en.md                  ← Tradução EN
```

### 13.2 Wordmark SVG (template)

Criar `wordmark-inovcitrus.svg`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 80" preserveAspectRatio="xMinYMid meet">
  <text x="0" y="58" font-family="Inter, sans-serif" font-weight="400" font-size="48" fill="#1A1A1A">Frusoal </text>
  <text x="172" y="58" font-family="Inter, sans-serif" font-weight="800" font-size="48" fill="#1A1A1A">InovCitrus</text>
</svg>
```

`wordmark-inovcitrus-mono.svg` — idem, mas tudo em `fill="#000000"`.

**Nota:** SVG depende da fonte Inter estar disponível no sistema do leitor. Para versão "embutida" para imprensa, considerar exportar para PNG via Chrome headless (mesmo padrão do Dia 5).

### 13.3 Paleta swatches PNG

Criar HTML temporário com 6 swatches `#E8A53C`, `#C68420`, `#5A8C45`, `#3F6A2E`, `#1A1A1A`, `#FAF8F4` cada um com label + hex visível, depois Chrome `--screenshot=paleta-swatches.png --window-size=800,400`.

### 13.4 Press release modelo (template PT)

Base: Postal do Algarve 04/02/2026 (F01) — adaptar tom institucional, parágrafos curtos, factual.

```markdown
---
title: Frusoal InovCitrus — lançamento do polo de Investigação e Desenvolvimento
date: 2026-MM-DD
locale: pt
status: modelo
---

# Frusoal InovCitrus lança polo de I&D dedicado à citricultura do Algarve

**Vila Nova de Cacela, [DATA]** — A Frusoal — Frutas Sotavento Algarve, Lda, 
maior Organização de Produtores de Citrinos em Portugal, 
anunciou hoje o lançamento do **InovCitrus**, polo permanente de Investigação 
e Desenvolvimento dedicado à citricultura algarvia.

[... 4-5 parágrafos curtos cobrindo:
1. O que é o InovCitrus + sede em construção em Tavira
2. Primeiro projecto trienal sobre Scirtothrips aurantii (parceria InPP + CCDR Algarve)
3. Missão (4 pontos: conhecimento científico, pragas, sustentabilidade, valorização)
4. Estrutura (Frusoal promotor, InPP parceiro científico, CCDR extensão, 65 produtores associados)
5. Site institucional inovcitrus.vercel.app + contactos]

## Contactos para imprensa

Frusoal — Frutas Sotavento Algarve, Lda
Vila Nova de Cacela, Algarve
[email] · [telefone]

## Sobre a Frusoal

A Frusoal é a maior Organização de Produtores de Citrinos em Portugal. 
Fundada em 1981, congrega 65 produtores associados em 1.500 hectares e 
40.000 toneladas anuais de produção. Detém as marcas Gomo (convencional) 
e Biogomo (orgânico) e é certificada GlobalG.A.P., GRASP e IGP Citrinos do Algarve.

---

*Este press release é um modelo. Adaptar datas e contactos antes de envio.*
```

`press-release-en.md` — tradução EN equivalente, base na ficha técnica EN.

### 13.5 README.md kit imprensa

```markdown
# Kit imprensa — Frusoal InovCitrus

Conteúdos disponíveis para uso da Frusoal em comunicação institucional.

## Ficheiros

| Ficheiro | Uso |
|----------|-----|
| wordmark-inovcitrus.svg | Wordmark colorido para web/digital |
| wordmark-inovcitrus-mono.svg | Wordmark mono para imprensa preto e branco |
| paleta-swatches.png | Cores institucionais (referência designer) |
| press-release-pt.md | Modelo press release lançamento PT |
| press-release-en.md | Modelo press release lançamento EN |

## Tipografia

Inter (Google Fonts) — pesos 400, 500, 600, 700, 800.

## Cores institucionais

| Cor | Hex | Uso |
|-----|-----|-----|
| Citrus (laranja maduro) | #E8A53C | Acção primária |
| Citrus dark | #C68420 | Hover/destaque |
| Algarve (verde) | #5A8C45 | Secundário |
| Ink | #1A1A1A | Texto |
| Surface warm | #FAF8F4 | Fundo |

## Site institucional

https://inovcitrus.vercel.app

## Notas

- v1.0 preliminar — aguarda aprovação formal Frusoal
- Logos InPP, CCDR — só após autorização formal de cada entidade
- Comunicação institucional via Frusoal — frusoal.pt
```

---

## 14. Como compilar o envelope físico de entrega (Dia 7)

### 14.1 Pasta final

```
inovcitrus-pdfs/output/PARA-IMPRIMIR/
├── 0-README-EURICO.md                       (instruções)
├── 1-press-release-pt.pdf                   (1 página A4 — gerar do .md kit imprensa)
├── 2-ficha-tecnica-scirtothrips-pt.pdf      (~6 páginas A4)
├── 3-ficha-tecnica-scirtothrips-en.pdf      (~6 páginas A4)
├── 4-ficha-tecnica-scirtothrips-es.pdf      (~7 páginas A4)
├── 5-ficha-tecnica-scirtothrips-fr.pdf      (~7 páginas A4)
└── 6-roadmap-36-meses-A4-paisagem.pdf       (1 página)
```

Total: 7 PDFs · ~30 páginas A4 imprimíveis.

### 14.2 Como gerar o PDF do press release PT

Usar o mesmo padrão de `generate-pdfs.mjs` Dia 5 — adaptar para ler `inovcitrus-kit-imprensa/press-release-pt.md` em vez das fichas técnicas.

### 14.3 README-EURICO.md sugerido

```markdown
# Envelope físico — Casa Pública Frusoal InovCitrus

## O que está aqui (ordem de impressão)

1. Press release modelo (PT) — 1 página
2-5. Ficha técnica Scirtothrips — 4 páginas × 4 línguas
6. Roadmap 36 meses — 1 página paisagem

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

## Ordem de leitura por Pedro (sugestão)

1. Roadmap 36 meses (primeiro impacto visual)
2. Press release (5 segundos para perceber o que é)
3. Ficha técnica PT (utilidade imediata)
4. Site (quando Pedro tiver 5 min, abrir telemóvel)
```

---

## 15. Erros previsíveis e mitigação

| Erro | Probabilidade | Causa | Mitigação |
|------|---------------|-------|-----------|
| `npm install` falha por permissões Windows | Baixa | Antivirus, OneDrive | Já passou Dia 4 — pouco provável repetir |
| `node_modules/` apagado entre sessões | Média | Cleanup ou disco cheio | Re-correr `npm install` em `inovcitrus-site/` |
| `.next/` corrupted entre sessões | Baixa | Build interrompido | `rm -rf inovcitrus-site/.next/` + `npm run build` |
| Vercel deploy falha por env vars | Baixa | Não temos env vars | — |
| Vercel auth expirou | Baixa | Token renovação | `npx vercel login` |
| Chrome path mudou (update Windows) | Baixa | Update | Verificar com `ls` os 2 paths possíveis |
| Chrome bloqueado por antivirus em headless | Baixa-média | Antivirus paranoico | Tentar Edge (`msedge.exe`) como fallback |
| `roadmap-data.json` não tem campos esperados pelo script | Alta (script é template) | Estrutura JSON real diferente | **Agente Dia 6 deve LER o JSON primeiro** e adaptar `buildRoadmapHtml()` |
| PDFs Dia 5 não existem ao iniciar Dia 7 | Baixa | Apagados | Re-correr `node scripts/generate-pdfs.mjs` |
| Site Vercel offline | Muito baixa | Vercel down | Verificar status.vercel.com |

---

## 16. Memórias relevantes (lista completa de leitura obrigatória)

| Memória | Caminho | Relevância |
|---------|---------|-------------|
| Frusoal — propósito desta fase | `memory/project_frusoal_proposito.md` | Análise + identificar onde aplicar IA |
| Frusoal — Eurico conhece Pedro | `memory/project_frusoal_eurico_pedro_relacao.md` | Canal informal/presencial · zero cold outreach |
| Nunca "combo" a clientes maduros | `memory/feedback_nunca_combo_clientes_comerciais.md` | Frusoal 45 anos = consultoria estratégica plurianual |
| Nunca projectar modelo de negócio | `memory/feedback_no_projected_business_models.md` | Responder só ao pedido |
| Handoffs com detalhe | `memory/feedback_handoffs_detail.md` | Decisões + citações + contexto |
| Nunca inventar casos | `memory/feedback_no_invented_cases.md` | Zero exemplos fictícios |
| Nunca fechar terminais | `memory/feedback_never_close_terminals.md` | Múltiplos terminais — não fechar |
| Não recomeçar do zero | `memory/feedback_never_restart_context.md` | Ler RETOMA + memória |
| **Não instalar mais ferramentas** | `memory/feedback_no_more_tools.md` | **Validar ANTES de sugerir tools novas. Crítico para Dia 6 — usar Chrome headless, NÃO instalar Puppeteer/Pandoc/MiKTeX** |
| Governance nunca bloqueia execução | `memory/feedback_governance_never_blocks_execution.md` | Não pedir aprovação @pm |
| Modelo Acolhe-Adapta-Rentabiliza | `memory/feedback_community_acolhe_adapta_model.md` | **NÃO aplica a Frusoal** — cliente comercial |
| Frusoal é cliente real | (implícito de prompt-original.md) | Eurico tem de entregar |

---

## 17. Erros que NÃO podem repetir (acumulado de 5 sessões)

| Erro | Origem | Como evitar |
|------|--------|-------------|
| "Combo" / "package" / "ROI 6 meses" / linguagem vendor SaaS | 23/04 PRD v1 | Usar "consultoria" · "acompanhamento" · "plurianual" |
| Cold outreach via LinkedIn DM | 23/04 | Canal é presencial/informal |
| Projectar segundos capítulos não pedidos | 23/04 | Responder só ao pedido |
| Confundir Frusoal-empresa com InovCitrus | 23/04 | Acto 1 = polo I&D · Acto 2 = empresa toda (futuro) |
| Propor ferramentas que colidem com core InPP | 24/04 | Lista de proibições secção 3 do handoff Dia 24/04 |
| Acumular strands paralelos sem fechar | 25/04 | Auditoria + 1 caminho concreto |
| Inventar dados sobre InPP, Pedro, Sisgarbe, equipa | Sistémico | F01-F16 são as únicas fontes válidas |
| Conteúdo "em nome da InPP" | Risco actual | Cross-tag textual apenas |
| Logos InPP/CCDR sem autorização | Risco actual | Substituir por nome textual |
| Inventar coordenador científico do polo | Risco actual | Q2 default omite página equipa |
| Inventar morada de sede em Tavira | Risco actual | Q4 default fica vago |
| Tradução literal sem terminologia regional | 25/04 (mitigado Dia 2) | EN: EPPO/EFSA · ES: Junta Andalucía · FR: OEPP |
| Avançar sem ler prompt original | Sistémico | Secção 2.2 deste handoff |
| Slugs traduzidos em URLs internas | Dia 4 (mitigado) | Sempre usar `/{locale}/{slug-key-canónico-em-inglês}` |
| **Instalar ferramentas novas sem validar** | Dia 5 (resolvido) | **Pandoc/MiKTeX/Puppeteer recusados. Usar Chrome headless já existente** |
| Bump major sem necessidade | Dia 5 (resolvido) | Ficar em mesmo minor sempre que possível |

---

## 18. Fontes F01-F16 — URLs exactos (rastreabilidade)

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

## 19. Compromissos finais (Dia 7)

| Compromisso | Cumprimento |
|-------------|--------------|
| Cada afirmação rastreada a fonte | ✓ Dias 1-2 + cross-check Dia 7 |
| Site Vercel funcional 4 línguas | ✓ Dia 5 — `https://inovcitrus.vercel.app` |
| 4 PDFs ficha técnica imprimíveis | ✓ Dia 5 |
| Roadmap PDF visual | Dia 6 |
| Kit imprensa | Dia 6 |
| Envelope físico compilado | Dia 7 |
| Handoff "pronto para Eurico entregar" | Dia 7 |
| Zero invenção · zero "em nome da InPP" · zero logos não-autorizados | ✓ Sempre |
| Zero ferramentas novas instaladas | ✓ Dia 5 (cumprido) |

---

## 20. Troubleshooting frequente (FAQ)

### Q: O site Vercel deixou de responder

A: Verificar https://www.vercel-status.com. Se Vercel OK, verificar `npx vercel inspect inovcitrus`. Em último recurso, redeploy: `cd inovcitrus-site && npx vercel deploy --prod --yes`.

### Q: Como redeploy após mudar conteúdo dos markdowns?

A: `cd inovcitrus-site && npm run build && npx vercel --prod`. Vercel só rebuilda o que mudou.

### Q: PDFs ficha técnica precisam de re-gerar?

A: Sim, sempre que mudares o markdown source: `cd inovcitrus-pdfs && node scripts/generate-pdfs.mjs`.

### Q: Como verificar se o roadmap-data.json tem a estrutura esperada pelo script Dia 6?

A: `cat inovcitrus-pdfs/roadmap/roadmap-data.json | head -40` para ver os primeiros campos. Adaptar `buildRoadmapHtml()` em `generate-roadmap-pdf.mjs` à estrutura real.

### Q: Vercel pediu re-login (token expirou)

A: `npx vercel login` (use email do Eurico).

### Q: Posso correr `npm audit fix --force` para resolver advisories?

A: **NÃO sem aviso.** Vai bumpar para Next 16.x (breaking change). Decisão Dia 5: ficar em 14.2.35. Se Eurico quiser bump major, fazer em sessão separada com testes.

### Q: O nome do projecto Vercel é `inovcitrus`. Como mudar para `frusoal-inovcitrus`?

A: `npx vercel projects rm inovcitrus` + `npx vercel deploy --prod --name frusoal-inovcitrus`. **NÃO fazer sem confirmação Eurico** — rompe o alias `inovcitrus.vercel.app`.

### Q: Como adicionar nova língua (ex: alemão `de`)?

A: 
1. Criar `content/de/{01-home,02-projecto-trienal,03-estrutura-parceiros,04-repositorio,05-contactos}.md` (5 ficheiros baseados no master PT, terminologia DE-EPPO oficial)
2. Adicionar `'de'` em `src/lib/i18n.ts` `locales` array + `getUI('de')` mapping com etiquetas alemãs
3. `npm run build && npx vercel --prod`

### Q: O Eurico mudou de ideias e quer registar `inovcitrus.pt` (Q5)

A: 
1. Comprar domínio (~15€/ano em Amen.pt ou domínios.pt)
2. No Vercel dashboard → projecto inovcitrus → Domains → Add `inovcitrus.pt`
3. Configurar DNS A/CNAME conforme instruções Vercel
4. Aguardar propagação (~1-24h)
5. Vercel auto-renova SSL via Let's Encrypt

### Q: Lighthouse a11y < 95 em produção

A: Verificar:
- Contraste de cores (especialmente `#C68420` em links sobre `#FAF8F4` background — geralmente OK)
- Falta de `alt` em imagens (não temos imagens neste site)
- Heading hierarchy (h1 > h2 > h3 sem saltos — markdown deve respeitar)
- Form labels (não temos forms)

Geralmente score >= 95 com este scaffold.

---

## 21. Estado git e o que falta fazer commit

### 21.1 Estado actual

```bash
$ git status --porcelain membros/cliente-frusoal/
?? membros/cliente-frusoal/
```

**TODA a pasta `membros/cliente-frusoal/` está untracked.** Trabalho dos Dias 1-5 NÃO foi committed ainda. Agente Dia 6 deve **NÃO fazer commit sem ordem explícita do Eurico** (regra `agent-authority.md` — apenas `@devops` faz push, e neste caso `@dev` pode fazer commit local mas não push).

### 21.2 Quando Eurico aprovar para commit

```bash
# Estratégia sugerida: 1 commit por dia para granularidade histórica.
# Ou 1 commit grande "feat(frusoal): pacote casa pública v1 completo (Dias 1-7)"

cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt

# Verificar .gitignore exclui node_modules/, .next/, .vercel/
cat membros/cliente-frusoal/04-landing/inovcitrus-site/.gitignore

# Stage tudo da Frusoal
git add membros/cliente-frusoal/

# Commit (delegar a @devops para push)
git commit -m "feat(frusoal): pacote casa pública InovCitrus v1 — site live + 4 PDFs + roadmap + kit imprensa

Dias 1-5: 5 páginas × 4 línguas + ficha técnica × 4 + roadmap data + scaffold
Dias 6-7: roadmap PDF + kit imprensa + envelope físico

Site live: https://inovcitrus.vercel.app
PDFs: 04-landing/inovcitrus-pdfs/output/

Constraint: prompt-original.md fonte da verdade
Constraint: zero \"em nome da InPP\" (decisão D3)
Constraint: zero ferramentas novas instaladas (Chrome headless reutilizado)
Confidence: high
Scope-risk: narrow"

# @devops faz push depois
```

### 21.3 Avisos antes de commit

| Item | Verificar antes |
|------|-----------------|
| `node_modules/` no `.gitignore`? | ✓ Sim, scaffold Dia 3 incluiu |
| `.next/` no `.gitignore`? | ✓ Sim |
| `.vercel/` no `.gitignore`? | ✓ Sim (criado pelo `vercel link`) |
| `.tmp-html/` (script PDF) no `.gitignore`? | ⚠ Verificar — script já remove no fim mas se interromper fica residual |
| PDFs em `output/`? | Decidir: incluir ou gitignore? Se incluir, +650 KB ao repo. Se gitignore, perde-se rastreabilidade dos artefactos. **Default: incluir** (são entregáveis canónicos do projecto) |
| `package-lock.json`? | ✓ Incluir |

### 21.4 Estrutura de commits sugerida (alternativa granular)

```bash
# Commit 1: Dia 1 conteúdo PT
git add 04-landing/FONTES.md 04-landing/PROGRESSO-DIA-1.md 04-landing/inovcitrus-site/content/pt/ 04-landing/inovcitrus-pdfs/source/pt/ 04-landing/inovcitrus-pdfs/roadmap/
git commit -m "feat(frusoal): Dia 1 conteúdo PT + estrutura + fontes F01-F08"

# Commit 2: Dia 2 traduções
git add 04-landing/PROGRESSO-DIA-2.md 04-landing/inovcitrus-site/content/{en,es,fr}/ 04-landing/inovcitrus-pdfs/source/{en,es,fr}/
git commit -m "feat(frusoal): Dia 2 traduções EN/ES/FR + fontes F09-F16"

# ... e por aí fora
```

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER OUTPUT FRUSOAL, LER:
1. `.claude/rules/frusoal-source-of-truth.md`
2. `membros/cliente-frusoal/prompt-original.md`
3. **Este handoff integralmente**
4. `04-landing/FONTES.md`
5. `04-landing/PROGRESSO-DIA-{1,2,3,4,5}.md`

VIOLAÇÃO = PARAR · DESCARTAR · REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-5-site-live-pdfs-ok-proximo-dia-6.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-5-site-live-pdfs-ok-proximo-dia-6.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026 (Dia 5 da execução, mesmo dia natural Dias 1+2+3+4+5)
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — terminal fresh continua Dia 6)

---

*Fim do handoff Dia 5 expandido — auto-suficiente para terminal fresh. Tudo o que o próximo agente precisa para Dias 6-7 está aqui. Zero perda de contexto esperada.*
