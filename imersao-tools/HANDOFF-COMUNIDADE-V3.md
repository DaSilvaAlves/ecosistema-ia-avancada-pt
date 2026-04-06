# HANDOFF — Comunidade [IA]AVANÇADA PT · Sessão 11/03/2026 (tarde)
**Para continuar:** `Lê C:/Users/XPS/Documents/imersao-tools/HANDOFF-COMUNIDADE-V3.md e continua o projecto`
**Arranque rápido:** `/aios-god-mode` → depois `@dev`

---

## ESTADO ACTUAL ✅

### O que foi feito NESTA SESSÃO

| Ficheiro | Estado |
|---------|--------|
| `comunidade/curso-claude.html` | ✅ CRIADO — Claude Code Essencial (4 lições, PREMIUM) |
| `comunidade/curso-geniailidade.html` | ✅ REESCRITO — Zona de Genialidade (4 lições, FREE) |
| `comunidade/biblioteca.html` | ✅ CRIADO — 58 prompts (54 normais + 4 Elite system prompts) |
| `comunidade/dashboard.html` | ✅ ACTUALIZADO — múltiplas correcções |

### Dashboard — estado actual dos cursos

```javascript
const CURSOS=[
  {id:'aiox-basico', nome:'AIOX Básico', url:'curso-aiox.html', free:false, ok:true},
  {id:'gen-ia', nome:'IA do Zero', url:'curso-geniailidade.html', free:true, ok:true},
  {id:'claude', nome:'Claude Code Essencial', url:'curso-claude.html', free:false, ok:true},
  {id:'prompts', nome:'Biblioteca de Prompts', url:'biblioteca.html', free:false, ok:true},
  {id:'control-center', nome:'AIOX Control Center', url:'https://aios-control-center-web.vercel.app/', free:false, ok:true, external:true},
];
```

---

## PROBLEMA EM ABERTO 🔴

### curso-geniailidade.html — pode ainda não abrir correctamente
**Sintoma:** Clicar "Começar →" no card "IA do Zero" pode mostrar página em branco
**O que já foi tentado:**
1. Corrigido `discPromptText` null error no init
2. Mudado auth para não-bloqueante (carrega conteúdo primeiro, verifica sessão em background)
3. Sintaxe JS validada com Node — OK

**Se ainda não funcionar:** verificar no browser DevTools (F12 → Console) qual é o erro exacto

---

## FICHEIROS DO PROJECTO

```
C:/Users/XPS/Documents/imersao-tools/comunidade/
├── index.html              ✅ Login + registo Supabase
├── dashboard.html          ✅ Dashboard v2 — 5 cursos activos
├── curso-aiox.html         ✅ AIOX Básico (3 lições, PREMIUM)
├── curso-geniailidade.html ✅ IA do Zero / Zona de Genialidade (4 lições, FREE) — ver problema acima
├── curso-claude.html       ✅ Claude Code Essencial (4 lições, PREMIUM)
├── biblioteca.html         ✅ 58 prompts — 6 categorias + 4 Elite
├── config.js               ✅ Supabase configurado
└── supabase-setup.sql      ✅ Já executado — NÃO CORRER DE NOVO
```

---

## CURSOS — CONTEÚDO RESUMIDO

### IA do Zero (curso-geniailidade.html) — FREE
- Lição 1: As 4 Zonas (Incompetência, Mediocridade, Excelência, Genialidade) + Maslow
- Lição 2: DISC (4 perfis com cards visuais) + 9 tipos Eneagrama + **Prompt DISC interactivo** (copiar para IA)
- Lição 3: 3 perguntas fundamentais + Janela de Johari + frase "A minha Zona é..."
- Lição 4: IA como alavanca — Eliminar/Automatizar/Acelerar/Amplificar

### Claude Code Essencial (curso-claude.html) — PREMIUM
- Lição 1: O que é o Claude Code e porque muda tudo
- Lição 2: Instalação e configuração Windows + WSL
- Lição 3: Comandos essenciais /help ao @dev
- Lição 4: Primeiro projecto com agentes (portfolio)

### Biblioteca de Prompts (biblioteca.html) — PREMIUM
- 54 prompts em 6 categorias: AIOX/Agentes, Claude Code, Copywriting, Negócio, Análise, Produtividade
- 4 System Prompts Elite: Alex Hormozi, Lyra 4-D, Roteiro Estudo de Caso, Q&A com Personalidade
- Pesquisa em tempo real + filtros por categoria + botão Copiar

---

## PRÓXIMAS TAREFAS (por prioridade)

### 🔴 P0 — Verificar
- [ ] Confirmar que curso-geniailidade.html abre correctamente (ver problema acima)
- [ ] Actualizar descrição do card "IA do Zero" no dashboard (ainda mostra texto antigo)

### 🟡 P1 — Esta semana
- [ ] Stripe — pagamentos automáticos (28€/mês, 188€/ano)
- [ ] Webhook Stripe → actualiza tier='premium' no Supabase
- [ ] MailerLite — adicionar email à lista após registo

### 🟢 P2 — Médio prazo
- [ ] Feed real (Supabase) — substituir posts hardcoded
- [ ] Dashboard admin para Eurico
- [ ] Domínio próprio comunidade.iaavancada.pt

---

## CREDENCIAIS

| Serviço | Valor |
|---------|-------|
| Supabase URL | `https://hpqowjelvtejbutyvojo.supabase.co` |
| Vercel projecto | `comunidade` (conta euricojsalves-4744) |
| URL produção | https://comunidade-ia-avancada.vercel.app |
| WhatsApp Eurico | +351 932 066 328 |

---

## REGRAS DO EURICO (SEMPRE SEGUIR)
- Língua: PT-PT Portugal
- Preços: terminam sempre em 8 (28€, 188€, 888€)
- Design: dark quantum — nunca light mode
- Nunca mencionar: Lovable, AI Studio
- Commits/deploys: confirmar antes

---
*Gerado em 2026-03-11 · Sessão tarde · AIOX God Mode v3.0*
