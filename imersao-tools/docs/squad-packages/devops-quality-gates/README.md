# DevOps Quality Gates

DevOps + QA com skills de revisão automática. Garante qualidade antes de cada deploy.

## Requisitos

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa

## Instalação

1. Extrai o ZIP para a pasta raiz do teu projecto
2. Abre o terminal e executa `claude`

## Agentes e skills

| Componente | Comando | Tipo |
|------------|---------|------|
| @devops (Gage) | `@devops` | Agente — CI/CD, push, deploy |
| @qa (Quinn) | `@qa` | Agente — Quality gates, testes |
| CodeRabbit Review | `/coderabbit-review` | Skill — Revisão automática de código |
| Checklist Runner | `/checklist-runner` | Skill — Execução de checklists |

## Workflow

Código pronto → `@qa` revisa → `/coderabbit-review` valida → `@devops` faz deploy
