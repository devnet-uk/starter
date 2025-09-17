#!/usr/bin/env node
// Verification Shim — Node ESM, zero-deps
// Extracts <verification-block> tests from provided standards files,
// substitutes variables, enforces allowlist, executes with timeout,
// and reports pass/fail with optional blocking behavior.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { exec } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const MODE = (args.mode || process.env.VERIFICATION_MODE || 'blocking').toLowerCase();
if (!['blocking', 'advisory'].includes(MODE)) {
  console.error(`Invalid mode '${MODE}'. Use blocking|advisory.`);
  process.exit(1);
}

const filesArg = args.files || '';
if (!filesArg) {
  console.error('Usage: node scripts/verification-shim.mjs --files=path1.md,path2.md [--mode=blocking]');
  process.exit(1);
}

const ROOT = process.cwd();
const files = filesArg.split(',').map((p) => (p.startsWith('/') ? p : join(ROOT, p)));

function read(p) {
  return readFileSync(p, 'utf8');
}

// Very small parser for pseudo-XML verification blocks
function extractVerificationBlocks(content) {
  const blocks = [];
  const reBlock = /<verification-block\s+context-check="([^"]+)">([\s\S]*?)<\/verification-block>/g;
  let blockMatch = reBlock.exec(content);
  while (blockMatch) {
    const ctx = blockMatch[1];
    const body = blockMatch[2];
    const tests = [];
    const reTest = /<test\s+name="([^"]+)">([\s\S]*?)<\/test>/g;
    let testMatch = reTest.exec(body);
    while (testMatch) {
      const name = testMatch[1];
      const text = testMatch[2];
      const getField = (label) => {
        const r = new RegExp(`\\n\\s*${label}:\\s*(.+)`);
        const mm = r.exec(text);
        if (!mm) {
          return undefined;
        }
        const raw = mm[1].trim();
        // Only strip surrounding quotes if both present; otherwise keep as-is
        if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
          return raw.slice(1, -1);
        }
        return raw;
      };
      const parseBool = (v, fallback = false) => (v ? /true/i.test(v) : fallback);
      const parseArray = (v) => {
        if (!v) {
          return [];
        }
        try {
          return JSON.parse(v.replace(/'/g, '"'));
        } catch {
          return [];
        }
      };
      tests.push({
        name,
        TEST: getField('TEST'),
        REQUIRED: parseBool(getField('REQUIRED'), true),
        BLOCKING: parseBool(getField('BLOCKING'), undefined),
        ERROR: getField('ERROR') || 'Test failed',
        FIX_COMMAND: getField('FIX_COMMAND'),
        DESCRIPTION: getField('DESCRIPTION') || '',
        DEPENDS_ON: parseArray(getField('DEPENDS_ON')),
        VARIABLES: parseArray(getField('VARIABLES')),
      });
      testMatch = reTest.exec(body);
    }
    blocks.push({ context: ctx, tests });
    blockMatch = reBlock.exec(content);
  }
  return blocks;
}

function detectVars() {
  const vars = {};
  // Defaults for greenfield repo
  vars.PROJECT_TYPE = process.env.PROJECT_TYPE || 'greenfield';
  vars.PROJECT_PHASES = process.env.PROJECT_PHASES || 'false';
  // Coverage: default greenfield 98
  vars.PROJECT_COVERAGE = process.env.PROJECT_COVERAGE || '98';
  // Package manager detection
  try {
    const names = new Set(readdirSync(ROOT));
    vars.PACKAGE_MANAGER = names.has('pnpm-lock.yaml') ? 'pnpm' : names.has('yarn.lock') ? 'yarn' : 'npm';
  } catch { vars.PACKAGE_MANAGER = 'npm'; }
  // Project name detection: prefer env, fallback to current directory name
  try {
    vars.PROJECT_NAME = process.env.PROJECT_NAME || basename(ROOT);
  } catch { /* noop */ }
  return vars;
}

function substitute(str, vars) {
  return str.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => (vars[k] ?? process.env[k] ?? `
${'${'}${k}}`));
}

