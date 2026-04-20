# RETOMA — Migração para terminal novo (José Moreira)

> **ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.**
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## 0. Porquê esta retoma existe

**Sessão anterior (terminal A, 2026-04-20 ~01:00–02:00):** Uma (UX Design Expert) entregou auditoria forense profunda v2 do bot Botpress do José Moreira. Trabalho extenso (912 linhas + 13 working files). Context window ficou pesado.

**Decisão do Eurico:** migrar para terminal novo com contexto fresco para continuar o processo. Esta retoma garante que o próximo agente (em qualquer terminal, qualquer hora) entra ao corrente em **5 minutos** e sabe exactamente onde retomar.

**Status:** `pending`
**Consumido:** `false`
**Quem cria:** Uma (UX Design Expert) — última intervenção da sessão A
**Para quem:** próximo agente AIOX em terminal novo — **NÃO especifico um agente**: a próxima acção define quem activa.

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

### 1.3. Activar agente — escolher conforme próxima acção

| Próxima acção | Comando de activação | Persona |
|---------------|----------------------|---------|
| Continuar auditoria UX / produzir respostas Moreira | `/aiox-ux-design-expert` | Uma (continuação directa) |
| Redigir mensagem WhatsApp/email ao Moreira (alerta segurança) | `/copy-chief` ou `/market-copy` | Copy specialist |
| Criar story AIOX para implementar fixes | `/aiox-sm` | River (`*draft`) |
| Implementar fixes técnicos no Studio Botpress (acompanhar Moreira) | `/aiox-dev` | Dex |
| Decidir nível de envolvimento (Nível 0/1/2/3) | `/aiox-pm` | Morgan |
| Overview multi-projecto antes de decidir | `/aiox-monster` | Orquestrador |

### 1.4. Ordem obrigatória de leitura na activação

1. `C:\Users\XPS\.claude\projects\C--Users-XPS-Documents-ecosistema-ia-avancada-pt\memory\MEMORY.md` (auto-carregado)
2. **Este handoff** (`membros/jose-moreira/handoffs/RETOMA-20260420-migracao-terminal-novo.md`)
3. **Auditoria v2** (`membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md`) — 912 linhas, fonte da verdade técnica
4. **Briefing** (`membros/jose-moreira/00-briefing/Sr. Eurico Alves! 👋.txt`) — pedido literal do Moreira
5. **Auditoria v1** (`membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md`) — complementar
6. Confirmar com o Eurico qual decisão (D1–D5) antes de avançar

**NÃO ler como verdade:**
- `RETOMA-20260419-validacao-projecto-moreira.md` — alucinação confirmada
- Qualquer doc em `01-pesquisa/`, `02-prd/`, `02-prd/archive/` (todos vazios actualmente)

---

## 2. Estado actual em uma frase

**Terminámos auditoria forense profunda do bot Botpress do Moreira (35 issues, 4 críticos, evidência directa). Aguardamos decisão do Eurico em 5 pontos antes de avançar com qualquer ajuda. Acção urgente em 24h: alertar Moreira sobre segredos expostos.**

---

## 3. O que está PRONTO (não voltar a fazer)

| Artefacto | Localização | Tamanho | Estado |
|-----------|-------------|---------|--------|
| Auditoria v1 (factual, 18 issues) | `handoffs/RETOMA-20260420-auditoria-real-bot-moreira.md` | 30 KB | Validada pelo Eurico |
| Auditoria v2 (forense profunda, 35 issues, 17 secções) | `handoffs/RETOMA-20260420-auditoria-profunda-v2.md` | 57 KB / 912 linhas | Acabada de entregar, lida pelo Eurico |
| Inventário forense por nó (33 nós) | `02-prd/auditoria-profunda-v2/working/01-nodes-full-dump.txt` | 27 KB | Evidência pura |
| Conteúdos completos extraídos | `02-prd/auditoria-profunda-v2/working/02-content-payloads.txt` | 31 KB | Evidência pura |
| Hooks, agents, intents, tables, settings | `02-prd/auditoria-profunda-v2/working/03-hooks-agents-intents.txt` | 24 KB | Evidência pura |
| KB indexada (HTML 14KB) extraída | `02-prd/auditoria-profunda-v2/working/04-kb-html.html` | 14 KB | Evidência pura |
| Iteração antiga do auto-learning | `02-prd/auditoria-profunda-v2/working/05-improvement-iteration.json` | 19 KB | Evidência pura |
| PDF SIMULAÇÃO FINAL extraído + texto | `02-prd/auditoria-profunda-v2/working/06-simulacao-final.{pdf,txt}` | 4 MB + 8 KB | Evidência pura (CV pseudo do Moreira) |
| Screenshots redimensionados das conversas | `02-prd/auditoria-profunda-v2/working/user-chat-*.jpg` (4) + `studio-media-*.jpg` + `webchat-button-*.jpg` | <100 KB cada | Evidência visual |

