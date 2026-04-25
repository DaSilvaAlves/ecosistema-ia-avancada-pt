# RETOMA — Frusoal InovCitrus: Dia 3 executado, scaffold Next.js completo, próximo agente em terminal fresh continua Dias 4-7

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

> **ESTE HANDOFF É AUTO-SUFICIENTE.** Foi escrito para um agente em terminal fresh, sem contexto da conversa, conseguir continuar Dias 4-7 sem precisar de inventar nem perguntar. Se algo aqui contradiz outro documento, este prevalece (mais recente).

---

## Índice

1. Resumo executivo
2. Primeira acção do próximo agente — passo a passo obrigatório
3. Decisões consolidadas (D1, D2, D3, Q1-Q5) com razão
4. Princípios inegociáveis
5. Estado completo Dias 1+2+3 (inventário ficheiro a ficheiro)
6. Stack técnica (versões exactas)
7. Estrutura completa de pastas
8. Conteúdo produzido — rotas, slugs, fontes
9. Identidade visual — tokens, paleta, tipografia
10. Arquitectura de rotas e mapa slug→ficheiro
11. Plano restante Dias 4-7 — comandos exactos
12. Smoke test checklist exaustivo
13. Erros previsíveis e mitigação
14. Como fazer deploy Vercel (Dia 5)
15. Como gerar PDFs das fichas técnicas (Dia 5)
16. Como gerar roadmap visual 36 meses (Dia 6)
17. Como compilar o envelope físico de entrega (Dia 7)
18. Memórias relevantes (lista completa de leitura obrigatória)
19. Erros que NÃO podem repetir (acumulado de 3 sessões)
20. Fontes F01-F16 — URLs exactos
21. Compromissos finais
22. Troubleshooting frequente (FAQ)

---

## 1. Resumo executivo

Sessão de 25/04/2026 — Dias 1, 2 e 3 do Pacote Casa Pública Frusoal InovCitrus executados no mesmo dia natural. Estratégia: **trabalho de casa entregue gera curiosidade que abre porta com Pedro Madeira** (sócio-gerente Frusoal, decisor único de tecnologia/digital, 65 anos, conhecido do Eurico desde a infância). Dia 1 produziu 8 ficheiros conteúdo PT + estrutura. Dia 2 produziu 18 ficheiros (15 páginas EN/ES/FR + 3 fichas técnicas EN/ES/FR) ancorados em fontes científicas internacionais oficiais (EPPO, EFSA, Junta de Andalucía RAIF, MAPA, BOJA 2020, OEPP, CABI). Dia 3 produziu 17 ficheiros do scaffold Next.js 14 App Router com identidade visual extraída do `frusoal.pt` (laranja citrino + verde algarvio + Inter). **Total acumulado: 43 ficheiros, ~3.125 linhas, 4 línguas, 20 rotas estáticas, zero invenção.** Próximo: Dia 4 = `npm install` + `npm run build` + smoke test local; Dia 5 = deploy Vercel + PDFs; Dia 6 = roadmap visual + kit imprensa; Dia 7 = revisão final + entrega.

---

## 2. Primeira acção do próximo agente — passo a passo obrigatório

**ORDEM EXACTA. NÃO SALTAR PASSOS. NÃO INVENTAR.**

### 2.1 Activação

1. Activar `@ux-design-expert` (Uma) — continuidade directa
2. Reportar ao utilizador: **"Detectei handoff pending RETOMA-20260425 Dia 3 Frusoal InovCitrus — scaffold Next.js completo. Vou avançar Dia 4 = npm install + build + smoke test."**

### 2.2 Leitura obrigatória antes de qualquer código

Por esta ordem exacta:

1. `.claude/rules/frusoal-source-of-truth.md` — regra inegociável
2. `.claude/rules/handoff-location.md` — regra handoff
3. `.claude/rules/handoff-central.md` — protocolo cross-terminal
4. `membros/cliente-frusoal/prompt-original.md` — posicionamento "consultor de implementação de IA"
5. **Este handoff integralmente** (RETOMA-20260425-dia-3-scaffold-nextjs-pronto-para-build.md)
6. `membros/cliente-frusoal/04-landing/FONTES.md` — F01-F16 com URLs
7. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-1.md`
8. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-2.md`
9. `membros/cliente-frusoal/04-landing/PROGRESSO-DIA-3.md`
10. `membros/cliente-frusoal/04-landing/inovcitrus-site/README.md`

### 2.3 Verificação ambiente

```bash
node --version       # deve ser >= 18.17 (Next 14.2 requirement)
npm --version        # qualquer versão recente
```

Se Node < 18.17, **PARAR** e avisar Eurico — não tentar fazer downgrade.

### 2.4 Comandos Dia 4

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-site/

npm install                      # ~150 packages, 1-3 min
npm run build                    # gera 20 rotas estáticas
npm run dev                      # arranca em http://localhost:3000
```

Se `npm install` falha por permissões: **NÃO usar `--force`**. Investigar causa real.

Se `npm run build` falha: ler erro, corrigir tipos/imports, **NÃO** ignorar com `// @ts-ignore`. Os tipos foram desenhados para ajudar.

### 2.5 Smoke test checklist (ver secção 12)

Executar TODOS os 18 testes da secção 12. Capturar screenshots de:
- `/pt` (home PT)
- `/en` (home EN)
- `/pt/project` (projecto trienal PT)
- LanguageSwitcher em acção
- Skip link visível ao Tab
- Vista mobile (~360px largura)

### 2.6 Reportar ao Eurico

Apresentar:
- Status do build (sucesso/erros corrigidos)
- 6 screenshots
- Comando `npm run dev` continua a correr para Eurico ver localmente
- Próximo passo (Dia 5: deploy Vercel)

### 2.7 Criar `PROGRESSO-DIA-4.md`

Mesmo formato dos Dias 1, 2, 3. Em `04-landing/PROGRESSO-DIA-4.md`.

### 2.8 Quando Eurico aprovar visualmente, avançar Dia 5

(Ver secção 14 — deploy Vercel.)

---

