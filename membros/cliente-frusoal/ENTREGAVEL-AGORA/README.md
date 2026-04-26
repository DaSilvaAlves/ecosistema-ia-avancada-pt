# ENTREGÁVEL AGORA — Frusoal InovCitrus

> **Estado:** 26/04/2026 · pivot crítico · entrega tem de ser **100% online interligada** · descartar entrega física
>
> **Propósito-mãe:** introduzir IA no processo da Frusoal · o pacote é o **veículo para abrir conversa** com Pedro Madeira (sócio-gerente, 65 anos, Eurico conhece-o desde infância)
>
> **Esta pasta é orientação, não trabalho.** Aponta para o que existe. O trabalho está em `04-landing/`, no commit `2608d5b6` (já no GitHub) e no site live `https://inovcitrus.vercel.app`.

---

## 1. O que está pronto AGORA (entregável imediato)

| Camada | URL / caminho | Estado |
|--------|----------------|--------|
| **Site institucional live** | https://inovcitrus.vercel.app | ✓ 4 línguas · 20 rotas · multilíngue · profissional |
| **6 PDFs gerados** | `04-landing/inovcitrus-pdfs/output/` (e cópias em `output/PARA-IMPRIMIR/`) | ✓ 1 press release PT · 4 ficha técnica PT/EN/ES/FR · 1 roadmap 36 meses |
| **Kit imprensa** | `04-landing/inovcitrus-kit-imprensa/` | ✓ 7 ficheiros: wordmarks SVG · paleta PNG · press releases editáveis · README |
| **Documentação rastreável** | `04-landing/FONTES.md` | ✓ 16 fontes F01-F16 verificadas |
| **Repositório GitHub** | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/commit/2608d5b6d88d9a55187fe4341bf578b55b7e1361 | ✓ Trabalho versionado e seguro |

## 2. O que NÃO é entregável (descartado)

| Item | Razão |
|------|-------|
| **Envelope físico com PDFs impressos** | Contradiz a mensagem "consultor de IA". Apresentar pasta de papéis a Pedro com 45 anos de empresa é erro de framing. **Não levar.** |
| `04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/` | Mantém-se no disco como fallback técnico, mas **não é o caminho de entrega**. Os PDFs interessam — o "envelope" não. |
| Cartão físico, vídeo, chatbot novo (sugestões anteriores) | Inventos sem contexto do propósito-mãe. **Descartar.** Não inventar mais formatos. |

## 3. Direcção do próximo passo (a definir com Eurico em sessão fresh)

A entrega tem de ser **100% online, interligada, UM URL único** que o Pedro recebe e onde tem acesso a **TODO o trabalho preparado**.

O hub natural é o site `inovcitrus.vercel.app`. Mas o site **actualmente não expõe** o material complementar (PDFs downloadable, kit imprensa, roadmap interactivo). Falta interligar.

**Próxima acção (sessão fresh):**
1. Ler handoff `docs/RETOMA-20260426-pivot-entrega-100pct-online.md` integral
2. Decidir com Eurico a estratégia de "entrega 100% online interligada" (NÃO executar antes de decidir)
3. Implementar no site

## 4. Onde está cada coisa

```
membros/cliente-frusoal/
├── prompt-original.md                   ← FONTE DA VERDADE · ler antes de qualquer trabalho
├── claude-pesquisa.txt                  ← Pesquisa Claude (37KB · a melhor das 3)
├── preplexity-pesquisa.txt              ← Pesquisa Perplexity (43KB)
├── gpt-pesquisa.txt                     ← Pesquisa GPT (5KB · fraca)
├── dossier-frusoal-v1.md                ← Consolidação inicial (revisitar com cuidado · incidente 23/04)
├── InovCitrus.txt                       ← Síntese factual
├── 02-prd/                              ← PRDs (archive tem PRD v2 obsoleto)
├── 04-landing/                          ← Trabalho técnico real (site + PDFs + kit imprensa)
│   ├── inovcitrus-site/                 ← Next.js scaffold completo
│   ├── inovcitrus-pdfs/                 ← Scripts geradores + 6 PDFs em output/
│   ├── inovcitrus-kit-imprensa/         ← 7 ficheiros kit imprensa
│   ├── FONTES.md                        ← F01-F16
│   └── PROGRESSO-DIA-{1..7}.md          ← Change log integral
├── docs/                                ← Handoffs activos
│   ├── RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md           ← Dia 7 (consumido)
│   ├── RETOMA-20260426-pivot-entrega-100pct-online.md                ← ACTIVO · próximo agente lê este
│   └── archive/                         ← Dias 1-6 + handoffs prévios arquivados
└── ENTREGAVEL-AGORA/                    ← Esta pasta (orientação)
    └── README.md                        ← Este ficheiro
```

## 5. Regras inegociáveis para o próximo agente

| Regra | Detalhe |
|-------|---------|
| `.claude/rules/frusoal-source-of-truth.md` | Ler `prompt-original.md` integral antes de qualquer trabalho |
| `feedback_nunca_combo_clientes_comerciais.md` | Zero "combo", "package", "ROI 6 meses", "75% PRR", "quick win" |
| `feedback_no_invented_cases.md` | Zero invenção factual · cada afirmação rastreada a F01-F16 |
| `feedback_no_more_tools.md` | Zero ferramentas novas instaladas (Chrome reutilizado) |
| `feedback_governance_never_blocks_execution.md` | Avançar · não pedir 3 aprovações |
| `agent-authority.md` | Push é exclusivo `@devops` · `@dev` faz commit local |
| `handoff-location.md` | Handoffs Frusoal sempre em `membros/cliente-frusoal/docs/` |
| **Nova regra desta sessão** | **Não inventar formatos de entrega (cartões, vídeos, chatbots) sem propósito explícito vinculado ao objectivo-mãe (introduzir IA no processo Frusoal)** |

## 6. Pedro Madeira — quem é, como abordar

| Dimensão | Detalhe |
|----------|---------|
| Idade | 65 anos |
| Cargo | Sócio-gerente Frusoal — Frutas Sotavento Algarve, Lda |
| Empresa | 45 anos · maior OP de citrinos de Portugal · 1.500ha · 65 produtores · 40.000t/ano |
| Relação Eurico | Conhecem-se desde infância · vivem perto (Algarve/VRSA) |
| Canal | **Presencial · informal** — café, encontro casual, evento. Zero cold outreach. Zero warm intro via 3º. |
| Tom | Par a par, "fizemos isto, está aqui se fizer sentido" — não vendor, não consultor distante |

---

*Pasta criada 26/04/2026 por Uma (`@ux-design-expert`) após pivot de framing reconhecido pelo Eurico. Próxima acção: terminal fresh lê handoff `docs/RETOMA-20260426-pivot-entrega-100pct-online.md` e decide com Eurico a estratégia de entrega 100% online.*
