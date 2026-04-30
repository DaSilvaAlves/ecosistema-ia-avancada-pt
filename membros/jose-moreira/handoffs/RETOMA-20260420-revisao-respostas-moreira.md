# RETOMA — Revisão e envio das 5 respostas ao Moreira

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR — para ler em 60 segundos

**O que aconteceu na sessão anterior (20/04/2026, 02:00-03:30):**
1. Uma (UX Design Expert) produziu documento completo com as **respostas às 5 questões técnicas do Moreira** em PT-PT acessível — ficheiro `02-prd/respostas-5-questoes-moreira.md` (304 linhas)
2. Eurico declarou e ficou registado em memória permanente o **Modelo Acolhe-Adapta-Rentabiliza** — princípio fundador da comunidade: projectos de membros são R&D estratégico para produto nosso, membros podem virar sócios/parceiros

**Estado:** documento **PRONTO** mas em **DRAFT** — não enviado. Aguarda revisão e 4 decisões do Eurico.

**Próximo passo:** Eurico lê o documento → próximo agente ajusta conforme feedback → Eurico aprova → documento é enviado (canal a decidir, provavelmente email).

**NÃO FAZER:**
- Enviar nada ao Moreira sem aprovação explícita do Eurico
- Marcar Zoom (Eurico rejeitou essa via)
- Fazer análise de capacidade/estratégia adicional (Eurico já decidiu avançar)
- Propor modelos de negócio/pricing ao Moreira

---

## 1. Activação no terminal novo — comandos exactos

### 1.1. Abrir terminal no directório certo

```bash
# Git Bash:
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira

# Windows Terminal (atalho):
wt.exe -d "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\jose-moreira"
```

### 1.2. Iniciar Claude Code

```bash
claude
```

### 1.3. Activar agente

```
/aiox-ux-design-expert
```

**Razão:** Uma continua a ser a responsável pelo documento. O tom e estrutura foram decididos por ela. Continuidade natural.

**Alternativa:** `/copy-chief` se Eurico pedir reescrita profunda de tom ou estilo. Raro.

### 1.4. Ordem obrigatória de leitura na activação

1. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\MEMORY.md` (auto-carregado)
2. **Este handoff** (`RETOMA-20260420-revisao-respostas-moreira.md`)
3. **O documento que precisa revisão** (`02-prd/respostas-5-questoes-moreira.md`, 304 linhas)
4. **Auditoria v2** (`handoffs/RETOMA-20260420-auditoria-profunda-v2.md` secção 10) — fonte da evidência técnica por trás das respostas
5. **Briefing original do Moreira** (`00-briefing/Sr. Eurico Alves! 👋.txt`)
6. **Memória do princípio Acolhe-Adapta-Rentabiliza** (`feedback_community_acolhe_adapta_model.md` em `C:\Users\XPS\.claude\projects\...\memory\`)
7. Confirmar com Eurico qual das 4 decisões pendentes ele tomou

---

## 2. Contexto estratégico — princípio Acolhe-Adapta-Rentabiliza

Durante a sessão de 20/04/2026 (03:00), o Eurico declarou um **princípio fundador** que passa a governar todos os projectos de membros da comunidade [IA]AVANÇADA PT.

**Citação literal do Eurico (maiúsculas e pontuação originais):**

> "A minha ideia é muito simples. E QUERO QUE ISTO FIQUE INTERNAMENTE REGISTADO. CRIAMOS A COMUNIDADE PARA COLOCAR OS PORTUGUESES NO NIVEL 4 EM IA, VAI VER A NOSSA RAZÃO E PROPÓSITOS. POR ISSO O NOSSO LEMA É E SERÁ SEMPRE AJUDAR OS MEMBROS DA COMUNIDADE E NÃO SÓ. POR ISSO VAMOS PEGAR NO PROJETO DELE. AJUDAR-LO NO QUE FOR PRECISO PARA COLOCAR A IDEIA DELE EM PRÁTICA. E ISTO PORQUÊ? CADA PROJETO DESTES QUE AJUDAMOS A DESENVOLVER VAI FICAR TAMBÉM PARA NÓS TERMOS PARA FAZER DEPOIS UM PRODUTO NOSSO E ASSIM PODEMOS RENTABILIZAR MAIS, ALÉM DISSO PRECISAMOS DESTE TIPO DE MEMBRO ATÉ PODE VIRAR PARCEIRO E SÓCIO, AJUDAR O NOSSO PROJETO. PRECISAMOS ACOLHER ESTE TIPO DE PROJETOS E DEPOIS ADAPTÁ-LOS AO NOSSO MODELO"

**Formalizado em 3 passos:**
1. **Acolher** — pegar no projecto do membro e ajudar sem reservas
2. **Adaptar** — know-how e templates ficam também connosco, adaptados ao nosso modelo
3. **Rentabilizar** — transformamos em produto nosso mais tarde. Cada membro ajudado é R&D + talent pipeline

**Ficheiro de memória:** `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\feedback_community_acolhe_adapta_model.md`

**MEMORY.md foi actualizado** com a entrada no final.

**O que isto muda para o caso Moreira:**
- Avançamos com a ajuda completa (não só Nível 1, mas trabalho continuado depois se fizer sentido)
- Tratamos Moreira como **co-construtor potencial**, não cliente
- Documentamos o padrão para produto futuro nosso (chatbot PME replicável)
- Linguagem de pares, respeitosa

---

## 3. Estado actual — o que está pronto

### 3.1. Ficheiros criados/alterados nesta sessão

| Ficheiro | Localização | Tamanho | Estado |
|----------|-------------|---------|--------|
| Respostas às 5 questões (DRAFT) | `membros/jose-moreira/02-prd/respostas-5-questoes-moreira.md` | 304 linhas | **DRAFT — aguarda aprovação Eurico** |
| Memória: Modelo Acolhe-Adapta | `~/.claude/projects/C--Users-XPS-Documents-ecosistema-ia-avancada-pt/memory/feedback_community_acolhe_adapta_model.md` | criado | Activo (permanente) |
| MEMORY.md index | `~/.claude/projects/.../memory/MEMORY.md` | +1 linha | Actualizado |

### 3.2. Estrutura do documento de respostas (304 linhas)

| Secção | Linhas aprox. | Conteúdo |
|--------|---------------|----------|
| Cabeçalho + Nota inicial | 1-25 | Agradecimento, enquadramento, assinatura inicial |
| **Q1 Upload some** | 26-70 | Não é no flow, é config widget. 3 passos pragmáticos |
| **Q2 Skip upload** | 71-120 | 3 opções (A/B/C). Recomenda A (Single Choice) |
| **Q3 Replicação** | 121-175 | NÃO viável no free tier. 4 razões factuais. Caminho se quiser escalar |
| **Q4 Autoria/controlo** | 176-230 | Tabela do que já detém + 4 cenários de risco + 4 modelos + recomenda C |
| **Q5 Agente humano vs KB** | 231-280 | 4 opções. Pergunta de fundo: *quem é o agente humano?* Recomenda B curto prazo |
| **Nota final (4 pontos críticos)** | 281-298 | PAT exposto / foto pública / PDF CV público / clientName vs ClientName |
| Próximos passos + metadados internos | 299-304 | Fecho respeitoso + metadata não-enviar |

### 3.3. Decisões de tom já tomadas

- Tratamento: **"Moreira"** em vez de "tu" (respeita o "Sr. Eurico Alves!" dele)
- Linguagem: **PT-PT rigoroso**, zero PT-BR
- Tom: **respeitoso + pragmático + Carnegie** (reconhece trabalho, faz sentir importante, resolve dor)
- Sem jargão técnico sem tradução (ele tem formação Sociologia/Gestão, não tech)
- **Sem propor pricing/parceria** (respeita `feedback_no_projected_business_models.md`)
- **Zero invenção** — cada afirmação apoiada na auditoria v2 (respeita `feedback_moreira_no_hallucinations.md`)
- Assinatura: "Eurico Alves / [IA]AVANÇADA PT" — a ajustar se Eurico preferir outra

---

## 4. As 4 decisões pendentes do Eurico (antes de enviar)

Uma fez estas perguntas explícitas ao Eurico no fim da sessão anterior. Quando o próximo agente iniciar, **deve perguntar pelo ponto em que Eurico está**:

| # | Decisão | Opções | Bloqueia envio? |
|---|---------|--------|-----------------|
| **D1** | Tom está certo? (respeitoso-formal) | OK / Mais informal / Mais directo / Outro | SIM |
| **D2** | Os 4 pontos urgentes no fim — ficam neste documento OU vão em mensagem WhatsApp curta ANTES? | Dentro do documento / Separar em WhatsApp / Ambos | SIM |
| **D3** | Canal de envio | Email (natural, recebemos por email) / WhatsApp / Ambos | SIM |
| **D4** | Assinatura | "Eurico Alves / [IA]AVANÇADA PT" / Só "Eurico" / Outro formato | SIM |

### 4.1. Notas sobre D2 (importante)

A Uma recomenda **separar os 4 pontos críticos** em mensagem WhatsApp curta que vai **antes** do documento:

**Razão:** os 4 pontos (PAT exposto, foto pública, PDF CV público, variável clientName/ClientName) são urgentes **para ele**, não respondem ao briefing dele. Se ficarem no fim de um documento de 304 linhas, corre-se o risco dele ler tarde demais. Mensagem curta WhatsApp obriga-o a ver nos primeiros minutos.

**Modelo sugerido de mensagem WhatsApp (a validar com Eurico, não escrita ainda):**

> Caro José Moreira, analisei o `.bpz` com atenção e o documento completo de respostas está a chegar por email. Antes disso, quis avisar rapidamente de 4 pontos de segurança/privacidade que convém resolver em 24-48h — nada grave, mas são pontos do tipo "melhor resolver agora do que depois". Os detalhes estão no documento. Um abraço, Eurico

**Se D2 = separar:** reescrever o documento para **remover** a "Nota final — 4 pontos urgentes" e preparar mensagem WhatsApp à parte.

**Se D2 = dentro:** documento fica como está.

### 4.2. Notas sobre D3

- **Email** é o canal natural (briefing original veio por email)
- **WhatsApp** é mais imediato, mas 304 linhas é longo para WhatsApp
- **Recomendação Uma:** email para o documento completo + WhatsApp curto com link/resumo (se D2 = separar)

---

## 5. O que o próximo agente DEVE fazer

### Fluxo de trabalho recomendado

1. **Ler** este handoff + documento respostas + auditoria v2 secção 10
2. **Saudar Eurico** confirmando continuidade e perguntando pelo estado das 4 decisões (D1-D4)
3. **Aguardar feedback** do Eurico — ele provavelmente vai:
   - Ler o documento
   - Apontar ajustes de tom/conteúdo
   - Decidir D1-D4
4. **Ajustar o documento** conforme feedback (usar `Edit` tool, nunca `Write` completo)
5. **Se D2 = separar:** preparar mensagem WhatsApp curta à parte
6. **Apresentar versão final** ao Eurico para aprovação explícita
7. **Depois de aprovado:** ajudar Eurico a preparar o envio (formato final, destinatário, etc.)
8. **Após envio confirmado:** actualizar handoffs, criar próximo handoff (ex: "aguardar resposta Moreira, 2-5 dias")

### Regras absolutas durante o trabalho

| Regra | Detalhe |
|-------|---------|
| Só Eurico aprova envio | Nunca enviar/simular envio sem aprovação explícita |
| Cada ajuste = Edit | Usar `Edit` tool, não `Write` (para preservar o resto do documento) |
| Mostrar diff antes de aplicar | `mandatory-change-log.md` — mostrar antes/depois |
| Zero invenção | Qualquer ajuste novo precisa ter base na auditoria v2 ou no `.bpz` |
| PT-PT | Confirmar que acentos, pontuação e vocabulário estão correctos |
| Respeitar decisão sobre Zoom | Não reintroduzir a opção de reunião Zoom — Eurico rejeitou |

---

## 6. O que o próximo agente NÃO deve fazer

| ❌ NÃO fazer | Porquê |
|-------------|--------|
| Reescrever do zero sem motivo | 304 linhas, trabalho cuidado — só ajustes pontuais |
| Adicionar análise estratégica/negócio no documento | Eurico disse explicitamente: *"VAMOS FOCAR SOMENTE EM RESPONDER A ESTA PARTE"* |
| Propor Zoom, reunião ou qualquer variante | Eurico rejeitou Zoom 2x. Respeitar |
| Fazer preguntas sobre estratégia global | Eurico já decidiu modelo Acolhe-Adapta |
| Propor preços, parcerias, revenue-split ao Moreira | Viola `feedback_no_projected_business_models.md` |
| Inventar capacidades que não temos | Ver assessment na sessão anterior — Botpress specialist = NÃO |
| Pedir explicações já dadas | Tudo está neste handoff + auditoria v2. Viola `feedback_never_restart_context.md` |
| Enviar seja o que for ao Moreira sem "envia" explícito do Eurico | Autoridade de envio é do Eurico |
| Juntar copy/emojis informais no documento final | O tom foi decidido — formal-respeitoso |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260420-revisao-respostas-moreira.md`. ESTE CAMINHO COINCIDE COM A PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (`membros/jose-moreira/`). SE O CAMINHO FOR DIFERENTE DO ACTUAL, MOVER IMEDIATAMENTE COM `git mv`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 7. Ficheiros de referência — leitura prioritária

