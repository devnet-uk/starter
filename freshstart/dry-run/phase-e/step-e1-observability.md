# Phase E · Step E1 — Observability & Reliability (Dry Run)

## Original Plan Excerpt

> ### Step E1: Observability & Reliability
> ```claude
> Claude: /create-spec "Observability foundation — structured logging, metrics, tracing, health checks"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Logging adapters integrated across API/infrastructure with correlation IDs
> - Metrics instrumentation for core use cases (auth success rate, billing sync latency, AI request duration)
> - Distributed tracing or equivalent request context propagation
> - SLO/SLA targets documented with alert thresholds
>
> **Commit Point**
> ```bash
> git add packages/api packages/infrastructure docs/operations/
> git commit -m "feat(phase-e): observability foundation established"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Observability foundation — structured logging, metrics, tracing, health checks"`
   - Standards navigation: `docs/standards/operations/observability.md`, `security/appsec.md` (logging guidance), relevant feature specs for metrics.
   - Variables: `PROJECT_PHASE=phase-e`, `OBSERVABILITY_STACK=open-telemetry` (example), `SLO_TARGETS_ENABLED=true`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Implement structured logging adapters with correlation IDs across API/infrastructure layers.
     - Instrument metrics for key flows; expose Prometheus or equivalent endpoints.
     - Integrate distributed tracing (OpenTelemetry) into request lifecycle.
     - Document SLO/SLA targets and alert thresholds in `docs/operations/`.
     - Update tests to cover health checks and telemetry wiring.
3. `Claude: /execute-tasks`
   - Applies code changes, updates docs, runs tests verifying logging/metrics/tracing components.

## Expected Outcome

- Unified observability tooling in place (logging, metrics, tracing, health endpoints).
- Documentation updated with SLO/SLA definitions and alert strategy.
- Verification commands confirm telemetry integrations function as expected.
- Commit staged: `git add packages/api packages/infrastructure docs/operations/` message `feat(phase-e): observability foundation established`.
