# HANDOFF 10/04/2026 — Kit Fase 3 Reescrito + Teste Telmo P1 Validado

## Contexto critico (ler PRIMEIRO)

O Telmo Cerveira e um cliente REAL que contactou o Eurico via WhatsApp a 08/04/2026. O teste do pipeline da imersao e SIMULTANEAMENTE o projecto real do Telmo (FitCoach AI — Personal Trainer Virtual). O Eurico tem de entregar este projecto ao Telmo. NAO e um exercicio academico.

O kit `originai-kit-imersao.html` e o manual que os membros seguem na imersao. Cada alteracao aqui afecta directamente a experiencia dos participantes.

---

## O que foi feito nesta sessao

### 1. Kit Fase 3 reescrito — 7 passos para 6

| Antes | Depois | Razao |
|-------|--------|-------|
| P1: BG → exportar briefing-base.json | P1: BG → copiar 2 blocos (Payload + Blueprint) via Bloco de Notas → payload.md + blueprint.md | Alinhado com o fluxo real da ferramenta (confirmado por prints) |
| P2: Prompt generico com placeholders dourados | P2: Claude Code le ficheiros do P1 e gera prompt personalizado | IA le os ficheiros, prompt sai melhor |
| P3: Pesquisar em Perplexity + GPT + Grok | P3: Pesquisar em 3 LLMs a escolha do membro + cada LLM cria PRD tecnico | Cada membro usa as LLMs que prefere. LLM que pesquisou tem contexto completo para criar PRD |
| P4: Claude Code gera Relatorio Tecnico | P4: Claude Code funde 3 PRDs num PRD final unico | Antigos P4+P5 fundidos num so |
| P5: Claude Code gera PRD Enriquecido | ELIMINADO | Fundido no P3+P4 |
| P6: Construir | P5: Construir | Renumerado |
| P7: Deploy | P6: Deploy | Renumerado |

**Decisao-chave do Eurico:** as LLMs que fazem a pesquisa ja criam o PRD tecnico (porque tem o contexto completo). O Claude Code recebe o PRD pronto em vez de processar dados crus em segunda mao.

**Decisao-chave do Eurico:** o prompt P2 deve ser o MAIS detalhado possivel. Prompts simplificados produzem pesquisas piores. NUNCA simplificar este prompt.

**Decisao-chave do Eurico:** LLMs no kit devem ser genericas ("as 3 que mais usas"). NAO ditar Perplexity/ChatGPT/Gemini — cada membro tem as suas preferidas e ja tem historico com elas.

### 2. Teste do Briefing Generator — 5 prints analisados

| Print | Passo BG | O que mostra |
|-------|----------|-------------|
| passo-01.png | 1/4 | Nome: "Personal Trainer Virtual", Nivel: Avancado |
| passo-02.png | 2/4 | Dor preenchida. Deteccao automatica: "SaaS / Plataforma — Monolito Modular SaaS" |
| passo-03.png | 3/4 | 3 funcionalidades: planos de treino, acompanhamento, correccao exercicios/nutricao |
| passo4.png | 4/4 | Publico-alvo + campo "O que NAO queres" (opcional) |
| passo-05.png | Resultado | "Centro de Comando Ativado" — 3 botoes: Injetar AIOS, Prompt Optimizer, Exportar JSON |

### 3. Achados registados (F3-10 a F3-14)

| # | Tipo | Descricao | Accao |
|---|------|-----------|-------|
| F3-10 | INCONSISTENCIA | Ferramenta chama-se "Imersao AI Generator" mas kit chama "Briefing Generator" | Alinhar nome |
| F3-11 | CONFIRMADO | F3-6 confirmado: "Monolito Modular SaaS" aparece para PT virtual — deteccao hardcoded | Fix em SmartAI.ts:249 quando possivel |
| F3-12 | FALTA NO KIT | 3 botoes no resultado mas kit so menciona "Exportar Briefing JSON" | Kit actualizado — agora menciona os 2 botoes de copiar |
| F3-13 | VERIFICAR | Rodape diz "Passo 2 de 6" mas so ha 5 prints | Eurico confirmar se falta print |
| F3-14 | DECISAO | Kit reescrito de 7 para 6 passos | Feito nesta sessao |

---

## Estado actual do teste Telmo

| Passo | Estado | Ficheiros |
|-------|--------|-----------|
| P1 Briefing | FEITO (prints reais do BG) | teste-telmo/docs/passo-01..05.png |
| P2 Prompt Pesquisa | FEITO (simulado) | teste-telmo/docs/perguntas-pesquisa.md |
| P3 Pesquisas x3 | FEITO (simulado) | teste-telmo/docs/pesquisa-*.md |
| P4 PRD Tecnico | FEITO (simulado) | teste-telmo/docs/prd-final.md |
| P5 Construcao | PROXIMO | Eurico vai fazer hands-on com Claude Code |
| P6 Deploy | PENDENTE | |

**ATENCAO:** Os ficheiros P2-P4 foram SIMULADOS na sessao anterior (09/04). Para o projecto real do Telmo, o Eurico precisa de refazer com dados reais. Os prints do P1 sao reais.

