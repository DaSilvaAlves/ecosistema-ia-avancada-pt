---
task: Health Check
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - tipo_check: local|project|deploy|repo — escopo do health check a executar
Saida: |
  - estado_checks: table — tabela com check, status (OK/WARNING/CRITICAL) e detalhe
  - warnings: string[] — lista de warnings encontrados
  - fixes: string[] — comandos concretos para resolver cada warning/critical
Checklist:
  - "[ ] Executar checks focados no tipo_check solicitado"
  - "[ ] Reportar status por check individual (OK/WARNING/CRITICAL)"
  - "[ ] Listar warnings com descrição clara"
  - "[ ] Propor fix concreto para cada warning e critical"
  - "[ ] Ordenar por severidade: CRITICAL primeiro"
---

# *health

Executa um health check focado num escopo específico: ambiente local, projecto AIOX, deploy ou repositório. Mais rápido que `*doctor` — útil para verificações pontuais durante o trabalho.

## Usage

```
@aiox-resolver
*health

# → solicita tipo_check interactivamente

*health local
# → verifica ambiente: Node.js, Git, GitHub CLI, dependências instaladas

*health project
# → verifica estado do projecto: config, stories, agentes, workflows

*health deploy
# → verifica estado de deploys: Vercel, CI/CD, variáveis de ambiente

*health repo
# → verifica estado do repositório: branches, remotes, commits pendentes
```

## Flow

1. Foca os checks no tipo_check solicitado:
   - `local`: versões de ferramentas, dependências instaladas, ambiente de desenvolvimento
   - `project`: config AIOX, integridade de agentes, estado de stories activas
   - `deploy`: status Vercel, CI/CD pipelines, variáveis de ambiente
   - `repo`: git branches, remotes configurados, commits não pushados
2. Executa cada check e regista status: OK, WARNING, CRITICAL
3. Lista warnings com descrição clara do impacto
4. Propõe fix concreto por cada item não-OK

## Output

Tabela markdown:

| Check | Status | Detalhe |
|-------|--------|---------|
| {check} | OK/WARNING/CRITICAL | {detalhe} |

**Warnings:** lista
**Fixes sugeridos:** comandos concretos
