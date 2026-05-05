# QA Gate — Story 0.11: OnboardingModal Step Google disable temporário (F.4)

**Story ID:** 0.11
**Epic:** 0 — Migração Estrutural (follow-up débito técnico)
**Reviewer:** Quinn (`@qa`)
**Data:** 05/05/2026
**Status entrada:** Ready for Review
**Branch:** `fix/nexus-v2-story-0.11-onboarding-google-disable`
**Commit:** `a8a583ca`
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC5, AC7-AC10 PASS. AC6 (smoke production) DEFERRED legitimamente — só executável após `@devops *push` + deploy live |
| 2 | Tests passing | PASS | `npm run test:unit` → **28/28 PASS** (6 novos em `OnboardingModal.test.tsx` cobrindo AC1, AC2, AC4, AC8 + 2 smoke regression Story 0.7) |
| 3 | Lint + typecheck + build | PASS | Lint 1 warning pré-existente fora do scope; typecheck exit 0; build 10/10 páginas com **zero refs a `/api/google/*`** |
| 4 | NFRs respeitadas | PASS | Acessibilidade: `aria-disabled={disabled \|\| undefined}` propagado, `title` HTML para tooltip; Brand voice: PT-PT, sem palavras proibidas (curso/fácil/automático/garantido/revolucionário); Performance: surface area mínima, zero impacto runtime |
| 5 | Security review | PASS | Endpoint `/api/google/oauth/google` continua sem existir (verificado via Glob `app/api/google/**` → no files; Grep da string em todo o projecto → zero matches). Botão `disabled` HTML + `aria-disabled` previnem click programático e keyboard activation. Sem credentials/secrets expostos |
| 6 | Architecture conformance | PASS | `PrimaryButton` change é backwards compatible (`title?: string` opcional; `aria-disabled` só set quando disabled); `Step3` interface change é localizada (componente interno não exportado); 5 ADRs imutáveis `architecture-v2.md` intactos; `vitest.config.ts` não tocado (Story F.1 trata coverage) |
| 7 | Article IV (No Invention) | PASS | Cada AC traceável a fonte real: AC1-AC2 → decisão Eurico Opção B (handoff 05/05/2026 + F.4); AC4 → linha 181 ofensora confirmada no diff vs main; AC7 → `EPIC-0-FOLLOW-UP-DEBT.md` actualizado; AC8 → testes existem em `tests/unit/components/chat/OnboardingModal.test.tsx` |

---

## Independent Verification (Trust but Verify)

### Diff cirúrgico (`git diff main..HEAD -- OnboardingModal.tsx`)

Apenas as alterações esperadas:
- Linha 177-186 (uso): redução de 9 linhas para 1 — `<Step3 onSkip={next} busy={busy} />`
- Linhas 305-334 (componente): removida prop `onConnect`, adicionado comentário Story 0.11, `<PrimaryButton onClick={() => {}} disabled title="...">`
- Linhas 396-413 (PrimaryButton): adicionada prop `title?: string` + `aria-disabled={disabled || undefined}`

Nenhum lixo, nenhuma linha não-relacionada.

### Endpoint Google nunca chamado

```
$ Glob "imersao-tools/nexus/v2/app/api/google/**"
→ No files found

$ Grep "/api/google/oauth/google" -r imersao-tools/nexus/v2
→ No matches found
```

A string ofensora desapareceu do projecto inteiro. Build output (Next.js) confirma: 10 routes compiladas, nenhuma debaixo de `/api/google/*`.

### AC Trace

| AC | Verificação | Estado |
|----|-------------|:---:|
| AC1 | `disabled` literal sem variável (linha 324 `disabled` shorthand) | PASS |
| AC2 | String exacta linha 325: `"Disponível em breve — integração Google Calendar/Gmail a chegar."` | PASS |
| AC3 | `<GhostButton onClick={onSkip} disabled={busy}>` linhas 329-331 + `onSkip={next}` linha 177 | PASS |
| AC4 | `window.location.href = '/api/google/oauth/google'` removido (diff confirma deletion) | PASS |
| AC5 | Reusa `PrimaryButton`/`GhostButton` existentes — zero novo styling | PASS |
| AC6 | Smoke production após deploy | DEFERRED (legítimo) |
| AC7 | `EPIC-0-FOLLOW-UP-DEBT.md` linha "F.4 marcado Done — Opção B aplicada — 05/05/2026" | PASS |
| AC8 | 4 testes Step 3 + 2 smoke regression em `tests/unit/components/chat/OnboardingModal.test.tsx` | PASS |
| AC9 | Lint PASS / Typecheck PASS / Test 28/28 PASS / Build PASS | PASS |
| AC10 | `vitest.config.ts` linhas 27-32 mantidas (`thresholds: 25` preservado) | PASS |

