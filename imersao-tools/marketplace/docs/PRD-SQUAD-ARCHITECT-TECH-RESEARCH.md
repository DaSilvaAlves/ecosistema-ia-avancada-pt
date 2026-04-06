# PRD — Architect & Tech Research

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

2 agentes + 2 skills para arquitectura de sistemas e investigacao tecnologica profunda. Ideal para quem precisa de tomar decisoes tecnicas informadas.

---

## 2. O que inclui

### Agentes (2)

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @architect (Aria) | `@architect` | Arquitectura de sistemas, technology selection |
| @analyst (Alex) | `@analyst` | Deep research, analise de mercado |

### Skills (2)

| Skill | Comando | O que faz |
|-------|---------|-----------|
| Architect First | `/architect-first` | Filosofia architecture-first com checklists |
| Tech Search | `/tech-search` | Investigacao tecnologica profunda com fontes |

### Workflow

`@architect` desenha → `/tech-search` investiga opcoes → `@analyst` analisa trade-offs → decisao informada

---

## 3. Para quem e

Quem precisa de desenhar arquitectura de software e tomar decisoes tecnicas fundamentadas com investigacao real.

---

## 4. Requisitos

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Chave API Anthropic activa (console.anthropic.com)
- Terminal (VS Code, Windows Terminal, iTerm)

---

## 5. Guia de instalacao

### Passo 1 — Descarregar

Clica em "Instalar" na pagina do produto no marketplace.

### Passo 2 — Extrair

Extrai o ZIP para a pasta raiz do teu projecto. Os ficheiros ficam em `.claude/agents/` e `.claude/skills/` automaticamente.

### Passo 3 — Abrir terminal

Abre o terminal na pasta do teu projecto.

### Passo 4 — Iniciar Claude Code

```
claude
```

### Passo 5 — Activar

```
@architect
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @architect
> Desenha a arquitectura para uma API de pagamentos
> /tech-search Stripe vs Paddle vs LemonSqueezy
> @analyst
> Analisa os trade-offs entre as 3 opcoes
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
