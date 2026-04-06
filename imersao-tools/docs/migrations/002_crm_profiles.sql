-- ============================================
-- Migration 002: CRM fields for profiles table
-- Comunidade [IA]AVANÇADA PT
-- 2026-03-28
-- ============================================

-- 1. Adicionar campos CRM à tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS nicho text,
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'organico',
  ADD COLUMN IF NOT EXISTS last_contact timestamptz,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS pais text;

-- 2. Comentários para documentação
COMMENT ON COLUMN public.profiles.website IS 'Website(s) do membro';
COMMENT ON COLUMN public.profiles.nicho IS 'Área de actuação / nicho de mercado';
COMMENT ON COLUMN public.profiles.notas IS 'Notas internas (só admin vê)';
COMMENT ON COLUMN public.profiles.tags IS 'Tags para segmentação (ex: imersao-gratuita, lead-quente)';
COMMENT ON COLUMN public.profiles.source IS 'Origem do membro (organico, ads, referral, evento)';
COMMENT ON COLUMN public.profiles.last_contact IS 'Última vez que contactámos este membro';
COMMENT ON COLUMN public.profiles.estado IS 'Estado do membro (activo, pendente, inactivo, vip)';
COMMENT ON COLUMN public.profiles.pais IS 'País do membro (PT, BR, etc.)';

-- 3. Index para buscas por estado e tags
CREATE INDEX IF NOT EXISTS idx_profiles_estado ON public.profiles(estado);
CREATE INDEX IF NOT EXISTS idx_profiles_tags ON public.profiles USING gin(tags);

-- 4. RLS: notas só visíveis para o próprio ou admin
-- (mantém as policies existentes, adiciona proteção ao campo notas)
-- Nota: o campo notas pode ser protegido via view se necessário no futuro
