#!/usr/bin/env node
// Governance Lint (Node ESM, zero-deps)
// - Validates task-condition keywords against the canonical intent lexicon
// - Lints verification TEST commands for governance compliance (no network, no jq/yq, no state mutation)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STANDARDS_DIR = join(ROOT, 'docs', 'standards');
const LEXICON_PATH = join(STANDARDS_DIR, '_meta', 'intent-lexicon.json');

function fail(msg) { console.error(`ERROR: ${msg}`); }
function warn(msg) { console.warn(`WARN: ${msg}`); }
function info(msg) { console.log(`INFO: ${msg}`); }

const mdFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (s.isFile() && name.endsWith('.md')) {
      mdFiles.push(p);
    }
  }
}

try { statSync(STANDARDS_DIR); } catch { fail('docs/standards not found'); process.exit(1); }
walk(STANDARDS_DIR);
info(`Scanning ${mdFiles.length} Markdown files under standards.`);

// Load lexicon
let lex;
try {
  lex = JSON.parse(readFileSync(LEXICON_PATH, 'utf8'));
} catch (e) {
  fail(`Failed to load intent lexicon at ${relative(ROOT, LEXICON_PATH)}: ${e.message}`);
  process.exit(1);
}

const allowed = new Set();
for (const it of lex.intents || []) {
  if (it.key) {
    allowed.add(String(it.key).toLowerCase());
  }
  if (Array.isArray(it.synonyms)) {
    for (const s of it.synonyms) {
      allowed.add(String(s).toLowerCase());
    }
  }
}

let errors = 0;

// 1) task-condition keyword validation
const ROOT_DISPATCHER = join(STANDARDS_DIR, 'standards.md');
const condRe = /<conditional-block\s+[^>]*task-condition="([^"]+)"/g;

function validateConditions(content, filePath, { warnOnly = false } = {}) {
  let match = condRe.exec(content);
  while (match) {
    const tokens = match[1].split('|').map((t) => t.trim().toLowerCase()).filter(Boolean);
    for (const t of tokens) {
      if (!allowed.has(t)) {
        const msg = `Unknown task-condition keyword '${t}' in ${relative(ROOT, filePath)} (not in lexicon)`;
        if (warnOnly) {
          warn(msg);
        } else {
          fail(msg);
          errors += 1;
        }
      }
    }
    match = condRe.exec(content);
  }
}

// Root dispatcher → error on unknowns
validateConditions(readFileSync(ROOT_DISPATCHER, 'utf8'), ROOT_DISPATCHER, { warnOnly: false });

// Category dispatchers → enforce (errors)
for (const f of mdFiles) {
  if (f === ROOT_DISPATCHER) {
    continue;
  }
  const txt = readFileSync(f, 'utf8');
  if (/Category Dispatcher/i.test(txt)) {
    validateConditions(txt, f, { warnOnly: false });
  }
}

// 2) verification governance lint
const vblockRe = /<verification-block[\s\S]*?<\/verification-block>/g;
const testLineRe = /\n\s*TEST:\s*(.+)/g;
const disallowed = [
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bjq\b/i,
  /\byq\b/i,
  /\|\s*tee\b/i, // writing via tee
  /\bgit\s+(push|commit|fetch|merge|rebase)\b/i,
  /(npm|pnpm|yarn)\s+(install|add)\b/i,
  /\bsed\s+-i\b/i,
];

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  let vbMatch = vblockRe.exec(content);
  while (vbMatch) {
    testLineRe.lastIndex = 0;
    let tlMatch = testLineRe.exec(vbMatch[0]);
    while (tlMatch) {
      const cmd = tlMatch[1].trim();
      for (const rx of disallowed) {
        if (rx.test(cmd)) {
          fail(`Governance violation in TEST command at ${relative(ROOT, file)}: '${cmd}'`);
          errors++;
          break;
        }
      }
      tlMatch = testLineRe.exec(vbMatch[0]);
    }
    vbMatch = vblockRe.exec(content);
  }
}

if (errors > 0) {
  console.error(`\nGovernance lint failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('\nGovernance lint passed.');
