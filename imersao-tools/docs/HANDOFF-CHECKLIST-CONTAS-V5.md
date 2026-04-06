# HANDOFF — Checklist completa de contas e ferramentas (V5)

> Data: 04/04/2026
> Autor: Uma (UX) + Eurico
> Estado: COMMITADO NO SUBMODULE (aguarda push)
> Commit: 7f1e973
> Ficheiro alterado: imersao-tools/comunidade/todolist.html
> URL producao: https://comunidade.avancada.expressia.pt/todolist.html

---

## Contexto

A seccao "Preparacao Obrigatoria" do todolist.html so tinha 5 items (GitHub, Vercel, Groq, Node.js, Git). Com as alteracoes das Fases 2 e 3 (eliminacao do pipeline, introducao de Claude Code, Gemini CLI e Antigravity), faltavam contas e ferramentas criticas. Os membros chegariam ao dia da imersao sem as ferramentas necessarias para a Fase 3.

---

## O que mudou — resumo

| Metrica | Antes | Depois |
|---------|-------|--------|
| Total de items na checklist | 5 | 11 |
| Grupos organizados | 0 (lista plana) | 5 |
| Tempo estimado | "15 minutos" | "40-50 minutos" |
| Ferramentas de construcao | 0 | 3 (Antigravity, Claude Code, Gemini CLI) |
| Ferramentas de pesquisa | 0 | 2 (Perplexity, ChatGPT) |
| API Keys | 1 (Groq) | 2 (Google AI Studio, Groq) |

---

## Alteracoes realizadas — registo completo

### Intro da seccao

| Linha | Antes | Depois |
|-------|-------|--------|
| 697 | "Demora 15 minutos no total" | "Reserva 40-50 minutos para fazer tudo com calma" |

### Reorganizacao da estrutura

A lista plana foi reorganizada em 5 grupos com sub-headers visuais em JetBrains Mono cyan:

| Grupo | Items | Novo/Existente |
|-------|-------|----------------|
| Instalar no computador | Node.js, Git, Antigravity | Node.js e Git movidos para cima; Antigravity NOVO |
| Criar contas | GitHub, Vercel | Existentes, mantidos |
| API Keys | Google AI Studio, Groq | Google AI Studio NOVO; Groq REESCRITO |
| Ferramentas de construcao | Claude Code, Gemini CLI | Ambos NOVOS |
| Ferramentas de pesquisa | Perplexity, ChatGPT | Ambos NOVOS |

### 6 items novos adicionados

#### 1. Antigravity (check-antigravity)

| Campo | Valor |
|-------|-------|
| Nome | Antigravity — o teu IDE com IA integrada (salva-vidas) |
| URL | antigravity.google |
| Login | Conta Google |
| Tipo | Download de app desktop (Windows/macOS/Linux) |
| Icone | &#x2726; (estrela) |
| Passos | 6 (download, instalar, login Google, explicacao, destaque salva-vidas) |
| Destaque | Passo 06 em gold: "Este e o teu salva-vidas" |

#### 2. Google AI Studio (check-googleai)

| Campo | Valor |
|-------|-------|
| Nome | Google AI Studio — chave para ferramentas Google |
| URL | aistudio.google.com/apikey |
| Login | Conta Google (mesma do Antigravity) |
| Output | API Key gratuita |
| Icone | &#x25C7; (losango) |
| Passos | 5 (abrir, login, criar key, guardar, explicacao) |
| Nota | Chave usada pelo Gemini CLI |

#### 3. Claude Code (check-claudecode)

| Campo | Valor |
|-------|-------|
| Nome | Claude Code — a ferramenta principal de construcao |
| Instalacao | `npm install -g @anthropic-ai/claude-code` |
| Login | claude.ai (conta Google ou email) |
| Icone | &#x25A3; (quadrado com pontos) |
| Passos | 6 (terminal, npm install, esperar, claude, login, explicacao) |
| Dependencia | Node.js (deve estar instalado antes) |

#### 4. Gemini CLI (check-geminicli)

| Campo | Valor |
|-------|-------|
| Nome | Gemini CLI — alternativa de construcao Google |
| Instalacao | `npm install -g @anthropic-ai/gemini-cli` (comando pode mudar — Eurico confirma) |
| Auth | API Key do Google AI Studio |
| Icone | &#x25C6; (losango cheio) |
| Passos | 4 (terminal, npm install, API key, explicacao) |
| Dependencia | Node.js + Google AI Studio API Key |

#### 5. Perplexity (check-perplexity)

| Campo | Valor |
|-------|-------|
| Nome | Perplexity — pesquisa com IA |
| URL | perplexity.ai |
| Login | Conta Google ou email |
| Icone | &#x25CC; (circulo pontilhado) |
| Passos | 3 (abrir, signup, explicacao) |
| Uso na imersao | Fase 3 — pesquisar sobre o projecto |

#### 6. ChatGPT (check-chatgpt)

