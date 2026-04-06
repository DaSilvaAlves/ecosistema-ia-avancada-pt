# ORIGINAI — Módulos da Imersão

**Base:** `docs/conceito-originai.md` + `imersao-tools/docs/docsoriginai-source/`
**Formato:** Cada módulo é auto-contido — conceito + analogia visual + exercício prático
**Tom:** Brandbook [IA]AVANÇADA PT — directo, mentor, PT-PT

---

## Estrutura Geral

| Módulo | Título | Duração | Nível IA |
|--------|--------|---------|----------|
| M0 | O Problema — Por que 90% falha com IA | 15 min | Nenhum |
| M1 | Expressão — Esgota o teu cérebro primeiro | 20 min | Mínimo |
| M2 | Brief — Da cabeça ao papel, do papel à clareza | 30 min | S (QA) |
| M3 | Detalhamento — Identificar, Agrupar, Sequenciar | 30 min | S |
| M4 | PRD e Etapas — O blueprint antes da construção | 25 min | S |
| M5 | Tarefas — Uma acção, um agente, um resultado | 20 min | S/A |
| M6 | Pipeline Técnico — Do rascunho à solução real | 40 min | Todos |

**Total:** ~3 horas de conteúdo

---

## M0: O Problema — Por que 90% falha com IA

### Conceito

A maioria das pessoas usa IA com 10% de clareza e 90% de delegação cega. O resultado: ~20 interacções para algo mediano, frustração constante, e o ciclo "vai assim mesmo!" ou "vou recomeçar do zero".

O problema não é a IA. É a falta de clareza do humano.

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `18.jpg` | Casa de tijolo sem acabamento | "Isto é o que temos" — construção sem projecto |
| `19.jpg` | Bairro de construções inacabadas | O resultado em escala do modo ineficiente |

### Conteúdo

**Os Dois Modos:**

| | Modo Ineficiente | Modo Eficiente |
|-|-------------------|----------------|
| Ratio | 10% intenção / 90% delegação | 90% clareza / 10% delegação |
| Interacções | ~20 para mediano | ~5 para excepcional |
| Sensação | "Vai assim mesmo..." | "Isto ficou melhor do que imaginava!" |
| Ciclo | Frustração → recomeço | Iteração → resultado |

**Frase-chave:** "Pessoas boas conseguem generalizar. Entender as entrelinhas. A IA não. A IA precisa de clareza explícita."

### Exercício

Pensa no último projecto em que usaste IA e ficaste frustrado.
- Quanto tempo levaste a explicar o que querias?
- Quantas vezes disseste "não era isto"?
- Tinhas clareza no que querias, ou estavas a descobrir pelo caminho?

**Diagnóstico:** Se respondeste "estava a descobrir pelo caminho" — estavas no modo ineficiente.

### Material Source

- `imagens/18.jpg` — casa sem acabamento
- `imagens/19.jpg` — bairro inacabado
- Conceito dos dois modos: `conceito-originai.md` secção 2

---

## M1: Expressão — Esgota o teu cérebro primeiro

### Conceito

Antes de abrir qualquer ferramenta de IA, esgota a tua cabeça. Papel e caneta. Sem filtro, sem estrutura, sem julgamento. O objectivo é tirar TUDO da cabeça — ideias, desejos, dores, referências, rabiscos.

**Tempo:** 15 minutos. Não mais.

**Regra:** Zero IA nesta fase. A expressão é tua, não da máquina.

### Analogia Visual

Tu és o arquitecto. Antes de dar instruções ao construtor (IA), precisas saber o que queres. Ninguém constrói uma casa dizendo "faz aí uma coisa bonita" — ou melhor, quem faz, acaba com a casa da imagem 18.

### Conteúdo

**O que é Expressão:**

- Ratio: 90% humano / 10% IA
- Input: Tudo o que tens na cabeça
- Output: Papel/documento com ideias brutas
- Modo: Intuitivo, "viajando na batinha" — preferência para papel e caneta

**Regras da Expressão:**

1. Não filtres — escreve tudo, mesmo que pareça absurdo
2. Não estrutures — a estrutura vem depois
3. Não uses IA — isto é o teu cérebro a trabalhar
4. Não pares antes de esgotar — quando achas que acabou, escreve mais 5 minutos
5. 15 minutos mínimo — cronometra

### Exercício

Escolhe um projecto real (o teu, não inventado).
1. Cronometra 15 minutos
2. Escreve TUDO sobre o que queres construir — dores, desejos, referências, ideias soltas
3. Quando o tempo acabar, lê o que escreveste
4. Sublinha as 3 ideias mais fortes

**Output:** O teu rascunho bruto — a matéria-prima do Brief.

### Material Source

