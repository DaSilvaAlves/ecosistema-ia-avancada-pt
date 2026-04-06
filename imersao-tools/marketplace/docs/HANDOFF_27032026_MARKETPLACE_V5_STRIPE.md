# HANDOFF — Marketplace v5 (Stripe) | 27/03/2026

## CONTEXTO

Sessao com @aiox-master (Orion). Integração Stripe Checkout para pagamento do Clone Alex Hormozi.
Continuação do HANDOFF_27032026_MARKETPLACE_V4.md.

**Branch:** `main`
**Ultimo commit pushed (repo pai):** `66f11b009` — feat: Stripe Checkout operacional — Clone Hormozi a 8 EUR
**Ultimo commit pushed (comunidade):** `726eef2` — fix: Stripe Checkout funcional — fetch nativo + preço one-time

---

## O QUE FOI FEITO NESTA SESSAO

| # | Accao | Estado |
|---|-------|--------|
| 1 | Criação de 2 API serverless functions (Vercel Functions) | Feito e pushed |
| 2 | `api/create-checkout.js` — cria sessão Stripe Checkout | Operacional |
| 3 | `api/verify-checkout.js` — verifica pagamento e devolve metadata | Operacional |
| 4 | Actualização `squad-detalhe.html` — botão Comprar redireciona para Stripe | Feito e pushed |
| 5 | Actualização `squad-sucesso.html` — verifica pagamento e regista compra | Feito e pushed |
| 6 | Criação do preço one-time no Stripe (8,00 EUR) | Feito via API |
| 7 | Campo `stripe_price_id` adicionado à tabela `squads` | Feito pelo Eurico |
| 8 | Campo `stripe_session_id` adicionado à tabela `squad_compras` | Feito pelo Eurico |
| 9 | Environment variable `STRIPE_SECRET_KEY` configurada no Vercel | Feito (production + preview + development) |
| 10 | Mensagem "apenas squads gratuitos disponíveis" removida | Feito |
| 11 | Endpoint de teste `api/test-stripe.js` removido | Feito |

---

## PROBLEMAS ENCONTRADOS E RESOLVIDOS

### 1. Stripe SDK incompatível com Vercel Serverless

| Detalhe | Valor |
|---------|-------|
| Problema | SDK Stripe (v14 e v17) dava erro "connection to Stripe" no Vercel |
| Causa | Incompatibilidade do SDK com o runtime Node.js 24 do Vercel |
| Solução | Substituir SDK por `fetch` nativo — chamadas directas à API REST do Stripe |
| Resultado | 100% funcional sem dependências externas |

### 2. Preço criado como recorrente

| Detalhe | Valor |
|---------|-------|
| Problema | Price ID original (`price_1TFOcFLmnaR4OylvSP6Gvx8C`) era subscription (recorrente) |
| Causa | Criado no Stripe Dashboard sem seleccionar "One time" |
| Solução | Criado novo preço one-time via API Stripe |
| Novo Price ID | `price_1TFQAtLmnaR4OylvoxPKiy0T` |
| Resultado | Checkout funciona como pagamento único |

---

## ARQUITECTURA STRIPE IMPLEMENTADA

```
Membro clica "Comprar — 8,00 EUR"
    |
    v
Frontend: POST /api/create-checkout
    |  (envia priceId, squadSlug, squadId, userId)
    v
Vercel Function: cria sessão Stripe Checkout
    |  (fetch nativo → api.stripe.com)
    v
Redirect para checkout.stripe.com
    |  (membro preenche cartão e paga)
    v
Stripe redireciona para squad-sucesso.html
    |  (com session_id e squad_id nos URL params)
    v
Frontend: POST /api/verify-checkout
    |  (verifica se pagamento foi real)
    v
Regista compra em squad_compras (Supabase)
    |  (preco_pago, moeda, stripe_session_id)
    v
Membro descarrega ZIP
```

### Ficheiros criados/alterados

