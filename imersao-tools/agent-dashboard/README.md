# AIOX Agent Arena — Manual de Instruções

> Dashboard gamificado de monitorização de agentes IA em tempo real.
> Pixel Art • WebSocket • Observabilidade visual do ecossistema AIOX.

---

## Índice

1. [O que é](#o-que-é)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Arranque](#arranque)
5. [Como funciona](#como-funciona)
6. [Interface](#interface)
7. [Eventos e protocolo](#eventos-e-protocolo)
8. [Hooks do Claude Code](#hooks-do-claude-code)
9. [Testar manualmente](#testar-manualmente)
10. [Resolução de problemas](#resolução-de-problemas)
11. [Arquitectura](#arquitectura)
12. [Portas e endpoints](#portas-e-endpoints)

---

## O que é

O AIOX Agent Arena é um dashboard de observabilidade que mostra a actividade dos agentes AIOX (Dex, Quinn, Aria, etc.) numa interface gamificada com estética Pixel Art.

Quando activas `@dev` no Claude Code, o boneco do Dex começa a trabalhar no dashboard. Quando o Quinn faz review, vê-lo a andar até à posição de trabalho. Tudo em tempo real.

**Princípio CLI First:** O dashboard OBSERVA — nunca controla. Toda a acção real acontece no CLI.

---

## Requisitos

| Requisito | Versão |
|-----------|--------|
| Node.js | >= 18 |
| npm | >= 9 |
| Browser moderno | Chrome, Firefox, Edge |

---

## Instalação

```bash
cd imersao-tools/agent-dashboard
npm install
```

Isto instala a dependência `ws` (WebSocket server).

---

## Arranque

### 1. Iniciar o servidor

```bash
cd imersao-tools/agent-dashboard
npm run dashboard
```

Output esperado:

```
⚔ AIOX Agent Arena — WebSocket Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WS:   ws://localhost:5195
HTTP: http://localhost:5195/event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Waiting for connections...
```

### 2. Abrir o dashboard

Abrir no browser:

```
imersao-tools/agent-dashboard/index.html
```

Ou via terminal:

```bash
start imersao-tools/agent-dashboard/index.html
```

### 3. Verificar conexão

O dashboard deve mostrar:

- **CONNECTED** — ligação WebSocket activa
- Se mostrar **DESCONECTADO** — o servidor não está a correr

---

## Como funciona

```
Claude Code (hooks) ──POST──> Servidor (porta 5195) ──WS──> Dashboard (browser)
```

1. Escreves `@dev *develop story-2.1` no Claude Code
2. O hook `arena-hook.cjs` detecta a activação do `@dev`
3. O hook faz POST para `http://localhost:5195/event`
4. O servidor recebe e retransmite via WebSocket
5. O dashboard anima o Dex: recebe ordem → anda → trabalha → resultado

---

## Interface

### Título

`AIOX AGENT ARENA` — com estado de conexão e contagem de agentes activos.

### Painel de comando

Dropdown de agentes + campo de texto + botão DISPATCH.
Quando ligado ao servidor, o dispatch envia um evento real via WebSocket.

### Canvas (área principal)

- **Chief** centrado no topo com coroa e aura dourada
- **10 agentes** dispostos em 2 linhas
- **Chão** de tiles pixel art (erva e pedra)
- **Partículas** em eventos de sucesso/erro
- **Linhas tracejadas** quando o Chief envia ordens

### Event Log

Últimos 15 eventos em formato RPG com cores por tipo de evento.

### Estatísticas

Tasks concluídas, falhadas, enviadas e uptime da sessão.

---

## Eventos e protocolo

### Formato do evento (JSON)

```json
{
  "event": "agent_status",
  "agentId": "dev",
  "agentName": "Dex",
  "status": "working",
  "command": "develop story-2.1",
  "message": "Implementing feature",
  "timestamp": "2026-03-31T12:00:00Z"
}
```

### Tipos de evento

| event | Descrição |
|-------|-----------|
| `agent_activate` | Agente activado via @mention |
| `agent_status` | Mudança de estado do agente |
| `agent_complete` | Agente completou tarefa |
| `agent_error` | Agente encontrou erro |
| `dispatch` | Ordem enviada pelo Chief/utilizador |

### Estados do agente

| status | Visual no dashboard |
|--------|---------------------|
| `idle` | Respiração suave, olhos brancos |
| `working` | Braços rápidos, olhos amarelos, partículas |
| `success` | Braço levantado, olhos verdes, estrelas |
| `error` | Tremor, olhos vermelhos, "!" sobre a cabeça |

### IDs dos agentes

| agentId | Nome | Cor |
|---------|------|-----|
| `dev` | Dex | Cyan |
| `qa` | Quinn | Lima |
| `architect` | Aria | Roxo |
| `pm` | Morgan | Laranja |
| `po` | Pax | Teal |
| `sm` | River | Azul |
| `analyst` | Alex | Rosa |
| `data-eng` | Dara | Vermelho |
| `ux` | Uma | Magenta |
| `devops` | Gage | Verde |

---

## Hooks do Claude Code

O ficheiro `.claude/hooks/arena-hook.cjs` detecta automaticamente padrões nos prompts enviados ao Claude Code:

| Padrão detectado | Evento enviado |
|------------------|----------------|
| `@dev` | `agent_activate` → agentId: `dev` |
| `@qa *review` | `agent_activate` → agentId: `qa`, command: `*review` |
| `/AIOX:agents:architect` | `agent_activate` → agentId: `architect` |
| `*develop story-2.1` | Comando detectado no contexto do agente activo |
| `Dex` (nome da persona) | `agent_activate` → agentId: `dev` |

O hook é **silencioso** — se o servidor não estiver a correr, não afecta o Claude Code de forma alguma.

### Registar o hook em `.claude/settings.json`

Para activar o hook, adicionar ao array `hooks` → `UserPromptSubmit` em `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/arena-hook.cjs"
          }
        ]
      }
    ]
  }
}
```

---

## Testar manualmente

### Enviar evento via curl

```bash
# Activar o Dex
curl -X POST http://localhost:5195/event \
  -H "Content-Type: application/json" \
  -d '{"event":"agent_status","agentId":"dev","agentName":"Dex","status":"working","command":"develop story-2.1"}'

# Quinn completa review
curl -X POST http://localhost:5195/event \
  -H "Content-Type: application/json" \
  -d '{"event":"agent_status","agentId":"qa","agentName":"Quinn","status":"success","command":"qa-gate"}'

# Erro no Gage
curl -X POST http://localhost:5195/event \
  -H "Content-Type: application/json" \
  -d '{"event":"agent_status","agentId":"devops","agentName":"Gage","status":"error","command":"deploy_staging"}'

# Aria em modo idle
curl -X POST http://localhost:5195/event \
  -H "Content-Type: application/json" \
  -d '{"event":"agent_status","agentId":"architect","agentName":"Aria","status":"idle"}'
```

### Verificar saúde do servidor

```bash
curl http://localhost:5195/health
```

### Ver estado dos agentes

```bash
curl http://localhost:5195/agents
```

### Testar o hook directamente

```bash
echo '{"input":"@dev *develop story-2.1"}' | node .claude/hooks/arena-hook.cjs
```

O hook deve terminar silenciosamente em menos de 2 segundos (com ou sem servidor a correr).

---

## Resolução de problemas

### Dashboard mostra "DESCONECTADO"

| Causa | Solução |
|-------|---------|
| Servidor não está a correr | `cd imersao-tools/agent-dashboard && npm run dashboard` |
| Porta 5195 ocupada | `netstat -ano \| findstr :5195` — verificar e libertar |
| Firewall a bloquear | Permitir Node.js no firewall do Windows |

### Agentes não animam quando escrevo `@dev`

| Causa | Solução |
|-------|---------|
| Hook não registado | Verificar entrada `arena-hook.cjs` em `.claude/settings.json` |
| Servidor sem clientes | `curl http://localhost:5195/health` — `clients` deve ser > 0 |
| agentId incorrecto | Verificar tabela de IDs acima |
| Dashboard não está aberto | Abrir `index.html` no browser antes de enviar eventos |

### Servidor não arranca

```bash
# Verificar se a porta está livre
netstat -ano | findstr :5195

# Verificar Node.js
node --version  # deve ser >= 18

# Verificar dependências
cd imersao-tools/agent-dashboard && npm install

# Verificar package.json tem o script "dashboard"
cat imersao-tools/agent-dashboard/package.json
```

### Hook não faz nada (sem erros)

O comportamento correcto quando o servidor não está a correr é precisamente esse: silêncio total. Para confirmar que o hook detecta agentes:

```bash
# Com servidor a correr — deve aparecer no dashboard
echo '{"input":"@qa *review"}' | node .claude/hooks/arena-hook.cjs

# Sem servidor — termina silenciosamente (exit 0)
echo '{"input":"@dev *develop"}' | node .claude/hooks/arena-hook.cjs ; echo "exit: $?"
```

---

## Arquitectura

```
┌──────────────────────────────────────────────────┐
│                  Claude Code CLI                  │
│                                                  │
│  @dev *develop → arena-hook.cjs → HTTP POST      │
└──────────────────────┬───────────────────────────┘
                       │ POST /event
                       ▼
┌──────────────────────────────────────────────────┐
│              server.js (porta 5195)              │
│                                                  │
│  HTTP POST /event  →  WebSocket broadcast        │
│  GET /health       →  Estado do servidor         │
│  GET /agents       →  Estado dos agentes         │
└──────────────────────┬───────────────────────────┘
                       │ WebSocket ws://localhost:5195
                       ▼
┌──────────────────────────────────────────────────┐
│              index.html (browser)                │
│                                                  │
│  Canvas • Sprites • Partículas • Event Log       │
│  Estatísticas • Painel de comando                │
└──────────────────────────────────────────────────┘
```

### Ficheiros

| Ficheiro | Descrição |
|----------|-----------|
| `server.js` | Servidor Node.js — HTTP + WebSocket |
| `index.html` | Dashboard (Canvas 2D, pixel art, WebSocket client) |
| `package.json` | Dependências (`ws`) e script `dashboard` |
| `.claude/hooks/arena-hook.cjs` | Hook Claude Code — detecta agentes e faz POST |

---

## Portas e endpoints

| Porta | Protocolo | Endpoint | Descrição |
|-------|-----------|----------|-----------|
| 5195 | HTTP | `POST /event` | Receber eventos de agentes |
| 5195 | HTTP | `GET /health` | Estado do servidor e clientes ligados |
| 5195 | HTTP | `GET /agents` | Estado actual de todos os agentes |
| 5195 | WebSocket | `ws://localhost:5195` | Conexão em tempo real do dashboard |

**Nota:** A porta 5195 está reservada exclusivamente para o Agent Arena. Ver `imersao-pipeline-rules.md` para a lista completa de portas reservadas do ecossistema.

---

## Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| V1 | 31/03/2026 | Demo visual com mock WebSocket |
| V2 | 31/03/2026 | WebSocket real + servidor HTTP + hooks Claude Code |

---

*AIOX Agent Arena — Observabilidade gamificada do ecossistema AIOX.*
*CLI First — O dashboard observa, nunca controla.*
