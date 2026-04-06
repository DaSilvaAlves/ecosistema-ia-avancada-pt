---
task: Why Blocked
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - story_id_ou_workflow_step: string — ID da story ou identificador do passo do workflow bloqueado
Saida: |
  - blocker: string — descrição clara do que está a bloquear
  - dependencia_falhada: string — dependência específica que não foi satisfeita
  - resolucao: string — caminho de resolução com comando concreto
Checklist:
  - "[ ] Identificar o item bloqueado (story ou workflow step)"
  - "[ ] Trace a cadeia de dependências do item"
  - "[ ] Encontrar a dependência falhada ou em falta"
  - "[ ] Propor resolução: completar dependência, substituir, ou escalar"
  - "[ ] Incluir comando concreto para iniciar a resolução"
---

# *why-blocked

Responde à pergunta "porquê está isto bloqueado?" para qualquer story ou passo de workflow. Traça a cadeia de dependências, identifica o que falhou ou está em falta, e propõe o caminho de resolução.

## Usage

```
@aiox-resolver
*why-blocked

# → solicita identificador interactivamente

*why-blocked story-2.3
# → traça dependências de story 2.3, encontra que story 2.1 não está Done

*why-blocked qa-loop-step-3
# → identifica que QA FAIL não foi resolvido pelo @dev antes de re-review
```

## Flow

1. Identifica o item bloqueado: carrega story ou estado do workflow step
2. Traça cadeia de dependências: o que este item precisa para avançar
3. Verifica cada dependência: qual está falhada, qual está em falta, qual tem status errado
4. Propõe resolução: completar a dependência em falta, corrigir o status, ou escalar para `@aiox-resolver *unblock` se complexo
5. Inclui comando concreto para iniciar a resolução

## Output

```
Item bloqueado: {story_id ou workflow_step}
Status actual: {blocked|pending|fail}

Blocker identificado: {descrição clara}
Dependência falhada: {o que deveria estar completo mas não está}

Cadeia de dependências:
  {item} → depende de → {dependência} [Status: {status}]

Resolução:
  {o que fazer para desbloquear}
  Comando: @{agent} *{command} {args}
```
