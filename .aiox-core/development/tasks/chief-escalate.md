---
task: Escalate
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - problema: descrição do problema a escalar
  - agente_que_tentou: agente que tentou resolver sem sucesso
  - resultado: resultado obtido (o que falhou)
Saida: |
  - rerouting: novo agente seleccionado ou coordenação multi-agente
  - plano: passos para resolução do problema escalado
Checklist:
  - "[ ] Analyze failure context from previous agent"
  - "[ ] Determine alternative agent or multi-agent approach"
  - "[ ] Re-route to appropriate agent"
  - "[ ] Track escalation chain"
  - "[ ] Report outcome and resolution path"
---

# *escalate

Recebe escalação de problema de um agente, analisa o contexto de falha e determina re-routing ou coordenação multi-agente.

## Usage

```
*escalate {problema} {agente_que_tentou} {resultado}
*escalate "deploy a falhar" @aiox-deployer "erro de permissão no Vercel"
```

## Flow

1. Analisar contexto de falha do agente anterior
2. Determinar agente alternativo ou abordagem multi-agente
3. Re-encaminhar para agente adequado
4. Registar cadeia de escalação
5. Reportar plano de resolução

## Output

Re-routing para agente correcto com justificação, ou plano de coordenação multi-agente se necessário. Inclui cadeia de escalação para rastreabilidade e critério de sucesso para a resolução.
