# Marketplace Governance — Regras para Agentes

## Regra principal

Antes de qualquer accao no marketplace, o agente DEVE:

1. Ler o PRD-MARKETPLACE (`imersao-tools/marketplace/docs/PRD-MARKETPLACE.md`)
2. Ler o PRD do produto afectado (`imersao-tools/marketplace/docs/PRD-SQUAD-*.md` ou `PRD-CLONE-*.md`)
3. Confirmar com o Eurico se a accao nao esta coberta pelo PRD

---

## Accoes que requerem consulta de PRD

| Accao | PRD a consultar |
|-------|-----------------|
| Alterar pagina de listagem | PRD-MARKETPLACE |
| Alterar navegacao/sidebar | PRD-MARKETPLACE |
| Adicionar nova categoria | PRD-MARKETPLACE + aprovacao Eurico |
| Alterar pagina de detalhe de um squad | PRD-MARKETPLACE + PRD do squad |
| Alterar guia de instalacao | PRD do produto |
| Adicionar novo produto | PRD-MARKETPLACE + PRD novo (criar primeiro) |
| Alterar preco | PRD do produto + aprovacao Eurico |
| Remover produto | PRD-MARKETPLACE + aprovacao Eurico |
| Alterar copy de produto | PRD do produto + brandbook |
| Alterar design/layout | PRD-MARKETPLACE + design-system-ia-avancada.md |

---

## Accoes bloqueadas sem aprovacao

| Accao | Razao |
|-------|-------|
| Inventar produtos | Incidente 23/03 — NUNCA inventar dados |
| Inventar precos | Precos SAO definidos pelo Eurico — terminam em 8 |
| Inventar categorias | Categorias definidas no PRD-MARKETPLACE |
| Inventar downloads ou metricas | ZERO dados ficticios |
| Adicionar gamificacao | DESCARTADA — decisao do Eurico |
| Criar PRD de produto sem aprovacao | Eurico cria ou aprova PRDs |

---

## Indice de PRDs do marketplace

| PRD | Path |
|-----|------|
| Marketplace | `imersao-tools/marketplace/docs/PRD-MARKETPLACE.md` |
| AI Orchestration Elite | `imersao-tools/marketplace/docs/PRD-SQUAD-AI-ORCHESTRATION-ELITE.md` |
| Architect & Tech Research | `imersao-tools/marketplace/docs/PRD-SQUAD-ARCHITECT-TECH-RESEARCH.md` |
| Copy Chief Elite | `imersao-tools/marketplace/docs/PRD-SQUAD-COPY-CHIEF-ELITE.md` |
| Data Intelligence | `imersao-tools/marketplace/docs/PRD-SQUAD-DATA-INTELLIGENCE.md` |
| Database Schema Architect | `imersao-tools/marketplace/docs/PRD-SQUAD-DATABASE-SCHEMA-ARCHITECT.md` |
| Design System | `imersao-tools/marketplace/docs/PRD-SQUAD-DESIGN-SYSTEM.md` |
| DevOps Quality Gates | `imersao-tools/marketplace/docs/PRD-SQUAD-DEVOPS-QUALITY-GATES.md` |
| Funnel Conversion | `imersao-tools/marketplace/docs/PRD-SQUAD-FUNNEL-CONVERSION.md` |
| Marketing AI Suite | `imersao-tools/marketplace/docs/PRD-SQUAD-MARKETING-AI.md` |
| Product Management | `imersao-tools/marketplace/docs/PRD-SQUAD-PRODUCT-MANAGEMENT.md` |
| SEO & Content Engine | `imersao-tools/marketplace/docs/PRD-SQUAD-SEO-CONTENT-ENGINE.md` |
| Starter Dev Squad | `imersao-tools/marketplace/docs/PRD-SQUAD-STARTER-DEV.md` |
| Clone Hormozi | `imersao-tools/marketplace/docs/PRD-CLONE-HORMOZI.md` |

---

## Fluxo obrigatorio

```
Agente recebe tarefa no marketplace
  → Le PRD-MARKETPLACE
  → Le PRD do produto afectado
  → Accao esta no PRD?
    SIM → Executa
    NAO → Pergunta ao Eurico ANTES de fazer qualquer coisa
```

---

## Quem pode alterar esta regra

Apenas o Eurico.
