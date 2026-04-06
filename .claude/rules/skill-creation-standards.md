---
description: "Standards para criar skills AIOX — estrutura, nomenclatura, autoridade e localização"
---

# Skill Creation Standards

## Estrutura Obrigatória de uma Skill

Cada skill AIOX é um directório com a seguinte estrutura:

```
{skill-name}/
├── SKILL.md          # Obrigatório — definição da skill
├── references/       # Opcional — ficheiros de referência
└── AGENTS.md         # Opcional — agentes associados
```

### SKILL.md — Frontmatter Obrigatório

```yaml
---
name: "{skill-name}"
description: "{descrição concisa da capacidade}"
version: "1.0.0"
author: "{agente ou utilizador que criou}"
---
```

Todos os 4 campos (`name`, `description`, `version`, `author`) são obrigatórios. Uma skill sem frontmatter completo não é considerada válida.

### references/ — Directório Opcional

Contém ficheiros de referência, templates ou dados que a skill utiliza. Não tem estrutura interna obrigatória.

### AGENTS.md — Ficheiro Opcional

Documenta quais agentes podem executar ou beneficiar desta skill. Não é necessário para skills de uso geral.

## Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Nome da skill | kebab-case | `checklist-runner`, `diagnose-synapse` |
| Directório da skill | kebab-case (igual ao nome) | `checklist-runner/` |
| Versão | Semântica MAJOR.MINOR.PATCH | `1.0.0`, `2.1.3` |
| Caracteres permitidos | Letras minúsculas, números, hífens | `coderabbit-review` |

**Proibido:** espaços, caracteres especiais, underscores, letras maiúsculas no nome ou directório.

## Skill vs Agente — Quando Criar Cada Um

| Tipo | Definição | Quando Criar | Exemplos |
|------|-----------|--------------|----------|
| **Skill** | Capacidade reutilizável sem persona | Quando a capacidade pode ser partilhada entre agentes | `checklist-runner`, `diagnose-synapse`, `coderabbit-review` |
| **Agente** | Entidade com persona, comandos e autoridade de domínio | Quando existe identidade + autoridade de domínio própria | `@dev`, `@sm`, `@qa` |

**Regra de decisão:**
- Se a capacidade é **partilhável** entre vários agentes e não requer persona -> criar **skill**
- Se a capacidade requer **identidade própria**, comandos exclusivos e **autoridade de domínio** -> criar **agente**
- Em caso de dúvida, preferir skill (mais leve, menos governança)

## Autoridade de Criação

| Artefacto | Quem Pode Criar |
|-----------|-----------------|
| Skills | `@dev` ou `@sm` |
| Agentes | Apenas `@aiox-master` ou `@pm` |

**Requisitos:**
- Qualquer skill nova requer frontmatter completo antes de ser utilizada
- O frontmatter deve ser validado antes da primeira execução

## Localização

Skills são armazenadas em:

```
C:\Users\XPS\.claude\skills\{skill-name}\
```

O ficheiro `SKILL.md` deve estar sempre presente na raiz do directório da skill.
