# RETOMA — BUG PRODUÇÃO Nexus v2 — Executor sem system prompt (PT-BR + respostas genéricas)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 18/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** **HOTFIX PRODUÇÃO** — sem story (SOP `docs/sops/hotfix-producao.md`)
**Severidade:** HIGH — produção LIVE com violação de brandbook + UX quebrada
**Localização canónica:** `imersao-tools/nexus/`
**Branch sugerida:** `fix/nexus-v2-executor-system-prompt-pt-pt` (de `main` limpo `b193dcbd`)
**De:** Gage (`@devops`) na função de orquestrador-diagnóstico (SOP Passo 1)
**Para:** Dex (`@dev`) — implementação (SOP Passo 2)

---

## 1. Sintoma observado (exacto)

Eurico capturou screenshot 18/05/2026 23:12 em produção `imersao.ia.expressia.pt` com a seguinte sequência de mensagens ao chatbot Nexus:

```
> pensei que sabias como criar
> podes colocar
> podes avançar
> avança
> avança
> AVANÇA
> avança
```

**Resposta do bot (única, no fim):**

```
Parece que sua mensagem foi curta! 😊 Pode me dar mais contexto? O que você
gostaria que eu **avançasse** ou explicasse? Por exemplo: - Continuar um
texto ou código? - Avançar em um tema específico? - Outra coisa? É só me
dizer! 🚀
```

### Bugs identificados (3 sintomas, 1 root cause + 1 arquitectural separado)

| # | Sintoma | Gravidade |
|---|---------|-----------|
| **B1** | **PT-BR em produção** — "sua mensagem", "você gostaria", "Por exemplo" violam `language-standards.md` + brandbook IA AVANÇADA PT | HIGH |
| **B2** | **Resposta genérica fora do tom** — "É só me dizer!", emojis decorativos, listas de "Por exemplo" violam brandbook (tom directo, sem floreado, sem emojis decorativos) | HIGH |
| **B3** | **Ignora histórico de conversa** — User escreveu 7 mensagens em sequência, o bot só responde no fim e como se fosse 1 mensagem isolada `"avança"` | ARQUITECTURAL — fora-scope deste hotfix |

**Este hotfix corrige B1 + B2. B3 é meta-feature arquitectural** (`runAgent` aceita apenas `userPrompt: string`, sistema desenhado single-turn) — precisa de spec/story Epic 3+, NÃO entra aqui.

---

## 2. Root cause identificado (ficheiro:linhas)

### 2.1 Root cause primário (B1 + B2)

**Ficheiro:** `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts`
**Linhas:** 348-353
**Função:** `AnthropicExecutor.execute()`

```ts
// linhas 348-353 — AnthropicExecutor.execute()
const stream = this.client.messages.stream({
  model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
  max_tokens: opts.maxTokens ?? DEFAULT_EXECUTOR_MAX_TOKENS,
  messages: anthropicMessages as Anthropic.MessageParam[],
  tools: anthropicTools.length > 0 ? anthropicTools : undefined,
});
```

**O que falta:** NENHUM `system:` prompt é passado ao executor Sonnet. Comparar com o classifier (`anthropic.ts:218-223`) que tem `system: systemPrompt` correctamente passado:

```ts
// linhas 218-223 — AnthropicClassifier (correcto, com system)
const response = await this.client.messages.create({
  model: opts.model ?? DEFAULT_CLASSIFIER_MODEL,
  max_tokens: opts.maxTokens ?? DEFAULT_CLASSIFIER_MAX_TOKENS,
  temperature: opts.temperature ?? 0,
  system: systemPrompt,   // ← CLASSIFIER TEM
  messages: [{ role: 'user', content: userPrompt }],
});
```

**Sem system prompt, o Sonnet:**
1. Defaulta para PT-BR (treino tem mais PT-BR que PT-PT) → B1
2. Não conhece a identidade Nexus / tom brandbook → B2
3. Quando recebe `"avança"` isolado com 0 tools (classifier devolveu `intents: []` — caso AC8 conhecido), responde com fallback genérico em PT-BR

### 2.2 Comentário stale evidencia o problema (Story 1.5 AC2)

`tests/mocks/handlers/anthropic.ts:721-724`:

```ts
// Story 1.5: novas magic strings `MOCK_EXECUTOR_*` detectadas no
// userMsgText (executor não constrói system prompt — Story 1.5 AC2
// passa apenas `[{ role: 'user', content }]` ao SDK).
```

Esta foi uma decisão consciente da Story 1.5 — mas em produção causa o bug. **Comentário fica desactualizado pelo fix** (system prompt passa a existir).

### 2.3 Mock-protocol-fidelity (regra `mock-protocol-fidelity.md`)

