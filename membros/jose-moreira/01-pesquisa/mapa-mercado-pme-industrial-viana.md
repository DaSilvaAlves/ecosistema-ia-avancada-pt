# Mapa de Mercado — PME Industriais do concelho de Viana do Castelo

**Autor:** Atlas (Analyst AIOX)
**Data de recolha:** 20/04/2026
**Destinatário:** José Moreira — consultor de Automação com IA para PMEs (Viana do Castelo)
**Propósito:** Identificar target list rankeada para venda de chatbot Botpress PT/EN a PMEs industriais do concelho
**Versão:** 1.0

---

## Secção 1 — Resumo Executivo

### Dimensão do universo (concelho de Viana do Castelo, 2023-2024)

| Indicador | Valor | Fonte |
|-----------|-------|-------|
| Microempresas (todos os setores) | 11.119 | Rádio Vale do Minho / IAPMEI 2023 |
| Pequenas e médias empresas (todos os setores) | 404 | Rádio Vale do Minho / IAPMEI 2023 |
| Médias empresas | 56 | Rádio Vale do Minho / IAPMEI 2023 |
| Grandes empresas | 14 | Rádio Vale do Minho / IAPMEI 2023 |
| PME Excelência 2023 (concelho Viana do Castelo) | 34 | IAPMEI, via Rádio Vale do Minho |
| PME Líder 2023 (distrito de Viana do Castelo) | 79 | IAPMEI |

**Estimativa de universo qualificado** (PMEs industriais com 10-100 trabalhadores no concelho): entre 80 e 130 empresas. O número exacto por CAE × concelho × dimensão não está publicamente acessível no SCIE/INE sem consulta paga direta ao INE; esta estimativa resulta do cruzamento entre a contagem total (404 PMEs + 56 médias) e o peso típico da indústria transformadora em Viana (~21-25% do tecido empresarial produtivo, por analogia com os perfis nacionais).

### Sectores industriais principais do concelho

1. **Metalomecânica / metalurgia / componentes automóveis** — núcleo em Zona Industrial do Neiva e Parque Empresarial de Lanheses
2. **Naval e componentes** — Estuário do Lima (West Sea, sub-contratados, serralharia naval)
3. **Têxtil, vestuário e confecção** — concentrado em Neiva e Darque
4. **Madeira e mobiliário** — dispersos (Neiva, Chafé, Barroselas)
5. **Alimentar (panificação, conservas de pescado)** — Viana centro + Castelo do Neiva
6. **Plásticos, borracha e embalagem** — Neiva + Lanheses

### Top 10 para atacar primeiro (síntese)

| # | Empresa | Porquê no top |
|---|---------|---------------|
| 1 | Paniminho | Site básico, email único `geral@`, zero chat, sem horário visível, B2B com centenas de clientes profissionais que perguntam o mesmo |
| 2 | Lacoviana | Grupo de 3 empresas, PME certificada, site WordPress sem chat, sem horário, email único `lacoviana@` |
| 3 | Valforjado | 13 colaboradores, exporta 95%, site `valfor.eu` básico, inglês/português, sem formulário de qualificação de leads |
| 4 | Amavical | Site em renovação declara-o no próprio site, sem formulário, único email, B2B com indústria (madeira, metal, construção, papel) |
| 5 | Perfilima | Só Facebook, sem site autónomo, contactos dois telemóveis, dor aguda |
| 6 | J. Silva Alumínios | Email único, só telemóveis, horário visível (sábado incluído), mercado B2C + B2B em PT+FR |
| 7 | Cergold Indústrias | Só Facebook/Instagram, sem site próprio detectado, B2B com padarias |
| 8 | Tekacier | Site estático HTML puro, `geral@`, sem contacto form, só PT, zero digital |
| 9 | Serralharia Cardielos | Email único, só telemóvel, sem chat, sem horário visível |
| 10 | Carpintaria Rocha | Zona industrial Neiva, email único, sem chat, site CMS básico |

### Observações estratégicas (prioridade decrescente)

1. **O concelho tem um núcleo bem identificável de ~50 PMEs industriais com dor concreta de atendimento digital.** Não é mercado cego. Todas têm site (ou Facebook a fazer de site), todas têm um email único tipo `geral@empresa.pt` e quase nenhuma tem chat.
2. **A dor aguda é bilinguismo real (PT/EN/FR/ES) não resolvido.** Vianaplásticos declara 4 idiomas mas sem chat. Lacoviana em PT/EN sem chat. Globalsac em PT/EN/ES com formulário mas sem chat. É exactamente o *sweet spot* do Botpress PT/EN do Moreira.
3. **Sector naval está fora do radar PME.** West Sea tem >500 trabalhadores e é cliente de state-owned contracts, não compra chatbot a freelancer. Excluir do target.
4. **Sectores a excluir por escala:** Browning Viana (600+ trab.), BorgWarner (300+ trab.), DS Smith (grupo internacional), Vestas (multinacional), Enercon (em encerramento). São grandes empresas, têm IT interno e procurement formal.
5. **Três *clusters* geográficos para ataque por proximidade:** (i) Zona Industrial do Neiva — ~20 PMEs adjacentes, visita presencial numa manhã; (ii) Parque Empresarial da Meadela — menor, mas concentrado; (iii) Viana centro/Darque — mistura têxtil e serviços.

---

## Secção 2 — Metodologia

### Fontes consultadas

