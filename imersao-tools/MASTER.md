# MASTER — Imersão IA Portugal
> Documento único. Substitui todos os HANDOFFs anteriores.
> **Arranque de nova sessão:** `Lê C:/Users/XPS/Documents/imersao-tools/MASTER.md e continua o projeto Imersão IA Portugal`

---

## IDENTIDADE DO PROJETO

| Campo | Valor |
|-------|-------|
| Nome | Imersão IA Portugal / Comunidade IA Avançada PT |
| Mentor | Eurico Alves |
| Email | euricojsalves@gmail.com |
| WhatsApp | +351932066328 |
| GitHub | @DaSilvaAlves |
| Vercel | euricojsalves-4744 |

---

## REGRAS DO EURICO (SEMPRE SEGUIR)

- Língua: **PT-PT Portugal** (nunca PT-BR, nunca inglês na UI)
- Preços: **terminam sempre em 8** (€188, €288, €888)
- Design: **escuro, neon, quantum aesthetic** (ciano/magenta/dourado)
- Nunca mencionar: Lovable, AI Studio
- Commits/deploys: **confirmar antes de fazer**
- Filosofia: "Mais vale feito que perfeito"

---

## URLS ONLINE (PRODUÇÃO)

| Recurso | URL |
|---------|-----|
| Landing Page | https://ia-avancada-pt.vercel.app |
| Área de Membros | https://comunidade-ia-avancada.vercel.app |
| AI Velocity | https://ai-velocity-project.vercel.app |
| Password comunidade | `iavancada2025` |

---

## MAPA DOS 5 REPOS

| Pasta | O que contém | Usar para |
|-------|-------------|-----------|
| `C:/Users/XPS/Documents/imersao-tools/` | student-profiler, briefing-generator, starter-builder, landing-page, comunidade, video-pipeline | Ferramentas frontend + presença online |
| `C:/Users/XPS/Documents/imersao-build/` | prompt-optimizer, aios-compiler, community-dashboard | Ferramentas backend do pipeline |
| `C:/Users/XPS/Documents/aios-imersao/` | AIOS framework + docs/prd | Contexto, PRD, configuração AIOS |
| `C:/Users/XPS/Documents/imersao/` | HANDOFF.md antigo + AGENTS.md | Ignorar — usar este MASTER |
| `C:/Users/XPS/Documents/ai-velocity-project/` | Vazio | Ignorar — usar versão online |

---

## PIPELINE PEDAGÓGICO

```
[SÁBADO MANHÃ — ALUNO]

Student Profiler        Briefing Generator      Starter Builder
(localhost:5191)   →   (localhost:5190)    →   (localhost:5192)
URL Vercel online       manual OK               DesignTokens via URL
        ↓
Prompt Optimizer        AIOS Compiler           GitHub Repo
(localhost:5193)   →   (localhost:5194)    →   nome-único-Date.now()
BriefingJSON input      Groq gera código        auto-criado
        ↓
Vercel Deploy
URL pública do aluno

[DOMINGO — PROJECTO ONLINE]
```

### URLs de integração entre ferramentas
```
Starter Builder → Optimizer:
  http://localhost:5193/?tokens=<DesignTokens JSON encoded>

Optimizer → Compiler:
  http://localhost:5194/?prompt=<OptimizedPrompt encoded>

Compiler → Vercel:
  https://vercel.com/import/git?s=<github-url>
```

### Portas reservadas
```
5190 — Briefing Generator    (protótipo, usar manual)
5191 — Student Profiler      (online Vercel ✅)
5192 — Starter Builder       (funcional ✅)
5193 — Prompt Optimizer      (funcional ✅)
5194 — AIOS Compiler         (funcional, fixes aplicados ✅)
5196 — Community Dashboard   (não crítico)
```

---

## ESTADO ATUAL DE CADA FERRAMENTA

### ✅ FUNCIONAIS

| Ferramenta | Path | Estado | Notas |
|-----------|------|--------|-------|
| Student Profiler | `imersao-tools/student-profiler/` | ✅ Online Vercel | OK |
| Starter Builder | `imersao-tools/starter-builder/` | ✅ Local 5192 | OK |
| Prompt Optimizer | `imersao-build/packages/prompt-optimizer/` | ✅ Local 5193 | OK |
| AIOS Compiler | `imersao-build/packages/aios-compiler/` | ✅ Local 5194 | 5 fixes aplicados e testados |
| Landing Page | `imersao-tools/landing-page/index.html` | ✅ Online Vercel | |
| Área de Membros | `imersao-tools/comunidade/index.html` | ✅ Online Vercel | ferramentas disabled |

