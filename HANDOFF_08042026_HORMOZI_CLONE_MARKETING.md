# HANDOFF — 08/04/2026 — Hormozi Clone + Marketing Campanha

**Sessao:** 08/04/2026
**Agente:** @ux-design-expert (Uma) + copy-chief
**Branch:** main
**Estado:** Pronto para proxima fase (marketing campanha)

---

## O QUE FOI FEITO NESTA SESSAO

### 1. Vanda Pinheiro — Membro Premium (engagement 72)

**Contexto:** Vanda Pinheiro e a membro com mais engagement da comunidade inteira (72 — Bom). Coach Bem-estar Integrativo, Faro, PT. Nicho: Mulheres 40+ / Detox Corporal. Site: vandapinheiro.pt. Perfil 100% completo. Entrou 06/04/2026.

**Mensagem WhatsApp preparada (aprovada pelo Eurico):**

> Vanda, aqui e o Eurico da IA AVANCADA PT. Vi o seu site — nicho claro, posicionamento forte em bem-estar integrativo, presenca profissional a serio. Pouca gente chega a comunidade com esse nivel de clareza.
>
> Preciso de lhe dizer uma coisa: a Vanda foi identificada como a membro com mais engagement de toda a comunidade. E exactamente o perfil que procuramos — alguem que ja sabe o que quer construir.
>
> O que lhe proponho e concreto: transformar as ideias que tem para o negocio em pecas reais com IA — landing pages, emails, conteudo para o seu publico. Sem teoria. Construimos juntos.

**Estado:** A AGUARDAR envio pelo Eurico e feedback da Vanda.

**Framework Carnegie aprendido (regra permanente guardada em memoria):**
1. Diz o que a pessoa gostava de ouvir
2. Faz com que a pessoa se sinta importante
3. Resolve a dor dessa pessoa

### 2. Chat Hormozi Clone — Rebrand Completo

**Problema original:** O chat da comunidade dizia "Pergunta ao Eurico" — ninguem tem interesse em falar com o Eurico sobre negocios. Mas falar com o Hormozi? Toda a gente quer.

**O que ja tinha o cerebro do Hormozi:** O system prompt JA tinha 17 frameworks Hormozi (Mosy 6, Grand Slam, Value Equation, 5x Upsell, VSSL, AD FOCUS). So estava vestido errado.

**Alteracoes feitas (3 ficheiros, 2 commits, deployed no Vercel):**

| Ficheiro | Alteracao |
|----------|-----------|
| `comunidade/chat-eurico-widget.js:420` | Botao: "Pergunta ao Eurico" → "Pergunte ao Hormozi" |
| `comunidade/chat-eurico-widget.js:428-431` | Header: "[IA]AVANCADA PT / Assistente IA" → "Alex Hormozi Clone / Consultor de negocio IA" |
| `comunidade/chat-eurico-widget.js:437-438` | Welcome: greeting Hormozi Clone |
| `comunidade/chat-eurico-widget.js:448-451` | Quick actions: Mosy 6, Grand Slam, Pricing, Escalar em PT |
| `comunidade/chat-eurico-widget.js:543` | Reset nova conversa: mesma greeting nova |
| `comunidade/api/chat-eurico-ia.js:11-27` | Identidade: Hormozi Clone adaptado a PT |
| `comunidade/api/chat-eurico-ia.js:28-35` | REGRA DE OURO — OUVIR PRIMEIRO (fix critico) |
| `comunidade/api/chat-eurico-ia.js:105-118` | Venda subtil: clone 8 EUR + imersoes (max 1x/conversa) |
| `comunidade/api/chat-eurico-ia.js:293` | CORS: adicionada origem Vercel |

**Fix critico aplicado:** O clone estava a aplicar frameworks cegamente — a pessoa dizia "nao podem pagar 200 EUR" e o clone sugeria 499 EUR. Adicionada regra "OUVIR PRIMEIRO": respeitar constraints declarados, perguntar orcamento antes de propor preco, trabalhar DENTRO do constraint.

**Estado actual:** Funcional, deployed, testado pelo Eurico. Respostas mais curtas e respeitam regras.

**Funil montado:**
```
Membro ve "Pergunte ao Hormozi" → curiosidade → experimenta
  → Recebe diagnostico real (Mosy 6, Grand Slam, Value Equation)
  → Valor primeiro, sempre
  → Apos dar valor: "clone completo no SquadMarket por 8 EUR"
  → Ou: "imersao pratica de 2 dias — fala com o Eurico"
  → Max 1 mencao por conversa, nunca forcada
```

