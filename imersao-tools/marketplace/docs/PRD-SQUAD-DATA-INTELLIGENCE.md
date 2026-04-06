# PRD — Data Intelligence Squad

**Versao:** 1.0
**Data:** 26/03/2026
**Autor:** Eurico (via @architect)
**Estado:** RASCUNHO
**Categoria:** Squads AIOX
**Preco:** Gratuito

---

## 1. O que e

3 especialistas em dados: orquestracao, engenharia de dados e analise. Para quem trabalha com dados e precisa de inteligencia aplicada.

---

## 2. O que inclui

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| Data Chief | `@data-chief` | Orquestracao de data intelligence |
| @data-engineer (Dara) | `@data-engineer` | Schema, migrations, RLS, queries |
| @analyst (Alex) | `@analyst` | Pesquisa, analise de mercado, investigacao |

---

## 3. Para quem e

Quem precisa de analisar dados, desenhar schemas, optimizar queries e tomar decisoes baseadas em dados reais.

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
@data-chief
*help
```

---

## 6. Exemplo pratico

```
$ claude
> @data-engineer
> Desenha o schema para um sistema de reservas de restaurante com Supabase
> *db-domain-modeling
```

---

## 7. Governance

- Este PRD e a fonte de verdade para este produto
- Qualquer alteracao requer aprovacao do Eurico
- Agentes DEVEM consultar este PRD antes de modificar o produto

---

*PRD v1.0 — Rascunho para aprovacao*
