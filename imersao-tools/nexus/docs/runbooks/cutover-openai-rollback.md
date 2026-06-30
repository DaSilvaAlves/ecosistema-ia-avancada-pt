# Runbook — Cutover de Produção OpenAI + Rollback para Anthropic

**Projecto:** Nexus v2
**Produção:** `https://imersao.ia.expressia.pt`
**Região Vercel:** `fra1` (Frankfurt)
**Conta Vercel:** DaSilvaAlves (Eurico)
**Story:** 8.6 (Epic 8 — migração de provider de inferência, ADR-10 §8 row S6)
**Autoridade de deploy:** `@devops` (Gage) — autoridade exclusiva de redeploy Vercel
**Autoridade de cutover (decisão de negócio):** Eurico — autoriza cada passo irreversível
**Última actualização:** 30/06/2026

---

## 1. Contexto

Este runbook existe para repor o cérebro do Nexus v2 em produção e para garantir uma reversão rápida e documentada caso a migração de provider corra mal.

A produção está **sem cérebro desde 25/06/2026**: o saldo da conta Anthropic esgotou e o provider de inferência (`anthropic`) passou a devolver erros 400 (ADR-10 §1.1). O Epic 8 introduziu um segundo provider (`openai`) através de uma arquitectura dual-provider com flags de ambiente, sem alterar o comportamento do caminho Anthropic (retrocompatibilidade por construção, ADR-10 §6.1).

O cutover descrito neste runbook é uma operação **puramente de configuração**: flip de duas variáveis de ambiente na Vercel + um redeploy. Não há código de produção a alterar — o código que lê estas flags já está em `main` (Stories 8.1 a 8.5, todas `Done`). O default das flags é `anthropic`, pelo que a ausência de configuração equivale ao comportamento anterior (zero regressão por construção).

> **Critério de sucesso (ADR-10 §1.2.3):** a migração não tem pressão de manter a produção viva — o critério é **correcção, não uptime**. A produção pode ficar sem cérebro durante a transição. Isto remove a urgência que tipicamente força atalhos. Em caso de dúvida, fazer rollback e diagnosticar com calma é a opção correcta.

---

## 2. Pré-condições

Verificar **todas** antes de iniciar o cutover. Se qualquer uma falhar, NÃO avançar.

| # | Pré-condição | Como verificar |
|---|--------------|----------------|
| 1 | Story 8.5 `Done` em `main` — parity cross-provider verde nos 6 cenários canónicos | PR #99 squash `e082edf4` em `main`; secção QA Results da Story 8.5 |
| 2 | Baseline de testes verde (sem regressão pré-deploy) | `npm run test:unit` a partir de `imersao-tools/nexus/v2/` — usar a **baseline efectiva pós-8.5** registada na story (o número exacto não é contrato; o que conta é 0 FAIL real, ressalvado o flake conhecido `oauth-status` que isola verde) |
| 3 | `OPENAI_API_KEY` real provisionada na Vercel como **server-only** (production) | `vercel env ls --environment production` lista `OPENAI_API_KEY` sem prefixo `NEXT_PUBLIC_` |
| 4 | `NEXT_PUBLIC_OPENAI_API_KEY` **NÃO existe** (violação de NFR5 se existir) | `vercel env ls --environment production` não lista nenhuma variável `NEXT_PUBLIC_OPENAI_API_KEY` |
| 5 | Eurico autoriza explicitamente o cutover | Confirmação directa (decisão de negócio, ADR-10 §1.2.3) |

> Sem a `OPENAI_API_KEY` real (pré-condição 3), o smoke test do cutover é impossível — é o gate de entrada bloqueante (Story 8.6 AC1).

---

## 3. Procedimento de cutover (`anthropic` → `openai`)

Executado por `@devops`, após autorização explícita do Eurico. As três variáveis em causa têm os nomes exactos abaixo (verificados em `main`).