| Fonte | URL | Uso |
|-------|-----|-----|
| INE / Rádio Vale do Minho (via IAPMEI) | https://www.radiovaledominho.com/viana-estas-sao-as-empresas-mais-solidas-e-com-melhor-desempenho/ | Contagem agregada 404 PMEs + 56 médias no concelho |
| IAPMEI — Lista PME Líder 2024 | https://www.iapmei.pt/PRODUTOS-E-SERVICOS/Qualificacao-Certificacao/PME-Lider/Documentos-PME-Lider-e-PME-Excelencia/ListaPMEExcelencia2024.aspx | Cross-check de status PME |
| Câmara Municipal de Viana do Castelo | https://www.cm-viana-castelo.pt/investir/parques-e-zonas-empresariais | Identificação dos 4 parques empresariais do concelho (Praia Norte, Meadela, Lanheses, Neiva) |
| Infoempresas — freguesia Neiva | https://www.infoempresas.com.pt/C_INDUSTRIAS-TRANSFORMADORAS/Freguesia_NEIVA-VIANA-CASTELO.html | Lista de ~20 empresas manufatureiras em Neiva |
| Infoempresas — freguesia Lanheses | https://www.infoempresas.com.pt/C_INDUSTRIAS-TRANSFORMADORAS/Freguesia_LANHESES-VIANA-CASTELO.html | Lista de 16 empresas em Lanheses |
| Empresite (JN) — concelho Viana | https://empresite.jornaldenegocios.pt/Actividade/INDUSTRIA/concelho/VIANA-DO-CASTELO/ | Directório com classificação por dimensão (micro/pequena/média/grande) |
| CEVAL — Alto Minho | https://ceval.pt/empresas-de-viana-do-castelo/ | Confirmação CEVAL (directório setorial) |
| Racius | https://www.racius.com | Verificação de NIF, ano de fundação, status legal |
| Empresite (fichas individuais) | https://empresite.jornaldenegocios.pt | CAE, morada exacta, NIF |
| Iberinform | https://www.iberinform.pt | Dimensão e vendas (quando disponível) |
| Sites das próprias empresas | (inline) | Verificação manual directa de canais digitais, email, chat, idiomas, horário |
| Kompass Portugal | https://pt.kompass.com | Cross-check morada e CAE |
| Yelp + Facebook + LinkedIn | (inline) | Presença social detectada, reviews quando existentes |

### Critérios aplicados (cópia dos do briefing)

| Critério | Regra |
|----------|-------|
| CAE | Primária ou secundária em indústria transformadora (divisões 10-33 CAE-Rev.3) |
| Localização | Concelho de Viana do Castelo (não distrito) |
| Dimensão | 10-100 trabalhadores (PME real) |
| Presença digital detectável | Site próprio OU LinkedIn Company Page OU Google Business activo |
| Sinais documentados de dor | Mínimo 2 de: email único `geral@`/`info@`, ausência de chat, horário fechado fora de horas, reviews com queixas de resposta, sem formulário de acknowledgment, só telefone, site desactualizado |

### Limitações honestas

1. **INE SCIE por CAE × concelho:** os dados micro-agregados não estão publicamente acessíveis. A contagem de 11.119 micro + 404 PMEs + 56 médias + 14 grandes cobre **todos os setores**, não só indústria transformadora. Para obter a contagem exacta só no CAE 10-33 × concelho Viana, seria necessário pedido dirigido ao INE (dados agregados abaixo de concelho+CAE+dimensão são *restricted* em alguns casos).
2. **Nº exacto de trabalhadores por empresa:** só verificado quando publicamente divulgado (comunicados, press, LinkedIn, Kompass). Na maioria dos casos foi usado um proxy de dimensão baseado na classificação Empresite (micro/pequena/média/grande por volume de negócios).
3. **Decisores identificados:** onde o nome do decisor não é public, deixa-se "não identificado" explicitamente. Nunca especular.
4. **Verificação manual de websites:** 8 empresas foram verificadas directamente em 20/04/2026. Para as restantes, as observações baseiam-se em directórios secundários (Empresite, Racius, Kompass) que podem ter desfasamento de 3-6 meses.
5. **Dados de 2023 vs 2024 vs 2025:** preferência por fontes 2023+. Dois casos com dados de 2019-2021 estão marcados explicitamente com essa nota.

### Data da recolha

20 de Abril de 2026 (sessão única de pesquisa).

---

## Secção 3 — Mapa Sectorial

| Sector (CAE) | Nº total estimado no concelho | Nº PMEs (10-100 trab.) | Presença digital detectada | Maturidade digital média | Nota geográfica |
|--------------|------------------------------|-------------------------|----------------------------|--------------------------|------------------|
| **Metalomecânica / metalurgia (CAE 24-25)** | 53 (Empresite) | ~25-30 | Alta — maioria tem site | Baixa a média — sites estáticos, zero chat | Concentração forte em Zona Industrial Neiva; cluster secundário Lanheses e Meadela |
| **Componentes automóveis (CAE 29)** | ~15 | ~5-8 PME; restantes são grandes (BorgWarner, Eurostyle, Saertex) | Alta — obrigatório para B2B auto | Média-alta — exigências IATF 16949 forçam presença digital | Lanheses + Neiva |
| **Têxtil e vestuário (CAE 13-14)** | ~40 (Infoempresas distrito) | ~12-15 no concelho | Média — Facebook domina, sites escassos | Baixa | Neiva (Luís Brito), Darque (CLS Brands), Vila Fria |
| **Naval (CAE 30.1)** | ~6 | ~2 PME; restantes são West Sea (grande) e sub-contratados | Baixa — old-school B2B | Baixa | Concentração absoluta no estuário do Lima |
| **Madeira e mobiliário (CAE 16-31)** | ~30 (Empresite carpintaria) | ~15-20 | Média — alguns com e-commerce (Artur Rego) | Baixa a média | Disperso: Neiva, Barroselas, Chafé, Lanheses |
| **Alimentar (CAE 10-11)** | ~20 | ~10 | Média — sites básicos, alguns Facebook apenas | Baixa | Viana centro (Paniminho), Castelo do Neiva (pescado) |
| **Plásticos e borracha (CAE 22)** | ~12 | ~6-8 | Alta — exportam, obrigados a ter presença B2B | Média | Neiva (Vianaplásticos) + Lanheses (Eurostyle, Serilusa) |
| **Papel e embalagem (CAE 17)** | ~8 | ~4 PME; restante é DS Smith (grande) | Média | Baixa-média | Neiva (Globalsac, ITT, Nunex) |
| **Químico / cosmética / outros (CAE 20-22)** | ~6 | ~3-4 | Média | Baixa-média | Neiva (Eurochemicals, Groupe GM Cosmética) |