const DISALLOWED = [
  /\bcurl\b/, /\bwget\b/, /\bjq\b/, /\byq\b/,
  />\s|>>\s|\|\s*tee\s/, // redirection/write
  /\bgit\s+(push|commit|fetch|rebase|merge)\b/,
  /\bchmod\b/, /\brm\b/, /\bmv\b/, /\binstall\b/,
];
function isAllowedCommand(cmd) {
  for (const rx of DISALLOWED) {
    if (rx.test(cmd)) {
      return false;
    }
  }
  // sed is allowed but not with -i
  if (/\bsed\b/.test(cmd) && /\s-i\b/.test(cmd)) {
    return false;
  }
  return true;
}

function execWithTimeout(cmd, timeoutMs = 30000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs, shell: '/bin/bash' }, (err, stdout, stderr) => {
      resolve({ code: err ? 1 : 0, stdout, stderr, error: err });
    });
  });
}

function topoSort(tests) {
  const nameToTest = new Map(tests.map((t) => [t.name, t]));
  const visited = new Set();
  const temp = new Set();
  const order = [];
  function visit(n) {
    if (visited.has(n)) {
      return;
    }
    if (temp.has(n)) {
      throw new Error(`Cyclic dependency involving '${n}'`);
    }
    temp.add(n);
    const t = nameToTest.get(n);
    (t?.DEPENDS_ON || []).forEach(visit);
    temp.delete(n);
    visited.add(n);
    order.push(n);
  }
  tests.forEach((t) => {
    visit(t.name);
  });
  return order.map((n) => nameToTest.get(n));
}

async function main() {
  const allTests = [];
  for (const f of files) {
    const content = read(f);
    const blocks = extractVerificationBlocks(content);
    blocks.forEach((b) => {
      b.tests.forEach((t) => {
        allTests.push({ ...t, __file: f, __context: b.context });
      });
    });
  }
  if (allTests.length === 0) {
    console.log('No verification tests found in provided files.');
    return;
  }

  const vars = detectVars();
  // Normalize BLOCKING default to REQUIRED when unspecified
  allTests.forEach((t) => {
    if (t.BLOCKING === undefined) {
      t.BLOCKING = !!t.REQUIRED;
    }
  });

  let tests;
  try {
    tests = topoSort(allTests);
  } catch (e) {
    console.error(`Dependency resolution error: ${e.message}`);
    process.exit(1);
  }

  const results = [];
  for (const t of tests) {
    const cmdRaw = substitute(t.TEST || '', vars);
    if (!cmdRaw) {
      results.push({ t, status: 'failed', reason: 'No TEST command' });
      if (MODE === 'blocking' && t.BLOCKING) {
        break;
      }
      continue;
    }
    if (!isAllowedCommand(cmdRaw)) {
      results.push({ t, status: 'failed', reason: 'Command not allowed by governance', cmd: cmdRaw });
      if (MODE === 'blocking' && t.BLOCKING) {
        break;
      }
      continue;
    }
    const { code, stdout, stderr } = await execWithTimeout(cmdRaw, 30000);
    if (code === 0) {
      results.push({ t, status: 'passed' });
      continue;
    }
    const errorMsg = substitute(t.ERROR || 'Test failed', vars);
    results.push({ t, status: 'failed', reason: errorMsg, cmd: cmdRaw, stdout, stderr });
    if (MODE === 'blocking' && t.BLOCKING) {
      break;
    }
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = 0; // not tracking explicit skips here

  if (MODE === 'blocking' && results.some((r) => r.status === 'failed' && r.t.BLOCKING)) {
    console.log('🚨 VERIFICATION FAILURE - BLOCKING MODE');
  } else {
    console.log(MODE === 'advisory' ? 'ℹ️ VERIFICATION RESULTS — ADVISORY MODE' : '🔍 VERIFICATION RESULTS');
  }
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);

  if (failed > 0) {
    console.log('\n=== FAILED TESTS ===');
    for (const r of results.filter((x) => x.status === 'failed')) {
      const origin = relative(ROOT, r.t.__file);
      console.log(`\n❌ ${r.t.name} (from ${origin})`);
      console.log(`   Error: ${r.reason}`);
      if (r.t.FIX_COMMAND) {
        console.log(`   Fix: ${substitute(r.t.FIX_COMMAND, vars)}`);
      }
      if (r.cmd) {
        console.log(`   Command: ${r.cmd}`);
      }
    }
  }

  const blockingFailed = results.some((r) => r.status === 'failed' && r.t.BLOCKING);
  if (MODE === 'blocking' && blockingFailed) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Unexpected error: ${e.message}`);
  process.exit(1);
});
