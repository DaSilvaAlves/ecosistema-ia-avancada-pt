-- ================================================================
-- SEED DATA: Catálogo real de squads para o SquadMarket
-- Baseado no mapeamento completo do ecosistema AIOX
-- Executar no Supabase SQL Editor APÓS 001 e 002
-- ================================================================
-- NOTA: Este script ACTUALIZA os 3 squads de teste existentes
-- e INSERE 9 squads novos baseados em produtos reais.
-- ================================================================

DO $$
DECLARE
  v_autor_id uuid;
  v_cat_dev uuid;
  v_cat_marketing uuid;
  v_cat_ia uuid;
  v_cat_devops uuid;
  v_cat_design uuid;
  v_cat_dados uuid;
  v_cat_negocio uuid;
  v_cat_educacao uuid;
BEGIN
  -- Buscar autor (primeiro utilizador admin)
  SELECT id INTO v_autor_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_autor_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum utilizador encontrado na base. Faz login primeiro.';
  END IF;

  -- Buscar categorias
  SELECT id INTO v_cat_dev FROM public.squad_categorias WHERE slug = 'desenvolvimento';
  SELECT id INTO v_cat_marketing FROM public.squad_categorias WHERE slug = 'marketing';
  SELECT id INTO v_cat_ia FROM public.squad_categorias WHERE slug = 'ia-automacao';
  SELECT id INTO v_cat_devops FROM public.squad_categorias WHERE slug = 'devops';
  SELECT id INTO v_cat_design FROM public.squad_categorias WHERE slug = 'design';
  SELECT id INTO v_cat_dados FROM public.squad_categorias WHERE slug = 'dados';
  SELECT id INTO v_cat_negocio FROM public.squad_categorias WHERE slug = 'negocio';
  SELECT id INTO v_cat_educacao FROM public.squad_categorias WHERE slug = 'educacao';

  -- ══════════════════════════════════════════════════════════════
  -- ACTUALIZAÇÃO DOS 3 SQUADS EXISTENTES
  -- ══════════════════════════════════════════════════════════════

  -- Squad 1: Starter Dev Squad (GRÁTIS) — melhorado
  UPDATE public.squads SET
    titulo = 'Starter Dev Squad',
    descricao_curta = 'Squad essencial com 3 agentes para iniciar qualquer projecto de software com qualidade desde o primeiro commit.',
    descricao_longa = '## Starter Dev Squad

O ponto de partida para quem quer desenvolver software com agentes IA. Inclui os 3 agentes fundamentais do ciclo de desenvolvimento.

### 3 Agentes Incluídos

- **@dev (Dex)** — Implementação de código, debugging, refactoring. Executa stories com precisão e segue padrões de qualidade
- **@qa (Quinn)** — Quality gates, testes automatizados, revisão de código. Garante que nada vai para produção sem validação
- **@devops (Gage)** — CI/CD, git push com quality gates, deploy automatizado. O único agente com autoridade para fazer push

### Workflows Incluídos

- **Story Development Cycle** — O ciclo completo: criar story → implementar → testar → deploy
- **QA Loop** — Ciclo automático de revisão → correcção → re-revisão (até 5 iterações)

### Como utilizar

1. Descarrega o ZIP e extrai para o teu projecto
2. Activa o agente: `@dev` para começar a implementar
3. O @qa revisa automaticamente antes do deploy
4. O @devops faz push com CodeRabbit integrado

### Ideal para

- Programadores que querem começar com agentes IA
- Projectos pessoais ou side projects
- Quem quer testar o ecosistema antes de investir',
    agentes = '[
      {"nome":"@dev (Dex)","papel":"Full Stack Developer","descricao":"Implementação de código, debugging, refactoring, execução de stories"},
      {"nome":"@qa (Quinn)","papel":"QA Engineer","descricao":"Quality gates, testes automatizados, revisão de código"},
      {"nome":"@devops (Gage)","papel":"DevOps Engineer","descricao":"CI/CD, git push com quality gates, deploy automatizado"}
    ]'::jsonb,
    score_seguranca = 85,
    validacao_detalhes = '{"ficheiros":90,"dependencias":85,"credenciais":95,"yaml":80,"codigo":82,"documentacao":78}'::jsonb,
    updated_at = now()
  WHERE slug = 'starter-dev-squad';

  -- Squad 2: Marketing AI Squad (9,98) — melhorado com dados reais
  UPDATE public.squads SET
    titulo = 'Marketing AI Suite',
    descricao_curta = 'Suite completa de marketing digital com 15 skills especializadas: copy, social media, SEO, emails, funis e análise competitiva.',
    descricao_longa = '## Marketing AI Suite

