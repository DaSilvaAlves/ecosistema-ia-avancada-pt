---
description: "Standards para criar agentes AIOX — estrutura YAML, autoridade e validação"
---

# Agent Creation Standards

## Estrutura YAML Obrigatória

Todos os agentes AIOX devem incluir os seguintes campos obrigatórios:

```yaml
agent:
  name: "{PascalCase}"
  id: "{kebab-case}"
  title: "{Title Case}"
  icon: "{emoji único}"
  whenToUse: "{descrição de quando activar este agente}"

persona_profile:
  archetype: "{arquétipo da persona}"
  communication:
    tone: "{tom de comunicação}"

persona:
  role: "{papel principal do agente}"
  core_principles:
    - "{princípio 1}"
    - "{princípio 2}"

commands:
  help: "{descrição}"
  exit: "{descrição}"

dependencies:
  - "{dependência 1}"
```

**Campos obrigatórios mínimos:**
- `agent.name`, `agent.id`, `agent.title`, `agent.icon`, `agent.whenToUse`
- `persona_profile.archetype`, `persona_profile.communication.tone`
- `persona.role`, `persona.core_principles`
- `commands` (mínimo: `help` e `exit`)
- `dependencies`

## Campos Opcionais

| Campo | Propósito |
|-------|-----------|
| `agent.customization` | Configurações específicas do agente |
| `persona_profile.zodiac` | Personalidade adicional da persona |
| `autoClaude` | Configuração de automação (ex: qaLoop, codeRabbit) |
| `branch_management` | Regras de gestão de branches |
| `responsibility_boundaries` | Limites explícitos de responsabilidade |

## Autoridade de Criação

| Operação | Agente Autorizado |
|----------|-------------------|
| Criar novo agente AIOX | Apenas `@aiox-master` ou `@pm` |
| Modificar agente existente | `@aiox-master` ou `@pm` |

**Processo de aprovação:**
1. Proposta deve justificar por que uma skill ou agente existente não serve
2. Aprovação via epic antes da criação
3. Frontmatter completo obrigatório antes de utilização

## Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| `agent.id` | kebab-case lowercase | `data-engineer`, `ux-design-expert` |
| `agent.name` | PascalCase (persona) | `Dara`, `Uma`, `Quinn` |
| `agent.title` | Title Case | `Data Engineer`, `UX Design Expert` |
| `agent.icon` | Emoji único no ecosistema | Cada agente tem um emoji exclusivo |
| Ficheiro | `{id}.md` | `data-engineer.md` |

**Restrições:**
- O nome da persona deve ser único no ecosistema
- O `agent.icon` não pode ser reutilizado por outro agente

## Validação

Após criação de um novo agente:

1. **Validar YAML:** executar `npm run validate:agents` para verificar estrutura válida
2. **Verificar unicidade:** confirmar que `agent.id` é único no ecosistema
3. **Verificar campos:** confirmar que todos os campos obrigatórios existem
4. **Sincronizar IDE:** executar `npm run sync:ide` para tornar o agente funcional

**Localização dos agentes:** `.aiox-core/development/agents/{id}.md`

O agente só é funcional no Claude Code após execução do `npm run sync:ide`.