| Ficheiro | Tipo | Descrição |
|----------|------|-----------|
| `comunidade/api/create-checkout.js` | Novo | Cria sessão Stripe Checkout (fetch nativo) |
| `comunidade/api/verify-checkout.js` | Novo | Verifica pagamento com Stripe |
| `comunidade/package.json` | Novo | Package vazio (sem dependências — usa fetch nativo) |
| `comunidade/squad-detalhe.html` | Alterado | `iniciarCompra()` chama API em vez de mostrar mensagem |
| `comunidade/squad-sucesso.html` | Alterado | `verifyAndRecordPurchase()` verifica e regista compra |
| `marketplace/pages/squad-detalhe.html` | Alterado | Sync com comunidade |

### Colunas adicionadas ao Supabase

| Tabela | Coluna | Tipo | Descrição |
|--------|--------|------|-----------|
| `squads` | `stripe_price_id` | TEXT | Price ID do Stripe (só para produtos pagos) |
| `squad_compras` | `stripe_session_id` | TEXT | Session ID do Stripe (prova de pagamento) |

### Environment Variables (Vercel)

| Key | Environments | Descrição |
|-----|-------------|-----------|
| `STRIPE_SECRET_KEY` | production, preview, development | Chave secreta Stripe (sk_live_...) |

---

## ESTADO ACTUAL COMPLETO

### Paginas (comunidade — deployed no Vercel)

| Pagina | Estado | Funcionalidades |
|--------|--------|-----------------|
| squads.html | Operacional | Listagem, filtros, pesquisa, fallback sem view |
| squad-detalhe.html | Operacional | Detalhe, compra grátis, compra paga (Stripe), download ZIP, guia instalação, markdown parser |
| squad-sucesso.html | Operacional | Verificação pagamento Stripe, registo compra, download ZIP |
| config.js | Operacional | Supabase client, auth, getProfile |

### API Serverless (Vercel Functions)

| Endpoint | Método | Descrição | Estado |
|----------|--------|-----------|--------|
| `/api/create-checkout` | POST | Cria sessão Stripe Checkout | Operacional |
| `/api/verify-checkout` | POST | Verifica pagamento Stripe | Operacional |

### Supabase

| Recurso | Estado |
|---------|--------|
| 4 tabelas (categorias, squads, compras, downloads) | Operacionais |
| 13 produtos (12 grátis + 1 pago) | Publicados |
| 9 categorias | Activas |
| View v_squad_catalogo | Operacional |
| Bucket squad-files | 13 pastas com ZIPs |
| Bucket squad-images | Operacional |
| RLS policies | Todas activas |
| Trigger increment_downloads | Activo |
| Campo stripe_price_id (squads) | Operacional |
| Campo stripe_session_id (squad_compras) | Operacional |

### Stripe

| Recurso | Valor |
|---------|-------|
| Conta | euricojsalves (live, activa há 10+ anos) |
| Produto | Clone Alex Hormozi |
| Price ID (one-time) | `price_1TFQAtLmnaR4OylvoxPKiy0T` |
| Price ID antigo (recorrente — NÃO usar) | `price_1TFOcFLmnaR4OylvSP6Gvx8C` |
| Valor | 8,00 EUR |
| Secret Key no Vercel | Configurada (3 environments) |

### Fluxo de compra — o que acontece

**Ao membro:**
1. Clica "Comprar — 8,00 EUR"
2. Redireccionado para Stripe Checkout (página hosted pelo Stripe)
3. Preenche dados do cartão e paga
4. Redireccionado para squad-sucesso.html
5. Pagamento verificado automaticamente com Stripe
6. Compra registada no Supabase
7. Botão "Transferir ZIP" disponível
8. Se voltar ao produto mais tarde, vê "Transferir ZIP" (já comprou)

**Ao Eurico:**
1. Dinheiro na conta Stripe (menos taxa ~2,9% + 0,25 EUR)
2. Stripe Dashboard → Payments: cada pagamento com metadata (squad_id, user_id)
3. Supabase → squad_compras: registo com user, preço, stripe_session_id
4. Supabase → squad_downloads: registo de cada download

---

## MELHORIAS FUTURAS

