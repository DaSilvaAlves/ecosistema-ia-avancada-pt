# Dossier Frusoal v1 — Base para proposta de implementação de IA

> Data de consolidação: 23/04/2026
> Agente responsável: Uma (ux-design-expert)
> Fontes: `preplexity-pesquisa.txt` (43KB), `gpt-pesquisa.txt` (5KB), `claude-pesquisa.txt` (37KB) — Claude é a base principal por ter trazido descobertas decisivas
> Convenções: [VERIFICADO] = facto com fonte directa · [INFERÊNCIA] = dedução razoável não confirmada · [GAP] = dado que não foi possível obter em fontes públicas · [DESACTUALIZADO] = fonte anterior a 2023

---

## Bloco 1 — Perfil empresarial

### 1.1 Identificação legal

| Campo | Valor | Fonte |
|-------|-------|-------|
| Nome | Frusoal — Frutas Sotavento Algarve, Lda | [VERIFICADO] Racius |
| NIF | 501186425 | [VERIFICADO] Racius |
| CAE principal | 46311 — Comércio por grosso de fruta e de produtos hortícolas, excepto batata | [VERIFICADO] Racius |
| CAE adicionais | 1230 (Citrinos), 1610 (Serviços para agricultura), 1630 (Preparação de produtos agrícolas para venda) | [VERIFICADO] Racius |
| Natureza | Sociedade por Quotas (Lda) | [VERIFICADO] Racius |
| Capital social | 1.045.139,68 € | [VERIFICADO] Racius |
| Data de constituição | 09/04/1981 | [VERIFICADO] Iberinform |
| Início operacional | 03/05/1990 (35 anos operacionais celebrados em 2025) | [VERIFICADO] Postal do Algarve, 17/05/2025 |
| Sede | Estrada Nacional 125, Sítio das Cevadeiras, 8901-907 Vila Nova de Cacela, VRSA | [VERIFICADO] Site Frusoal |
| Designação histórica | "Vila Real de Santo António Frusoal — Sociedade Agrícola Frutas Sotavento Algarve, S.A." | [VERIFICADO] Racius |
| Site | https://www.frusoal.pt/ | [VERIFICADO] |

### 1.2 Dimensão declarada

| Indicador | Valor | Observação | Fonte |
|-----------|-------|------------|-------|
| Volume 2018 | 22,5 M€ | Última faturação pública conhecida | [VERIFICADO] [DESACTUALIZADO] Postal do Algarve 21/11/2019 |
| Volume 2020 (meta anunciada) | 25 M€ | Meta anunciada — não resultado | [VERIFICADO] DN/Lusa 07/02/2019 |
| Volume 2021-2023 | [GAP] | IES está atrás de paywall (Racius, Iberinform) | — |
| Volume físico 2024 | ≥ 40 M kg (40.000 toneladas) | Post "35 anos" 2025 | [VERIFICADO] Site Frusoal |
| Estimativa volume negócios 2024 | 35-55 M€ | Cálculo: 40M kg × 0,20 €/kg produtor × 2-3x markup OP | [INFERÊNCIA] — confirmar com IES antes da proposta |
| Hectares | 1.500 ha | Site institucional | [VERIFICADO] Site Frusoal |
| Produtores associados | Mais de 60 (vs 28 em 1990) | Pedro Madeira 2025 | [VERIFICADO] Postal do Algarve 17/05/2025 |
| Nota discrepância | Site diz "100 associados" | Entrevista 2025 diz "mais de 60" — usar "mais de 60" | — |
| Funcionários | 150+ | Case study Sisgarbe 2024 | [VERIFICADO] sisgarbe.pt/en/frusoal |
| Exportação | 25% do volume | Site institucional | [VERIFICADO] Site Frusoal |
| Reconhecimento OP UE | Desde 2001 (citrinos); alargado posteriormente a abacates, dióspiros, alfarroba | Pedro Madeira 2025 | [VERIFICADO] Postal do Algarve 17/05/2025 |

### 1.3 Marcas e produtos

| Marca | Posicionamento | Fonte |
|-------|----------------|-------|
| Gomo | Marca comercial premium citrinos Algarve | [VERIFICADO] Vida Rural 05/02/2019 |
| Biogomo | Linha biológica | [VERIFICADO] Vida Rural 05/02/2019 |

### 1.4 Mercados e certificações

| Elemento | Detalhe | Fonte |
|----------|---------|-------|
| Mercado interno | ~75% volume | [VERIFICADO] Site Frusoal |
| Exportação actual | ES, FR, DE, UK, PL, CH | [VERIFICADO] Site Frusoal |
| Expansão em curso | Canadá, Itália, Escandinávia | [VERIFICADO] Postal 17/05/2025 |
| Certificações | GlobalG.A.P., GRASP, IGP Citrinos do Algarve | [VERIFICADO] Site Frusoal |

### 1.5 Empresas do grupo

| Empresa | NIF | Estado | Fonte |
|---------|-----|--------|-------|
| Frusoal — Frutas Sotavento Algarve, Lda | 501186425 | Empresa-mãe | [VERIFICADO] Racius |
| Tavifruta | — | Adquirida em 2009, 2º armazém | [VERIFICADO] Postal 17/05/2025 |
| Frusoal Agroquímicos, Unipessoal, Lda | 506111130 | Capital social 625.000 €, sede VRSA, atividade agroquímicos | [VERIFICADO] Racius — [GAP] relação societária com empresa-mãe |