- Conceito de expressão: `conceito-originai.md` secção 4.1
- Tom doxa/intuitivo: FigJam original

---

## M2: Brief — Da cabeça ao papel, do papel à clareza

### Conceito

O Brief transforma o teu rascunho bruto numa descrição clara do que queres. Aqui, a IA entra pela primeira vez — mas como assistente de QA, não como criadora.

**Ratio:** 70% humano / 30% IA

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `22.jpg` | Planta técnica de arquitectura | O Brief é a tua planta — clareza antes de construir |

### Conteúdo

**O Fluxo do Brief (6 passos):**

| Passo | O que fazes | Quem faz | Nível IA |
|-------|-------------|----------|----------|
| 1. Expressar | Já fizeste em M1 | Tu | Zero |
| 2. QA 1 | IA analisa o teu rascunho, encontra pontos cegos | IA (Tier S) | Assistente |
| 3. Pesquisas | IA pesquisa o que não sabes | IA (Tier S) | Executor |
| 4. Ler Pesquisas | TU lês e geras os teus próprios insights | Tu | Zero |
| 5. Criar Brief | Escreves o Brief com base nos teus insights | Tu | Mínimo |
| 6. Aprovação + QA 2 | Validas pragmatismo: está pronto para detalhar? | Tu + IA | Checklist |

**Regra crítica no passo 4:** Os insights são TEUS, não da IA. A IA pesquisa. Tu interpretas. Tu decides.

**Checklist QA 2 — Pragmatismo Alto:**
- [ ] O Brief descreve claramente o que quero construir?
- [ ] Sei qual é o problema que estou a resolver?
- [ ] Tenho referências concretas?
- [ ] Consigo explicar isto a outra pessoa em 2 minutos?
- [ ] Está pronto para detalhar — ou preciso de mais pesquisa?

### Exercício

Pega no rascunho bruto do M1.
1. Cola-o na IA (Tier S) com: "Analisa este rascunho. Identifica pontos cegos, contradições e perguntas que eu devia responder antes de avançar."
2. Lê a resposta. NÃO copies — interpreta.
3. Faz as pesquisas que a IA sugeriu (podes usar a IA para pesquisar)
4. Escreve o teu Brief com base no que aprendeste
5. Aplica a checklist QA 2

**Output:** Brief aprovado — pronto para detalhamento.

### Material Source

- Fluxo completo: `conceito-originai.md` secção 4
- Planta técnica: `imagens/22.jpg`

---

## M3: Detalhamento — Identificar, Agrupar, Sequenciar

### Conceito

Com o Brief aprovado, é hora de detalhar. O objectivo: esgotar o que QUERES e transformar em estrutura. A IA agora faz 70% do trabalho pesado — mas tu guias.

**Ratio:** 30% humano / 70% IA
**Tempo:** 2-3 horas

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `23.jpg` | Construir Casa = Fundação → Paredes → Telhado | Um projecto decompõe-se em etapas sequenciais |
| `20.jpg` | Casa de arquitecto finalizada | O resultado de um detalhamento bem feito |

### Conteúdo

**As 4 Perguntas do Detalhamento:**

1. **O QUE QUER?** — Funcionalidades, objectivos
2. **O QUE FAZ?** — Comportamentos, fluxos
3. **COMO USAR?** — Interface, interacção
4. **DESIGN?** — Aparência, referências visuais

**O Processo em 3 Passos:**

| Passo | Acção | O que sai |
|-------|-------|-----------|
| IDENTIFICAR | Listar tudo o que o projecto precisa | Lista bruta de funcionalidades |
| AGRUPAR | Juntar funcionalidades relacionadas | Clusters / domínios |
| SEQUENCIAR | Ordenar por dependências | Etapas numeradas |

**Pergunta de entrada:**
> "O que te inspira mais? O Front-End? Que problema quero resolver? O Back-End? A Funcionalidade X? O Design?"

Começa pelo que te puxa mais — não por onde "devias" começar.

### Exercício

Pega no Brief aprovado.
1. Com a IA (Tier S), pede: "Analisa este Brief. Lista todas as funcionalidades, objectivos e comportamentos que precisam existir."
2. Agrupa a lista em 3-5 clusters lógicos
3. Ordena os clusters por dependência (o que precisa existir primeiro?)
4. Para cada cluster, define: Input → Output → Critério de sucesso

**Output:** Lista de etapas sequenciadas com funcionalidades agrupadas.

### Material Source

- Processo de detalhamento: `conceito-originai.md` secção 5
- Analogia casa: `imagens/23.jpg`
- Casa finalizada: `imagens/20.jpg`

---

## M4: PRD e Etapas — O blueprint antes da construção

### Conceito

