# Relatório Técnico: Mega Brain

**Sistema de Gestão de Conhecimento por IA**
**Repositório:** `https://github.com/thiagofinch/mega-brain`
**Pacote npm:** `@thiagofinch/mega-brain`
**Versão actual:** 1.4.12
**Data da análise:** 24/03/2026

---

## 1. Visão geral do sistema

### 1.1 O que é

O Mega Brain é um sistema de gestão de conhecimento por IA que transforma materiais de especialistas (vídeos, PDFs, transcrições, podcasts, gravações de reuniões) em playbooks estruturados, esquemas de DNA cognitivo e agentes de IA especializados. O sistema é orquestrado pelo JARVIS (Just A Rather Very Intelligent System) e funciona exclusivamente dentro do Claude Code da Anthropic.

**Autor:** Thiago Finch (thiagofinch)
**Licença:** UNLICENSED (software proprietário)
**Modelo de negócio:** Freemium — versão Community (gratuita) + Premium (MoneyClub, paga)

### 1.2 Arquitectura completa

A arquitectura segue um modelo de 3 camadas (L1/L2/L3) com separação rigorosa:

```
mega-brain/
├── core/               -> Motor de inteligência (Python)
│   ├── intelligence/      -> RAG, pipeline, memória, validação
│   │   ├── rag/           -> 18 módulos (BM25, semântico, grafo, ChromaDB)
│   │   ├── pipeline/      -> 30+ processadores (inbox, bucket, PDF, Read.ai, Fireflies)
│   │   ├── speakers/      -> Diarização de locutores (pyannote.audio)
│   │   ├── entities/      -> Gestão de entidades
│   │   ├── dossier/       -> Geração de dossiês
│   │   ├── roles/         -> Detecção de funções
│   │   ├── export/        -> Exportação de dados
│   │   └── validation/    -> Validação de integridade JSON
│   ├── jarvis/            -> Alma do JARVIS, DNA, criador de agentes
│   ├── schemas/           -> 6 schemas JSON (canonical-map, chunks, insights, etc.)
│   ├── patterns/          -> Padrões arquitecturais reutilizáveis
│   ├── templates/         -> Templates de agentes, debates, logs, fases
│   ├── workflows/         -> 4 workflows YAML (conclave, extract-dna, ingest, pipeline-full)
│   └── tasks/             -> Definições de tarefas
├── agents/             -> Agentes de IA (5 categorias)
├── knowledge/          -> Base de conhecimento (3 buckets)
├── workspace/          -> Centro operacional da empresa
├── artifacts/          -> Outputs do pipeline (chunks, canonical, insights, narratives)
├── .claude/            -> Integração Claude Code (hooks, skills, commands, rules)
├── bin/                -> CLI e instalador (Node.js)
├── tests/              -> Testes Python (14 ficheiros de teste)
├── docs/               -> Documentação, PRDs, planos
├── logs/               -> Registos de sessões
├── system/             -> JARVIS core (alma, DNA)
└── reference/          -> Blueprints de arquitectura
```

### 1.3 Pipeline JARVIS (5 fases)

O processador JARVIS transforma material bruto em conhecimento accionável:

| Fase | Nome | Função |
|------|------|--------|
| 1 | DIVISÃO | Quebra cada material em blocos coerentes de ideias (chunks semânticos) |
| 2 | IDENTIFICAÇÃO | Identifica entidades: quem disse o quê, pessoas, métodos, conceitos |
| 3 | EXTRACÇÃO | Extrai sacadas accionáveis, prioriza por impacto |
| 4 | SÍNTESE | Consolida narrativas por pessoa e por tema |
| 5 | COMPILAÇÃO | Gera dossiês, manuais e distribui habilidades para os agentes certos |

**DNA Cognitivo — 5 camadas de conhecimento extraídas por especialista:**

| Camada | Nome | Descrição |
|--------|------|-----------|
| L1 | PHILOSOPHIES | Crenças fundamentais e visão de mundo |
| L2 | MENTAL-MODELS | Frameworks de pensamento e decisão |
| L3 | HEURISTICS | Regras práticas e atalhos de decisão |
| L4 | FRAMEWORKS | Metodologias estruturadas e processos |
| L5 | METHODOLOGIES | Implementações passo a passo |

### 1.4 Sistema de camadas (L1/L2/L3)

