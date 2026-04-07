#!/usr/bin/env node
'use strict';

/**
 * sync-aiox-core.js — Auto-sync .aiox-core/ from npm registry
 *
 * Triple protection:
 * 1. npm postinstall — runs after every npm install
 * 2. husky post-merge — runs after every git pull
 * 3. npm run sync:core — manual trigger
 *
 * Preserves L3 project-specific files (entity-registry, core-config, agent MEMORY).
 * Zero external dependencies — uses only Node.js stdlib.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AIOX_CORE_DIR = path.join(ROOT, '.aiox-core');
const ROOT_PKG = path.join(ROOT, 'package.json');
const SYNCED_VERSION_FILE = path.join(AIOX_CORE_DIR, '.synced-version');

// L3 files to preserve during sync (project-specific, never overwrite)
const L3_PRESERVE = [
  'data/entity-registry.yaml',
  'core-config.yaml',
  'local-config.yaml',
];

// Agent MEMORY files pattern
const AGENT_MEMORY_GLOB = 'development/agents/*/MEMORY.md';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, prefix, msg) {
  console.log(`${color}${prefix}${COLORS.reset} ${msg}`);
}

function getLocalVersion() {
  try {
    // Read from .synced-version marker file (written after each successful sync)
    return fs.readFileSync(SYNCED_VERSION_FILE, 'utf8').trim();
  } catch {
    return '0.0.0';
  }
}

function getExpectedVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getRegistryVersion() {
  try {
    const result = execSync('npm view aiox-core version 2>/dev/null', {
      encoding: 'utf8',
      timeout: 15000,
    }).trim();
    return result || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function preserveL3Files() {
  const preserved = new Map();

  // Preserve known L3 files
  for (const relPath of L3_PRESERVE) {
    const absPath = path.join(AIOX_CORE_DIR, relPath);
    if (fs.existsSync(absPath)) {
      preserved.set(relPath, fs.readFileSync(absPath));
    }
  }

  // Preserve agent MEMORY files
  const agentsDir = path.join(AIOX_CORE_DIR, 'development', 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir, { withFileTypes: true });
    for (const entry of agents) {
      if (entry.isDirectory()) {
        const memoryPath = path.join('development', 'agents', entry.name, 'MEMORY.md');
        const absPath = path.join(AIOX_CORE_DIR, memoryPath);
        if (fs.existsSync(absPath)) {
          preserved.set(memoryPath, fs.readFileSync(absPath));
        }
      }
    }
  }

  return preserved;
}

function restoreL3Files(preserved) {
  for (const [relPath, content] of preserved) {
    const absPath = path.join(AIOX_CORE_DIR, relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absPath, content);
  }
}

function syncFromNpm(targetVersion) {
  const tmpDir = path.join(ROOT, '.aiox-sync-tmp');

  try {
    // Clean tmp
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });

    log(COLORS.cyan, '[SYNC]', `Downloading aiox-core@${targetVersion} from npm...`);
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"private":true}');
    execSync(`npm install aiox-core@${targetVersion} --prefix "${tmpDir.replace(/\\/g, '/')}"`, {
      encoding: 'utf8',
      timeout: 120000,
      stdio: 'pipe',
    });

    const sourceDir = path.join(tmpDir, 'node_modules', 'aiox-core', '.aiox-core');
    if (!fs.existsSync(sourceDir)) {
      throw new Error('.aiox-core/ not found in installed package');
    }

    const rootSourceDir = path.join(tmpDir, 'node_modules', 'aiox-core');

    // Preserve L3 files
    log(COLORS.cyan, '[SYNC]', 'Preserving project-specific files (L3)...');
    const preserved = preserveL3Files();

    // Remove old .aiox-core content and copy new
    log(COLORS.cyan, '[SYNC]', 'Replacing .aiox-core/ with new version...');
    const items = fs.readdirSync(AIOX_CORE_DIR);
    for (const item of items) {
      const itemPath = path.join(AIOX_CORE_DIR, item);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }

    // Copy new files recursively
    copyDirRecursive(sourceDir, AIOX_CORE_DIR);

    // Also update root-level files (bin/, scripts/)
    const rootFiles = ['bin', 'scripts'];
    for (const dir of rootFiles) {
      const src = path.join(rootSourceDir, dir);
      const dst = path.join(ROOT, dir);
      if (fs.existsSync(src)) {
        copyDirRecursive(src, dst);
      }
    }

    // NEVER overwrite root package.json — it has project-specific scripts
    // (postinstall, sync:core, etc.) that the npm package doesn't include.
    // Only .aiox-core/, bin/ and scripts/ are synced.

    // Restore L3 files
    log(COLORS.cyan, '[SYNC]', `Restoring ${preserved.size} project-specific files...`);
    restoreL3Files(preserved);

    // Write version marker so next run knows we're up to date
    fs.writeFileSync(SYNCED_VERSION_FILE, targetVersion);

    log(COLORS.green, '[SYNC]', `Successfully updated to aiox-core@${targetVersion}`);

    // Run IDE sync if available
    try {
      log(COLORS.cyan, '[SYNC]', 'Running IDE sync...');
      execSync('npm run sync:ide', { cwd: ROOT, encoding: 'utf8', timeout: 30000, stdio: 'pipe' });
      log(COLORS.green, '[SYNC]', 'IDE sync complete');
    } catch {
      log(COLORS.yellow, '[WARN]', 'IDE sync skipped (non-critical)');
    }

    return true;
  } catch (error) {
    log(COLORS.red, '[ERROR]', `Sync failed: ${error.message}`);
    return false;
  } finally {
    // Clean tmp
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force');
  const checkOnly = args.includes('--check');
  const quiet = args.includes('--quiet');

  const localVersion = getLocalVersion();
  const expectedVersion = getExpectedVersion();

  if (!quiet) {
    log(COLORS.cyan, '[AIOX]', `Local .aiox-core version: ${localVersion}`);
    log(COLORS.cyan, '[AIOX]', `Expected version (package.json): ${expectedVersion}`);
  }

  // Check if local matches expected
  if (localVersion === expectedVersion && !forceFlag) {
    if (!quiet) {
      log(COLORS.green, '[OK]', `.aiox-core is up to date (v${localVersion})`);
    }
    process.exit(0);
  }

  // Version mismatch detected
  log(COLORS.yellow, '[MISMATCH]', `Local: v${localVersion} | Expected: v${expectedVersion}`);

  if (checkOnly) {
    log(COLORS.red, '[OUTDATED]', '.aiox-core needs update. Run: npm run sync:core');
    process.exit(1);
  }

  // Check registry for latest
  const registryVersion = getRegistryVersion();
  if (registryVersion !== '0.0.0') {
    log(COLORS.cyan, '[REGISTRY]', `Latest on npm: v${registryVersion}`);
  }

  // Determine target version: use expected (from root package.json)
  const targetVersion = expectedVersion;

  // Sync
  const success = syncFromNpm(targetVersion);
  process.exit(success ? 0 : 1);
}

main();
