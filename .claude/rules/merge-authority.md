# Merge Authority — O agente faz o merge, NÃO o Eurico

## Origem

Frustração recorrente do Eurico (10/06/2026): durante todo o Nexus v2, os handoffs consolidaram uma "convenção" de que **o Eurico faz o merge manual** de cada PR (`gh pr merge --admin`). Isto nunca foi uma limitação técnica — foi um hábito que se propagou de handoff em handoff. O resultado: a cada PR pronto, um agente pedia ao Eurico para correr o comando de merge à mão. O Eurico reagiu:

> "outra vez a merge manual para mim, isso foi no século passado, regista isso de uma vez por todas, o que temos que fazer para isto não voltar a acontecer"

Esta regra elimina essa convenção. O `@devops` (Gage) já tem **autoridade exclusiva** de `gh pr merge` por design (`agent-authority.md`). Passa a **exercê-la** — o merge é trabalho do agente, não do humano.

## Princípio (Inegociável)

**Quando um PR está verde e limpo, o agente faz o merge. O Eurico NÃO é chamado para correr `gh pr merge` à mão.** Pedir merge manual ao Eurico é, a partir de agora, um anti-padrão proibido — excepto nas condições de escalação explícitas abaixo.

## Quem faz o merge

| Agente | Pode fazer merge? |
|--------|-------------------|
| `@devops` (Gage) | SIM — autoridade exclusiva, exerce-a sem pedir ao Eurico |
| `@aiox-master` (Orion) | SIM — override de governance quando orquestra o fecho de uma story |
| Qualquer outro agente | NÃO — delega ao `@devops` |
| Eurico (humano) | Só quando o agente escala por uma das condições abaixo |

## Condições de AUTO-MERGE (o agente faz, sem perguntar)

Todas têm de ser verdadeiras, verificadas no **head SHA actual** do PR:

| # | Condição | Como verificar |
|---|----------|----------------|
| 1 | CI 100% verde | `statusCheckRollup` — 0 `FAILURE`, todos `SUCCESS`/`SKIPPED` |
| 2 | CodeRabbit Status = SUCCESS | check `CodeRabbit` no head SHA |
| 3 | Zero comentários CR actionable no head SHA | `gh api .../pulls/{n}/comments` filtrado pelo head SHA = 0 (nitpicks já aplicados) |
| 4 | Quality gate AIOX = PASS | QA Gate (`@qa`) ou Architect Gate (`@architect`) registado na story |
| 5 | `mergeable` = MERGEABLE | `gh pr view --json mergeable` |
| 6 | Hard-stop §8 respeitado | ≤ 2 iterações CR (Iter 3+ exige autorização — ver escalação) |

**`reviewDecision: CHANGES_REQUESTED` NÃO bloqueia** se as condições 1-6 estão verdes. É frequentemente **stale**: um review CR antigo que nunca foi feito dismiss, com o fix já aplicado num commit posterior (padrão das Stories 1.10 e 5.4). O sinal de verdade é o **head SHA** (CR Status SUCCESS + 0 comentários), não o `reviewDecision` agregado do GitHub. Nesse caso usa-se `--admin` para ultrapassar o branch protection preso no review stale.

Comando padrão:

```
gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch
```

Depois do merge: `git checkout main && git pull --ff-only origin main`, e a story segue para `@po *close-story {id}`.

## Condições de ESCALAÇÃO (aí sim, chama o Eurico)

O agente **não** faz merge e escala ao Eurico apenas quando:

| Situação | Porquê escala |
|----------|---------------|
| CI com qualquer check `FAILURE` | Há trabalho por corrigir — volta ao `@dev`, não merge |
| CR com Major/actionable **real** no head SHA actual | Finding por resolver — `@dev *apply-qa-fixes`, não merge |
| Hard-stop §8 excedido (Iter 3+ de CR) | Exige autorização humana explícita via trailer `Authorized-by:` |
| Merge exigiria **waiver** de um finding não resolvido | Decisão de aceitar dívida é do Eurico |
| `mergeable` = CONFLICTING | Rebase/resolução necessária primeiro |

Mesmo ao escalar, o agente apresenta o estado e a recomendação — nunca despeja o comando de merge no colo do Eurico como tarefa de rotina.

## Anti-Padrões Proibidos

| Anti-padrão | Correcção |
|-------------|-----------|
| "Faz tu o merge manual" para um PR verde | O agente faz o merge — condições 1-6 verdes = auto-merge |
| Tratar `reviewDecision: CHANGES_REQUESTED` como bloqueador sem verificar o head SHA | Verificar CR Status + comentários no head SHA; se limpo, é stale, usar `--admin` |
| Propagar "convenção merge manual Eurico" em handoffs novos | Essa convenção está REVOGADA por esta regra |

## Aplicação Universal

Aplica-se a todos os PRs do ecossistema (Nexus v2 e restantes projectos), a todos os agentes: `@devops`, `@aiox-master`, `@dev`, `@qa`, `@architect`, `@po`, e qualquer skill/squad. Complementa `agent-authority.md` (autoridade exclusiva de merge do `@devops`) e respeita o hard-stop §8 dos epics.

---

*Origem: directiva directa do Eurico, 10/06/2026, ao fechar a Story 5.4 (PR #62). Criada por Orion (`@aiox-master`).*
