# RETOMA-TESTE-FASE2 — FitCoach AI (Teste End-to-End + Hotfix)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 15/04/2026 ~02:30 PT
**Sessão:** @ux-design-expert (Uma) → @devops (Gage) + Eurico
**Motivo do handoff:** Contexto no limite — migração para terminal novo
**Sessão anterior:** ver `docs/RETOMA-COMPLETO.md` (14/04/2026)
**Log de teste detalhado:** ver `docs/TESTE-LOG-20260415.md` (lê SEMPRE antes de continuar)

---

## 1. TL;DR — O que está a acontecer

Estamos a **validar end-to-end o FitCoach AI** antes de mostrar ao cliente Telmo.

Metodologia: **incremental, 1 passo de cada vez**. Eurico clica → screenshot → Uma/Gage arquivam em `TESTE-LOG-20260415.md` → próximo passo.

Durante o teste descobrimos **6 bugs** (B1-B6). Um deles (B6 — spinner eterno ao voltar à aba) era crítico e foi **corrigido no commit `e163213`** (pushed 15/04 ~02:20 PT). Está a aguardar confirmação de que o fix resolveu o problema em produção (Vercel redeploy).

Ponto actual: **retomar teste após redeploy confirmar fix**. Se funcionar, continuar validação de "Gerar Novo Plano", "Ver Exercícios", "Plano", "Progresso", "Perfil".

---

## 2. Estado exacto do código

### 2.1 Git

```
Repo:    github.com/DaSilvaAlves/fitcoach-ai (privado)
Branch:  main
Local:   C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\telmo\03-codigo
```

**Últimos commits (mais recente em cima):**

| SHA | Mensagem | Quando |
|-----|----------|--------|
| `e163213` | `fix(auth): stop refetching profile on TOKEN_REFRESHED — kills tab-switch spinner hang` | 15/04 ~02:20 |
| `2f76b3e` | `docs: add RETOMA-COMPLETO handoff for terminal migration` | 14/04 |
| `ee78810` | `fix(routing): redirect to /onboarding when profile is empty` | 14/04 |
| `c9aeb38` | `fix: replace offline ExerciseDB API + onboarding error visibility` | 14/04 |
| `effa2ca` | `chore(dev): use port 5200 for vite dev/preview` | 14/04 |
| `5d9b1fc` | `feat(auth): switch from Google OAuth to email magic link` | 14/04 |
| `052b194` | `feat: initial production-ready FitCoach AI` | 14/04 |

Working tree: limpo. `origin/main..HEAD` = 0 (sincronizado).

### 2.2 Ficheiros modificados no último commit (`e163213`)

- `src/hooks/useAuth.tsx` — `onAuthStateChange` filtra eventos (só refetch em `SIGNED_IN` / `SIGNED_OUT` / `INITIAL_SESSION`)
- `src/hooks/useWorkout.ts` — `useEffect` depende de `user?.id` (não `user`)
- `src/hooks/useProgress.ts` — `useEffect` depende de `user?.id` (não `user`)
- `docs/TESTE-LOG-20260415.md` — log incremental de todos os passos

### 2.3 Deploy Vercel

| Parâmetro | Valor |
|-----------|-------|
| URL production | `https://fitcoach-ai-lake.vercel.app` |
| Dashboard | `https://vercel.com/euricojsalves-4744s-projects/fitcoach-ai` |
| Plano | Hobby (free) |
| Auto-deploy | ✅ push para `main` → redeploy automático |
| Último deployment esperado | `e163213` (verificar se já está verde) |

---

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `membros/telmo/handoffs/RETOMA-TESTE-FASE2.md`. ESTÁ NO SÍTIO CORRECTO (pasta canónica do membro Telmo). CONSULTAR `.claude/rules/handoff-location.md` antes de o mover.

---

## 3. Bugs identificados — Tabela completa

