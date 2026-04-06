# HANDOFF — Consolidacao Marketplace | 26/03/2026

## CONTEXTO

Sessao com @architect (Aria). O Eurico identificou que o marketplace estava espalhado em 3 locais diferentes e sem PRD que reflicta a realidade. Esta sessao consolidou tudo numa pasta unica e iniciou o levantamento para o Eurico criar os PRDs.

**Sessao anterior:** `HANDOFF_25032026_SQUADMARKET_PIVOT.md`

---

## 1. O QUE FOI FEITO

### 1.1 Consolidacao de ficheiros

Criada pasta unica `imersao-tools/marketplace/` com 3 subdirectorios:

```
marketplace/
├── pages/       ← 5 HTMLs (copiados de comunidade/)
├── docs/        ← PRD, ARCH, migration SQL (copiados de docs/)
└── packages/    ← 12 squads AIOX + 1 clone Hormozi (copiados de docs/squad-packages/)
```

**Ficheiros originais mantidos nos locais antigos** (copia, nao move). Eliminar apos PRDs aprovados.

### 1.2 Levantamento para PRDs

O Eurico quer criar 3 PRDs ele proprio. Respostas recolhidas:

| Pergunta | Resposta do Eurico |
|----------|-------------------|
| Tipos de produtos | Squads, clones e outros (por definir) |
| Quem vende | Apenas Eurico / equipa [IA]AVANCADA PT |
| 12 squads AIOX | Gratuitos (confirmado) |
| Pagamentos | Stripe, precos terminam em 8 (mas so depois do basico funcionar) |
| Gamificacao N1-N4 | DESCARTADA — foi inventada pelo Morgan sem aprovacao |
| Marketplace onde | Seccao dentro da comunidade (sidebar do dashboard) |
| Clones adicionais | Apenas Hormozi, sem mais clones por agora |
| Hormozi testado PT | Sim, precisa de melhorias mas nao e prioridade |
| Problema real | Nao era o clone nem o marketplace — era a desorganizacao total descoberta ao criar o guia de instalacao |

### 1.3 PRDs a criar pelo Eurico

| PRD | Ambito | Estado |
|-----|--------|--------|
| PRD-MARKETPLACE | O contentor principal (o que e, como funciona) | Eurico vai criar em novo terminal |
| PRD-SQUADS | Os 12 squads AIOX gratuitos | Eurico vai criar separadamente |
| PRD-CLONES | Clone Hormozi (unico por agora) | Eurico vai criar separadamente |

### 1.4 Regras de governance

O Eurico quer regras para que os agentes consultem os PRDs antes de fazer qualquer coisa — para evitar repeticao do incidente de 23/03 (dados ficticios, decisoes sem aprovacao).

---

## 2. DECISOES CRITICAS

| Decisao | Detalhe | Aprovado por |
|---------|---------|-------------|
| PRD-SQUADMARKET.md e DEPRECATED | Substituido pelos 3 PRDs novos | Eurico |
| Gamificacao XP/N1-N4 descartada | Inventada pelo Morgan sem aprovacao | Eurico |
| Apenas 1 clone (Hormozi) | Sem mais clones por agora | Eurico |
| Eurico cria os PRDs | Agentes NAO criam PRDs — fazem perguntas e o Eurico responde | Eurico |
| Pagamentos depois do basico | Stripe so apos o marketplace funcionar minimamente | Eurico |

---

## 3. FICHEIROS CRIADOS/MODIFICADOS

| Ficheiro | Accao |
|----------|-------|
| `imersao-tools/marketplace/` | Pasta criada |
| `imersao-tools/marketplace/pages/*.html` | 5 HTMLs copiados |
| `imersao-tools/marketplace/docs/*` | PRD, ARCH, SQL copiados |
| `imersao-tools/marketplace/packages/*` | 13 packages copiados |

---

## 4. PROXIMA SESSAO

| # | Tarefa | Terminal | Detalhe |
|---|--------|---------|---------|
| 1 | Eurico cria PRD-MARKETPLACE | Novo terminal em `marketplace/` | Agente faz perguntas, Eurico responde |
| 2 | Eurico cria PRD-SQUADS | Novo terminal | Separado do marketplace |
| 3 | Eurico cria PRD-CLONES | Novo terminal | Separado do marketplace |
| 4 | Criar regras de governance | Apos PRDs | Rules em `.claude/rules/` para agentes consultarem PRDs |

---

## 5. DIRECTORIO DE TRABALHO

```
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\marketplace
```

---

## 6. AVISO PARA QUALQUER AGENTE

- NAO criar PRDs — o Eurico cria
- NAO inventar dados, precos ou decisoes
- NAO assumir gamificacao (foi descartada)
- CONSULTAR este handoff antes de fazer qualquer coisa no marketplace
- SE NAO SABES, PERGUNTA — nunca inventes