## 3. Decisões consolidadas (preservadas, inegociáveis)

| ID | Decisão | Origem | Razão |
|----|---------|--------|-------|
| **D1** | Pacote completo 7 dias úteis (Site + Ficha técnica 4 línguas + Roadmap 36 meses) | Eurico 25/04/2026 | "Trabalho de casa entregue gera curiosidade que abre porta. Pedro não tem tempo para conversa de café com promessa." |
| **D2** | Hosting Vercel (URL `*.vercel.app` por agora) | Eurico 25/04/2026 | Custo zero · deploy automático · sem registo `.pt` por agora |
| **D3** | Mostrar a Pedro **primeiro**, depois à InPP | Eurico 25/04/2026 | Pedro é o cliente, decide como/quando comunicar com InPP. **IMPLICAÇÃO INEGOCIÁVEL: zero conteúdo "em nome da InPP" — só citação verbatim de fontes públicas + cross-tag textual.** Logos InPP/CCDR proibidos até autorização formal. |
| **Q1** | Wordmark tipográfico Frusoal-aligned, sem ícone, Inter weights 400/700 | Default aceite ("podes continuar") | Sóbrio, harmoniza com Frusoal, escala em PDFs |
| **Q2** | Página "Equipa" omitida, substituída por "Estrutura" (só entidades, sem indivíduos) | Default aceite | Postal não menciona nomes técnicos do polo I&D — não inventar |
| **Q3** | URL Vercel: tentar `inovcitrus.vercel.app` primeiro; alternativa `frusoal-inovcitrus.vercel.app` | Default aceite | Confirmar disponibilidade no Dia 5 |
| **Q4** | Página "Sede" vaga: "em construção em Tavira", sem morada/foto | Default aceite | Postal só refere "Tavira" — não inventar morada nem usar foto |
| **Q5** | Não registar `inovcitrus.pt` agora | Default aceite | Custo zero. Se Pedro avançar, regista-se depois (15€/ano) |

---

## 4. Princípios inegociáveis

### 4.1 Posicionamento

- **Consultor de implementação de IA**, não vendor SaaS, não fornecedor de ferramentas, não package provider.
- A "casa pública" é entregue ao Pedro como **trabalho de casa nosso**, não como fait accompli nem como "venda".
- Tom: **par consultivo**, factual, com fontes. Pedro tem 65 anos e 45 anos de empresa — interlocução entre pares.

### 4.2 Conteúdo

- **Zero invenção.** Cada afirmação rastreada a fonte pública (URL + data) em `04-landing/FONTES.md`.
- **Zero linguagem vendor.** Proibido: "combo", "pacote", "package", "ROI 6 meses", "75% PRR", "quick win", "revolucionário", "garantido", "plug-and-play", "out-of-the-box".
- **Zero conteúdo em nome da InPP.** InPP só por citação verbatim de fonte pública + cross-tag textual.
- **PT-PT estrito** no master. EN/ES/FR são paráfrases informadas por fontes regionais oficiais (não traduções literais).

### 4.3 Visual

- **Identidade alinhada com Frusoal actual** — sem ruptura estética. Pedro é praticante, não recebe arrojo gráfico.
- **Sem cores fluorescentes.** Sem tipografia tech ou display.
- **Sem logos de terceiros** sem autorização formal — só nomes textuais.

### 4.4 Operacional

- **Custo zero** (Vercel `.vercel.app`, fontes Google grátis, sem registo `.pt`).
- **Site declarado preliminar** (versão 1.0 pré-publicação) — honestidade total sobre o estado.
- **Repositório científico vazio mas estruturado** — sem inventar resultados que ainda não saíram.

---

## 5. Estado completo Dias 1+2+3 (inventário ficheiro a ficheiro)

### 5.1 Ficheiros do Dia 1 (8 ficheiros, ~800 linhas)

| Caminho | Linhas | Função |
|---------|--------|--------|
| `04-landing/FONTES.md` | 67 (Dia 1) → 110 (Dia 2) | Rastreabilidade global F01-F16 |
| `04-landing/PROGRESSO-DIA-1.md` | 100 | Mandatory change log Dia 1 |
| `04-landing/inovcitrus-site/content/pt/01-home.md` | 65 | Home PT |
| `04-landing/inovcitrus-site/content/pt/02-projecto-trienal.md` | 113 | Projecto trienal PT |
| `04-landing/inovcitrus-site/content/pt/03-estrutura-parceiros.md` | 91 | Estrutura PT |
| `04-landing/inovcitrus-site/content/pt/04-repositorio.md` | 82 | Repositório PT |
| `04-landing/inovcitrus-site/content/pt/05-contactos.md` | 71 | Contactos PT |
| `04-landing/inovcitrus-pdfs/source/pt/ficha-tecnica-scirtothrips-pt.md` | 158 | Ficha técnica PT (4 páginas A4) |
| `04-landing/inovcitrus-pdfs/roadmap/roadmap-data.json` | 152 | Dados roadmap 36 meses (12 marcos × 23 actos) |

### 5.2 Ficheiros do Dia 2 (18 ficheiros, ~1.700 linhas)

| Caminho | Linhas | Língua |
|---------|--------|--------|
| `content/en/01-home.md` | 65 | EN |
| `content/en/02-projecto-trienal.md` | 116 | EN |
| `content/en/03-estrutura-parceiros.md` | 91 | EN |
| `content/en/04-repositorio.md` | 82 | EN |
| `content/en/05-contactos.md` | 71 | EN |
| `content/es/01-home.md` | 65 | ES |
| `content/es/02-projecto-trienal.md` | 117 | ES |
| `content/es/03-estrutura-parceiros.md` | 91 | ES |
| `content/es/04-repositorio.md` | 82 | ES |
| `content/es/05-contactos.md` | 71 | ES |
| `content/fr/01-home.md` | 65 | FR |
| `content/fr/02-projecto-trienal.md` | 116 | FR |
| `content/fr/03-estrutura-parceiros.md` | 91 | FR |
| `content/fr/04-repositorio.md` | 82 | FR |
| `content/fr/05-contactos.md` | 71 | FR |
| `inovcitrus-pdfs/source/en/ficha-tecnica-scirtothrips-en.md` | 158 | EN |
| `inovcitrus-pdfs/source/es/ficha-tecnica-scirtothrips-es.md` | 162 | ES |
| `inovcitrus-pdfs/source/fr/ficha-tecnica-scirtothrips-fr.md` | 158 | FR |
| `04-landing/PROGRESSO-DIA-2.md` | 122 | Mandatory change log Dia 2 |

