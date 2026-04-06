-- ================================================================
-- MIGRATION 002: Marketplace [IA]AVANCADA PT v2.0
-- Projecto: [IA]AVANCADA PT
-- Data: 26/03/2026
-- Autor: Dara (Data Engineer Agent)
-- Arquitectura: ARCH-MARKETPLACE.md
-- PRD: imersao-tools/marketplace/docs/PRD-MARKETPLACE.md
--
-- NOTA IMPORTANTE:
--   Esta migration SUBSTITUI 001-squadmarket.sql.
--   A migration 001 NUNCA foi executada em producao.
--   Este ficheiro e o ponto de partida limpo para o marketplace v2.
--
-- INSTRUCOES:
--   Executar no Supabase SQL Editor, de cima para baixo.
--   Idempotente — seguro de executar multiplas vezes.
--
-- PRECOS:
--   Precos terminam sempre em 8 (ex: 0, 8, 18, 48)
--
-- ROLLBACK:
--   Ver seccao final deste ficheiro para script de rollback.
-- ================================================================


-- ================================================================
-- SECCAO 0: EXTENSOES NECESSARIAS
-- ================================================================

-- uuid-ossp normalmente ja esta disponivel no Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- SECCAO 1: FUNCOES AUXILIARES
-- (criadas antes dos triggers que as referenciam)
-- ================================================================

-- Funcao: verificar se utilizador autenticado e admin
-- Utiliza o campo role no JWT do Supabase (app_metadata)
-- Nao requer query adicional — performante e seguro
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
  'Verifica se o utilizador autenticado tem role admin em app_metadata do JWT. Usado em todas as politicas RLS de escrita.';


-- Funcao: auto-actualizar o campo updated_at antes de UPDATE
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at() IS
  'Trigger function para auto-actualizar updated_at em qualquer tabela que a utilize.';


-- Funcao: incrementar total_downloads no squad apos registo de download
CREATE OR REPLACE FUNCTION public.increment_squad_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.squads
  SET
    total_downloads = total_downloads + 1,
    updated_at = now()
  WHERE id = NEW.squad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_squad_downloads() IS
  'Incrementa total_downloads no squad apos INSERT em squad_downloads.';


-- ================================================================
-- SECCAO 2: TABELA squad_categorias
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

COMMENT ON TABLE  public.squad_categorias          IS 'Categorias de produtos no Marketplace [IA]AVANCADA PT';
COMMENT ON COLUMN public.squad_categorias.slug     IS 'Slug URL-friendly, unico por categoria (ex: squads-aiox)';
COMMENT ON COLUMN public.squad_categorias.icon     IS 'Nome do icone a usar na UI (ex: robot, brain)';
COMMENT ON COLUMN public.squad_categorias.ordem    IS 'Ordenacao no catalogo — menor numero aparece primeiro';

-- RLS: SELECT publico (anonimo + autenticado), escrita apenas admin
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
-- SECCAO 3: TABELA squads
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squads (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           text           NOT NULL,
  descricao_curta  text           NOT NULL,
  descricao_longa  text           NOT NULL,
  -- Campo central do marketplace v2: guia de instalacao integrado na pagina de detalhe.
  -- Conteudo em markdown. Cada produto e auto-contido — sem paginas de guia separadas.
  guia_instalacao  text           NOT NULL DEFAULT '',
  slug             text           NOT NULL,
  categoria_id     uuid           NOT NULL REFERENCES public.squad_categorias(id) ON DELETE RESTRICT,
  -- Precos terminam sempre em 8 (0, 8, 18, 48, ...)
  preco            numeric(10,2)  NOT NULL DEFAULT 0,
  autor_id         uuid           NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  zip_path         text           NOT NULL DEFAULT '',
  imagem_capa      text,
  tags             text[]         DEFAULT '{}',
  -- Lista de agentes do squad: [{nome, papel, descricao}]
  agentes          jsonb          NOT NULL DEFAULT '[]'::jsonb,
  total_downloads  int            NOT NULL DEFAULT 0,
  -- status: draft = nao visivel. published = visivel no catalogo. unlisted = oculto mas acessivel a compradores
  status           text           NOT NULL DEFAULT 'draft',
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT squads_slug_unique         UNIQUE (slug),
  CONSTRAINT squads_preco_non_negative  CHECK  (preco >= 0),
  CONSTRAINT squads_status_valid        CHECK  (status IN ('draft', 'published', 'unlisted')),
  CONSTRAINT squads_descricao_curta_max CHECK  (char_length(descricao_curta) <= 300)
);

