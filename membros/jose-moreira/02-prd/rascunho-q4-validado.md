# Q4 — AUTORIA E CONTROLO (VALIDADA)

> **Estado:** APROVADA pelo Eurico em 22/04/2026
> **Caminho comercial escolhido:** B (porta aberta para parceria futura, sem preço inventado)
> **Parte técnica:** validada em 21/04/2026
> **Parte comercial:** validada em 22/04/2026

---

## Frase exacta do Moreira (briefing)

> "Como integrar os seus anúncios e suporte técnico sem que eu perca a autoria e o controlo estratégico do chatbot?"

---

## Q4. AUTORIA E CONTROLO — integrar anúncios e suporte sem perder autoria

### Onde está a autoria do seu bot hoje — tecnicamente

O bot é seu. Não é formalidade, é facto verificável nos ficheiros:

- Bot `e7e5db81-ad3c-45e2-bf25-033d76b04059` criado e gerido por `josemmoreira1@gmail.com` no seu workspace
- Os 4 flows (Main, Error, Timeout, Conversation End), 45 nodes no total (33 só no flow Main), 2 hooks LLMz — tudo gravado no seu nome
- A base Airtable `app7S6wEWqhpQgMEV` está na sua conta pessoal, o PAT é seu
- O `.bpz` é um snapshot seu — exportável e portável só por quem tenha acesso ao workspace

Ninguém pode alterar nem apagar nada disto sem autorização sua explícita. A autoria está protegida por design. A pergunta real é: como manter isto assim quando começar a partilhar acessos (clientes, parceiros, consultores)?

### Os roles do Botpress — o que dar e a quem

O Botpress tem 6 níveis de colaborador. Os relevantes para o seu cenário:

| Role | O que pode fazer | Quando atribuir |
|------|------------------|-----------------|
| Viewer | Só vê o bot, não toca em nada | Cliente que quer ver conversas / observador externo |
| Developer | Cria, vê, actualiza. Só apaga o que criou | Outro dev que o ajuda em tarefas concretas |
| Manager | Cria, vê, actualiza, apaga tudo. Vê auditoria e billing | Sócio operacional de confiança |
| Administrator | Tudo + adiciona/remove colaboradores + billing | Só o Sr. |

Regra simples: **Admin é só seu.** Qualquer outra pessoa (cliente, parceiro, consultor) entra no máximo como Viewer. Se precisar de ajuda em tarefas técnicas, concede Developer temporariamente e o Sr. revê antes de publicar. Nunca Admin a ninguém além do Sr.

### Como proteger a autoria em cada cenário

Três coisas simples, independentes do formato comercial:

1. **Workspace sempre em nome do Sr.** Se um cliente quiser criar o bot em nome da empresa dele, use o Modelo A da Q3 (cliente tem conta própria gratuita, o Sr. entra como colaborador). O seu workspace-mestre, onde vive o esqueleto template, fica sempre seu
2. **Viewer por defeito** para clientes e terceiros. Níveis superiores só quando há necessidade concreta e temporária
3. **Exportar o `.bpz` regularmente** e guardar localmente. É o seu código-fonte. Se um dia houver problema no Botpress cloud, o Sr. tem o bot em ficheiro para reimportar noutro workspace

### Sobre integrar os seus anúncios e suporte técnico

Hoje, entre nós, não existe formato comercial estruturado. O acompanhamento que o Sr. tem é técnico, entre pares, e foi essa a condição desde que entrou na comunidade [IA]AVANÇADA PT — construímos ferramentas em conjunto, resolvemos problemas concretos, partilhamos o que aprendemos. Zero contrato, zero comissão, zero obrigação mútua.

Isto não é por distracção. É intencional. O Sr. está no início do caminho prático com o bot — tem 1 bot, flow em produção, KB configurada, Airtable ligado. Ainda não tem clientes pagantes em operação. Enquanto esse for o quadro, qualquer proposta minha de modelo comercial seria prematura e, sinceramente, pouco honesta.

O que faz sentido fazer agora:
- Continuar a refinar o bot com o meu apoio técnico, sem custo
- O Sr. testar o esqueleto com 1 ou 2 empresas reais (Modelo A da Q3 — cada cliente no Free dele, Sr. como colaborador)
- Cobrar o que o Sr. entender ao cliente final — esse valor é integralmente seu, a autoria é sua, o controlo é seu

Quando o Sr. tiver 2 ou 3 clientes pagantes a operar, retomamos a conversa sobre formato de parceria com dados reais: quanto tempo o Sr. gasta por cliente, quanto recebe, onde o meu input acelera, e se faz sentido alguma fórmula conjunta — seja co-marketing (Sr. aparece como caso da comunidade), afiliação voluntária (link para a comunidade no bot, se quiser), ou outra coisa que não imaginámos ainda. Qualquer uma dessas hipóteses parte de números reais do Sr., não de projecções minhas.

O que não vai acontecer, em caso algum:
- Eu colocar anúncios meus dentro do bot do Sr. sem a sua aprovação explícita
- Pedir comissão sobre clientes que o Sr. angariar
- Exigir exclusividade ou limitar o que pode construir
- Propor modelo comercial sem o Sr. ter dados concretos sobre a sua operação

A autoria fica protegida por design no Botpress (secção acima). O lado comercial fica em pausa voluntária até o Sr. ter base para decidir em igualdade.

Se em qualquer momento sentir que esta conversa precisa de formato mais claro, diga. O ritmo é o seu.

---

## Factos-chave confirmados (evidência)

| Facto | Certeza | Fonte |
|-------|---------|-------|
| Email Moreira: `josemmoreira1@gmail.com` | 100% | bot.json linha 5600 |
| workspaceUserId: `0947e877-3373-45f2-8983-5c385007d6b1` | 100% | bot.json linha 5600 |
| Bot ID: `e7e5db81-ad3c-45e2-bf25-033d76b04059` | 100% | bot.json linha 9 |
| Airtable Base ID: `app7S6wEWqhpQgMEV` | 100% | bot.json linha 16 |
| 6 roles Botpress: Viewer / Billing Manager / Developer / Manager / Administrator / Owner | 100% | Studio → Workspace settings → Members (verificável visualmente) |
| Modelo A de replicação (cliente com conta própria gratuita) é viável | 100% | Validado na Q3 |

---

## Erros v2 identificados (2)

1. V2 propõe "contrato simples de 1 página por cliente" com texto proposto — assume decisão comercial que é do Eurico, não minha
2. V2 afirma "Não temos formato estruturado de parceria comercial" como posição do Eurico — v2 inventou essa posição em vez de esperar validação

---

## Regras aplicadas

- ✅ `feedback_no_projected_business_models` — sem inventar preço, split, comissão
- ✅ `feedback_community_acolhe_adapta_model` — porta aberta sem compromisso forçado
- ✅ `feedback_moreira_no_hallucinations` — só factos do bot.json + docs Botpress
- ✅ PT-PT formal-cordial ("o Sr.", "o Sr. Moreira")
- ✅ Sem termos proibidos ("curso", "fácil", "automático", "revolucionário", "garantido")
