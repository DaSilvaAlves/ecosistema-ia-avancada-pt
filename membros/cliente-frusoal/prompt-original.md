# Prompt Original — Pesquisa Frusoal (23/04/2026)

> **ESTE É O PROMPT ORIGINAL QUE DEU ORIGEM ÀS 3 PESQUISAS (Perplexity, GPT, Claude) E AO DOSSIER v1.**
>
> **QUALQUER TRABALHO NA FRUSOAL COMEÇA POR LER ESTE DOCUMENTO.**
>
> **NÃO INVENTAR "COMBOS", "PACKAGES" OU LINGUAGEM DE VENDOR SaaS — ESTA É UMA PROPOSTA COMERCIAL DE CONSULTORIA DE IMPLEMENTAÇÃO DE IA PARA UMA EMPRESA COM 45 ANOS DE MERCADO.**

---

## Contexto comum (cabeçalho partilhado pelas 3 fases)

Sou consultor de implementação de IA. Estou a preparar uma proposta comercial
para a empresa portuguesa Frusoal — Frutas Sotavento Algarve, Lda
(site: https://www.frusoal.pt/, NIF 501186425, sede em Vila Nova de Cacela, Algarve).

DADOS JÁ CONFIRMADOS — NÃO PERCAS TOKENS A CONFIRMAR:
- Maior Organização de Produtores (OP) de citrinos em Portugal
- Fundada 1981 (45 anos), sócio-gerente Pedro Madeira
- 65 associados produtores, 1.500 hectares, 40.000 toneladas/ano
- 80% citrinos, restantes abacates, dióspiros, alfarroba
- Marcas: Gomo (convencional), Biogomo (orgânico)
- 75% mercado PT (hipermercados/supermercados), 25% exportação para ES, FR, DE, UK, PL, CH
- Certificações: GlobalG.A.P., GRASP, IGP Citrinos do Algarve
- 50+ funcionários directos
- Site WordPress básico (PT/EN/FR), sem ecommerce, sem chat, sem portal B2B

REGRAS DE OUTPUT QUE TENS DE SEGUIR:
1. Responde em português europeu (PT-PT, não PT-BR)
2. Cita SEMPRE a fonte (URL + data) ao lado de cada dado novo que trouxeres
3. Marca com [GAP] tudo o que NÃO conseguires confirmar — não inventes
4. Distingue claramente "facto verificado em fonte" vs "inferência minha"
5. Se uma fonte for de antes de 2023, marca [DESACTUALIZADO]
6. Output em tabelas markdown sempre que possível
7. Não me dês conclusões genéricas — quero dados accionáveis

---

## FASE A — PERFIL EMPRESARIAL E MAPA DE DECISORES

**Objectivo:** mapear pessoas, dimensão real, contexto financeiro, momentum recente.

[colar CONTEXTO COMUM acima]

FASE A — PERFIL EMPRESARIAL E MAPA DE DECISORES

Pesquisa e devolve:

### 1. INDICADORES FINANCEIROS PÚBLICOS
- Volume de negócios últimos 3 anos (consulta Iberinform, Racius, Informa D&B, IES via Reanalytics, Empresite/Jornal de Negócios)
- Resultado líquido tendência
- Capitais próprios, dívida, estrutura societária
- Rating financeiro/scoring se disponível
- Subsídios PDR2020/PRR/PT2030 recebidos (consulta Portal Fundos UE, Portal IFAP, CCDR Algarve)

### 2. ORGANIGRAMA E DECISORES
- Pedro Madeira (sócio-gerente confirmado) — perfil LinkedIn completo, formação, histórico, anos no cargo
- Outros gerentes, directores, conselho — nomes + função + LinkedIn
- Equipa técnica (mencionada no site sem detalhe) — quem lidera produção, comercial, exportação, qualidade
- Identifica QUEM toma decisões de tecnologia/digital (provavelmente sócio-gerente ou existe CTO/IT manager?)

### 3. ESTRUTURA SOCIETÁRIA E GOVERNANCE
- Quem são os 65 produtores associados (lista pública parcial se existir)
- Existem outras empresas do grupo? (encontrei "Frusoal Agroquímicos Unipessoal Lda" NIF 506111130 — confirma e mapeia)
- Conselho de administração da OP

### 4. MOMENTUM RECENTE (últimos 24 meses)
- Notícias, comunicados, entrevistas de Pedro Madeira
- Investimentos anunciados (novos pomares, fábricas, embalamento, frio)
- Candidaturas a fundos PRR/PT2030 conhecidas
- Mudanças estratégicas (novos mercados, novos produtos, parcerias)
- Crise climática/seca Algarve — como afectou ou está a afectar
- Notícias setor citrinos PT: campanha 2024/2025/2026, preços, exportação

### 5. CONCORRENTES DIRECTOS PORTUGAL
- Outras OPs de citrinos do Algarve (Citrigarbe, Cooperfrutas, Algafruta, Olival do Sul, Citrioeste, etc.) — dimensão comparada
- Quem está mais avançado digitalmente que a Frusoal? Como?

**OUTPUT EM:**
- Tabela "Indicadores Financeiros (3 anos)"
- Tabela "Decisores e Stakeholders" (Nome | Cargo | LinkedIn | Influência tech 1-5)
- Cronologia "Momentum 24m" (Data | Evento | Fonte)
- Tabela "Concorrência Directa" (OP | Dimensão | Maturidade Digital | Diferenciador)
- Lista [GAPS] de tudo o que não conseguiste encontrar

---

## FASE B — STACK TECNOLÓGICO E DORES OPERACIONAIS

**Objectivo:** detectar maturidade digital real e onde dói (sinais públicos de fricção).

[colar CONTEXTO COMUM acima]

FASE B — STACK TECNOLÓGICO E DORES OPERACIONAIS

Pesquisa e devolve:

### 1. STACK TECNOLÓGICO ACTUAL
- Site frusoal.pt: tecnologia exacta (BuiltWith, Wappalyzer simulado), plugins WordPress identificáveis, performance (PageSpeed)
- Sistemas mencionados em entrevistas, vagas de emprego, comunicados (ERP — provável Primavera, Sage, SAP B1?), CRM, software de gestão de produção agrícola, balanças, classificadoras ópticas
- Existe portal/área cliente B2B para retalho? (Continente, Pingo Doce, Auchan, Lidl, El Corte Inglés exigem EDI — confirma se a Frusoal tem)
- Integração com EDI retalhistas (ALDI, Lidl, Mercadona, etc.)
- Software de rastreabilidade obrigatória (citrinos exportação requerem fitossanitário) — qual usam?

### 2. PRESENÇA DIGITAL E REDES
- Análise quantitativa: seguidores, engagement, frequência de posts em Facebook, LinkedIn, Instagram, YouTube
- Qualidade do conteúdo: profissional, amador, abandonado?
- Última publicação em cada canal
- Existe estratégia de conteúdo visível? Blog tem posts ou está vazio?
- SEO: tráfego orgânico estimado (similarweb), palavras-chave posicionadas, backlinks principais

### 3. SINAIS PÚBLICOS DE DOR / FRICÇÃO
- Vagas de emprego abertas (NetEmpregos, IEFP, Indeed, LinkedIn) — que perfis procuram? (admin, produção, comercial, IT?) Vagas revelam ONDE têm fricção operacional.
- Reviews Google Maps (loja em Vila Nova de Cacela), Glassdoor, comentários públicos clientes
- Reclamações no Portal da Queixa, Livro de Reclamações Online
- Notícias de problemas: greves, acidentes, perdas de produção, processos legais (Justiça PT pública)
- Comentários públicos em redes (Facebook) sobre atendimento, qualidade, entregas

### 4. MATURIDADE DIGITAL VS SECTOR
- Comparação com OPs equivalentes em ES (Anecoop, Coopego), IT (Apofruit), ISR (Mehadrin) — o que estes fazem digitalmente que a Frusoal não faz?
- Benchmarks de digitalização agroalimentar PT (relatórios COTEC, ANIA, CAP, Portugal Fresh)

### 5. EXPOSIÇÃO REGULATÓRIA
- AI Act (entra 2026) — Frusoal cai em alto risco? Onde?
- GDPR — site cumpre? Cookies, política privacidade, canal denúncias
- NIS2 — empresa de dimensão obriga? (provavelmente não pelos thresholds, mas confirma)
- CSRD/sustentabilidade — obrigada a reportar? Quando?

**OUTPUT EM:**
- Tabela "Stack Tecnológico" (Camada | Sistema actual | Confiança da fonte | Fonte)
- Tabela "Presença Digital" (Canal | Métrica | Qualidade | Última actividade)
- Lista "Sinais de Dor" priorizada (mais sinais públicos = maior dor)
- Tabela "Gap vs Concorrência ES/IT" (Capacidade | Frusoal | Best-in-class | Gap)
- Tabela "Exposição Regulatória" (Norma | Aplica? | Prazo | Risco)
- Lista [GAPS]

---

## FASE C — OPORTUNIDADES IA E BENCHMARKS DE SECTOR

**Objectivo:** ter uma carteira de casos de uso IA específicos com ROI estimável e benchmarks reais do sector agroalimentar.

[colar CONTEXTO COMUM acima]

FASE C — OPORTUNIDADES IA APLICADAS E BENCHMARKS DO SECTOR

Pesquisa e devolve:

### 1. CASOS DE USO IA NO SECTOR CITRICULTURA / AGROALIMENTAR
Para cada caso de uso, dá: descrição, ROI típico, vendor de referência, case study real (idealmente em PT/ES/IT), barreira de entrada.

**Categorias a cobrir EXAUSTIVAMENTE:**

**a) PRODUÇÃO/CAMPO**
- Visão computacional para detecção de pragas/doenças (drone, mobile)
- Previsão de colheita por satélite + machine learning
- Optimização de rega e fertilização (irrigação inteligente)
- Robotização da apanha (Tevel, FFRobotics)

