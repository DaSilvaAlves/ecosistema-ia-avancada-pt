#!/usr/bin/env node
/**
 * AIOX Capabilities Guardian
 *
 * Restores custom capabilities (tasks + agents) that get stripped by
 * `npm run sync:core:force` (which pulls aiox-core@5.0.4 from npm).
 *
 * WHY: The npm package of aiox-core@5.0.4 does not include monster agent
 * and 38 operational tasks (auditor-*, chief-*, mentor-*, oracle-*,
 * resolver-* families + project-status.md). These are critical to the
 * agent execution capabilities for this project.
 *
 * USAGE:
 *   node scripts/aiox-capabilities-guardian.js restore   # Restore missing
 *   node scripts/aiox-capabilities-guardian.js check     # Report only
 *
 * Runs automatically as part of postinstall (AFTER sync-aiox-core.js).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(REPO_ROOT, '.aiox-core-backup-pre-5.0.4-update-20260407-224807');
const TARGET_DIR = path.join(REPO_ROOT, '.aiox-core');

const CANONICAL_TASKS = [
  'auditor-audit.md',
  'auditor-check-constitution.md',
  'auditor-check-standards.md',
  'auditor-compliance-report.md',
  'auditor-design-check.md',
  'auditor-lint-stories.md',
  'auditor-verify-authority.md',
  'chief-ask.md',
  'chief-brief-me.md',
  'chief-coordinate.md',
  'chief-escalate.md',
  'chief-overview.md',
  'chief-preferences.md',
  'chief-route.md',
  'chief-squad-status.md',
  'chief-who-handles.md',
  'mentor-cheat-sheet.md',
  'mentor-explain-workflow.md',
  'mentor-faq.md',
  'mentor-glossary.md',
  'mentor-onboard.md',
  'mentor-teach.md',
  'mentor-walkthrough.md',
  'oracle-compare.md',
  'oracle-explain.md',
  'oracle-how-to.md',
  'oracle-prd-guide.md',
  'oracle-search-kb.md',
  'oracle-trace-requirement.md',
  'oracle-where-is.md',
  'project-status.md',
  'resolver-check-config.md',
  'resolver-diagnose.md',
  'resolver-doctor.md',
  'resolver-fix.md',
  'resolver-health.md',
  'resolver-trace-error.md',
  'resolver-why-blocked.md',
];

const CANONICAL_AGENTS = ['monster.md'];

function log(msg) {
  process.stdout.write(`[guardian] ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[guardian] WARN ${msg}\n`);
}

function checkMissing() {
  const missing = { tasks: [], agents: [] };

  for (const task of CANONICAL_TASKS) {
    const target = path.join(TARGET_DIR, 'development', 'tasks', task);
    if (!fs.existsSync(target)) missing.tasks.push(task);
  }

  for (const agent of CANONICAL_AGENTS) {
    const target = path.join(TARGET_DIR, 'development', 'agents', agent);
    if (!fs.existsSync(target)) missing.agents.push(agent);
  }

  return missing;
}

function restoreFile(relativePath, kind) {
  const source = path.join(BACKUP_DIR, 'development', kind, relativePath);
  const target = path.join(TARGET_DIR, 'development', kind, relativePath);

  if (!fs.existsSync(source)) {
    warn(`backup missing for ${kind}/${relativePath} — cannot restore`);
    return false;
  }

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    return true;
  } catch (err) {
    warn(`failed to restore ${kind}/${relativePath}: ${err.message}`);
    return false;
  }
}

function commandRestore() {
  if (!fs.existsSync(BACKUP_DIR)) {
    warn(`backup directory not found: ${BACKUP_DIR}`);
    warn('cannot restore capabilities — manual intervention required');
    process.exit(1);
  }

  const missing = checkMissing();
  const total = missing.tasks.length + missing.agents.length;

  if (total === 0) {
    log('all 39 canonical capabilities present — nothing to restore');
    return;
  }

  log(`restoring ${missing.tasks.length} tasks + ${missing.agents.length} agents from backup...`);

  let restored = 0;
  for (const task of missing.tasks) {
    if (restoreFile(task, 'tasks')) restored++;
  }
  for (const agent of missing.agents) {
    if (restoreFile(agent, 'agents')) restored++;
  }

  log(`restored ${restored}/${total} capabilities`);
  if (restored < total) {
    warn('some files could not be restored — check backup integrity');
    process.exit(1);
  }
}

function commandCheck() {
  const missing = checkMissing();
  const total = missing.tasks.length + missing.agents.length;

  if (total === 0) {
    log('PASS — all 39 canonical capabilities present');
    return;
  }

  warn(`FAIL — ${total} capabilities missing`);
  if (missing.tasks.length > 0) {
    warn(`tasks (${missing.tasks.length}): ${missing.tasks.join(', ')}`);
  }
  if (missing.agents.length > 0) {
    warn(`agents (${missing.agents.length}): ${missing.agents.join(', ')}`);
  }
  warn('run: node scripts/aiox-capabilities-guardian.js restore');
  process.exit(1);
}

function main() {
  const cmd = process.argv[2] || 'restore';

  switch (cmd) {
    case 'restore':
      commandRestore();
      break;
    case 'check':
      commandCheck();
      break;
    default:
      process.stderr.write(`unknown command: ${cmd}\nusage: node scripts/aiox-capabilities-guardian.js [restore|check]\n`);
      process.exit(2);
  }
}

main();
