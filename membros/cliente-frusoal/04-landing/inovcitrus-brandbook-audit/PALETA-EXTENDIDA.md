# Paleta InovCitrus Extendida — Spec Final

> v2.0 final · 26/04/2026 · após audit Frusoal-mãe + Gomo + Biogomo
> Núcleo (6 cores) mantido da v1.0 · Funcional (5 cores) novo · ratios WCAG calculados

---

## 1. Paleta núcleo (mantida da v1.0)

| # | Token | Nome | Hex | RGB | Uso primário |
|---|-------|------|-----|-----|--------------|
| C1 | `--core-citrus` | Citrus | `#E8A53C` | rgb(232, 165, 60) | Acção primária · CTAs · destaques |
| C2 | `--core-citrus-dark` | Citrus dark | `#C68420` | rgb(198, 132, 32) | Hover · links · destaque editorial |
| C3 | `--core-algarve` | Algarve | `#5A8C45` | rgb(90, 140, 69) | Secundária · verde sóbrio |
| C4 | `--core-algarve-dark` | Algarve dark | `#3F6A2E` | rgb(63, 106, 46) | Texto verde sobre fundo claro |
| C5 | `--core-ink` | Ink | `#1A1A1A` | rgb(26, 26, 26) | Texto principal |
| C6 | `--core-surface-warm` | Surface warm | `#FAF8F4` | rgb(250, 248, 244) | Fundo institucional |

---

## 2. Paleta funcional (nova · ajustada após audit)

| # | Token | Nome | Hex | RGB | Uso primário |
|---|-------|------|-----|-----|--------------|
| F1 | `--fn-solar` | Solar | `#FFD27A` | rgb(255, 210, 122) | Luz dourada quente · destaques · selo IGP |
| F2 | `--fn-pomar` | Pomar | `#7FB069` | rgb(127, 176, 105) | Verde folha viva · sucesso · estado activo |
| F3 | `--fn-tinta` | Tinta | `#1B2A4E` | rgb(27, 42, 78) | Navy científico · citações · footnotes |
| F4 | `--fn-critico` | Crítico | `#8B2E22` | rgb(139, 46, 34) | Bordeaux seco · alertas · *Scirtothrips* |
| F5 | `--fn-pergaminho` | Pergaminho | `#F1EBDB` | rgb(241, 235, 219) | Bege quente · cards Plate · destaques sóbrios |

**Notas de ajuste (vs proposta inicial):**
- Tinta foi `#1B3A57` → ajustada para `#1B2A4E` (navy mais escuro, evita conflito com azul-petróleo Biogomo `#3F9EA8`)
- Crítico foi `#A23E2E` → ajustada para `#8B2E22` (bordeaux mais seco, evita conflito com vermelho-coral Gomo `#E84B3B`)

---

## 3. Tabela WCAG — combinações principais

> Calculado com fórmula relative luminance W3C · L1/L2 ratios arredondados a 2 decimais

### 3.1 Texto sobre Surface warm `#FAF8F4` (fundo institucional)

| Cor texto | Hex | Ratio | AA Normal (4.5+) | AA Large (3+) | AAA Normal (7+) | Recomendação |
|-----------|-----|-------|:---:|:---:|:---:|---|
| Ink | `#1A1A1A` | 16.4 | ✓ | ✓ | ✓ | Texto principal |
| Tinta | `#1B2A4E` | 13.3 | ✓ | ✓ | ✓ | Citações · footnotes |
| Algarve dark | `#3F6A2E` | 6.0 | ✓ | ✓ | ✗ | Subtítulos verde |
| Crítico | `#8B2E22` | 7.9 | ✓ | ✓ | ✓ | Texto alerta |
| Citrus dark | `#C68420` | 3.0 | ✗ | ✓ | ✗ | Apenas H1/H2 large |
| Algarve | `#5A8C45` | 3.8 | ✗ | ✓ | ✗ | Apenas large text |
| Citrus | `#E8A53C` | 2.0 | ✗ | ✗ | ✗ | **NÃO usar para texto** — apenas elementos UI/destaques |
| Pomar | `#7FB069` | 2.4 | ✗ | ✗ | ✗ | **NÃO usar para texto** — apenas badges grandes/icons |
| Solar | `#FFD27A` | 1.3 | ✗ | ✗ | ✗ | **NÃO usar para texto** — apenas decoração/glow |

### 3.2 Texto sobre Ink `#1A1A1A` (fundo escuro)

