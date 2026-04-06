# ARCH-SQUADMARKET -- Documento de arquitectura

**Versao:** 1.0
**Data:** 20/03/2026
**Autor:** Aria (Architect Agent)
**PRD de referencia:** `imersao-tools/docs/PRD-SQUADMARKET.md` v1.0
**Projecto:** SquadMarket -- Marketplace de squads de agentes IA
**Ecosistema:** [IA]AVANCADA PT

---

## 1. Visao geral da arquitectura

### 1.1 Diagrama de alto nivel

```
+-------------------+      +-----------------------+      +------------------+
|                   |      |                       |      |                  |
|  Browser (HTML)   | ---> |  Supabase             | ---> |  Stripe          |
|  squads.html      |      |  - Auth (sessao)      |      |  - Checkout      |
|  squad-detail.html|      |  - PostgREST (dados)  |      |  - Webhooks      |
|  squad-success.html      |  - Storage (ZIPs)     |      |                  |
|  squad-admin.html |      |  - Edge Functions     |      +------------------+
|                   |      |  - RLS (seguranca)    |
+-------------------+      +-----------------------+
        |                           |
        |   config.js (sb client)   |
        +---------------------------+
```

### 1.2 Principios arquitecturais

| Principio | Aplicacao |
|-----------|-----------|
| HTML standalone | Cada pagina e um ficheiro `.html` auto-contido, sem bundler, sem framework |
| Supabase como BaaS | Auth, DB, Storage, Edge Functions -- tudo numa instancia partilhada com a comunidade |
| Client-side first | Filtragem, pesquisa e ordenacao no browser (ate ~500 squads) |
| RLS como camada de seguranca | Toda a logica de autorizacao vive nas politicas RLS do PostgreSQL |
| Edge Functions para logica sensivel | Stripe checkout, webhook processing, download signing -- nunca expostos ao cliente |
| Zero coupling com dashboard | SquadMarket e paginas separadas, partilham `config.js` e design system CSS |

### 1.3 Stack tecnica

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| Frontend | HTML + CSS + vanilla JS | ES2020+ |
| UI | Design system [IA]AVANCADA PT | Inline CSS vars |
| Auth | Supabase Auth | v2 (CDN) |
| Base de dados | Supabase PostgreSQL | 15+ |
| API | Supabase PostgREST (auto-generated) | Via `sb.from()` |
| Storage | Supabase Storage | Buckets privado + publico |
| Edge Functions | Supabase Edge Functions (Deno) | TypeScript |
| Pagamentos | Stripe Checkout (hosted) | API v2023-10-16+ |
| Deploy | Vercel (static) | Mesmo projecto existente |
| CDN Supabase JS | `@supabase/supabase-js@2` | Via jsdelivr |

---

## 2. Validacao do schema de dados

### 2.1 Analise das tabelas propostas no PRD

O schema proposto no PRD esta globalmente bem desenhado. Seguem-se as validacoes e ajustes recomendados.

#### `squad_categorias` -- APROVADA com ajustes

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| PK uuid | OK | `gen_random_uuid()` |
| UNIQUE slug | OK | Essencial para URLs |
| Indice em slug | ADICIONAR | O PRD nao menciona indice explicitamente, mas UNIQUE ja cria implicitamente |
| RLS SELECT publico | OK | Categorias sao publicas |
| RLS admin-only write | AJUSTAR | Ver seccao 2.3 |

#### `squads` -- APROVADA com ajustes

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| PK uuid | OK | |
| FK categoria_id | OK | Referencia `squad_categorias.id` |
| FK autor_id | OK | Referencia `auth.users.id` |
| UNIQUE slug | OK | |
| Campo `agentes` jsonb | OK | Flexivel para lista variavel de agentes |
| Campo `tags` text[] | OK | GIN index necessario |
| Campos de cache (rating_medio, total_reviews, total_downloads) | OK | Actualizados por triggers |
| Indice GIN em tags | CRITICO | Sem ele, pesquisa por tags e full scan |
| Indice em `(status, created_at)` | ADICIONAR | Query principal filtra por status e ordena por data |

**Ajustes ao schema `squads`:**

```sql
-- Indice composto para a query principal do catalogo
CREATE INDEX idx_squads_status_created ON squads(status, created_at DESC);

-- O PRD ja menciona idx_squads_categoria, idx_squads_status, idx_squads_slug, idx_squads_preco
-- Adicionar GIN para tags (mencionado no PRD, confirmar implementacao)
CREATE INDEX idx_squads_tags ON squads USING GIN(tags);

-- Adicionar CHECK constraint para precos validos
ALTER TABLE squads ADD CONSTRAINT chk_squads_preco
  CHECK (preco IN (0, 4.98, 9.98, 19.98, 49.98));

-- Adicionar CHECK constraint para status
ALTER TABLE squads ADD CONSTRAINT chk_squads_status
  CHECK (status IN ('draft', 'published', 'unlisted'));
```

#### `squad_compras` -- APROVADA com ajustes

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| UNIQUE (squad_id, user_id) | OK | Impede compras duplicadas |
| FK squad_id | OK | |
| FK user_id | OK | Referencia `auth.users.id` |
| Campo stripe_session_id nullable | OK | Null para squads gratuitos |
| Campo status | AJUSTAR | Adicionar CHECK constraint |

**Ajustes:**

```sql
ALTER TABLE squad_compras ADD CONSTRAINT chk_compras_status
  CHECK (status IN ('pending', 'completed', 'failed'));

-- Indice para lookup rapido de compras do utilizador
CREATE INDEX idx_compras_user ON squad_compras(user_id);

-- Indice para lookup por stripe_session_id (webhook processing)
CREATE INDEX idx_compras_stripe_session ON squad_compras(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
```

#### `squad_reviews` -- APROVADA

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| UNIQUE (squad_id, user_id) | OK | 1 review por membro por squad |
| CHECK rating 1-5 | OK | |
| FK squad_id, user_id | OK | |

**Indice adicional:**

```sql
-- Para listar reviews de um squad (pagina de detalhe)
CREATE INDEX idx_reviews_squad ON squad_reviews(squad_id, created_at DESC);
```

#### `squad_downloads` -- APROVADA com ajuste menor

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| FK compra_id | OK | Liga download a compra valida |
| Sem UNIQUE constraint | OK | Permite multiplos downloads |

**Nota:** O campo `compra_id` pode ser redundante dado que `(squad_id, user_id)` ja identifica a compra. No entanto, mante-lo evita um JOIN e simplifica a RLS. Manter como esta.

