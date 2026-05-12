# RETOMA — Story 1.10 PR #14 CI VERMELHO, aguarda `@dev` fix do 401 auth

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 09/05/2026
**Autor:** `@aiox-master` (Orion) — orquestração de transição
**De:** `@aiox-master` (após diagnóstico do CI)
**Para:** `@dev` (Dex)
**Acção esperada:** Investigar 401 auth no CI run do PR #14 → aplicar fix → commit local → entregar a `@devops` para push + rerun CI

---

## TL;DR

PR #14 abriu OK por `@devops`. Os 2 commits estão no remote. **CI correu e está VERMELHO** com 1 falha repetida em ambos os jobs E2E: **401 Login Failed** em `loginViaApi` no setup de cada teste de regression.

| Item | Valor |
|------|-------|
| Story | 1.10 (E2E Regression — 50 prompts PT-PT) |
| PR | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14 |
| Branch | `feat/nexus-v2-story-1.10-e2e-regression` |
| Commits no remote | `83f99298` (data-testids) + `d77ebf37` (suite consolidada) |
| Mergeable | MERGEABLE / **UNSTABLE** |
| CI verde? | **❌ NÃO** — 2 jobs FAILURE com mesma root cause |
| `@po *close-story 1.10` | 🚫 BLOQUEADA |

---

## Falhas concretas no CI run

| Workflow | Job | Status |
|----------|-----|--------|
| Nexus v2 — E2E Regression (Story 1.10) | `50-prompt regression` | ❌ FAILURE |
| Nexus v2 CI | `Playwright E2E + bundle key check` | ❌ FAILURE |
| Restantes (Lint+TS, Vitest, CodeQL, CodeRabbit, Vercel preview) | — | ✅ SUCCESS |

### Erro consistente nos 2 jobs (excerto dos logs)

```
Error: [auth] Login failed (401): {"error":"Password incorrecta. Verifica no Vercel."}.
Confirma TEST_PASSWORD e NEXUS_PASSWORD_HASH no env.
   at regression/helpers/auth.ts:37
   at loginViaApi (.../tests/e2e/regression/helpers/auth.ts:37:11)
   at .../tests/e2e/regression/regression.spec.ts:57:5
```

Resultado:
- `Pass: 0/1 (threshold ≥43)` — só 1 prompt foi tentado, falhou no setup, restantes 49 não correram
- `Canonical all PASS: false`
- Workflow termina com `exit code 1`

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Diagnóstico já feito (não repetir)

`@aiox-master` fez investigação rasa antes de delegar. Resultados:

### 1. Hash bate localmente — não é problema da hash em si

Validado com:

```bash
node -e "const b=require('bcryptjs'); const h='\$2a\$10\$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K'; console.log(b.compareSync('nexus-test-password', h));"
# → true
```

A hash em `.github/workflows/e2e-regression.yml:37` é a mesma que o RETOMA anterior (linha 82) refere ter sido validada por Quinn em F-CONCERNS-2.

### 2. Server route handler está OK

`imersao-tools/nexus/v2/app/api/auth/login/route.ts`:
- Linha 12: `export const runtime = 'nodejs'` ✅ Node runtime, sem problema com bcrypt
- Linha 36: `const passwordHash = process.env.NEXUS_PASSWORD_HASH` — lê do env
- Linha 37-42: se `!passwordHash` retorna **500**, NÃO 401 → como CI dá 401, **o env CHEGA ao server, mas o `verifyPassword` retorna `false`**

`imersao-tools/nexus/v2/lib/auth/password.ts:13`: `bcrypt.compare(plain, hash)` (de `bcryptjs`, não bindings nativos).

### 3. Workflow tem env hardcoded correctamente

`.github/workflows/e2e-regression.yml`:
- Linha 37: `NEXUS_PASSWORD_HASH: '$2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K'`
- Linha 39: `TEST_PASSWORD: nexus-test-password`

CI logs do step "Validate report against thresholds" confirmam que **o env está presente no shell do step**:

```
NEXUS_PASSWORD_HASH: $2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K
TEST_PASSWORD: nexus-test-password
```

### 4. Não há `.env.local` ou `.env.test` em `imersao-tools/nexus/v2/`

Único ficheiro `.env*` existente: `.env.example`. Logo Next.js puro herda env do parent.

### 5. Playwright `webServer` config

`imersao-tools/nexus/v2/playwright.config.ts:30-35`:
```ts
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3001',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
```

**Sem `env: {...}` explícito** — herda env do parent process por default.

### Conclusão do diagnóstico

| Camada | Estado |
|--------|--------|
| Hash em si | ✅ válida para a password |
| Server runtime | ✅ Node, sem edge issue |
| Env do step `run` | ✅ presente |
| Server retorna 500? | ❌ retorna 401 → env chegou ao server mas comparação falhou |
| Próxima dúvida | **Algo entre o env do step e o `process.env.NEXUS_PASSWORD_HASH` lido pelo Next.js subprocess está a alterar o valor** |

---

## Hipóteses prováveis para `@dev` investigar (ordenadas)

1. **Dollar-sign expansion no shell** — quando `npm run dev` é spawn pelo Playwright via shell, o `$10$` ou `$2a$` da hash pode ser interpretado como variable expansion mesmo dentro de aspas simples no YAML. Verificar se Bash/POSIX shell em GitHub Actions Linux runner expande `$2a` → vazio (porque `$2a` não é var definida). Confirmar com `echo "$NEXUS_PASSWORD_HASH"` num step de debug ou via `printenv | grep NEXUS`.

