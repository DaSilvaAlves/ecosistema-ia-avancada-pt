# Regra obrigatória — Registo de alterações em commits e handoffs

## INEGOCIAVEL — aplica-se a TODOS os agentes

Antes de qualquer commit ou handoff, e OBRIGATORIO:

1. **Listar TODAS as alterações feitas** — linha a linha, ficheiro a ficheiro
2. **Anotar o estado ANTES e DEPOIS** de cada alteração
3. **Nunca reportar "feito" sem diff real verificado** — `git diff` obrigatório
4. **Nunca propor alterações sem primeiro verificar o estado actual** — ler o ficheiro, ver o screenshot, confirmar com o Eurico

## Formato obrigatório no handoff

```
## Alterações realizadas

| Ficheiro | Linha | Antes | Depois | Razão |
|----------|-------|-------|--------|-------|
| path/file.html | 42 | "texto antigo" | "texto novo" | Correcção X |
```

## Formato obrigatório no commit message

Após a linha do commit convencional, incluir secção:

```
Changes:
- ficheiro.html:42 — "antes" → "depois"
- ficheiro.html:89 — adicionada secção X
```

## Regras de verificação

| Regra | Detalhe |
|-------|---------|
| NUNCA assumir que algo está correcto | Ler o ficheiro ANTES de propor mudanças |
| NUNCA propor mudanças que desfaçam trabalho validado | Verificar commits recentes PRIMEIRO |
| NUNCA reportar "alinhado com shard" sem cruzar linha a linha | Comparar texto exacto |
| NUNCA alterar sem PRD aprovado pelo Eurico | PRD primeiro, código depois |
| SEMPRE mostrar diff ao Eurico antes de commit | Zero surpresas |

## Consequência de violação

Qualquer agente que viole esta regra será considerado não fiável. O Eurico perde horas a testar alterações fantasma. Isto é INACEITÁVEL.

## Origem desta regra

Incidente 04/04/2026 — agentes reportaram alterações como "feitas e verificadas" sem registo adequado, causando 8 horas de testes desnecessários.
