# RETOMA — Frusoal InovCitrus: Dia 1 do Pacote Completo executado, conteúdo PT pronto, próximo Dia 2 (traduções EN/ES/FR)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

---

## Resumo Executivo (5 linhas)

Sessão de 25/04/2026. Após auditoria do estado complicado (3 PRDs em 3 dias, 28 perguntas pendentes), o Eurico reformulou a estratégia: **trabalho de casa entregue gera curiosidade que abre porta** (Pedro Madeira não tem tempo para conversa de café com promessa). Decidiu pacote completo de 7 dias úteis: site institucional InovCitrus + ficha técnica 4 línguas + roadmap 36 meses. **Dia 1 executado integralmente:** 8 ficheiros criados (5 páginas PT + ficha técnica PT + roadmap data + fontes consolidadas). PRD v2 (obsoleto pré-descoberta InPP) movido para archive. Próximo: Dia 2 = traduções EN/ES/FR baseadas em fontes científicas internacionais oficiais (EPPO, INRAE/ANSES, autoridades fitossanitárias ES).

---

## 1. Decisões consolidadas nesta sessão

| # | Decisão | Origem |
|---|---------|--------|
| D1 | Pacote completo 7 dias (Peças A + B + C) | Eurico 25/04 — escolha entre 3 opções |
| D2 | Hosting Vercel (URL `*.vercel.app` por agora) | Eurico 25/04 — em vez de domínio `.pt` registado |
| D3 | Mostrar a Pedro **primeiro**, depois à InPP | Eurico 25/04 — implicação: zero conteúdo "em nome da InPP" |
| Q1 default | Wordmark tipográfico Frusoal-aligned, sem ícone | Default aceite (Eurico: "podes continuar") |
| Q2 default | Omitir página "Equipa", substituir por "Estrutura" | Default aceite |
| Q3 default | Tentar `inovcitrus.vercel.app` primeiro; alternativa `frusoal-inovcitrus.vercel.app` | Default aceite (confirmar Dia 5) |
| Q4 default | Página "Sede" vaga: "em construção em Tavira", sem morada/foto | Default aceite |
| Q5 default | Não registar `inovcitrus.pt` agora; só Vercel | Default aceite |

---

## 2. O que aconteceu nesta sessão 25/04/2026 — cronologia

| # | Evento | Output |
|---|--------|--------|
| 1 | Uma activada, leu prompt-original.md + handoff 24/04 + InovCitrus.txt + PRD v2 | Confirmação de leitura completa antes de qualquer output |
| 2 | Eurico: "isto está muito complicado. preciso de auditoria do estado actual e definir o que pretendemos" | Auditoria entregue: inventário físico + linha temporal + 4 fontes de complicação + 3 opções |
| 3 | Eurico clarificou estratégia: "Pedro não tem tempo para conversa de café — preciso de algo entregue, tangível, sólido. A curiosidade é a estratégia" | Uma reformulou: pacote casa pública InovCitrus (5 páginas + ficha técnica 4 línguas + roadmap 36 meses) com critérios de "entregável tangível com base sólida" |
| 4 | Eurico decidiu: D1 pacote completo · D2 Vercel · D3 Pedro primeiro | Plano 7 dias estruturado · 5 perguntas Q1-Q5 para destrancar Dia 1 |
| 5 | Eurico: "não compliques mais, podes continuar" | Avanço com defaults nas 5 perguntas |
| 6 | Dia 1 executado: estrutura pastas + FONTES.md + 5 páginas PT + ficha técnica PT + roadmap data + PROGRESSO-DIA-1 | 8 ficheiros criados, ~800 linhas conteúdo factual, zero invenção |
| 7 | PRD v2 movido para `02-prd/archive/prd-v2-obsoleto-pre-descoberta-inpp.md` | Higiene de ficheiros — próximo agente não tropeça nele |
| 8 | Este handoff criado, RETOMA-20260424 movido para archive | Continuidade cross-terminal garantida |

