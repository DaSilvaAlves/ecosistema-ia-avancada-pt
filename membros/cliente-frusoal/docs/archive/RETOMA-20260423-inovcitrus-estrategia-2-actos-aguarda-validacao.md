# RETOMA — Frusoal InovCitrus: estratégia em 2 actos, aguarda validação do Eurico para PRD v3

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

---

## Resumo Executivo (5 linhas)

Sessão de 23/04/2026 (terminal low, migração obrigatória). Produziu-se dossier v1 (consolidação de 3 pesquisas LLM) + PRD v1 (descartado por usar linguagem "combo") + PRD v2 (descartado por alvo errado: Frusoal-empresa) + regra inegociável `frusoal-source-of-truth.md` + prompt original preservado. **O Eurico clarificou estratégia em 2 actos: InovCitrus primeiro (entrada), Frusoal-empresa depois (expansão).** Uma apresentou análise honesta de capacidades + 3 opções de "hello world". **Próximo passo: Eurico valida 3 pontos → Uma escreve PRD v3 focado em Acto 1 InovCitrus.** NADA se avança sem validação.

---

## 1. Contexto do projecto

| Campo | Valor |
|-------|-------|
| Tipo | Cliente comercial (NÃO membro da comunidade) |
| Empresa | Frusoal — Frutas Sotavento Algarve, Lda (NIF 501186425) |
| Decisor | Pedro Madeira (sócio-gerente) — **Eurico conhece desde a infância** e vive perto |
| Alvo Acto 1 | **Frusoal InovCitrus** — polo I&D da Frusoal, lançado Fev/2026, sede em construção em Tavira |
| Alvo Acto 2 | Frusoal-empresa (toda) — operações, exportação, classificadora, BI, etc. |
| Parceiros científicos InovCitrus | **InnovPlantProtect** (entomologia, parceiro formal protocolo 15/11/2024) + **CCDR Algarve** (Centro Experimentação Agrária de Tavira) |
| Primeiro projecto InovCitrus | Trienal "Determinação da fenologia e ciclo de vida dos tripes (Scirtothrips aurantii) em pomares de citrinos do Algarve" |
| Gatekeeper IT da Frusoal-empresa | **Sisgarbe** (Portimão) — 39 anos de relação com PHC customizado. Nunca ameaçar. |

---

## 2. Estratégia em 2 Actos (CLARIFICADA PELO EURICO 23/04 — núcleo do propósito)

### Citação exacta do Eurico

> "para dizer a verdade são as 2. 1º ver analizar, como podiamos fazer algo nesse sentido da Inovcitrus. apresentar algo valioso para despertar e depois sim a frosual"

> "a minha ideia é uma missão impossivel, por isso eu queria ver até onde podiamos chegar e ver se faz sentido e temos alguma forma de ajudar"

### Tabela dos 2 actos

| Acto | Alvo | Objectivo | Porquê agora | Porquê primeiro/depois |
|------|------|-----------|--------------|-----------------------|
| **1º** | Frusoal InovCitrus (polo I&D) | Entrar como parceiro tecnológico-IA que amplifica (não substitui) a ciência. Apresentar "hello world" valioso que desperte. | Centro recém-criado (Fev/2026), janela co-construção aberta, tripes pouco estudado cientificamente = espaço real para contribuir | Pedro abre a porta via relação pessoal. Zero ameaça Sisgarbe. Credibilidade técnica construída aqui |
| **2º** | Frusoal-empresa | Com InovCitrus a funcionar e credibilidade construída, alargar à transformação digital das operações | Dossier v1 já tem análise completa das operações (exportação, classificadora, BI, crise hídrica) | Só depois do Acto 1 — entrada directa na empresa teria fricção Sisgarbe alta e linguagem vendor inadequada |

### Porquê é "missão impossível"

O InovCitrus **já tem ciência coberta** por parceiros formais (InnovPlantProtect, CCDR). Nós somos outsiders — não entomólogos, não I&D agrícola, sem historial citricultura. Para entrar, o nosso valor tem de ser:
- **Complementar** (não ameaçar quem já lá está)
- **Claro** (Pedro reconhece sem precisar de explicação)
- **Impossível de ignorar** (se não, porque nos abriria a porta?)

---

## 3. Estado actual dos entregáveis

