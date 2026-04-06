# PRD — Funnel Conversion Squad

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

3 skills focadas em conversao: analise de funil, optimizacao de landing pages e intelligence competitiva.

---

## 2. O que inclui

| Skill | Comando | O que faz |
|-------|---------|-----------|
| Funil | `/market-funnel` | Analise de conversao, friction points, optimizacao por etapa |
| Landing | `/market-landing` | CRO analysis, melhorias de copy e layout |
| Competidores | `/market-competitors` | Analise competitiva, positioning gaps |

---

## 3. Para quem e

Quem tem um funil de vendas e quer optimizar conversao — desde a landing page ate ao checkout.

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

Extrai o ZIP para a pasta raiz do teu projecto. Os ficheiros ficam em `.claude/skills/` automaticamente.

### Passo 3 — Abrir terminal

Abre o terminal na pasta do teu projecto.

### Passo 4 — Iniciar Claude Code

```
claude
```

### Passo 5 — Activar

```
/market-funnel
```

---

## 6. Exemplo pratico

```
$ claude
> /market-funnel
> Analisa o funil da minha landing page: https://meusite.pt/pricing
> /market-landing
> Sugere melhorias de CRO para a mesma pagina
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
