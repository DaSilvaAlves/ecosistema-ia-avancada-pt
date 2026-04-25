# RETOMA — Frusoal: Pesquisa 3 LLMs concluída, aguarda produção do Dossier v1

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Resumo Executivo (em 4 linhas)

A Frusoal (maior OP citrinos PT, Algarve) é cliente comercial em prospecção para proposta de implementação de IA. Hoje (23/04/2026) foram corridas pesquisas em 3 LLMs (Perplexity, ChatGPT, Claude) e os resultados estão guardados em `cliente-frusoal/`. **Claude trouxe descobertas decisivas que mudam a abordagem comercial** (Sisgarbe gatekeeper, InovCitrus janela única, Pedro Madeira decisor único). Próximo passo: produzir **Dossier Frusoal v1** consolidado num único ficheiro, base para a proposta comercial a Pedro Madeira.

---

## 1. Contexto do projecto

| Campo | Valor |
|-------|-------|
| Tipo | Cliente comercial (NÃO membro da comunidade) |
| Empresa | Frusoal — Frutas Sotavento Algarve, Lda |
| NIF | 501186425 |
| Site | https://www.frusoal.pt/ |
| Sede | Estrada Nacional 125, Sítio das Cevadeiras, 8901-907 Vila Nova de Cacela, VRSA |
| Decisor principal | Pedro Madeira (sócio-gerente) |
| Decisor secundário | Manuel Reis (co-sócio-gerente, co-assina protocolos) |
| Pasta do cliente | `membros/cliente-frusoal/` (sim, está em `membros/` por decisão pragmática do Eurico em 23/04 — não inventar nova categoria) |
| Objectivo final | Proposta comercial de implementação de IA, valor estimado €300-800K com 70% financiado por PRR |

---

## 2. Estado actual (o que está feito)

| Tarefa | Estado | Onde |
|--------|--------|------|
| Análise inicial site Frusoal | ✓ feito | sessão UX 23/04 |
| Web search cruzada (3 queries) | ✓ feito | sessão UX 23/04 |
| Prompt modular 3 fases produzido | ✓ feito | entregue em chat 23/04, NÃO guardado em ficheiro |
| Pesquisa Perplexity (Fase A perfil) | ✓ corrida pelo Eurico | `cliente-frusoal/preplexity-pesquisa.txt` (43KB) |
| Pesquisa ChatGPT (Fase B stack) | ✓ corrida pelo Eurico | `cliente-frusoal/gpt-pesquisa.txt` (5KB — fraca) |
| Pesquisa Claude (Fase C oportunidades) | ✓ corrida pelo Eurico | `cliente-frusoal/claude-pesquisa.txt` (37KB — **a melhor de todas**) |
| Pesquisa Gemini (controlo) | ✗ não corrida | opcional, podemos prescindir — Claude já cobriu |
| Dossier Frusoal v1 consolidado | ✗ pendente | **PRÓXIMO ENTREGÁVEL** |
| Proposta comercial | ✗ depende do dossier | sessão futura |

---

## 3. Descobertas críticas (só o Claude trouxe — ouro puro)

