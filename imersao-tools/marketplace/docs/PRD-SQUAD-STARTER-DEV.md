# PRD — Starter Dev Squad

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

Squad essencial com 3 agentes para iniciar qualquer projecto de software com qualidade desde o primeiro commit.

---

## 2. O que inclui

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @dev (Dex) | `@dev` | Implementacao, debugging, refactoring |
| @qa (Quinn) | `@qa` | Quality gates, testes, revisao de codigo |
| @devops (Gage) | `@devops` | CI/CD, git push, deploy automatizado |

### Workflow

`@dev` implementa → `@qa` revisa → `@devops` faz deploy

---

## 3. Para quem e

Quem esta a comecar um projecto de software e quer uma equipa base para implementar, testar e fazer deploy com qualidade.

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

Extrai o ZIP para a pasta raiz do teu projecto. Os ficheiros ficam em `.claude/agents/` automaticamente.

### Passo 3 — Abrir terminal

Abre o terminal na pasta do teu projecto.

### Passo 4 — Iniciar Claude Code

```
claude
```

### Passo 5 — Activar

```
@dev
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @dev
> Implementa uma API REST para gestao de utilizadores
> *run-tests
> @qa
> Revisa o codigo
> @devops
> *push
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
