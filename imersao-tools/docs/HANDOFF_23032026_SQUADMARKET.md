# HANDOFF — SquadMarket 23/03/2026

**Sessão:** Implementação completa do SquadMarket MVP
**Duração:** ~3 horas
**Agentes activos:** Quinn (QA) → Dara (Data Engineer) → Dex (Dev)
**Branch:** `main`
**Último commit:** `108ff013c` (parent) / `7e1c0e8` (comunidade)

---

## 1. Estado actual — O que está FEITO

### Frontend (100%)

| Página | URL | Estado |
|--------|-----|--------|
| `squads.html` | Catálogo com filtros, pesquisa, ordenação | LIVE |
| `squad-detalhe.html` | Detalhe completo, reviews, download | LIVE |
| `squad-sucesso.html` | Página pós-compra com XP | LIVE |
| `meus-squads.html` | Biblioteca pessoal do membro | LIVE |
| `guia-squads.html` | Guia de instalação passo-a-passo | LIVE |

**Navegação:**
- Dashboard navbar → botão "Squads" com destaque cyan
- Marketplace navbar → badge "COMO INSTALAR" + "A minha biblioteca"
- Sidebar do dashboard → secção MARKETPLACE com "Squads" (NOVO) + "A minha Biblioteca"

### Base de dados (100%)

| Componente | Estado |
|------------|--------|
| 6 tabelas (categorias, squads, compras, reviews, downloads, xp_transactions) | Aplicadas |
| RLS policies em todas as tabelas | Aplicadas |
| 5 triggers (rating, downloads, XP, updated_at x2) | Aplicados |
| Trigger XP automático compras (migration 006) | Aplicado |
| Trigger XP automático reviews (migration 006) | Aplicado |
| Índice único anti-duplicação XP | Aplicado |
| View `v_squad_catalogo` | Funcional |
| Função `is_admin()` via JWT | Funcional |
| 8 categorias | Populadas |
| 12 squads publicados | Populados |
| Buckets Storage (squad-files, squad-images) | Criados |
| Storage policy SELECT para authenticated | Aplicada |

### Supabase Storage (100%)

12 ZIPs carregados no bucket `squad-files`:

| Squad | Preço | ZIP path |
|-------|-------|----------|
| starter-dev-squad | GRÁTIS | `squad-files/starter-dev-squad/starter-dev-squad.zip` |
| copy-chief-elite | GRÁTIS | `squad-files/copy-chief-elite/copy-chief-elite.zip` |
| seo-content-engine | GRÁTIS | `squad-files/seo-content-engine/seo-content-engine.zip` |
| design-system-squad | 4,98 | `squad-files/design-system-squad/design-system-squad.zip` |
| product-management-suite | 4,98 | `squad-files/product-management-suite/product-management-suite.zip` |
| devops-quality-gates | 4,98 | `squad-files/devops-quality-gates/devops-quality-gates.zip` |
| database-schema-architect | 4,98 | `squad-files/database-schema-architect/database-schema-architect.zip` |
| marketing-ai-squad | 9,98 | `squad-files/marketing-ai-squad/marketing-ai-squad.zip` |
| funnel-conversion-squad | 9,98 | `squad-files/funnel-conversion-squad/funnel-conversion-squad.zip` |
| data-intelligence-squad | 9,98 | `squad-files/data-intelligence-squad/data-intelligence-squad.zip` |
| architect-tech-research | 19,98 | `squad-files/architect-tech-research/architect-tech-research.zip` |
| ai-orchestration-elite | 49,98 | `squad-files/ai-orchestration-elite/ai-orchestration-elite.zip` |

### Fluxos funcionais

| Fluxo | Estado | Testado |
|-------|--------|---------|
| Browse catálogo + filtros + pesquisa | OK | Sim |
| Ver detalhe de squad | OK | Sim |
| Compra gratuita (registo DB) | OK | Sim |
| Download ZIP (signed URL 60min) | OK | Sim |
| Reviews (criar/actualizar) | OK | Parcial |
| XP automático (+10 grátis, +50 pago, +30 review) | OK | Parcial |
| Minha biblioteca | OK | Sim |
| Guia de instalação | OK | Sim |
| Compra paga (Stripe) | NÃO IMPLEMENTADO | — |

---

## 2. O que NÃO está feito

| Item | Prioridade | Notas |
|------|------------|-------|
| Stripe Checkout (compras pagas) | P1 | Edge Functions stripe-checkout + stripe-webhook |
| Admin panel (squad-admin.html) | P2 | CRUD de squads sem ir ao SQL |
| Edge Function squad-validate | P3 | Score de segurança calculado automaticamente |
| Imagens de capa dos squads | P2 | Bucket squad-images existe mas sem uploads |
| Testes end-to-end de TODAS as squads | P0 | Filosofia 10X — testar cada squad num projecto limpo |
| Ajuste de preços | PRÓXIMA SESSÃO | Eurico quer rever pricing |

---

## 3. Migrations aplicadas no Supabase

| Ficheiro | Conteúdo | Estado |
|----------|----------|--------|
| `001-squadmarket.sql` | Schema completo (6 tabelas, RLS, triggers, buckets, categorias) | Aplicada |
| `002-seed-squads-teste.sql` | 3 squads de teste | Aplicada |
| `003-seed-squads-reais.sql` | Actualiza 3 + insere 9 novos (12 total) | Aplicada |
| `004-fix-acentos-categorias.sql` | Correcção acentos PT-PT | Aplicada |
| `005-vitrine-preco-tags-video.sql` | Vitrine (não SquadMarket) | Aplicada |
| `006-xp-auto-triggers.sql` | Triggers XP automático para compras e reviews | Aplicada |

