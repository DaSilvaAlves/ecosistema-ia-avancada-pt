# AIOS Control Center V2 — Product Requirements Document (PRD)

**Versao:** 1.0
**Data:** 02/04/2026
**Autor:** Morgan (PM) — AIOX
**Estado:** Draft
**Projecto:** [IA]AVANCADA PT — Ecosistema

---

## Change Log

| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 02/04/2026 | 1.0 | PRD inicial — consolidacao de 6 ferramentas | Morgan (PM) |

---

## 1. Visao e objectivo do produto

### 1.1 Problema

A comunidade [IA]AVANCADA PT possui 6 ferramentas/dashboards parcialmente desenvolvidas, nenhuma delas completa a 100%. Cada ferramenta resolve uma parte do problema mas nenhuma resolve o problema completo: dar a cada membro um ponto unico de controlo para dominar o ecossistema AIOX.

Ferramentas existentes e o que cada uma traz de melhor:

| Ferramenta | Ponto forte | Ponto fraco |
|------------|-------------|-------------|
| AIOX Mastery Dashboard | 24 agentes, 185 tasks, 184 comandos organizados, busca, copy-to-clipboard | Apenas agentes — sem pipeline, sem setup |
| Monster Dashboard | Kanban board, pipeline visual, QA Loop tracker | Dados estaticos, sem interaccao real |
| Agent Arena | Canvas animado 60fps, command dispatch, event log | Sem utilidade pratica alem da visualizacao |
| Cockpit | Setup por fases, checkboxes com persistencia, readiness check | Apenas setup — sem agentes nem pipeline |
| AI Velocity | 6 estacoes de missao, barra de progresso, deploy URL | Fluxo rigido, sem flexibilidade |
| Control Center V1 | Activity Feed, Nexus Insight, API routes, mission control | Dados mock, nunca atingiu producao |

**Resultado actual:** o membro nao sabe onde ir, o que fazer a seguir, nem que comandos executar. A fragmentacao impede a adopcao.

### 1.2 Solucao

Construir o **AIOS Control Center V2** — uma ferramenta unica que consolida o melhor de todas as 6 ferramentas num ponto de acesso definitivo. O membro abre uma pagina e tem tudo: agentes, comandos, pipeline, setup, diagnostico e missoes.

### 1.3 Objectivos (Goals)

- **G1:** Consolidar 6 ferramentas dispersas num unico Control Center
- **G2:** Dar ao membro um ponto de entrada claro para o ecossistema AIOX
- **G3:** Tornar cada comando copiavel e executavel com um clique
- **G4:** Mostrar estado real do progresso do membro (setup, missoes, pipeline)
- **G5:** Eliminar dados mock — se nao ha dados reais, mostrar estado vazio elegante
- **G6:** Ser a ferramenta mais utilizada da comunidade (meta: 40%+ membros activos a utilizarem semanalmente)

### 1.4 Metricas de sucesso

| Metrica | Baseline | Meta (90 dias) |
|---------|----------|----------------|
| Membros activos semanais no Control Center | 0 | 40% dos membros activos |
| Comandos copiados por sessao | 0 | 3+ |
| Setup completeness medio | ~10% (estimativa) | 60%+ |
| Tempo ate primeiro comando executado | Desconhecido | < 2 minutos |
| Ferramentas substituidas | 6 dispersas | 1 unificada |

---

## 2. Publico-alvo

### 2.1 Persona primaria: Membro da comunidade [IA]AVANCADA PT

| Atributo | Descricao |
|----------|-----------|
| Quem e | Profissional portugues que quer dominar IA aplicada |
| Nivel tecnico | Variado — desde iniciantes ate developers experientes |
| Motivacao | Construir solucoes reais com IA, nao apenas teoria |
| Frustracoes actuais | Nao sabe que agentes existem, que comandos executar, nem por onde comecar |
| Contexto de uso | Abre o Control Center no browser enquanto trabalha com Claude Code / terminal |

