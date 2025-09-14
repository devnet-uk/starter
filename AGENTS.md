# AGENTS Guidance for devnet.starter

These instructions apply to the entire repository unless overridden by a more deeply nested AGENTS.md.

## Scope & Priorities
- Primary purpose: use Engineering OS commands and standards to plan and implement features with verifications.
- Always consult standards starting at `docs/standards/standards.md` (root dispatcher). Use ≤3 routing hops; do not bypass dispatchers.

## Commands & Execution
- Commands live in `.claude/commands/` and are executed as slash commands in your AI IDE (e.g., Claude Code, Cursor).
- Core commands:
  - `/plan-product` – creates docs/product/{mission.md, mission-lite.md, tech-stack.md, roadmap.md}
  - `/analyze-product` – onboards an existing codebase, then runs plan-product
  - `/create-spec`, `/create-tasks`, `/execute-tasks` – feature planning → tasks → implementation
- Step execution is sequential; delegate to subagents as specified in command files.

## Standards Loading Rules (MANDATORY)
- Start at `docs/standards/standards.md`.
- Load only content where `<conditional-block task-condition>` matches the current task intent.
- Keep dispatcher files routing-only; standards files contain guidance.
- Keep `context-check` IDs unique.

## Verification
- Use `verification-runner` as invoked by commands; defaults to blocking.
- Local utilities:
  - `node scripts/validate-standards.mjs` – validate standards structure
  - `node scripts/verification-shim.mjs --files=docs/standards/development/git-workflow.md --mode=blocking`
- Governance: deny network by default; safe, non-destructive commands in tests.

## Safety & Changes
- Non-destructive by default; prompt for destructive actions.
- Maintain existing file organization and anchors; use relative paths for internal links.
