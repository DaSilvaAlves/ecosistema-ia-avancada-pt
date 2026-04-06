# PRD — Feed da Comunidade [IA]AVANCADA PT v2.0

**Versao:** 2.0
**Data:** 18/03/2026
**Autor:** Bob (PM Agent) para Eurico Alves
**Estado:** Draft para Validacao
**Supersede:** PRD v1.0 (modelo Free/Premium com Stripe)

---

## Change Log

| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 18/03/2026 | 2.0 | PRD completo — sistema de niveis numerologicos, feed redesenhado, eliminacao do modelo Premium/Stripe | Bob / Eurico Alves |

---

## 1. Visao e Problema

### 1.1 O Problema

A comunidade [IA]AVANCADA PT tem actualmente um banner "Tornar-me Premium" no feed e tags "PREMIUM" na sidebar que transmitem uma mensagem errada. A comunidade e FREE. Nao ha membros pagos, nao ha Stripe, nao ha tiers monetarios. O resultado e que os membros veem barreiras artificiais que nao existem e sentem que estao numa versao limitada de algo, quando na realidade a comunidade e o produto completo.

O feed actual e generico: posts hardcoded, sem personalizacao, sem dados reais do membro. Nao ha mecanismo de progressao que incentive o membro a continuar a explorar. O membro entra, ve conteudo estatico, e nao tem razao para voltar amanha.

### 1.2 O Que Este PRD Resolve

1. **Elimina a mentira do Premium** -- remove todo o conceito Free/Premium e substitui por um sistema de niveis baseado em progressao real
2. **Cria um feed personalizado** -- o membro ve o seu nome, o seu nivel, o seu proximo desafio
3. **Introduz progressao com significado** -- sistema de niveis com numerologia proprietaria que cria identidade e pertenca
4. **Conecta a comunidade FREE ao produto pago (Imersao)** -- o CTA correcto e para a Imersao, nao para "Premium"

### 1.3 Para Quem

Todos os membros da comunidade. Nao ha segmentacao por pagamento. A segmentacao e por progressao: quem fez mais, ve mais, e mais.

### 1.4 Decisoes Estrategicas Tomadas

| Decisao | Racional |
|---------|----------|
| Comunidade e 100% FREE | O valor esta na rede e na progressao. Monetizacao acontece via Imersao (produto pago separado) |
| Sistema de niveis substitui tiers pagos | Progressao por merito, nao por carteira. Cria engagement real |
| Numerologia proprietaria (R) | Diferenciador de marca impossivel de copiar. O membro vive o arquetipo sem saber o codigo por tras |
| CTA para Imersao, nao para Premium | Alinhamento com modelo de negocio real: comunidade FREE alimenta Imersao paga |

---

## 2. Sistema de Niveis — Numerologia Proprietaria (R)

### 2.1 Tabela de Niveis

| Nivel | Nome | Codigo Numerologico | Arquetipo | Como Desbloquear | Ring de Avatar | Glow |
|-------|------|---------------------|-----------|------------------|----------------|------|
| 1 | Entrada | — | O Observador | Registo na comunidade | Cinzento (`#8892A4`) | Nenhum |
| 2 | [741] | Sequencia 7-4-1 | Resolucao imediata de problemas | Completar Desafio N1 "IA no Teu Dia" | Cyan (`#00F5FF`) | Suave |
| 3 | [520] | Sequencia 5-2-0 | Entrada de valor inesperada | Completar Desafio N2 "Teu Agente" | Gold (`#FFB800`) | Intenso |
| 4 | [8 infinito] | Sequencia 8-infinito | Envio ao universo / infinito | Completar Desafio N3 "Sistema Autonomo" | Purple (`#9D00FF`) | Maximo + simbolo infinito |

### 2.2 Principios do Sistema

| Principio | Detalhe |
|-----------|---------|
| Proprietario | A numerologia e codigo interno da marca [IA]AVANCADA PT. Nao se explica publicamente |
| Vivido, nao ensinado | O membro experimenta o arquetipo atraves da jornada. Nunca se diz "esta e a sequencia 741" |
| Irreversivel | Uma vez desbloqueado, o nivel nunca baixa |
| Visivel socialmente | Outros membros veem o ring e badge no perfil. Cria aspiracao |
| Sem atalhos | Nao se pode comprar nivel. So se chega la fazendo |

