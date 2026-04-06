# HANDOFF — FASE 2: Pipeline Imersao (Exercicio Guiado)

> Data: 04/04/2026
> Sessao: Eurico + Claude Opus
> Estado: Pipeline funcional end-to-end, com problemas de qualidade HTML por resolver

---

## O que foi feito nesta sessao

### Pipeline completo implementado e testado

| Passo | Ferramenta | Estado | URL |
|-------|-----------|--------|-----|
| 1 | Student Profiler | Funciona | comunidade.avancada.expressia.pt/dashboard.html |
| 2 | Starter Builder | Funciona + modo imersao | starter-builder.expressia.pt |
| 3 | Prompt Optimizer | Funciona + auto-build/redirect | prompt-optimizer.expressia.pt |
| 4 | AIOS Compiler | Funciona + Groq + auto-deploy | aios-compiler.expressia.pt |
| 5 | GitHub push | Funciona | github.com/ia-avancada-pt/{repo} |
| 6 | Vercel deploy | Funciona (deploy directo) | {repo}.vercel.app |

### Modo imersao (`?mode=imersao`)

Activado via URL param em qualquer ferramenta. Quando activo:

- **Starter Builder:** botao muda para "Criar a Minha App", navega no mesmo tab
- **Prompt Optimizer:** auto-gera prompt e redireciona automaticamente (membro nem ve esta pagina)
- **AIOS Compiler:** salta configuracao de APIs, usa Groq com key pre-configurada, gera automaticamente
- **GitHub push:** cria repo em `ia-avancada-pt/{todolist-timestamp}` com PAT do Eurico
- **Vercel deploy:** upload directo de ficheiros via API (sem integracao GitHub), retorna URL publica
- **Ecra final:** mostra URL + botoes "Ver a tua app" e "Partilhar no WhatsApp"

### Fluxo do membro na imersao

```
Starter Builder (?mode=imersao)
  → Membro escolhe vibe (5 opcoes) + layout (4 opcoes)
  → Clica "Criar a Minha App"
  → [Optimizer faz tudo em background — invisivel]
  → Compiler mostra codigo a ser gerado em streaming
  → Membro clica "Publicar na Internet"
  → GitHub push automatico + Vercel deploy automatico
  → URL publica + "Partilhar no WhatsApp"
```

Total de cliques do membro: **3** (escolher vibe, escolher layout, publicar)

---

## Como funciona tecnicamente (para o Eurico entender)

### Cada membro esta em casa — como e que isto funciona?

**Todas as ferramentas sao web apps publicas hospedadas no Vercel.** O membro nao instala nada. Abre um link no browser e usa.

| Pergunta | Resposta |
|----------|---------|
| O membro precisa de instalar algo? | NAO. Tudo funciona no browser |
| O membro usa o meu computador? | NAO. As ferramentas estao no Vercel, acessiveis de qualquer lugar |
| O membro precisa de API keys? | NAO. As tuas keys estao pre-configuradas no modo imersao |
| O membro precisa de conta GitHub? | NAO para o exercicio guiado. O push usa o teu PAT na tua org |
| O membro precisa de conta Vercel? | NAO para o exercicio guiado. O deploy usa o teu token Vercel |
| Onde ficam os repos dos membros? | Em github.com/ia-avancada-pt/ (a tua org) |
| Onde ficam as apps deployadas? | Em {nome}.vercel.app (na tua conta Vercel) |
| Quantos membros podem usar ao mesmo tempo? | Groq: 6000 req/dia. Para 30 membros a gerar 2-3 vezes cada: sem problema |

### O que usa recursos teus (Eurico)

| Recurso | Limite | Custo | Risco |
|---------|--------|-------|-------|
| Groq API key | 6000 req/dia (free tier) | 0 EUR | Esgota se muitos pedidos. Solucao: criar 2a key de backup |
| GitHub PAT | Sem limite de repos | 0 EUR | O PAT tem acesso total a org. Rotar apos imersao |
| Vercel token | Hobby plan: 100 deploys/dia | 0 EUR | 30 membros = 30 deploys. Dentro do limite |
| Vercel bandwidth | 100 GB/mes (hobby) | 0 EUR | HTML estatico = KB por app. Sem problema |

