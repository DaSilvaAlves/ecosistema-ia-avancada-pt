---
task: Trace Requirement
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - requirement_id: string — identificador do requisito (ex: FR-001, NFR-003, CON-002)
Saida: |
  - cadeia: PRD → story → task → code → test — cadeia completa de rastreabilidade do requisito
Checklist:
  - "[ ] Encontrar o requisito no PRD pelo identificador"
  - "[ ] Mapear para a(s) story(s) que implementam o requisito"
  - "[ ] Mapear story para a(s) task(s) AIOX correspondentes"
  - "[ ] Identificar implementação no código (ficheiro, função ou componente)"
  - "[ ] Identificar testes que cobrem o requisito"
---

# *trace-requirement

Traça a cadeia completa de rastreabilidade de um requisito desde o PRD até ao código e testes. Garante visibilidade end-to-end de como cada requisito foi implementado e verificado.

## Usage

```
@aiox-oracle
*trace-requirement

# → solicita requirement_id interactivamente

*trace-requirement FR-001
# → PRD → story 1.1 → task dev-develop-story → packages/feature/index.ts → tests/feature.test.ts

*trace-requirement CON-003
# → traça restrição desde PRD até à implementação que a respeita
```

## Flow

1. Encontra o requisito no PRD pelo identificador exacto (FR-*, NFR-*, CON-*)
2. Mapeia para story(s): pesquisa stories em `docs/stories/` que referenciam o ID
3. Mapeia story para task(s): identifica tasks executadas na story
4. Identifica implementação no código: ficheiro, função ou componente que realiza o requisito
5. Identifica testes: ficheiros de teste que cobrem o comportamento especificado

## Output

```
Requisito: {requirement_id}
Descrição: {texto do requisito no PRD}

Cadeia de Rastreabilidade:
  PRD:    {path do PRD} → linha {N}
  Story:  {story_id} — {story_title} — Status: {status}
  Task:   {task_name} — responsável: @{agent}
  Código: {path_ficheiro}:{linha} — {função ou componente}
  Teste:  {path_teste}:{linha} — {nome do teste}
```
