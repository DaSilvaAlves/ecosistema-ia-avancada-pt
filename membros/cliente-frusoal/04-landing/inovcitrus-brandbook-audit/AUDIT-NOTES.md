# Audit Visual — Frusoal-mãe + Gomo + Biogomo

> Data: 26/04/2026 · Agente: Uma (`@ux-design-expert`) · Objectivo: validar que paleta InovCitrus extendida não cria conflito cromático com identidade Frusoal-mãe e marcas Gomo/Biogomo.

---

## 1. Assets descarregados

| Ficheiro | Origem | Uso no audit |
|---|---|---|
| `frusoal-logo.png` | https://www.frusoal.pt/wp-content/uploads/2019/11/frusoal-logo.png | Wordmark institucional Frusoal |
| `Gomo.png` | https://www.frusoal.pt/wp-content/uploads/2019/11/Gomo.png | Marca convencional |
| `Biogomo.png` | https://www.frusoal.pt/wp-content/uploads/2019/11/Biogomo.png | Marca biológica |
| `Frusoal-photo.jpg` | https://www.frusoal.pt/wp-content/uploads/2019/07/Frusoal.jpg | Fotografia institucional |
| `barra-certificacoes.png` | https://www.frusoal.pt/wp-content/uploads/2025/05/BARRA_LOGOS-03-1024x148.png | PRR + República Portuguesa + UE (financiamentos) |

---

## 2. Observação visual — cores reais

### 2.1 Wordmark Frusoal-mãe

| Elemento | Cor observada | Hex aproximado |
|---|---|---|
| Tipografia "Frusoal" | Laranja vivo saturado | `#F58A1F` ± 5 |
| Símbolo cítrico | Laranja mais escuro com folha verde | `#E07A1A` + `#5C8E3C` |
| Estilo tipo | Italic flowing, modern, sem serifas | — |

**Insight:** o laranja Frusoal-mãe é **vivo e saturado** — um citrus comercial alegre. A paleta InovCitrus v1.0 escolheu um Citrus `#E8A53C` mais **mostarda/dourado** — distintivo, sóbrio, científico. **Sem conflito.** Boa decisão da v1.0.

### 2.2 Marca Gomo (convencional)

| Elemento | Cor observada | Hex aproximado |
|---|---|---|
| Forma silhueta arredondada | Vermelho-coral saturado | `#E84B3B` ± 5 |
| Folhas | Verde médio | `#7CB342` ± 5 |
| Tipografia "Gomo" | Branco script italic | `#FFFFFF` |
| Tagline | Branco "SABOR, GOMO A GOMO" | `#FFFFFF` |

### 2.3 Marca Biogomo (biológico)

| Elemento | Cor observada | Hex aproximado |
|---|---|---|
| Forma silhueta arredondada | Azul-petróleo / teal | `#3F9EA8` ± 5 |
| Folhas | Verde lime acid (juvenil) | `#A4C66D` ± 5 |
| Tipografia "bioGomo" | Branco script | `#FFFFFF` |

### 2.4 Barra certificações (financiamentos)

| Elemento | Cor observada | Hex aproximado |
|---|---|---|
| PRR logo | Verde escuro + cinza | `#1F4A3D` + `#3A3A3A` |
| República Portuguesa | Vermelho + verde bandeira | `#C42030` + `#327A45` |
| UE NextGenerationEU | Azul UE | `#003399` |

---

## 3. Validação da paleta InovCitrus extendida — núcleo

| Cor núcleo | Hex | Validação vs Frusoal-mãe + Gomo + Biogomo | Veredicto |
|---|---|---|---|
| Citrus | `#E8A53C` | Mostarda/dourado — distinto do laranja vivo Frusoal e do vermelho-coral Gomo | ✓ MANTER |
| Citrus dark | `#C68420` | Laranja escuro — distinto | ✓ MANTER |
| Algarve | `#5A8C45` | Verde sóbrio — distinto do verde Gomo (mais vivo) e lime Biogomo | ✓ MANTER |
| Algarve dark | `#3F6A2E` | Verde escuro — distinto | ✓ MANTER |
| Ink | `#1A1A1A` | Preto suave — neutro | ✓ MANTER |
| Surface warm | `#FAF8F4` | Off-white quente — neutro | ✓ MANTER |