---

## 3. Pacote em construção — 7 dias úteis

| Dia | Status | Tarefa | Output |
|-----|--------|--------|--------|
| 1 | ✓ feito | Estrutura · fontes · 5 páginas PT · ficha técnica PT · roadmap data | 8 ficheiros em `04-landing/` |
| 2 | a executar | Tradução EN (base EPPO) · ES (autoridades fitossanitárias) · FR (INRAE/ANSES) | 5 páginas × 3 línguas + ficha técnica × 3 línguas |
| 3 | a executar | Identidade visual sóbria · Next.js scaffold · componentes hero/cards/footer/i18n | Projecto Next.js inicial |
| 4 | a executar | Build site Next.js 5 páginas × 4 línguas · validação local | Site navegável local |
| 5 | a executar | Deploy Vercel · ficha técnica PDF × 4 línguas (renderização A4 sóbria) | URL público + 4 PDFs |
| 6 | a executar | Roadmap 36 meses PDF visual · kit imprensa (logos, press release modelo) | `roadmap.pdf` + `kit-imprensa.zip` |
| 7 | a executar | Revisão final · checklist fontes · smoke test 4 línguas · handoff "pronto para entrega" | Pacote final entregue |

---

## 4. Inventário do que existe agora em `membros/cliente-frusoal/`

```
membros/cliente-frusoal/
├── prompt-original.md                              ← FONTE DA VERDADE (não tocar)
├── claude-pesquisa.txt                             ← Pesquisa LLM (37K, base v1)
├── preplexity-pesquisa.txt                         ← Pesquisa LLM (42K, base v1)
├── gpt-pesquisa.txt                                ← Pesquisa LLM (5K, base v1)
├── dossier-frusoal-v1.md                           ← Dossier consolidado (válido)
├── InovCitrus.txt                                  ← Análise factual InovCitrus (válido)
├── 02-prd/
│   └── archive/
│       └── prd-v2-obsoleto-pre-descoberta-inpp.md  ← Arquivado nesta sessão
├── 04-landing/                                     ← NOVO (criado nesta sessão)
│   ├── FONTES.md                                   ← Rastreabilidade global F01-F12
│   ├── PROGRESSO-DIA-1.md                          ← Registo factual Dia 1
│   ├── inovcitrus-site/
│   │   └── content/pt/
│   │       ├── 01-home.md                          ✓ Dia 1
│   │       ├── 02-projecto-trienal.md              ✓ Dia 1
│   │       ├── 03-estrutura-parceiros.md           ✓ Dia 1
│   │       ├── 04-repositorio.md                   ✓ Dia 1
│   │       └── 05-contactos.md                     ✓ Dia 1
│   └── inovcitrus-pdfs/
│       ├── source/pt/
│       │   └── ficha-tecnica-scirtothrips-pt.md    ✓ Dia 1
│       └── roadmap/
│           └── roadmap-data.json                   ✓ Dia 1
└── docs/
    ├── RETOMA-20260425-dia-1-pacote-completo-conteudo-pt.md  ← Este handoff
    └── archive/
        ├── RETOMA-20260423-dossier-frusoal-v1-aguarda-producao.md
        ├── RETOMA-20260423-inovcitrus-estrategia-2-actos-aguarda-validacao.md
        └── RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md  ← Movido
```

---

## 5. Decisões em aberto (não bloqueantes para Dia 2; decidir antes de Dia 5)

| # | Decisão | Quem decide |
|---|---------|--------------|
| O1 | Identidade visual InovCitrus — wordmark proposto vs. preferência Eurico | Eurico (validar Dia 3) |
| O2 | Foto da sede em construção em Tavira — Eurico tem alguma? | Eurico |
| O3 | URL Vercel exacto (`inovcitrus.vercel.app` vs. `frusoal-inovcitrus.vercel.app`) | Uma confirma Dia 5 |

