# Componentes Assinatura InovCitrus

> v1.0 · 26/04/2026 · 5 componentes únicos que dão personalidade visual ao InovCitrus
> Base: paleta extendida + par tipográfico Fraunces/Inter/JetBrains Mono
> Inspiração: plate botânico do séc. XIX · cartografia · livro científico

---

## Sumário dos 5 componentes

| # | Componente | Função | Onde usar |
|---|------------|--------|-----------|
| 1 | **Plate Card** | Card com moldura fina + corner mark + footer científico | Variedades · marcos roadmap · parceiros |
| 2 | **Cronos** | Timeline científica horizontal sóbria | Roadmap 36 meses · cronologia |
| 3 | **Ficha Praga** | Componente estruturado tipo ficha de campo | Scirtothrips aurantii · futuras pragas |
| 4 | **Tabela Científica** | Tabela com cabeçalhos + footnotes F-source | Dados técnicos · indicadores |
| 5 | **Quote F-Bloco** | Citação com fonte rastreada F01-F16 | Truelines · evidência |

---

## 1. Plate Card

### 1.1 Anatomia

```
╔══════════════════════════════════════════════╗
║  [⚜ Solar corner mark]                       ║
║                                              ║
║  Plate XII · CITRUS                          ║  ← Caption mono (Plate ID)
║                                              ║
║  Citrus sinensis                             ║  ← Display M Fraunces italic
║  laranja doce                                ║  ← H6 Inter uppercase tracked
║                                              ║
║  ──────────────────────                      ║  ← divider hatch (1px Algarve)
║                                              ║
║  Lorem ipsum dolor sit amet, consectetur     ║  ← Body S Inter
║  adipiscing elit. Citrus sinensis cresce     ║
║  no Algarve há 8 séculos.                    ║
║                                              ║
║  ──────────────────────                      ║  ← divider hatch
║                                              ║
║  F03  •  Pomares Frusoal  •  2025            ║  ← Footnote ID + meta
╚══════════════════════════════════════════════╝
```

### 1.2 Variantes

| Variante | Diferença | Uso |
|----------|-----------|-----|
| `default` | Surface warm fundo · Algarve dark moldura | Padrão |
| `featured` | Pergaminho fundo · Citrus dark moldura · Solar selo destacado | Marcos importantes |
| `dark` | Tinta fundo · Solar text destacado | Plates em footer/dark sections |
| `compact` | Sem corner mark · sem dividers · padding reduzido | Listagens densas |

### 1.3 States

| Estado | Visual |
|--------|--------|
| Default | Border 1px Algarve dark · shadow none |
| Hover | Border 1px Citrus dark · shadow `0 4px 12px rgba(198,132,32,0.15)` · Solar glow corner mark |
| Focus | Outline 2px Citrus offset 2px |
| Active | Border 1px Algarve dark · transform `translateY(1px)` |

### 1.4 Props (TypeScript)

```typescript
interface PlateCardProps {
  plateId: string;              // "Plate XII"
  category: string;             // "CITRUS"
  title: string;                // "Citrus sinensis"
  subtitle?: string;            // "laranja doce"
  description: string;
  footnoteId?: string;          // "F03"
  meta?: string[];              // ["Pomares Frusoal", "2025"]
  variant?: 'default' | 'featured' | 'dark' | 'compact';
  href?: string;                // se interactivo, vira <a>
}
```

### 1.5 CSS chave

```css
.plate-card {
  background: var(--core-surface-warm);
  border: 1px solid var(--core-algarve-dark);
  border-radius: 4px;            /* sóbrio · não tech */
  padding: 1.5rem;
  position: relative;
  font-family: var(--font-body);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.plate-card::before {                          /* corner mark Solar */
  content: '⚜';
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-size: 1.25rem;
  color: var(--fn-solar);
  opacity: 0.6;
  transition: opacity 200ms ease;
}

.plate-card:hover {
  border-color: var(--core-citrus-dark);
  box-shadow: 0 4px 12px rgba(198,132,32,0.15);
}

.plate-card:hover::before {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255,210,122,0.5));  /* glow solar subtil */
}

.plate-card__id {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--core-algarve-dark);
  margin-bottom: 1rem;
}

.plate-card__title {
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.15;
  color: var(--core-ink);
  margin: 0;
}

.plate-card__subtitle {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--core-algarve-dark);
  margin-top: 0.25rem;
}

.plate-card__divider {
  border: none;
  height: 1px;
  background-image: repeating-linear-gradient(
    90deg,
    var(--core-algarve-dark) 0,
    var(--core-algarve-dark) 4px,
    transparent 4px,
    transparent 8px
  );
  margin: 1rem 0;
  opacity: 0.4;
}
```

### 1.6 Acessibilidade

- Se `href` presente, virar `<a>` em vez de `<div>` · navegável por teclado
- `corner mark` decorativo · `aria-hidden="true"`
- Contraste AAA garantido (Ink em Surface warm = 16.4)
- Focus visible outline 2px Citrus

---

## 2. Cronos (timeline científica)

### 2.1 Anatomia