### 2.2 Persona secundaria: Eurico (fundador/admin)

| Atributo | Descricao |
|----------|-----------|
| Quem e | Fundador e mentor principal da comunidade |
| Necessidade | Ver o que os membros estao a utilizar, identificar gaps, iterar rapidamente |
| Uso | Nao e admin panel — e observabilidade sobre a adopcao |

---

## 3. Requisitos funcionais (FR-*)

### 3.1 Seccao: Agentes

Inspiracao principal: AIOX Mastery Dashboard

| ID | Requisito |
|----|-----------|
| FR-01 | O sistema deve listar todos os agentes AIOX com nome, icon, role e descricao |
| FR-02 | Cada agente deve ter um card expansivel que mostra os seus comandos organizados por categoria |
| FR-03 | Cada comando deve ter botao de copy-to-clipboard que copia o formato `@agent *command` |
| FR-04 | Deve existir busca global por nome de agente, role ou comando |
| FR-05 | Deve existir filtro por categoria de agente (core, specialist, squad) |
| FR-06 | Os dados de agentes devem vir de um objecto JSON embebido no HTML (fonte de verdade: ficheiros de agentes em `.aiox-core/development/agents/`) |
| FR-07 | O card de agente deve mostrar badge com numero de comandos disponiveis |

### 3.2 Seccao: Pipeline

Inspiracao principal: Monster Dashboard + AI Velocity

| ID | Requisito |
|----|-----------|
| FR-08 | O sistema deve mostrar um pipeline visual de 6 fases: Profiling -> Briefing -> Design -> Prompt -> Compile -> Deploy |
| FR-09 | Cada fase do pipeline deve mostrar estado: done (verde), active (cyan), pending (cinzento), blocked (magenta) |
| FR-10 | O estado do pipeline deve ser persistido em localStorage para cada membro |
| FR-11 | Cada fase deve mostrar o comando necessario para avancar e botao de copy |
| FR-12 | Deve existir um kanban board simplificado com 5 colunas: Draft, Ready, InProgress, InReview, Done |
| FR-13 | O kanban deve suportar drag-and-drop para mover items entre colunas |
| FR-14 | Deve existir uma barra de progresso global com gradiente cyan -> purple |

### 3.3 Seccao: Arena (observabilidade)

Inspiracao principal: Agent Arena

| ID | Requisito |
|----|-----------|
| FR-15 | O sistema deve ter um canvas animado (60fps) que mostra agentes como avatares pixel art |
| FR-16 | O canvas deve mostrar agentes a moverem-se quando ha actividade registada |
| FR-17 | Deve existir um event log em tempo real (reverse-chronological) com entradas color-coded por tipo de evento |
| FR-18 | Deve existir um command dispatch: dropdown para seleccionar agente + input para comando + botao dispatch que copia o comando formatado |
| FR-19 | Deve existir stats overlay: DONE, FAIL, SENT, TIME (contadores da sessao) |
| FR-20 | O canvas deve ter mini-map para navegacao |

### 3.4 Seccao: Setup

Inspiracao principal: Cockpit

| ID | Requisito |
|----|-----------|
| FR-21 | O sistema deve mostrar um setup wizard com 5 fases: Conta, Ferramentas base, Claude Code, AIOX Framework, Verificacao |
| FR-22 | Cada fase deve ter uma lista de checkboxes com itens a completar |
| FR-23 | O progresso dos checkboxes deve ser persistido em localStorage |
| FR-24 | Cada item deve ter badge de tipo: instalar, conta, incluido, gratis, pago |
| FR-25 | Cada item com comando deve ter command block copiavel com prefixo colorido |
| FR-26 | Deve existir um readiness check grid que mostra o estado geral do setup (verde/amarelo/vermelho por categoria) |
| FR-27 | Deve existir sidebar de progresso com percentagem global e por fase |

### 3.5 Seccao: Comandos