### O que cada membro produz

Cada membro sai com:

1. **Repo GitHub** em `github.com/ia-avancada-pt/todolist-{id}` com 3 ficheiros (README, vercel.json, index.html)
2. **App live** em `todolist-{id}.vercel.app` acessivel publicamente
3. **Design personalizado** — cada membro escolheu vibe + layout diferente

---

## Credenciais configuradas

### Onde estao guardadas

| Credencial | Local (.env.local) | Vercel env vars | Valor |
|-----------|--------------------|--------------------|-------|
| Groq API key | `VITE_IMERSAO_GROQ_KEY` | Sim (production) | `gsk_HcvH0Fa...` |
| Gemini API key | `VITE_IMERSAO_GEMINI_KEY` | Sim (production) | `AIzaSyDERn...` (quota esgotada — backup) |
| GitHub PAT | `VITE_IMERSAO_GITHUB_TOKEN` | Sim (production) | `ghp_8j3sx4...` |
| Vercel token | `VITE_IMERSAO_VERCEL_TOKEN` | Sim (production) | `vcp_2GDRbR...` |
| GitHub org | `VITE_IMERSAO_GITHUB_ORG` | Sim (production) | `ia-avancada-pt` |

### AVISO SEGURANCA

As credenciais estao embedadas no JavaScript do browser (prefixo `VITE_`). Qualquer pessoa que inspeccione o codigo fonte pode extrair os tokens.

**Accoes obrigatorias apos a imersao:**
1. Rotar o GitHub PAT (`github.com/settings/tokens`)
2. Rotar o Vercel token (`vercel.com/account/settings/tokens`)
3. Gerar nova Groq API key (`console.groq.com`)
4. Actualizar os env vars no Vercel e fazer redeploy

---

## Problemas conhecidos (por resolver)

### 1. Qualidade do HTML gerado pelo Groq

**Estado:** O Groq gera HTML funcional mas mal formatado — CSS aparece como texto em vez de ser renderizado.

**Causa:** O prompt compacto (`compactPromptForGroq`) pode ser demasiado minimo. O system prompt pede 300 linhas minimo mas o Groq gera ~160 com formatacao partida.

**Fix necessario:** Melhorar o system prompt e/ou o parsing do HTML no CodeParser. Testar varias vibes para garantir qualidade consistente.

**Impacto na imersao:** ALTO — se o resultado visual for mau, perde-se o efeito "WOW".

### 2. Gemini como fallback

**Estado:** Ambas as keys Gemini (antiga e nova) estao com quota esgotada no free tier.

**Causa:** A conta Google do Eurico esgotou o free tier global. Keys novas no mesmo projecto/conta herdam o limite zero.

**Fix necessario:** Activar billing no Google Cloud (custo: centimos) OU criar conta Google nova para a imersao.

**Impacto na imersao:** BAIXO se o Groq funcionar bem. ALTO se o Groq falhar e nao houver fallback.

### 3. Design personalizado

**Estado:** O membro escolhe vibe + layout no Starter Builder, mas o prompt compacto pode nao estar a passar todos os tokens de design correctamente.

**Fix necessario:** Verificar que `compactPromptForGroq` extrai e passa: cor accent, estilo (glassmorphism/brutalist/etc), layout (kanban/lista/etc).

**Impacto na imersao:** MEDIO — o objectivo e que todos tenham To-Do List com design diferente.

### 4. Proxy backend (futuro)

**Estado:** NAO implementado. Actualmente as API keys estao no client-side.

**Necessidade:** Para a imersao (evento unico, 30 pessoas) e aceitavel. Para plataforma (uso continuo) precisa de proxy serverless.

**Solucao futura:** Vercel Edge Function que guarda keys no servidor e faz proxy dos pedidos.

---

## Ficheiros modificados nesta sessao

### AIOS Compiler (`imersao-build/packages/aios-compiler/`)

