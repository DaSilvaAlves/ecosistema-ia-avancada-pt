# HANDOFF — Funil IA Avançada PT
**Data:** 10/03/2026 | **Sessão:** Construção do Funil de Vendas
**Para continuar:** "Lê o HANDOFF_FUNIL_10032026 e continua o funil"

---

## ESTADO ACTUAL DO FUNIL

### O que está FEITO ✅
| Item | Detalhe |
|------|---------|
| PDF Isca Digital | `C:/Users/XPS/Desktop/_PDFs/NIVEL4-FERRAMENTAS-IA-2026-v2.pdf` |
| Email corrigido no PDF | `euricojsalves@gmail.com` (substituiu `info@iaavancadapt.pt`) |
| Formulário MailerLite | Embed na landing page — Form ID: `0OJPl8` |
| Automação activa | "Entrega Guia Nível 4" — Active, Completed: 1 |
| PDF no MailerLite | `https://storage.googleapis.com/mailerlite-uploads-prod/751420/fc7gomaveiqiT0DUL06mHKMEFjQHagEuQenGDij4.pdf` |
| Landing page publicada | `https://ia-avancada-pt.vercel.app` |
| Testemunho corrigido | "Rúben Silva" → "R. Corvo" |
| Formulário posicionado | Entre testemunhos e preços (posição estratégica) |

### Métricas actuais
- Funil health: **42/100** → estimativa actual com formulário: **55/100**
- Conversão visitante → lead: ~0% antes → activo agora
- Automação: 1 completed, 0 queued, Click rate 0% (link não funcionou no 1º teste)
- Email vai para **aba Promoções** do Gmail (problema de domínio gratuito)

### Problemas conhecidos
1. **Email cai em Promoções** — causa: remetente @gmail.com sem domínio próprio. Solução futura: domínio `iaavancada.pt` + DKIM/SPF
2. **"Start writing your text"** ficou no email — confirmar se foi removido na edição
3. **Contexto do formulário** — título "Recebe o Guia Grátis — Nível 4" pouco visível (CSS aplicado mas validar)

---

## CONTAS E ACESSOS

| Serviço | Login | Notas |
|---------|-------|-------|
| MailerLite | euricojsalves@gmail.com | Plan Free, conta: 751420 |
| Vercel | euricojsalves-4744 | `vercel --prod` para publicar |
| Landing page source | `C:/Users/XPS/Documents/imersao-tools/landing-page/index.html` | |
| WhatsApp Eurico | +351 932 066 328 | Canal de conversão manual |

---

## PRÓXIMOS PASSOS DO FUNIL (por ordem de prioridade)

### FASE 2 — Nurture (Esta semana)
**Objectivo:** Transformar leads em compradores ao longo de 8 dias

Criar sequência de 5 emails no MailerLite (Automações → adicionar após Email 1):

| Email | Dia | Assunto | Conteúdo |
|-------|-----|---------|----------|
| Email 2 | Dia 2 | "Como o Túlio [restauração] automatizou 3h/dia" | Case study real + identificação com a dor |
| Email 3 | Dia 4 | "O que acontece dentro da IA Avançada PT" | Tour da comunidade, imersões 48h, AIOX |
| Email 4 | Dia 6 | "As 4 razões pelas quais as pessoas não entram" | Destruir objeções directamente |
| Email 5 | Dia 8 | "Última oportunidade a €188 — próxima imersão [data]" | Urgência real + CTA directo |

**Como fazer no MailerLite:**
Automações → Entrega Guia Nível 4 → Edit → Pause → clicar no "+" após Email 1 → Add delay (2 days) → Add email → repeat

### FASE 3 — Checkout Automatizado (Este mês)
**Problema actual:** Compra é feita via mailto (manual, sem tracking)
**Solução:** Hotmart ou Lemon Squeezy
- Criar produto "Membro Fundador €188"
- Substituir botão `mailto:` pelo link de checkout
- Configurar email de boas-vindas pós-compra com link da comunidade

