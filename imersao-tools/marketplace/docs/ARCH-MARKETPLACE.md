# ARCH-MARKETPLACE — Arquitectura do Marketplace [IA]AVANCADA PT

**Versao:** 2.0
**Data:** 26/03/2026
**Autor:** Aria (Architect Agent)
**Referencia:** PRD-MARKETPLACE.md (v1.0, 26/03/2026)
**Estado:** Aprovado para implementacao

---

## 1. Visao Geral

### 1.1 O que e o marketplace

O marketplace e uma seccao da comunidade [IA]AVANCADA PT onde membros autenticados encontram, exploram e adquirem produtos do ecosistema. Nao e uma plataforma independente — e um modulo HTML standalone integrado na sidebar do dashboard.

**Restricoes de acesso:**
- Apenas membros autenticados (sessao Supabase valida)
- Apenas a equipa [IA]AVANCADA PT vende — sem terceiros

### 1.2 Stack de lancamento

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Frontend | HTML standalone + vanilla JS | Sem bundler, sem framework |
| BaaS | Supabase (Auth + PostgREST + Storage + RLS) | Unica dependencia de backend |
| CDN JS | `@supabase/supabase-js@2` via jsdelivr | Sem npm, sem build |
| Deploy | Vercel (static) | Sem servidor proprio |
| Pagamentos | Stripe (fase 2 — nao implementado) | Reservado para clones pagos |

### 1.3 Principios arquitecturais

| Principio | Aplicacao |
|-----------|-----------|
| HTML standalone | Cada pagina e um ficheiro `.html` autocontido — sem bundler, sem build step |
| Supabase como BaaS | Auth, API REST, Storage e RLS sao geridos pelo Supabase — zero backend proprio |
| Client-side first | Toda a logica de negocio e no browser via PostgREST. Edge Functions apenas para operacoes que exigem service role (fase 2) |
| RLS como seguranca | A autorizacao esta nas politicas RLS do PostgreSQL — o cliente nunca acede a dados que nao lhe pertencem |
| Zero acoplamento com dashboard | O marketplace NAO partilha estado, stores ou componentes com o dashboard da comunidade |

### 1.4 Diagrama de arquitectura

```
+--------------------------------------------------+
|  Browser (membro autenticado)                    |
|                                                  |
|  squads.html  squad-detalhe.html  squad-sucesso.html  |
|       |              |                  |         |
|   supabase-js@2 (CDN jsdelivr)                   |
+--------------------------------------------------+
         |                    |
         v                    v
+-------------------+  +--------------------+
|  Supabase Auth    |  |  PostgREST (API)   |
|  (sessao JWT)     |  |  squad_categorias  |
+-------------------+  |  squads            |
                       |  squad_compras     |
                       |  squad_downloads   |
                       |  v_squad_catalogo  |
                       +--------------------+
                                |
                       +--------------------+
                       |  PostgreSQL RLS     |
                       |  is_admin()        |
                       |  auth.uid()        |
                       +--------------------+
                                |
                       +--------------------+
                       |  Storage           |
                       |  squad-files (priv)|
                       |  squad-images (pub)|
                       +--------------------+

         [FASE 2 — nao implementado]
         +--------------------+
         |  Edge Functions    |
         |  stripe-checkout   |
         |  stripe-webhook    |
         |  squad-download    |
         +--------------------+
                   |
         +--------------------+
         |  Stripe API        |
         +--------------------+
```

---

## 2. Schema da Base de Dados

### 2.1 Diagrama de entidades (scope de lancamento)

```
squad_categorias
  id (PK)
  nome
  descricao
  icon
  slug (UNIQUE)
  ordem

       |
       | 1:N
       v

squads
  id (PK)
  titulo
  descricao_curta
  descricao_longa
  guia_instalacao      <- NOVO v2: guia integrado em markdown
  slug (UNIQUE)
  categoria_id (FK)
  preco
  autor_id (FK auth.users)
  zip_path
  imagem_capa
  tags[]
  agentes (jsonb)
  total_downloads
  status               (draft | published | unlisted)
  created_at
  updated_at

       |                          |
       | 1:N                      | 1:N
       v                          v

squad_compras                squad_downloads
  id (PK)                      id (PK)
  squad_id (FK)                squad_id (FK)
  user_id (FK auth.users)      user_id (FK auth.users)
  preco_pago                   compra_id (FK squad_compras)
  moeda                        downloaded_at
  stripe_session_id
  stripe_payment_intent
  status
  created_at
```

### 2.2 Tabelas e campos

#### squad_categorias

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | gen_random_uuid() |
| nome | text NOT NULL | Nome visivel no catalogo |
| descricao | text | Descricao curta da categoria |
| icon | text | Nome do icone (ex: 'robot') |
| slug | text NOT NULL UNIQUE | URL-friendly, ex: 'squads-aiox' |
| ordem | int NOT NULL DEFAULT 0 | Ordenacao no catalogo |
| created_at | timestamptz NOT NULL | Data de criacao |

