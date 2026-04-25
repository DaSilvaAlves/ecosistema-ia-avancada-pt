# RETOMA — Frusoal InovCitrus: 5 espaços complementares analisados, aguarda validação de 28 perguntas antes de PRD v3

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

---

## Resumo Executivo (6 linhas)

Sessão de 24/04/2026 (continuação directa da sessão 23/04 após migração de terminal). Uma consumiu o handoff anterior e, em vez de escrever PRD v3 de imediato, o Eurico redireccionou para trabalho de casa: **entender o InovCitrus, a sua origem, dor raiz e razão principal antes de propor**. Dessa análise veio descoberta crítica — a **InnovPlantProtect já tem linha digital completa** (Pest Analyzer, PhenoAnalytics, iCountPests, FlashGrowthInib, SIG georreferenciado, ML preditivo, drone imagery) que colidia directamente com o hello world proposto anteriormente. Reformulada a tese: o nosso espaço é **complementar, não duplicador**. Identificados **5 espaços livres** onde o nosso valor cabe sem colidir com InPP, CCDR ou Sisgarbe. Cada um dos 5 foi analisado em profundidade (7 dimensões: o que apresentamos, mecânica, valor, risco de colisão, validação de capacidades reais, hello world possível, perguntas). **Próximo passo obrigatório: Eurico responde às 28 perguntas compiladas; só depois Uma escreve PRD v3.**

---

## 1. Contexto do projecto (mantido da sessão anterior)

| Campo | Valor |
|-------|-------|
| Tipo | Cliente comercial (NÃO membro da comunidade) |
| Empresa | Frusoal — Frutas Sotavento Algarve, Lda (NIF 501186425) |
| Decisor | Pedro Madeira (sócio-gerente) — **Eurico conhece desde a infância** e vive perto |
| Alvo Acto 1 | **Frusoal InovCitrus** — polo I&D da Frusoal, lançado Fev/2026, sede em construção em Tavira |
| Alvo Acto 2 | Frusoal-empresa (toda) — operações, exportação, classificadora, BI, etc. |
| Parceiro científico formal | **InnovPlantProtect** (entomologia + biosoluções + DIGITAL) — protocolo 15/11/2024 |
| Parceiro científico co-localizado | **CCDR Algarve** — Centro Experimentação Agrária de Tavira |
| Gatekeeper IT Frusoal-empresa | **Sisgarbe** (Portimão) — 39 anos de relação com PHC customizado. Nunca ameaçar |
| Primeiro projecto InovCitrus | Trienal "Determinação da fenologia e ciclo de vida dos tripes (Scirtothrips aurantii) em pomares de citrinos do Algarve" |

---

## 2. O que aconteceu nesta sessão 24/04/2026 — cronologia