**Total trabalho preservado: 13 ficheiros, ~5 MB. Zero a refazer.**

---

## 4. As 5 decisões pendentes do Eurico

(Da auditoria v2 secção 14.5)

| # | Decisão | Quem decide | Prazo | Bloqueia? |
|---|---------|-------------|-------|-----------|
| **D1** | Avançar com Nível 0 (alerta segurança ao Moreira)? | Eurico | **24h — URGENTE** | Sim, bloqueia D2/D3 |
| **D2** | Aceitar Zoom — qual dia (Seg 20, Ter 21 após 13:00, Qui 23 após 18:00, Sex 24 após 18:00)? | Eurico | até quinta 23/04 | Sim, define timing |
| **D3** | Nível 1 (responder 5 questões Moreira no Zoom) ou só Nível 2 (mentor comunidade)? | Eurico | depois de D1 | Sim, define escopo |
| **D4** | Quem responde no Zoom — Eurico directamente ou agente preparado prepara material? | Eurico | conforme D2 | Não — operacional |
| **D5** | Eliminar pastas vazias (`02-prd/archive/`, `handoffs/archive/`, `01-pesquisa/`)? | Eurico | quando quiser | Não — higiene |

### 4.1. Sobre D5 (higiene)

Verificado em 20/04 02:00:
- `01-pesquisa/` → vazio (só `.gitkeep`)
- `02-prd/archive/` → vazio (sem ficheiros)
- `02-prd/` → contém `auditoria-profunda-v2/working/` (ÚTIL — manter) + `.gitkeep`
- `handoffs/archive/` → vazio (sem ficheiros)
- `03-codigo/` → vazio (só `.gitkeep`) — manter para futuro
- `04-landing/` → vazio (só `.gitkeep`) — manter para futuro

**Recomendação higiene:** eliminar `02-prd/archive/` e `handoffs/archive/` (zero ficheiros, só causam confusão visual). Manter `01-pesquisa/`, `03-codigo/`, `04-landing/` mesmo vazios — são parte da estrutura `_template/` do membro (governance `workspace-governance.md`). **Aguardar autorização do Eurico antes de eliminar.**

---

## 5. Os 4 alertas críticos (Nível 0 — INDEPENDENTE de decidir D2/D3)

Estes 4 issues precisam acção em 24-48h **mesmo que decidamos não ajudar mais**:

| # | Issue | Acção mínima |
|---|-------|--------------|
| **I1** | `AIRTABLE_PAT` exposto em texto claro no `.bpz` enviado por email | Eurico avisa Moreira → Moreira revoga PAT no Airtable e gera novo |
| **I2** | Variáveis duplicadas `clientName/ClientName` → Airtable nunca recebe dados | Eurico avisa Moreira → Moreira corrige no Studio (ligar captures à variável Maiúscula OU mudar JS para minúscula) |
| **I3** | Foto pessoal do Moreira pública em Botpress cloud (`accessPolicies: public_content`) | Eurico avisa Moreira → Moreira elimina ou muda policy |
| **I4** | PDF "SIMULAÇÃO FINAL" (CV pseudo, dados pessoais sensíveis) público em Botpress cloud | Eurico avisa Moreira → Moreira elimina do Botpress |

### 5.1. Mensagem WhatsApp sugerida (ainda NÃO escrita)

