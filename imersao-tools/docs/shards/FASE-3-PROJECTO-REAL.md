# FASE 3 — Mao na massa: projecto real (Sabado 15:00-19:00)

> Cada aluno constroi o SEU projecto. A dor real. O momento mais importante da imersao.
> Responsavel: Eurico (circula entre alunos)
> Actualizado: 04/04/2026 — 3 ferramentas de construcao, pipeline eliminado

---

## Objectivo

Cada aluno transforma a sua dor/ideia (articulada na Fase 1) num projecto funcional. Nao precisa de estar perfeito — precisa de EXISTIR e fazer algo real.

---

## Roteiro

| Hora | Duracao | Momento | Quem faz |
|------|---------|---------|----------|
| 15:00 | 15 min | Briefing individual — "qual e a tua dor?" | Eurico com cada aluno |
| 15:15 | 30 min | Briefing Generator + pesquisa com ferramentas de pesquisa | Aluno |
| 15:45 | 15 min | Criar PRD tecnico — "isto e o que queres?" | Aluno + Eurico |
| 16:00 | 120 min | Construcao — entregar PRD ao Claude Code, Gemini CLI ou Antigravity | Aluno |
| 18:00 | 30 min | Primeiro deploy — URL publica | Aluno |
| 18:30 | 30 min | Iteracao — ajustar, corrigir, melhorar | Aluno |

---

## Ferramentas de construcao (o aluno escolhe uma)

| Ferramenta | Tipo | Melhor para |
|------------|------|-------------|
| Claude Code | CLI no terminal | Projectos complexos, multi-ficheiro, React completo |
| Gemini CLI | CLI no terminal | Alternativa Google, boa para prototipagem rapida |
| Antigravity | IDE com IA integrada | Alunos menos confortaveis com terminal — salva-vidas |

### Fluxo tipo (Claude Code)

```
Aluno: "Tenho um restaurante e preciso de um sistema de reservas online"
  -> Claude Code: Faz 3-5 perguntas (publico, features, estilo)
  -> Claude Code: Gera codigo (React 19 + Vite + Tailwind)
  -> Aluno ve o codigo a ser escrito em tempo real
  -> git push -> Vercel deploy -> URL PUBLICA
```

### Ferramentas de pesquisa (apoio)

| Ferramenta | Papel |
|------------|-------|
| Perplexity | Pesquisar sobre o projecto, mercado, exemplos |
| ChatGPT | Refinar ideias, brainstorm de features |

---

## Exemplos de projectos ja construidos

Sistema de reservas para restaurante, portfolio profissional, loja online, dashboard de gestao, landing page com formulario, sistema de marcacoes.

---

## Papel do Eurico nesta fase

| Accao | Quando |
|-------|--------|
| Circular entre alunos | Continuamente |
| Ajudar a articular a ideia | Primeiros 15 min |
| Desbloquear quando aluno fica preso | A pedido |
| Sugerir features concretas | Quando o aluno "nao sabe o que mais fazer" |
| Celebrar cada deploy | Sempre |

**Regra:** O aluno e o heroi. O Eurico e o guia. As ferramentas (Claude Code, Gemini CLI, Antigravity) trabalham para o aluno. O aluno CONSTROI — nunca e o Eurico a fazer por ele.

---

## Plano B

| Situacao | Accao |
|----------|-------|
| Aluno NAO tem Claude Code | Usar Antigravity (IDE visual, nao precisa de terminal) |
| Nenhuma ferramenta funciona | Eurico partilha ecra e corre para o aluno |
| Aluno nao consegue articular ideia | Claude Code faz perguntas guiadas / Eurico ajuda 1:1 |
| Deploy falha | Verificar Git + Vercel, fallback manual |

---

## Pre-requisitos desta fase

| Requisito | Preparado em |
|-----------|-------------|
| Pelo menos 1 ferramenta de construcao instalada | Fase 0 + Fase 2 |
| Conta GitHub criada | Fase 0 + Fase 2 |
| Conta Vercel criada | Fase 0 + Fase 2 |
| Dor/ideia articulada | Fase 1 |

---

## Output desta fase

| Output | Formato |
|--------|---------|
| Projecto individual funcional | Codigo deployado |
| URL publica do projecto | vercel.app |
| Repositorio GitHub | github.com/aluno/projecto |
