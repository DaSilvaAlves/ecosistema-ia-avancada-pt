---
paths:
  - "imersao-tools/nexus/**"
  - "**/docs/stories/**"
description: "Identificadores que cruzam contratos externos validam-se no draft da story"
---

# External Contract Identifiers — Regra Obrigatória

## Origem

Incidente Nexus v2 Story 3.11 (Tools cérebro finanças, DEV-DECISION D-NAMES, 28/05/2026). O PRD §6.3 (FR23) e o `EPIC-3.md` §4 listavam os nomes das tools com cedilha — `criar_finança_variavel`, `consultar_balanço`. Mas o `TOOL_NAME_PATTERN` do Tool Registry e a tool spec da Anthropic **rejeitam caracteres não-ASCII** em nomes de tools. A divergência só foi descoberta na implementação: `@dev` sinalizou (`FLAG @architect`), `@architect` (Aria) ratificou a DEV-DECISION D-NAMES (nomes ASCII `criar_financa_variavel`, `consultar_balanco`), e os AC1/AC5/AC6 da story tiveram de ser reconciliados (cedilha → ASCII) na CR Iter 1. O mapeamento semântico PT-PT ("balanço" → `consultar_balanco`) passou a viver no LLM (DEV-DECISION D-FUZZY).

O PRD/EPIC tinha identificadores inválidos desde o início. O re-trabalho de reconciliação de AC teria sido evitado se os nomes tivessem sido validados contra o contrato externo **no draft da story**, não na implementação — havia precedente (Story 2.10 já tinha registado tools no registry).

## Princípio

**Quando uma story especifica um identificador que tem de cruzar um contrato externo, o contrato externo prevalece sobre a grafia do PRD — e essa validação faz-se no draft, não na implementação.** Um identificador inválido no PRD que sobrevive até ao código gera reconciliação de AC a meio da story e custa iterações CodeRabbit.

## Âmbito — Identificadores que cruzam contratos externos

| Tipo de identificador | Contrato externo | Restrição típica |
|-----------------------|------------------|------------------|
| Nome de tool / function | Tool Registry `TOOL_NAME_PATTERN`, Anthropic tool spec, OpenAI function spec | Só ASCII `[a-z0-9_]`, sem acentos/cedilha, comprimento máximo |
| Nome de campo de API / payload | Schema REST/GraphQL, OpenAPI spec do provider | snake_case ou camelCase fixo, sem caracteres especiais |
| Valor de enum / código | Spec externa, base de dados de terceiros | Conjunto fechado de valores válidos |
| Chave de evento / webhook | Contrato do provider (Stripe, OAuth, etc.) | Nomes reservados, formato fixo |
| Identificador de rota / slug | Convenção de routing, constraints de URL | Sem espaços, caracteres URL-safe |

## Obrigação no Draft da Story

Uma story que introduz ou altera um identificador da tabela acima **deve**, na fase de draft (`@sm`) ou validação (`@po`):

1. **Identificar** o contrato externo aplicável (registry pattern, spec do provider, schema)
2. **Validar** o identificador proposto contra esse contrato — não assumir que a grafia do PRD é válida
3. Se o identificador do PRD violar o contrato, **registar a forma válida na story** (com nota de que o contrato externo prevalece) antes de a story chegar a `@dev`
4. Se a grafia "humana" (PT-PT, com acentos) for relevante para a experiência, separar explicitamente: o **identificador técnico** segue o contrato; o **mapeamento semântico** vive na camada que o suporta (LLM, i18n, label) — como na DEV-DECISION D-FUZZY da 3.11

## Aplicação no Gate

| Quem | Responsabilidade |
|------|------------------|
| `@sm` | No draft de story que introduz tools/identificadores externos, valida-os contra o contrato antes de marcar Ready-for-validation |
| `@po` | Na validação (10-point checklist, ponto 3 "testable AC" + ponto 10 "alignment"), rejeita AC que dependam de identificadores não validados contra o contrato externo |
| `@dev` | Se encontrar um identificador inválido não detectado no draft, sinaliza (`FLAG @architect`) em vez de o corrigir silenciosamente — a correcção é ratificada e os AC reconciliados |
| `@architect` | Ratifica a forma válida do identificador quando o contrato externo se impõe ao PRD |

## Anti-Padrões Proibidos

| Anti-padrão | Porquê é proibido |
|-------------|-------------------|
| Copiar para a story o identificador do PRD sem o validar contra o contrato externo | É o erro da 3.11 — nomes com cedilha que o registry rejeita, descoberto só no código |
| `@dev` corrigir o identificador silenciosamente sem sinalizar | A correcção muda AC — tem de ser ratificada por `@architect` e os AC reconciliados de forma rastreável |
| Forçar a grafia "humana" no identificador técnico | O contrato externo prevalece; a grafia humana vive na camada semântica (LLM/i18n/label) |

## Aplicação Universal

Aplica-se a todas as stories que tocam tools, integrações, APIs externas ou contratos de terceiros — relevante em especial para o Epic 6 (OAuth/integrações). Agentes abrangidos: `@sm`, `@po`, `@dev`, `@architect`, `@pm`, e qualquer skill ou squad externo. Sem excepções.

---

*Origem: Retrospectiva Epic 3 Nexus v2, acção A4. Criada por Orion (`@aiox-master`) em 29/05/2026.*