---

## Bloco 2 — Decisor, stakeholders e abordagem comercial recomendada

### 2.1 Mapa de decisores

| Nome | Cargo | LinkedIn | Influência tech (1-5) | Fonte |
|------|-------|----------|------------------------|-------|
| Pedro Madeira | Sócio-gerente principal, face pública | pt.linkedin.com/in/pedro-frusoal-frusoal-0739318b — pouco ativo | 5 — decisor absoluto em tecnologia e I&D | [VERIFICADO] Postal, Agroportal, Vida Rural, DN, InnovPlantProtect |
| Manuel Reis | Sócio-gerente (co-assinante) | [GAP] LinkedIn | 3 — co-assinou protocolo InnovPlantProtect Nov/2024, decisão estratégica | [VERIFICADO] iplantprotect.pt 15/11/2024 |
| P. Godinho (pgodinho@frusoal.pt) | RH / Admin (contacto público em vagas) | [GAP] | 1-2 — ponto de contacto operacional | [INFERÊNCIA] LinkedIn (vaga técnico de campo) |
| Equipa técnica de campo (agrónomos) | Liderança produção/campo | [GAP] sem nomes públicos | 2-3 | [VERIFICADO] menção no site sem identificação |
| Director comercial / exportação | [GAP] | [GAP] | [GAP] | — |
| Director qualidade | [GAP] | [GAP] | [GAP] | — |
| CTO / IT Manager interno | Provavelmente não existe — IT outsourced à Sisgarbe desde 1986 | — | 0 (não existe) | [INFERÊNCIA forte] case study Sisgarbe |

### 2.2 Stakeholder crítico — Sisgarbe (gatekeeper IT)

| Elemento | Detalhe | Fonte |
|----------|---------|-------|
| Relação | Parceiro IT da Frusoal desde 1986 — 39 anos | [VERIFICADO] sisgarbe.pt/en/frusoal |
| Âmbito | PHC (provavelmente PHC CS) + customizações, hardware e software | [VERIFICADO] Sisgarbe |
| Localização | Portimão (Algarve) | [VERIFICADO] |
| Implicação | **Sisgarbe é gatekeeper de facto**. Qualquer proposta que ameace o PHC será bloqueada. Estratégia: **complementar, NÃO substituir**. Posicionar IA como camada por cima do PHC. | [INFERÊNCIA estratégica forte] |

### 2.3 Parceiros científicos (referências de credibilidade)

| Entidade | Relação | Data | Fonte |
|----------|---------|------|-------|
| InnovPlantProtect | Protocolo assinado por Pedro Madeira + Manuel Reis + Pedro Fevereiro | 15/11/2024 | [VERIFICADO] iplantprotect.pt |
| Uso para proposta | Consórcio científico para candidaturas Horizonte Europa / PEPAC em IA fitossanitária | — | [INFERÊNCIA tática] |

### 2.4 Abordagem comercial recomendada (síntese Claude — usar tal qual)

**Porta de entrada:** Pedro Madeira. Não existe decisor técnico intermédio para pré-venda. A proposta tem de ser construída para **conversa única com o sócio-gerente**, em linguagem de ROI e não de tecnologia.

**Linha vermelha:** Sisgarbe fica dona da espinha operacional. Nós entregamos camada analítica + interface.

**6 ângulos de pitch:**

1. **"Primeira OP de citrinos PT com IA ponta-a-ponta"** — capitaliza orgulho de "maior OP" + ambição de liderança regional
2. **"IA que protege a água"** — liga à dor #1 (crise hídrica) que Pedro Madeira confessa em entrevistas
3. **"IA que amplifica o InovCitrus"** — posicionar IA como cérebro digital do novo centro físico a inaugurar. Timing perfeito.
4. **"Exportação sem fricção"** — resolver fricção administrativa para Canadá / Itália / Escandinávia (topo da agenda dele)
5. **"Sem tocar no PHC"** — tranquilizar que a Sisgarbe continua dona da espinha operacional
6. **"70% pago pelo Estado"** — financiar via PRR IA nas PME + IFIC + PT2030 muda discussão de preço

**Ângulo implícito:** resposta ao passivo Ria Formosa 2021 — sem mencionar directamente, reforçar que rastreabilidade digital + reporting carbono + IGP são narrativa de reconquista de confiança pública.

---

## Bloco 3 — Stack actual e fronteira intocável

### 3.1 Camadas existentes

