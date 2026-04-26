# Tipografia InovCitrus — Spec Final

> v2.0 final · 26/04/2026 · par tipográfico elevado
> Inter (mantido v1.0) + JetBrains Mono (mantido v1.0) + **Fraunces** (novo · serif display)

---

## 1. Filosofia tipográfica

InovCitrus precisa de:
- **Sabor científico-clássico** sem soar dated
- **Modernidade legível** em ecrã (mobile + desktop)
- **Autoridade técnica** para dados e IDs científicos
- **Coerência com Frusoal-mãe** (45 anos de tradição) + InovCitrus (projecto trienal)

A solução: **3 famílias com papéis claros**, cada uma com responsabilidade específica.

---

## 2. Famílias tipográficas

### 2.1 Fraunces (Display · NOVO)

**Origem:** Google Fonts · open source · variable font
**Estilo:** Serif moderno com ressonância clássica (inspirado em séc. XVIII typographic specimens)
**Pesos:** 400 (Regular), 600 (SemiBold), 800 (Black)
**Variantes:** Romana + Itálica
**Carregamento:** Google Fonts CDN

**Uso:** H1 + H2 (display) · marca editorial · pull quotes · Plate Card titles

**Por que Fraunces e não outra serif:**
- Variable font (1 ficheiro · múltiplos pesos)
- Tem sufixos opcionais (SOFT, WONK) que dão personalidade controlada
- WCAG-friendly: x-height alta, contadores abertos
- Coerente com tema "plate botânico" sem ser pastiche
- Fundamento ortográfico forte para PT/EN/ES/FR (todos os diacríticos)

**Alternativas consideradas e rejeitadas:**
- Playfair Display: muito ornamental, falha legibilidade em corpo médio
- Cormorant Garamond: muito refinado, falha em mobile pequeno
- Source Serif Pro: bom mas sem personalidade distintiva
- IBM Plex Serif: muito tech, perde sabor científico

### 2.2 Inter (UI · mantida v1.0)

**Origem:** Google Fonts · open source · variable font
**Estilo:** Sans humanista neutro, optimizado para ecrã
**Pesos:** 400, 500, 600, 700, 800
**Carregamento:** Google Fonts CDN

**Uso:** Body · UI · navegação · botões · forms · H3-H6 · captions

### 2.3 JetBrains Mono (Mono · mantida v1.0)

**Origem:** JetBrains · open source
**Estilo:** Monospace técnica, ligaduras opcionais
**Pesos:** 400, 500
**Carregamento:** Google Fonts CDN

**Uso:** Code snippets · IDs científicos · footnotes F01-F16 · dados numéricos · token names

---

## 3. Escala tipográfica completa

### 3.1 Display (Fraunces)

| Nível | Tamanho | rem | Peso | Line-height | Letter-spacing | Uso |
|-------|---------|-----|------|-------------|-----------------|-----|
| Display XL | 4.0rem | 64px | 800 | 1.05 | -0.04em | Hero único · landing apenas |
| Display L (H1) | 3.0rem | 48px | 800 | 1.10 | -0.03em | Page titles |
| Display M (H2) | 2.25rem | 36px | 600 | 1.15 | -0.02em | Section titles |
| Pull Quote | 1.75rem | 28px | 400 italic | 1.4 | -0.01em | Citações destacadas |

### 3.2 Headings UI (Inter)

| Nível | Tamanho | rem | Peso | Line-height | Letter-spacing | Uso |
|-------|---------|-----|------|-------------|-----------------|-----|
| H3 | 1.5rem | 24px | 700 | 1.3 | -0.01em | Subsections · card titles |
| H4 | 1.25rem | 20px | 700 | 1.35 | 0 | Sub-subsections |
| H5 | 1.0rem | 16px | 700 | 1.4 | 0 | Card subtitles |
| H6 | 0.875rem | 14px | 700 | 1.4 | 0.02em | Micro headings · uppercase |

### 3.3 Body (Inter)

| Nível | Tamanho | rem | Peso | Line-height | Letter-spacing | Uso |
|-------|---------|-----|------|-------------|-----------------|-----|
| Body L | 1.125rem | 18px | 400 | 1.7 | 0 | Body destaque · intro paragraphs |
| Body M | 1.0rem | 16px | 400 | 1.7 | 0 | Body padrão · texto corrente |
| Body S | 0.875rem | 14px | 400 | 1.6 | 0 | Body compact · meta info |
| Caption | 0.75rem | 12px | 500 | 1.5 | 0.01em | Captions · labels · alt text |

### 3.4 UI elements (Inter)

| Elemento | Tamanho | rem | Peso | Line-height | Letter-spacing |
|----------|---------|-----|------|-------------|-----------------|
| Button L | 1.0rem | 16px | 600 | 1 | 0.01em |
| Button M | 0.875rem | 14px | 600 | 1 | 0.02em |
| Button S | 0.75rem | 12px | 600 | 1 | 0.05em |
| Input | 1.0rem | 16px | 400 | 1.5 | 0 |
| Label | 0.875rem | 14px | 500 | 1.4 | 0.02em |
| Nav link | 0.9375rem | 15px | 500 | 1.4 | 0 |

