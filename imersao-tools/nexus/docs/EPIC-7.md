# Epic 7 — Voice + OCR

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 23/06/2026
> **Estado:** **Em curso — 4/10 stories Done.** Sub-âmbito Voice **COMPLETO 4/4**: 7.1 (VoiceMode UI, FR77) FECHADA 23/06/2026 (PR #91, squash `45164bb2`, CR 1 iter, waiver 0%); 7.2 (Web Speech recognition PT-PT → texto, FR78) FECHADA 24/06/2026 (PR #92, squash `0161ae87`, CR 2 iter — 3 Major VOICE-002/003/004 resolvidos, waiver 0%); 7.3 (texto transcrito → cérebro multi-intent, FR79) FECHADA 24/06/2026 (PR #93, squash `deecfd25`, CR 0 findings em código, waiver 0%; AC6 verificação manual E2E em produção deferida ao Eurico, padrão AC13/4.9); 7.4 (Web Speech synthesis PT-PT lê resposta, FR80) FECHADA 25/06/2026 (PR #94, squash `37177bb9`, CR Iter 0 2 Major resolvidos `c93e50b5` → re-review SUCCESS 0 threads actionable, waiver 0%; AC8 verificação manual E2E em produção — ouvir voz real — deferida ao Eurico, padrão AC6/7.3 e AC13/4.9). **Sub-âmbito Voice fechado** (a 7.3 selou a ENTRADA voz→texto→cérebro; a 7.4 trata a SAÍDA cérebro→voz). Próximo: sub-âmbito OCR (7.5-7.10), por iniciar. Sucessor natural do Epic 6 (FECHADO 16/17, waiver rate 0%) na ordem PRD §9 (`6 → 7`). É o **último epic funcional** do roadmap antes do hardening (Epic 8). O Epic 7 fecha duas peças que ficaram em aberto no Epic 6 por dependerem de capacidades que só este epic introduz: a **6.15 (foto recibo → OCR → finança, FR73)**, diferida no fecho do Epic 6 porque o OCR (FR81) não existia ainda, é re-enquadrada aqui como **7.9** (a sua continuação natural, já prevista no PRD §10 Epic 7); e a **transcrição real de voz Telegram (REC-6.14-TRANSCRIPTION-FUTURE)**, que a 6.14 deixou como stub de diferimento (`VOICE_DEFERRED_MESSAGE_PT`), entra no scope deste epic ligada ao mecanismo de transcrição server-side. Acções A4 e A6 da retrospectiva Epic 6 cumpridas neste documento.
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.14 (Voice mode, FR77-FR80), §6.15 (OCR de recibos, FR81-FR85), §9 (roadmap — linha "Epic 7 — Voice + OCR", coluna "Bloqueia" vazia), §10 Epic 7 (Stories sugeridas 7.1-7.10 + AC1-AC3 + Quality gates "Epic 1 + manual testing 10 recibos reais (zero invenção)"). Constitution Artigo IV (No Invention): cada story, FR e AC abaixo traça ao PRD. As 10 stories sugeridas são a decomposição directa do PRD §10 Epic 7.
> **Arquitectura:** `architecture-v2.md` — **ADR-1 (split Edge/Node por endpoint)** relevante: `/api/ocr/receipt` em **Node** (§4.1 — recebe base64 até 4,5MB, chama Anthropic Vision, FormData parsing robusto, base64 ops grandes); o Voice mode (Web Speech API) corre **client-side no browser** (§3 `useVoice.ts`, §6 stack "Voice = Web Speech API browser nativo"); §9.4 CSP `connect-src` já inclui `api.anthropic.com` e o microfone está permitido (câmara/geolocation negados); §1148-1150 (Web Speech Chrome/Edge OK, Firefox best-effort; OCR via `/api/ocr/receipt` Node body limit 4,5MB; foto via Telegram → webhook detecta `message.photo` → baixa via Telegram API → encaminha para `/api/ocr/receipt`). Os 5 ADRs base NÃO são reabertos; o ADR-9 (tool client-side → route Node via `ctx.fetch`), tornado canónico no Epic 6, aplica-se a `processar_recibo` (7.10).
> **Lições aplicadas:** Retrospectivas Epic 1 a Epic 6. Regras em vigor aplicadas preventivamente: `mock-protocol-fidelity.md` (mock Anthropic Vision reflecte o protocolo real), `react-component-test-criteria.md` (o componente VoiceMode tem múltiplos estados de render → teste de componente), `external-contract-identifiers.md` (nome de tool `processar_recibo` validado ASCII no draft), `internal-state-contract-gate.md` (a 7.9 distribui estado por webhook Telegram → OCR → finança → preview/confirm — análise de ciclo de vida obrigatória), `separation-of-roles.md` (executor ≠ quality gate em todas as stories), `cr-base-main-no-gate-saida` (CR `--base main` no gate de saída das stories server-side: `/api/ocr/receipt`, 7.9 Telegram), `not-tested-trailer-rules.md`. Acção A1 da retrospectiva Epic 6: o gate de saída corre CR `--base main`, mas o CR no PR continua parte não-opcional do ciclo de fecho.

---

## 1. Goal

Dar ao Nexus duas modalidades de entrada/saída sem teclado: **modo voz no browser** (Web Speech API — falar com o cérebro multi-intent e ouvir a resposta) e **OCR de recibos via Claude Vision** (fotografar um recibo — por drag-and-drop no chat ou via bot Telegram — extrair os dados estruturados e criar uma finança variável). Trace: PRD §9 (linha "Epic 7 — Voice + OCR: Web Speech (browser) + Claude Vision (recibo→finança) + integração Telegram") + §10 Epic 7 (FR77-FR85). Custo zero adicional: Web Speech é browser nativo e Claude Vision está incluído na API key Anthropic (FR82).

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | O modo voz e o OCR são instrumentos de **fricção zero na captura** — alinhados à visão "sistema de continuidade pessoal" (`project_nexus_vision.md`): capturar um pensamento por voz a conduzir, ou um recibo logo após a compra, sem abrir formulários. Reduz o custo de registar o que alimenta o resto do sistema (tarefas, finanças). |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, em `main`) é onde a tool de OCR (FR85 `processar_recibo`, 7.10) se regista e para onde o texto transcrito por voz (FR79, 7.3) é encaminhado. O modo voz **não cria fluxo novo** de processamento — transcreve para texto e injecta no pipeline existente do Epic 1, exactamente como a 6.13 fez para o texto do Telegram. |
| Reuso do canal Telegram (Epic 6) | A 7.9 (foto recibo via Telegram → OCR → finança) **assenta directamente** no canal Telegram do Epic 6: o webhook Edge (6.12) já parseia `message.photo`; o padrão de bridge Node fire-and-forget cookieless (6.13/6.14 `process-text`/`process-voice`) é o molde directo para o bridge de foto. A 6.15 ficou diferida precisamente à espera do pipeline OCR deste epic — agora é a 7.9. |
| Reuso do domínio Finanças (Epic 3) | O OCR não cria um modelo de dados novo: o resultado extraído cria uma **finança variável** (FR84) reutilizando o domínio de finanças do Epic 3 (em `main`). A 7.8 (preview + criar finança on confirm) reutiliza o padrão preview-then-confirm da Story 1.6. |
| Transcrição de voz: dois canais distintos | **Importante (decisão @architect no draft, ver §7 GAP-7.1):** há dois caminhos de voz com mecanismos diferentes. (a) **Voz no browser** (FR77-FR80, stories 7.1-7.4) usa **Web Speech API client-side** — corre na app, no browser. (b) **Voz via Telegram** (FR72, REC-6.14) chega pelo webhook **server-side cookieless** — Web Speech é browser-only e está EXCLUÍDA aí (decisão do Architect Gate da 6.14); precisa de transcrição server-side. São problemas distintos: o Web Speech resolve (a), não resolve (b). |
| Último epic funcional | PRD §9: ordem `... → 6 → 7 → 8`. O Epic 7 **não bloqueia nenhum** (coluna "Bloqueia" vazia no PRD §9). Depois dele só resta o Epic 8 (Hardening + Deploy + PWA). Com o Epic 7 fechado, os 15 módulos do produto (PRD §G2) estão completos. |