### 5.3 Ficheiros do Dia 3 (17 ficheiros, ~625 linhas)

| Caminho (relativo a `inovcitrus-site/`) | Linhas | Função |
|------------------------------------------|--------|--------|
| `package.json` | 32 | Deps Next 14.2 + React 18 + TS 5.5 + Tailwind 3.4 + remark + gray-matter |
| `tsconfig.json` | 26 | TS strict + path alias `@/*` |
| `next.config.mjs` | 6 | Strict mode, no powered-by header |
| `postcss.config.mjs` | 6 | Tailwind + autoprefixer |
| `tailwind.config.ts` | 49 | Paleta InovCitrus + Inter + max widths |
| `vercel.json` | 21 | Security headers + redirect /index.html |
| `.gitignore` | 30 | Padrão Next.js + Vercel + IDE |
| `README.md` | 91 | Documentação stack + estrutura + comandos |
| `src/lib/i18n.ts` | 80 | 4 locales · slug-keys · UI labels por língua |
| `src/lib/content.ts` | 38 | Loader markdown · gray-matter · remark · stripSourceComments |
| `src/components/Wordmark.tsx` | 25 | Wordmark tipográfico (variantes header/footer) |
| `src/components/Header.tsx` | 35 | Header server · nav primária · LanguageSwitcher |
| `src/components/Footer.tsx` | 42 | Footer server · parceiros · nota institucional |
| `src/components/LanguageSwitcher.tsx` | 41 | Client component · `usePathname` · preserva slug |
| `src/components/MarkdownContent.tsx` | 24 | Renderizador HTML com prose customizada |
| `src/app/layout.tsx` | 18 | Root layout · metadata global |
| `src/app/page.tsx` | 6 | Redirect `/`→`/pt` |
| `src/app/globals.css` | 50 | Tailwind layers + Inter Google Fonts + skip-link |
| `src/app/[locale]/layout.tsx` | 33 | Layout por locale · Header · Footer · skip-link · `generateStaticParams` |
| `src/app/[locale]/page.tsx` | 24 | Home (carrega `01-home.md` por locale) |
| `src/app/[locale]/[slug]/page.tsx` | 33 | Páginas slug · `generateStaticParams` para 4 locales × 4 slugs |
| `04-landing/PROGRESSO-DIA-3.md` | 165 | Mandatory change log Dia 3 |

### 5.4 Ficheiros movidos (higiene)

| De | Para | Motivo |
|----|------|--------|
| `02-prd/prd-entrada-frusoal.md` | `02-prd/archive/prd-v2-obsoleto-pre-descoberta-inpp.md` | Obsoleto — escrito antes da descoberta InPP linha digital completa |
| `docs/RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md` | `docs/archive/` | Consumido pela sessão Dia 1 |
| `docs/RETOMA-20260425-dia-1-pacote-completo-conteudo-pt.md` | `docs/archive/` | Consumido pelo Dia 2 |
| `docs/RETOMA-20260425-dia-2-traducoes-en-es-fr-completas.md` | `docs/archive/` | Consumido pelo Dia 3 |

---

## 6. Stack técnica (versões exactas)

### 6.1 `package.json` declarado (não instalado ainda — Dia 4 instala)

```json
{
  "dependencies": {
    "next": "14.2.13",
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

| Componente | Versão mínima | Razão |
|-----------|----------------|-------|
| Node.js | ≥ 18.17 | Next.js 14.2 requirement |
| npm | ≥ 9 | Lockfile v3 |
| OS | Windows / macOS / Linux | Independente |
| Browser para smoke test | Chrome/Edge/Firefox recente | DevTools necessário |

---

## 7. Estrutura completa de pastas

```
membros/cliente-frusoal/
├── prompt-original.md                              ← FONTE DA VERDADE (não tocar)
├── claude-pesquisa.txt                             ← Pesquisa LLM (37K, base v1)
├── preplexity-pesquisa.txt                         ← Pesquisa LLM (42K, base v1)
├── gpt-pesquisa.txt                                ← Pesquisa LLM (5K, base v1)
├── dossier-frusoal-v1.md                           ← Dossier consolidado (válido)
├── InovCitrus.txt                                  ← Análise factual InovCitrus (válido)
├── 02-prd/
│   └── archive/
│       └── prd-v2-obsoleto-pre-descoberta-inpp.md  ← Arquivado
├── 04-landing/                                     ← Trabalho activo Dias 1-7
│   ├── FONTES.md                                   ← F01-F16 (110 linhas)
│   ├── PROGRESSO-DIA-1.md
│   ├── PROGRESSO-DIA-2.md
│   ├── PROGRESSO-DIA-3.md
│   ├── inovcitrus-site/                            ← Next.js project
│   │   ├── package.json · tsconfig.json · next.config.mjs
│   │   ├── postcss.config.mjs · tailwind.config.ts · vercel.json · .gitignore
│   │   ├── README.md
│   │   ├── content/
│   │   │   ├── pt/  (5 ficheiros .md — master)
│   │   │   ├── en/  (5 ficheiros .md)
│   │   │   ├── es/  (5 ficheiros .md)
│   │   │   └── fr/  (5 ficheiros .md)
│   │   ├── public/                                  ← Vazio (Dia 6 entra logo SVG se houver)
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
│   │   └── roadmap/
│   │       └── roadmap-data.json
│   └── inovcitrus-kit-imprensa/                     ← Vazio (Dia 6 preenche)
└── docs/
    ├── RETOMA-20260425-dia-3-scaffold-nextjs-pronto-para-build.md   ← Este handoff
    └── archive/  (4 handoffs consumidos)
