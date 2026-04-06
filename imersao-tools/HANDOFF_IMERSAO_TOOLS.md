# 🧠 HANDOFF TÉCNICO: PORTAL IMERSÃO AI (Dívida de Estado & Sincronização)

**Data:** 27/02/2026
**Responsável:** Maestro (Audit)
**Diretório:** `C:\Users\XPS\Documents\portal-imersao-ai`

---

## 🚨 DIAGNÓSTICO DA FALHA (O "LIXO" DE MEMÓRIA)
O problema não é apenas o `localStorage`, mas sim a **dessincronização entre o Estado Global e o Estado Local** dos componentes.

### 1. O Vício do StationAnalyst.tsx
O componente `StationAnalyst` inicializa o seu `useState` (formData) apenas uma vez, no **mount**. 
- **Erro:** Quando o `resetContext` é chamado, o Contexto Global limpa, mas o `useState` local do `StationAnalyst` **mantém os valores antigos** porque não é re-inicializado. O utilizador vê o formulário cheio com o projeto anterior.
- **Resquício de Integração:** O código herdado do gerador original ainda procura/salva na chave `imersao-briefing-data`, enquanto o Portal usa `projectContext`. Existem duas fontes da verdade a lutar entre si.

### 2. O Loop do Refinamento
A lógica de `replace('[Refinado pela IA]: ', '')` falha porque o prefixo é adicionado em cada submissão, criando strings como `[Refinado pela IA]: [Refinado pela IA]: ...`.

---

## 🛠️ ARQUITETURA DE CORREÇÃO (MANDATO PARA O PRÓXIMO AGENTE)

O próximo agente **DEVE** seguir estes passos técnicos rigorosos:

1.  **Unificação de Storage:** 
    - Eliminar qualquer referência à chave `imersao-briefing-data`.
    - O portal deve ter **APENAS UM** ponto de persistência: `projectContext`.

2.  **Component Remounting (Atomic Reset):**
    - No `App.tsx`, o componente renderizado deve usar uma `key` dinâmica: `<StationAnalyst key={context.updatedAt} />`.
    - **Porquê?** Isto força o React a destruir o componente antigo e criar um novo com o estado limpo do contexto após o Reset.

3.  **Refatoração do `useState` no Analyst:**
    - Remover a inicialização complexa dentro do `useState`. 
    - Usar um `useEffect` para escutar mudanças no `context` ou, preferencialmente, usar o `key` no componente pai para garantir que o estado local nasce vazio.

4.  **Limpeza Agressiva no resetContext:**
    - O `resetContext` deve fazer `localStorage.clear()` (ou limpar especificamente todas as chaves conhecidas) antes de setar o `INITIAL_CONTEXT`.

---

## 🤖 COMANDO DE ATIVAÇÃO
> "Ative a skill 'dev'. Resolve o bug de persistência no `portal-imersao-ai` seguindo o diagnóstico em `HANDOFF_IMERSAO_TOOLS.md`. Foca na unificação do localStorage e no remounting forçado dos componentes via 'key' para limpar os useStates viciados."
