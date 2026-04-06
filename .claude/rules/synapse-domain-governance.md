---
description: "Governança de domínios SYNAPSE — quando criar, autoridade, nomenclatura e activação"
---

# SYNAPSE Domain Governance

## Quando Criar um Domínio SYNAPSE

| Critério | Decisão |
|----------|---------|
| Existe conjunto de regras contextuais para um subconjunto de ficheiros | CRIAR domínio |
| As regras já estão cobertas por `paths:` frontmatter em rules existentes | NÃO criar — redundante |
| Já existe domínio para o mesmo subsistema lógico | NÃO criar — máximo um domínio por subsistema |

**Regras:**
- Criar um domínio SYNAPSE quando existe um conjunto de regras que só devem ser activadas para um subconjunto específico de ficheiros ou contextos
- Não criar domínios redundantes com `paths:` frontmatter já em uso noutras rules
- Máximo um domínio por subsistema lógico (ex: um domínio `imersao-pipeline`, não dois)

## Autoridade de Criação e Edição

| Operação | Agente Autorizado |
|----------|-------------------|
| Criar novo domínio SYNAPSE | Apenas `@aiox-master` |
| Editar conteúdo de domínio existente | `@dev` (com aprovação) |
| Propor novo domínio via spec | `@pm` |

**Nenhum outro agente pode criar ou eliminar domínios SYNAPSE.**

## Convenções de Nomenclatura

| Regra | Detalhe | Exemplo |
|-------|---------|---------|
| Formato | kebab-case | `imersao-pipeline`, `cohort-manager` |
| Abreviações | Proibidas | `imersao-pipe` -> `imersao-pipeline` |
| Reflexão | Nome reflecte o subsistema, não o agente | `design-system` (não `brad-frost-rules`) |

**Exemplos correctos:** `imersao-pipeline`, `cohort-manager`, `design-system`, `marketing-suite`
**Exemplos incorrectos:** `ip-rules`, `ds`, `dev-stuff`

## Activação e Desactivação

| Operação | Como Fazer |
|----------|------------|
| Activar domínio | Adicionar `paths:` frontmatter ao ficheiro de regras correspondente |
| Desactivar domínio | Remover o `paths:` frontmatter (NÃO apagar o ficheiro) |

**Relação com rules existentes:**
- Um domínio SYNAPSE **complementa**, nunca substitui, uma rule existente
- Rules globais (sem `paths:`) continuam activas independentemente dos domínios SYNAPSE
- Domínios SYNAPSE adicionam regras contextuais por cima das regras globais

## Comandos SYNAPSE

| Comando | Propósito |
|---------|-----------|
| `/synapse:tasks:create-domain` | Criar novo domínio SYNAPSE |
| `/synapse:tasks:toggle-domain` | Activar ou desactivar domínio |
| `/synapse:tasks:add-rule` | Adicionar regra a domínio existente |
