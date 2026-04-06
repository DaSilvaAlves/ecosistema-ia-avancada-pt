# HANDOFF — To-Do List Comunidade: 5 Templates Premium

> Data: 04/04/2026
> Autor: Uma (UX Design Expert) + Eurico
> Estado: PRONTO PARA EXECUCAO
> Terminal: NOVO (nao depende de sessoes anteriores)

---

## Visao e objectivo

### O que e isto

5 templates de To-Do List premium, integrados na comunidade [IA]AVANCADA PT como **gancho de marketing** — o "primeiro capitulo gratis do ebook".

O membro entra na comunidade, escolhe um estilo, e em 10 segundos tem uma To-Do List funcional e bonita a correr no browser. Fica impressionado e quer a imersao completa.

### O que NAO e isto

- NAO e um pipeline com 4 ferramentas encadeadas
- NAO usa IA para gerar codigo (os templates sao estaticos, prontos, testados)
- NAO precisa de API keys, contas GitHub, contas Vercel
- NAO depende de nada externo — tudo inline num ficheiro HTML
- NAO faz deploy em lado nenhum — corre no browser do membro

### Analogia

Igual ao primeiro capitulo gratis de um ebook:
- Tu les, gostas, e compras o ebook completo
- Aqui: o membro experimenta, fica impressionado, e quer a imersao

---

## Arquitectura tecnica

### Estrutura de ficheiros

```
imersao-tools/comunidade/
  todolist.html              ← Pagina de seleccao (5 previews)
  todolist-cyberpunk.html    ← Template 1
  todolist-aurora.html       ← Template 2
  todolist-holographic.html  ← Template 3
  todolist-neomorphic.html   ← Template 4
  todolist-brutalist.html    ← Template 5
```

### Como funciona

```
Membro abre todolist.html
  → Ve 5 previews visuais lado a lado (cards com screenshot/mockup)
  → Clica num template
  → Abre todolist-{estilo}.html no mesmo tab
  → To-Do List funcional com esse design
  → Dados guardados em localStorage do browser do membro
  → Cada browser e independente — ninguem ve os dados de ninguem
```

### Requisitos tecnicos por template

| Requisito | Detalhe |
|-----------|---------|
| Ficheiro unico | `index.html` com tudo inline — CSS em `<style>`, JS em `<script>` |
| Zero dependencias | Nenhum CDN, nenhum npm, nenhum import externo |
| Google Fonts | UNICA excepcao — import de fontes via `<link>` no `<head>` |
| localStorage | Toda a persistencia — sem backend, sem fetch |
| Responsive | Mobile, tablet e desktop |
| PT-PT | Todo o texto visivel em Portugues Europeu |
| Minimo 300 linhas | Codigo real e funcional, nao esqueleto |
| Marca subtil | Footer discreto com branding [IA]AVANCADA PT |

---

## Funcionalidades obrigatorias (TODAS as 5 templates)

Cada To-Do List DEVE ter TODAS estas funcionalidades:

| Funcionalidade | Detalhe |
|----------------|---------|
| Adicionar tarefa | Input + botao, Enter para submeter |
| Editar tarefa | Duplo-clique ou botao de edicao |
| Remover tarefa | Botao de eliminar com confirmacao visual |
| Marcar como concluida | Checkbox ou clique — visual claro (riscado/opacity) |
| Filtrar por estado | 3 filtros: Todas, Pendentes, Concluidas |
| Contador de pendentes | "X tarefas pendentes" actualizado em tempo real |
| Dados de exemplo | 3-4 tarefas pre-carregadas em PT-PT realista |
| Persistencia | localStorage — dados sobrevivem ao fechar o browser |
| Animacoes de entrada | Fade/slide ao adicionar/remover tarefas |
| Estado vazio | Mensagem quando nao ha tarefas (nao ecrã branco) |

### Dados de exemplo pre-carregados

```javascript
const DEFAULT_TASKS = [
  { id: 1, text: 'Preparar apresentacao do projecto', done: false },
  { id: 2, text: 'Rever documentacao da API', done: true },
  { id: 3, text: 'Enviar proposta ao cliente', done: false },
  { id: 4, text: 'Testar nova funcionalidade no staging', done: false },
];
```

---

## Branding [IA]AVANCADA PT — regras obrigatorias

