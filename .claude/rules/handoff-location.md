# HANDOFF LOCATION — REGRA OBRIGATÓRIA INEGOCIÁVEL

## ATENÇÃO — ESTA REGRA TEM DE SER LIDA ANTES DE ESCREVER QUALQUER HANDOFF

**TODOS OS AGENTES DEVEM LER ESTA REGRA ANTES DE CRIAR QUALQUER FICHEIRO `RETOMA-*.md`, `handoff-*.md` OU DOCUMENTO DE PASSAGEM DE CONTEXTO. NÃO HÁ EXCEPÇÕES. NÃO HÁ DESCULPAS.**

---

## Origem

Incidente recorrente 11/04/2026 — handoffs de projectos diferentes foram despejados na pasta `cartao-visita/research/` só porque era o directório de trabalho inicial da sessão. Resultado: pasta `research/` com 16 ficheiros de 3 projectos diferentes, impossível de navegar, handoffs perdidos, contexto confuso. Eurico perdeu horas e ficou extremamente frustrado. ESTE ERRO NUNCA MAIS PODE ACONTECER.

---

## REGRA PRINCIPAL (INEGOCIÁVEL)

**Cada handoff DEVE viver dentro da pasta do projecto a que se refere.** O directório de trabalho actual da sessão (`cwd`) é IRRELEVANTE para decidir onde guardar o handoff. O que conta é o PROJECTO a que o handoff se refere — não onde a sessão calhou começar.

---

## LOCALIZAÇÃO OBRIGATÓRIA POR TIPO DE PROJECTO

| Projecto | Localização do handoff |
|----------|------------------------|
| Projecto dentro de `imersao-tools/comunidade/{projecto}/` | `imersao-tools/comunidade/{projecto}/docs/RETOMA-*.md` |
| Projecto standalone em `imersao-tools/{projecto}/` | `imersao-tools/{projecto}/docs/RETOMA-*.md` |
| Research / market analysis SEM projecto associado | `imersao-tools/comunidade/cartao-visita/research/` (única pasta legítima para research geral) |
| Trabalho no AIOX core | `docs/handoffs/RETOMA-*.md` |

---

## CONVENÇÃO DE NOMENCLATURA OBRIGATÓRIA

| Formato | Exemplo | Uso |
|---------|---------|-----|
| `RETOMA-COMPLETO.md` | `guia-ai-act/docs/RETOMA-COMPLETO.md` | Handoff final de projecto concluído |
| `RETOMA-FASE{N}.md` | `guia-ai-act/docs/RETOMA-FASE3.md` | Handoff intermédio de fase em curso |
| `handoff-fase{N}-OBSOLETO.md` | `guia-ai-act/docs/handoff-fase2-OBSOLETO.md` | Handoff antigo mantido para histórico |

---

## ESTRUTURA OBRIGATÓRIA DE TODOS OS HANDOFFS

**TODOS os handoffs DEVEM obrigatoriamente ter esta estrutura nos seguintes pontos:**

### NO INÍCIO DO HANDOFF (primeira linha após o título)

```
> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.
```

### NO MEIO DO HANDOFF (entre secções importantes, a meio do documento)

```
---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `{caminho}`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---
```

### NO FIM DO HANDOFF (última secção antes do fecho)

```
---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `{nome do projecto}`
- LOCALIZAÇÃO CORRECTA: `{caminho correcto}`
- LOCALIZAÇÃO ACTUAL: `{caminho onde o ficheiro está}`
- COINCIDEM? `SIM` / `NÃO`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `{nome do agente}`
DATA: `{DD/MM/AAAA}`
```

---

## PROCESSO OBRIGATÓRIO ANTES DE CRIAR UM HANDOFF

Antes de escrever qualquer ficheiro de handoff, o agente DEVE executar estes passos em ordem:

1. **CONSULTAR ESTA REGRA** (`.claude/rules/handoff-location.md`) — leitura completa
2. **IDENTIFICAR O PROJECTO** a que o handoff se refere — lendo o conteúdo do handoff, não adivinhando pelo `cwd`
3. **LOCALIZAR A PASTA DO PROJECTO** no sistema de ficheiros
4. **CRIAR SUBPASTA `docs/`** dentro da pasta do projecto se não existir
5. **ESCREVER O HANDOFF** dentro de `{projecto}/docs/` — NUNCA noutro sítio
6. **INCLUIR OS 3 BLOCOS OBRIGATÓRIOS** (início / meio / fim) definidos acima
7. **VALIDAR COM O SELF-CHECK NO FIM** que a localização está correcta

---

## ANTI-PADRÕES ABSOLUTAMENTE PROIBIDOS

| Anti-padrão | Razão pela qual é proibido |
|-------------|---------------------------|
| Guardar handoff de projecto X em pasta de projecto Y | Causa confusão e perda de contexto |
| Guardar handoff no `cwd` sem validar se é o sítio certo | O `cwd` é onde a sessão começou, não necessariamente o sítio certo |
| Usar `cartao-visita/research/` como catch-all para handoffs | `research/` é para pesquisa de mercado geral, NÃO para handoffs de projectos |
| Handoffs na raiz do projecto (`{projecto}/RETOMA-*.md`) | Polui a raiz — SEMPRE em `{projecto}/docs/` |
| Nomes inconsistentes (RETOMA, retoma, HANDOFF, handoff) | SEMPRE `RETOMA-*.md` em maiúsculas com kebab-case |
| Criar handoff sem os 3 blocos obrigatórios (início/meio/fim) | Viola a estrutura desta regra |
| Criar handoff sem consultar esta regra primeiro | Viola o processo obrigatório |

---

## CONSEQUÊNCIA DE VIOLAÇÃO

Qualquer agente que viole esta regra DEVE:

1. Parar imediatamente
2. Mover o handoff para a localização correcta com `git mv`
3. Actualizar os 3 blocos (início/meio/fim) com o caminho correcto
4. Fazer commit explicando a correcção
5. Não repetir o erro

---

## APLICAÇÃO UNIVERSAL

Esta regra é **INEGOCIÁVEL** e aplica-se a TODOS os agentes sem excepção:

- @dev, @qa, @sm, @po, @pm, @architect, @ux-design-expert, @analyst, @data-engineer, @devops, @monster, @aiox-master
- Todos os agentes de squads externos (design-system, marketing, legal, copy, etc.)
- Todas as skills (autopilot, ralph, ultrawork, etc.)
- Todas as invocações directas ou via Task tool

**NÃO HÁ EXCEPÇÕES. NÃO HÁ DESCULPAS. ESTA REGRA TEM DE SER SEGUIDA SEMPRE.**