```

---

## 8. Conteúdo produzido — rotas, slugs, fontes

### 8.1 Mapa rota → ficheiro markdown → fontes

| Rota Next.js | Ficheiro markdown (4 línguas) | Fontes |
|---------------|--------------------------------|--------|
| `/[locale]` | `01-home.md` | F01, F04, F07 |
| `/[locale]/project` | `02-projecto-trienal.md` | F01, F02, F03, F08, F09, F11, F12, F15 |
| `/[locale]/structure` | `03-estrutura-parceiros.md` | F01, F04, F05, F06, F07 |
| `/[locale]/repository` | `04-repositorio.md` | F01 |
| `/[locale]/contacts` | `05-contactos.md` | F01, F04, F07 |

### 8.2 Slug-keys canónicos (NÃO traduzir nas rotas — só na UI)

```typescript
// src/lib/i18n.ts
export const slugFiles = {
  home: '01-home.md',
  project: '02-projecto-trienal.md',
  structure: '03-estrutura-parceiros.md',
  repository: '04-repositorio.md',
  contacts: '05-contactos.md'
} as const;
```

**Razão:** simplifica `LanguageSwitcher` (troca locale sem precisar de mapear slug por idioma). Os títulos visíveis são traduzidos via `i18n.ts` `nav` section.

### 8.3 Total de rotas estáticas

4 línguas × 5 páginas = **20 rotas** geradas em build via `generateStaticParams`.

---

## 9. Identidade visual — tokens, paleta, tipografia

### 9.1 Paleta (extraída de `frusoal.pt` via WebFetch 25/04/2026)

| Token Tailwind | Valor hex | Uso |
|----------------|-----------|-----|
| `citrus` | `#E8A53C` | Primário — laranja citrino maduro |
| `citrus-dark` | `#C68420` | Hover, links activos, destaque texto |
| `citrus-light` | `#F5C570` | Backgrounds suaves, hover BG |
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

Tipográfico simples:

```
[Frusoal regular 400] [InovCitrus bold 700]
```

Cor header: `text-ink` (com hover `text-citrus-dark`)
Cor footer: `text-ink-muted`
Sem ícone. Sem decoração. Sem ruptura.

### 9.4 Componentes prose (markdown rendering)

`MarkdownContent.tsx` aplica classes Tailwind prose customizadas com paleta InovCitrus:

- Headings em `text-ink` font-bold/extrabold
- Body em `text-ink-muted` leading-relaxed
- Links em `text-citrus-dark` (hover underline)
- Blockquotes com border-left `border-citrus`
- Tables com `bg-surface-warm` headers
- Inline code com `text-citrus-dark bg-surface-warm`

---

## 10. Arquitectura de rotas e mapa slug→ficheiro

### 10.1 Árvore de rotas

```
/                                    → redirect /pt        (src/app/page.tsx)
/[locale]                            → home               (src/app/[locale]/page.tsx)
/[locale]/[slug]                     → slug pages         (src/app/[locale]/[slug]/page.tsx)
```

### 10.2 Geração estática

`generateStaticParams` em `[locale]/layout.tsx` retorna `[{locale: 'pt'}, {locale: 'en'}, {locale: 'es'}, {locale: 'fr'}]`.

`generateStaticParams` em `[locale]/[slug]/page.tsx` retorna combinações de locale × slug-key (excluindo `home` que é a route raiz do locale).

Total: 20 paths estáticos. Build deve gerar `.next/server/app/{pt,en,es,fr}/{,project,structure,repository,contacts}/page.html`.

### 10.3 Comportamento i18n

- `LanguageSwitcher` (client component) usa `usePathname()` para extrair o slug actual e construir nova URL preservando-o.
- Exemplo: utilizador em `/en/project` clica "FR" → `/fr/project`.
- Não há tradução de slugs no URL (`/fr/projet` NÃO existe — é `/fr/project`).
- Frontmatter de cada `.md` mantém `slug` e `route` em cada idioma para referência interna mas estes campos NÃO controlam o roteamento.

---

## 11. Plano restante Dias 4-7 — comandos exactos

### 11.1 Dia 4 — Build + smoke test local

```bash
# 1. Verificar Node version
node --version       # >= 18.17

# 2. Navegar para o projecto
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-site/

# 3. Install
npm install

# 4. Build (deve passar sem erros)
npm run build

# 5. Smoke test local (deixar a correr)
npm run dev
# Abre http://localhost:3000

# 6. Executar checklist secção 12

# 7. Capturar 6 screenshots (ver 2.5)

# 8. Criar 04-landing/PROGRESSO-DIA-4.md

# 9. Reportar ao Eurico
```

**Saída esperada do build:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    [redirect]
├ ● /[locale]                            [resolved]
│   ├ /pt
│   ├ /en
│   ├ /es
│   └ /fr
└ ● /[locale]/[slug]
    ├ /pt/contacts
    ├ /pt/project
    ├ /pt/repository
    ├ /pt/structure
    ├ /en/contacts
    ... (16 mais)
○ (Static)  generated as static HTML
● (SSG)     generated as static HTML
```

### 11.2 Dia 5 — Deploy Vercel + PDFs das fichas técnicas

#### 5.A Deploy Vercel

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-site/

# Opção 1: Vercel CLI (preferida)
npx vercel login                  # se ainda não autenticado
npx vercel --prod                 # deploy directo
# Quando perguntar nome do projecto, escolher: inovcitrus
# Se taken: frusoal-inovcitrus

# Opção 2: GitHub + Vercel dashboard
# - Eurico push para repo público (com este projecto na pasta)
# - Conecta no vercel.com → Import → escolhe pasta inovcitrus-site
```

**Verificar pós-deploy:**
1. URL produção responde (200)
2. Todos os 4 locales carregam
3. Todos os 5 slugs funcionam em cada locale
4. Lighthouse Performance > 90
5. Lighthouse Accessibility > 95

#### 5.B Geração de PDFs das fichas técnicas (4 línguas)

Os ficheiros markdown estão em `inovcitrus-pdfs/source/{lang}/ficha-tecnica-scirtothrips-{lang}.md`.

