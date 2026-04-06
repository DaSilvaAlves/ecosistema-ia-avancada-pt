# Arquitectura de integração AIOX ↔ Mega Brain

**Autor:** Aria (@architect)
**Data:** 26/03/2026
**Versão:** 1.0.0
**Status:** DRAFT — validar com @dev antes de implementar

---

## 1. Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│                    AIOX (Orquestrador)                       │
│                                                             │
│  @pm decide    @sm cria     @dev executa    @qa valida      │
│  nova mente    story        pipeline        clone           │
│      │            │             │               │           │
│      ▼            ▼             ▼               ▼           │
│  PRD-CLONE    story.md    clone-pipeline    teste 8/10+     │
│                                │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     MEGA BRAIN          │
                    │   (Motor interno)       │
                    │                         │
                    │  inbox/ → JARVIS →      │
                    │  DNA + AGENT + SOUL     │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   OUTPUT EMPACOTADO     │
                    │                         │
                    │  .claude/agents/X.md    │
                    │  + README + SQUAD.md    │
                    │  = ZIP para membro      │
                    └─────────────────────────┘
```

---

## 2. Princípio de separação

| Sistema | Responsabilidade | Nunca faz |
|---------|-----------------|-----------|
| **AIOX** | Orquestra workflow, stories, QA, deploy | Processar materiais, extrair DNA |
| **Mega Brain** | Processa materiais, gera DNA, cria agentes | Gerir stories, fazer push, validar qualidade |
| **Interface** | Traduz comandos AIOX → operações MB | Tomar decisões — apenas executa |

O AIOX **comanda**. O Mega Brain **executa processamento**. A interface **traduz**.

---

## 3. Interface de comunicação

### 3.1 Modelo: ficheiros como API

Não há API REST nem microserviços. A comunicação é via **ficheiros no filesystem** — consistente com o princípio CLI First.

```
AIOX escreve → mega-brain/knowledge/external/inbox/{expert}/
Mega Brain processa → mega-brain/agents/external/{expert}/
AIOX lê ← mega-brain/agents/external/{expert}/AGENT.md
AIOX empacota → .claude/agents/{expert}.md
```

### 3.2 Contrato de entrada (AIOX → Mega Brain)

Para iniciar um clone, o AIOX coloca materiais no inbox:

```
mega-brain/knowledge/external/inbox/{expert-slug}/
├── material-1.pdf
├── material-2.txt
├── transcricao-video.md
└── MANIFEST.yaml          ← Criado pelo AIOX
```

**MANIFEST.yaml** (contrato):

```yaml
manifest:
  expert: "{expert-slug}"
  name: "{Nome Completo}"
  created_by: "@analyst"
  created_at: "2026-03-26T14:00:00Z"
  materials:
    - file: "material-1.pdf"
      type: pdf
      source: "Livro X"
      language: en
    - file: "transcricao-video.md"
      type: transcript
      source: "YouTube — URL"
      language: en
  adaptation:
    target_market: "PT"
    currency: "EUR"
    context: "Microempresas, ENI, mercado de 10M pessoas"
  priority: 1
  status: ready
```

### 3.3 Contrato de saída (Mega Brain → AIOX)

Após processamento, o Mega Brain produz:

```
mega-brain/agents/external/{expert-slug}/
├── AGENT.md              ← Definição completa (11 secções)
├── SOUL.md               ← Identidade e voz
├── MEMORY.md             ← Memória experiencial
└── DNA-CONFIG.yaml       ← Referências de fontes