| Camada | Sistema | Confiança | Fonte |
|--------|---------|-----------|-------|
| ERP / Gestão | PHC (provavelmente PHC CS), customizado pela Sisgarbe desde 1986 | Alta | [VERIFICADO] sisgarbe.pt/en/frusoal |
| Integrador IT | Sisgarbe — 39 anos, hardware + software, desenvolvimento custom | Alta | [VERIFICADO] |
| Módulos operacionais PHC/Sisgarbe | Entrada e classificação de fruta · guias de entrada · rotulagem caixas/paletes · ordens de produção por calibre/qualidade · rotulagem à saída com peso/calibre/lote · valorização automática para pagamento ao produtor · serviços de colheita/despedra/transporte · integração contabilística | Alta | [VERIFICADO] Sisgarbe |
| Website | frusoal.pt — WordPress, trilingue PT/EN/FR | Média | [INFERÊNCIA forte] estrutura visual |
| Ecommerce | Inexistente | Alta | [VERIFICADO] observação directa |
| Portal B2B | Inexistente | Alta | [VERIFICADO] observação directa |
| Classificadora óptica | [GAP] marca exacta a confirmar. Pelo volume (40M kg) opera classificadora industrial. Hipóteses: Maf Roda, Greefa, Compac, Unitec, Pomone | [GAP] | — |
| Sensores humidade solo + rega gota a gota | **Confirmado**: "sistema de rega gota a gota com sondas de humidade e programadores de rega" — Pedro Madeira | Alta | [VERIFICADO] Postal 17/05/2025 |
| CRM | [GAP] — provavelmente inexistente ou Excel/função básica no PHC | — | — |
| BI / Analytics | [GAP] — provavelmente relatórios estáticos do PHC | — | — |
| EDI com retalhistas | Existe provavelmente [INFERÊNCIA] — requisito para fornecer Continente, Pingo Doce, Lidl, etc. Operado via Sisgarbe/PHC ou terceiros (GS1 Portugal, WebEDI) | [GAP] confirmar | — |
| Rastreabilidade fitossanitária UE | Obrigatória (EU-PHP); provavelmente PHC + add-on custom | [GAP] solução específica | — |
| Cuaderno de campo digital | [GAP] — possível papel + digitalização manual | — | — |
| Gestão mão-de-obra sazonal | [GAP] — provavelmente manual | — | — |

### 3.2 Presença digital

| Canal | Métrica observada | Qualidade | Fonte |
|-------|-------------------|-----------|-------|
| Site frusoal.pt | WordPress, 3 línguas, blog institucional, secção receitas | Básica. Boa narrativa institucional, mas sem ecommerce, portal cliente, chat, ficha técnica descarregável | [VERIFICADO] |
| Facebook | 3.069 gostos · 99 visitas · 168 "a falar sobre isto" | Baixa para empresa desta dimensão (40M kg). Anecoop espanhola tem ordens de grandeza superiores | [VERIFICADO] facebook.com/frusoal |
| LinkedIn (Frusoal — Frutas do Sotavento Algarvio) | Página corporativa existe; uso esporádico | Muito baixa | [VERIFICADO] |
| Instagram | [GAP] — não confirmado se existe conta oficial ativa | — | — |
| YouTube | [GAP] — aparição "A Palavra aos Frescos" 8º episódio citada em LinkedIn, sem canal próprio | — | — |
| TikTok | [INFERÊNCIA forte] inexistente | — | — |
| Blog / conteúdo próprio | Secção "Frutaria/Receitas" subaproveitada | Baixa | [VERIFICADO] |
| SEO / tráfego | [GAP] — não quantificado | — | — |

**Avaliação síntese:** presença digital desproporcional face à dimensão e ambição declarada de internacionalização. Para entrar em Canadá/Itália/Escandinávia, 3.069 likes no Facebook não gera pull do trade internacional.

### 3.3 Ausências-chave (oportunidade IA)

- Portal B2B / área de cliente online
- CRM estruturado
- BI / dashboards executivos
- IA em qualquer camada (produção, pós-colheita, comercial, marketing)
- Rastreabilidade QR premium consumidor
- Reporting ESG / pegada carbono automatizado

### 3.4 Linha vermelha (regra inegociável da proposta)

**PHC + Sisgarbe mantêm-se intocados.** Toda a camada IA proposta monta-se por cima, consumindo dados via API/SQL do PHC, sem substituir nem duplicar módulos operacionais existentes.

---

## Bloco 4 — Momentum 2024-2026

### 4.1 Cronologia de eventos

| Data | Evento | Fonte |
|------|--------|-------|
| Nov/2022 | Primeira detecção de Scirtothrips aurantii (tripes África do Sul) no Algarve — inicia preocupação fitossanitária | [VERIFICADO] Postal 05/02/2026 |
| 01/09/2023-31/12/2023 | Execução projeto cofinanciado (custo elegível 28.931,42 €) | [VERIFICADO] Ficha Projeto Frusoal PDF |
| 03/01/2024 | Aprovação formal do projeto acima | [VERIFICADO] |
| Jan/2024 | Cortes de água 25% agricultura / até 50-72% no Sotavento — pior seca de sempre | [VERIFICADO] Público, Jornal de Negócios 17/01/2024 |
| Mai/2024 | Crise dos sumos de laranja — preços em máximos, oportunidade para produtores PT | [VERIFICADO] ECO 30/05/2024 |
| 2023-2024 | Campanha com produção 335 mil t no Algarve (+10% vs média); Frusoal cresce +4,5% nos primeiros 6 meses | [VERIFICADO] Observador 06/11/2024; AlgarOrange |
| 2024 | Frusoal fecha com recorde de 40 M kg vendidos | [VERIFICADO] frusoal.pt |
| 15/11/2024 | Protocolo com InnovPlantProtect (Pedro Madeira + Manuel Reis + Pedro Fevereiro) | [VERIFICADO] iplantprotect.pt |
| 17/05/2025 | Celebração 35 anos — entrevista Pedro Madeira anuncia Canadá, Escandinávia, Itália, centro InovCitrus | [VERIFICADO] Postal; Agroportal 18/05/2025 |
| Fev/2026 | Lançamento oficial **Frusoal InovCitrus** — polo I&D com sede própria em construção em Tavira; projecto trienal sobre Scirtothrips; enquadrado no PO OP 2026-2028 | [VERIFICADO] Postal 05/02/2026 |
| 2026 (em curso) | Obras de reestruturação do edifício laboratorial InovCitrus | [VERIFICADO] Postal 05/02/2026 |

