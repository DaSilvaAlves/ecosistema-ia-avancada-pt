# Design System - IA Avançada PT (Comunidade)

Este documento descreve o Design System para a comunidade "IA Avançada PT", um guia abrangente para a criação de interfaces consistentes, funcionais e visualmente atraentes, alinhadas com a identidade da marca.

## 1. Fundamentos Visuais

### 1.1. Estilo Principal: Glassmorphism Avançado
*   **Essência:** O design é construído sobre o conceito de Glassmorphism, com elementos que simulam vidro fosco e translúcido, criando uma interface rica e multi-camadas.
*   **Características:**
    *   **Fundos Semi-transparentes:** Utilização de `rgba` com baixo `opacity` e `backdrop-filter: blur()`.
    *   **Desfoque Contextual:** Aplicação estratégica de `blur` para que os elementos de fundo sejam percebidos, mas não distraiam.
    *   **Bordas Refinadas:** Bordas de 1px com transparência (`rgba`) e ligeiros brilhos para demarcar elementos.
    *   **Camadas:** Sensação de profundidade através de múltiplos planos visuais.
*   **Interatividade (`Hover`):** Elementos interativos reagem ao `hover` com sutis efeitos de brilho, alteração de transparência ou ligeiro movimento para indicar interatividade e estado.

### 1.2. Paleta de Cores
A paleta foi refinada para ser coesa, impactante e funcional, com ênfase no contraste e na estética futurista.

*   `--bg: #04040A;` (Fundo Principal)
*   `--glass: rgba(255, 255, 255, 0.03);` (Fundo de elementos Glassmorphic)
*   `--glass-border: rgba(255, 255, 255, 0.08);` (Bordas de elementos Glassmorphic)
*   `--white: #F0F4FF;` (Texto principal, elementos claros)
*   `--grey: #8892A4;` (Texto secundário, elementos neutros)
*   `--grey2: #4A5568;` (Texto de suporte, estados inativos)

**Cores de Destaque & Acento (Vibrantes):**
*   `--gold: #FFB800;` (Cor primária de acento, representa o "Gold" da sua temática)
*   `--cyan: #00F5FF;`
*   `--purple: #9D00FF;`
*   `--magenta: #FF006E;`

**Nova Cor "Lime" (Sutil e Integrada):**
*   `--lime: #4F604F;` (Um verde muito escuro e dessaturado, para realces subtis, texturas ou como parte de gradientes, sem destoar da paleta existente.)

### 1.3. Tipografia
*   **`Inter` (Sans-serif):** Utilizado para a maioria dos textos de corpo, títulos secundários e interfaces, garantindo legibilidade e uma sensação moderna.
*   **`JetBrains Mono` (Monospace):** Reservado para elementos de código, cabeçalhos de destaque, badges, etiquetas e outros elementos que necessitam de um toque técnico e de marca.

### 1.4. Espaçamento e Layout
*   Será definida uma escala de espaçamento consistente, baseada em múltiplos de `8px` ou `4px`, para garantir harmonia em `padding`, `margin` e `gap`.
*   Diretrizes claras para layout responsivo serão estabelecidas, incluindo `breakpoints` para uma adaptação fluida a diferentes dispositivos.

### 1.5. Iconografia: Ícones SVG Personalizados "IA AVANÇADA PT"
*   **Unicidade:** Todos os ícones serão SVGs criados especificamente para a marca, refletindo a estética futurista, tecnológica e Glassmorphic.
*   **Estilo:** Serão definidos estilos (ex: lineares, preenchidos, gradientes sutis, com ou sem halo) para que todos os ícones da "IA AVANÇADA PT" tenham uma linguagem visual coesa.
*   **Grelha:** Utilização de uma grelha de ícones para garantir consistência nas proporções e alinhamento visual.
*   **Uso:** Orientações sobre tamanhos, cores e como os ícones interagem com texto e outros componentes.

## 2. Identidade Visual (Componentes)

### 2.1. Botões de Ação
*   **Botão Primário (`.btn-primary`, `.upg-cta`):**
    *   **Estilo Base:** Fundo em gradiente `linear-gradient(135deg, var(--cyan), var(--purple))` (poderão ser criadas variantes com `--gold` e `--lime` para contextos específicos). Texto com cor de fundo (`#04040A`). Tipografia: `Inter` sem negrito.
    *   **Glassmorphism (Interatividade):** `Hover`: Transição suave para `opacity: 0.85;` com um `transform: translateY(-1px);` e um `box-shadow` subtil para criar um efeito de "elevação". `Active`: `opacity: 0.7;`. `Disabled`: Fundo (`rgba(255,255,255,0.04)`), borda (`rgba(255,255,255,0.08)`), texto (`--grey2`), `cursor: not-allowed;`.
*   **Botões Secundários/Navegação (`.tnav-btn`, `.sb-item`, `.post-act`):**
    *   **Estilo Base:** Fundo transparente, texto `--grey`. Tipografia: `Inter`.
    *   **Glassmorphism (Interatividade):** `Hover`: `color: var(--white); background: rgba(255,255,255,0.05);` com um `box-shadow` interno muito suave ou borda fina em `--cyan` para realce. `Active`: `color: var(--white); background: rgba(0,245,255,0.08);` com uma borda sutil `rgba(0,245,255,0.12)`.
*   **Botões com Ícones:** Todos os botões que integrem ícones usarão os ícones SVG personalizados da marca, alinhados com o texto e o estilo do botão.