| # | Bug | Severidade | Estado | Detalhe |
|---|-----|-----------|--------|---------|
| **B1** | URL ganha `#error=access_denied&error_code=otp_expired` após navegação no dashboard | 🔴 Alta | **Não fixado** | Hash residual do magic link aparece em `/dashboard`. Aparentemente o plano novo GERA (código funciona), mas hash feio e pode causar confusão. Por investigar: porque o hash persiste/reaparece. |
| **B2** | GIFs wger.de não carregam (~2/20 visíveis na página Exercícios) | 🟠 Média | **Não fixado** | Rate limit ou URLs mortos do `wger.de`. Fix: substituir por placeholder local ou trocar fonte. |
| **B3** | 3 cards features na landing com `cursor-pointer` mas sem `onClick` | 🟡 Baixa | **Não fixado** | Root cause: `Card.tsx:26` aplica `cursor-pointer` quando `hover={true}`. LandingPage usa `<Card hover>` sem onClick. Fix: ou (a) tornar os cards clicáveis (→ `/login`) ou (b) remover `hover` deles. |
| **B4** | ~~Botões CTA landing não respondem~~ | ❌ | **Descartado** | Eurico confirmou: os 4 CTAs funcionam. Só os cards de B3 é que não. |
| **B5** | Email Supabase em inglês ("Confirm your signup") | 🟠 Média | **Não fixado** | Template default Supabase. Fix: customizar em Supabase Dashboard → Authentication → Email Templates (traduzir para PT-PT + tom FitCoach). |
| **B6** | Auth flow silent-fails em Chrome anónima (Bounce Tracking Mitigations) | 🔴 Alta (contornável) | **Não fixável no nosso código** — limitação Chrome | Aba anónima com bounce protection bloqueia state Supabase. Decisão: **continuar teste em Chrome normal**. Avisar Telmo para usar browser normal. |
| **B6-code** | Spinner eterno no dashboard ao voltar de outra aba | 🔴 Crítico | **FIXADO no `e163213`** — aguarda validação pós-redeploy | Root cause: `onAuthStateChange` fazia refetch com nova referência `user` em TOKEN_REFRESHED → hooks re-fetching → hang. Fix: filtrar eventos + usar `user?.id` como dep. |

---

## 4. Metodologia de teste (INEGOCIÁVEL — manter)

| Regra | Porquê |
|-------|--------|
| 1 passo de cada vez | Muita informação junta gera confusão para Eurico e agente |
| Eurico faz click → envia screenshot → agente arquiva → pede próximo passo | Rastreável |
| Arquivar TUDO em `TESTE-LOG-20260415.md` | Fonte de verdade do teste |
| Só avançar quando passo anterior confirmado | Zero suposições |
| Se aparece bug, decidir: fix agora ou registar para fix em lote | Minimizar ciclos de deploy |

---

## 5. Configuração actual do teste

| Variável | Valor |
|----------|-------|
| Browser | **Chrome normal** (NÃO anónima — B6 confirmou que anónima bloqueia Supabase) |
| Sessão activa | `euricojsalves@gmail.com` (criada 14/04, restaurada automaticamente ao abrir Chrome normal) |
| Profile state | Onboarding completo (nome "Eurico", peso 70, idade não verificada, equipamento/objectivo definidos) |
| Plano de treino | "Pernas e Glúteos" — 6 exercícios (Bodyweight Squat, Bulgarian Split Squat, Walking Lunge, Single Leg Glute Bridge, Calf Raise, Wall Sit) |
| Registo peso | 1 entrada em 14/04/2026 (70kg) |

**Alias `+fitcoach1@gmail.com`:** foi tentado em Chrome anónima mas B6 bloqueou. Não foi concluído. Deixar para outra fase se quisermos testar onboarding 100% limpo.

---

## 6. O que já foi testado nesta sessão — 15/04/2026