O PRD (Product Requirements Document) transforma o detalhamento em especificação. As etapas transformam a especificação em blocos executáveis.

**Ratio:** 10% humano / 90% IA

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `24.jpg` | Regras de Quebra: Etapa vs Tarefa | Cada etapa é um objectivo intermediário verificável |
| `16.png` | Pipeline com ratios humano/IA progressivos | A delegação aumenta — mas a QA mantém-se |

### Conteúdo

**Regras de Quebra:**

**Uma ETAPA está boa se:**
- Posso explicar em 1 frase o que ela entrega
- Sei quando ela está "pronta"
- Tem entre 3-7 tarefas
- Faz sentido sozinha (não depende de detalhes internos de outras)

**Uma TAREFA está boa se:**
- Começa com um verbo de acção (Criar, Configurar, Testar...)
- Uma pessoa consegue fazer sozinha
- Consigo verificar se foi feita ou não
- Leva minutos a poucas horas (não dias)

**Pipeline de delegação progressiva:**

| Fase | Humano | IA |
|------|--------|-----|
| Analisar Etapa | 10% | 90% |
| Listar Acções | 5% | 95% |
| Definir Critérios | 5% | 95% |
| Estimar | 0% | 100% |
| Atribuir | 0% | 100% |
| QA | 5% | 95% |

### Exercício

Pega nas etapas do M3.
1. Para cada etapa, aplica o teste: "Posso explicar em 1 frase o que entrega?"
2. Se não, a etapa é grande demais — divide-a
3. Para cada etapa, lista 3-7 tarefas que começam com verbo
4. Para cada tarefa, define: feito/não feito — qual é o critério?

**Output:** Lista de etapas com tarefas, cada uma com critério de conclusão.

### Material Source

- Regras de quebra: `imagens/24.jpg`
- Pipeline de delegação: `imagens/16.png`
- Fluxo de quebra: `imagens/17.jpg`

---

## M5: Tarefas — Uma acção, um agente, um resultado

### Conceito

Uma tarefa = 1 Acção Macro, 1 Agente. Se a tarefa precisa de mais do que um agente, não é uma tarefa — é uma etapa disfarçada.

Um projecto = Múltiplas tarefas interconectadas que dependem de múltiplos agentes.

**Ratio:** 10% humano / 90% IA

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `25.jpg` | LEGO McDonald's (blocos modulares) | Cada bloco é uma tarefa — simples e encaixável |
| `26.jpg` | LEGO McLaren F1 | Sistema complexo = muitos blocos simples bem organizados |

### Conteúdo

**Os Tiers de Modelos:**

| Tier | Modelos | Quando usar |
|------|---------|-------------|
| S | Gemini 3, Opus 4.1, Codex High, Grok 4.1 | Tarefas complexas, contexto grande, auditoria |
| A | Sonnet 4.5, GPT 5.1 | Tarefas médias, boa capacidade táctica |
| B | Grok 4 Fast Code, Haiku | Tarefas rápidas e simples |
| C | GPT 120 OSS | Experimentação, open source |

**Regra de atribuição:**
- Tarefa precisa de ler o repositório inteiro? → Tier S
- Tarefa é executar uma acção bem definida? → Tier A/B
- Tarefa é exploratória/experimental? → Tier C

### Exercício

Pega nas tarefas do M4.
1. Para cada tarefa, define: qual Tier de modelo é adequado?
2. Escreve o prompt da tarefa seguindo: Contexto → Acção → Output esperado → Critério de sucesso
3. Executa 3 tarefas com o Tier correcto
4. Avalia: o resultado precisou de muitas correcções? Se sim, o prompt precisava de mais clareza.

**Output:** 3 tarefas executadas com a IA, com resultado validado.

### Material Source

- LEGO modular: `imagens/25.jpg`, `imagens/26.jpg`
- Tiers: `conceito-originai.md` secção 7

---

## M6: Pipeline Técnico — Do rascunho à solução real

### Conceito

O pipeline transforma o conceito validado numa solução real. Cada passo tem a sua ferramenta, e a ordem importa: design-first, código-second.

### Analogia Visual

| Imagem | Descrição | Mensagem |
|--------|-----------|----------|
| `21.jpg` | Villa de luxo na natureza | O resultado final de excelência |
| Blueprint páginas 1-15 | 7 Pilares da auditoria frontend | A referência técnica 2025 |

### Conteúdo

**O Pipeline — 6 Passos:**

```
1. BRIEF / Planeamento
   ↓
2. PRD DE DESIGN + Prompts (Opcional: wireframe)
   ↓
3. STITCH → Protótipo de Design
   ↓
4. AI STUDIO → Geração visual
   ↓
5. DESIGN SYSTEM → Tokenizar e Componentizar (Tailwind & Shadcn)
   ↓
6. A TUA FERRAMENTA PREFERIDA → Lovable, Claude Code, Cursor, AI Studio
   (Etapa de Funcionalidade)
```

