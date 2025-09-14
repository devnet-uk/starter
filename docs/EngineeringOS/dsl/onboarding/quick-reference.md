# Quick Reference

Core commands
- `/create-spec` — create a dated spec folder and seed docs.
- `/create-tasks` — generate tasks from the spec.
- `/execute-tasks` — execute tasks, run verification (blocking), then post steps.

Subagents (selected)
- `context-fetcher` — loads minimal, task-relevant context via standards dispatcher.
- `verification-runner` — extracts verification blocks, substitutes variables, runs tests.
- `git-workflow` — manages branches per spec.
- `project-manager` — updates tasks and progress docs.

Routing rules
- Always start at `docs/standards/standards.md`.
- Load content only when the task conditions match.
- Keep hops to three or fewer.

Verification
- Default mode is `blocking`; set `VERIFICATION_MODE=advisory` to review without stopping.
- All `BLOCKING=true` failures must be fixed before completion.