**Policy adicional (não em migration, aplicada via SQL Editor):**
```sql
CREATE POLICY "Authenticated users read squad-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'squad-files' AND auth.role() = 'authenticated');
```

---

## 4. Bugs corrigidos durante a sessão

| Bug | Causa | Fix |
|-----|-------|-----|
| `downloadZip()` mostrava alert placeholder | Função não implementada | Implementado com Supabase Storage signed URLs |
| Download falhava com "ficheiro não disponível" | `zip_path` na DB inclui prefixo `squad-files/` mas `sb.storage.from('squad-files')` já especifica o bucket → path duplicado | `.replace(/^squad-files\//, '')` antes do `createSignedUrl` |
| Signed URL retornava 403 | Bucket privado sem policy SELECT para authenticated | Adicionada policy `auth.role() = 'authenticated'` |
| Acentos em falta no guia | Ficheiro criado sem acentos PT-PT | Corrigidos todos manualmente |
| Link "Como instalar" invisível | Estilo `.nav-link` demasiado discreto | Adicionado estilo badge cyan com border |

---

## 5. Lições e regras aprendidas

### Filosofia 10X (REGRA CORE DA MARCA)
**Prometer X, entregar 10 vezes mais.** Zero produtos sem teste completo. Qualidade e segurança a 100% antes de vender. Provocar o efeito UAU. Esta é a identidade da [IA]AVANÇADA PT.

### Regras técnicas

| Regra | Detalhe |
|-------|---------|
| zip_path no DB inclui bucket | Sempre fazer `.replace(/^squad-files\//, '')` antes de `createSignedUrl` |
| Bucket privado precisa de policy SELECT | Sem ela, signed URLs falham para utilizadores autenticados |
| XP via triggers, não via cliente | RLS bloqueia INSERT em `xp_transactions` para clientes — usar triggers `SECURITY DEFINER` |
| Submodule comunidade tem repo próprio | Push requer 2 operações: push no submodule + push no parent com bump |
| Stripe adiado | Validar fluxo gratuito primeiro, monetização depois |
| Acentos PT-PT obrigatórios | Verificar SEMPRE antes de deploy |
| Design system obrigatório | Links/botões devem seguir o sistema visual — nada discreto ou sem estilo |

### Modelo de negócio

| Conceito | Detalhe |
|----------|---------|
| Squads = downsell | 0 a 49,98 EUR |
| Imersão = upsell | Premium |
| Eurico precisa de dominar o produto | Guia de instalação + teste pessoal de cada squad antes de vender |

---

## 6. Ficheiros modificados nesta sessão

### Comunidade (submodule)

| Ficheiro | Acção |
|----------|-------|
| `squad-detalhe.html` | downloadZip() + iniciarCompra() + fix zip_path |
| `meus-squads.html` | downloadZip() + fix zip_path |
| `squad-sucesso.html` | downloadZip() + fix zip_path |
| `squads.html` | Link "COMO INSTALAR" na nav |
| `dashboard.html` | Botão "Squads" na navbar principal |
| `guia-squads.html` | NOVO — guia de instalação completo |

### Parent repo

| Ficheiro | Acção |
|----------|-------|
| `imersao-tools/docs/migrations/006-xp-auto-triggers.sql` | NOVO — triggers XP automático |
| `imersao-tools/docs/squad-packages/*` | NOVO — 12 pastas + 12 ZIPs com agentes/skills reais |

---

## 7. Credenciais utilizadas (não commitar)

| Credencial | Utilização | Onde vive |
|------------|-----------|-----------|
| Supabase anon key | Frontend (`config.js`) | Já commitada (pública) |
| Supabase service_role key | Upload ZIPs para Storage (sessão única) | NÃO commitada, não guardada |

---

## 8. Próximos passos (próxima sessão)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | **Ajustar preços dos squads** | P0 (Eurico quer rever) |
| 2 | **Testar CADA squad** num projecto limpo | P0 (Filosofia 10X) |
| 3 | Stripe Checkout (Edge Functions) | P1 |
| 4 | Imagens de capa para cada squad | P2 |
| 5 | Admin panel (squad-admin.html) | P2 |
| 6 | Eurico testar pessoalmente como membro | P0 |

### Para ajustar preços
```sql
-- Exemplo: alterar preço de um squad
UPDATE public.squads SET preco = 7.98 WHERE slug = 'design-system-squad';
```
Ou via frontend quando admin panel existir.

---

## 9. URLs de referência

| Recurso | URL |
|---------|-----|
| Marketplace | `comunidade-ia-avancada.vercel.app/squads.html` |
| Guia instalação | `comunidade-ia-avancada.vercel.app/guia-squads.html` |
| Biblioteca | `comunidade-ia-avancada.vercel.app/meus-squads.html` |
| Supabase Dashboard | `supabase.com/dashboard/project/hpqowjelvtejbutyvojo` |
| PRD | `imersao-tools/docs/PRD-SQUADMARKET.md` |
| Arquitectura | `imersao-tools/docs/ARCH-SQUADMARKET.md` |

---

*HANDOFF SquadMarket — 23/03/2026 — Sessão completa*