### 7.1. Fonte primária (ler primeiro se tiver dúvida sobre algo no documento)

| Ficheiro | Porquê ler |
|----------|------------|
| `membros/jose-moreira/02-prd/respostas-5-questoes-moreira.md` | **O documento a rever.** É o output desta sessão |
| `membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md` secção 10 | Evidência técnica por trás de cada resposta. Se tiver de validar um facto, vem daqui |
| `membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt` | Pedido original do Moreira — para garantir que as respostas correspondem ao que ele perguntou |

### 7.2. Evidência da auditoria (se precisar validar factos)

| Ficheiro | Conteúdo |
|----------|----------|
| `02-prd/auditoria-profunda-v2/working/01-nodes-full-dump.txt` | Dump de todos os 33 nós do bot (27 KB) |
| `02-prd/auditoria-profunda-v2/working/02-content-payloads.txt` | Conteúdos completos extraídos (31 KB) |
| `02-prd/auditoria-profunda-v2/working/03-hooks-agents-intents.txt` | Hooks, agents, intents, tables, settings (24 KB) |
| `02-prd/auditoria-profunda-v2/working/04-kb-html.html` | KB indexada (14 KB) |
| `02-prd/auditoria-profunda-v2/working/06-simulacao-final.pdf` | PDF CV pseudo do Moreira (4 MB) — **apagar depois** |

