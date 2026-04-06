# PRD — Copy Chief Elite (24 Copywriters Lendarios)

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

Orquestra 24 copywriters lendarios com sistema de 3 tiers: diagnostico, execucao e auditoria. Inclui 30 triggers de Joe Sugarman.

---

## 2. O que inclui

### Agente orquestrador

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| Copy Chief | `@copy-chief` | Diagnostico e encaminhamento |

### 24 copywriters especializados

Eugene Schwartz, Robert Collier, Joe Sugarman, Gary Halbert, Dan Kennedy, David Ogilvy, e mais 18 especialistas — cada um com a sua tecnica e area de foco.

### Sistema de tiers

| Tier | Funcao |
|------|--------|
| Tier 0 | Diagnostico — identifica o problema e nivel de awareness |
| Tier 1-3 | Execucao — 24 especialistas por tipo de copy |
| Auditoria Hopkins | Validacao cientifica do resultado |

---

## 3. Para quem e

Quem precisa de copy profissional — headlines, emails, landing pages, anuncios, sales pages — com a tecnica dos melhores copywriters da historia.

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
@copy-chief
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @copy-chief
> Preciso de uma headline para landing page de um SaaS de gestao de restaurantes
> O publico sao donos de restaurantes em Portugal que perdem tempo com tarefas manuais
```

O Copy Chief diagnostica o nivel de awareness, selecciona o copywriter certo e entrega copy pronto.

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