| # | Evento | Output |
|---|--------|--------|
| 1 | Uma activada, detectou e consumiu handoff de 23/04 | Confirmação de leitura de prompt-original.md + rule frusoal-source-of-truth.md + handoff anterior |
| 2 | Uma apresentou 3 validações pendentes (estratégia 2 actos, tabela capacidades, hello world A/B/C/D) | Eurico respondeu: alinhado com propósito, mas "vamos focar no que temos condições de entregar" + redireccionou para trabalho de casa (imagem da tabela capacidades) |
| 3 | Uma interpretou "focar no que temos condições" → cortar os "parcialmente" e consolidar os "Sim" | Proposta: hello world B+C (dashboard + conteúdo multilíngue) |
| 4 | Eurico travou: "esperando dados furnecidos, temos que fazer o nosso trabalho de casa, entender o InovCitrus. identificar a sua maior dor, o que deu origem, o que pretendem resolver" | Uma parou. Voltou à leitura |
| 5 | Uma leu InovCitrus.txt + dossier-frusoal-v1.md integralmente | Análise estruturada da origem, 6 pressões convergentes, dor raiz, razão principal em uma linha |
| 6 | Eurico pediu análise de iplantprotect.pt | Uma fez WebFetch ao site InPP (home + produtos-e-servicos + navegação) |
| 7 | **DESCOBERTA CRÍTICA:** InPP tem 4 produtos digitais próprios (FlashGrowthInib, Pest Analyzer, PhenoAnalytics, iCountPests) + SIG + ML preditivo + drone imagery + apps mobile | Hello world B+C que Uma tinha proposto **colidia directamente** com o core business do parceiro científico |
| 8 | Uma reformulou tese: nosso espaço = complementar. Identificou 5 espaços livres | Tabela 5 espaços apresentada ao Eurico |
| 9 | Eurico: "vamos focar no que fica em aberto. o que conseguiamos apresentar e o valor disso, mas vamos analizar 1 a 1" | Uma criou 5 tasks, analisou 1 a 1 com 7 dimensões cada |
| 10 | Espaço 1 — Comunicação científica multilíngue (PT/EN/ES/FR) — analisado | Aprovação implícita, avanço |
| 11 | Espaço 2 — Orquestração multi-fonte — analisado | Eurico: "muito bom este Espaço 2. gostei. vamos continuar" |
| 12 | Espaço 3 — Infraestrutura pública do centro — analisado, Eurico questionou legitimidade (InPP já tem site) | Uma clarificou distinção InPP ≠ InovCitrus, apresentou 3 níveis (A/B/C) |
| 13 | Espaço 4 — Automação administrativa e regulatória — analisado | Aprovação implícita, avanço |
| 14 | Espaço 5 — Integração Frusoal-empresa ↔ InovCitrus (ponte Acto 1 → Acto 2) — analisado | Análise completa, síntese arquitectural dos 5 espaços apresentada |
| 15 | Eurico pediu handoff para migrar para terminal sem contexto | Este documento |

---

## 3. Descoberta crítica — InPP tem linha digital completa (anti-colisão obrigatória)

Esta é a descoberta que tem de guiar TODO o PRD v3. Se o próximo agente a ignorar, repetimos o erro de sobre-promessa da sessão 23/04.

### 3.1 Produtos digitais da InPP já comercializados/em pipeline

Fonte: `https://iplantprotect.pt/produtos-e-servicos/` + home + navegação.

| Produto InPP | Função | Implicação para nós |
|--------------|--------|----------------------|
| **Pest Analyzer** | Detecção de pragas multi-cultura via análise de imagem | Nunca propor visão computacional de tripes. É deles |
| **iCountPests** | App mobile para pragas (vinha — cigarrinha, traças). Estrutura replicável para citrinos | Nunca propor app mobile para contagem/identificação de pragas |
| **PhenoAnalytics** | Monitorização de eficiência/fenologia de culturas | Nunca propor dashboard fenológico do trienal |
| **FlashGrowthInib** | Optimização de eficiência/inibição | Nunca propor modelação preditiva de ciclo de vida |

### 3.2 Serviços digitais InPP declarados

1. **Sistemas de apoio à decisão baseados em SIG** — dashboards georreferenciados para pragas e doenças
2. **Aplicações digitais web e mobile** para recolha de dados georreferenciados (culturas, clima, pragas, doenças)
3. **AI-powered drone image analysis** — visão computacional com drones
4. **Modelos ML que modelam progressão de pragas e doenças em tempo real** — modelação preditiva

### 3.3 Serviços Customizados InPP

Do site: "serviços flexíveis e personalizados, contratos para desenvolvimento de novos produtos" + consultoria técnica. **Isto é aviso crítico:** se pedirem ao InPP para desenvolver algo específico para o InovCitrus, podem fazer. Temos de estar claramente num espaço que não é esse.

### 3.4 Identidade e escala da InPP