### 7.3. Handoffs anteriores (para contexto histórico)

| Handoff | Data | Estado | O que tem |
|---------|------|--------|-----------|
| `RETOMA-20260420-auditoria-real-bot-moreira.md` | 20/04 | Validado por Eurico | Auditoria v1 factual (18 issues) |
| `RETOMA-20260420-auditoria-profunda-v2.md` | 20/04 | Fonte da verdade técnica | Auditoria v2 forense (35 issues, 4 críticos, 17 secções) |
| `RETOMA-20260420-migracao-terminal-novo.md` | 20/04 | Substituído por este | Handoff de migração anterior (5 decisões D1-D5) |
| `RETOMA-20260419-validacao-projecto-moreira.md` | 19/04 | ❌ **ALUCINAÇÃO — NÃO USAR** | Inventou métricas/arquitectura |

---

## 8. Regras aplicáveis — leitura obrigatória

O próximo agente tem de respeitar estas regras (ordem de criticidade):

| Regra | Onde vive | Porque importa aqui |
|-------|-----------|---------------------|
| `handoff-location.md` | `.claude/rules/` | Este handoff segue a regra; novos handoffs também |
| `mandatory-change-log.md` | `.claude/rules/` | Qualquer ajuste no documento precisa diff claro |
| `language-standards.md` | `.claude/rules/` | PT-PT rigoroso em todo o output |
| `feedback_moreira_no_hallucinations.md` | memory | ZERO invenção — só factos verificáveis da auditoria ou `.bpz` |
| `feedback_no_projected_business_models.md` | memory | NÃO propor pricing/parceria ao Moreira |
| `feedback_community_acolhe_adapta_model.md` | memory | **NOVO**. Framing interno: acolher-adaptar-rentabilizar |
| `feedback_carnegie_copy_framework.md` | memory | Tom: ouve → importante → dor real |
| `feedback_whatsapp_premium_leads.md` | memory | Se preparar WhatsApp: profissional, não "tu", oferecer ajuda concreta |
| `feedback_never_restart_context.md` | memory | NÃO pedir ao Eurico coisas que já estão documentadas |
| `feedback_never_close_terminals.md` | memory | Este próprio handoff existe porque Eurico não fecha terminais sem contexto migrado |
| `agent-authority.md` | `.claude/rules/` | Só `@devops` faz `git push`. Uma pode commitar local mas não empurrar |
| `workspace-governance.md` | `.claude/rules/` | Material do Moreira só dentro de `membros/jose-moreira/` |