Próximo agente: se Nível 0 for aprovado, redigir mensagem WhatsApp curta (máx 6 linhas) com tom Carnegie:
1. Reconhece o que está bem (RGPD, SLAs, estrutura)
2. Avisa do PAT exposto + 2 ficheiros pessoais públicos (factual, não alarmista)
3. Pede 5 min para fazer 4 acções rápidas
4. Garante confidencialidade (Eurico apagou cópias)

**Skill a usar:** `/copy-chief` ou `/market-copy` ou directo se houver capacidade. Templates de tom em `imersao-tools/docs/copy-templates/whatsapp-responses.md` (ver `whatsapp-copy-rules.md`).

---

## 6. Os 3 níveis de ajuda recomendados

(Da auditoria v2 secção 14.4)

### Nível 0 — Acção imediata (24h, OBRIGATÓRIA)
- Alertar Moreira por WhatsApp sobre 4 issues críticos
- **Custo:** 30 min do Eurico + 30 min do Moreira
- **Risco:** zero
- **Recomendação Uma:** SEMPRE, independente de outras decisões

### Nível 1 — Resposta às 5 questões (1 sessão Zoom, 1.5h)
- Honrar pedido do briefing
- Tom: aluno-mentor, não consultor-cliente
- **Entregável:** documento com 5 respostas detalhadas + lista priorizada de bugs
- **Custo:** 1.5h preparação + 1.5h Zoom
- **Risco:** Moreira pode interpretar como "não vais ajudar mais que isto"
- **Material já pronto:** secção 10 da auditoria v2 (todas as 5 respostas com evidência directa)

### Nível 2 — Mentor comunidade (sem compromisso formal)
- Moreira entra na comunidade [IA]AVANÇADA PT
- Acesso a workshops, Slack, knowledge sharing
- Eurico/equipa intervém ocasionalmente quando ele postar dúvidas
- **Custo:** ~zero ongoing
- **Risco:** Moreira pode achar que esperava mais

### Nível 3 — Co-construção formal (NÃO recomendado neste momento)
- Aceitar projecto de "tornar bot pronto para PMEs reais"
- 20-30h+ trabalho técnico nosso
- Sem cliente piloto identificado
- Moreira em transição profissional sem capacidade de escala
- **Custos > benefícios neste timing**

---

## 7. Tudo o que sabemos sobre o Moreira (factualmente)

(Da auditoria v2 secção 13 — só factos verificáveis)

| Facto | Fonte |
|-------|-------|
| 46 anos | PDF SIMULAÇÃO FINAL pág. 1 |
| Formação Sociologia + Mestrado em Gestão | PDF SIMULAÇÃO FINAL pág. 1 |
| Em formação IEFP "Criação de Loja Digital" (UC02698, 50h) até 7 Mai 2026 | Cronograma 26.0124.pdf |
| Sem transporte para presencial diário | PDF SIMULAÇÃO FINAL pág. 2 |
| Procura função júnior assistente/técnico marketing digital | PDF SIMULAÇÃO FINAL pág. 1 |
| Email pessoal `josemmoreira1@gmail.com` | bot.json revisionMetadata + briefing |
| Localizado em Viana do Castelo | briefing + Cronograma + bot.json (Lanheses) |
| Construiu o bot de Mar→Abr 2026 (~30 dias) | bot.json versions |
| Iterou 3 saves manuais em 50 min no dia 13/04 | bot.json versions |
| Publicou post LinkedIn sobre Eurico/[IA]AVANÇADA PT | briefing pág. 1 |
| Disponível Zoom: Seg 20 todo dia, Ter 21 após 13h, Qui 23 após 18h, Sex 24 após 18h | briefing |
| Cronograma confirma compatibilidade dessas datas com curso IEFP | Cronograma cruzado |

**Sensibilidade contextual:** Moreira está em **transição profissional**, em formação financiada UE, sem rendimento estável, com fragilidade logística. Construiu o bot enquanto aprende. O bot é simultaneamente **portfolio para emprego** + **projecto pessoal**. Esta dualidade molda como devemos comunicar.

**Regra absoluta:** `feedback_no_projected_business_models.md` proíbe-nos de propor pricing/parceria sem ele pedir. Ele só pediu ajuda nas 5 questões + audiência Zoom.

