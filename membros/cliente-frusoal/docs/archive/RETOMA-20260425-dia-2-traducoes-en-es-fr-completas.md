# RETOMA — Frusoal InovCitrus: Dia 2 executado, conteúdo completo nas 4 línguas, próximo Dia 3 (identidade visual + Next.js scaffold)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável: `.claude/rules/frusoal-source-of-truth.md`.

---

## Resumo Executivo (4 linhas)

Sessão de 25/04/2026 (continuação directa do Dia 1, sem interrupção). **Dia 2 executado integralmente:** 18 ficheiros novos = 15 páginas do site (5 EN + 5 ES + 5 FR) + 3 fichas técnicas (EN, ES, FR). Todas as traduções ancoradas em fontes científicas internacionais oficiais (EPPO/SCITAU, EFSA pest categorisation 2018, Junta de Andalucía RAIF, Resolución BOJA 13/12/2020, MAPA Plan Nacional Contingencia 2024, CABI Compendium, Reglamento UE 2019/2072 Anexo II Parte A). FONTES.md actualizado com F09-F16. **Estado:** todo o conteúdo das 4 línguas pronto para servir de base ao scaffold Next.js do Dia 3.

---

## 1. Decisões consolidadas (preservadas das sessões anteriores)

| # | Decisão | Origem |
|---|---------|--------|
| D1 | Pacote completo 7 dias (Peças A + B + C) | Eurico 25/04 |
| D2 | Hosting Vercel | Eurico 25/04 |
| D3 | Mostrar a Pedro primeiro, depois à InPP — zero conteúdo em nome da InPP | Eurico 25/04 |
| Q1-Q5 | Defaults aplicados | Eurico 25/04 ("podes continuar") |

---

## 2. O que aconteceu nesta sessão 25/04/2026 — Dia 2

| # | Evento | Output |
|---|--------|--------|
| 1 | Eurico: "avança" | Iniciada execução Dia 2 |
| 2 | WebFetch ao EPPO + WebSearch ES + WebSearch FR | F09-F16 identificadas e validadas |
| 3 | Actualização do `FONTES.md` com F09-F16 + tabela "Estatuto regulatório UE — síntese factual" | FONTES.md alargado |
| 4 | Tradução EN das 5 páginas + ficha técnica (terminologia EPPO/EFSA/CABI) | 6 ficheiros EN |
| 5 | Tradução ES das 5 páginas + ficha técnica (terminologia Junta Andalucía/MAPA/RAIF) | 6 ficheiros ES |
| 6 | Tradução FR das 5 páginas + ficha técnica (terminologia OEPP) | 6 ficheiros FR |
| 7 | `PROGRESSO-DIA-2.md` criado (regra mandatory-change-log) | Registo factual completo |
| 8 | Este handoff criado, RETOMA-20260425-dia-1 movido para archive | Continuidade preservada |

---

## 3. Estado actual — todo o conteúdo das 4 línguas pronto

```
04-landing/inovcitrus-site/content/
├── pt/  (5 ficheiros · master)              ✓ Dia 1
├── en/  (5 ficheiros · base EPPO/EFSA/CABI) ✓ Dia 2
├── es/  (5 ficheiros · base RAIF/MAPA)      ✓ Dia 2
└── fr/  (5 ficheiros · base OEPP)           ✓ Dia 2

04-landing/inovcitrus-pdfs/source/
├── pt/ficha-tecnica-scirtothrips-pt.md      ✓ Dia 1
├── en/ficha-tecnica-scirtothrips-en.md      ✓ Dia 2
├── es/ficha-tecnica-scirtothrips-es.md      ✓ Dia 2
└── fr/ficha-tecnica-scirtothrips-fr.md      ✓ Dia 2

04-landing/inovcitrus-pdfs/roadmap/
└── roadmap-data.json                         ✓ Dia 1
```

**Total acumulado Dias 1+2:** 27 ficheiros conteúdo · ~2.500 linhas factuais · 4 línguas · zero invenção.

---

## 4. Plano restante — 5 dias para entrega

| Dia | Status | Tarefa |
|-----|--------|--------|
| 1 | ✓ feito | Conteúdo PT + estrutura |
| 2 | ✓ feito | Conteúdo EN/ES/FR + fontes internacionais |
| 3 | a executar | Identidade visual + Next.js scaffold + componentes |
| 4 | a executar | Build Next.js 5×4 línguas + validação local |
| 5 | a executar | Deploy Vercel + ficha técnica PDF × 4 línguas |
| 6 | a executar | Roadmap PDF + kit imprensa |
| 7 | a executar | Revisão final + handoff "pronto para entrega" |

