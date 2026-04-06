# HANDOFF — Ajustes fase a fase do todolist.html + dashboard

> Data: 04/04/2026
> Autor: Gage (DevOps) + Uma (UX) + Eurico
> Estado: PRONTO PARA EXECUCAO
> Terminal: NOVO (nao depende de sessoes anteriores)
> Prioridade: CRITICA — imersao e dia 12/04/2026

---

## Estado actual — o que ja foi feito

| Item | Estado | Commit |
|------|--------|--------|
| todolist.html reescrito | FEITO | ee24d29 |
| Templates no topo (primeira coisa visivel) | FEITO | ee24d29 |
| "presencial" eliminado → ONLINE | FEITO | ee24d29 |
| Schedule detalhado hora a hora (7 fases) | FEITO | ee24d29 |
| Texto aumentado (~15-20%) | FEITO | 5d0326b |
| Cards alinhados (flexbox) | FEITO | 5d0326b |
| Templates abrem noutra aba | FEITO | 5d0326b |
| Navbar "Imersao" abre todolist.html noutra aba | FEITO | 5d0326b |

---

## O que falta — ajustes fase a fase

Cada fase precisa de revisao visual e de conteudo no todolist.html. Abaixo esta o PRD de cada ajuste, com a fonte de verdade (shard) e o que deve aparecer na pagina.

---

## PRD FASE 0 — Pre-imersao (checklist de contas)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-0-PRE-IMERSAO.md`

### O que ja existe no todolist.html
- Seccao "PREPARACAO OBRIGATORIA" com 5 contas (GitHub, Vercel, Groq, Node.js, Git)
- Cada conta tem passo a passo detalhado com steps numerados
- Checkbox interactiva com localStorage
- Mensagem verde "Tudo pronto" quando tudo marcado

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | Claude Code na checklist? | O shard menciona "Instalar Claude Code" (itens 6-7) como PENDENTE. Decisao do Eurico: se cada aluno tem Claude Code ou so o Eurico. Se SIM → adicionar a conta a checklist. Se NAO → deixar como esta (5 contas) |
| 2 | Ordem das contas | Verificar se a ordem faz sentido: GitHub → Vercel → Groq → Node.js → Git. O shard sugere esta mesma ordem |
| 3 | Links correctos | github.com/signup, vercel.com/signup, console.groq.com, nodejs.org, git-scm.com/downloads |
| 4 | Texto dos steps | Verificar se cada step esta claro para alguem que nunca usou terminal |
| 5 | "O que ter pronto no dia" | Seccao final — verificar se lista esta completa (portatil, internet, problema real, contas, API key, WhatsApp) |

### Decisao necessaria do Eurico
- Adicionar Claude Code a checklist? (`npm install -g @anthropic-ai/claude-code`)
- Se sim, adicionar tambem: "Testar Claude Code" (`claude` no terminal)

---

## PRD FASE 1 — Abertura + Perfil (Sab 10:00-11:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-1-ABERTURA.md`

### O que ja existe no todolist.html
Card de schedule com:
- Label: "FASE 1 — ABERTURA + PERFIL"
- Horario: 10:00-11:00
- 5 items detalhados (boas-vindas, palestra, profiler, arquetipos, dor)
- Resultado: "cada participante sabe o seu arquetipo e articulou o seu problema real"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | Titulo do card | "Boas-vindas e arquetipos" — verificar se e claro |
| 2 | Descricao | Menciona Student Profiler, palestra "Realidade Real", 4 niveis — tudo do shard |
| 3 | Detail items | 5 items com horarios exactos — verificar alinhamento com shard |
| 4 | Tom | Deve seguir brandbook: "Nao e um curso. E uma imersao." |
| 5 | Referencia ao Student Profiler | O shard diz que e ICEBREAKER, nao diagnostico tecnico real |

### Conteudo exacto do shard (roteiro)

```
10:00 — 5 min  — Boas-vindas: "Nao e um curso. E uma imersao."
10:05 — 20 min — Palestra "Realidade Real" — impacto IA, niveis 1-4, porque nivel 4
10:25 — 15 min — Student Profiler — quiz rapido (10 perguntas → arquetipo)
10:40 — 10 min — Eurico comenta arquetipos — "quem e quem"
10:50 — 10 min — Cada participante: "a minha dor e..."
```

---

## PRD FASE 2 — Exercicio guiado (Sab 11:00-13:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-2-EXERCICIO-GUIADO.md`

