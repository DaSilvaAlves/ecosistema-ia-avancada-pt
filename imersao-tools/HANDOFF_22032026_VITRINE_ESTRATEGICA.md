# HANDOFF — Vitrine Estratégica [IA]AVANÇADA PT

**Data:** 22/03/2026
**Sessão:** Vitrine Estratégica (Epic completo)
**Estado:** Implementado + Pushed + QA PASS
**Branch:** main
**Último commit comunidade:** f966fbf
**Último commit ecosistema:** a9eb62e

---

## O que foi feito

| Story | Conteúdo | Estado | QA |
|-------|----------|--------|-----|
| 1.1 | Pipeline — 5 ferramentas sequenciais com setas | Done | PASS |
| 1.2 | Ecossistema — 4 ferramentas com badges tipificados | Done | PASS |
| 1.3 | Sistema de 4 tabs + placeholder Projectos Reais | Done | PASS |
| Extra | Ícone ∞ dourado na sidebar + navbar + widget | Done | — |

### Artefactos criados

| Artefacto | Path |
|-----------|------|
| PRD | `imersao-tools/docs/prd/PRD-VITRINE-ESTRATEGICA.md` |
| Story 1.1 | `imersao-tools/docs/stories/1.1.story.md` |
| Story 1.2 | `imersao-tools/docs/stories/1.2.story.md` |
| Story 1.3 | `imersao-tools/docs/stories/1.3.story.md` |
| Dashboard | `imersao-tools/comunidade/dashboard.html` |

### URLs confirmadas (5/5 PASS)

| Ferramenta | URL |
|-----------|-----|
| Student Profiler | https://student-profiler-one.vercel.app/ |
| Briefing Generator | https://briefing-generator-delta.vercel.app/ |
| Starter Builder | https://starter-builder.vercel.app/ |
| Prompt Optimizer | https://prompt-optimizer-ruddy-omega.vercel.app/ |
| AIOS Compiler | https://aios-compiler.vercel.app/ |
| AIOS Control Center | https://aios-control-center-web.vercel.app/ |
| Design System Visual | https://design-system-visual.vercel.app/ |
| Roda da Vida Interativa | https://roda-da-vida-interativa.vercel.app/ |
| Tradutor Pro DOCX | https://tradutor-pro-docx.vercel.app/ |

---

## Regras estabelecidas nesta sessão

| Regra | Detalhe |
|-------|---------|
| Estratégia antes de acção | NUNCA publicar na vitrine sem estratégia de marketing definida |
| Sempre criar brief/PRD | Toda iniciativa precisa de brief/PRD antes de executar |
| Workflow completo | QA → PM → PO → SM → PO (validação) → QA (URLs) → DevOps → Dev → QA → DevOps (push) |
| Emoji vs Unicode | Emojis (♾️) não aceitam CSS color — usar caracteres Unicode (∞) quando precisar de cor |
| URLs Vercel | Nomes genéricos são ocupados globalmente — verificar URL real via `vercel project ls` |
| Nada de puxadinhos | Resolver problemas de vez em vez de contornar |

---

## Lições aprendidas

### 1. URLs Vercel não são previsíveis
As URLs `{nome}.vercel.app` podem ter sufixos (`-one`, `-delta`, `-ruddy-omega`) quando o nome base já está ocupado por outro utilizador. Sempre verificar via `npx vercel project ls` para obter a URL real.

### 2. Emojis não aceitam CSS color
O emoji ♾️ é renderizado como glyph do sistema operativo — `color: #FFB800` não tem efeito. A solução é usar o caracter Unicode `∞` (U+221E) que é texto puro e aceita CSS color normalmente.

### 3. O workflow AIOX funciona
A sequência QA → PM → PO → SM → Dev → QA → DevOps garantiu que cada passo tinha validação. O PRD evitou que se colocassem ferramentas aleatórias sem estratégia.

### 4. Submodules precisam de push duplo
O comunidade é um submodule. Qualquer alteração requer: commit+push no submodule, depois commit+push no repo pai para actualizar a referência.

### 5. A regra "estratégia primeiro" é crítica
O utilizador parou o impulso de "colocar projectos já" e insistiu em estratégia primeiro. Resultado: vitrine organizada em 3 categorias com propósito claro em vez de lista aleatória.

---

## O que falta fazer (futuras melhorias)

### Prioridade alta

| Item | Detalhe |
|------|---------|
| Testar no browser | Verificar rendering visual das tabs, pipeline e ecossistema ao vivo |
| Screenshots/thumbnails | Cada ferramenta precisa de screenshot real — por agora só tem ícones |
| Copy refinado | Passar as descrições por `/market-copy` para alinhar com tom do Eurico |
| Tab "Projectos Reais" | Avaliar Nexus CRM e outros projectos para preencher esta secção |

### Prioridade média

| Item | Detalhe |
|------|---------|
| Diagrama Pipeline | Deployar o DIAGRAMA-PIPELINE.html como hero visual da secção Ferramentas |
| Analytics | Event tracking nos CTAs (cliques em "Experimenta" / "Abrir ferramenta") |
| Health check URLs | Verificação periódica de que as 9 URLs continuam online |
| Nexus CRM | Avaliar estado funcional antes de incluir na vitrine |

### Prioridade baixa

| Item | Detalhe |
|------|---------|
| Animações | Fade-in nos cards ao entrar na viewport (intersection observer) |
| Contadores | Mostrar quantos membros usaram cada ferramenta |
| Ordering inteligente | Ordenar ferramentas por popularidade |
| Video embed | Usar a coluna `video_url` da migração 005 para embed nos cards |

---

## Opinião e visão futura

A vitrine tem agora estrutura e propósito. Os 3 pontos que mais impacto terão:

1. **Screenshots reais** — um card com screenshot de qualidade vale mais que 10 linhas de copy. Investir tempo a capturar screenshots polidos de cada ferramenta.

2. **Case studies com narrativa** — a tab "Projectos Reais" é a que mais pode converter visitantes em membros. Precisa de histórias concretas: problema → solução → resultado. Não basta um link.

3. **Dados de utilização** — mostrar "237 perfis criados" no Student Profiler ou "52 projectos compilados" no AIOS Compiler dá prova social quantitativa. Supabase já tem estes dados.

A vitrine é a montra da comunidade. O que está lá define a percepção de valor para quem chega. Cada item deve merecer o seu lugar.

---

*HANDOFF criado em 22/03/2026 | Sessão completa | Pronto para retomar*
