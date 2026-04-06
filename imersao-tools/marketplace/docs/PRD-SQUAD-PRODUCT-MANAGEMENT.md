# PRD — Product Management Suite

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

3 agentes para gestao de produto: PM para estrategia, PO para stories e backlog, SM para sprints.

---

## 2. O que inclui

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @pm (Morgan) | `@pm` | PRDs, epics, roadmap, estrategia |
| @po (Pax) | `@po` | Validacao de stories, backlog, priorizacao |
| @sm (River) | `@sm` | Criacao de stories, sprints, ceremonies |

### Workflow

`@pm` define o que → `@sm` cria stories → `@po` valida e prioriza

---

## 3. Para quem e

Quem precisa de gerir um produto — definir requisitos, criar stories, organizar sprints e manter o backlog.

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
@pm
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @pm
> Cria um PRD para um sistema de reservas online
> @sm
> *draft
> @po
> *validate-story-draft
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