**Conclusão núcleo:** zero alterações. Paleta v1.0 está bem desenhada.

---

## 4. Validação da paleta extendida — funcional (proposta)

| Cor funcional | Hex inicial | Conflito detectado? | Hex ajustado | Veredicto |
|---|---|---|---|---|
| Solar | `#FFD27A` | Não — distinto do laranja Frusoal-mãe e do amarelo PRR | `#FFD27A` | ✓ MANTER |
| Pomar | `#7FB069` | Aproximado do verde Gomo `#7CB342` mas tom distinto (folha jovem InovCitrus vs folha adulta Gomo). Uso restrito a estado activo/sucesso | `#7FB069` | ✓ MANTER (com nota de uso) |
| **Tinta** | `#1B3A57` | **CONFLITO** com azul-petróleo Biogomo `#3F9EA8` (parecido demais quando usado em large blocks) | `#1B2A4E` | **AJUSTAR** para navy mais escuro |
| **Crítico** | `#A23E2E` | **CONFLITO** com vermelho-coral Gomo `#E84B3B` (parecido demais quando usado em alertas grandes) | `#8B2E22` | **AJUSTAR** para bordeaux mais seco |
| Pergaminho | `#F1EBDB` | Não — neutro complementar | `#F1EBDB` | ✓ MANTER |

---

## 5. Paleta InovCitrus extendida — final (após ajustes)

### Núcleo (mantido v1.0)

```css
--core-citrus:        #E8A53C;  /* Primária · acção */
--core-citrus-dark:   #C68420;  /* Hover · links */
--core-algarve:       #5A8C45;  /* Secundária · verde sóbrio */
--core-algarve-dark:  #3F6A2E;  /* Verde escuro */
--core-ink:           #1A1A1A;  /* Texto principal */
--core-surface-warm:  #FAF8F4;  /* Fundo institucional */
```

### Funcional (novo · ajustado)

```css
--fn-solar:       #FFD27A;  /* Luz dourada · destaques · selo IGP */
--fn-pomar:       #7FB069;  /* Verde folha viva · sucesso · activo */
--fn-tinta:       #1B2A4E;  /* Navy científico · citações · footnotes */
--fn-critico:     #8B2E22;  /* Bordeaux seco · alertas · Scirtothrips */
--fn-pergaminho:  #F1EBDB;  /* Bege quente · cards Plate · destaques sóbrios */
```

---

## 6. Considerações tipográficas observadas

| Elemento | Frusoal-mãe | InovCitrus v1.0 | Decisão |
|---|---|---|---|
| Wordmark institucional | Italic flowing modern (custom?) | Inter 400 + 800 (sóbrio) | InovCitrus mantém Inter — distintivo |
| Tipografia site | Indeterminada CSS externo | Inter (declarado) | InovCitrus mantém Inter |
| Pretendido (display) | — | Inter 800 | **Adicionar Fraunces para H1/H2** dá sabor científico-clássico que eleva |

---

## 7. Recomendações finais

1. **Paleta núcleo:** zero alterações. v1.0 está bem desenhada.
2. **Paleta funcional:** aceitar 5 cores funcionais com ajustes em Tinta (`#1B2A4E`) e Crítico (`#8B2E22`) para evitar conflito com Biogomo e Gomo.
3. **Tipografia:** adicionar Fraunces para display H1/H2. Manter Inter (UI/body) e JetBrains Mono (code/data).
4. **Hierarquia visual:** InovCitrus tem identidade própria sóbria-científica que **complementa** a Frusoal-mãe sem competir. Quando ambos aparecerem juntos (ex: barra certificações), Frusoal-mãe aparece como "patrocinador institucional" e InovCitrus como "projecto científico".

---

*Audit produzido por Uma (`@ux-design-expert`) em 26/04/2026 · Task #2 do brandbook InovCitrus.*
