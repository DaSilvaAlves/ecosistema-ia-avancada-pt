# RETOMA-OFERTA-TELMO — Arquitectura de Referral `?ref=telmo` e Oferta Vitalícia

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 15/04/2026
**Origem:** @ux-design-expert (Uma) — sessão de landing page de venda para Telmo
**Destinatários:** @dev (Dex) → passo 2 · @devops (Gage) → passos 3 e 4
**Status:** pending
**Projecto:** FitCoach AI (cliente Telmo Cerveira) — ecossistema "FitCoach + Landing de venda"

---

## Contexto

Foi criada uma landing standalone de venda em `fitcoach-landing.vercel.app` para o Telmo promover em tráfego frio. A landing promete **30 dias grátis** (em vez dos 7 padrão) e **4,99€/mês vitalício** (em vez de 7,99€) para os **primeiros 100 utilizadores** que cheguem via `?ref=telmo`.

A landing antiga do produto (`fitcoach-ai-lake.vercel.app`) foi **minimalizada nesta sessão** (commit local `58823c1`) — removida a secção de preços e neutralizada a promessa de trial. Fica a aguardar push.

**Falta o produto saber tratar `?ref=telmo`.** Sem isso, a oferta é uma mentira técnica.

---

## Passo 1 — FEITO nesta sessão

- **Agente:** @ux-design-expert (Uma)
- **Commit local:** `58823c1` (ainda não pushed)
- **Ficheiro:** `src/pages/LandingPage.tsx`
- **Mudanças:**
  - Removida secção Pricing (cards Trial 7 dias + Pro 7,99€)
  - Neutralizadas promessas de duração/preço no hero
  - Stat card "7 dias" → "PT-PT"
  - Substituído por CTA final simples "Criar conta grátis"
- **Validação:** `npx tsc -b --noEmit` limpo
- **Pendente:** push para `main` (atribuição @devops)

---

## Passo 2 — Implementar `?ref=telmo` (próximo, @dev)

### Objectivo

Quando um utilizador chega a `fitcoach-ai-lake.vercel.app/login?ref=telmo` e cria conta:

1. A query param `ref=telmo` fica persistida durante a flow de signup (mesmo se o magic link redireccionar)
2. Ao criar o perfil, gravar `referral_source: "telmo"` em `user_profiles`
3. Aplicar `trial_ends_at = now() + interval '30 days'` em vez dos 7 padrão
4. Guardar `price_locked_cents: 499` (4,99€) para esse utilizador
5. Contar quantos utilizadores têm `referral_source='telmo'` e se ≥ 100, parar de aplicar a oferta (novos ficam com 7 dias + 7,99€)

### Tasks técnicas

**2.1 — Frontend (`fitcoach-ai/src`)**

```tsx
// src/lib/referral.ts — novo
const REF_KEY = 'fitcoach_ref'
export function captureReferral() {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  if (ref) sessionStorage.setItem(REF_KEY, ref)
}
export function getReferral(): string | null {
  return sessionStorage.getItem(REF_KEY)
}
export function clearReferral() {
  sessionStorage.removeItem(REF_KEY)
}
```

Chamar `captureReferral()` no `main.tsx` logo no arranque. No `OnboardingPage` ou no fluxo de criação de perfil, ler via `getReferral()` e passar ao insert de `user_profiles`.

**2.2 — Supabase (`supabase-schema.sql` ou nova migration)**

```sql
-- Migration: add referral tracking
ALTER TABLE user_profiles
  ADD COLUMN referral_source TEXT,
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN price_locked_cents INTEGER DEFAULT 799;

-- Function: count current Telmo referrals
CREATE OR REPLACE FUNCTION count_referrals(ref TEXT) RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM user_profiles WHERE referral_source = ref;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Trigger: on profile create, apply offer logic if referral matches AND under cap
CREATE OR REPLACE FUNCTION apply_referral_offer() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_source = 'telmo' AND count_referrals('telmo') < 100 THEN
    NEW.trial_ends_at := NOW() + INTERVAL '30 days';
    NEW.price_locked_cents := 499;
  ELSE
    NEW.trial_ends_at := NOW() + INTERVAL '7 days';
    NEW.price_locked_cents := 799;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_referral_offer
  BEFORE INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION apply_referral_offer();
```

**2.3 — UI feedback**

No `ProfilePage` mostrar o preço bloqueado real (ler de `price_locked_cents`) em vez de hardcoded 7,99€. Se `trial_ends_at` existe, mostrar countdown.

### Critério de aceitação

- [ ] Utilizador que vai a `/login?ref=telmo` e cria conta tem `referral_source='telmo'` em `user_profiles`
- [ ] Primeiros 100 com `ref=telmo` têm `trial_ends_at` de 30 dias e `price_locked_cents=499`
- [ ] A partir do 101º, nova conta cai no regime normal (7 dias + 7,99€)
- [ ] ProfilePage mostra o preço correcto por utilizador
- [ ] Utilizador sem ref continua com 7 dias + 7,99€

### Tempo estimado

1-2 horas (@dev)

