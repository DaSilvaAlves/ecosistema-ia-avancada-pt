# Resposta ao Moreira — 5 questões da 2ª sessão (18/05/2026)

> **Estado:** COMPLETO — pronto a enviar (rever antes).
> Fonte das questões: `assets/Moreira 2ª sessão.txt`.
> Base auditada: `Moreira-bot-2026-junho.bpz` (bot vivo `30d82e81…`, auditado 06/06).
> Pricing reconfirmado na doc Botpress em 06/06 (mudou em 14/05/2026 — ver notas).
> Material reaproveitado: `resposta-moreira-v3.md` (26/04), com números actualizados.

---

## Notas internas (não enviar)

- **Q1:** bug real confirmado — caminho EN sem `mailto:` (linha 5182, nó `nd-d3e1d24fd9`). PT correcto (linha 4825). Instrução = passo a passo, sem interferirmos.
- **Q2/Q3:** pricing Botpress mudou em 14/05/2026. Workspaces existentes mantêm o modelo antigo; novos (pós-14/05) têm: free = 3 agents / 100 conversas/mês, planos pagos com bots ilimitados, cobrança por conversa. A conta do Moreira é de Abril → provavelmente modelo antigo (1 bot free). Por isso a resposta dá o essencial sem o afogar em "antigo vs novo" — e sugere-lhe confirmar o plano dele no billing.
- **Q4:** auditoria estática diz apresentável + fix Q1. "Always Alive" está desligado (bot adormece → 1ª resposta lenta). Teste funcional ao vivo recomendado mas não bloqueante.
- **Q5:** FEITO e LIVE (06/06). Trocado o `configUrl` do iframe em `04-landing/index.html:1929` (23/03 morto 403 → 11/05 vivo 200, botId `30d82e81`). Commit `8c25dcaf`, redeploy Vercel CLI (`vercel --prod`, não auto-deploy on push). Produção confirmada por curl. Falta só o domínio próprio (pedir escolha ao Moreira; sugestão `josemoreira.pt`).

---

## EMAIL FINAL (pronto a copiar)

Olá José,

Obrigado pela atualização — e fez tudo certo: o ficheiro está bem, os contactos estão lá e as correções anteriores estão fechadas. Vou às suas cinco questões, uma a uma.

**1. Contactos (email e WhatsApp)**

Estão configurados e funcionais. Há só um pormenor no **caminho inglês**: o botão de email não abre o programa de email porque falta um prefixo no link. No caminho português você já o fez bem, por isso é só replicar.

Passo a passo (2 minutos):

1. No bot, clique em **Edit in studio** (botão azul, canto superior direito).
2. Vá à mensagem de contactos da **versão inglesa** — a mesma onde pôs o email e o WhatsApp, mas em inglês. Começa por *"You can also reach us directly:"*. (Se tiver a barra de pesquisa do Studio, procure por `Send Email` que cai logo lá.)
3. Clique nessa mensagem e encontre a linha:
   `[Send Email](Josemmoreira1@gmail.com)`
4. Mude **só** para:
   `[Send Email](mailto:Josemmoreira1@gmail.com)`
   (é só acrescentar `mailto:` antes do email — igual ao que já tem no português)
5. **Não mexa em mais nada** — WhatsApp, horário e o caminho português estão todos bem.
6. Clique em **Publish** para a alteração entrar em produção.

Para confirmar: abra o chat, fale em inglês até aparecerem os contactos e clique em **Send Email**. Se abrir o seu programa de email com o endereço preenchido, está resolvido.

**2. Vários bots (um por empresa) e plano**

Sim, é possível: pode usar este ficheiro como modelo e importá-lo como bots separados, um por empresa, cada um com a sua própria configuração e o seu próprio token do Airtable.

O limite está no plano, não no ficheiro. Na sua conta atual tem direito a 1 bot no plano gratuito. Para servir vários clientes há dois caminhos:

- **Recomendado:** cada cliente cria a conta dele no Botpress (gratuita) e você entra como colaborador. Assim cada empresa tem o seu bot e a sua faturação, e você escala sem ter de fazer upgrade. É também mais limpo em termos de propriedade dos dados.
- **Alternativa:** ter tudo na sua conta com upgrade ao plano **Plus (89 USD/mês)**, que já inclui bots ilimitados. Faz sentido quando quiser tudo centralizado.

Nota útil: o Botpress mudou o modelo de preços em maio. O que mais pesa na fatura não é o número de bots — é o **consumo de IA** (cada conversa gasta crédito). Vale a pena, quando entrar no Studio, ver no separador de faturação qual o plano ativo na sua conta, para sabermos com que limites está a trabalhar.

**3. Envio de mensagens diretas**

Está correto. Enviar mensagens diretas/proativas ao cliente, e o atendimento humano ao vivo dentro do próprio chat (handoff), são funcionalidades de **plano pago** (Plus). No plano gratuito, o caminho é o que já tem: o cliente usa os contactos (email/WhatsApp) para falar consigo fora do chat.

**4. Já está pronto para apresentar a empresas?**

Sim — com uma condição e uma recomendação:

- **Condição:** fazer primeiro a correção do ponto 1 (email inglês).
- **Recomendação:** antes de mostrar a uma empresa, faça um teste rápido de ponta a ponta nos **dois idiomas** (português e inglês), do início até aos contactos, para confirmar que tudo flui ao vivo.

Um aviso prático: o bot está com o "Always Alive" desligado, o que significa que adormece quando está inativo e a primeira resposta demora uns segundos. Para uma apresentação, basta abrir o chat e trocar uma mensagem minutos antes, para o "acordar".

Com isto, está apresentável.

**5. Integração na landing page**

Já está feito. Integrei o seu assistente na página e está a funcionar — abra o link abaixo, desça até à secção do chat e verá o seu bot no ecrã, a responder em português e em inglês. Experimente à vontade e confirme-me só que está tudo a seu gosto.

Link (provisório): https://04-landing-wine.vercel.app/

Uma nota sobre este endereço: é temporário, gerado automaticamente, e não tem a ver com o seu nome. Para o site ficar com a sua cara, falta escolher um domínio próprio — por exemplo `josemoreira.pt`. Diga-me que nome prefere e eu trato de o ligar à página.

Qualquer dúvida em qualquer ponto, diga.

Um abraço,
Eurico
