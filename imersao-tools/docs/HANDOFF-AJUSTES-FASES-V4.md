# HANDOFF — Ajustes Fase 2 e Fase 3 do todolist.html (V4)

> Data: 04/04/2026 (sessao terminou ~07:15h)
> Autor: Uma (UX) + Eurico
> Estado: CONCLUIDO E DEPLOYED
> Terminal: Sessao de madrugada — 8h+ de trabalho previo a testar pipeline

---

## Contexto critico

O pipeline de ferramentas (Starter Builder, Prompt Optimizer, AIOS Compiler) foi **ELIMINADO** do plano da imersao. Foram 8 horas de testes que revelaram que cada ferramenta dava problemas e o risco era demasiado alto para a imersao de 12/04/2026.

As Fases 2 e 3 do todolist.html ainda referenciavam essas ferramentas. Esta sessao corrigiu isso.

---

## Alteracoes realizadas — registo completo

### Commit 39f05a0 — fix: ajustar Fase 2 e Fase 3

| Ficheiro | Linha | Antes | Depois |
|----------|-------|-------|--------|
| todolist.html | 560 | "Agora vamos construir. Todos juntos." Escolher estilo visual com o Starter Builder, gerar prompt optimizado, a IA gera o codigo em tempo real, deploy numa URL publica. Primeiro "wow moment". | Todos juntos, todos ao mesmo tempo. Escolhes um dos 5 estilos acima, abres a app, testas. Em 10 minutos tens a tua primeira app a funcionar. Depois, preparamos tudo para a tarde — contas criadas, ferramentas instaladas, tudo testado. Ninguem fica para tras. |
| todolist.html | 564 | Escolher estilo visual — design tokens (Starter Builder) — 15 min | Escolher estilo — abre, testa, comenta — 15 min |
| todolist.html | 565-569 | 5 items: Prompt Optimizer, AIOS Compiler, Deploy, Celebracao, Explorar | 1 item: Preparar contas e ferramentas para a tarde — 100 min |
| todolist.html | 567 | To-Do List funcional deployed numa URL publica | To-Do List a funcionar + contas e ferramentas prontas para a tarde |
| todolist.html | 583 | Descreves o teu problema, Claude Code faz 3-5 perguntas, gera o projecto completo, deploy. | Comecas pela dor, geras um briefing, pesquisas o tema com ferramentas de pesquisa, crias um PRD tecnico e entregas a ferramentas profissionais que constroem o projecto por ti. |
| todolist.html | 585 | Claude Code e a ferramenta. Tu CONSTRIS | As ferramentas (Claude Code, Gemini CLI, Antigravity) trabalham para ti. Tu CONSTROIS |
| todolist.html | 589 | Claude Code gera briefing personalizado no terminal — 30 min | Briefing Generator + pesquisa com ferramentas de pesquisa — 30 min |
| todolist.html | 590 | Validar: stack, features, design — "isto e o que queres?" — 15 min | Criar PRD tecnico — "isto e o que queres?" — 15 min |
| todolist.html | 591 | Construcao — Claude Code gera codigo completo (React 19 + Vite) — 120 min | Construcao — entregar PRD ao Claude Code, Gemini CLI ou Antigravity — 120 min |

### Commit e7507ec — fix: detalhar Fase 2

| Ficheiro | Linha | Antes | Depois |
|----------|-------|-------|--------|
| todolist.html | 565 | Preparar contas e ferramentas para a tarde — 100 min | (dividido em 2 items) |
| todolist.html | 565 (novo) | — | Ve o resultado, explora, perguntas — 10 min |
| todolist.html | 566 (novo) | — | Criar e testar todas as contas para a tarde — GitHub, Vercel, Groq, Node.js, Git — 90 min |

---

## Estado final — Fase 2 (como esta agora em producao)

```
FASE 2 — EXERCICIO GUIADO
11:00 — 13:00 · 2 horas
Primeiro projecto — To-Do List

Todos juntos, todos ao mesmo tempo. Escolhes um dos 5 estilos acima,
abres a app, testas. Em 10 minutos tens a tua primeira app a funcionar.
Depois, preparamos tudo para a tarde — contas criadas, ferramentas
instaladas, tudo testado. Ninguem fica para tras.

11:00  "Agora vamos construir. Todos juntos." — 5 min
11:05  Escolher estilo — abre, testa, comenta — 15 min
11:20  Ve o resultado, explora, perguntas — 10 min
11:30  Criar e testar todas as contas para a tarde — GitHub, Vercel, Groq, Node.js, Git — 90 min

Resultado: To-Do List a funcionar + contas e ferramentas prontas para a tarde
```