| Variável | Tipo | Default | Valor no cutover |
|----------|------|---------|------------------|
| `LLM_PROVIDER` | server-only | `anthropic` | `openai` |
| `NEXT_PUBLIC_LLM_PROVIDER` | público (browser) | `anthropic` | `openai` |
| `OPENAI_API_KEY` | server-only (NFR5) | ausente | `sk-...` (valor real, nunca exposto) |

### 3.1 Provisionar a `OPENAI_API_KEY` (se ainda não estiver feita)

```bash
vercel env add OPENAI_API_KEY production
```

O comando é **interactivo**: pede o valor da key em prompt, que **não fica no histórico do terminal**. Colar o valor real (`sk-...`) quando solicitado.

> **NFR5 (crítico):** a key é **server-only**. NUNCA criar `NEXT_PUBLIC_OPENAI_API_KEY` — esse prefixo expõe o valor no bundle client. NUNCA escrever o valor real num ficheiro, commit, ou chat. NUNCA correr `vercel env pull` sem filtro (despeja todos os valores num ficheiro local).

### 3.2 Actualizar as duas flags de provider para `openai`

As duas flags **TÊM de ser actualizadas em conjunto e concordar entre si** (ambas `openai`). Um mismatch faz `assertProviderFlagsAgree()` (`lib/shared/env.ts:193`, chamada por `resolveActiveProvider()` em `factory.ts:73-74`) lançar um erro PT-PT no arranque — *"Mismatch de flags de provider: LLM_PROVIDER='...' mas NEXT_PUBLIC_LLM_PROVIDER='...'. As duas TÊM de concordar"* (ADR-10 §3.4 / §7 R4).

Via Vercel CLI (remover o valor antigo e adicionar o novo):

```bash
vercel env rm LLM_PROVIDER production
vercel env add LLM_PROVIDER production
# valor a introduzir: openai

vercel env rm NEXT_PUBLIC_LLM_PROVIDER production
vercel env add NEXT_PUBLIC_LLM_PROVIDER production
# valor a introduzir: openai
```

Alternativa: Vercel UI > Settings > Environment Variables > editar cada variável para `openai` no environment `Production`.

### 3.3 Desencadear o redeploy

```bash
vercel --prod
```

Alternativa: Vercel UI > Deployments > seleccionar o deployment mais recente > Redeploy.

### 3.4 Confirmar arranque sem erros

- Aguardar o status `Ready` no Vercel Dashboard.
- Verificar os logs de arranque:

```bash
vercel logs
```

Não deve aparecer nenhuma das mensagens fail-loud de arranque:
- *"Mismatch de flags de provider..."* (as flags discordam — ver 3.2)
- *"Key do provider activo ausente..."* (`OPENAI_API_KEY` em falta — ver 3.1)

Se alguma aparecer, corrigir a configuração correspondente e repetir o redeploy antes de avançar para o smoke test.

---

## 4. Procedimento de rollback (`openai` → `anthropic`)

É o **inverso exacto** do cutover: repor as duas flags em `anthropic` e fazer redeploy. Reversível por construção — o caminho Anthropic (`/api/anthropic/proxy`) ficou intocado pelo Epic 8 (ADR-10 §6.1). Tempo estimado: **5-10 min** (dois comandos + redeploy Vercel).

### 4.1 Repor as flags em `anthropic`

```bash
vercel env rm LLM_PROVIDER production
vercel env add LLM_PROVIDER production
# valor a introduzir: anthropic

vercel env rm NEXT_PUBLIC_LLM_PROVIDER production
vercel env add NEXT_PUBLIC_LLM_PROVIDER production
# valor a introduzir: anthropic
```

> Manter ambas concordantes (`anthropic`), pela mesma razão de 3.2. A `OPENAI_API_KEY` pode permanecer provisionada — não tem efeito enquanto `LLM_PROVIDER=anthropic` (só é lida quando o provider activo é `openai`).

### 4.2 Redeploy

```bash
vercel --prod
```

Alternativa: Vercel UI > Deployments > Redeploy.

### 4.3 AVISO CRÍTICO — o rollback pode NÃO recuperar o cérebro