### Marca no footer (TODAS as templates)

Cada template DEVE ter um footer discreto com:

```html
<footer style="
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.25);
  background: rgba(4,4,10,0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,0.04);
  z-index: 100;
">
  <span style="
    width: 16px; height: 16px; border-radius: 4px;
    background: linear-gradient(135deg, rgba(0,245,255,0.25), rgba(157,0,255,0.25));
    border: 1px solid rgba(0,245,255,0.3);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.5rem;
  ">&#x2B21;</span>
  <span>CONSTRUIDO COM [IA]AVANCADA PT</span>
  <span style="color: rgba(0,245,255,0.3);">|</span>
  <span>comunidade.expressia.pt</span>
</footer>
```

### Cores do design system a incorporar

As cores accent de cada template DEVEM usar cores do nosso design system:

| Template | Cor accent principal | Cor secundaria |
|----------|---------------------|----------------|
| Cyberpunk | `#00F5FF` (Cyan) | `#9D00FF` (Purple) |
| Aurora | `#9D00FF` (Purple) | `#00F5FF` (Cyan) |
| Holographic | `#FFB800` (Gold) | `#00F5FF` (Cyan) |
| Neomorphic | `#00F5FF` (Cyan) | `#39FF14` (Lime) |
| Brutalist | `#FF006E` (Magenta) | `#FFB800` (Gold) |

### Fundo SEMPRE escuro

- Background base: `#04040A` ou mais escuro (`#050810`, `#030308`)
- NUNCA light mode, NUNCA branco, NUNCA cinzento claro
- Superficies elevadas: glassmorphism com `rgba(255,255,255,0.03-0.07)`

---

## Os 5 templates — especificacao detalhada

### Template 1: CYBERPUNK TERMINAL

**Referencia:** O prompt original que arrasou (`C:\Users\XPS\Documents\prompt-todolist.txt`)

| Elemento | Especificacao |
|----------|---------------|
| Vibe | Terminal cyberpunk, hacker estetica, precisao tecnica |
| Background | `#050810` com grid de pontos subtil (dot-matrix) |
| Font display | **Orbitron** ou **Rajdhani** (Google Fonts) — tracking amplo |
| Font body | **DM Sans** ou **Manrope** |
| Accent | `#00F5FF` (cyan electrico) |
| Cards | Glassmorphism: `rgba(255,255,255,0.05)` + `backdrop-filter: blur(12px)` |
| Bordas | Brilho subtil em cyan baixa opacidade |
| Botoes | Outline com borda luminosa, `border-radius: 4-6px` (precisao) |
| Inputs | Estilo terminal — borda inferior apenas, glow no focus |
| Icones | Tracos finos (estilo Phosphor/Feather) |
| Scrollbar | Customizada, fina, cyan |
| Animacoes | Fade+translate de entrada com stagger. Hover com scan-line/brilho deslizante |
| Micro-interacoes | Glitch subtil nos titulos (CSS only, moderado). Transicoes 0.3s ease |
| Cursor | Customizado: ponto + anel (CSS `cursor` ou pseudo-element) |
| Diferencial UAU | Efeito de "scan line" horizontal que percorre a pagina a cada 30s. Texto do titulo com gradiente metalico |
| CSS vars | Toda a paleta e espacamentos em custom properties |

### Template 2: AURORA BOREALIS

| Elemento | Especificacao |
|----------|---------------|
| Vibe | Ethereal, noite nordica, movimento organico |
| Background | `#030308` com gradiente animado aurora (purple→cyan→green, `@keyframes` lento 15s) |
| Font display | **Syne** (Google Fonts) — elegante, geometrica |
| Font body | **Inter** |
| Accent | `#9D00FF` (purple) com transicoes para `#00F5FF` |
| Cards | Glass com tint purple: `rgba(157,0,255,0.05)` + blur |
| Bordas | Gradiente border via `border-image` ou pseudo-element (purple→cyan) |
| Botoes | Solidos com gradiente purple→cyan, hover com brilho expandido |
| Inputs | Fundo transparente, borda fina que muda de cor no focus (purple→cyan) |
| Animacoes | Background aurora em loop. Cards com float subtil (translate Y 2-3px, 6s ease-in-out) |
| Micro-interacoes | Hover nos cards muda a tonalidade do gradiente border. Check de tarefa com "pulse" de luz |
| Diferencial UAU | Particulas flutuantes (pseudo-elements `::before`/`::after` em posicao absoluta, 5-8 circulos blur animados). O fundo RESPIRA — nao e estatico |
| Diferencial 2 | Tarefas concluidas desvanecem para uma tonalidade aurora (nao so riscado) |

