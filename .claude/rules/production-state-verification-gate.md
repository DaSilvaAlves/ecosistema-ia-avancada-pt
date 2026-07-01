# Production State Verification Gate — Regra Obrigatória

## Origem

Incidente Nexus v2 Story 8.6 (cutover de produção OpenAI, correct-course 01/07/2026). A 8.6 herdou a premissa central do Epic 8 — "produção sem cérebro desde 25/06 por saldo Anthropic esgotado; cutover para OpenAI repõe o cérebro" (ADR-10 §1.1). Toda a story foi desenhada, validada (`@po` GO 9/10) e implementada (runbook, gate `@qa` PASS, PR #100 merged) sobre essa premissa. Só **no gate final de cutover** é que uma verificação `vercel env ls` revelou dois factos que contradiziam a premissa:

- Produção **não tinha** `OPENAI_API_KEY` nem as flags `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER` — só `ANTHROPIC_API_KEY`. O cutover nunca fora executado.
- O cérebro **respondia em produção via Anthropic** (smoke test PASS) — logo o saldo Anthropic estava operacional e a premissa "produção sem cérebro" já não se verificava.
- O deployment activo era o commit `4e2b1c4` (observabilidade "J-6") — trabalho paralelo noutra sessão, fora dos handoffs do epic.

Resultado: correct-course tardio, re-scope da story e reconciliação do epic no fecho. Uma verificação do estado **real** de produção no **arranque** da 8.6 (não no gate final) teria detectado tudo isto de imediato e poupado o re-trabalho.

## Princípio

**Uma story que toca ou depende do estado de produção não herda a premissa do epic/handoff sobre esse estado — verifica o estado REAL de produção no arranque, contra a plataforma, antes de desenhar ou executar.** A premissa escrita num ADR/epic/handoff é um facto point-in-time que pode ter mudado entre a criação do epic e a execução da story (recarga de saldo, deploy paralelo, flip manual, rollback de terceiros). O estado live da plataforma é a fonte da verdade — a premissa é hipótese até ser confirmada.

## Âmbito — Quando esta regra se aplica

Aplica-se a qualquer story cujo comportamento ou critério de aceitação dependa do estado de um ambiente vivo (produção ou staging):

| Padrão de story | Exemplos |
|-----------------|----------|
| Cutover / migração de provider ou serviço em produção | Story 8.6 (flip de provider LLM) |
| Alteração de env vars / secrets / feature flags em produção | Provisão de key, toggle de flag |
| Deploy / redeploy com efeito observável em produção | Redeploy que muda comportamento LIVE |
| Story que assume um estado de produção herdado do epic/ADR | "produção está em X", "o cérebro está desligado", "a feature está off" |
| Hotfix de produção sem story (SOP hotfix) | Diagnóstico que assume o estado do bug |

**Não se aplica** a stories puramente de código/testes sem dependência de estado live (a maioria) — aí basta o gate normal.

## Obrigação no arranque da story (draft/validação)

Uma story dentro do âmbito acima só passa a `Approved`/arranca implementação se, na fase de draft (`@sm`) ou validação (`@po`), o estado real de produção for **verificado contra a plataforma** e reconciliado com a premissa:

| # | Verificação obrigatória | Como (exemplo Vercel) |
|---|-------------------------|------------------------|
| 1 | Estado real das env vars / flags relevantes | `vercel env ls --environment production` (nomes, sem valores) |
| 2 | Estado funcional observável | `vercel logs` / smoke test / health endpoint |
| 3 | Qual o deployment/commit activo em produção | Vercel Dashboard ou `vercel ls` — confirmar o SHA activo |
| 4 | A premissa do epic/ADR ainda se verifica? | Cruzar 1-3 com o que o epic/handoff afirma |

Se a verificação **confirma** a premissa → prosseguir e registar a evidência na story. Se a verificação **contradiz** a premissa → **STOP**: accionar correct-course (re-scope ou re-priorização) ANTES de investir na implementação, não depois. O achado fica registado na story com a evidência (output do comando).

## Anti-Padrões Proibidos

| Anti-padrão | Porquê é proibido |
|-------------|-------------------|
| Desenhar/implementar uma story de produção assumindo a premissa do epic sem a verificar contra a plataforma | É o erro da 8.6 — a premissa evaporou e só se detectou no gate final |
| Verificar o estado de produção só no gate final / no momento da execução | Tarde de mais — o re-trabalho de re-scope já é inevitável nessa altura |
| Confiar que "produção está em X" porque um handoff/ADR o diz | Handoffs e ADRs são point-in-time; sessões paralelas podem ter mudado o estado (ver deployment `4e2b1c4`/J-6) |
| Tratar a ausência de erro como confirmação do estado | Confirmar positivamente (o comando devolve o estado esperado), não inferir da ausência de sinais |

## Relação com Outras Regras

| Regra | Relação |
|-------|---------|
| `internal-state-contract-gate.md` | **Complementar.** Aquela cobre a coerência do estado *interno em código* distribuído por camadas. Esta cobre o estado *live da plataforma de produção* vs a premissa da story |
| `handoff-central.md` | Complementar — o consumo de handoff exige verificar as afirmações-chave contra o estado real (amenda A2 da retro Epic 8); esta regra é o caso específico do estado de produção |
| `not-tested-trailer-rules.md` | Complementar — aquela exige evidência real para commits que tocam config de produção; esta exige verificação real do estado antes de arrancar a story |
| Constitution Artigo IV (No Invention) | Esta regra impede que uma premissa não verificada seja tratada como facto — o estado real prevalece |

## Aplicação Universal

Aplica-se a todos os agentes que criam, validam, implementam ou fecham stories com dependência de estado de produção: `@sm`, `@po`, `@dev`, `@qa`, `@devops`, `@architect`, `@aiox-master`, e qualquer skill ou squad externo. Sem excepções. **Relevante em especial para o Epic 9 (Hardening + Deploy + PWA)** — onde várias stories tocarão configuração de deploy e estado de produção.

---

*Origem: Retrospectiva Epic 8 Nexus v2, acção A1 (incidente Story 8.6). Proposta por Pax (`@po`); criada por Orion (`@aiox-master`) em 01/07/2026.*
