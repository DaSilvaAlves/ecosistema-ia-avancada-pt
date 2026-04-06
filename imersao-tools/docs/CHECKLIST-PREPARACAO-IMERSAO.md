# CHECKLIST — Preparacao Imersao 11-12/04/2026

> Countdown de 7 dias. Marcar [x] conforme feito.
> Criada: 04/04/2026 | Autor: Uma (UX) + Eurico
> Imersao: 100% ONLINE via Google Meet, maximo 12 participantes

---

## Estado geral

| Area | Estado |
|------|--------|
| 5 templates To-Do List | DEPLOYED |
| todolist.html (guia + checklist 11 items) | DEPLOYED |
| Fases 2 e 3 actualizadas (pipeline eliminado) | DEPLOYED |
| Shards e PRD-MAPA actualizados | FEITO |
| Google Meet configurado | [ ] |
| WhatsApp grupo activo | [ ] |
| Rehearsal completo | [ ] |

---

## D-7 — 05/04 (sabado)

### Decisoes do Eurico

- [ ] Decidir: cada membro instala Claude Code ou so o Eurico usa?
- [ ] Confirmar numero de inscritos
- [ ] Confirmar data final (11-12/04)

### Comunicacao

- [ ] Enviar WhatsApp D-7: confirmacao + link todolist.html
- [ ] Enviar email D-7: mesma info + link todolist.html

**Mensagem sugerida:**
```
Boas! A imersao e ja no proximo fim-de-semana (11-12 Abril).

Preciso que facas uma coisa antes: abre este link e segue os passos.
Demora 40-50 minutos. Faz com calma.

[link todolist.html]

Se tiveres alguma duvida, manda aqui no grupo.
```

---

## D-6 — 06/04 (domingo)

### Conteudo

- [ ] Preparar prompts guiados para Claude Code (templates por tipo de projecto)
- [ ] Preparar apresentacao "Realidade Real" (slides)

---

## D-5 — 07/04 (segunda)

### Validacoes tecnicas

- [ ] Confirmar que Gemini CLI esta disponivel e funcional
- [ ] Confirmar comando exacto de instalacao do Gemini CLI
- [ ] Confirmar que Antigravity esta acessivel e funcional
- [ ] Testar Student Profiler end-to-end

---

## D-4 — 08/04 (terca)

### Testes end-to-end

- [ ] Teste completo Fase 2: abrir todolist.html, escolher template, verificar checklist
- [ ] Teste completo Fase 3: Claude Code + projecto + git push + Vercel deploy
- [ ] Teste completo Fase 3: Antigravity como alternativa
- [ ] Teste completo Fase 3: Gemini CLI como alternativa (se confirmado)

### Comunicacao

- [ ] Enviar WhatsApp D-3: "Ja instalaste tudo?" + link checklist

### Backup

- [ ] Criar API key Groq de backup (segunda conta)
- [ ] Verificar que GitHub PAT funciona
- [ ] Verificar Google Meet (link, permissoes, gravacao)

---

## D-3 — 09/04 (quarta)

### Fixes

- [ ] Corrigir qualquer problema encontrado nos testes de D-4
- [ ] Se Gemini CLI nao funcionar: actualizar checklist no todolist.html (remover item)
- [ ] Verificar URLs em producao uma ultima vez

---

## D-2 — 10/04 (quinta)

### Rehearsal

- [ ] Rehearsal completo: simular Fase 1 (abertura + profiler)
- [ ] Rehearsal completo: simular Fase 2 (template + checklist)
- [ ] Rehearsal completo: simular Fase 3 (Claude Code + deploy)
- [ ] Verificar fluxo de Plano B para cada fase

### Comunicacao

- [ ] Enviar WhatsApp D-1: "Amanha as 10h. Tudo pronto?"

### Logistica

- [ ] Confirmar hotspot 4G backup
- [ ] Testar Google Meet link final
- [ ] Preparar lista de participantes com contactos

---

## D-1 — 11/04 (sexta) — Buffer

- [ ] Ultimo check: todolist.html carrega em producao
- [ ] Ultimo check: 5 templates carregam
- [ ] Ultimo check: Student Profiler funciona
- [ ] Descansar

---

## D-Day — 12/04 (sabado) — IMERSAO DIA 1

### Antes de comecar (09:00-09:45)

- [ ] Abrir Google Meet 15 min antes
- [ ] Verificar internet + hotspot backup
- [ ] Ter abertos: todolist.html, Student Profiler, terminal com Claude Code
- [ ] Lista de participantes impressa/visivel

### Coisas a ter a mao

- [ ] Link Google Meet
- [ ] Link todolist.html
- [ ] Link Student Profiler
- [ ] API keys backup (Groq, Google AI Studio)
- [ ] Hotspot 4G
- [ ] Lista de prompts guiados para Fase 3

---

## D+1 — 13/04 (domingo) — IMERSAO DIA 2

### Antes de comecar

- [ ] Google Meet aberto 15 min antes
- [ ] Revisar estado dos projectos de cada participante
- [ ] Preparar feedback individual

### Apos fecho (Fase 7)

- [ ] Rotar GitHub PAT
- [ ] Rotar Vercel token
- [ ] Gerar nova Groq API key
- [ ] Actualizar env vars e redeploy
- [ ] Recolher feedback dos participantes
- [ ] Fotografias/screenshots dos projectos para marketing

---

## Artefactos da imersao

| Artefacto | Path | Estado |
|-----------|------|--------|
| PRD-MAPA-IMERSAO | docs/PRD-MAPA-IMERSAO.md | ACTUALIZADO |
| FASE-0 (pre-imersao) | docs/shards/FASE-0-PRE-IMERSAO.md | ACTUALIZADO |
| FASE-1 (abertura) | docs/shards/FASE-1-ABERTURA.md | OK |
| FASE-2 (exercicio guiado) | docs/shards/FASE-2-EXERCICIO-GUIADO.md | ACTUALIZADO |
| FASE-3 (projecto real) | docs/shards/FASE-3-PROJECTO-REAL.md | ACTUALIZADO |
| FASE-4 (ponto socorro) | docs/shards/FASE-4-PONTO-SOCORRO-1.md | OK |
| FASE-5 (refinamento) | docs/shards/FASE-5-REFINAMENTO.md | OK |
| FASE-6 (deploy final) | docs/shards/FASE-6-DEPLOY-FINAL.md | OK |
| FASE-7 (fecho) | docs/shards/FASE-7-FECHO.md | OK |
| todolist.html | comunidade/todolist.html | DEPLOYED |
| 5 templates | comunidade/todolist-*.html | DEPLOYED |
| PRD-FASE-2 | docs/PRD-FASE-2.md | OK |
| PRD-FASE-3 | docs/PRD-FASE-3.md | OK |

---

*Checklist criada por Uma (UX) em 04/04/2026. Actualizar diariamente ate a imersao.*
