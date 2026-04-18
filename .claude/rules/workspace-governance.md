# Workspace Governance — Regra Obrigatória Inegociável

## Origem

Incidente 16/04/2026 — Eurico demonstrou que o material do projecto Telmo estava espalhado em 4 lugares físicos (`imersao-tools/docs/teste-telmo/docs/`, `imersao-tools/docs/teste-telmo/fitcoach-ai/`, `imersao-tools/fitcoach-landing/`, handoffs no repo root) e que a chegada do novo membro Moreira ia repetir o mesmo caos. Relatório `C:\Users\XPS\.claude\usage-data\report.html` valida: 28 "Misunderstood Request" + 26 "Wrong Approach" em 19 dias — ambos sintomas de falta de governança formal.

## Princípio Fundamental

**Toda pasta top-level do repo encaixa numa das 6 categorias oficiais. Nada fora. Material de membros NUNCA se mistura com material nosso.**

## Taxonomia Oficial (categorias top-level permitidas)

| Categoria | Path | Conteúdo | Mutabilidade |
|-----------|------|----------|--------------|
| **1. Framework Core** | `.aiox-core/`, `bin/`, `packages/`, `tests/`, `squads/` | Framework AIOX, código, testes | NEVER modify manualmente (segue constitution AIOX) |
| **2. Projectos Próprios** | `imersao-tools/{projecto}/` | Nossos projectos: `comunidade`, `guia-ai-act`, `kit-conformidade`, `cartao-visita`, `marketplace`, `landing-page` | ALWAYS modify |
| **3. Ferramentas Pedagógicas** | `imersao-tools/{ferramenta}/` | Pipeline da imersão: `student-profiler`, `briefing-generator`, `starter-builder`, `prompt-optimizer`, `aios-compiler` | ALWAYS modify (regra `imersao-pipeline-rules.md`) |
| **4. Projectos de Membros** | `membros/{nome}/` | Consultoria a membros da comunidade: Telmo, Moreira, futuros | ALWAYS modify dentro da pasta do membro |
| **5. Documentação Central** | `docs/` | Stories, ADRs, handoffs centrais, campanhas, specs globais | ALWAYS modify |
| **6. Infraestrutura Oculta** | `.git/`, `.claude/`, `.aiox/`, `.github/`, `.husky/`, `node_modules/`, `scripts/` | Config e runtime | Segue regras específicas |

**Proibido top-level:** ficheiros soltos (`HANDOFF_*.md`, `BESTSELLER-*.md`, `GUIA_*.md`), pastas genéricas (`meu-projeto/`, `my-project/`, `artifacts/`, `mega-brain/`), backups manuais (`.backup.*`).

## Estrutura `membros/` — contrato inegociável

```
membros/
├── README.md                       ← índice (nome, estado, link projecto, data acolhimento)
├── _template/                      ← copiar ao receber novo membro
│   ├── README.md                   ← template de quem é / o que quer
│   ├── 00-briefing/                ← mensagens originais, voice notes transcritos
│   ├── 01-pesquisa/                ← research antes de propor (mercado, viabilidade)
│   ├── 02-prd/                     ← PRD + relatório técnico (apenas se avançarmos)
│   ├── 03-codigo/                  ← código do projecto (submodule ou pasta)
│   ├── 04-landing/                 ← landing / site / mockups
│   ├── handoffs/                   ← TODOS os RETOMA/HANDOFF do membro
│   └── assets/                     ← screenshots, logos, imagens
└── {nome-do-membro}/               ← uma pasta por membro
    └── (mesma estrutura de _template)
```

## Regras de aplicação

| Regra | Detalhe | Enforcement |
|-------|---------|-------------|
| **R1. Uma pasta por membro** | `membros/{nome}/` contém TUDO do membro | Validação manual + futura auditoria automática |
| **R2. Nunca material de membro fora de `membros/`** | Código, landings, handoffs, research — tudo dentro | Pre-commit hook (futuro) |
| **R3. Nunca código em `docs/`** | `docs/` é só documentação. Código vai em `membros/{nome}/03-codigo/` ou `imersao-tools/{projecto}/` | Pre-commit hook (futuro) |
| **R4. Handoffs de membro em `membros/{nome}/handoffs/`** | Complementa `handoff-location.md` — handoff de membro fica com o membro, não no central | Nomenclatura: `RETOMA-{YYYYMMDD}-{slug}.md` |
| **R5. Novo membro requer `_template/`** | Copiar estrutura inteira ao acolher | Documentado no README do membro |
| **R6. Nomes em kebab-case lowercase** | `membros/telmo/`, `membros/joao-moreira/` | Convenção |
| **R7. Autoridade de criação** | Novo membro → só `@pm` aprova e cria a pasta. Novo projecto próprio → só `@pm` ou `@aiox-master` | Rule + aprovação por epic |

## Autoridade

| Operação | Quem pode |
|----------|-----------|
| Criar nova pasta `membros/{nome}/` | `@pm` ou `@aiox-master` |
| Criar novo projecto próprio em `imersao-tools/` | `@pm` ou `@aiox-master` |
| Criar nova categoria top-level | Apenas `@aiox-master` (decisão arquitectural) |
| Mover material entre categorias | `@dev` ou `@devops` com aprovação prévia documentada |
| Eliminar pasta de membro | APENAS humano — nunca agente |

## Violação

Qualquer agente que crie pasta top-level fora das 6 categorias, ou misture material de membro com projecto nosso, ou deixe HANDOFF solto na raiz do repo:
1. Parar imediatamente
2. Mover o material para localização correcta com `git mv`
3. Commit a explicar a correcção
4. Não repetir o erro

## Aplicação universal

Esta regra aplica-se a **todos** os agentes sem excepção: `@dev`, `@qa`, `@sm`, `@po`, `@pm`, `@architect`, `@ux-design-expert`, `@analyst`, `@data-engineer`, `@devops`, `@monster`, `@aiox-master`, todos os squads externos, todas as skills.
