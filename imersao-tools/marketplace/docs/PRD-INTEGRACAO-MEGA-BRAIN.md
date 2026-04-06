# PRD — Integração Mega Brain no Ecosistema [IA]AVANÇADA PT

**Status:** APROVADO — Eurico autorizou instalação 26/03/2026
**Data:** 26/03/2026
**Autor:** Atlas (@analyst)
**Versão:** 1.1.0

---

## 1. Contexto e motivação

O Mega Brain (`@thiagofinch/mega-brain` v1.4.12) é um sistema de gestão de conhecimento com IA adquirido pelo Eurico. Actualmente instalado em `C:\Users\XPS\mega-brain\`, fora do repositório principal.

### Decisões já tomadas (25-26/03/2026)

| Decisão | Estado | Referência |
|---------|--------|------------|
| Mega Brain é ferramenta **interna** — membros nunca sabem que existe | APROVADA | HANDOFF_25032026_CLONE_REPACKAGE.md |
| Clones entregues como `.claude/agents/{name}.md` — zero dependência do Mega Brain | APROVADA | HANDOFF_25032026_CLONE_REPACKAGE.md |
| 3 sistemas complementares: AIOX + Mega Brain + AI Marketing Suite | APROVADA | HANDOFF_25032026_SQUADMARKET_PIVOT.md |
| Clone Hormozi validado 9/10, pronto para produção | APROVADA | HANDOFF_25032026_CLONE_VALIDADO_MARKETPLACE.md |

### Problema actual

O Mega Brain vive **fora** deste repositório. Isto causa:

1. **Fragmentação** — dois terminais, dois contextos, sem orquestração unificada
2. **Sem automatização** — o pipeline de clonagem é manual (abrir Mega Brain → ingerir → processar → copiar output)
3. **Sem rastreabilidade** — não há registo no AIOX de quando/como um clone foi gerado
4. **Risco de perda** — material processado fora do repositório principal

---

## 2. Objectivo

Integrar o Mega Brain **dentro** deste repositório como ferramenta interna de desenvolvimento, mantendo-o **invisível** para membros, e automatizar o pipeline de clonagem via AIOX.

### Modelo de negócio aprovado

O Mega Brain é uma **ferramenta de produção**, não um produto. O modelo é:

```
Mega Brain (ferramenta interna) → cria → Produtos originais (ferramentas AIOX para a comunidade)
```

**Regra fundamental:** Não podemos vender o Mega Brain (não é nosso). Podemos vender **tudo o que criamos com ele** — clones adaptados PT, playbooks, ferramentas, workflows originais.

Isto é análogo a uma fábrica: não vendemos a máquina, vendemos o que a máquina produz.

---

## 3. O que o Mega Brain traz

### 3.1 Pipeline de processamento (JARVIS)

| Fase | O que faz | Output |
|------|-----------|--------|
| 1. Ingest | Transcreve vídeos, processa PDFs, áudios, documentos | Ficheiros chunked |
| 2. Process | Extrai entidades, frameworks, insights, modelos mentais | Dados estruturados |
| 3. Enrich | Distribui conhecimento para bases de agentes | Knowledge base actualizada |
| 4. Validate | Verificação de qualidade e integridade | Relatório de validação |
| 5. Generate | Compila dossiers, playbooks, agentes | Agentes + playbooks finais |

### 3.2 DNA cognitivo em 5 camadas

| Camada | Conteúdo | Exemplo (Hormozi) |
|--------|----------|-------------------|
| L1 Filosofias | Crenças fundamentais | "O sucesso pára onde não sabes fazer algo" |
| L2 Modelos mentais | Frameworks de pensamento | Highway Bottleneck, Pottery Class |
| L3 Heurísticas | Regras práticas de decisão | Regra dos 20%, Contar em Centenas |
| L4 Frameworks | Metodologias de análise | Mosy 6, VSSL, AD FOCUS |
| L5 Metodologias | Processos passo-a-passo | Mosy 6 Diagnostic, Cash Flow Acceleration |

### 3.3 Sistema de agentes (33 planeados)

| Camada | Tipo | Quantidade | Propósito |
|--------|------|------------|-----------|
| L0 System | Orquestradores | 6 | JARVIS, agent-creator, benchmark, critic, evolver |
| L1 Conclave | Deliberação | 3 | Crítico, advogado do diabo, sintetizador |
| L2 Boardroom | Estratégia C-Level | Auto | CFO, CMO, CRO, COO (debate threshold >= 10) |
| L3 Minds | Clones de mentes | 5 | Hormozi, Cole Gordon, Jeremy Miner, etc. |
| L4 Cargo | Funções operacionais | 14+ | Closer, SDR, BDR, Sales Manager, etc. |

### 3.4 Funcionalidades únicas

| Funcionalidade | Descrição | Valor para o projecto |
|----------------|-----------|----------------------|
| Conclave | Debates multi-perspectiva entre 3 agentes | Decisões estratégicas informadas |
| RAG | Pesquisa semântica sobre toda a knowledge base | Respostas fundamentadas em fontes |
| Incremental processing | Processa apenas ficheiros novos | Eficiência operacional |
| Autonomous processor | Pipeline autónomo com queue, retry, checkpoint | Produção em escala |

---

## 4. Arquitectura de integração proposta

### 4.1 Modelo: submódulo interno

```
ecosistema-ia-avancada-pt/
├── mega-brain/                    # Copiado para dentro do repo
│   ├── core/                      # Motor de processamento (Python)
│   ├── agents/                    # Definições de agentes MB
│   ├── knowledge/                 # Base de conhecimento
│   ├── processing/                # Queue de processamento
│   ├── artifacts/                 # Outputs do pipeline
│   └── ...
├── imersao-tools/
│   └── marketplace/
│       └── docs/
│           ├── PRD-CLONE-*.md     # PRDs dos clones (output do pipeline)
│           └── ...
├── .claude/
│   └── agents/
│       └── alex-hormozi.md        # Clone final (entregue ao membro)
└── ...
```

### 4.2 Fronteira clara

| Camada | O que é | Quem vê |
|--------|---------|---------|
| `mega-brain/` | Motor interno de clonagem | Apenas equipa de desenvolvimento |
| `.claude/agents/{clone}.md` | Produto final (clone empacotado) | Membro (via ZIP download) |
| `imersao-tools/marketplace/` | Vitrine e PRDs | Membro (via comunidade) |

### 4.3 Fluxo automatizado proposto

```
1. Eurico decide nova mente a clonar
   ↓