| Dimensão | Valor | Fonte |
|----------|-------|-------|
| Tipo | Centro de I&D autónomo com múltiplos associados | Home + Associados |
| Sede | Elvas (Alentejo) | Contactos |
| Associados | Syngenta, Bayer CropScience, Fertiprado, Hubel Verde, Ascenza, UÉvora, UNL, Politécnicos (Santarém, Portalegre), INIAV, FNOP, ANPROMIS, ANPOC, Lusosem, CEBAL, Câmara Elvas | Secção Associados |
| Culturas cobertas | Tomate (TomaBioTec), arroz, milho, pastagens, vinha, citricultura (via Frusoal) | Projectos |
| Financiamento | PRR + NextGenerationEU + fundos associados | Footer logos |
| Tagline | "Inovar juntos. Proteger melhor." | Banner |
| Missão declarada | "Desenvolvemos biosoluções inovadoras que promovem a saúde das plantas, e soluções digitais para uma gestão agrícola mais precisa e eficiente" | Banner |

**Conclusão:** InPP **NÃO é só científica**. É científica+digital, com vocação comercial clara. Qualquer proposta nossa que replique capacidades deles é colisão automática.

---

## 4. Os 5 espaços complementares analisados (status final)

### 4.1 Visão consolidada — como os 5 encaixam

```
ESPAÇO 5 — Carta de Ponte (espinha estratégica que tudo abraça)
                   │
        ┌──────────┼──────────────┐
        ↓          ↓              ↓
    ESPAÇO 3   ESPAÇO 1       ESPAÇO 4
    Site       Comunicação    Automação
    InovCitrus multilíngue    administrativa
        │          │              │
        └──────────┼──────────────┘
                   ↓
              ESPAÇO 2
              Cockpit / Orquestração
              (camada operacional comum)
```

**Ordem recomendada por Uma** se o Pedro quiser priorizar: **5 → 1 → 3 → 4 → 2**.
- Se o Pedro quiser **fazer só 1 coisa no Acto 1**: Espaço 5 (Carta de Ponte)
- Se **2 coisas**: 5 + 1 (ponte + comunicação — impacto público mais rápido)

### 4.2 Tabela síntese dos 5 espaços

| Espaço | O que é | Hello world (tempo / custo) | Risco colisão principal | Valor central |
|--------|---------|-----------------------------|--------------------------|----------------|
| **1** Comunicação científica multilíngue PT/EN/ES/FR | Fábrica editorial que amplifica ciência InPP em 4 línguas, 6 formatos, ao longo do trienal | 3-5 dias / 0€ | BAIXO (InPP publica relatórios, nós editorial divulgativo) | Visibilidade científica internacional + pull B2B + defesa IGP |
| **2** Orquestração multi-fonte | Cockpit lateral que cruza InPP + CCDR + Frusoal operacional + associados + meteo + alertas DRAP | 5-7 dias / 0€ | MÉDIO SIG InPP; MÁX Sisgarbe se tocar PHC | Visibilidade transversal + velocidade de decisão + memória institucional |
| **3** Infraestrutura pública do centro | Casa digital do InovCitrus — 3 níveis (A=página frusoal.pt / B=subdomínio / C=domínio próprio) | 5-7 dias / 0-15€/ano | BAIXO (não colide com InPP nem CCDR) | Legitimidade institucional + candidaturas europeias + recrutamento |
| **4** Automação administrativa e regulatória | Espinha administrativa: candidaturas, relatórios PO OP, reporting PRR, calendário regulatório, AI Act diagnóstico | 5-7 dias / 0€ | MÉDIO consultor fundos se existe; MÉDIO contabilista | Tempo executivo libertado 50-70% + mais candidaturas viáveis + memória institucional |
| **5** Carta de Ponte Acto 1 → Acto 2 | Arquitectura formal da relação InovCitrus ↔ Frusoal-empresa + roadmap 36 meses + Sisgarbe preservada | 5-7 dias / 0€ | MÁX Sisgarbe se mal posicionado | Justificação institucional + sequenciamento estratégico + fricção Acto 2 reduzida |

### 4.3 O que o próximo agente NÃO pode propor no Acto 1 (listas de proibições)

