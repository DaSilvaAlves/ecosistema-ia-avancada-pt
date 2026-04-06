# PRD — Design System Squad

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

5 especialistas de design system: atomic design, adopcao, processos e geracao de assets visuais com IA.

---

## 2. O que inclui

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| Design Chief | `@design-chief` | Orquestracao e decisoes estrategicas |
| Brad Frost | `@brad-frost` | Atomic design, componentes, documentacao |
| Dan Mall | `@dan-mall` | Adopcao, ROI, stakeholders |
| Dave Malouf | `@dave-malouf` | DesignOps, processos, metricas |
| Nano Banana | `@nano-banana-generator` | Geracao de assets visuais com IA |

### Workflow

`@design-chief` orquestra e delega para o especialista certo conforme a tarefa.

---

## 3. Para quem e

Quem precisa de criar ou manter um design system — tokens, componentes, documentacao, processos de design.

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
@design-chief
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @design-chief
> Preciso de um design system para uma app de e-commerce
> @brad-frost
> Cria os tokens base: cores, tipografia, espacamento
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