| # | Passo | Estado | Notas |
|---|-------|--------|-------|
| 1 | Abrir landing em Chrome anónima | ✅ Renderiza | Detectou B3 (cards sem onClick) |
| 2 | Clicar "Enviar link" → email chega ao alias `+fitcoach1` | ✅ | Detectou B5 (email em inglês) |
| 3 | Clicar link email → /onboarding → preencher 6 passos | ✅ | Fix `ee78810` funciona (routing) |
| 4 | Clicar "Começar" no passo 6 (Chrome anónima) | ❌ **Silent fail** | Detectou B6 (bounce tracking Chrome anónima) |
| 5 | Mudar para Chrome normal → sessão de 14/04 restaurada | ✅ | Dashboard apareceu directo |
| 6 | Confirmar comportamento de "loading ao voltar da aba" | 🔴 Reproduzido | Levou a aplicar fix `e163213` |
| 7 | Push `e163213` para origin/main | ✅ | Aguardando redeploy Vercel |

---

## 7. O que FALTA testar (por ordem)

### Passo imediato (a fazer no novo terminal)

**Validar fix do B6-code:**

1. Confirmar que deploy `e163213` está verde no Vercel dashboard
2. Abrir https://fitcoach-ai-lake.vercel.app/dashboard em Chrome normal
3. **Hard refresh** (Ctrl+Shift+R) para garantir bundle novo
4. Mudar de aba ~30 segundos → voltar à aba FitCoach
5. **Esperado:** dashboard aparece instantâneo, sem spinner eterno
6. Se funcionar ✅: marcar B6-code como PASSED no log e avançar
7. Se falhar 🔴: reabrir investigação, pode haver outro hook com mesmo padrão

### Passos seguintes (após B6-code validado)

| Ordem | Teste | O que verificar |
|-------|-------|-----------------|
| 8 | Limpar hash URL (remover tudo após `#`) | Ver se hash do B1 volta a aparecer |
| 9 | Clicar "Gerar Novo Plano" | Plano gerado? Hash `otp_expired` aparece? |
| 10 | Clicar "Ver Exercícios" | Quantos GIFs carregam vs partidos? (B2) |
| 11 | Clicar "Plano" na nav | Workout page renderiza? Dias expansíveis? |
| 12 | Clicar "Progresso" na nav | Gráfico aparece? |
| 13 | Registar novo peso | Supabase persiste? Gráfico actualiza? |
| 14 | Clicar "Perfil" na nav | Dados do onboarding mostrados? |
| 15 | Testar "Sair" | Logout limpo → volta a /landing? |
| 16 | Voltar a /login → outra sessão | Magic link funciona 2ª vez? |

### Fixes pendentes para lote final (depois de todos os testes)

1. **B1** — hash `otp_expired` residual (hotfix no Dashboard: limpar `window.location.hash` no mount)
2. **B2** — placeholder local para GIFs que falham (adicionar `onError` em `<img>`)
3. **B3** — tornar cards clicáveis ou remover `hover` prop
4. **B5** — customizar templates Supabase para PT-PT

---

## 8. Como retomar — Passo a passo para o novo terminal

### 8.1 Activar agente

```
/aiox-devops
```

Se a tarefa incluir aplicar mais fixes de código, o @devops pode delegar a @dev ou aplicar directamente como hotfix (Eurico autoriza).

Alternativa: `/aiox-ux-design-expert` se for mais trabalho de UX/validação (sem código).

### 8.2 Ler nesta ordem (obrigatório)

1. `.claude/rules/handoff-location.md` (localização de handoffs)
2. `membros/telmo/handoffs/RETOMA-TESTE-FASE2.md` (este ficheiro)
3. `membros/telmo/handoffs/TESTE-LOG-20260415.md` (log detalhado — fonte de verdade do teste)
4. `membros/telmo/handoffs/RETOMA-COMPLETO.md` (contexto original, se precisar)