Por colisão com InPP:
- Visão computacional identificação de pragas
- Dashboard SIG georreferenciado de pragas/doenças
- App mobile para contagem/identificação de pragas
- Modelação preditiva de ciclo vida ou progressão pragas
- Drone imagery analysis
- Pipeline de dados pragas (recolha → BD → análise) — é Pest Analyzer

Por colisão com Sisgarbe:
- Qualquer escrita no PHC
- Qualquer proposta de substituir módulos PHC
- EDI retalhista (Continente, Lidl, Mercadona) — Acto 2
- BI/reporting operacional comercial — Acto 2
- Integração ERP-CRM — Acto 2

Por colisão com CCDR:
- Sobreposição a ensaios de campo do Centro Experimentação Agrária de Tavira

Por fora do mandato Acto 1:
- Pegada carbono / CSRD reporting — Acto 2
- IGP documentação formal — Acto 2
- EU-PHP fitossanitário — Acto 2
- Whistleblowing — Acto 2 (aplica à Frusoal-empresa 150+ funcionários)

---

## 5. COMPILAÇÃO DE 28 PERGUNTAS PENDENTES AO EURICO (núcleo deste handoff)

**Estas perguntas DEVEM ser respondidas (mesmo que parcialmente) antes de qualquer redacção de PRD v3.** Estão organizadas por espaço + secção transversal final.

### 5.1 Espaço 1 — Comunicação científica multilíngue (5 perguntas)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **1.A** | Concordas que o valor real está em **visibilidade científica internacional + pull comercial B2B + defesa IGP**, ou estou a sub/sobre-valorizar alguma dimensão? | Alinhar pitch ao Pedro |
| **1.B** | Temos na comunidade IA AVANÇADA voluntários com background científico/técnico para qualidade editorial em PT? Ou esta capacidade fica só em mim/ti? | Define escala possível |
| **1.C** | Modelo: **serviço pago** à Frusoal, **custo zero como porta de entrada**, ou **partilha de valor** (ex: publicamos, Frusoal cobre ferramentas + dá referências)? | Posicionamento comercial |
| **1.D** | **Vídeo entra ou fica de fora do hello world?** +1 dia de trabalho | Escopo do demo |
| **1.E** | Devemos no demo incluir **menção explícita à InPP como parceiro** com cross-tag, ou aguardamos aprovação Pedro → Pedro Madeira? | Define se assumimos relação ou aguardamos |

### 5.2 Espaço 2 — Orquestração multi-fonte (5 perguntas)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **2.A** | A leitura "Pedro tem informação fragmentada em 5+ fontes" é realista ou estou a inferir uma dor que não existe? | Valida premissa central |
| **2.B** | É **politicamente viável pedir aos 60+ associados para reportar via app**, ou esta camada é só interna Frusoal+InPP+CCDR no Acto 1? | Define escopo de utilizadores |
| **2.C** | A **Sisgarbe é abordada agora** (Acto 1) para negociar API read-only do PHC, ou é tema do Acto 2 e cockpit funciona sem PHC? | Cockpit standalone vs integrado |
| **2.D** | Pode haver **risco de a InPP ver o cockpit como "alguém a olhar para os ombros deles"**? Como mitigar politicamente? | Diplomacia científica |
| **2.E** | **Custo recorrente 80-200€/mês — quem paga?** Frusoal, PRR/PO OP, ou nós absorvemos como porta de entrada? | Modelo comercial |