| Cor texto | Hex | Ratio | AA Normal | AA Large | AAA Normal | Recomendação |
|-----------|-----|-------|:---:|:---:|:---:|---|
| Surface warm | `#FAF8F4` | 16.4 | ✓ | ✓ | ✓ | Texto principal invertido |
| Solar | `#FFD27A` | 12.2 | ✓ | ✓ | ✓ | Destaques editoriais elegantes |
| Pergaminho | `#F1EBDB` | 14.7 | ✓ | ✓ | ✓ | Texto secundário invertido |
| Citrus | `#E8A53C` | 8.1 | ✓ | ✓ | ✓ | CTAs · destaques |
| Pomar | `#7FB069` | 6.9 | ✓ | ✓ | ✗ | Badges sucesso |
| Citrus dark | `#C68420` | 5.5 | ✓ | ✓ | ✗ | Hover CTAs |

### 3.3 Texto sobre Pergaminho `#F1EBDB` (Plate Card fundo)

| Cor texto | Hex | Ratio | AA Normal | AA Large | AAA Normal | Recomendação |
|-----------|-----|-------|:---:|:---:|:---:|---|
| Ink | `#1A1A1A` | 14.7 | ✓ | ✓ | ✓ | Texto principal Plate |
| Tinta | `#1B2A4E` | 11.9 | ✓ | ✓ | ✓ | Footnotes Plate |
| Crítico | `#8B2E22` | 7.1 | ✓ | ✓ | ✓ | Alertas Plate |
| Algarve dark | `#3F6A2E` | 5.4 | ✓ | ✓ | ✗ | Subtítulos verde |
| Citrus dark | `#C68420` | 2.7 | ✗ | ✗ | ✗ | **Não usar** |

### 3.4 Texto sobre Tinta `#1B2A4E` (footnotes blocks)

| Cor texto | Hex | Ratio | AA Normal | AA Large | AAA Normal | Recomendação |
|-----------|-----|-------|:---:|:---:|:---:|---|
| Surface warm | `#FAF8F4` | 13.3 | ✓ | ✓ | ✓ | Texto invertido sobre Tinta |
| Solar | `#FFD27A` | 9.9 | ✓ | ✓ | ✓ | Citações destacadas |
| Pergaminho | `#F1EBDB` | 11.9 | ✓ | ✓ | ✓ | Texto secundário |

---

## 4. Gradientes permitidos

| Nome | Composição | Uso |
|------|-----------|-----|
| Solar Sweep | `linear-gradient(135deg, #FFD27A 0%, #E8A53C 100%)` | Hero shots · selo IGP destaque |
| Algarve Depth | `linear-gradient(180deg, #5A8C45 0%, #3F6A2E 100%)` | Sidebar institucional · navegação verde |
| Pergaminho Wash | `linear-gradient(180deg, #FAF8F4 0%, #F1EBDB 100%)` | Section dividers subtis |
| Tinta Night | `linear-gradient(135deg, #1B2A4E 0%, #1A1A1A 100%)` | Footer · footnotes blocks |

**Regra:** NUNCA mais de 2 cores por gradiente. NUNCA gradientes com 3 cores (visual ruidoso, falha AA).

---

## 5. Estados funcionais (semântica de cor)

| Estado | Cor | Uso UI |
|--------|-----|--------|
| Default / neutro | Ink + Surface warm | Estado base |
| Acção primária | Citrus → hover Citrus dark | Botões CTA |
| Acção secundária | Algarve dark · text Surface warm | Botões secundários |
| Sucesso · activo | Pomar (background) + Ink (text) | Badges sucesso · estado activo |
| Aviso · destaque | Solar (background) + Ink (text) | Highlights · IGP marker |
| Erro · alerta | Crítico (background) + Surface warm (text) | Alertas científicos *Scirtothrips* |
| Citação · footnote | Tinta (background) + Solar (text destacado) ou Pergaminho (text) | Quote F-Bloco |

---

## 6. Checklist de implementação

- [ ] Adicionar 11 CSS variables em `globals.css` do site Next.js
- [ ] Adicionar 11 cores a `tailwind.config.ts` no objecto `theme.extend.colors`
- [ ] Exportar paleta em formato DTCG W3C JSON para Figma/Style Dictionary
- [ ] Documentar tabela WCAG na página `/identidade` secção `#paleta`
- [ ] Implementar live contrast checker visual no brandbook
- [ ] Atualizar `paleta-swatches.html` no kit imprensa para reflectir paleta v2.0
- [ ] Validar manualmente cada combinação principal em ecrã

---

*Spec produzida por Uma (`@ux-design-expert`) em 26/04/2026 · Task #3 do brandbook InovCitrus.*