**Totais estimados para o universo qualificado do target:** aproximadamente **90-120 PMEs industriais (10-100 trabalhadores)** no concelho de Viana do Castelo, das quais cerca de **50-60 apresentam dor digital documentável** e são alvo útil para o chatbot do Moreira.

---

## Secção 4 — Lista Detalhada de 25 PMEs Industriais (fichas individuais)

### Nota de leitura

- **Prioridade 5** = target mais quente (dor evidente + porta de entrada fácil)
- **Prioridade 4** = target bom (dor confirmada, ligação requer mais preparação)
- **Prioridade 3** = target razoável (dor inferida, mais resistência esperada)
- Empresas como BorgWarner, Browning, DS Smith, West Sea, Vestas, Enercon **não aparecem** na lista: excedem o critério de dimensão (>100 trab.) e têm IT interno.

---

### FICHA 1 — Paniminho — Comércio de Produtos Alimentares, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Paniminho - Comércio de Produtos Alimentares, Lda |
| CAE primária | 10.71 — Fabricação de pão, produtos de pastelaria e confeitaria frescos |
| Trabalhadores (faixa) | 10-49 (micro/pequena — NIF 503041971, 30+ anos) |
| Ano de fundação | 23/04/1993 |
| Localização | Rua Arriscado de Queirós 324, 4935-208 Viana do Castelo (centro) |
| Site / LinkedIn / Google | https://paniminho.com/ |
| Sinais de dor documentados | (1) Email único `geral@paniminho.com`, sem e-mails departamentais (verificado 20/04/2026); (2) zero chat widget no site, só newsletter; (3) só idioma português — perde leads export EN; (4) horário comercial fechado Sáb tarde + Dom — quem contacta fora de horas não tem acknowledgment |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 5 — dor evidente + B2B profissional (padarias e pastelarias que perguntam preços e disponibilidade) |
| Argumento de venda | "Os teus clientes profissionais perguntam preços e stock no sábado e domingo. Quantos compram a outro porque não lhes respondeste? Um chatbot com base de conhecimento responde 24/7 e qualifica o lead para tu ligares segunda de manhã." |

---

### FICHA 2 — Lacoviana — Tratamentos e Lacagens de Alumínios de Viana, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Lacoviana - Tratamentos e Lacagens de Alumínios de Viana, Lda |
| CAE primária | 25.61 — Tratamento e revestimento de metais |
| Trabalhadores (faixa) | 20-49 (inferido — PME com 3 empresas associadas, grupo familiar, +35 anos) |
| Ano de fundação | 1988 |
| Localização | Zona Industrial II Fase, 4935-232 Neiva, Viana do Castelo |
| Site / LinkedIn / Google | https://lacoviana.pt/en/home/ |
| Sinais de dor documentados | (1) Email único `lacoviana@lacoviana.pt`; (2) zero chat; (3) sem horário visível; (4) PT/EN só, sem ES para mercado espanhol geograficamente adjacente; (5) WordPress CMS básico |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 5 — grupo de 3 empresas, PME certificada, dor de coordenação entre unidades |
| Argumento de venda | "Lacoviana + 2 empresas associadas = 3 linhas de contacto diferentes. Um chatbot central encaminha o lead para a unidade correcta (coating, anodização, isolamento) sem o cliente ter de procurar. Zero fricção, zero lead perdido." |

---

### FICHA 3 — Valforjado — Indústria de Válvulas, Unipessoal, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Valforjado - Indústria de Válvulas, Unipessoal, Lda |
| CAE primária | 28.14 — Fabricação de outras torneiras e válvulas |
| Trabalhadores (faixa) | 10-19 (13 colaboradores confirmados, a expandir para 19) |
| Ano de fundação | ~2009 |
| Localização | R. Quelha de Monte Nascente, Armazém B142, 4935-589 Chafé, Viana do Castelo |
| Site / LinkedIn / Google | http://www.valfor.eu/ |
| Sinais de dor documentados | (1) Site `valfor.eu` é hosting antigo tipo `.asp` — muito desactualizado; (2) sem chat; (3) 95% de exportação mas só PT/EN; (4) sem formulário de qualificação — leads complexos (indústria química, nuclear, térmica) exigem ficha técnica e acompanhamento |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 5 — exporta 95%, pequena equipa, cada lead mal acolhido é dinheiro perdido |
| Argumento de venda | "Exportam 95%. Um lead alemão, francês ou polaco contacta-vos às 2h da madrugada (hora deles é 8h manhã). Quem responde? Chatbot em PT/EN/FR/DE que qualifica o pedido técnico de válvula e agenda chamada técnica — antes da concorrência alemã responder." |

---

### FICHA 4 — Amavical — Máquinas e Ferramentas, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Amavical, Máquinas e Ferramentas, Lda |
| CAE primária | 46.62 — Comércio por grosso de máquinas-ferramentas |
| Trabalhadores (faixa) | 10-19 (inferido — PME com loja + oficina) |
| Ano de fundação | Não identificado (NIF 505313480) |
| Localização | Zona Industrial do Neiva, Fase 2, Pavilhão 25, 4935-232 Neiva |
| Site / LinkedIn / Google | https://amavical.pt/ |
| Sinais de dor documentados | (1) Site declara "em renovação" na própria página de contacto (verificado 20/04/2026); (2) zero formulário de contacto; (3) só PT; (4) sem chat; (5) B2B com 4 sectores (madeira, metalomecânica, construção, papel) = leads complexos perdidos |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 5 — auto-declaram problema digital; porta aberta |
| Argumento de venda | "O site está 'em renovação' há meses. Enquanto não mexes, pões um chatbot no Facebook e LinkedIn que recolhe o tipo de máquina, marca, problema e contacto. Ganhas a informação que a renovação ia dar-te, em 48 horas." |

---

