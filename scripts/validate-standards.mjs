#!/usr/bin/env node
// EOS Standards Validator (Node ESM, zero-deps)
// Checks:
// 1) Global uniqueness of context-check IDs
// 2) REQUEST path and #anchor existence
// 3) Dispatcher purity (basic heuristic)
// 4) Weighted intent precedence availability (load lexicon)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STANDARDS_DIR = join(ROOT, 'docs', 'standards');
const LEXICON_PATH = join(STANDARDS_DIR, '_meta', 'intent-lexicon.json');

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

function fail(msg) {
  console.error(`ERROR: ${msg}`);
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
}

function info(msg) {
  console.log(`INFO: ${msg}`);
}

let errors = 0;

// 0) Preconditions
try {
  statSync(STANDARDS_DIR);
} catch {
  console.error('ERROR: docs/standards directory not found.');
  process.exit(1);
}

// 1) Gather files
walk(STANDARDS_DIR);
info(`Scanned ${mdFiles.length} Markdown files in standards.`);

// 2) Load lexicon
let lexicon;
try {
  const raw = readFileSync(LEXICON_PATH, 'utf8');
  lexicon = JSON.parse(raw);
  if (!Array.isArray(lexicon.precedence) || !Array.isArray(lexicon.intents)) {
    throw new Error('Invalid lexicon structure');
  }
  info('Loaded intent lexicon with precedence and intents.');
} catch (e) {
  fail(`Failed to load intent lexicon at ${relative(ROOT, LEXICON_PATH)}: ${e.message}`);
  errors++;
}

// Helpers
function extractHeadings(md) {
  const lines = md.split(/\r?\n/);
  const headings = [];
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (m) {
      headings.push(m[2].trim());
    }
  }
  return headings;
}

function slugify(h) {
  return h
    .toLowerCase()
    .replace(/[/_]/g, '-')
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// 3) Check global uniqueness of context-check IDs
const contextChecks = new Map();
for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  const re = /context-check\s*=\s*"([^"]+)"/g;
  re.lastIndex = 0;
  let contextMatch = re.exec(content);
  while (contextMatch) {
    const id = contextMatch[1];
    if (contextChecks.has(id)) {
      fail(`Duplicate context-check id '${id}' in ${relative(ROOT, file)}; first seen in ${relative(ROOT, contextChecks.get(id))}`);
      errors++;
    } else {
      contextChecks.set(id, file);
    }
    contextMatch = re.exec(content);
  }
}
info(`Collected ${contextChecks.size} unique context-check IDs.`);

// 4) Validate REQUEST phrasing, paths and anchors exist
// Pattern: REQUEST: "Get ... from path[#anchor]"
const requestRe = /REQUEST:\s*"[^"]*?\s+from\s+([^"\s]+)"/g;
const requestLineRe = /REQUEST:\s*"([^"]+)"/g;
for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  // Enforce phrasing: must include ` from `
  let rl;
  requestLineRe.lastIndex = 0;
  rl = requestLineRe.exec(content);
  while (rl) {
    const raw = rl[1];
    if (!/\sfrom\s/.test(raw)) {
      fail(`Non-conformant REQUEST phrasing in ${relative(ROOT, file)}: "${raw}" (missing ' from ')`);
      errors++;
    }
    rl = requestLineRe.exec(content);
  }
  requestRe.lastIndex = 0;
  let requestMatch = requestRe.exec(content);
  while (requestMatch) {
    const spec = requestMatch[1];
    if (spec.includes('[')) {
      requestMatch = requestRe.exec(content);
      continue; // skip placeholder examples
    }
    const [path, anchor] = spec.split('#');
    const full = join(ROOT, 'docs', 'standards', path.replace(/^\.\/?/, ''));
    try {
      const md = readFileSync(full, 'utf8');
      if (anchor) {
        const anchors = extractHeadings(md).map(slugify);
        if (!anchors.includes(anchor.toLowerCase())) {
          fail(`Missing anchor '#${anchor}' in ${relative(ROOT, full)} referenced from ${relative(ROOT, file)}`);
          errors++;
        }
      }
    } catch {
      fail(`Missing REQUEST target file '${relative(ROOT, full)}' referenced from ${relative(ROOT, file)}`);
      errors++;
    }
    requestMatch = requestRe.exec(content);
  }
}

// 5) Dispatcher purity heuristic
const dispatcherHint = /Category Dispatcher|Root Dispatcher/i;
for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  if (!dispatcherHint.test(content)) {
    continue;
  }
  // Heuristic: all non-empty lines should be comments or conditional-blocks or headings.
  const lines = content.split(/\r?\n/);
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const ok = trimmed.startsWith('<!--') ||
      trimmed.startsWith('<conditional-block') ||
      trimmed.startsWith('</conditional-block>') ||
      /^<context_fetcher_strategy>/.test(trimmed) ||
      /^<\/.+>$/.test(trimmed) ||
      /^#\s/.test(trimmed); // allow single top-level heading
    if (!ok) {
      warn(`Possible non-routing content in dispatcher ${relative(ROOT, file)} at line ${i + 1}: '${trimmed.slice(0, 60)}'`);
    }
  }
}

// 6) Build routing graph and enforce ≤3-hop depth from root; detect cycles
const rootDispatcher = join(STANDARDS_DIR, 'standards.md');

// Build adjacency list from REQUEST references within standards files
const adjacency = new Map();
for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  const list = [];
  requestRe.lastIndex = 0;
  let requestMatch = requestRe.exec(content);
  while (requestMatch) {
    const spec = requestMatch[1];
    if (!spec.includes('[')) {
      const [path] = spec.split('#');
      const full = join(STANDARDS_DIR, path.replace(/^\.\/?/, ''));
      if (full !== file) {
        list.push(full); // ignore self-references
      }
    }
    requestMatch = requestRe.exec(content);
  }
  adjacency.set(file, list);
}

// DFS for cycle detection and depth calculation
const WHITE = 0;
const GRAY = 1;
const BLACK = 2;
const color = new Map(mdFiles.map((f) => [f, WHITE]));
function dfs(u, stack = []) {
  color.set(u, GRAY);
  for (const v of adjacency.get(u) || []) {
    if (!color.has(v)) {
      continue; // outside standards dir
    }
    if (color.get(v) === WHITE) {
      dfs(v, stack.concat([u]));
    } else if (color.get(v) === GRAY) {
      const cyclePath = stack.concat([u, v]).map((p) => relative(ROOT, p)).join(' -> ');
      fail(`Routing cycle detected: ${cyclePath}`);
      errors++;
    }
  }
  color.set(u, BLACK);
}
dfs(rootDispatcher, []);

// BFS for min-depth from root
const depth = new Map();
const queue = [];
depth.set(rootDispatcher, 0);
queue.push(rootDispatcher);
while (queue.length) {
  const u = queue.shift();
  const d = depth.get(u) ?? 0;
  for (const v of adjacency.get(u) || []) {
    if (!depth.has(v)) {
      depth.set(v, d + 1);
      queue.push(v);
    }
  }
}

for (const [file, d] of depth.entries()) {
  if (d > 3) {
    fail(`Routing depth exceeds 3 hops from root: ${relative(ROOT, file)} (depth=${d})`);
    errors++;
  }
}

// 7) Weighted intent precedence presence
if (lexicon && (!Array.isArray(lexicon.precedence) || lexicon.precedence.length === 0)) {
  fail('Lexicon precedence is missing or empty.');
  errors++;
}

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('\nValidation passed.');
