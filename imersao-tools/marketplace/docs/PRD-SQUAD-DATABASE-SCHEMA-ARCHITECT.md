# PRD — Database Schema Architect

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

Especialista em design de base de dados: schema, migrations, RLS, query optimization. Focado exclusivamente em base de dados.

---

## 2. O que inclui

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| @data-engineer (Dara) | `@data-engineer` | Schema design, migrations, RLS, performance |
| DB Sage | `@db-sage` | Consultor de base de dados, boas praticas |

---

## 3. Para quem e

Quem precisa de desenhar ou optimizar bases de dados — schemas, politicas RLS, migrations, indices.

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
@data-engineer
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @data-engineer
> Preciso de RLS policies para um sistema multi-tenant em Supabase
> *db-domain-modeling
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
