# RETOMA — Bug produção: Classifier rejeita JSON envolvido em markdown fences

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Data criação** | 2026-05-09 |
| **Criado por** | Claude Code (orquestração geral, sessão Story 1.10 Iter 3) |
| **Para agente** | `@dev` (Dex) — fix mínimo no provider Anthropic |
| **Projecto** | Nexus v2 (`imersao-tools/nexus/`) |
| **Branch sugerida** | `fix/nexus-v2-classifier-strip-markdown-fences` (criar a partir de `main`) |
| **Story relacionada** | Nenhuma — bug de produção, NÃO faz parte da Story 1.10 |
| **Severidade** | Alta — bloqueia qualquer prompt que dispare execução do classifier em produção |
| **URL produção afectado** | https://imersao.ia.expressia.pt |

---

## Sintoma observado pelo utilizador (Eurico)

Em produção, ao escrever prompts simples como `oi`, `ola`, `olá`, o chat mostra:

```
Nexus
⚠ executor — interrompida
Classifier: resposta da API não é JSON válido — recebido: ```json {"intents":[],"confidence":{}} ```
```

Print fornecido pelo utilizador na sessão (chat com 6 prompts consecutivos, todos falhados com a mesma mensagem). O prompt input continua a permitir nova mensagem mas qualquer envio reproduz o bug.

---

## Root cause identificado

**Ficheiro:** `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts`
**Linhas:** 127-135 (método `AnthropicClassifier.classify`)

```typescript
const rawResponse = textBlock.text;

// Parse JSON do prompt da Story 1.4 — { intents: string[], confidence: Record<string, number> }
let parsed: { intents?: unknown; confidence?: unknown };
try {
  parsed = JSON.parse(rawResponse) as { intents?: unknown; confidence?: unknown };
} catch {
  throw new Error(
    `Classifier: resposta da API não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
  );
}
```

A Haiku 4.5 retornou:

````
```json
{"intents":[],"confidence":{}}
```
````

…envolvido em **markdown code fences**. `JSON.parse()` rejeita imediatamente porque ` ``` ` não é JSON válido.

### Porque acontece

1. O system prompt (`lib/agent/prompts/classifier-system.ts:103`) JÁ diz literalmente: `"Output: APENAS JSON válido, sem markdown, sem prosa."` — mas a Haiku ignora ocasionalmente.
2. É **pattern conhecido** com Claude (e outros LLMs) — mesmo com instrução explícita, em ~5-15% dos prompts o modelo envolve em markdown fences porque foi treinado fortemente para gerar code blocks como output.
3. O prompt vazio (`oi`, `ola`) tem alta probabilidade de cair em `intents:[]` E de ser embrulhado em fences (output curto = mais formato cosmético).

### Porque os testes não apanharam

| Camada de teste | Porque falhou |
|----------------|--------------|
| Vitest unit (`tests/unit/agent/providers/anthropic.test.ts`) | Mocks usam JSON puro — nunca testou o caso markdown-fenced |
| MSW handler (`tests/mocks/handlers/anthropic.ts`) | Devolve apenas o "happy path" JSON puro |
| E2E regression Story 1.10 | Mock SSE devolve JSON puro também (não passa pelo classifier real, intercepta no streaming) |

Não existe nenhum teste que verifique tolerância a fences. Isto é uma **lacuna de robustez do parser**, não bug de prompt.

---

## Fix proposto (mínimo, defensivo, scope cirúrgico)

**Abordagem:** strip markdown fences ANTES de `JSON.parse`. Padrão amplamente usado em integrações LLM. Mantém o erro original como fallback se mesmo após strip o conteúdo não for JSON válido.

### Patch sugerido em `lib/agent/providers/anthropic.ts`

Adicionar helper logo antes da classe `AnthropicClassifier`:

```typescript
/**
 * Remove markdown code fences que a Haiku ocasionalmente envolve à volta do
 * JSON apesar do system prompt pedir "APENAS JSON válido, sem markdown".
 *
 * Padrão observado em produção (2026-05-09):
 *   "```json\n{...}\n```"  ou  "```\n{...}\n```"
 *
 * Trim conservador — só remove fences se o pattern bater no início E no fim.
 * Caso contrário devolve a string intacta para o parse falhar com mensagem
 * útil (preserva debuggability).
 */
function stripJsonMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  // Match abertura ```json ou ``` (case-insensitive na language tag)
  const fenceOpenMatch = trimmed.match(/^```(?:json)?\s*\n?/i);
  const fenceCloseMatch = trimmed.match(/\n?\s*```$/);
  if (fenceOpenMatch && fenceCloseMatch) {
    return trimmed.slice(fenceOpenMatch[0].length, trimmed.length - fenceCloseMatch[0].length).trim();
  }
  return trimmed;
}
```

Modificar o bloco try/catch (linhas 128-135):

```typescript
const rawResponse = textBlock.text;
const cleanedResponse = stripJsonMarkdownFences(rawResponse);

let parsed: { intents?: unknown; confidence?: unknown };
try {
  parsed = JSON.parse(cleanedResponse) as { intents?: unknown; confidence?: unknown };
} catch {
  throw new Error(
    `Classifier: resposta da API não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
  );
}
```

**NOTA importante:** o `rawResponse` original (com fences) é preservado em:
- `candidate.rawResponse` (linha 141) — para debug e PII redaction downstream
- `Error.message` no catch — para que o erro continue a mostrar exactamente o que veio da API

Só o **input para `JSON.parse`** é normalizado.

---

## Testes a adicionar

**Ficheiro:** `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.test.ts`

3 casos novos no `describe('AnthropicClassifier')`:

1. **Markdown fences com `json` language tag** — input `"```json\n{...}\n```"` → deve parsear OK
2. **Markdown fences sem language tag** — input `"```\n{...}\n```"` → deve parsear OK
3. **JSON puro (regressão)** — input `"{...}"` → continua a funcionar igual (não regredir)

Opcional (recomendado): adicionar caso 4 — fences com whitespace extra → `"  ```json  \n  {...}  \n  ```  "` → parseia OK.

---

## Acção imediata para o utilizador (workaround manual)

Enquanto o fix não está deployed em produção, **NÃO há workaround do lado do utilizador**. Cada prompt vai disparar o erro até ~85-95% das vezes (depende da resposta da Haiku). O fix é a única solução.

---

## Sequência sugerida para o próximo terminal

1. **Criar branch a partir de `main`:** `git checkout -b fix/nexus-v2-classifier-strip-markdown-fences main`
   - **NÃO** fazer este fix dentro de `feat/nexus-v2-story-1.10-e2e-regression` — mistura scope com a Story 1.10 que está em CI vermelho/escalation
2. **Aplicar o patch** em `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` conforme acima
3. **Adicionar testes** em `tests/unit/agent/providers/anthropic.test.ts` (3 casos)
4. **Validar local:** `cd imersao-tools/nexus && npm run lint && npm run typecheck && npx vitest run tests/unit/agent/providers/anthropic.test.ts`
5. **Commit:** `fix(nexus-v2): strip markdown fences from Haiku JSON before parse`
6. **Handoff para `@devops`** com push + abertura de PR (NÃO chamar `@po` — não há story associada; é hotfix)

---

## Constraints absolutos

- **NÃO** modificar `lib/agent/classifier.ts` (wrapper) — o fix é no provider porque é onde o `JSON.parse` está
- **NÃO** modificar o system prompt (`prompts/classifier-system.ts`) — não resolve o problema de raiz (LLMs vão continuar a ocasionalmente ignorar) e introduz acoplamento com prompt engineering
- **NÃO** misturar este fix com a Story 1.10 em curso — branch separada
- **NÃO** alterar `ClassificationResultSchema` — `rawResponse` deve continuar a ser o **conteúdo original** (com fences) para preservar debuggability
- **NÃO** silenciar o erro original — manter o `Error.message` com `rawResponse.slice(0, 200)` para o caso de mesmo após strip ainda não parsear (ex: Haiku devolveu prosa em vez de JSON)

---

## Observações adicionais

- O bug afecta **todos os prompts** porque o classifier corre antes do executor em qualquer flow (`/api/agent/prompt`)
- Story 1.10 (E2E regression) também vai beneficiar — uma vez que o fix esteja em produção, podemos adicionar um teste real (não-mockado) que prova robustez
- Considerar abrir issue tech-debt **TD-7**: investigar Anthropic JSON mode / `response_format` se disponível para Haiku (eliminação preventiva do problema)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-bug-classifier-json-markdown-fences.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Referências canónicas

| Doc | Path | Para que serve |
|-----|------|---------------|
| Provider Anthropic (com bug) | `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts:127-135` | Sítio exacto do `JSON.parse` que falha |
| Wrapper classifier | `imersao-tools/nexus/v2/lib/agent/classifier.ts` | Não tocar — só consume o output |
| System prompt (já correcto) | `imersao-tools/nexus/v2/lib/agent/prompts/classifier-system.ts:103` | Já diz "APENAS JSON sem markdown" — não é a causa |
| Schema canónica | `imersao-tools/nexus/v2/lib/agent/schemas.ts` | `ClassificationResultSchema` — NÃO alterar |
| Testes existentes | `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.test.ts` | Adicionar 3 casos novos aqui |
| MSW handler | `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts` | Pode ser estendido para devolver fenced JSON num teste de integração |
| ADR Edge/Node split | `imersao-tools/nexus/docs/architecture-v2.md` (memória `project_nexus_v2_architecture.md`) | Confirma que classifier corre em Edge |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus` (Nexus v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-bug-classifier-json-markdown-fences.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Claude Code (orquestrador, criou handoff a pedido do Eurico)
DATA: 09/05/2026
