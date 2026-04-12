---
task: Auditor Verify Authority
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (none): Sem input necessário — lê git log e histórico de operações
Saida: |
  - violacoes: Lista de violações de autoridade detectadas
  - agente_infractor: Agente que executou operação fora do seu âmbito
  - accao: Acção correctiva recomendada por violação
Checklist:
  - "[ ] Read git log for push operations by non-devops agents"
  - "[ ] Check PR creation history for unauthorized actors"
  - "[ ] Verify agent boundaries from delegation matrix"
  - "[ ] Cross-check story modifications against agent authority"
  - "[ ] Report violations with agent, operation and timestamp"
---

# *verify-authority

Verifica se todos os agentes operam dentro das suas fronteiras de autoridade definidas na delegation matrix. Detecta operações de push, PR e modificações de story por agentes não autorizados.

## Usage

```
*verify-authority
```

## Flow

1. Ler git log para identificar operações de push
2. Verificar se push foi executado exclusivamente por @devops
3. Verificar histórico de criação de PRs
4. Cruzar modificações de story com regras de autoridade de agentes
5. Identificar agente infractor por operação detectada
6. Produzir lista de violações com timestamp e contexto
7. Recomendar acção correctiva por violação

## Output

Lista de violações de autoridade com agente infractor identificado, operação executada, timestamp e acção correctiva recomendada.
