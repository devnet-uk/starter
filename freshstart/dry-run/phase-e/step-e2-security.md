# Phase E · Step E2 — Security Hardening (Dry Run)

## Original Plan Excerpt

> ### Step E2: Security Hardening
> ```claude
> Claude: /create-spec "Security hardening — threat model, dependency audit, secrets management validation"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Completed threat model document referencing high-risk flows
> - Automated dependency scanning (`pnpm audit`, `npm-audit-resolver` or Snyk/GhA) integrated into CI
> - Secrets management plan documented, `.env.example` plus docs updated
> - Security-focused automated tests (authorization regression, input validation) added
>
> **Commit Point**
> ```bash
> git add docs/security/ package.json .github/workflows/
> git commit -m "chore(phase-e): security hardening complete"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Security hardening — threat model, dependency audit, secrets management validation"`
   - Standards navigation: `docs/standards/security/appsec.md`, `threat-modeling.md`, `secrets-management.md`, `operations/deployment.md`.
   - Variables: `PROJECT_PHASE=phase-e`, `SECURITY_REVIEW=true`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Produce updated threat model document covering critical flows (auth, billing, AI, storage).
     - Configure automated dependency scanning in CI (e.g., `pnpm audit --prod`, Snyk GitHub Action).
     - Validate secrets management approach; update `.env.example` and docs accordingly.
     - Add regression tests focusing on authorization and input validation.
3. `Claude: /execute-tasks`
   - Generates docs/tests, updates package scripts and workflows, runs security checks to confirm integrations.

## Expected Outcome

- Threat model documented and stored under `docs/security/`.
- Dependency scanning integrated into CI with failing-on-critical policy.
- Secrets management plan documented; environment templates updated.
- Security regression tests executed successfully.
- Commit staged: `git add docs/security/ package.json .github/workflows/` message `chore(phase-e): security hardening complete`.
