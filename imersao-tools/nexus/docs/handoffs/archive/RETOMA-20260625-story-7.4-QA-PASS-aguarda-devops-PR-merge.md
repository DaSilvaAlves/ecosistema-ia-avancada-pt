# RETOMA — Story 7.4 (QA PASS): Web Speech synthesis PT-PT lê a resposta do cérebro (FR80), Epic 7 — AGUARDA @devops (PR + merge)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Story:** 7.4 — Web Speech synthesis PT-PT lê a resposta do cérebro (FR80), Epic 7 (Voice + OCR), sub-âmbito Voice 4/4 (última do Voice — fecha o sub-âmbito)
**Estado da story:** Ready for Review · **QA gate de saída: PASS (Confiança Alta)** pelo @qa (Quinn)
**Data:** 25/06/2026
**Agente que sai:** @dev (Dex) — implementou a 7.4; o @qa já correu o gate de saída sobre o trabalho
**Próximo agente:** @devops (Gage) — push + PR + CR server-side `--base main` + merge (6 condições)
**Branch:** `feat/7.4-speech-synthesis` — **2 commits ahead de `origin/main`, NÃO pushed**
**from_agent:** @dev (Dex) · **to_agent:** @devops (Gage) · **status:** pending

---

## 1. Resumo executivo (1 parágrafo)

A Story 7.4 (FR80) está **implementada, testada e com o QA gate de saída PASS**. Fecha o sub-âmbito Voice (4/4): a SAÍDA cérebro → voz. Implementa síntese de voz client-side (Web Speech `SpeechSynthesis`, PT-PT, zero server, zero custo) que lê em voz alta a resposta do cérebro quando o utilizador activa o toggle. A branch `feat/7.4-speech-synthesis` tem 2 commits (impl `46d1e737` + QA gate docs `1e43dc1e`), ambos **por enviar para o remote**. O @qa (Quinn) já correu o gate de saída e registou PASS (Confiança Alta) com a separação de papéis respeitada (executor @dev ≠ gate @qa). **A única acção que falta é do @devops:** push da branch, abrir PR, deixar o CR server-side correr (`--base main` — é o autoritativo), e fazer merge quando as 6 condições de `merge-authority.md` estiverem verdes no head SHA. Depois disso, `@po *close-story 7.4` → Epic 7 passa a 4/10, Voice 4/4 COMPLETO.

## 2. Estado exacto do repo (verificado 25/06/2026)

```
branch: feat/7.4-speech-synthesis
HEAD:   1e43dc1e docs(nexus-v2): QA gate PASS Story 7.4 — Web Speech synthesis PT-PT (FR80) [Story 7.4]
        46d1e737 feat(nexus-v2): Web Speech synthesis PT-PT lê a resposta do cérebro (FR80) [Story 7.4]
ahead de origin/main: 2 commits (NÃO pushed)
working tree: limpo quanto aos ficheiros da 7.4 (sem alterações pendentes na story/código)
```

> O working tree global tem ruído fora-scope (submódulos `comunidade`/`starter-builder` sujos, ~150 untracked `.agent/`/`.codex/`/`.antigravity/`, delete/move do handoff 6.13 de OUTRA story). **NÃO committar nada disso.** Os 2 commits da 7.4 já estão feitos com stage selectivo — o @devops só precisa de `git push` da branch.

## 3. O que está FEITO (não repetir)

**Implementação @dev (commit `46d1e737`, 10 ficheiros, stage selectivo):**
- NOVOS: `v2/hooks/useSpeechSynthesis.ts` (speak/cancel/isSupported + `selectPortugueseVoice` pt-PT→pt-*→null + `isSpeechSynthesisSupported` SSR-safe; `voiceschanged` async + cleanup `removeEventListener` no unmount), `v2/hooks/useSynthesisToggle.ts` (toggle `localStorage` `nexus_speech_synthesis_enabled`, OFF por omissão), `v2/components/chat/SynthesisToggleButton.tsx` (3 estados idle/active/unsupported)
- MODIFICADOS (open-closed): `v2/components/chat/ChatPanel.tsx` (compõe síntese; `useEffect` done→speak; `handleSend` cancel→limpar→submit), `v2/components/chat/InputBox.tsx` (props `synthesisState`/`onSynthesisToggle` opcionais + render do botão), `v2/types/voice.ts` (aditivo `SynthesisToggleState`/`SynthesisToggleButtonProps`)
- TESTES NOVOS (25): `tests/unit/hooks/useSpeechSynthesis.test.ts` (13), `tests/unit/components/chat/SynthesisToggleButton.test.tsx` (7), `tests/unit/components/chat/ChatPanel.synthesis.test.tsx` (5)
- STORY: `docs/stories/active/7.4.story.md` (Approved→Ready for Review, File List, Change Log, Dev Record)
- INTACTO (AC6 open-closed): `useAgentStream.ts`, `useVoice.ts`, `useVoiceModeState.ts`, `VoiceModeButton.tsx`

**Gates internos @dev (verificados):** typecheck 0 · lint 0 (1 warning pré-existente `app/api/auth/logout/route.ts:1` fora-scope) · `npm run test:unit` 2405 PASS (baseline 2380 +25) / 1 flake conhecido `oauth-status > sem sessão → 401` (isolado `npx vitest run tests/unit/api/google/oauth-status.test.ts` → 6/6 PASS = não-regressão).