### 3.5 Mono (JetBrains Mono)

| Nível | Tamanho | rem | Peso | Line-height | Letter-spacing | Uso |
|-------|---------|-----|------|-------------|-----------------|-----|
| Code block | 0.875rem | 14px | 400 | 1.6 | 0 | Code snippets multi-linha |
| Inline code | 0.875rem | 14px | 500 | 1.4 | 0 | `code` inline |
| Tag · Badge | 0.6875rem | 11px | 500 | 1 | 0.1em uppercase | Tags · badges UI |
| Footnote ID | 0.75rem | 12px | 500 | 1.4 | 0.02em | F01-F16 references |
| Scientific ID | 0.875rem | 14px | 400 italic | 1.4 | 0 | *Scirtothrips aurantii* |

---

## 4. Hierarquia visual (regras combinadas)

### 4.1 Página padrão

```
Display L (Fraunces 48/1.10)        ← H1 da página
  Body L (Inter 18/1.7)              ← intro paragraph
  Display M (Fraunces 36/1.15)       ← H2 secção
    H3 (Inter 24/1.3)                ← subsection
      Body M (Inter 16/1.7)          ← texto corrente
      Caption (Inter 12/1.5)         ← meta info
```

### 4.2 Plate Card

```
[Selo Solar ↗]
Display M (Fraunces 36/1.15 · italic) ← Plate title
  H6 (Inter 14/1.4 · uppercase)       ← Plate subtitle/category
  Body S (Inter 14/1.6)               ← Plate description
  Footnote ID (JetBrains 12/1.4)      ← F-source · scientific ID
```

### 4.3 Quote F-Bloco

```
Pull Quote (Fraunces 28/1.4 italic)    ← citação principal
  Caption (Inter 12/1.5)                ← autor · data
  Footnote ID (JetBrains 12/1.4)        ← F01-F16 link
```

### 4.4 Ficha Praga

```
H2 Display M (Fraunces 36/1.15)        ← Nome comum
  Scientific ID (JetBrains 14/italic)  ← Nome científico
  Body M (Inter 16/1.7)                ← Descrição
  H6 uppercase (Inter 14/1.4)          ← Sintomas · Controlo · Referências
  Body S (Inter 14/1.6)                ← Detalhes
  Footnote IDs (JetBrains 12/1.4)      ← F-sources
```

---

## 5. Carregamento (performance)

### 5.1 Estratégia

- **Self-host evitado** — usar Google Fonts CDN (cache cross-site melhor)
- **Variable fonts** — Fraunces e Inter são variable (1 ficheiro)
- **Preload críticas** — Fraunces 800 + Inter 400/700 preloaded
- **font-display: swap** — fallback antes de fonts carregadas

### 5.2 HTML link tag

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,800;1,400&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet">
```

### 5.3 CSS variables

```css
:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
```

### 5.4 Fallbacks

| Família | Fallback chain |
|---------|----------------|
| Fraunces | `Georgia, serif` (sempre presente · proximidade visual) |
| Inter | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| JetBrains Mono | `'SF Mono', Menlo, Monaco, Consolas, monospace` |

---

## 6. Wordmark (mantém v1.0)

```
Frusoal     InovCitrus
Inter 400 · Inter 800 · #C68420
```

**Decisão:** wordmark fica intocado da v1.0. **Não migrar para Fraunces.** O wordmark institucional precisa de sobriedade Inter; Fraunces é para display editorial dentro do brandbook e site.

---

## 7. Acessibilidade tipográfica

| Regra | Detalhe |
|-------|---------|
| Tamanho mínimo body | 16px (1.0rem) — nunca menor para leitura corrente |
| Tamanho mínimo caption | 12px (0.75rem) — nunca menor |
| Line-height mínimo body | 1.5 — preferível 1.7 para conforto |
| Letter-spacing | Negativo apenas em Display (-0.04em a -0.01em) · nunca em body |
| Uppercase | Letter-spacing positivo obrigatório (mínimo 0.02em) |
| Italic | Apenas em pull quotes, scientific IDs, ênfase semântica · nunca para body |
| Contraste | Ver `PALETA-EXTENDIDA.md` secção 3 |

---

## 8. Checklist de implementação

- [ ] Adicionar `<link>` Google Fonts no `layout.tsx` do site Next.js
- [ ] Adicionar 3 CSS variables `--font-display`, `--font-body`, `--font-mono` em `globals.css`
- [ ] Adicionar 3 famílias a `tailwind.config.ts` no objecto `theme.extend.fontFamily`
- [ ] Adicionar escala completa a `tailwind.config.ts` em `theme.extend.fontSize` (com line-height tuples)
- [ ] Documentar specimens na página `/identidade` secção `#tipografia`
- [ ] Implementar live type tester (input livre que mostra texto em todas as escalas)
- [ ] Validar render em 4 línguas (PT, EN, ES, FR) — diacríticos correctos
- [ ] Validar performance: Lighthouse font-display + LCP

---

*Spec produzida por Uma (`@ux-design-expert`) em 26/04/2026 · Task #4 do brandbook InovCitrus.*
