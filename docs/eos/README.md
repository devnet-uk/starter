# Engineering OS in devnet.starter

Engineering OS (EOS) provides standards, commands, and agents to plan and implement software with automated verification.

## What Was Installed
- .claude/agents and .claude/commands
- docs/standards (root dispatcher at docs/standards/standards.md)
- scripts: validate-standards.mjs, verification-shim.mjs, lint-governance.mjs
- Optional: docs/EngineeringOS reference docs; CI workflows

## Quick Start
1. Open this repo in your AI IDE (Claude Code/Cursor).
2. Onboard existing codebase:
   - `/analyze-product`
3. Plan a feature:
   - `/create-spec "Feature title"` → `/create-tasks` → `/execute-tasks`

## Standards
- Entry point: `docs/standards/standards.md` (dispatcher). Agents must route via this file and load only relevant standards.

## Local Utilities
- Validate standards: `node scripts/validate-standards.mjs`
- Run a verification locally (blocking):
  - `node scripts/verification-shim.mjs --files=docs/standards/development/git-workflow.md --mode=blocking`

## CI (if enabled)
- .github/workflows/validate-standards.yml – validates standards on push/PR
- .github/workflows/governance-lint.yml – governance checks (task-condition, verification allowlist)

## Notes
- Verification is blocking by default during `/execute-tasks`.
- Dispatcher purity: keep dispatchers routing-only; content belongs in standards files.