### Template 3: HOLOGRAPHIC

| Elemento | Especificacao |
|----------|---------------|
| Vibe | Futurista premium, iridescente, chrome |
| Background | `#04040A` com noise texture subtil (CSS `background-image: url(data:...)` SVG inline) |
| Font display | **Exo 2** (Google Fonts) — futurista mas legivel |
| Font body | **Manrope** |
| Accent | `#FFB800` (gold) como primary, `#00F5FF` como secondary |
| Cards | Glass com efeito holografico: on hover, gradiente arco-iris percorre o card (`background-position` animado) |
| Bordas | Fina, `rgba(255,184,0,0.15)`, hover muda para iridescente |
| Botoes | Gradiente gold→cyan, texto escuro (`#04040A`), hover com shimmer |
| Inputs | Borda gold subtil, focus com glow gold |
| Animacoes | Shimmer effect nos cards (gradiente diagonal animado, `@keyframes shimmer`) |
| Micro-interacoes | Hover no card: reflexo holografico (gradiente RGB move com `background-position`). Botao de check: flash dourado |
| Diferencial UAU | Cards com efeito "chromatic aberration" subtil no hover (sombra em 2 cores offset 1px). Titulo com gradiente gold→white→gold animado |
| Diferencial 2 | Badge "GOLD" no contador de tarefas concluidas. Visual de "conquista" |

### Template 4: NEOMORPHIC DARK

| Elemento | Especificacao |
|----------|---------------|
| Vibe | Tactil, profundidade soft, elegancia minimalista |
| Background | `#0D0D12` (dark grey, nao preto puro — necessario para neumorphism) |
| Font display | **DM Sans** weight 700 (Google Fonts) |
| Font body | **DM Sans** weight 400 |
| Accent | `#00F5FF` (cyan) com `#39FF14` (lime) para estados de sucesso |
| Cards | Neumorphismo escuro: `box-shadow: 8px 8px 16px rgba(0,0,0,0.5), -8px -8px 16px rgba(255,255,255,0.03)` |
| Bordas | NENHUMA — o neumorphismo substitui |
| Botoes | Neumorphismo raised. Active: neumorphismo pressed (shadows invertidas). Accent color no texto |
| Inputs | Neumorphismo inset (inner shadow). Focus: glow cyan subtil |
| Animacoes | Transicoes suaves 0.4s nos shadows ao interagir. Tarefas adicionadas com scale 0.95→1 |
| Micro-interacoes | Botao pressed: afunda visualmente (inset shadow). Checkbox: preenche com cyan. Remover: shrink + fade |
| Diferencial UAU | Sensacao TACTIL — cada interaccao parece que estas a tocar em algo fisico. Zero flat design |
| Diferencial 2 | Toggle dark/darker (duas tonalidades de escuro) — inovacao visual que nao existe nas demos comuns |

### Template 5: BRUTALIST CODE

| Elemento | Especificacao |
|----------|---------------|
| Vibe | Raw, bold, monospace, anti-design que e design |
| Background | `#04040A` |
| Font display | **JetBrains Mono** weight 800 (Google Fonts) — TUDO monospace |
| Font body | **JetBrains Mono** weight 400 |
| Accent | `#FF006E` (magenta) como primary, `#FFB800` (gold) como highlight |
| Cards | Sem glassmorphism. Borda solida 2px `rgba(255,255,255,0.15)`. Sem border-radius (0px). |
| Bordas | Rectas, visiveis, sem arredondamento |
| Botoes | Rectangulares, background solido magenta, texto bold uppercase, letter-spacing 0.15em |
| Inputs | Estilo terminal puro: fundo `transparent`, borda inferior 2px, cursor blinking |
| Animacoes | MINIMAS — brutalist evita animacao. Unica: typing cursor no input (CSS `@keyframes blink`) |
| Micro-interacoes | Hover: inversao de cores (background vira texto, texto vira background). Click: flash rapido |
| Layout | Assimetrico intencional — titulo alinhado a esquerda, contador a direita, lista full-width |
| Diferencial UAU | Estetica de terminal/CLI — prefixo `>` nas tarefas, timestamp visivel, contadores em formato `[03/07]` |
| Diferencial 2 | ASCII art decorativo subtil. Titulos com `text-transform: uppercase` e oversized. Zero decoracao — a tipografia FAZ o design |