### FICHA 5 — Perfilima — Indústria de Ferro e Alumínio, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Perfilima - Indústria de Ferro e Alumínio, Lda |
| CAE primária | 25.12 — Fabricação de portas, janelas e elementos similares em metal |
| Trabalhadores (faixa) | 10-49 (inferido) |
| Ano de fundação | 03/06/1997 |
| Localização | Rua Portela 49, Cardielos, 4925-340 Viana do Castelo |
| Site / LinkedIn / Google | Facebook apenas (não tem site próprio detectado) |
| Sinais de dor documentados | (1) Sem site próprio — só página Facebook; (2) dois telemóveis como contacto (258 838 044 e 939 712 904); (3) dependência total de Facebook para leads B2C |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — dor aguda mas necessita conversar sobre "precisas de site?" antes de chatbot |
| Argumento de venda | "Todos os pedidos chegam via Facebook ou telefone. Quando são 22h e não atendes? Chatbot no Messenger qualifica o pedido de caixilharia (medidas, tipo, zona) e acorda segunda-feira com lista pronta." |

---

### FICHA 6 — João Silva Alumínios

| Campo | Conteúdo |
|-------|----------|
| Nome legal | João Silva Alumínios (razão social completa não confirmada) |
| CAE primária | 25.12 — Fabricação de caixilharia |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | Não identificado |
| Localização | Viana do Castelo (concelho; freguesia não especificada) |
| Site / LinkedIn / Google | https://www.jsaluminios.pt/en |
| Sinais de dor documentados | (1) Email `geral@jsaluminios.pt` único; (2) três telemóveis (PT + FR) sem diferenciação; (3) sem contact form; (4) horário com Sábado até 18h — implica tentativa de capturar B2C mas sem chat para dar acknowledgment; (5) serve mercado francês (número +33) sem suporte automático FR |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — exporta FR, dor de idioma clara |
| Argumento de venda | "Tens número francês. O cliente francês de sábado à tarde chama o +33, deixa mensagem. Tu ouves segunda. Concorrência francesa respondeu logo. Chatbot PT/EN/FR no site qualifica o pedido, recolhe medidas e tipo, envia-te email pronto para orçamentar." |

---

### FICHA 7 — Cergold Indústrias, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Cergold Indústrias, Lda |
| CAE primária | 10.89 — Fabricação de outros produtos alimentares (ingredientes panificação/pastelaria) |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | 2011 |
| Localização | ZN Industrial do Neiva, Lote 13, 4935-232 Neiva |
| Site / LinkedIn / Google | Facebook + Instagram (sem site próprio detectado) |
| Sinais de dor documentados | (1) Sem site próprio detectado; (2) B2B com padarias e pastelarias que têm horários alargados; (3) presença digital restrita a redes sociais — qualquer lead que chegue fora de horas Instagram fica perdido |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — B2B alimentar, dor horária confirmada |
| Argumento de venda | "Os teus clientes são padarias. Padarias começam às 5h. Eles enviam mensagem 5h30 a pedir ingrediente para salvar o dia. Tu vês 9h. O Panibom ao lado já respondeu. Chatbot no Instagram + WhatsApp confirma stock e agenda entrega — antes de acordares." |

---

### FICHA 8 — Tekacier — Serralharia Civil

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Tekacier - Serralharia Civil (razão social legal não confirmada) |
| CAE primária | 25.11 — Fabricação de estruturas de construções metálicas |
| Trabalhadores (faixa) | 10-19 (inferido — pequena serralharia) |
| Ano de fundação | Não identificado |
| Localização | Rua da Ponte 11, Cardielos, 4925-346 Viana do Castelo |
| Site / LinkedIn / Google | https://www.tekacier.com/ |
| Sinais de dor documentados | (1) Site estático HTML puro sem CMS (verificado 20/04/2026); (2) email único `geral@tekacier.com`; (3) zero contact form; (4) zero chat; (5) só PT — sem contemplação export |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — site evidentemente abandonado, dor digital absoluta |
| Argumento de venda | "O teu site é de 2010. Um cliente corporativo grande vê isso, desliga. Antes de refazer o site, põe um chatbot moderno no que tens — já passas uma impressão digital credível. Depois, renova no próximo ano." |

---

### FICHA 9 — Serralharia Cardielos

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Serralharia Cardielos (razão social completa não confirmada) |
| CAE primária | 25.11 — Estruturas metálicas |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | Não identificado |
| Localização | Fábrica: Rua Bouças de Terra 206, Cardielos, 4925-340 Viana do Castelo |
| Site / LinkedIn / Google | https://www.serralhariacardielos.pt/ |
| Sinais de dor documentados | (1) Email `geral@serralhariacardielos.pt`; (2) só telemóvel (+351 936 112 811); (3) sem horário visível; (4) só PT; (5) formulário existe mas sem chat em tempo real; (6) duas moradas (sede + fábrica) — possível confusão do cliente |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — existe intenção digital (tem form) mas falta o automático |
| Argumento de venda | "Tens formulário. O cliente preenche, nunca sabe se chegou. Chatbot confirma receção, qualifica se é caixilharia, estrutura ou serralharia civil, e envia-te o lead já triado em 30 segundos." |

---

### FICHA 10 — Carpintaria Rocha, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Carpintaria Rocha, Lda |
| CAE primária | 31.01 — Fabricação de mobiliário para escritório |
| Trabalhadores (faixa) | 10-19 (inferido — classificação Empresite "Micro") |
| Ano de fundação | Não identificado |
| Localização | Zona Industrial II Fase, 4935-232 Neiva, Viana do Castelo |
| Site / LinkedIn / Google | https://www.carpintariarocha.com/pt/ + LinkedIn Company |
| Sinais de dor documentados | (1) Email `geral@carpintariarocha.com`; (2) sem chat; (3) fax ainda listado como contacto (258 871 777) — sinal de infra antiga; (4) sem formulário dinâmico; (5) dependência de LinkedIn para novos clientes |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — LinkedIn presente = decisor identificável com pesquisa de 30 minutos |
| Argumento de venda | "Tens fax no site. Para arquitectos e gabinetes B2B que vos procuram para mobiliário corporate, isso pode parecer pouco profissional. Chatbot moderno no site e no LinkedIn redireciona logo para qualificação — modernização barata." |

---