**Regra:** "Depois que fez todas as páginas" — só então componentizar. Design-first, system-second.

**Os 7 Pilares Técnicos (Blueprint 2025):**

| Pilar | Tema | Referência |
|-------|------|-----------|
| 1 | Arquitectura React/Next.js | Server Components, anti-patterns |
| 2 | Tailwind v3 → v4 | Oxide engine, CSS-first |
| 3 | Design Tokens W3C | 3 camadas, OKLCH, DTCG |
| 4 | shadcn/ui | Copy-paste ownership (~2KB) |
| 5 | Acessibilidade | WCAG 2.2, APCA, focus-visible |
| 6 | Performance | CSS <6.5KB, LCP <1.2s |
| 7 | CI/CD Quality Gates | IDE → Lint → Commit → Pipeline |

**O Arco de Síntese:** Todos os 7 pilares convergem num `.cursorrules` — um ficheiro que injeta regras absolutas no projecto.

### Exercício

Escolhe o projecto que trabalhaste nos módulos anteriores.
1. Pega no PRD que criaste
2. Usa o Prompt Simples (abaixo) para auditar o que já tens
3. Aplica o Prompt Avançado se quiseres uma auditoria profunda

**Prompt Simples:**
> "Revisa a componentização e tokenização do sistema e verifica se estão a seguir as melhores práticas de Tailwind e Shadcn."

**Prompt Avançado:** Ver `conceito-originai.md` secção 9 ou `curso.txt` para o prompt completo de 8 categorias.

**Output:** Solução real publicada — o teu projecto construído com o método ORIGINAI.

### Material Source

- Villa resultado: `imagens/21.jpg`
- Blueprint 15 páginas: `blueprint-frontend.pdf/`
- Prompts: `textos/curso.txt`
- Pipeline técnico: `conceito-originai.md` secção 6

---

## Mapa Visual — Jornada Completa

```
M0: O PROBLEMA
  "Isto é o que temos" (imagens 18-19)
     ↓
M1: EXPRESSÃO (90% tu / 10% IA)
  Papel, caneta, 15 min, esgota o cérebro
     ↓
M2: BRIEF (70% tu / 30% IA)
  "A planta técnica" (imagem 22)
  QA1 → Pesquisas → Insights → Brief → QA2
     ↓
M3: DETALHAMENTO (30% tu / 70% IA)
  "Fundação → Paredes → Telhado" (imagem 23)
  Identificar → Agrupar → Sequenciar
     ↓
M4: PRD + ETAPAS (10% tu / 90% IA)
  "Regras de Quebra" (imagem 24)
  Cada etapa: 3-7 tarefas, objectivo verificável
     ↓
M5: TAREFAS (10% tu / 90% IA)
  "LEGO" (imagens 25-26)
  1 acção, 1 agente, 1 resultado
     ↓
M6: PIPELINE TÉCNICO
  "Isto é o que queremos" (imagens 20-21)
  Brief → PRD → Stitch → AI Studio → Design System → Deploy
```

---

## Formatos de Entrega

| Formato | Conteúdo | Para quem |
|---------|----------|-----------|
| **Documento MD** | Este ficheiro — referência completa | Equipa / preparação |
| **Ebook interactivo** | Módulos com imagens, diagramas, exercícios | Membros da comunidade |
| **Apresentação Live** | Slides com analogias visuais + demo ao vivo | Imersão 11-12/04 |
| **Templates** | Brief, Checklist QA, Prompt Simples, Prompt Avançado | Download para membros |
| **Vídeo/Áudio** | Gravação da imersão + transcrição | Acesso assíncrono |

---

## Os 10 Princípios ORIGINAI

1. O problema não é a IA — é a falta de clareza do humano
2. Clareza é um processo estruturado — não é talento, é método
3. O humano lidera no início (90%) e delega progressivamente (até 90%)
4. Cada nível de clareza tem QA — validação antes de avançar
5. O pipeline técnico começa pelo design — nunca pelo código
6. A IA é um executor — o humano é o arquitecto da intenção
7. Esgota o cérebro — antes de pedir à IA, esgota as tuas próprias ideias
8. Os insights são teus — a IA pesquisa, tu interpretas
9. Pragmatismo — cada QA valida pragmatismo, não perfeição
10. Anti-alucinação — trabalha só com o que existe, nunca inventes

---

*ORIGINAI — Módulos da Imersão [IA]AVANÇADA PT*
*Curadoria: 07/04/2026*
*Source: FigJam Board + Blueprint Frontend 2025 + Material Visual*
