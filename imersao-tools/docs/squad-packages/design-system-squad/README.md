# Design System Squad

5 especialistas de design system: atomic design, adopção, processos e geração de assets visuais com IA.

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
| Design Chief | `@design-chief` | Orquestração e decisões estratégicas |
| Brad Frost | `@brad-frost` | Atomic design, componentes, documentação |
| Dan Mall | `@dan-mall` | Adopção, ROI, stakeholders |
| Dave Malouf | `@dave-malouf` | DesignOps, processos, métricas |
| Nano Banana | `@nano-banana-generator` | Geração de assets visuais com IA |

## Workflow

`@design-chief` orquestra → delega para o especialista certo.

## Exemplo prático

```
$ claude
> @design-chief
> Cria um design system para uma app de fintech com dark mode
```