2. **Newline trailing/leading no env** — YAML pode injectar `\n` no fim do valor. `bcrypt.compare("nexus-test-password", "hash\n")` retornaria `false`. Confirmar com `console.log(JSON.stringify(process.env.NEXUS_PASSWORD_HASH))` no `route.ts` durante debug.

3. **Truncation da hash** — se a `$` for interpretada parcialmente, a hash pode chegar ao server como `$2a` apenas (impossível bcrypt parse → 401, não 500, porque `verifyPassword` apanha exception e retorna `false`).

4. **`webServer` arranca antes do env do step ser plenamente injectado** — improvável mas possível se há race condition.

5. **Next.js dev mode caching** — `npm run dev` pode reutilizar `.next/` cache entre runs. Em CI fresh, sem cache, deveria estar OK.

### Caminho de investigação recomendado

1. Adicionar step de debug temporário no `.github/workflows/e2e-regression.yml` antes do `playwright test`:
   ```yaml
   - name: DEBUG env propagation
     run: |
       echo "TEST_PASSWORD length: ${#TEST_PASSWORD}"
       echo "NEXUS_PASSWORD_HASH length: ${#NEXUS_PASSWORD_HASH}"
       echo "Hash starts with: ${NEXUS_PASSWORD_HASH:0:7}"
       echo "Hash ends with:   ${NEXUS_PASSWORD_HASH: -7}"
       node -e "console.log('JSON:', JSON.stringify(process.env.NEXUS_PASSWORD_HASH));"
   ```
2. Push debug commit, ler os logs, comparar hash length esperada (60 chars para `$2a$10$...`) vs actual.
3. Se length < 60 → confirmação de truncation / dollar expansion. Fix: usar **GitHub Actions Secret** (`secrets.NEXUS_PASSWORD_HASH`) em vez de inline literal, ou escapar mais agressivo (e.g. `NEXUS_PASSWORD_HASH: ${{ '$2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K' }}`).
4. Se length = 60 mas hash starts/ends OK → investigar Hipótese 2 (newline) ou 4 (race).

### Fix mais robusto independentemente da causa

Mover hash para **GitHub Actions Repository Secret** (`secrets.NEXUS_PASSWORD_HASH`) e referenciar no workflow:
```yaml
env:
  NEXUS_PASSWORD_HASH: ${{ secrets.NEXUS_PASSWORD_HASH }}
```

`@devops` pode adicionar o secret via:
```bash
gh secret set NEXUS_PASSWORD_HASH \
  --repo DaSilvaAlves/ecosistema-ia-avancada-pt \
  --body '$2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K'
```

Isto também alinha com boa prática (não comitar hashes em workflow files).

---

## Ficheiros uncommitted relevantes

| Path | Estado | Notas |
|------|--------|-------|
| `imersao-tools/nexus/docs/handoffs/INDEX.md` | M | Modificado por `@devops` na criação do PR + por `@aiox-master` agora — **commitar junto com fix** |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260509-story-1.10-pr-14-aguarda-ci-verde-close-story-OBSOLETO.md` | ?? (untracked) | Handoff anterior arquivado por `@aiox-master` (ficou obsoleto após CI vermelho) |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md` | ?? (untracked) | Este handoff |
| `imersao-tools/comunidade` (submodule) | M | Fora do âmbito da Story 1.10 — deixar |
| `imersao-tools/starter-builder` (submodule) | m | Fora do âmbito — deixar |

---

## Sequência esperada

```
@dev investiga (debug step ou local repro do step)
  ↓
@dev aplica fix:
  - Opção A: escape mais robusto no YAML literal
  - Opção B (recomendada): mover para gh secret + @devops cria secret
  ↓
@dev commit local na feat branch (junto com este handoff + INDEX.md update)
  ↓
@devops *push (push do fix → CI rerun)
  ↓
CI verde
  ↓
@po *close-story 1.10 → Epic 1 fecha 10/10 → Epic 2 desbloqueia
```

---

## Comandos para o terminal seguinte

```bash
# 1. Activar @dev (no Claude Code):
# @dev *develop 1.10
# (Dex lê este handoff + investigates auth 401 + aplica fix)

# 2. Confirmar diagnóstico local (opcional):
cd imersao-tools/nexus/v2
node -e "console.log(require('bcryptjs').compareSync('nexus-test-password', '\$2a\$10\$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K'))"
# → true (confirma hash válida)

# 3. Ver run CI completo:
gh run view 25601188406 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --log-failed | tail -200

# 4. Após fix + push, monitor:
gh pr checks 14 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --watch

# 5. Se CI verde:
# @po *close-story 1.10
```

---

## Referências canónicas

| Documento | Path |
|-----------|------|
| Story file (Status: Ready for Review) | `imersao-tools/nexus/docs/stories/active/1.10.story.md` |
| QA Gate (CONCERNS resolvido) | `imersao-tools/nexus/docs/QA-GATE-STORY-1.10.md` |
| PO Validation (GO conditional 8/10) | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` |
| Workflow CI | `.github/workflows/e2e-regression.yml` |
| Auth route handler (server) | `imersao-tools/nexus/v2/app/api/auth/login/route.ts` |
| Auth helper (test client) | `imersao-tools/nexus/v2/tests/e2e/regression/helpers/auth.ts` |
| Password verify lib | `imersao-tools/nexus/v2/lib/auth/password.ts` |
| Playwright config (webServer) | `imersao-tools/nexus/v2/playwright.config.ts` |
| Handoff anterior (obsoleto) | `archive/RETOMA-20260509-story-1.10-pr-14-aguarda-ci-verde-close-story-OBSOLETO.md` |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@aiox-master` (Orion)
DATA: 09/05/2026
