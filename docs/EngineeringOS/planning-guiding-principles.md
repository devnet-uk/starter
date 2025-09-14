# Planning Guiding Principles (Engineering OS)

These principles make planning actionable and verifiable while avoiding rigidity. Use them when authoring specs (/create-spec), generating tasks (/create-tasks), and executing work (/execute-tasks).

## 1) Route By Intent, Not Search
- Always load standards via `docs/standards/standards.md` (Root → Category → Standard; ≤3 hops).
- Match `task-condition` keywords; only load standards relevant to the task.
- Keep dispatchers pure (routing-only) and standards content-focused.

## 2) Plan With Verifications In Mind
- During `/create-spec`, load relevant standards and extract embedded `<verification-block>` tests as the verification plan.
- Use variables in the plan to parameterize strictness (e.g., `${PROJECT_COVERAGE}`, `${PROJECT_TYPE}`, `${NODE_VERSION}`).
- Prefer BLOCKING tests for critical guardrails; keep optional guidance as advisory (REQUIRED=false).

## 3) Enforce A Non‑Negotiable Gate
- Run `/execute-tasks` Step 6 (verification-runner in blocking mode) before marking tasks, steps, or phases complete.
- No tags/releases or status updates until all BLOCKING tests pass.
- Disallow bypasses like `--no-verify` for required hooks and gates.

## 4) Tune Strictness By Layer And Phase
- Domain/use-cases: strict and BLOCKING (Biome, TS strict, type-check, coverage).
- Infrastructure/UI: basics BLOCKING (scripts real and present, tsc baseline) with advisory extras (pre-push, coverage reporters, devcontainer).
- Project type profiles: greenfield → higher bars (e.g., coverage 98%); standard/legacy → ramp thresholds.

## 5) Make Scripts Real, Detect Fakes
- Require real `lint`, `test`, `build`, `type-check`, `coverage:check` scripts.
- Use verification tests that fail on fake implementations (e.g., `echo`, `true`).
- Run at least one script (e.g., `npm run lint --silent`) to prove scripts actually execute.

## 6) Lock Quality Configurations
- Biome: no downgrades in domain (e.g., `noExplicitAny`, `noNonNullAssertion` must be `error`).
- TypeScript: enforce strict flags (`strict`, `strictNullChecks`, `noImplicitAny`), `target: ESNext`, `jsx: react-jsx`, `declaration/declarationMap`.
- Prefer templates in standards and verification tests that assert parity.

## 7) Use Advisory Checks Strategically
- Keep these non-blocking unless the project chooses to harden them:
  - Pre-push hooks
  - Coverage reporters (html/json/lcov)
  - Devcontainer presence and ports
  - Env template ports (e.g., `${PORT_WEB}`, `${PORT_API}`)

## 8) Allow Time‑Bound Waivers (ADR)
- For exceptions, require an Architectural Decision Record with:
  - Scope, rationale, expiry, and owner
  - Link to follow-up tasks that remove the waiver
- Log any bypass or waiver in CI and reviews.

## 9) Verify Monorepo And Environment Basics
- Monorepo essentials: `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` matching `${NODE_VERSION}`, `.env.example` present.
- Advisory: check `.env.example` for `${PORT_WEB}`/`${PORT_API}` hints; add `.devcontainer/` with core files and ports.

## 10) Iterate Under The Gate
- Expect initial verification failures; fix iteratively until green.
- Keep progress visible but do not claim completion until the gate passes.
- Treat standards as the contract; author new checks as verification-blocks in the appropriate standards file.

## Default Variable Profile (Step 4 Example)
- `${PROJECT_COVERAGE}`: 98 (greenfield)
- `${PROJECT_TYPE}`: greenfield
- `${NODE_VERSION}`: 22
- `${PORT_WEB}`: 4000
- `${PORT_API}`: 4001

## Where This Lives In EOS
- Planning: `/create-spec` extracts verifications into the plan.
- Execution: `/execute-tasks` enforces verifications (Step 6) before completion.
- Standards: keep verification-blocks embedded in relevant standard files; use `context-check` IDs that are globally unique.