**QA gate de saída @qa (commit `1e43dc1e`, docs-only):**
- Veredicto **PASS (Confiança Alta)**; secção `## QA Results` na story (11 quality checks) + `docs/QA-GATE-STORY-7.4.md` (relatório completo).
- CodeRabbit **local**: 4 findings **não-bloqueadores** — 1 Major **refutado como falso-positivo** (comportamento defensivo em `useAgentStream.ts:363 setEvents([])`) + 3 Minor documentais.
- AC8 (ouvir voz real E2E) diferida para verificação manual em produção (padrão AC6/7.3, AC13/4.9) — condição registada no gate.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260625-story-7.4-QA-PASS-aguarda-devops-PR-merge.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara, uma só) — @devops

**`@devops` (Gage):**
1. `git push -u origin feat/7.4-speech-synthesis` (a branch tem 2 commits por enviar).
2. Abrir PR contra `main`: `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main --head feat/7.4-speech-synthesis --title "feat(nexus-v2): Web Speech synthesis PT-PT lê a resposta do cérebro (FR80) [Story 7.4]"`.
3. **Deixar o CodeRabbit server-side correr (`--base main` é o autoritativo).** Lição 7.2 (PR #92): o CR server-side apanhou 3 Major que o CR local não viu. Se houver Major/actionable **real** no head SHA → volta ao `@dev *apply-qa-fixes` (NÃO merge). O CR local já refutou 1 Major como falso-positivo, mas o server-side pode trazer outros — reavaliar no head SHA.
4. **Merge quando as 6 condições de `merge-authority.md` estiverem verdes no head SHA** (CI 100%, CR Status SUCCESS, 0 comentários actionable no head SHA, QA gate PASS [já registado], `mergeable`=MERGEABLE, hard-stop §8 ≤2 iter). `reviewDecision: CHANGES_REQUESTED` stale NÃO bloqueia se o head SHA está limpo — usar `--admin`:
   `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch`
5. Pós-merge: `git checkout main && git pull --ff-only origin main`.

**Depois (não-@devops):** `@po *close-story 7.4` → Status Done, mover story para completed, EPIC-7 3/10 → **4/10**, sub-âmbito Voice 3/4 → **4/4 COMPLETO**. Arquivar este handoff.

## 5. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| `merge-authority.md` | O @devops faz o merge quando as 6 condições estão verdes; NÃO pedir merge manual ao Eurico; `reviewDecision` stale não bloqueia se CR Status SUCCESS + 0 actionable no head SHA (usar `--admin --squash --delete-branch`) |
| `cr-base-main-no-gate-saida.md` | O CR autoritativo é o server-side do PR (`--base main`), não o CR local — reavaliar findings no head SHA |
| `separation-of-roles.md` | executor @dev ≠ gate @qa (respeitado); o @devops não é nenhum dos dois — só push/PR/merge |
| Hard-stop §8 | Máx 2 iterações de CR fix→re-review; Iter 3+ exige autorização humana (`Authorized-by:`) |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Commit selectivo | **NUNCA `git add -A`/`git add .`** — working tree tem submódulos sujos + ~150 untracked de ruído + delete/move do handoff 6.13 (de outra story, NÃO tocar). Os commits da 7.4 já estão feitos; o @devops só faz push |
| Script de teste | `npm run test:unit` (NÃO `npm test`), a partir de `imersao-tools/nexus/v2/`. Baseline pós-7.4: 2405 PASS / 1 flake `oauth-status` isolado 6/6 |
| `not-tested-trailer-rules.md` | A 7.4 não toca paths bloqueadores; `Not-tested: AC8 ouvir voz real` é waiver válido (não mockável em CI) |

## 6. GOTCHA crítica (registada na story e na memória @dev)

**NÃO marcar `spokenRunIdRef` antes do check do toggle.** O estado inicial do toggle (`useSynthesisToggle`) é `false` (OFF por omissão), reconciliado com o `localStorage` num `useEffect` POSTERIOR ao mount. No primeiro passe do `useEffect` de síntese, `enabled` é `false` mesmo quando a preferência persistida é ON. Se marcar o `runId` como falado nesse passe OFF, a resposta nunca é lida quando o toggle liga depois. Fix aplicado: `if (!synthesisToggle.enabled) return` ANTES de marcar `spokenRunIdRef`. Apanhado por teste (`ChatPanel.synthesis.test.tsx`). **Se o CR server-side ou um futuro refactor mexer nesta ordem, este é o ponto frágil.**

Outra: o evento `done` do `ExecutorSSEEvent` exige o campo `totals: { intents, toolCalls }` (typecheck apanha helpers de teste incompletos).

## 7. AC8 — verificação manual E2E (follow-up Eurico, não bloqueia merge)

AC8 (ciclo completo voz → cérebro → síntese, ouvir a resposta em voz alta em PT-PT) NÃO é mockável em CI (browser real + microfone + altifalante + sessão activa + síntese de voz do SO). Padrão AC6/7.3 e AC13/4.9. Verificação manual em Chrome/Edge: toggle de síntese ON → dizer/escrever uma frase → cérebro responde → resposta lida em voz alta. Registar evidência (browser + data + output observado) no Change Log da story. **Não bloqueia o merge** — é follow-up de produção, como nas stories anteriores.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260625-story-7.4-QA-PASS-aguarda-devops-PR-merge.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@dev (Dex)`
DATA: `25/06/2026`
