---
task: Auditor Check Standards
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - path: Caminho dos ficheiros a verificar, ou "all" para repositório completo
Saida: |
  - erros_pt_br: Lista de termos PT-BR encontrados com localização
  - formato_incorrecto: Datas e números em formato errado
  - correccoes: Sugestões de correcção PT-PT para cada erro encontrado
Checklist:
  - "[ ] Scan all target files for PT-BR terms from prohibited list"
  - "[ ] Check date formats (DD/MM/YYYY required)"
  - "[ ] Check number formats (comma decimal separator required)"
  - "[ ] Verify output format standards (no preamble, action first)"
  - "[ ] Suggest PT-PT corrections for each violation found"
---

# *check-standards

Verifica conformidade com language-standards.md e output-format-standards.md. Detecta termos PT-BR proibidos, formatos de data/número incorrectos e violações de formato de output.

## Usage

```
*check-standards [path|all]
```

## Flow

1. Elicitar path ou confirmar âmbito "all"
2. Varrer ficheiros alvo por termos PT-BR da lista proibida
3. Verificar formatos de data (DD/MM/YYYY obrigatório)
4. Verificar separadores decimais e de milhar (PT-PT)
5. Verificar standards de formato de output
6. Compilar erros com localização exacta (ficheiro:linha)
7. Sugerir correcção PT-PT para cada violação

## Output

Lista de violações de language e format standards com localização exacta, termo problemático e correcção sugerida em PT-PT.