Inspiracao principal: Control Center V1

| ID | Requisito |
|----|-----------|
| FR-28 | O sistema deve ter uma biblioteca pesquisavel de todos os comandos AIOX |
| FR-29 | Cada comando deve mostrar: sintaxe, descricao, agente responsavel, exemplo de uso |
| FR-30 | Deve existir filtro por categoria: core, development, testing, deployment, analysis |
| FR-31 | Deve existir busca por texto livre (nome, descricao, agente) |
| FR-32 | Cada comando deve ter botao de copy que copia a sintaxe exacta |
| FR-33 | Comandos relacionados devem ser agrupados visualmente |

### 3.6 Seccao: Diagnostico

Inspiracao principal: Control Center V1

| ID | Requisito |
|----|-----------|
| FR-34 | O sistema deve listar os 10 problemas mais comuns com solucoes step-by-step |
| FR-35 | Cada problema deve ter: titulo, descricao, categoria, severidade, passos de resolucao |
| FR-36 | Os passos de resolucao devem ter command blocks copiaveis |
| FR-37 | Deve existir filtro por categoria: instalacao, configuracao, execucao, rede, permissoes |
| FR-38 | Deve existir busca por texto livre |

### 3.7 Seccao: Missoes

Inspiracao principal: Control Center V1 + AI Velocity

| ID | Requisito |
|----|-----------|
| FR-39 | O sistema deve ter missoes predefinidas que guiam o membro por workflows completos |
| FR-40 | Cada missao deve ter: titulo, objectivo, agentes envolvidos, passos sequenciais, tempo estimado |
| FR-41 | Cada passo de missao deve ter command block copiavel |
| FR-42 | Missoes devem ter barra de progresso individual |
| FR-43 | O progresso das missoes deve ser persistido em localStorage |
| FR-44 | Deve existir pelo menos 6 missoes iniciais cobrindo os workflows principais: (1) Setup completo, (2) Criar primeiro projecto, (3) Pipeline do zero ao deploy, (4) Criar PRD, (5) Desenvolver uma story, (6) QA e push |

### 3.8 Navegacao e UX global

| ID | Requisito |
|----|-----------|
| FR-45 | O sistema deve ter sidebar de navegacao com icons para cada seccao |
| FR-46 | A sidebar deve ser colapsavel para maximizar espaco de conteudo |
| FR-47 | Deve existir header com titulo, badge de versao, e indicador de seccao activa |
| FR-48 | A navegacao entre seccoes deve ser instantanea (sem recarregar pagina) |
| FR-49 | O sistema deve ter teclas de atalho para navegar entre seccoes (1-7) |
| FR-50 | Deve existir um command palette (Ctrl+K) para busca global rapida em todas as seccoes |

---

## 4. Requisitos nao-funcionais (NFR-*)

| ID | Requisito |
|----|-----------|
| NFR-01 | O Control Center deve ser um ficheiro HTML standalone unico (zero build step, zero servidor) |
| NFR-02 | O ficheiro deve carregar em menos de 2 segundos em qualquer browser moderno |
| NFR-03 | O design deve seguir 100% o design system [IA]AVANCADA PT: fundo #04040A, glassmorphism, cores cyan/gold/purple/magenta/lime, fontes Inter + JetBrains Mono |
| NFR-04 | O sistema deve funcionar offline apos primeiro carregamento (localStorage para estado) |
| NFR-05 | O sistema deve ser responsive (funcional em desktop, tablet, e mobile) |
| NFR-06 | Toda a interaccao principal deve ser via comandos copiaveis (CLI First) |
| NFR-07 | Animacoes do canvas Arena devem manter 60fps em hardware medio |
| NFR-08 | O ficheiro HTML nao deve exceder 500KB (sem contar fontes externas) |
| NFR-09 | Toda a copy deve estar em PT-PT Portugal |
| NFR-10 | ZERO dados inventados — se nao ha dados reais para mostrar, mostrar estado vazio com mensagem orientadora |
| NFR-11 | O sistema deve funcionar sem autenticacao (acessivel a todos os membros sem gate) |
| NFR-12 | O sistema deve ser deployavel em Vercel como ficheiro estatico |
| NFR-13 | Compatibilidade: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |

---

## 5. Constraints (CON-*)

| ID | Constraint |
|----|-----------|
| CON-01 | Single HTML file — sem framework, sem build step, sem dependencies externas alem de fontes Google |
| CON-02 | Design system [IA]AVANCADA PT e inegociavel — ver `.claude/rules/design-system-ia-avancada.md` |
| CON-03 | CLI First (Constitution Artigo I) — toda funcionalidade principal acessivel via comandos copiaveis |
| CON-04 | PT-PT exclusivo — sem PT-BR, sem ingles na interface do utilizador |
| CON-05 | ZERO gates de nivel — todo o conteudo acessivel a todos os membros |
| CON-06 | Sem backend obrigatorio — localStorage para persistencia, Supabase opcional para sincronizacao futura |
| CON-07 | Dados de agentes e comandos devem reflectir o estado real do ecossistema — extraidos dos ficheiros de agentes em `.aiox-core/development/agents/` |
| CON-08 | O ficheiro deve ser auto-contido — abrindo-o directamente no browser deve funcionar |
| CON-09 | A Arena (canvas animado) e a seccao mais complexa — pode ser implementada em fase posterior se necessario |

---

## 6. Arquitectura proposta

### 6.1 Decisao: Single HTML standalone

[AUTO-DECISION] Formato? -> Single HTML standalone (reason: as ferramentas mais bem-sucedidas do ecossistema — AIOX Mastery Dashboard e Cockpit — sao HTML standalone; zero build step; deployavel em qualquer lugar; consistente com a filosofia do ecossistema)

**Alternativa considerada e rejeitada:**
- Next.js 15 (como o Control Center V1): adicionava complexidade de build, obrigava a servidor, e o V1 nunca chegou a producao precisamente por esta complexidade extra

### 6.2 Estrutura tecnica

```
imersao-tools/comunidade/control-center.html   ← Ficheiro unico
```

**Composicao interna do ficheiro:**

| Bloco | Proposito |
|-------|-----------|
| `<style>` | CSS completo com design system, animacoes, responsive |
| `<div id="app">` | Estrutura HTML com todas as 7 seccoes |
| `<script>` — DATA | Objecto JSON com agentes, comandos, missoes, diagnosticos |
| `<script>` — ARENA | Modulo Canvas para a Arena (separado logicamente) |
| `<script>` — APP | Router SPA, navegacao, busca, persistencia localStorage |

### 6.3 Stack tecnica

| Componente | Tecnologia |
|------------|-----------|
| Markup | HTML5 semantico |
| Styling | CSS3 com custom properties (variaves do design system) |
| Logic | Vanilla JavaScript (ES2020+) |
| State | localStorage (persistencia local) |
| Routing | Hash-based SPA routing (`#agentes`, `#pipeline`, etc.) |
| Animacao Arena | Canvas 2D API |
| Fontes | Google Fonts (Inter + JetBrains Mono) |
| Deploy | Vercel (ficheiro estatico) |

### 6.4 Modelo de dados embebido

Os dados sao embebidos no HTML como constantes JavaScript. Um script de geracao (executado pelo @dev antes de cada release) extrai os dados reais dos ficheiros de agentes.

```javascript
const AGENTS_DATA = [
  {
    id: "dev",
    name: "Dex",
    icon: "...",
    role: "Developer",
    commands: [
      { name: "develop", syntax: "@dev *develop {storyId}", description: "..." }
    ]
  }
  // ... extraido de .aiox-core/development/agents/
];

const MISSIONS_DATA = [...]; // 6 missoes predefinidas
const DIAGNOSTICS_DATA = [...]; // 10 problemas comuns
const PIPELINE_PHASES = [...]; // 6 fases do pipeline
const SETUP_PHASES = [...]; // 5 fases do setup
```