**Verificado:** MSW handler discrimina executor por `body.stream === true` (`tests/mocks/handlers/anthropic.ts:716`), **NÃO pelo `system`**. Schema do handler já aceita `system?: string` no body (linha 35).

**Conclusão:** Adicionar system prompt ao executor **NÃO quebra** o handler. Tests existentes continuam a passar. Só o comentário stale do AC2 fica desactualizado (correcção doc-only).

---

## 3. Patch sugerido completo

### 3.1 Ficheiro NOVO: `imersao-tools/nexus/v2/lib/agent/prompts/executor-system.ts`

```ts
/**
 * Nexus v2 — Executor system prompt PT-PT (Hotfix 18/05/2026)
 *
 * Origem: Hotfix produção bug PT-BR + respostas genéricas. Root cause:
 * `AnthropicExecutor.execute()` em `anthropic.ts:348-353` não passava system
 * prompt ao Sonnet, que defaultava para PT-BR + fallbacks genéricos.
 *
 * Trace canónico:
 * - `.claude/rules/language-standards.md` (PT-PT obrigatório)
 * - `.claude/rules/design-system-ia-avancada.md` (tom directo, sem emojis decorativos)
 * - `.claude/rules/brandbook.md` (voz/tom IA AVANÇADA PT)
 *
 * Constraint do hotfix: NÃO resolve histórico multi-turn (B3 do bug report —
 * arquitectural, exige `runAgent` signature change + spec/story Epic 3+).
 * Resolve apenas B1 (PT-BR) + B2 (tom genérico).
 */
export const EXECUTOR_SYSTEM_PROMPT = `És o Nexus, assistente pessoal do Eurico em português europeu (PT-PT).

LINGUAGEM — INEGOCIÁVEL:
- Responde SEMPRE em PT-PT puro. Nunca PT-BR.
- Usa "tu", "utilizar", "ficheiro", "eliminar", "equipa".
- NUNCA uses "você", "usuário", "arquivo", "deletar", "time".

QUANDO O CLASSIFIER DEVOLVE INTENTS VAZIOS:
- A mensagem é ambígua ou sem domínio claro. Não inventes uma tarefa/despesa/evento.
- Responde curto e directo: pede um exemplo concreto do que o utilizador quer fazer.
- Não dês listas de "tudo o que posso fazer". Não uses emojis decorativos.

TOM: directo, prático, sem floreado. Frase curta domina. Sem emojis em saudação ou despedida.` as const;
```

### 3.2 Modificação: `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts`

**Adicionar import no topo (junto a outros `@/lib/agent/...` imports):**

```ts
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';
```

**Linhas 348-353 — adicionar 1 linha `system:`:**

```ts
const stream = this.client.messages.stream({
  model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
  max_tokens: opts.maxTokens ?? DEFAULT_EXECUTOR_MAX_TOKENS,
  system: EXECUTOR_SYSTEM_PROMPT,   // ← NOVA LINHA (hotfix B1+B2)
  messages: anthropicMessages as Anthropic.MessageParam[],
  tools: anthropicTools.length > 0 ? anthropicTools : undefined,
});
```

### 3.3 Doc-only: actualizar comentário stale

`tests/mocks/handlers/anthropic.ts:721-724` — substituir comentário stale:

```ts
// Story 1.5 + hotfix 18/05/2026: executor agora passa EXECUTOR_SYSTEM_PROMPT
// (PT-PT). Magic strings `MOCK_EXECUTOR_*` continuam detectadas no userMsgText
// (não no system) por backward-compat dos testes Story 1.5. Discriminator
// canónico executor vs classifier permanece `body.stream === true`.
```

---

## 4. Testes a adicionar

**Ficheiro novo:** `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.executor.system.test.ts`

Mínimo 3 testes (SOP Passo 2.3):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicExecutor } from '@/lib/agent/providers/anthropic';
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';