| Entregável | Estado | Path |
|------------|--------|------|
| 3 pesquisas LLM originais | ✓ completas | `membros/cliente-frusoal/{preplexity,gpt,claude}-pesquisa.txt` |
| Prompt original (preservado) | ✓ criado 23/04 | `membros/cliente-frusoal/prompt-original.md` |
| Dossier v1 (análise consolidada Frusoal) | ✓ válido (reutilizar no Acto 2) | `membros/cliente-frusoal/dossier-frusoal-v1.md` |
| InovCitrus.txt (análise do polo I&D) | ✓ existia (Eurico forneceu) | `membros/cliente-frusoal/InovCitrus.txt` |
| Regra inegociável Frusoal | ✓ criada 23/04 | `.claude/rules/frusoal-source-of-truth.md` |
| PRD v1 (linguagem "combo") | ✗ **DESCARTADO** | — |
| PRD v2 (alvo errado Frusoal-empresa) | ⚠ **PARCIALMENTE OBSOLETO** — fica no disco mas vai ser reescrito | `membros/cliente-frusoal/02-prd/prd-entrada-frusoal.md` |
| **PRD v3 (Acto 1 InovCitrus + Acto 2 Frusoal)** | ✗ **PENDENTE** — aguarda validação Eurico | a produzir em `02-prd/prd-entrada-frusoal.md` (sobrescreve v2) |
| Handoff arquivado do dossier v1 | ✓ arquivado | `membros/cliente-frusoal/docs/archive/RETOMA-20260423-dossier-frusoal-v1-aguarda-producao.md` |

---

## 4. Análise honesta de capacidades — até onde podemos chegar no InovCitrus

Tabela apresentada ao Eurico 23/04 — aguarda validação dele sobre honestidade/realismo:

| Capacidade para oferecer ao InovCitrus | Conseguimos? | Observação |
|----------------------------------------|--------------|------------|
| **Visão computacional identificação tripes** em armadilhas cromotrópicas ou folhas | **Parcialmente** — protótipo com modelos pré-treinados sim, solução acabada requer dataset Algarve próprio | Realista se for "protótipo colaborativo" com dataset crescente. Irrealista se for "solução pronta" |
| **Dashboard/plataforma científica** (visualizar dados trienal: fenologia, ciclo de vida, geolocalização) | **Sim** — desenvolvimento web/data é o nosso campo | Quick win real. Valor científico directo para InnovPlantProtect citar em papers |
| **Pipeline de dados** (armadilhas/observações → BD → dashboard → relatórios) | **Sim** — arquitectura de dados standard | Quick win real |
| **Modelação preditiva** (ciclo vida, ondas infestação) | **Parcialmente** — ML clássico sim, requer dados iniciais. Só ano 2 do trienal viável | Prometer para ano 1 seria alucinação. Prometer como roadmap 3 anos é honesto |
| **Geração conteúdo científico-comunicacional** (posts, relatórios, vídeos) | **Sim** — IA generativa, workflows multilíngue | Quick win real demonstrável |
| **Acompanhamento tecnológico transversal** (infra, integrações, automação) | **Sim** — campo nosso | Base para relação longa |
| **Investigação entomológica** | **Não** — InnovPlantProtect cobre | Evitar expressamente. Nunca ocupar este espaço |
| **Peritagem agronómica** | **Não** — equipa técnica Frusoal + CCDR cobrem | Evitar expressamente |

---

## 5. Opções de "Hello World" apresentadas ao Eurico (23/04)

Aguarda escolha dele (A/B/C/combinação D):

| Opção | Descrição | Prazo | Custo |
|-------|-----------|-------|-------|
| **A** | **Protótipo visual de tripes** — fotos públicas + modelo pré-treinado + interface simples. Pedro tira foto → sistema identifica. Mostra o caminho, não é cientificamente rigoroso ainda | 2 semanas | Zero (ferramentas existentes) |
| **B** | **Dashboard do projecto trienal** — mockup com mapa Algarve (armadilhas), cronograma trienal, visualização dados a recolher, área para InnovPlantProtect publicar findings. Mostra dados→publicação+comunicação | 1 semana | Zero |
| **C** | **Pipeline de geração conteúdo científico multilíngue** — InovCitrus publica descobertas em PT/EN/ES/FR com IA (posts, newsletters, material educativo) | 1 semana | Zero |
| **D** | **Combinação A+B+C** em demo integrada 10-15 min | 2-3 semanas | Zero |

