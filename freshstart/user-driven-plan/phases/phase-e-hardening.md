# Phase E: Production Hardening & Enablement (User-Driven)

## Agent Brief (copy/paste to start)
```
You are assisting with Phase E: Production Hardening & Enablement for the DevNet migration. We need to finalize observability, security, deployment automation, and documentation handoff. Treat prior phases as complete and stable. I will provide each step manually.
```

## Phase Overview
- Coverage target: Maintain ≥98% overall; add reliability SLO checks for critical services
- Sequence: Observability → Security → Deployment → Documentation & transition
- Final phase before project closeout (`DEVNET-PROGRESS.md` completion)

## Prerequisites
- Phase D acceptance recorded; CI green for API/web/e2e
- Operations stakeholders identified for handoff artifacts
- Secrets and environment configuration templates ready for review

### Workspace Guard (optional)
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
REMOTE_EXPECTED="${DEVNET_GIT_REMOTE:-}"
ORIGIN_URL=""
if [ -d "$DEVNET_PATH/.git" ]; then
  ORIGIN_URL="$(cd "$DEVNET_PATH" && git config --get remote.origin.url 2>/dev/null)"
fi
if [ ! -d "$DEVNET_PATH/.git" ]; then
  echo "❌ $DEVNET_PATH is not initialized — complete earlier phases before Phase E"
elif [ -n "$REMOTE_EXPECTED" ] && [ "$ORIGIN_URL" != "$REMOTE_EXPECTED" ]; then
  echo "❌ origin remote mismatch — set via: git -C $DEVNET_PATH remote set-url origin $REMOTE_EXPECTED"
else
  echo "✅ Workspace ready at $DEVNET_PATH"
fi
```

## Acceptance Checklist
- Observability stack (logging, metrics, tracing) implemented and documented
- Security review complete: threat model, dependency audit, secrets management validation, regression tests
- Deployment workflows (IaC/scripts) for staging/prod with rollback plan executed in CI/CD
- Runbooks, ADRs, onboarding docs updated; `DEVNET-PROGRESS.md` signals completion
- Final `/execute-tasks` referencing security + operations standards succeeds

## Manual Step Runner

### Step E1: Observability & Reliability
**Message to send:**
```
/create-spec "Observability foundation — structured logging, metrics, tracing, health checks"
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Logging adapters with correlation IDs tied into API/infrastructure
- Metrics instrumentation for auth success rate, billing sync latency, AI request duration
- Distributed tracing or equivalent context propagation
- SLO/SLA targets documented with alert thresholds

**Suggested Commit**
```
git add packages/api packages/infrastructure docs/operations/
git commit -m "feat(phase-e): observability foundation established"
```

### Step E2: Security Hardening
**Message to send:**
```
/create-spec "Security hardening — threat model, dependency audit, secrets management validation"
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Threat model covering high-risk flows
- Automated dependency scanning integrated into CI
- Secrets management plan documented; `.env.example` and docs updated
- Security regression tests for authorization/input validation paths

**Suggested Commit**
```
git add docs/security/ package.json .github/workflows/
git commit -m "chore(phase-e): security hardening complete"
```

### Step E3: Deployment & Release Operations
**Message to send:**
```
/create-spec "Deployment automation — staging/prod workflows, infra scripts, rollback procedures"
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Turbo tasks for build/deploy pipelines
- Infrastructure scripts (Terraform, Pulumi, etc.) or placeholders with documentation
- CI/CD pipeline enabling staged promotion with smoke tests
- Release checklist plus rollback procedure documented

**Suggested Commit**
```
git add scripts/infra/ .github/workflows/ docs/operations/
git commit -m "chore(phase-e): deployment workflows automated"
```

### Step E4: Documentation & Transition
**Message to send:**
```
/create-spec "Documentation & handoff — runbooks, onboarding guide, final checkpoint"
/create-tasks
/execute-tasks
```

**Key Deliverables**
- `DEVNET-CHECKPOINT.txt` updated with final status, metrics, outstanding risks
- Runbooks for support, incident response, domain operations finalized
- ADR log closed out with statuses
- Final tag (e.g., `v1.0.0`) created post-verification

**Suggested Commit**
```
git add DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md docs/runbooks/
git commit -m "docs(phase-e): project handoff completed"
```

## Phase Closure
- Run `/execute-tasks` with security + operations standards; ensure all gating commands succeed
- Share final summary with stakeholders, archive plan if required

## References
- `docs/standards/security/appsec.md`, `docs/standards/security/secrets-management.md`, `docs/standards/security/threat-modeling.md`
- `docs/standards/operations/observability.md`, `docs/standards/operations/deployment.md`
- `docs/standards/product/documentation.md`
- `freshstart/CleanArchitectureMigration.md`