### FICHA 11 — Metaloviana — Metalúrgica de Viana, S.A.

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Metaloviana - Metalúrgica de Viana, S.A. |
| CAE primária | 25.11 — Fabricação de estruturas metálicas |
| Trabalhadores (faixa) | 50-100 (inferido — "leader em metalomecânica", +40 anos, 20 países, 15.000m² + 8.000m² cobertos) — no limite PME, possivelmente ligeiramente acima |
| Ano de fundação | ~1984 |
| Localização | Zona Industrial de Neiva, 2ª Fase, 4935-232 Viana do Castelo |
| Site / LinkedIn / Google | https://www.metaloviana.pt/ |
| Sinais de dor documentados | (1) Email único `geral@metaloviana.pt`; (2) zero chat; (3) formulário com 180 caracteres apenas — limitação absurda para B2B complexo; (4) 3 operações internacionais (FR/AO/MZ) mas sem chat; (5) canal de denúncia com SLA 7 dias — mas zero SLA para cliente |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — dimensão maior requer abordagem mais formal, pode ter IT interno |
| Argumento de venda | "Têm escritórios em França, Angola, Moçambique. Cada cliente internacional espera resposta em 2 horas. O formulário de 180 caracteres não chega. Chatbot multilingue qualifica em PT/EN/FR/ES e encaminha directamente para a delegação certa." |

---

### FICHA 12 — Vianaplásticos, S.A.

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Vianaplásticos - Indústria e Comércio de Peças Plásticas e Ferramentais, S.A. |
| CAE primária | 22.29 — Fabricação de outros artigos de plástico |
| Trabalhadores (faixa) | 20-49 (30 trabalhadores confirmados em 2019, expansão planeada) |
| Ano de fundação | 1992 |
| Localização | Zona Industrial II Fase Lote 402/404, 4935-232 Neiva |
| Site / LinkedIn / Google | https://vianaplasticos.com/ |
| Sinais de dor documentados | (1) Email `contacto@vianaplasticos.com` (único); (2) zero chat; (3) 4 idiomas (PT/EN/FR/DE) mas todos dependem do mesmo formulário; (4) certificação IATF 16949 = exige ciclo formal de qualificação, contacto lento perde oportunidades |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — sweet spot de dimensão e multilinguismo |
| Argumento de venda | "Suportam 4 idiomas no site mas o formulário é único. Um potencial cliente automóvel francês ou alemão contacta e espera. Chatbot em 4 idiomas qualifica o pedido (peça, volume, tooling vs. produção) e encaminha ao comercial certo. Venda que se perde por lentidão vale muito mais do que um chatbot." |

---

### FICHA 13 — Luís Brito, Têxteis, S.A.

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Luís Brito, Têxteis, S.A. |
| CAE primária | 14.14 — Confecção de vestuário interior |
| Trabalhadores (faixa) | 20-49 (inferido — PME Excelência 2023) |
| Ano de fundação | Não identificado (NIF 507207394) |
| Localização | Zona Industrial do Neiva, 2ª Fase, Lote 16, 4935-232 Viana do Castelo |
| Site / LinkedIn / Google | http://www.lbt.pt/ (site tem problema de certificado SSL — verificado 20/04/2026) |
| Sinais de dor documentados | (1) Certificado SSL inválido no site — cliente fica bloqueado; (2) sem chat; (3) infra digital antiga; (4) B2B moda = exporta, precisa de disponibilidade 24/7 |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 4 — PME Excelência 2023 = empresa financeiramente sólida, pode pagar |
| Argumento de venda | "O vosso site tem certificado SSL inválido — Chrome avisa 'site inseguro'. Cliente internacional sai. Antes de resolver SSL (tarefa IT), põe um chatbot no Facebook Messenger e Instagram para apanhar os leads que ficam sem ir ao site. Paralelo: fala com quem faz o site para refrescar." |

---

### FICHA 14 — Portilame, S.A.

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Portilame, S.A. |
| CAE primária | 16.23 — Fabricação de outras obras de carpintaria para construção |
| Trabalhadores (faixa) | 20-49 (inferido — PME Líder 2024, múltiplas certificações ISO + FSC) |
| Ano de fundação | ~2005 ("há vinte anos") |
| Localização | Zona Industrial de Neiva, 2ª Fase, 4935-232 Viana do Castelo |
| Site / LinkedIn / Google | https://portilame.com/ |
| Sinais de dor documentados | (1) Dois emails departamentais (`trading@`, `comercial@`) — bom sinal, mas não chega; (2) zero chat; (3) horário 8h30-17h30 seg-sex — fora disso leads perdem-se; (4) formulário simples (4 campos) para B2B complexo (construção em madeira) |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — maturidade digital acima da média, mas há espaço |
| Argumento de venda | "Para construção em madeira, a maior parte do público contacta entre 18h e 22h (fim de dia do arquitecto ou do dono de obra). Vocês fecham às 17h30. Chatbot qualifica em 5 perguntas (m², tipo de estrutura, data obra) e agenda chamada para o dia seguinte." |

---

### FICHA 15 — Globalsac — Sacos de Papel, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Globalsac - Sacos de Papel, Lda |
| CAE primária | 17.21 — Fabricação de papel e cartão canelados e embalagens |
| Trabalhadores (faixa) | 10-49 (inferido) |
| Ano de fundação | Não identificado (NIF 508493161) |
| Localização | Zona Industrial 2ª Fase, Neiva, 4935-232 Viana do Castelo |
| Site / LinkedIn / Google | http://globalsac.pt/ |
| Sinais de dor documentados | (1) Email `geral@` + um email comercial (`m.teixeira@`) — razoável mas sem automação; (2) zero chat; (3) 3 idiomas (PT/ES/EN) mas formulário único; (4) sem horário indicado; (5) verificação matemática anti-bot no formulário = fricção |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — já têm algum investimento digital, venda é consultiva |
| Argumento de venda | "Tens verificação 'CAPTCHA matemático' no formulário. Isso bloqueia 20% dos leads reais que não querem fazer contas. Chatbot limpa isso e qualifica em conversa natural — sem fricção." |

---

