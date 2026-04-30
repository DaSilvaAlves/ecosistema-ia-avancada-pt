# Rascunho Q2 validado — SKIP NO APOIO HUMANO

> **Estado:** Aprovado pelo Eurico em 21/04/2026 (sessão ux-design-expert).
> Fonte técnica: bot.json linhas 4491-4917 + doc oficial Botpress capture-information.
> Este ficheiro é o texto pronto a incluir na resposta final ao Moreira.
> Não sobrescrever sem nova aprovação.

---

## Q2. SKIP NO APOIO HUMANO — permitir saltar o upload e avançar para o agente

### O que está a acontecer no bot hoje

No nó `Apoio_Humano_PT` há duas perguntas em sequência:

1. Primeiro pede a descrição da dúvida: *"Por favor, descreva a sua dúvida."*
2. Depois pede o ficheiro: *"Se desejar, pode anexar aqui um print screen ou documento sobre o problema."*

O texto diz "se desejar" — sugere opcional. Mas tecnicamente o capture File do Botpress é **estrito**: só aceita URL de ficheiro. Se o utilizador escrever "não tenho", "skip" ou qualquer texto, o capture não reconhece, pede outra vez, e após 2 retries fica sem saída definida (a sua configuração tem `handleFailure: false`). Ou seja, o prompt **convida** a anexar, mas o motor **exige** um upload para avançar. É por isso que o utilizador encalha.

Isto confirma-se na documentação oficial do Botpress: o capture File não tem botão nativo de "skip".

### A mesma coisa acontece no `Human_Support_EN`

Os dois nodes são gémeos — mesmo padrão, mesma variável de ficheiro partilhada. Qualquer correcção tem de ser feita em **ambos**, senão a versão inglesa fica inconsistente. Menciono já para não se esquecer no Studio.

### Solução recomendada — Choice antes do File

Adicionar um **Capture Information → Choice** antes do capture File actual, com botões claros:

- Pergunta: *"Quer anexar um print ou documento sobre o problema?"*
- Opção 1 (label): **"Sim, quero anexar"** → value: `sim`
- Opção 2 (label): **"Não, seguir para o agente"** → value: `nao`

Depois configurar a transição condicional:
- Se o utilizador escolher **"Não"** → transição directa para a mensagem *"Um assistente entrará no chat em breve."* (saltar o capture File)
- Se escolher **"Sim"** → continua para o capture File como já está

Assim o utilizador tem controlo explícito: ou anexa, ou pressiona um botão e vai directo para o atendimento. Sem texto livre, sem confusão com o motor.

**No Studio (passos concretos):**

1. Abrir o flow `wf-main`, nó `Apoio_Humano_PT`
2. Entre a 2ª instrução (o capture File actual) e a mensagem "Um assistente entrará no chat em breve", **inserir uma nova instrução Capture Information** com:
   - **Question:** "Quer anexar um print ou documento sobre o problema?"
   - **Choices** (ligar o toggle): adicionar as duas opções acima
3. Mover o capture File para dentro do ramo "Sim" do Choice (transição condicional). Assim só dispara se o utilizador escolher anexar
4. Repetir tudo no `Human_Support_EN` com os textos em inglês
5. Guardar e testar no emulador em ambos os caminhos (sim/não)

Tempo estimado: 20 a 30 minutos para os dois nós.

### Alternativa mais simples — activar `handleFailure`

Se não quiser adicionar o Choice, a via mínima é:

1. No capture File, ligar a flag **"Add transition to handle failure"** (`handleFailure: true` no JSON)
2. Definir a failure transition para o mesmo sítio onde já vai o caminho "sim" (a mensagem de assistente)

Com isto, se o utilizador não conseguir anexar após as 2 tentativas de retry, o bot avança em vez de encalhar. É mais rápido de implementar mas a UX é pior — o utilizador passa por 3 prompts antes de seguir em frente. Recomendo só se não quiser tocar na estrutura do nó.

### Para quando replicar noutros clientes

O padrão Choice antes do capture File deve fazer parte do **esqueleto mestre** desde o início. Cada cliente herda já esta UX, sem ter de decidir caso a caso. Pode ficar no seu template Botpress exportável como regra: *"qualquer capture File sempre precedido de Choice Sim/Não"*.

### O que NÃO precisa fazer

Não precisa de alterar o capture File em si — só inserir um Choice antes. E não existe "flag optional" para ligar no capture File — isso não existe no Botpress v3 (já confirmei na doc oficial). Se alguém lhe propuser essa via, vai perder tempo a procurar algo que não está no produto.