---

## 9. Sequência exacta da próxima sessão (passo a passo)

### 9.1. Abertura (3-5 minutos)

1. Activar `/aiox-ux-design-expert` no terminal novo
2. Saudar Eurico: *"Uma retomada. Li o handoff e o documento das 5 respostas. Sobre as 4 decisões pendentes — D1 (tom), D2 (4 pontos críticos dentro ou separados), D3 (canal), D4 (assinatura) — por onde queres começar?"*
3. Aguardar feedback

### 9.2. Ciclo de revisão (iterativo)

Para cada ponto que o Eurico levantar:
1. Identificar as linhas exactas do documento afectadas (`grep -n` ou Read com offset)
2. Propor alteração **antes** de aplicar
3. Mostrar **antes/depois** claro
4. Aplicar com `Edit` tool
5. Confirmar

### 9.3. Se D2 = separar (preparar WhatsApp)

1. Remover a "Nota final — 4 pontos urgentes" do documento (linhas ~281-298)
2. Criar `membros/jose-moreira/02-prd/whatsapp-alerta-4-pontos-moreira.md`
3. Tom: 4-6 linhas curtas, tratamento formal-respeitoso, sem alarmismo
4. Apresentar para aprovação

### 9.4. Pré-envio (quando Eurico aprovar versão final)

1. Confirmar com Eurico: *"Está aprovado para envio. Queres que te prepare o email/WhatsApp formatado, ou envias tu directamente a partir do ficheiro?"*
2. Se for email: preparar texto com subject line + body pronto para copiar para cliente de email
3. Se for WhatsApp: copiar texto limpo sem markdown pesado

### 9.5. Pós-envio

1. Actualizar este handoff: `consumed: true`, `consumed_at: {ISO timestamp}`, `consumed_by: {agent}`
2. Mover para `membros/jose-moreira/handoffs/archive/`
3. Criar novo handoff: `RETOMA-20260421-aguardar-resposta-moreira.md` (ou data do envio+1)
4. Conteúdo mínimo do novo handoff: "Documento enviado em {data} por {canal}. Aguardar resposta 2-5 dias. Se não responder em 7 dias, considerar follow-up curto"

---

## 10. Risks e edge cases

| Risco | Sinal | Mitigação |
|-------|-------|-----------|
| Eurico pedir para mudar radicalmente o tom | "Isto está muito formal" ou "demasiado técnico" | Reescrever secções específicas, não o documento todo. Pedir exemplos concretos do tom desejado |
| Eurico querer acrescentar conteúdo estratégico | "Acrescenta uma secção sobre X" | Verificar se o conteúdo novo respeita `feedback_no_projected_business_models.md`. Se for sobre negócio/pricing, questionar antes de aplicar |
| Eurico dizer "envia" sem confirmar D1-D4 | Enviar sem certeza do tom, formato | Pedir confirmação explícita: *"Confirmo: tom OK, 4 pontos dentro, email, assinatura X?"* |
| Moreira responder rapidamente após envio | Email/WhatsApp dele nas próximas horas | Não responder sem Eurico ver. Criar handoff com a resposta dele e próxima decisão |
| Algum ajuste introduzir erro factual | Ajuste pede algo que a auditoria v2 não suporta | Alertar Eurico: *"Esta alteração exigiria afirmação que não temos evidência — podes confirmar a fonte?"* |