| Camada | Nome | Conteúdo | Distribuição |
|--------|------|----------|-------------|
| L1 | Community | Motor, templates, hooks, skills, CLI, docs | Pacote npm público |
| L2 | Premium | Conhecimento populado, clones, agentes, skills premium | Repo privado GitHub (`mega-brain-premium`) |
| L3 | Personal | Materiais do utilizador, sessões, chaves, dados do negócio | Local (nunca sai da máquina) |

**Garantias de segurança:**
- L3 nunca é commitado em nenhum remote
- L2 nunca entra no pacote npm público
- Pre-publish gates escaneiam por segredos antes de cada publicação
- `.env` e credenciais são auto-excluídos

---

## 2. Recursos da versão Community (Free)

### 2.1 Comandos CLI disponíveis

**Terminal (npx):**

| Comando | Função |
|---------|--------|
| `npx @thiagofinch/mega-brain install [nome]` | Assistente interactivo de instalação |
| `npx @thiagofinch/mega-brain setup` | Configurar chaves de API |
| `npx @thiagofinch/mega-brain upgrade` | Upgrade Community para Premium |
| `npx @thiagofinch/mega-brain update` | Actualizar sistema sem perder dados |
| `npx @thiagofinch/mega-brain status` | Status da licença e edição |
| `npx @thiagofinch/mega-brain features` | Features disponíveis vs bloqueadas |
| `npx @thiagofinch/mega-brain validate <email>` | Revalidar email de membro |
| `mega-brain-push` | Push multi-camada (selecção interactiva) |
| `mega-brain-push --layer 1/2/3` | Push por camada específica |

**Slash commands no Claude Code (50 comandos):**

| Categoria | Comandos |
|-----------|----------|
| Ingestão e processamento | `/ingest`, `/process-jarvis`, `/jarvis-full`, `/process-inbox`, `/process-video`, `/scan-inbox`, `/ingest-empresa`, `/ingest-pessoal`, `/visual-extract` |
| Consulta e decisão | `/conclave`, `/jarvis-briefing`, `/rag-search`, `/deep-research`, `/debate`, `/compare`, `/benchmark` |
| Agentes | `/agents`, `/create-agent`, `/ask`, `/chat` |
| Conhecimento | `/extract-dna`, `/extract-knowledge`, `/view-dna`, `/dossiers` |
| Sistema | `/setup`, `/save`, `/resume`, `/log`, `/verify`, `/config`, `/system-digest` |
| Autonomia | `/jarvis`, `/jarvis-control`, `/loop`, `/loops`, `/mission`, `/mission-autopilot`, `/evolve` |
| GSD (Get Shit Done) | `/gsd/*` (32 workflows: `new-project`, `execute-plan`, `verify-work`, `health`, `progress`, etc.) |
| Drive e docs | `/ler-drive`, `/ler-planilha` |
| GitHub | `/gha` (GitHub Actions) |

### 2.2 Skills incluídas (37 skills activas)

**12 skills core (numeradas 00-11):**

| # | Skill | Função | Prioridade |
|---|-------|--------|------------|
| 00 | SKILL-CREATOR | Criar novas skills | ALTA |
| 01 | DOCS-MEGABRAIN | Documentação Markdown/playbook | ALTA |
| 02 | PYTHON-MEGABRAIN | Scripts Python | ALTA |
| 03 | AGENT-CREATION | Criar novos agentes | ALTA |
| 04 | KNOWLEDGE-EXTRACTION | Extrair insights e chunks | ALTA |
| 05 | PIPELINE-JARVIS | Processar pipeline JARVIS | ALTA |
| 06 | BRAINSTORMING | Sessões de brainstorm | MÉDIA |
| 07 | DISPATCHING-PARALLEL | Despacho paralelo de agentes em batch | ALTA |
| 08 | EXECUTING-PLANS | Executar planos | ALTA |
| 09 | WRITING-PLANS | Escrever e planear | MÉDIA |
| 10 | VERIFICATION-BEFORE-COMPLETION | Verificar antes de concluir | ALTA |
| 11 | USING-SUPERPOWERS | Funcionalidades avançadas | MÉDIA |