### 6.5 Gerador de dados

| Artefacto | Descricao |
|-----------|-----------|
| `scripts/generate-control-center-data.js` | Script Node.js que le os ficheiros de agentes, extrai comandos, e gera o bloco DATA para embeber no HTML |
| Input | `.aiox-core/development/agents/*.md` |
| Output | Bloco `<script>` com constantes JSON |

---

## 7. Design UI

### 7.1 Layout global

```
+--------------------------------------------------+
|  HEADER: AIOS Control Center [V2.0]  [CTRL+K]    |
+------+-------------------------------------------+
|      |                                           |
| SIDE |           CONTENT AREA                    |
| BAR  |      (seccao activa)                      |
|      |                                           |
| [1]  |                                           |
| [2]  |                                           |
| [3]  |                                           |
| [4]  |                                           |
| [5]  |                                           |
| [6]  |                                           |
| [7]  |                                           |
|      |                                           |
+------+-------------------------------------------+
```

### 7.2 Sidebar

| Slot | Icon | Seccao | Atalho |
|------|------|--------|--------|
| 1 | Icone agente | Agentes | `1` |
| 2 | Icone pipeline | Pipeline | `2` |
| 3 | Icone arena | Arena | `3` |
| 4 | Icone setup | Setup | `4` |
| 5 | Icone terminal | Comandos | `5` |
| 6 | Icone diagnostico | Diagnostico | `6` |
| 7 | Icone missao | Missoes | `7` |

### 7.3 Componentes visuais reutilizaveis

| Componente | Descricao | Usado em |
|------------|-----------|----------|
| CommandBlock | Bloco de codigo com syntax highlight + botao copy | Todas as seccoes |
| AgentCard | Card expansivel com icon, nome, role, comandos | Agentes |
| ProgressBar | Barra de progresso com gradiente cyan -> purple | Pipeline, Setup, Missoes |
| KanbanColumn | Coluna de kanban com drag-and-drop | Pipeline |
| CheckItem | Checkbox com label, badge de tipo, persistencia | Setup |
| SearchBar | Input de busca com icone e debounce | Agentes, Comandos, Diagnostico |
| Badge | Badge com variantes de cor por tipo | Toda a UI |
| EmptyState | Estado vazio elegante com mensagem orientadora | Quando nao ha dados |

---

## 8. Seccoes detalhadas

### 8.1 Agentes

**Heranca:** AIOX Mastery Dashboard (95% da logica)

**Layout:** Grid de cards (3 colunas em desktop, 2 em tablet, 1 em mobile)

**Card de agente (colapsado):**
- Icon + nome + role
- Badge com numero de comandos
- Indicador de categoria (core/specialist/squad)

**Card de agente (expandido):**
- Descricao completa
- Lista de comandos agrupados por categoria
- Cada comando: `@agent *command` com botao copy
- Link para documentacao (se existir)

**Busca:** Filtra agentes por nome, role, ou qualquer comando. Resultados em tempo real com highlight.

**Dados:** 24 agentes, ~185 comandos (extraidos dos ficheiros de agentes)

### 8.2 Pipeline

**Heranca:** Monster Dashboard (kanban) + AI Velocity (fases)

**Vista dupla:**
1. **Pipeline Visual** — 6 fases horizontais com linhas de conexao e estado por fase
2. **Kanban Board** — 5 colunas verticais para tracking de items individuais

**Fases do pipeline:**

| Fase | Nome | Comando associado | Agente |
|------|------|--------------------|--------|
| 1 | Profiling | `@analyst *research` | @analyst |
| 2 | PRD | `@pm *create-prd` | @pm |
| 3 | Architecture | `@architect *create-doc architecture` | @architect |
| 4 | Stories | `@sm *draft` | @sm |
| 5 | Development | `@dev *develop` | @dev |
| 6 | Deploy | `@devops *push` | @devops |