### O que ja existe no todolist.html
Card de schedule com:
- Label: "FASE 2 — EXERCICIO GUIADO"
- Horario: 11:00-13:00
- 7 items detalhados
- Resultado: "To-Do List funcional deployed numa URL publica"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | Ferramentas mencionadas | Starter Builder, Prompt Optimizer, AIOS Compiler — estao no texto? |
| 2 | Fluxo visual | O shard descreve um pipeline: Starter → Prompt → Compiler → GitHub → Vercel. Considerar representar visualmente |
| 3 | "Primeiro wow moment" | Esta frase deve aparecer — e o ponto emocional da fase |
| 4 | Plano B | O shard tem fallback para terminal. Nao precisa estar na pagina do membro (e interno) |
| 5 | Ligacao com templates | Os 5 templates de To-Do List (seccao acima) sao os estilos que escolhem NESTA fase |

### Conteudo exacto do shard (roteiro)

```
11:00 — 5 min   — "Agora vamos construir. Todos juntos."
11:05 — 15 min  — Escolher estilo visual — design tokens (Starter Builder)
11:20 — 10 min  — Gerar prompt optimizado (Prompt Optimizer)
11:30 — 20 min  — IA gera o codigo em tempo real (AIOS Compiler)
11:50 — 10 min  — Deploy — "a tua URL publica" (GitHub + Vercel)
12:00 — 10 min  — Celebracao — todos partilham URLs no WhatsApp
12:10 — 50 min  — Explorar, personalizar, perguntas
```

### Relacao com os templates no topo da pagina
Os 5 cards de templates (Cyberpunk, Aurora, Holographic, Neomorphic, Brutalist) sao os estilos que os participantes escolhem na Fase 2. Considerar adicionar uma nota no card da Fase 2: "Escolhe o teu estilo nos cards acima"

---

## PRD FASE 3 — Projecto real (Sab 15:00-19:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-3-PROJECTO-REAL.md`

### O que ja existe no todolist.html
Card de schedule (highlight) com:
- Label: "FASE 3 — MAO NA MASSA"
- Horario: 15:00-19:00
- 6 items detalhados
- Descricao com exemplos de projectos
- Regra: "o participante e o heroi"
- Resultado: "o teu projecto real deployed e funcional"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | E o bloco principal | DEVE ter destaque visual (ja tem sched-highlight) |
| 2 | Exemplos de projectos | Shard lista: restaurante, portfolio, loja, dashboard, landing page, agenda/booking |
| 3 | Ferramenta: Claude Code | O shard diz que Claude Code faz TUDO nesta fase. Mencionar |
| 4 | Papel do Eurico | "Circula entre alunos", "desbloqueia", "celebra cada deploy" |
| 5 | Regra do heroi | "O aluno e o heroi. O Eurico e o guia. Claude Code e a ferramenta." — DEVE estar visivel |
| 6 | Typo | Verificar "CONSTRIS" → "CONSTOIS" no texto actual (possivel typo) |

### Conteudo exacto do shard (roteiro)

```
15:00 — 15 min  — Briefing individual — "qual e a tua dor?" (1:1 com Eurico)
15:15 — 30 min  — Claude Code gera briefing personalizado no terminal
15:45 — 15 min  — Validar: stack, features, design — "isto e o que queres?"
16:00 — 120 min — Construcao — Claude Code gera codigo completo (React 19 + Vite)
18:00 — 30 min  — Primeiro deploy — URL publica
18:30 — 30 min  — Iteracao — ajustar, corrigir, melhorar
```

---

## PRD FASE 4 — Ponto Socorro (Sab 22:00-23:30)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-4-PONTO-SOCORRO-1.md`

### O que ja existe no todolist.html
Card de schedule com:
- Label: "FASE 4 — PONTO SOCORRO NOCTURNO"
- Horario: 22:00-23:30, Google Meet, voluntario
- 3 items detalhados (check-in, suporte 1:1, wrap-up)
- Mencao de bloqueios comuns
- Resultado: "todos os participantes com projecto funcional"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | "Voluntario" claro | Deve ser obvio que e OPCIONAL — so para quem precisa |
| 2 | Google Meet | Canal correcto mencionado |
| 3 | Bloqueios comuns | Shard lista 5: deploy, bugs, features, ideia mudou, sem ideia. Estao no texto? |
| 4 | Frase chave | "Ninguem chega a domingo sem projecto funcional" — DEVE estar em destaque |

