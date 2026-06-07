# Internal State Contract Gate — Regra Obrigatória

## Origem

Incidente Nexus v2 Story 4.9 (SW push handler, CodeRabbit no PR #58, 04/06/2026). A validação `@po` deu GO e o **Architect Gate Iter 2 deu PASS Confidence High** — os testes de fidelidade de protocolo provavam "o contrato real" e a auth tinha sido corrigida no Iter 1 (D-ACTION-AUTH-COOKIE). Mesmo assim, o CodeRabbit no PR levantou **4 Major de semântica de produção** que ambos os gates internos deixaram passar:

- **M1** (`action/route.ts`) — `snooze` com entrada KV ausente devolvia `{ok:true, applied:false}` (**silent loss**: o utilizador pensa que adiou, mas nada acontece).
- **M2** (`schedule/route.ts` GET) — devolvia TODAS as entradas `pending`, não só as adiadas por snooze.
- **M3** (`reconcile-snooze.ts`) — consequência de M2: re-rotulava lembretes `pending` normais (futuros, nunca accionados) como `snoozed` em Dexie.
- **M4** (`sw.js`) — `postAction` não verificava `response.ok`; um 401/500 passava como sucesso (com cookie-auth, sessão expirada → falha silenciosa).

**Causa raiz:** os gates internos validaram o que sabem validar bem — **auth**, **estrutura** (Node runtime, schemas Zod, File List), **contrato externo** (eventos SW, nomes de acção ASCII via `external-contract-identifiers.md`) e **fidelidade de mock** (`event.data.json()` reflecte o protocolo via `mock-protocol-fidelity.md`). Mas **não validaram a semântica fina do contrato de estado interno** `pending`/`snooze` distribuído por SW + endpoint + reconciliação client. `mock-protocol-fidelity.md` cobre o protocolo *externo*; nenhuma regra cobria a coerência do *contrato de estado interno* que atravessa várias camadas. Resolução: D-SNOOZE-CONTRACT (Architect Gate Iter 3) + RF1-RF7 + re-gate Iter 4 PASS. Custou 2 iterações de gate evitáveis.

## Princípio

**Quando uma feature distribui um contrato de estado interno por ≥2 camadas, a coerência semântica desse contrato — em especial os caminhos de ciclo de vida — não é apanhada pela validação de auth/estrutura nem pela fidelidade de mock externo. O quality gate tem de exigir uma análise de ciclo de vida do estado, não só do caminho feliz.** Os testes que provam o caminho feliz e o protocolo externo dão PASS com confiança alta e deixam passar silent loss, re-rotulagem e falhas de rede tratadas como sucesso.

## Âmbito — Quando esta regra se aplica

Aplica-se a qualquer story cujo estado **vive em mais do que uma camada** e tem de se manter coerente entre elas:

| Padrão de estado multi-camada | Exemplos |
|-------------------------------|----------|
| Service Worker + endpoint + reconciliação client | Web Push snooze (Story 4.9), sync offline |
| Callback OAuth + store de sessão + refresh token | Epic 6 (integrações/OAuth) — **alvo principal desta regra** |
| Cache client + fonte servidor + invalidação | Estado optimista com reconciliação |
| Fila/scheduler externo + persistência + consumidor | Disparo server-side (Story 4.8) + dispatch |
| Máquina de estados espalhada por handlers | Qualquer `status`/flag lido e escrito por ≥2 ficheiros |

**Não se aplica** a estado contido numa só camada (ex: um helper puro, um componente com estado local sem persistência partilhada) — aí basta o gate normal.

## Obrigação no Quality Gate — Análise de Ciclo de Vida

Uma story dentro do âmbito acima só passa o quality gate (`@architect` ou `@qa`, conforme `separation-of-roles.md`) se o gate executar e registar uma **análise de ciclo de vida do contrato de estado**, cobrindo os três eixos:

| Eixo | Pergunta obrigatória | Major que apanha (exemplo 4.9) |
|------|----------------------|-------------------------------|
| **(a) Classes de estado** | Quais são as classes/sub-estados distintos (ex: `pending` normal vs `pending` adiado)? O que **cada camada** faz a cada classe? | M2/M3 — GET devolvia todas as `pending`; reconciliação re-rotulava as normais |
| **(b) Transição-já-ocorrida** | O que acontece quando a entrada já foi removida/disparada/expirada **entre camadas**? Uma acção sobre estado ausente é tratada explicitamente? | M1 — snooze de entrada ausente devolvia sucesso (silent loss) em vez de 409 |
| **(c) Caminhos de falha** | Respostas de erro entre camadas (rede, auth expirada, HTTP não-ok) são tratadas como falha? O cliente distingue sucesso de `!response.ok`? | M4 — SW não verificava `response.ok`; 401/500 passava como sucesso |

A análise (os três eixos respondidos contra o código real, não em abstracto) fica registada na secção **QA Results / Architect Gate** da story. Se algum eixo expõe um caminho não tratado → **FAIL/CHANGES REQUESTED** com a correcção exigida, antes do PR — para o CodeRabbit não o descobrir como Major no PR (o que custou Iter 3+4 na 4.9).

## Anti-Padrões Proibidos

| Anti-padrão | Porquê é proibido |
|-------------|-------------------|
| Dar PASS porque os testes de caminho feliz e de fidelidade de protocolo passam | É exactamente o que o Architect Gate Iter 2 da 4.9 fez — silent loss, re-rotulagem e falha-como-sucesso passaram à mesma |
| Validar só auth + estrutura + contrato externo num estado multi-camada | São os pontos fortes dos gates; o ponto cego é a semântica de ciclo de vida do estado interno |
| Assumir que uma acção sobre estado ausente "não faz mal" | Silent loss (M1) — o utilizador acredita que a acção surtiu efeito; tratar entrada ausente explicitamente (ex: 409) |
| Tratar qualquer resposta como sucesso no cliente sem verificar `response.ok` | Falha silenciosa em sessão expirada (M4); o cliente tem de distinguir sucesso de erro HTTP |
| Reutilizar cegamente um filtro/query "todas as pending" para uma sub-classe | Re-rotulagem (M2/M3); a query tem de filtrar pela classe estreita correcta |

## Relação com Outras Regras

| Regra | Relação |
|-------|---------|
| `mock-protocol-fidelity.md` | **Complementar.** Aquela cobre o protocolo *externo* (mock reflecte o wire format real). Esta cobre o contrato de estado *interno* distribuído por camadas. As duas juntas fecham o caminho feliz + o protocolo + a semântica de estado |
| `external-contract-identifiers.md` | Complementar — aquela valida os *identificadores* que cruzam contratos; esta valida a *semântica de estado* por trás deles |
| `separation-of-roles.md` | O gate que faz esta análise é o gate da story (executor ≠ gate); a análise sobe de nível se o executor for o gate natural |
| Constitution Artigo V (Quality First) | Esta regra é o mecanismo que fecha o ponto cego de semântica de estado dos gates internos |

## Aplicação Universal

Aplica-se a todos os agentes que entregam ou revêem features com estado multi-camada: `@dev`, `@architect`, `@qa`, `@data-engineer`, e qualquer skill ou squad externo. Sem excepções. **Relevante em especial para o Epic 6 (OAuth/integrações)** — onde o estado se distribui por callback + sessão + refresh, exactamente o padrão que gerou os 4 Major da 4.9.

---

*Origem: Retrospectiva Epic 4 Nexus v2, acção A1. Proposta por Pax (`@po`); criada por Orion (`@aiox-master`) em 07/06/2026.*
