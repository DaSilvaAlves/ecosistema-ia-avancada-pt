---
task: Apply Fix
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - diagnostico_id: string — identificador do diagnóstico gerado por *diagnose (ou descrição do problema já diagnosticado)
Saida: |
  - sequencia_fix: step[] — passos sequenciais para aplicar o fix
  - verificacao: string — comando ou check para confirmar que o fix funcionou
Checklist:
  - "[ ] Load diagnóstico anterior ou re-diagnosticar se ID não encontrado"
  - "[ ] Gerar sequência de passos para aplicar o fix (máximo 5 passos)"
  - "[ ] Cada passo com comando concreto ou acção verificável"
  - "[ ] Verificar fix: comando ou check que confirma resolução"
  - "[ ] Nunca aplicar fixes que violem a authority matrix ou a Constitution"
---

# *fix

Aplica o fix para um problema previamente diagnosticado. Gera uma sequência de passos concretos e termina com um comando de verificação para confirmar que o problema foi resolvido.

## Usage

```
@aiox-resolver
*fix

# → solicita diagnóstico_id ou descrição interactivamente

*fix "config YAML inválida em agents/dev.md"
# → passos para corrigir o YAML + verificação com npm run validate:agents

*fix "story 2.3 sem agente atribuído"
# → passos para atribuir agente e desbloquear story
```

## Flow

1. Carrega diagnóstico anterior pelo ID, ou re-diagnostica se não encontrado
2. Gera sequência de máximo 5 passos para aplicar o fix — cada passo com acção verificável
3. Executa passos sequencialmente (ou lista para execução manual)
4. Após último passo, executa verificação que confirma resolução
5. Reporta resultado: resolvido ou re-diagnosticar

## Output

```
Fix para: {descrição do problema}

Passos:
1. {acção concreta — comando ou ficheiro a editar}
2. {acção concreta}
3. {acção concreta}

Verificação: {comando ou check para confirmar resolução}
Resultado esperado: {o que deve aparecer se fix funcionou}
```