mega-brain/knowledge/external/dna/persons/{expert-slug}/
├── L1-PHILOSOPHIES.yaml
├── L2-MENTAL-MODELS.yaml
├── L3-HEURISTICS.yaml
├── L4-FRAMEWORKS.yaml
├── L5-METHODOLOGIES.yaml
└── DNA-CONFIG.yaml
```

### 3.4 Contrato de estado

Estado do processamento acompanhado em:

```
mega-brain/.claude/mission-control/
├── QUEUE-STATE.json          ← Fila de processamento
├── AUTONOMOUS-STATE.json     ← Estado do processador
├── AUTONOMOUS-MONITOR.json   ← Métricas em tempo real
└── AUTONOMOUS-CHECKPOINT.json ← Recovery
```

---

## 4. Workflow `clone-pipeline`

### 4.1 Definição do workflow AIOX

```yaml
workflow:
  id: clone-pipeline
  name: "Clone Pipeline — Produção de Clones de Mentes"
  version: "1.0"
  description: >-
    Pipeline completo: recolha de material → processamento JARVIS →
    empacotamento → validação → disponibilização no marketplace.
  type: automation

  triggers:
    - event: command
      command: "*clone-pipeline"
      agent: dev
      action: run_pipeline

  config:
    enabled: true
    maxRetries: 2
    outputDir: .aiox/clone-logs/
    qualityThreshold: 8  # Mínimo 8/10 no teste de qualidade

  sequence:
    # ── Fase 0: Preparação (AIOX) ──
    - id: validate-materials
      phase: 0
      name: "Validar materiais"
      agent: analyst
      action: validate
      description: "Verificar que MANIFEST.yaml existe e materiais estão no inbox"
      creates: [".aiox/clone-logs/{expert}/validation.json"]

    # ── Fase 1: Processamento (Mega Brain) ──
    - id: run-jarvis-pipeline
      phase: 1
      name: "Executar pipeline JARVIS"
      agent: dev
      action: execute
      description: "Executar pipeline de processamento no directório mega-brain/"
      requires: validate-materials
      command: |
        cd mega-brain && python -c "
        from core.intelligence.pipeline.autonomous_processor import AutonomousProcessor
        processor = AutonomousProcessor()
        processor.run()
        "
      creates:
        - "mega-brain/agents/external/{expert}/"
        - "mega-brain/knowledge/external/dna/persons/{expert}/"
      timeout: "30m"

    # ── Fase 2: Adaptação PT (AIOX) ──
    - id: adapt-to-pt
      phase: 2
      name: "Adaptar ao mercado PT"
      agent: dev
      action: create
      description: "Criar camada de adaptação portuguesa sobre o clone base"
      requires: run-jarvis-pipeline
      creates: ["mega-brain/knowledge/external/inbox/{expert}/ADAPTACAO-PT.md"]

    # ── Fase 3: Empacotamento (AIOX) ──
    - id: package-clone
      phase: 3
      name: "Empacotar clone"
      agent: dev
      action: create
      description: "Consolidar output MB em .claude/agents/{expert}.md formato unificado"
      requires: adapt-to-pt
      creates: [".claude/agents/{expert}.md"]

    # ── Fase 4: Validação (AIOX) ──
    - id: validate-clone
      phase: 4
      name: "Validar clone"
      agent: qa
      action: validate
      description: "Teste estruturado: pergunta contextualizada PT, verificação 10 critérios"
      requires: package-clone
      creates: [".aiox/clone-logs/{expert}/qa-result.json"]
      gate:
        threshold: 8
        on_fail: "Retornar a Fase 2 com feedback específico"

    # ── Fase 5: Documentação (AIOX) ──
    - id: create-prd
      phase: 5
      name: "Criar PRD do clone"
      agent: pm
      action: create
      description: "Criar PRD-CLONE-{EXPERT}.md com especificações do produto"
      requires: validate-clone
      creates: ["imersao-tools/marketplace/docs/PRD-CLONE-{EXPERT}.md"]

    # ── Fase 6: Integração marketplace (AIOX) ──
    - id: integrate-marketplace
      phase: 6
      name: "Integrar no marketplace"
      agent: dev
      action: create
      description: "Adicionar clone à página de listagem e criar página de detalhe"
      requires: create-prd
      creates:
        - "imersao-tools/marketplace/pages/clone-{expert}.html"

    # ── Fase 7: Deploy (AIOX) ──
    - id: deploy
      phase: 7
      name: "Deploy"
      agent: devops
      action: execute
      description: "Commit + push + deploy"
      requires: integrate-marketplace
```

### 4.2 Delegação de agentes

| Fase | Agente | Responsabilidade |
|------|--------|-----------------|
| 0 — Validar materiais | @analyst | Verificar completude do MANIFEST.yaml |
| 1 — Pipeline JARVIS | @dev | Executar processamento Python no mega-brain/ |
| 2 — Adaptação PT | @dev | Criar camada de contextualização portuguesa |
| 3 — Empacotamento | @dev | Consolidar em `.claude/agents/{expert}.md` |
| 4 — Validação | @qa | Teste estruturado (mínimo 8/10) |
| 5 — PRD | @pm | Criar documentação de produto |
| 6 — Marketplace | @dev | Integrar na vitrine |
| 7 — Deploy | @devops | Push e deploy |

---

## 5. Script de empacotamento

O passo crítico é consolidar 4 ficheiros MB num único `.claude/agents/{expert}.md`:

```
INPUT:
  mega-brain/agents/external/{expert}/AGENT.md     (definição 11 secções)
  mega-brain/agents/external/{expert}/SOUL.md      (identidade e voz)
  mega-brain/agents/external/{expert}/MEMORY.md    (memória experiencial)
  mega-brain/knowledge/external/dna/persons/{expert}/L1-L5 (DNA 5 camadas)
  mega-brain/knowledge/external/inbox/{expert}/ADAPTACAO-PT.md (contexto PT)

