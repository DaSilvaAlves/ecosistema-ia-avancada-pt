---
task: Trace Error
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - stack_trace: string — stack trace completo do erro (colado directamente da consola ou log)
Saida: |
  - cadeia_causal: string — sequência de eventos que levou ao erro
  - ficheiro_responsavel: string — ficheiro e linha onde o erro originou
  - fix: string — proposta de fix com contexto
Checklist:
  - "[ ] Parse do stack trace para extrair ficheiros, linhas e mensagens"
  - "[ ] Identificar o ponto de origem do erro (primeiro frame relevante)"
  - "[ ] Traçar cadeia causal: o que chamou o quê antes do erro"
  - "[ ] Identificar ficheiro responsável (não o framework, mas o código do projecto)"
  - "[ ] Propor fix baseado no tipo de erro"
---

# *trace-error

Analisa um stack trace e traça a cadeia causal do erro até ao ficheiro e linha de origem. Propõe um fix baseado no tipo e contexto do erro. Distingue erros no código do projecto de erros em dependências externas.

## Usage

```
@aiox-resolver
*trace-error

# → solicita stack trace interactivamente (cole o stack trace completo)

*trace-error {stack_trace_copiado_da_consola}
# → cadeia causal + ficheiro responsável + proposta de fix
```

## Flow

1. Parse do stack trace: extrai ficheiros, números de linha e mensagens de erro
2. Filtra frames relevantes: descarta node_modules e framework interno, foca no código do projecto
3. Identifica ponto de origem: primeiro frame do código do projecto (não dependência)
4. Traça cadeia causal: A chamou B que chamou C que falhou porque X
5. Propõe fix baseado no tipo de erro: null reference, type mismatch, missing file, network, permission

## Output

```
Erro: {tipo e mensagem}

Ficheiro responsável: {path}:{linha}
Função: {nome da função}

Cadeia causal:
  {função A} → {função B} → {função C} → ERRO: {mensagem}

Fix proposto:
  {descrição do que corrigir e porquê}

Código relevante: {linha original} → {sugestão de correcção}
```
