-- ================================================================
-- MIGRATION 001: SquadMarket — Marketplace de squads de agentes IA
-- Projecto: [IA]AVANCADA PT
-- Data: 20/03/2026
-- Autor: Dara (Data Engineer Agent)
-- PRD: imersao-tools/docs/PRD-SQUADMARKET.md
--
-- INSTRUCOES:
--   Executar no Supabase SQL Editor, de cima para baixo.
--   Idempotente — seguro de executar multiplas vezes.
--
-- ROLLBACK:
--   Ver seccao final deste ficheiro para script de rollback.
-- ================================================================


-- ================================================================
-- SECCAO 0: EXTENSOES NECESSARIAS
-- ================================================================

-- Garantir que uuid-ossp esta disponivel (normalmente ja esta no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- SECCAO 1: FUNCOES AUXILIARES (antes dos triggers que as referenciam)
-- ================================================================

-- Funcao: actualizar rating_medio e total_reviews no squad apos review
CREATE OR REPLACE FUNCTION public.update_squad_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.squads SET
    rating_medio = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.squad_reviews
      WHERE squad_id = COALESCE(NEW.squad_id, OLD.squad_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.squad_reviews
      WHERE squad_id = COALESCE(NEW.squad_id, OLD.squad_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.squad_id, OLD.squad_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_squad_rating() IS
  'Recalcula rating_medio e total_reviews do squad apos INSERT/UPDATE/DELETE em squad_reviews';


-- Funcao: incrementar total_downloads no squad apos download
CREATE OR REPLACE FUNCTION public.increment_squad_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.squads SET
    total_downloads = total_downloads + 1,
    updated_at = now()
  WHERE id = NEW.squad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_squad_downloads() IS
  'Incrementa total_downloads do squad apos INSERT em squad_downloads';


-- Funcao: actualizar xp_total e nivel em profiles apos transaccao de XP
-- NOTA: profiles.nivel e int (1-4), consistente com schema existente
-- Thresholds: N1=0, N2=500, N3=2000, N4=5000
CREATE OR REPLACE FUNCTION public.update_user_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_new_total int;
  v_new_nivel int;
BEGIN
  SELECT COALESCE(SUM(pontos), 0) INTO v_new_total
  FROM public.xp_transactions
  WHERE user_id = NEW.user_id;

  v_new_nivel := CASE
    WHEN v_new_total >= 5000 THEN 4
    WHEN v_new_total >= 2000 THEN 3
    WHEN v_new_total >= 500  THEN 2
    ELSE 1
  END;

  UPDATE public.profiles
  SET xp_total = v_new_total,
      nivel = v_new_nivel
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_user_xp() IS
  'Recalcula xp_total e nivel do membro apos INSERT em xp_transactions. Thresholds: N1=0, N2=500, N3=2000, N4=5000';


-- Funcao auxiliar: verificar se utilizador e admin
-- Utiliza o campo role no JWT do Supabase (app_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS
  'Verifica se o utilizador autenticado tem role admin em app_metadata do JWT';


-- ================================================================
-- SECCAO 2: ALTER TABLE profiles — adicionar xp_total
-- (nivel ja existe como int com CHECK (1,2,3,4) de migration anterior)
-- ================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_total int DEFAULT 0;

-- Garantir NOT NULL e default para xp_total
UPDATE public.profiles SET xp_total = 0 WHERE xp_total IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN xp_total SET NOT NULL,
  ALTER COLUMN xp_total SET DEFAULT 0;

-- Constraint CHECK para xp_total (nao pode ser negativo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_xp_total_non_negative'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_xp_total_non_negative CHECK (xp_total >= 0);
  END IF;
END $$;


-- ================================================================
-- SECCAO 3: TABELA squad_categorias
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_categorias (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL,
  descricao  text,
  icon       text,
  slug       text        NOT NULL,
  ordem      int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT squad_categorias_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE public.squad_categorias IS 'Categorias de squads no SquadMarket';
COMMENT ON COLUMN public.squad_categorias.slug IS 'Slug URL-friendly, unico por categoria';
COMMENT ON COLUMN public.squad_categorias.ordem IS 'Ordenacao no catalogo (menor = primeiro)';

-- RLS: SELECT publico, escrita apenas admin
ALTER TABLE public.squad_categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer pessoa ve categorias" ON public.squad_categorias;
CREATE POLICY "Qualquer pessoa ve categorias"
  ON public.squad_categorias FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gere categorias" ON public.squad_categorias;
CREATE POLICY "Admin gere categorias"
  ON public.squad_categorias FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECCAO 4: TABELA squads
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squads (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              text           NOT NULL,
  descricao_curta     text           NOT NULL,
  descricao_longa     text           NOT NULL,
  slug                text           NOT NULL,
  categoria_id        uuid           NOT NULL REFERENCES public.squad_categorias(id) ON DELETE RESTRICT,
  preco               numeric(10,2)  NOT NULL DEFAULT 0,
  autor_id            uuid           NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  zip_path            text           NOT NULL,
  imagem_capa         text,
  tags                text[]         DEFAULT '{}',
  agentes             jsonb          NOT NULL DEFAULT '[]'::jsonb,
  score_seguranca     int,
  validacao_detalhes  jsonb,
  rating_medio        numeric(3,2),
  total_reviews       int            NOT NULL DEFAULT 0,
  total_downloads     int            NOT NULL DEFAULT 0,
  status              text           NOT NULL DEFAULT 'draft',
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT squads_slug_unique UNIQUE (slug),
  CONSTRAINT squads_preco_non_negative CHECK (preco >= 0),
  CONSTRAINT squads_score_range CHECK (score_seguranca IS NULL OR (score_seguranca >= 0 AND score_seguranca <= 100)),
  CONSTRAINT squads_rating_range CHECK (rating_medio IS NULL OR (rating_medio >= 0 AND rating_medio <= 5)),
  CONSTRAINT squads_status_valid CHECK (status IN ('draft', 'published', 'unlisted')),
  CONSTRAINT squads_descricao_curta_max CHECK (char_length(descricao_curta) <= 300)
);

COMMENT ON TABLE public.squads IS 'Squads de agentes IA disponiveis no SquadMarket';
COMMENT ON COLUMN public.squads.preco IS 'Preco em EUR. 0 = gratuito. Valores permitidos: 0, 4.98, 9.98, 19.98, 49.98';
COMMENT ON COLUMN public.squads.agentes IS 'Lista de agentes: [{nome, papel, descricao}]';
COMMENT ON COLUMN public.squads.score_seguranca IS 'Score de validacao automatica (0-100). >= 50 para publicar, >= 80 para badge verificado';
COMMENT ON COLUMN public.squads.rating_medio IS 'Cache: AVG(rating) de squad_reviews';
COMMENT ON COLUMN public.squads.total_reviews IS 'Cache: COUNT de squad_reviews';
COMMENT ON COLUMN public.squads.total_downloads IS 'Cache: COUNT de squad_downloads';
COMMENT ON COLUMN public.squads.status IS 'draft: nao visivel. published: visivel no catalogo. unlisted: oculto mas acessivel a compradores';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squads_categoria ON public.squads (categoria_id);
CREATE INDEX IF NOT EXISTS idx_squads_status ON public.squads (status);
CREATE INDEX IF NOT EXISTS idx_squads_preco ON public.squads (preco);
CREATE INDEX IF NOT EXISTS idx_squads_tags ON public.squads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_squads_created_at ON public.squads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squads_rating ON public.squads (rating_medio DESC NULLS LAST);

-- RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- SELECT: policy temporaria simples (policy completa com squad_compras criada na SECCAO 5b)
DROP POLICY IF EXISTS "Squads publicados sao publicos" ON public.squads;
CREATE POLICY "Squads publicados sao publicos"
  ON public.squads FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin()
    OR (status = 'draft' AND public.is_admin())
  );

-- INSERT/UPDATE/DELETE: apenas admin
DROP POLICY IF EXISTS "Admin gere squads" ON public.squads;
CREATE POLICY "Admin gere squads"
  ON public.squads FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin actualiza squads" ON public.squads;
CREATE POLICY "Admin actualiza squads"
  ON public.squads FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin elimina squads" ON public.squads;
CREATE POLICY "Admin elimina squads"
  ON public.squads FOR DELETE
  USING (public.is_admin());


-- ================================================================
-- SECCAO 5: TABELA squad_compras
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_compras (
  id                     uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id               uuid           NOT NULL REFERENCES public.squads(id) ON DELETE RESTRICT,
  user_id                uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preco_pago             numeric(10,2)  NOT NULL,
  moeda                  text           NOT NULL DEFAULT 'EUR',
  stripe_session_id      text,
  stripe_payment_intent  text,
  status                 text           NOT NULL DEFAULT 'completed',
  created_at             timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT squad_compras_unique_purchase UNIQUE (squad_id, user_id),
  CONSTRAINT squad_compras_preco_non_negative CHECK (preco_pago >= 0),
  CONSTRAINT squad_compras_status_valid CHECK (status IN ('pending', 'completed', 'failed'))
);

COMMENT ON TABLE public.squad_compras IS 'Registo de compras de squads. UNIQUE(squad_id, user_id) — um membro so compra um squad uma vez';
COMMENT ON COLUMN public.squad_compras.preco_pago IS 'Preco pago no momento da compra. 0 para squads gratuitos';
COMMENT ON COLUMN public.squad_compras.stripe_session_id IS 'Stripe Checkout Session ID. NULL para squads gratuitos';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squad_compras_user ON public.squad_compras (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_compras_squad ON public.squad_compras (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_compras_status ON public.squad_compras (status);

-- RLS
ALTER TABLE public.squad_compras ENABLE ROW LEVEL SECURITY;

-- SELECT: membro ve as suas compras; admin ve todas
DROP POLICY IF EXISTS "Membro ve as suas compras" ON public.squad_compras;
CREATE POLICY "Membro ve as suas compras"
  ON public.squad_compras FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- INSERT: utilizador autenticado para squads gratuitos; Edge Function (service role) para pagos
DROP POLICY IF EXISTS "Membro compra squad gratuito" ON public.squad_compras;
CREATE POLICY "Membro compra squad gratuito"
  ON public.squad_compras FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND preco_pago = 0
    AND status = 'completed'
  );

-- UPDATE: apenas admin (ou service role via webhook)
DROP POLICY IF EXISTS "Admin actualiza compras" ON public.squad_compras;
CREATE POLICY "Admin actualiza compras"
  ON public.squad_compras FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: apenas admin
DROP POLICY IF EXISTS "Admin elimina compras" ON public.squad_compras;
CREATE POLICY "Admin elimina compras"
  ON public.squad_compras FOR DELETE
  USING (public.is_admin());


-- ================================================================
-- SECCAO 5b: POLICY COMPLETA squads SELECT (agora que squad_compras existe)
-- Substitui a policy temporaria da SECCAO 4
-- ================================================================

DROP POLICY IF EXISTS "Squads publicados sao publicos" ON public.squads;
CREATE POLICY "Squads publicados sao publicos"
  ON public.squads FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin()
    OR (
      status = 'unlisted'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.squad_compras sc
        WHERE sc.squad_id = squads.id
          AND sc.user_id = auth.uid()
          AND sc.status = 'completed'
      )
    )
    OR (
      status = 'draft'
      AND public.is_admin()
    )
  );


-- ================================================================
-- SECCAO 6: TABELA squad_reviews
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id   uuid        NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     int         NOT NULL,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT squad_reviews_unique_per_user UNIQUE (squad_id, user_id),
  CONSTRAINT squad_reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

COMMENT ON TABLE public.squad_reviews IS 'Reviews de squads. UNIQUE(squad_id, user_id) — 1 review por membro por squad (actualizavel)';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squad_reviews_squad ON public.squad_reviews (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_reviews_user ON public.squad_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_reviews_created ON public.squad_reviews (created_at DESC);

-- RLS
ALTER TABLE public.squad_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: publico (qualquer pessoa pode ler reviews)
DROP POLICY IF EXISTS "Reviews sao publicas" ON public.squad_reviews;
CREATE POLICY "Reviews sao publicas"
  ON public.squad_reviews FOR SELECT
  USING (true);

-- INSERT: membro autenticado que comprou o squad
DROP POLICY IF EXISTS "Comprador publica review" ON public.squad_reviews;
CREATE POLICY "Comprador publica review"
  ON public.squad_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.squad_compras sc
      WHERE sc.squad_id = squad_reviews.squad_id
        AND sc.user_id = auth.uid()
        AND sc.status = 'completed'
    )
  );

-- UPDATE: apenas o autor da review
DROP POLICY IF EXISTS "Autor actualiza a sua review" ON public.squad_reviews;
CREATE POLICY "Autor actualiza a sua review"
  ON public.squad_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: autor ou admin
DROP POLICY IF EXISTS "Autor ou admin elimina review" ON public.squad_reviews;
CREATE POLICY "Autor ou admin elimina review"
  ON public.squad_reviews FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );


-- ================================================================
-- SECCAO 7: TABELA squad_downloads
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_downloads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id      uuid        NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compra_id     uuid        NOT NULL REFERENCES public.squad_compras(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.squad_downloads IS 'Registo de downloads de squads. Permite multiplos downloads por compra';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squad_downloads_squad ON public.squad_downloads (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_downloads_user ON public.squad_downloads (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_downloads_compra ON public.squad_downloads (compra_id);

-- RLS
ALTER TABLE public.squad_downloads ENABLE ROW LEVEL SECURITY;

-- SELECT: membro ve os seus downloads; admin ve todos
DROP POLICY IF EXISTS "Membro ve os seus downloads" ON public.squad_downloads;
CREATE POLICY "Membro ve os seus downloads"
  ON public.squad_downloads FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- INSERT: membro autenticado com compra valida
DROP POLICY IF EXISTS "Comprador regista download" ON public.squad_downloads;
CREATE POLICY "Comprador regista download"
  ON public.squad_downloads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.squad_compras sc
      WHERE sc.id = squad_downloads.compra_id
        AND sc.user_id = auth.uid()
        AND sc.status = 'completed'
    )
  );


-- ================================================================
-- SECCAO 8: TABELA xp_transactions
-- ================================================================

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            text        NOT NULL,
  pontos          int         NOT NULL,
  referencia_tipo text,
  referencia_id   uuid,
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT xp_transactions_tipo_valid CHECK (
    tipo IN (
      'squad_compra',
      'squad_review',
      'squad_download_free',
      'feed_post',
      'vitrine_like',
      'vitrine_post',
      'squad_publish'
    )
  ),
  CONSTRAINT xp_transactions_pontos_not_zero CHECK (pontos != 0)
);

COMMENT ON TABLE public.xp_transactions IS 'Transaccoes de XP. Sistema unico integrado — toda a actividade na comunidade alimenta os mesmos niveis';
COMMENT ON COLUMN public.xp_transactions.tipo IS 'Tipo da accao: squad_compra (+50), squad_review (+30), squad_download_free (+10), etc.';
COMMENT ON COLUMN public.xp_transactions.pontos IS 'XP ganho (positivo) ou perdido (negativo). Nunca zero';
COMMENT ON COLUMN public.xp_transactions.referencia_tipo IS 'Tipo do objecto referenciado: squad, post, etc.';
COMMENT ON COLUMN public.xp_transactions.referencia_id IS 'UUID do objecto referenciado';

-- Indices
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON public.xp_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_tipo ON public.xp_transactions (tipo);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_ref ON public.xp_transactions (referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON public.xp_transactions (created_at DESC);

-- RLS
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: membro ve as suas transaccoes; admin ve todas
DROP POLICY IF EXISTS "Membro ve as suas transaccoes XP" ON public.xp_transactions;
CREATE POLICY "Membro ve as suas transaccoes XP"
  ON public.xp_transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- INSERT: bloqueado para clientes directos (apenas via trigger ou service role)
-- Nao criamos policy de INSERT — o service role (Edge Functions) contorna RLS
-- Isto garante que XP so e atribuido por logica de servidor, nunca pelo cliente


-- ================================================================
-- SECCAO 9: TRIGGERS
-- ================================================================

-- Trigger: actualizar rating apos INSERT/UPDATE/DELETE em squad_reviews
DROP TRIGGER IF EXISTS trg_update_squad_rating ON public.squad_reviews;
CREATE TRIGGER trg_update_squad_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.squad_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_squad_rating();

-- Trigger: incrementar downloads apos INSERT em squad_downloads
DROP TRIGGER IF EXISTS trg_increment_squad_downloads ON public.squad_downloads;
CREATE TRIGGER trg_increment_squad_downloads
  AFTER INSERT ON public.squad_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_squad_downloads();

-- Trigger: actualizar xp_total e nivel apos INSERT em xp_transactions
DROP TRIGGER IF EXISTS trg_update_user_xp ON public.xp_transactions;
CREATE TRIGGER trg_update_user_xp
  AFTER INSERT ON public.xp_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_xp();

-- Trigger: auto-update updated_at em squads
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_squads_updated_at ON public.squads;
CREATE TRIGGER trg_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_squad_reviews_updated_at ON public.squad_reviews;
CREATE TRIGGER trg_squad_reviews_updated_at
  BEFORE UPDATE ON public.squad_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ================================================================
-- SECCAO 10: SUPABASE STORAGE — Buckets
-- ================================================================

-- Bucket privado para ficheiros ZIP dos squads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'squad-files',
  'squad-files',
  false,
  52428800, -- 50 MB
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Bucket publico para imagens de capa dos squads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'squad-images',
  'squad-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Storage policies: squad-files (privado — download via signed URLs apenas)
-- Apenas admin pode fazer upload
DROP POLICY IF EXISTS "Admin faz upload de squad-files" ON storage.objects;
CREATE POLICY "Admin faz upload de squad-files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-files'
    AND public.is_admin()
  );

-- Apenas admin pode actualizar ficheiros
DROP POLICY IF EXISTS "Admin actualiza squad-files" ON storage.objects;
CREATE POLICY "Admin actualiza squad-files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'squad-files'
    AND public.is_admin()
  );

-- Leitura via signed URL (service role gera o URL, RLS nao se aplica a signed URLs)
-- Nao e necessaria policy de SELECT para signed URLs — o Supabase gera-os com service role

-- Storage policies: squad-images (publico — qualquer pessoa pode ver)
DROP POLICY IF EXISTS "Qualquer pessoa ve squad-images" ON storage.objects;
CREATE POLICY "Qualquer pessoa ve squad-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'squad-images');

-- Apenas admin pode fazer upload de imagens
DROP POLICY IF EXISTS "Admin faz upload de squad-images" ON storage.objects;
CREATE POLICY "Admin faz upload de squad-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-images'
    AND public.is_admin()
  );

