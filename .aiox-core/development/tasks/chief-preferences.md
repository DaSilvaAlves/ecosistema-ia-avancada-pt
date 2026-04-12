---
task: Manage Preferences
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - preferencia: nova preferência a guardar ou "show" para listar preferências actuais
Saida: |
  - preference_saved: preferência guardada com confirmação
  - routing_impact: como a preferência afecta o routing de tarefas futuras
Checklist:
  - "[ ] Parse preference input"
  - "[ ] Validate preference format and scope"
  - "[ ] Save to preferences file"
  - "[ ] Update routing weights accordingly"
  - "[ ] Confirm with impact description"
---

# *preferences

Gere preferências do utilizador para o Chief, afectando routing automático de tarefas futuras.

## Usage

```
*preferences {preferencia}
*preferences show
*preferences "preferir @aiox-tester para code reviews"
*preferences "sempre fazer deploy em staging antes de prod"
```

## Flow

1. Interpretar preferência fornecida
2. Validar formato e scope da preferência
3. Guardar em ficheiro de preferências
4. Actualizar pesos de routing em conformidade
5. Confirmar com descrição de impacto no routing

## Output

Confirmação de preferência guardada com descrição de como afecta o routing automático de tarefas futuras. Para "show": lista de todas as preferências activas com impacto no routing.
