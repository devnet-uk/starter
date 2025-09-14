# Phase {PHASE_NUMBER}: {PHASE_TITLE}

## Overview

<!-- phase-summary: anchor=overview; keep concise and current -->

- Phase: {PHASE_TITLE}
- Coverage Target: {COVERAGE_TARGET}%
- Status: Ready for implementation
- Duration: {N_STEPS} steps focusing on {KEY_FOCUS_AREAS}
- Next Phase: {NEXT_PHASE}

## Prerequisites & Working Directory

**Required Workspaces**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#required-workspaces, hash: 4a5914590c5e5cc7097eeddfa7da51d7d275f34f0d38e78be17a0d77e9f94b00 -->
These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
<!-- @end-include -->

Tip: You can set `DEVNET_HOME` and `ENGINEERING_OS_HOME` to point to these paths; see `devnet-plan/ENV-VARS.md`.

**Workspace Quick Check**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-quick-check, hash: c549c84e03c8d6b6b773e27a8636f8ede1379adcbca9858e32ffc6c27889aed8 -->
Quick single-line check to confirm you are in the expected product repository directory.

```
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```
<!-- @end-include -->

<!-- Command notation omitted in lean template to reduce duplication and tokens. -->

## Phase Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

Acceptance criteria
- {ACCEPTANCE_CRITERION_1}
- {ACCEPTANCE_CRITERION_2}
- {ACCEPTANCE_CRITERION_3}

Gate summary (details in standards): link to a standards aggregator (for example, `docs/standards/development/development.md`) covering gates for monorepo setup, TypeScript, Biome, local quality, git workflow, and testing strategy.

## Standards & Intents

Consult standards via the root dispatcher at `docs/standards/standards.md`.
- Relevant intents: {INTENTS} (for example, tooling-config, architecture, security, performance, stack-specific)
- Load only task-relevant content; keep routing ≤ 3 hops.

## Implementation Steps

### Step 1: {STEP_1_TITLE}

#### Pre-Implementation Verification (optional)
```bash
# Optionally verify clean starting state using embedded verification from relevant standards
# Actual verification will run under /execute-tasks Step 6 (blocking)
```

#### Implementation Commands
```claude
Claude: /create-spec "{SPEC_TITLE_1}"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- {DELIVERABLE_1}
- {DELIVERABLE_2}
- {DELIVERABLE_3}

#### 🔄 Commit Point {CP_1_LABEL}
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

```bash
git add .
git commit -m "{CONVENTIONAL_PREFIX}({PHASE_TAG}): {SHORT_SUMMARY}"
# Push and PR creation are prompted by the git workflow step in post-execution tasks
```

### Step 2: {STEP_2_TITLE}

- Follow the same substructure as Step 1 (Pre-Implementation Verification, Implementation Commands, Deliverables, Commit Point).

### Step {N}: {STEP_N_TITLE}

- Repeat as needed for all steps in this phase.

## References

- Plan dispatcher: `devnet-plan/implementation-plan.md` (plan-local routing)
- Phase manifest: `devnet-plan/manifest.json` (phase → file, overview anchor)
- Standards root: `docs/standards/standards.md` (dispatcher)
- Devnet environment vars: `devnet-plan/ENV-VARS.md`
- Preflight check: `scripts/preflight.mjs`
- Status render: `scripts/render-status.mjs` (optional history append)

## Notes

- Keep examples concise; rely on embedded verification and standards for detail.
- When editing shared guidance, update the source include and refresh dependent blocks with `scripts/include-helper.mjs`.
