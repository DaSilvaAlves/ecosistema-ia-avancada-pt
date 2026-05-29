# React Component Test Criteria — Regra Obrigatória

## Origem

Inconsistência detectada na Epic 3 Nexus v2 (Stories 3.6 e 3.9, 23-27/05/2026). A partir das Stories 3.3-3.7, o Epic 3 estabeleceu uma policy informal: "componentes React são validados via `@architect`/`@dev` gate + CodeRabbit server-side, sem unit tests próprios". A policy nunca teve um critério objectivo de quando se aplica — foi decidida caso-a-caso e gerou resultados opostos:

- **Story 3.6 (Compras parceladas), CR Iter 1:** o CodeRabbit levantou Fix #3 (outside-diff) a pedir unit tests para os handlers de `page.tsx`. Foi **defendido com sucesso** como policy do Epic 3 (reply ao CR com precedente das Stories 3.3/3.4/3.5). CR Iter 2 aceitou e deu APPROVED, sem testes de página criados.
- **Story 3.9 (Vista património), CR Iter 1:** o CodeRabbit deu um **Major** exactamente pela ausência de unit tests para `PatrimonioPage` — e **não recuou**. A equipa teve de criar `tests/unit/app/financas/patrimonio/page.test.tsx` com 5 cenários (C1-C5: loading/empty/content/toggle/overdraft) na Iter 2 e alargar a cobertura na Iter 3.

A diferença real: a `PatrimonioPage` da 3.9 tinha **lógica de view não-trivial com múltiplos estados de render** (loading, empty, content, toggle de visibilidade, saldo negativo/overdraft). A `page.tsx` da 3.6 era mais fina. A policy "sem unit tests" é estável para componentes triviais, mas o CodeRabbit trata a ausência de testes como Major — e tem razão — quando a página tem estados múltiplos. Faltava o critério que distingue os dois casos.

## Princípio

**Um componente React exige teste de componente quando o seu render depende de múltiplos estados distintos. Um componente trivial — apresentacional, sem ramificação — não exige.** O gate AIOX deve aplicar este critério ANTES do CodeRabbit, para que a ausência de testes seja uma decisão deliberada e justificada, não um Major descoberto no PR.

## Critério Objectivo

Conta-se o número de **estados de render distintos** que o componente produz — ramos onde a árvore renderizada muda materialmente em função de dados, props ou estado interno.

| Estado de render (exemplos) | Conta? |
|------------------------------|--------|
| `loading` (dados `undefined` / a carregar) | Sim |
| `empty` (lista vazia, sem registos) | Sim |
| `content` (caminho feliz com dados) | Sim |
| `error` (falha de fetch / validação) | Sim |
| Toggle de visibilidade / expand-collapse | Sim |
| Ramo condicional de negócio (ex: saldo negativo, overdraft, plano premium) | Sim |
| Variação puramente estilística (className condicional sem mudança de árvore) | Não |

### Classificação

| Categoria | Critério | Exige teste de componente? |
|-----------|----------|----------------------------|
| **Componente com estado** | >= 3 estados de render distintos | **SIM** — teste de componente obrigatório, 1 cenário por estado distinto |
| **Componente de fronteira** | Exactamente 2 estados de render | **Recomendado** — exigido se a lógica de transição tiver risco (cálculo, dados financeiros, auth) |
| **Componente trivial** | 0-1 estados (apresentacional, sem ramificação) | **NÃO** — coberto por `@architect`/`@dev` gate + CR server-side (policy Epic 3 mantém-se) |

**Regra de ouro:** lógica testável vive em funções puras (`lib/**`) — o componente fica fino. Esta regra aplica-se ao que **resta** no componente depois dessa extracção. Um componente com >= 3 estados que delega cálculo a um helper puro continua a exigir teste de componente para provar o roteamento entre estados.

## Aplicação no QA Gate / Architect Gate

Uma story que entrega ou altera um componente React só passa o quality gate se:

1. O agente que faz o gate **conta os estados de render** do componente entregue
2. Se >= 3 estados, confirma que existe teste de componente com 1 cenário por estado distinto — caso contrário, **FAIL** com a recomendação de adicionar os testes em falta
3. Se 0-1 estados, regista no gate que o componente é trivial e a policy "sem unit tests" aplica-se (com a contagem que o justifica)
4. A decisão (exige / não exige) e a contagem de estados ficam registadas na secção QA Results / Architect Gate da story — para que o CodeRabbit não a reabra como Major

Isto faz o gate AIOX apanhar antes do CR o que a Story 3.9 só descobriu no PR (cumpre também a acção A2 da Retrospectiva Epic 3 na sua vertente de teste de componente).

## Anti-Padrões Proibidos

| Anti-padrão | Porquê é proibido |
|-------------|-------------------|
| Invocar a policy "componentes sem unit tests" para uma página com loading+empty+content+toggle | A policy só cobre componentes triviais — a 3.9 provou que o CR a rejeita para páginas com estados múltiplos |
| Decidir caso-a-caso sem registar a contagem de estados | Gera a inconsistência 3.6 vs 3.9; a contagem objectiva é o que torna a decisão defensável |
| Deixar a ausência de testes ser descoberta pelo CodeRabbit no PR | Custa iterações CR (a 3.9 gastou Iter 2 + Iter 3); o gate AIOX deve apanhá-lo primeiro |

## Aplicação Universal

Aplica-se a todos os agentes que entregam ou revêem componentes React: `@dev`, `@ux-design-expert`, `@qa`, `@architect`, e qualquer skill ou squad externo. Sem excepções.

---

*Origem: Retrospectiva Epic 3 Nexus v2, acção A3. Criada por Orion (`@aiox-master`) em 29/05/2026.*