### Prioridade ALTA (antes de escalar vendas)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 1 | Webhook Stripe | Endpoint server-side que recebe notificações do Stripe (payment_intent.succeeded). Garante que a compra é registada mesmo se o membro fechar o browser antes de chegar à página de sucesso. | Médio |
| 2 | Emails de confirmação | Activar no Stripe Dashboard → Settings → Customer emails. O Stripe envia recibo automático ao membro. | Baixo (configuração) |
| 3 | Termos de serviço | Página com termos de venda de produtos digitais (sem reembolso, licença de uso, RGPD). O botão já refere "aceitas os termos de servico" mas a página não existe. | Baixo |

### Prioridade MEDIA (melhorias de experiência)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 4 | Página "A minha biblioteca" | Listar todos os squads adquiridos pelo membro (grátis + pagos) com botões de download. A página `meus-squads.html` já existe na nav mas precisa de ser verificada. | Médio |
| 5 | Mais produtos pagos | Quando quiseres vender mais clones/squads, basta: criar produto no Stripe, obter Price ID, UPDATE no Supabase (`stripe_price_id`), definir preço > 0. Zero código novo. | Baixo |
| 6 | Screenshots/imagens de capa | 13 produtos têm imagens geradas mas poderiam ter screenshots reais ou mockups mais específicos. | Baixo (editorial) |
| 7 | Copy das descrições | Refinamento editorial das descrições curtas e longas seguindo o brandbook. | Baixo (editorial) |

### Prioridade BAIXA (futuro)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 8 | Painel de vendas | Dashboard interno com métricas: receita total, vendas por produto, downloads, conversão. | Alto |
| 9 | Cupões de desconto | Stripe Coupons API — criar códigos de desconto para promoções. | Médio |
| 10 | Pacotes/bundles | Vender conjuntos de squads com desconto. | Médio |
| 11 | Facturação automática | Integrar com sistema de facturação PT (obrigatório para vendas a consumidores PT). | Alto |

---

## SEGURANCA — ACÇÕES PENDENTES

| # | Acção | Prioridade | Estado |
|---|-------|-----------|--------|
| 1 | Revogar chave OpenAI antiga (...8A) | CRITICA | Pendente — Eurico |
| 2 | Ficheiro `.env` no marketplace NÃO deve ser commitado | ALTA | Verificar .gitignore |
| 3 | Price ID antigo (recorrente) deve ser desactivado no Stripe | BAIXA | Pendente |

---

## COMO ADICIONAR UM NOVO PRODUTO PAGO

Para o Eurico ou próximo agente, o processo é:

1. Criar produto no Stripe Dashboard → Products → + Add product
2. Definir preço como **One time** (pagamento único) — valor terminado em 8
3. Copiar o Price ID (`price_...`)
4. No Supabase SQL Editor:
```sql
UPDATE squads SET preco = 18.00, stripe_price_id = 'price_NOVO_ID' WHERE slug = 'slug-do-squad';
```
5. Testar no browser
6. Zero código novo necessário

---

## DIRECTORIO DE TRABALHO

```
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\marketplace
```

**Comunidade (deployed):**
```
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\comunidade
```

**URL live:** https://comunidade-ia-avancada.vercel.app/squads.html

---

## HISTORICO DE COMMITS (marketplace + comunidade)

| Hash | Mensagem |
|------|----------|
| `66f11b009` | feat: Stripe Checkout operacional — Clone Hormozi a 8 EUR |
| `80a15f089` | feat: Stripe Checkout — pagamento Clone Hormozi integrado |
| `12320cc28` | docs: handoff marketplace v4 — erro push + estado real |
| `5d250a8d4` | fix: marketplace resiliente — fallback view + sync comunidade |
| `527f3fda0` | docs: handoff marketplace v3 — autocritica e registo de erros |
| `2a53d0678` | fix: marketplace pages — 5 bugs corrigidos nas 3 paginas |
| `11ee7759b` | feat: marketplace deploy — config.js + paginas na comunidade + handoff |
| `e3acb2fd7` | feat: marketplace v2 — arquitectura, schema, seed, paginas limpas |
| `1969912a6` | docs: criar 14 PRDs do marketplace + regra de governance |
| `f2c21c36a` | chore: consolidar marketplace numa pasta unica + handoff |

---

*Handoff — 27/03/2026 — @aiox-master (Orion)*
*Stripe Checkout integrado e operacional. Marketplace pronto para lançamento.*
