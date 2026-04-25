# Progresso — Dia 1 de execução do Pacote Casa Pública InovCitrus

> Cumpre regra `mandatory-change-log.md` — registo factual de tudo o que foi produzido nesta sessão, ficheiro a ficheiro, com fontes mapeadas.

---

## Sessão

| Campo | Valor |
|-------|-------|
| Data | 25/04/2026 |
| Agente | `@ux-design-expert` (Uma) |
| Decisões consolidadas | D1: Pacote completo 7 dias · D2: Vercel · D3: Pedro primeiro depois InPP |
| Defaults aplicados (Q1-Q5) | Wordmark tipográfico · Omitir página "Equipa" · `inovcitrus.vercel.app` (a verificar) · Sede vaga sem morada · Não registar `.pt` agora |

---

## Ficheiros criados nesta sessão

| Ficheiro | Linhas | Tipo | Fontes mapeadas |
|----------|--------|------|------------------|
| `04-landing/FONTES.md` | 67 | Rastreabilidade — registo de fontes consultadas (F01-F08) e a consultar (F09-F12) | — |
| `04-landing/inovcitrus-site/content/pt/01-home.md` | 65 | Conteúdo página home | F01, F04, F07 |
| `04-landing/inovcitrus-site/content/pt/02-projecto-trienal.md` | 113 | Conteúdo página projecto trienal Scirtothrips | F01, F02, F03, F08 |
| `04-landing/inovcitrus-site/content/pt/03-estrutura-parceiros.md` | 91 | Conteúdo página estrutura e parceiros | F01, F04, F05, F06, F07 |
| `04-landing/inovcitrus-site/content/pt/04-repositorio.md` | 82 | Conteúdo página repositório científico (estado: estruturado e vazio) | F01 |
| `04-landing/inovcitrus-site/content/pt/05-contactos.md` | 71 | Conteúdo página contactos e imprensa | F01, F04, F07 |
| `04-landing/inovcitrus-pdfs/source/pt/ficha-tecnica-scirtothrips-pt.md` | 158 | Ficha técnica 4 páginas A4 (peça B do pacote) | F01, F02, F03, F04, F06, F07 |
| `04-landing/inovcitrus-pdfs/roadmap/roadmap-data.json` | 152 | Dados estruturados do roadmap 36 meses (peça C — base para PDF visual) | F01, F02 |

**Total Dia 1:** 8 ficheiros · ~800 linhas de conteúdo factual · zero invenção.

---

## Ficheiros movidos / arquivados

| De | Para | Motivo |
|----|------|--------|
| `02-prd/prd-entrada-frusoal.md` | `02-prd/archive/prd-v2-obsoleto-pre-descoberta-inpp.md` | PRD v2 escrito antes da descoberta da linha digital InPP (24/04). Obsoleto. Arquivar para histórico — não consultar |

---

## Estrutura final em `04-landing/`

```
04-landing/
├── FONTES.md                                      ← rastreabilidade global
├── PROGRESSO-DIA-1.md                             ← este registo
├── inovcitrus-site/
│   └── content/
│       ├── pt/                                    ← 5 ficheiros .md (Dia 1 ✓)
│       ├── en/                                    ← Dia 2
│       ├── es/                                    ← Dia 2
│       └── fr/                                    ← Dia 2
├── inovcitrus-pdfs/
│   ├── source/
│   │   ├── pt/ficha-tecnica-scirtothrips-pt.md   ← Dia 1 ✓
│   │   ├── en/                                    ← Dia 2
│   │   ├── es/                                    ← Dia 2
│   │   └── fr/                                    ← Dia 2
│   └── roadmap/
│       └── roadmap-data.json                      ← Dia 1 ✓
└── inovcitrus-kit-imprensa/                       ← Dia 6
```

---

## Validações cumpridas

| Regra / memória | Como respeitada |
|-----------------|------------------|
| `frusoal-source-of-truth.md` | Prompt original lido integralmente · Cada afirmação tem ID de fonte ao lado em comentário rastreável · Zero invenção sobre pragas, parceiros, calendários |
| `feedback_nunca_combo_clientes_comerciais.md` | Linguagem institucional sóbria · Zero "combo", "pacote", "ROI", "quick win", "package" |
| `nunca falar em nome da InPP` (decisão D3) | InPP referida apenas por nome textual + cross-tag · Zero afirmação **em nome** da InPP · Conteúdo InPP citado verbatim de fonte F05 |
| `feedback_no_invented_cases.md` | Zero exemplos fictícios · Calendário trienal genérico marcado explicitamente como "representação do desenho trienal" |
| `language-standards.md` (PT-PT estrito) | Verificado: utilizar / eliminar / verificar / equipa / ficheiro · Zero "usar / deletar / checar / time" |
| `output-format-standards.md` | Tabelas markdown · Zero emojis no conteúdo · Tom directo |
| `handoff-location.md` | Trabalho dentro de `membros/cliente-frusoal/` · Zero pollution de outras pastas |

---

## Próximos dias (plano executado)

| Dia | Status | Tarefa |
|-----|--------|--------|
| 1 | ✓ feito | Estrutura · fontes consolidadas · 5 páginas PT · ficha técnica PT · roadmap data |
| 2 | a executar | Tradução EN (base EPPO) · ES (autoridades fitossanitárias) · FR (INRAE/ANSES) |
| 3 | a executar | Identidade visual sóbria + Next.js scaffold + componentes hero/cards/footer/i18n switcher |
| 4 | a executar | Build site Next.js 5 páginas × 4 línguas · validação local |
| 5 | a executar | Deploy Vercel + ficha técnica PDF × 4 línguas (renderização A4 sóbria) |
| 6 | a executar | Roadmap 36 meses PDF visual + kit imprensa (logos, press release modelo, foto sede) |
| 7 | a executar | Revisão final · checklist fontes · smoke test 4 línguas · handoff "pronto para Eurico entregar" |

---

## Decisões em aberto (não bloqueantes para Dia 1, decidir antes de Dia 5)

| # | Decisão | Quem decide |
|---|---------|--------------|
| O1 | Identidade visual InovCitrus — wordmark proposto vs. preferência Eurico | Eurico / Pedro |
| O2 | Foto da sede em construção em Tavira — Eurico tem alguma? | Eurico |
| O3 | URL Vercel exacto (`inovcitrus.vercel.app` provavelmente livre — confirmar Dia 5) | Uma confirma |

---

## Compromissos para entrega final (Dia 7)

1. **Cada afirmação científica/factual rastreada** a fonte pública verificada (URL + data) — coluna "Fontes" no anexo de revisão final
2. **PT-PT estrito** nas 4 línguas — versão PT é master, EN/ES/FR baseiam em fontes científicas internacionais oficiais
3. **Identidade visual alinhada** com Frusoal actual — sem rupturas estéticas
4. **Site Vercel funcional** com 5 páginas × 4 línguas, navegação intuitiva, kit imprensa descarregável
5. **3 PDFs imprimíveis** (ficha técnica · roadmap · press release) prontos para envelope físico
6. **Handoff actualizado** que substitui o `RETOMA-20260424` — descrevendo o estado pronto para entrega ao Pedro

---

*Fim do registo Dia 1 — actualizar nos próximos 6 dias com o mesmo nível de detalhe.*
