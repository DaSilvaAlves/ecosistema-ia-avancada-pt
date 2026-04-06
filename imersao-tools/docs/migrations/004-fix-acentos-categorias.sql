-- ================================================================
-- FIX: Correcção de acentos nas categorias do SquadMarket
-- Executar no Supabase SQL Editor
-- ================================================================

UPDATE public.squad_categorias SET nome = 'IA e Automação', descricao = 'Squads especializados em IA e automação' WHERE slug = 'ia-automacao';
UPDATE public.squad_categorias SET nome = 'Negócio', descricao = 'Squads para gestão, estratégia e operações' WHERE slug = 'negocio';
UPDATE public.squad_categorias SET nome = 'Educação', descricao = 'Squads para ensino e formação' WHERE slug = 'educacao';
UPDATE public.squad_categorias SET descricao = 'Squads para desenvolvimento de software' WHERE slug = 'desenvolvimento';
UPDATE public.squad_categorias SET descricao = 'Squads para marketing digital e conteúdo' WHERE slug = 'marketing';
UPDATE public.squad_categorias SET descricao = 'Squads para CI/CD, deploy e infraestrutura' WHERE slug = 'devops';
UPDATE public.squad_categorias SET descricao = 'Squads para design system e UX' WHERE slug = 'design';
UPDATE public.squad_categorias SET descricao = 'Squads para engenharia de dados e analytics' WHERE slug = 'dados';