**b) PÓS-COLHEITA / EMBALAMENTO**
- Classificação óptica IA (Maf Roda, Greefa, Compac)
- Detecção de defeitos por visão computacional
- Optimização de calibragem
- Predictive maintenance em linhas de embalamento

**c) RASTREABILIDADE E QUALIDADE**
- Blockchain + QR para retalho premium e exportação
- IA para previsão de shelf-life
- Análise de imagem para qualidade no destino

**d) COMERCIAL E MERCADO**
- Previsão de procura por SKU/cliente/semana
- Pricing dinâmico para spot vs contrato
- CRM com IA para B2B (Continente, Lidl, etc.)
- Análise de sentiment retail

**e) EXPORTAÇÃO**
- Automação de documentação aduaneira (fitossanitário, certificados origem)
- Chatbot multilíngue B2B (PT/EN/FR/ES/DE/PL) para clientes internacionais
- Tradução automática de catálogos, fichas técnicas

**f) RH / RECRUTAMENTO SAZONAL**
- Plataformas IA para gestão de mão-de-obra sazonal (apanha citrinos)
- Onboarding e formação multilingue (trabalhadores de leste/africanos)

**g) SUSTENTABILIDADE E REPORTING**
- IA para cálculo de pegada de carbono por lote
- Reporting CSRD automatizado

