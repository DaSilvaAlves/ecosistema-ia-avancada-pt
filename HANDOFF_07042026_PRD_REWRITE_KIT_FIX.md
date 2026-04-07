# HANDOFF — 07/04/2026 — PRD Reescrito + Kit Corrigido + Regras Criadas

> Sessao: Uma (UX) com Eurico
> Commits: `ed1990b`, `3d57b0c`
> Estado: CONCLUIDO — pronto para proxima sessao (projecto demo F3)

---

## O que foi feito nesta sessao

### 1. PRD reescrito do zero (commit `ed1990b`)

**Ficheiro:** `imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md`

O PRD anterior tinha erros criticos: dizia "Sexta 18:00" quando e Sabado 10:00, e usava os blocos ORIGINAI (B1-B7) como fases separadas em vez do programa real do todolist.html.

**PRD novo baseado no todolist.html (live):**

| Fase | Dia | Horario | Conteudo |
|------|-----|---------|----------|
| F1 — Abertura + Perfil | Sabado | 10:00-11:00 | Palestra "Realidade Real" + Student Profiler + arquetipos |
| F2 — Exercicio Guiado | Sabado | 11:00-13:00 | Cartao Visita + To-Do List + setup contas (85 min) |
| ALMOCO | Sabado | 13:00-15:00 | — |
| F3 — Mao na Massa | Sabado | 15:00-19:00 | Projecto real: Briefing → PRD → Construcao → Deploy |
| F4 — Ponto Socorro | Sabado | 22:00-23:30 | Screen-share 1:1, resolver bloqueios (voluntario) |
| F5 — Refinamento | Domingo | 10:00-13:00 | Design + Features + Conteudo real |
| ALMOCO | Domingo | 13:00-15:00 | — |
| F6 — Deploy Final | Domingo | 15:00-16:00 | Ultimos ajustes + deploy + teste cruzado |
| F7 — Fecho + Celebracao | Domingo | 22:00-~23:30 | Showcase (3-5 min cada) + proximos passos |

**Decisao chave do Eurico:** O todolist.html e a fonte da verdade. O conteudo ORIGINAI (M0-M6, Brief, Detalhamento, 7 Pilares) e material de referencia que o Eurico utiliza durante a Fase 3, NAO fases separadas.

### 2. Kit HTML — Agenda tab reescrita (commit `3d57b0c`)

**Ficheiro:** `imersao-tools/docs/originai-kit-imersao.html`

A tab Agenda do kit mostrava os blocos B1-B7 com horarios 18:00-21:00 (ERRADOS). Reescrita com as 7 fases reais (F1-F7) do todolist.html.

As outras tabs do kit (Metodo, LEGO, 7 Pilares, Templates, Prompts, Timer) NAO foram alteradas — continuam como material de referencia ORIGINAI para a F3.

### 3. Datas corrigidas em 3 ficheiros

| Ficheiro | Antes | Depois |
|----------|-------|--------|
| `originai-kit-imersao.html` Dia 1 | "11 Abril (Sexta) \| 18:00 - 21:00" | "11 Abril (Sabado) \| 10:00 - 19:00" |
| `originai-kit-imersao.html` Dia 2 | "12 Abril (Sabado) \| 15:00 - 19:00" | "12 Abril (Domingo) \| 10:00 - 16:00" |
| `roteiro-imersao-11-12-abril.md` Dia 1 | "11 Abril, Sexta" | "11 Abril, Sabado" |
| `roteiro-imersao-11-12-abril.md` Dia 2 | "12 Abril, Sabado" | "12 Abril, Domingo" |

### 4. Regra permanente criada

**Ficheiro:** `.claude/rules/imersao-source-of-truth.md`

Regra inegociavel: antes de QUALQUER trabalho na imersao, o agente DEVE ler `comunidade/todolist.html` primeiro. Se um doc interno contradiz o todolist.html, o doc interno esta ERRADO.

Hierarquia:
1. `comunidade/todolist.html` (LIVE) — horarios, fases, estrutura
2. `imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md` — PRD unificado
3. `docs/conceito-originai.md`, modulos, templates, prompts — material ORIGINAI
4. `docs/roteiro-imersao-11-12-abril.md`, shards/ — OBSOLETOS

### 5. Memoria actualizada

| Ficheiro memoria | Alteracao |
|------------------|----------|
| `feedback_todolist_source_of_truth.md` | CRIADO — regra: ler todolist.html primeiro |
| `project_originai_schedule_conflict.md` | ACTUALIZADO — marcado como RESOLVIDO |
| `project_originai_deliverables.md` | ACTUALIZADO — PRD reescrito, lista de pendentes |
| `MEMORY.md` | ACTUALIZADO — indice reflecte estado actual |

---

## Decisoes do Eurico registadas nesta sessao

| # | Decisao | Citacao/Contexto |
|---|---------|------------------|
| 1 | todolist.html e a fonte da verdade | Eurico nao via conflicto nenhum — o site live era o programa correcto desde o inicio |
| 2 | ORIGINAI e material de referencia, nao programa | Integrado na F3 como metodologia que o Eurico usa no guia 1:1 |
| 3 | Nao ha decisao de formato a tomar | O "conflicto" era um erro interno dos docs, nao uma decisao pendente |

---

## O que ficou por fazer — PROXIMA SESSAO

### PRIORIDADE 1: Projecto demo do Eurico (F3)