---

## 8. Inventário do que está em `membros/jose-moreira/`

```
membros/jose-moreira/
├── 00-briefing/
│   └── Sr. Eurico Alves! 👋.txt           ← email original do Moreira (3.7 KB)
│
├── 01-pesquisa/                             ← VAZIO (só .gitkeep)
│
├── 02-prd/
│   ├── archive/                             ← VAZIO (eliminar?)
│   └── auditoria-profunda-v2/
│       └── working/                         ← 13 ficheiros, ~5 MB
│           ├── 01-nodes-full-dump.txt
│           ├── 02-content-payloads.txt
│           ├── 03-hooks-agents-intents.txt
│           ├── 04-kb-html.html
│           ├── 05-improvement-iteration.json
│           ├── 06-simulacao-final.pdf
│           ├── 06-simulacao-final.txt
│           ├── studio-media-Imagem1.jpg
│           ├── user-chat-2026-04-09.jpg
│           ├── user-chat-2026-04-13-A.jpg
│           ├── user-chat-2026-04-13-B.jpg
│           ├── user-chat-2026-04-13-C.jpg
│           └── webchat-button-image.jpg
│
├── 03-codigo/                               ← VAZIO (manter para futuro)
│
├── 04-landing/                              ← VAZIO (manter para futuro)
│
├── assets/
│   ├── img-chat.bot-01.jpeg                ← screenshot mobile do Moreira
│   ├── img-chat-bot-02.jpeg                ← screenshot mobile do Moreira
│   ├── img-chat-bot-03.jpeg                ← screenshot Studio do Moreira
│   └── img-chat-bot-04.jpeg                ← screenshot KB workspace
│
├── handoffs/
│   ├── archive/                             ← VAZIO (eliminar?)
│   ├── RETOMA-20260420-auditoria-real-bot-moreira.md          (v1, 30 KB)
│   ├── RETOMA-20260420-auditoria-profunda-v2.md               (v2, 57 KB) ← FONTE DA VERDADE
│   └── RETOMA-20260420-migracao-terminal-novo.md              (este ficheiro)
│
├── Clientes_Chatbot - 2026 Apr 15.bpz/      ← export do bot (descomprimido)
│   ├── bot.json                             (268 KB — fonte primária)
│   ├── cloud_files.json                     (4.9 KB — metadata 10 ficheiros)
│   ├── files/                               (10 ficheiros, ~5.5 MB total)
│   ├── documents.json                       (vazio)
│   ├── files.json                           (vazio)
│   └── table_01KMDF19JBZPQZ5GVRNA8XB4FP.jsonl  (3 emails MailingList)
│
├── KnowlegeBase (base de conhecimento).docx  (19.7 KB — KB source)
├── Cronograma 26.0124.pdf                    (30 KB — formação IEFP)
└── README.md                                  ← VAZIO (D5 do Eurico: preencher como índice?)
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/jose-moreira/handoffs/RETOMA-20260420-migracao-terminal-novo.md`. ESTE CAMINHO COINCIDE COM A PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (`membros/jose-moreira/`). SE O CAMINHO FOR DIFERENTE DO ACTUAL, MOVER IMEDIATAMENTE COM `git mv`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 9. Issues — referência rápida (top 13 dos 35)

(Para detalhe completo dos 35: ver auditoria v2 secção 11)

| # | Sev | Issue | Categoria |
|---|-----|-------|-----------|
| I1 | 🔴 | AIRTABLE_PAT exposto | Segurança |
| I2 | 🔴 | Variáveis `clientName/ClientName` duplicadas → Airtable vazio | Funcional |
| I3 | 🔴 | Foto pessoal do Moreira pública | Privacidade |
| I4 | 🔴 | PDF SIMULAÇÃO FINAL público | Privacidade |
| I5 | 🟠 | `languages: ["en"]` mas bot é bilingue | Funcional |
| I6 | 🟠 | 14 transições "Não terminar" → null | Funcional |
| I7 | 🟠 | Human_Support_EN.defaultTransition: null | Funcional |
| I8 | 🟠 | KB com placeholders não substituídos | Conteúdo |
| I9 | 🟠 | KnowledgeAgent activo com KB de placeholders → respostas com `[Nome da Empresa]` | UX |
| I10 | 🟠 | Bug file capture sem skip (Q2 do Moreira) | UX |
| I11 | 🟠 | Bug ícone upload some (Q1 do Moreira) | UX |
| I12 | 🟠 | "Obrigado por visitar..." aparece no MEIO | Funcional |
| I13 | 🟠 | RGPD prometido vs realidade técnica (3 terceiros) | Conformidade |