## Estado final — Fase 3 (como esta agora em producao)

```
FASE 3 — MAO NA MASSA
15:00 — 19:00 · 4 horas
O teu projecto real

Este e o bloco principal. Cada participante constroi o seu proprio
projecto — o problema real que trouxe. Comecas pela dor, geras um
briefing, pesquisas o tema com ferramentas de pesquisa, crias um PRD
tecnico e entregas a ferramentas profissionais que constroem o projecto
por ti.

Exemplos ja construidos: sistema de reservas para restaurante, portfolio
profissional, loja online, dashboard de gestao, landing page com
formulario, sistema de marcacoes.

Regra: o participante e o heroi. O Eurico e o guia. As ferramentas
(Claude Code, Gemini CLI, Antigravity) trabalham para ti. Tu CONSTROIS
— nunca e o Eurico a fazer por ti.

15:00  Briefing individual — "qual e a tua dor?" (1:1 com Eurico) — 15 min
15:15  Briefing Generator + pesquisa com ferramentas de pesquisa — 30 min
15:45  Criar PRD tecnico — "isto e o que queres?" — 15 min
16:00  Construcao — entregar PRD ao Claude Code, Gemini CLI ou Antigravity — 120 min
18:00  Primeiro deploy — URL publica — 30 min
18:30  Iteracao — ajustar, corrigir, melhorar — 30 min

Resultado: o teu projecto real deployed e funcional
```

## Fases 4-7 — verificadas, sem alteracoes necessarias

| Fase | Verificada | Resultado |
|------|-----------|-----------|
| 4 — Ponto Socorro | SIM | Sem referencias a ferramentas eliminadas |
| 5 — Refinamento | SIM | Sem referencias a ferramentas eliminadas |
| 6 — Deploy final | SIM | Sem referencias a ferramentas eliminadas |
| 7 — Fecho | SIM | Sem referencias a ferramentas eliminadas |

---

## Ferramentas ELIMINADAS do plano (NUNCA mais referenciar na pagina do membro)

| Ferramenta | Estado | Razao |
|------------|--------|-------|
| Starter Builder (porta 5192) | ELIMINADA do plano | Problemas, risco alto |
| Prompt Optimizer (porta 5193) | ELIMINADA do plano | Problemas, risco alto |
| AIOS Compiler (porta 5194) | ELIMINADA do plano | Problemas, risco alto |

**Nota:** O codigo destas ferramentas ainda existe no repo (nao commitado) mas NAO sera usado na imersao.

## Ferramentas ACTIVAS no plano

| Ferramenta | Fase | Estado |
|------------|------|--------|
| 5 templates To-Do List (HTML) | Fase 2 | FUNCIONAL — em producao |
| Briefing Generator | Fase 3 | EXISTENTE — verificar se funciona antes da imersao |
| Claude Code (CLI) | Fase 3 | FUNCIONAL |
| Gemini CLI | Fase 3 | A CONFIRMAR disponibilidade |
| Antigravity | Fase 3 | A CONFIRMAR disponibilidade |

---

## Artefactos criados nesta sessao

| Artefacto | Path |
|-----------|------|
| PRD-FASE-2 | imersao-tools/docs/PRD-FASE-2.md |
| PRD-FASE-3 | imersao-tools/docs/PRD-FASE-3.md |
| Regra obrigatoria de registo | .claude/rules/mandatory-change-log.md |
| Handoff V4 | imersao-tools/docs/HANDOFF-AJUSTES-FASES-V4.md |

## Decisoes pendentes

| # | Decisao | Impacto |
|---|---------|---------|
| 1 | Adicionar Claude Code a checklist de contas (Fase 0)? | +2 items na checklist |
| 2 | Briefing Generator — testar antes da imersao | Confirmar que funciona |
| 3 | Gemini CLI e Antigravity — confirmar disponibilidade | Ferramentas da Fase 3 |

---

## Regra criada nesta sessao

**mandatory-change-log.md** — Regra inegociavel para todos os agentes:
- NUNCA commit/handoff sem listar TODAS as alteracoes linha a linha
- NUNCA propor mudancas sem verificar estado actual
- NUNCA reportar "feito" sem diff real
- Origem: incidente 04/04/2026 — 8h de testes desperdicados

---

*Handoff V4 criado em 04/04/2026 ~07:15h. Sessao de madrugada. Tudo deployed e verificado.*