### 🟡 INCOMPLETO / PENDENTE

| Ferramenta | Path | Estado | Notas |
|-----------|------|--------|-------|
| Briefing Generator | `imersao-tools/briefing-generator/` | 🟡 Protótipo | Usar JSON manual por enquanto |
| Video Pipeline | `imersao-tools/video-pipeline/` | 🟡 Pronto mas sem config | Precisa de API keys |
| Community Dashboard | `imersao-build/packages/community-dashboard/` | 🟡 Funcional | Não crítico |

### ❌ NÃO USAR

| Ferramenta | Razão |
|-----------|-------|
| Portal AIOS (localhost:5333) | Bug localStorage — adiar pós-imersão |
| `ai-velocity-project/` local | Vazio — usar versão online |

---

## FIXES APLICADOS NO AIOS COMPILER

Todos aplicados e **testados** (pipeline completo validado em 09/03/2026):

| Fix | Ficheiro | Linha | Descrição |
|-----|---------|-------|-----------|
| 1 | `GitHubService.ts` | 123 | `vite build` (não `tsc -b`) — ignora erros TS |
| 2 | `App.tsx` | 147 | Nome repo único com `Date.now().toString(36)` |
| 3 | `App.tsx` | 16 | URL deploy → `vercel.com/import/git?s=` |
| 4 | `GitHubService.ts` | 267 | PROTECTED_FILES — nunca sobrescritos pelo LLM |
| 5 | `App.tsx` | 100 | Groq condicional por provider selecionado |

### PROTECTED_FILES (nunca tocar)
```
src/main.tsx, package.json, vite.config.ts, tsconfig.json,
tsconfig.app.json, tsconfig.node.json, vercel.json, index.html
```

---

## TESTEMUNHOS NA LANDING PAGE

| # | Nome | Cargo | Estado |
|---|------|-------|--------|
| 1 | Túlio Costa | Restauração & Adega Vinícola · Algarve | ✅ Real |
| 2 | Rúben Silva | Professor · Ministério da Educação | ✅ Real |
| 3 | — | — | ⬜ A aguardar |

**Quando chegar o 3º testemunho:**
```
Diz: "Tenho um testemunho novo:
Nome: [nome], Cargo: [cargo], Texto: [texto], Foto: [anexo]"
```

---

## MODELO DE NEGÓCIO

| Produto | Preço | Estado |
|---------|-------|--------|
| Comunidade IA Avançada PT | €188 (lançamento vitalício) | ✅ Ativo |
| Renovação futura | €288 | Planeado |
| Empresas/Equipas | €888 / sob consulta | Disponível via WhatsApp |

**Programa da Imersão:**
- Online, ao vivo, fim de semana (sábado + domingo)
- Máx. 12 participantes por edição
- Sábado: Mecânica → Mão na Massa → Ponto Socorro 22h
- Domingo: Refinamento → Validação → Ponto Socorro 22h

---

## PRIORIDADES ATUAIS

### 🔴 P0 — Imediato
- [x] ~~Testar pipeline end-to-end~~ ✅ **FEITO** (09/03/2026)
- [x] ~~Corrigir geração de código (GROQ_MARKER_SYSTEM, return value)~~ ✅ **FEITO** (09/03/2026)
- [ ] **🔴 BLOCKER: Corrigir push de ficheiros ao GitHub** — só App.tsx chega, features/CSS ficam para trás → ver `HANDOFF-COMPILER.md`
- [ ] Preparar chave Groq backup para a imersão

### 🟡 P1 — Esta semana
- [ ] Ativar ferramentas na área de membros (Student Profiler já tem URL)
- [ ] Configurar video pipeline (preencher config.json com API keys)
- [ ] Publicar conteúdo social (scripts prontos no HANDOFF antigo)
- [ ] Testemunho 3 na landing page

### 🟢 P2 — Médio prazo
- [ ] Login real na área de membros (email + password + Supabase)
- [ ] Dashboard de controlo do Eurico
- [ ] Domínio próprio (iaavancada.pt)
- [ ] Página de obrigado após inscrição
- [ ] Integrar Stripe ou link de pagamento

---

## COMANDOS RÁPIDOS