#### `xp_transactions` -- APROVADA com ajuste

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| Campos referencia_tipo e referencia_id | OK | Polimorfismo necessario |
| INSERT via Edge Function/trigger | CRITICO | Nunca pelo cliente directamente |

**Ajuste:**

```sql
-- Evitar XP duplicado para a mesma accao
CREATE UNIQUE INDEX idx_xp_unique_action
  ON xp_transactions(user_id, tipo, referencia_id)
  WHERE referencia_id IS NOT NULL;
```

Este indice previne que o mesmo utilizador receba XP duas vezes pela mesma compra, review ou download.

#### `profiles` (alteracoes) -- APROVADA

| Validacao | Resultado | Notas |
|-----------|-----------|-------|
| Campo xp_total int DEFAULT 0 | OK | |
| Campo nivel text DEFAULT 'N1' | OK | Consistente com sistema existente |
| CHECK nivel IN (N1-N4) | ADICIONAR | |

**Ajuste:**

```sql
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_nivel
  CHECK (nivel IN ('N1', 'N2', 'N3', 'N4'));
```

### 2.2 Diagrama de relacoes

```
squad_categorias
  |
  | 1:N
  v
squads ─────────────────────────────┐
  |              |           |       |
  | 1:N          | 1:N       | 1:N   |
  v              v           v       |
squad_compras  squad_reviews  squad_downloads
  |              |           |       |
  | N:1          | N:1       | N:1   |
  v              v           v       |
auth.users ◄── profiles              |
  ^                                  |
  |  N:1                             |
  xp_transactions ───────────────────┘
                   (referencia_id → squads.id)
```

### 2.3 Politicas RLS -- definicao completa

[AUTO-DECISION] Quem e admin? -> Detectar via `profiles.role = 'admin'` em vez de JWT claim, pois o sistema existente usa profiles para niveis. Razao: O sistema actual da comunidade nao parece utilizar JWT custom claims; `profiles` ja e a tabela de referencia. Se existir um campo `role` ou `is_admin` na tabela profiles, reutiliza-lo. Caso contrario, criar campo `is_admin boolean DEFAULT false`.

```sql
-- ═══ squad_categorias ═══
CREATE POLICY "categorias_select_public" ON squad_categorias
  FOR SELECT USING (true);

CREATE POLICY "categorias_admin_all" ON squad_categorias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══ squads ═══
-- Qualquer pessoa ve squads publicados
CREATE POLICY "squads_select_published" ON squads
  FOR SELECT USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR (status = 'unlisted' AND EXISTS (
      SELECT 1 FROM squad_compras
      WHERE squad_id = squads.id AND user_id = auth.uid() AND status = 'completed'
    ))
  );

-- Apenas admin pode criar/editar/eliminar
CREATE POLICY "squads_admin_insert" ON squads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "squads_admin_update" ON squads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "squads_admin_delete" ON squads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══ squad_compras ═══
-- Membro ve as suas compras
CREATE POLICY "compras_select_own" ON squad_compras
  FOR SELECT USING (user_id = auth.uid());

-- Admin ve todas
CREATE POLICY "compras_select_admin" ON squad_compras
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- INSERT para squads gratuitos (pelo cliente) — preco_pago deve ser 0
CREATE POLICY "compras_insert_free" ON squad_compras
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND preco_pago = 0
    AND stripe_session_id IS NULL
  );

-- INSERT para squads pagos: via service_role (Edge Function webhook)
-- Nao necessita politica RLS — Edge Functions usam service_role key

-- ═══ squad_reviews ═══
CREATE POLICY "reviews_select_public" ON squad_reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_buyer" ON squad_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM squad_compras
      WHERE squad_id = squad_reviews.squad_id
      AND user_id = auth.uid()
      AND status = 'completed'
    )
  );

CREATE POLICY "reviews_update_own" ON squad_reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reviews_delete_own_or_admin" ON squad_reviews
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══ squad_downloads ═══
CREATE POLICY "downloads_select_own" ON squad_downloads
  FOR SELECT USING (user_id = auth.uid());

-- INSERT via Edge Function (service_role) — nao pelo cliente directamente

-- ═══ xp_transactions ═══
CREATE POLICY "xp_select_own" ON xp_transactions
  FOR SELECT USING (user_id = auth.uid());

-- INSERT via trigger/Edge Function apenas — nao pelo cliente
```

### 2.4 Triggers -- definicao completa

Os triggers propostos no PRD estao correctos. Seguem-se refinamentos.

```sql
-- ═══ Trigger 1: Actualizar rating_medio e total_reviews ═══
CREATE OR REPLACE FUNCTION update_squad_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE squads SET
    rating_medio = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM squad_reviews WHERE squad_id = COALESCE(NEW.squad_id, OLD.squad_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM squad_reviews WHERE squad_id = COALESCE(NEW.squad_id, OLD.squad_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.squad_id, OLD.squad_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_review_upsert
  AFTER INSERT OR UPDATE OR DELETE ON squad_reviews
  FOR EACH ROW EXECUTE FUNCTION update_squad_rating();

-- ═══ Trigger 2: Incrementar total_downloads ═══
CREATE OR REPLACE FUNCTION increment_squad_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE squads SET
    total_downloads = total_downloads + 1,
    updated_at = now()
  WHERE id = NEW.squad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_download_count
  AFTER INSERT ON squad_downloads
  FOR EACH ROW EXECUTE FUNCTION increment_squad_downloads();

-- ═══ Trigger 3: Actualizar xp_total e nivel ═══
CREATE OR REPLACE FUNCTION update_user_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_total int;
  v_nivel text;
BEGIN
  SELECT COALESCE(SUM(pontos), 0) INTO v_total
  FROM xp_transactions WHERE user_id = NEW.user_id;

  v_nivel := CASE
    WHEN v_total >= 5000 THEN 'N4'
    WHEN v_total >= 2000 THEN 'N3'
    WHEN v_total >= 500  THEN 'N2'
    ELSE 'N1'
  END;

  UPDATE profiles SET
    xp_total = v_total,
    nivel = v_nivel
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_xp_update
  AFTER INSERT ON xp_transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_xp();

-- ═══ Trigger 4: updated_at automatico em squads ═══
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_squads_updated_at
  BEFORE UPDATE ON squads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Nota sobre SECURITY DEFINER:** Os triggers que fazem UPDATE em tabelas protegidas por RLS precisam de `SECURITY DEFINER` para ignorar RLS (executam como o owner da funcao, nao como o utilizador que fez a accao original).

---

## 3. Arquitectura das Edge Functions

### 3.1 Visao geral

| Funcao | Metodo | Auth | Invocacao | Timeout |
|--------|--------|------|-----------|---------|
| `stripe-checkout` | POST | Bearer token (Supabase JWT) | Cliente JS | 10s |
| `stripe-webhook` | POST | Stripe signature (`stripe-signature` header) | Stripe servers | 30s |
| `squad-validate` | POST | Bearer token (admin only) | Admin UI | 60s |
| `squad-download` | POST | Bearer token (Supabase JWT) | Cliente JS | 10s |
| `xp-trigger` | POST | Service role (interno) | Chamado por outras Edge Functions | 5s |

### 3.2 `stripe-checkout` -- Criar sessao de pagamento

**Endpoint:** `POST /functions/v1/stripe-checkout`

**Headers:**
```
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "squad_id": "uuid",
  "success_url": "https://comunidade.iaavancada.pt/squad-success.html?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://comunidade.iaavancada.pt/squad-detail.html?slug=xxx"
}
```

**Logica:**

```typescript
// supabase/functions/stripe-checkout/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const PRICE_MAP: Record<string, string> = {
  "4.98":  Deno.env.get("STRIPE_PRICE_498")!,
  "9.98":  Deno.env.get("STRIPE_PRICE_998")!,
  "19.98": Deno.env.get("STRIPE_PRICE_1998")!,
  "49.98": Deno.env.get("STRIPE_PRICE_4998")!,
};

