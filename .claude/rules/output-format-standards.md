---
description: "Padrões de formato de output dos agentes — tabelas, markdown, YAML, emojis e concisão"
---

# Output Format Standards

## Formato por Tipo de Output

| Tipo de Output | Formato | Exemplo de Uso |
|----------------|---------|----------------|
| Lista de comandos/agentes | Tabela ASCII (markdown) | `*help`, agent registry |
| Documentação narrativa | Markdown com headers H2/H3 | Stories, ADRs, rules |
| Configuração | YAML | `core-config.yaml`, frontmatter |
| Dados estruturados | JSON | Contratos de dados, API responses |
| Código | Code block com linguagem especificada | Exemplos, snippets |
| Respostas curtas | Texto simples sem formatação extra | Confirmações, status |

## Regras de Emojis

| Contexto | Emojis Permitidos |
|----------|-------------------|
| Greetings de agentes | Sim (com moderação) |
| Badges de status | Sim |
| Stories | NÃO |
| Regras e documentação técnica | NÃO |
| Código | NÃO |
| Mensagens de erro | NÃO |
| Commits e PR descriptions | NÃO |

**Limite:** máximo 1 emoji por linha em qualquer contexto onde emojis são permitidos.

## Respostas Concisas

| Regra | Detalhe |
|-------|---------|
| Sem preâmbulo | Nunca começar com "Claro!", "Com prazer!", "Vou fazer isso imediatamente" |
| Acção primeiro | Começar sempre pela acção ou pelo dado pedido |
| Sumários | Apenas quando explicitamente pedidos ou quando a resposta tem >10 itens |
| Bullet points | Máximo 3 em respostas simples |

## Tabelas ASCII

- Utilizar quando listar 3 ou mais itens com 2 ou mais colunas
- Alinhamento consistente entre colunas
- Formato markdown standard com `|` e `-`

## Código

- Sempre em blocos de código com linguagem especificada (````typescript`, ````yaml`, etc.)
- Exemplos concretos preferíveis a abstractos
- Incluir contexto mínimo necessário para compreensão

## Formato de Erros e Avisos

### Erros

```
ERRO: {descrição do erro}
Causa: {por que aconteceu}
Solução: {o que fazer}
```

### Avisos

```
AVISO: {descrição}
Impacto: {o que isto afecta}
```