2. @analyst recolhe material (vídeos, PDFs, transcrições)
   ↓
3. Material colocado em mega-brain/knowledge/external/inbox/{expert}/
   ↓
4. @dev executa pipeline JARVIS (ingest → process → enrich → validate → generate)
   ↓
5. Output: mega-brain/agents/external/{expert}/ (AGENT.md + SOUL.md + MEMORY.md + DNA/)
   ↓
6. @dev empacota como .claude/agents/{expert}.md (formato unificado)
   ↓
7. @qa valida clone (teste de qualidade como Hormozi 9/10)
   ↓
8. @pm cria PRD-CLONE-{EXPERT}.md
   ↓
9. @dev integra na página de detalhe do marketplace
   ↓
10. @devops push → disponível na comunidade
```

---

## 5. Complementaridade AIOX + Mega Brain

### 5.1 Onde NÃO se sobrepõem

| Domínio | AIOX | Mega Brain |
|---------|------|------------|
| Desenvolvimento de software | Sim (SDC, stories, QA) | Não |
| Clonagem de mentes | Não | Sim (pipeline JARVIS) |
| Knowledge management | Não | Sim (RAG, dossiers, DNA) |
| Debates estratégicos | Não | Sim (Conclave, Boardroom) |
| CI/CD, git, deploy | Sim (@devops) | Não |
| Design system | Sim (design-chief squad) | Não |

### 5.2 Onde se complementam

| Cenário | AIOX faz | Mega Brain faz |
|---------|----------|----------------|
| Novo clone para marketplace | Orquestra workflow (story, QA, deploy) | Processa material, extrai DNA, gera agente |
| Decisão estratégica de produto | @pm + @architect decidem | Conclave debate multi-perspectiva para informar decisão |
| Formação para membros | Pipeline pedagógico (6 passos) | Pode gerar playbooks personalizados por perfil |
| Análise de mercado | @analyst pesquisa | Knowledge base + RAG para fundamentar com fontes |

### 5.3 Agentes que NÃO se sobrepõem

| Mega Brain (exclusivos) | AIOX (exclusivos) |
|-------------------------|-------------------|
| JARVIS (orquestrador de conhecimento) | @dev (implementação de código) |
| Conclave (3 debatedores) | @sm (criação de stories) |
| Mind clones (Hormozi, Cole, etc.) | @po (validação de stories) |
| Cargo (CFO, CRO, Closer, SDR) | @devops (CI/CD, git push) |
| Pipeline-Master (processamento) | @data-engineer (schema, DB) |

---

## 6. Dependências técnicas

### 6.1 Requisitos do Mega Brain

| Requisito | Detalhe | Estado actual |
|-----------|---------|---------------|
| Python 3.10+ | Motor de processamento | Verificar instalação |
| PyYAML | Parsing de configuração | pip install |
| Node.js >= 18 | CLI e orquestração | Já instalado (AIOX) |
| OPENAI_API_KEY | Whisper (transcrição de vídeo/áudio) | Opcional — só se ingerir vídeo |
| VOYAGE_API_KEY | Embeddings semânticos (RAG) | Opcional — só se utilizar RAG |
| GOOGLE_CLIENT_ID | Import do Google Drive | Opcional |

### 6.2 Impacto no repositório

| Aspecto | Impacto | Mitigação |
|---------|---------|-----------|
| Tamanho do repo | +~50MB (core + agents + knowledge) | `.gitignore` para `.data/`, `logs/`, `processing/` |
| Complexidade | Novo subsistema a manter | Documentação clara + PRD |
| Dependências Python | Stack adicional | Isolado em `mega-brain/` — não afecta resto do projecto |
| API keys | Custos adicionais | Opcionais — pipeline base funciona sem elas |

---

## 7. Potencial além da clonagem

### 7.1 Para o projecto interno

| Utilização | Descrição | Prioridade |
|------------|-----------|------------|
| Geração de clones para marketplace | Pipeline automatizado de novos produtos | P0 |
| Conclave para decisões estratégicas | Debate multi-agente antes de decisões críticas | P1 |
| Knowledge base da comunidade | Centralizar todo o conhecimento do ecosistema | P2 |
| Playbooks personalizados | Gerar guias operacionais por perfil de membro | P2 |
| RAG sobre formações | Pesquisa semântica sobre todo o conteúdo das 8 formações | P3 |

### 7.2 Para membros (futuro — requer decisão)

| Utilização | Descrição | Decisão necessária |
|------------|-----------|-------------------|
| Membros criam os seus próprios clones | Mega Brain como ferramenta da comunidade | Eurico decide se expõe ou mantém interno |
| Playbooks personalizados por negócio | Pipeline gera guia adaptado ao negócio do membro | Requer formação + suporte |
| Conclave como serviço | Membros fazem perguntas e 3 agentes debatem | Produto premium potencial |

---

## 8. Plano de execução

### Fase 1 — Instalação (P0)

| Passo | Responsável | Detalhe |
|-------|-------------|---------|
| 1.1 | @dev | Copiar `mega-brain/` para dentro do repo |
| 1.2 | @dev | Configurar `.gitignore` (excluir `.data/`, `logs/`, ficheiros pessoais) |
| 1.3 | @dev | Verificar dependências Python |
| 1.4 | @dev | Testar pipeline JARVIS dentro do novo path |
| 1.5 | @devops | Commit + push da integração |

### Fase 2 — Automatização (P1)

| Passo | Responsável | Detalhe |
|-------|-------------|---------|
| 2.1 | @architect | Definir interface AIOX ↔ Mega Brain |
| 2.2 | @dev | Criar workflow AIOX `clone-pipeline` |
| 2.3 | @dev | Script de empacotamento: output MB → `.claude/agents/{name}.md` |
| 2.4 | @qa | Checklist de validação de clones (baseado no teste Hormozi 9/10) |

### Fase 3 — Produção (P2)

| Passo | Responsável | Detalhe |
|-------|-------------|---------|
| 3.1 | Eurico | Definir próximas 3 mentes a clonar |
| 3.2 | @analyst | Recolher material de cada mente |
| 3.3 | @dev | Executar pipeline para cada clone |
| 3.4 | @pm | Criar PRD-CLONE-{EXPERT}.md para cada |
| 3.5 | @dev | Integrar no marketplace |

---

## 9. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Mega Brain referenciado em material do membro | Média | Alto | Rule obrigatória + review em todo copy |
| Pipeline falha com material novo | Baixa | Médio | Testes por mente + checkpoint/retry |
| Custo de API keys escala | Baixa | Baixo | Keys são opcionais; pipeline base funciona sem elas |
| Conflito de hooks MB vs AIOX | Média | Médio | Hooks MB desactivados no contexto AIOX |
| Tamanho do repo cresce excessivamente | Baixa | Baixo | `.gitignore` agressivo para dados processados |

---

## 10. Métricas de sucesso

| Métrica | Meta |
|---------|------|
| Tempo de clonagem (material → clone validado) | < 2 horas por mente |
| Qualidade do clone (teste estruturado) | >= 8/10 |
| Clones disponíveis no marketplace | >= 4 até final de Abril 2026 |
| Zero referências ao Mega Brain em material do membro | 0 ocorrências |

---

## 11. Decisões pendentes do Eurico

| Decisão | Impacto | Urgência | Estado |
|---------|---------|----------|--------|
| ~~Aprovar instalação do Mega Brain dentro do repo~~ | ~~Bloqueia Fase 1~~ | ~~P0~~ | APROVADA 26/03/2026 |
| ~~Manter interno vs abrir para membros~~ | ~~Define roadmap~~ | ~~P2~~ | DECIDIDO — interno, vendemos outputs |
| Próximas 3 mentes a clonar | Bloqueia Fase 3 | P1 | PENDENTE |
| Preço do clone Hormozi | Bloqueia venda | P0 | PENDENTE |
| Investir em API keys (OpenAI, Voyage) | Afecta capacidades do pipeline | P1 | PENDENTE |

---

## Referências

| Documento | Path |
|-----------|------|
| Relatório técnico Mega Brain | `imersao-tools/docs/RELATORIO-MEGA-BRAIN.md` |
| Pivot SquadMarket | `HANDOFF_25032026_SQUADMARKET_PIVOT.md` |
| Repackage clones | `HANDOFF_25032026_CLONE_REPACKAGE.md` |
| Validação Hormozi | `HANDOFF_25032026_CLONE_VALIDADO_MARKETPLACE.md` |
| PRD Marketplace | `imersao-tools/marketplace/docs/PRD-MARKETPLACE.md` |
| PRD Clone Hormozi | `imersao-tools/marketplace/docs/PRD-CLONE-HORMOZI.md` |
| Design system | `.claude/rules/design-system-ia-avancada.md` |

---

*PRD criado por Atlas (@analyst) — 26/03/2026*
*Aguarda aprovação do Eurico para avançar com Fase 1*