A suite de marketing mais completa do ecosistema. 15 skills especializadas que cobrem todo o ciclo de marketing digital — da auditoria inicial ao relatório final.

### 15 Skills Especializadas

- **Orquestrador** — Coordena todas as skills numa análise unificada de 5 agentes em paralelo
- **Copy** — Copywriting de alta conversão: headlines, value props, before/after, swipe files
- **Social Media** — Calendário 30 dias, content pillars, hooks por plataforma, repurposing 1→10
- **Emails** — Sequences de nurture, cold outreach, welcome series, templates prontos
- **SEO** — Auditoria técnica, keywords, on-page optimization, content gaps
- **Ads** — Criativos para Meta/Google, copy variants, recomendações visuais
- **Funil** — Análise de conversão, friction points, optimização por etapa
- **Landing** — CRO analysis, copy improvements, layout recommendations
- **Competidores** — Intelligence competitiva, positioning gaps, feature comparison
- **Brand** — Voice guidelines, personalidade da marca, consistência
- **Launch** — Playbook de lançamento, go-to-market, timeline
- **Proposal** — Propostas comerciais, ROI calculations, service packages
- **Report** — Relatórios completos em Markdown
- **Report PDF** — Relatórios client-ready em PDF
- **Audit** — Auditoria completa 6 categorias (content, conversion, SEO, positioning, brand, strategy)

### Resultados típicos

- Calendário social media de 30 dias em 5 minutos
- Auditoria SEO completa com action items prioritizados
- Email sequences de 7 emails prontas a enviar
- Análise competitiva com gaps de posicionamento

### Ideal para

- Freelancers de marketing que querem escalar
- Agências que precisam de produção rápida
- Equipas internas que querem IA no workflow diário',
    agentes = '[
      {"nome":"Market Orchestrator","papel":"Orquestrador","descricao":"Coordena 5 agentes em análise paralela"},
      {"nome":"Market Copy","papel":"Copywriter","descricao":"Headlines, value props, swipe files"},
      {"nome":"Market Social","papel":"Social Media","descricao":"Calendário 30 dias, content pillars"},
      {"nome":"Market Emails","papel":"Email Strategist","descricao":"Sequences, nurture, templates"},
      {"nome":"Market SEO","papel":"SEO Analyst","descricao":"Auditoria técnica e on-page"},
      {"nome":"Market Ads","papel":"Ad Creative","descricao":"Copy variants Meta/Google"},
      {"nome":"Market Funnel","papel":"Funnel Analyst","descricao":"Conversão e optimização"},
      {"nome":"Market Landing","papel":"CRO Specialist","descricao":"Landing page optimization"},
      {"nome":"Market Competitors","papel":"Competitive Intel","descricao":"Análise competitiva"},
      {"nome":"Market Brand","papel":"Brand Strategist","descricao":"Voice e consistência"},
      {"nome":"Market Launch","papel":"Launch Planner","descricao":"Go-to-market playbook"},
      {"nome":"Market Proposal","papel":"Proposal Writer","descricao":"Propostas e ROI"},
      {"nome":"Market Report","papel":"Report Generator","descricao":"Relatórios Markdown"},
      {"nome":"Market Report PDF","papel":"PDF Generator","descricao":"Relatórios PDF client-ready"},
      {"nome":"Market Audit","papel":"Marketing Auditor","descricao":"Auditoria 6 categorias"}
    ]'::jsonb,
    score_seguranca = 92,
    validacao_detalhes = '{"ficheiros":95,"dependencias":90,"credenciais":100,"yaml":88,"codigo":90,"documentacao":89}'::jsonb,
    updated_at = now()
  WHERE slug = 'marketing-ai-squad';

  -- Squad 3: AI Orchestration Elite (49,98) — melhorado
  UPDATE public.squads SET
    titulo = 'AIOX Framework Completo',
    descricao_curta = 'O ecosistema completo: 12 agentes, 14 workflows, spec pipeline, QA loop, orquestração Monster e Constitution.',
    descricao_longa = '## AIOX Framework Completo

O pacote definitivo. Todo o ecosistema Synkra AIOX configurado e pronto a utilizar — 12 agentes com personas únicas, 14 workflows automatizados e o Monster como orquestrador pessoal.

### 12 Agentes com Personas