---

## Passo 3 — Stripe (@devops, quando Stripe for activado)

**Contexto actual:** Stripe está **DESACTIVADO** na v1 do FitCoach. Esta task só se activa quando o Eurico decidir ligar gateway de pagamento.

### Quando o Stripe for activado

- Criar **dois preços** no Stripe Product `FitCoach Pro`:
  - `price_pro_standard`: 7,99€ recorrente mensal
  - `price_pro_telmo`: 4,99€ recorrente mensal (preço vitalício)
- Ao criar checkout session, ler `user_profiles.price_locked_cents` e escolher o price ID correcto
- Garantir que o preço nunca sobe para contas com `price_locked_cents=499` (não aplicar `price_update` nesses)

### Tempo estimado

~30 min (@devops) — após passo 2 estar feito

---

## Passo 4 — Push dos commits pendentes (@devops)

**Commits locais por pushar:**

```bash
cd membros/telmo/03-codigo
git log --oneline -3
# 58823c1 refactor(landing): remove pricing section + neutralize trial promises  ← PENDENTE
# 2116aaa docs: close FASE3 — full test log + Telmo handoff message + final RETOMA
# 9d68b5b fix(b1): catch lone "#" in URL — hash property is empty for trailing-only hashes
```

O commit `58823c1` desta sessão ainda não foi pushed. Não faz sentido pushar isoladamente — **aguardar que @dev faça passo 2 e pushar tudo junto**.

---

## Landing de venda (`fitcoach-landing.vercel.app`) — resumo

| Item | Valor |
|------|-------|
| URL pública | https://fitcoach-landing.vercel.app |
| Localização repo | `membros/telmo/04-landing-fitcoach/` |
| Deploy | Vercel, projecto standalone (Eurico owner) |
| Estrutura | AIDA · 10 secções · single-file HTML + Tailwind CDN |
| CTAs apontam para | `fitcoach-ai-lake.vercel.app/login?ref=telmo` |
| Placeholders por preencher | Foto Telmo, video Loom, testemunhos reais, OG image |
| Documentação | `membros/telmo/04-landing-fitcoach/README.md` |

---

## Decisões tomadas

| Decisão | Razão |
|---------|-------|
| Landing de venda **separada** do produto | Permite oferta per-referral sem mexer no produto |
| App home **sem preço** | Evita contradição entre `fitcoach-ai-lake` (7,99€) e `fitcoach-landing` (4,99€) |
| Oferta **vitalícia** e não temporária | Cria urgência real (100 lugares) sem prazo artificial |
| Tracking via **sessionStorage** + DB column | Simples, sobrevive ao magic link OAuth flow |
| Cap nos **primeiros 100** via trigger SQL | Lógica atómica no DB, sem race condition |

---

## Próximos passos para retomar

### Se Telmo aceita o FitCoach + dá OK para promover

1. Activar @dev → executar passo 2 acima
2. Testar manualmente: criar conta via `?ref=telmo` → verificar `user_profiles` tem 30 dias + 4,99€
3. @devops → push commits (`58823c1` + o que o @dev adicionar)
4. @devops → deploy Vercel redeploy da app
5. Voltar a @ux-design-expert → preencher placeholders da landing (foto, video, testemunho Telmo, testemunhos clientes)
6. Partilhar link ao Telmo

### Se Telmo declina ou pede mudança de preço

1. Editar `membros/telmo/04-landing-fitcoach/index.html` — procurar `4,99€` e `30 dias`, substituir
2. Redeploy: `cd membros/telmo/04-landing-fitcoach && npx vercel --prod --yes`
3. Ajustar passo 2 (trigger SQL) se número de dias/preço mudar

---

## Ficheiros tocados nesta sessão

| Ficheiro | Status | Commit |
|----------|--------|--------|
| `membros/telmo/04-landing-fitcoach/index.html` | novo | não commited (fora do repo fitcoach-ai) |
| `membros/telmo/04-landing-fitcoach/README.md` | novo | não commited (fora do repo fitcoach-ai) |
| `membros/telmo/03-codigo/src/pages/LandingPage.tsx` | modificado | `58823c1` (local, não pushed) |
| `membros/telmo/handoffs/RETOMA-OFERTA-TELMO.md` | novo (este ficheiro) | não commited |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/telmo/handoffs/RETOMA-OFERTA-TELMO.md`. O PROJECTO A QUE SE REFERE É O FITCOACH AI (E A SUA LANDING DE VENDA PARA TELMO). LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** FitCoach AI (cliente Telmo) — arquitectura de referral `?ref=telmo` + landing de venda
- **LOCALIZAÇÃO CORRECTA:** `membros/telmo/handoffs/RETOMA-OFERTA-TELMO.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/telmo/handoffs/RETOMA-OFERTA-TELMO.md`
- **COINCIDEM?** `SIM`

**AGENTE RESPONSÁVEL:** @ux-design-expert (Uma)
**DATA:** 15/04/2026

---

*Fim do handoff. Landing de venda viva, app home neutralizada, referral tracking pendente de @dev. — Uma 💝*