---

## O QUE FALTA FAZER (PROXIMA SESSAO)

### PRIORIDADE 1: Campanha de Marketing — Emails + CRM

**Objectivo:** Anunciar o Hormozi Clone aos membros da comunidade via:

1. **Campanha de emails via CRM** — email a todos os membros activos anunciando:
   - "Agora tens acesso ao Hormozi Clone na comunidade"
   - Explicar o que e (frameworks reais, adaptado a PT, gratuito na comunidade)
   - CTA: entrar na comunidade e experimentar
   - Usar framework Carnegie: dizer o que querem ouvir, faze-los sentir importantes, resolver a dor

2. **Post no feed da comunidade** — anuncio interno:
   - "Novidade: Pergunte ao Hormozi sobre o seu negocio"
   - Explicar que o botao agora tem o clone do Hormozi
   - Dar exemplos do que podem perguntar (diagnostico, oferta, pricing, escalar)
   - Convidar a experimentar

3. **Grupos WhatsApp** — mensagem curta:
   - Anuncio da novidade
   - Link directo para a comunidade
   - Tom Carnegie: faze-los sentir que tem acesso a algo de elite

### PRIORIDADE 2: Melhorias futuras do Hormozi Clone (NAO URGENTE)

| Melhoria | Detalhe | Prioridade |
|----------|---------|------------|
| Knowledge base RAG | Adicionar mais entries ao knowledge-base.json — imersoes, produtos, casos reais | Media |
| Historias reais | Quando houver casos de membros que usaram o clone com sucesso, adicionar ao RAG | Media |
| Prompts por nicho | Templates de diagnostico por area (restauracao, coaching, marketing, etc.) | Baixa |
| Feedback loop | Botao de like/dislike nas respostas para melhorar qualidade | Baixa |
| Label nas respostas | O msg-label ainda mostra "[IA]AVANCADA PT" nas respostas da API — mudar para "Hormozi Clone" | Alta |

### PRIORIDADE 3: Follow-up Vanda Pinheiro

| Accao | Quando |
|-------|--------|
| Enviar mensagem WhatsApp | Assim que o Eurico decidir |
| Se responder positivo | Marcar sessao para mostrar pipeline e construir algo concreto para o negocio dela |
| Documentar como caso de estudo | Se o resultado for bom — profissional real com resultado real |

---

## FICHEIROS ALTERADOS NESTA SESSAO

| Ficheiro | Tipo de alteracao |
|----------|-------------------|
| `comunidade/chat-eurico-widget.js` | Rebrand completo (botao, header, greeting, quick actions, reset) |
| `comunidade/api/chat-eurico-ia.js` | Persona Hormozi, regra ouvir primeiro, venda subtil, CORS |

---

## DECISOES DO EURICO NESTA SESSAO

1. "NAO quero dois botoes" — so o Hormozi, sem botao separado para Eurico
2. Framework Carnegie e LEI para toda a copy: 1) dizer o que querem ouvir, 2) fazer sentir importante, 3) resolver a dor
3. NUNCA tratar profissionais por "tu" — tratamento formal sempre
4. O clone pode vender subtilmente (imersoes + clone 8 EUR) mas so apos dar valor real
5. Hormozi Clone fica assim por agora — melhorias de RAG e qualidade nao sao prioridade imediata
6. Proxima sessao: marketing campanha (emails CRM + post feed + grupos WhatsApp)

---

## MEMORIAS GUARDADAS

| Memoria | Tipo | Ficheiro |
|---------|------|----------|
| WhatsApp premium leads — tom e abordagem | feedback | feedback_whatsapp_premium_leads.md |
| Framework Carnegie para copy | feedback | feedback_carnegie_copy_framework.md |

---

## CONTEXTO PARA PROXIMA SESSAO

**Agente recomendado:** `/market-emails` para a campanha de email, `/market-copy` para o copy dos posts e WhatsApp. O @ux-design-expert nao escreve copy — delegar SEMPRE ao copy specialist.

**CRM da comunidade:** `comunidade/crm.html` — tem sistema de campanhas de email com templates. Verificar que templates existem e criar novos se necessario.

**Feed da comunidade:** Posts sao criados via Supabase na tabela `news`. Verificar estrutura antes de criar post.

**Grupos WhatsApp:** Copy curto, maximo 6-8 linhas, tom Carnegie.

**Tom obrigatorio:** PT-PT, formal com profissionais, Carnegie (dizer o que querem ouvir → sentir importante → resolver dor), sem palavras proibidas (curso, facil, automatico, revolucionario, garantido).