**ATENCAO:** Os nomes dos ficheiros na pasta teste-telmo/ ainda usam a convencao antiga (briefing-base.json em vez de payload.md + blueprint.md, pesquisa-grok.md em vez de nome generico). Quando refizer com dados reais, usar os nomes novos do kit.

---

## Ficheiros alterados nesta sessao

| Ficheiro | Linha | Antes | Depois | Razao |
|----------|-------|-------|--------|-------|
| originai-kit-imersao.html | 1042-1055 | Flow 7 passos (P1-P7) | Flow 6 passos (P1-P6) | P4+P5 fundidos |
| originai-kit-imersao.html | 1059-1106 | P1: "Exportar Briefing JSON", 1 ficheiro | P1: copiar 2 blocos via Bloco de Notas, 2 ficheiros | Alinhado com fluxo real BG |
| originai-kit-imersao.html | 1111-1161 | P2: prompt generico com placeholders | P2: Claude Code le ficheiros e gera prompt personalizado | IA le docs, resultado melhor |
| originai-kit-imersao.html | 1164-1210 | P3: "Perplexity + GPT + Grok" | P3: "3 LLMs a tua escolha" + LLMs criam PRD | Generico + PRD integrado |
| originai-kit-imersao.html | 1212-1288 | P4 (Relatorio) + P5 (PRD) separados | P4: PRD Tecnico Final (funde 3 PRDs) | Simplificacao |
| originai-kit-imersao.html | 1290-1355 | P6 Construir + P7 Deploy | P5 Construir + P6 Deploy | Renumerados |
| originai-kit-imersao.html | 1360-1370 | Tabela resumo 7 linhas | Tabela resumo 6 linhas | Alinhada |
| TEST-LOG-TELMO.md | Achados | F3-9 era ultimo | F3-10 a F3-14 adicionados | 5 novos achados |
| TEST-LOG-TELMO.md | Timeline | Ultima entrada 09/04 | 2 entradas 10/04 adicionadas | Prints + rewrite |
| RETOMA-TESTE-TELMO.md | Ultima sessao | 09/04, verificacao achados | 10/04, kit reescrito, proximo P5 | Actualizada |

---

## Decisoes do Eurico a respeitar (citacoes directas)

1. **"nao estou aqui a brincar ao diz que disse"** — Prints vao SEMPRE para pasta fisica. Agente referencia por path. NUNCA confiar na sessao.

2. **"sou da opiniao que esse prompt seja o mais pormenorizado possivel porque e isso que vai fazer a diferenca na pesquisa"** — Prompt P2 deve ser DETALHADO. NUNCA simplificar.

3. **"para o membro usar as 3 LLMs que mais usa com frequencia"** — LLMs no kit sao genericas. NUNCA ditar quais.

4. **"vamos ter mesmo que desenvolver aquele personal trainer real para uso"** — Este projecto e REAL. Vai ser entregue ao Telmo. NAO e exercicio.

5. **"eu que vai tirar os prints e colocar directamente numa pasta"** — Eurico controla os prints. Agente referencia por path.

---

## Proximos passos

1. **Antes de P5:** Eurico precisa de decidir se refaz P1-P4 com dados reais (os actuais sao simulados) ou se avanca com os simulados para testar o fluxo de construcao primeiro
2. **P5 Construcao:** Eurico abre Claude Code na pasta teste-telmo/docs, cola o prompt do kit, a IA le o prd-final.md e constroi
3. **P6 Deploy:** GitHub + Vercel

---

## Achados pendentes (corrigir quando possivel)

- F3-6/F3-11: `generateProjectSeed` em SmartAI.ts:249 hardcoda "Monolito Modular SaaS" — fix na ferramenta BG
- F3-10: Nome da ferramenta inconsistente ("Imersao AI Generator" vs "Briefing Generator")
- F3-13: Falta print entre passo 4 e resultado (rodape diz "Passo 2 de 6")

---

## Ficheiros de referencia

| Ficheiro | Papel |
|----------|-------|
| `membros/telmo/handoffs/RETOMA-TESTE-TELMO.md` | Ponto de entrada — ler PRIMEIRO em qualquer sessao |
| `membros/telmo/handoffs/TEST-LOG-TELMO.md` | Diario completo do teste com todos os achados |
| `imersao-tools/docs/originai-kit-imersao.html` | Kit principal — o manual que os membros seguem |
| `membros/telmo/` | Pasta canónica do projecto (subpastas + handoffs + artefactos) |
| Memoria: `project_telmo_real_client.md` | Telmo e real, projecto e real, Eurico tem de entregar |
| Memoria: `feedback_prints_never_trust_session.md` | Prints em pasta fisica, NUNCA confiar na sessao |
| Memoria: `feedback_never_restart_context.md` | NUNCA recomecar do zero, ler RETOMA primeiro |

---

## Commit

`b62445d` — docs: rewrite kit Fase 3 — 7 steps to 6, real BG flow, LLM-agnostic

---

*Handoff gerado por Uma (@ux-design-expert) — 10/04/2026*
*Teste real com Telmo Cerveira — projecto FitCoach AI*