### 4.2 Janelas abertas (oportunidade de timing)

| Janela | Detalhe | Prazo |
|--------|---------|-------|
| Orçamento PO OP 2026-2028 em alocação | Frusoal está a alocar fundos agora — janela curta de elegibilidade | Em curso 2026 |
| InovCitrus em construção | Centro físico em obra — momento perfeito para integrar IA no design do novo centro | Janela única 2026 |
| Expansão Canadá + Itália + Escandinávia | Topo da agenda Pedro Madeira — desafio multilinguismo, documentação aduaneira, fitossanitária | 2026 |
| Aviso PRR SIFIC-7 (IA nas PME) | Aberto em 2026 — até 75% não reembolsável, tecto 300K€ | Confirmar em recuperarportugal.gov.pt antes da proposta |

### 4.3 Pressões convergentes

| Pressão | Detalhe | Fonte |
|---------|---------|-------|
| Hídrica | Cortes 50-72% Sotavento 2024; cada ha laranja consome 6-6,5 M litros/ano; CSHA (120 entidades) a agregar sector; quebra 16% produção 2024 | [VERIFICADO] Público, JN, DN |
| Retalho (CSRD cascata) | Lidl, Mercadona, Continente, Pingo Doce exigem QR code rastreável, reporting carbono, EDI, previsão semanal | [INFERÊNCIA forte] sector agroalimentar ibérico |
| Regulatória (Lei Whistleblowing) | Lei 93/2021 aplica a entidades ≥50 trabalhadores. Frusoal tem 150+ — obrigação de canal de denúncias operacional | [VERIFICADO] legislação |
| Fitossanitária | Scirtothrips aurantii desde Nov/2022 + mosca-mediterrâneo — pressão crescente sobre tratamentos | [VERIFICADO] Postal 05/02/2026 |
| Reputacional | Embargo ICNF 2021 (Quinta da Manta Rota) — destruição alfarrobeiras em PNRF; pergunta parlamentar BE. Rastreabilidade digital + ESG = narrativa de reconquista de confiança. Status desfecho [GAP] | [VERIFICADO] Sul Informação, Planeta Algarve |

### 4.4 Sinal crítico do sector (usar no pitch)

> **AlgarOrange (Março/2024, vozdocampo.pt):** "A utilização da inteligência artificial também já é uma realidade entre alguns dos nossos operadores de citrinos do Algarve, quer ao nível do controlo do tamanho dos frutos em crescimento no campo, quer ao nível do processo de calibração nas centrais de preparação e acondicionamento."

Sem nomear concorrentes específicos. **Pitch-killer:** "A região já está a mover-se. A Frusoal, como a maior OP, não pode ser a última a chegar."

---

## Bloco 5 — Matriz de oportunidades IA priorizada

Escala: Impacto (1-5) × Viabilidade (1-5) × Alinhamento momentum (1-5). Score final = média ponderada.

### 5.1 Produção / Campo

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI típico | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|------------|------------|----------|
| Detecção IA pragas (Scirtothrips, mosca) — visão computacional + mobile | 5 | 4 | 5 | 4,7 | -20 a -40% tratamentos; detecção 2-3x mais precoce | SENSOPLAG, Plantix, CropX | Baixa-média — requer dataset próprio Algarve |
| Rega de precisão com ML preditivo (sobre sondas existentes) | 5 | 5 | 5 | 5,0 | -15 a -25% poupança hídrica | Isagri, Bynse, agriPV | **Baixa** — complementa setup existente. **Prioridade máxima** dado crise hídrica |
| Previsão colheita satélite + ML | 4 | 3 | 4 | 3,7 | +5 a +15% precisão (reduz sobreprodução/rutura) | EOS Data Analytics, Agroop, Hispatec | Média — requer histórico por parcela |
| Robotização de apanha | 3 | 1 | 2 | 2,0 | -30 a -50% custo apanha (CAPEX elevado) | Tevel, FFRobotics | Alta — citrinos ainda imaturos para robotização massiva |

### 5.2 Pós-colheita / Embalamento

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI típico | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|------------|------------|----------|
| Classificadora óptica IA (upgrade ou substituição) | 5 | 3 | 4 | 4,0 | -30 a -50% falsos positivos; +uniformidade exportação | Maf Roda Globalscan 7 SMART Citrus, Greefa iQS3, Compac Spectrim, Unitec UNICAL | **Alta** — CAPEX 500K€-3M€. Enquadrar em IFIC / Inovação Produtiva |
| Predictive maintenance linha embalamento | 3 | 4 | 3 | 3,3 | -15 a -30% downtime; -10 a -20% custo manutenção | Augury, Mobius (SKF), PHC Industria | Baixa-média — tecnologia madura |
| Previsão shelf-life por IA | 3 | 3 | 3 | 3,0 | -5 a -10% desperdício | ImpactVision, AgShift | Média |

### 5.3 Rastreabilidade e Qualidade

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|-----|------------|----------|
| QR rastreabilidade "do pomar à mesa" + IA qualidade | 4 | 5 | 4 | 4,3 | +5 a +15% preço exportação premium; defesa marca IGP | TE-FOOD, IBM Food Trust, StoryChain | Baixa técnica; alta organizacional |
| Blockchain + QR exportação premium | 3 | 3 | 3 | 3,0 | +10 a +20% preço nichos bio | Ambrosus, Vechain Food | Média |