describe('AnthropicExecutor — system prompt (hotfix PT-BR)', () => {
  // T1: system prop é passada ao SDK stream call
  it('passa system: EXECUTOR_SYSTEM_PROMPT à chamada client.messages.stream', async () => {
    // Setup: mock cliente Anthropic, capturar params de stream()
    // Act: chamar executor.execute([{role:'user', content:'avança'}], [], {runId:'x'})
    // Assert: streamSpy chamado com objecto que inclui system: EXECUTOR_SYSTEM_PROMPT
  });

  // T2: conteúdo do system prompt contém marcadores críticos (regression
  // contra deleção acidental ou refactor que esvazie o string)
  it('EXECUTOR_SYSTEM_PROMPT contém marcadores PT-PT + identidade Nexus + regras intents vazios', () => {
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/Nexus/i);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/PT-PT/);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/Nunca PT-BR/i);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/intents vazios/i);
  });

  // T3: regressão — confirmar que o sistema prompt vai em body em request
  // real (via MSW handler). Garante que mock-protocol-fidelity continua
  // honrada após o fix.
  it('MSW handler recebe body.system com o EXECUTOR_SYSTEM_PROMPT em executor calls (stream=true)', async () => {
    // Setup: MSW intercepta /v1/messages, capture body em handler dedicado
    // Act: runAgent('teste') → trigger executor call (stream=true)
    // Assert: captured body.system === EXECUTOR_SYSTEM_PROMPT
    // (NOT just truthy — exact match prova fidelity do mock ao protocolo real)
  });
});
```

**Coverage alvo:** 100% em `lib/agent/prompts/executor-system.ts` (1 const exportada). Sem queda em `anthropic.ts` (1 linha adicionada num branch já coberto).

---

## 5. Constraints inegociáveis

| # | Constraint | Razão |
|---|------------|-------|
| **C1** | **Branch a partir de `main` limpo (`b193dcbd`)** — NUNCA de `feature/2.5`, `feature/2.6`, etc. | SOP `hotfix-producao.md` — "Branch isolada `fix/{slug}` SEMPRE a partir de `main` limpo" |
| **C2** | **NÃO mexer em `runAgent` signature** | B3 (multi-turn) é arquitectural, exige spec — fora-scope hotfix |
| **C3** | **NÃO mexer em `classifier-system.ts`** | Bug é no executor, não no classifier — classifier funciona correctamente |
| **C4** | **NÃO mexer em prompts de tools** (`lib/agent/tools/registry.ts`, `tools/*.ts`) | Fora-scope. Tools continuam a receber descrições próprias |
| **C5** | **NÃO mexer em MSW handlers de tests existentes** | Discriminator `body.stream === true` continua válido — só doc-comment fica stale (correcção doc-only no 3.3) |
| **C6** | **NÃO tocar em ficheiros de Stories 2.5/2.6/2.7/2.10 em curso** | Hotfix isolado, scope cirúrgico |
| **C7** | **Conventional Commit SEM Story ID** | SOP — `fix(nexus-v2): ...` sem `[Story X.Y]` porque não há story |
| **C8** | **Push é EXCLUSIVO `@devops` Gage** | SOP Passo 3 — `@dev` faz commit, Gage faz push |
| **C9** | **Sem `--no-verify`, sem `--force`** | Constitution AIOX Artigo V Quality First |
| **C10** | **Validação local 5/5 PASS antes de commit** | `npm run lint && npm run typecheck && npx vitest run` em `imersao-tools/nexus/v2/` |

---

## 6. Sequência sugerida para o `@dev` (Dex YOLO)

### Passo 1 — Setup branch isolada
```bash
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git checkout main && git pull origin main
# Confirmar tip: b193dcbd (handoff cross-terminal pushed por Gage 18/05/2026)
git checkout -b fix/nexus-v2-executor-system-prompt-pt-pt
```

### Passo 2 — Implementar patch (em ordem)
1. Criar `imersao-tools/nexus/v2/lib/agent/prompts/executor-system.ts` (secção 3.1)
2. Adicionar import + 1 linha `system:` em `lib/agent/providers/anthropic.ts:348-353` (secção 3.2)
3. Actualizar comentário stale em `tests/mocks/handlers/anthropic.ts:721-724` (secção 3.3)
4. Criar `tests/unit/agent/providers/anthropic.executor.system.test.ts` (secção 4) com 3 testes T1+T2+T3

### Passo 3 — Validar local (5/5 PASS obrigatório)
```bash
cd imersao-tools/nexus/v2
npm run lint
npm run typecheck
npx vitest run
npx vitest run --coverage  # confirmar 100% executor-system.ts
npm run build
```

Se qualquer falhar → parar, investigar, fix, repetir. NÃO comitar com vermelho.

### Passo 4 — Commit (sem push)
```bash
git add lib/agent/prompts/executor-system.ts \
        lib/agent/providers/anthropic.ts \
        tests/mocks/handlers/anthropic.ts \
        tests/unit/agent/providers/anthropic.executor.system.test.ts
git commit -m "fix(nexus-v2): adicionar system prompt PT-PT ao executor Sonnet

Hotfix produção — chatbot em https://imersao.ia.expressia.pt respondia em
PT-BR com tom genérico violando brandbook + language-standards. Root cause:
AnthropicExecutor.execute() em anthropic.ts:348-353 não passava system
prompt ao Sonnet, que defaultava para PT-BR e fallbacks genéricos quando
classifier devolvia intents vazios (caso AC8).

Fix: criar EXECUTOR_SYSTEM_PROMPT em novo ficheiro paralelo ao
classifier-system.ts. Passar como prop system: na chamada
client.messages.stream(). Comportamento do classifier inalterado.

Changes:
- lib/agent/prompts/executor-system.ts (NOVO, ~30 linhas — system prompt
  PT-PT + identidade Nexus + regras intents vazios + tom brandbook)
- lib/agent/providers/anthropic.ts:348-353 (+1 linha system:
  EXECUTOR_SYSTEM_PROMPT, +1 linha import no topo)
- tests/mocks/handlers/anthropic.ts:721-724 (comentário stale Story 1.5
  AC2 actualizado — executor agora TEM system prompt; discriminator MSW
  permanece body.stream === true)
- tests/unit/agent/providers/anthropic.executor.system.test.ts (NOVO,
  3 testes: T1 stream call recebe system prop, T2 conteúdo do prompt
  contém marcadores, T3 mock-protocol-fidelity MSW recebe body.system)

Constraint: Hotfix mínimo — não toca em runAgent signature, classifier,
prompts de tools, ou MSW handler logic
Rejected: resolver B3 multi-turn (histórico) | arquitectural, exige spec
Rejected: refactor classifier para usar mesmo EXECUTOR_SYSTEM_PROMPT base
  | classifier tem comportamento diferente (output JSON estrito, few-shot)
Confidence: high
Scope-risk: narrow
Directive: B3 (sistema desenhado single-turn em runAgent(userPrompt:
  string)) fica como meta-feature backlog Epic 3+ — NÃO arrastar para
  este hotfix

Signed-off-by: DaSilvaAlves <euricojsalves@gmail.com>"
```

### Passo 5 — Criar handoff de saída e indexar
Após commit local OK, criar:
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`
  - Inclui: commit SHA local, output dos 5 quality gates, sugestão PR title/body, to_agent: devops
- Adicionar entrada em "Pending" do `imersao-tools/nexus/docs/handoffs/INDEX.md`
- Marcar este handoff (de entrada) como consumido — mover para `archive/`

### Passo 6 — PARAR
`@dev` NÃO faz push. Reporta ao Eurico que está pronto. Eurico invoca `@devops` (Gage) para SOP Passo 3.

---

## 7. Validação pós-deploy (Eurico, SOP Passo 4.5)

Após Gage push + PR + CodeRabbit + merge, **testar manualmente em produção** `imersao.ia.expressia.pt`:

| Teste | Esperado |
|-------|----------|
| Escrever `"avança"` sem contexto | Resposta em PT-PT curta a pedir exemplo concreto. SEM "você", SEM "usuário", SEM emojis decorativos |
| Escrever `"cria tarefa: comprar pão amanhã"` | Funcionalidade canónica preserva (regression check) — tarefa criada via tool, resposta confirmação em PT-PT |
| Escrever `"o céu é azul"` (caso AC8 empty intents) | Resposta PT-PT pedindo o que o utilizador quer realmente fazer, NÃO listas genéricas |

Se qualquer teste falhar → handoff novo de regressão, voltar a `@dev`.

---

## 8. Estado real verificado em main (antes do hotfix)

```
b193dcbd docs(nexus-v2): handoff cross-terminal — Epic 2 7/10 Done, retoma 2.6/2.7/2.10 (Gage push)
142f4819 docs(nexus-v2): close Story 2.9 — MERGED em main via PR #25 squash d2acca51 (Epic 2 7/10 Done)
d2acca51 feat(nexus-v2): Story 2.9 — vista detalhada de projecto com tabs Lista/Kanban (Epic 2 UI) (#25)
7c01fa55 docs(nexus-v2): EPIC-2 §10 — regista D7 (fallback intent vazio em PT-BR)
eff7955d fix(nexus-v2): classifier — strip markdown fences mesmo com prosa a seguir (#24)
```

Epic 2 7/10 Done. Submódulos `comunidade`+`starter-builder` modified + 150+ untracked fora-scope INTACTOS — não tocar.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`. CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 9. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Push exclusivo | Só `@devops` Gage. `@dev` Dex NUNCA pode fazer `git push` |
| PR vs merge directo | Hotfix produção SEMPRE via PR contra main + CodeRabbit + aprovação manual Eurico (SOP §3.5 + §4) — diferente do closure docs-only que é direct-to-main |
| `gh pr *` | Requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Working tree estado actual | `docs/HANDOFF-INDEX.md` clean (sincronizado com `b193dcbd`). Submódulos `comunidade`+`starter-builder` modified — não tocar. Untracked dentro de `imersao-tools/nexus/docs/handoffs/` (RETOMAs antigos) — dívida técnica separada, não arrastar |
| Repo path correcto terminal novo | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Mock-protocol-fidelity | MSW handler já aceita `body.system` no schema (linha 35). Discriminator é `body.stream === true` (linha 716). Adicionar system ao executor NÃO quebra mocks existentes — só comentário stale fica desactualizado |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`) na função de orquestrador-diagnóstico (SOP Hotfix Passo 1)
DATA: 18/05/2026
