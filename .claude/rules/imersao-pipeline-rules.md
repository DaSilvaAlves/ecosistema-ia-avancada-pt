---
description: "Rules for the Imersao IA Portugal pipeline — 6 mandatory steps in sequence, protected ports (5190-5194, 5196), agent responsibilities per step, integration rules, and data contracts between tools"
---

# Imersao Pipeline Rules — Pipeline Pedagogico IA AVANCADA PT

## Pipeline Completo — 6 Passos Obrigatorios em Sequencia

O pipeline da Imersao IA Portugal tem 6 passos que DEVEM ser executados em ordem. Nenhum passo pode ser saltado.

### Passo 1: Student Profiler (porta 5191)

| Campo | Valor |
|-------|-------|
| Ferramenta | Student Profiler |
| Porta | `localhost:5191` |
| Estado | Online Vercel |
| Output | `ProfileData` |
| Integracao | Via URL param `?profile=<ProfileData encoded>` |
| Path | `imersao-tools/student-profiler/` |

### Passo 2: Briefing Generator (porta 5190)

| Campo | Valor |
|-------|-------|
| Ferramenta | Briefing Generator |
| Porta | `localhost:5190` |
| Estado | Prototipo (usar JSON manual por enquanto) |
| Input | `ProfileData` |
| Output | `BriefingOutput` (JSON) |
| Integracao | Via URL param `?briefing=<BriefingOutput encoded>` |
| Path | `imersao-tools/briefing-generator/` |

### Passo 3: Starter Builder (porta 5192)

| Campo | Valor |
|-------|-------|
| Ferramenta | Starter Builder |
| Porta | `localhost:5192` |
| Estado | Funcional |
| Output | `DesignTokens` |
| Integracao | Via URL param `?tokens=<DesignTokens JSON encoded>` |
| Path | `imersao-tools/starter-builder/` |

Integracao com Prompt Optimizer:
```
http://localhost:5193/?tokens=<DesignTokens JSON encoded>
```

### Passo 4: Prompt Optimizer (porta 5193)

| Campo | Valor |
|-------|-------|
| Ferramenta | Prompt Optimizer |
| Porta | `localhost:5193` |
| Estado | Funcional |
| Input | `BriefingOutput` + `DesignTokens` |
| Output | `OptimizedPrompt` |
| Integracao | Via URL param `?prompt=<OptimizedPrompt encoded>` |
| Path | `imersao-build/packages/prompt-optimizer/` |

### Passo 5: AIOS Compiler (porta 5194)

| Campo | Valor |
|-------|-------|
| Ferramenta | AIOS Compiler |
| Porta | `localhost:5194` |
| Estado | Funcional (5 fixes aplicados e testados) |
| Input | `OptimizedPrompt` |
| Output | Codigo React 19 + repo GitHub (nome unico com `Date.now().toString(36)`) |
| Path | `imersao-build/packages/aios-compiler/` |

PROTECTED_FILES — NUNCA sobrescritos pelo LLM:
```
src/main.tsx, package.json, vite.config.ts, tsconfig.json,
tsconfig.app.json, tsconfig.node.json, vercel.json, index.html
```

### Passo 6: Vercel Deploy

| Campo | Valor |
|-------|-------|
| Ferramenta | Vercel Import |
| URL | `https://vercel.com/import/git?s=<github-url>` |
| Output | URL publica do aluno |

## Portas Protegidas — NUNCA Reutilizar

As seguintes portas estao reservadas EXCLUSIVAMENTE ao pipeline Imersao IA. Nenhum outro projecto pode usa-las.

| Porta | Ferramenta | Estado |
|-------|-----------|--------|
| 5190 | Briefing Generator | Reservada |
| 5191 | Student Profiler | Reservada |
| 5192 | Starter Builder | Reservada |
| 5193 | Prompt Optimizer | Reservada |
| 5194 | AIOS Compiler | Reservada |
| 5196 | Community Dashboard | Reservada |

## Portas de Outros Projectos — NUNCA Usar

As seguintes portas pertencem ao iamenu e NUNCA devem ser usadas pelo pipeline Imersao.

| Porta | Projecto |
|-------|----------|
| 3002 | iamenu |
| 3003 | iamenu |
| 3004 | iamenu |
| 3005 | iamenu |
| 5173 | iamenu |
| 8080 | iamenu |

## Responsabilidades AIOX por Etapa

| Passo | Ferramenta | Agente Responsavel | Accao |
|-------|-----------|-------------------|-------|
| 1 | Student Profiler | `@dev` | Fixes e manutencao da ferramenta |
| 2 | Briefing Generator | `@dev` | Fixes e manutencao da ferramenta |
| 3 | Starter Builder | `@dev` | Fixes e manutencao da ferramenta |
| 4 | Prompt Optimizer | `@dev` | Fixes e manutencao da ferramenta |
| 5 | AIOS Compiler | `@dev` | Fixes e manutencao da ferramenta |
| 6 | Vercel Deploy | `/github-devops` | Deploy e configuracao Vercel |
| Todos | Pipeline end-to-end | `@qa` | Testes de integracao do pipeline |
| Todos | Arquitectura | `@architect` | Decisoes de arquitectura do pipeline |

## Regras de Integracao

| Regra | Detalhe |
|-------|---------|
| Integracao via URL params | Todas as ferramentas comunicam via URL parameters — NAO via microservicos |
| Modo standalone obrigatorio | Cada ferramenta DEVE funcionar de forma independente (sem depender das outras) |
| PROTECTED_FILES | No AIOS Compiler, os ficheiros protegidos NUNCA sao sobrescritos pelo LLM |
| Build command | AIOS Compiler usa `vite build` (nao `tsc -b`) para ignorar erros TypeScript |
| Nome do repo | Repo GitHub criado com nome unico via `Date.now().toString(36)` |
| Deploy URL | Vercel deploy via `vercel.com/import/git?s=<github-url>` |

## Contratos de Dados

### ProfileData (Passo 1 → Passo 2)

Emitido pelo Student Profiler. Contem o perfil do aluno para o Briefing Generator.

### BriefingOutput (Passo 2 → Passo 4)

Emitido pelo Briefing Generator. JSON com campos obrigatorios para o Prompt Optimizer.

Integracao:
```
http://localhost:5193/?tokens=<DesignTokens JSON encoded>
```

### DesignTokens (Passo 3 → Passo 4)

Emitido pelo Starter Builder. Contem tokens de design (cores, tipografia, espacamento) para o Prompt Optimizer.

### OptimizedPrompt (Passo 4 → Passo 5)

Emitido pelo Prompt Optimizer. Prompt optimizado que combina `BriefingOutput` + `DesignTokens` para o AIOS Compiler.

Integracao:
```
http://localhost:5194/?prompt=<OptimizedPrompt encoded>
```
