---
description: Design system obrigatório para toda a UI da [IA]AVANÇADA PT comunidade
---

# Design System [IA]AVANÇADA PT — Regra Obrigatória

**URL de referência:** https://design-system-visual.vercel.app/
**Brandbook local:** `imersao-tools/HANDOFF-COMUNIDADE-V3.md`

## NUNCA violar estas regras

| Regra | Detalhe |
|-------|---------|
| Fundo sempre escuro | `#04040A` — NUNCA light mode, NUNCA branco, NUNCA cinzento claro |
| Glassmorphism obrigatório | Superfícies elevadas: `background: rgba(255,255,255,0.03)` + `border: 1px solid rgba(255,255,255,0.08)` |
| Sem cores arbitrárias | Apenas as 5 cores do sistema — ver tabela abaixo |
| Fontes fixas | Inter (body/UI) + JetBrains Mono (código/badges/números técnicos) — nunca outras |
| Sem bordas duras | Sempre `border-radius` mínimo de 8px em cards, 20px em badges |

## Paleta de Cores (as únicas permitidas)

| Nome | Hex | Uso |
|------|-----|-----|
| Background | `#04040A` | Fundo de página — inegociável |
| White | `#F0F4FF` | Texto principal |
| Cyan | `#00F5FF` | Acção primária, links activos, destaques interactivos |
| Gold | `#FFB800` | Premium, elite, numeração, destaques editoriais |
| Purple | `#9D00FF` | Tecnologia, profundidade, IA |
| Magenta | `#FF006E` | Erros, alertas críticos, urgência |
| Lime | `#39FF14` | Sucesso, confirmação, estado activo positivo |
| Grey | `#8892A4` | Texto secundário, labels, metadados |
| Grey2 | `#4A5568` | Texto desactivado, placeholders |

## Componentes Padrão

### Cards / superfícies elevadas
```css
background: rgba(255,255,255,0.025);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 12px;
backdrop-filter: blur(12px);
```

### Tipografia (escalas exactas)
```
H1/Display: 2.4rem, weight 900, letter-spacing -0.03em — Inter
H2:         1.6rem, weight 800 — Inter
H3:         1.15rem, weight 700 — Inter
Body:       0.95rem, weight 400, line-height 1.8 — Inter
Tech label: 1.8rem, weight 800 — JetBrains Mono
Badges:     0.65rem, weight 700, letter-spacing 0.1em — JetBrains Mono
```

### Botão primário
```css
background: var(--cyan);
box-shadow: 0 0 20px rgba(0,245,255,0.4);
color: #04040A;
padding: 0.65rem 1.4rem;
border-radius: 6px;
font-family: 'Inter', sans-serif;
font-weight: 700;
transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

### Badges / chips
```css
background: rgba(0,245,255,0.08);
border: 1px solid rgba(0,245,255,0.2);
border-radius: 20px;
font-family: 'JetBrains Mono', monospace;
font-size: 0.68rem;
letter-spacing: 0.08em;
```

### Gradientes permitidos
```css
/* Hero / destaque */
linear-gradient(135deg, rgba(0,245,255,0.15), rgba(157,0,255,0.15))
/* Overlay em imagens */
linear-gradient(to top, rgba(4,4,10,0.95) 0%, rgba(4,4,10,0.6) 50%, rgba(4,4,10,0.2) 100%)
/* Gold premium */
linear-gradient(135deg, rgba(255,184,0,0.12), rgba(157,0,255,0.08))
```

## Regras de Copy e Tom

- Tom: directo, PT-PT, "fala como quem já fez" — não professor que teoriza
- PROIBIDO: "curso", "fácil", "automático", "revolucionário", "garantido"
- PREFERIDO: "construir", "elite", "nível 4", "imersão", "solução real", "operacional"
- O membro é o Herói. A [IA]AVANÇADA PT é o Guia.
- Sem jargão PT-BR: usar "utilizar", "ficheiro", "equipa", "eliminar"

## Aplicação

Esta regra aplica-se a **todos** os ficheiros:
- `imersao-tools/comunidade/*.html`
- Qualquer página nova da comunidade
- Qualquer componente UI criado para este projecto

Antes de qualquer alteração visual, verificar se respeita esta regra.
Antes de qualquer copy, verificar o tom e vocabulário.
