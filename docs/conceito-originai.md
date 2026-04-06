# ORIGINAI — Framework Conceptual

**Fonte:** FigJam Board "PROJETO ORIGINAI com IA" (Eurico Alves / The Legends)
**Extraído em:** 06/04/2026
**Estado:** Documento de referência — base conceptual de toda a imersão [IA]AVANÇADA PT

---

## 1. A Premissa Fundamental

> Clareza total no Input e Output. O processo entre in e out pode ser desconhecido.

A maioria das pessoas falha com IA não por limitação da tecnologia, mas por falta de clareza na intenção humana.

---

## 2. Os Dois Modos

### Modo Ineficiente (Default)

- Ratio: 10% intenção / 90% delegação cega
- Resultado: ~20 interacções para resultado mediano
- Ciclo: frustração → "vai assim mesmo!" ou "foda-se, vou recomeçar!"
- Fluxo: Dor/Desejo → Expressar (prompt) → Delegar/Executar → Output mediano

### Modo Eficiente (ORIGINAI)

- Ratio: 90% intenção + clareza / 10% delegação informada
- Resultado: ~5 interacções para resultado excepcional
- Ciclo: interacção produtiva → "isto ficou melhor do que eu imaginava!"
- Fluxo: Expressar → Clareza → Delegar/Executar → Output excepcional

**Insight:** "Pessoas boas conseguem generalizar. Entender as entrelinhas." — a IA não. A IA precisa de clareza explícita.

---

## 3. O Fluxo da Clareza — 6 Níveis

A ratio humano/IA inverte-se progressivamente:

| Nível | Etapa | Humano | IA |
|-------|-------|--------|-----|
| 1 | Expressão | 90% | 10% |
| 2 | Brief | 70% | 30% |
| 3 | Detalhamento | 30% | 70% |
| 4 | PRD | 30% | 70% |
| 5 | Etapas | 10% | 90% |
| 6 | Tarefas | 10% | 90% |

### Definições

- **Tarefa:** 1 Acção Macro, 1 Agente
- **Projecto:** Múltiplas tarefas interconectadas que dependem de múltiplos agentes

---

## 4. Fase 1: Expressão → Brief

### 4.1 Expressar (15 min)

- **Input:** Ideias, desejos, dores, referências, o que tiver na cabeça
- **Output:** Tirar da cabeça e colocar no papel
- **Objectivo:** Esgotar o cérebro — esgotou as ideias
- **Preferência:** Papel e caneta. Doxa / Intuitivo / "Viajando na Batinha"
- **Nível IA:** S (mínimo)

### 4.2 QA 1

- **Input:** Descrição máxima da Dor/Desejo
- **Output:** Análise objectiva e sugestões de pesquisas
- **Objectivo:** Encontrar pontos cegos e melhorias
- **Nível IA:** S

### 4.3 Pesquisas

- **Input:** Contexto da IA
- **Output:** Pesquisa detalhada e objectiva
- **Objectivo:** Clareza de ponto cego ou problemático
- **Nível IA:** S

### 4.4 Ler Pesquisas

- **Input:** Pesquisas
- **Output:** Insights (do HUMANO, não da IA)
- **Objectivo:** Compreensão > Gerar Insights
- **Nota:** "UAU!" — o momento de descoberta é humano

### 4.5 Criar o Brief

- **Input:** Os SEUS insights, não os da IA
- **Output:** Brief
- **Objectivo:** Criar o Brief com a visão do humano informada pela pesquisa

### 4.6 Aprovação

- **Input:** Brief
- **Output:** Aprovação do Brief
- **Objectivo:** De acordo com desejo/dor

### 4.7 QA 2

- **Input:** Brief aprovado
- **Output:** Validação com checklist
- **Objectivo:** Garantir que está pronto para detalhamento
- **Checklist:** Pragmatismo Alto

**Tempo total:** Interacção — minutos, horas ou dias. Pragmático.

---

## 5. Fase 2: Detalhamento → Etapas

### 5.1 Detalhamento / Aprofundamento

- **Input:** Brief aprovado
- **Output:** Bullet goals + Background
- **Objectivo:** Esgotar o cérebro sobre O QUE QUER
- **Tempo:** 2 a 3 horas

