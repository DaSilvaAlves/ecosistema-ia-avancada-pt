---
description: "Regras de uso da marketing suite /market-* — âmbito, routing e limites"
---

# Marketing Suite Rules

## Âmbito dos Comandos /market-*

A marketing suite `/market-*` destina-se a criação de **conteúdo externo**:
- Copy para redes sociais, anúncios, posts de blog
- Emails de campanha e sequences
- Landing pages e propostas comerciais
- Análise de mercado e SEO
- Relatórios de marketing

## Quando Usar /market-* vs Agentes AIOX

| Tarefa | Ferramenta Correcta |
|--------|---------------------|
| Criar copy para post Instagram | `/market-*` |
| Criar email de campanha | `/market-*` |
| Definir roadmap de produto | `@pm` |
| Análise de concorrentes | `@analyst` |
| Decisão de feature | `@pm` + `@po` |
| Análise de mercado | `@analyst` |
| Copy para onboarding in-app | `@pm` (produto) |

## Routing por Necessidade

| Necessidade | Comando /market-* |
|-------------|-------------------|
| Copywriting | `/market-copy` |
| Redes sociais | `/market-social` |
| Email sequences | `/market-emails` |
| Análise concorrencial | `/market-competitors` |
| Landing page | `/market-landing` |
| Relatório | `/market-report` ou `/market-report-pdf` |
| Orquestração completa | `/market` (orquestrador) |

## Regra Anti-Mistura de Âmbitos

| Regra | Detalhe |
|-------|---------|
| NUNCA usar `/market-*` para decisões que afectam o produto | Produto -> `@pm` |
| NUNCA usar `@pm` ou `@analyst` para geração de copy externo | Copy externo -> `/market-*` |
| Fronteira clara | `/market-*` cria artefactos para **fora** do produto; agentes AIOX decidem sobre **dentro** do produto |

**Quando há dúvida sobre a fronteira:** se o artefacto é para consumo externo (clientes, redes, email) -> `/market-*`. Se o artefacto afecta decisões internas do produto -> agentes AIOX.

## Coordenação com Agentes AIOX

| Cenário | Coordenação |
|---------|-------------|
| Campanha precisa de input de produto (launch notes, feature descriptions) | `@pm` coordena |
| Marketing precisa de dados de mercado | `@analyst` coordena |
| Outputs de `/market-*` alimentam decisões estratégicas | `@pm` recebe e decide |

**Regras de coordenação:**
- `/market-*` e `@pm` podem colaborar em campanhas de lançamento
- `/market-*` nunca cria stories ou epics (-> `@sm` / `@pm`)
- Outputs de `/market-*` podem alimentar `@pm` para decisões estratégicas

## Língua

Todos os outputs de `/market-*` devem estar em PT-PT (ver `language-standards.md`).
