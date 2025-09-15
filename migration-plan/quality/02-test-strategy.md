# Test Strategy

Layers
- Unit: domain logic, mappers, utils (Vitest)
- Integration: repositories (Drizzle), action middleware, API handlers
- Architecture: arch rules + dependency analysis
- Contract: OpenAPI/oRPC schemas and handler conformance
- E2E: critical flows with Playwright; include parity flows
- Visual (optional): snapshot diffs for key pages

Coverage Targets
- Core domain/use-cases: ≥ 80%
- Infrastructure adapters: ≥ 60%
- Controllers/actions: scenario coverage rather than line metrics

Tooling
- Vitest + TS for unit/arch/contract
- Playwright for e2e
- Scalar/OpenAPI generator for contract artifacts

Data
- Synthetic fixtures; resettable DB state for integration tests
- Avoid network; keep governance safe