**Categorias de lancamento (2 apenas):**

| Nome | Slug | Tipo | Preco |
|------|------|------|-------|
| Squads AIOX | squads-aiox | Equipas de agentes IA especializados | Gratuito |
| Clones de Mentes | clones-mentes | Replicas de personalidades adaptadas PT | Pago (fase 2) |

#### squads

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | gen_random_uuid() |
| titulo | text NOT NULL | Nome do produto |
| descricao_curta | text NOT NULL | Max 300 chars — usado no card |
| descricao_longa | text NOT NULL | Markdown — seccao "O que e" |
| guia_instalacao | text NOT NULL | **NOVO v2** — Markdown com passo-a-passo integrado |
| slug | text NOT NULL UNIQUE | URL-friendly |
| categoria_id | uuid FK NOT NULL | Referencia squad_categorias |
| preco | numeric(10,2) NOT NULL DEFAULT 0 | Precos terminam em 8 (ex: 0, 8, 18, 48) |
| autor_id | uuid FK NOT NULL | auth.users — admin que criou |
| zip_path | text NOT NULL | Caminho no bucket squad-files |
| imagem_capa | text | URL publica do bucket squad-images |
| tags | text[] DEFAULT '{}' | Tags de pesquisa |
| agentes | jsonb NOT NULL DEFAULT '[]' | Lista: [{nome, papel, descricao}] |
| total_downloads | int NOT NULL DEFAULT 0 | Contador (incrementado por trigger) |
| status | text NOT NULL DEFAULT 'draft' | draft / published / unlisted |
| created_at | timestamptz NOT NULL | Data de criacao |
| updated_at | timestamptz NOT NULL | Auto-actualizado por trigger |

**Campos removidos em relacao a v1 (001-squadmarket.sql):**

| Campo removido | Razao |
|----------------|-------|
| score_seguranca | Sistema de validacao automatica — fora do scope de lancamento |
| validacao_detalhes | Dependente de score_seguranca |
| rating_medio | Reviews fora do scope (squad_reviews eliminada) |
| total_reviews | Reviews fora do scope |

#### squad_compras

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | gen_random_uuid() |
| squad_id | uuid FK NOT NULL | Referencia squads |
| user_id | uuid FK NOT NULL | auth.users |
| preco_pago | numeric(10,2) NOT NULL | 0 para squads gratuitos |
| moeda | text NOT NULL DEFAULT 'EUR' | Moeda do pagamento |
| stripe_session_id | text | NULL para gratuitos |
| stripe_payment_intent | text | NULL para gratuitos |
| status | text NOT NULL DEFAULT 'completed' | pending / completed / failed |
| created_at | timestamptz NOT NULL | Data da compra |

**UNIQUE(squad_id, user_id)** — um membro so "compra" cada squad uma vez.

#### squad_downloads

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | gen_random_uuid() |
| squad_id | uuid FK NOT NULL | Referencia squads |
| user_id | uuid FK NOT NULL | auth.users |
| compra_id | uuid FK NOT NULL | Referencia squad_compras |
| downloaded_at | timestamptz NOT NULL | Data do download |

### 2.3 View: v_squad_catalogo

View de conveniencia para a pagina de listagem. Junta squads com categorias e filtra apenas os publicados.

```sql
SELECT
  s.id, s.titulo, s.descricao_curta, s.slug, s.preco,
  s.total_downloads, s.imagem_capa, s.tags, s.status,
  s.guia_instalacao, s.created_at,
  sc.nome AS categoria_nome,
  sc.slug AS categoria_slug,
  sc.icon AS categoria_icon
FROM public.squads s
JOIN public.squad_categorias sc ON sc.id = s.categoria_id
WHERE s.status = 'published';
```

### 2.4 Tabelas eliminadas em relacao a v1

| Tabela | Razao da eliminacao |
|--------|---------------------|
| squad_reviews | Reviews nao definidas — fora do scope (PRD, seccao 8) |
| xp_transactions | Gamificacao XP descartada pelo Eurico (incidente 23/03) |

---

## 3. Politicas RLS

### Funcao auxiliar

```sql
is_admin() -> boolean
```

Verifica `request.jwt.claims -> 'app_metadata' ->> 'role' = 'admin'`.
Usada em todas as policies de escrita admin.

### squad_categorias

| Operacao | Quem pode | Condicao |
|----------|-----------|----------|
| SELECT | Todos (anonimo + autenticado) | `true` |
| INSERT | Admin | `is_admin()` |
| UPDATE | Admin | `is_admin()` |
| DELETE | Admin | `is_admin()` |

