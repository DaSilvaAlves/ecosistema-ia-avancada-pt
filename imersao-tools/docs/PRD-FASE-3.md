# PRD-FASE-3 — Mao na massa: projecto real (Sabado 15:00-19:00)

> Data: 04/04/2026
> Autor: Uma (UX) + Eurico
> Estado: AGUARDA APROVACAO DO EURICO
> Ficheiro a alterar: imersao-tools/comunidade/todolist.html
> Seccao afectada: Card "FASE 3" dentro de #schedule

---

## O que mudou

O processo de construcao do projecto real mudou. Ja nao e "Claude Code faz 3-5 perguntas e gera tudo". Agora e um processo profissional em 3 etapas:

1. **Briefing + pesquisa** — Briefing Generator gera um prompt → aluno pesquisa com Perplexity/Grok/GPT
2. **PRD tecnico** — Aluno melhora os resultados e cria um PRD tecnico estruturado
3. **Construcao** — Entrega o PRD a Claude Code, Gemini CLI ou Antigravity para construir

Ferramentas CLI da fase: **Claude Code**, **Gemini CLI**, **Antigravity**

---

## O que existe AGORA no HTML (A ALTERAR)

```
FASE 3 — MAO NA MASSA
15:00 — 19:00 · 4 horas
O teu projecto real

Este e o bloco principal. Cada participante constroi o seu proprio
projecto — o problema real que trouxe. Descreves o teu problema,
Claude Code faz 3-5 perguntas, gera o projecto completo, deploy.

Exemplos ja construidos: sistema de reservas para restaurante,
portfolio profissional, loja online, dashboard de gestao, landing
page com formulario, sistema de marcacoes.

Regra: o participante e o heroi. O Eurico e o guia. Claude Code e
a ferramenta. Tu CONSTRIS — nunca e o Eurico a fazer por ti.

15:00  Briefing individual — "qual e a tua dor?" (1:1 com Eurico) — 15 min
15:15  Claude Code gera briefing personalizado no terminal — 30 min
15:45  Validar: stack, features, design — "isto e o que queres?" — 15 min
16:00  Construcao — Claude Code gera codigo completo (React 19 + Vite) — 120 min
18:00  Primeiro deploy — URL publica — 30 min
18:30  Iteracao — ajustar, corrigir, melhorar — 30 min

Resultado: o teu projecto real deployed e funcional
```

### Problemas com o texto actual

| # | Problema |
|---|---------|
| 1 | "Claude Code faz 3-5 perguntas, gera o projecto completo" — ja nao e assim |
| 2 | "Claude Code gera briefing personalizado no terminal" — agora e Briefing Generator + pesquisa |
| 3 | So menciona Claude Code — faltam Gemini CLI e Antigravity |
| 4 | Nao menciona o passo de pesquisa (Perplexity/Grok/GPT) |
| 5 | Nao menciona a criacao do PRD tecnico |
| 6 | "React 19 + Vite" — demasiado especifico, depende do projecto |
| 7 | Typo: "CONSTRIS" → deve ser "CONSTROIS" |

---

## Plano actual da Fase 3

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 15:00 | 15 min | Briefing individual — "qual e a tua dor?" (1:1 com Eurico) |
| 15:15 | 30 min | Briefing Generator gera prompt → pesquisar com Perplexity/Grok/GPT sobre o tema |
| 15:45 | 15 min | Melhorar resultados → criar PRD tecnico estruturado |
| 16:00 | 120 min | Construcao — entregar PRD a Claude Code, Gemini CLI ou Antigravity |
| 18:00 | 30 min | Primeiro deploy — URL publica |
| 18:30 | 30 min | Iteracao — ajustar, corrigir, melhorar |

---

## Texto proposto (NOVO)

### Descricao do card

```
Este e o bloco principal. Cada participante constroi o seu proprio
projecto — o problema real que trouxe. Comecas pela dor, pesquisas
o tema, crias um PRD tecnico e entregas a ferramentas profissionais
que constroem o projecto por ti.

Exemplos ja construidos: sistema de reservas para restaurante,
portfolio profissional, loja online, dashboard de gestao, landing
page com formulario, sistema de marcacoes.

Regra: o participante e o heroi. O Eurico e o guia. As ferramentas
(Claude Code, Gemini CLI, Antigravity) trabalham para ti. Tu
CONSTROIS — nunca e o Eurico a fazer por ti.
```

### Schedule detalhado

```
15:00  Briefing individual — "qual e a tua dor?" (1:1 com Eurico) — 15 min
15:15  Gerar briefing + pesquisar o tema (Perplexity, Grok, GPT) — 30 min
15:45  Criar PRD tecnico — "isto e o que queres?" — 15 min
16:00  Construcao — entregar PRD ao Claude Code, Gemini CLI ou Antigravity — 120 min
18:00  Primeiro deploy — URL publica — 30 min
18:30  Iteracao — ajustar, corrigir, melhorar — 30 min
```

### Resultado

```
Resultado: o teu projecto real deployed e funcional
```

---

## Decisoes para o Eurico

| # | Pergunta | Impacto |
|---|----------|---------|
| 1 | "Briefing Generator" aparece pelo nome ou so dizemos "gerar briefing"? | O membro nao conhece a ferramenta |
| 2 | Perplexity, Grok, GPT — mencionamos os 3 pelo nome ou dizemos "ferramentas de pesquisa"? | Nivel de detalhe |
| 3 | O titulo "O teu projecto real" mantem? | Nome do card |
| 4 | O highlight visual (borda cyan) mantem? | Visual |

---

## Alteracoes exactas no HTML (so depois de aprovacao)

| Elemento | De | Para |
|----------|------|------|
| sched-desc (paragrafo 1) | "Descreves o teu problema, Claude Code faz 3-5 perguntas, gera o projecto completo, deploy." | "Comecas pela dor, pesquisas o tema, crias um PRD tecnico e entregas a ferramentas profissionais que constroem o projecto por ti." |
| sched-desc (regra) | "Claude Code e a ferramenta. Tu CONSTRIS" | "As ferramentas (Claude Code, Gemini CLI, Antigravity) trabalham para ti. Tu CONSTROIS" |
| sched-detail item 2 | "Claude Code gera briefing personalizado no terminal — 30 min" | "Gerar briefing + pesquisar o tema (Perplexity, Grok, GPT) — 30 min" |
| sched-detail item 3 | "Validar: stack, features, design — «isto e o que queres?» — 15 min" | "Criar PRD tecnico — «isto e o que queres?» — 15 min" |
| sched-detail item 4 | "Construcao — Claude Code gera codigo completo (React 19 + Vite) — 120 min" | "Construcao — entregar PRD ao Claude Code, Gemini CLI ou Antigravity — 120 min" |

---

## O que NAO alterar

- Titulo "O teu projecto real" (confirmar com Eurico)
- Label "FASE 3 — MAO NA MASSA"
- Horarios (15:00-19:00, mesma estrutura)
- Exemplos de projectos
- Items 5 e 6 do schedule (deploy + iteracao)
- Resultado
- Highlight visual (sched-highlight)
- Outras fases

---

*PRD-FASE-3 criado em 04/04/2026. Aguarda aprovacao do Eurico antes de qualquer alteracao ao codigo.*