| Ficheiro | O que mudou |
|----------|------------|
| `.env.local` | Adicionadas 5 variaveis VITE_IMERSAO_* |
| `src/App.tsx` | Modo imersao: skip config, auto-generate, auto-deploy, ecra final com WhatsApp |
| `src/features/code-generator/GeminiService.ts` | `compactPromptForGroq()` — comprime prompt de 33K para ~200 tokens. `max_tokens` ajustado para 8000 |
| `src/features/github-pusher/GitHubService.ts` | `auto_init: true`, suporte para `org`, `getFileSha()` para update de README |
| `src/features/vercel-deployer/VercelService.ts` | REESCRITO — deploy directo de ficheiros via Vercel API (sem integracao GitHub) |

### Prompt Optimizer (`imersao-build/packages/prompt-optimizer/`)

| Ficheiro | O que mudou |
|----------|------------|
| `src/App.tsx` | Modo imersao: auto-build prompt + auto-redirect para Compiler (mesmo tab) |

### Starter Builder (`imersao-tools/starter-builder/`)

| Ficheiro | O que mudou |
|----------|------------|
| `src/App.tsx` | Modo imersao: botao "Criar a Minha App", navegacao no mesmo tab, passa `?mode=imersao` |

---

## Decisoes tomadas nesta sessao

| Decisao | Opcoes consideradas | Escolha | Razao |
|---------|---------------------|---------|-------|
| Projecto guiado | To-Do List / Portfolio / Landing page | To-Do List | Simples, resultado garantido, design variavel |
| API key do membro | Cada membro traz a sua / Key do Eurico | Key do Eurico | Zero friccao para o membro |
| Provider AI | Gemini / Groq | Groq (primary) | Gemini quota esgotada. Groq 6000 req/dia free |
| Repos dos membros | Conta pessoal / Organizacao | Org `ia-avancada-pt` | Centralizado, profissional |
| Deploy Vercel | Via GitHub integration / Directo via API | Directo via API | GitHub integration falhou. Deploy directo funciona |
| Contas GitHub/Vercel | Membro cria antes / Cria no dia | Antes (tutorial page) | Poupa 15 min no dia. Fallback: cria no inicio |
| Prompt para Groq | Prompt completo do Optimizer / Compacto | Compacto (~200 tokens) | Prompt original tem 33K tokens, excede limite Groq |

---

## Proximos passos (por ordem de prioridade)

### Criticos (bloqueia imersao)

1. **Corrigir qualidade HTML do Groq** — testar todas as 5 vibes, garantir CSS renderizado
2. **Testar fluxo completo 3 vezes** com vibes diferentes para garantir consistencia
3. **Criar pagina tutorial** para membros criarem contas GitHub + Vercel antes do dia

### Importantes (melhora experiencia)

4. **Actualizar shard FASE-2** com todas as decisoes e fluxo final
5. **Criar Groq key backup** (segunda conta) para fallback no dia
6. **Testar com 2-3 membros reais** antes da imersao para validar

### Futuros (apos imersao)

7. **Proxy backend** — Vercel Edge Function para esconder API keys
8. **Activar Gemini billing** — fallback fiavel (centimos de custo)
9. **Dominio personalizado** — `apps.expressia.pt/{membro}` em vez de `.vercel.app`

---

## Como continuar a proxima sessao

1. Ler este HANDOFF primeiro
2. Abrir `imersao-build/packages/aios-compiler/src/features/code-generator/GeminiService.ts`
3. Focar em `compactPromptForGroq()` e `HTML_SYSTEM_GROQ` — sao estes que determinam a qualidade do HTML
4. Testar via `https://starter-builder.expressia.pt/?mode=imersao` apos cada alteracao
5. Validar visualmente: o CSS deve renderizar, o design deve reflectir a vibe escolhida

---

## URL de teste rapido

```
https://starter-builder.expressia.pt/?mode=imersao
```

Fluxo: escolhe vibe → escolhe layout → "Criar a Minha App" → espera gerar → "Publicar na Internet" → URL live

---

*Handoff criado por Claude Opus — 04/04/2026 00:45*