---

## Pagina de seleccao (todolist.html)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⬡ [IA]AVANCADA PT                                              │
│                                                                   │
│  CRIA A TUA TO-DO LIST                                           │
│  Escolhe um estilo. Em 10 segundos tens uma app funcional.       │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │CYBERPUNK │ │ AURORA   │ │HOLOGRAPH.│ │NEOMORPHIC│ │BRUTALIST││
│  │ [preview]│ │ [preview]│ │ [preview]│ │ [preview]│ │[preview]││
│  │          │ │          │ │          │ │          │ │         ││
│  │  Usar →  │ │  Usar →  │ │  Usar →  │ │  Usar →  │ │ Usar → ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                   │
│  Na imersao, constróis o teu projecto real — do zero, com IA.   │
│  ────────────────────────────────────────────────────────────     │
│  CONSTRUIDO COM [IA]AVANCADA PT | comunidade.expressia.pt        │
└──────────────────────────────────────────────────────────────────┘
```

### Especificacao da pagina de seleccao

| Elemento | Detalhe |
|----------|---------|
| Background | `#04040A` — consistente com toda a comunidade |
| Header | Logo hex `⬡` + "IA AVANCADA PT" em JetBrains Mono cyan, igual ao dashboard |
| Titulo | "CRIA A TUA TO-DO LIST" — H1 Inter 900, `#F0F4FF` |
| Subtitulo | Frase de gancho — Inter 400, `#8892A4` |
| Cards de preview | 5 cards lado a lado (flex/grid), glassmorphism, hover com glow na cor accent do template |
| Preview | Miniatura visual (CSS-only mockup OU screenshot) mostrando o estilo |
| Botao | "Usar →" — accent color do respectivo template |
| CTA inferior | Frase de gancho para imersao — `#8892A4`, discreto |
| Footer | Branding padrao (ver seccao Branding) |
| Responsive | Mobile: cards em stack vertical. Tablet: 2-3 por linha |
| Auth | SEM autenticacao — qualquer pessoa na comunidade acede |

### Copy da pagina

| Elemento | Texto |
|----------|-------|
| Titulo | `Cria a tua To-Do List` |
| Subtitulo | `Escolhe um estilo. 10 segundos. Zero instalacao.` |
| Card CTA | `Experimentar` |
| Gancho inferior | `Na imersao, constróis o teu projecto real — do zero, com IA.` |
| Link imersao | Botao discreto para pagina de imersao (quando existir) |

---

## Integracao na comunidade

### Onde aparece no dashboard

Adicionar na sidebar do `dashboard.html`, seccao "Ecossistema [IA]":

```html
<a href="todolist.html" class="sb-item">
  <span class="sb-icon">✓</span>
  <span>To-Do List</span>
  <span class="sb-badge new">NOVO</span>
</a>
```

### URL final

```
comunidade.expressia.pt/todolist.html
```

Cada template:
```
comunidade.expressia.pt/todolist-cyberpunk.html
comunidade.expressia.pt/todolist-aurora.html
comunidade.expressia.pt/todolist-holographic.html
comunidade.expressia.pt/todolist-neomorphic.html
comunidade.expressia.pt/todolist-brutalist.html
```

### Autenticacao

As paginas de To-Do List NAO devem ter `requireAuth()`. Sao publicas dentro da comunidade — qualquer membro acede directamente.

Se no futuro quisermos tracking de quem usa, adicionamos analytics, nao auth.

---

## Prompt de referencia original

O prompt que "arrasou" e que serve de baseline de qualidade para TODOS os 5 templates:

**Ficheiro:** `C:\Users\XPS\Documents\prompt-todolist.txt`