### 2.3 Desafios por Nivel

| Desafio | Nivel Alvo | Nome | Descricao Resumida | Criterio de Conclusao |
|---------|------------|------|---------------------|----------------------|
| N1 | 2 [741] | IA no Teu Dia | Resolver um problema real do dia-a-dia com IA em 24h | Submeter post no feed com resultado + screenshot |
| N2 | 3 [520] | Teu Agente | Criar um agente IA funcional (AIOX, Claude Code ou equivalente) | Submeter demo funcional ou repositorio |
| N3 | 4 [8 infinito] | Sistema Autonomo | Construir um sistema com 2+ agentes a colaborar autonomamente | Submeter sistema funcional + documentacao |

**Nota:** A definicao detalhada de cada desafio (regras, prazos, formato de submissao, criterios de avaliacao) sera feita num documento separado. Este PRD define apenas a mecanica de progressao.

---

## 3. Arquitectura de Valor

### 3.1 Modelo: Comunidade FREE + Imersao Paga

```
COMUNIDADE [IA]AVANCADA PT (FREE)
├── Todos os membros: Nivel 1+
├── Ferramentas FREE: Zona de Genialidade, IA do Zero, Monta o teu Cockpit, Claude Code
├── Feed, Desafios, News, Perguntas, Apresentacoes
├── Sistema de niveis e progressao
└── Acesso a conteudo [741], [520], [8 infinito] mediante completar desafios
    |
    v
IMERSAO IA AVANCADA (PAGA)
├── Para construir sistemas de Nivel 4 com acompanhamento
├── Precos crescentes por nivel de Imersao
├── Grupo fechado, intensivo, mentoria directa
└── Produto separado — nao e "upgrade da comunidade"
```

### 3.2 O Que Muda Face ao PRD v1.0

| Aspecto | PRD v1.0 (antigo) | PRD v2.0 (novo) |
|---------|-------------------|-----------------|
| Modelo | Free + Premium (28 EUR/mes) | 100% FREE |
| Progressao | Pagar = desbloquear | Fazer = desbloquear |
| Tags sidebar | "PREMIUM" | [741], [520], [8 infinito] |
| Banner CTA | "Tornar-me Premium" | CTA para Imersao |
| Stripe | Necessario | Nao necessario |
| Identidade visual | Badge "PREMIUM" ou "FREE" | Ring de avatar + badge numerologico |

### 3.3 Conteudo por Nivel de Acesso

| Conteudo | Nivel Minimo | Localizacao |
|----------|-------------|-------------|
| Zona de Genialidade | 1 (todos) | Sidebar — Cursos & Materiais |
| IA do Zero | 1 (todos) | Sidebar — Cursos & Materiais |
| Monta o teu Cockpit | 1 (todos) | Sidebar — Cursos & Materiais |
| Claude Code Essencial | 1 (todos) | Sidebar — Cursos & Materiais |
| AIOX Basico | 2 [741] | Sidebar — Cursos & Materiais |
| AIOX Avancado | 3 [520] | Sidebar — Cursos & Materiais |
| Biblioteca de Prompts | 3 [520] | Sidebar — Cursos & Materiais |
| AIOX Control Center | 4 [8 infinito] | Sidebar — Cursos & Materiais |

---

## 4. Feed Layout — Blocos por Prioridade

O feed e a vista principal que o membro ve ao entrar no dashboard. Os blocos aparecem de cima para baixo na seguinte ordem de prioridade.

### 4.1 Bloco 1 — Mensagem de Boas-Vindas Personalizada (FIXADO)

| Propriedade | Valor |
|-------------|-------|
| Posicao | Topo do feed, fixado (nao scrolla) |
| Dados | Nome do membro (display_name de Supabase) + nivel actual |
| Comportamento | Sempre visivel. Actualiza quando o membro muda de nivel |

**Especificacao visual:**

