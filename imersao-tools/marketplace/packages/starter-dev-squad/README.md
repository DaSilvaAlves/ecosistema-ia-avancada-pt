# Starter Dev Squad

Squad essencial com 3 agentes para iniciar qualquer projecto de software com qualidade desde o primeiro commit.

## Requisitos

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa (console.anthropic.com)
- Terminal (VS Code, Windows Terminal, iTerm)

## Instalação

1. Extrai o ZIP para a pasta raiz do teu projecto
2. Os ficheiros ficam em `.claude/agents/` automaticamente
3. Abre o terminal na pasta do projecto
4. Executa `claude` para iniciar o Claude Code
5. Activa um agente com o comando da tabela abaixo

## Agentes incluídos

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @dev (Dex) | `@dev` | Implementação, debugging, refactoring |
| @qa (Quinn) | `@qa` | Quality gates, testes, revisão de código |
| @devops (Gage) | `@devops` | CI/CD, git push, deploy automatizado |

## Exemplo prático

```
$ claude
> @dev
> Implementa uma API REST para gestão de utilizadores
> *run-tests
```

## Workflow recomendado

`@dev` implementa → `@qa` revisa → `@devops` faz deploy

## Comandos úteis

- `*help` — comandos disponíveis do agente activo
- `*guide` — guia completo
- `*exit` — sair do modo agente

## Suporte

Dúvidas? Partilha no feed da comunidade [IA]AVANÇADA PT.