**Persistencia:** localStorage guarda o estado de cada fase e items do kanban.

### 8.3 Arena

**Heranca:** Agent Arena (canvas + event log)

**Canvas:** Fundo escuro com grid subtil. Agentes representados como sprites pixel art. Movimento autonomo baseado em "actividade" simulada (nao dados reais nesta versao — declarado explicitamente como visualizacao, nao telemetria).

**Command Dispatch:**
1. Dropdown para seleccionar agente (lista completa)
2. Input para escrever comando
3. Botao "Dispatch" que copia `@{agent} *{command}` para clipboard
4. Feedback visual: "Comando copiado" com animacao

**Event Log:** Lista scrollavel de eventos. Cada entrada com timestamp, agente, accao, cor por tipo.

**Stats:** 4 contadores no topo: DONE, FAIL, SENT, TIME — contam actividade da sessao actual.

### 8.4 Setup

**Heranca:** Cockpit (90% da logica)

**5 Fases:**

| Fase | Titulo | Items |
|------|--------|-------|
| 01 | Conta e acesso | Criar conta, aceder ao dashboard, etc. |
| 02 | Ferramentas base | VS Code, Node.js, Git, etc. |
| 03 | Claude Code | Instalar, configurar, testar |
| 04 | Framework AIOX | Instalar AIOX, configurar core-config, etc. |
| 05 | Verificacao | Readiness check de todos os passos anteriores |

**Sidebar:** Lista de fases com indicador de progresso (done/current/next).

**Readiness Grid:** Grid 3x4 com categorias (Conta, Ferramentas, Claude, AIOX) x estado (OK/Warning/Error).

**Persistencia:** localStorage com chave `control-center-setup-v2`.

### 8.5 Comandos

**Heranca:** Control Center V1

**Layout:** Lista vertical pesquisavel com categorias colapsaveis.

**Categorias:**
- Core (help, exit, guide, yolo)
- Development (develop, commit, branch)
- Testing (qa-gate, qa-loop, review)
- Product (create-prd, create-epic, draft)
- Deployment (push, release)
- Analysis (research, audit)

**Cada comando:**
```
@agent *command {args}
Descricao: O que este comando faz
Exemplo: @dev *develop 2.1
[COPIAR]
```

### 8.6 Diagnostico

**Heranca:** Control Center V1

**10 problemas iniciais:**

| # | Problema | Categoria |
|---|----------|-----------|
| 1 | Claude Code nao reconhece agentes | Configuracao |
| 2 | Erro ao instalar AIOX | Instalacao |
| 3 | Agente nao responde a comandos | Execucao |
| 4 | Stories nao encontradas | Configuracao |
| 5 | Build falha | Execucao |
| 6 | Push bloqueado (permissao) | Permissoes |
| 7 | QA Loop nao termina | Execucao |
| 8 | CodeRabbit nao encontrado | Instalacao |
| 9 | Supabase connection failed | Rede |
| 10 | Core-config invalido | Configuracao |

Cada problema: titulo, descricao, passos de resolucao com command blocks copiaveis.

### 8.7 Missoes

**Heranca:** Control Center V1 + AI Velocity

**6 missoes iniciais:**

| # | Missao | Passos | Tempo est. |
|---|--------|--------|------------|
| 1 | Setup completo | 12 | 45 min |
| 2 | Primeiro projecto | 8 | 30 min |
| 3 | Pipeline do zero ao deploy | 10 | 60 min |
| 4 | Criar um PRD | 6 | 20 min |
| 5 | Desenvolver uma story | 8 | 40 min |
| 6 | QA e push | 5 | 15 min |

Cada missao: titulo, objectivo, agentes envolvidos, passos sequenciais com command blocks, barra de progresso, persistencia em localStorage.

---

## 9. Criterios de sucesso

