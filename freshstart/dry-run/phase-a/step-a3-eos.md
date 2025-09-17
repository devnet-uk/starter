# Phase A · Step A3 — Engineering OS Integration (Dry Run)

## Original Plan Excerpt

> ### Step A3: Engineering OS Integration
> ```claude
> Claude: /create-spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - `scripts/` updated with EOS helpers (include helper, verification runner configs)
> - Plan dispatcher (`freshstart/refined-plan/implementation-plan.md`) linked in `DEVNET-CHECKPOINT.txt`
> - `/execute-tasks` Step 6 passes default verification (lint/type-check/test placeholders)
> - ADR stub or note capturing tooling decisions (if not existing)
>
> **Commit Point**
> ```bash
> git add scripts/ DEVNET-CHECKPOINT.txt docs/ ADRs/
> git commit -m "chore(phase-a): engineering os runner integrated"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"`
   - Standards navigation: `docs/EngineeringOS/dsl/includes/common-snippets.md`, `docs/standards/standards.md`, any DSL integration standards.
   - Variables: `VERIFICATION_MODE=blocking`, `PROJECT_PHASE=phase-a`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`, manifest path `freshstart/refined-plan/manifest.json`.
2. `Claude: /create-tasks`
   - Expected tasks:
    - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
    - Update scripts (e.g., `verification-shim.mjs`, `lint-governance.mjs`, `validate-standards.mjs`) to consume refined plan config/manifest if needed.
    - Wire dispatcher references in `DEVNET-CHECKPOINT.txt`, ensuring new manifest path recorded.
    - Confirm `/execute-tasks` Step 6 will exercise the verification shim against the refined manifest.
    - Document integration decisions in ADR or `docs/` note.
3. `Claude: /execute-tasks`
   - Executes script modifications and captures verification-runner output proving the refined manifest is honored.

## Expected Outcome

- EOS helper scripts aware of refined manifest/config; verification shim points to `freshstart/refined-plan/` controls.
- `DEVNET-CHECKPOINT.txt` references refined dispatcher; progress tracker updated for Step A3.
- Verification runner output shows refined manifest integration is operational.
- ADR or note added describing EOS integration choices or follow-up tasks.
- Commit staged: `git add scripts/ DEVNET-CHECKPOINT.txt docs/ ADRs/` with message `chore(phase-a): engineering os runner integrated`.
