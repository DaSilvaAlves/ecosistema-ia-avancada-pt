# RETOMA — Story 5.11 (Pesquisa web, FR55) — PR #72 BLOQUEADO por CodeQL (2 HIGH)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 14/06/2026
**Agente:** Gage (`@devops`)
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Estado:** PR #72 ABERTO, MERGE BLOQUEADO — escalado a `@dev`

---

## Resumo

A fase DEVOPS do `/sdc` da Story 5.11 levou a story de Ready for Review até PR aberto com CI a correr. **Todos os gates pre-push passaram** (lint 0, typecheck 0, vitest 1803/1803, CodeRabbit pre-PR CLI 0 findings) e o commit + push + PR foram feitos. **Mas o CI no PR falhou num check de segurança:** o `CodeQL` (GitHub Advanced Security) detectou **2 alertas de severidade HIGH** no helper novo `lib/shared/web-search-ddg.ts`. Por `merge-authority.md` (CI com check FAILURE + security path), o merge NÃO foi feito — escala para `@dev` corrigir.

O ponto importante: o CodeRabbit CLI local (e o pre-commit do `@dev`) deram 0 findings, e o Architect Gate de saída deu PASS Confidence High. Nenhum dos gates internos apanhou estes 2 problemas de sanitização — só o CodeQL no PR os apanhou. Mesmo padrão de classe que a 4.9 (gates internos passam, scanner do PR apanha).

## Estado dos artefactos

| Artefacto | Valor |
|-----------|-------|
| Branch | `feat/nexus-v2-5.11-pesquisa-web` |
| Commit | `02ebf98b` (12 ficheiros, +2996/-28) |
| PR | #72 — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/72 |
| Head SHA | `02ebf98b26431387f8eab37661e7c0b6d0424b84` |
| mergeable | MERGEABLE |
| mergeStateStatus | UNSTABLE (por causa do CodeQL FAILURE) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/RETOMA-20260614-story-5.11-PR-72-bloqueado-codeql-2-high.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## CI no head SHA `02ebf98b` (estado final)

Todos os checks reais SUCCESS **excepto** o CodeQL:

- SUCCESS: Lint + TypeScript, Vitest unit + coverage, 50-prompt regression, Coverage Report, Playwright E2E + bundle key, Analyze (javascript-typescript), Analyze (actions), CodeRabbit Status, Vercel Preview Comments, Validation Summary, Record Quality Metrics, Post PR Comments.
- SKIPPED: framework AIOX (não aplicável ao Nexus) — benigno.
- **FAILURE: `CodeQL`** (app: GitHub Advanced Security) — `output_title: "2 new alerts including 2 high severity security vulnerabilities"`.

CodeRabbit: `CodeRabbit Status: SUCCESS`. Os 2 comentários no head SHA são do `github-advanced-security[bot]` (os mesmos 2 alertas CodeQL), NÃO da CodeRabbit. A CodeRabbit não levantou findings actionable.

## Os 2 alertas HIGH (diagnóstico exacto) — ambos em `v2/lib/shared/web-search-ddg.ts`

### Alerta #20 — `js/double-escaping` (HIGH) — `decodeHtmlEntities`, linhas 41-48

```js
function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')      // <-- PROBLEMA: descodifica & PRIMEIRO
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
```

**Causa:** o `&amp;` é descodificado **primeiro**. Input `&amp;lt;` → 1.º passo dá `&lt;` → 2.º passo dá `<` (double-unescaping). Mensagem CodeQL: "This replacement may produce '&' characters that are double-unescaped here."

**Correcção canónica (do próprio help do CodeQL):** descodificar `&amp;` **por último** — mover o `.replace(/&amp;/g, '&')` para o fim da cadeia, depois de todas as outras entidades. Adicionar teste com input `&amp;lt;` que assere saída `&lt;` (não `<`).

### Alerta #19 — `js/incomplete-multi-character-sanitization` (HIGH) — `stripTags`, linha 53

```js
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');   // <-- PROBLEMA: uma só passagem
}
```

**Causa:** uma só passagem do regex. Input com tags aninhadas/sobrepostas (ex: `<scr<script>ipt>`) → após remover `<script>` interno, a sequência `<script>` reaparece. Mensagem CodeQL: "This string may still contain `<script`, which may cause an HTML element injection vulnerability." Relevante porque o input é HTML externo arbitrário da DDG (1.º fetch externo arbitrário do Nexus).

**Correcção canónica (do help do CodeQL):** aplicar o replace **em loop até estabilizar**:

```js
function stripTags(input: string): string {
  let prev;
  let out = input;
  do { prev = out; out = out.replace(/<[^>]*>/g, ''); } while (out !== prev);
  return out;
}
```

Adicionar teste com input de tags aninhadas (ex: `<scr<script>ipt>alert(1)<scr</script>ipt>`) que assere ausência de `<script` na saída.

---

## Próximo passo (escalação — `@dev`)

1. `@dev *qa-loop-fix 5.11` (ou retoma directa): corrigir os 2 HIGH em `lib/shared/web-search-ddg.ts`:
   - `decodeHtmlEntities`: mover `&amp;` para o fim da cadeia de replaces.
   - `stripTags`: loop até estabilizar.
   - Adicionar ≥1 teste por correcção (double-escape + nested-tags) — fortalece `web-search-ddg.test.ts`.
   - Re-correr gates locais (lint/typecheck/vitest) + CodeRabbit CLI.
2. `@dev` commit local (NÃO push — push é do `@devops`). Atenção: NÃO usar `Not-tested:` — `web-search-ddg.ts` não é path bloqueador (`vitest.config.ts` intocado), mas é caminho de **segurança/sanitização**: anexar evidência de teste.
3. `@devops` (retoma): `git push` ff da branch (sem `-f`) → dispara CodeQL Iter 2 no PR #72.
4. `@devops`: verificar que o `CodeQL` passa a SUCCESS no novo head SHA + as 6 condições de `merge-authority.md` → auto-merge `gh pr merge 72 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch`.
5. Pós-merge: `git checkout main && git pull --ff-only origin main`. Depois `@po *close-story 5.11` (Epic 5 passa a 11/13).

**Comando para retomar o estado (verificar CodeQL após novo push):**
```
gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/code-scanning/alerts?ref=refs/heads/feat/nexus-v2-5.11-pesquisa-web -q '.[] | select(.state=="open") | {n:.number, sev:.rule.security_severity_level, rule:.rule.id, line:.most_recent_instance.location.start_line}'
```
(esperado: vazio após a correcção)

## Nota sobre dismiss vs fix

NÃO recomendo dismiss dos alertas — são bugs reais de sanitização num caminho que processa HTML externo arbitrário (exactamente o risco R2 da story). A correcção é barata (2 funções, ~4 linhas) e tem precedente canónico no próprio help do CodeQL. Fix > waiver.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/RETOMA-20260614-story-5.11-PR-72-bloqueado-codeql-2-high.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `14/06/2026`