### squads

| Operacao | Quem pode | Condicao |
|----------|-----------|----------|
| SELECT (published) | Todos | `status = 'published'` |
| SELECT (unlisted) | Compradores + Admin | Compra completed existente OU `is_admin()` |
| SELECT (draft) | Admin | `is_admin()` |
| INSERT | Admin | `is_admin()` |
| UPDATE | Admin | `is_admin()` |
| DELETE | Admin | `is_admin()` |

**Nota:** a policy SELECT de squads e criada em dois passos — uma policy temporaria simples durante a criacao da tabela, substituida pela policy completa (com subquery em squad_compras) apos squad_compras ser criada.

### squad_compras

| Operacao | Quem pode | Condicao |
|----------|-----------|----------|
| SELECT | Proprio membro + Admin | `auth.uid() = user_id OR is_admin()` |
| INSERT | Membro autenticado (squads gratuitos) | `auth.uid() = user_id AND preco_pago = 0 AND status = 'completed'` |
| INSERT (pagos) | Service role (Edge Function, fase 2) | Contorna RLS via service role |
| UPDATE | Admin | `is_admin()` |
| DELETE | Admin | `is_admin()` |

### squad_downloads

| Operacao | Quem pode | Condicao |
|----------|-----------|----------|
| SELECT | Proprio membro + Admin | `auth.uid() = user_id OR is_admin()` |
| INSERT | Membro com compra valida | `auth.uid() = user_id AND compra completed existe` |

---

## 4. Storage

### Buckets

| Bucket | Visibilidade | Limite | Tipos MIME | Finalidade |
|--------|-------------|--------|-----------|-----------|
| squad-files | Privado | 50 MB | application/zip, application/x-zip-compressed | Ficheiros ZIP dos produtos |
| squad-images | Publico | 5 MB | image/jpeg, image/png, image/webp, image/svg+xml | Imagens de capa dos produtos |

### Politicas de storage

**squad-files (privado):**

| Operacao | Quem pode |
|----------|-----------|
| INSERT | Admin |
| UPDATE | Admin |
| SELECT | Via signed URL gerado por Edge Function (fase 2) — nao requer policy RLS para signed URLs |
| DELETE | Admin |

**squad-images (publico):**

| Operacao | Quem pode |
|----------|-----------|
| SELECT | Todos (bucket publico) |
| INSERT | Admin |
| UPDATE | Admin |
| DELETE | Admin |

### Acesso a ficheiros ZIP

No lancamento, os downloads de ficheiros ZIP sao geridos diretamente pelo admin (link manual ou acesso direto). A geracao automatica de signed URLs via Edge Function e fase 2.

---

## 5. Edge Functions (fase 2 — nao implementado)

Documentadas aqui para referencia futura. **Nenhuma destas funcoes deve ser implementada no lancamento.**

### stripe-checkout

**Proposito:** Criar uma sessao de pagamento Stripe para produtos pagos.

**Trigger:** membro clica "Comprar" num clone pago.

**Fluxo:**
```
Browser → Edge Function stripe-checkout
  → Valida autenticacao (JWT)
  → Valida que squad existe e e pago
  → Cria Stripe Checkout Session
  → Retorna session URL
  → Browser redireciona para Stripe
```

**Campos usados:** `stripe_session_id` em squad_compras (status='pending').

### stripe-webhook

**Proposito:** Processar confirmacao de pagamento do Stripe.

**Trigger:** Stripe envia evento `checkout.session.completed`.

**Fluxo:**
```
Stripe → Edge Function stripe-webhook
  → Valida assinatura do webhook
  → Actualiza squad_compras (status='completed')
  → Regista squad_downloads inicial
  → Retorna 200
```

**Requer service role** — contorna RLS para INSERT em squad_compras (pagos).

### squad-download

**Proposito:** Gerar signed URL temporario para download do ZIP.

**Trigger:** membro clica "Descarregar" na pagina de sucesso ou detalhe.

**Fluxo:**
```
Browser → Edge Function squad-download
  → Valida autenticacao (JWT)
  → Verifica compra completed (squad_compras)
  → Gera signed URL (60 min) via service role
  → Regista em squad_downloads
  → Retorna URL assinado
  → Browser inicia download
```

---

## 6. Paginas

### Paginas de lancamento (3)

| Ficheiro | Funcao | Rota sugerida |
|----------|--------|---------------|
| `pages/squads.html` | Listagem por categorias com filtros | `/marketplace` ou `/squads` |
| `pages/squad-detalhe.html` | Detalhe de produto com guia integrado | `/squads/{slug}` |
| `pages/squad-sucesso.html` | Pagina de sucesso pos-instalacao/compra | `/squads/{slug}/sucesso` |

### Paginas depreciadas (eliminar)