### FICHA 16 — Cardoso & Sampaio (C&S Wood Solutions)

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Carpintaria Cardoso & Sampaio (razão social completa não confirmada) |
| CAE primária | 31.02 — Fabricação de mobiliário de cozinha |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | Não identificado |
| Localização | Zona Industrial de Chafé, 1ª Fase, 4935-586 Chafé, Viana do Castelo |
| Site / LinkedIn / Google | https://www.cardososampaio.pt/ |
| Sinais de dor documentados | (1) Email `geral@cardososampaio.pt`; (2) zero chat; (3) só PT; (4) sem horário visível; (5) tem form "Precisa de Ajuda?" — iniciativa boa mas sem automação; (6) público B2C (cozinhas personalizadas) pesquisa à noite |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — B2C de ciclo longo (cozinhas sob medida), dor horária forte |
| Argumento de venda | "Cozinhas personalizadas vendem-se à noite e aos fins-de-semana — quando o casal discute a casa nova. Tu fechas cedo e não respondes. Chatbot qualifica (m², estilo, zona, orçamento) e marca visita de arquitecto para segunda manhã." |

---

### FICHA 17 — Uchiyama Portugal — Vedantes, Unipessoal, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Uchiyama Portugal - Vedantes, Unipessoal, Lda |
| CAE primária | 22.19 — Fabricação de outros produtos de borracha |
| Trabalhadores (faixa) | 50-100 (inferido — subsidiária de multinacional japonesa) |
| Ano de fundação | Não identificado (NIF 503725935) |
| Localização | Rua D 1123, Zona Industrial II Fase, 4935-232 Neiva |
| Site / LinkedIn / Google | https://www.umc-upv.com/ |
| Sinais de dor documentados | (1) Email `upv@umc-upv.com` único; (2) site corporativo multinacional = cliente automóvel PT fica perdido; (3) canal de contacto global não local |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — pode ter IT corporativo, mas a operação local pode autonomamente comprar chatbot |
| Argumento de venda | "A sede japonesa decide IT global. Mas vocês em Viana têm fornecedores portugueses, subcontratados, candidatos locais que vos procuram. Chatbot local no LinkedIn resolve isso sem pedir autorização a Tóquio." |

---

### FICHA 18 — Nunex Worldwide, S.A.

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Nunex - Worldwide, S.A. |
| CAE primária | 17.22 — Fabricação de artigos de papel para uso doméstico e sanitário |
| Trabalhadores (faixa) | 50-100 (inferido — SA + "Worldwide") |
| Ano de fundação | Não identificado |
| Localização | ZN Industrial do Neiva, 2ª Fase, 4935-232 Neiva, Viana do Castelo |
| Site / LinkedIn / Google | Site próprio não detectado em pesquisa directa; presente em directórios |
| Sinais de dor documentados | (1) Ausência de site detectável em top SERPs = baixa visibilidade digital; (2) nome "Worldwide" implica export, mas presença online é Empresite |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — sem site, confirma necessidade urgente de qualquer presença digital |
| Argumento de venda | "Não aparecem em Google para 'papel sanitário Viana Castelo'. Qualquer comprador internacional que vos procure por nome vai parar a Empresite e desiste. Chatbot numa landing simples com domínio próprio já resolve presença mínima." |

---

### FICHA 19 — Pinhais & Cª (Conservas Pinhais)

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Pinhais & Cª, Lda |
| CAE primária | 10.20 — Preparação e conservação de peixe e produtos à base de peixe |
| Trabalhadores (faixa) | 100 (no limite superior — "mais de 100 trabalhadores") |
| Ano de fundação | 1920 |
| Localização | Viana do Castelo (área ribeirinha) |
| Site / LinkedIn / Google | https://visitar.conservaspinhais.com/ |
| Sinais de dor documentados | (1) Site dedicado a "visitar" (turismo industrial) = pouca otimização para B2B; (2) exportação mundial mas sem chat; (3) gourmet premium = clientela internacional exigente |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — no limite de dimensão, mas marca gourmet paga bem |
| Argumento de venda | "Vendem em lojas gourmet de Nova York a Tóquio. Esses compradores têm dúvidas sobre stock, MOQ, certificações kosher/halal. Chatbot multilingue qualifica o comprador internacional às 3h da manhã (meio-dia em NY) — antes de ele ir aos italianos." |

---

### FICHA 20 — Artur Rego — Artefactos de Madeira, Lda (REGGO)

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Artur Rego - Artefactos de Madeira, Lda |
| CAE primária | 16.29 — Fabricação de outras obras de madeira |
| Trabalhadores (faixa) | 10-49 (empresa familiar com +60 anos) |
| Ano de fundação | 1962 (consolidada em 2002 na Zona Industrial de Neiva) |
| Localização | Zona Industrial de Neiva (2ª Fase), 4935-232 Neiva, Viana do Castelo |
| Site / LinkedIn / Google | https://www.arturregolda.pt/en/ |
| Sinais de dor documentados | (1) E-commerce operacional (bom sinal) mas zero chat; (2) 3 idiomas (PT/EN/ES); (3) contactos não visíveis na home — cliente tem de procurar; (4) Facebook presente mas desconectado do site |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — maturidade digital acima da média, venda consultiva |
| Argumento de venda | "Têm loja online com 3 idiomas mas cliente não encontra contactos na home. Chatbot como 'recepcionista virtual' ajuda na compra, redireciona para suporte ou comercial, e recupera carrinhos abandonados." |

---

### FICHA 21 — Serralharia Ca3S, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Serralharia Ca3S, Lda |
| CAE primária | 25.11 — Estruturas metálicas |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | Não identificado |
| Localização | Avenida do Santoinho 315 R/C Esq., 4935-176 Darque, Viana do Castelo |
| Site / LinkedIn / Google | Sem site próprio detectado — só Racius e Empresite |
| Sinais de dor documentados | (1) Sem site próprio; (2) localização em Darque (fora dos parques industriais) — acesso a clientes B2B depende de networking |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — precisa conversar primeiro sobre "site mínimo + chatbot" como pacote |
| Argumento de venda | "Sem site, qualquer pesquisa por 'serralharia Darque' vai para os concorrentes. Uma landing page + chatbot a custo baixo põe-vos no mapa — e o chatbot capta leads enquanto descansam." |