### 5.3 Espaço 3 — Infraestrutura pública do centro (6 perguntas)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **3.A** | Dos **3 níveis** (A=página frusoal.pt / B=subdomínio / C=domínio próprio `inovcitrus.pt`), qual defendemos ao Pedro? Ou apresentamos os 3 no PRD e deixamos ele escolher? | Decisão de arquitectura institucional |
| **3.B** | **Línguas no arranque:** PT+EN (recomendação) ou já PT/EN/ES/FR? 4 línguas no arranque = +1 semana escopo | Escopo do hello world |
| **3.C** | **Identidade visual:** proposta nossa inicial ou Pedro contrata estúdio branding premium? | Nível de ambição visual |
| **3.D** | **Repositório científico aberto (Zenodo/DOIs):** avançamos já no Acto 1 ou aguardamos autorização InPP (donos da ciência)? | Depende da InPP |
| **3.E** | **Manutenção plurianual:** site só faz sentido com Espaço 1 ativo (pipeline editorial). Confirmas que Espaços 1+3 andam sempre juntos? | Compromisso de continuidade |
| **3.F** | **Fotografia profissional (Algarve, 500-1.500€):** contratamos ou usamos foto existente/aguardamos? | Qualidade visual do site |

### 5.4 Espaço 4 — Automação administrativa e regulatória (5 perguntas)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **4.A** | A Frusoal/InovCitrus tem **consultor de fundos contratado**, ou Pedro/Manuel fazem candidaturas com apoio interno? | Define posicionamento ("ferramenta para consultor" vs "infraestrutura para Pedro") |
| **4.B** | Há **candidaturas históricas digitalizáveis** (PRR, PT2030, PDR2020, PEPAC) para extrair como templates iniciais? | Base de conhecimento arranca cheia ou vazia |
| **4.C** | **Limite de escopo:** confirmas Acto 1 = só admin científico-institucional do InovCitrus? Contabilidade Frusoal, EDI, IGP, EU-PHP = Acto 2 | Evita sobre-promessa |
| **4.D** | **AI Act 2026:** demo inclui diagnóstico de exposição ou fica tema separado? Pode ser diferencial no pitch | Nível de ambição do demo |
| **4.E** | **Qual aviso real escolho para template demo PEPAC?** Eurico tem preferência (PEPAC / Horizonte Europa Cluster 6 / PRR IFIC)? | Concretude do demo |

### 5.5 Espaço 5 — Carta de Ponte Acto 1 → Acto 2 (6 perguntas)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **5.A** | Confirmas que no Acto 1 a ponte fica **conceptual** (Carta + roadmap + catálogo) e **nada de execução do Acto 2** sem decisão futura explícita do Pedro? | Disciplina de escopo |
| **5.B** | Quem é o **guardião da ponte** do lado Frusoal — Pedro sozinho, Pedro+Manuel em par, ou inclui equipa técnica? | RACI |
| **5.C** | Os **60+ associados** entram como stakeholders visíveis na Carta de Ponte (transparência total) ou ficam contexto sem papel formal no Acto 1? | Governance e comunicação |
| **5.D** | **Sisgarbe na Carta de Ponte:** convidamos a validar formalmente antes da assinatura Pedro+Manuel, ou damos Carta como facto consumado e abrimos Sisgarbe só no Acto 2? | Risco político crítico |
| **5.E** | **Visita à central VN Cacela** antes de finalizar Carta: necessária no Acto 1 ou aguardamos primeira reunião com Pedro? | Fundamentação real vs dossier |
| **5.F** | Há **trade-offs específicos no roadmap 36 meses** que já tenhas em mente e que não vi no dossier v1 (ex: prioridade absoluta em rega por crise hídrica, ou prioridade em automação docs por expansão Canadá)? | Sequenciamento estratégico |

### 5.6 Perguntas transversais (1 pergunta)

| # | Pergunta | Por que importa |
|---|----------|------------------|
| **TR.A** | Dos 5 espaços analisados, qual(is) quer que o PRD v3 **defenda como núcleo do Acto 1** e qual(is) fica(m) como **opcionais ou diferidos**? Uma recomenda: núcleo = 5+1 mínimo, 5+1+3 ideal, 5 todos se houver apetite; mas a decisão é tua | Define escopo real do Acto 1 |

**Total: 28 perguntas. Nenhuma exige resposta detalhada — uma palavra ou uma linha chegam para a maioria.**

---

## 6. Ordem de leitura obrigatória para o próximo agente (antes de qualquer output)

