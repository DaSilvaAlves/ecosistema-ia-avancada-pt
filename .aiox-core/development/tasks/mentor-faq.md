---
task: FAQ Answer
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - pergunta: string — pergunta em linguagem natural sobre o AIOX
Saida: |
  - resposta: markdown — resposta concisa e directa à pergunta
  - referencia_ficheiro: string — path absoluto para o ficheiro que documenta a resposta
Checklist:
  - "[ ] Parse da pergunta para identificar o tema e tipo (how-to, why, what, troubleshoot)"
  - "[ ] Encontrar resposta na knowledge base (rules, docs, entity-registry)"
  - "[ ] Referenciar ficheiro fonte — nunca responder sem base em artefacto real"
  - "[ ] Formatar resposta concisa: máximo 5 linhas para perguntas simples"
  - "[ ] Sugerir *how-to ou *teach se a pergunta indicar necessidade de guia mais longo"
---

# *faq

Responde a perguntas frequentes sobre o AIOX em linguagem natural. Cada resposta inclui referência ao ficheiro fonte que documenta o comportamento. Para perguntas complexas, sugere `*how-to` ou `*teach`.

## Usage

```
@aiox-mentor
*faq

# → solicita pergunta interactivamente

*faq "qual agente faz o git push?"
# → "@devops (Gage) — exclusivo. Referência: .claude/rules/agent-authority.md"

*faq "o que é uma story Draft?"
# → explica o status Draft com referência a story-lifecycle.md

*faq "quando usar spec pipeline vs sdc?"
# → comparação breve com sugestão de *compare spec-pipeline sdc para mais detalhes
```

## Flow

1. Parse da pergunta: identifica tema e tipo (how-to, why, what, troubleshoot, compare)
2. Encontra resposta na knowledge base: `.claude/rules/`, `docs/`, `entity-registry.yaml`
3. Referencia o ficheiro fonte exacto que documenta o comportamento
4. Formata resposta concisa: directa, sem preâmbulo, máximo 5 linhas para perguntas simples
5. Se a pergunta indicar necessidade de guia completo: sugere `*how-to`, `*teach`, ou `*compare`

## Output

```
**Resposta:** {resposta directa e concisa}

**Referência:** {path_absoluto_do_ficheiro}

{se aplicável: "Para guia completo: @aiox-mentor *how-to '{objectivo}'"}
```