### 5.4 Comercial e Mercado

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|-----|------------|----------|
| Previsão procura SKU/cliente/semana (ML sobre PHC) | 5 | 4 | 4 | 4,3 | -15 a -25% desperdício | Databricks/Azure ML; Hispatec; Bynse | Média — requer dados limpos |
| Pricing dinâmico spot vs contrato | 3 | 3 | 3 | 3,0 | +2 a +5% margem bruta | Prophet, own ML | Alta política (toca produtores associados) |
| CRM B2B com IA (HubSpot/Salesforce) | 4 | 5 | 4 | 4,3 | +20 a +30% eficiência comercial | HubSpot, Salesforce, Pipedrive, Zoho | **Muito baixa — quick win** |
| Análise sentiment retalho | 2 | 4 | 2 | 2,7 | Early warning consumidor | Brandwatch, Talkwalker, GPT wrappers | Baixa |

### 5.5 Exportação

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|-----|------------|----------|
| Automação documentação aduaneira + fitossanitária (Canadá, Itália) | 5 | 5 | 5 | 5,0 | -50 a -70% tempo admin; -erros | Make.com + GPT/Claude + APIs aduaneiras | **Muito baixa — quick win de alto valor, alinhado 100% com momentum Canadá/Itália** |
| Chatbot B2B multilíngue (PT/EN/FR/ES/DE/PL/IT) | 4 | 5 | 5 | 4,7 | -30 a -40% carga admin; captura leads 24/7 | Intercom, Voiceflow, GPT + Make.com | **Muito baixa** |
| Tradução automática catálogos/fichas/contratos | 3 | 5 | 4 | 4,0 | -70% custo tradução | DeepL, GPT-4, ModernMT | Muito baixa |

### 5.6 RH / Recrutamento sazonal

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI | Vendor ref | Barreira |
|------|---------|-------------|------------------|-------|-----|------------|----------|
| Plataforma mobile gestão mão-de-obra sazonal (reconhecimento facial fichaje) | 4 | 4 | 3 | 3,7 | -15 a -30% custo admin RH | AHORA Hortofrutícola, Kelio, Bizneo HR | Baixa-média |
| Onboarding/formação multilíngue IA (trab. leste, africanos) | 3 | 4 | 3 | 3,3 | -acidentes; conformidade GRASP | Axonify, EdApp, custom LLM | Baixa |

### 5.7 Sustentabilidade / ESG

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI |
|------|---------|-------------|------------------|-------|-----|
| Pegada carbono automática por lote | 4 | 3 | 3 | 3,3 | Antecipar exigências CSRD cascata |
| Reporting ESG automatizado | 3 | 3 | 3 | 3,0 | Cumprir auditorias sem FTE dedicada |
| Monitorização água/energia com IA | 4 | 4 | 5 | 4,3 | -10 a -20% poupança |

Vendors ESG: Normative, Plan A, Greenly, Workiva.

### 5.8 Marketing e Conteúdo

| Caso | Impacto | Viabilidade | Alinh. momentum | Score | ROI | Vendor ref |
|------|---------|-------------|------------------|-------|-----|------------|
| Geração conteúdo multilíngue (blog, receitas Gomo/Biogomo, redes) | 4 | 5 | 5 | 4,7 | +200 a +400% output editorial | ChatGPT/Claude + Make.com + HootSuite |
| Optimização SEO internacional com IA | 3 | 5 | 4 | 4,0 | +30 a +50% tráfego orgânico 6 meses | Surfer SEO, Clearscope |
| Imagens/reels para redes com IA | 3 | 5 | 4 | 4,0 | Ritmo editorial 3x superior | Midjourney, Runway, Canva AI |

### 5.9 Ranking consolidado (top 10 por score)

| # | Caso | Score | Categoria |
|---|------|-------|-----------|
| 1 | Rega de precisão com ML preditivo sobre sondas existentes | 5,0 | Produção |
| 2 | Automação documentação aduaneira + fitossanitária | 5,0 | Exportação |
| 3 | Detecção IA pragas (Scirtothrips, mosca) | 4,7 | Produção |
| 4 | Chatbot B2B multilíngue | 4,7 | Exportação |
| 5 | Geração conteúdo multilíngue | 4,7 | Marketing |
| 6 | QR rastreabilidade + IA qualidade | 4,3 | Rastreabilidade |
| 7 | Previsão procura SKU/cliente/semana | 4,3 | Comercial |
| 8 | CRM B2B com IA | 4,3 | Comercial |
| 9 | Monitorização água/energia com IA | 4,3 | Sustentabilidade |
| 10 | Classificadora óptica IA (upgrade) | 4,0 | Pós-colheita |

---

## Bloco 6 — Top 5 Quick Wins refinados (≤180 dias)

Selecção das 5 oportunidades de maior score + viabilidade + menor barreira para primeira fase da proposta.

### 6.1 Quadro síntese