1. `.claude/rules/frusoal-source-of-truth.md` — regra inegociável
2. `.claude/rules/handoff-location.md` — regra handoff
3. `.claude/rules/handoff-central.md` — protocolo cross-terminal
4. `membros/cliente-frusoal/prompt-original.md` — posicionamento "consultor de implementação de IA"
5. **Este handoff integralmente** (RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md)
6. `membros/cliente-frusoal/InovCitrus.txt` — análise factual do polo I&D
7. `membros/cliente-frusoal/dossier-frusoal-v1.md` — análise Frusoal-empresa (reutilizar no Acto 2)
8. `https://iplantprotect.pt/` — visitar secções home + produtos-e-servicos + projectos (entender o parceiro científico)
9. Memórias relevantes (secção 8 abaixo)

**Handoffs arquivados disponíveis em `membros/cliente-frusoal/docs/archive/`:**
- `RETOMA-20260423-dossier-frusoal-v1-aguarda-producao.md` (consumado 23/04)
- `RETOMA-20260423-inovcitrus-estrategia-2-actos-aguarda-validacao.md` (consumado 24/04)

---

## 7. Primeira acção do próximo agente na nova sessão

**Agente recomendado:** `@ux-design-expert` (Uma) — continuidade directa.

**Sequência obrigatória:**

1. Activar `@ux-design-expert`
2. Na resposta de greeting, dizer explicitamente: **"Detectei handoff pending RETOMA-20260424 Frusoal InovCitrus — 5 espaços analisados, aguarda resposta às 28 perguntas compiladas. Li prompt-original.md, rule frusoal-source-of-truth.md e este handoff integralmente."**
3. Apresentar a **COMPILAÇÃO DE 28 PERGUNTAS** (secção 5 deste handoff) ao Eurico em formato legível, organizada por espaço, para ele responder de seguida.
4. **NÃO escrever PRD v3 até Eurico responder.**
5. Mesmo que o Eurico responda apenas a um subconjunto das perguntas, o PRD v3 deve ser escrito com **lacunas marcadas [AGUARDA EURICO]** nas perguntas não respondidas — nunca inventar a resposta.

---

## 8. Memórias relevantes (ler antes de trabalhar)

| Memória | Relevância |
|---------|-----------|
| `project_frusoal_proposito.md` | Propósito correcto (não due diligence) |
| `project_frusoal_eurico_pedro_relacao.md` | Eurico conhece Pedro desde infância, vive perto — canal presencial |
| `feedback_nunca_combo_clientes_comerciais.md` | Zero linguagem "combo/package" — consultoria estratégica plurianual |
| `feedback_no_projected_business_models.md` | Responder só ao pedido, não projectar segundos capítulos |
| `feedback_handoffs_detail.md` | Handoffs têm decisões exactas + citações + contexto |
| `feedback_no_invented_cases.md` | Zero exemplos fictícios — só dados reais |
| `feedback_community_acolhe_adapta_model.md` | **NÃO aplica a Frusoal** — Frusoal é cliente comercial, não membro |
| `feedback_governance_never_blocks_execution.md` | Não usar workspace-governance como bloqueador |
| `feedback_todolist_source_of_truth.md` | Cruzar fontes antes de perguntar |
| `feedback_nexus_not_news.md` | (não aplicável aqui, mas contexto geral do estilo Eurico) |
| `feedback_save_analysis.md` | Gravar em memória antes de implementar |
| `feedback_never_restart_context.md` | Nunca recomeçar do zero — ler handoff + memória |

---

## 9. Decisões consolidadas nesta sessão (preservar para PRD v3)

