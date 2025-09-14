# Agent Conventions (Global Guidance)

- Entry: Start at `devnet-plan/implementation-plan.md` (dispatcher).
- Routing: Use the matching plan-conditional; execute the inner REQUEST (file path). Prefer three hops (manifest → overview → anchor).
- Standards: Always consult via `docs/standards/standards.md` (root dispatcher), never by direct file grep.
- Commands: `/create-spec`, `/create-tasks`, `/execute-tasks` are real agent workflows (not shell scripts). Follow them in order.
- Verification: Runs in `/execute-tasks` Step 6. Default mode is blocking; fix all BLOCKING=true failures before proceeding.
- Network actions: Prompt before push/PR or installs; keep default operation local/offline whenever possible.

## Working Directory

- Implementation repo: `~/Projects/devnet/`
- Standards repo: `~/Projects/devnet.clean_architecture/`
- Prefer environment variables when set: `DEVNET_HOME`, `ENGINEERING_OS_HOME`.

## Quick Start (for humans)

```
Continue devnet from devnet-plan/implementation-plan.md
```

- Dispatcher → Phase → Overview (summary) → Current Step → Execute

## Path Conventions

- `@docs/standards/` → `~/Projects/devnet.clean_architecture/docs/standards/`
- `@.claude/` → `~/Projects/devnet.clean_architecture/.claude/`

## Verification Summary

- Blocking mode; no bypass for BLOCKING=true tests
- Expect FIX_COMMAND guidance; apply then re‑run `/execute-tasks`
- Typical Phase 0 gates: monorepo files, strict TS/biome, real scripts + coverage, husky/lint‑staged/commitlint, git origin