```
2025                2026                2027                2028
 │                   │                   │                   │
 ●━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━●
 │                   │                   │                   │
 [Marker M01]        [Marker M04]        [Marker M08]        [Marker M12]
 Caracterização      Pilots IA           Replicação Algarve  Reporting trienal
 Scirtothrips                            
```

### 2.2 Variantes

| Variante | Diferença |
|----------|-----------|
| `horizontal` | Padrão · desktop |
| `vertical` | Mobile · narrow viewports |
| `compact` | Sem marker text · só pontos + datas |

### 2.3 Estrutura visual

- Linha base: 2px Algarve dark
- Markers: círculos 12px Citrus dark com border 2px Surface warm
- Marker activo (presente): círculo Solar 16px com ring Solar outer 2px
- Marker passado: círculo Algarve dark sólido
- Marker futuro: círculo outline Algarve dark fundo Surface warm
- Datas: JetBrains Mono 0.875rem · uppercase tracked
- Marker labels: Inter H5 700 · Body S 14/1.6

### 2.4 Props

```typescript
interface CronosMarker {
  id: string;                   // "M01"
  date: string;                 // "2025-Q3"
  label: string;                // "Caracterização"
  description?: string;
  status: 'past' | 'present' | 'future';
  href?: string;                // link para PDF/secção
}

interface CronosProps {
  markers: CronosMarker[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'compact';
}
```

---

## 3. Ficha Praga (componente científico)

### 3.1 Anatomia

```
┌─────────────────────────────────────────────┐
│  Plate VII · PRAGA                          │  ← Caption mono
│                                             │
│  Tripes da África do Sul                    │  ← H1 Display L Fraunces
│  Scirtothrips aurantii                      │  ← Scientific ID JetBrains italic
│                                             │
│  Ordem · Thysanoptera                       │  ← Meta data line
│  Família · Thripidae                        │
│  Detecção PT · 2024 (Algarve)               │
│                                             │
│  ════════════════                           │  ← Section divider thick
│                                             │
│  DESCRIÇÃO                                  │  ← H6 uppercase Algarve dark
│  ────────────────                           │
│  Body M descrição da praga, biologia...     │
│                                             │
│  SINTOMAS                                   │
│  ────────────────                           │
│  • Manchas prateadas em folhas              │
│  • Deformação de frutos jovens              │
│  • Necroses superficiais                    │
│                                             │
│  CONTROLO                                   │
│  ────────────────                           │
│  Body M métodos de controlo IPM...          │
│                                             │
│  ════════════════                           │
│                                             │
│  Fontes · F03 F07 F11                       │  ← Footnote IDs JetBrains
│                                             │
└─────────────────────────────────────────────┘
```

### 3.2 Layout responsivo

- Desktop (>1024px): 1 coluna larga max-width 720px
- Tablet (768-1024px): 1 coluna fluida com padding maior
- Mobile (<768px): 1 coluna full · padding reduzido · scientific ID quebra em linha própria

### 3.3 Props

```typescript
interface FichaPragaSection {
  title: string;                // "DESCRIÇÃO" | "SINTOMAS" | "CONTROLO"
  content: string | string[];   // texto ou lista
  type?: 'paragraph' | 'list';
}

interface FichaPragaProps {
  plateId: string;              // "Plate VII"
  category: string;             // "PRAGA"
  commonName: string;           // "Tripes da África do Sul"
  scientificName: string;       // "Scirtothrips aurantii"
  metadata: { label: string; value: string }[];
  sections: FichaPragaSection[];
  sourceFootnoteIds: string[];  // ["F03", "F07", "F11"]
}
```

---

## 4. Tabela Científica

### 4.1 Anatomia

```
Tabela 03 · Indicadores produção 2022-2025

┌──────────────────────────────────────────────────────────────┐
│ INDICADOR              ║ 2022    │ 2023    │ 2024    │ 2025 │  ← Header mono uppercase
├──────────────────────────────────────────────────────────────┤
│ Toneladas/ano          │ 38.500  │ 39.200  │ 40.000  │ 40.800│  ← Body S Inter
│ Hectares cultivados    │ 1.450   │ 1.475   │ 1.500   │ 1.520 │
│ Produtores associados  │ 62      │ 63      │ 65      │ 65    │
│ Exportação % do total  │ 22%     │ 24%     │ 25%     │ 27%¹  │
└──────────────────────────────────────────────────────────────┘

¹ Estimativa preliminar — campanha 2025 em curso · F12
```

### 4.2 Estilo

- Borders: 1px Algarve dark (top/bottom thick 2px · rows 1px)
- Header: JetBrains Mono 11px uppercase tracked 0.1em · color Algarve dark
- Cells: Inter 14px · color Ink
- Numeric cells: alinhamento direita · tabular-nums
- Text cells: alinhamento esquerda
- Footnote: JetBrains Mono 12px italic · color Tinta
- Hover row: background Pergaminho

### 4.3 Props