O rollback para `anthropic` repõe o **provider** anterior, mas **não repõe o saldo da conta Anthropic**. Como a produção está sem cérebro desde 25/06/2026 precisamente por saldo Anthropic esgotado, reverter para `anthropic` devolve a produção ao estado **sem cérebro** (erros 400 do Anthropic), a menos que o saldo tenha entretanto sido reposto.

Implicação prática: o rollback é a opção segura para **parar uma regressão causada pelo OpenAI** (ex: erros 500 no proxy, custos anómalos), mas não é uma forma de "ter o cérebro a funcionar via Anthropic" enquanto o saldo estiver esgotado. Se o objectivo for manter o cérebro vivo, a correcção é diagnosticar o problema do OpenAI, não reverter para Anthropic.

---

## 5. Critérios de activação do rollback

Accionar o rollback (secção 4) imediatamente se **qualquer** das condições abaixo se verificar após o cutover:

| Critério | Sinal observável |
|----------|------------------|
| Smoke test falha | Resposta incoerente, mensagem de erro na UI, ou ausência de resposta do cérebro a um prompt com tool calling |
| Erros 500 recorrentes no proxy | `vercel logs` mostra `POST /api/openai/proxy` com status 500 de forma repetida |
| Custos anómalos | Consumo OpenAI muito acima do esperado para o volume de pedidos (dashboard OpenAI) |
| Latência inaceitável | Respostas do cérebro sistematicamente lentas ao ponto de degradar a experiência |
| Regressão de UI | Login/logout quebrado, tool calling não executa, dados existentes inacessíveis, ou qualquer alteração visual inesperada |

Qualquer regressão de UI (Story 8.6 AC5, invariante de não-regressão ADR-10 §6.1) é STOP imediato → rollback.

---

## 6. Confirmação pós-acção (verificar o provider activo)

Aplicável tanto após o cutover como após o rollback.

### 6.1 Confirmar as variáveis de ambiente (sem revelar valores)

```bash
vercel env ls --environment production
```

Confirmar:
- `LLM_PROVIDER` e `NEXT_PUBLIC_LLM_PROVIDER` presentes (o comando lista nomes e environment, não revela valores — o valor confirma-se pelo comportamento dos logs e do smoke test).
- `OPENAI_API_KEY` presente e server-only (sem prefixo `NEXT_PUBLIC_`).
- `NEXT_PUBLIC_OPENAI_API_KEY` **ausente** (NFR5 — a sua existência seria uma violação a corrigir imediatamente).

### 6.2 Confirmar o proxy nos logs (após cutover)

```bash
vercel logs | grep 'openai/proxy'
```

Após o cutover bem-sucedido, `POST /api/openai/proxy` deve aparecer com status **200**. Após rollback, o tráfego volta a `/api/anthropic/proxy`.

### 6.3 Smoke test funcional

Eurico acede a `https://imersao.ia.expressia.pt`, faz login, e envia **pelo menos um prompt que invoque ≥1 tool** (ex: *"que tarefas tenho hoje?"* ou *"adiciona uma nota: comprar leite"*).

Critério de PASS: resposta coerente visível no chat (tool executada + resposta formatada), sem erros 400/500 na UI. Registar a evidência (screenshot da resposta + excerpt de `vercel logs` com 200 no proxy) na secção QA Results da Story 8.6 — o Evidence Gate exige-a (contexto de env vars de produção, `not-tested-trailer-rules.md`).

---

## 7. Contacto de escalação

| Papel | Contacto |
|-------|----------|
| Dono do produto / autoriza cutover e rollback | Eurico — `euricojsalves@gmail.com` |
| Executor de deploy/redeploy | `@devops` (Gage) — autoridade exclusiva Vercel |

Escalar ao Eurico em qualquer uma destas situações: smoke test falha após o cutover, causa do erro não identificada, decisão de aceitar dívida/waiver, ou dúvida sobre se o rollback é a acção correcta dado o estado do saldo Anthropic (secção 4.3).