**25+ skills domain-specific:** `ask-company`, `chronicler`, `code-review`, `convert-to-company-docs`, `executor`, `fase-2-5-tagging`, `feature-dev`, `gdrive-transcription-downloader`, `gemini-fallback`, `gha`, `github-workflow`, `graph-search`, `hookify`, `hybrid-source-reading`, `jarvis`, `jarvis-briefing`, `ler-planilha`, `memory-search`, `pipeline-jarvis`, `pipeline-mce`, `plugin-dev`, `pr-review-toolkit`, `process-company-inbox`, `python-megabrain`, `read-ai-harvester`, `resume`, `save`, `shared-memory`, `skill-creator-internal`, `skill-writer`, `smart-download-tagger`, `source-sync`, `sync-docs`, `teaching`, `verify`, `verify-6-levels`, `writing-plans`

### 2.3 Hooks (42 hooks em 5 eventos)

| Evento | Qtd | Função principal |
|--------|-----|-----------------|
| **SessionStart** | 4 | Inicialização, indexação de skills, alertas de inbox |
| **UserPromptSubmit** | 7 | Routing de skills, qualidade, memória, modo plano |
| **PreToolUse** | 5 | Protecção de ficheiros, validação de criação, auditoria |
| **PostToolUse** | 11 | Cascateamento, sincronização de agentes, pipeline, memória |
| **Stop** | 6 | Completude, save automático, gestão de memória |

### 2.4 O que funciona sem conteúdo Premium

A versão Community fornece toda a **infraestrutura** mas sem conteúdo pré-carregado:
- Motor JARVIS completo (5 fases) — pronto para processar materiais próprios
- 37 skills + 50 comandos + 42 hooks
- Sistema de agentes (templates vazios)
- RAG com 3 pipelines (BM25, semântico, grafo de conhecimento)
- Sistema do Conselho/Conclave (protocolo de deliberação)
- GSD workflow de execução
- Templates e protocolos de criação de agentes

---

## 3. Recursos exclusivos Premium

### 3.1 O que NÃO funciona na versão Free

| Recurso | Detalhe |
|---------|---------|
| Mentes Clonadas | DNA Cognitivo de 15+ especialistas já extraído |
| Agentes operacionais | 4 directores + equipa de vendas com DNA híbrido carregado |
| Conteúdo processado | +$500 mil dólares em conteúdo pago já processado |
| 47+ métodos | Métodos accionáveis de 15+ especialistas |
| Manuais práticos | Manuais passo a passo documentados |
| Mapa de conhecimento | 600+ nós e 2.600+ conexões |
| Dossiês por especialista | Compilações completas |
| DNAs híbridos | Pré-configurados por cargo |
| 14 skills premium | Skills adicionais exclusivas |

### 3.2 Especialistas clonados (confirmados)

| ID | Especialista | Área |
|----|-------------|------|
| `alex-hormozi` | Alex Hormozi | Receita, ofertas, escalamento |
| `cole-gordon` | Cole Gordon | Vendas, equipa de vendas |
| `jeremy-haynes` | Jeremy Haynes | Tráfego pago, Facebook Ads |
| `jeremy-miner` | Jeremy Miner | NEPQ, vendas consultivas |
| `the-scalable-company` | The Scalable Company | Operações, escalamento |

### 3.3 Validação de acesso

O Premium é validado por email de membro do MoneyClub. O conteúdo Premium é distribuído via repo privado GitHub (`mega-brain-premium`) usando um `PREMIUM_REPO_TOKEN`.

---

## 4. Sistema de agentes

### 4.1 Lista completa de agentes (22+ activos)

**Mind Clones (5) — L2/L3:**

| ID | Área | Bucket |
|----|------|--------|
| `alex-hormozi` | Receita, ofertas, escalamento | external |
| `cole-gordon` | Gestão de equipas de vendas | external |
| `jeremy-haynes` | Tráfego pago, criativos | external |
| `jeremy-miner` | Vendas consultivas (NEPQ) | external |
| `the-scalable-company` | Operações, escalamento | external |

**Conclave / Conselho (3) — L1:**

| ID | Papel |
|----|-------|
| `critico-metodologico` | Auditor de lógica — verifica se argumentos são fundamentados |
| `advogado-do-diabo` | Destruidor de ideias fracas — encontra falhas e contra-argumentos |
| `sintetizador` | Integrador final — junta perspectivas num plano accionável |

**Cargo / Funcionais (14+ activos):**

