# PRD — DevOps Quality Gates

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

DevOps + QA com skills de revisao automatica. Garante qualidade antes de cada deploy.

---

## 2. O que inclui

### Agentes (2)

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @devops (Gage) | `@devops` | CI/CD, push, deploy |
| @qa (Quinn) | `@qa` | Quality gates, testes |

### Skills (2)

| Skill | Comando | O que faz |
|-------|---------|-----------|
| CodeRabbit Review | `/coderabbit-review` | Revisao automatica de codigo |
| Checklist Runner | `/checklist-runner` | Execucao de checklists de qualidade |

### Workflow

Codigo pronto → `@qa` revisa → `/coderabbit-review` valida → `@devops` faz deploy

---

## 3. Para quem e

Quem precisa de garantir qualidade no codigo antes de fazer deploy — revisao automatica, testes, quality gates.

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
@qa
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @qa
> Revisa o codigo que acabei de escrever
> /coderabbit-review
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