```
+------------------------------------------------------------------+
|  Ola [Nome], estas no Nivel [X]                                   |
|  [Badge numerologico ou "Entrada" se Nivel 1]                     |
|                                                                    |
|  [Se nivel < 4: "Proximo passo: Desafio [nome]"]                  |
|  [Se nivel 4: "Sistema Autonomo — nivel maximo"]                   |
+------------------------------------------------------------------+
```

**Regras:**
- Display name vem de `profiles.display_name` (Supabase)
- Se display_name nulo, usar primeira parte do email antes do @
- Badge mostra o codigo numerologico do nivel actual (ex: "[741]" para nivel 2)
- Proximo passo mostra o nome do desafio que desbloqueia o proximo nivel
- Container com glassmorphism, borda esquerda com a cor do nivel actual

**CSS de referencia:**
```css
/* Container */
background: rgba(255,255,255,0.025);
border: 1px solid rgba(255,255,255,0.08);
border-left: 3px solid var(--nivel-cor); /* cor do nivel actual */
border-radius: 12px;
backdrop-filter: blur(12px);
padding: 1.2rem 1.5rem;
```

**Criterios de aceitacao:**
- [ ] Mostra o nome real do membro logado
- [ ] Mostra o nivel actual correcto (1, 2, 3 ou 4)
- [ ] Se nivel < 4, mostra o nome do proximo desafio
- [ ] Se nivel 4, mostra mensagem de nivel maximo
- [ ] Se display_name nulo, fallback para email
- [ ] Borda esquerda na cor do nivel
- [ ] Container fixo, nao scrolla com o resto do feed

---

### 4.2 Bloco 2 — Destaque de Noticia (News IA)

| Propriedade | Valor |
|-------------|-------|
| Posicao | Segundo bloco, abaixo das boas-vindas |
| Dados | Noticia mais recente da tabela `news` (Supabase) |
| Comportamento | Actualiza quando ha nova noticia. Mostra apenas a mais recente |

**Especificacao visual:**

```
+------------------------------------------------------------------+
|  [IMAGEM DE DESTAQUE — container 100% width, max-height 200px]    |
|                                                                    |
|  NEWS IA                                                           |
|  [Titulo da noticia]                                               |
|  [Excerto 2-3 linhas]                           [Ler mais ->]     |
+------------------------------------------------------------------+
```

**Regras:**
- Imagem vem de `news.image_url` (Supabase). Se nula, usar gradiente linear como fallback
- Titulo em H3 (Inter, weight 700, 1.15rem)
- Excerto truncado a 180 caracteres com ellipsis
- "Ler mais" abre a noticia completa (expandir inline ou vista dedicada)
- Badge "NEWS IA" em JetBrains Mono, font-size 0.65rem, fundo cyan com opacidade

**Fallback de imagem:**
```css
background: linear-gradient(135deg, rgba(0,245,255,0.15), rgba(157,0,255,0.15));
min-height: 120px;
```

**Criterios de aceitacao:**
- [ ] Mostra a noticia mais recente do Supabase
- [ ] Imagem renderiza correctamente quando presente
- [ ] Fallback gradiente quando imagem ausente
- [ ] Excerto truncado a 180 caracteres
- [ ] Link "Ler mais" funcional
- [ ] Se nao ha noticias na tabela, bloco nao aparece (sem espaco vazio)

---

### 4.3 Bloco 3 — Desafio Activo

| Propriedade | Valor |
|-------------|-------|
| Posicao | Terceiro bloco |
| Dados | Desafio activo do nivel do membro (proximo nivel a desbloquear) |
| Comportamento | Dinamico — mostra o desafio relevante para o nivel actual do membro |

**Especificacao visual:**

```
+------------------------------------------------------------------+
|  DESAFIO ACTIVO                                                    |
|  [Nome do desafio]                                                 |
|  [Descricao curta]                                                 |
|                                                                    |
|  Nivel que desbloqueia: [X] [badge numerologico]                   |
|  [Prazo se existir]                                                |
|                                                                    |
|  [Botao: "Aceitar Desafio" / "Ver Submissoes" / "Concluido"]      |
+------------------------------------------------------------------+
```