### 5.2 Sequência de Detalhamento

1. **Identificar** — O que faz?
2. **Agrupar** — Clusters de funcionalidade
3. **Sequenciar** — Ordem de execução
4. **Design?** — Como usar? Qual o design?

### 5.3 Criar Etapas

- Do detalhamento, extrair etapas ordenadas

### 5.4 Criar Tarefas

- De cada etapa, extrair tarefas (1 acção macro, 1 agente)

### 5.5 Validar + QA

- Validação de etapas e tarefas antes de execução

---

## 6. Fase 3: Estágio do Rascunho — Pipeline Técnico

### Pipeline passo a passo:

```
BRIEF / Planejamento
    ↓
PRD DE DESIGN + Prompts (Opcional: wireframe)
    ↓
STITCH → Protótipo de Design
    ↓
AI STUDIO
    ↓
DESIGN SYSTEM → Tokenizar e Componentizar (Tailwind & Shadcn)
    ↓
SUA PREFERIDA → Lovable, Claude Code, Cursor, AI Studio
    (Etapa de Funcionalidade)
```

**Nota:** "Depois que fez todas as páginas" — só então componentizar. Design-first, system-second.

### Pergunta-chave de entrada:

> "O que te inspira mais? O Front-End? Que problema quero resolver? O Back-End? A Funcionalidade X? O Design?"

Começa pelo planejamento (Brief e PRD).

---

## 7. Tier de Modelos IA

| Tier | Modelos | Uso |
|------|---------|-----|
| S | Gemini 3, Opus 4.1, Codex High, Grok 4.1 | Top tier — tarefas complexas |
| A | Sonnet 4.5, GPT 5.1 | Standard — tarefas médias |
| B | Grok 4 Fast Code, Haiku | Rápido — tarefas simples |
| C | GPT 120 OSS | Open source — experimentação |

---

## 8. Visão Macro — Hackathon

**"15 Sistemas em 1 Semana"**

- Estrutura: PM (PO/SM) + 15 DEVs
- 13 Projectos simultâneos
- Fluxo semanal:
  - Segunda: Expressar
  - Terça: Planeamento + Design (Design System em 24h)
  - Quarta: PRD no Antigravity + Dev
  - Restante: Etapas de execução

---

## 9. Prompts de Auditoria Frontend

O ORIGINAI inclui 2 prompts detalhados para auditoria:

### Prompt Simples
Revisão de componentização e tokenização (Tailwind & Shadcn) — para qualquer pessoa.

### Prompt Avançado (para pessoas avançadas)
Auditoria profunda 2025-ready com 8 categorias:
1. Tailwind CSS (v3/v4)
2. Design Tokens (W3C DTCG)
3. shadcn/ui + Radix
4. React/Next.js
5. Acessibilidade (WCAG 2.2 + APCA)
6. Tooling/DX/CI
7. Performance
8. Configuração IA (.cursorrules)

Princípio anti-alucinação: "Trabalhe SOMENTE com o que encontrar no repositório."

---

## 10. Referências

- Atomic Design — Brad Frost (atomicdesign.bradfrost.com)
- Design System — Alan Nicolas
- W3C Design Tokens (DTCG v2025.10)
- OKLCH Color Space
- WCAG 2.2 + APCA (WCAG 3.0 candidate)
- Tailwind CSS v4.0
- shadcn/ui

---

## 11. Síntese — Os Princípios ORIGINAI

1. **O problema não é a IA** — é a falta de clareza do humano
2. **Clareza é um processo estruturado** — não é talento, é método
3. **O humano lidera no início** (90%) e delega progressivamente à IA (até 90%)
4. **Cada nível de clareza tem QA** — validação antes de avançar
5. **O pipeline técnico começa pelo design** — nunca pelo código
6. **A IA é um executor** — o humano é o arquitecto da intenção
7. **Esgotar o cérebro** — antes de pedir à IA, esgota as tuas próprias ideias
8. **Os insights são teus** — a IA pesquisa, tu interpretas
9. **Pragmatismo** — cada QA valida pragmatismo, não perfeição
10. **Anti-alucinação** — trabalha só com o que existe, nunca inventes
