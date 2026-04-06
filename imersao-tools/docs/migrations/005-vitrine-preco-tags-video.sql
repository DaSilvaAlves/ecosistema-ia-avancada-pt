-- ============================================
-- MIGRATION: vitrine — add preco, tags, video_url
-- Novas colunas para a Vitrine [IA] page
-- Corre no Supabase SQL Editor
-- Projecto: hpqowjelvtejbutyvojo
-- Data: 22/03/2026
-- ============================================

-- 1. Coluna preco (texto livre: "49€", "Gratuito", etc.)
alter table vitrine add column if not exists preco text default null;

-- 2. Coluna tags (array de texto para filtros e categorias)
alter table vitrine add column if not exists tags text[] default '{}';

-- 3. Coluna video_url (URL de YouTube, Vimeo ou Loom para embed)
alter table vitrine add column if not exists video_url text default null;

-- 4. Indice GIN para pesquisa por tags
create index if not exists idx_vitrine_tags on vitrine using gin(tags);

-- ============================================
-- ROLLBACK (se necessario):
-- drop index if exists idx_vitrine_tags;
-- alter table vitrine drop column if exists video_url;
-- alter table vitrine drop column if exists tags;
-- alter table vitrine drop column if exists preco;
-- ============================================
