---
task: Teach AIOX Concept
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - conceito: string — conceito AIOX a ensinar (ex: "Story Development Cycle", "agent authority")
  - nivel_utilizador: iniciante|intermedio|avancado — nível de familiaridade do utilizador
Saida: |
  - explicacao: markdown — explicação adaptada ao nível com contexto de porquê
  - exemplo_pratico: code/command — exemplo concreto executável
  - proximo_passo: string — próximo conceito ou acção recomendada
Checklist:
  - "[ ] Identificar escopo do conceito e posição no framework AIOX"
  - "[ ] Adaptar profundidade ao nivel_utilizador (iniciante: o quê, intermedio: como, avancado: porquê + trade-offs)"
  - "[ ] Explicar PORQUÊ primeiro — contexto antes de mecânica"
  - "[ ] Fornecer exemplo concreto executável (@agent *command real)"
  - "[ ] Sugerir próximo conceito ou acção para continuar a aprendizagem"
---

# *teach

Ensina qualquer conceito AIOX com abordagem pedagógica adaptada ao nível do utilizador. Começa sempre pelo PORQUÊ antes de explicar o COMO. Inclui exemplo concreto e próximo passo para continuar.

## Usage

```
@aiox-mentor
*teach

# → solicita conceito e nível interactivamente

*teach "Story Development Cycle" iniciante
# → explicação básica do SDC com exemplo simples e próximo passo

*teach "agent authority matrix" avancado
# → explicação completa com trade-offs de design e casos edge
```

## Flow

1. Identifica o escopo do conceito e onde se posiciona no framework AIOX
2. Adapta profundidade ao nivel_utilizador:
   - `iniciante`: o quê é, para que serve, comando básico
   - `intermedio`: como funciona, quando usar, exemplo completo
   - `avancado`: porquê foi desenhado assim, trade-offs, casos edge
3. Estrutura a explicação começando pelo PORQUÊ (motivação, problema que resolve)
4. Fornece exemplo concreto: comando real `@agent *command` ou snippet executável
5. Sugere próximo conceito a aprender ou acção a experimentar

## Output

Markdown estruturado com:
- **Porquê existe:** motivação e problema resolvido
- **O que é:** definição clara e concisa
- **Como funciona:** mecânica (adaptada ao nível)
- **Exemplo:** comando ou snippet concreto
- **Próximo passo:** sugestão de continuação
