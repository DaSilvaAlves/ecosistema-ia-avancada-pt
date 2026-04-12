---
task: Ask Chief
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - pedido: pedido em linguagem natural (qualquer domínio)
Saida: |
  - routing: agente seleccionado e justificação
  - resposta: resposta coordenada ao pedido
Checklist:
  - "[ ] Parse user request in natural language"
  - "[ ] Identify domain and required expertise"
  - "[ ] Match to specialist agent in authority matrix"
  - "[ ] Route request to agent or respond directly"
  - "[ ] Coordinate and return response"
---

# *ask

Ponto de entrada universal — recebe qualquer pedido em linguagem natural, determina o agente correcto e coordena a resposta.

## Usage

```
*ask {pedido}
*ask "como faço deploy para produção?"
*ask "preciso de criar uma story para o login com Google"
*ask "qual é a cobertura de testes actual?"
```

## Flow

1. Interpretar pedido em linguagem natural
2. Identificar domínio e expertise necessária
3. Consultar matriz de autoridade para seleccionar agente
4. Encaminhar para agente especialista ou responder directamente
5. Coordenar resposta final ao utilizador

## Output

Resposta coordenada ao pedido com identificação do agente responsável, comando sugerido para executar a acção e contexto adicional relevante.