### Conteudo exacto do shard (roteiro)

```
22:00 — 10 min — Check-in — "Quem esta? Qual e o bloqueio?"
22:10 — 60 min — Suporte 1:1 — Eurico resolve com cada aluno (screen share)
23:10 — 20 min — Wrap-up — "Para amanha: foco em [X]"
```

---

## PRD FASE 5 — Refinamento (Dom 10:00-13:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-5-REFINAMENTO.md`

### O que ja existe no todolist.html
Card de schedule com:
- Label: "FASE 5 — REFINAMENTO + FEATURES"
- Horario: 10:00-13:00
- 5 items detalhados (3 blocos + deploy intermedio)
- Resultado: "projecto polido e profissional"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | 3 blocos claros | Design (45 min) + Features (60 min) + Conteudo (30 min) — estao separados? |
| 2 | Sugestoes por tipo | Shard tem tabela de sugestoes por tipo de projecto. Considerar adicionar ao card |
| 3 | "De funciona para impressiona" | Frase do titulo — boa, manter |
| 4 | Deploy intermedio | Ultimo item — verificar se esta claro que e para ver como esta, nao e o final |

### Conteudo exacto do shard (roteiro)

```
10:00 — 15 min — Check-in — "Onde ficaste? O que falta?"
10:15 — 45 min — Bloco 1: Design — melhorar visual, responsivo, dark mode, animacoes
11:00 — 60 min — Bloco 2: Features — formularios, filtros, checkout, integracoes
12:00 — 30 min — Bloco 3: Conteudo — substituir dados de teste por conteudo real
12:30 — 30 min — Deploy intermedio — verificar como esta
```

### Sugestoes de refinamento por tipo (do shard)

| Tipo | Feature a sugerir |
|------|-------------------|
| Restaurante | Menu com precos + botao WhatsApp + mapa |
| Portfolio | Seccao de projectos + formulario de contacto |
| Loja | Catalogo com filtros + botao WhatsApp + preco |
| Dashboard | Graficos interactivos + dados em tempo real |
| Landing page | Testemunhos + CTA + countdown |
| Agenda | Calendario + confirmacao por email |

---

## PRD FASE 6 — Deploy final (Dom 15:00-16:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-6-DEPLOY-FINAL.md`

### O que ja existe no todolist.html
Card de schedule com:
- Label: "FASE 6 — DEPLOY FINAL"
- Horario: 15:00-16:00
- 4 items detalhados
- Mencao de checklist de deploy e teste cruzado
- Resultado: "URL final publica, projecto completo"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | Checklist de deploy | Shard tem 5 checks: conteudo real, responsivo, links, deploy, URL partilhada. Estao mencionados? |
| 2 | Teste cruzado | "Cada aluno testa o projecto de outro" — conceito unico, destacar |
| 3 | "Partilha de URLs" | Ultimo momento — todos partilham no WhatsApp |
| 4 | Emocao | Este e o momento "consegui" — o tom deve reflectir isso |

### Conteudo exacto do shard (roteiro)

```
15:00 — 15 min — Ultimos ajustes — "o que falta?"
15:15 — 15 min — Deploy final — git push + Vercel
15:30 — 15 min — Teste cruzado — cada aluno testa o projecto de outro
15:45 — 15 min — Partilha de URLs — todos no WhatsApp
```

### Checklist de deploy (do shard)

1. Conteudo real (sem lorem ipsum)
2. Responsivo (funciona no telemovel)
3. Links funcionam
4. Deploy Vercel online
5. URL partilhada no grupo

---

## PRD FASE 7 — Fecho + celebracao (Dom 22:00)

### Fonte de verdade
`imersao-tools/docs/shards/FASE-7-FECHO.md`

### O que ja existe no todolist.html
Card de schedule (highlight) com:
- Label: "FASE 7 — FECHO + CELEBRACAO"
- Horario: 22:00, Google Meet
- 5 items detalhados (abertura, showcase, feedback, proximos passos, fecho)
- Resultado: "showcase completo, entrada na comunidade, continuidade"

### O que verificar / ajustar

| # | Check | Detalhe |
|---|-------|---------|
| 1 | Showcase format | Shard detalha 4 passos: URL, contexto da dor, demo ao vivo, proximo passo. Estao mencionados? |
| 2 | "Ninguem fica de fora" | Regra importante — projecto imperfeito = valido |
| 3 | Transicao para comunidade | Shard menciona: formacoes, proximo desafio, canal #projectos |
| 4 | "Isto e so o comeco" | Frase de fecho — deve estar em destaque |
| 5 | Duracao | 60-90 min — verificar se esta claro |

