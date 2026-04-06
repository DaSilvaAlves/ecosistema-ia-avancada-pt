# HANDOFF — Funil IA Avançada PT
**Data:** 11/03/2026 — 01:41 | **Sessão:** Lista de Espera + Student Profiler
**Para continuar:** "Lê o HANDOFF_FUNIL_11032026_v2 e continua o funil"
**Skill a activar:** `/market-funnel` (Copy Chief autónomo — responsável por esta tarefa)

---

## ESTADO DO FUNIL COMPLETO

```
TRÁFEGO (Instagram/@iaavancadapt + boca-a-boda)
    ↓
[ia-avancada-pt.vercel.app] ✅ ONLINE
    ↓
[Secção #lista-espera] ✅ ONLINE — form MailerLite Ivd4JK
    ↓
[Form "Lista de Espera" MailerLite] ✅ ACTIVO — grupo "Lista de Espera" (1 subscriber teste)
    ↓
[Email 1: Entrega do Guia PDF] ✅ ACTIVO
    ↓
[Email 2 Dia 2: O Choque] ✅ CRIADO NO MAILERLITE
    ↓
[Email 3 Dia 4] ← A IMPLEMENTAR NO MAILERLITE
    ↓
[Email 4 Dia 6] ← A IMPLEMENTAR NO MAILERLITE
    ↓
[Email 5 Dia 7] ← A IMPLEMENTAR NO MAILERLITE
    ↓
[Email 6 Dia 8] ← A IMPLEMENTAR NO MAILERLITE
    ↓
[student-profiler-one.vercel.app] ✅ ONLINE — diagnóstico de perfil IA
    ↓
[Hotmart Checkout €188] ← NÃO EXISTE AINDA
    ↓
[comunidade-ia-pt.vercel.app] ← SEM PÁGINA PÚBLICA
```

**Funil health estimado:** 72/100

---

## O QUE FOI FEITO NESTA SESSÃO ✅

| Item | Detalhe |
|------|---------|
| Secção "Lista de Espera" | Adicionada à landing page com form MailerLite (Ivd4JK) |
| Botões da landing | Alterados de mailto: para #lista-espera |
| Email 2 | Implementado no MailerLite (delay 2 dias + corpo completo) |
| Student Profiler | Redesenhado — welcome screen, 10 perguntas ajustadas, resultado personalizado por arquétipo, CTA para #lista-espera |
| Supabase | Tabela `profiles` criada, ligação activa, dados reais a funcionar |
| Deploy | `student-profiler-one.vercel.app` online e funcional |
| Commits | Push para GitHub — `DaSilvaAlves/student-profiler` |
| Emails 4 e 6 | Links preenchidos (ia-avancada-pt.vercel.app) |
| Email 6 | Adaptado para lista de espera (sem data necessária) |

---

## PRÓXIMOS PASSOS (por ordem de prioridade)

### 1. IMPLEMENTAR EMAILS 3, 4, 5, 6 NO MAILERLITE ← PRÓXIMO PASSO IMEDIATO

**Onde:** MailerLite → Automations → Entrega Guia Nível 4 → Edit

**Estado actual do fluxo:**
- Email 1 (Dia 0) ✅ Activo
- Delay 2 dias ✅
- Email 2 (Dia 2) ✅ "O Choque"
- ← continuar a partir daqui

**Para cada email:**
1. Clicar "+" abaixo do email anterior
2. Add Delay (com os dias correctos)
3. Add Send Email → preencher assunto + preheader + corpo
4. Guardar

**Delays correctos:**
| Email | Delay a adicionar |
|-------|------------------|
| Email 3 | 2 dias após Email 2 |
| Email 4 | 2 dias após Email 3 |
| Email 5 | 1 dia após Email 4 |
| Email 6 | 1 dia após Email 5 |

**Conteúdo completo:** `C:/Users/XPS/Documents/imersao-tools/EMAIL-NURTURE-SEQUENCE.md`

**Antes de activar:**
- [ ] Verificar Email 1 — remover "Start writing your text" se ainda existir
- [ ] Testar sequência completa com email próprio
- [ ] Clicar "Activate" na automação

### 2. HOTMART — CHECKOUT €188

- Criar produto "Membro Fundador — IA Avançada PT" no Hotmart
- Preço: €188 (membro fundador) | €288 (preço normal futuro)
- Substituir botão CTA da landing (`#lista-espera`) pelo link do checkout quando existir
- Configurar email de boas-vindas pós-compra com link da comunidade

### 3. INTEGRAR PROFILER NO FUNIL DE EMAILS

- Adicionar link do profiler no Email 2 ou 3:
  > "Faz o diagnóstico em 2 minutos — descobre o teu perfil IA: student-profiler-one.vercel.app"
- O profiler já redireciona para #lista-espera no ecrã final

### 4. PÁGINA PÚBLICA DA COMUNIDADE

