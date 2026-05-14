# Mock Protocol Fidelity — Regra Obrigatória

## Origem

Incidentes Nexus v2 Story 1.2 (06/05/2026) e Story 1.10 (06/05 -> 09/05/2026). Em ambos, mocks de protocolos externos divergiram do protocolo real e os tests passaram na mesma — escondendo bugs que partiriam em produção.

- **Story 1.2:** MSW mock do Anthropic SSE emitia `tool_use` com input completo no `content_block_start`. Tests 95/95 PASS, QA deu PASS high confidence. CodeRabbit cruzou com Anthropic API docs + SDK issue #960 e apanhou: o protocolo real emite `id`/`name` no `content_block_start` mas streama os args como `input_json_delta` chunks finalizados no `content_block_stop`. O bug ia partir a Story 1.5 (executor SSE real) em produção.
- **Story 1.10:** Mock MSW SSE divergia do `executor.ts` real em 5 pontos (meta phase, `text_delta` vs `delta`, campos do `done`, wire format, terminador `[DONE]`). O E2E passava localmente, falhava em CI. Custou 3 iterações (Iter 1-3) a resolver.

## Regra Principal (Inegociável)

**Um mock de protocolo externo espelha o protocolo real — não apenas faz os tests passar.** Quando um mock reproduz o mesmo bug do código sob teste, os tests passam mas o bug fica escondido e o test vira tautologia.

## Âmbito

Aplica-se a TODOS os mocks de protocolos externos:

| Categoria | Exemplos |
|-----------|----------|
| Server-Sent Events (SSE) | Anthropic streaming, OpenAI streaming |
| HTTP / REST | MSW handlers, fetch interceptors |
| Conexões persistentes | WebSockets, gRPC |
| Fluxos com state machine | OAuth flows, handshakes de autenticação |

## Obrigações

| # | Obrigação |
|---|-----------|
| 1 | Antes de escrever um mock de protocolo, ler a documentação oficial da API e SDK issues recentes do provider |
| 2 | O mock reflecte o wire format real: nomes de eventos, nomes de campos, ordem de fases, terminadores |
| 3 | Pelo menos 1 test prova que o mock **falharia** se o protocolo real mudasse (chunk splitting, erro mid-stream, respostas parciais, JSON malformado) |
| 4 | Em QA/review de story que toca providers/streaming: verificar não só "os tests passam" mas "o mock reflecte o protocolo real" — abrir as docs do provider em paralelo |
| 5 | Quando viável, ter 1 test de integração com o SDK real (MSW intercepta o fetch directo do SDK) que valide o handshake real |

## Anti-Padrões Proibidos

| Anti-padrão | Porquê é proibido |
|-------------|-------------------|
| Ajustar o mock até os tests passarem sem verificar o protocolo real | Esconde bugs de protocolo que partem em produção |
| Copiar para o mock a forma como o código sob teste consome o protocolo | Mock e código partilham o mesmo bug — o test não prova nada |
| Mock SSE sem terminador, fases ou wire format reais | Diverge silenciosamente; o CI apanha o que o local não apanhou |

## Verificação no QA Gate

Uma story que toca um mock de protocolo externo só passa o QA gate se:

1. Existe evidência (link ou citação) de que o mock foi cruzado com a documentação oficial do provider
2. Existe o test de fidelidade descrito na obrigação 3

## Relação com Memória

Esta regra formaliza a memória `feedback_mock_must_reflect_real_protocol.md`. A memória continua como registo do incidente original; esta regra é a norma executável.

## Aplicação Universal

Aplica-se a todos os agentes que escrevem ou revêem mocks: `@dev`, `@qa`, `@architect`, e qualquer skill ou squad externo. Sem excepções.

---

*Origem: Retrospectiva Epic 1 Nexus v2, acção A1. Criada por Orion (`@aiox-master`) em 14/05/2026.*
