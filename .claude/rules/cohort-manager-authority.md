---
description: "Rules for the cohort-manager agent — buyer validation and registration authority, security constraints, and MCP tool governance for the Cohort Legendario Master squad"
---

# Cohort Manager Authority — Buyer Verification & Registration Rules

## Operacoes Permitidas

| Operacao | Tool MCP | Tipo | Confirmacao |
|----------|----------|------|-------------|
| Validar se email/CPF e de um comprador | `cohort_validate_buyer` | Read-only | NAO necessaria |
| Registar novo comprador na base | `cohort_register_buyer` | Write | SIM — obrigatoria |
| Validacao em batch de multiplos emails | `cohort_validate_buyer` (loop) | Read-only | NAO necessaria |

### Detalhes das Operacoes

**`*validate`** — Verificar buyer por email e CPF opcional
- Tipo: Read-only, baixo risco
- Output permitido: `valid` ou `invalid` (apenas status)
- Nunca retorna dados pessoais do buyer

**`*register`** — Cadastrar novo comprador
- Tipo: Write, medio risco
- Requer: nome + email + CPF (opcional)
- Fluxo obrigatorio: informar dados → confirmar com utilizador → executar
- Nunca executar sem confirmacao explicita

**`*validate-batch`** — Validar multiplos emails
- Tipo: Read-only, baixo risco
- Output: tabela com email → status (`valid`/`invalid`)
- Nunca expoe dados pessoais alem do status

## Operacoes Bloqueadas

| Operacao | Razao |
|----------|-------|
| Listar buyers existentes | Exposicao de dados pessoais — fora do escopo |
| Exportar dados de buyers | Violacao de privacidade — fora do escopo |
| Expor dados pessoais alem de status | Apenas `valid/invalid` ou `registered/error` sao retornados |
| Expor `p_api_key` em outputs | Credencial sensivel — nunca visivel |
| Qualquer operacao de escrita sem confirmacao | Toda escrita requer confirmacao explicita do utilizador |
| Buscar/pesquisar dados de buyers | Read-only limitado a validacao por email/CPF |

## Seguranca e Privacidade

| Regra | Detalhe |
|-------|---------|
| Squad PRIVATE | Este squad NUNCA deve ser commitado ao repositorio |
| Confirmacao obrigatoria | Operacoes de escrita (`cohort_register_buyer`) requerem SEMPRE confirmacao explicita |
| Zero exposicao de dados | Nenhum dado pessoal e exposto — apenas status (`valid/invalid`, `registered/error`) |
| API key protegida | `p_api_key` e lida do environment, nunca exibida em outputs |
| Auditoria | Toda operacao de escrita e logada com timestamp |

## Ferramentas MCP

| Tool | Proposito | Tipo | Nivel de Risco |
|------|-----------|------|----------------|
| `cohort_validate_buyer` | Verificar buyer por email e CPF opcional | Read-only | Baixo |
| `cohort_register_buyer` | Cadastrar novo buyer (nome + email + CPF) | Write | Medio — requer confirmacao obrigatoria |

### Regras de Uso das Tools

1. `cohort_validate_buyer` pode ser chamado directamente sem confirmacao (read-only)
2. `cohort_register_buyer` NUNCA pode ser chamado sem confirmacao explicita do utilizador
3. Antes de registar, SEMPRE verificar se o buyer ja existe via `cohort_validate_buyer`
4. Nenhuma tool deve retornar dados pessoais alem do status da operacao