- `comunidade-ia-pt.vercel.app` retorna 401 — sem página pública
- Criar landing page da comunidade (dark/neon, dark mode)
- Source: `C:/Users/XPS/Documents/imersao-tools/comunidade/`

---

## CONTEÚDO DOS EMAILS (resumo para implementação)

| Email | Dia | Assunto | Preheader |
|-------|-----|---------|-----------|
| Email 3 | Dia 4 | "Quanto custa contratar uma equipa de IA? (Os números vão surpreender-te)" | "E quanto te custa aprender a construir essa equipa tu próprio." |
| Email 4 | Dia 6 | "O que ninguém em Portugal está a fazer (e nós fazemos)" | "Não é um curso. Não é um grupo de Facebook. É outra coisa completamente diferente." |
| Email 5 | Dia 7 | '"Não tenho tempo." "É caro." "Não percebo de tecnologia." — A minha resposta honesta.' | "Vou responder a cada objecção sem filtros." |
| Email 6 | Dia 8 | "A lista de espera fecha em breve. Garante o teu €188 agora." | "Quando a data for anunciada, o preço de fundador já está garantido — ou não." |

**Corpo completo de cada email:** `C:/Users/XPS/Documents/imersao-tools/EMAIL-NURTURE-SEQUENCE.md`

---

## FICHEIROS E URLs IMPORTANTES

| Item | Path / URL |
|------|-----------|
| Landing page HTML | `C:/Users/XPS/Documents/imersao-tools/landing-page/index.html` |
| Landing page online | `https://ia-avancada-pt.vercel.app` |
| Student Profiler source | `C:/Users/XPS/Documents/imersao-tools/student-profiler/` |
| Student Profiler online | `https://student-profiler-one.vercel.app` |
| Emails de nurture | `C:/Users/XPS/Documents/imersao-tools/EMAIL-NURTURE-SEQUENCE.md` |
| Comunidade source | `C:/Users/XPS/Documents/imersao-tools/comunidade/` |
| PDF isca | `C:/Users/XPS/Desktop/_PDFs/NIVEL4-FERRAMENTAS-IA-2026-v2.pdf` |
| HANDOFF anterior | `C:/Users/XPS/Documents/imersao-tools/HANDOFF_FUNIL_11032026.md` |

---

## CONTAS E ACESSOS

| Serviço | Login | Notas |
|---------|-------|-------|
| MailerLite | euricojsalves@gmail.com | Plan Free, conta: 751420 |
| Vercel | euricojsalves-4744 | `vercel --prod` para publicar |
| Supabase | euricoalvesia@gmail.com | Projecto: imersao-ia-profiler |
| GitHub repo profiler | DaSilvaAlves/student-profiler | Branch: master |
| WhatsApp Eurico | +351 932 066 328 | Canal de conversão manual |
| Instagram | @iaavancadapt | Tráfego principal |

---

## DETALHES TÉCNICOS

### MailerLite
- Form lead magnet (Guia): `data-form="0OJPl8"`
- Form lista de espera: `data-form="Ivd4JK"`
- Automação activa: "Entrega Guia Nível 4" (PAUSADA para edição — reactivar após emails 3-6)
- Grupo "Lista de Espera": 1 subscriber (teste)
- Grupo "Eurico Alves": 2 subscribers

### Student Profiler
- 10 perguntas de diagnóstico de perfil IA
- Resultado personalizado por arquétipo (Construtor / Estrategista / Especialista / Empreendedor)
- CTA final → `ia-avancada-pt.vercel.app#lista-espera`
- Admin dashboard: `?admin=euricoia`
- Supabase: tabela `profiles` criada, RLS activo, dados reais

### Supabase
- URL: `https://hpqowjelvtejbutyvojo.supabase.co`
- Tabela: `public.profiles` (id, created_at, awareness, market_view, vision, tools_knowledge, orchestration_view, logic, intent, project_type, friction, commitment)

---

## PROBLEMAS CONHECIDOS

1. **Email cai em Promoções** — remetente @gmail.com sem domínio próprio. Solução futura: `iaavancada.pt` + DKIM/SPF
2. **Hotmart não existe** — botão de compra ainda é lista de espera (temporário)
3. **Comunidade sem página pública** — `comunidade-ia-pt.vercel.app` retorna 401
4. **Automação pausada** — reactivar no MailerLite após implementar Emails 3-6

---

## PREFERÊNCIAS DO EURICO (SEMPRE SEGUIR)

- Língua: PT-PT Portugal (nunca brasileiro, nunca inglês nas respostas)
- Preços: terminam sempre em 8 (€188, €288, €888...)
- Design: dark mode, neon, cyan/magenta/gold (landing) | brutalista amarelo neon (profiler)
- Nunca mencionar "Lovable" ou "AI Studio"
- Nunca inventar histórias ou casos de estudo fictícios — usar dados reais
- WhatsApp: +351 932 066 328
- Instagram: @iaavancadapt