| # | Quick Win | Investimento | ROI ano 1 | Prazo | Dependências | Equipa proposta |
|---|-----------|--------------|-----------|-------|---------------|-----------------|
| 1 | **Automação documentação aduaneira/fitossanitária** (Make.com + GPT/Claude + APIs) | 30-50K€ + 500-1.000€/mês | 40-80K€/ano (100-200h/mês admin) + aceleração Canadá 6 meses | 60-90 dias | Acesso a sistemas exportação actuais; modelos de docs PHYTO/EUR.1/CMR/CFIA | 1 AI engineer + 1 integrador + input comercial Frusoal |
| 2 | **Chatbot B2B multilíngue + portal cliente light** (WordPress + lead scoring) | 25-40K€ | +20-40% leads internacionais; -30% email admin | 45-60 dias | Conteúdo produtos/certificações PT/EN/FR/ES/DE/PL/IT; fluxo lead scoring | 1 conversational designer + 1 WP dev + copywriter multilíngue |
| 3 | **BI + previsão procura SKU/cliente sobre PHC** (Power BI ou Metabase + ML Prophet/XGBoost) | 40-70K€ | -10 a -15% desperdício; ROI 100-250K€ ano 1 | 90-120 dias | Acesso dados PHC via API/SQL (coordenar com Sisgarbe) | 1 data engineer + 1 ML engineer + 1 business analyst |
| 4 | **Fábrica conteúdo multilíngue Gomo/Biogomo** (IA + calendário editorial + automação LinkedIn/IG) | 15-25K€ setup + 1-2K€/mês | Output editorial 5-10x; pull internacional; reforço InovCitrus/IGP | 30-45 dias | Brandbook Gomo/Biogomo; aprovação tom por Pedro Madeira | 1 content strategist + 1 AI content operator + 1 designer |
| 5 | **App mobile monitorização pragas** (Scirtothrips, mosca) MVP em co-criação InovCitrus | 50-90K€ MVP + dataset | -15 a -25% tratamentos; diferencial IGP; paper científico InnovPlantProtect | 120-180 dias | Protocolo co-autoria com InnovPlantProtect; dataset fotográfico Algarve; 5-10 técnicos piloto | 1 ML engineer computer vision + 1 mobile dev + 1 agrónomo |

**Totais:**
- Investimento total: **160-275K€**
- Frusoal contribui ~**50-70K€** (resto via PRR IA nas PME 75%)
- ROI consolidado ano 1: **2-4x**

### 6.2 Cronograma Gantt simplificado (primeiros 180 dias)

```
Dias     0---30---60---90---120---150---180
#4 Conteúdo    [===]
#2 Chatbot       [=====]
#1 Docs export       [======]
#3 BI/previsão          [=========]
#5 App pragas              [==============]
```

### 6.3 Dependências cruzadas

| Quick Win | Depende de | Observação |
|-----------|------------|------------|
| #1 Docs export | Acesso APIs aduaneiras + sistemas Frusoal actuais | Pode correr standalone sem tocar PHC |
| #2 Chatbot | Site WordPress + conteúdo produtos | Pode correr standalone |
| #3 BI | Acesso dados PHC via API/SQL | **Requer coordenação com Sisgarbe — ponto sensível** |
| #4 Conteúdo | Brandbook Gomo/Biogomo + aprovação Pedro Madeira | Pode correr standalone |
| #5 App pragas | Protocolo InnovPlantProtect + dataset fotográfico | Pode co-submeter a aviso PEPAC / Horizonte Europa |

### 6.4 Sequência recomendada

1. **Arrancar primeiro #4 Conteúdo** (30 dias, ROI rápido visível, baixa barreira) — demonstra entrega rápida e gera confiança
2. **Em paralelo #1 Docs export** (momentum Canadá/Itália) — resolve dor real imediata
3. **Depois #2 Chatbot** (complementa #4 com captura de leads gerados pelo conteúdo)
4. **#3 BI** arranca em paralelo com #1 — é o mais estratégico mas requer coordenação Sisgarbe
5. **#5 App pragas** é o de maior timeline — arrancar co-submissão a fundo (InovCitrus / Horizonte Europa) no mês 3

---

## Bloco 7 — Esqueleto da proposta comercial

Estrutura proposta para a proposta final a entregar a Pedro Madeira. Este bloco define a **arquitectura do documento**, não o conteúdo final (a escrever em sessão dedicada).

### 7.1 Índice sugerido

| Secção | Páginas est. | Conteúdo |
|--------|--------------|----------|
| Capa | 1 | Logo Frusoal + logo nosso + título "Proposta IA para a Frusoal — InovCitrus Digital" + data + confidencialidade |
| Sumário executivo | 1-2 | 6 ângulos do pitch em síntese; investimento total; financiamento PRR; ROI ano 1 |
| 1. Diagnóstico | 3-4 | Resumo blocos 1-4 deste dossier — Perfil, momentum, stack, fronteira |
| 2. Proposta de valor | 2 | Os 6 ângulos detalhados com evidência do dossier |
| 3. Fase 1 — Quick Wins (0-180 dias) | 4-5 | Detalhe dos 5 quick wins do Bloco 6 |
| 4. Fase 2 — Projectos médios (6-18 meses) | 2-3 | Classificadora IA upgrade; QR rastreabilidade; app RH sazonal; monitorização água/energia |
| 5. Fase 3 — Projectos estruturais (18-36 meses) | 1-2 | Reporting CSRD; previsão colheita satélite; plataforma IA InovCitrus completa |
| 6. Investimento + financiamento | 2 | Tabela CAPEX + OPEX; % por instrumento (IFIC IA PME 75% / Inovação Produtiva 50% / PEPAC 50-75% / Horizonte Europa 70-100%) |
| 7. Equipa proposta | 1-2 | Papéis (não nomes); governance do projecto; SPOC Frusoal = Pedro Madeira / Manuel Reis |
| 8. Cronograma macro | 1 | 36 meses em 3 fases; milestones trimestrais |
| 9. Governance e risco | 1-2 | Linha vermelha Sisgarbe; integração APIs PHC; RACI; KPIs por quick win |
| 10. Próximos passos | 1 | Assinatura carta de intenção; workshop kick-off 1 dia em VN Cacela; visita central para identificar classificadora |
| Anexos | 5-10 | Cases setoriais (Benihort, SENSOPLAG); matriz fundos; checklist GDPR/Whistleblowing/AI Act |