### Arrancar o pipeline (local)
```bash
# Prompt Optimizer
cd C:/Users/XPS/Documents/imersao-build/packages/prompt-optimizer
npm run dev   # → localhost:5193

# AIOS Compiler
cd C:/Users/XPS/Documents/imersao-build/packages/aios-compiler
npm run dev   # → localhost:5194

# Starter Builder
cd C:/Users/XPS/Documents/imersao-tools/starter-builder
npm run dev   # → localhost:5192
```

### Atualizar Landing Page
```bash
cd C:/Users/XPS/Documents/imersao-tools/landing-page
vercel --prod
```

### Atualizar Área de Membros
```bash
cd C:/Users/XPS/Documents/imersao-tools/comunidade
vercel --prod
```

### Video Pipeline
```bash
cd C:/Users/XPS/Documents/imersao-tools/video-pipeline
python pipeline.py --list
python pipeline.py --id 01-A
# Requer: config.json com API keys preenchidas (ElevenLabs + HeyGen)
```

### Marketing Reports
```bash
# Audit completo
/market audit https://ia-avancada-pt.vercel.app

# PDF report
python C:/Users/XPS/scripts/generate_pdf_report.py
```

---

## SQUADS CRIADOS (AIOS)

| Squad | Agente | Missão |
|-------|--------|--------|
| `pipeline-test-squad` | `@pipeline-tester` | Testar e corrigir pipeline |
| `organizer-squad` | `@project-organizer` | Organização e documentação |
| `marketing-squad` | `@content-publisher` | Conteúdo social + vídeo AI |
| `community-squad` | `@community-builder` | Área de membros + login real |
| `cris` | `@cris` | Meta-squad: analisa e cria squads |

Squads em: `C:/Users/XPS/squads/`

---

## FERRAMENTAS DE MARKETING INSTALADAS

| Skill | Comando |
|-------|---------|
| Audit completo | `/market audit <url>` |
| Relatório PDF | `/market report-pdf <url>` |
| SEO | `/market seo <url>` |
| Concorrentes | `/market competitors <url>` |
| Landing page CRO | `/market landing <url>` |
| Calendário social | `/market social <url>` |

PDFs guardados em: `C:/Users/XPS/Desktop/Marketing Reports/`

---

## CONTEXTO DE NEGÓCIO

O Eurico é pioneiro em Portugal a usar IA de nível 4 (sistemas autónomos).

**Estratégia:**
1. **Agora:** Comunidade + Imersões para particulares (€188)
2. **Médio prazo:** Empresas que pagam para formar equipas (B2B, €888)
3. **Visão:** Ser a referência em Portugal de ensino de IA produtiva

A imersão não é um curso — é uma experiência de 48h que muda a forma de trabalhar.

---

*Atualizado: 09/03/2026 — gerado pelo @project-organizer (organizer-squad)*
*Substitui: HANDOFF.md, HANDOFF-SESSION-*.md, HANDOFF_08032026.md*

---

## AIOX v5.0.3 — Estado da Instalação (13/03/2026)

**Estado:** 15 PASS ✅ | **Instalado via:** Claude Code
**Regras completas:** ver `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\AIOX-RULES.md`

### Agentes Disponíveis

| Comando | Persona | Função |
|---------|---------|--------|
| `/AIOX:agents:aiox-master` | Orion | Governança total |
| `/AIOX:agents:dev` | Dex | Implementação |
| `/AIOX:agents:qa` | Quinn | Testes e qualidade |
| `/AIOX:agents:architect` | Aria | Arquitetura técnica |
| `/AIOX:agents:pm` | Morgan | Product Management |
| `/AIOX:agents:po` | Pax | Validação stories |
| `/AIOX:agents:sm` | River | Criação de stories |
| `/AIOX:agents:analyst` | Alex | Pesquisa e análise |
| `/AIOX:agents:data-engineer` | Dara | Database e migrações |
| `/AIOX:agents:devops` | Gage | CI/CD + git push (EXCLUSIVO) |
| `/AIOX:agents:ux-design-expert` | Uma | UX/UI design |
| `/AIOX:agents:squad-creator` | — | Criar squads |

### Hooks Ativos

| Hook | Quando Ativa |
|------|--------------|
| `synapse-engine.cjs` | Em cada prompt |
| `code-intel-pretool.cjs` | Antes de Write/Edit |
| `precompact-session-digest.cjs` | Antes de compactar contexto |

*Atualizado: 13/03/2026 — @aiox-master (Orion)*
