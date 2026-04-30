# Rascunho Q1 validado — UPLOAD QUE SOME

> **Estado:** Aprovado pelo Eurico em 21/04/2026 (sessão ux-design-expert).
> Fonte: `handoffs/RETOMA-20260421-q1-validada-q2-q5-pendentes.md` linhas 190-233.
> Este ficheiro é o texto pronto a incluir na resposta final ao Moreira.
> Não sobrescrever sem nova aprovação.

---

## Q1. UPLOAD QUE SOME — O ícone aparece em modo anónimo, desaparece em navegação normal

### O que está correcto no seu lado

Confirmei a configuração pública do seu webchat (o ficheiro `20260323112227-A7N2XPSU.json` que o Botpress gera quando publica). A opção **`allowFileUpload`** está **activada**. O **Vision Agent** no bot também está **ligado**. Ou seja, a configuração do lado do bot **está correcta**. Se o ícone aparece em modo anónimo, é porque o sistema está preparado para o mostrar — o código sabe que há upload.

### Porque acontece

O padrão "anónimo funciona, normal não" raramente é problema do bot. Em modo anónimo (ou janela privada), o browser:

- Ignora **cache local** (carrega tudo fresh)
- **Desactiva as extensões** por defeito (no Chrome desktop)
- Parte de uma sessão limpa, sem cookies nem localStorage anteriores

Portanto o que está a esconder o ícone em modo normal é quase de certeza **local do seu browser** — ou um ficheiro antigo em cache, ou uma extensão a bloquear elementos em `botpress.cloud`. A configuração do bot está bem.

### Plano de teste — por ordem, pare assim que resolver

**Se testar em Desktop (Chrome/Edge/Firefox):**

1. No link do chat, fazer **hard reload**: `Ctrl + Shift + R`
2. Se não resolver: `F12` > separador **Application** > **Storage** > **Clear site data** (para `botpress.cloud` e `bpcontent.cloud`) > reabrir link
3. Se não resolver: abrir o **mesmo link noutro browser** onde não tem extensões instaladas (Edge ou Firefox limpos). Se o ícone aparecer, a causa é uma extensão no Chrome — as suspeitas habituais são uBlock Origin, AdBlock Plus, Privacy Badger, Ghostery

**Se testar em Chrome Android (mobile):**

1. Menu (3 pontos) > **Settings** > **Privacy and security** > **Clear browsing data** > escolher **Cached images and files** e **Cookies and site data** (últimas 24h chega). Fechar a aba. Reabrir o link do chat. Testar
2. Se não resolver: instalar temporariamente o **Firefox** ou **Edge** no telemóvel e abrir o mesmo link. Se aparecer, é cache-específica do Chrome

**Se mesmo assim falhar:**

Aí sim é bug do widget Botpress v3.6 — mas é residual. Nesse caso abrimos ticket no suporte Botpress com os passos reproduzidos. A configuração do seu bot está correcta, portanto o ónus é deles.

### O que NÃO precisa de fazer

Não precisa de voltar ao Studio para "activar" a opção de upload — **já está activa**. E não há nenhuma regra do Botpress que desactive upload só para utilizadores identificados (isso não existe). Se alguém lhe sugerir mexer na configuração do bot para resolver isto, está a procurar no sítio errado.

### Para quando replicar noutros clientes

Este não é bug do seu bot em particular — é o mesmo comportamento que vai ver em qualquer chatbot Botpress publicado via shareable URL. Para as próximas replicações, a única nota é: **confirmar no Studio que `allowFileUpload` está ligado** antes de publicar o bot para o cliente. Fica como item de checklist de entrega — não precisa de fix especial.

Quando fizer os testes, diga-me em que passo resolveu — isso ajuda-me a construir a checklist de diagnóstico para os próximos bots dos seus clientes.
