# Story Pomodoro Custom Duration + Alarm

**Status:** Ready for Review
**Tipo:** Fix/UX pequeno solicitado por Eurico em 02/06/2026

## User Story

Como Eurico, quero escolher a duracao do Pomodoro por tarefa e receber um aviso sonoro quando o tempo terminar, para usar blocos de foco de tamanhos diferentes sem perder o fim da sessao quando mudo de pagina.

## Acceptance Criteria

- **AC1:** O Pomodoro permite escolher uma duracao em minutos antes de iniciar.
- **AC2:** A duracao escolhida fica persistida no `localStorage`.
- **AC3:** Enquanto esta a correr, o contador usa uma hora real de fim (`endsAt`) para continuar correto apos remount/reload/background.
- **AC4:** Ao terminar, o Pomodoro toca um aviso sonoro e marca uma sessao de trabalho concluida.
- **AC5:** O Pomodoro permite escolher um perfil de alarme mais audivel.
- **AC6:** O scope fica limitado ao Pomodoro v2.

## Tasks / Subtasks

- [x] Adicionar testes do hook para duracao customizada, `endsAt` persistido e conclusao apos remount
- [x] Implementar estado persistido de duracao customizada e deadline real no hook
- [x] Atualizar UI do widget para editar minutos
- [x] Adicionar opcoes de alarme audivel e persistir a escolha
- [x] Executar quality gates relevantes

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm.cmd run test:unit -- tests/unit/hooks/usePomodoro.test.tsx` falhou primeiro com `setWorkDurationMinutes is not a function` (RED esperado).
- `npm.cmd run test:unit -- tests/unit/hooks/usePomodoro.test.tsx` PASS.
- `npm.cmd run test:unit -- tests/unit/hooks/usePomodoro.test.tsx` falhou com `setAlarmSound is not a function` e chamada de alarme insuficiente (RED esperado para opcoes de alarme).
- `npm.cmd run test:unit -- tests/unit/hooks/usePomodoro.test.tsx` PASS apos opcoes de alarme.
- `npm.cmd run typecheck` PASS.
- `npm.cmd run lint` PASS com warnings existentes fora do scope (`app/api/auth/logout/route.ts`, multiplos lockfiles).
- `npm.cmd run test:unit` PASS.
- `npm.cmd run build` PASS fora do sandbox; no sandbox falhou por `EPERM readlink C:\Users\XPS`.

### Completion Notes List

- Pomodoro v2 agora aceita duracao customizada de 1 a 180 minutos.
- A duracao escolhida e persistida em `localStorage` junto com `endsAt`.
- Timer em execucao usa deadline real (`endsAt`) para recomputar tempo restante apos remount/reload/background.
- Ao expirar, sessao de trabalho incrementa `sessionsToday`, entra em pausa e toca um alarme curto de 3 bips.
- Alarme ajustado para perfis `Suave`, `Claro` e `Urgente`; `Claro` passa a ser o padrao mais audivel.

### File List

- `docs/stories/active/pomodoro-custom-duration-alarm.story.md`
- `v2/hooks/usePomodoro.ts`
- `v2/components/widgets/PomodoroWidget.tsx`
- `v2/tests/unit/hooks/usePomodoro.test.tsx`

### Change Log

| Data | Descricao |
|------|-----------|
| 02/06/2026 | Story tecnica minima criada para cumprir Story-Driven Development no pedido de Pomodoro customizavel. |
| 02/06/2026 | Implementado Pomodoro customizavel com deadline real, alarme sonoro e testes unitarios. |
| 02/06/2026 | Adicionadas opcoes de alarme e padrao mais audivel. |