### 9.1 Criterios de lancamento (MVP)

| Criterio | Verificacao |
|----------|------------|
| Todas as 7 seccoes funcionais | QA manual em cada seccao |
| Design system 100% conforme | Visual review contra design-system-visual.vercel.app |
| Zero dados inventados | Review de todos os dados embebidos |
| Copy-to-clipboard funcional em todos os comandos | Teste em Chrome, Firefox, Safari |
| Responsive (desktop + tablet + mobile) | Teste em 3 breakpoints |
| localStorage persistencia funcional | Teste de refresh + reopen |
| Ficheiro < 500KB | Verificacao de tamanho |
| Carregamento < 2 segundos | Lighthouse |
| PT-PT correcto em toda a interface | Review linguistico |

### 9.2 Criterios de adopcao (90 dias)

| Criterio | Meta |
|----------|------|
| Membros activos semanais | 40%+ |
| Comandos copiados por sessao | 3+ |
| Setup completeness medio | 60%+ |
| NPS da ferramenta | 8+ |

---

## 10. Fases de implementacao

### Fase 1 — Fundacao (Epic 1)

**Objectivo:** Estrutura base com as 3 seccoes mais valiosas.

| Story | Descricao | Prioridade |
|-------|-----------|------------|
| 1.1 | Estrutura HTML base com router SPA e sidebar | MUST |
| 1.2 | Design system CSS completo (tokens, componentes) | MUST |
| 1.3 | Script gerador de dados (agents -> JSON) | MUST |
| 1.4 | Seccao Agentes (cards, busca, copy) | MUST |
| 1.5 | Seccao Comandos (biblioteca pesquisavel) | MUST |
| 1.6 | Seccao Setup (fases, checkboxes, persistencia) | MUST |
| 1.7 | Command Palette (Ctrl+K) | SHOULD |
| 1.8 | Testes e QA da Fase 1 | MUST |

**Entrega:** Control Center funcional com Agentes + Comandos + Setup.

### Fase 2 — Pipeline e missoes (Epic 2)

**Objectivo:** Tracking de progresso e workflows guiados.

| Story | Descricao | Prioridade |
|-------|-----------|------------|
| 2.1 | Seccao Pipeline — vista visual de 6 fases | MUST |
| 2.2 | Seccao Pipeline — kanban board com drag-and-drop | SHOULD |
| 2.3 | Seccao Missoes — 6 missoes com passos e progresso | MUST |
| 2.4 | Seccao Diagnostico — 10 problemas com solucoes | MUST |
| 2.5 | Testes e QA da Fase 2 | MUST |

**Entrega:** Control Center completo com todas as 6 seccoes core.

### Fase 3 — Arena e polish (Epic 3)

**Objectivo:** Visualizacao animada e refinamentos.

| Story | Descricao | Prioridade |
|-------|-----------|------------|
| 3.1 | Seccao Arena — canvas animado com agentes pixel art | COULD |
| 3.2 | Seccao Arena — command dispatch + event log | COULD |
| 3.3 | Responsive refinements (tablet + mobile) | SHOULD |
| 3.4 | Acessibilidade (keyboard navigation, ARIA) | SHOULD |
| 3.5 | Performance optimization (target < 2s load) | MUST |
| 3.6 | Testes finais e lancamento | MUST |

**Entrega:** Control Center V2 completo com Arena.

### Fase 4 — Evolucao (pos-lancamento)

| Funcionalidade | Descricao | Condicao |
|----------------|-----------|----------|
| Supabase sync | Sincronizar progresso entre dispositivos | Quando ha massa critica de utilizadores |
| Telemetria real | Arena com dados reais de execucao de agentes | Quando o pipeline emitir eventos |
| Temas | Opcao de temas adicionais (mantendo dark base) | Se pedido pela comunidade |
| Multilingual | Suporte EN (improvavel, mas possivel) | Se a comunidade expandir |

---