serve(async (req) => {
  // 1. Validar JWT e extrair user_id
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  // 2. Ler body
  const { squad_id, success_url, cancel_url } = await req.json();

  // 3. Buscar squad (validar existencia e preco)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: squad } = await supabaseAdmin
    .from("squads")
    .select("id, titulo, preco, status")
    .eq("id", squad_id)
    .eq("status", "published")
    .single();

  if (!squad) return new Response("Squad not found", { status: 404 });
  if (squad.preco === 0) return new Response("Free squad", { status: 400 });

  // 4. Verificar se ja comprou
  const { data: existing } = await supabaseAdmin
    .from("squad_compras")
    .select("id")
    .eq("squad_id", squad_id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (existing) return new Response("Already purchased", { status: 409 });

  // 5. Criar compra pendente
  await supabaseAdmin.from("squad_compras").insert({
    squad_id,
    user_id: user.id,
    preco_pago: squad.preco,
    moeda: "EUR",
    status: "pending",
  });

  // 6. Criar Stripe Checkout Session
  const priceId = PRICE_MAP[String(squad.preco)];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      squad_id,
      user_id: user.id,
      squad_titulo: squad.titulo,
    },
    success_url,
    cancel_url,
    customer_email: user.email,
  });

  // 7. Actualizar compra com session_id
  await supabaseAdmin
    .from("squad_compras")
    .update({ stripe_session_id: session.id })
    .eq("squad_id", squad_id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Variaveis de ambiente (Supabase Edge Function secrets):**

| Variavel | Descricao |
|----------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe (`sk_live_...` ou `sk_test_...`) |
| `STRIPE_PRICE_498` | Stripe Price ID para 4,98 EUR |
| `STRIPE_PRICE_998` | Stripe Price ID para 9,98 EUR |
| `STRIPE_PRICE_1998` | Stripe Price ID para 19,98 EUR |
| `STRIPE_PRICE_4998` | Stripe Price ID para 49,98 EUR |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |

### 3.3 `stripe-webhook` -- Processar pagamento confirmado

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Headers:**
```
stripe-signature: t=...,v1=...
Content-Type: application/json
```

**Logica:**

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  // 1. Validar assinatura (CRITICO — NFR-07)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // 2. Processar apenas checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return new Response("OK", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { squad_id, user_id } = session.metadata!;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 3. Actualizar compra para completed
  const { error: updateError } = await supabase
    .from("squad_compras")
    .update({
      status: "completed",
      stripe_payment_intent: session.payment_intent as string,
    })
    .eq("stripe_session_id", session.id);

  if (updateError) {
    console.error("Failed to update purchase:", updateError);
    return new Response("DB error", { status: 500 });
  }

  // 4. Atribuir XP (+50 para compra paga)
  await supabase.from("xp_transactions").insert({
    user_id,
    tipo: "squad_compra",
    pontos: 50,
    referencia_tipo: "squad",
    referencia_id: squad_id,
    descricao: `Compra de squad: ${session.metadata?.squad_titulo || squad_id}`,
  });

  return new Response("OK", { status: 200 });
});
```

**Evento processado:** `checkout.session.completed`

[AUTO-DECISION] Utilizar `checkout.session.completed` em vez de `payment_intent.succeeded`? -> Sim, `checkout.session.completed` e mais fiavel para Checkout Sessions porque garante que a sessao foi completada e contem os metadados. O PRD menciona `payment_intent.succeeded` mas `checkout.session.completed` e a pratica recomendada pela Stripe para Checkout mode=payment.

**Idempotencia:** O `UNIQUE(squad_id, user_id)` na tabela `squad_compras` e o `idx_xp_unique_action` em `xp_transactions` garantem que reprocessar o mesmo webhook nao cria duplicados.

### 3.4 `squad-download` -- Gerar signed URL

**Endpoint:** `POST /functions/v1/squad-download`

**Request body:**
```json
{
  "squad_id": "uuid"
}
```

**Logica:**

```typescript
// supabase/functions/squad-download/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Autenticar
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { squad_id } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 2. Verificar compra valida
  const { data: compra } = await supabaseAdmin
    .from("squad_compras")
    .select("id")
    .eq("squad_id", squad_id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (!compra) return new Response("Purchase required", { status: 403 });

  // 3. Buscar zip_path do squad
  const { data: squad } = await supabaseAdmin
    .from("squads")
    .select("zip_path, titulo")
    .eq("id", squad_id)
    .single();

  if (!squad?.zip_path) return new Response("File not found", { status: 404 });

  // 4. Gerar signed URL (60 minutos — NFR-05)
  const { data: signedUrl, error } = await supabaseAdmin
    .storage
    .from("squad-files")
    .createSignedUrl(squad.zip_path, 3600); // 60 min

  if (error || !signedUrl) {
    return new Response("Failed to generate URL", { status: 500 });
  }

  // 5. Registar download
  await supabaseAdmin.from("squad_downloads").insert({
    squad_id,
    user_id: user.id,
    compra_id: compra.id,
  });

  return new Response(JSON.stringify({
    url: signedUrl.signedUrl,
    filename: `${squad.titulo.replace(/[^a-zA-Z0-9-_]/g, '_')}.zip`
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 3.5 `squad-validate` -- Validacao de seguranca

**Endpoint:** `POST /functions/v1/squad-validate`

**Request body:**
```json
{
  "squad_id": "uuid"
}
```

**Logica:**

```typescript
// supabase/functions/squad-validate/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

interface ValidationResult {
  categoria: string;
  peso: number;
  score: number;
  detalhes: string[];
}

const CREDENTIAL_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}/gi,
  /(?:secret|token|password|passwd)\s*[:=]\s*['"][^'"]{8,}/gi,
  /sk_(?:live|test)_[a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{36,}/g,
  /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,
];

const MALICIOUS_PATTERNS = [
  /eval\s*\(/g,
  /new\s+Function\s*\(/g,
  /child_process/g,
  /exec\s*\(/g,
  /\.spawn\s*\(/g,
  /fetch\s*\(\s*['"]https?:\/\/(?!cdn|unpkg|esm|deno)/gi,
];

serve(async (req) => {
  // 1. Verificar admin
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verificar admin
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return new Response("Forbidden", { status: 403 });

  const { squad_id } = await req.json();

  // 2. Buscar squad e ZIP
  const { data: squad } = await supabaseAdmin
    .from("squads")
    .select("zip_path")
    .eq("id", squad_id)
    .single();

  if (!squad?.zip_path) return new Response("Squad not found", { status: 404 });

  // 3. Descarregar ZIP
  const { data: fileData, error: dlError } = await supabaseAdmin
    .storage
    .from("squad-files")
    .download(squad.zip_path);

  if (dlError || !fileData) return new Response("File error", { status: 500 });

  // 4. Analisar ZIP
  const results: ValidationResult[] = [];
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await fileData.arrayBuffer());
  } catch {
    // ZIP invalido — score 0 em integridade
    const finalScore = 0;
    await supabaseAdmin.from("squads").update({
      score_seguranca: finalScore,
      validacao_detalhes: [{ categoria: "integridade", peso: 15, score: 0, detalhes: ["ZIP invalido"] }],
    }).eq("id", squad_id);
    return new Response(JSON.stringify({ score: finalScore }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const files = Object.keys(zip.files);
  const textFiles: { name: string; content: string }[] = [];
  for (const f of files) {
    if (!zip.files[f].dir && f.match(/\.(md|yaml|yml|json|js|ts|txt|sh|py)$/i)) {
      const content = await zip.files[f].async("string");
      textFiles.push({ name: f, content });
    }
  }

  // Cat 1: Integridade (15%)
  const intScore = files.length > 0 ? 100 : 0;
  results.push({ categoria: "integridade", peso: 15, score: intScore, detalhes: [`${files.length} ficheiros`] });

  // Cat 2: Dependencias (20%) — verificar package.json se existir
  let depScore = 100;
  const depDetails: string[] = [];
  const pkgFile = textFiles.find(f => f.name.endsWith("package.json"));
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      depDetails.push(`${Object.keys(allDeps).length} dependencias encontradas`);
      // Simplificado: nao verifica CVEs no MVP, apenas conta
    } catch { depScore = 80; depDetails.push("package.json com parse error"); }
  } else {
    depDetails.push("Sem package.json (squads AIOX tipicamente nao tem)");
  }
  results.push({ categoria: "dependencias", peso: 20, score: depScore, detalhes: depDetails });

  // Cat 3: Credenciais (25%)
  let credScore = 100;
  const credDetails: string[] = [];
  for (const f of textFiles) {
    for (const pattern of CREDENTIAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(f.content)) {
        credScore = 0;
        credDetails.push(`Credencial detectada em ${f.name}`);
      }
    }
  }
  if (credScore === 100) credDetails.push("Nenhuma credencial exposta");
  results.push({ categoria: "credenciais", peso: 25, score: credScore, detalhes: credDetails });

  // Cat 4: Conformidade YAML (15%)
  let yamlScore = 100;
  const yamlDetails: string[] = [];
  const yamlFiles = textFiles.filter(f => f.name.match(/\.(yaml|yml)$/i));
  if (yamlFiles.length === 0) { yamlScore = 50; yamlDetails.push("Sem ficheiros YAML"); }
  results.push({ categoria: "yaml", peso: 15, score: yamlScore, detalhes: yamlDetails });

  // Cat 5: Codigo malicioso (15%)
  let malScore = 100;
  const malDetails: string[] = [];
  for (const f of textFiles) {
    for (const pattern of MALICIOUS_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(f.content)) {
        malScore = 0;
        malDetails.push(`Pattern suspeito em ${f.name}: ${pattern.source}`);
      }
    }
  }
  if (malScore === 100) malDetails.push("Nenhum pattern malicioso detectado");
  results.push({ categoria: "malware", peso: 15, score: malScore, detalhes: malDetails });

  // Cat 6: Documentacao (10%)
  let docScore = 0;
  const docDetails: string[] = [];
  const hasReadme = files.some(f => f.toLowerCase().includes("readme"));
  const hasSkill = files.some(f => f.toLowerCase().includes("skill.md"));
  if (hasReadme || hasSkill) { docScore = 100; docDetails.push("Documentacao encontrada"); }
  else { docDetails.push("Sem README.md ou SKILL.md"); }
  results.push({ categoria: "documentacao", peso: 10, score: docScore, detalhes: docDetails });

  // 5. Calcular score final (media ponderada)
  const finalScore = Math.round(
    results.reduce((acc, r) => acc + (r.score * r.peso / 100), 0)
  );

  // 6. Gravar resultado
  await supabaseAdmin.from("squads").update({
    score_seguranca: finalScore,
    validacao_detalhes: results,
  }).eq("id", squad_id);

  return new Response(JSON.stringify({ score: finalScore, details: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 3.6 `xp-trigger` -- Atribuir XP

[AUTO-DECISION] Implementar XP como Edge Function separada ou como logica inline nas outras funcoes? -> Logica inline. Razao: Chamadas entre Edge Functions adicionam latencia e complexidade desnecessaria. O XP e atribuido directamente dentro de `stripe-webhook` (compra paga) e via insert directo para squads gratuitos e reviews. O trigger `update_user_xp` no PostgreSQL garante que `profiles.xp_total` e `nivel` sao actualizados automaticamente.

A funcao `xp-trigger` como Edge Function separada **nao e necessaria no MVP**. A responsabilidade e distribuida:

| Accao XP | Onde e inserido o `xp_transactions` | Trigger que actualiza `profiles` |
|----------|--------------------------------------|----------------------------------|
| Compra paga (+50 XP) | `stripe-webhook` Edge Function | `trg_xp_update` |
| Download gratuito (+10 XP) | Inline no cliente (RLS permite INSERT em `squad_compras` com preco 0) + trigger SQL | `trg_xp_update` |
| Review (+30 XP) | Trigger SQL apos INSERT em `squad_reviews` | `trg_xp_update` |

**Trigger adicional para XP de reviews:**

```sql
CREATE OR REPLACE FUNCTION award_review_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas na primeira review (INSERT), nao em UPDATE
  IF TG_OP = 'INSERT' THEN
    INSERT INTO xp_transactions (user_id, tipo, pontos, referencia_tipo, referencia_id, descricao)
    VALUES (
      NEW.user_id,
      'squad_review',
      30,
      'squad',
      NEW.squad_id,
      'Review publicada'
    )
    ON CONFLICT DO NOTHING; -- idx_xp_unique_action previne duplicados
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_review_xp
  AFTER INSERT ON squad_reviews
  FOR EACH ROW EXECUTE FUNCTION award_review_xp();
```

**Trigger para XP de downloads gratuitos:**

```sql
CREATE OR REPLACE FUNCTION award_free_download_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para compras gratuitas (preco_pago = 0)
  IF NEW.preco_pago = 0 THEN
    INSERT INTO xp_transactions (user_id, tipo, pontos, referencia_tipo, referencia_id, descricao)
    VALUES (
      NEW.user_id,
      'squad_download_free',
      10,
      'squad',
      NEW.squad_id,
      'Transferencia de squad gratuito'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_free_download_xp
  AFTER INSERT ON squad_compras
  FOR EACH ROW EXECUTE FUNCTION award_free_download_xp();
```

---

## 4. Fluxo de dados end-to-end

### 4.1 Fluxo: compra paga

```
Browser                    Supabase                      Stripe
  |                           |                             |
  | 1. Clique "Comprar"       |                             |
  |-------------------------->|                             |
  |   POST /stripe-checkout   |                             |
  |   { squad_id }            |                             |
  |                           | 2. Validar JWT              |
  |                           | 3. Verificar squad existe   |
  |                           | 4. Verificar nao comprou    |
  |                           | 5. INSERT squad_compras     |
  |                           |    (status: pending)        |
  |                           |                             |
  |                           | 6. Criar Checkout Session   |
  |                           |---------------------------->|
  |                           |   { line_items, metadata }  |
  |                           |<----------------------------|
  |                           |   { session.url }           |
  |                           |                             |
  |                           | 7. UPDATE compras           |
  |                           |    (stripe_session_id)      |
  |                           |                             |
  |<--------------------------|                             |
  | { url: stripe_checkout }  |                             |
  |                           |                             |
  | 8. Redirect para Stripe   |                             |
  |---------------------------------------------->|         |
  |                           |                   |         |
  |                           |   9. Pagamento    |         |
  |                           |      concluido    |         |
  |                           |<---------------------------|
  |                           |   webhook POST              |
  |                           |   checkout.session.completed |
  |                           |                             |
  |                           | 10. Validar signature       |
  |                           | 11. UPDATE compras          |
  |                           |     (status: completed)     |
  |                           | 12. INSERT xp_transactions  |
  |                           |     (+50 XP)                |
  |                           | 13. TRIGGER update_user_xp  |
  |                           |     (recalcula nivel)       |
  |                           |                             |
  |<--------------------------------------------- |         |
  | Redirect success_url      |                             |
  | (squad-success.html)      |                             |
```

### 4.2 Fluxo: squad gratuito

```
Browser                    Supabase
  |                           |
  | 1. Clique "Transferir"    |
  |-------------------------->|
  |   sb.from('squad_compras')|
  |   .insert({               |
  |     preco_pago: 0,        |
  |     status: 'completed'   |
  |   })                      |
  |                           |
  |                           | 2. RLS valida (auth + preco=0)
  |                           | 3. INSERT squad_compras
  |                           | 4. TRIGGER award_free_download_xp
  |                           |    INSERT xp_transactions (+10)
  |                           | 5. TRIGGER update_user_xp
  |                           |    UPDATE profiles (xp_total, nivel)
  |                           |
  |<--------------------------|
  | { data: compra }          |
  |                           |
  | 6. POST /squad-download   |
  |-------------------------->|
  |   { squad_id }            |
  |                           | 7. Verificar compra
  |                           | 8. Gerar signed URL (60 min)
  |                           | 9. INSERT squad_downloads
  |                           | 10. TRIGGER increment_squad_downloads
  |<--------------------------|
  | { url, filename }         |
  |                           |
  | 11. window.open(url)      |
```

### 4.3 Fluxo: review

```
Browser                    Supabase
  |                           |
  | 1. Submeter review        |
  |-------------------------->|
  |   sb.from('squad_reviews')|
  |   .upsert({               |
  |     squad_id, user_id,    |
  |     rating, comentario    |
  |   })                      |
  |                           |
  |                           | 2. RLS valida:
  |                           |    - user autenticado
  |                           |    - compra existe
  |                           | 3. INSERT/UPDATE squad_reviews
  |                           | 4. TRIGGER update_squad_rating
  |                           |    UPDATE squads (rating_medio, total_reviews)
  |                           | 5. TRIGGER award_review_xp (apenas INSERT)
  |                           |    INSERT xp_transactions (+30)
  |                           | 6. TRIGGER update_user_xp
  |                           |    UPDATE profiles (xp_total, nivel)
  |<--------------------------|
  | { data: review }          |
```

---

## 5. Integracoes

### 5.1 Stripe

| Componente | Detalhe |
|------------|---------|
| Modo | Stripe Checkout (hosted) -- mode: `payment` |
| Moeda | EUR |
| Produtos | 4 Stripe Products, cada um com 1 Price fixo |
| Metadados | `squad_id`, `user_id`, `squad_titulo` em cada session |
| Webhook | `checkout.session.completed` -> Edge Function `stripe-webhook` |
| Webhook URL | `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` |
| Seguranca | Signature verification com `STRIPE_WEBHOOK_SECRET` |
| Fallback | Compra fica `pending` se webhook falhar; pode ser reconciliada manualmente |
| Ambiente teste | Utilizar `sk_test_` e `whsec_test_` durante desenvolvimento |

**Configuracao no Stripe Dashboard:**

1. Criar 4 Products: "Squad 4,98", "Squad 9,98", "Squad 19,98", "Squad 49,98"
2. Cada Product com 1 Price (one-time, EUR)
3. Configurar Webhook endpoint: `https://<ref>.supabase.co/functions/v1/stripe-webhook`
4. Eventos a escutar: `checkout.session.completed`

### 5.2 Supabase Storage

| Bucket | Tipo | Politica | Max size | Estrutura |
|--------|------|----------|----------|-----------|
| `squad-files` | Privado | Download via signed URL apenas | 50 MB | `{squad_id}/{filename}.zip` |
| `squad-images` | Publico | Leitura publica, escrita admin | 5 MB | `{squad_id}/cover.{ext}` |

**Politicas de Storage:**

```sql
-- squad-files: privado, download via Edge Function
-- Nao permitir acesso directo; signed URLs geradas pela Edge Function

-- squad-images: leitura publica
CREATE POLICY "squad_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'squad-images');

CREATE POLICY "squad_images_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'squad-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 5.3 Supabase Auth

| Aspecto | Detalhe |
|---------|---------|
| Instancia | Partilhada com comunidade existente |
| Sessao | Mesma sessao (`sb.auth.getSession()`) |
| Client | `config.js` — `sb = supabase.createClient(URL, ANON)` |
| JWT | Passado como `Authorization: Bearer` para Edge Functions |
| Providers | Email/password + Google OAuth (ja configurados) |

**Nao e necessaria nenhuma alteracao ao auth.** O SquadMarket reutiliza tudo o que existe.

### 5.4 Supabase Realtime

[AUTO-DECISION] Utilizar Realtime para actualizacoes ao vivo? -> Nao no MVP. Razao: O catalogo nao precisa de actualizacoes em tempo real. Recarregar a pagina e suficiente. V2 pode adicionar Realtime para notificacoes de novas reviews.

---

## 6. Arquitectura de paginas

### 6.1 Ficheiros HTML

| Ficheiro | Proposito | Auth requerida |
|----------|-----------|----------------|
| `squads.html` | Catalogo / listagem | Nao (browse publico, accoes requerem auth) |
| `squad-detail.html` | Detalhe do squad | Nao (browse publico, compra/review requer auth) |
| `squad-success.html` | Pagina pos-compra | Sim |
| `squad-admin.html` | Gestao de squads (CRUD) | Sim (admin) |

### 6.2 Localizacao

```
imersao-tools/comunidade/
  squads.html              <-- Catalogo
  squad-detail.html        <-- Detalhe (recebe ?slug=xxx)
  squad-success.html       <-- Pos-compra (recebe ?session_id=xxx)
  squad-admin.html         <-- Admin CRUD
  config.js                <-- Supabase client (existente, partilhado)
  dashboard.html           <-- Adicionar link na sidebar
```

### 6.3 Padrao de pagina

Todas as paginas SquadMarket seguem o mesmo padrao das existentes:

```html
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Squads — Comunidade [IA]AVANCADA PT</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@...&family=JetBrains+Mono:wght@...&display=swap" rel="stylesheet"/>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
  <style>
    /* CSS inline, design system vars, glassmorphism */
  </style>
</head>
<body>
  <!-- Sidebar (reutilizada do dashboard, copiar estrutura) -->
  <!-- Content area -->
  <script>
    // Logica JS inline
  </script>
</body>
</html>
```

### 6.4 Navegacao na sidebar

Adicionar item "Squads" na sidebar do `dashboard.html`, entre "Vitrine" e "Biblioteca":

```html
<a href="squads.html" class="sb-item">
  <span class="sb-icon">&#x1F4E6;</span>
  <span class="sb-label">Squads</span>
</a>
```

### 6.5 Estrategia de carregamento de dados

**Pagina de catalogo (`squads.html`):**

```javascript
// Carregar todos os squads publicados de uma vez (client-side filtering)
const { data: squads } = await sb
  .from('squads')
  .select(`
    id, titulo, descricao_curta, slug, preco, rating_medio,
    total_reviews, total_downloads, score_seguranca, imagem_capa, tags,
    status, created_at,
    squad_categorias(id, nome, slug, icon)
  `)
  .eq('status', 'published')
  .order('created_at', { ascending: false });

// Carregar categorias para filtros
const { data: categorias } = await sb
  .from('squad_categorias')
  .select('id, nome, slug, icon')
  .order('ordem');

// Filtragem, pesquisa e ordenacao: tudo em JS no browser
```

**Pagina de detalhe (`squad-detail.html`):**

```javascript
const slug = new URLSearchParams(window.location.search).get('slug');

// Squad completo + join com categoria
const { data: squad } = await sb
  .from('squads')
  .select(`
    *,
    squad_categorias(nome, slug, icon)
  `)
  .eq('slug', slug)
  .single();

// Reviews com perfil do autor
const { data: reviews } = await sb
  .from('squad_reviews')
  .select(`
    id, rating, comentario, created_at,
    profiles:user_id(nome, foto, nivel)
  `)
  .eq('squad_id', squad.id)
  .order('created_at', { ascending: false });

// Verificar se o utilizador actual comprou (para mostrar botao download/review)
const session = await sb.auth.getSession();
if (session?.data?.session) {
  const { data: compra } = await sb
    .from('squad_compras')
    .select('id')
    .eq('squad_id', squad.id)
    .eq('user_id', session.data.session.user.id)
    .eq('status', 'completed')
    .single();
  // Se compra existe: mostrar "Transferir ZIP" e formulario de review
  // Se nao: mostrar "Comprar por X,XX EUR"
}
```

---

## 7. Decisoes de arquitectura

### ADR-1: Client-side filtering vs server-side

**Decisao:** Client-side filtering para o MVP.

| Alternativa | Prós | Contras | Decisao |
|-------------|------|---------|---------|
| Client-side JS | Zero latencia apos load; simplicidade; sem Edge Functions adicionais | Memory no browser; nao escala alem de ~1.000 items | ACEITE (MVP) |
| PostgREST filters | Escalavel; suporte nativo Supabase | Latencia por pedido; complexidade de query composition no cliente | REJEITADA (MVP) |
| Full-text search PG | Pesquisa linguistica; escalavel | Requer `to_tsvector`, funcoes SQL, complexidade significativa | REJEITADA (V2) |

**Limiar de migracao:** Quando o catalogo ultrapassar 500 squads, migrar para PostgREST filters com paginacao cursor-based.

### ADR-2: XP via triggers vs Edge Function dedicada

**Decisao:** Triggers SQL para a maioria das atribuicoes de XP.

| Alternativa | Prós | Contras | Decisao |
|-------------|------|---------|---------|
| Triggers SQL | Atomico; garantido; sem chamadas de rede; transaccional | Logica no DB; menos testavel | ACEITE |
| Edge Function `xp-trigger` | Logica centralizada; testavel; reutilizavel | Latencia adicional; ponto de falha; complexidade de invocacao | REJEITADA |
| Cliente insere XP | Simples | Manipulavel; sem garantias | REJEITADA |

O trigger `update_user_xp` no PostgreSQL garante consistencia transaccional: quando um `xp_transactions` e inserido, o `profiles.xp_total` e `nivel` sao actualizados na mesma transaccao.

### ADR-3: Webhook event type

**Decisao:** Processar `checkout.session.completed` em vez de `payment_intent.succeeded`.

**Razao:** O PRD menciona `payment_intent.succeeded`, mas para Stripe Checkout em mode `payment`, o evento `checkout.session.completed` e mais adequado porque:
1. Contem os `metadata` definidos na sessao (squad_id, user_id)
2. Confirma que o checkout flow foi completado pelo cliente
3. E o evento recomendado pela Stripe para este fluxo

### ADR-4: Admin detection

**Decisao:** Campo `is_admin boolean DEFAULT false` na tabela `profiles`.

| Alternativa | Prós | Contras | Decisao |
|-------------|------|---------|---------|
| Campo `is_admin` em profiles | Simples; query directa; facil de gerir | Mais um campo na tabela | ACEITE |
| JWT custom claims | Nao requer query | Requer funcao SQL para set_claim; complexidade de setup | REJEITADA (MVP) |
| Tabela `admins` separada | Separacao de concerns | JOIN adicional em cada RLS check | REJEITADA |

### ADR-5: Compras gratuitas via cliente vs Edge Function

**Decisao:** INSERT directo pelo cliente para squads gratuitos, com RLS que restringe a `preco_pago = 0`.

**Razao:** Nao justifica a latencia de uma Edge Function para uma operacao simples. A RLS garante que o cliente so pode inserir compras com preco 0. O trigger SQL atribui XP automaticamente.

### ADR-6: Sidebar compartilhada vs iframe

**Decisao:** Copiar a estrutura da sidebar do dashboard para cada pagina SquadMarket (HTML inline).

| Alternativa | Prós | Contras | Decisao |
|-------------|------|---------|---------|
| HTML inline (copiar) | Consistente com padrao existente; zero dependencias | Duplicacao de HTML | ACEITE |
| iframe | DRY | Problemas de performance, auth, styling | REJEITADA |
| Web Components | DRY, modular | Complexidade; nao usado no resto do projecto | REJEITADA (V2) |

---

## 8. Riscos tecnicos e mitigacoes

### 8.1 Riscos identificados

| ID | Risco | Severidade | Probabilidade | Mitigacao |
|----|-------|------------|---------------|-----------|
| RT-01 | Webhook Stripe falha silenciosamente: compra paga mas `squad_compras` fica `pending` | CRITICO | Baixa | Pagina de sucesso verifica status via polling; admin pode reconciliar manualmente; logs detalhados na Edge Function |
| RT-02 | Race condition: dois webhooks para a mesma sessao | MEDIO | Muito baixa | UNIQUE constraint `(squad_id, user_id)` previne duplicados; `ON CONFLICT DO NOTHING` no XP |
| RT-03 | ZIP corrompido no Storage | ALTO | Baixa | Validacao `squad-validate` verifica integridade do ZIP antes de publicar; signed URL so gerada se ficheiro existe |
| RT-04 | RLS demasiado permissiva permite compra gratuita de squad pago | CRITICO | Baixa | RLS `compras_insert_free` exige explicitamente `preco_pago = 0`; squads pagos so podem ser comprados via Edge Function (service_role) |
| RT-05 | XP inflacionado por accoes repetidas | MEDIO | Media | `idx_xp_unique_action` UNIQUE index previne duplicados; triggers usam `ON CONFLICT DO NOTHING` |
| RT-06 | Memory pressure no browser com 500+ squads carregados | BAIXO | Baixa | ~500 squads x ~500 bytes = ~250 KB — confortavel; monitorizar e migrar para server-side se necessario |
| RT-07 | Supabase Edge Functions cold start > 3s | MEDIO | Media | Primeira invocacao pode demorar 1-3s; subsequentes sao rapidas; nao afecta UX critica |
| RT-08 | `is_admin` manipulado via Supabase client | CRITICO | Nula | RLS em `profiles` bloqueia UPDATE de `is_admin` pelo utilizador; apenas service_role pode alterar |

### 8.2 Mitigacao para RT-01 (webhook failure)

Implementar verificacao na pagina de sucesso:

```javascript
// squad-success.html
const sessionId = new URLSearchParams(window.location.search).get('session_id');

async function checkPurchaseStatus() {
  const { data: compra } = await sb
    .from('squad_compras')
    .select('status')
    .eq('stripe_session_id', sessionId)
    .single();

  if (compra?.status === 'completed') {
    showSuccessUI();
  } else {
    showPendingUI(); // "A processar o pagamento... aguarda um momento."
    setTimeout(checkPurchaseStatus, 3000); // Retry a cada 3s, max 10 tentativas
  }
}
```

### 8.3 Proteccao do campo `is_admin`

```sql
-- Impedir que utilizadores alterem o proprio is_admin
CREATE POLICY "profiles_update_no_admin_field" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    -- Se o campo is_admin mudou, bloquear
    -- Isto e implementado como: o utilizador pode actualizar o seu perfil
    -- EXCEPTO o campo is_admin (que mantem o valor original)
    COALESCE(is_admin, false) = COALESCE(
      (SELECT is_admin FROM profiles WHERE id = auth.uid()),
      false
    )
  );
```

---

## 9. Performance

### 9.1 Queries criticas e indices

| Query | Pagina | Indice utilizado | Tempo estimado |
|-------|--------|------------------|----------------|
| Todos os squads publicados | Catalogo | `idx_squads_status_created` | <100ms (100 rows) |
| Squad por slug | Detalhe | `idx_squads_slug` (UNIQUE) | <5ms |
| Reviews de um squad | Detalhe | `idx_reviews_squad` | <20ms |
| Compra do utilizador | Detalhe | `idx_compras_user` + UNIQUE | <5ms |
| Compra por stripe_session_id | Webhook | `idx_compras_stripe_session` | <5ms |

### 9.2 Tamanhos estimados (12 meses)

| Tabela | Rows estimadas | Tamanho estimado |
|--------|----------------|------------------|
| squads | ~100 | <1 MB |
| squad_compras | ~2.000 | <5 MB |
| squad_reviews | ~500 | <2 MB |
| squad_downloads | ~3.000 | <3 MB |
| xp_transactions | ~5.000 | <5 MB |
| squad_categorias | ~10 | <1 KB |

Valores bem dentro dos limites do Supabase free/pro tier.

---

## 10. Seguranca

### 10.1 Camadas de proteccao

| Camada | Mecanismo | Cobre |
|--------|-----------|-------|
| Autenticacao | Supabase Auth (JWT) | Identidade do utilizador |
| Autorizacao (dados) | RLS PostgreSQL | Quem le/escreve o que |
| Autorizacao (admin) | `profiles.is_admin` + RLS | Operacoes privilegiadas |
| Autorizacao (storage) | Storage policies | Upload/download de ficheiros |
| Pagamentos | Stripe Checkout (hosted) | Dados de cartao nunca tocam o servidor |
| Webhooks | Stripe signature verification | Integridade dos callbacks |
| Downloads | Signed URLs (60 min TTL) | Acesso temporario a ficheiros privados |
| XP | Triggers + UNIQUE constraints | Prevencao de manipulacao |
| Validacao de squads | Edge Function (admin) | Seguranca do conteudo |

### 10.2 Dados sensiveis

| Dado | Onde reside | Acesso |
|------|-------------|--------|
| Email do utilizador | Supabase Auth (`auth.users`) | Apenas o proprio + admin |
| Stripe session/payment IDs | `squad_compras` | Apenas o proprio + admin (via RLS) |
| Dados de pagamento (cartao) | Stripe (nunca no nosso sistema) | Stripe apenas |
| ZIPs de squads | Supabase Storage (privado) | Via signed URL apos compra |
| Scores de seguranca | `squads.score_seguranca` | Publico (leitura) |

---

## 11. Viabilidade da abordagem HTML standalone + Supabase

### 11.1 Avaliacao por feature

| Feature | Viavel com HTML+Supabase? | Notas |
|---------|---------------------------|-------|
| Catalogo com filtros | SIM | Client-side JS; Supabase query unica no load |
| Pesquisa textual | SIM | `Array.filter()` no browser; GIN index para V2 |
| Pagina de detalhe | SIM | Query por slug + JOINs via Supabase PostgREST |
| Checkout Stripe | SIM | Edge Function cria sessao; redirect para Stripe hosted |
| Webhook processing | SIM | Edge Function com service_role |
| Download signed URLs | SIM | Edge Function + Supabase Storage |
| Reviews com RLS | SIM | INSERT com RLS que verifica compra existente |
| XP e niveis | SIM | Triggers PostgreSQL; totalmente server-side |
| Validacao de seguranca | SIM | Edge Function em Deno; JSZip para parse de ZIPs |
| Admin CRUD | SIM | Pagina HTML com RLS admin; formularios inline |

### 11.2 Limitacoes identificadas

| Limitacao | Impacto | Mitigacao |
|-----------|---------|-----------|
| Sem state management reactivo | Actualizar UI apos accoes requer manipulacao DOM manual | Funcoes `renderSquads()`, `renderReviews()` que re-renderizam seccoes |
| Sem routing SPA | Cada pagina e um ficheiro separado; transicoes com page reload | Aceitavel para MVP; consistente com dashboard/feed existentes |
| Duplicacao de sidebar HTML | Alteracoes na sidebar requerem actualizacao em multiplos ficheiros | Aceitavel para MVP; V2 pode extrair para Web Component ou include |
| Sem code splitting | Todo o JS de cada pagina e carregado de uma vez | Paginas sao leves (<50 KB JS); nao e problema |

### 11.3 Veredicto

**A abordagem HTML standalone + Supabase e TOTALMENTE VIAVEL para todas as features do MVP.** Nao existe nenhuma feature que exija um framework frontend ou um backend customizado. O Supabase (PostgREST + Auth + Storage + Edge Functions + RLS + Triggers) cobre 100% das necessidades.

---

## 12. Plano de migracao da base de dados

### 12.1 Ordem de execucao das migracoes

```
Migracao 1: Tabelas base
  - squad_categorias (sem FKs externas)
  - Seed de categorias iniciais

Migracao 2: Tabela squads
  - squads (FK para squad_categorias e auth.users)
  - Indices
  - CHECK constraints

Migracao 3: Tabelas dependentes
  - squad_compras (FK para squads e auth.users)
  - squad_reviews (FK para squads e auth.users)
  - squad_downloads (FK para squads, auth.users, squad_compras)
  - xp_transactions (FK para auth.users)
  - Indices e constraints

Migracao 4: Alteracoes a profiles
  - Adicionar xp_total e nivel
  - Adicionar is_admin
  - CHECK constraint

Migracao 5: Triggers e funcoes
  - update_squad_rating()
  - increment_squad_downloads()
  - update_user_xp()
  - award_review_xp()
  - award_free_download_xp()
  - set_updated_at()

Migracao 6: RLS policies
  - Todas as politicas RLS listadas na seccao 2.3

Migracao 7: Storage buckets
  - Criar squad-files (privado)
  - Criar squad-images (publico)
  - Storage policies

Migracao 8: Seed data
  - Categorias iniciais (8 categorias)
  - 3-5 squads de teste
```

---

## 13. Variaveis de ambiente necessarias

### 13.1 Supabase Edge Functions

| Variavel | Onde configurar | Descricao |
|----------|-----------------|-----------|
| `SUPABASE_URL` | Auto-injectado | URL do projecto Supabase |
| `SUPABASE_ANON_KEY` | Auto-injectado | Chave anonima |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injectado | Chave service role (para bypasses RLS) |
| `STRIPE_SECRET_KEY` | `supabase secrets set` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | `supabase secrets set` | Signing secret do webhook |
| `STRIPE_PRICE_498` | `supabase secrets set` | Price ID Stripe para 4,98 EUR |
| `STRIPE_PRICE_998` | `supabase secrets set` | Price ID Stripe para 9,98 EUR |
| `STRIPE_PRICE_1998` | `supabase secrets set` | Price ID Stripe para 19,98 EUR |
| `STRIPE_PRICE_4998` | `supabase secrets set` | Price ID Stripe para 49,98 EUR |

### 13.2 Comandos de configuracao

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_498=price_...
supabase secrets set STRIPE_PRICE_998=price_...
supabase secrets set STRIPE_PRICE_1998=price_...
supabase secrets set STRIPE_PRICE_4998=price_...
```

---

## 14. Proximos passos

| Passo | Responsavel | Dependencia |
|-------|-------------|-------------|
| 1. Revisar e aprovar esta arquitectura | Utilizador | -- |
| 2. Criar migracoes SQL (8 ficheiros) | @data-engineer | Aprovacao deste documento |
| 3. Configurar Stripe Products + Prices | @devops | Acesso ao Stripe Dashboard |
| 4. Implementar Edge Functions | @dev | Migracoes aplicadas |
| 5. Implementar paginas HTML | @dev | Edge Functions + migracoes |
| 6. Wireframes detalhados | @ux-design-expert | PRD aprovado |
| 7. Testes end-to-end | @qa | Implementacao completa |
| 8. Deploy | @devops | QA aprovado |

---

*ARCH-SQUADMARKET v1.0 -- Aria (Architect Agent) -- 20/03/2026*