| Departamento | Agentes |
|-------------|---------|
| **C-Level** | `cro` (Director de Receita), `cfo` (Director Financeiro), `cmo` (Director de Marketing), `coo` (Director de Operações) |
| **Vendas** | `closer`, `bdr` (Prospectador), `sds` (Qualificador), `lns` (Relacionamento), `nepq-specialist`, `sales-coordinator`, `sales-manager`, `sales-lead`, `customer-success`, `setter` |
| **Marketing** | `paid-media-specialist`, `funnel-strategist`, `marketer` |
| **Growth** | `media-buyer` |
| **Conteúdo** | `content-creator` |
| **Design** | `designer` |
| **Tech** | `data-analyst` |
| **HR** | `hr-director` |

**Sistema (4):**

| Agente | Função |
|--------|--------|
| JARVIS | Orquestrador central, alma do sistema |
| Agent-Creator | Criação automática de novos agentes |
| Boardroom | Sala de reuniões (deliberação formal) |
| Dev-Ops / Knowledge-Ops | Operações de sistema e conhecimento |

### 4.2 Como funcionam

1. **Activação:** Via slash commands (`/conclave`, `/create-agent`, etc.) ou routing automático pelo `skill_router.py`
2. **Constitution:** Todos os agentes herdam regras base de `agents/constitution/BASE-CONSTITUTION.md`
3. **DNA Híbrido:** Agentes de cargo carregam DNA combinado de múltiplos especialistas (ex: o Closer carrega DNA do Cole Gordon + Jeremy Miner)
4. **Conclave:** Processo de deliberação em 3-4 fases — Directores respondem, Operacionais detalham, Conselho gera recomendação final com grau de confiança
5. **Routing:** O MASTER-AGENT classifica inputs em 5 tipos (A-E) e encaminha para o agente ou conselho adequado
6. **Memória:** Agentes mantêm memória persistente gerida por hooks automáticos

---

## 5. Integrações e dependências

### 5.1 APIs necessárias/opcionais

| Chave | Serviço | Obrigatória? | Função |
|-------|---------|:------------:|--------|
| `OPENAI_API_KEY` | OpenAI (Whisper) | Recomendada | Transcrição de áudio/vídeo |
| `VOYAGE_API_KEY` | Voyage AI | Recomendada | Embeddings semânticos para RAG |
| `ANTHROPIC_API_KEY` | Anthropic | Não (incluído no Claude Code) | Automações avançadas |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth | Não | Importação do Google Drive |
| `ELEVENLABS_API_KEY` | ElevenLabs | Não | Text-to-Speech (voz do JARVIS) |
| `DEEPGRAM_API_KEY` | Deepgram | Não | Speech-to-Text (diarização) |
| `VAPI_API_KEY` | VAPI | Não | Plataforma de voz IA |
| `ASSEMBLYAI_API_KEY` | AssemblyAI | Não | Diarização de locutores (cloud) |
| `N8N_API_URL/KEY` | n8n | Não | Automação de workflows |
| `CLICKUP_PERSONAL_TOKEN` | ClickUp | Não | Gestão de projectos |
| `MIRO_TOKEN` | Miro | Não | Quadros brancos colaborativos |
| `FIGMA_API_KEY` | Figma | Não | Design |
| `NOTION_TOKEN` | Notion | Não | Gestão de documentos |
| `SUPABASE_URL/KEYS` | Supabase | Não | Validação de email |

### 5.2 MCP Servers

O Mega Brain define um único MCP server:
- **`mega-brain-knowledge`**: Servidor MCP local que expõe o RAG do Mega Brain via `core/intelligence/rag/mcp_server.py`

### 5.3 Dependências de software

| Dependência | Versão | Obrigatória |
|-------------|--------|:-----------:|
| Claude Code (Max ou Pro) | Última | Sim |
| Node.js | 18+ (v20+ recomendado) | Sim |
| Python | 3.10+ | Sim |
| PyYAML | 6.0+ | Sim (para hooks) |
| pyannote.audio | 3.1.0+ | Não (diarização de locutores) |
| torch/torchaudio | 2.0+ | Não (diarização local) |

---

## 6. Análise técnica

