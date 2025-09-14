# EOS Greenfield Standards Hardening Plan

Status: Draft for review
Assumptions: Greenfield project (no backward compatibility required)

## 1. Objectives

- Deterministic, ≤3‑hop standards routing starting at `docs/standards/standards.md`.
- Stable, non‑overlapping task intent taxonomy for conditional routing.
- Safe, fast verification with clear governance (blocking by default for greenfield, no network by default).
- Authoring ergonomics and linting to prevent drift (paths/anchors/IDs validated).
- Portability to local dev and CI without coupling to a specific agent runtime.

## 2. Scope

- Standards DSL and verification system improvements only (no product implementation).
- Minimal, surgical changes; preserve dispatcher purity and file layout.
- Introduce guardrails and documentation to scale standards without degradation.

## 3. Workstreams

### WS1 — Canonical Task Intent Lexicon

Goal: A single registry of allowed `task-condition` intents and synonyms mapped to categories, ending ambiguity and drift.

Deliverables:
- `docs/standards/_meta/intent-lexicon.json`: canonical list of intents with metadata:
  - `key`: canonical intent (e.g., "api-security")
  - `synonyms`: ["security", "auth", ...]
  - `category`: one of [architecture|security|performance|development|stack-specific|best-practices]
  - `notes`: disambiguation guidance
- Authoring guide section describing how to request new intents and avoid overlaps.

Implementation Notes:
- Keep keywords lowercase, specific, and minimally overlapping.
- Root/category dispatchers reference this lexicon when adding or refining routes.
- Weighted intent precedence when multiple matches occur:
  1) `security`
  2) `development` (tooling/config)
  3) `architecture`
  4) `performance`
  5) `stack-specific`
  6) `best-practices`
  The validator enforces deterministic selection using this order (tunable in the lexicon).

Acceptance Criteria:
- All dispatchers’ `task-condition` values map to lexicon entries.
- No unresolved overlaps across categories.

---

### WS2 — DSL Integrity Validator (Local + CI)

Goal: Automated checks that keep DSL sound as it grows.

Deliverables:
- `scripts/validate-standards.mjs` (Node ESM, zero-deps; optimized for AI CLI execution):
  - Dispatcher purity: no content in dispatchers beyond routing blocks.
  - Max routing depth: ≤3 hops from `standards.md`.
  - All `REQUEST` paths and `#anchors` exist.
  - Global uniqueness of all `context-check` IDs (conditional + verification blocks).
  - Task-condition coverage: each keyword resolves to a defined route; flag overlaps across categories.
  - Weighted intent resolution: when multiple routes match, select by precedence and report the decision.
- CI job invoking the validator (no network).
- Optional pre-commit hook entry (documented, not enforced by default).

Implementation Notes:
- Read files only; avoid executing any project code.
- Output actionable errors (file:line and suggested fix).
- Language: Node ESM (mjs) to avoid installs; a TypeScript variant may be added later for contributors.

Acceptance Criteria:
- Running the validator yields zero errors on main.
- Non-compliant PRs fail CI with clear messages.

---

### WS3 — Verification Governance Hardening

Goal: Make verification execution safe, deterministic, and mode/profile driven.

Deliverables:
- `docs/EngineeringOS/dsl/verification/governance.md`:
  - Default policy: BLOCKING mode, deny network by default, 30s/test timeout, parallel independent tests.
  - Command allowlist (safe primitives): `test`, `ls`, `cat`, `grep`, `sed`, `git` (read-only operations), basic shell builtins.
  - JSON/YAML parsing: use Node ESM in the verification shim; do not rely on external CLI tools.
  - Disallowed by default: `curl`, `wget`, package installs, external network use, deleting/modifying repo state, external CLI JSON/YAML parsers (`jq`, `yq`).
  - Profile matrix (e.g., `${PROJECT_TYPE}` and `VERIFICATION_MODE`) defining severity and optional/advisory checks.
  - Cross-platform notes (macOS/Linux) and fallbacks.
- Variable extraction contracts (tighten from spec): precedence and deterministic fallbacks for `${PROJECT_COVERAGE}`, `${PROJECT_TYPE}`, `${PACKAGE_MANAGER}`, `${PROJECT_PHASES}`.
 - Weighted routing acknowledgement: verification must use the same deterministically selected standards set as routed by WS1/WS2.

Implementation Notes:
- Keep verification definitions embedded in standards; governance doc describes how runners must behave.
- Ensure error messages include `FIX_COMMAND` where safe and feasible.
- Default verification mode: `blocking` for all greenfield contexts.

Acceptance Criteria:
- All existing verification examples conform to the allowlist (or are marked advisory with profile gates).
- Runner spec and governance are consistent (no contradictions).

---

### WS4 — Authoring Ergonomics & Linting

Goal: Reduce authoring errors and keep DSL phrasing predictable for agents.

Deliverables:
- `docs/EngineeringOS/dsl/authoring-guide.md` updates:
  - Approved `REQUEST:` phrasing patterns: "Get [content] from [path][#anchor]", "Get [category] routing from [dispatcher]".
  - Examples for section anchors and cross-file references.
