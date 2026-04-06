# HANDOFF — Marketplace PRDs Completos | 26/03/2026

## CONTEXTO

Sessao com @architect (Aria). Continuacao directa da sessao anterior (HANDOFF_26032026_MARKETPLACE.md). O Eurico respondeu a todas as perguntas e foram criados 14 PRDs + regra de governance para o marketplace.

**Sessao anterior:** `HANDOFF_26032026_MARKETPLACE.md` (consolidacao de ficheiros)
**Branch:** `main`
**Ultimo commit:** `1969912a6` — docs: criar 14 PRDs do marketplace + regra de governance

---

## 1. O QUE FOI FEITO NESTA SESSAO

### 1.1 PRD-MARKETPLACE (contentor principal)

Criado em `docs/PRD-MARKETPLACE.md`. Define:

| Aspecto | Decisao |
|---------|---------|
| O que e | Seccao dentro da comunidade, acessivel pela sidebar |
| Quem vende | Apenas equipa [IA]AVANCADA PT |
| Categorias | Squads AIOX (gratis) + Clones de Mentes (pagos) |
| Card de produto | Nome + descricao + imagem + icone + badge (gratis/pago) |
| Guia de instalacao | Integrado na pagina de detalhe de cada produto (NAO separado) |
| Pagamentos | Stripe — fase posterior, apos o basico funcionar |
| Precos | Terminam sempre em 8 |
| Gamificacao | DESCARTADA |

### 1.2 PRDs de squads (12 ficheiros)

Cada squad tem PRD proprio com: descricao, componentes incluidos, para quem e, requisitos, guia de instalacao e governance.

| # | PRD | Ficheiro |
|---|-----|----------|
| 1 | AI Orchestration Elite | `PRD-SQUAD-AI-ORCHESTRATION-ELITE.md` |
| 2 | Architect & Tech Research | `PRD-SQUAD-ARCHITECT-TECH-RESEARCH.md` |
| 3 | Copy Chief Elite | `PRD-SQUAD-COPY-CHIEF-ELITE.md` |
| 4 | Data Intelligence | `PRD-SQUAD-DATA-INTELLIGENCE.md` |
| 5 | Database Schema Architect | `PRD-SQUAD-DATABASE-SCHEMA-ARCHITECT.md` |
| 6 | Design System | `PRD-SQUAD-DESIGN-SYSTEM.md` |
| 7 | DevOps Quality Gates | `PRD-SQUAD-DEVOPS-QUALITY-GATES.md` |
| 8 | Funnel Conversion | `PRD-SQUAD-FUNNEL-CONVERSION.md` |
| 9 | Marketing AI Suite | `PRD-SQUAD-MARKETING-AI.md` |
| 10 | Product Management | `PRD-SQUAD-PRODUCT-MANAGEMENT.md` |
| 11 | SEO & Content Engine | `PRD-SQUAD-SEO-CONTENT-ENGINE.md` |
| 12 | Starter Dev Squad | `PRD-SQUAD-STARTER-DEV.md` |

### 1.3 PRD do clone Hormozi

Criado em `docs/PRD-CLONE-HORMOZI.md`. Produto pago, categoria "Clones de Mentes". Inclui 17 frameworks, 27 heuristicas, 9 padroes decisorios, camada de adaptacao PT. Preco a definir pelo Eurico.

### 1.4 Regra de governance

Criada em `.claude/rules/marketplace-governance.md`. Obriga TODOS os agentes a:

1. Ler PRD-MARKETPLACE antes de qualquer accao no marketplace
2. Ler PRD do produto afectado
3. Perguntar ao Eurico se a accao nao esta coberta pelo PRD
4. NUNCA inventar dados, precos, categorias ou produtos

---

## 2. DECISOES CRITICAS DO EURICO