COMMENT ON TABLE  public.squads                  IS 'Produtos do Marketplace — squads de agentes IA e clones de mentes';
COMMENT ON COLUMN public.squads.guia_instalacao  IS 'Guia de instalacao em markdown — integrado na pagina de detalhe. Cada produto e auto-contido.';
COMMENT ON COLUMN public.squads.preco            IS 'Preco em EUR. 0 = gratuito. Precos terminam sempre em 8 (ex: 0, 8, 18, 48)';
COMMENT ON COLUMN public.squads.agentes          IS 'Lista de agentes do squad: [{nome: string, papel: string, descricao: string}]';
COMMENT ON COLUMN public.squads.total_downloads  IS 'Contador de downloads — incrementado por trigger apos INSERT em squad_downloads';
COMMENT ON COLUMN public.squads.status           IS 'draft: nao visivel. published: visivel no catalogo. unlisted: oculto mas acessivel a compradores.';
COMMENT ON COLUMN public.squads.zip_path         IS 'Caminho do ficheiro ZIP no bucket squad-files do Storage';

-- Indices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_squads_categoria   ON public.squads (categoria_id);
CREATE INDEX IF NOT EXISTS idx_squads_status      ON public.squads (status);
CREATE INDEX IF NOT EXISTS idx_squads_preco       ON public.squads (preco);
CREATE INDEX IF NOT EXISTS idx_squads_tags        ON public.squads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_squads_created_at  ON public.squads (created_at DESC);

-- RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- Policy temporaria SELECT (substituida na seccao 4b apos squad_compras existir)
DROP POLICY IF EXISTS "Squads publicados sao publicos" ON public.squads;
CREATE POLICY "Squads publicados sao publicos"
  ON public.squads FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin()
  );

-- INSERT: apenas admin
DROP POLICY IF EXISTS "Admin cria squads" ON public.squads;
CREATE POLICY "Admin cria squads"
  ON public.squads FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: apenas admin
DROP POLICY IF EXISTS "Admin actualiza squads" ON public.squads;
CREATE POLICY "Admin actualiza squads"
  ON public.squads FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: apenas admin
DROP POLICY IF EXISTS "Admin elimina squads" ON public.squads;
CREATE POLICY "Admin elimina squads"
  ON public.squads FOR DELETE
  USING (public.is_admin());


-- ================================================================
-- SECCAO 4: TABELA squad_compras
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_compras (
  id                     uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id               uuid           NOT NULL REFERENCES public.squads(id)    ON DELETE RESTRICT,
  user_id                uuid           NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  preco_pago             numeric(10,2)  NOT NULL,
  moeda                  text           NOT NULL DEFAULT 'EUR',
  -- Campos Stripe reservados para fase 2 (pagamentos)
  stripe_session_id      text,
  stripe_payment_intent  text,
  -- completed = activo. pending = aguarda pagamento (Stripe fase 2). failed = pagamento falhado.
  status                 text           NOT NULL DEFAULT 'completed',
  created_at             timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT squad_compras_unique_purchase  UNIQUE (squad_id, user_id),
  CONSTRAINT squad_compras_preco_non_neg    CHECK  (preco_pago >= 0),
  CONSTRAINT squad_compras_status_valid     CHECK  (status IN ('pending', 'completed', 'failed'))
);

COMMENT ON TABLE  public.squad_compras                    IS 'Registo de aquisicoes de squads. UNIQUE(squad_id, user_id) — um membro so adquire cada produto uma vez.';
COMMENT ON COLUMN public.squad_compras.preco_pago         IS 'Preco pago no momento da aquisicao. 0 para squads gratuitos.';
COMMENT ON COLUMN public.squad_compras.stripe_session_id  IS 'Stripe Checkout Session ID — NULL para squads gratuitos. Usado na fase 2.';
COMMENT ON COLUMN public.squad_compras.stripe_payment_intent IS 'Stripe Payment Intent ID — NULL para squads gratuitos. Usado na fase 2.';
COMMENT ON COLUMN public.squad_compras.status             IS 'completed: acesso garantido. pending: aguarda pagamento Stripe (fase 2). failed: pagamento falhou.';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squad_compras_user   ON public.squad_compras (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_compras_squad  ON public.squad_compras (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_compras_status ON public.squad_compras (status);

-- RLS
ALTER TABLE public.squad_compras ENABLE ROW LEVEL SECURITY;

-- SELECT: membro ve as suas proprias aquisicoes; admin ve todas
DROP POLICY IF EXISTS "Membro ve as suas compras" ON public.squad_compras;
CREATE POLICY "Membro ve as suas compras"
  ON public.squad_compras FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- INSERT: membro autenticado pode registar aquisicao de squad gratuito
-- Squads pagos: INSERT feito via service role pela Edge Function stripe-webhook (fase 2)
DROP POLICY IF EXISTS "Membro adquire squad gratuito" ON public.squad_compras;
CREATE POLICY "Membro adquire squad gratuito"
  ON public.squad_compras FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND preco_pago = 0
    AND status = 'completed'
  );

-- UPDATE: apenas admin (ou service role via webhook Stripe — contorna RLS)
DROP POLICY IF EXISTS "Admin actualiza compras" ON public.squad_compras;
CREATE POLICY "Admin actualiza compras"
  ON public.squad_compras FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: apenas admin
DROP POLICY IF EXISTS "Admin elimina compras" ON public.squad_compras;
CREATE POLICY "Admin elimina compras"
  ON public.squad_compras FOR DELETE
  USING (public.is_admin());


-- ================================================================
-- SECCAO 4b: POLICY COMPLETA SELECT em squads
-- Substitui a policy temporaria da SECCAO 3.
-- Agora que squad_compras existe, podemos referenciar a subquery.
-- ================================================================

DROP POLICY IF EXISTS "Squads publicados sao publicos" ON public.squads;
CREATE POLICY "Squads publicados sao publicos"
  ON public.squads FOR SELECT
  USING (
    -- Squads publicados: qualquer pessoa (anonimo ou autenticado)
    status = 'published'
    -- Admin ve tudo (draft, published, unlisted)
    OR public.is_admin()
    -- Unlisted: acessivel apenas a compradores com aquisicao completed
    OR (
      status = 'unlisted'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.squad_compras sc
        WHERE sc.squad_id = squads.id
          AND sc.user_id  = auth.uid()
          AND sc.status   = 'completed'
      )
    )
  );


