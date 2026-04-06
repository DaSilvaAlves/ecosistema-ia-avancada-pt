/**
 * AIOX Agent Arena — WebSocket Server v2.0
 * Port: 5195
 * Usage: node server.js OR npm run dashboard
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 5195;
const startTime = Date.now();

// In-memory agent state store
const agentState = new Map();

// Initialize known agent IDs
const KNOWN_AGENTS = ['dev','qa','architect','pm','po','sm','analyst','data-eng','ux','devops'];
KNOWN_AGENTS.forEach(id => {
  agentState.set(id, { agentId: id, status: 'idle', command: '', message: '', timestamp: new Date().toISOString() });
});

// HTTP + WebSocket server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers for browser fetch
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /event — receive event from Claude Code hooks or dispatch button
  if (req.method === 'POST' && url.pathname === '/event') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const timestamp = payload.timestamp || new Date().toISOString();

        const broadcast = {
          event: 'agent_status',
          agentId: payload.agentId || 'dev',
          agentName: payload.agentName || payload.agentId || 'Unknown',
          status: payload.status || 'working',
          command: payload.command || '',
          message: payload.message || '',
          timestamp,
        };

        // Handle dispatch event type — treat as working
        if (payload.event === 'dispatch') {
          broadcast.event = 'agent_status';
          broadcast.status = 'working';
        } else if (payload.event) {
          // Map event type to status
          const statusMap = {
            agent_activate: 'working',
            agent_command:  'working',
            agent_complete: 'success',
            agent_error:    'error',
          };
          if (statusMap[payload.event]) {
            broadcast.status = payload.status || statusMap[payload.event];
          }
        }

        // Update in-memory state
        if (broadcast.agentId) {
          agentState.set(broadcast.agentId, {
            agentId:   broadcast.agentId,
            agentName: broadcast.agentName,
            status:    broadcast.status,
            command:   broadcast.command,
            message:   broadcast.message,
            timestamp: broadcast.timestamp,
          });
        }

        // Broadcast to all connected WS clients
        const msg = JSON.stringify(broadcast);
        let delivered = 0;
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(msg);
            delivered++;
          }
        });

        const ts = new Date().toISOString().substring(11, 19);
        console.log(`[${ts}] EVENT  ${broadcast.event} → ${broadcast.agentId} (${broadcast.status}) → ${delivered} clients`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, delivered }));
      } catch (err) {
        console.error('Error parsing event:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: wss.clients.size,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    }));
    return;
  }

  // GET /agents — current state of all agents
  if (req.method === 'GET' && url.pathname === '/agents') {
    const agents = Object.fromEntries(agentState);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] CONNECT  client joined — ${wss.clients.size} total`);

  // Send initial state to newly connected client
  const initialState = {
    event: 'initial_state',
    agents: Object.fromEntries(agentState),
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(initialState));

  ws.on('close', () => {
    const ts2 = new Date().toISOString().substring(11, 19);
    console.log(`[${ts2}] DISCONNECT  client left — ${wss.clients.size} remaining`);
  });

  ws.on('error', err => {
    console.error('WS client error:', err.message);
  });

  // Respond to pings
  ws.on('pong', () => { ws.isAlive = true; });
});

// Heartbeat — detect dead connections every 30s
const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('');
    console.log('  AVISO: Porta 5195 ja em uso.');
    console.log('  O servidor Arena ja esta a correr.');
    console.log('');
    console.log('  Para reiniciar:');
    console.log('    1. Fechar o terminal anterior');
    console.log('    2. Ou: taskkill /F /PID (ver com: netstat -ano | findstr :5195)');
    console.log('');
    process.exit(0);
  }
  throw err;
});

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('  AIOX Agent Arena — WebSocket Server');
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  WS:   ws://localhost:${PORT}`);
  console.log(`  HTTP: http://localhost:${PORT}/event`);
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Waiting for connections...');
  console.log('');
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  clearInterval(heartbeat);
  wss.clients.forEach(ws => ws.close());
  server.close(() => process.exit(0));
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