**h) MARKETING E CONTEÚDO**
- Geração de conteúdo para blog, redes, ficha técnica de receitas (a Frusoal tem secção "Frutaria/Receitas" subaproveitada)

### 2. CONCORRENTES IA DIRECTOS NO SECTOR
- Quem em PT/ES já implementou IA em citrinos com case study público? (Anecoop, Cítricos La Paz, Frutas Esther, Citroprau, etc.)
- Quanto investiram, que resultados publicaram

### 3. FUNDOS DISPONÍVEIS PARA FINANCIAR
- PRR — Componente Capitalização e Inovação Empresarial (Vale Indústria 4.0, Vale IA)
- PT2030 — POCI / COMPETE 2030 medidas de digitalização agroalimentar
- PDR2020 / PEPAC 2023-2027 — apoios específicos sector agrícola
- Horizonte Europa — clusters agro-IA
- Quais já fechados, quais abertos, deadlines, percentagem co-financiamento

### 4. VENDORS IA AGROALIMENTAR PORTUGAL/IBÉRIA
- Lista de fornecedores IA com presença ibérica focados em agroalimentar (NTT Data Agro, Hispatec, Bynse, Agroop, EOS Data Analytics, etc.)
- Pricing model, time-to-value, complexidade

### 5. RISCOS DE NÃO ADOPTAR IA
- Custo do "não fazer nada" para uma OP citrinos PT
- Pressão de retalho (Lidl, Mercadona já exigem QR rastreável, reporting carbono)
- Pressão de concorrência espanhola (Anecoop digitaliza agressivamente)

### 6. QUICK WINS POSSÍVEIS NUMA EMPRESA COM ESTE PERFIL
- Top 5 quick wins IA implementáveis em <90 dias
- Para cada: investimento, ROI estimado, vendor possível

**OUTPUT EM:**
- Tabela "Casos de Uso IA por Categoria" (Caso | Descrição | ROI típico | Vendor | Case study | Barreira)
- Tabela "Concorrência IA" (Empresa | Caso | Investimento | Resultado | Fonte)
- Tabela "Fundos Disponíveis" (Programa | Aviso | Deadline | % cofinanc | Foco)
- Tabela "Vendors Ibéricos" (Vendor | Foco | Pricing | TTV | Casos PT)
- Lista priorizada "Top 5 Quick Wins Frusoal" (com investimento + ROI estimado)
- Lista [GAPS]

---

## Posicionamento do autor (primeira linha do contexto comum)

> **"Sou consultor de implementação de IA. Estou a preparar uma proposta comercial para a empresa portuguesa Frusoal..."**

Esta frase é a linha estratégica de tudo. O autor posiciona-se como **consultor de implementação de IA** — não vendor, não fornecedor de ferramentas, não package provider. A proposta comercial é **de consultoria**, não de venda de produto.
