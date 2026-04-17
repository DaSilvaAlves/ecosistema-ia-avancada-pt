# Membros — Projectos da comunidade

Pasta dedicada aos projectos de **membros da comunidade** que assumimos compromisso de ajudar.

> **Regra obrigatória:** ver `.claude/rules/workspace-governance.md`. Material de membros NUNCA se mistura com projectos próprios em `imersao-tools/`.

---

## Índice de membros

| # | Membro | Projecto | Estado | Pasta | Acolhimento |
|---|--------|----------|--------|-------|-------------|
| 1 | Telmo | FitCoach AI | V1 deployed | `telmo/` | 10/04/2026 |
| 2 | _(vago)_ | _(vago)_ | _(vago)_ | _(vago)_ | _(vago)_ |

---

## Acolher um novo membro

1. Confirmar com `@pm` (autoridade exclusiva para criar pasta de membro)
2. Copiar `_template/` → `{nome-do-membro}/` (kebab-case lowercase)
3. Preencher `{nome-do-membro}/README.md` com dados reais
4. Adicionar linha ao índice acima
5. Começar pelo `00-briefing/` (transcrição da mensagem original ou voice note)

```bash
cp -r membros/_template membros/joao-moreira
# editar membros/joao-moreira/README.md
```

---

## Estrutura padrão de cada membro

```
{nome}/
├── README.md             ← quem é, o que quer, estado actual
├── 00-briefing/          ← mensagens originais, voice notes transcritos
├── 01-pesquisa/          ← research antes de propor (mercado, viabilidade)
├── 02-prd/               ← PRD + relatório técnico (apenas se avançarmos)
├── 03-codigo/            ← código do projecto
├── 04-landing/           ← landing, site, mockups
├── handoffs/             ← TODOS os RETOMA/HANDOFF do membro
└── assets/               ← screenshots, logos, imagens
```

---

## Regras de ouro

| Regra | Detalhe |
|-------|---------|
| R1 | Uma pasta por membro — tudo dentro dela |
| R2 | Nunca material de membro fora desta pasta |
| R3 | Nunca código em `docs/` — vai sempre em `{membro}/03-codigo/` |
| R4 | Handoffs do membro em `{membro}/handoffs/` (não no central) |
| R5 | Acolhimento de novo membro requer aprovação `@pm` |