## 11. Riscos e mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Ficheiro HTML demasiado grande | Media | Alto | Minificar CSS/JS; dados em bloco separado lazy-loaded |
| Arena afecta performance | Alta | Medio | Arena desactivada por defeito; activar via toggle |
| Dados de agentes desactualizados | Alta | Alto | Script gerador como pre-requisito de cada release |
| Membros nao encontram o Control Center | Media | Alto | Link proeminente no dashboard da comunidade + onboarding |
| localStorage perdido ao limpar browser | Media | Baixo | Estado vazio elegante; opcao de export/import de progresso |
| Copy-to-clipboard falha em browsers antigos | Baixa | Medio | Fallback com seleccao de texto |

---

## 12. Fora de escopo (explicitamente excluido)

| Item | Razao |
|------|-------|
| Admin panel para Eurico | Ferramenta separada — nao misturar com experiencia do membro |
| Autenticacao / login | ZERO gates — acessivel a todos sem login |
| Integracao real-time com terminal | Fase 4+; complexidade desproporcional ao valor |
| Dados de outros membros (social) | Privacy first; cada membro ve apenas o seu progresso |
| Gamificacao (pontos, badges, leaderboards) | Descartada por decisao do Eurico |
| Backend API | Standalone HTML — sem servidor |
| Chat integrado | Ja existe Chat Eurico separado |

---

## 13. Glossario

| Termo | Definicao |
|-------|-----------|
| Control Center | Ferramenta unificada de gestao do ecossistema AIOX |
| Agente | Entidade autonoma do AIOX com persona, comandos e autoridade |
| Pipeline | Sequencia de fases do zero ao deploy |
| Arena | Visualizacao animada de agentes em actividade |
| Missao | Workflow guiado com passos sequenciais |
| Command Block | Bloco de codigo copiavel com um clique |
| Readiness Check | Verificacao do estado de preparacao do setup |

---

## 14. Proximos passos

### Para @architect (Aria)

Utilizar este PRD para criar a arquitectura detalhada. Foco em:
1. Estrutura interna do ficheiro HTML (modulos logicos)
2. Router SPA com hash-based navigation
3. Canvas API para Arena
4. Sistema de componentes reutilizaveis em vanilla JS
5. Estrategia de lazy-loading para o bloco DATA

### Para @ux-design-expert (Uma)

Utilizar este PRD para definir:
1. Wireframes das 7 seccoes
2. Componentes visuais reutilizaveis
3. Responsive breakpoints
4. Micro-interaccoes (copy feedback, expand/collapse, drag-and-drop)
5. Estados vazios elegantes

---

## Checklist Results Report

### Category Statuses

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| 1. Problem Definition and Context | PASS | Problema documentado com 6 ferramentas analisadas |
| 2. MVP Scope Definition | PASS | Fases priorizadas com MoSCoW |
| 3. User Experience Requirements | PASS | 7 seccoes detalhadas com heranca documentada |
| 4. Functional Requirements | PASS | 50 FRs com IDs unicos |
| 5. Non-Functional Requirements | PASS | 13 NFRs cobrindo performance, design, compatibilidade |
| 6. Epic and Story Structure | PASS | 3 epics com stories sequenciais |
| 7. Technical Guidance | PASS | Arquitectura HTML standalone justificada |
| 8. Cross-Functional Requirements | PASS | Dados, persistencia, deploy cobertos |
| 9. Clarity and Communication | PASS | Glossario, riscos, exclusoes documentadas |

### Critical Deficiencies

Nenhuma deficiencia critica identificada.

### Recommendations

1. Priorizar a geracao do script de dados (Story 1.3) antes de qualquer UI
2. Considerar lazy-loading do bloco Arena para manter performance
3. Estabelecer review visual contra design system antes de cada merge

### Final Decision

**READY FOR ARCHITECT** — O PRD esta completo, com requisitos detalhados, arquitectura justificada, e fases priorizadas. Pronto para design arquitectural.