### Conteudo exacto do shard (roteiro)

```
22:00 — 5 min     — "Ha 48 horas, ninguem tinha nada. Agora..."
22:05 — 40-60 min — Showcase — cada aluno mostra o SEU projecto (3-5 min cada)
~23:05 — 10 min   — Feedback — "O que aprendeste? O que mais te surpreendeu?"
~23:15 — 10 min   — Proximos passos — comunidade, formacoes, proximo desafio
~23:25 — 5 min    — Fecho — "Isto e so o comeco."
```

---

## Ficheiros a modificar

| Ficheiro | Tipo de alteracao |
|----------|-------------------|
| `imersao-tools/comunidade/todolist.html` | Ajustes de conteudo e visual por fase |
| `imersao-tools/comunidade/dashboard.html` | JA FEITO — navbar abre todolist noutra aba |

## Ficheiros que NAO devem ser tocados

```
imersao-tools/comunidade/todolist-cyberpunk.html
imersao-tools/comunidade/todolist-aurora.html
imersao-tools/comunidade/todolist-holographic.html
imersao-tools/comunidade/todolist-neomorphic.html
imersao-tools/comunidade/todolist-brutalist.html
imersao-tools/docs/shards/FASE-*.md (fonte de verdade — so leitura)
imersao-tools/docs/PRD-MAPA-IMERSAO.md (fonte de verdade — so leitura)
```

---

## Design system obrigatorio

| Regra | Valor |
|-------|-------|
| Fundo | #04040A — SEMPRE escuro |
| Glassmorphism | rgba(255,255,255,0.03) + border rgba(255,255,255,0.08) |
| Cyan | #00F5FF — accao primaria |
| Gold | #FFB800 — premium, destaques, sabado |
| Purple | #9D00FF — tecnologia, domingo |
| Magenta | #FF006E — alertas |
| Lime | #39FF14 — sucesso, resultados |
| Font body | Inter |
| Font tech | JetBrains Mono |
| Tom | PT-PT, directo, "construir" nao "aprender" |

---

## Decisoes pendentes do Eurico

| # | Decisao | Impacto |
|---|---------|---------|
| 1 | Adicionar Claude Code a checklist de contas? | Se sim, +2 items na checklist (instalar + testar) |
| 2 | Data confirmada 12-13 Abril? | Callout com data na pagina |
| 3 | Sidebar do dashboard: manter view interna de "Imersao" ou eliminar? | A navbar ja abre noutra aba, sidebar pode conflitar |

---

## Instrucao para o proximo terminal

```
Le o handoff em imersao-tools/docs/HANDOFF-AJUSTES-FASES-V3.md e executa os ajustes fase a fase.
Fontes de verdade: imersao-tools/docs/shards/FASE-0 a FASE-7.md
Ficheiro a modificar: imersao-tools/comunidade/todolist.html
```

---

## Fontes de verdade

| Documento | Path |
|-----------|------|
| PRD Mapa Imersao | imersao-tools/docs/PRD-MAPA-IMERSAO.md |
| Fase 0 | imersao-tools/docs/shards/FASE-0-PRE-IMERSAO.md |
| Fase 1 | imersao-tools/docs/shards/FASE-1-ABERTURA.md |
| Fase 2 | imersao-tools/docs/shards/FASE-2-EXERCICIO-GUIADO.md |
| Fase 3 | imersao-tools/docs/shards/FASE-3-PROJECTO-REAL.md |
| Fase 4 | imersao-tools/docs/shards/FASE-4-PONTO-SOCORRO-1.md |
| Fase 5 | imersao-tools/docs/shards/FASE-5-REFINAMENTO.md |
| Fase 6 | imersao-tools/docs/shards/FASE-6-DEPLOY-FINAL.md |
| Fase 7 | imersao-tools/docs/shards/FASE-7-FECHO.md |
| Design system | .claude/rules/design-system-ia-avancada.md |
| Brandbook | .claude/rules/brandbook.md |
| Handoff V2 (anterior) | imersao-tools/docs/HANDOFF-TODOLIST-GUIA-IMERSAO-V2.md |

---

*Handoff V3 criado em 04/04/2026. Cobre ajustes fase-a-fase com PRD individual por fase.*