---

## 6. Primeira acção do próximo agente na nova sessão

**Agente recomendado:** `@ux-design-expert` (Uma) — continuidade directa.

**Sequência obrigatória:**

1. Activar `@ux-design-expert`
2. Na resposta de greeting, dizer explicitamente: **"Detectei handoff pending RETOMA-20260425 Frusoal InovCitrus — Dia 1 executado, conteúdo PT pronto. Vou avançar Dia 2 = traduções EN/ES/FR. Li prompt-original.md, FONTES.md, PROGRESSO-DIA-1.md."**
3. Consultar fontes científicas internacionais oficiais:
   - **EN:** EPPO Datasheet `https://gd.eppo.int/taxon/SCITAU` + EFSA Pest Categorisation
   - **ES:** Ministerio de Agricultura ES + autoridades fitossanitárias regionais (Murcia/Valencia/Huelva)
   - **FR:** ANSES alerta fitossanitário + INRAE
4. Traduzir 5 páginas + ficha técnica para EN, ES, FR — NUNCA literal: usar terminologia científica de cada região
5. Actualizar `FONTES.md` com IDs F09-F12 (fontes internacionais consultadas)
6. Criar `PROGRESSO-DIA-2.md` no mesmo formato do Dia 1
7. **Não escrever Next.js scaffold neste dia** — esse é o Dia 3

---

## 7. Memórias relevantes (ler antes de trabalhar)

| Memória | Relevância |
|---------|-----------|
| `project_frusoal_proposito.md` | Propósito: identificar onde aplicar IA na Frusoal — registo via PRD/entregável |
| `project_frusoal_eurico_pedro_relacao.md` | Eurico conhece Pedro desde infância — canal informal/presencial |
| `feedback_nunca_combo_clientes_comerciais.md` | Zero linguagem "combo/package/ROI/quick win" |
| `feedback_no_invented_cases.md` | Zero exemplos fictícios — só dados reais com fonte |
| `feedback_handoffs_detail.md` | Handoffs com decisões exactas + citações + contexto |
| `feedback_governance_never_blocks_execution.md` | Não bloquear execução com pedidos de aprovação @pm |
| `feedback_save_analysis.md` | Gravar mapeamentos antes de implementar |
| `feedback_never_restart_context.md` | Não recomeçar do zero — ler RETOMA + memória |
| `feedback_community_acolhe_adapta_model.md` | **NÃO aplica** — Frusoal é cliente comercial, não membro |

---

## 8. Decisões inegociáveis preservar nos próximos dias

| # | Decisão | Razão |
|---|---------|-------|
| 1 | Cada afirmação científica/factual rastreada a fonte pública (URL + data) | Regra `frusoal-source-of-truth.md` |
| 2 | Zero conteúdo em nome da InPP — apenas citação verbatim de F05 + cross-tag textual | Decisão D3 (Pedro primeiro) protege relação InPP |
| 3 | Logos InPP, CCDR, UAlg, INIAV substituídos por referência textual até autorização formal | Risco legal/político de uso de marca |
| 4 | PT-PT estrito (versão master); EN/ES/FR baseiam em fontes científicas de cada região | Regra `language-standards.md` + autoridade científica |
| 5 | Identidade visual sóbria, alinhada com Frusoal actual (verde/laranja institucional) | Pedro é praticante 65 anos — sem ruptura estética |
| 6 | Custo zero (Vercel `.vercel.app`, sem domínio próprio) | Decisão D2 + D5 default |
| 7 | Ficha técnica e roadmap declaradamente "preliminares — versão pré-publicação" | Honestidade — projecto trienal só começou Fev/2026 |

---

## 9. Erros que NÃO PODEM ser repetidos (acumulado das 3 sessões)

