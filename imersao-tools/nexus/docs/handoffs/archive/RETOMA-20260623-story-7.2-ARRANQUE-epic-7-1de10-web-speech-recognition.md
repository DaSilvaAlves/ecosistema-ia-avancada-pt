# RETOMA — Story 7.2 (Web Speech recognition PT-PT → texto, FR78) ARRANQUE — Epic 7 em 1/10, sub-âmbito Voice 1/4

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** `@aiox-master` (orquestração do pipeline /sdc, sessão 23/06/2026)
- **to_agent:** any — preferencialmente `@sm` (River) para `*draft 7.2`
- **created:** 23/06/2026
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git fetch origin
git checkout main
git log --oneline -2            # esperado topo: commit docs-only de arranque 7.2 (este handoff), por cima de 2faf6aeb (close-story 7.1) — código inalterado
git rev-list --left-right --count main...origin/main   # esperado: 0  0 (sincronizado)
```

**Estado limpo confirmado (23/06/2026):** `main` local == `origin/main` == `2faf6aeb` (0/0). NÃO há branches de feature pendentes (a `feat/story-7.1-voicemode-ui` foi eliminada no merge do PR #91). NÃO há trabalho de DevOps pendente. A 7.1 está MERGED (`45164bb2`) e FECHADA (`2faf6aeb`).

**ATENÇÃO ao ruído do working tree (pré-existente, fora-scope, NÃO tocar):** a raiz tem submódulos sujos (`comunidade`, `starter-builder`) + ~150 ficheiros untracked não-relacionados (`.codex/`, `.antigravity/`, `.cursor/`, `PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`, etc.). **NUNCA `git add -A`** — staging sempre selectivo ficheiro-a-ficheiro.

Ordem de leitura na activação: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, separation-of-roles, internal-state-contract-gate, cr-base-main-no-gate-saida, not-tested-trailer-rules, mock-protocol-fidelity, external-contract-identifiers, design-system-ia-avancada); 2) ESTE handoff; 3) `imersao-tools/nexus/docs/EPIC-7.md` (linha 7.2 = §5 row 81; GAPs §7); 4) a story 7.1 FECHADA (`imersao-tools/nexus/docs/stories/completed/7.1.story.md`) — contém o contrato do hook/componente que a 7.2 herda.

**Comando para retomar (one-shot):** `/sdc 7.2 --push` — corre o pipeline completo (draft → validate → [architect gate de entrada conforme decisão GAP-7.1] → develop → gate de saída → devops push/PR/merge → close-story).

---

## Summary

O Epic 7 (Voice + OCR) está em **1/10 stories Done**. A 7.1 (VoiceMode UI, FR77) foi fechada nesta sessão (23/06/2026): componente `VoiceModeButton` (5 estados de render), hook `useVoiceModeState`, integração no `InputBox` substituindo o placeholder `<Mic>`. PR #91, squash-merge `45164bb2`, CR 2 iterações (3 Minor resolvidos: a11y `isInteractive`/`onVoiceToggle` + 2 doc-AC drift), waiver 0%. Fecho docs-only `2faf6aeb`.

**Próxima story: 7.2 — Web Speech recognition (PT-PT) → texto (FR78).** Executor previsto `@dev`; quality gate previsto `@qa` (`separation-of-roles.md`; `@sm`/`@po` finalizam a atribuição no draft). Sub-âmbito Voice fica 2/4 ao fechar.

### O que a 7.2 deve entregar (esboço — o `@sm`/`@architect` ratificam no draft/gate)

FR78 = **Web Speech API recognition em PT-PT, client-side**, que transcreve voz para texto. Liga-se ao componente VoiceMode da 7.1 através do contrato já definido — a 7.2 fornece a lógica de speech que a 7.1 deixou como ponto de extensão.

Contrato HERDADO da 7.1 (em `main`, NÃO duplicar — open-closed):
- **Hook `useVoiceModeState`** (`imersao-tools/nexus/v2/hooks/useVoiceModeState.ts`) — a 7.2 liga-se a estes membros já existentes (documentados na própria 7.1):
  - `toggle()` → a 7.2 liga ao `SpeechRecognition.start()/stop()`
  - `setProcessing()` → a 7.2 chama quando o reconhecimento termina e o texto está pronto
  - `setError(msg)` → a 7.2 chama no `onerror` do `SpeechRecognition`
  - `reset()` → volta a `idle` (recuperação de erro)
  - `state`, `errorMessage`, `isSupported` expostos; `isSpeechRecognitionSupported()` helper já existe
- **`VoiceModeButton`** (`components/chat/VoiceModeButton.tsx`) — prop `onVoiceToggle?: (active: boolean) => void` é o ponto de extensão estável; `types/voice.ts` tem `VoiceModeState` e `VoiceModeButtonProps`.
- Precedente de fluxo: a voz transcrita injecta-se no pipeline existente do cérebro (Epic 1) — a 7.3 fará essa ligação; a 7.2 entrega o texto. NÃO criar fluxo novo (precedente 6.13 para texto Telegram).

Âmbito (arch §3 `useVoice.ts` client-side, §6 stack "Voice = Web Speech API browser nativo"): **só client-side, sem custo, sem server.** Chrome/Edge suportados; Firefox best-effort (R2/AR7 — bug intermitente PT-PT). O estado `unsupported` da 7.1 já cobre browser-não-suportado.

GAPs prováveis a resolver no draft/gate:
- **[GAP-7.1]** (EPIC-7.md §7) — transcrição de voz: **a 7.2 é o caminho (a) — Web Speech client-side no browser**, que NÃO precisa de server nem de decisão de transcrição server-side. O caminho (b) (voz Telegram, REC-6.14) é problema distinto e NÃO é a 7.2. Confirmar esta fronteira no draft (a 7.2 não toca no webhook Telegram).
- **`internal-state-contract-gate.md`** — o estado vive numa só camada (o hook da 7.1). A 7.2 acrescenta a instância de `SpeechRecognition` (objecto de browser, efémero) ligada ao hook. Confirmar que não introduz estado multi-camada persistido; cobrir os caminhos de falha (`onerror`, `no-speech`, permissão de microfone negada → `setError`, nunca sucesso silencioso).
- **`mock-protocol-fidelity.md`** — testar Web Speech exige mock do `SpeechRecognition` do browser; o mock reflecte o protocolo real da Web Speech API (eventos `onresult`/`onerror`/`onend`, `results[].transcript`, `lang='pt-PT'`).
- **react-component-test-criteria.md** — se a lógica viver num hook, testar o hook; se houver UI com estados, teste de componente.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-7.2-ARRANQUE-epic-7-1de10-web-speech-recognition.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado do projecto (verificado 23/06/2026)

| Item | Valor |
|------|-------|
| `main` HEAD | `2faf6aeb` (close-story 7.1) |
| `main` vs `origin/main` | 0/0 (sincronizado) |
| Epic 6 | FECHADO 16/17 (6.15 diferida → Epic 7 como 7.9); retrospectiva `ece90945` |
| Epic 7 | **1/10** Done (7.1) |
| Sub-âmbito Voice | **1/4** (7.1 feita; faltam 7.2, 7.3, 7.4) |
| Sub-âmbito OCR | 0/6 (7.5-7.10) |
| Próxima story | **7.2** Web Speech recognition PT-PT → texto (FR78) |
| Executor/gate previstos | `@dev` / `@qa` |
| Suite Vitest baseline | 2359 PASS (pós-7.1; flake `oauth-status` isolado-PASS = não-regressão) |
| Waiver rate Epic 7 | 0% (1/1 story fechada waiver 0) |

### Últimos commits relevantes em main

```
2faf6aeb docs(nexus-v2): close-story 7.1 VoiceMode UI (FR77) — Done, Epic 7 1/10 [Story 7.1]
45164bb2 feat(nexus-v2): componente VoiceMode UI (FR77) [Story 7.1] (#91)
c7a0d389 docs(nexus-v2): create Epic 7 (Voice + OCR) — desbloqueia 6.15 [Epic 7]
ece90945 docs(nexus-v2): retrospective + fecho Epic 6 16/17 (6.15 diferida ao Epic 7)
```

---

## Next action

**1. `@sm` (River) `*draft 7.2`** — criar a story do Web Speech recognition PT-PT (FR78). Trace ao PRD §6.14 (FR78) + EPIC-7.md §5 (row 7.2). Aplicar lições preventivas: `mock-protocol-fidelity.md` (mock Web Speech reflecte o protocolo real do browser), `internal-state-contract-gate.md` (caminhos de falha do reconhecimento), `react-component-test-criteria.md`. Reutilizar o contrato do hook/componente da 7.1 (open-closed). Marcar a fronteira firme: 7.2 = só client-side, não toca no webhook Telegram (GAP-7.1 caminho a).

**2. `@po` (Pax) `*validate-story-draft`** — GO/NO-GO, anti-invenção (Artigo IV).

**3. `@architect` (Aria) Gate de Entrada** — avaliar se é necessário. A 7.2 é client-side pura (sem fronteira client/server, sem route Node), à semelhança da 7.1 onde o gate de entrada foi saltado por não haver decisão arquitectural. PORÉM o GAP-7.1 toca a 7.2 na delimitação Web Speech vs transcrição server-side — se o draft deixar essa fronteira ambígua, correr o gate; se a fronteira ficar clara (7.2 = só caminho a), pode saltar-se como na 7.1.

**4. `@dev` (Dex) `*develop`** — implementar + gates (lint 0, typecheck 0, suite verde) + CR `--base main` local 0 findings.

**5. Gate de Saída** (`@qa` Quinn conforme `separation-of-roles`: executor `@dev` → gate `@qa`) — PASS vs código real + `coderabbit --base main` (regra `cr-base-main-no-gate-saida.md`).

**6. `@devops` (Gage) push → PR → CR no head SHA → auto-merge** — exactamente como na 7.1: `git push -u origin feat/story-7.2-*`; `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main ...`; verificar as 6 condições de `merge-authority.md` no head SHA. **Nota (lição 7.1):** o CR pode levantar findings Minor (doc-AC drift, a11y) que continuam a ser **actionable** — a condição #3 exige 0 actionable no head SHA, logo mesmo Minor bloqueia merge silencioso; devolver ao executor (1 iteração rápida) em vez de waiver. Hard-stop §8 = máx 2 iter CR; Iter 3+ exige autorização humana. `reviewDecision: CHANGES_REQUESTED` pode ser stale (cruzar `original_commit_id` ≠ head). Atenção ao rate-limit do CR App (SUCCESS sem re-rever — cruzar `commit_id` + leitura do código, lição 6.16). NÃO pedir merge manual ao Eurico (`merge-authority.md`).

**7. `@po` (Pax) `*close-story 7.2`** — Status→Done, `git mv active/→completed/`, EPIC-7.md 1/10→**2/10**, Voice 1/4→**2/4**, fecho docs-only (commit directo em main + push ff sem PR — convenção close). `@devops` faz o push do commit de fecho. Consumir ESTE handoff (marcar `consumed:true`, mover para `archive/`, actualizar índices).

**Depois da 7.2:** próxima candidata 7.3 (texto transcrito → cérebro, FR79). O sub-âmbito OCR (7.5-7.10) pode correr em paralelo ao Voice se o Eurico quiser abrir uma segunda lane (7.5 endpoint é a fundação do OCR).

## Notas operacionais

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- NUNCA `git add -A` (submódulos sujos + ~150 untracked fora-scope). Staging selectivo.
- Pre-commit hooks SEM `--no-verify`.
- `Not-tested:` é red flag bloqueador em paths de CI/config/test-runner/segurança (`not-tested-trailer-rules.md`) — usar `Evidence:` com cobertura/execução local. A 7.2 toca testes → usar `Evidence:`.
- Só `@devops` faz push e merge (autoridade exclusiva). O merge é trabalho do agente, não do Eurico (`merge-authority.md`).
- Stories UI/voz: respeitar o Design System [IA]AVANÇADA PT (`.claude/rules/design-system-ia-avancada.md`) se houver elementos visuais novos — a 7.2 é sobretudo lógica, a UI já veio na 7.1.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-7.2-ARRANQUE-epic-7-1de10-web-speech-recognition.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `23/06/2026`
