# Phase E · Step E3 — Deployment & Release Operations (Dry Run)

## Original Plan Excerpt

> ### Step E3: Deployment & Release Operations
> ```claude
> Claude: /create-spec "Deployment automation — staging/prod workflows, infra scripts, rollback procedures"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Turbo tasks for build/deploy pipelines defined
> - Infrastructure scripts (Terraform, Pulumi, or equivalent) or placeholders established
> - CI/CD pipeline with environment promotion + smoke tests
> - Release checklist and rollback procedure documented
>
> **Commit Point**
> ```bash
> git add scripts/infra/ .github/workflows/ docs/operations/
> git commit -m "chore(phase-e): deployment workflows automated"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Deployment automation — staging/prod workflows, infra scripts, rollback procedures"`
   - Standards navigation: `docs/standards/operations/deployment.md`, `operations/release-readiness.md`, `security/secrets-management.md` (for deploy secrets).
   - Variables: `PROJECT_PHASE=phase-e`, `DEPLOY_TARGETS=staging,production`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Define Turbo tasks + scripts for build/deploy flows.
     - Create or update infrastructure-as-code scripts (Terraform/Pulumi) or placeholders.
     - Configure CI/CD pipelines for staging/production promotion with smoke tests.
     - Document release checklist and rollback procedure in `docs/operations/`.
3. `Claude: /execute-tasks`
   - Implements automation scripts, updates workflows, validates pipelines via dry-run commands.

## Expected Outcome

- Deployment automation ready with environment promotion and rollback path.
- Infrastructure scripts or placeholders tracked in version control.
- CI/CD pipelines updated to run build, tests, and deploy with verification gates.
- Documentation capturing release checklist and rollback process completed.
- Commit staged: `git add scripts/infra/ .github/workflows/ docs/operations/` message `chore(phase-e): deployment workflows automated`.
