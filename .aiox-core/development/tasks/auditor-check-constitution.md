---
task: Auditor Check Constitution
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (none): Sem input necessário — lê estado actual do repositório
Saida: |
  - resultado_por_artigo: PASS/FAIL por cada artigo da Constitution
  - evidencia: Evidência concreta de conformidade ou violação por artigo
Checklist:
  - "[ ] Check Art I — CLI First: verify no UI-only features exist"
  - "[ ] Check Art II — Agent Authority: verify push/PR only by @devops"
  - "[ ] Check Art III — Story-Driven: verify all work has story backing"
  - "[ ] Check Art IV — No Invention: verify spec traces to requirements"
  - "[ ] Check Art V — Quality First: verify lint/test/typecheck pass"
  - "[ ] Check Art VI — Absolute Imports: scan for relative imports"
---

# *check-constitution

Verifica conformidade com todos os 6 artigos da Constitution AIOX. Analisa o estado actual do repositório e reporta PASS/FAIL por artigo com evidência concreta.

## Usage

```
*check-constitution
```

## Flow

1. Ler estado actual do repositório (git log, ficheiros, imports)
2. Verificar Artigo I — CLI First (funcionalidades acessíveis via CLI)
3. Verificar Artigo II — Agent Authority (push/PR exclusivo de @devops)
4. Verificar Artigo III — Story-Driven (commits têm story backing)
5. Verificar Artigo IV — No Invention (specs rastreáveis a requisitos)
6. Verificar Artigo V — Quality First (lint, tests, typecheck)
7. Verificar Artigo VI — Absolute Imports (ausência de imports relativos)
8. Compilar resultado artigo por artigo

## Output

Tabela com PASS/FAIL por artigo, evidência específica (ficheiros, linhas, commits) e lista de violações a corrigir.