```typescript
interface CientificaColumn {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  type?: 'text' | 'number' | 'percentage';
}

interface CientificaProps {
  caption: string;              // "Tabela 03 · Indicadores produção 2022-2025"
  columns: CientificaColumn[];
  rows: Record<string, string | number>[];
  footnotes?: { marker: string; text: string; sourceId?: string }[];
}
```

---

## 5. Quote F-Bloco

### 5.1 Anatomia

```
┌─────────────────────────────────────────────┐
│                                             │
│  «  A produção de citrinos no Algarve       │
│     atingiu 40.000 toneladas em 2024,       │  ← Pull Quote Fraunces italic
│     o maior valor desde 2018.   »           │
│                                             │
│  ──────────────                             │
│                                             │
│  Pedro Madeira                              │  ← Caption Inter
│  Sócio-gerente · Frusoal · Janeiro 2025     │  ← Caption Inter italic
│                                             │
│  F08                                        │  ← Footnote ID mono
│                                             │
└─────────────────────────────────────────────┘
```

### 5.2 Variantes

| Variante | Estilo |
|----------|--------|
| `default` | Pergaminho fundo · borda esquerda 4px Citrus dark |
| `dark` | Tinta fundo · texto Solar destacado · borda esquerda 4px Solar |
| `inline` | Sem fundo · bordas mínimas · uso em meio de body |

### 5.3 Props

```typescript
interface QuoteFBlocoProps {
  quote: string;
  author?: string;
  authorRole?: string;
  date?: string;                // "Janeiro 2025"
  sourceFootnoteId: string;     // "F08" — obrigatório (rastreabilidade)
  variant?: 'default' | 'dark' | 'inline';
}
```

### 5.4 CSS chave

```css
.quote-fbloco {
  background: var(--fn-pergaminho);
  border-left: 4px solid var(--core-citrus-dark);
  padding: 2rem 2.5rem;
  border-radius: 0 4px 4px 0;
  position: relative;
  font-family: var(--font-display);
}

.quote-fbloco__text {
  font-size: 1.75rem;
  font-weight: 400;
  font-style: italic;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--core-ink);
  margin: 0 0 1.5rem 0;
}

.quote-fbloco__text::before {
  content: '« ';
  color: var(--core-citrus-dark);
  font-weight: 600;
}

.quote-fbloco__text::after {
  content: ' »';
  color: var(--core-citrus-dark);
  font-weight: 600;
}

.quote-fbloco__divider {
  border: none;
  height: 1px;
  background: var(--core-algarve-dark);
  opacity: 0.3;
  width: 4rem;
  margin: 0 0 1rem 0;
}

.quote-fbloco__author {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--core-ink);
}

.quote-fbloco__meta {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-style: italic;
  color: var(--core-algarve-dark);
  margin-top: 0.125rem;
}

.quote-fbloco__source {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--fn-tinta);
  letter-spacing: 0.05em;
  margin-top: 1rem;
}
```

---

## 6. Componentes secundários (necessários mas não assinatura)

Estes não são "assinatura" mas são necessários para completar o sistema:

| Componente | Spec rápida |
|------------|-------------|
| **Button** | 3 variantes (primary Citrus · secondary Algarve dark · ghost) · 3 sizes · states todos |
| **Input** | Border 1px Algarve dark · focus border 2px Citrus dark · label flutuante |
| **Badge** | JetBrains Mono 11px uppercase tracked · 5 variantes (Citrus, Pomar, Tinta, Crítico, neutro) |
| **Nav anchor** | Link H6 uppercase · active state Citrus dark border-left 2px |
| **Code block** | Fundo Pergaminho · border 1px Algarve · padding generoso · syntax highlight tokens das cores |

---

## 7. Tokens de animação (motion design)

| Token | Valor | Uso |
|-------|-------|-----|
| `--motion-fast` | 150ms | Hover · focus · micro |
| `--motion-base` | 250ms | Transições padrão |
| `--motion-slow` | 400ms | Modal open · drawer slide |
| `--ease-quiet` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Easing sóbrio padrão |
| `--ease-emphasis` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover destacado |

**Princípio:** motion no InovCitrus é **sóbrio e científico**. Zero bouncing, zero parallax dramático, zero animations decorativas. Apenas feedback funcional.

---

## 8. Checklist de implementação

- [ ] Implementar `<PlateCard>` em `src/components/PlateCard.tsx`
- [ ] Implementar `<Cronos>` em `src/components/Cronos.tsx`
- [ ] Implementar `<FichaPraga>` em `src/components/FichaPraga.tsx`
- [ ] Implementar `<TabelaCientifica>` em `src/components/TabelaCientifica.tsx`
- [ ] Implementar `<QuoteFBloco>` em `src/components/QuoteFBloco.tsx`
- [ ] Implementar 5 componentes secundários (Button, Input, Badge, NavAnchor, CodeBlock)
- [ ] Demos vivas no brandbook página `/identidade` secção `#componentes`
- [ ] Code snippets visíveis ao lado de cada demo (toggle "Ver código")
- [ ] Acessibilidade verificada para todos · keyboard nav · focus visible · aria

---

*Spec produzida por Uma (`@ux-design-expert`) em 26/04/2026 · Task #5 do brandbook InovCitrus.*