| # | Decisão | Origem |
|---|---------|--------|
| 1 | Propósito, estratégia 2 actos e canal de contacto **já consolidados na sessão 23/04** — preservar | Handoff 23/04 |
| 2 | **InPP tem linha digital completa** — não propor visão computacional, SIG pragas, ML preditivo pragas, app contagem pragas, drone imagery | Descoberta 24/04 via iplantprotect.pt |
| 3 | Nosso espaço = **complementar, não duplicador**. 5 espaços livres identificados e analisados | Sessão 24/04 |
| 4 | **Acto 1 não toca PHC**. Sisgarbe continua dona da espinha operacional | Mantido do handoff 23/04 + reforçado em Espaço 2 e 5 |
| 5 | **Arquitectura sugerida:** Espaço 5 (Carta Ponte) como espinha; Espaço 2 como base operacional; Espaços 1+3+4 como entregáveis visíveis | Sessão 24/04 |
| 6 | **Ordem recomendada se priorizar:** 5 → 1 → 3 → 4 → 2 | Sessão 24/04 |
| 7 | **Honestidade obrigatória sobre capacidades:** Uma não é consultora de fundos, não é advogada, não é contabilista, não negoceia com Sisgarbe. É infraestrutura digital que amplifica quem faz essas funções | Análise capacidades reais 24/04 |
| 8 | **Hello worlds todos a custo zero**, 3-7 dias cada. Demos reais onde possível, mockups onde necessário (com honestidade sobre a diferença) | Análise por espaço |
| 9 | **Não prometer cobertura científica profunda** sem revisor humano da InPP/CCDR no loop. Sem revisor, não publicamos | Espaço 1 + 3 |
| 10 | **Não atacar o InPP** — posicionar sempre como parceiro. Cross-tag obrigatório em todas as comunicações | Prevenção de colisão política |

---

## 10. Erros que NÃO PODEM ser repetidos (reforço da sessão 23/04 + novos da sessão 24/04)

| Erro | Origem | Por que não repetir | Memória associada |
|------|--------|---------------------|-------------------|
| "Combo" / "package" / "ROI em X meses como hook" | Erro sessão 23/04 | Linguagem vendor SaaS | `feedback_nunca_combo_clientes_comerciais.md` |
| Outreach cold/warm via LinkedIn DM | Erro sessão 23/04 | Eurico conhece Pedro desde infância | `project_frusoal_eurico_pedro_relacao.md` |
| Projectar "segundos capítulos" não pedidos | Erro sessão 23/04 | Alucinação | `feedback_no_projected_business_models.md` |
| Confundir Frusoal-empresa com Frusoal InovCitrus | Erro sessão 23/04 | Acto 1 vs Acto 2 | Handoff 23/04 |
| **Propor ferramentas que colidem com core business do parceiro científico InPP** | **Erro novo sessão 24/04** | Visão computacional pragas, SIG, ML preditivo, app mobile contagem são InPP | **ESTA SESSÃO** |
| **Avançar com hello world antes de entender a dor raiz** | **Erro novo sessão 24/04** | Eurico travou: "esperando dados furnecidos, temos que fazer o nosso trabalho de casa" | **ESTA SESSÃO** |
| **Propor entregáveis sem clarificar onde cabe** | **Erro novo sessão 24/04** | Espaço 3 — Eurico perguntou "InPP já tem site, não entendi este entregável". Uma teve de clarificar depois, não antes | **ESTA SESSÃO** |
| Avançar sem ler prompt original | Erro sistémico | Viola regra inegociável | `.claude/rules/frusoal-source-of-truth.md` |
| Inventar dados sobre InPP, Pedro, Sisgarbe | Erro sistémico | Violação prompt original regra 3 (não inventar) | `feedback_no_invented_cases.md` |
| Escrever PRD v3 antes de Eurico responder às 28 perguntas | Risco novo | Repetir padrão do PRD v1 (descartado) e v2 (descartado) | **ESTA SESSÃO** |

---

## 11. Risco máximo na próxima sessão e mitigação

**Risco:** O próximo agente, pressionado por tempo ou desejo de entregar, decide escrever PRD v3 antes de Eurico responder às 28 perguntas — inventando respostas "razoáveis" para as lacunas. Resultado: PRD v3 cheio de inferências ocultas que o Eurico vai detectar e descartar (tal como v1 e v2).