-- Apenas admin pode actualizar imagens
DROP POLICY IF EXISTS "Admin actualiza squad-images" ON storage.objects;
CREATE POLICY "Admin actualiza squad-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'squad-images'
    AND public.is_admin()
  );

-- Apenas admin pode eliminar imagens/ficheiros
DROP POLICY IF EXISTS "Admin elimina squad-files" ON storage.objects;
CREATE POLICY "Admin elimina squad-files"
  ON storage.objects FOR DELETE
  USING (
    (bucket_id = 'squad-files' OR bucket_id = 'squad-images')
    AND public.is_admin()
  );


-- ================================================================
-- SECCAO 11: SEED DATA — Categorias iniciais (8 categorias do PRD)
-- ================================================================

INSERT INTO public.squad_categorias (nome, descricao, icon, slug, ordem)
VALUES
  ('Desenvolvimento', 'Squads para desenvolvimento de software', 'code', 'desenvolvimento', 1),
  ('Marketing', 'Squads para marketing digital e conteudo', 'megaphone', 'marketing', 2),
  ('IA e Automacao', 'Squads especializados em IA e automacao', 'robot', 'ia-automacao', 3),
  ('DevOps', 'Squads para CI/CD, deploy e infraestrutura', 'server', 'devops', 4),
  ('Design', 'Squads para design system e UX', 'palette', 'design', 5),
  ('Dados', 'Squads para engenharia de dados e analytics', 'chart', 'dados', 6),
  ('Negocio', 'Squads para gestao, estrategia e operacoes', 'briefcase', 'negocio', 7),
  ('Educacao', 'Squads para ensino e formacao', 'graduation', 'educacao', 8)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icon = EXCLUDED.icon,
  ordem = EXCLUDED.ordem;