**Regras:**
- Se membro e nivel 1: mostra Desafio N1 "IA no Teu Dia"
- Se membro e nivel 2: mostra Desafio N2 "Teu Agente"
- Se membro e nivel 3: mostra Desafio N3 "Sistema Autonomo"
- Se membro e nivel 4: mostra "Todos os desafios concluidos" com opcao de ver submissoes da comunidade
- Botao CTA muda conforme estado: nao aceite -> "Aceitar Desafio", aceite mas nao submetido -> "Submeter", submetido -> "Concluido"
- Container com borda na cor do nivel alvo (o que vai desbloquear)

**Criterios de aceitacao:**
- [ ] Mostra o desafio correcto para o nivel do membro
- [ ] Botao CTA muda conforme estado do desafio
- [ ] Nivel 4 ve mensagem "concluido" + link para submissoes
- [ ] Borda na cor do nivel que o desafio desbloqueia
- [ ] Clicar "Aceitar Desafio" regista aceitacao no Supabase

---

### 4.4 Bloco 4 — Banner CTA Imersao (substitui "Tornar-me Premium")

| Propriedade | Valor |
|-------------|-------|
| Posicao | Quarto bloco |
| Dados | Estatico (link para pagina de venda da Imersao) |
| Comportamento | Sempre visivel. Pode ser dispensado pelo membro (dismiss com cookie/localStorage) |

**Especificacao visual:**

```
+------------------------------------------------------------------+
|  [Gradiente gold/purple de fundo]                                  |
|                                                                    |
|  Queres construir sistemas de Nivel 4?                             |
|  Entra na Imersao IA Avancada — o proximo passo.                   |
|                                                                    |
|  [Botao: "Saber mais sobre a Imersao ->"]                          |
|                                                          [X fechar]|
+------------------------------------------------------------------+
```

**Regras:**
- Substituicao directa do banner "Tornar-me Premium"
- Copy directo, sem superlativos: "Queres construir sistemas de Nivel 4?"
- Botao abre link externo para pagina de venda da Imersao
- Membro pode fechar o banner (localStorage `banner_imersao_dismissed=true`)
- Se fechado, nao volta a aparecer durante 7 dias
- Fundo: `linear-gradient(135deg, rgba(255,184,0,0.12), rgba(157,0,255,0.08))`

**Criterios de aceitacao:**
- [ ] Banner aparece no lugar do antigo "Tornar-me Premium"
- [ ] Texto nao menciona "Premium" em lado nenhum
- [ ] Botao abre link correcto para pagina da Imersao
- [ ] Botao X fecha o banner
- [ ] Banner nao volta durante 7 dias apos dismiss
- [ ] Gradiente gold/purple conforme design system

---

## 5. Sidebar — Tags Numerologicas

### 5.1 Nova Estrutura da Sidebar

A sidebar substitui todas as tags "PREMIUM" por tags numerologicas. Os itens ficam visiveis mas com indicacao clara do nivel necessario.

```
COMUNIDADE
├── Feed
├── Apresente-se
├── Primeiros Passos
├── News IA
├── Desafio AIOX
├── Perguntas a Comunidade
└── Lab de Resultados

CURSOS & MATERIAIS
├── Zona de Genialidade
├── IA do Zero
├── Monta o teu Cockpit
├── Claude Code Essencial
├── AIOX Basico                    [741]
├── AIOX Avancado                  [520]
├── Biblioteca de Prompts          [520]
└── AIOX Control Center            [8 infinito]

FERRAMENTAS PIPELINE
├── Student Profiler
├── Briefing Generator
├── Starter Builder
└── AIOS Compiler
```

### 5.2 Comportamento das Tags

| Tag | Cor | Estilo | Significado |
|-----|-----|--------|-------------|
| (sem tag) | — | — | Acessivel a todos (Nivel 1+) |
| [741] | Cyan (`#00F5FF`) | Badge com fundo `rgba(0,245,255,0.08)` + borda `rgba(0,245,255,0.2)` | Requer Nivel 2 |
| [520] | Gold (`#FFB800`) | Badge com fundo `rgba(255,184,0,0.08)` + borda `rgba(255,184,0,0.2)` | Requer Nivel 3 |
| [8 infinito] | Purple (`#9D00FF`) | Badge com fundo `rgba(157,0,255,0.08)` + borda `rgba(157,0,255,0.2)` | Requer Nivel 4 |