## 3. Dependências

| Relação | Epic / Story | Estado |
|---------|--------------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) — voz transcrita entra no cérebro (7.3); `processar_recibo` regista-se no Tool Registry (7.10) | DONE — em main |
| Depende de | Epic 3 (Finanças completas — finança variável) — o resultado do OCR cria uma finança variável (FR84, 7.8) | DONE — em main |
| Depende de | Epic 6 (canal Telegram + webhook Edge que parseia `message.photo`; padrão de bridge Node cookieless fire-and-forget das 6.13/6.14) — a 7.9 assenta neste canal | DONE — em main (Epic 6 FECHADO 16/17) |
| Depende de | Epic 0 Story 0.5 (proxy Anthropic server-side + API key Node-only) — base para `/api/ocr/receipt` chamar Claude Vision server-side | DONE — em main |
| Absorve (do Epic 6) | **Story 6.15 (foto→OCR, FR73)** — diferida no fecho do Epic 6 por depender de OCR; re-enquadrada como **7.9** (acção A4 da retrospectiva Epic 6) | Diferida → entra como 7.9 |
| Absorve (do Epic 6) | **REC-6.14-TRANSCRIPTION-FUTURE** — transcrição real de voz Telegram (a 6.14 deixou stub `VOICE_DEFERRED_MESSAGE_PT`); entra no scope deste epic ligada ao mecanismo de transcrição server-side (acção A4 + §6.3 da retrospectiva Epic 6) | Stub no Epic 6 → scope deste epic |
| Reutiliza (padrão) | Epic 1 preview-then-confirm (Story 1.6) — `processar_recibo` cria finança → preview obrigatório antes de confirmar (FR84) | DONE — em main |
| Reutiliza (padrão ADR-9) | Epic 6 (tool client-side → route Node via `ctx.fetch`) — `processar_recibo` (7.10) segue o padrão canónico das tools com efeito externo | DONE — em main |
| Bloqueia / Precede | Nenhum (PRD §9 coluna "Bloqueia" do Epic 7 = vazia). Epic 8 (Hardening) é independente | Epic 8 não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`. Epic 7 **não bloqueia** nenhum epic.

## 4. Functional Requirements cobertos

Trace directo a `PRD-NEXUS-V2.md` §6.14 (Voice mode) e §6.15 (OCR de recibos). 9 FRs no total (FR77-FR85). Inclui o **FR73** do Epic 6 (foto recibo via Telegram → OCR), cuja implementação foi diferida para cá (a 6.15 fica completa via 7.9).

### Voice mode (§6.14)

| FR | Descrição (PRD §6.14) | Stories |
|----|------------------------|---------|
| FR77 | Botão "ligar voz" no chat principal | 7.1 |
| FR78 | Web Speech API recognition (browser nativo Chrome/Edge) transcreve voz para texto | 7.2 |
| FR79 | Texto transcrito vai directo para o cérebro multi-intent | 7.3 |
| FR80 | Resposta do cérebro pode ser falada via Web Speech API synthesis | 7.4 |

### OCR de recibos (§6.15)

| FR | Descrição (PRD §6.15) | Stories |
|----|------------------------|---------|
| FR81 | Endpoint `/api/ocr/receipt` recebe foto, devolve dados estruturados (data, total, IVA, mercador, items se possível) | 7.5 |
| FR82 | Implementação via **Claude Vision** (incluído na API key Anthropic) — sem custos extra | 7.5 |
| FR83 | UI: arrastar foto para o chat OU enviar via Telegram bot (FR73) | 7.7, 7.9 |
| FR84 | Resultado mostra preview e cria finança variável quando confirmado | 7.8 |
| FR85 | Tool cérebro: `processar_recibo` (recebe URL/base64 da foto) | 7.10 |

### FR do Epic 6 completado neste epic

| FR | Descrição (PRD §6.13) | Stories |
|----|------------------------|---------|
| FR73 | Fotos identificadas como recibo passam para OCR (FR81) e criam finança | 7.9 (completa a 6.15 diferida do Epic 6) |

> **Nota sobre FR72 (voz Telegram):** o FR72 (voz Telegram transcrita e processada pelo cérebro) foi **entregue como stub de diferimento na Story 6.14** do Epic 6 (ramo `voice` activado, ACK <5s, `VOICE_DEFERRED_MESSAGE_PT`). A **transcrição real** ficou registada como REC-6.14-TRANSCRIPTION-FUTURE. O PRD §6.14 (Voice mode) trata só do Web Speech **client-side no browser**; **não há FR de transcrição de voz server-side para o canal Telegram no PRD**. Por isso a transcrição real da voz Telegram entra neste epic como **sub-âmbito da decisão de arquitectura do mecanismo de transcrição** (§7 GAP-7.1), não como um FR novo inventado. O `@architect` decide no draft se o mecanismo server-side viabiliza a transcrição Telegram e se justifica uma story própria; caso contrário, mantém-se o stub honesto da 6.14. Constitution Artigo IV: não se inventa FR.

## 5. Stories (10) — trace PRD §10 Epic 7

> **Decomposição directa das "Stories sugeridas" do PRD §10 Epic 7 (7.1 a 7.10)** — nenhuma story inventada nem omitida face ao PRD. A 6.15 do Epic 6 (foto→OCR via Telegram) **corresponde exactamente à 7.9 do PRD** (já listada como "Integração com Telegram (FR73): foto recibo via Telegram → OCR → finança auto") — por isso **não se cria um número novo nem se mantém o "6.15"**: a feature é re-enquadrada na numeração canónica do Epic 7 a que o PRD já a atribuiu (7.9). Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (`separation-of-roles.md`). `@sm` (River) finaliza a atribuição em cada story draft; `@po` (Pax) valida. Território de risco (parser AI de Vision, endpoint que recebe upload externo, criação de finança a partir de input não-estruturado, integração com webhook público) tem gate `@architect`.

| # | Story | Descrição (1 linha — PRD §10 Epic 7) | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|--------------------------------------|-----|-------------------|------------------------|--------|
| 7.1 | Componente VoiceMode | Botão microfone no chat principal + indicador visual + stream. **Múltiplos estados de render (inactivo/a-ouvir/a-processar/erro/não-suportado) → teste de componente (`react-component-test-criteria.md`)** | FR77 | `@ux-design-expert` | `@dev` | **Done** (PR #91, `45164bb2`) |
| 7.2 | Web Speech recognition (PT-PT) → texto | Web Speech API recognition em PT-PT transcreve voz para texto, client-side (Chrome/Edge; Firefox best-effort, arch §1148/AR7) | FR78 | `@dev` | `@qa` | **Done** (PR #92, `0161ae87`) |
| 7.3 | Texto transcrito → cérebro | O texto transcrito vai directo para o cérebro multi-intent do Epic 1. Reutiliza o pipeline existente, não cria fluxo novo (precedente 6.13) | FR79 | `@dev` | `@qa` | **Done** (PR #93, `deecfd25`) |
| 7.4 | Web Speech synthesis (PT-PT) lê resposta | Web Speech API synthesis em PT-PT fala a resposta do cérebro. Toggle de voz on/off | FR80 | `@dev` | `@qa` | **Done** (PR #94, `37177bb9`) |
| 7.5 | Endpoint `/api/ocr/receipt` (Claude Vision) | Route **Node** (ADR-1, base64 até 4,5MB) que recebe foto e chama Claude Vision com prompt PT-PT; devolve dados estruturados. **Mock Anthropic Vision reflecte o protocolo real (`mock-protocol-fidelity.md`); CR `--base main` no gate de saída (endpoint server-side com input externo). GAP — ver §7 GAP-7.2** | FR81, FR82 | `@dev` | `@architect` | Não iniciado |
| 7.6 | Prompt OCR (extracção PT-PT) | Prompt OCR que extrai data, total, IVA, mercador, items (best-effort), explicitando campos PT-PT (NIF, IVA — arch AR6). Output Zod-validado falsificável. **GAP — ver §7 GAP-7.3** | FR81 | `@dev` | `@architect` | Não iniciado |
| 7.7 | UI drag-and-drop foto no chat | Arrastar foto para o chat → envia para `/api/ocr/receipt`. Validação de tamanho ANTES do upload (arch §1149, 4,5MB). Estados de render (a-carregar/a-processar/erro/resultado) → teste de componente | FR83 | `@ux-design-expert` | `@dev` | Não iniciado |
| 7.8 | Resultado OCR → preview + criar finança | Resultado mostra preview e cria **finança variável** (domínio Epic 3) quando confirmado. Padrão preview-then-confirm da 1.6 | FR84 | `@dev` | `@architect` | Não iniciado |
| 7.9 | Integração Telegram (foto recibo → OCR → finança auto) | **= 6.15 do Epic 6, re-enquadrada.** Foto recibo via Telegram → webhook detecta `message.photo` (já parseado pela 6.12) → baixa via Telegram API → encaminha para `/api/ocr/receipt` → cria finança auto. Bridge Node fire-and-forget cookieless (molde 6.13/6.14). **Estado distribuído (webhook→OCR→finança→confirm) → `internal-state-contract-gate.md` aplica-se (ver §8). CR `--base main` no gate de saída. GAP — ver §7 GAP-7.4** | FR73, FR83 | `@dev` | `@architect` | Não iniciado (absorve 6.15) |
| 7.10 | Tool cérebro `processar_recibo` | Registar `processar_recibo` (recebe URL/base64 da foto) no Tool Registry. Padrão ADR-9 (tool client-side → route Node `/api/ocr/receipt` via `ctx.fetch`). Nome ASCII validado (ver nota §5) | FR85 | `@dev` | `@architect` | Não iniciado |

> **Padrão de gate herdado dos Epics 2/3/4/5/6:** parser AI / endpoint com input externo / criação de dados a partir de input não-estruturado / integração com webhook público (território de risco) → gate `@architect`; UI pura com estados de render → executor `@ux-design-expert`, gate `@dev`; lógica de transcrição/roteamento sem efeito externo → gate `@qa`. `@sm`/`@po` confirmam a atribuição final em cada draft.

> **Nota (`external-contract-identifiers.md`) — validação preventiva do nome da tool:** o único nome de tool novo do Epic 7 é `processar_recibo` (PRD §6.15 FR85 / §10 Epic 7 7.10). **Já está em ASCII** (sem acentos nem cedilha — "processar", "recibo"). Validado contra `TOOL_NAME_PATTERN` (`[a-z0-9_]`) + Anthropic tool spec **no draft deste epic**, não na implementação (precedente Story 3.11 onde nomes com cedilha foram rejeitados; precedente 6.6/6.10/6.17 onde os 7 nomes do Epic 6 foram validados ASCII no draft sem reconciliação). A grafia humana PT-PT vive na camada semântica do LLM (D-FUZZY, precedente 3.11/4.10/5.13/6.x). A story 7.10 não deve precisar de reconciliação de AC por nomes.

## 6. Acceptance Criteria (nível epic) — trace PRD §10 Epic 7

Cópia fiel dos AC Epic 7 do PRD §10 (linhas 596-598).

| # | Critério | Story principal |
|---|----------|-----------------|
| AC1 | Voice "criar tarefa comprar leite" cria tarefa correctamente em Chrome/Edge | 7.1, 7.2, 7.3 |
| AC2 | Foto recibo Continente extrai total + data correctos em >= 80% dos testes | 7.5, 7.6 |
| AC3 | Foto via Telegram → finança criada sem intervenção UI | 7.9 |

> **Quality gate do PRD §10 Epic 7:** "Epic 1 + **manual testing 10 recibos reais (zero invenção)**". A precisão do OCR (AC2 ≥80%) e a integração Telegram (AC3) só são plenamente verificáveis com **recibos reais e conta/bot reais** — verificação manual de produção, não mockável em CI (padrão AC13 da 4.9; ver §8). O AC1 (voz) é verificável manualmente em Chrome/Edge.

## 7. Reconciliação PRD ↔ Arquitectura — GAPs para o draft

> Os pontos abaixo são marcados para resolução por `@architect` no draft das stories respectivas — **não preenchidos com suposição** (Constitution Artigo IV, precedente `[GAP-6.1]`-`[GAP-6.6]` do EPIC-6.md §7). Nenhum dos 5 ADRs base é reaberto. O ADR-1 e a §9.4 (CSP) da arquitectura já anteciparam o runtime do `/api/ocr/receipt` (Node) e a permissão de microfone para o Web Speech.

| Ponto | PRD diz | Arquitectura actual | GAP a resolver no draft |
|-------|---------|---------------------|-------------------------|
| **[GAP-7.1]** Transcrição de voz Telegram (server-side) vs Web Speech (browser) | PRD §6.14 (Voice mode) trata só Web Speech **client-side**; FR72/REC-6.14 (voz Telegram) precisa de transcrição **server-side** (Architect Gate 6.14 excluiu Web Speech browser-only para o canal cookieless) | Arch §6 stack: "Voice = Web Speech API browser nativo"; §3 `useVoice.ts` é client-side; o webhook Telegram (6.12) é Edge server-side cookieless | `@architect` decide no draft: (a) o modo voz no browser (7.1-7.4) é **só Web Speech client-side** — sem custo, sem server; (b) para a voz Telegram (REC-6.14), confirmar se existe mecanismo de transcrição server-side viável (Anthropic transcreve áudio? serviço externo? custo/privacidade?) ou se a voz Telegram **mantém o stub honesto da 6.14** até existir solução. **Não assumir** que a API Anthropic transcreve áudio. Decisão registada; se viável, pode justificar uma story de transcrição Telegram (sub-âmbito de FR72, não FR novo). |
| **[GAP-7.2]** Endpoint OCR — limite de body, FormData, base64 | Story 7.5 "`/api/ocr/receipt` recebe foto"; FR81/FR82 (Claude Vision) | Arch §4.1: `/api/ocr/receipt` em **Node**, body limit **4,5MB**, "FormData parsing robusto", "base64 ops grandes em OCR" (ADR-1) | `@architect` confirma no draft da 7.5: (a) formato de entrada (multipart FormData vs base64 JSON — a tool `processar_recibo` recebe "URL/base64", FR85; o drag-and-drop envia ficheiro); (b) validação de tamanho/MIME ANTES do processamento (arch §1149: UI valida antes do upload — confirmar validação server-side também); (c) shape exacto da chamada Claude Vision (modelo, formato de imagem base64, prompt) reflectido no mock MSW (`mock-protocol-fidelity.md`). |
| **[GAP-7.3]** Prompt OCR e fidelidade da extracção PT-PT | Story 7.6 "extrai data, total, IVA, mercador, items (best-effort)"; FR81 | Arch AR6: "Anthropic Vision pode falhar em recibos PT (com IVA, etc.)" → mitigação "prompt OCR explicita campos PT-PT (NIF, IVA, total, mercador)"; fallback "utilizador edita manualmente" | `@architect`/`@dev` decidem no draft da 7.6: (a) schema Zod do output do OCR (campos obrigatórios vs best-effort: total/data obrigatórios? items opcionais?); (b) tratamento de extracção parcial/falhada (fallback de edição manual — arch AR6); (c) teste anti-tautológico que falharia se o parser aceitasse um output degenerado. AC2 (≥80% em recibos reais) é verificação manual de produção — mapear. |
| **[GAP-7.4]** Foto Telegram → OCR → finança (ciclo de vida + duplicação) | Story 7.9/6.15 "foto recibo via Telegram → OCR → finança auto"; FR73 | Arch §1150: "webhook detecta `message.photo`, baixa via Telegram API, encaminha para `/api/ocr/receipt`"; a 6.12 já parseia `photo`; bridge Node cookieless é o padrão 6.13/6.14 | `@architect` faz no draft da 7.9 a **análise de ciclo de vida** (`internal-state-contract-gate.md`, ver §8): (a) classes de estado — foto recebida → descarregada → OCR ok/falhou → finança criada/não-criada; (b) "sem intervenção UI" (AC3) significa **criar finança auto sem preview**? ou pede confirmação por Telegram? (contrasta com FR84 preview na UI — decisão explícita); (c) duplicação — a mesma foto reenviada cria 2 finanças? idempotência por `msgId`/file_id; (d) caminhos de falha — OCR falha → o bot responde honestamente, não cria finança fantasma (anti silent-loss M1 da 4.9). Bridge cookieless com shared-secret fail-closed (molde C11 da 6.13). |
| **[GAP-7.5]** CSP para captura de imagem/microfone | Story 7.1 (microfone) + 7.7 (foto) | Arch §9.4: CSP `connect-src 'self' https://api.anthropic.com https://api.telegram.org`; "microfone permitido (Web Speech API) — câmara/geolocation negados explicitamente" | `@architect` confirma no draft: (a) o microfone já está permitido (Web Speech, 7.1/7.2) — sem alteração de CSP; (b) o drag-and-drop de foto (7.7) é upload de ficheiro, **não** acesso à câmara (que está negada) — confirmar que não exige alteração de CSP/permissions-policy; (c) se a câmara vier a ser pedida (tirar foto em vez de arrastar), é decisão explícita de alteração de CSP, fora do scope actual do PRD. Precedente `[D-6.14-CSP]` (CSP intocado). |

