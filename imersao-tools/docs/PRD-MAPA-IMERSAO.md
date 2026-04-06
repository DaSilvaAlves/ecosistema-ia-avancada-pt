# PRD — Mapa da Imersao IA Portugal

> Planeamento fase-a-fase da imersao. Cada fase = um momento executavel do dia.
> Criado: 03/04/2026 | Actualizado: 04/04/2026 | Autor: Morgan (PM) + Eurico
> Status: v3 — pipeline eliminado, ferramentas actualizadas

---

## Visao geral

Fim de semana intensivo (sabado + domingo). 100% ONLINE via Google Meet. Maximo 12 participantes.
Promessa: "Em 48 horas, sais com uma solucao real, construida por ti."

**Data:** 11-12 de Abril de 2026 (sabado + domingo)

---

## Indice de fases

| Fase | Quando | Momento | Shard |
|------|--------|---------|-------|
| 0 | Dias antes | Pre-imersao: setup dos alunos | [FASE-0](shards/FASE-0-PRE-IMERSAO.md) |
| 1 | Sab 10:00-11:00 | Abertura + perfil do aluno | [FASE-1](shards/FASE-1-ABERTURA.md) |
| 2 | Sab 11:00-13:00 | Exercicio guiado — To-Do List + setup contas | [FASE-2](shards/FASE-2-EXERCICIO-GUIADO.md) |
| 3 | Sab 15:00-19:00 | Mao na massa — projecto real | [FASE-3](shards/FASE-3-PROJECTO-REAL.md) |
| 4 | Sab 22:00-23:30 | Ponto Socorro noturno | [FASE-4](shards/FASE-4-PONTO-SOCORRO-1.md) |
| 5 | Dom 10:00-13:00 | Refinamento + features | [FASE-5](shards/FASE-5-REFINAMENTO.md) |
| 6 | Dom 15:00-16:00 | Deploy final | [FASE-6](shards/FASE-6-DEPLOY-FINAL.md) |
| 7 | Dom 22:00 | Fecho + celebracao | [FASE-7](shards/FASE-7-FECHO.md) |

---

## Ferramentas ACTIVAS

| Ferramenta | Fase(s) | Papel |
|------------|---------|-------|
| 5 templates To-Do List (HTML) | Fase 2 | Exercicio guiado — resultado imediato |
| Student Profiler | Fase 1 | Quiz de perfil — icebreaker |
| Claude Code (CLI) | Fases 3, 5, 6 | Construcao principal dos projectos |
| Gemini CLI | Fases 3, 5, 6 | Alternativa de construcao Google |
| Antigravity (IDE) | Fases 3, 5, 6 | Salva-vidas — IDE visual com IA |
| Perplexity | Fase 3 | Pesquisa sobre o projecto |
| ChatGPT | Fase 3 | Refinar ideias e brainstorm |
| GitHub | Fases 3, 5, 6 | Repositorio de codigo |
| Vercel | Fases 3, 6 | Deploy publico |
| Google Meet | Fases 4, 7 | Sessoes remotas |

## Ferramentas ELIMINADAS (NUNCA referenciar ao membro)

| Ferramenta | Porta | Razao |
|------------|-------|-------|
| Starter Builder | 5192 | Problemas, risco alto para evento ao vivo |
| Prompt Optimizer | 5193 | Problemas, risco alto para evento ao vivo |
| AIOS Compiler | 5194 | Problemas, risco alto para evento ao vivo |
| Briefing Generator | 5190 | Substituido por Claude Code |

---

## Decisoes pendentes do Eurico

| # | Decisao | Impacto | Deadline |
|---|---------|---------|----------|
| 1 | Gemini CLI — confirmar disponibilidade e comando | Checklist dos membros | 07/04 |
| 2 | Antigravity — confirmar que funciona | Fase 3 — salva-vidas | 07/04 |
| 3 | Cada membro instala Claude Code ou so o Eurico? | Fases 3, 5 | 05/04 |
| 4 | Numero de inscritos confirmado? | Nivel de suporte | 05/04 |

---

## Riscos criticos

| Risco | Fase afectada | Mitigacao |
|-------|---------------|-----------|
| Ferramenta de construcao falha | Fase 3 | 3 alternativas: Claude Code, Gemini CLI, Antigravity |
| Groq offline | Fase 3 | API key backup, Gemini como fallback |
| Aluno sem experiencia terminal | Fase 3 | Antigravity (IDE visual) como salva-vidas |
| Internet instavel | Todas | Hotspot 4G backup |
| Aluno nao consegue articular ideia | Fase 3 | Claude Code faz perguntas guiadas |

---

## Calendario ate a imersao

| Data | Accao | Responsavel | Estado |
|------|-------|-------------|--------|
| 04/04 | Actualizar shards e PRD | Uma | FEITO |
| 05/04 | Decidir: Claude Code por membro? + confirmar inscritos | Eurico | [ ] |
| 05/04 | Enviar D-7 WhatsApp + email com link todolist.html | Eurico | [ ] |
| 06/04 | Preparar prompts guiados para Claude Code | @dev | [ ] |
| 07/04 | Confirmar Gemini CLI + Antigravity | Eurico | [ ] |
| 08/04 | Teste end-to-end exercicio guiado + Fase 3 | @qa | [ ] |
| 08/04 | Enviar D-3 WhatsApp lembrete | Eurico | [ ] |
| 09/04 | Fixes criticos (se necessarios) | @dev | [ ] |
| 10/04 | Rehearsal completo + D-1 WhatsApp | Eurico | [ ] |
| 11/04 | Buffer | — | — |
| 12/04 | IMERSAO DIA 1 (Sabado) | Eurico | — |
| 13/04 | IMERSAO DIA 2 (Domingo) | Eurico | — |

---

*PRD sharded por Morgan (PM). Actualizado por Uma (UX) em 04/04/2026. Pipeline eliminado, ferramentas actualizadas.*