### 5.3 Comportamento ao Clicar Item Bloqueado

Quando o membro clica num item para o qual nao tem nivel suficiente:

1. Nao abre o conteudo
2. Mostra mensagem inline: "Completa o Desafio [nome] para desbloquear"
3. Link directo para o desafio relevante
4. Sem modal, sem popup agressivo — apenas mensagem contextual

**Criterios de aceitacao:**
- [ ] Tags [741], [520], [8 infinito] substituem todas as tags "PREMIUM"
- [ ] Cada tag tem a cor correcta conforme tabela
- [ ] Itens sem tag sao acessiveis a todos os membros
- [ ] Clicar item bloqueado mostra mensagem com link para desafio
- [ ] Membro com nivel suficiente acede normalmente (sem tag visivel para items ja desbloqueados — opcional: manter tag mas sem lock)

---

## 6. Identidade Visual de Nivel — Avatar Ring + Badge

### 6.1 Ring de Avatar

O avatar do membro em qualquer contexto (top nav, perfil, comentarios, feed) tem um ring (anel) cuja cor e intensidade de glow dependem do nivel.

| Nivel | Cor do Ring | Glow | CSS box-shadow |
|-------|-------------|------|----------------|
| 1 (Entrada) | `#8892A4` (Grey) | Nenhum | `none` |
| 2 [741] | `#00F5FF` (Cyan) | Suave | `0 0 12px rgba(0,245,255,0.3)` |
| 3 [520] | `#FFB800` (Gold) | Intenso | `0 0 20px rgba(255,184,0,0.4), 0 0 40px rgba(255,184,0,0.15)` |
| 4 [8 infinito] | `#9D00FF` (Purple) | Maximo + simbolo infinito | `0 0 24px rgba(157,0,255,0.5), 0 0 48px rgba(157,0,255,0.2), 0 0 72px rgba(157,0,255,0.08)` |

### 6.2 CSS de Referencia para o Ring

```css
/* Base do avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  position: relative;
}

/* Nivel 1 — Entrada */
.avatar.nivel-1 {
  border: 2px solid #8892A4;
}

/* Nivel 2 — [741] */
.avatar.nivel-2 {
  border: 2px solid #00F5FF;
  box-shadow: 0 0 12px rgba(0,245,255,0.3);
}

/* Nivel 3 — [520] */
.avatar.nivel-3 {
  border: 2px solid #FFB800;
  box-shadow: 0 0 20px rgba(255,184,0,0.4), 0 0 40px rgba(255,184,0,0.15);
}

/* Nivel 4 — [8 infinito] */
.avatar.nivel-4 {
  border: 2px solid #9D00FF;
  box-shadow: 0 0 24px rgba(157,0,255,0.5), 0 0 48px rgba(157,0,255,0.2), 0 0 72px rgba(157,0,255,0.08);
}

/* Badge numerologico junto ao nome */
.nivel-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.45rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.nivel-badge.n1 { background: rgba(136,146,164,0.12); border: 1px solid rgba(136,146,164,0.25); color: #8892A4; }
.nivel-badge.n2 { background: rgba(0,245,255,0.08); border: 1px solid rgba(0,245,255,0.2); color: #00F5FF; }
.nivel-badge.n3 { background: rgba(255,184,0,0.08); border: 1px solid rgba(255,184,0,0.2); color: #FFB800; }
.nivel-badge.n4 { background: rgba(157,0,255,0.08); border: 1px solid rgba(157,0,255,0.2); color: #9D00FF; }
```

### 6.3 Badge Numerologico

Junto ao nome do membro, aparece um badge com o codigo do nivel:

| Nivel | Badge | Texto |
|-------|-------|-------|
| 1 | Cinzento | `Nivel 1` |
| 2 | Cyan | `[741]` |
| 3 | Gold | `[520]` |
| 4 | Purple | `[8 infinito]` |

O badge aparece em:
- Top nav (junto ao nome)
- Perfil do membro
- Autoria de posts no feed
- Autoria de comentarios
- Lista de participantes (se existir)