### 2.2. Cards e Painéis
*   **Estilo Base (`.post`, `.cc`, `.tc`, `.ag-card`, `.intro-box`, `.wa-card`, `.rs-ev`):**
    *   **Glassmorphism:** Fundo translúcido (`rgba(255,255,255,0.022)` ou similar) com `backdrop-filter: blur()`. Borda definida por `var(--glass-border)`.
    *   `border-radius` consistente (tipicamente entre `10px` e `12px`).
    *   **Conteúdo:** Hierarquia clara com títulos (`--white`), subtítulos (`--grey`) e texto de corpo (`rgba(240,244,255,0.85)`).
    *   **Interatividade (`Hover`):** Cards interativos (ex: `.post`, `.cc`, `.tc`) apresentarão `transform: translateY(-2px);` e `border-color` para a cor de destaque relevante (ex: `rgba(0,245,255,0.18)` ou `rgba(255,184,0,0.18)`), intensificando o efeito de "levantamento".

### 2.3. Formulários
*   **Input, Textarea e Select (`.sb-search input`, `.intro-box textarea`, `.sort-sel`):**
    *   **Estilo Base:** Fundo escuro e ligeiramente transparente (`rgba(255,255,255,0.04)` ou `0.05)`), borda discreta (`rgba(255,255,255,0.1)`). `border-radius` entre `7px` e `9px`.
    *   **Tipografia:** Texto de input `--white`, placeholder `--grey2`.
    *   **Glassmorphism (Interatividade):** `Focus`: `border-color: rgba(0,245,255,0.25);` com um `box-shadow` interno subtil na cor `--cyan`.
    *   **Estados de Validação:** Borda e texto de feedback com cores específicas para sucesso, aviso e erro.

### 2.4. Badges e Tags
*   **Estilo Base (`.badge`, `.ptag`, `.cc-tag`, `.sb-tag`):**
    *   `border-radius` varia entre `8px` (mais angulares) e `20px` (mais arredondados, para estados/números).
    *   **Variações Temáticas:** Cores de fundo e borda baseadas em `rgba()` das cores de destaque (`--cyan`, `--gold`, `--magenta`, `--purple`, e o novo `--lime`), com `opacity` variando entre `0.06` e `0.12` para fundos, e `0.1` e `0.25` para bordas.
    *   **Tipografia:** `JetBrains Mono` para um toque técnico e conciso.

### 2.5. Iconografia Integrada (Ícones SVG Personalizados)
*   Todos os ícones existentes na interface serão substituídos por **ícones SVG personalizados**, criados para refletir a estética e os princípios do Glassmorphism da marca "IA AVANÇADA PT".
*   **Implementação:** Os SVGs serão integrados diretamente no HTML (inline) ou através de um sistema de sprite para garantir máxima flexibilidade no controlo de cor, tamanho e interatividade via CSS.
*   **Consistência:** A linguagem visual dos ícones seguirá as diretrizes de estilo (e.g., minimalist, outline, gradientes) e a grelha definida na secção de Fundamentos Visuais.

## 3. Guias e Documentação

### 3.1. Directrizes (Guidelines)
*   **Manifesto:** Uma declaração concisa dos princípios, crenças e valores fundamentais da "IA AVANÇADA PT". O que a comunidade representa.
*   **Propósito:** A razão de ser da comunidade e o impacto que procura gerar na vida dos seus membros.
*   **Arquétipo:** A personalidade central da marca (ex: O Sábio, O Mago, O Herói, O Inovador).
*   **Posicionamento:** Como a "IA AVANÇADA PT" se diferencia no panorama das comunidades de IA.
*   **BrandScript:** Uma narrativa simples e poderosa que descreve a jornada do utilizador.
*   **Truelines:** Os valores inegociáveis e a ética que governam a comunidade e as suas interações.
*   **Naming:** Regras e princípios para a nomenclatura.
*   **Vocabulário:** Um glossário de termos específicos da comunidade.

### 3.2. Brandbook (Livro de Marca)
*   **Visão Geral da Marca:** Um resumo conciso dos seus valores, missão e promessa.
*   **Logotipo e Identidade:** Diretrizes de uso do logotipo, versões, tamanhos mínimos, cores e áreas de segurança.
*   **Cores da Marca:** A paleta completa de cores com os seus códigos e diretrizes de aplicação.
*   **Tipografia da Marca:** As fontes primárias e secundárias com exemplos de uso.
*   **Iconografia:** Apresentação de todos os ícones SVG personalizados.
*   **Imagens e Ilustrações:** Estilo preferencial para mídias visuais.
*   **Tom de Voz:** Descrição detalhada de como a marca "fala".

### 3.3. Documentação do Design System (Referência Técnica)
*   **Introdução:** Explicação do propósito do Design System e como usá-lo.
*   **Fundamentos Visuais:** Secções detalhadas para Cores, Tipografia, Espaçamento, Glassmorphism e Iconografia.
*   **Componentes:** Um catálogo exaustivo de todos os componentes da UI com descrição, exemplos visuais, snippets de código, diretrizes de uso e acessibilidade.
*   **Padrões de Layout:** Modelos e exemplos para layouts de página comuns.
*   **Acessibilidade:** Requisitos de acessibilidade para cada componente.

### 3.4. Showcase (Exibição de Aplicações)
*   **Exemplos Reais:** Demonstração de como os componentes e padrões são aplicados em diferentes secções da plataforma.
*   **Casos de Estudo:** Análises de como o Design System foi aplicado para resolver desafios de design específicos.
*   **Melhores Práticas:** Exemplos de uso correto do Design System e demonstrações de usos incorretos.