# Separation of Roles — executor != quality_gate

## Origem

Incidente Nexus v2 Story 1.10 (quality gate, 12/05/2026). Nas stories anteriores (1.1-1.9), `@qa` (Quinn) fazia o qa-gate sobre código que `@dev` (Dex) implementava — separação natural. Na Story 1.10, parte do trabalho (fixtures E2E + scripts) foi executada pelo próprio `@qa`. Surgiu a pergunta: quem faz o quality gate quando o executor primário é o agente de qualidade? A decisão ad-hoc foi `@architect` (Aria) actuar como quality gate. Funcionou, mas era regra implícita — esta regra torna-a explícita.

## Princípio (Universal AIOX)

**Quem executa o trabalho não pode ser quem o aprova.** O executor de uma unidade de trabalho e o quality gate dessa mesma unidade são sempre agentes distintos. Aplica-se a qualquer agente — não apenas ao par `@dev` / `@qa`.

## Matriz de Escalação

| Executor primário da unidade de trabalho | Quality gate |
|------------------------------------------|--------------|
| `@dev` (implementação) | `@qa` |
| `@qa` (fixtures, scripts de teste, infra de teste) | `@architect` |
| `@architect` (decisão de arquitectura com código) | `@qa` ou `@aiox-master` |
| `@data-engineer` (DDL, migrações) | `@architect` |
| `@ux-design-expert` (componentes UI) | `@qa` |
| Múltiplos agentes na mesma unidade | Agente que não tocou em nenhuma parte — escalar a `@aiox-master` se não houver |

## Regras

| # | Regra |
|---|-------|
| 1 | Nenhum agente assina o quality gate de trabalho que ele próprio executou — total ou parcialmente |
| 2 | Quando o executor natural do gate é o executor do trabalho, o gate sobe um nível na matriz acima |
| 3 | A escolha do quality gate alternativo é registada na story (secção QA Results) com a justificação |
| 4 | Se não houver agente disponível que não tenha tocado no trabalho, `@aiox-master` é o gate de último recurso |
| 5 | A revisão automática (CodeRabbit) não substitui o quality gate humano-equivalente — complementa-o |

## Relação com Outras Regras

| Regra | Relação |
|-------|---------|
| `agent-authority.md` | A delegação de autoridade respeita esta separação — cross-link na secção de Escalation Rules |
| Constitution Artigo V (Quality First) | Esta regra é o mecanismo que o garante quando os papéis se sobrepõem |
| Princípio OMC "Never self-approve in the same active context" | É a mesma ideia — esta é a versão AIOX formal |

## Aplicação Universal

Aplica-se a todos os agentes sem excepção: `@dev`, `@qa`, `@architect`, `@data-engineer`, `@ux-design-expert`, `@pm`, `@po`, `@sm`, `@devops`, `@monster`, `@aiox-master`, squads externos e skills.

---

*Origem: Retrospectiva Epic 1 Nexus v2, acção A6. Criada por Orion (`@aiox-master`) em 14/05/2026.*