-- ================================================================
-- SECCAO 12: ACTUALIZAR TRIGGER handle_new_user
-- Incluir xp_total = 0 na criacao de novos perfis
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier, nivel, xp_total)
  VALUES (new.id, new.email, 'free', 1, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================================
-- SECCAO 13: VIEWS UTEIS (opcional, para queries de catalogo)
-- ================================================================

-- View: catalogo de squads com nome da categoria
CREATE OR REPLACE VIEW public.v_squad_catalogo AS
SELECT
  s.id,
  s.titulo,
  s.descricao_curta,
  s.slug,
  s.preco,
  s.rating_medio,
  s.total_reviews,
  s.total_downloads,
  s.score_seguranca,
  s.imagem_capa,
  s.tags,
  s.status,
  s.created_at,
  sc.nome AS categoria_nome,
  sc.slug AS categoria_slug,
  sc.icon AS categoria_icon
FROM public.squads s
JOIN public.squad_categorias sc ON sc.id = s.categoria_id
WHERE s.status = 'published';

COMMENT ON VIEW public.v_squad_catalogo IS 'View para pagina de catalogo: squads publicados com categoria';


-- ================================================================
-- VERIFICACAO: apos executar, confirmar com estas queries
-- ================================================================

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('squad_categorias', 'squads', 'squad_compras', 'squad_reviews', 'squad_downloads', 'xp_transactions');

-- SELECT * FROM public.squad_categorias ORDER BY ordem;

-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name IN ('xp_total', 'nivel');


-- ================================================================
-- ROLLBACK SCRIPT (executar apenas se necessario reverter)
-- ATENCAO: isto elimina TODOS os dados das tabelas SquadMarket!
-- ================================================================

-- DROP VIEW IF EXISTS public.v_squad_catalogo;
-- DROP TRIGGER IF EXISTS trg_squad_reviews_updated_at ON public.squad_reviews;
-- DROP TRIGGER IF EXISTS trg_squads_updated_at ON public.squads;
-- DROP TRIGGER IF EXISTS trg_update_user_xp ON public.xp_transactions;
-- DROP TRIGGER IF EXISTS trg_increment_squad_downloads ON public.squad_downloads;
-- DROP TRIGGER IF EXISTS trg_update_squad_rating ON public.squad_reviews;
-- DROP TABLE IF EXISTS public.xp_transactions CASCADE;
-- DROP TABLE IF EXISTS public.squad_downloads CASCADE;
-- DROP TABLE IF EXISTS public.squad_reviews CASCADE;
-- DROP TABLE IF EXISTS public.squad_compras CASCADE;
-- DROP TABLE IF EXISTS public.squads CASCADE;
-- DROP TABLE IF EXISTS public.squad_categorias CASCADE;
-- DROP FUNCTION IF EXISTS public.update_squad_rating();
-- DROP FUNCTION IF EXISTS public.increment_squad_downloads();
-- DROP FUNCTION IF EXISTS public.update_user_xp();
-- DROP FUNCTION IF EXISTS public.update_updated_at();
-- DROP FUNCTION IF EXISTS public.is_admin();
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp_total;
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_xp_total_non_negative;
-- DELETE FROM storage.buckets WHERE id IN ('squad-files', 'squad-images');