-- ================================================================
-- SECCAO 5: TABELA squad_downloads
-- ================================================================

CREATE TABLE IF NOT EXISTS public.squad_downloads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id      uuid        NOT NULL REFERENCES public.squads(id)        ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  compra_id     uuid        NOT NULL REFERENCES public.squad_compras(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.squad_downloads           IS 'Registo de downloads de squads. Permite multiplos downloads por aquisicao.';
COMMENT ON COLUMN public.squad_downloads.compra_id IS 'Referencia obrigatoria a squad_compras — garante que so compradores descarregam.';

-- Indices
CREATE INDEX IF NOT EXISTS idx_squad_downloads_squad  ON public.squad_downloads (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_downloads_user   ON public.squad_downloads (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_downloads_compra ON public.squad_downloads (compra_id);

-- RLS
ALTER TABLE public.squad_downloads ENABLE ROW LEVEL SECURITY;

-- SELECT: membro ve os seus proprios downloads; admin ve todos
DROP POLICY IF EXISTS "Membro ve os seus downloads" ON public.squad_downloads;
CREATE POLICY "Membro ve os seus downloads"
  ON public.squad_downloads FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- INSERT: membro autenticado com aquisicao completed valida
DROP POLICY IF EXISTS "Comprador regista download" ON public.squad_downloads;
CREATE POLICY "Comprador regista download"
  ON public.squad_downloads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.squad_compras sc
      WHERE sc.id       = squad_downloads.compra_id
        AND sc.user_id  = auth.uid()
        AND sc.status   = 'completed'
    )
  );


-- ================================================================
-- SECCAO 6: TRIGGERS
-- ================================================================

-- Trigger: auto-actualizar updated_at em squads antes de UPDATE
DROP TRIGGER IF EXISTS trg_squads_updated_at ON public.squads;
CREATE TRIGGER trg_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger: incrementar total_downloads apos INSERT em squad_downloads
DROP TRIGGER IF EXISTS trg_increment_squad_downloads ON public.squad_downloads;
CREATE TRIGGER trg_increment_squad_downloads
  AFTER INSERT ON public.squad_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_squad_downloads();


-- ================================================================
-- SECCAO 7: SUPABASE STORAGE — Buckets
-- ================================================================

-- Bucket privado para ficheiros ZIP dos squads
-- Downloads via signed URLs gerados pela Edge Function squad-download (fase 2)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'squad-files',
  'squad-files',
  false,
  52428800, -- 50 MB
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public          = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];

COMMENT ON TABLE storage.buckets IS 'Buckets geridos pelo Supabase Storage';

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
  public          = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];


-- Politicas de storage: squad-files (privado)
-- Apenas admin faz upload
DROP POLICY IF EXISTS "Admin faz upload de squad-files" ON storage.objects;
CREATE POLICY "Admin faz upload de squad-files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-files'
    AND public.is_admin()
  );

-- Apenas admin actualiza ficheiros
DROP POLICY IF EXISTS "Admin actualiza squad-files" ON storage.objects;
CREATE POLICY "Admin actualiza squad-files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'squad-files'
    AND public.is_admin()
  );

-- Nota: SELECT de squad-files via signed URL nao requer policy RLS.
-- O Supabase gera signed URLs com service role — contorna RLS por design.


-- Politicas de storage: squad-images (publico)
-- Qualquer pessoa pode ver imagens (bucket publico)
DROP POLICY IF EXISTS "Qualquer pessoa ve squad-images" ON storage.objects;
CREATE POLICY "Qualquer pessoa ve squad-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'squad-images');