### FASE 4 — Comunidade como Produto de Entrada (PRIORITÁRIO)

#### Situação actual da comunidade
- URL: `https://comunidade-ia-pt.vercel.app/` (retorna 401 — área protegida)
- Não tem página pública de landing/captação
- Não tem página de login própria
- Não capta emails de visitantes

#### O que precisa ser construído
```
[Página Pública da Comunidade]
  ↓ (captação de leads)
[Formulário email → MailerLite]
  ↓ (compra)
[Checkout €188 → Hotmart]
  ↓ (acesso)
[Página de Login → comunidade privada]
  ↓
[Dashboard de membro]
```

#### Tarefas específicas
1. **Landing page da comunidade** — criar página pública em `comunidade-ia-pt.vercel.app` com:
   - Proposta de valor da comunidade
   - Formulário de captação (mesmo MailerLite account)
   - CTA para compra

2. **Página de login** — actualmente o acesso é directo ao dashboard sem página de login própria. Criar página de login branded com o design dark/neon

3. **Funil de entrada da comunidade** — a comunidade deve SER o produto de entrada:
   - Visitante → recebe Guia Grátis (isca) → sequência email → compra €188 → acessa comunidade
   - O funil já construído na landing page principal aponta para este fluxo

4. **Integrar os dois sites** — landing page principal e comunidade devem estar alinhados:
   - `ia-avancada-pt.vercel.app` = marketing/vendas
   - `comunidade-ia-pt.vercel.app` = produto (área de membros)

---

## ARQUITECTURA DO FUNIL COMPLETO (visão final)

```
TRÁFEGO (Instagram/@iaavancadapt + boca-a-boca)
    ↓
[ia-avancada-pt.vercel.app] — Landing de vendas
    ↓ (scroll até formulário)
[Formulário MailerLite] — captura email
    ↓ (automação imediata)
[Email 1: Entrega do Guia PDF]
    ↓ (dia 2)
[Email 2: Case study Túlio]
    ↓ (dia 4)
[Email 3: Tour da comunidade]
    ↓ (dia 6)
[Email 4: Destruir objeções]
    ↓ (dia 8)
[Email 5: Urgência + CTA €188]
    ↓ (compra)
[Hotmart Checkout €188]
    ↓ (confirmação)
[comunidade-ia-pt.vercel.app/login]
    ↓
[Dashboard de membro]
    ↓ (upsell)
[Corporate — proposta personalizada]
```

---

## FICHEIROS IMPORTANTES

| Ficheiro | Path |
|---------|------|
| Landing page HTML | `C:/Users/XPS/Documents/imersao-tools/landing-page/index.html` |
| PDF isca (editado) | `C:/Users/XPS/Desktop/_PDFs/NIVEL4-FERRAMENTAS-IA-2026-v2.pdf` |
| PDF isca (original) | `C:/Users/XPS/Desktop/_PDFs/NIVEL4-FERRAMENTAS-IA-2026-ORIGINAL.pdf` |
| Análise do funil | `C:/Users/XPS/Documents/imersao-tools/FUNNEL-ANALYSIS.md` |
| HANDOFF anterior | `C:/Users/XPS/Documents/imersao-tools/HANDOFF_08032026.md` |

---

## PREFERÊNCIAS DO EURICO (SEMPRE SEGUIR)
- Língua: PT-PT (nunca brasileiro)
- Preços: terminam sempre em 8
- Design: dark mode, neon, cyan/magenta/gold
- Nunca mencionar Lovable ou AI Studio
- WhatsApp: +351 932 066 328
- Instagram: @iaavancadapt
- Email: euricojsalves@gmail.com

---

## PRÓXIMA SESSÃO — COMEÇAR POR

1. Verificar se o email de entrega está correcto (sem "Start writing your text")
2. Criar sequência de 5 emails de nurture no MailerLite
3. Planear a página pública da comunidade + página de login
4. Integrar checkout (Hotmart)
