-- ================================================================
-- SEED: 13 produtos do marketplace [IA]AVANCADA PT
-- Data: 26/03/2026
-- Fonte: PRDs em imersao-tools/marketplace/docs/
-- Idempotente: ON CONFLICT (slug) DO UPDATE
-- ================================================================


-- ----------------------------------------------------------------
-- 1. AI Orchestration Elite — AIOX Framework Completo (13 agentes)
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'AI Orchestration Elite',
  'O ecosistema completo Synkra AIOX: 13 agentes com personas unicas, workflows automatizados e orquestracao inteligente. Tudo incluido para gerir qualquer projecto de software de ponta a ponta.',
  E'## O que e\n\nO ecosistema completo Synkra AIOX — 13 agentes especializados com personas unicas, workflows automatizados e orquestracao inteligente. E o pacote completo para quem quer gerir qualquer projecto de software de ponta a ponta com IA.\n\n## O que inclui\n\n### 13 Agentes Especializados\n\n| Agente | Especialidade |\n|--------|---------------|\n| @dev (Dex) | Implementacao, debugging, refactoring |\n| @qa (Quinn) | Quality gates, testes, revisao |\n| @architect (Aria) | Arquitectura, technology selection |\n| @pm (Morgan) | PRDs, epics, roadmap |\n| @po (Pax) | Validacao de stories, backlog |\n| @sm (River) | Criacao de stories, sprints |\n| @analyst (Alex) | Pesquisa, analise de mercado |\n| @data-engineer (Dara) | Schema, migrations, RLS |\n| @ux-design-expert (Uma) | UX/UI, wireframes, componentes |\n| @devops (Gage) | CI/CD, deploy, push exclusivo |\n| @squad-creator (Craft) | Criacao e publicacao de squads |\n| @monster (Rex) | Orquestracao multi-projecto |\n| @aiox-master (Orion) | Governance do framework |\n\n### 4 Workflows Incluidos\n\n- **Story Development Cycle** — criar, validar, implementar, testar, deploy\n- **QA Loop** — revisao automatica ate 5 iteracoes\n- **Spec Pipeline** — de requisitos informais a spec executavel\n- **Epic Orchestration** — gestao de epics com multiplas stories\n\n## Para quem e\n\nQuem quer o ecosistema completo de agentes IA para gerir qualquer projecto de software de ponta a ponta.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'ai-orchestration-elite',
  (SELECT id FROM public.squad_categorias WHERE slug = 'ia-automacao'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/ai-orchestration-elite/ai-orchestration-elite.zip',
  '{aiox,orquestracao,agentes,framework,completo}',
  '[{"nome":"@dev (Dex)","papel":"Implementacao","descricao":"Implementacao de codigo, debugging e refactoring"},{"nome":"@qa (Quinn)","papel":"Qualidade","descricao":"Quality gates, testes e revisao de codigo"},{"nome":"@architect (Aria)","papel":"Arquitectura","descricao":"Arquitectura de sistemas e technology selection"},{"nome":"@pm (Morgan)","papel":"Product Management","descricao":"PRDs, epics e roadmap de produto"},{"nome":"@po (Pax)","papel":"Product Owner","descricao":"Validacao de stories e gestao de backlog"},{"nome":"@sm (River)","papel":"Scrum Master","descricao":"Criacao de stories e gestao de sprints"},{"nome":"@analyst (Alex)","papel":"Analise","descricao":"Pesquisa e analise de mercado"},{"nome":"@data-engineer (Dara)","papel":"Engenharia de Dados","descricao":"Schema, migrations e RLS policies"},{"nome":"@ux-design-expert (Uma)","papel":"UX/UI","descricao":"UX/UI, wireframes e especificacao de componentes"},{"nome":"@devops (Gage)","papel":"DevOps","descricao":"CI/CD, deploy e push exclusivo para remote"},{"nome":"@squad-creator (Craft)","papel":"Squad Creator","descricao":"Criacao e publicacao de squads"},{"nome":"@monster (Rex)","papel":"Orquestrador","descricao":"Orquestracao multi-projecto e overview global"},{"nome":"@aiox-master (Orion)","papel":"Governance","descricao":"Governance do framework e enforcement constitucional"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar um agente\n\n```\n@monster\n*status\n```\n\nOu comeca pelo orquestrador:\n\n```\n@pm\nCria um PRD para a tua ideia\n@sm *draft\n@dev *develop\n@qa *review\n@devops *push\n```\n\n## Verificacao\n\nApos instalar, testa com `@monster *help` — deves ver todos os agentes disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 2. Architect & Tech Research
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Architect & Tech Research',
  '2 agentes + 2 skills para tomar decisoes tecnicas informadas. @architect desenha a solucao, @analyst investiga as opcoes — sem achismos, com investigacao real.',
  E'## O que e\n\n2 agentes especializados e 2 skills para arquitectura de sistemas e investigacao tecnologica profunda. Ideal para quem precisa de tomar decisoes tecnicas fundamentadas — sem achismos, com investigacao real.\n\n## O que inclui\n\n### 2 Agentes\n\n| Agente | Especialidade |\n|--------|---------------|\n| @architect (Aria) | Arquitectura de sistemas, technology selection |\n| @analyst (Alex) | Deep research, analise de mercado e trade-offs |\n\n### 2 Skills\n\n| Skill | O que faz |\n|-------|----------|\n| `/architect-first` | Filosofia architecture-first com checklists |\n| `/tech-search` | Investigacao tecnologica profunda com fontes |\n\n### Workflow\n\n`@architect` desenha → `/tech-search` investiga opcoes → `@analyst` analisa trade-offs → decisao informada\n\n## Para quem e\n\nQuem precisa de desenhar arquitectura de software e tomar decisoes tecnicas fundamentadas com investigacao real.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'architect-tech-research',
  (SELECT id FROM public.squad_categorias WHERE slug = 'desenvolvimento'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/architect-tech-research/architect-tech-research.zip',
  '{arquitectura,investigacao,decisoes-tecnicas,technology-selection}',
  '[{"nome":"@architect (Aria)","papel":"Arquitecto","descricao":"Arquitectura de sistemas e technology selection"},{"nome":"@analyst (Alex)","papel":"Analista","descricao":"Deep research, analise de mercado e trade-offs"},{"nome":"/architect-first","papel":"Skill","descricao":"Filosofia architecture-first com checklists de decisao"},{"nome":"/tech-search","papel":"Skill","descricao":"Investigacao tecnologica profunda com fontes verificadas"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` e `.claude/skills/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@architect\n*help\n```\n\nPara investigacao tecnologica:\n\n```\n/tech-search Supabase vs PlanetScale vs Neon\n```\n\n## Verificacao\n\nApos instalar, testa com `@architect *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 3. Copy Chief Elite — 24 Copywriters Lendarios
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Copy Chief Elite',
  'Orquestra 24 copywriters lendarios — Ogilvy, Halbert, Kennedy, Sugarman e mais 20. Sistema de 3 tiers: diagnostico, execucao e auditoria. Inclui os 30 triggers de Joe Sugarman.',
  E'## O que e\n\nOrquestra 24 copywriters lendarios com um sistema de 3 tiers: diagnostico, execucao e auditoria. Inclui os 30 triggers psicologicos de Joe Sugarman. Para copy profissional — headlines, emails, landing pages, anuncios, sales pages — com a tecnica dos melhores da historia.\n\n## O que inclui\n\n### Agente Orquestrador\n\n| Agente | Especialidade |\n|--------|---------------|\n| @copy-chief | Diagnostico do nivel de awareness e encaminhamento para o especialista certo |\n\n### 24 Copywriters Especializados\n\nEugene Schwartz, Robert Collier, Joe Sugarman, Gary Halbert, Dan Kennedy, David Ogilvy e mais 18 especialistas — cada um com a sua tecnica e area de foco.\n\n### Sistema de Tiers\n\n| Tier | Funcao |\n|------|--------|\n| Tier 0 | Diagnostico — identifica o problema e nivel de awareness |\n| Tier 1-3 | Execucao — 24 especialistas por tipo de copy |\n| Auditoria Hopkins | Validacao cientifica do resultado |\n\n## Para quem e\n\nQuem precisa de copy profissional — headlines, emails, landing pages, anuncios, sales pages — com a tecnica dos melhores copywriters da historia.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'copy-chief-elite',
  (SELECT id FROM public.squad_categorias WHERE slug = 'marketing'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/copy-chief-elite/copy-chief-elite.zip',
  '{copy,copywriting,marketing,headlines,conversao}',
  '[{"nome":"@copy-chief","papel":"Orquestrador","descricao":"Diagnostica o nivel de awareness e encaminha para o especialista certo"},{"nome":"Eugene Schwartz","papel":"Copywriter","descricao":"Breakthrough advertising e stages of awareness"},{"nome":"Robert Collier","papel":"Copywriter","descricao":"Storytelling e headlines de impacto"},{"nome":"Joe Sugarman","papel":"Copywriter","descricao":"30 triggers psicologicos e copy directo"},{"nome":"Gary Halbert","papel":"Copywriter","descricao":"Urgencia, starving crowd e copy agressivo"},{"nome":"Dan Kennedy","papel":"Copywriter","descricao":"Direct response e magnetic marketing"},{"nome":"David Ogilvy","papel":"Copywriter","descricao":"Brand advertising e headlines testadas"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@copy-chief\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@copy-chief\nPreciso de uma headline para landing page de um SaaS de gestao de restaurantes\nO publico sao donos de restaurantes em Portugal que perdem tempo com tarefas manuais\n```\n\nO Copy Chief diagnostica o nivel de awareness, selecciona o copywriter certo e entrega copy pronto.\n\n## Verificacao\n\nApos instalar, testa com `@copy-chief *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 4. Data Intelligence Squad
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Data Intelligence Squad',
  '3 especialistas em dados: orquestracao, engenharia e analise. Para quem toma decisoes baseadas em dados reais — schemas, queries, investigacao de mercado.',
  E'## O que e\n\n3 especialistas em dados para cobrir todo o ciclo de data intelligence: orquestracao, engenharia de dados e analise profunda. Para quem trabalha com dados e precisa de inteligencia aplicada — nao apenas numeros.\n\n## O que inclui\n\n| Agente | Especialidade |\n|--------|---------------|\n| @data-chief | Orquestracao de data intelligence |\n| @data-engineer (Dara) | Schema, migrations, RLS, queries |\n| @analyst (Alex) | Pesquisa, analise de mercado, investigacao |\n\n## Para quem e\n\nQuem precisa de analisar dados, desenhar schemas, optimizar queries e tomar decisoes baseadas em dados reais.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'data-intelligence',
  (SELECT id FROM public.squad_categorias WHERE slug = 'dados'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/data-intelligence/data-intelligence.zip',
  '{dados,data,analise,schema,queries,inteligencia}',
  '[{"nome":"@data-chief","papel":"Orquestrador de Dados","descricao":"Orquestracao de data intelligence e coordenacao da equipa de dados"},{"nome":"@data-engineer (Dara)","papel":"Engenheiro de Dados","descricao":"Schema design, migrations, RLS policies e optimizacao de queries"},{"nome":"@analyst (Alex)","papel":"Analista","descricao":"Pesquisa aprofundada, analise de mercado e investigacao de dados"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@data-chief\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@data-engineer\nDesenha o schema para um sistema de reservas de restaurante com Supabase\n*db-domain-modeling\n```\n\n## Verificacao\n\nApos instalar, testa com `@data-chief *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 5. Database Schema Architect
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Database Schema Architect',
  'Especialista em design de base de dados: schema, migrations, RLS e query optimization. 2 agentes focados exclusivamente em base de dados — do modelo ao deploy.',
  E'## O que e\n\n2 agentes especializados em design de base de dados — schema, migrations, politicas RLS e optimizacao de queries. Focado exclusivamente em base de dados, do modelo conceptual ao deploy.\n\n## O que inclui\n\n| Agente | Especialidade |\n|--------|---------------|\n| @data-engineer (Dara) | Schema design, migrations, RLS, performance |\n| @db-sage | Consultor de base de dados e boas praticas |\n\n## Para quem e\n\nQuem precisa de desenhar ou optimizar bases de dados — schemas, politicas RLS, migrations, indices e performance.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'database-schema-architect',
  (SELECT id FROM public.squad_categorias WHERE slug = 'dados'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/database-schema-architect/database-schema-architect.zip',
  '{database,schema,migrations,rls,sql,supabase}',
  '[{"nome":"@data-engineer (Dara)","papel":"Engenheiro de Dados","descricao":"Schema design, migrations, RLS policies e optimizacao de performance"},{"nome":"@db-sage","papel":"Consultor de Base de Dados","descricao":"Boas praticas de modelacao, normalizacao e arquitectura de dados"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@data-engineer\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@data-engineer\nPreciso de RLS policies para um sistema multi-tenant em Supabase\n*db-domain-modeling\n```\n\n## Verificacao\n\nApos instalar, testa com `@data-engineer *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 6. Design System Squad
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Design System Squad',
  '5 especialistas de design system: atomic design, adopcao, processos e geracao de assets com IA. Do token ao componente, com consistencia garantida em cada decisao visual.',
  E'## O que e\n\n5 especialistas em design system — atomic design, adopcao organizacional, processos e geracao de assets visuais com IA. Para criar ou manter um design system com consistencia e qualidade profissional.\n\n## O que inclui\n\n| Agente | Especialidade |\n|--------|---------------|\n| @design-chief | Orquestracao e decisoes estrategicas de design system |\n| @brad-frost | Atomic design, componentes, documentacao de padroes |\n| @dan-mall | Adopcao, ROI, colaboracao com stakeholders |\n| @dave-malouf | DesignOps, processos, metricas de eficiencia |\n| @nano-banana-generator | Geracao de assets visuais com IA, variantes de componentes |\n\n### Workflow\n\n`@design-chief` orquestra e delega para o especialista certo conforme a tarefa.\n\n## Para quem e\n\nQuem precisa de criar ou manter um design system — tokens, componentes, documentacao, processos de design.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'design-system',
  (SELECT id FROM public.squad_categorias WHERE slug = 'design'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/design-system/design-system.zip',
  '{design-system,ui,componentes,tokens,atomic-design}',
  '[{"nome":"@design-chief","papel":"Orquestrador","descricao":"Orquestracao e decisoes estrategicas do design system"},{"nome":"@brad-frost","papel":"Atomic Design","descricao":"Atomic design, estrutura de componentes e documentacao de padroes"},{"nome":"@dan-mall","papel":"Adopcao","descricao":"Adopcao do design system, ROI e colaboracao com stakeholders"},{"nome":"@dave-malouf","papel":"DesignOps","descricao":"Processos de design, metricas de eficiencia e operacoes de design"},{"nome":"@nano-banana-generator","papel":"Assets com IA","descricao":"Geracao automatizada de assets visuais e variantes de componentes"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@design-chief\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@design-chief\nPreciso de um design system para uma app de e-commerce\n@brad-frost\nCria os tokens base: cores, tipografia, espacamento\n```\n\n## Verificacao\n\nApos instalar, testa com `@design-chief *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 7. DevOps Quality Gates
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'DevOps Quality Gates',
  'DevOps + QA com revisao automatica de codigo. Codigo pronto — @qa revisa, CodeRabbit valida, @devops faz deploy. Qualidade garantida antes de cada entrega.',
  E'## O que e\n\nDevOps e QA com skills de revisao automatica. Garante qualidade antes de cada deploy — revisao de codigo, quality gates e entrega controlada.\n\n## O que inclui\n\n### 2 Agentes\n\n| Agente | Especialidade |\n|--------|---------------|\n| @devops (Gage) | CI/CD, push, deploy |\n| @qa (Quinn) | Quality gates, testes |\n\n### 2 Skills\n\n| Skill | O que faz |\n|-------|----------|\n| `/coderabbit-review` | Revisao automatica de codigo |\n| `/checklist-runner` | Execucao de checklists de qualidade |\n\n### Workflow\n\nCodigo pronto → `@qa` revisa → `/coderabbit-review` valida → `@devops` faz deploy\n\n## Para quem e\n\nQuem precisa de garantir qualidade no codigo antes de fazer deploy — revisao automatica, testes, quality gates.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'devops-quality-gates',
  (SELECT id FROM public.squad_categorias WHERE slug = 'devops'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/devops-quality-gates/devops-quality-gates.zip',
  '{devops,qualidade,ci-cd,deploy,testes,code-review}',
  '[{"nome":"@devops (Gage)","papel":"DevOps","descricao":"CI/CD, push exclusivo para remote e gestao de deploy"},{"nome":"@qa (Quinn)","papel":"Quality Assurance","descricao":"Quality gates, testes e revisao de codigo"},{"nome":"/coderabbit-review","papel":"Skill","descricao":"Revisao automatica de codigo antes de cada commit"},{"nome":"/checklist-runner","papel":"Skill","descricao":"Execucao de checklists de qualidade configurados"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` e `.claude/skills/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@qa\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@qa\nRevisa o codigo que acabei de escrever\n/coderabbit-review\n@devops\n*push\n```\n\n## Verificacao\n\nApos instalar, testa com `@qa *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 8. Funnel Conversion Squad
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Funnel Conversion Squad',
  '3 skills focadas em conversao: analise de funil, optimizacao de landing pages e intelligence competitiva. Para quem quer perceber onde perde vendas — e corrigir.',
  E'## O que e\n\n3 skills especializadas em conversao — analise de funil, optimizacao de landing pages e intelligence competitiva. Para quem tem um funil de vendas e quer entender onde perde conversoes e como corrigir.\n\n## O que inclui\n\n| Skill | O que faz |\n|-------|----------|\n| `/market-funnel` | Analise de conversao, friction points, optimizacao por etapa |\n| `/market-landing` | CRO analysis, melhorias de copy e layout |\n| `/market-competitors` | Analise competitiva, positioning gaps |\n\n## Para quem e\n\nQuem tem um funil de vendas e quer optimizar conversao — desde a landing page ate ao checkout.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'funnel-conversion',
  (SELECT id FROM public.squad_categorias WHERE slug = 'marketing'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/funnel-conversion/funnel-conversion.zip',
  '{funil,conversao,cro,landing-page,competidores,marketing}',
  '[{"nome":"/market-funnel","papel":"Skill","descricao":"Analise de conversao, identificacao de friction points e optimizacao por etapa do funil"},{"nome":"/market-landing","papel":"Skill","descricao":"CRO analysis, melhorias de copy e layout para landing pages"},{"nome":"/market-competitors","papel":"Skill","descricao":"Analise competitiva e identificacao de positioning gaps"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/skills/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n/market-funnel\n```\n\n## Exemplo de utilizacao\n\n```\n/market-funnel\nAnalisa o funil da minha landing page: https://meusite.pt/pricing\n/market-landing\nSugere melhorias de CRO para a mesma pagina\n```\n\n## Verificacao\n\nApos instalar, inicia com `/market-funnel` no Claude Code — deves ver o assistente de analise de funil.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 9. Marketing AI Suite
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Marketing AI Suite',
  '15 skills que cobrem todo o ciclo de marketing digital — copy, social media, emails, SEO, anuncios, funil, relatorios. Da auditoria inicial ao relatorio PDF client-ready.',
  E'## O que e\n\n15 skills especializadas que cobrem todo o ciclo de marketing digital — da auditoria inicial ao relatorio final. Copy, social media, emails, SEO, anuncios, funil, analise competitiva, brand voice e relatorios.\n\n## O que inclui\n\n| Skill | O que faz |\n|-------|----------|\n| `/market` | Coordena analise completa com 5 agentes em paralelo |\n| `/market-copy` | Headlines, value props, swipe files |\n| `/market-social` | Calendario 30 dias, content pillars |\n| `/market-emails` | Sequences de nurture, welcome, launch |\n| `/market-seo` | Auditoria tecnica e on-page |\n| `/market-ads` | Criativos Meta/Google, copy variants |\n| `/market-funnel` | Analise de conversao, friction points |\n| `/market-landing` | CRO analysis, copy improvements |\n| `/market-competitors` | Intelligence competitiva |\n| `/market-brand` | Voice guidelines, consistencia |\n| `/market-launch` | Playbook go-to-market |\n| `/market-proposal` | Propostas comerciais, ROI |\n| `/market-report` | Relatorios Markdown |\n| `/market-report-pdf` | Relatorios PDF client-ready |\n| `/market-audit` | Auditoria completa 6 categorias |\n\n## Para quem e\n\nQuem precisa de marketing digital completo — copy, social media, emails, SEO, anuncios, funil, relatorios — tudo num so pacote.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'marketing-ai-suite',
  (SELECT id FROM public.squad_categorias WHERE slug = 'marketing'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/marketing-ai-suite/marketing-ai-suite.zip',
  '{marketing,seo,copy,social-media,emails,anuncios,funil,relatorios}',
  '[{"nome":"/market","papel":"Skill Orquestradora","descricao":"Coordena analise completa de marketing com multiplos especialistas em paralelo"},{"nome":"/market-copy","papel":"Skill","descricao":"Headlines, value propositions e swipe files de copy"},{"nome":"/market-social","papel":"Skill","descricao":"Calendario de 30 dias e content pillars para social media"},{"nome":"/market-emails","papel":"Skill","descricao":"Sequences de nurture, welcome e launch para email marketing"},{"nome":"/market-seo","papel":"Skill","descricao":"Auditoria SEO tecnica e on-page com action items prioritizados"},{"nome":"/market-ads","papel":"Skill","descricao":"Criativos para Meta e Google Ads com copy variants"},{"nome":"/market-audit","papel":"Skill","descricao":"Auditoria completa de marketing em 6 categorias"},{"nome":"/market-report-pdf","papel":"Skill","descricao":"Geracao de relatorios PDF client-ready"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/skills/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n/market\n```\n\n## Exemplo de utilizacao\n\n```\n/market-audit\nFaz auditoria completa do marketing do meu negocio\n/market-social\nCria calendario de 30 dias para Instagram\n/market-report-pdf\nGera relatorio PDF com tudo\n```\n\n## Verificacao\n\nApos instalar, inicia com `/market` no Claude Code — deves ver o orquestrador de marketing disponivel.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 10. Product Management Suite
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Product Management Suite',
  '3 agentes para gerir produto de ponta a ponta: @pm define a estrategia, @sm cria as stories, @po valida e prioriza. Da ideia ao backlog organizado.',
  E'## O que e\n\n3 agentes especializados em gestao de produto — estrategia, criacao de stories e validacao. Para quem precisa de definir requisitos, criar stories, organizar sprints e manter o backlog.\n\n## O que inclui\n\n| Agente | Especialidade |\n|--------|---------------|\n| @pm (Morgan) | PRDs, epics, roadmap, estrategia de produto |\n| @po (Pax) | Validacao de stories, backlog, priorizacao |\n| @sm (River) | Criacao de stories, sprints, ceremonies |\n\n### Workflow\n\n`@pm` define o que → `@sm` cria stories → `@po` valida e prioriza\n\n## Para quem e\n\nQuem precisa de gerir um produto — definir requisitos, criar stories, organizar sprints e manter o backlog.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'product-management',
  (SELECT id FROM public.squad_categorias WHERE slug = 'negocio'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/product-management/product-management.zip',
  '{product-management,prd,stories,backlog,sprints,agile}',
  '[{"nome":"@pm (Morgan)","papel":"Product Manager","descricao":"PRDs, epics, roadmap e estrategia de produto"},{"nome":"@po (Pax)","papel":"Product Owner","descricao":"Validacao de stories, gestao de backlog e priorizacao"},{"nome":"@sm (River)","papel":"Scrum Master","descricao":"Criacao de stories, gestao de sprints e ceremonies"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@pm\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@pm\nCria um PRD para um sistema de reservas online\n@sm\n*draft\n@po\n*validate-story-draft\n```\n\n## Verificacao\n\nApos instalar, testa com `@pm *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 11. SEO & Content Engine
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'SEO & Content Engine',
  'Auditoria SEO completa com action items prioritizados: analise tecnica, keywords, on-page e content gaps. Identifica o que falta e o que corrigir — com prioridades claras.',
  E'## O que e\n\nAuditoria SEO completa com action items prioritizados — analise tecnica, keywords, optimizacao on-page e identificacao de lacunas de conteudo. Para quem quer melhorar o posicionamento organico com accoes concretas.\n\n## O que inclui\n\n| Skill | O que faz |\n|-------|----------|\n| `/market-seo` | Auditoria tecnica SEO completa: keywords, on-page, content gaps, action items prioritizados |\n\n## Para quem e\n\nQuem quer melhorar o SEO do seu site — analise tecnica, oportunidades de keywords, optimizacao on-page e identificacao de lacunas de conteudo.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'seo-content-engine',
  (SELECT id FROM public.squad_categorias WHERE slug = 'marketing'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/seo-content-engine/seo-content-engine.zip',
  '{seo,conteudo,keywords,auditoria,on-page,organico}',
  '[{"nome":"/market-seo","papel":"Skill","descricao":"Auditoria SEO completa com analise tecnica, keywords, on-page e action items prioritizados"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/skills/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n/market-seo\n```\n\n## Exemplo de utilizacao\n\n```\n/market-seo\nFaz auditoria SEO completa do meu site: https://meurestaurante.pt\n```\n\n## Verificacao\n\nApos instalar, inicia com `/market-seo` no Claude Code — deves ver o assistente de auditoria SEO.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 12. Starter Dev Squad
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Starter Dev Squad',
  'A equipa base para qualquer projecto de software: @dev implementa, @qa revisa, @devops faz deploy. Qualidade desde o primeiro commit — sem configuracoes complexas.',
  E'## O que e\n\nA equipa essencial para iniciar qualquer projecto de software com qualidade desde o primeiro commit — 3 agentes que cobrem implementacao, revisao de codigo e deploy.\n\n## O que inclui\n\n| Agente | Especialidade |\n|--------|---------------|\n| @dev (Dex) | Implementacao, debugging, refactoring |\n| @qa (Quinn) | Quality gates, testes, revisao de codigo |\n| @devops (Gage) | CI/CD, git push, deploy automatizado |\n\n### Workflow\n\n`@dev` implementa → `@qa` revisa → `@devops` faz deploy\n\n## Para quem e\n\nQuem esta a comecar um projecto de software e quer uma equipa base para implementar, testar e fazer deploy com qualidade.\n\n## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'starter-dev-squad',
  (SELECT id FROM public.squad_categorias WHERE slug = 'desenvolvimento'),
  0,
  (SELECT id FROM auth.users LIMIT 1),
  'squads/starter-dev-squad/starter-dev-squad.zip',
  '{desenvolvimento,qualidade,deploy,testes,ci-cd,iniciantes}',
  '[{"nome":"@dev (Dex)","papel":"Desenvolvedor","descricao":"Implementacao de codigo, debugging e refactoring"},{"nome":"@qa (Quinn)","papel":"Quality Assurance","descricao":"Quality gates, testes e revisao de codigo"},{"nome":"@devops (Gage)","papel":"DevOps","descricao":"CI/CD, git push exclusivo e deploy automatizado"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)\n- Chave API Anthropic activa (console.anthropic.com)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Instalar" na pagina do produto\n2. Faz o download do ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto — os ficheiros ficam em `.claude/agents/` automaticamente\n4. Abre o terminal na pasta do projecto\n5. Inicia o Claude Code: `claude`\n\n## Activar\n\n```\n@dev\n*help\n```\n\n## Exemplo de utilizacao\n\n```\n@dev\nImplementa uma API REST para gestao de utilizadores\n*run-tests\n@qa\nRevisa o codigo\n@devops\n*push\n```\n\n## Verificacao\n\nApos instalar, testa com `@dev *help` — deves ver os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ----------------------------------------------------------------
-- 13. Clone Alex Hormozi (Clones de Mentes)
-- Preco a definir pelo Eurico — placeholder 0
-- ----------------------------------------------------------------
INSERT INTO public.squads (titulo, descricao_curta, descricao_longa, slug, categoria_id, preco, autor_id, zip_path, tags, agentes, guia_instalacao, status, imagem_capa)
VALUES (
  'Clone Alex Hormozi',
  'A mente do Hormozi adaptada ao mercado portugues. 17 frameworks operacionais — Grand Slam Offers, Mosy 6, VSSL, Value Equation — com precos EUR, fiscalidade PT e escala de mercado real.',
  E'## O que e\n\nA mente de Alex Hormozi — autor de "$100M Offers" — adaptada ao mercado portugues. Nao e uma traducao. E o Hormozi a pensar com precos PT, fiscalidade PT, e a realidade de um mercado de 10 milhoes de pessoas.\n\n## O que inclui\n\n- **17 frameworks operacionais** — Mosy 6, VSSL, Grand Slam Offers, Value Equation, 5x Upsell, AD FOCUS, e mais\n- **27 heuristicas de decisao**\n- **9 padroes decisorios**\n- **7 historias experienciais**\n- **Camada de adaptacao Portugal** — precos EUR, fiscalidade PT, cultura e canais locais\n\n## Comandos disponiveis\n\n| Comando | O que faz |\n|---------|----------|\n| `*diagnostico` | Mosy 6 completo — diagnostica o constraint do negocio |\n| `*oferta` | Grand Slam Offer — cria uma oferta irrecusavel |\n| `*pricing` | Estrategia de pricing com 5x Upsell e adaptacao PT |\n| `*vssl` | Cria guiao VSSL (Video Sales System Letter) |\n| `*avatar` | Analise profunda do avatar ideal |\n| `*escala` | Plano de escala: constraint, leverage, compounding |\n| `*help` | Todos os comandos |\n\n## Para quem e\n\nDonos de negocios em Portugal que querem escalar — pricing, ofertas, funis de venda, estrategia de crescimento. Com contexto PT real (EUR, fiscalidade, escala do mercado).\n\n## Requisitos\n\n- Claude Code instalado (claude.ai/download)\n- Plano Claude (Max ou Pro)\n- Terminal (VS Code, Windows Terminal, iTerm)',
  'clone-alex-hormozi',
  (SELECT id FROM public.squad_categorias WHERE slug = 'clone'),
  0, -- Preco a definir pelo Eurico — placeholder 0
  (SELECT id FROM auth.users LIMIT 1),
  'clones/clone-alex-hormozi/clone-alex-hormozi.zip',
  '{hormozi,estrategia,pricing,ofertas,escala,negocio,portugal}',
  '[{"nome":"@alex-hormozi","papel":"Consultor Estrategico","descricao":"Clone da mente de Alex Hormozi adaptado ao mercado portugues — 17 frameworks operacionais, 27 heuristicas de decisao e camada de adaptacao PT"}]'::jsonb,
  E'## Requisitos\n\n- Claude Code instalado (claude.ai/download)\n- Plano Claude (Max ou Pro)\n- Terminal (VS Code, Windows Terminal, iTerm)\n\n## Instalacao\n\n1. Clica em "Comprar" na pagina do produto — pagamento via Stripe\n2. Apos confirmacao do pagamento, descarrega o ficheiro ZIP\n3. Extrai o conteudo para a pasta raiz do teu projecto\n4. Os ficheiros do agente ficam em `.claude/agents/` automaticamente\n5. Abre o terminal na pasta do projecto\n6. Inicia o Claude Code: `claude`\n\n## Activar o clone\n\n```\n@alex-hormozi\n```\n\n## Exemplo de utilizacao\n\n```\n@alex-hormozi\nTenho um negocio de servicos que fatura 3.000 EUR/mes. Como escalo para 10.000?\n```\n\nOu utiliza os comandos directos:\n\n```\n@alex-hormozi\n*diagnostico\n```\n\nO diagnostico Mosy 6 identifica o constraint principal do teu negocio e da um plano concreto de accao.\n\n## Verificacao\n\nApos instalar, testa com `@alex-hormozi *help` — deves ver todos os comandos disponiveis.',
  'published',
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  categoria_id = EXCLUDED.categoria_id,
  preco = EXCLUDED.preco,
  tags = EXCLUDED.tags,
  agentes = EXCLUDED.agentes,
  guia_instalacao = EXCLUDED.guia_instalacao,
  status = EXCLUDED.status,
  updated_at = now();


-- ================================================================
-- VERIFICACAO (executar manualmente para confirmar)
-- ================================================================

-- Conta total de produtos inseridos:
-- SELECT COUNT(*) FROM public.squads WHERE status = 'published';
-- Esperado: 13

-- Lista todos os produtos por categoria:
-- SELECT s.titulo, s.slug, sc.nome AS categoria, s.preco, s.status
-- FROM public.squads s
-- JOIN public.squad_categorias sc ON s.categoria_id = sc.id
-- ORDER BY sc.slug, s.titulo;

-- Verifica slugs inseridos:
-- SELECT slug FROM public.squads ORDER BY slug;

-- Verifica que nenhum produto tem descricao_curta com mais de 300 chars:
-- SELECT slug, length(descricao_curta) AS chars FROM public.squads WHERE length(descricao_curta) > 300;
-- Esperado: 0 linhas

-- Verifica que o clone Hormozi esta na categoria correcta:
-- SELECT s.titulo, sc.slug AS categoria
-- FROM public.squads s
-- JOIN public.squad_categorias sc ON s.categoria_id = sc.id
-- WHERE s.slug = 'clone-alex-hormozi';
-- Esperado: categoria = 'clone'