**Abordagem recomendada:** Pandoc com template A4 sóbrio.

```bash
# Verificar se pandoc está instalado
pandoc --version

# Se não:
# Windows: choco install pandoc OR usar Pandoc do Eurico se já tiver
# Caso não tenha: alternativa via Puppeteer (mais complexo)

# Para cada língua:
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/

mkdir -p output

pandoc source/pt/ficha-tecnica-scirtothrips-pt.md \
  -o output/ficha-tecnica-scirtothrips-pt.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2cm \
  -V mainfont="Inter" \
  -V fontsize=10pt \
  -V documentclass=article

# Repetir para EN, ES, FR
```

**Alternativa sem Pandoc:** criar nova rota Next.js `/print/ficha-tecnica/[lang]` que renderiza HTML A4 e usar Chrome headless / Vercel PDF generator.

#### 5.C Output esperado Dia 5

- URL Vercel produção activa
- 4 PDFs em `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-{pt,en,es,fr}.pdf`
- Cada PDF tem 4 páginas A4
- Tipografia Inter ou similar sans-serif
- Layout sóbrio, paleta InovCitrus em headings/destaques
- Footer com URL inovcitrus.vercel.app

### 11.3 Dia 6 — Roadmap PDF visual + kit imprensa

#### 6.A Roadmap visual 36 meses (1 página A4 paisagem)

Input: `inovcitrus-pdfs/roadmap/roadmap-data.json` (12 marcos × 23 actos comunicativos).

**Abordagem recomendada:** página Next.js `/roadmap/print` que renderiza SVG/HTML A4 paisagem com:

- Eixo X: meses 0-36 (Q1 2026 → Q4 2028)
- Linha superior: 12 marcos científicos (cor `algarve`)
- Linha inferior: actos comunicativos agrupados por marco (cor `citrus`)
- Legenda
- Disclaimer "calendário representativo"
- Footer Frusoal InovCitrus

Exportar via Chrome headless ou Puppeteer:

```bash
# Pseudo-código:
npx puppeteer-cli print http://localhost:3000/roadmap/print \
  --output=inovcitrus-pdfs/output/roadmap-36-meses.pdf \
  --format=A4 --landscape
```

#### 6.B Kit imprensa

Criar `inovcitrus-kit-imprensa/` com:

| Ficheiro | Conteúdo |
|----------|----------|
| `wordmark-inovcitrus.svg` | Wordmark tipográfico em SVG (Inter regular+bold) |
| `wordmark-inovcitrus-mono.svg` | Variante monocromática preto |
| `press-release-pt.md` | Modelo press release lançamento (PT) — base do Postal 04/02/2026 |
| `press-release-en.md` | Tradução EN |
| `paleta.png` | Imagem com 6 swatches da paleta + hex |
| `README.md` | Instruções de uso (Pedro pode usar isto livremente) |

#### 6.C Output esperado Dia 6

- `inovcitrus-pdfs/output/roadmap-36-meses.pdf` (1 página A4 paisagem)
- `inovcitrus-kit-imprensa/` com 6+ ficheiros
- `PROGRESSO-DIA-6.md`

### 11.4 Dia 7 — Revisão final + entrega

#### 7.A Revisão final — checklist exaustivo

Verificar UM A UM:

1. **Cada afirmação científica/factual nas 4 línguas tem fonte em FONTES.md**
   - Cruzar manual: pegar 5 afirmações por língua, validar contra FONTES.md
   - Se alguma afirmação falha, corrigir ou marcar [GAP] explicitamente
2. **Site Vercel funcional**
   - 20 rotas respondem 200
   - LanguageSwitcher funciona em todas as páginas
   - Responsividade mobile OK
   - Lighthouse Accessibility ≥ 95 em pelo menos 1 página por locale
3. **4 PDFs ficha técnica**
   - Cada um abre · cada um tem 4 páginas · cada um tem footer correcto
4. **Roadmap PDF**
   - Abre · 1 página · texto legível
5. **Kit imprensa**
   - Wordmark SVG abre em browser
   - Press release modelo lê coerentemente
6. **Zero conteúdo "em nome da InPP" em qualquer ficheiro**
   - `grep -ri "InnovPlantProtect declar"` deve retornar zero
   - `grep -ri "InPP confirma"` deve retornar zero
   - Apenas "Parceiro científico: InnovPlantProtect" e referências por nome

#### 7.B Compilação envelope físico

Pasta única para Eurico imprimir:

```
inovcitrus-pdfs/output/PARA-IMPRIMIR/
├── 1-press-release-pt.pdf            (1 página)
├── 2-ficha-tecnica-scirtothrips-pt.pdf  (4 páginas)
├── 3-ficha-tecnica-scirtothrips-en.pdf  (4 páginas)
├── 4-ficha-tecnica-scirtothrips-es.pdf  (4 páginas)
├── 5-ficha-tecnica-scirtothrips-fr.pdf  (4 páginas)
├── 6-roadmap-36-meses.pdf            (1 página A4 paisagem)
└── README-EURICO.md                  (lista do que está cá, ordem sugerida)
```

#### 7.C Handoff final

Criar `docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega-pedro.md`:

- Estado: tudo entregue
- URL Vercel produção
- Lista de PDFs
- Lista de o que Pedro vê (resumo executivo)
- Como Eurico entrega (sugestão de momento natural)
- O que fazer se Pedro reagir bem (preparar reunião) ou mal (não insistir)
- Fontes consolidadas (F01-F16) para defesa em Q&A

---

## 12. Smoke test checklist exaustivo (Dia 4)

Executar TODOS após `npm run dev`:

| # | Teste | Critério de sucesso |
|---|-------|---------------------|
| 1 | Browser → http://localhost:3000 | Redirecciona para /pt |
| 2 | http://localhost:3000/pt | Mostra home PT, wordmark, navegação, footer |
| 3 | http://localhost:3000/en | Mostra home EN com terminologia EPPO |
| 4 | http://localhost:3000/es | Mostra home ES |
| 5 | http://localhost:3000/fr | Mostra home FR |
| 6 | Clicar em "Projecto Trienal" no header (PT) | Vai para /pt/project, mostra ficha completa |
| 7 | Clicar em "Estrutura" | Vai para /pt/structure |
| 8 | Clicar em "Repositório" | Vai para /pt/repository |
| 9 | Clicar em "Contactos" | Vai para /pt/contacts |
| 10 | Em /pt/project, clicar EN no LanguageSwitcher | Vai para /en/project (preserva slug) |
| 11 | Em /en/project, clicar ES | Vai para /es/project |
| 12 | Em /es/project, clicar FR | Vai para /fr/project |
| 13 | Em /fr/project, clicar PT | Vai para /pt/project |
| 14 | Tab no início da página | Skip link aparece visível |
| 15 | Premir Enter no skip link | Salta para `<main id="main">` |
| 16 | Resize browser para ~360px | Header empilha vertical, navegação envolve linhas |
| 17 | Inspeccionar consola (F12) | Zero erros vermelhos · zero warnings críticos |
| 18 | View source de /pt | Não contém `<!-- F0X -->` (foram removidos pelo loader) |

**Se algum teste falha:** corrigir antes de avançar para Dia 5. Não fazer deploy com bugs visíveis.

---

## 13. Erros previsíveis e mitigação

| Erro | Probabilidade | Causa | Mitigação |
|------|---------------|-------|-----------|
| `npm install` falha por permissões Windows | Baixa-média | Antivirus, OneDrive, path com espaços | Verificar path; tentar `npm install --no-bin-links` |
| Node < 18.17 detectado | Baixa | Ambiente desactualizado | **NÃO downgrade Next** — pedir Eurico para actualizar Node via nvm/winget |
| `npm run build` falha em `[slug]/page.tsx` com tipo de params | Média | Next 14 às vezes pede tipos explícitos `Promise<{ slug }>` | Mudar tipo de params para `Promise<{ locale: string; slug: string }>` se Next sugerir; ou fazer downgrade temporário a `dynamicParams = true` |
| `gray-matter` falha a parsear frontmatter | Baixa | Carácter especial em sources | `gray-matter` aceita; se houver erro, validar o YAML do frontmatter |
| `remark-html` faz escape de tabelas markdown | Média | `remark-gfm` faz parse mas precisa do plugin instalado | Confirmar `remark-gfm` está em `dependencies` (já está) |
| Estilos prose não aplicados (texto sem formatação) | Média | Plugin `@tailwindcss/typography` não carregado | Verificar `tailwind.config.ts` plugins array; reinstalar se necessário |
| Inter Google Fonts bloqueada por firewall | Baixa | Algumas redes bloqueiam Google Fonts | Fallback é system-ui (declarado no Tailwind config) |
| `usePathname` em Server Component | Erro garantido se acontecer | Misturar client/server | `LanguageSwitcher` já tem `'use client'` no topo |
| `process.cwd()` resolve para path inesperado | Baixa | Se executado fora da pasta inovcitrus-site/ | Garantir `cd inovcitrus-site/` antes de `npm run dev` |
| Build falha por `.next` cache stale | Baixa | Ficou cache de tentativa anterior | `rm -rf .next` e re-build |

---

## 14. Como fazer deploy Vercel (Dia 5)

### 14.1 Pré-requisitos

- Build local OK (Dia 4 passou)
- Eurico tem conta Vercel (verificar: `npx vercel whoami`)
- Se não tem: criar gratuita em vercel.com (login com GitHub)

### 14.2 Deploy via CLI (preferida — mais simples)

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-site/

# Login (uma vez)
npx vercel login

# Deploy preview (test)
npx vercel

# Quando perguntar:
# "Set up and deploy?" → Y
# "Which scope?" → conta Eurico
# "Link to existing project?" → N (primeira vez)
# "Project name?" → inovcitrus  (ou frusoal-inovcitrus se ocupado)
# "In which directory is your code?" → ./  (já está na pasta correcta)
# "Want to override settings?" → N

# Após preview OK, deploy production
npx vercel --prod
```

URL produção: `https://inovcitrus.vercel.app` ou `https://frusoal-inovcitrus.vercel.app`.

### 14.3 Verificações pós-deploy

```bash
# 1. URL responde
curl -I https://inovcitrus.vercel.app
# Deve retornar 200 com redirect para /pt

# 2. Cada locale responde
for loc in pt en es fr; do
  echo "Testing /$loc..."
  curl -s -o /dev/null -w "%{http_code}\n" "https://inovcitrus.vercel.app/$loc"
done
# Todos devem retornar 200

# 3. Cada slug responde
for loc in pt en es fr; do
  for slug in project structure repository contacts; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "https://inovcitrus.vercel.app/$loc/$slug")
    echo "$loc/$slug: $code"
  done
done
# Todos os 16 combinations devem retornar 200
```

### 14.4 Lighthouse / Accessibility

Abrir DevTools → Lighthouse → Run. Targets:
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 90

---

## 15. Como gerar PDFs das fichas técnicas (Dia 5)

### 15.1 Opção A — Pandoc (preferida)

Verificar instalação: `pandoc --version`. Se não:
- Windows: `winget install pandoc` ou `choco install pandoc`
- macOS: `brew install pandoc`
- Linux: `sudo apt install pandoc`

Para PDF Pandoc precisa de motor LaTeX:
- Windows: `winget install MiKTeX.MiKTeX`
- macOS: `brew install --cask mactex`

Comando por língua:

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/

mkdir -p output

for lang in pt en es fr; do
  pandoc "source/$lang/ficha-tecnica-scirtothrips-$lang.md" \
    -o "output/ficha-tecnica-scirtothrips-$lang.pdf" \
    --pdf-engine=xelatex \
    -V geometry:margin=2.5cm \
    -V mainfont="Inter" \
    -V sansfont="Inter" \
    -V fontsize=10pt \
    -V documentclass=article \
    -V colorlinks=true \
    -V linkcolor=orange