## 8. Qualidade e processo — lições das Retrospectivas Epic 1 a 6

| Acção / lição | Aplicação no Epic 7 |
|---------------|---------------------|
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplica-se à **Story 7.9** (foto Telegram → OCR → finança): estado distribuído por webhook Edge → bridge Node → `/api/ocr/receipt` → criação de finança. O gate `@architect` da 7.9 faz a análise dos 3 eixos: classes de estado (foto descarregada / OCR ok-falhou / finança criada-não-criada), transição-já-ocorrida (foto duplicada → 2 finanças? idempotência por file_id), caminhos de falha (OCR falha → resposta honesta, sem finança fantasma — anti-M1/M4 da 4.9). É o ponto de maior estado distribuído do epic. |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplica-se ao **endpoint OCR (7.5)**: o mock da resposta Claude Vision (MSW handler `anthropic.ts`, ADR-4) reflecte o protocolo real da Vision API (formato de imagem, shape da resposta), não apenas faz os tests passar. ≥1 teste que falharia se o shape divergisse. |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. O **VoiceMode (7.1)** tem múltiplos estados de render (inactivo/a-ouvir/a-processar/erro/browser-não-suportado) e o **drag-and-drop (7.7)** tem estados (a-carregar/a-processar/erro/resultado) → teste de componente obrigatório, contado no gate ANTES do CodeRabbit. |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada. O nome de tool `processar_recibo` (7.10) validado ASCII no draft do epic (ver nota §5). |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada na tabela §5 — nenhum executor é o seu próprio quality gate. |
| **A1 Epic 5 + A1 Epic 6 — `cr-base-main-no-gate-saida`** | Crítico no endpoint OCR (7.5) e na integração Telegram (7.9): território server-side com input externo (upload de foto, foto pública via webhook) é exactamente onde findings de classe segurança escapam ao `-t uncommitted`. O gate de saída corre CR `--base main`; **mas o CR no PR continua parte não-opcional do ciclo** (lição central §5.1 da retrospectiva Epic 6 — o CR server-side apanha semântica de produção fina que o `--base main` local não apanha). |
| **A2 Epic 4 — varredura de bug-de-classe nas camadas adjacentes** | Quando o CR/gate apanha um Major de classe identificável (ex: validação de tamanho/MIME em falta no upload), `@dev` verifica a mesma classe nas camadas adjacentes (drag-and-drop 7.7 ↔ foto Telegram 7.9 — ambos alimentam `/api/ocr/receipt`) **no mesmo ciclo**. |
| **A3 Epic 4 — mapa de verificabilidade por AC** | Crítico: AC2 (OCR ≥80% em recibos reais) e AC3 (foto Telegram → finança) exigem **recibos/conta reais só-de-produção** não mockáveis em CI. No draft de cada story, mapear por AC onde é verificável (CI mock MSW / preview / produção manual). Quality gate do PRD §10 Epic 7 = "manual testing 10 recibos reais (zero invenção)". |
| **A3 Epic 6 — destino do backlog de débitos Baixa** | A REC-6.14-TRANSCRIPTION-FUTURE é puxada para o scope deste epic (§7 GAP-7.1). Os restantes débitos Baixa herdados (Epics 3/4/5/6) ficam fora deste epic salvo decisão `@pm`/`@po` de uma story técnica de housekeeping (acção A3 da retrospectiva Epic 6 — a decidir no arranque, ver §8 pré-requisitos). |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix`/CR por story; Iter 3 ou merge waived exigem autorização humana explícita do Eurico no commit (trailer `Authorized-by:`). Mantido dos Epics 1-6. |
| Alvo de waiver rate | Epic 6 fechou 0/16 (0%); Epic 5 0/13; Epic 4 0/10; Epic 2 0%. **Alvo Epic 7: 0%.** |

### Pré-requisitos a confirmar antes do arranque (não-bloqueantes da criação do epic, bloqueantes do arranque)

| # | Item | Responsável | Estado |
|---|------|-------------|--------|
| 1 | **Pré-requisitos de produção P1-P5 do Epic 6** (env Google OAuth + Telegram `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`/`TELEGRAM_WEBHOOK_SECRET` + `CRON_SECRET` + `setWebhook` pós-deploy) — a 7.9 (foto via Telegram) **reutiliza o canal Telegram**, logo depende dos mesmos pré-requisitos (acção A2 da retrospectiva Epic 6) | Eurico + `@devops` | Pendente — necessário antes da 7.9 |
| 2 | **Decisão GAP-7.1** (transcrição de voz Telegram server-side viável ou stub honesto mantido) confirmada no Architect Gate de Entrada antes de qualquer story de voz Telegram | `@architect` + Eurico | Em aberto — parte do scope (§7 GAP-7.1) |
| 3 | **Conjunto de ≥10 recibos PT reais** para o manual testing do quality gate (PRD §10 Epic 7) — fotos de recibos reais (Continente, etc.) com IVA/NIF/total para validar AC2 | Eurico | Pendente — necessário para verificação manual da 7.5/7.6 |
| 4 | **Decisão acção A3 Epic 6** (destino do backlog de débitos Baixa acumulado) — confirmar se entra alguma story técnica de housekeeping no Epic 7 ou fica no backlog | `@pm` (Morgan) + `@po` (Pax) | A decidir no arranque |

## 9. Quality gates do epic

Trace PRD §10 Epic 7: "Epic 1 + manual testing 10 recibos reais (zero invenção)".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 + Epic 3 + Epic 6 (canal Telegram) consolidados em main — SATISFEITO |
| **Manual testing 10 recibos reais** | Quality gate específico do PRD §10. AC2 (OCR ≥80%) verificado com ≥10 recibos PT reais (pré-requisito 3 acima). "Zero invenção" — sem recibos fabricados; só fotos reais. |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia — NFR18); gate de saída CR `--base main` nas stories server-side (`/api/ocr/receipt` 7.5, integração Telegram 7.9). |
| Teste de componente | A3 (`react-component-test-criteria.md`): VoiceMode (7.1) e drag-and-drop (7.7) com ≥3 estados de render → teste de componente obrigatório, verificado no gate antes do CR. |
| Mock fidelity | A1 Epic 1 (`mock-protocol-fidelity.md`): o mock Claude Vision (7.5, MSW handler `anthropic.ts`) reflecte o protocolo real da Vision API, com ≥1 teste que falharia se o shape divergisse. |
| Estado distribuído | A1 Epic 4 (`internal-state-contract-gate.md`): a 7.9 (foto Telegram → OCR → finança) faz análise de ciclo de vida no gate `@architect` (idempotência por file_id, falha de OCR sem finança fantasma). |
| Cobertura | NFR17: ≥60% em packages core. Parser OCR e roteamento em helpers puros (`lib/ocr/**`, `lib/agent/tools/ocr.ts`) testados ~100% (padrão Epics 3/4/5/6). |
| AC performance | AC1 (voz cria tarefa em Chrome/Edge) verificável manualmente; o endpoint OCR (Node) tem orçamento de body 4,5MB (arch §4.1). |
| Verificabilidade só-de-produção | A3 Epic 4: AC2 (recibos reais) e AC3 (foto Telegram) exigem verificação manual em produção (recibos/conta reais não mockáveis em CI) — mapear por AC no draft, padrão AC13 da 4.9. |

## 10. Fecho do epic

> **Estado: Epic 7 EM CURSO — 3/10 stories Done** (7.1 VoiceMode UI fechada 23/06/2026 PR #91 `45164bb2`; 7.2 Web Speech recognition PT-PT fechada 24/06/2026 PR #92 `0161ae87`; 7.3 texto transcrito → cérebro fechada 24/06/2026 PR #93 `deecfd25`; waiver 0%). Sub-âmbito Voice 3/4 (falta só 7.4). Próxima candidata: 7.4 (Web Speech synthesis PT-PT lê resposta, FR80). Restantes 7.4-7.10 prontas para `@sm *draft`. Critério de fecho: **10/10 stories Done** (não há dependências externas pendentes — o Epic 7 é o último epic funcional e fecha a 6.15 do Epic 6 via 7.9). Com o Epic 7 fechado, os 15 módulos do produto (PRD §G2) ficam completos e resta só o Epic 8 (Hardening + Deploy + PWA). A REC-6.14-TRANSCRIPTION-FUTURE (voz Telegram real) é tratada via decisão GAP-7.1 (story própria se viável, ou stub honesto mantido — sem invenção de FR).

**Epic 7 = Voice + OCR.** Sucessor natural do Epic 6 (FECHADO 16/17, waiver 0%) na ordem PRD §9 (`6 → 7`). **Não bloqueia nenhum epic** (PRD §9 coluna "Bloqueia" vazia). Dois sub-âmbitos largamente independentes: **Voice** (7.1-7.4, Web Speech client-side, sem custo/sem server) e **OCR** (7.5-7.10, Claude Vision via `/api/ocr/receipt` Node + drag-and-drop + Telegram + tool cérebro + finança). A 7.9 absorve e completa a **6.15 diferida do Epic 6** (foto recibo via Telegram → OCR → finança). Os dois sub-âmbitos podem correr em paralelo (`@sm`/`@po` confirmam paralelizabilidade — precedente Epics 2/3 paralelos e os 3 sub-módulos do Epic 6).

### Sequência sugerida (não rígida — `@sm`/`@po` confirmam paralelizabilidade)

- **7.5** (endpoint `/api/ocr/receipt` + Claude Vision) → fundação do OCR. Bloqueante de 7.7/7.8/7.9/7.10. Architect Gate de Entrada.
- **7.6** (prompt OCR PT-PT) → depende de 7.5; define o schema de extracção. Architect Gate de Entrada.
- **7.7** (drag-and-drop UI) → depende de 7.5; **7.8** (preview + criar finança) → depende de 7.6/7.7.
- **7.9** (integração Telegram) → depende de 7.5/7.6 + canal Telegram do Epic 6 (pré-requisitos de produção P1-P5). Architect Gate de Entrada (estado distribuído).
- **7.10** (tool `processar_recibo`) → depende de 7.5; padrão ADR-9.
- **7.1** (VoiceMode UI) → independente do OCR; pode arrancar em paralelo. **7.2** (recognition) → depende de 7.1; **7.3** (texto → cérebro) → depende de 7.2; **7.4** (synthesis) → depende de 7.3.

> O sub-âmbito Voice (7.1-7.4) é independente do OCR (7.5-7.10) e pode correr em paralelo desde o início. Dentro do OCR, o 7.5 (endpoint) é a fundação de tudo o resto. A 7.9 (Telegram) depende dos pré-requisitos de produção do Epic 6 estarem provisionados.

### Riscos do Epic 7

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | **Anthropic Vision falha em recibos PT** (com IVA/NIF/formato PT) — extracção incorrecta (`[GAP-7.3]`, arch AR6) | Média | Médio | Prompt OCR explicita campos PT-PT (NIF, IVA, total, mercador); fallback de edição manual; AC2 (≥80%) validado em 10 recibos reais (quality gate PRD §10). |
| R2 | **Web Speech PT-PT inconsistente fora de Chrome/Edge** (`[GAP-7.1]`, arch AR7) — Firefox tem bug intermitente em PT-PT | Baixa | Baixo | Documentar Chrome/Edge como suportados; Firefox best-effort; detecção de browser-não-suportado é um estado de render do VoiceMode (7.1). |
| R3 | **Transcrição de voz Telegram inviável server-side** (`[GAP-7.1]`, REC-6.14) — Web Speech é browser-only | Média | Baixo | `@architect` decide na entrada: transcrição server-side viável → story própria; senão mantém o stub honesto da 6.14 (`VOICE_DEFERRED_MESSAGE_PT`). Não bloqueia o resto do epic. |
| R4 | **Foto Telegram cria finança duplicada ou fantasma** (`[GAP-7.4]`, `internal-state-contract-gate.md`) — mesma foto reenviada, ou OCR falha mas cria finança | Média | Médio | Gate `@architect` da 7.9 faz análise de ciclo de vida; idempotência por file_id/`msgId`; OCR falha → resposta honesta sem finança (anti-M1 da 4.9). |
| R5 | **Upload de foto excede o body limit ou MIME malicioso** (`[GAP-7.2]`) — `/api/ocr/receipt` recebe upload externo (1.º endpoint que recebe ficheiro do utilizador) | Média | Médio | Validação de tamanho/MIME ANTES do processamento (cliente arch §1149 + server-side); body limit 4,5MB (arch §4.1); CR `--base main` no gate de saída (input externo). |
| R6 | **Custo de tokens dispara** com Claude Vision em fotos grandes | Baixa | Baixo | Claude Vision incluído na API key (FR82, zero custo extra); validação de tamanho antes do upload limita o payload; single-user. |
| R7 | **Mock Anthropic Vision diverge do protocolo real** (A1 `mock-protocol-fidelity.md`) — tests passam, OCR falha em produção | Média | Médio | MSW handler `anthropic.ts` reflecte o shape real da Vision API; ≥1 teste que falharia se o protocolo divergisse (7.5). |

---

*Epic 7 preparado por Morgan (`@pm`) em 23/06/2026. Ancorado em `PRD-NEXUS-V2.md` §6.14 (Voice mode, FR77-FR80) + §6.15 (OCR de recibos, FR81-FR85) + §9 (roadmap, Epic 7 não bloqueia nenhum) + §10 Epic 7 (Stories 7.1-7.10, AC1-AC3, quality gate "manual testing 10 recibos reais"), `architecture-v2.md` (ADR-1 split Edge/Node + §4.1 `/api/ocr/receipt` Node body 4,5MB + §3 `useVoice.ts` client-side + §6 stack Web Speech/Vision + §9.4 CSP microfone permitido + §1148-1150 Web Speech/OCR/foto Telegram + AR6/AR7) e Retrospectivas Epic 1-6 (em especial Epic 6 acções A4 — puxar 6.15 + REC-6.14 para cá — e A6 — `*create-epic 7`). Zero invenção — cada FR, story e AC traça a uma secção do PRD; a 6.15 do Epic 6 é re-enquadrada como 7.9 (numeração canónica que o PRD §10 Epic 7 já lhe atribui); a transcrição de voz Telegram entra como decisão de arquitectura (GAP-7.1), não como FR inventado. Os 5 GAPs (`[GAP-7.1]` a `[GAP-7.5]`) estão marcados para o draft.*
