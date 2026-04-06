---
description: "Autoridade e routing dos agentes de design system — quando usar cada especialista"
---

# Design System Authority

## Agentes do Squad /design-system

| Agente | Especialidade |
|--------|---------------|
| `design-chief` | Orquestração e decisões estratégicas de design system |
| `brad-frost` | Atomic design, estrutura de componentes, documentação de padrões |
| `dan-mall` | Adopção de design system, ROI, colaboração com stakeholders |
| `dave-malouf` | DesignOps, processos de design, métricas de eficiência |
| `nano-banana-generator` | Geração de assets visuais com IA, variantes de componentes |

## Autoridade do Squad /design-system

O squad `design-system:agents:*` pode:
- Criar e editar tokens de design
- Definir componentes UI
- Validar consistência visual
- Gerar assets de design system
- Documentar padrões de uso

## Routing por Tipo de Tarefa

| Tipo de Tarefa | Agente Correcto | Razão |
|----------------|-----------------|-------|
| Design system completo | `design-chief` | Orquestra os outros agentes |
| Atomic design, componentes do zero | `brad-frost` | Especialista em estrutura de componentes |
| Adopção, ROI, stakeholders | `dan-mall` | Especialista em traduzir design para especificações de implementação |
| DesignOps, processos, métricas | `dave-malouf` | Especialista em interaction design, UX patterns e fluxos |
| Geração de assets visuais com IA | `nano-banana-generator` | Geração automatizada de variantes |
| Conflito entre tokens | `design-chief` | Decisão estratégica e aprovação de novos padrões |

## Hierarquia e Delegação

- `design-chief` orquestra o squad e pode delegar para qualquer agente especialista
- Os agentes especialistas podem ser activados directamente para tarefas focadas
- Nunca dois agentes do squad trabalham em simultâneo no mesmo componente
- Outputs do squad devem sempre incluir tokens actualizados

### Padrões de Delegação

```
design-chief → brad-frost     (componentes)
design-chief → dan-mall       (adopção)
design-chief → dave-malouf    (processos)
design-chief → nano-banana-generator (assets)
```

## Limites do Squad

O squad /design-system **NÃO faz:**

| Operação Bloqueada | Delegar A |
|--------------------|-----------|
| Implementar código de produção | `@dev` |
| Fazer commit/push | `@devops` |
| Definir arquitectura de sistema | `@architect` |
| Decisões de produto | `@pm` |

O foco do squad é exclusivamente design system, tokens e componentes visuais.
