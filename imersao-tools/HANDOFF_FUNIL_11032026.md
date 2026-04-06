# HANDOFF — Funil IA Avançada PT
**Data:** 11/03/2026 | **Sessão:** Sequência de Emails de Nurture
**Para continuar:** "Lê o HANDOFF_FUNIL_11032026 e continua o funil"

---

## O QUE FOI FEITO NESTA SESSÃO ✅

| Item | Detalhe |
|------|---------|
| Sequência de 5 emails de nurture | Criada completa e pronta para o MailerLite |
| Email 3 corrigido | Substituído case study fictício (Túlio) por ângulo real: custo de equipa IA vs €188 |
| Ficheiro guardado | `C:/Users/XPS/Documents/imersao-tools/EMAIL-NURTURE-SEQUENCE.md` |

---

## ESTADO DO FUNIL

```
TRÁFEGO (Instagram/@iaavancadapt + boca-a-boca)
    ↓
[ia-avancada-pt.vercel.app] — Landing de vendas ✅ PUBLICADA
    ↓
[Formulário MailerLite — Form ID: 0OJPl8] ✅ ACTIVO
    ↓
[Email 1: Entrega do Guia PDF] ✅ ACTIVO (1 completed)
    ↓
[Email 2 Dia 2: O choque — dados reais] ← A IMPLEMENTAR
    ↓
[Email 3 Dia 4: Custo equipa IA vs €188] ← A IMPLEMENTAR
    ↓
[Email 4 Dia 6: Tour da comunidade] ← A IMPLEMENTAR
    ↓
[Email 5 Dia 7: Destruir objecções] ← A IMPLEMENTAR
    ↓
[Email 6 Dia 8: Urgência €188 → €288] ← A IMPLEMENTAR
    ↓
[Hotmart Checkout €188] ← NÃO EXISTE AINDA
    ↓
[comunidade-ia-pt.vercel.app/login] ← NÃO TEM PÁGINA PÚBLICA
    ↓
[Dashboard de membro]
```

**Funil health estimado:** 58/100

---

## PRÓXIMOS PASSOS (por ordem de prioridade)

### 1. IMPLEMENTAR EMAILS NO MAILERLITE (30 min)
**Ficheiro:** `EMAIL-NURTURE-SEQUENCE.md`

Como fazer:
- Automações → "Entrega Guia Nível 4" → Edit → Pause
- Clicar "+" após Email 1 → Add delay (2 days) → Add email (Email 2)
- Repetir para Emails 3, 4, 5, 6 com os delays correctos

Antes de activar:
- [ ] Substituir [DATA] no Email 6 pela data real da próxima imersão
- [ ] Substituir [LINK DA LANDING PAGE] nos Emails 4 e 5
- [ ] Verificar Email 1 — remover "Start writing your text" se ainda existir
- [ ] Testar sequência com email próprio

### 2. CHECKOUT NO HOTMART (próxima sessão)
- Criar produto "Membro Fundador €188" no Hotmart
- Substituir botão `mailto:` na landing page pelo link de checkout
- Configurar email de boas-vindas pós-compra com link da comunidade
- Preço: €188 (membro fundador) | €288 (preço normal)

### 3. PÁGINA PÚBLICA DA COMUNIDADE
- `comunidade-ia-pt.vercel.app` devolve 401 — sem página pública
- Criar landing page da comunidade com:
  - Proposta de valor
  - Formulário de captação (mesmo MailerLite)
  - CTA para checkout Hotmart
- Criar página de login branded (dark/neon)

---

## CONTEÚDO DOS 5 EMAILS (resumo)

| Email | Dia | Assunto |
|-------|-----|---------|
| Email 2 | 2 | "Enquanto lias o guia, 1.000 pessoas perderam o emprego para a IA" |
| Email 3 | 4 | "Quanto custa contratar uma equipa de IA? (Os números vão surpreender-te)" |
| Email 4 | 6 | "O que ninguém em Portugal está a fazer (e nós fazemos)" |
| Email 5 | 7 | "Não tenho tempo / É caro / Não percebo de tecnologia — a minha resposta honesta" |
| Email 6 | 8 | "Fecha hoje a €188. A partir de amanhã é €288." |

**Corpo completo:** `EMAIL-NURTURE-SEQUENCE.md`

---

## CONTAS E ACESSOS

| Serviço | Login | Notas |
|---------|-------|-------|
| MailerLite | euricojsalves@gmail.com | Plan Free, conta: 751420 |
| Vercel | euricojsalves-4744 | `vercel --prod` para publicar |
| Landing page source | `C:/Users/XPS/Documents/imersao-tools/landing-page/index.html` | |
| Comunidade source | `C:/Users/XPS/Documents/imersao-tools/comunidade/` | Git repo activo |
| WhatsApp Eurico | +351 932 066 328 | Canal de conversão manual |
| Instagram | @iaavancadapt | Tráfego principal |

---

## PROBLEMAS CONHECIDOS

1. **Email cai em Promoções** — remetente @gmail.com sem domínio próprio. Solução futura: `iaavancada.pt` + DKIM/SPF
2. **Hotmart não existe ainda** — botão de compra é mailto: (manual, sem tracking)
3. **Comunidade sem página pública** — `comunidade-ia-pt.vercel.app` retorna 401
4. **git repo** — apenas `comunidade/` tem git. `imersao-tools/` não tem repositório.

---

## PREFERÊNCIAS DO EURICO (SEMPRE SEGUIR)

- Língua: PT-PT Portugal (nunca brasileiro, nunca inglês nas respostas)
- Preços: terminam sempre em 8 (€188, €288, €888...)
- Design: dark mode, neon, cyan/magenta/gold
- Nunca mencionar "Lovable" ou "AI Studio"
- Nunca inventar histórias ou casos de estudo fictícios — usar dados reais
- WhatsApp: +351 932 066 328
- Instagram: @iaavancadapt
- Email: euricojsalves@gmail.com

---

## FICHEIROS IMPORTANTES

| Ficheiro | Path |
|---------|------|
| Emails de nurture | `C:/Users/XPS/Documents/imersao-tools/EMAIL-NURTURE-SEQUENCE.md` |
| Landing page HTML | `C:/Users/XPS/Documents/imersao-tools/landing-page/index.html` |
| Comunidade (código) | `C:/Users/XPS/Documents/imersao-tools/comunidade/` |
| PDF isca | `C:/Users/XPS/Desktop/_PDFs/NIVEL4-FERRAMENTAS-IA-2026-v2.pdf` |
| HANDOFF anterior | `C:/Users/XPS/Documents/imersao-tools/HANDOFF_FUNIL_10032026.md` |
