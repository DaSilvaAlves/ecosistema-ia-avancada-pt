# Product Management Suite

3 agentes para gestão de produto: PM para estratégia, PO para stories e backlog, SM para sprints.

## Requisitos

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa

## Instalação

1. Extrai o ZIP para a pasta raiz do teu projecto
2. Abre o terminal e executa `claude`
3. Activa o agente pretendido

## Agentes incluídos

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @pm (Morgan) | `@pm` | PRDs, epics, roadmap, estratégia |
| @po (Pax) | `@po` | Validação de stories, backlog, priorização |
| @sm (River) | `@sm` | Criação de stories, sprints, ceremonies |

## Workflow

`@pm` define o quê → `@sm` cria stories → `@po` valida e prioriza

## Exemplo prático

```
$ claude
> @pm
> Cria um PRD para uma feature de notificações push
```
