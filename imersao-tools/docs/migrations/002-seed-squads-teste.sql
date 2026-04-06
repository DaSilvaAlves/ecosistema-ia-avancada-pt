-- ================================================================
-- SEED DATA: 3 squads de teste para o SquadMarket
-- Executar no Supabase SQL Editor APOS 001-squadmarket.sql
-- ================================================================

-- Buscar o ID do primeiro utilizador admin para usar como autor
-- (ajustar email se necessario)
DO $$
DECLARE
  v_autor_id uuid;
  v_cat_dev uuid;
  v_cat_marketing uuid;
  v_cat_ia uuid;
BEGIN
  -- Buscar autor (primeiro utilizador na base)
  SELECT id INTO v_autor_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_autor_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum utilizador encontrado na base. Faz login primeiro.';
  END IF;

  -- Buscar categorias
  SELECT id INTO v_cat_dev FROM public.squad_categorias WHERE slug = 'desenvolvimento';
  SELECT id INTO v_cat_marketing FROM public.squad_categorias WHERE slug = 'marketing';
  SELECT id INTO v_cat_ia FROM public.squad_categorias WHERE slug = 'ia-automacao';

  -- Squad 1: Gratuito
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status
  ) VALUES (
    'Starter Dev Squad',
    'Squad basico para iniciar projectos de desenvolvimento com 3 agentes essenciais.',
    '## Starter Dev Squad

O squad ideal para quem esta a comecar. Inclui 3 agentes essenciais:

- **@dev** — Implementacao de codigo
- **@qa** — Testes e qualidade
- **@devops** — CI/CD e deploy

### Como usar

1. Descarrega o ZIP
2. Extrai para o teu projecto
3. Executa `npx aiox-core install`

### O que inclui

- 3 agentes configurados
- Templates de stories
- Checklists de qualidade
- Workflow basico (story → dev → qa → deploy)',
    'starter-dev-squad',
    v_cat_dev,
    0,
    v_autor_id,
    'squad-files/starter-dev-squad/starter-dev-squad.zip',
    '[{"nome":"@dev","papel":"Developer","descricao":"Implementacao de codigo"},{"nome":"@qa","papel":"QA Engineer","descricao":"Testes e qualidade"},{"nome":"@devops","papel":"DevOps","descricao":"CI/CD e deploy"}]'::jsonb,
    85,
    '{"ficheiros":90,"dependencias":85,"credenciais":95,"yaml":80,"codigo":82,"documentacao":78}'::jsonb,
    4.2,
    3,
    47,
    'published'
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao_curta = EXCLUDED.descricao_curta,
    status = 'published';

  -- Squad 2: Pago 9,98
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status
  ) VALUES (
    'Marketing AI Squad',
    'Squad completo de marketing digital com copy, social media, SEO e email automation.',
    '## Marketing AI Squad

Squad completo para operacoes de marketing digital com IA.

### 5 Agentes Especializados

- **Copy Chief** — Copywriting de alta conversao
- **Social Media** — Calendario e posts para redes sociais
- **SEO Analyst** — Auditoria e optimizacao SEO
- **Email Strategist** — Sequences e nurture campaigns
- **Brand Voice** — Tom e voz consistente da marca

### Funcionalidades

- Geracao de copy para landing pages
- Calendario social media (30 dias)
- Auditoria SEO completa
- Email sequences automatizadas
- Analise de concorrencia

### Quem deve usar

Freelancers, agencias e equipas de marketing que querem escalar producao de conteudo com IA.',
    'marketing-ai-squad',
    v_cat_marketing,
    9.98,
    v_autor_id,
    'squad-files/marketing-ai-squad/marketing-ai-squad.zip',
    '[{"nome":"Copy Chief","papel":"Copywriter","descricao":"Copywriting de alta conversao"},{"nome":"Social Media","papel":"Social Manager","descricao":"Calendario e posts"},{"nome":"SEO Analyst","papel":"SEO","descricao":"Auditoria e optimizacao"},{"nome":"Email Strategist","papel":"Email","descricao":"Sequences e nurture"},{"nome":"Brand Voice","papel":"Brand","descricao":"Tom e voz da marca"}]'::jsonb,
    92,
    '{"ficheiros":95,"dependencias":90,"credenciais":100,"yaml":88,"codigo":90,"documentacao":89}'::jsonb,
    4.7,
    8,
    23,
    'published'
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao_curta = EXCLUDED.descricao_curta,
    status = 'published';

  -- Squad 3: Pago 49,98 (premium)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status
  ) VALUES (
    'AI Orchestration Elite',
    'O squad mais completo do ecosistema: 12 agentes, 14 workflows, spec pipeline e QA loop automatico.',
    '## AI Orchestration Elite

O squad definitivo para orquestracao de agentes IA. Inclui todo o ecosistema AIOX configurado e pronto a usar.

### 12 Agentes Incluidos

- **@dev** (Dex) — Implementacao
- **@qa** (Quinn) — Quality gates
- **@architect** (Aria) — Arquitectura
- **@pm** (Morgan) — Product Management
- **@po** (Pax) — Product Owner
- **@sm** (River) — Scrum Master
- **@analyst** (Alex) — Pesquisa
- **@data-engineer** (Dara) — Database
- **@ux-design-expert** (Uma) — UX/UI
- **@devops** (Gage) — CI/CD
- **@squad-creator** (Craft) — Criacao de squads
- **@monster** (Rex) — Orquestracao

### 14 Workflows

Story Development Cycle, Epic Orchestration, Spec Pipeline, QA Loop, Brownfield Discovery, e mais 9 workflows especializados.

### Para quem e

Equipas e profissionais que querem o maximo de automacao e orquestracao nos seus projectos de software.',
    'ai-orchestration-elite',
    v_cat_ia,
    49.98,
    v_autor_id,
    'squad-files/ai-orchestration-elite/ai-orchestration-elite.zip',
    '[{"nome":"@dev","papel":"Developer","descricao":"Implementacao de codigo"},{"nome":"@qa","papel":"QA Engineer","descricao":"Quality gates e testes"},{"nome":"@architect","papel":"Architect","descricao":"Design de arquitectura"},{"nome":"@pm","papel":"Product Manager","descricao":"Gestao de produto"},{"nome":"@po","papel":"Product Owner","descricao":"Validacao de stories"},{"nome":"@sm","papel":"Scrum Master","descricao":"Criacao de stories"},{"nome":"@analyst","papel":"Analyst","descricao":"Pesquisa e analise"},{"nome":"@data-engineer","papel":"Data Engineer","descricao":"Schema e migrations"},{"nome":"@ux-design-expert","papel":"UX Designer","descricao":"Design de interfaces"},{"nome":"@devops","papel":"DevOps","descricao":"CI/CD e deploy"},{"nome":"@squad-creator","papel":"Squad Creator","descricao":"Criacao de squads"},{"nome":"@monster","papel":"Orchestrator","descricao":"Orquestracao completa"}]'::jsonb,
    96,
    '{"ficheiros":98,"dependencias":95,"credenciais":100,"yaml":94,"codigo":95,"documentacao":94}'::jsonb,
    4.9,
    12,
    89,
    'published'
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao_curta = EXCLUDED.descricao_curta,
    status = 'published';

  RAISE NOTICE 'Seed completo: 3 squads inseridos com sucesso (autor: %)', v_autor_id;
END $$;