---

## 11. Higiene de ficheiros (opcional — não bloqueia)

No fim do ciclo de envio, considerar:

### 11.1. Eliminar evidência pessoal sensível do Moreira

O PDF `02-prd/auditoria-profunda-v2/working/06-simulacao-final.pdf` (4 MB) contém dados pessoais sensíveis do Moreira (CV pseudo). Foi usado só para análise. **Recomendado eliminar após envio do documento**, por higiene:

```bash
rm /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/02-prd/auditoria-profunda-v2/working/06-simulacao-final.pdf
rm /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/02-prd/auditoria-profunda-v2/working/06-simulacao-final.txt
```

(Confirmar com Eurico antes de apagar.)

### 11.2. Decisão anterior pendente (D5 do handoff migração)

O handoff de migração tinha 5 decisões, e a D5 era higiene de pastas vazias. Esta decisão pode ser retomada depois:
- `02-prd/archive/` → VAZIO (eliminar?)
- `handoffs/archive/` → VAZIO (manter para mover este handoff quando consumido)

**Recomendação:** manter `handoffs/archive/` (vai ser usado), eliminar `02-prd/archive/` quando Eurico autorizar.

---

## 12. One-liner status global

```
Moreira project status: DRAFT ENTREGUE, AGUARDA REVISÃO
- 5 respostas técnicas: DRAFT (304 linhas) em 02-prd/
- Princípio Acolhe-Adapta-Rentabiliza: FORMALIZADO em memória permanente
- Decisões pendentes: 4 (D1 tom, D2 4 pontos dentro/fora, D3 canal, D4 assinatura)
- Próximo agente: /aiox-ux-design-expert (Uma continua)
- Zoom: REJEITADO, não reintroduzir
- Terminal novo: este handoff cobre tudo o que é preciso
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** José Moreira (membro da comunidade [IA]AVANÇADA PT)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/RETOMA-20260420-revisao-respostas-moreira.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260420-revisao-respostas-moreira.md`
- **COINCIDEM?** **SIM**

**AGENTE RESPONSÁVEL:** Uma (UX Design Expert) — última intervenção da sessão de 20/04/2026 03:00-03:30
**DATA:** 20/04/2026 03:30
**ESTADO:** `pending` (aguarda activação no terminal novo)
**CONSUMIDO:** `false`
**HANDOFFS RELACIONADOS:**
- `RETOMA-20260420-migracao-terminal-novo.md` — substituído por este (move para archive quando este for consumido)
- `RETOMA-20260420-auditoria-profunda-v2.md` — fonte da verdade técnica (manter)
- `RETOMA-20260420-auditoria-real-bot-moreira.md` — v1 complementar (manter)
- `RETOMA-20260419-validacao-projecto-moreira.md` — ALUCINAÇÃO, NÃO USAR

**MEMÓRIAS CRIADAS/ACTUALIZADAS:**
- `feedback_community_acolhe_adapta_model.md` — novo princípio fundador (20/04/2026)
- `MEMORY.md` — entrada adicionada no fim

**FICHEIROS CRIADOS:**
- `02-prd/respostas-5-questoes-moreira.md` (304 linhas, DRAFT)

---

*Esta retoma é o ponto de entrada para o próximo agente num terminal novo. Cobre: o que foi feito, porquê, onde está o trabalho, o que falta decidir, o que fazer a seguir, o que NÃO fazer, e como proceder quando Eurico aprovar envio. Zero re-explicação necessária. Uma continua a trabalhar com continuidade total.*