| Ficheiro | Estado | Accao |
|----------|--------|-------|
| `pages/guia-squads.html` | Depreciado | Conteudo migrado para `squad-detalhe.html` via campo `guia_instalacao`. Eliminar ficheiro. |
| `pages/guia-clone-hormozi.html` | Depreciado | Conteudo migrado para `squad-detalhe.html` via campo `guia_instalacao`. Eliminar ficheiro. |

### Logica de paginas

**squads.html:**
- Carrega categorias via `v_squad_catalogo`
- Filtro por categoria (client-side)
- Cada card mostra: imagem, titulo, descricao_curta, badge (gratis/pago), total_downloads
- Link para `squad-detalhe.html?slug={slug}`

**squad-detalhe.html:**
- Recebe `?slug=` por URL param
- Carrega squad via PostgREST (`squads?slug=eq.{slug}`)
- Mostra: header, descricao_longa, `guia_instalacao` (renderizado como markdown)
- Botao "Instalar" (gratis): INSERT em squad_compras + redirect para sucesso
- Botao "Comprar" (pago, fase 2): chama Edge Function stripe-checkout

**squad-sucesso.html:**
- Recebe `?squad_id=` ou `?slug=`
- Confirma a compra/instalacao
- Mostra link de volta para o guia (ancora em squad-detalhe.html)
- Sugere proximo passo

### CDN e dependencias

```html
<!-- Supabase JS via CDN — unica dependencia externa -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

Sem npm. Sem bundler. Sem build step.

### Design system

Todas as paginas seguem o design system [IA]AVANCADA PT sem excepcoes:

| Token | Valor |
|-------|-------|
| Background | `#04040A` |
| Texto principal | `#F0F4FF` |
| Cyan (accao primaria) | `#00F5FF` |
| Gold (premium) | `#FFB800` |
| Purple (IA/tech) | `#9D00FF` |
| Magenta (erro/urgencia) | `#FF006E` |
| Lime (sucesso) | `#39FF14` |
| Fonte body/UI | Inter |
| Fonte codigo/badges | JetBrains Mono |

Cards com glassmorphism:
```css
background: rgba(255,255,255,0.025);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 12px;
backdrop-filter: blur(12px);
```

---

## 7. Registo de decisoes

| # | Decisao | Razao | Alternativa rejeitada |
|---|---------|-------|-----------------------|
| D1 | Guia de instalacao como campo `guia_instalacao text` na tabela squads | PRD define que o guia faz parte da pagina de detalhe — cada produto e auto-contido | Paginas de guia separadas (guia-squads.html, guia-clone-hormozi.html) — eliminadas |
| D2 | Apenas 2 categorias no lancamento | PRD define categorias de lancamento: Squads AIOX (gratis) e Clones de Mentes (pago). As 8 categorias da migration 001 eram do PRD-SQUADMARKET.md depreciado | 8 categorias do 001-squadmarket.sql — inventadas sem aprovacao |
| D3 | Eliminar squad_reviews | PRD seccao 8: "Avaliacao/reviews de produtos — Nao definido — fora do scope" | Manter para uso futuro — rejeitado por adicionar complexidade sem PRD |
| D4 | Eliminar xp_transactions | PRD seccao 8: "Gamificacao XP/N1-N4 — Descartada — inventada sem aprovacao" (incidente 23/03) | Manter sistema XP — rejeitado pelo Eurico explicitamente |
| D5 | Remover score_seguranca e validacao_detalhes | Sistema de validacao automatica sem PRD — fora do scope de lancamento | Manter para auditoria — rejeitado por nao estar no PRD |
| D6 | Remover rating_medio e total_reviews de squads | Reviews eliminadas (D3) — campos tornaram-se orphans | Cache denormalizado — rejeitado porque a origem (squad_reviews) foi eliminada |
| D7 | Manter total_downloads | Metrica util de tracking — nao depende de reviews | Remover para simplificar — rejeitado, total_downloads e tracking valido |
| D8 | Stripe em fase 2 | PRD seccao 4: "Pagamentos NAO fazem parte do scope de lancamento" | Implementar desde o inicio — rejeitado, aumenta risco de lancamento |
| D9 | HTML standalone sem bundler | Consistente com o resto das ferramentas do ecosistema (imersao-tools) | React/Next.js — overhead desnecessario para 3 paginas estaticas |
| D10 | is_admin() via JWT app_metadata | Padrao Supabase para roles de admin sem tabela adicional | Tabela profiles.role — rejeitado, JWT e mais performante (sem query adicional) |

---

*ARCH-MARKETPLACE v2.0 — Aria (Architect Agent) — 26/03/2026*
*Referencia: PRD-MARKETPLACE.md — NAO basear em PRD-SQUADMARKET.md (depreciado)*
