---
task: Run Doctor
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (none — corre todos os checks automaticamente)
Saida: |
  - relatorio_saude: markdown — relatório completo com status de todos os checks
  - items_criticos: string[] — items que requerem atenção imediata
  - accoes: string[] — comandos concretos para resolver items críticos
Checklist:
  - "[ ] Verificar configuração do framework (core-config.yaml, entity-registry)"
  - "[ ] Verificar integridade de agentes (YAML válido, campos obrigatórios)"
  - "[ ] Verificar estado das stories activas (sem orphans, sem status inválidos)"
  - "[ ] Verificar dependências de projeto (package.json, versões)"
  - "[ ] Categorizar resultados: OK, WARNING, CRITICAL"
---

# *doctor

Corre uma verificação completa de saúde do sistema AIOX. Verifica configuração, integridade de agentes, estado de stories, dependências e infra. Categoriza tudo em OK, WARNING e CRITICAL, com acções concretas para itens críticos.

## Usage

```
@aiox-resolver
*doctor
# → relatório completo de saúde — sem argumentos necessários
```

## Flow

1. Verifica configuração do framework: `core-config.yaml` válido, `entity-registry.yaml` sem erros
2. Verifica integridade de agentes: YAML válido, campos obrigatórios presentes, IDs únicos
3. Verifica estado de stories: sem stories orphan, status válidos, sem InProgress sem agente
4. Verifica dependências: `package.json` presente, versões compatíveis, lockfile sync
5. Categoriza resultados: OK (verde), WARNING (amarelo — não bloqueia), CRITICAL (vermelho — requer acção)

## Output

```
Doctor Report — {data_hora}

Checks executados:
  [OK]       Framework config — core-config.yaml válido
  [OK]       Entity registry — 47 entidades, sem duplicados
  [WARNING]  Story 2.3 — InProgress sem agente atribuído
  [CRITICAL] Agent dev.md — campo 'persona.role' em falta

Itens críticos:
  1. Agent dev.md — campo obrigatório em falta
     Acção: @aiox-resolver *fix "agent dev.md missing persona.role"

Warnings:
  1. Story 2.3 sem agente — atribuir responsável

Sumário: {N} OK | {N} warnings | {N} critical
```
