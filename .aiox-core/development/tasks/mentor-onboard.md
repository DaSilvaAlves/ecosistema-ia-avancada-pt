---
task: Onboard New Member
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - nome: string — nome do novo membro
  - papel: dev|pm|designer|stakeholder — papel do membro na equipa
Saida: |
  - plano_onboarding: markdown — plano personalizado de onboarding com semanas e milestones
  - comandos_iniciais: string[] — primeiros 5 comandos @agent *command a experimentar
  - checklist: markdown — checklist de progresso de onboarding
Checklist:
  - "[ ] Determinar path de onboarding específico ao papel"
  - "[ ] Criar plano personalizado com semanas e milestones atingíveis"
  - "[ ] Listar primeiros 5 comandos concretos adequados ao papel"
  - "[ ] Construir checklist de progresso com itens verificáveis"
  - "[ ] Incluir recursos de referência relevantes ao papel"
---

# *onboard

Cria um plano de onboarding personalizado para um novo membro da comunidade IA AVANÇADA PT. O plano adapta-se ao papel do membro e inclui os primeiros comandos a experimentar, milestones e checklist de progresso.

## Usage

```
@aiox-mentor
*onboard

# → solicita nome e papel interactivamente

*onboard "João Silva" dev
# → plano de onboarding para developer com foco em @dev, @qa, SDC

*onboard "Maria Costa" pm
# → plano de onboarding para PM com foco em @pm, @po, Spec Pipeline
```

## Flow

1. Determina path específico ao papel: `dev` → SDC + implementação; `pm` → Spec Pipeline + épicos; `designer` → UX + design system; `stakeholder` → visibilidade + reports
2. Cria plano semanal com milestones progressivos e atingíveis
3. Lista primeiros 5 comandos adequados ao papel com contexto de quando e porquê usar cada um
4. Constrói checklist de progresso com itens verificáveis (checkboxes)
5. Inclui referências a regras, ficheiros e recursos relevantes ao papel

## Output

Markdown com:
- Boas-vindas personalizado ao novo membro
- Plano semanal (Semana 1: ambientação, Semana 2: primeiros comandos, Semana 3: workflow completo)
- Lista de primeiros 5 comandos com contexto
- Checklist de progresso com checkboxes
- Links para recursos de referência