---

## 6. O que está PENDING — decisões do Eurico antes de PRD v3

Uma precisa destas 3 respostas do Eurico antes de escrever PRD v3. **NÃO AVANÇAR sem validação.**

| # | Pergunta pending | Minha recomendação Uma |
|---|-----------------|--------------------------|
| 1 | **Confirma estratégia em 2 actos** (InovCitrus primeiro, Frusoal-empresa depois)? | Confirmo — é o único caminho viável face a: (a) gatekeeper Sisgarbe, (b) missão impossível declarada, (c) relação pessoal Eurico↔Pedro como activo a capitalizar no Acto 1 |
| 2 | **A tabela de capacidades (secção 4) é honesta** ou estou a sobre-prometer/sub-prometer? | Conheces melhor a comunidade e os recursos — Eurico decide. Se a tabela subestima, dizer onde. Se sobrestima, dizer onde. |
| 3 | **Qual "hello world" escolher** (A/B/C/D)? | Recomendação inclinada para **D (combinação)** porque dá arsenal completo. Alternativa: **B (dashboard)** se priorizar velocidade (1 semana) e risco baixo |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO A QUE SE REFERE: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

**LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH:** ANTES DE PRODUZIR QUALQUER DOCUMENTO FRUSOAL NA PRÓXIMA SESSÃO, LER `.claude/rules/frusoal-source-of-truth.md` + `membros/cliente-frusoal/prompt-original.md` + ESTE HANDOFF INTEGRALMENTE. VIOLAÇÃO = PARAR, DESCARTAR, REFAZER.

---

## 7. Erros que NÃO PODEM ser repetidos na próxima sessão

Todos cometidos nesta sessão por Uma, todos corrigidos, todos têm memória associada:

| Erro | Por que não repetir | Memória associada |
|------|---------------------|-------------------|
| **Linguagem "combo" / "package" / "ROI em X meses como hook"** | Empresa com 45 anos de mercado não se aborda com packs promocionais. Eurico: "METE NOJE A MANEIRA COMO TRATAMOS A INFORMAÇÃO" | `feedback_nunca_combo_clientes_comerciais.md` |
| **Outreach cold/warm via LinkedIn DM ou intro 3º** | Eurico conhece Pedro Madeira desde a infância. Canal é presencial/informal | `project_frusoal_eurico_pedro_relacao.md` |
| **Projectar "segundos capítulos" não pedidos** (#3 App pragas) | Alucinação. Responder só ao pedido | `feedback_no_projected_business_models.md` |
| **Propor lista fechada de soluções como "o que vamos vender"** | É consultoria de implementação, não venda de produtos. Arsenal aberto, co-decidido com decisor | `feedback_nunca_combo_clientes_comerciais.md` |
| **Avançar sem ler prompt original** | Viola regra inegociável | `.claude/rules/frusoal-source-of-truth.md` |
| **Confundir alvo Frusoal-empresa com alvo InovCitrus** | São 2 actos separados — InovCitrus primeiro é a porta | Este handoff |
| **Inventar 7 perguntas de "due diligence corporativa"** que o Eurico não pediu | Propósito é analisar+apresentar soluções, não auditar capital interno | `project_frusoal_proposito.md` |

---

## 8. Decisões já consolidadas (preservar para PRD v3)

| # | Decisão consolidada | Origem |
|---|--------------------|--------|
| 1 | Propósito: analisar + ver até onde podemos chegar + apresentar algo valioso para despertar | Eurico 23/04 |
| 2 | Estratégia em 2 actos: InovCitrus primeiro, Frusoal-empresa depois | Eurico 23/04 |
| 3 | Canal de contacto: presencial/informal (Eurico conhece Pedro desde infância, vive perto) | Eurico 23/04 |
| 4 | "Primeiro vemos o que vamos apresentar, depois quem assina" — assinante é decisão adiada | Eurico 23/04 |
| 5 | Posicionamento declarado no prompt original: "Consultor de implementação de IA" | Prompt original |
| 6 | Zero combos, zero packages, zero linguagem vendor SaaS | Eurico 23/04 |
| 7 | Respeitar gatekeeper Sisgarbe (nunca ameaçar o PHC no Acto 1 ou Acto 2) | Dossier v1 + prompt original |
| 8 | Não inventar casos — só dados reais verificados. Marcar [GAP] sempre que não confirmar | Prompt original (regra 7) |
| 9 | PT-PT estrito, citar fontes, tabelas markdown | Prompt original (regras 1-6) |

---

## 9. Como começar a próxima sessão

**Agente recomendado:** `@ux-design-expert` (Uma) — continua ciclo iniciado nesta sessão.

**Comandos de arranque:**

```
@ux-design-expert
```

Depois Uma faz greeting e detecta este handoff via HANDOFF-INDEX. Diz:

> "Detectei handoff pending Frusoal InovCitrus de 23/04 (estratégia 2 actos, aguarda validação). Avanço?"

**Ordem obrigatória de leitura na próxima sessão (ANTES DE QUALQUER OUTPUT):**

1. `.claude/rules/frusoal-source-of-truth.md` (regra inegociável)
2. `membros/cliente-frusoal/prompt-original.md` (fonte da verdade)
3. **Este handoff integralmente**
4. `membros/cliente-frusoal/dossier-frusoal-v1.md` (análise Frusoal-empresa, reutilizada no Acto 2)
5. `membros/cliente-frusoal/InovCitrus.txt` (análise do polo I&D, base do Acto 1)
6. `membros/cliente-frusoal/claude-pesquisa.txt` (pesquisa mais completa)
7. Memórias relevantes (ver secção 10 abaixo)

**Depois de ler, a primeira acção é perguntar ao Eurico as 3 validações pending (secção 6 deste handoff).**

NÃO escrever PRD v3, deck, proposta ou qualquer material novo até Eurico responder às 3 perguntas.

---

## 10. Memórias relevantes (ler antes de trabalhar)

| Memória | Relevância |
|---------|-----------|
| `project_frusoal_proposito.md` | Propósito correcto (não due diligence) |
| `project_frusoal_eurico_pedro_relacao.md` | Eurico conhece Pedro desde infância, vive perto — canal presencial |
| `feedback_nunca_combo_clientes_comerciais.md` | Zero linguagem "combo/package" — consultoria estratégica plurianual |
| `feedback_no_projected_business_models.md` | Responder só ao pedido, não projectar segundos capítulos |
| `feedback_handoffs_detail.md` | Handoffs têm decisões exactas + citações + contexto |
| `feedback_no_invented_cases.md` | Zero exemplos fictícios — só dados reais |
| `feedback_community_acolhe_adapta_model.md` | **NÃO aplica a Frusoal** — Frusoal é cliente comercial, não membro. Aplicar lógica comercial, não comunitária |
| `feedback_governance_never_blocks_execution.md` | Não usar workspace-governance como bloqueador — propor caminho concreto |

---

## 11. Pontos críticos de contexto emocional (para o próximo agente)

- **Eurico saiu frustrado** com atrofias anteriores — "mete noje a maneira como tratamos a informação"
- **Tolerância zero** para nova alucinação ou erro de framing
- **Terminal actual está low** — migração para terminal fresh é obrigatória, sem perder contexto (daí este handoff detalhado)
- **Posicionamento emocional correcto na próxima sessão:** humildade, precisão, honestidade sobre capacidades, zero sobre-promessa. Par consultivo, não vendor excitado.

---

## 12. Risco máximo na próxima sessão e mitigação

**Risco:** O próximo agente não ler o prompt original nem este handoff na íntegra, voltar a propor "combo/package", Eurico perde confiança permanentemente.

**Mitigação:**
1. Regra `frusoal-source-of-truth.md` criada em `.claude/rules/` — toda activação de qualquer agente para Frusoal obriga leitura
2. Este handoff reforça a regra nos 3 blocos (início/meio/fim)
3. Primeira pergunta do agente na próxima sessão DEVE ser "posso confirmar que li prompt-original.md e frusoal-source-of-truth.md?"

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260423-inovcitrus-estrategia-2-actos-aguarda-validacao.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260423-inovcitrus-estrategia-2-actos-aguarda-validacao.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 23/04/2026
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — continuidade cross-terminal)

---

*Fim do handoff — pronto para consumo em qualquer terminal fresh. Zero perda de contexto esperada.*
