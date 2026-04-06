---
description: "Padrões de língua obrigatórios — PT-PT em todo o ecossistema, termos técnicos em inglês aceites"
---

# Language Standards

## Língua Principal

Português Europeu (PT-PT) é o idioma obrigatório de TODO o ecosistema:
- Documentação (stories, regras, ADRs, guias)
- Outputs de agentes
- Comunicação com utilizadores
- Stories e epics
- Relatórios e análises

## PT-PT vs PT-BR — Diferenças Críticas

| PROIBIDO (PT-BR / informal) | CORRECTO (PT-PT) |
|-----------------------------|------------------|
| usar | utilizar |
| uso | utilização |
| você | tu / o utilizador |
| time (equipa) | equipa |
| deletar | eliminar / apagar |
| printar | imprimir |
| setar | definir / configurar |
| checar | verificar |
| fazer o deploy | fazer o deploy (excepcao tecnica) |
| buildar | compilar / construir |

**PT-BR é PROIBIDO.** Mesmo que o utilizador escreva em PT-BR, os agentes respondem sempre em PT-PT.

## Termos Técnicos em Inglês

Termos técnicos sem equivalente PT-PT natural são aceites em inglês:

`deploy`, `build`, `commit`, `pull request`, `pipeline`, `token`, `endpoint`, `hook`, `skill`, `agent`, `workflow`, `frontend`, `backend`, `stack`, `CLI`, `API`, `MCP`, `PR`, `branch`

**Regra:** termos técnicos NUNCA são traduzidos de forma forçada. Traduções artificiais como "solicitar puxada" para "pull request" são proibidas.

## Formatos de Data e Número

| Formato | Correcto (PT-PT) | Proibido |
|---------|-------------------|----------|
| Data curta | DD/MM/YYYY | MM/DD/YYYY (formato americano) |
| Data longa | DD de Mês de YYYY | Month DD, YYYY |
| Separador decimal | vírgula (`,`) | ponto (`.`) para decimais |
| Separador de milhar | ponto (`.`) ou espaço | vírgula (`,`) para milhares |

**Exemplos:**
- `14/03/2026` (correcto) vs `03/14/2026` (proibido)
- `1.500,00` (correcto) vs `1,500.00` (proibido)

## Títulos e Headers

- Title Case apenas para nomes próprios e nomes de agentes
- Restantes títulos em minúsculas normais do PT-PT
