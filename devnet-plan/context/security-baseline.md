# devnet Security Baseline (Advisory)

Purpose: Document early, non-functional security hygiene for Phase 0. These are advisory checks to raise awareness and reduce risk. They do not change functional behavior or add verification gates.

## Scope (Phase 0)
- Secrets hygiene: prevent accidental credential commits
- Dependency awareness: surface critical vulnerabilities early
- Commit authenticity: encourage signed commits/policy
- Supply-chain visibility: plan for SBOM generation

## Recommended Practices (Advisory)

Secrets Hygiene
- Add patterns to ignore committing common secrets (e.g., `.env*`, private keys)
- Educate on rotating any secrets that may have been exposed historically
- Consider adding a lightweight pre-commit check for obvious secret patterns (illustrative):
  - Example: scan staged diffs for tokens that match simple regexes (no network)

Dependency Awareness
- Record intended tooling for later enforcement (e.g., `npm audit` in CI, or static manifests)
- Capture a baseline list of critical packages and intended update cadence
- For local-only advisory review, note high-risk packages and pinning policy

Commit Authenticity
- Publish a signed-commit policy (advisory) and instructions for configuring GPG/SSH signing
- Add documentation on how reviewers verify signed commits in the chosen hosting platform

Supply-Chain Visibility (SBOM)
- Decide on SBOM format (SPDX/CycloneDX) for later CI integration
- Document where SBOM artifacts will live and who reviews them

## Integration Notes
- These practices are advisory in Phase 0 and do not gate progress.
- If later promoted to standards, they must be added via the Standards DSL with proper verification blocks and variables.
- Avoid networked checks inside this repository unless explicitly allowed by governance.
