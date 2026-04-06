-- ================================================================
-- MIGRATION 007: Correcção dados fictícios + preços aprovados
-- Data: 24/03/2026
-- Aprovado por: Eurico (fundador)
-- Contexto: Incidente SquadMarket — dados fictícios publicados como reais
-- Referência: HANDOFF_23032026_SQUADMARKET_AUDITORIA.md
-- ================================================================
-- REGRAS APLICADAS:
-- 1. Downloads, ratings e reviews ZERADOS (zero dados fictícios)
-- 2. Preços definidos EXCLUSIVAMENTE pelo Eurico (terminam em 8)
-- 3. Tiers: Grátis / 4,88 / 8,88 / 18,88 / 48,88
-- ================================================================

-- PASSO 1: Zerar TODOS os dados fictícios em TODOS os squads
UPDATE public.squads SET
  rating_medio = NULL,
  total_reviews = 0,
  total_downloads = 0,
  updated_at = now();

-- PASSO 2: Aplicar preços aprovados pelo Eurico (24/03/2026)

-- TIER GRÁTIS (0,00 EUR)
UPDATE public.squads SET preco = 0.00, updated_at = now()
WHERE slug = 'starter-dev-squad';

-- TIER BÁSICO (4,88 EUR)
UPDATE public.squads SET preco = 4.88, updated_at = now()
WHERE slug IN ('seo-content-engine', 'funnel-conversion-squad');

-- TIER MÉDIO (8,88 EUR)
UPDATE public.squads SET preco = 8.88, updated_at = now()
WHERE slug IN (
  'copy-chief-elite',
  'design-system-squad',
  'product-management-suite',
  'devops-quality-gates',
  'database-schema-architect',
  'data-intelligence-squad'
);

-- TIER ALTO (18,88 EUR)
UPDATE public.squads SET preco = 18.88, updated_at = now()
WHERE slug IN ('marketing-ai-squad', 'architect-tech-research');

-- TIER PREMIUM (48,88 EUR)
UPDATE public.squads SET preco = 48.88, updated_at = now()
WHERE slug = 'ai-orchestration-elite';

-- VERIFICAÇÃO: Confirmar que não existem dados fictícios
-- Executar após a migration para validar:
-- SELECT slug, preco, rating_medio, total_reviews, total_downloads FROM public.squads ORDER BY preco;