O Eurico precisa de um projecto para utilizar como demo ao vivo durante a Fase 3:
- Demonstrar o fluxo Briefing → PRD → Construcao → Deploy
- Mostrar Claude Code, Gemini CLI ou Antigravity em accao
- Projecto real, nao ficticio

**Pergunta para o Eurico:** Qual projecto vais utilizar para as demos?

### PRIORIDADE 2: Verificacao de ferramentas (F3)

| Ferramenta | Estado | Accao |
|------------|--------|-------|
| Claude Code (CLI) | Funcional | Confirmar versao actual |
| Gemini CLI | Por confirmar | Testar disponibilidade e acesso |
| Antigravity (IDE) | Por confirmar | Testar que funciona como salva-vidas |
| Student Profiler | Online (Vercel) | Confirmar URL e funcionamento |
| Cartao de Visita templates | Existem | Confirmar 5+ templates prontos |
| To-Do List (5 estilos) | Existem | Confirmar todos funcionam |

### PRIORIDADE 3: Setup logistico

| Item | Estado |
|------|--------|
| Google Meet — link da sessao | Por criar |
| WhatsApp — grupo com participantes | Por criar |
| Numero de inscritos confirmado | Por confirmar |

### PRIORIDADE 4: Datas no kit HTML (blocos internos)

Os horarios internos dos blocos B1-B7 nas outras tabs do kit (Metodo, LEGO, 7 Pilares) ainda referenciam 18:00, 18:30, etc. Estes sao tempos relativos do conteudo ORIGINAI, nao o schedule publico. Corrigir se o Eurico achar necessario.

---

## Ficheiros criados/modificados nesta sessao

| Ficheiro | Accao | Commit |
|----------|-------|--------|
| `imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md` | REESCRITO do zero | `ed1990b` |
| `imersao-tools/docs/originai-kit-imersao.html` | Agenda tab reescrita + datas corrigidas | `ed1990b` + `3d57b0c` |
| `docs/roteiro-imersao-11-12-abril.md` | Datas corrigidas (Sexta→Sabado, Sabado→Domingo) | `ed1990b` |
| `.claude/rules/imersao-source-of-truth.md` | CRIADO — regra permanente | `ed1990b` |

---

## Regras obrigatorias para a proxima sessao

### REGRA 1: Ler todolist.html PRIMEIRO

Antes de qualquer accao na imersao, ler `imersao-tools/comunidade/todolist.html`. E a pagina LIVE. Se algo contradiz, o doc interno esta errado.

Ficheiro da regra: `.claude/rules/imersao-source-of-truth.md`

### REGRA 2: PRD e o documento unico

`imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md` substitui TODOS os PRDs anteriores. Nunca consultar:
- `PRD-MAPA-IMERSAO.md` (OBSOLETO)
- `PRD-FASE-2.md` (OBSOLETO)
- `PRD-FASE-3.md` (OBSOLETO)
- `docs/shards/` (OBSOLETO)
- `docs/roteiro-imersao-11-12-abril.md` (OBSOLETO — tinha datas erradas)

### REGRA 3: 7 fases, nao 7 blocos

O programa tem 7 FASES (F1-F7), nao 7 blocos ORIGINAI (B1-B7). Os blocos ORIGINAI sao conteudo de referencia para a F3. Nunca misturar as duas estruturas.

### REGRA 4: Horarios correctos

| Dia | Manha | Almoco | Tarde | Noite |
|-----|-------|--------|-------|-------|
| Sabado 11 | 10:00-13:00 (F1+F2) | 13:00-15:00 | 15:00-19:00 (F3) | 22:00-23:30 (F4, vol.) |
| Domingo 12 | 10:00-13:00 (F5) | 13:00-15:00 | 15:00-16:00 (F6) | 22:00-~23:30 (F7) |

### REGRA 5: Consultar memoria

Antes de comecar trabalho na imersao, consultar:
- `memory/project_originai_deliverables.md` — estado dos entregaveis
- `memory/project_originai_source_map.md` — mapa das 39 imagens
- `memory/project_originai_framework.md` — conceito ORIGINAI
- `memory/feedback_todolist_source_of_truth.md` — regra da fonte da verdade

### REGRA 6: Comunidade safety

O ficheiro `comunidade/todolist.html` e codigo de producao. Qualquer alteracao requer teste antes de push. Ver `.claude/rules/comunidade-safety.md`.

### REGRA 7: Design system

Todo conteudo visual segue o design system [IA]AVANCADA PT: fundo `#04040A`, cores do sistema, Inter + JetBrains Mono. Ver `.claude/rules/design-system-ia-avancada.md`.

---

## Contexto para onboarding rapido

Se a proxima sessao comecar com um agente novo:

1. A imersao e dia 11-12 Abril (Sabado+Domingo), 4 dias a partir de hoje
2. O programa completo esta no todolist.html (LIVE) e no PRD
3. O conteudo ORIGINAI (metodologia de clareza antes de execucao) e material de referencia para a F3
4. O kit HTML (`originai-kit-imersao.html`) tem 7 tabs: Agenda (corrigida), Metodo, LEGO, 7 Pilares, Templates, Prompts, Timer
5. O proximo passo e o Eurico decidir qual projecto utiliza como demo na F3

---

*Handoff criado por Uma (UX) em 07/04/2026.*
*Imersao em 4 dias. PRD correcto. Kit corrigido. Regras registadas.*
*Proximo passo: projecto demo do Eurico + verificacao de ferramentas.*