### 7.2 Tom da proposta

- Linguagem de ROI, não tecnologia
- Sem jargão técnico sem explicação
- Tabelas e números sempre
- Emoji: zero
- Ilustrações: cronograma, arquitectura camadas (PHC em baixo, camada IA em cima), mapa fundos

### 7.3 Formato de entrega

- PDF profissional 20-25 páginas
- Deck 10-12 slides para reunião
- Anexo técnico separado (para consulta Sisgarbe se necessário)

---

## Bloco 8 — Checklist de validação pré-proposta

### 8.1 Gaps críticos a fechar (ordem de prioridade)

| # | Gap | Como fechar | Custo | Responsável | Prazo sugerido |
|---|-----|-------------|-------|-------------|----------------|
| 1 | **IES financeiros 2021-2024** (para confirmar estimativa 35-55M€ volume negócios e definir tecto PME) | Comprar relatório Racius (11€) ou Informa D&B (~30€) | 11-30€ | Eurico | Antes da 1ª reunião |
| 2 | **Status próximo aviso PRR IFIC IA nas PME (SIFIC-7)** | Consultar recuperarportugal.gov.pt | 0€ | Eurico | Antes da 1ª reunião |
| 3 | **Marca exacta classificadora óptica** | Visita à central VN Cacela ou pergunta directa na 1ª reunião | 0€ | Eurico/Uma | Durante 1ª reunião |
| 4 | **Confirmar Frusoal Agroquímicos Unipessoal Lda (NIF 506111130)** — relação societária com empresa-mãe | Portal da Empresa / BNI | 0€ | Uma | Antes da proposta |
| 5 | **Conta Instagram activa** | Pesquisa Instagram | 0€ | Uma | Antes do quick win #4 |
| 6 | **Subsídios PRR/PT2030/PDR2020/PEPAC recebidos por NIF 501186425** | Portal Fundos UE + IFAP | 0€ | Uma | Antes da proposta |
| 7 | **OPs algarvias que já adoptaram IA** (AlgarOrange diz que há, não nomeia) | Investigação adicional em notícias locais + LinkedIn | 0€ | Uma | Antes do pitch |
| 8 | **EDI estruturado com retalhistas** (Continente, Lidl, Mercadona, etc.) | Pergunta directa na 1ª reunião | 0€ | Eurico/Uma | Durante 1ª reunião |
| 9 | **Status desfecho embargo ICNF 2021** | Pesquisa notícias + Sul Informação | 0€ | Uma | Antes da proposta (evitar tocar no tema sem informação actual) |
| 10 | **Sondar Sisgarbe** (sem queimar pontes) para entender até onde o PHC expõe APIs/dados | Pergunta lateral ao próprio Pedro Madeira na 1ª reunião | 0€ | Eurico | Durante 1ª reunião |

### 8.2 Verificações técnicas rápidas

- [ ] Testar site com BuiltWith/Wappalyzer (confirmar WordPress + plugins)
- [ ] PageSpeed do site (performance + SEO baseline)
- [ ] Confirmar existência de banner cookies / política RGPD visível
- [ ] Confirmar existência de Canal de Denúncias (Lei 93/2021 aplica a 150+ funcionários)

### 8.3 Verificações comerciais

- [ ] Cruzar última campanha 2025-2026 com timing do envio da proposta
- [ ] Confirmar que Pedro Madeira está em Portugal nas 4 semanas após envio (evitar envio com ele em missão comercial)
- [ ] Preparar 2-3 slides de "cases setoriais" actualizados (Benihort, SENSOPLAG, Frutinter)

---

## Bloco 9 — Anexos

### 9.1 Fontes citadas

**Sites oficiais:**
- Frusoal: https://www.frusoal.pt/
- Sisgarbe (case study Frusoal): sisgarbe.pt/en/frusoal
- InnovPlantProtect (protocolo): iplantprotect.pt

**Bases empresariais:**
- Racius: https://www.racius.com/frusoal-frutas-sotavento-algarve-lda/
- eInforma: https://www.einforma.pt/servlet/app/portal/ENTP/prod/ETIQUETA_EMPRESA_CONTRIBUINTE/nif/501186425/
- Iberinform

**Imprensa:**
- Postal do Algarve (35 anos, InovCitrus): 17/05/2025 e 05/02/2026
- Agroportal (entrevista Pedro Madeira): 18/05/2025
- Vida Rural (marcas Gomo/Biogomo): 05/02/2019 [DESACTUALIZADO]
- DN/Lusa (meta 25M€ 2020): 07/02/2019
- Diário de Notícias (preço laranja 2024): Dez/2024
- Observador (campanha 2023-2024): 06/11/2024
- ECO (crise sumos laranja): 30/05/2024
- Público, Jornal de Negócios (seca Sotavento): 17/01/2024
- Sul Informação, Planeta Algarve (embargo ICNF 2021)
- AlgarOrange / vozdocampo.pt (IA no sector citrinos Algarve): Mar/2024