---

## 5. Primeira acção do próximo agente (Dia 3)

**Agente recomendado:** `@ux-design-expert` (Uma) — continuidade directa.

**Sequência obrigatória:**

1. Activar `@ux-design-expert`
2. Reportar: **"Detectei handoff pending RETOMA-20260425 Dia 2 Frusoal InovCitrus — conteúdo das 4 línguas completo. Vou avançar Dia 3 = identidade visual sóbria + Next.js scaffold."**
3. Avaliar paleta visual: extrair cores do `frusoal.pt` (verde/laranja institucional) e propor wordmark tipográfico "Frusoal **InovCitrus**" sem ícone (default Q1)
4. Iniciar projecto Next.js 14 com App Router em `04-landing/inovcitrus-site/`:
   - Tailwind CSS sóbrio
   - i18n via segments `[locale]/`
   - Carregar conteúdo dos `.md` em PT/EN/ES/FR via filesystem
   - Componentes: hero, cards, footer, language switcher, header
5. **Não fazer deploy ainda** — esse é o Dia 5
6. Criar `PROGRESSO-DIA-3.md` no mesmo formato

---

## 6. Stack técnica para Dia 3 (decidida implicitamente)

| Camada | Tecnologia | Razão |
|--------|------------|-------|
| Framework | Next.js 14 (App Router) | Standard de mercado, suporte i18n nativo, deploy Vercel optimizado |
| Estilização | Tailwind CSS | Tokens controlados, sem CSS solto |
| i18n | App Router segments `[locale]/` | Solução nativa Next.js, SSG-friendly |
| Conteúdo | Markdown em `content/{lang}/` (já existe) | Fonte da verdade separada do código |
| Hosting | Vercel | Decisão D2 |
| Domínio | `*.vercel.app` (default Q5) | Sem registo .pt nesta fase |

---

## 7. Decisões em aberto (não bloqueantes para Dia 3; decidir antes de Dia 5)

| # | Decisão | Quem decide |
|---|---------|--------------|
| O1 | Identidade visual — wordmark proposto vs. preferência Eurico | Eurico (validar Dia 3 quando ver primeiro layout) |
| O2 | Foto da sede em construção em Tavira | Eurico (passar foto se houver) |
| O3 | URL Vercel exacto | Uma confirma Dia 5 |

---

## 8. Memórias relevantes (lembretes)

| Memória | Lembrete |
|---------|----------|
| `feedback_nunca_combo_clientes_comerciais.md` | Linguagem institucional sóbria — sem combo/package/ROI/quick win |
| `feedback_no_invented_cases.md` | Zero exemplos fictícios |
| `feedback_governance_never_blocks_execution.md` | Não bloquear execução — propor 1 caminho concreto |
| `feedback_never_restart_context.md` | Não recomeçar do zero |
| Decisão D3 inegociável | Zero conteúdo em nome da InPP em nenhuma das 4 línguas |

---

## 9. Risco máximo no Dia 3 e mitigação

**Risco:** próximo agente, no scaffold Next.js, escolhe paleta arrojada que diverge do site Frusoal actual e Pedro rejeita por estética antes de ler conteúdo.

**Mitigação:**

1. Antes de qualquer componente visual, abrir `frusoal.pt` e extrair paleta real
2. Wordmark deve ser **Inter** ou **DM Serif** institucional, não fonte tech ou display arrojada
3. Cores primárias verde/laranja do site Frusoal · neutros institucionais · sem garridos
4. Apresentar 1.º layout local ao Eurico antes de avançar componentes complexos

---

## 10. Compromisso preservar para Dia 7 (entrega ao Pedro)

| Compromisso | Como cumprir |
|-------------|---------------|
| Cada afirmação rastreada a fonte | FONTES.md já tem F01-F16 mapeadas; Dia 7 produz checklist de revisão |
| 4 línguas funcionais com `lang switcher` | Dia 3+4 implementam |
| 3 PDFs descarregáveis (ficha técnica × 4 línguas + roadmap + press release) | Dia 5+6 |
| Site responsivo e acessível | Dia 3+4 testar |
| Vercel deploy funcional | Dia 5 |
| Envelope físico imprimível | Dia 7 |
| Handoff final "pronto para Eurico entregar" | Dia 7 |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

- **PROJECTO:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-2-traducoes-en-es-fr-completas.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026 (Dia 2 da execução, mesmo dia natural do Dia 1)
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — Dia 3 scaffold Next.js)

---

*Fim do handoff Dia 2 — todo o conteúdo das 4 línguas pronto. Próximo agente arranca scaffold sem precisar de escrever uma linha de texto adicional.*