| Campo | Valor |
|-------|-------|
| Nome | ChatGPT — assistente de pesquisa |
| URL | chatgpt.com |
| Login | Conta Google, Apple ou email |
| Icone | &#x25CB; (circulo) |
| Passos | 4 (abrir, signup, plano gratis, explicacao) |
| Uso na imersao | Fase 3 — refinar ideias e pesquisa |

### Items existentes alterados

#### Groq (reescrito)

| Campo | Antes | Depois |
|-------|-------|--------|
| Nome | "Groq API — a IA que gera o codigo (gratis)" | "Groq — IA ultra-rapida para os teus projectos (gratis)" |
| Passo 06 | "Esta chave e o que permite ao nosso compilador gerar codigo. Sem ela, nao funciona" | "O Groq e uma das APIs de IA mais rapidas do mundo. Podes usa-la no teu projecto para adicionar inteligencia artificial" |
| Razao | Referencia ao AIOS Compiler eliminado | Texto generico sobre utilidade da API |

### Seccao "No dia" actualizada

| Campo | Antes | Depois |
|-------|-------|--------|
| Contas | "GitHub, Vercel, Groq, Node.js e Git instalados" | "Toda a checklist acima completa — contas, instalacoes e API keys" |
| API Keys | "API Key da Groq guardada" | "API Keys guardadas — Google AI Studio e Groq" |

### JavaScript actualizado

| Campo | Antes | Depois |
|-------|-------|--------|
| CHECKS array | `['github','vercel','groq','nodejs','git']` | `['nodejs','git','antigravity','github','vercel','googleai','groq','claudecode','geminicli','perplexity','chatgpt']` |

---

## Ordem logica dos 11 items (e porquê)

| # | Item | Razao da posicao |
|---|------|-----------------|
| 1 | Node.js | Runtime — outros tools dependem dele (Claude Code, Gemini CLI) |
| 2 | Git | Controlo de versoes — GitHub depende dele |
| 3 | Antigravity | IDE principal — salva-vidas, download pesado, fazer primeiro |
| 4 | GitHub | Conta — precisa de Git instalado |
| 5 | Vercel | Conta — precisa de GitHub |
| 6 | Google AI Studio | API Key — precisa de conta Google (ja tem do Antigravity) |
| 7 | Groq | API Key — independente |
| 8 | Claude Code | CLI — precisa de Node.js + conta claude.ai |
| 9 | Gemini CLI | CLI — precisa de Node.js + API Key Google AI Studio |
| 10 | Perplexity | Pesquisa — independente |
| 11 | ChatGPT | Pesquisa — independente |

---

## Mapeamento item → fase da imersao

| Item | Fase 2 (manha) | Fase 3 (tarde) | Fase 4-7 |
|------|----------------|----------------|----------|
| Node.js | SIM (base) | SIM (CLI tools) | SIM |
| Git | SIM (base) | SIM (commits) | SIM |
| Antigravity | — | SIM (IDE principal, salva-vidas) | SIM |
| GitHub | SIM (contas) | SIM (repos) | SIM |
| Vercel | — | SIM (deploy) | SIM |
| Google AI Studio | — | SIM (Gemini CLI) | — |
| Groq | — | SIM (API no projecto) | — |
| Claude Code | — | SIM (construcao) | SIM |
| Gemini CLI | — | SIM (alternativa) | SIM |
| Perplexity | — | SIM (pesquisa) | — |
| ChatGPT | — | SIM (pesquisa) | — |

---

## O que NAO foi alterado

- Templates To-Do List (cyberpunk, aurora, etc.) — intocados
- Schedule das fases — intocado (ja actualizado no commit 39f05a0)
- CSS/design system — intocado
- Seccao "O que levar" — so os 2 campos actualizados acima
- Callout de ajuda do WhatsApp — mantido
- Funcionalidade de localStorage (checkbox persistence) — mantida, expandida para 11 items

---

## Pontos de atencao

| # | Ponto | Impacto | Accao |
|---|-------|---------|-------|
| 1 | Comando Gemini CLI (`npm install -g @anthropic-ai/gemini-cli`) pode nao ser o correcto | Membro pode ter erro na instalacao | Eurico confirma o comando exacto antes da imersao ou no dia |
| 2 | localStorage dos membros que ja visitaram a pagina | Checkboxes dos 5 items antigos continuam guardadas, novos items aparecem desmarcados | Sem impacto — funciona correctamente |
| 3 | Antigravity requer download pesado (~500MB+) | Membros com internet lenta podem demorar | Fazer com antecedencia, nao no dia |
| 4 | Claude Code precisa de conta claude.ai | Plano gratuito pode ter limites | Eurico orienta no dia se necessario |
| 5 | Pagina ainda nao esta em producao | Commit feito no submodule, falta push + actualizar referencia no repo pai | Delegar a @devops |

---

## Proximo passo

Para ir para producao:
1. Push do submodule: `cd imersao-tools/comunidade && git push`
2. Actualizar referencia no repo pai: `cd ../.. && git add imersao-tools/comunidade && git commit`
3. Push do repo pai

---

*Handoff V5 criado em 04/04/2026. Checklist expandida de 5 para 11 items. Todas as ferramentas da imersao cobertas.*
