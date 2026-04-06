# Prompt Original — AIOX Agent Arena

**Utilizado em:** 31/03/2026
**Resultado:** Agent Arena V2 (1.928 linhas, index.html autocontido)
**Referência visual:** https://github.com/brunosimon/folio-2025

---

## Prompt: Gamified Agent Workflow Dashboard — Pixel Art / Minecraft Theme

### Objectivo geral

Crie um dashboard interativo de orquestração de agentes de IA, totalmente gamificado, com estética Pixel Art inspirada no Minecraft, onde cada agente é representado por um boneco animado que se move, reage e executa tarefas em tempo real via WebSocket.

### Identidade visual

- Estilo: Pixel Art 16x32px por sprite, paleta limitada, bordas nítidas, sem anti-aliasing
- Tema: Minecraft / SeniorIA — tons de verde musgo, marrom madeira, cinza pedra, azul elétrico para highlights de IA
- Background: Mapa isométrico ou top-down com blocos estilo Minecraft (grama, pedra, terra) como "arena" de trabalho
- Tipografia: Fonte pixel (ex: Press Start 2P via Google Fonts)
- HUD: Barras de vida/energia para cada agente, badges de status, log de eventos estilo RPG

### Anatomia dos bonecos (sprites animados)

Cada agente deve possuir partes independentemente animáveis:

```
[CABEÇA]     → rotaciona para a direção do movimento ou alvo
[OLHOS]      → piscam, ficam vermelhos (erro), amarelos (processando), verdes (sucesso)
[TRONCO]     → base fixa com "logo" do agente (ícone de função)
[BRAÇO ESQ]  → oscila durante caminhada, aponta ao executar tarefa
[BRAÇO DIR]  → idem, levanta ao "entregar" resultado
[PERNA ESQ]  → animação de passo sincronizada
[PERNA DIR]  → idem, alternada
```

Estados de animação obrigatórios:

| Estado | Animação |
|--------|----------|
| idle | Respiração suave, olhos piscando lento |
| walking | Pernas alternadas, braços balançando |
| working | Braços se movendo rápido, olhos amarelos |
| success | Braço direito levantado, olhos verdes, partículas |
| error | Tremor, olhos vermelhos, "!" sobre a cabeça |
| receiving_order | Vira para o orquestrador, inclina cabeça |

### Agente orquestrador (topo do canvas)

- Posicionado fixo no centro-topo do mapa, em posição elevada (trono/pedestal de blocos)
- Visual diferenciado: Coroa pixel, tamanho maior (1.5x), aura pulsante azul
- Funções:
  - Emite ordens via painel de comando (input + botão "Dispatch")
  - Recebe resultados de volta via WebSocket
  - Exibe log de retorno em balão de fala estilo RPG
  - Indicador visual de qual agente está sendo comandado (linha tracejada pulsante)

### Arquitectura WebSocket (tempo real)

Protocolo de eventos esperado (JSON):

```json
// Servidor → Cliente
{
  "event": "agent_move",
  "agentId": "agent-2",
  "from": { "x": 100, "y": 200 },
  "to": { "x": 350, "y": 200 },
  "direction": "right",
  "duration": 1500
}

{
  "event": "agent_status",
  "agentId": "agent-2",
  "status": "working" | "idle" | "success" | "error",
  "message": "Processando tarefa #42"
}

{
  "event": "task_result",
  "agentId": "agent-2",
  "result": "Tarefa concluída com sucesso",
  "timestamp": "2026-03-30T12:00:00Z"
}

// Cliente → Servidor (Ordem do Orquestrador)
{
  "event": "dispatch_order",
  "targetAgentId": "agent-2",
  "command": "execute_task",
  "payload": { "task": "analyze_logs", "priority": "high" }
}
```

Comportamento esperado no frontend:

- Ao receber `agent_move`: boneco inicia animação de caminhada e se desloca com requestAnimationFrame até a posição alvo
- Ao receber `agent_status`: troca animação e cor dos olhos em tempo real
- Ao receber `task_result`: balão de fala aparece sobre o boneco, depois ele "anda" de volta para posição base

### Layout do canvas

```
┌─────────────────────────────────────────────────┐
│         [👑 ORQUESTRADOR — CENTRO TOPO]         │
│              Painel de Comando                   │
├─────────────────────────────────────────────────┤
│                                                 │
│   [🧍 Agent-1]    [🧍 Agent-2]    [🧍 Agent-3] │
│    Executor        Analyzer        Reporter      │
│                                                 │
│         [🧍 Agent-4]    [🧍 Agent-5]            │
│          Monitor          Logger                │
│                                                 │
├─────────────────────────────────────────────────┤
│  📋 EVENT LOG (últimos 10 eventos em tempo real) │
└─────────────────────────────────────────────────┘
```

- Canvas responsivo (mínimo 1280px largura)
- Agentes reposicionam dinamicamente conforme quantidade
- Fundo com grid de blocos Minecraft scrollável

### Requisitos técnicos

**Stack:**
- Frontend: HTML5 Canvas + vanilla JS ou React com `<canvas>` puro
- Sprites: CSS sprite sheet OR canvas `drawImage()` com pixel art gerado proceduralmente
- Animação: `requestAnimationFrame` com delta time para movimento suave entre tiles
- WebSocket: `new WebSocket('ws://seu-servidor/ws')` nativo, com reconexão automática (backoff exponencial)
- Fallback: Se WS cair, exibir indicador "RECONNECTING..." pulsante no HUD

**Extras desejáveis:**
- Partículas pixeladas ao completar tarefas (estrelinhas, moedas)
- Som 8-bit opcional (toggle on/off) para eventos
- Mini-mapa no canto inferior direito mostrando posições de todos os agentes
- Persistência de log via localStorage (últimas 100 entradas)

### Entregável esperado

Um único arquivo `index.html` (ou bundle compacto) funcional e autocontido, que:

1. Renderize o mapa pixel art com todos os agentes
2. Conecte ao WebSocket e reaja a eventos em tempo real
3. Permita ao orquestrador disparar comandos via painel
4. Anime os bonecos com movimentação fluida e estados visuais distintos
5. Exiba log de eventos em tempo real na barra inferior
6. Simule o backend com um WebSocket mock local (usando `setTimeout` + eventos sintéticos) caso o servidor real não esteja disponível, para demonstração completa do fluxo

**Contexto adicional:** Este sistema é parte do SeniorIA — plataforma de engenharia de software gerenciada por IA. O visual gamificado serve como interface de monitoramento em tempo real do orquestrador de agentes Claude Code CLI.

---

## TODO (para V3)

- [ ] Definir URL real do WebSocket backend
- [ ] Mapear os agentes reais (IDs, funções, nomes) para substituir os placeholders
- [ ] Decidir stack final: Canvas puro vs React+Canvas
- [ ] Criar sprite sheet base dos bonecos (ou gerar proceduralmente no canvas)
- [ ] Definir quais eventos do Claude Code CLI serão mapeados para agent_status
- [ ] Dispatch real (botão executa comandos no CLI)
