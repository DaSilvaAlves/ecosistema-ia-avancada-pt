# Architect & Tech Research

2 agentes + 2 skills para arquitectura de sistemas e investigação tecnológica profunda.

## Requisitos

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa

## Instalação

1. Extrai o ZIP para a pasta raiz do teu projecto
2. Abre o terminal e executa `claude`

## Componentes

| Componente | Comando | Tipo | O que faz |
|------------|---------|------|-----------|
| @architect (Aria) | `@architect` | Agente | Arquitectura de sistemas, technology selection |
| @analyst (Alex) | `@analyst` | Agente | Deep research, análise de mercado |
| Architect First | `/architect-first` | Skill | Filosofia architecture-first com checklists |
| Tech Search | `/tech-search` | Skill | Investigação tecnológica profunda com fontes |

## Workflow

`@architect` desenha → `/tech-search` investiga opções → `@analyst` analisa trade-offs → decisão informada

## Exemplo prático

```
$ claude
> @architect
> Desenha a arquitectura para um sistema de pagamentos com Stripe, Supabase e filas de mensagens
```

Inclui checklists de arquitectura, templates de ADR e guias de validação.