-- Apenas admin faz upload de imagens
DROP POLICY IF EXISTS "Admin faz upload de squad-images" ON storage.objects;
CREATE POLICY "Admin faz upload de squad-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-images'
    AND public.is_admin()
  );

-- Apenas admin actualiza imagens
DROP POLICY IF EXISTS "Admin actualiza squad-images" ON storage.objects;
CREATE POLICY "Admin actualiza squad-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'squad-images'
    AND public.is_admin()
  );

-- Admin elimina ficheiros de ambos os buckets
DROP POLICY IF EXISTS "Admin elimina ficheiros de storage" ON storage.objects;
CREATE POLICY "Admin elimina ficheiros de storage"
  ON storage.objects FOR DELETE
  USING (
    (bucket_id = 'squad-files' OR bucket_id = 'squad-images')
    AND public.is_admin()
  );


-- ================================================================
-- SECCAO 8: VIEW v_squad_catalogo
-- ================================================================

-- View para a pagina de listagem (squads.html).
-- Junta squads com categorias e filtra apenas os publicados.
-- RLS da tabela squads aplica-se automaticamente a esta view.
CREATE OR REPLACE VIEW public.v_squad_catalogo AS
SELECT
  s.id,
  s.titulo,
  s.descricao_curta,
  s.slug,
  s.preco,
  s.total_downloads,
  s.imagem_capa,
  s.tags,
  s.agentes,
  s.guia_instalacao,
  s.status,
  s.created_at,
  sc.nome     AS categoria_nome,
  sc.slug     AS categoria_slug,
  sc.icon     AS categoria_icon,
  sc.ordem    AS categoria_ordem
FROM public.squads s
JOIN public.squad_categorias sc ON sc.id = s.categoria_id
WHERE s.status = 'published';

COMMENT ON VIEW public.v_squad_catalogo IS
  'Catalogo publico de squads: produtos publicados com dados da categoria. Usado pela pagina squads.html.';


-- ================================================================
-- SECCAO 9: SEED DATA — Categorias de lancamento
-- ================================================================

-- Apenas 2 categorias no lancamento, conforme PRD-MARKETPLACE.md seccao 2.2.
-- As 8 categorias do 001-squadmarket.sql eram do PRD-SQUADMARKET.md depreciado.
-- Precos terminam sempre em 8 (ex: 0, 8, 18, 48).

INSERT INTO public.squad_categorias (nome, descricao, icon, slug, ordem)
VALUES
  (
    'Squads AIOX',
    'Equipas de agentes IA especializados — gratuitos',
    'robot',
    'squads-aiox',
    1
  ),
  (
    'Clones de Mentes',
    'Replicas de personalidades adaptadas PT',
    'brain',
    'clones-mentes',
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  nome      = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icon      = EXCLUDED.icon,
  ordem     = EXCLUDED.ordem;


-- ================================================================
-- VERIFICACAO: executar apos a migration para confirmar estado
-- ================================================================

-- Confirmar tabelas criadas:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'squad_categorias', 'squads', 'squad_compras', 'squad_downloads'
--   )
-- ORDER BY table_name;

-- Confirmar categorias de lancamento:
-- SELECT id, nome, slug, ordem FROM public.squad_categorias ORDER BY ordem;

-- Confirmar buckets de storage:
-- SELECT id, name, public, file_size_limit FROM storage.buckets
-- WHERE id IN ('squad-files', 'squad-images');

-- Confirmar coluna guia_instalacao na tabela squads:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'squads'
--   AND column_name = 'guia_instalacao';

-- Confirmar que squad_reviews e xp_transactions NAO existem:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('squad_reviews', 'xp_transactions');
-- (deve retornar 0 linhas)


-- ================================================================
-- ROLLBACK SCRIPT
-- Executar APENAS se necessario reverter esta migration completa.
-- ATENCAO: elimina TODOS os dados do marketplace!
-- ================================================================

-- DROP VIEW  IF EXISTS public.v_squad_catalogo;
-- DROP TRIGGER IF EXISTS trg_increment_squad_downloads ON public.squad_downloads;
-- DROP TRIGGER IF EXISTS trg_squads_updated_at ON public.squads;
-- DROP TABLE IF EXISTS public.squad_downloads CASCADE;
-- DROP TABLE IF EXISTS public.squad_compras    CASCADE;
-- DROP TABLE IF EXISTS public.squads           CASCADE;
-- DROP TABLE IF EXISTS public.squad_categorias CASCADE;
-- DROP FUNCTION IF EXISTS public.increment_squad_downloads();
-- DROP FUNCTION IF EXISTS public.update_updated_at();
-- DROP FUNCTION IF EXISTS public.is_admin();
-- DELETE FROM storage.buckets WHERE id IN ('squad-files', 'squad-images');
