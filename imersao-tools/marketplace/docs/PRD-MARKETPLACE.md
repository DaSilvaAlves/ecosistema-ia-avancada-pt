# PRD-MARKETPLACE — Marketplace [IA]AVANCADA PT

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO — aguarda aprovacao do Eurico

---

## 1. O que e

O marketplace e uma seccao dentro da comunidade [IA]AVANCADA PT, acessivel pela sidebar do dashboard. E o local onde os membros encontram, exploram e adquirem produtos do ecosistema — organizados por categorias.

**O marketplace NAO e:**
- Uma plataforma independente
- Uma loja aberta ao publico (apenas membros da comunidade)
- Um local onde terceiros vendem produtos

**Quem vende:** apenas a equipa [IA]AVANCADA PT.

---

## 2. Estrutura

### 2.1 Navegacao

- Item na sidebar da comunidade: "Marketplace"
- Ao clicar, abre a pagina principal com categorias visiveis

### 2.2 Categorias de lancamento

| Categoria | Tipo | Preco |
|-----------|------|-------|
| Squads AIOX | Equipas de agentes IA especializados | Gratuito |
| Clones de Mentes | Replicas de personalidades adaptadas PT | Pago (Stripe — fase posterior) |

Novas categorias podem ser adicionadas no futuro. Cada nova categoria requer PRD proprio.

### 2.3 Pagina principal (listagem)

A pagina principal mostra os produtos organizados por categoria. Cada categoria tem a sua seccao.

**Card de produto — informacao visivel:**

| Campo | Obrigatorio |
|-------|-------------|
| Nome do produto | Sim |
| Descricao curta (1-2 frases) | Sim |
| Imagem do produto | Sim |
| Icone/emoji | Sim |
| Badge (gratis / pago) | Sim |

### 2.4 Pagina de detalhe

Ao clicar num produto, o membro ve a pagina de detalhe com:

| Seccao | Conteudo |
|--------|----------|
| Header | Nome, imagem, badge, categoria |
| Descricao | O que e, para que serve, o que faz |
| Requisitos | O que o membro precisa ter instalado |
| Guia de instalacao | Passo-a-passo integrado NA pagina — cada produto tem o SEU guia |
| Accao | Botao "Instalar" (gratis) ou "Comprar" (pago) |

**Regra critica:** o guia de instalacao faz parte da pagina de detalhe do produto. NAO existe um guia generico separado. Cada produto e auto-contido — como uma caixa de produto com instrucoes dentro.

### 2.5 Pagina de sucesso

Apos instalar/comprar, o membro ve confirmacao com:
- Resumo do que adquiriu
- Link para o guia (ancora na pagina de detalhe)
- Proximo passo sugerido

---

## 3. Fluxo do membro

```
Sidebar → Marketplace (listagem por categorias)
  → Clica num produto → Pagina de detalhe (descricao + guia integrado)
    → Clica "Instalar" (gratis) ou "Comprar" (pago)
      → Pagina de sucesso
```

---

## 4. Pagamentos (fase posterior)

| Campo | Detalhe |
|-------|---------|
| Gateway | Stripe |
| Precos | Terminam sempre em 8 (8, 18, 48, etc.) |
| Quando | Apenas APOS o marketplace funcionar com os produtos gratuitos |
| Scope | Apenas para produtos pagos (clones) |

Pagamentos NAO fazem parte do scope de lancamento. Primeiro o basico funciona, depois integra-se Stripe.

---

## 5. Paginas existentes

| Ficheiro | Funcao | Estado |
|----------|--------|--------|
| `pages/squads.html` | Listagem principal | Existente — adaptar para categorias |
| `pages/squad-detalhe.html` | Pagina de detalhe de produto | Existente — template base |
| `pages/squad-sucesso.html` | Pagina de sucesso pos-instalacao | Existente |
| `pages/guia-squads.html` | Guia squads (DEPRECAR — integrar no detalhe) | Existente — a eliminar |
| `pages/guia-clone-hormozi.html` | Guia clone (DEPRECAR — integrar no detalhe) | Existente — a eliminar |

**Accao:** os guias separados (`guia-squads.html`, `guia-clone-hormozi.html`) devem ser integrados nas respectivas paginas de detalhe e depois eliminados.

---

## 6. Governance — regras para agentes

| Regra | Detalhe |
|-------|---------|
| Consultar PRDs | Antes de qualquer alteracao no marketplace, o agente DEVE ler este PRD e o PRD do produto afectado |
| Confirmar com Eurico | Qualquer decisao que nao esteja no PRD requer aprovacao explicita |
| Informar | Apos completar trabalho, o agente informa o que foi feito e o que falta |
| Zero invencao | NADA e inventado. Se nao esta no PRD, nao se faz. Se ha duvida, pergunta-se |
| PRD por produto | Cada produto no marketplace TEM de ter o seu PRD proprio antes de ser implementado |
| Guia obrigatorio | Nenhum produto entra no marketplace sem guia de instalacao completo |

---

## 7. PRDs de produto (a criar separadamente)

| PRD | Produtos | Estado |
|-----|----------|--------|
| PRD-SQUADS | 12 squads AIOX gratuitos | Por criar |
| PRD-CLONES | Clone Hormozi (unico por agora) | Por criar |

Cada PRD de produto define: descricao, requisitos, guia de instalacao, screenshots, e regras especificas.

---

## 8. O que esta FORA do scope

| Item | Razao |
|------|-------|
| Gamificacao XP/N1-N4 | Descartada — inventada sem aprovacao |
| Vendas por terceiros | Apenas equipa [IA]AVANCADA PT |
| Pagamentos no lancamento | Stripe vem depois do basico funcionar |
| Clones adicionais | Apenas Hormozi por agora |
| Avaliacao/reviews de produtos | Nao definido — fora do scope |

---

## 9. Design

Segue o design system [IA]AVANCADA PT sem excepcoes:
- Fundo `#04040A`
- Glassmorphism em cards
- Paleta: cyan, gold, purple, magenta, lime, grey
- Fontes: Inter + JetBrains Mono
- Regra completa: `.claude/rules/design-system-ia-avancada.md`

---

*PRD-MARKETPLACE v1.0 — Rascunho para aprovacao*
