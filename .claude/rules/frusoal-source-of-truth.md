---
paths:
  - "membros/cliente-frusoal/**"
description: "OBRIGATÓRIO ler prompt-original.md antes de qualquer trabalho Frusoal"
---

# FRUSOAL — FONTE DA VERDADE (REGRA INEGOCIÁVEL)

## ATENÇÃO — ESTA REGRA TEM DE SER LIDA ANTES DE QUALQUER TRABALHO RELACIONADO COM A FRUSOAL

**TODOS OS AGENTES (Uma, Dex, Alex, Morgan, Pax, River, Gage, Quinn, monster, aiox-master, squads externos, skills) DEVEM OBRIGATORIAMENTE LER O PROMPT ORIGINAL `membros/cliente-frusoal/prompt-original.md` ANTES DE PRODUZIR QUALQUER ANÁLISE, PRD, PROPOSTA, EMAIL, PITCH OU DOCUMENTO DE PLANEAMENTO SOBRE A FRUSOAL. NÃO HÁ EXCEPÇÕES. NÃO HÁ DESCULPAS.**

---

## Origem

Incidente 23/04/2026 — agente `ux-design-expert` (Uma) produziu dossier Frusoal v1 e PRD v1 a transformar os "Top 5 Quick Wins" (que eram **exemplos** devolvidos pelas pesquisas LLM) num **"combo de 3 soluções"** com linguagem de vendor SaaS a PME. Propôs "95-160K€", "75% PRR", "ROI ≤6 meses" como se fosse um package promocional.

O Eurico reagiu:

> "VAMOS VER QUE COMBO É ESSE E SE FAZ SENTIDO APRESENTAR A UMA EMPRESA COMO A FRUSOAL COM 50 ANOS DE MERCADO COMBOS COMO, AINDA NÃO CONSEGUI COMPREENDER. EU PENSAVA E FOI A ANALISE QUE FIZEMOS FOI COMPLETAMENTE DIFERENTE DAQUILO QUE ESTAMOS A ENCAMINHAR AGORA, TENS QUE IR VER O PROMPT QUE DEU INICIO A TODA A PESQUIZA. CASO CONTRARIO ANDAMOS SÓ A ATROFIAR A IDEIA E AQUILO QUE TENCIONAMOS FAZER"

> "METE NOJE A MANEIRA COMO TRATAMOS A INFORMAÇÃO. PRECISO QUE CRIES JÁ UMA REGRA E COLOCA ESSE TEXTO EM LETRAS MAIUCOLAS E QUE SEJA OBRIGATÓRIO LER ESSE PROMPT"

Esta regra nasce dessa ordem directa.

---

## REGRA PRINCIPAL (INEGOCIÁVEL)

**ANTES DE QUALQUER TRABALHO RELACIONADO COM A FRUSOAL, O AGENTE DEVE:**

1. **LER INTEGRALMENTE** `membros/cliente-frusoal/prompt-original.md`
2. **CONFIRMAR NO OUTPUT** que leu o prompt original (referência explícita na primeira linha do documento produzido)
3. **RESPEITAR O POSICIONAMENTO** declarado na primeira linha do prompt: **"Sou consultor de implementação de IA. Estou a preparar uma proposta comercial"** — o autor posiciona-se como **consultor**, não vendor
4. **SEGUIR AS 7 REGRAS DE OUTPUT** do prompt original (PT-PT, citar fontes, marcar [GAP], distinguir facto vs inferência, marcar [DESACTUALIZADO] pré-2023, tabelas markdown, zero conclusões genéricas)

---

## O QUE É PROIBIDO (ANTI-PADRÕES ABSOLUTOS)