| Decisao | Detalhe |
|---------|---------|
| Categorias organizadas | Marketplace organizado por categorias (como supermercado — cada seccao tem os seus produtos) |
| Guias integrados no produto | Cada produto tem o seu guia DENTRO da pagina de detalhe — NAO existe guia generico separado |
| 1 PRD por produto | Cada produto tem PRD proprio (nao um PRD generico para todos) |
| Processo de instalacao igual | Todos os squads seguem o mesmo processo base (extrair ZIP, abrir Claude Code, activar) |
| 12 squads definitivos | Os 12 listados acima sao os que vao para o marketplace |
| Regras rigidas | PRDs devem ser consultados, confirmados e informados — para que tudo esteja coordenado |
| Paginas guia separadas a deprecar | `guia-squads.html` e `guia-clone-hormozi.html` devem ser integradas nas paginas de detalhe e depois eliminadas |

---

## 3. ESTRUTURA ACTUAL DO PROJECTO

```
imersao-tools/marketplace/
├── docs/                              ← 18 ficheiros
│   ├── HANDOFF_26032026_MARKETPLACE.md       ← Sessao 1 (consolidacao)
│   ├── HANDOFF_26032026_MARKETPLACE_PRDS.md  ← Sessao 2 (PRDs) — ESTE FICHEIRO
│   ├── PRD-MARKETPLACE.md                    ← PRD do contentor
│   ├── PRD-CLONE-HORMOZI.md                  ← PRD do clone (pago)
│   ├── PRD-SQUAD-*.md (x12)                  ← PRDs dos 12 squads
│   ├── PRD-SQUADMARKET.md                    ← DEPRECATED — substituido pelos novos PRDs
│   ├── ARCH-SQUADMARKET.md                   ← Arquitectura antiga (rever se ainda valida)
│   └── 001-squadmarket.sql                   ← Migration SQL (rever se ainda valida)
├── pages/                             ← 5 HTMLs
│   ├── squads.html                           ← Listagem principal (adaptar para categorias)
│   ├── squad-detalhe.html                    ← Template de detalhe de produto
│   ├── squad-sucesso.html                    ← Pagina de sucesso
│   ├── guia-squads.html                      ← DEPRECAR — integrar no detalhe
│   └── guia-clone-hormozi.html               ← DEPRECAR — integrar no detalhe
└── packages/                          ← 13 packages (12 squads + 1 clone)
    ├── ai-orchestration-elite/
    ├── architect-tech-research/
    ├── clone-hormozi/
    ├── copy-chief-elite/
    ├── data-intelligence-squad/
    ├── database-schema-architect/
    ├── design-system-squad/
    ├── devops-quality-gates/
    ├── funnel-conversion-squad/
    ├── marketing-ai-squad/
    ├── product-management-suite/
    ├── seo-content-engine/
    └── starter-dev-squad/
```

**Regra de governance:** `.claude/rules/marketplace-governance.md` — carrega automaticamente em qualquer sessao.

---

## 4. ESTADO DE CADA COMPONENTE

### PRDs

| Componente | Estado | Notas |
|------------|--------|-------|
| PRD-MARKETPLACE | RASCUNHO | Aguarda aprovacao final do Eurico |
| 12 PRDs de squads | RASCUNHO | Aguardam aprovacao final do Eurico |
| PRD-CLONE-HORMOZI | RASCUNHO | Preco por definir pelo Eurico |
| PRD-SQUADMARKET.md | DEPRECATED | Substituido pelos 14 PRDs novos |
| Regra marketplace-governance.md | ACTIVA | Ja em vigor para todos os agentes |

### Paginas HTML

| Pagina | Estado | Proxima accao |
|--------|--------|---------------|
| `squads.html` | Funcional | Adaptar para mostrar categorias (Squads + Clones) |
| `squad-detalhe.html` | Funcional | Integrar guia de instalacao dentro da pagina |
| `squad-sucesso.html` | Funcional | Sem alteracoes imediatas |
| `guia-squads.html` | A DEPRECAR | Conteudo deve migrar para pagina de detalhe |
| `guia-clone-hormozi.html` | A DEPRECAR | Conteudo deve migrar para pagina de detalhe |

### Packages

| Package | Estado | Notas |
|---------|--------|-------|
| 12 squads AIOX | Empacotados (ZIP + pasta) | README com instrucoes em cada um |
| Clone Hormozi | Empacotado | Testado em PT, precisa de melhorias (nao prioritario) |

