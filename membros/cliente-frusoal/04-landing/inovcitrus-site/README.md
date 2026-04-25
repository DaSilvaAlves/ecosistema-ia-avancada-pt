# Frusoal InovCitrus — Casa Pública

> Site institucional do polo I&D **Frusoal InovCitrus** em 4 línguas (PT, EN, ES, FR).
> Versão preliminar 1.0 · 25/04/2026 · Não publicada.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Estilização | Tailwind CSS + @tailwindcss/typography |
| Conteúdo | Markdown em `content/{locale}/` (gray-matter + remark) |
| i18n | App Router segments `[locale]/` (pt, en, es, fr) |
| Hosting | Vercel |
| Tipografia | Inter (Google Fonts) |

---

## Estrutura

```
inovcitrus-site/
├── content/
│   ├── pt/  (master)
│   ├── en/  (terminologia EPPO/EFSA/CABI)
│   ├── es/  (terminologia RAIF/MAPA/BOJA 2020)
│   └── fr/  (terminologia OEPP)
├── src/
│   ├── app/
│   │   ├── layout.tsx (root)
│   │   ├── page.tsx (redirect → /pt)
│   │   └── [locale]/
│   │       ├── layout.tsx (header + footer)
│   │       ├── page.tsx (home)
│   │       └── [slug]/page.tsx (project, structure, repository, contacts)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Wordmark.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── MarkdownContent.tsx
│   └── lib/
│       ├── i18n.ts
│       └── content.ts
├── tailwind.config.ts
├── next.config.mjs
└── vercel.json
```

---

## Comandos

```bash
npm install        # primeira vez
npm run dev        # localhost:3000
npm run build      # build produção
npm start          # serve build
```

---

## Identidade visual

| Token | Valor | Uso |
|-------|-------|-----|
| `citrus` | `#E8A53C` | Cor primária — laranja citrino maduro (alinhada com Frusoal) |
| `citrus-dark` | `#C68420` | Hover/links/destaque |
| `algarve` | `#5A8C45` | Cor secundária — verde algarvio sóbrio |
| `ink` | `#1A1A1A` | Texto principal |
| `ink-muted` | `#3A3A3A` | Texto corpo |
| `ink-subtle` | `#6B6B6B` | Metadados |
| `surface-warm` | `#FAF8F4` | Fundo página (off-white quente) |
| `surface-border` | `#E5E2DA` | Linhas de separação |
| Fonte | Inter (400/500/600/700/800) | Headings + body |
| Mono | JetBrains Mono | Código (raro) |

Wordmark: tipográfico **Frusoal** (regular) + **InovCitrus** (bold), sem ícone, alinhado com tom institucional Frusoal.

---

## Fontes do conteúdo

Todas as afirmações científicas/factuais rastreadas em `../FONTES.md` (F01-F16).

Cada ficheiro markdown tem `sources: [F0X, F0Y]` no frontmatter. Comentários `<!-- F0X -->` no markdown são removidos automaticamente pelo loader (`stripSourceComments` em `src/lib/content.ts`) e não aparecem no HTML público — servem só para rastreabilidade interna.

---

## Princípios inegociáveis

| Princípio | Aplicação |
|-----------|-----------|
| Zero conteúdo em nome da InPP | InPP referida sempre por nome textual + cross-tag — nunca em nome dela |
| Logos de terceiros (InPP, CCDR) | Não usados nesta versão; apenas referência textual |
| PT-PT estrito (master) | EN/ES/FR são paráfrases informadas por fontes regionais oficiais |
| Versão preliminar 1.0 | Declarada no rodapé de cada ficha técnica e em metadados |

---

## Próximos dias

- Dia 4: build local e verificação 4 línguas
- Dia 5: deploy Vercel + ficha técnica PDF × 4 línguas
- Dia 6: roadmap PDF visual + kit imprensa
- Dia 7: revisão final + handoff "pronto para entrega ao Pedro"