| Anti-padrão | Porque é proibido |
|-------------|-------------------|
| Chamar "combo" a um conjunto de soluções propostas à Frusoal | É linguagem de vendor SaaS a PME, ofensiva para uma empresa com 45 anos |
| Transformar "Top 5 Quick Wins" das pesquisas LLM num "pack inicial para vender" | Os quick wins foram **exemplos de oportunidades**, não um **plano de venda** |
| Apresentar preços empacotados ("95-160K€", "75% PRR", "ROI 6 meses") como hook de entrada | Linguagem de fornecedor de ferramentas, não de consultor |
| Linguagem de outreach cold/warm a LinkedIn DM para Pedro Madeira | Eurico conhece Pedro desde a infância e vive perto — canal é informal/presencial |
| Propor "segundo capítulo" ou qualquer solução não-pedida | Projecção alucinatória — viola `feedback_no_projected_business_models.md` |
| Saltar directo para proposta comercial sem PRD validado | O PRD é a fonte interna de verdade da direcção comercial |
| Produzir qualquer documento Frusoal sem ter lido este prompt primeiro | Violação directa desta regra |

---

## POSICIONAMENTO CORRECTO (LINHA ESTRATÉGICA)

| Dimensão | Posicionamento correcto |
|----------|--------------------------|
| Autor da proposta | **Consultor de implementação de IA** |
| Tipo de proposta | **Proposta comercial de consultoria** (não venda de ferramenta, não package SaaS) |
| Nível de interlocução | **Par consultivo** com sócio-gerente de empresa com 45 anos (não vendor a PME) |
| Horizonte temporal | **Roadmap plurianual** alinhado ao PO OP 2026-2028 (não quick win isolado) |
| Estrutura de valor | **Acompanhamento estratégico** ao longo da transformação digital (não projecto one-shot) |
| Linguagem | Estratégica, não promocional; factual, não aspiracional; com fontes, não opiniões |

---

## ESTRUTURA OBRIGATÓRIA DE QUALQUER DOCUMENTO FRUSOAL

Todo documento produzido (PRD, análise, proposta, email, pitch, briefing) **DEVE** incluir nas primeiras 3 linhas:

```
> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.
```

---

## CONSEQUÊNCIA DE VIOLAÇÃO

Qualquer agente que produza documento Frusoal sem ter lido o prompt original:
1. **PARA IMEDIATAMENTE**
2. Lê `membros/cliente-frusoal/prompt-original.md` na íntegra
3. **DESCARTA** o trabalho produzido em violação
4. **REINICIA** o trabalho com a direcção correcta
5. **REPORTA** ao Eurico a violação e a correcção aplicada
6. **NÃO REPETE** o erro

---

## APLICAÇÃO UNIVERSAL

Esta regra aplica-se a **TODOS** os agentes sem excepção:
- `@dev`, `@qa`, `@sm`, `@po`, `@pm`, `@architect`, `@ux-design-expert`, `@analyst`, `@data-engineer`, `@devops`
- `@monster`, `@aiox-master`
- Todos os agentes de squads externos (design-system, marketing, legal, copy, etc.)
- Todas as skills (autopilot, ralph, ultrawork, tech-search, etc.)
- Todas as invocações directas ou via Task tool

**NÃO HÁ EXCEPÇÕES. NÃO HÁ DESCULPAS. ESTA REGRA TEM DE SER SEGUIDA SEMPRE.**

---

## FONTE DA VERDADE — CAMADAS

A ordem de leitura obrigatória antes de trabalhar na Frusoal é:

1. **`.claude/rules/frusoal-source-of-truth.md`** — esta regra
2. **`membros/cliente-frusoal/prompt-original.md`** — prompt que iniciou tudo
3. **`membros/cliente-frusoal/preplexity-pesquisa.txt`** — Fase A/B/C Perplexity (43KB)
4. **`membros/cliente-frusoal/gpt-pesquisa.txt`** — Fase A/B/C ChatGPT (5KB, fraca)
5. **`membros/cliente-frusoal/claude-pesquisa.txt`** — Fase A/B/C Claude (37KB, a melhor)
6. **`membros/cliente-frusoal/dossier-frusoal-v1.md`** — consolidação das 3 pesquisas

Se alguma destas camadas entrar em conflito com a anterior, **a camada mais acima prevalece** (o prompt manda sobre as pesquisas; as pesquisas mandam sobre o dossier).

---

**Data de criação:** 23/04/2026
**Agente responsável:** Uma (ux-design-expert) por ordem directa do Eurico
**Última revisão:** 23/04/2026