**Criterios de aceitacao:**
- [ ] Avatar tem ring na cor correcta do nivel
- [ ] Glow aumenta com o nivel (nenhum -> suave -> intenso -> maximo)
- [ ] Nivel 4 tem glow triple-layer + simbolo infinito
- [ ] Badge numerologico aparece junto ao nome em todos os contextos listados
- [ ] Badge tem a cor e estilo correctos conforme tabela
- [ ] Transicao de nivel actualiza imediatamente o ring e badge (sem necessidade de logout)

---

## 7. Dados e Schema Supabase

### 7.1 Alteracoes Necessarias na Tabela `profiles`

| Campo | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| `nivel` | `integer` | `1` | Nivel actual do membro (1-4) |
| `nivel_updated_at` | `timestamptz` | `null` | Data da ultima mudanca de nivel |

### 7.2 Nova Tabela: `desafios_progresso`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | `uuid` PK | Identificador unico |
| `user_id` | `uuid` FK -> auth.users | Membro |
| `desafio_id` | `text` | Identificador do desafio ('n1', 'n2', 'n3') |
| `status` | `text` | 'aceite', 'submetido', 'aprovado', 'rejeitado' |
| `submissao_url` | `text` | Link para o post/demo submetido |
| `aceite_at` | `timestamptz` | Data de aceitacao |
| `submetido_at` | `timestamptz` | Data de submissao |
| `aprovado_at` | `timestamptz` | Data de aprovacao (por admin) |
| `created_at` | `timestamptz` | Timestamp de criacao |

### 7.3 RLS (Row Level Security)

| Tabela | Politica | Regra |
|--------|----------|-------|
| `profiles` | SELECT | Membro le o proprio perfil + le nivel de outros membros |
| `profiles` | UPDATE | Membro actualiza o proprio perfil. `nivel` so e actualizavel via function |
| `desafios_progresso` | SELECT | Membro ve o proprio progresso |
| `desafios_progresso` | INSERT | Membro insere o proprio progresso |
| `desafios_progresso` | UPDATE | Membro actualiza status do proprio progresso |

### 7.4 Funcao de Promocao de Nivel

A promocao de nivel nao acontece automaticamente. O fluxo e:

1. Membro aceita desafio -> INSERT em `desafios_progresso`
2. Membro submete -> UPDATE status para 'submetido'
3. Admin (Eurico) aprova -> UPDATE status para 'aprovado' + chamada a funcao `promover_nivel(user_id, novo_nivel)`
4. Funcao `promover_nivel` actualiza `profiles.nivel` e `profiles.nivel_updated_at`

**Racional:** Nao e automatico para manter qualidade. Eurico valida que a submissao cumpre os criterios antes de promover.

---

## 8. O Que NAO Fazer (Constraints)

| Constraint | Racional |
|------------|----------|
| NUNCA mencionar "Premium" em qualquer interface, copy, badge ou CTA | O modelo Premium nao existe. A comunidade e FREE |
| NUNCA criar Stripe integration | Nao ha pagamentos na comunidade. Pagamentos so existem na Imersao (produto separado) |
| NUNCA revelar o sistema numerologico aos membros | A numerologia e codigo interno. O membro ve [741], [520], [8 infinito] mas nunca sabe o sistema por tras |
| NUNCA permitir compra de nivel | Niveis so se desbloqueiam por merito (completar desafios) |
| NUNCA usar light mode ou fundo branco | Design system: fundo `#04040A` inegociavel |
| NUNCA usar PT-BR | Toda a copy em PT-PT Portugal |
| NUNCA usar superlativos na copy | Sem "revolucionario", "incrivel", "o melhor". Tom directo: "fala como quem ja fez" |
| NUNCA usar cores fora da paleta | Apenas: #04040A, #F0F4FF, #00F5FF, #FFB800, #9D00FF, #FF006E, #39FF14, #8892A4, #4A5568 |
| NUNCA automatizar promocao de nivel | Admin valida cada submissao antes da promocao |
| NUNCA mostrar espaco vazio | Se um bloco nao tem dados (ex: sem noticias), o bloco nao aparece |

---

## 9. Design System — Referencia Rapida

Este PRD segue integralmente o Design System [IA]AVANCADA PT. Referencia completa: `design-system-ia-avancada.md` (regra Claude).

