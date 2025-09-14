# devnet ADR Log (Advisory)

Purpose: Provide a lightweight, consistent way to record architectural decisions and any verification bypass proposals. This is advisory documentation to reduce drift and improve traceability. It does not change functional behavior or add verification gates.

Recommended location in devnet repository: `docs/adr/`

## ADR Template (copy per decision)

```
ADR: ADR-YYYYMMDD-<short-slug>
Title: <Concise decision title>
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded | Rejected
Owner: <name/role>

Context
- Short description of the problem/forces
- Options considered (bulleted)

Decision
- The decision taken and scope (packages/layers affected)

Consequences
- Positive outcomes
- Trade-offs and risks

Verification Impact
- Does this affect any BLOCKING tests? yes|no
- If yes, list affected standards/areas (e.g., tsconfig, biome, coverage)

Bypass Justification (if applicable)
- Rationale for requesting a temporary bypass
- Scope, duration, and rollback conditions
- Mitigations while bypass is in place

References
- Related specs/tasks/PRs
- Links to standards consulted (via `docs/standards/standards.md` routing)
```

Notes
- Keep one ADR per decision; small and focused beats exhaustive.
- For temporary bypasses, include a sunset date and explicit rollback trigger.
- Store ADR filenames in chronological order for easy scanning.
