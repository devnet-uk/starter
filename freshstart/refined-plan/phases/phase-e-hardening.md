# Phase E: Production Hardening & Enablement

## Overview

- Phase: Production Hardening & Enablement
- Coverage Target: Maintain ≥98% overall, add reliability SLO checks for critical services
- Status: Final phase following Phase D acceptance
- Duration: 4 steps (observability, security, deployment, documentation & transition)

## Prerequisites & Working Directory

**Required Workspaces**:
- Primary: `${DEVNET_HOME:-~/Projects/devnet/}`
- Secondary (reference): `${ENGINEERING_OS_HOME:-~/Projects/devnet.starter/}`

**Workspace Guard**
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

**Quick Workspace Check**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ "$(pwd)" = "$(cd "$DEVNET_PATH" && pwd 2>/dev/null)" ]; then
  echo "✅"
else
  echo "❌ cd $DEVNET_PATH"
fi
```

**Phase Dependencies**
- API + frontend integration stable with green CI
- Domain and infrastructure layers feature-complete
- Operations stakeholders identified for handoff

## Phase Acceptance

- Observability stack (logging, metrics, tracing) implemented with configuration documented and tested
- Security review complete (threat model, dependency audit, secrets management validation)
- Deployment workflows (infrastructure-as-code or automation scripts) ready for staging/prod with rollback procedure
- Runbooks, architecture decision records, and onboarding docs updated; `DEVNET-PROGRESS.md` marks project completion
- Final `/execute-tasks` run referencing security + operations standards succeeds

## Standards & Intents

- Security: `docs/standards/security/appsec.md`, `secrets-management.md`, `threat-modeling.md`
- Observability: `docs/standards/operations/observability.md`
- Deployment: `docs/standards/operations/deployment.md`
- Documentation: `docs/standards/product/documentation.md`

## Implementation Steps

### Step E1: Observability & Reliability

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Observability foundation — structured logging, metrics, tracing, health checks"

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks

If `DEVNET_EOS_AUTOMATE` is `true`, run:
   pnpm eos:run --spec "Observability foundation — structured logging, metrics, tracing, health checks"
Otherwise, follow the manual steps above.
</user-action-required>

**Deliverables**
- Logging adapters integrated across API/infrastructure with correlation IDs
- Metrics instrumentation for core use cases (auth success rate, billing sync latency, AI request duration)
- Distributed tracing or equivalent request context propagation
- SLO/SLA targets documented with alert thresholds

**Commit Point**
```bash
git add packages/api packages/infrastructure docs/operations/
git commit -m "feat(phase-e): observability foundation established"
```

### Step E2: Security Hardening

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Security hardening — threat model, dependency audit, secrets management validation"

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks

If `DEVNET_EOS_AUTOMATE` is `true`, run:
   pnpm eos:run --spec "Security hardening — threat model, dependency audit, secrets management validation"
Otherwise, follow the manual steps above.
</user-action-required>

**Deliverables**
- Completed threat model document referencing high-risk flows
- Automated dependency scanning (`pnpm audit`, `npm-audit-resolver` or Snyk/GhA) integrated into CI
- Secrets management plan documented, `.env.example` plus docs updated
- Security-focused automated tests (authorization regression, input validation) added

**Commit Point**
```bash
git add docs/security/ package.json .github/workflows/
git commit -m "chore(phase-e): security hardening complete"
```

### Step E3: Deployment & Release Operations

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Deployment automation — staging/prod workflows, infra scripts, rollback procedures"

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks

If `DEVNET_EOS_AUTOMATE` is `true`, run:
   pnpm eos:run --spec "Deployment automation — staging/prod workflows, infra scripts, rollback procedures"
Otherwise, follow the manual steps above.
</user-action-required>

**Deliverables**
- Turbo tasks for build/deploy pipelines defined
- Infrastructure scripts (Terraform, Pulumi, or equivalent) or placeholders established
- CI/CD pipeline with environment promotion + smoke tests
- Release checklist and rollback procedure documented

**Commit Point**
```bash
git add scripts/infra/ .github/workflows/ docs/operations/
git commit -m "chore(phase-e): deployment workflows automated"
```

### Step E4: Documentation & Transition

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Documentation & handoff — runbooks, onboarding guide, final checkpoint"

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks

If `DEVNET_EOS_AUTOMATE` is `true`, run:
   pnpm eos:run --spec "Documentation & handoff — runbooks, onboarding guide, final checkpoint"
Otherwise, follow the manual steps above.
</user-action-required>

**Deliverables**
- Updated `DEVNET-CHECKPOINT.txt` with final status, metrics, outstanding risks
- Runbooks for support, incident response, and domain-specific operations
- ADR log finalized with statuses
- Final tag (e.g., `v1.0.0`) created post-verification

**Commit Point**
```bash
git add DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md docs/runbooks/
git commit -m "docs(phase-e): project handoff completed"
```

## Phase Closure

- Execute `/execute-tasks` referencing security + operations standards to ensure blocking checks pass
- Share final summary with stakeholders and archive plan if required

## References

- `freshstart/refined-plan/implementation-plan.md`
- `freshstart/CleanArchitectureMigration.md`
- `docs/standards/security/`, `docs/standards/operations/`