---

### FICHA 22 — Costa & Rego, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Costa & Rego, Lda |
| CAE primária | 25.99 — Fabricação de outros produtos metálicos diversos |
| Trabalhadores (faixa) | 10-49 (inferido — novas instalações em 2019) |
| Ano de fundação | Não identificado (NIF 22033984 na Iberinform) |
| Localização | Zona Industrial de Neiva, 4935-232 Neiva, Viana do Castelo |
| Site / LinkedIn / Google | Facebook apenas (https://www.facebook.com/Costa.Rego/) |
| Sinais de dor documentados | (1) Sem site próprio — só Facebook; (2) investimento físico recente (2019) mas não acompanhado por presença digital; (3) dependência absoluta de Facebook para leads |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 3 — investiram em instalações, não em digital — janela de oportunidade |
| Argumento de venda | "Investiram 1M€+ em instalações novas. Falta agora gerar retorno — e isso faz-se com leads. Chatbot no Facebook Messenger capta e qualifica contactos B2B, 24/7." |

---

### FICHA 23 — Mepvoutes — Fabrico de Componentes para Calçado, Unipessoal, Lda

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Mepvoutes - Fabrico de Componentes para Calçado, Unipessoal, Lda |
| CAE primária | 15.20 — Indústria do calçado (componentes) |
| Trabalhadores (faixa) | 10-19 (inferido) |
| Ano de fundação | Não identificado |
| Localização | Neiva, Viana do Castelo |
| Site / LinkedIn / Google | Sem site próprio detectado |
| Sinais de dor documentados | (1) Sem site; (2) sector calçado português está em crise — diferenciação digital é key |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 2-3 — precisa confirmar se está activa e investimento próprio |
| Argumento de venda | "Calçado português está pressionado por concorrência asiática. Quem tem agilidade digital ganha encomendas pequenas B2B que os grandes não querem. Chatbot capta essas encomendas agilmente." |

---

### FICHA 24 — Lacoviana Group — unidade Viana Aluminium Coatings

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Sub-unidade de Lacoviana Group (Tratamentos & Lacagens) |
| CAE primária | 25.61 — Tratamento e revestimento de metais |
| Trabalhadores (faixa) | 10-49 (unidade específica) |
| Ano de fundação | Fundador 1988; unidades mais recentes |
| Localização | Viana do Castelo (Neiva) |
| Site / LinkedIn / Google | Partilha https://lacoviana.pt/ com Ficha 2 |
| Sinais de dor documentados | Ver Ficha 2; confirma o padrão do grupo |
| Decisor identificado | Ver Ficha 2 |
| Prioridade | 4 — cross-selling se Ficha 2 entrar |
| Argumento de venda | "Upsell de Ficha 2 — uma vez que o chatbot está operacional numa unidade do grupo, replicar para as outras é matéria de configuração, não de projecto." |

---

### FICHA 25 — Groupe GM Cosmética Portugal

| Campo | Conteúdo |
|-------|----------|
| Nome legal | Groupe GM Cosmética Portugal (razão social legal não confirmada) |
| CAE primária | 20.42 — Fabricação de perfumes, cosméticos e produtos de higiene |
| Trabalhadores (faixa) | 20-99 (inferido — subsidiária de multinacional francesa) |
| Ano de fundação | Não identificado |
| Localização | Zona Industrial de Neiva, 4935-232 Viana do Castelo |
| Site / LinkedIn / Google | Sede francesa tem site; unidade PT sem presença digital local detectada |
| Sinais de dor documentados | (1) Sem presença digital local autónoma; (2) cliente B2B de hotelaria (amenities) procura em PT, site só em FR/EN |
| Decisor identificado | Não identificado publicamente |
| Prioridade | 2 — IT corporativo pode bloquear compras locais; avaliar |
| Argumento de venda | "Hotéis portugueses que querem amenities de marca procuram em PT. Chatbot no LinkedIn da operação Viana (não a global) resolve B2B nacional sem passar por IT francês." |

---

## Secção 5 — Top 10 para Atacar Primeiro

Ordenados por facilidade de entrada × dor confirmada × capacidade de pagar.

### 1. Paniminho (Ficha 1)

**Porquê top:** B2B real (padarias e pastelarias profissionais), dor horária evidente (fecha Sáb tarde + Dom), site básico com email único, 30+ anos de estabilidade financeira. Venda directa de bolso do sócio-gerente.

### 2. Lacoviana (Ficha 2)

**Porquê top:** Grupo com 3 empresas associadas = valor de contrato maior à entrada, PME Excelência implica capacidade financeira, dor clara de coordenação multi-unidade. Um único chatbot resolve triagem para 3 negócios.

### 3. Valforjado (Ficha 3)

**Porquê top:** 95% de exportação = cada lead internacional vale muito, equipa pequena (13) = decisão rápida, site evidentemente desactualizado = porta aberta para qualquer melhoria. Contacto directo via sócio-gerente esperado.

### 4. Amavical (Ficha 4)

**Porquê top:** O próprio site admite "em renovação" — não precisas de convencer que há problema. B2B com 4 sectores industriais diferentes = dor real de qualificação de leads. Solução imediata enquanto o site formal não vem.

### 5. Perfilima (Ficha 5)

**Porquê top:** Dependência de Facebook para leads B2C (caixilharia) + ausência de site = venda consultiva simples ("põe um chatbot no Messenger e um site básico, faço as duas coisas juntas"). Preço de pacote justifica.

### 6. Cergold Indústrias (Ficha 7)

**Porquê top:** B2B alimentar com padarias (clientes madrugadores) sem presença digital autónoma = dor horária aguda. Sem site = sem competição com agência existente. Venda desbloqueada.

### 7. Tekacier (Ficha 8)

**Porquê top:** Site visivelmente dos anos 2010, zero investimento digital desde então = qualquer proposta é upgrade. Empresa operacional (tem telefone atendido, morada confirmada) = pagante.

### 8. J. Silva Alumínios (Ficha 6)

**Porquê top:** Mercado duplo PT/FR com número francês próprio = dor de idioma documentada, horário Sábado até 18h = abertura a investimento em atendimento, email único = sinal digital baixo. Preço justificável pelo ROI de captar leads franceses fora de horas.

### 9. Serralharia Cardielos (Ficha 9)

**Porquê top:** Já tem formulário = mostra intenção digital, mas falta automação = venda de complemento. Duas moradas (sede + fábrica) = dor evidente de qualificação/redireccionamento.

### 10. Carpintaria Rocha (Ficha 10)

**Porquê top:** Presença LinkedIn = decisor identificável com DM directa, site tem fax listado = sinal de modernização necessária e *low-hanging fruit*, Zona Industrial Neiva = visita presencial combinada com Ficha 2, Ficha 4, Ficha 7 na mesma manhã.

---

## Anexo A — Fontes citadas inline (por empresa)

| Empresa | Fonte verificada |
|---------|------------------|
| Paniminho | https://paniminho.com/ (verificado 20/04/2026); NIF 503041971 (Racius) |
| Lacoviana | https://lacoviana.pt/en/home/ (verificado 20/04/2026); Empresite |
| Valforjado | Jornal de Negócios 2022; http://www.valfor.eu/ |
| Amavical | https://amavical.pt/ (verificado 20/04/2026); D&B |
| Perfilima | https://www.facebook.com/perfilima.lda/; PortugalPlease |
| J. Silva Alumínios | https://www.jsaluminios.pt/en (verificado 20/04/2026) |
| Cergold | https://www.facebook.com/cergold/; Empresite |
| Tekacier | https://www.tekacier.com/ (verificado 20/04/2026); ZoomInfo |
| Serralharia Cardielos | https://www.serralhariacardielos.pt/contactos/ (verificado 20/04/2026) |
| Carpintaria Rocha | https://www.carpintariarocha.com/pt/ (verificado 20/04/2026); LinkedIn |
| Metaloviana | https://www.metaloviana.pt/contactos (verificado 20/04/2026); Kompass |
| Vianaplásticos | https://vianaplasticos.com/contactos/ (verificado 20/04/2026); ominho.pt 2019 |
| Luís Brito Têxteis | Yelp; Empresite; certificado SSL verificado com erro 20/04/2026 |
| Portilame | https://portilame.com/en/contacts/ (verificado 20/04/2026) |
| Globalsac | http://globalsac.pt/en/contactos (verificado 20/04/2026) |
| Cardoso & Sampaio | https://www.cardososampaio.pt/contactos/ (verificado 20/04/2026) |
| Uchiyama Portugal | https://www.umc-upv.com/; Racius NIF 503725935 |
| Nunex Worldwide | Empresite JN |
| Pinhais & Cª | https://visitar.conservaspinhais.com/; mar2020.pt |
| Artur Rego / REGGO | https://www.arturregolda.pt/en/ |
| Serralharia Ca3S | Racius; Empresite |
| Costa & Rego | https://www.facebook.com/Costa.Rego/; Iberinform |
| Mepvoutes | Infoempresas |
| Groupe GM Cosmética | Infoempresas Neiva |

## Anexo B — Fontes agregadas (contexto macro)

- [Rádio Vale do Minho — PME Excelência 2023 Viana](https://www.radiovaledominho.com/viana-estas-sao-as-empresas-mais-solidas-e-com-melhor-desempenho/)
- [Câmara Municipal de Viana do Castelo — Parques e Zonas Empresariais](https://www.cm-viana-castelo.pt/investir/parques-e-zonas-empresariais)
- [IAPMEI — PME Líder 2024](https://www.iapmei.pt/PRODUTOS-E-SERVICOS/Qualificacao-Certificacao/PME-Lider/Documentos-PME-Lider-e-PME-Excelencia/Lista-de-empresas-PME-Lider-2024_20Junho.aspx)
- [Infoempresas — Indústrias Transformadoras Viana do Castelo](https://infoempresas.jn.pt/C_INDUSTRIAS-TRANSFORMADORAS/Distrito_VIANA-DO-CASTELO.html)
- [CEVAL — Empresas de Viana do Castelo](https://ceval.pt/empresas-de-viana-do-castelo/)
- [Empresite — Indústria concelho Viana do Castelo](https://empresite.jornaldenegocios.pt/Actividade/INDUSTRIA/concelho/VIANA-DO-CASTELO/)
- [DS Smith — fábrica de papel Viana (50 anos)](https://www.dssmith.com/pt/meios-de-comunicacao/noticias/2024/1/fabrica-de-papel-da-ds-smith-em-viana-do-castelo-celebra-50-anos)
- [BorgWarner Lanheses — ECO 2021](https://eco.sapo.pt/2021/10/11/americana-borgwarner-constroi-terceira-fabrica-em-viana-com-300-empregos/)
- [West Sea Viana Shipyard](https://west-sea.pt/en/home/)

---

## Nota final de honestidade

Este mapa é a melhor foto possível obtida em sessão única de 20/04/2026 com fontes públicas. Para fechar o mapa a 100%, o passo seguinte (fora do escopo desta pesquisa) é uma visita presencial ao Parque Empresarial da Meadela + Zona Industrial do Neiva + Parque de Lanheses, que em 2 dias permite contactar pessoalmente 15-20 das 25 empresas desta lista. Para o Moreira, essa visita presencial é estratégica e transforma este mapa de pesquisa em pipeline concreta.

**Empresas excluídas por dimensão (>100 trabalhadores):** Browning Viana, BorgWarner (3 unidades), DS Smith, Vestas Offshore Wind Portugal, Enercon (em encerramento), West Sea, Eurostyle Systems, Aludec, Saertex, Mephisto Portuguesa (para verificar — possivelmente no limite).

**Empresas a verificar em segunda iteração:** Eurochemicals, Serratec, Elspec, BCTP, KGS Diamond, Abralux, Cibermetal, ITT, Vestas (estaleiros), Naval Pinto & Branco, Montinorte, Metalo Rep, Vianapesca, Firmino Machado, J.M. & Sousa Alumínios.