done
```

### 15.2 Opção B — Sem Pandoc (Puppeteer via Next.js)

Adicionar rota `/print/ficha-tecnica/[lang]` em Next.js que renderize o markdown como página A4 estilizada. Depois usar Puppeteer:

```javascript
// scripts/generate-pdfs.js (criar este script)
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (const lang of ['pt', 'en', 'es', 'fr']) {
    await page.goto(`http://localhost:3000/print/ficha-tecnica/${lang}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: `inovcitrus-pdfs/output/ficha-tecnica-scirtothrips-${lang}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });
  }
  await browser.close();
})();
```

Instalar: `npm install -D puppeteer`. Esta opção evita LaTeX mas adiciona ~250MB de Chromium.

### 15.3 Output esperado

```
inovcitrus-pdfs/output/
├── ficha-tecnica-scirtothrips-pt.pdf  (4 páginas A4)
├── ficha-tecnica-scirtothrips-en.pdf  (4 páginas A4)
├── ficha-tecnica-scirtothrips-es.pdf  (4 páginas A4)
└── ficha-tecnica-scirtothrips-fr.pdf  (4 páginas A4)
```

---

## 16. Como gerar roadmap visual 36 meses (Dia 6)

### 16.1 Input

`inovcitrus-pdfs/roadmap/roadmap-data.json` — 12 marcos × 23 actos comunicativos × 36 meses.

### 16.2 Abordagem: página Next.js dedicada

Criar `src/app/print/roadmap/page.tsx` que:

1. Lê `roadmap-data.json`
2. Renderiza SVG ou Canvas com:
   - Eixo temporal horizontal (Q1 2026 → Q4 2028)
   - 12 milestones científicos como pontos sobre uma linha (cor `algarve`)
   - Para cada milestone, listar actos comunicativos como rectângulos pequenos abaixo (cor `citrus`)
   - Legenda
   - Footer com fonte e disclaimer
3. CSS A4 paisagem: `@page { size: A4 landscape; margin: 1cm; }`

### 16.3 Geração

```bash
# Após criar a rota /print/roadmap em Next.js:
npm run dev
# Em outro terminal:
node scripts/generate-roadmap-pdf.js
# (script Puppeteer similar ao 15.2)
```

### 16.4 Output esperado

`inovcitrus-pdfs/output/roadmap-36-meses.pdf` — 1 página A4 paisagem, sóbria, com paleta InovCitrus.

---

## 17. Como compilar o envelope físico de entrega (Dia 7)

### 17.1 Pasta final

```
inovcitrus-pdfs/output/PARA-IMPRIMIR/
├── 0-README-EURICO.md                       (instruções)
├── 1-press-release-pt.pdf                   (1 página A4)
├── 2-ficha-tecnica-scirtothrips-pt.pdf      (4 páginas A4)
├── 3-ficha-tecnica-scirtothrips-en.pdf      (4 páginas A4)
├── 4-ficha-tecnica-scirtothrips-es.pdf      (4 páginas A4)
├── 5-ficha-tecnica-scirtothrips-fr.pdf      (4 páginas A4)
└── 6-roadmap-36-meses-A4-paisagem.pdf       (1 página)
```

Total: 6 PDFs · 18 páginas A4 imprimíveis.

### 17.2 README-EURICO.md sugerido

Conteúdo:

```markdown
# Envelope físico — Casa Pública Frusoal InovCitrus

## O que está aqui (ordem de impressão)

1. Press release modelo (PT) — 1 página
2-5. Ficha técnica Scirtothrips — 4 páginas × 4 línguas (PT/EN/ES/FR) — 16 páginas total
6. Roadmap 36 meses — 1 página paisagem

## Sugestão de uso

- Imprime os 6 PDFs em papel branco gramado (idealmente 100g+).
- Mete num envelope A4 sóbrio.
- Anexa cartão escrito à mão (estilo Eurico): "Pedro, fizemos isto. Está aqui se fizer sentido. Eurico."
- Entrega em mão ou deixa na recepção da Frusoal em VN Cacela.
- URL Vercel: https://inovcitrus.vercel.app — Pedro pode aceder no telemóvel/portátil.

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

## 18. Memórias relevantes (lista completa de leitura obrigatória)

| Memória | Caminho | Relevância |
|---------|---------|-------------|
| Frusoal — propósito desta fase | `memory/project_frusoal_proposito.md` | Análise + identificar onde aplicar IA · registo via PRD |
| Frusoal — Eurico conhece Pedro | `memory/project_frusoal_eurico_pedro_relacao.md` | Canal informal/presencial · zero cold outreach · Algarve/VRSA |
| Nunca "combo" a clientes maduros | `memory/feedback_nunca_combo_clientes_comerciais.md` | Frusoal 45 anos = consultoria estratégica plurianual, não vendor SaaS |
| Nunca projectar modelo de negócio | `memory/feedback_no_projected_business_models.md` | Responder só ao pedido, não inventar segundos capítulos |
| Handoffs com detalhe | `memory/feedback_handoffs_detail.md` | Decisões exactas + citações + contexto |
| Nunca inventar casos | `memory/feedback_no_invented_cases.md` | Zero exemplos fictícios |
| Nunca fechar terminais | `memory/feedback_never_close_terminals.md` | Eurico tem múltiplos terminais — não fechar |
| Não recomeçar do zero | `memory/feedback_never_restart_context.md` | Ler RETOMA + memória antes de qualquer pergunta |
| Não instalar mais ferramentas | `memory/feedback_no_more_tools.md` | Validar ANTES de sugerir tools novas · GPU 4GB no Eurico (IA local inviável) |
| Governance nunca bloqueia execução | `memory/feedback_governance_never_blocks_execution.md` | Não pedir aprovação @pm · propor 1 caminho concreto |
| Modelo Acolhe-Adapta-Rentabiliza | `memory/feedback_community_acolhe_adapta_model.md` | **NÃO aplica a Frusoal** — Frusoal é cliente comercial |
| Frusoal é cliente real | (implícito de prompt-original.md) | Eurico tem de entregar — não é teste |
| todolist.html é fonte da verdade da imersão | `memory/feedback_todolist_source_of_truth.md` | (não aplicável aqui) |
| Salvar análises antes de implementar | `memory/feedback_save_analysis.md` | Gravar mapeamentos em memória antes de implementar |