| Descoberta | Implicação directa na proposta |
|------------|-------------------------------|
| **Sisgarbe** é parceiro IT da Frusoal há 39 anos (desde 1986). ERP é **PHC custom** | Sisgarbe é **gatekeeper de facto**. Qualquer proposta que ameace o PHC será bloqueada. **Estratégia: complementar, NÃO substituir.** Posicionar IA como camada por cima do PHC. |
| **Centro InovCitrus** lançado oficialmente Fev 2026 em Tavira (polo I&D próprio, obras laboratorial em curso) | **Janela única** para integrar IA no design do novo centro **AGORA**. Timing perfeito. |
| **Plano Operacional OP 2026-2028** (PEPAC) já em execução com orçamento alocado | Janela curta de elegibilidade. Agir já. |
| **Manuel Reis** é 2º sócio-gerente (co-assina protocolo InnovPlantProtect Nov 2024) | Não é só Pedro Madeira. Manuel Reis também tem capacidade de decisão estratégica. |
| **150+ funcionários** (não 50+ como tínhamos no prompt inicial). Fonte: Sisgarbe case study | Muda enquadramento PME. Cuidado com limiares CSRD e NIS2. |
| **Volume negócios estimado €35-55M** (cálculo: 40M kg × ~0,20€/kg ao produtor × 2-3x markup OP) | Justifica investimento €300-800K em IA. Confirmar com IES Racius (€11). |
| **Embargo ICNF 2021** (Quinta da Manta Rota, Ria Formosa) — destruição alfarrobeiras, pergunta parlamentar BE | **Passivo reputacional**. Ângulo: rastreabilidade + ESG = reconquista de confiança pública. |
| **AlgarOrange admite publicamente (Mar/2024)**: "IA já é realidade entre alguns operadores citrinos do Algarve" — sem nomear quais | Pitch killer: **"A região já está a mover-se. A Frusoal, como a maior OP, não pode ser a última a chegar."** |
| **Crise hídrica Sotavento**: cortes 50-72% em 2024. Cada hectare laranja consome 6-6,5 milhões litros/ano | Maior dor operacional transversal. Qualquer oferta que melhore eficiência hídrica tem tracção imediata. |
| **PRR IA nas PME (IFIC C05-i14)** — até 75% não-reembolsável, tecto €300K. Próximo aviso SIFIC-7 em 2026 | 70% pago pelo Estado **muda completamente a discussão de preço**. Próximo aviso a confirmar em recuperarportugal.gov.pt antes da proposta. |
| **Tavifruta** — 2º armazém adquirido pela Frusoal em 2009 | Confirma capacidade de absorver crescimento. |
| **Detecção de Scirtothrips aurantii** (tripes da África do Sul) Nov 2022 — primeira vez Algarve | Driver para projecto IA visão computacional. Já há projecto trienal a decorrer. |

---

## 4. Contradições entre fontes (resolvidas)

| Dado | Perplexity/GPT | Claude (verificado) | Decisão |
|------|----------------|---------------------|---------|
| Funcionários | 50+ | **150+** (Sisgarbe case study) | Usar 150+ |
| Idade real | 45 anos (constituída 1981) | **35 anos operacionais** (início 03/05/1990) | Usar 35 anos |
| Associados | 65 | **"mais de 60"** (Pedro Madeira 2025) | Usar "mais de 60" |
| Volume t/ano | 35.000 (site) | **40.000** (post 35 anos 2025) | Usar 40.000 t |

---

## 5. Os 6 ângulos comerciais para Pedro Madeira (Claude desenhou — usar tal qual)

1. **"Primeira OP citrinos PT com IA ponta-a-ponta"** — capitaliza orgulho de "maior OP" + ambição de liderança regional
2. **"IA que protege a água"** — liga directamente à dor #1 (crise hídrica + rega de sobrevivência) que ele já confessa em entrevistas
3. **"IA que amplifica o InovCitrus"** — posicionar IA como cérebro digital do novo centro físico que está a inaugurar. Timing perfeito.
4. **"Exportação sem fricção"** — resolver agora a fricção administrativa para Canadá / Itália / Escandinávia (top da agenda dele)
5. **"Sem tocar no PHC"** — tranquilizar que a Sisgarbe continua dona da espinha operacional. Vocês entregam só camada analítica + interface.
6. **"70% pago pelo Estado"** — financiar via PRR IA nas PME + IFIC + PT2030 muda discussão de preço

---

## 6. Top 5 Quick Wins (Claude já priorizou — base para a proposta)

| # | Quick Win | Investimento | ROI ano 1 | Prazo |
|---|-----------|--------------|-----------|-------|
| 1 | Automação documentação aduaneira/fitossanitária (Make.com + GPT + APIs) | €30-50K + €500-1K/mês | €40-80K poupança admin + aceleração Canadá em 6m | 60-90 dias |
| 2 | Chatbot B2B multilíngue + portal cliente light no WordPress | €25-40K | +20-40% leads internacionais; -30% email admin | 45-60 dias |
| 3 | BI + previsão procura por SKU/cliente sobre PHC (Power BI + ML prophet/XGBoost) | €40-70K | -10-15% desperdício; ROI €100-250K ano 1 | 90-120 dias |
| 4 | Fábrica de conteúdo multilíngue Gomo/Biogomo + calendário editorial IA | €15-25K + €1-2K/mês | Output editorial 5-10x; pull internacional | 30-45 dias |
| 5 | App mobile monitorização pragas (Scirtothrips, mosca-mediterrâneo) MVP com InovCitrus | €50-90K + dataset | -15-25% tratamentos; diferencial IGP; paper científico | 120-180 dias |

