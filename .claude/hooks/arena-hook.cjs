#!/usr/bin/env node
'use strict';

/**
 * Arena Dashboard Hook — UserPromptSubmit
 *
 * Detects @agent activations and *commands in user prompts,
 * then POSTs events to the AIOX Agent Arena WebSocket server.
 *
 * Silent failure: if the Arena server is not running, this hook
 * does nothing and exits cleanly (zero impact on normal workflow).
 */

const http = require('http');
const fs = require('fs');

// ── Read stdin ──────────────────────────────────────────────────────────────
let stdinData = '';
try {
  stdinData = fs.readFileSync(0, 'utf8');
} catch (_) {
  process.exit(0);
}

if (!stdinData) process.exit(0);

// ── Parse input ─────────────────────────────────────────────────────────────
let input = '';
try {
  const parsed = JSON.parse(stdinData);
  input = (parsed.input || parsed.prompt || parsed.message || '').trim();
} catch (_) {
  process.exit(0);
}

if (!input) process.exit(0);

// ── Agent map ────────────────────────────────────────────────────────────────
const AGENT_MAP = {
  // @mentions
  '@dev': { id: 'dev', name: 'Dex' },
  '@qa': { id: 'qa', name: 'Quinn' },
  '@architect': { id: 'architect', name: 'Aria' },
  '@pm': { id: 'pm', name: 'Morgan' },
  '@po': { id: 'po', name: 'Pax' },
  '@sm': { id: 'sm', name: 'River' },
  '@analyst': { id: 'analyst', name: 'Alex' },
  '@data-engineer': { id: 'data-eng', name: 'Dara' },
  '@ux-design-expert': { id: 'ux', name: 'Uma' },
  '@devops': { id: 'devops', name: 'Gage' },
  '@monster': { id: 'dev', name: 'Monster' }, // routes to dev visually
};

// Persona name → agent (natural language activation)
const PERSONA_MAP = {
  'dex': { id: 'dev', name: 'Dex' },
  'quinn': { id: 'qa', name: 'Quinn' },
  'aria': { id: 'architect', name: 'Aria' },
  'morgan': { id: 'pm', name: 'Morgan' },
  'pax': { id: 'po', name: 'Pax' },
  'river': { id: 'sm', name: 'River' },
  'alex': { id: 'analyst', name: 'Alex' },
  'dara': { id: 'data-eng', name: 'Dara' },
  'uma': { id: 'ux', name: 'Uma' },
  'gage': { id: 'devops', name: 'Gage' },
};

// ── Detection ────────────────────────────────────────────────────────────────

/**
 * Detect agent from input string.
 * Priority: @mention > /AIOX:agents: skill invocation > persona name.
 */
function detectAgent(text) {
  // 1. @mention — match longest key first (e.g. @data-engineer before @dev)
  const mentionKeys = Object.keys(AGENT_MAP).sort((a, b) => b.length - a.length);
  for (const key of mentionKeys) {
    if (text.includes(key)) {
      return AGENT_MAP[key];
    }
  }

  // 2. /AIOX:agents: skill invocations
  const skillMatch = text.match(/\/AIOX:agents:([\w-]+)/i);
  if (skillMatch) {
    const slug = skillMatch[1].toLowerCase();
    // Map skill slug to agent
    const skillToAgent = {
      'dev': { id: 'dev', name: 'Dex' },
      'qa': { id: 'qa', name: 'Quinn' },
      'architect': { id: 'architect', name: 'Aria' },
      'pm': { id: 'pm', name: 'Morgan' },
      'po': { id: 'po', name: 'Pax' },
      'sm': { id: 'sm', name: 'River' },
      'analyst': { id: 'analyst', name: 'Alex' },
      'data-engineer': { id: 'data-eng', name: 'Dara' },
      'ux-design-expert': { id: 'ux', name: 'Uma' },
      'devops': { id: 'devops', name: 'Gage' },
      'monster': { id: 'dev', name: 'Monster' },
      'aiox-master': { id: 'architect', name: 'Orion' },
    };
    if (skillToAgent[slug]) return skillToAgent[slug];
  }

  // 3. Persona name in natural language (word boundary check)
  const lower = text.toLowerCase();
  for (const [name, agent] of Object.entries(PERSONA_MAP)) {
    const re = new RegExp(`\\b${name}\\b`, 'i');
    if (re.test(lower)) {
      return agent;
    }
  }

  return null;
}

/**
 * Extract *command from input (e.g. "*develop", "*qa-gate", "*create-story").
 */
function detectCommand(text) {
  const match = text.match(/\*([a-z][a-z0-9-]*(?:\s+[^\s*]+)*)/i);
  if (match) {
    return `*${match[1].trim()}`;
  }
  return null;
}

// ── Run detection ─────────────────────────────────────────────────────────────
const agent = detectAgent(input);

if (!agent) process.exit(0); // No agent detected — nothing to post

const command = detectCommand(input) || '';

// ── Fire-and-forget POST ──────────────────────────────────────────────────────
function postEvent(data) {
  return new Promise((resolve) => {
    let body;
    try {
      body = JSON.stringify(data);
    } catch (_) {
      resolve();
      return;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 5195,
      path: '/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      // Drain response body to avoid socket hang
      res.resume();
      resolve();
    });

    req.on('error', () => resolve());    // connection refused, etc.
    req.on('timeout', () => {
      req.destroy();
      resolve();
    });

    req.write(body);
    req.end();
  });
}

// Build event payload
const payload = {
  event: 'agent_activate',
  agentId: agent.id,
  agentName: agent.name,
  command: command,
  status: 'working',
  message: `Agent activated via ${input.slice(0, 80)}`,
  timestamp: new Date().toISOString(),
};

// Execute and exit — wrap in async IIFE to use await
(async () => {
  try {
    await postEvent(payload);
  } catch (_) {
    // Swallow all errors — Arena is optional observability
  }
  process.exit(0);
})();
