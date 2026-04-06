# PRD-FASE-2 — Exercicio guiado (Sabado 11:00-13:00)

> Data: 04/04/2026
> Autor: Uma (UX) + Eurico
> Estado: AGUARDA APROVACAO DO EURICO
> Ficheiro a alterar: imersao-tools/comunidade/todolist.html
> Seccao afectada: Card "FASE 2" dentro de #schedule

---

## O que mudou

As ferramentas do pipeline (Starter Builder, Prompt Optimizer, AIOS Compiler) foram **eliminadas do plano da imersao**. Davam problemas e representavam risco. A Fase 2 agora funciona com os **5 templates prontos** que ja estao na pagina.

---

## Plano actual da Fase 2

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 11:00 | 5 min | "Agora vamos construir. Todos juntos." |
| 11:05 | 10-15 min | Cada aluno escolhe 1 dos 5 estilos, abre, testa a app |
| 11:15-11:20 | 5 min | Ve o resultado, testa, comenta. Explorar, perguntas |
| 11:20 | ~100 min | Criar todas as contas necessarias para a tarde (GitHub, Vercel, Groq, Node.js, Git) + testar tudo |
| 13:00 | — | Almoco. Tudo tem de estar alinhado para a tarde |

**Resultado:** Cada aluno tem a To-Do List a funcionar + todas as contas criadas e testadas para a Fase 3.

---

## O que existe AGORA no HTML (ERRADO)

```
FASE 2 — EXERCICIO GUIADO
11:00 — 13:00 · 2 horas
Primeiro projecto — To-Do List

"Agora vamos construir. Todos juntos." Escolher estilo visual com o
Starter Builder, gerar prompt optimizado, a IA gera o codigo em tempo
real, deploy numa URL publica. Primeiro "wow moment".

11:00  "Agora vamos construir. Todos juntos." — 5 min
11:05  Escolher estilo visual — design tokens (Starter Builder) — 15 min
11:20  Gerar prompt optimizado (Prompt Optimizer) — 10 min
11:30  IA gera o codigo em tempo real (AIOS Compiler) — 20 min
11:50  Deploy — "a tua URL publica" (GitHub + Vercel) — 10 min
12:00  Celebracao — todos partilham URLs no WhatsApp — 10 min
12:10  Explorar, personalizar, perguntas — 50 min

Resultado: To-Do List funcional deployed numa URL publica
```

### Problemas com o texto actual

| # | Problema |
|---|---------|
| 1 | Menciona "Starter Builder" — ELIMINADO |
| 2 | Menciona "Prompt Optimizer" — ELIMINADO |
| 3 | Menciona "AIOS Compiler" — ELIMINADO |
| 4 | Menciona "design tokens" — nao se aplica |
| 5 | Menciona "deploy numa URL publica" — nao ha deploy nesta fase |
| 6 | Menciona "gerar prompt optimizado" — nao ha prompt |
| 7 | Menciona "IA gera o codigo em tempo real" — nao ha geracao de codigo |
| 8 | Horarios de 11:20 a 12:10 nao correspondem ao plano actual |
| 9 | A segunda metade da fase (criar contas para a tarde) nao existe |

---

## Texto proposto (NOVO)

### Descricao do card

```
Todos juntos, todos ao mesmo tempo. Escolhes um dos 5 estilos acima,
abres a app, testas. Em 10 minutos tens a tua primeira app a funcionar.
Depois, preparamos tudo para a tarde — contas criadas, ferramentas
instaladas, tudo testado. Ninguem fica para tras.
```

### Schedule detalhado

```
11:00  "Agora vamos construir. Todos juntos." — 5 min
11:05  Escolher estilo — abre, testa, comenta — 15 min
11:20  Preparar contas e ferramentas para a tarde — 100 min
13:00  Tudo pronto para a Fase 3
```

### Resultado

```
Resultado: To-Do List a funcionar + contas e ferramentas prontas para a tarde
```

---

## Decisoes para o Eurico

| # | Pergunta | Impacto |
|---|----------|---------|
| 1 | O titulo "Primeiro projecto — To-Do List" mantemos? | Nome do card |
| 2 | A label "FASE 2 — EXERCICIO GUIADO" mantemos? | Label do card |
| 3 | O highlight visual (borda cyan) mantemos? | Visual |
| 4 | "Preparar contas e ferramentas para a tarde" — queres detalhar quais contas no schedule ou basta a referencia a seccao de contas mais abaixo? | Nivel de detalhe |

---

## Alteracoes exactas no HTML (so depois de aprovacao)

| Linha aprox. | Elemento | De | Para |
|-------------|----------|------|------|
| 559 | sched-name | "Primeiro projecto — To-Do List" | (confirmar com Eurico) |
| 560-561 | sched-desc | Texto com Starter Builder, Prompt Optimizer, AIOS Compiler | Texto novo sem ferramentas |
| 563-569 | sched-detail (7 items) | 7 items com ferramentas eliminadas | 3 items do plano actual |
| 571 | sched-output | "To-Do List funcional deployed numa URL publica" | "To-Do List a funcionar + contas e ferramentas prontas para a tarde" |

---

## O que NAO alterar

- Templates (todolist-cyberpunk.html, etc.) — NAO TOCAR
- Seccao de contas (#contas) — ja existe e esta correcta
- Outras fases — cada uma tem o seu PRD
- CSS / design system — manter tudo igual

---

*PRD-FASE-2 criado em 04/04/2026. Aguarda aprovacao do Eurico antes de qualquer alteracao ao codigo.*
