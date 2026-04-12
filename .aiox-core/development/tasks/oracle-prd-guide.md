---
task: PRD Guide
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - ideia_ou_prd_draft: string — ideia de produto em linguagem natural ou PRD draft incompleto
Saida: |
  - prd_estruturado: markdown — PRD completo com todas as secções AIOX obrigatórias
  - rastreabilidade: FR/NFR/CON mapping — mapeamento de cada requisito com identificador único
Checklist:
  - "[ ] Analisar input para extrair requisitos funcionais, não-funcionais e restrições"
  - "[ ] Estruturar em formato PRD AIOX (Overview, Goals, FR-*, NFR-*, CON-*, Out-of-scope)"
  - "[ ] Gerar identificadores únicos FR-001, NFR-001, CON-001 para cada requisito"
  - "[ ] Garantir rastreabilidade: cada afirmação tem identificador associado"
  - "[ ] Validar que nenhum requisito é inventado — tudo traceable ao input original"
---

# *prd-guide

Transforma uma ideia ou PRD draft incompleto num PRD estruturado AIOX com rastreabilidade completa. Gera identificadores únicos FR-*, NFR-*, CON-* para cada requisito, garantindo que o Constitutional Gate do Spec Pipeline (Artigo IV — No Invention) seja satisfeito.

## Usage

```
@aiox-oracle
*prd-guide

# → solicita ideia ou draft interactivamente

*prd-guide "quero um sistema de notificações para a comunidade"
# → PRD completo com FR-001..FR-N, NFR-001..NFR-N, CON-001..CON-N

*prd-guide {prd_draft_incompleto}
# → PRD melhorado com secções em falta preenchidas e rastreabilidade adicionada
```

## Flow

1. Analisa o input para extrair intenções, funcionalidades desejadas, restrições mencionadas e contexto
2. Estrutura em secções PRD AIOX: Overview, Problem Statement, Goals, Functional Requirements (FR-*), Non-Functional Requirements (NFR-*), Constraints (CON-*), Out-of-Scope
3. Gera identificadores únicos sequenciais para cada requisito (FR-001, FR-002, ...)
4. Constrói mapa de rastreabilidade: identificador → afirmação original no input
5. Valida que nenhum requisito é inventado sem base no input

## Output

PRD markdown completo com:
- Todas as secções obrigatórias AIOX
- Cada requisito com identificador único
- Tabela de rastreabilidade no final: ID → Fonte no input original