- **@dev (Dex)** — Full Stack Developer: implementação, debugging, refactoring
- **@qa (Quinn)** — QA Engineer: quality gates, testes, spec critique
- **@architect (Aria)** — System Architect: arquitectura, technology selection
- **@pm (Morgan)** — Product Manager: PRDs, epics, roadmap
- **@po (Pax)** — Product Owner: validação de stories, backlog
- **@sm (River)** — Scrum Master: criação de stories, templates
- **@analyst (Alex)** — Research Analyst: pesquisa de mercado, análise
- **@data-engineer (Dara)** — Data Engineer: schema, migrations, RLS
- **@ux-design-expert (Uma)** — UX/UI Designer: wireframes, componentes
- **@devops (Gage)** — DevOps: CI/CD, push exclusivo, CodeRabbit
- **@squad-creator (Craft)** — Squad Creator: criar e publicar squads
- **@monster (Rex)** — Orquestrador: multi-projecto, `*next` automático

### 14 Workflows Automatizados

Story Development Cycle, Epic Orchestration, Spec Pipeline, QA Loop, Brownfield Discovery (10 fases), Greenfield Fullstack/Service/UI, Development Cycle, Auto Worktree, Design System Build Quality.

### Constitution & Governance

- 6 artigos constitucionais (CLI First, Agent Authority, Story-Driven, No Invention, Quality First, Absolute Imports)
- Gates automáticos que bloqueiam violações
- Separação clara de autoridade entre agentes

### Para quem é

- Equipas de desenvolvimento que querem orquestração completa com IA
- CTOs e tech leads que precisam de processos consistentes
- Profissionais que gerem múltiplos projectos em simultâneo',
    agentes = '[
      {"nome":"@dev (Dex)","papel":"Full Stack Developer","descricao":"Implementação, debugging, refactoring"},
      {"nome":"@qa (Quinn)","papel":"QA Engineer","descricao":"Quality gates, testes, spec critique"},
      {"nome":"@architect (Aria)","papel":"System Architect","descricao":"Arquitectura e technology selection"},
      {"nome":"@pm (Morgan)","papel":"Product Manager","descricao":"PRDs, epics, roadmap, spec pipeline"},
      {"nome":"@po (Pax)","papel":"Product Owner","descricao":"Validação de stories, backlog, epic context"},
      {"nome":"@sm (River)","papel":"Scrum Master","descricao":"Criação de stories, templates, lifecycle"},
      {"nome":"@analyst (Alex)","papel":"Research Analyst","descricao":"Pesquisa de mercado, análise competitiva"},
      {"nome":"@data-engineer (Dara)","papel":"Data Engineer","descricao":"Schema design, migrations, RLS policies"},
      {"nome":"@ux-design-expert (Uma)","papel":"UX/UI Designer","descricao":"Wireframes, componentes, audit visual"},
      {"nome":"@devops (Gage)","papel":"DevOps Engineer","descricao":"CI/CD, push exclusivo, CodeRabbit"},
      {"nome":"@squad-creator (Craft)","papel":"Squad Creator","descricao":"Criar, validar e publicar squads"},
      {"nome":"@monster (Rex)","papel":"Project Orchestrator","descricao":"Multi-projecto, *next automático, teaching"}
    ]'::jsonb,
    score_seguranca = 96,
    validacao_detalhes = '{"ficheiros":98,"dependencias":95,"credenciais":100,"yaml":94,"codigo":95,"documentacao":94}'::jsonb,
    updated_at = now()
  WHERE slug = 'ai-orchestration-elite';

  -- ══════════════════════════════════════════════════════════════
  -- NOVOS SQUADS — Produtos reais do ecosistema
  -- ══════════════════════════════════════════════════════════════

  -- Squad 4: Copy Chief Elite (GRÁTIS — entry-level para atrair membros)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Copy Chief — 24 Copywriters Lendários',
    'Orquestra 24 copywriters lendários com sistema de 3 tiers: diagnóstico, execução e auditoria Hopkins. 30 triggers de Sugarman incluídos.',
    '## Copy Chief — 24 Copywriters Lendários

O Copy Chief é um orquestrador autónomo que coordena 24 copywriters lendários organizados em 3 tiers. Cada copywriter traz a sua metodologia única — desde os 30 triggers de Joe Sugarman à auditoria científica de Claude Hopkins.

### Sistema de 3 Tiers

**Tier 0 — Diagnóstico**
Análise do problema, identificação do nível de awareness (Eugene Schwartz), e routing para o especialista certo.