| Erro | Origem | Memória |
|------|--------|---------|
| "Combo" / "package" / linguagem vendor SaaS | Sessão 23/04 PRD v1 | `feedback_nunca_combo_clientes_comerciais.md` |
| Cold outreach via LinkedIn DM | Sessão 23/04 | `project_frusoal_eurico_pedro_relacao.md` |
| Projectar segundos capítulos não-pedidos | Sessão 23/04 | `feedback_no_projected_business_models.md` |
| Confundir Frusoal-empresa com Frusoal InovCitrus | Sessão 23/04 | Handoff 23/04 |
| Propor ferramentas que colidem com core InPP (Pest Analyzer-like, SIG pragas, ML preditivo, drone imagery, app contagem) | Sessão 24/04 | Handoff 24/04 |
| Acumular strands paralelos sem fechar nenhum | Sessão 25/04 (auditoria) | `feedback_governance_never_blocks_execution.md` |
| Inventar dados sobre InPP, Pedro, Sisgarbe, equipa científica | Sistémico | `feedback_no_invented_cases.md` |

---

## 10. Risco máximo na próxima sessão e mitigação

**Risco:** O próximo agente, ao traduzir para EN/ES/FR, escolhe atalho (tradutor automático puro, sem consultar EPPO/INRAE/autoridades ES) e introduz terminologia científica imprecisa.

**Mitigação em 4 camadas:**

1. Este handoff (secção 6) ordena consulta directa às fontes internacionais
2. `FONTES.md` lista F09-F12 a actualizar com URLs verificados
3. Tradução é **parafrase informada por fontes regionais**, não tradução literal do PT
4. `PROGRESSO-DIA-2.md` deve listar fonte consultada por cada termo técnico chave

---

## 11. Pontos críticos de contexto emocional (para o próximo agente)

- **Eurico apreciou a clareza desta sessão** — auditoria + 1 caminho concreto + 3 decisões binárias resolveram a complicação acumulada de 3 dias
- **Tolerância zero** mantida para complicação (28 perguntas → 5 perguntas → 0 com defaults)
- **Reconhece-se eficácia da disciplina:** Uma reduziu fricção desde a auditoria; preservar este modo
- **Posicionamento emocional correcto na próxima sessão:** par consultivo executor, factos antes de explicações, tabelas antes de prosa
- **Quando o Eurico diz "podes continuar":** avançar com defaults documentados, não pedir mais perguntas

---

## 12. Output esperado da próxima sessão (Dia 2)

**Localização:** `04-landing/inovcitrus-site/content/{en,es,fr}/` × 5 ficheiros + `04-landing/inovcitrus-pdfs/source/{en,es,fr}/ficha-tecnica-scirtothrips-{en,es,fr}.md`

**Estrutura esperada de cada ficheiro:**

- Frontmatter idêntico ao PT (sources, slug, route) + `lang: en/es/fr`
- Estrutura idêntica ao PT (mesmas secções, mesmos H2/H3)
- Conteúdo: parafrase informada por fontes científicas regionais, não tradução literal
- Comentários `<!-- F0X -->` mantidos em cada afirmação científica
- Terminologia: usar nomenclatura oficial de cada região (EPPO em EN, autoridades ES em ES, ANSES/INRAE em FR)

**Tom:** institucional sóbrio, par consultivo, sem floreados.

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO A QUE SE REFERE: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER DOCUMENTO FRUSOAL NA PRÓXIMA SESSÃO, LER `.claude/rules/frusoal-source-of-truth.md` + `membros/cliente-frusoal/prompt-original.md` + ESTE HANDOFF + `04-landing/FONTES.md` + `04-landing/PROGRESSO-DIA-1.md`. VIOLAÇÃO = PARAR, DESCARTAR, REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-1-pacote-completo-conteudo-pt.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-1-pacote-completo-conteudo-pt.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — continuidade Dia 2)

---

*Fim do handoff Dia 1 — pronto para consumo em qualquer terminal fresh. Zero perda de contexto esperada.*
