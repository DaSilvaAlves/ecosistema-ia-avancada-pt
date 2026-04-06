# AIOX Framework Completo

O ecosistema completo Synkra AIOX: 13 agentes com personas únicas, workflows automatizados e orquestração inteligente.

## Requisitos

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa

## Instalação

1. Extrai o ZIP para a pasta raiz do teu projecto
2. Abre o terminal e executa `claude`
3. Activa qualquer agente da tabela abaixo

## 13 Agentes com personas únicas

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @dev (Dex) | `@dev` | Implementação, debugging, refactoring |
| @qa (Quinn) | `@qa` | Quality gates, testes, revisão |
| @architect (Aria) | `@architect` | Arquitectura, technology selection |
| @pm (Morgan) | `@pm` | PRDs, epics, roadmap |
| @po (Pax) | `@po` | Validação de stories, backlog |
| @sm (River) | `@sm` | Criação de stories, sprints |
| @analyst (Alex) | `@analyst` | Pesquisa, análise de mercado |
| @data-engineer (Dara) | `@data-engineer` | Schema, migrations, RLS |
| @ux-design-expert (Uma) | `@ux-design-expert` | UX/UI, wireframes, componentes |
| @devops (Gage) | `@devops` | CI/CD, deploy, push exclusivo |
| @squad-creator (Craft) | `@squad-creator` | Criação e publicação de squads |
| @monster (Rex) | `@monster` | Orquestração multi-projecto |
| @aiox-master (Orion) | `@aiox-master` | Governance do framework |

## Workflows incluídos

- **Story Development Cycle** — criar → validar → implementar → testar → deploy
- **QA Loop** — revisão automática até 5 iterações
- **Spec Pipeline** — de requisitos informais a spec executável
- **Epic Orchestration** — gestão de epics com múltiplas stories

## Constitution e governance

6 artigos constitucionais que garantem qualidade:
- CLI First, Agent Authority, Story-Driven Development
- No Invention, Quality First, Absolute Imports

## Exemplo prático

```
$ claude
> @monster
> *status
> *next
```

O Monster determina automaticamente o próximo passo do teu projecto.

## Workflow completo recomendado

`@pm` define PRD → `@sm` cria stories → `@po` valida → `@dev` implementa → `@qa` revisa → `@devops` deploy