### 6.1 Stack tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **CLI / Instalador** | Node.js (ES Modules), inquirer, chalk, ora |
| **Motor de inteligência** | Python 3.10+ |
| **Pipeline** | Python (30+ módulos: PDF extractor, inbox organizer, bucket router, etc.) |
| **RAG** | Python (BM25 + ChromaDB/vector store + grafo de conhecimento + Voyage AI embeddings) |
| **Diarização** | pyannote.audio + torch (local) ou AssemblyAI/Deepgram (cloud) |
| **Hooks** | Python 3 (stdlib + PyYAML) |
| **Orquestração** | Claude Code (hooks, skills, commands, rules) |
| **CI/CD** | GitHub Actions (9 workflows) |
| **Linting** | Ruff (Python), Biome (JS) |
| **Testes** | pytest com cobertura |
| **Segurança** | gitleaks (detecção de segredos) |

### 6.2 Qualidade do projecto

| Aspecto | Estado | Detalhe |
|---------|--------|---------|
| **Testes** | 14 ficheiros | Cobertura do pipeline Python |
| **CI/CD** | 9 workflows | lint, test, validate, publish, verification |
| **Linting** | Ruff + Biome | Python + JS |
| **Segurança** | gitleaks | Scan de segredos antes de publicação |
| **Documentação** | Extensa | README 1200+ linhas, CLAUDE.md, CONTRIBUTING.md, QUICK-START.md |
| **Validação** | Schemas JSON | 6 schemas + validação de camadas |
| **Hooks** | 42 activos | Protecção automática em 5 eventos |

---

## 7. Potencial de utilização

### 7.1 Casos de uso concretos

| Caso de uso | Descrição |
|------------|-----------|
| **Consultoria automatizada** | Clonar especialistas e obter pareceres cruzados via Conclave |
| **Equipa de vendas virtual** | 9 agentes de vendas com DNA de experts |
| **Direcção estratégica** | 4 directores C-Level para deliberações de negócio |
| **Gestão de conhecimento corporativo** | Extrair métodos implícitos de reuniões e manuais |
| **Análise de decisão** | Conclave com 11 agentes debatendo com grau de confiança |
| **Capacitação de equipas** | Transformar cursos em agentes operacionais reutilizáveis |
| **Content pipeline** | Agentes de conteúdo e publicação a partir de conhecimento clonado |

### 7.2 Limitações conhecidas

| Limitação | Detalhe |
|----------|---------|
| **Dependência do Claude Code** | Requer assinatura Max ou Pro — não funciona com outros LLMs |
| **Versão Community vazia** | Sem Premium, investir meses a alimentar o sistema |
| **Complexidade de setup** | Node.js 18+, Python 3.10+, potencialmente 10+ chaves de API |
| **Diarização pesada** | pyannote.audio + torch requerem GPU ou fallback para APIs cloud |
| **Sem licença open-source** | Software proprietário |
| **Conteúdo Premium lock-in** | DNA de especialistas no repo privado |

### 7.3 Curva de aprendizagem

| Fase | Tempo estimado | O que se aprende |
|------|---------------|-----------------|
| Instalação e setup | 30-60 minutos | CLI, chaves de API, estrutura |
| Primeira ingestão | 5-15 minutos | `/ingest` + `/process-jarvis` |
| Domínio dos comandos básicos | 1-2 dias | 10 comandos principais |
| Alimentação significativa | 2-4 semanas | 30-50 conteúdos processados |
| Domínio completo | 1-3 meses | 37 skills, GSD workflows, agentes personalizados |

---

## 8. Resumo executivo

O Mega Brain é um sistema sofisticado de gestão de conhecimento por IA, construído sobre o Claude Code da Anthropic. Os seus pontos fortes residem na arquitectura de 3 camadas, no pipeline JARVIS de 5 fases, no sistema RAG triplo (BM25 + semântico + grafo) e no ecossistema de 42 hooks que protegem a integridade automaticamente.

O modelo freemium é claro: a versão Community entrega a infraestrutura completa (motor, hooks, skills, comandos), enquanto o Premium entrega o "cérebro ligado" — DNA de especialistas já extraído, agentes com conhecimento carregado, e meses de vantagem competitiva.

A principal dependência é o Claude Code (Max/Pro), o que cria um lock-in na Anthropic. A versão actual é a 1.4.12, com desenvolvimento activo.

---

*Relatório gerado em 24/03/2026 por Morgan (PM) — Synkra AIOX*