| Elemento | Especificacao |
|----------|--------------|
| Fundo | `#04040A` |
| Glassmorphism | `background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px)` |
| Fonte body | Inter, 0.95rem, weight 400, line-height 1.8 |
| Fonte tech/badges | JetBrains Mono, 0.65rem, weight 700, letter-spacing 0.1em |
| Border radius cards | 12px |
| Border radius badges | 20px |
| Botao primario | background: var(--cyan); color: #04040A; font-weight 700; box-shadow: 0 0 20px rgba(0,245,255,0.4) |

---

## 10. Impacto e Risco

### 10.1 O Que Muda no Codebase Existente

| Ficheiro | Mudanca |
|----------|---------|
| `dashboard.html` | Remover toda a logica Free/Premium. Substituir por logica de niveis. Novo feed. Nova sidebar com tags numerologicas |
| `config.js` | Sem alteracao (Supabase mantem-se) |
| `index.html` | Sem alteracao (login mantem-se) |
| `curso-*.html` | Substituir guard `isPremium` por guard `nivel >= X` |
| `biblioteca.html` | Substituir guard `isPremium` por guard `nivel >= 3` |
| Supabase | Adicionar campo `nivel` a `profiles`. Criar tabela `desafios_progresso` |

### 10.2 Riscos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Membros existentes perdem acesso a conteudo que ja tinham | Baixa | Alto | Migrar membros existentes com nivel 1. Nenhum conteudo FREE actual fica bloqueado |
| Sistema de niveis nao motiva engagement | Media | Alto | Desafios praticos com valor real (nao gamificacao vazia). Identidade visual aspiracional |
| Admin (Eurico) sobrecarregado a validar submissoes | Media | Medio | Com 6 membros actuais, volume e gerivel. Quando escalar, definir criterios mais objectivos ou delegar |
| Numerologia nao ressoa com o publico | Baixa | Medio | Testar com 3-5 membros antes de lancar. Os codigos sao subtis — se nao ressoam, nao prejudicam |

---

## 11. Criterios de Aceitacao Globais

### Gate de Implementacao

Antes de considerar esta feature completa:

- [ ] Todo o texto "Premium" removido de `dashboard.html`
- [ ] Todo o texto "Tornar-me Premium" removido
- [ ] Badges "PREMIUM" substituidos por tags numerologicas [741], [520], [8 infinito]
- [ ] Banner CTA aponta para Imersao (nao para Premium)
- [ ] Mensagem de boas-vindas mostra nome real + nivel do membro
- [ ] Bloco News IA mostra noticia real do Supabase (ou esconde se vazio)
- [ ] Bloco Desafio Activo mostra desafio correcto para o nivel
- [ ] Ring de avatar muda conforme nivel
- [ ] Badge numerologico junto ao nome funcional
- [ ] Campo `nivel` existe em `profiles` (Supabase)
- [ ] Tabela `desafios_progresso` criada (Supabase)
- [ ] Guards de acesso usam `nivel` em vez de `isPremium`
- [ ] Nenhuma referencia a Stripe em todo o codebase
- [ ] Copy em PT-PT, tom directo, sem superlativos
- [ ] Design system respeitado (fundo escuro, glassmorphism, paleta)

---

## 12. Proximos Passos

| Passo | Responsavel | Descricao |
|-------|-------------|-----------|
| 1 | Eurico (validacao) | Validar este PRD — confirmar decisoes antes de implementar |
| 2 | @data-engineer | Criar migracoes Supabase: campo `nivel` + tabela `desafios_progresso` |
| 3 | @dev | Implementar feed (4 blocos) + sidebar (tags numerologicas) + avatar ring |
| 4 | @dev | Substituir todos os guards `isPremium` por `nivel >= X` |
| 5 | Eurico | Definir conteudo detalhado dos 3 desafios (regras, prazos, criterios) |
| 6 | @qa | Validar que zero referencias a "Premium" existem |
| 7 | @devops | Deploy para producao |

---

*PRD gerado por Bob (PM Agent) | AIOX | 18/03/2026*
*Supersede: PRD-COMUNIDADE-IA-AVANCADA-PT.md v1.0 (10/03/2026)*