**Tier 1-3 — Execução**
24 copywriters especializados por tipo de copy:
- **Eugene Schwartz** — Níveis de awareness e sofisticação de mercado
- **Robert Collier** — Conversa mental do leitor
- **Joe Sugarman** — 30 triggers psicológicos de compra
- **Gary Halbert** — Email copy e direct response
- **Dan Kennedy** — Sales letters e upsell sequences
- **David Ogilvy** — Brand copy e headlines
- **Claude Hopkins** — Copy científico e teste A/B
- E mais 17 especialistas...

**Auditoria Final**
Auditoria Hopkins — validação científica de todo o copy produzido.

### O que podes fazer

- Gerar headlines com scoring automático
- Criar sales pages completas
- Email sequences de alta conversão
- Posts para redes sociais optimizados
- Propostas comerciais persuasivas

### Ideal para

- Copywriters que querem elevar o nível
- Marketers que precisam de copy rápido e eficaz
- Empreendedores que escrevem o seu próprio copy',
    'copy-chief-elite',
    v_cat_marketing,
    0,
    v_autor_id,
    'squad-files/copy-chief-elite/copy-chief-elite.zip',
    '[
      {"nome":"Copy Chief","papel":"Orquestrador","descricao":"Coordena 24 copywriters, routing por tier"},
      {"nome":"Eugene Schwartz","papel":"Awareness Expert","descricao":"Níveis de awareness e sofisticação"},
      {"nome":"Joe Sugarman","papel":"Trigger Master","descricao":"30 triggers psicológicos de compra"},
      {"nome":"Robert Collier","papel":"Mental Conversation","descricao":"Conversa mental do leitor"},
      {"nome":"Gary Halbert","papel":"Direct Response","descricao":"Email copy e direct mail"},
      {"nome":"Dan Kennedy","papel":"Sales Specialist","descricao":"Sales letters e upsell"},
      {"nome":"David Ogilvy","papel":"Brand Copywriter","descricao":"Headlines e brand copy"},
      {"nome":"Claude Hopkins","papel":"Scientific Copy","descricao":"Teste A/B e auditoria científica"}
    ]'::jsonb,
    88,
    '{"ficheiros":92,"dependencias":85,"credenciais":100,"yaml":82,"codigo":85,"documentacao":88}'::jsonb,
    4.6,
    15,
    112,
    'published',
    ARRAY['copywriting','copy','headlines','email','sales','triggers','sugarman','hopkins']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 5: Design System Squad (4,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Design System Squad',
    'Squad completo para design systems: Brad Frost (atomic design), Dan Mall (adopção), Dave Malouf (DesignOps) e geração de assets com IA.',
    '## Design System Squad

Quatro especialistas de design system que cobrem desde a arquitectura de componentes até à adopção pela equipa. Baseado nas metodologias reais de Brad Frost, Dan Mall e Dave Malouf.

### 4 Especialistas + Orquestrador

- **Design Chief** — Orquestra o squad, decide estratégia, resolve conflitos entre tokens
- **Brad Frost** — Atomic Design: átomos → moléculas → organismos → templates → páginas. Extracção de tokens, consolidação de padrões, documentação
- **Dan Mall** — Adopção de design system: ROI calculation, shock reports, stakeholder buy-in, narrativa de adopção
- **Dave Malouf** — DesignOps: processos de design, métricas de eficiência, team scaling, tooling audit
- **Nano Banana Generator** — Geração de assets visuais com IA (thumbnails, ícones, ilustrações, variantes)

### Workflows Incluídos

- **Brownfield Audit** — Auditar design system existente, identificar inconsistências
- **Token Extraction** — Extrair tokens de cores, tipografia, espaçamento de qualquer codebase
- **Component Building** — Construir componentes seguindo Atomic Design
- **Migration Planning** — Planear migração gradual para design system unificado

### Resultados

- Design tokens documentados e exportáveis
- Componentes classificados por nível atómico
- Relatório de adopção com ROI estimado
- Assets gerados com IA alinhados à marca',
    'design-system-squad',
    v_cat_design,
    4.98,
    v_autor_id,
    'squad-files/design-system-squad/design-system-squad.zip',
    '[
      {"nome":"Design Chief","papel":"Orquestrador","descricao":"Estratégia e decisões de design system"},
      {"nome":"Brad Frost","papel":"Atomic Design","descricao":"Componentes, tokens, padrões"},
      {"nome":"Dan Mall","papel":"Adopção","descricao":"ROI, stakeholders, narrativa"},
      {"nome":"Dave Malouf","papel":"DesignOps","descricao":"Processos, métricas, scaling"},
      {"nome":"Nano Banana","papel":"Asset Generator","descricao":"Geração de assets visuais com IA"}
    ]'::jsonb,
    90,
    '{"ficheiros":94,"dependencias":88,"credenciais":100,"yaml":86,"codigo":88,"documentacao":92}'::jsonb,
    4.5,
    6,
    34,
    'published',
    ARRAY['design','design-system','atomic-design','tokens','componentes','UI','UX','brad-frost']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 6: Data Intelligence Squad (9,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Data Intelligence Squad',
    'Squad de analytics com 6 especialistas: CLV, segmentação RFM, churn prediction, health scoring, community metrics e attribution.',
    '## Data Intelligence Squad

Seis especialistas em data intelligence que transformam dados brutos em decisões accionáveis. Cada especialista traz metodologias comprovadas de líderes da indústria.

### 6 Especialistas + Orquestrador

- **Data Chief** — Orquestra os especialistas em 3 tiers (fundamentação → operacionalização → comunicação)
- **Peter Fader** — CLV calculation, segmentação RFM, customer lifetime value
- **Sean Ellis** — PMF testing, north star metrics, growth experimentation, framework AARRR
- **Nick Mehta** — Health score design, churn prediction, customer success playbooks
- **David Spinks** — Community health, engagement measurement, member value
- **Wes Kao** — Learning outcomes, completion rates, cohort design
- **Avinash Kaushik** — Attribution modeling, dashboard design, reporting

### Casos de uso

- **SaaS** — Calcular CLV, prever churn, definir health score
- **Comunidades** — Medir engagement, identificar membros em risco, optimizar retenção
- **E-commerce** — Segmentação RFM, attribution, funnel analytics
- **Educação** — Completion rates, learning outcomes, cohort analysis

### Output típico

- Dashboards com KPIs accionáveis
- Segmentos de clientes com recomendações
- Modelos de churn prediction
- Relatórios de attribution com ROI',
    'data-intelligence-squad',
    v_cat_dados,
    9.98,
    v_autor_id,
    'squad-files/data-intelligence-squad/data-intelligence-squad.zip',
    '[
      {"nome":"Data Chief","papel":"Orquestrador","descricao":"Coordena especialistas em 3 tiers"},
      {"nome":"Peter Fader","papel":"CLV & Segmentação","descricao":"Customer lifetime value, RFM"},
      {"nome":"Sean Ellis","papel":"Growth & PMF","descricao":"North star metrics, AARRR"},
      {"nome":"Nick Mehta","papel":"Health & Churn","descricao":"Health score, churn prediction"},
      {"nome":"David Spinks","papel":"Community Metrics","descricao":"Engagement, member value"},
      {"nome":"Wes Kao","papel":"Learning Outcomes","descricao":"Completion rates, cohort design"},
      {"nome":"Avinash Kaushik","papel":"Analytics & Attribution","descricao":"Dashboards, reporting, ROI"}
    ]'::jsonb,
    91,
    '{"ficheiros":94,"dependencias":90,"credenciais":100,"yaml":88,"codigo":89,"documentacao":90}'::jsonb,
    4.8,
    9,
    41,
    'published',
    ARRAY['data','analytics','CLV','RFM','churn','segmentacao','dashboards','KPIs']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 7: Product Management Suite (4,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Product Management Suite',
    '4 agentes especializados em gestão de produto: PRDs, epics, stories, validação, backlog e pesquisa de mercado.',
    '## Product Management Suite

A suite completa para gestão de produto com IA. Desde a pesquisa de mercado até à criação de stories prontas para desenvolvimento.

### 4 Agentes Especializados

- **@pm (Morgan)** — Product Manager: cria PRDs, define roadmap, prioriza features (MoSCoW/RICE), gere epics com wave-based execution
- **@po (Pax)** — Product Owner: valida stories com checklist de 10 pontos, gere backlog, mantém contexto de epic
- **@sm (River)** — Scrum Master: cria stories a partir de PRDs/epics, selecciona templates, gere lifecycle
- **@analyst (Alex)** — Research Analyst: pesquisa de mercado, análise competitiva, brainstorming facilitado

### Workflows Incluídos

- **Spec Pipeline** — Requisitos vagos → spec executável em 5 fases (gather → assess → research → write → critique)
- **Epic Orchestration** — Múltiplas stories em waves paralelas com quality gates
- **Story Development Cycle** — Criar → validar → implementar → QA gate

### O que produz

- PRDs completos e estruturados
- Stories com acceptance criteria precisos
- Épicos com waves de execução definidos
- Pesquisa de mercado com insights accionáveis
- Backlog priorizado e validado

### Ideal para

- Product managers que querem acelerar a documentação
- Founders que precisam de estrutura de produto
- Equipas ágeis que querem stories de qualidade superior',
    'product-management-suite',
    v_cat_negocio,
    4.98,
    v_autor_id,
    'squad-files/product-management-suite/product-management-suite.zip',
    '[
      {"nome":"@pm (Morgan)","papel":"Product Manager","descricao":"PRDs, roadmap, epics, priorização"},
      {"nome":"@po (Pax)","papel":"Product Owner","descricao":"Validação 10 pontos, backlog, epic context"},
      {"nome":"@sm (River)","papel":"Scrum Master","descricao":"Stories, templates, lifecycle"},
      {"nome":"@analyst (Alex)","papel":"Research Analyst","descricao":"Pesquisa, análise competitiva, brainstorming"}
    ]'::jsonb,
    89,
    '{"ficheiros":92,"dependencias":87,"credenciais":100,"yaml":85,"codigo":86,"documentacao":90}'::jsonb,
    4.4,
    7,
    28,
    'published',
    ARRAY['produto','PRD','stories','epics','backlog','agile','scrum','roadmap']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 8: DevOps & Quality Gates (4,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'DevOps & Quality Gates',
    'Pipeline completo de CI/CD com CodeRabbit integrado, pre-push automático, GitHub Actions e release management.',
    '## DevOps & Quality Gates

O pipeline definitivo para garantir que cada push para produção passa por quality gates rigorosos. CodeRabbit integrado para code review automatizado.

### Capacidades

- **Pre-push automático** — CodeRabbit analisa código antes de cada push, bloqueia se encontrar issues críticos
- **Push com quality gates** — Lint, typecheck, testes, CodeRabbit — tudo tem de passar
- **GitHub Actions** — Templates de CI/CD prontos a utilizar
- **Release management** — Versioning semântico, changelog automático
- **Environment bootstrap** — Configura repositório completo do zero (git init → GitHub remote → CI/CD)

### Workflows

1. `*pre-push` — Executa CodeRabbit + quality gates antes do push
2. `*push` — Push seguro com todas as validações
3. `*create-pr` — Cria PR com template estruturado
4. `*release` — Release com versioning + changelog
5. `*environment-bootstrap` — Setup completo de repositório
6. `*configure-ci` — Configura GitHub Actions

### Self-Healing Loop

Se o CodeRabbit encontrar issues CRITICAL:
1. Tenta corrigir automaticamente (max 2 iterações)
2. Se não conseguir → bloqueia push e reporta
3. Issues HIGH são documentados mas não bloqueiam

### Ideal para

- Equipas que querem zero bugs em produção
- Projectos que precisam de CI/CD robusto
- Developers que querem code review automatizado',
    'devops-quality-gates',
    v_cat_devops,
    4.98,
    v_autor_id,
    'squad-files/devops-quality-gates/devops-quality-gates.zip',
    '[
      {"nome":"@devops (Gage)","papel":"DevOps Engineer","descricao":"CI/CD, push exclusivo, release management"},
      {"nome":"CodeRabbit","papel":"Code Reviewer","descricao":"Review automatizado, self-healing loop"},
      {"nome":"Architect First","papel":"Architecture Guard","descricao":"Valida arquitectura antes de implementar"}
    ]'::jsonb,
    94,
    '{"ficheiros":96,"dependencias":92,"credenciais":100,"yaml":90,"codigo":94,"documentacao":92}'::jsonb,
    4.7,
    11,
    56,
    'published',
    ARRAY['devops','CI/CD','CodeRabbit','GitHub','quality','deploy','release','pipeline']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 9: SEO & Content Engine (GRÁTIS)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'SEO & Content Engine',
    'Motor de conteúdo optimizado para SEO: auditoria técnica, keyword research, content gaps, on-page optimization e calendário editorial.',
    '## SEO & Content Engine