---

## 10. Estimativa de custos do bot (não dito ao Moreira ainda)

| Componente | Custo |
|------------|-------|
| Por conversa happy path (sem KB) | ~€0.04 |
| Por conversa que invoca KB (gpt-4-turbo) | ~€0.31 |
| 1000 conversas com KB | ~€310 |
| Botpress free tier limit | ~2k mensagens IA/mês (tabela) |
| Botpress paid tier (acima do limite) | ~€90/mês + €0.01/mensagem |

**Implicação:** se o bot tiver tráfego real, **excede free tier rapidamente**. O Moreira não tem ideia destes números. Critical para qualquer conversa de "vamos clonar para várias empresas".

---

## 11. Material reaproveitável já pronto para Nível 1

Se Eurico decidir "Sim ao Nível 1 (responder 5 questões)":

| Questão Moreira | Resposta pronta na auditoria v2 | Faltam |
|-----------------|--------------------------------|--------|
| Q1: Upload some em modo normal | Secção 10 Q1 — causa em config webchat, não no flow | Verificar configUrl JSON |
| Q2: Skip do upload | Secção 10 Q2 — 3 opções (A/B/C) com recomendação A | Mock-up de implementação |
| Q3: Replicação free tier | Secção 10 Q3 — NÃO viável, lista 4 razões + 4 requisitos | — |
| Q4: Autoria + integração anúncios | Secção 10 Q4 — 4 modelos (A/B/C/D) | Discussão estratégica |
| Q5: Agente humano vs KB | Secção 10 Q5 — 4 opções (A/B/C/D) | Plano de implementação |

**Trabalho restante para Nível 1:** ~1.5h reformatação em PT acessível ao Moreira (linguagem dele, não nossa) + preparar slides ou screenshare para Zoom.

---

## 12. Comandos úteis para o próximo agente

### Inspeccionar bot.json novamente

```bash
cd "/c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/Clientes_Chatbot - 2026 Apr 15.bpz"

# Listar nós main flow
python -c "
import json,sys; sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('bot.json','r',encoding='utf-8'))
main = [f for f in d['flows'] if f['id']=='wf-main'][0]
for n in main['nodes']: print(n.get('name'), '|', n.get('type'))
"

# Ver um nó específico
python -c "
import json,sys; sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('bot.json','r',encoding='utf-8'))
main = [f for f in d['flows'] if f['id']=='wf-main'][0]
node = next((n for n in main['nodes'] if n.get('name')=='Apoio_Humano_PT'), None)
print(json.dumps(node, ensure_ascii=False, indent=2))
"
```

### Re-ler auditoria v2 secção a secção

```bash
# Ver índice (secções)
grep -n "^## " /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira/handoffs/RETOMA-20260420-auditoria-profunda-v2.md
```

### Preparar mensagem WhatsApp ao Moreira

```bash
# Activar copy specialist
# (no claude:)
/copy-chief
# ou
/market-copy
```