### 8.3 Primeiro comando a executar

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\telmo\03-codigo"
git log --oneline -3
git status --short
```

**Esperado:**
- Último commit: `e163213 fix(auth): stop refetching profile on TOKEN_REFRESHED ...`
- Working tree: limpo
- 0 commits pendentes vs `origin/main`

### 8.4 Primeira pergunta ao Eurico

> "O deploy Vercel do `e163213` já está verde? Fizeste hard refresh? O spinner eterno ao voltar à aba sumiu?"

- **Se sim** → avançar para passo 8 (limpar hash + continuar teste)
- **Se não** → perguntar onde falhou + screenshot + reinvestigar

### 8.5 Manter metodologia

- 1 passo de cada vez
- Screenshots obrigatórios
- Arquivar no `TESTE-LOG-20260415.md` (não criar novo ficheiro de log a menos que o dia mude para 16/04)
- Commit + push só quando houver fixes agrupados (não commit por commit)

---

## 9. Comandos úteis de emergência

### Ver logs Vercel em tempo real

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\telmo\03-codigo"
npx vercel logs https://fitcoach-ai-lake.vercel.app --follow
```

### Forçar redeploy sem cache

Dashboard Vercel → Deployments → ⋮ → Redeploy → UNCHECK "Use existing Build Cache"

### Rollback rápido (se `e163213` causar regressão inesperada)

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\membros\telmo\03-codigo"
# CONFIRMAR COM EURICO ANTES:
git revert e163213
git push origin main
```

### Ver sessão actual no browser (F12 Console)

```js
// Mostra sessão Supabase
const { data: { session } } = await window.supabase?.auth?.getSession() ?? { data: { session: null } }
console.log('Session:', session)

// Limpar sessão (logout forçado)
await window.supabase?.auth?.signOut()
```

---

## 10. Credenciais e contas (lembretes)

| Serviço | Conta | Nota |
|---------|-------|------|
| Supabase | `euricoalvesia@gmail.com` | Projecto `fitcoach-ai` ref `gitcblghucmpzizpxxki` |
| Anthropic | `euricojsalves@gmail.com` | ~5€ crédito (gasto ~0,01€/plano) |
| Vercel | GitHub OAuth (`DaSilvaAlves`) | Plano Hobby |
| GitHub | `DaSilvaAlves` | Owner do repo `fitcoach-ai` |
| Email Supabase | `noreply@mail.app.supabase.io` | Chega à inbox `euricojsalves@gmail.com` |

`.env` local está gitignored — NÃO commitar. Contém chaves reais.

---

## 11. Contexto importante sobre o cliente

Telmo Cerveira (+351 918 700 778, trcerveira@gmail.com) é **CLIENTE PAGO** do Eurico, não teste pedagógico. Por isso o ritmo é "entregar o mais rápido possível". Quality matters mas o scope é "mostrar funcionando", não produção plena (Stripe ainda saltado).

Antes de entregar:
- [ ] B1 e B2 fixados (UX limpa)
- [ ] B3 decidido (clicável ou não)
- [ ] B5 template em PT (cosmético mas nota-se)
- [ ] Screencast ou video a mostrar o fluxo
- [ ] Decidir ownership: Telmo fica com repo/contas ou só acesso?

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** FitCoach AI (cliente Telmo) — teste end-to-end fase 2
- **LOCALIZAÇÃO CORRECTA:** `membros/telmo/handoffs/RETOMA-TESTE-FASE2.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/telmo/handoffs/RETOMA-TESTE-FASE2.md`
- **COINCIDEM?** `SIM` ✅

**AGENTE RESPONSÁVEL:** @devops (Gage), com trabalho herdado de @ux-design-expert (Uma)
**DATA:** 15/04/2026 ~02:30 PT

---

*Fim do handoff de migração. Lê `TESTE-LOG-20260415.md` antes de perguntar qualquer coisa ao Eurico. Bom trabalho ao próximo terminal. — Gage 🚀*