- Validator rules to flag:
  - Non-conformant `REQUEST:` phrasing.
  - Missing or broken anchors.
  - Overly broad `task-condition` entries (suggest narrowing or using lexicon synonyms).
- Dispatcher and standard file templates/snippets.

Acceptance Criteria:
- Lint catches incorrect phrasing and missing anchors in PRs.

---

### WS5 — Editorial Cleanup & Consolidation

Goal: Remove duplication and ensure a single authoritative source for each concept.

Tasks:
- Consolidate duplicated hierarchy explanation in `dsl-specification.md`.
- Add a short “When to add a new standard vs. extend routing” section.
- Ensure dispatcher files remain routing-only (validate via WS2).

Acceptance Criteria:
- One authoritative explanation of the dispatcher hierarchy.
- No non-routing content in dispatcher files.

---

### WS6 — Portability & Local Tooling

Goal: Make verification and validation easy to run locally and in CI regardless of agent.

Deliverables:
- `scripts/verification-shim.mjs` (Node ESM, zero-deps): minimal shim to execute verification-runner behavior locally (extract → substitute → exec) using the governance allowlist.
- Documentation for environment variables and expected working directory assumptions.

Acceptance Criteria:
- Humans can run verification locally without an agent and get consistent results.

---

## 4. Implementation Notes

- Execute workstreams in any order that suits contributor availability; they are largely orthogonal. If batching helps, group WS2 with WS1 (validator + lexicon) and WS3 with WS4 (governance + authoring).
- Keep patches small and focused. Each workstream produces self-contained deliverables with tests/validation where applicable.
- Enforcement scope: CI-only by default for the validator; provide an optional pre-commit hook for teams that prefer earlier feedback.

## 5. Deliverables Map (proposed paths)

- `docs/standards/_meta/intent-lexicon.json`
- `scripts/validate-standards.mjs`
- `docs/EngineeringOS/dsl/verification/governance.md`
- `docs/EngineeringOS/dsl/authoring-guide.md` (updates)
- `scripts/verification-shim.mjs`

## 6. Success Metrics

- Zero CI failures due to duplicate `context-check` IDs after rollout.
- 100% dispatcher `task-condition` values map to the lexicon.
- Verification runs complete < 2 minutes on typical repo; no network calls in default (blocking) mode.
- < 5% PRs fail on DSL linting after 2 weeks (author learning curve), trending down.

## 7. Risks & Mitigations

- Taxonomy contention → Mitigate via small governance group approving lexicon changes.
- Validator false positives → Provide suppressions with justification comments and follow-up tickets.
- Cross-platform shell differences → Provide command fallbacks and test on macOS/Linux in CI matrix.

## 8. Decision Points (please confirm)

1) RESOLVED — Language: Use Node ESM (mjs) zero-deps, optimized for AI CLI agents; optional TS variant later for contributors.
2) RESOLVED — Enforcement scope: CI-only by default; publish optional pre-commit hook guidance.
3) RESOLVED — Allowlist clarifications: Disallow `jq`/`yq` by default; perform JSON/YAML parsing via Node ESM in the verification shim. Shell allowlist remains minimal (above).
4) RESOLVED — Intent lexicon at `docs/standards/_meta/intent-lexicon.json`.
5) RESOLVED — Weighted intent precedence enabled (order above); tunable in lexicon.
6) RESOLVED — Default verification mode: blocking for greenfield.

### Allowlist Use Cases (finalized)

- JSON/YAML parsing without external deps:
  - Use Node ESM parsing via the verification shim for reading `package.json`, `tsconfig*.json`, or YAML when needed.
  - Do not depend on `jq`/`yq`; if present on a system, they are still not used in default mode.
- Git read-only checks:
  - Validate repo initialized, branch naming, last commit message format, presence of tags; no network (`git fetch`) or write operations.
- File and config assertions:
  - Presence and content checks for `.husky/*`, `.lintstagedrc*`, `vitest.config.*`, `biome.json`, `tsconfig*.json` using `test`/`grep`.
- Cross-platform file info:
  - Prefer portable checks; avoid `stat`/`sed -i` differences. If required, use Node for portability.
- Explicitly disallowed by default:
  - Network (`curl`, `wget`, `git fetch`, package installs), file mutation (`chmod`, `sed -i`, writes), environment changes, external CLI JSON/YAML parsers (`jq`, `yq`).



## 9. Next Actions

- Create `intent-lexicon.json` with initial taxonomy and refactor dispatcher `task-condition` terms accordingly.
- Implement `scripts/validate-standards.mjs` with the four core checks (IDs, paths/anchors, depth, purity) and wire CI.
- Draft `verification/governance.md` and align `verification-runner` agent doc references.
- Update authoring guide and add validator rules for `REQUEST:` phrasing and anchors.
- Optionally add `scripts/verification-shim.mjs` for local runs.