---

## Issues por severidade

### CRITICAL

Nenhum.

### HIGH

Nenhum.

### MEDIUM (Technical Debt — registar em backlog)

1. **Story Epic 6 (Google integration) deve referenciar Story 0.11** — Quando Epic 6 implementar OAuth real:
   - Restaurar prop `onConnect: () => void` em `Step3` interface
   - Re-injectar handler `onConnect` no uso (linha 177)
   - Remover `disabled`, `title`, `onClick={() => {}}` do `PrimaryButton` em Step 3
   - Remover testes "disabled" e adicionar testes de OAuth flow real
   - Marker útil: comentário "Story 0.11 (F.4)" deixado no Step3 linha 309-310 facilita o trace
   - **Recomendação:** ao draftar primeira story de Epic 6 (`@sm *draft` para `epic-6`), incluir referência cruzada a `0.11.story.md`

### LOW

1. **AC6 (smoke production) DEFERRED** — não é blocker do gate. `@qa` re-valida ou `@devops` confirma após deploy live em `https://imersao.ia.expressia.pt`. Steps documentados na story (Testing > Manual / Smoke).

2. **CodeRabbit pre-commit não disparado** — Documentado no Dev Agent Record. Alteração tem surface area mínima (5 ficheiros, 1 ofensor real, baixo risco). `@devops` pode disparar `coderabbit --base main` antes do `git push` opcionalmente.

---

## Observações

- **Decisão `disabled` HTML + `title` + `aria-disabled` foi correcta:** os 6 testes do `OnboardingModal.test.tsx` cobrem o ponto crítico (clicar não navega) E acessibilidade (`aria-disabled="true"`). Tooltip via `title` HTML está dentro de padrão WCAG e funciona em browsers modernos.

- **Refactor do `Step3` mais simples que o esperado:** ao remover prop `onConnect`, a interface ficou só `StepProps & { onSkip: () => void }`. Reduziu surface area sem complexidade adicional.

- **Comentário inline no Step3 (linha 309-310):** marker apropriado para Epic 6 saber onde restaurar funcionalidade. Boa prática.

- **Test path correction (Dev decisão #3 do record):** `vitest.config.ts` include é `tests/unit/**` — `@dev` corrigiu o path da story original (`components/chat/`) e ficheiro está em `tests/unit/components/chat/OnboardingModal.test.tsx`. Coerente com `tests/unit/components/InputBox.test.tsx` existente.

- **Story 0.7 QA Gate (linha 36) já tinha previsto este problema:** "Step 3 redirige para `/api/google/oauth/google` — endpoint não existe ainda (Epic 6). **Mitigação:** o 'Saltar' funciona em qualquer altura". Story 0.11 fecha o loop dessa observação.

---

## Decisão

**PASS.** Implementação cirúrgica, todos os 7 checks PASS, AC trace completo, surface area mínima, zero invenção. Bug real removido em produção (após deploy). Single MEDIUM item registado como tech debt para Epic 6 cross-reference.

**Próximo passo:** `@devops *push`

Workflow esperado:
1. `@devops` faz pre-PR CodeRabbit scan opcional (`coderabbit --base main`)
2. `@devops` push da branch `fix/nexus-v2-story-0.11-onboarding-google-disable`
3. `@devops` cria PR
4. CI corre (lint + typecheck + test:unit + build + Vercel preview)
5. Eurico aprova ou `@devops` merge directo (Eurico tem feito merge directo em stories simples)
6. Vercel deploy production automático
7. **Smoke test AC6** (validar manualmente em `https://imersao.ia.expressia.pt`):
   - Limpar `localStorage` ou abrir incognito
   - Login → avançar Step 1 (Continuar) → Step 2 (Saltar) → Step 3
   - Botão "Ligar Google" deve estar desactivado, hover mostra tooltip
   - Clicar não navega; "Saltar" avança para Step 4
8. Após smoke OK: mover `0.11.story.md` para `stories/completed/`, marcar Status `Done`

— Quinn, guardião da qualidade 🛡️