**Elementos-chave que fizeram a diferenca:**
1. Fundo quase preto com texturas (grid/grain)
2. Paleta restrita e intencional (nao generica)
3. Tipografia futurista importada (Google Fonts)
4. Letter-spacing amplo nos headings
5. Glassmorphism com blur real
6. Micro-animacoes (hover scan-line, glitch subtil)
7. CSS custom properties para tudo
8. Cursor customizado
9. Scrollbar customizada
10. "O resultado deve ser memoravel e parecer feito por um designer especializado"

**REGRA:** cada template deve atingir ou superar este nivel de qualidade. Zero designs genericos.

---

## Ordem de execucao

### Passo 1: Criar os 5 templates HTML

Para cada template (1 a 5):
1. Abrir ficheiro novo `todolist-{nome}.html`
2. Implementar TODAS as funcionalidades da tabela acima
3. Aplicar o design system especifico do template
4. Incluir footer com branding [IA]AVANCADA PT
5. Testar: adicionar tarefa, concluir, filtrar, fechar e reabrir browser
6. Verificar responsive (mobile 375px, tablet 768px, desktop 1440px)

### Passo 2: Criar pagina de seleccao

1. Criar `todolist.html` com layout especificado
2. Cards com preview visual de cada template
3. Links para cada `todolist-{nome}.html`
4. Copy conforme especificado
5. Responsive

### Passo 3: Integrar no dashboard

1. Adicionar link na sidebar do `dashboard.html`
2. Badge "NOVO" para chamar atencao
3. Testar navegacao

### Passo 4: Deploy

1. Commit no submodule comunidade
2. Push via @devops
3. Verificar em `comunidade.expressia.pt/todolist.html`

---

## Criterios de qualidade (Definition of Done)

| Criterio | Como verificar |
|----------|---------------|
| Cada template funciona 100% standalone | Abrir ficheiro no browser, tudo funciona |
| Zero dependencias externas (excepto Google Fonts) | Nenhum CDN, nenhum npm, nenhum fetch |
| localStorage persiste dados | Fechar tab, reabrir, dados estao la |
| Responsive funciona | Testar em 375px, 768px, 1440px |
| Branding presente e discreto | Footer visivel mas nao invasivo |
| Design e UAU | Nao parece template generico — parece feito por designer |
| Copy em PT-PT | Zero PT-BR, zero Lorem Ipsum |
| Cada template e visualmente DIFERENTE | 5 identidades visuais distintas |
| Animacoes fluidas | Sem jank, sem flash de conteudo |
| Dados de exemplo realistas | Tarefas em portugues, contexto profissional |

---

## O que NAO fazer

| Proibido | Razao |
|----------|-------|
| Usar frameworks (React, Vue, etc) | Ficheiro unico, zero build step |
| Usar CDNs (Tailwind, Bootstrap, etc) | Zero dependencias externas |
| Fazer fetch a qualquer API | Tudo local, sem backend |
| Implementar autenticacao | Desnecessario para o objectivo |
| Inventar funcionalidades extra | Manter-se no escopo das funcionalidades listadas |
| Usar cores fora do design system | Apenas as cores listadas na tabela de accent |
| Light mode | NUNCA — sempre escuro |
| Copy em PT-BR | Sempre PT-PT |
| Design generico/template | Cada um deve ser memoravel e unico |

---

## Contexto para o agente que vai executar

### Onde estamos

- Directorio: `imersao-tools/comunidade/`
- Repositorio: `ecosistema-ia-avancada-pt` (submodule `comunidade`)
- Branch: `master` (dentro do submodule)
- Design system: `.claude/rules/design-system-ia-avancada.md`
- Brandbook: `imersao-tools/HANDOFF-COMUNIDADE-V3.md`

### Ficheiros de referencia obrigatorios

| Ficheiro | Para que |
|----------|---------|
| `C:\Users\XPS\Documents\prompt-todolist.txt` | Baseline de qualidade |
| `imersao-tools/comunidade/dashboard.html` | Referencia de layout e branding |
| `.claude/rules/design-system-ia-avancada.md` | Cores, tipografia, componentes |

### Stack tecnica

- HTML5 + CSS3 + JavaScript vanilla
- Google Fonts via `<link>`
- localStorage API
- CSS custom properties
- CSS animations (`@keyframes`)
- Zero frameworks, zero build tools

---

*Handoff criado por Uma (UX Design Expert) — 04/04/2026*
*Pronto para execucao em terminal novo*