OUTPUT:
  .claude/agents/{expert}.md   (ficheiro único, auto-contido)
```

**Regras de empacotamento:**

| Regra | Detalhe |
|-------|---------|
| Zero referências ao Mega Brain | Nenhuma menção a "Mega Brain", "JARVIS", "pipeline", "inbox" |
| Zero paths internos | Nenhum path como `mega-brain/knowledge/...` |
| Formato `.claude/agents/` | Compatível com activação via `@expert-name` |
| Auto-contido | Toda a informação num único ficheiro markdown |
| Adaptação PT integrada | EUR, mercado PT, canais PT, linguagem PT-PT |

---

## 6. Checklist de validação de clone (QA)

Baseado no teste Hormozi (9/10):

| # | Critério | Peso | Mínimo |
|---|----------|------|--------|
| 1 | Utiliza frameworks reais do expert | 2 | Sim |
| 2 | Valores em EUR | 1 | Sim |
| 3 | Contexto português (mercado, dimensão, canais) | 2 | Sim |
| 4 | Tom directo do expert (sem hype) | 1 | Sim |
| 5 | Conselhos accionáveis com números | 1 | Sim |
| 6 | Tabelas de preços em PT | 1 | Sim |
| 7 | Canais priorizados para PT | 1 | Sim |
| 8 | Anti-patterns para PT identificados | 0,5 | Desejável |
| 9 | Confiança declarada + limitações | 0,5 | Desejável |
| 10 | Zero referências ao Mega Brain | BLOQUEANTE | Obrigatório |

**Threshold:** >= 8/10 para PASS. < 8 retorna à Fase 2.
**Bloqueante:** Critério 10 falha = FAIL imediato, independente da pontuação.

---

## 7. Produtos que a fábrica pode criar

Além de clones de mentes, o Mega Brain pode produzir:

| Produto | Pipeline MB | Output AIOX | Exemplo |
|---------|-------------|-------------|---------|
| **Clone de mente** | extract-dna → agent | `.claude/agents/{expert}.md` | Clone Hormozi |
| **Playbook operacional** | process → dossier → playbook | PDF/HTML na comunidade | "Playbook de Ofertas Irresistíveis" |
| **Conclave como serviço** | /conclave com 3+ agentes | Relatório de debate em markdown | "Devo investir em ads ou SEO?" |
| **Knowledge pack** | process → dossier | Pack de dossiers temáticos | "Pack: Vendas High-Ticket PT" |
| **Formação aumentada** | process → RAG → consulta | Assistente IA por formação | "Assistente da Formação 3" |

Cada um requer o seu próprio sub-workflow no AIOX.

---

## 8. Decisões arquitecturais

| Decisão | Escolha | Alternativa rejeitada | Razão |
|---------|---------|----------------------|-------|
| Comunicação via ficheiros | Filesystem | API REST / WebSocket | CLI First, simplicidade, zero infra adicional |
| MANIFEST.yaml como contrato | YAML | JSON | Consistente com AIOX, legível por humanos |
| Script de empacotamento | Python (reutiliza stack MB) | Node.js | MB já é Python, evita dependência extra |
| Estado em JSON | `.claude/mission-control/` | Base de dados | Consistente com MB existente, zero setup |
| Validação como QA gate AIOX | Workflow step com threshold | Manual | Automatizado, rastreável, repetível |

---

## 9. Riscos e mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Pipeline JARVIS falha com material novo | Média | Médio | Retry 2x + checkpoint + logs detalhados |
| Empacotamento perde informação crítica | Baixa | Alto | Checklist QA obrigatória + teste contextualizado |
| Referência ao Mega Brain escapa para output | Média | Alto | Critério bloqueante na QA + grep automático |
| Adaptação PT superficial | Média | Alto | Template de adaptação obrigatório + validação humana |
| Tempo de processamento > 30min | Baixa | Baixo | Timeout configurável + processamento incremental |

---

## 10. Próximos passos

| Passo | Responsável | Prioridade |
|-------|-------------|------------|
| Validar esta arquitectura com o Eurico | @architect | P0 |
| Criar `MANIFEST.yaml` template | @dev | P1 |
| Criar script de empacotamento Python | @dev | P1 |
| Criar checklist QA formal | @qa | P1 |
| Criar workflow YAML em `.aiox-core/development/workflows/` | @dev | P1 |
| Testar pipeline completo com Hormozi (já validado) | @dev + @qa | P1 |
| Definir próximas mentes (Eurico) | Eurico | P0 |

---

*Arquitectura desenhada por Aria (@architect) — 26/03/2026*
*Validar com @dev antes de implementar*