**Mitigação em 4 camadas:**

1. Este handoff tem secção 5 com as 28 perguntas explícitas
2. A secção 7 (primeira acção) ordena: apresentar perguntas, não PRD
3. A secção 9 (decisão 10) obriga a não inventar respostas — marcar `[AGUARDA EURICO]` onde falte resposta
4. A secção 10 lista "escrever PRD v3 antes de Eurico responder" como erro proibido

**Se o Eurico responder só a metade das perguntas:** PRD v3 escreve-se com lacunas marcadas `[AGUARDA EURICO — pergunta X.Y]`, e o próprio PRD v3 tem uma secção final "Decisões pendentes do Eurico" com a lista das perguntas em aberto.

---

## 12. Pontos críticos de contexto emocional (para o próximo agente)

- **Eurico apreciou a disciplina desta sessão** — "muito bom este Espaço 2. gostei"
- **Tolerância zero mantida** para alucinação, framing vendor, sobre-promessa
- **Reconhece-se humildade:** Uma parou quando Eurico redireccionou ("vamos fazer trabalho de casa"). Isto preservou confiança
- **Posicionamento emocional correcto na próxima sessão:** parceiro par do Eurico, consultor humilde, zero excitação performativa. Tom curto, tabelas, factos, perguntas directas
- **Aguardar antes de agir** — o Eurico quer decidir com informação estruturada, não receber propostas "úteis que ele pode editar"

---

## 13. Output que o próximo agente vai produzir (quando Eurico responder)

**PRD v3** em `membros/cliente-frusoal/02-prd/prd-entrada-frusoal.md` (sobrescreve v2 que é obsoleto).

**Estrutura esperada do PRD v3** (esqueleto, não conteúdo):

1. **Capa + fontes de verdade** (prompt original + handoffs + regras)
2. **Sumário executivo 1 página** — estratégia 2 actos, 5 espaços escolhidos pelo Eurico como núcleo Acto 1, data estimada de primeira conversa Pedro
3. **Contexto do InovCitrus** (origem, 6 pressões convergentes, razão principal em uma linha)
4. **Anti-colisão InPP — o que NÃO propomos e porquê** (explicar linha digital completa InPP)
5. **Espaços do Acto 1 escolhidos pelo Eurico** — detalhe de cada um conforme análise 24/04
6. **Hello world(s) escolhido(s)** — tempo, custo, entregáveis concretos
7. **Roadmap 36 meses Acto 1 + Acto 2** (visual)
8. **Matriz RACI Frusoal + InovCitrus + InPP + CCDR + Sisgarbe (preservada) + nós**
9. **Governance de dados e linha vermelha Sisgarbe** (esboço da Carta de Ponte)
10. **Dependências críticas e lacunas [AGUARDA EURICO]** (questões ainda em aberto)
11. **Primeira conversa Pedro — agenda sugerida** (tópicos, perguntas a fazer, o que mostrar, o que NÃO mostrar)
12. **Anexos:** diagramas arquitecturais (5 espaços), cronograma, matriz de colisão

**Tom do PRD v3:** consultor plurianual, não vendor. PT-PT estrito. Zero emojis. Tabelas e factos.

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO A QUE SE REFERE: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER DOCUMENTO FRUSOAL NA PRÓXIMA SESSÃO, LER `.claude/rules/frusoal-source-of-truth.md` + `membros/cliente-frusoal/prompt-original.md` + ESTE HANDOFF INTEGRALMENTE. VIOLAÇÃO = PARAR, DESCARTAR, REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260424-5-espacos-analisados-aguarda-validacao-perguntas.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 24/04/2026
PRÓXIMO RESPONSÁVEL: `@ux-design-expert` (Uma — continuidade cross-terminal)

---

*Fim do handoff — pronto para consumo em qualquer terminal fresh. Zero perda de contexto esperada.*