---

## 19. Erros que NÃO podem repetir (acumulado de 4 sessões)

| Erro | Origem | Como evitar |
|------|--------|-------------|
| "Combo" / "package" / "ROI 6 meses" / linguagem vendor SaaS | Sessão 23/04 PRD v1 | Usar "consultoria" · "acompanhamento" · "plurianual" |
| Cold outreach via LinkedIn DM | Sessão 23/04 | Canal é presencial/informal |
| Projectar segundos capítulos não pedidos | Sessão 23/04 | Responder só ao pedido |
| Confundir Frusoal-empresa com Frusoal InovCitrus | Sessão 23/04 | Acto 1 = InovCitrus polo I&D · Acto 2 = empresa toda (futuro) |
| Propor ferramentas que colidem com core InPP (Pest Analyzer-like, SIG pragas, ML preditivo, drone imagery, app contagem) | Sessão 24/04 | Lista de proibições secção 3 do handoff Dia 24/04 (arquivado) |
| Acumular strands paralelos sem fechar | Sessão 25/04 | Auditoria + 1 caminho concreto |
| Avançar com hello world antes de entender dor raiz | Sessão 24/04 | Trabalho de casa primeiro |
| Inventar dados sobre InPP, Pedro, Sisgarbe, equipa científica | Sistémico | F01-F16 são as únicas fontes válidas |
| Conteúdo "em nome da InPP" | Risco actual | InPP só por citação verbatim de F05 + cross-tag |
| Logos InPP/CCDR sem autorização | Risco actual | Substituir por nome textual |
| Inventar coordenador científico do polo | Risco actual | Q2 default omite página equipa |
| Inventar morada de sede em Tavira | Risco actual | Q4 default fica vago |
| Tradução literal sem terminologia regional oficial | Sessão 25/04 (mitigado Dia 2) | EN: EPPO/EFSA · ES: Junta Andalucía/MAPA · FR: OEPP |
| Avançar sem ler prompt original | Sistémico | Secção 2.2 deste handoff lista ordem de leitura |
| Criar PRD antes de Eurico responder | Sessões 23-24/04 | Substituído por entregável concreto · sem PRD novo |

---

## 20. Fontes F01-F16 — URLs exactos (rastreabilidade)

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

## 21. Compromissos finais (Dia 7)

| Compromisso | Cumprimento |
|-------------|--------------|
| Cada afirmação rastreada a fonte | Checklist Dia 7 cruza FONTES.md com markdown |
| Site Vercel funcional 4 línguas | Dia 5 |
| 4 PDFs ficha técnica imprimíveis | Dia 5 |
| Roadmap PDF visual | Dia 6 |
| Kit imprensa | Dia 6 |
| Envelope físico compilado | Dia 7 |
| Handoff "pronto para Eurico entregar" | Dia 7 |
| Zero invenção · zero "em nome da InPP" · zero logos não-autorizados | Sempre |

---

## 22. Troubleshooting frequente (FAQ)

### Q: `npm install` instala mas `npm run dev` falha "Cannot find module 'next'"

A: Eliminar `node_modules` + `package-lock.json` e re-instalar. Verificar que estás na pasta `inovcitrus-site/` e não na raiz do repo.

### Q: Build falha "Module not found: '@/lib/i18n'"

A: Verificar `tsconfig.json` tem `baseUrl: "."` e `paths: { "@/*": ["./src/*"] }`. Já está configurado mas se foi alterado, restaurar.

### Q: Tabelas markdown aparecem como HTML escaped no browser

A: `remark-gfm` em falta. Verificar `package.json` deps inclui `remark-gfm` 4.0.0. Re-instalar se necessário.

### Q: Inter font não carrega (browser usa fallback Arial)

A: Importação em `globals.css` está bem (`@import url('https://fonts.googleapis.com/...')`). Se há firewall: já existe fallback `system-ui` no Tailwind config.

### Q: LanguageSwitcher não responde a click

A: Verificar `'use client'` no topo de `LanguageSwitcher.tsx`. Server components não podem ter event handlers.

### Q: Algumas páginas sem header/footer

A: Layout em `[locale]/layout.tsx` é o que injecta header/footer. Verificar que `[slug]/page.tsx` está aninhado em `[locale]/` (deve estar — verificar estrutura).

### Q: `generateStaticParams` não gera todas as combinações

A: Em `[slug]/page.tsx`, função deve retornar array de objectos com TODOS os params: `{ locale: 'pt', slug: 'project' }`, etc. Já está implementado correctamente.

### Q: `process.cwd()` resolve mal

A: Apenas funciona se executar `npm run dev` ou `npm run build` a partir da pasta `inovcitrus-site/`. Não executar a partir da raiz do repo.

### Q: Vercel deploy falha

A: Logs em vercel.com/dashboard. Causas comuns: ENV vars faltam (não temos), node version (configurar em `package.json` engines), build memory (raro).

### Q: Pedro pergunta "como sei que estes dados estão certos?"

A: Eurico abre `04-landing/FONTES.md` no telemóvel/portátil. Tudo tem URL público. Cada afirmação foi rastreada.

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER OUTPUT FRUSOAL, LER:
1. `.claude/rules/frusoal-source-of-truth.md`
2. `membros/cliente-frusoal/prompt-original.md`
3. **Este handoff integralmente**
4. `04-landing/FONTES.md`
5. `04-landing/PROGRESSO-DIA-{1,2,3}.md`

VIOLAÇÃO = PARAR · DESCARTAR · REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-3-scaffold-nextjs-pronto-para-build.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-3-scaffold-nextjs-pronto-para-build.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026 (Dia 3 da execução, mesmo dia natural Dias 1+2+3)
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — terminal fresh continua Dia 4)

---

*Fim do handoff Dia 3 expandido — auto-suficiente para terminal fresh. ~700 linhas. Tudo o que o próximo agente precisa para Dias 4-7 está aqui. Zero perda de contexto esperada.*