Combina análise SEO técnica com produção de conteúdo optimizado. Da auditoria à publicação, com tudo documentado.

### 4 Skills Combinadas

- **Market SEO** — Auditoria técnica completa: keywords, on-page, technical SEO, content gaps
- **Market Copy** — Copywriting optimizado para SEO: headlines com scoring, meta descriptions, body copy
- **Market Social** — Calendário de 30 dias com conteúdo alinhado à estratégia SEO
- **Market Brand** — Tom de voz consistente em todo o conteúdo

### Output

- Relatório de auditoria SEO com prioridades
- Lista de keywords com volume e dificuldade
- Content gaps vs concorrência
- 30 posts optimizados para redes sociais
- Guidelines de brand voice para consistência

### Ideal para

- Bloggers e criadores de conteúdo
- Equipas de content marketing
- Freelancers de SEO que querem escalar',
    'seo-content-engine',
    v_cat_marketing,
    0,
    v_autor_id,
    'squad-files/seo-content-engine/seo-content-engine.zip',
    '[
      {"nome":"Market SEO","papel":"SEO Analyst","descricao":"Auditoria técnica, keywords, content gaps"},
      {"nome":"Market Copy","papel":"Content Writer","descricao":"Copy optimizado para SEO"},
      {"nome":"Market Social","papel":"Social Planner","descricao":"Calendário 30 dias alinhado ao SEO"},
      {"nome":"Market Brand","papel":"Brand Voice","descricao":"Tom e consistência da marca"}
    ]'::jsonb,
    86,
    '{"ficheiros":90,"dependencias":84,"credenciais":100,"yaml":82,"codigo":84,"documentacao":86}'::jsonb,
    4.3,
    5,
    67,
    'published',
    ARRAY['SEO','content','keywords','auditoria','copy','social-media','blog']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 10: Funnel & Conversion Squad (9,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Funnel & Conversion Squad',
    'Optimização de funis de venda: análise de conversão, landing pages, email sequences, ads e propostas comerciais.',
    '## Funnel & Conversion Squad

Do topo ao fundo do funil — 6 skills que trabalham em conjunto para maximizar conversão em cada etapa.

### 6 Skills Integradas

- **Market Funnel** — Mapeia o funil completo, identifica friction points, recomenda optimizações por etapa
- **Market Landing** — CRO analysis: layout, copy, CTAs, formulários, social proof
- **Market Emails** — Sequences de nurture, welcome series, re-engagement, abandono de carrinho
- **Market Ads** — Criativos para Meta e Google Ads com copy variants e targeting
- **Market Proposal** — Propostas comerciais com ROI calculations e service packages
- **Market Launch** — Playbook de lançamento com timeline e go-to-market

### Fluxo de trabalho

1. **Análise** — Audita funil existente, identifica onde perdes conversões
2. **Landing** — Optimiza páginas de destino para máxima conversão
3. **Nurture** — Cria sequences de email para cada etapa do funil
4. **Ads** — Gera criativos para atrair tráfego qualificado
5. **Close** — Propostas e materiais de fecho de venda

### Ideal para

- Negócios com funil de vendas online
- Agências de performance marketing
- SaaS com trial → paid conversion',
    'funnel-conversion-squad',
    v_cat_marketing,
    9.98,
    v_autor_id,
    'squad-files/funnel-conversion-squad/funnel-conversion-squad.zip',
    '[
      {"nome":"Market Funnel","papel":"Funnel Analyst","descricao":"Mapeamento e optimização de funil"},
      {"nome":"Market Landing","papel":"CRO Specialist","descricao":"Landing page optimization"},
      {"nome":"Market Emails","papel":"Email Strategist","descricao":"Sequences e nurture campaigns"},
      {"nome":"Market Ads","papel":"Ad Creative","descricao":"Criativos Meta/Google"},
      {"nome":"Market Proposal","papel":"Proposal Writer","descricao":"Propostas com ROI"},
      {"nome":"Market Launch","papel":"Launch Planner","descricao":"Go-to-market playbook"}
    ]'::jsonb,
    90,
    '{"ficheiros":93,"dependencias":88,"credenciais":100,"yaml":86,"codigo":88,"documentacao":90}'::jsonb,
    4.6,
    8,
    35,
    'published',
    ARRAY['funil','conversao','CRO','landing-page','email','ads','vendas']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 11: Database & Schema Architect (4,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Database & Schema Architect',
    'Especialista em bases de dados: domain modeling, schema design, migrations, RLS policies, query optimization e auditoria.',
    '## Database & Schema Architect

O especialista definitivo em bases de dados. Desde o domain modeling inicial até à optimização de queries em produção.

### Capacidades

- **@data-engineer (Dara)** — Schema design detalhado, DDL, migrations
- **@architect (Aria)** — Arquitectura de dados de alto nível, decisões tecnológicas

### Comandos Principais

- `*db-domain-modeling` — Modelar domínio de dados a partir de requisitos
- `*db-schema-audit` — Auditar schema existente: índices, constraints, normalização
- `*db-apply-migration` — Aplicar migrations de forma segura e reversível
- `*db-rls-policies` — Desenhar e implementar Row Level Security
- `*db-query-optimization` — Optimizar queries lentas com EXPLAIN ANALYZE

### Suporte para

- **PostgreSQL / Supabase** — Schema, RLS, Edge Functions, triggers
- **MySQL** — Schema design, índices, stored procedures
- **MongoDB** — Document modeling, agregações, índices

### Ideal para

- Developers que precisam de schema robusto
- Projectos Supabase que precisam de RLS bem configurado
- Equipas que querem auditar bases de dados existentes',
    'database-schema-architect',
    v_cat_dados,
    4.98,
    v_autor_id,
    'squad-files/database-schema-architect/database-schema-architect.zip',
    '[
      {"nome":"@data-engineer (Dara)","papel":"Data Engineer","descricao":"Schema design, migrations, RLS, query optimization"},
      {"nome":"@architect (Aria)","papel":"System Architect","descricao":"Arquitectura de dados, decisões tecnológicas"}
    ]'::jsonb,
    93,
    '{"ficheiros":96,"dependencias":91,"credenciais":100,"yaml":90,"codigo":92,"documentacao":91}'::jsonb,
    4.8,
    10,
    44,
    'published',
    ARRAY['database','schema','migrations','RLS','PostgreSQL','Supabase','SQL','optimization']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  -- Squad 12: Architect & Tech Research (19,98)
  INSERT INTO public.squads (
    titulo, descricao_curta, descricao_longa, slug, categoria_id, preco,
    autor_id, zip_path, agentes, score_seguranca, validacao_detalhes,
    rating_medio, total_reviews, total_downloads, status, tags
  ) VALUES (
    'Architect & Tech Research',
    'Arquitectura fullstack completa: análise de projectos existentes, brownfield discovery, tech research e documentação técnica.',
    '## Architect & Tech Research

O arquitecto de software com capacidades de pesquisa profunda. Analisa projectos existentes, define arquitectura para projectos novos e pesquisa tecnologias antes de decidir.

### Capacidades Únicas

- **Análise de projecto existente** — Scan completo do filesystem, identifica padrões, dívida técnica e oportunidades
- **Brownfield Discovery** — 10 fases de avaliação de dívida técnica para projectos legados
- **Arquitectura fullstack** — Define stack, estrutura, padrões, integrations para projectos novos
- **Tech Research** — Pesquisa profunda sobre tecnologias, frameworks e libraries antes de decidir
- **Documentação técnica** — ADRs, architecture documents, diagramas

### Workflows

- `*create-full-stack-architecture` — Arquitectura completa do zero
- `*create-brownfield-architecture` — Arquitectura para projecto existente
- `*analyze-project-structure` — Análise detalhada de codebase
- `*research {topic}` — Pesquisa técnica aprofundada
- `*document-project` — Gera documentação técnica completa

### Para quem é

- Tech leads que precisam de documentação de arquitectura
- Equipas que vão entrar num projecto legado
- CTOs que precisam de decisões tecnológicas fundamentadas',
    'architect-tech-research',
    v_cat_dev,
    19.98,
    v_autor_id,
    'squad-files/architect-tech-research/architect-tech-research.zip',
    '[
      {"nome":"@architect (Aria)","papel":"System Architect","descricao":"Arquitectura, technology selection, ADRs"},
      {"nome":"Tech Search","papel":"Deep Researcher","descricao":"Pesquisa técnica com WebSearch + Haiku workers"},
      {"nome":"Architect First","papel":"Architecture Guard","descricao":"Garante design completo antes de código"}
    ]'::jsonb,
    95,
    '{"ficheiros":98,"dependencias":94,"credenciais":100,"yaml":92,"codigo":94,"documentacao":96}'::jsonb,
    4.9,
    14,
    62,
    'published',
    ARRAY['arquitectura','fullstack','brownfield','research','ADR','documentacao','tech-stack']
  ) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo, descricao_curta = EXCLUDED.descricao_curta,
    descricao_longa = EXCLUDED.descricao_longa, status = 'published';

  RAISE NOTICE 'Seed completo: 3 squads actualizados + 9 squads novos inseridos (total: 12)';
END $$;