**Total invest:** €160-275K · **Frusoal contribui ~€50-70K** (resto via PRR IA nas PME 75%) · **ROI consolidado ano 1: 2-4x**

---

## 7. Gaps críticos a fechar antes da proposta

| # | Gap | Como fechar | Custo |
|---|-----|-------------|-------|
| 1 | IES financeiros 2021-2024 | Comprar relatório Racius | €11 |
| 2 | Marca exacta da classificadora óptica (Maf Roda? Greefa? Compac? Unitec?) | Visita à central VN Cacela ou pergunta directa | 0€ |
| 3 | Status próximo aviso PRR IFIC IA nas PME (SIFIC-7 ou sucessor) | Consultar recuperarportugal.gov.pt | 0€ |
| 4 | Confirmação Frusoal Agroquímicos Unipessoal Lda (NIF 506111130) | Portal da Empresa / BNI | 0€ |
| 5 | Existência conta Instagram activa | Pesquisa simples Instagram | 0€ |
| 6 | Lista de subsídios PRR/PT2030/PDR2020/PEPAC já recebidos por NIF 501186425 | Portal Fundos UE + IFAP | 0€ |
| 7 | Quais OPs algarvias já adoptaram IA (AlgarOrange diz que há mas não nomeia) | Investigação adicional | 0€ |
| 8 | Existência EDI estruturado com cada retalhista (Continente, Lidl, etc.) | Pergunta na visita comercial | 0€ |

---

## 8. PRÓXIMO ENTREGÁVEL — Dossier Frusoal v1

**Localização proposta:** `membros/cliente-frusoal/dossier-frusoal-v1.md`

**Estrutura obrigatória (9 blocos):**

```markdown
# Dossier Frusoal v1 — Base para proposta de implementação de IA

## Bloco 1 — Perfil empresarial
- Identificação legal (nome, NIF, CAE, sede, capital social)
- Dimensão (40M kg, 1.500 ha, 60+ produtores, 150+ funcionários, €35-55M estimado)
- Marcas (Gomo, Biogomo)
- Mercados (75% PT, 25% exportação ES/FR/DE/UK/PL/CH; expansão Canadá/Itália/Escandinávia)
- Certificações (GlobalG.A.P., GRASP, IGP Citrinos do Algarve)
- Empresas do grupo (Frusoal-mãe, Tavifruta 2009, Frusoal Agroquímicos a confirmar)

## Bloco 2 — Decisor + stakeholders + abordagem comercial recomendada
- Pedro Madeira: perfil, momento, narrativa
- Manuel Reis: papel co-decisor
- Sisgarbe: como gatekeeper IT (NÃO adversário — complementar)
- InnovPlantProtect: parceiro científico (referência de credibilidade)
- Como construir a conversa: linguagem ROI, não tecnologia. Conversa única.

## Bloco 3 — Stack actual + fronteira intocável
- ERP PHC custom Sisgarbe (39 anos)
- Site WordPress trilingue
- Classificadora óptica (marca a confirmar)
- Sondas humidade + rega gota a gota (confirmado)
- AUSÊNCIAS: portal B2B, EDI estruturado visível, CRM, BI, IA em qualquer camada
- Linha vermelha: PHC fica intocada, nós entregamos camada analítica + interface

## Bloco 4 — Momentum 2024-2026
- Cronologia detalhada eventos (seca, expansão, InovCitrus, protocolos)
- Janelas abertas: orçamento PO OP 2026-2028, lançamento InovCitrus, expansão Canadá
- Pressões: hídrica, retalho (CSRD cascata), regulatória (Lei Whistleblowing aplica)

## Bloco 5 — Matriz oportunidades IA priorizada
- Tabela: Caso × Impacto (1-5) × Viabilidade (1-5) × ROI estimado × Alinhamento momentum × Score final
- Ordem decrescente de score
- Categorias: Produção, Pós-colheita, Rastreabilidade, Comercial, Exportação, RH, ESG, Marketing
- Para cada caso: vendor de referência, case study sector, barreira

## Bloco 6 — Top 5 Quick Wins refinados
- Já tens base no ponto 6 deste handoff
- Refinar: cronograma Gantt simplificado, dependências entre quick wins, equipa necessária por quick win

## Bloco 7 — Esqueleto da proposta comercial (estrutura, NÃO conteúdo final)
- Capa, sumário executivo
- Diagnóstico (resumo dos blocos 1-4)
- Proposta de valor (os 6 ângulos)
- Fases (quick wins primeiro 6 meses, depois projectos médios)
- Investimento + financiamento PRR
- Equipa proposta (papéis, não nomes)
- Cronograma macro
- Próximos passos

## Bloco 8 — Checklist validação pré-proposta
- 8 gaps a fechar (ponto 7 deste handoff)
- Quem fecha cada um, prazo, custo

## Bloco 9 — Anexos
- Fontes citadas (lista completa Perplexity + Claude)
- Glossário rápido (PHC, GlobalG.A.P., IGP, OP, PEPAC, IFIC, PRR)
- Concorrência sector mapeada (PT: Cacial, Frutas Tereso; ES: Anecoop, Benihort, Frutinter; IT: Apofruit)
```