---

## 5. FICHEIROS DEPRECATED

| Ficheiro | Razao | Accao |
|----------|-------|-------|
| `docs/PRD-SQUADMARKET.md` | Substituido pelos 14 PRDs novos | Eliminar apos Eurico confirmar |
| `docs/ARCH-SQUADMARKET.md` | Pode estar desactualizado face aos novos PRDs | Rever e decidir se mantem/elimina |
| `docs/001-squadmarket.sql` | Migration SQL — verificar se schema ainda corresponde aos PRDs | Rever |
| `pages/guia-squads.html` | Guias separados descartados — integrar no detalhe | Migrar conteudo e eliminar |
| `pages/guia-clone-hormozi.html` | Guias separados descartados — integrar no detalhe | Migrar conteudo e eliminar |

---

## 6. PROXIMOS PASSOS

| # | Tarefa | Agente | Detalhe |
|---|--------|--------|---------|
| 1 | Eurico aprova PRDs | Eurico | Ler os 14 PRDs e marcar como APROVADO ou pedir alteracoes |
| 2 | Definir preco do clone Hormozi | Eurico | Preco termina em 8 — definir valor |
| 3 | Adaptar `squads.html` para categorias | @dev | Separar listagem por categorias (Squads AIOX / Clones de Mentes) |
| 4 | Integrar guias no detalhe | @dev | Mover conteudo de `guia-squads.html` e `guia-clone-hormozi.html` para dentro de `squad-detalhe.html` |
| 5 | Adicionar imagens aos produtos | @dev + Eurico | Cada card precisa de imagem — Eurico decide quais |
| 6 | Eliminar ficheiros deprecated | @dev | Apos aprovacao: `PRD-SQUADMARKET.md`, `guia-squads.html`, `guia-clone-hormozi.html` |
| 7 | Rever ARCH e SQL | @architect | Verificar se `ARCH-SQUADMARKET.md` e `001-squadmarket.sql` ainda sao validos |
| 8 | Integrar Stripe (fase posterior) | @dev + @devops | Apenas apos marketplace funcionar com produtos gratuitos |
| 9 | Screenshots dos produtos | Eurico + @dev | Para as imagens nos cards e paginas de detalhe |
| 10 | Copy dos produtos | Eurico | Descricoes curtas para os cards (seguindo brandbook) |

---

## 7. REGRAS PARA QUALQUER AGENTE QUE CONTINUE

1. **LER** este handoff e o `HANDOFF_26032026_MARKETPLACE.md` ANTES de fazer qualquer coisa
2. **LER** os PRDs relevantes ANTES de qualquer alteracao
3. **NUNCA** inventar dados, precos, categorias ou produtos
4. **NUNCA** criar PRDs sem aprovacao do Eurico
5. **PERGUNTAR** ao Eurico se algo nao esta coberto nos PRDs
6. **CONSULTAR** `.claude/rules/marketplace-governance.md` — e a lei
7. **CONSULTAR** `.claude/rules/design-system-ia-avancada.md` para qualquer alteracao visual
8. **CONSULTAR** brandbook antes de escrever qualquer copy

---

## 8. DIRECTORIO DE TRABALHO

```
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\marketplace
```

---

## 9. HISTORICO DE COMMITS DESTA SESSAO

```
1969912a6 docs: criar 14 PRDs do marketplace + regra de governance
f2c21c36a chore: consolidar marketplace numa pasta unica + handoff
```

---

## 10. CONTEXTO DE NEGOCIO

| Aspecto | Detalhe |
|---------|---------|
| Modelo | Squads AIOX gratuitos (downsell) + Clones pagos (upsell) |
| Publico | Membros da comunidade [IA]AVANCADA PT |
| Objectivo | Showcase de ferramentas + vendas de clones premium |
| Integracao | Seccao dentro da comunidade (sidebar) |
| Pagamentos | Stripe — apenas na fase posterior |
| Gamificacao | DESCARTADA — nao implementar |
| Clone unico | Apenas Hormozi por agora — sem mais clones |

---

*Handoff completo — 26/03/2026 — @architect (Aria)*