### Higiene (eliminar pastas vazias) — APÓS APROVAÇÃO EURICO

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/jose-moreira
rm -rf 02-prd/archive handoffs/archive
git add -A && git status
```

---

## 13. Regras inegociáveis para o próximo agente

Herdadas de MEMORY.md e `.claude/rules/`:

| Regra | Detalhe |
|-------|---------|
| `language-standards.md` | TODO output PT-PT, zero PT-BR |
| `handoff-location.md` | Novos handoffs SÓ em `membros/jose-moreira/handoffs/`, com 3 blocos início/meio/fim |
| `workspace-governance.md` | Material do Moreira só dentro de `membros/jose-moreira/` |
| `mandatory-change-log.md` | Diffs reais em commits e handoffs — NUNCA "feito sem verificar" |
| `agent-authority.md` | Só `@devops` faz `git push` |
| `feedback_moreira_no_hallucinations.md` | ZERO métricas/arquitectura/integrações inventadas |
| `feedback_no_projected_business_models.md` | NÃO projectar pricing/parcerias — Moreira não pediu |
| `feedback_never_restart_context.md` | Ler ESTE handoff + auditoria v2 + MEMORY — NUNCA pedir re-explicação ao Eurico |
| `feedback_carnegie_copy_framework.md` | Copy ao Moreira segue Carnegie: ouvir → fazer sentir importante → resolver dor |
| `feedback_whatsapp_premium_leads.md` | Profissionais — não usar "tu", identificar-se, oferecer ajuda concreta |
| `comunidade-safety.md` | N/A directo aqui mas respeitar em geral |

---

## 14. Sequência exacta da próxima sessão (passo a passo)

1. **Activar agente** apropriado (ver tabela 1.3)
2. **Ler obrigatoriamente** ordem da secção 1.4
3. **Confirmar com o Eurico**: qual decisão D1–D5 ele tomou?
4. **Se D1 = SIM (Nível 0):**
   - Activar `/copy-chief` ou similar
   - Redigir mensagem WhatsApp ao Moreira (tom Carnegie, máx 6 linhas)
   - Apresentar ao Eurico para aprovação ANTES de enviar
   - Após envio: actualizar este handoff `consumed: true`, mover para `archive/`
5. **Se D2 = SIM (Zoom marcado):**
   - Confirmar dia/hora
   - Se Nível 1 também aprovado: produzir material respostas 5Q (ver secção 11)
6. **Se D3 = Nível 1 escolhido:**
   - Activar `/aiox-ux-design-expert` (Uma) ou `/aiox-pm` (Morgan)
   - Produzir `02-prd/respostas-5-questoes-moreira.md`
   - Reformatar secção 10 da auditoria v2 em PT acessível ao Moreira
7. **Se D3 = Nível 2 (mentor):**
   - Sugerir Eurico convidar Moreira para slot da comunidade
   - Sem mais trabalho técnico
8. **Se D5 = Eliminar archives:**
   - Executar `rm -rf 02-prd/archive handoffs/archive`
   - Commit higiene

---

## 15. Status global (one-liner)

```
Moreira project status: AUDITED, AWAITING DECISION
- v1 audit (factual): DONE
- v2 audit (forensic deep): DONE — 35 issues, 4 critical
- Working evidence files: PRESERVED (13 files, 5MB)
- Decisions pending: 5 (D1 urgent <24h)
- Next agent: free to choose level 0/1/2/3 after Eurico decides
- Total context invested: ~3h on terminal A (2026-04-20 night session)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** José Moreira (membro da comunidade [IA]AVANÇADA PT)
- **LOCALIZAÇÃO CORRECTA:** `membros/jose-moreira/handoffs/RETOMA-20260420-migracao-terminal-novo.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/jose-moreira/handoffs/RETOMA-20260420-migracao-terminal-novo.md`
- **COINCIDEM?** **SIM**

**AGENTE RESPONSÁVEL:** Uma (UX Design Expert) — última intervenção da sessão A
**DATA:** 20/04/2026 02:05
**ESTADO:** `pending` (aguarda activação no terminal novo)
**CONSUMIDO:** `false`
**HANDOFFS RELACIONADOS:**
- `RETOMA-20260420-auditoria-real-bot-moreira.md` (v1, complementar)
- `RETOMA-20260420-auditoria-profunda-v2.md` (v2, fonte da verdade técnica)
- `RETOMA-20260419-validacao-projecto-moreira.md` (alucinação — NÃO USAR)

---

*Esta retoma é o ponto de entrada para qualquer agente AIOX que abra terminal novo neste projecto. Tem tudo: contexto, ficheiros, decisões pendentes, comandos exactos, regras, próxima acção. O Eurico decide a direcção (D1–D5), o agente executa. Zero re-explicação necessária.*
