# Quality Gates (Local + CI)

Local (pre-commit / pre-push)
- Lint/format: `biome ci .` (0 errors)
- Type-check: `tsc --noEmit` (0 errors)
- Unit tests: fast subset on changed packages
- Optional: e2e smoke on pre-push

CI (blocking on PR)
- Standards validation: pass
- Governance lint: pass
- Biome: 0 errors
- Unit tests: 100% pass; coverage ≥ 70% critical modules (core, use-cases)
- Integration tests: key repositories and adapters
- Architecture tests: no forbidden imports; dependency rules pass
- Contract tests: OpenAPI/oRPC schemas valid; handler responses conform

CI (non-blocking initially, promote later)
- Bundle budgets: main app < 250 KB gzip per critical route; vendor chunk < 500 KB
- Core Web Vitals (lab): LCP p75 < 2.5s; INP p75 < 200ms; CLS p75 < 0.1
- Accessibility: no critical Axe violations on key pages
- Dependency scan: no high severity vulnerabilities
