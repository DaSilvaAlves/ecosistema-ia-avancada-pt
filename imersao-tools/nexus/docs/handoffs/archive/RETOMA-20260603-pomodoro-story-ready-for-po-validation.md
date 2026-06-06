> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# RETOMA — Story Pomodoro refinada, aguarda validação `@po`

**From:** River (`@sm`)
**To:** Pax (`@po`) — `*validate-story-draft pomodoro-custom-duration`
**Created:** 03/06/2026
**Status:** pending

---

## Resumo

Story do Pomodoro configurável (`docs/stories/active/pomodoro-custom-duration-alarm.story.md`) refinada de um rascunho mínimo (Status "Ready for Review" prematuro) para um draft completo alinhado ao SDC. O código já existe no commit `fd7fbd12` da branch `feat/nexus-v2-story-4.8-push-dispatch` — **não está em `main`**. Esta story é para promovê-lo via PR isolado.

**Story Draft Checklist: 5/5**
**Resultado: READY for PO validation**

---

## Contexto

### O que existe (commit `fd7fbd12`)

- `v2/hooks/usePomodoro.ts` — duração configurável (1-180 min), `endsAt` (deadline real), `alarmSound` (3 perfis)
- `v2/components/widgets/PomodoroWidget.tsx` — input numérico + select de alarme
- `v2/tests/unit/hooks/usePomodoro.test.tsx` — 4 testes (duração, alarme, endsAt remount, sessão vencida)
- Quality gates locais: typecheck PASS, lint PASS, test:unit PASS, build PASS (conforme Dev Agent Record no rascunho original)

### O que falta para promover

1. `@po` validação (esta story)
2. `@architect` gate de saída (T2)
3. `@devops` cherry-pick `fd7fbd12` + PR isolado + CodeRabbit (T3)

### Nota de ciclo

A branch partilhada `feat/nexus-v2-story-4.8-push-dispatch` contém tanto os commits da 4.8 (já em `main`) como o `fd7fbd12` (pomodoro). O `@devops` faz cherry-pick para branch nova `feat/nexus-v2-pomodoro-custom-duration` — sem levar ficheiros de push.

---

## [AUTO-DECISIONS] tomadas pelo `@sm` no refinamento

| ID | Decisão | Razão |
|----|---------|-------|
| D-NO-EPIC | Não pertence a nenhum Epic numerado | Feature isolada, sem FR no PRD |
| D-STORY-ID | ID `pomodoro-custom-duration` (não numérico) | Convenção para features isoladas |
| D-LOCALSTORAGE | Persiste em `localStorage` key `nexus_pomodoro` (existente) | ADR-2, retrocompatível |
| D-COMPONENT-TEST | Não exige teste de componente adicional | 2 estados de render (fronteira), baixo risco |

---

## Próxima acção

`@po *validate-story-draft pomodoro-custom-duration` — validar os 10 pontos do checklist PO contra `docs/stories/active/pomodoro-custom-duration-alarm.story.md`.

Após GO: `@architect` gate de saída (T2) → `@devops` cherry-pick + PR isolado (T3).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus` (Nexus v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-pomodoro-story-ready-for-po-validation.md`
- COINCIDEM? SIM

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 03/06/2026
