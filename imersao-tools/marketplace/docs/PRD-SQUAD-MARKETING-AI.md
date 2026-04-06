# PRD — Marketing AI Suite

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

15 skills especializadas que cobrem todo o ciclo de marketing digital — da auditoria inicial ao relatorio final.

---

## 2. O que inclui

| Skill | Comando | O que faz |
|-------|---------|-----------|
| Orquestrador | `/market` | Coordena analise completa com 5 agentes em paralelo |
| Copy | `/market-copy` | Headlines, value props, swipe files |
| Social Media | `/market-social` | Calendario 30 dias, content pillars |
| Emails | `/market-emails` | Sequences de nurture, welcome, launch |
| SEO | `/market-seo` | Auditoria tecnica e on-page |
| Ads | `/market-ads` | Criativos Meta/Google, copy variants |
| Funil | `/market-funnel` | Analise de conversao, friction points |
| Landing | `/market-landing` | CRO analysis, copy improvements |
| Competidores | `/market-competitors` | Intelligence competitiva |
| Brand | `/market-brand` | Voice guidelines, consistencia |
| Launch | `/market-launch` | Playbook go-to-market |
| Proposal | `/market-proposal` | Propostas comerciais, ROI |
| Report | `/market-report` | Relatorios Markdown |
| Report PDF | `/market-report-pdf` | Relatorios PDF client-ready |
| Audit | `/market-audit` | Auditoria completa 6 categorias |

---

## 3. Para quem e

Quem precisa de marketing digital completo — copy, social media, emails, SEO, anuncios, funil, relatorios — tudo num so pacote.

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
/market
```

---

## 6. Exemplo pratico

```
$ claude
> /market-audit
> Faz auditoria completa do marketing do meu restaurante
> /market-social
> Cria calendario de 30 dias para Instagram
> /market-report-pdf
> Gera relatorio PDF com tudo
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