**Especificações de produção:**

- Língua: PT-PT estrito (regra `language-standards.md`)
- Tom: directo, factual, sem floreados, sem PT-BR
- Marcações claras: [VERIFICADO] / [INFERÊNCIA] / [GAP] / [DESACTUALIZADO]
- Sempre que possível: tabelas markdown
- Citações: URL + data de consulta junto a cada facto não-óbvio
- Sem emojis (regra `output-format-standards.md`)

---

## 9. Como começar a próxima sessão

**Agente recomendado:** `@ux-design-expert` (Uma) — está a tratar do ciclo completo deste cliente

**Comandos de arranque:**

```
@ux-design-expert
```

Depois Uma faz greeting, lê este handoff (vai aparecer no INDEX), e diz:

```
Detectei handoff pending Frusoal de 23/04. Avanço com Dossier v1?
```

**Tu respondes:** "sim" ou "sim mas ajusta X bloco"

**Uma então:**
1. Lê os 3 ficheiros de pesquisa (`preplexity-pesquisa.txt`, `gpt-pesquisa.txt`, `claude-pesquisa.txt`)
2. Lê este handoff completo
3. Produz `cliente-frusoal/dossier-frusoal-v1.md` com os 9 blocos
4. Apresenta resumo do que produziu
5. Pergunta se queres avançar para esqueleto da proposta ou parar para tu reveres

**Tempo estimado:** 30-45 minutos numa sessão sem interrupções.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 10. Decisões pendentes do Eurico (aguarda resposta antes de avançar)

Nenhuma neste momento. O Eurico já validou avançar para o Dossier v1. **A próxima sessão pode arrancar directa** sem esperar input adicional, desde que use a estrutura dos 9 blocos definida no ponto 8.

Únicas situações que pedem confirmação a meio:

| Cenário | Pergunta a fazer ao Eurico |
|---------|----------------------------|
| Quiseres mudar nome do ficheiro final | "Manténs `dossier-frusoal-v1.md` ou preferes outro nome?" |
| Quiseres adicionar/remover blocos | Antes de produzir, mostrar índice e pedir confirmação |
| Quiseres tom diferente (ex: mais comercial vs mais técnico) | Antes de produzir, alinhar tom |

Se nenhum destes 3 cenários se aplicar, **avançar directo sem perguntar**.

---

## 11. Memórias relevantes para contexto adicional

| Memória | Relevância |
|---------|-----------|
| `feedback_governance_never_blocks_execution.md` | Cliente comercial está em `membros/cliente-frusoal/` por decisão pragmática 23/04. Não criar nova categoria sem pedir. |
| `feedback_handoffs_detail.md` | Handoffs devem ter decisões exactas, citações, contexto concreto |
| `feedback_no_invented_cases.md` | ZERO exemplos fictícios no dossier — só dados reais verificados |
| `feedback_never_restart_context.md` | NUNCA pedir explicações já dadas — este handoff tem tudo |
| `feedback_save_analysis.md` | Gravar mapeamentos em memória ANTES de implementar |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260423-dossier-frusoal-v1-aguarda-producao.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260423-dossier-frusoal-v1-aguarda-producao.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 23/04/2026