**Institucional:**
- CCDR Algarve — Estudo Valor Económico Agricultura Algarvia: 20/10/2025
- Algarve 2020 — Operações Aprovadas: 31/05/2022
- Diário da República — atos societários Frusoal (matrícula 310/821020)
- Facebook CMVRSA (Frusoal em Praça da Alegria): 05/04/2022 [DESACTUALIZADO]
- Agencia SINC — IVIA visão artificial citrinos: 09/10/2011 [DESACTUALIZADO]
- citricos.org — IA na indústria de citrinos

**Vendors e casos setoriais:**
- Maf Roda (Globalscan 7 SMART Citrus)
- Benihort (qcom.es 02/10/2024 — €3M IA calibradores)
- SENSOPLAG Valencia (eurolab.es)
- InnovPlantProtect protocolo 15/11/2024

### 9.2 Glossário

| Termo | Significado |
|-------|-------------|
| **CFIA** | Canadian Food Inspection Agency — regulador canadiano Safe Food for Canadians |
| **CSHA** | Comissão para a Sustentabilidade Hidroagrícola do Algarve (120 entidades) |
| **CSRD** | Corporate Sustainability Reporting Directive UE |
| **EDI** | Electronic Data Interchange — comunicação estruturada entre sistemas comerciais |
| **EU-PHP** | EU Plant Health Passport — passaporte fitossanitário UE obrigatório para citrinos |
| **GlobalG.A.P.** | Certificação global boas práticas agrícolas |
| **GRASP** | GlobalG.A.P. Risk Assessment on Social Practice — add-on social |
| **IFIC** | Instrumento Financeiro para a Inovação e Competitividade (PRR) |
| **IGP** | Indicação Geográfica Protegida (UE) — IGP Citrinos do Algarve |
| **InovCitrus** | Novo centro I&D da Frusoal em Tavira (obras em curso 2026) |
| **NIS2** | Network and Information Security 2 — directiva UE cibersegurança |
| **OP** | Organização de Produtores reconhecida pela UE |
| **PEPAC** | Plano Estratégico da PAC 2023-2027 (sucessor PDR2020) |
| **PHC** | PHC Software (provavelmente PHC CS) — ERP português |
| **PHYTO** | Certificado Fitossanitário para exportação |
| **PRR** | Plano de Recuperação e Resiliência (Portugal) |
| **RGPD/GDPR** | Regulamento Geral de Proteção de Dados |
| **SIFIC** | Sistema de Incentivos Fiscais à Inovação Competitiva — avisos PRR |
| **Sisgarbe** | Parceiro IT histórico da Frusoal (Portimão, 39 anos de relação) |
| **Tavifruta** | 2º armazém Frusoal, adquirido em 2009 |

### 9.3 Concorrência — mapa rápido

**Portugal (citrinos / OP):**

| Entidade | Dimensão | Maturidade digital | Diferenciador | Observação |
|----------|----------|--------------------|-----------------|-------------|
| **Frusoal** (benchmark) | 60+ produtores, 1.500 ha, 40.000 t, est. 35-55M€ | Média-baixa | Liderança citrinos PT, marcas Gomo/Biogomo, InovCitrus | — |
| Cacial (Cooperativa Agrícola Citricultores Algarve, 1964) | ~100 produtores, impulsionadora IGP | Média-baixa [INFERÊNCIA] site informativo, sem portal B2B | Histórica; "mercado da saudade" FR/LU/CH | Primeira central a higienizar e embalar industrialmente citrinos PT (1995) |
| Frutas Tereso (David Ferreira) | ~20.000 t/ano (Barlavento) | [GAP] | Forte presença mediática sobre seca | — |
| AlgarOrange (associação, não OP) | 12 associados, 40% produção Algarve, 30% nacional | Secundária | Promoção IGP, WCO | Concorrente indirecto |
| Uniprofrutal (gestor histórico IGP) | [GAP] | [GAP] | Detém gestão formal da IGP | — |
| Citrigarbe, Cooperfrutas, Algafruta, Olival do Sul, Citrioeste | [GAP] — Citrigarbe em particular não aparece em fontes actualizadas | [GAP] | — | Validar localmente se estão activas |

**Espanha / Itália (referências de best-in-class):**

| Entidade | País | Relevância |
|----------|------|-----------|
| **Anecoop** | ES (Valencia) | Maior grupo cooperativo ibérico; múltiplas iniciativas digitais, satélite, IA em linhas |
| **Benihort** | ES (Benicarló, associada Anecoop) | €3M IA calibradores 2024 — case study directo |
| **Frutinter** | ES | IA pós-colheita (parceiro Maf Roda) |
| **Anecoop members em geral** | ES | Portais B2B, plataformas digitais, reporting ESG |
| **Apofruit** | IT | Data-driven agriculture |
| **Mehadrin** | Israel | Blockchain rastreabilidade premium |

---

**Fim do Dossier v1**

Próximo passo proposto: sessão dedicada para escrever conteúdo da proposta comercial seguindo esqueleto do Bloco 7. Antes disso, fechar gaps do Bloco 8.
