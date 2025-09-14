# Development Best Practices

## Context
Global development guidelines for this project following Clean Architecture principles.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

1. **Clean Architecture first**: Separate business logic from frameworks; dependencies point inward.
2. **Ship small, ship often**: Trunk-based development with short-lived branches.
3. **Reliability first**: Every service has SLOs; treat errors as data.
4. **Observability by default**: Structured logs, metrics, traces, alerts.
5. **Security is non-negotiable**: Least privilege, zero secrets in code.
6. **Privacy by design**: Data minimisation, explicit retention.
7. **Type-safety end-to-end**: Strict TypeScript, typed APIs, typed DB. See [Integration Strategy](./architecture/integration-strategy.md).
8. **API first**: HonoJS routes are explicit, versioned, documented.
9. **Single source of truth**: Schemas live in one place.
10. **Immutable migrations**: Production data is sacred.
11. **Performance budgets**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
12. **Accessibility baseline**: WCAG 2.2 AA compliance.
13. **Offline-ready clients**: TanStack Query with retry policies.
14. **UI consistency**: Design tokens + CVA components.
15. **Contract-driven testing**: Unit, integration, E2E.
16. **Feature flags**: Progressive delivery with instant rollback.
17. **Monorepo discipline**: pnpm workspaces + Turbo caching.
18. **DevEx matters**: One-command setup, fast feedback loops.
19. **Code review quality**: Focus on architecture and risk.
20. **Fail gracefully**: User-centric error messages.
21. **Infrastructure as code**: Deterministic environments.
22. **Backward compatibility**: Breaking changes need migration.
23. **Responsible AI**: Guardrails and human-in-the-loop.
24. **Document decisions**: ADRs for architectural choices.
25. **Clear ownership**: Teams own their domains end-to-end.
</conditional-block>

<conditional-block task-condition="error|recovery|resilience" context-check="error-recovery-patterns">
IF current task involves error recovery:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get resilience patterns from architecture/resilience-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="architecture|new-feature" context-check="architecture">
IF current task involves architecture decisions:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Clean Architecture from architecture/clean-architecture.md"
    REQUEST: "Get Feature-Sliced Design from architecture/feature-sliced-design.md"
    IF business logic:
      REQUEST: "Get Domain-Driven Design from architecture/domain-driven-design.md"
    IF SOLID needed:
      REQUEST: "Get SOLID principles from architecture/solid-principles.md"
  </context_fetcher_strategy>
</conditional-block>


<conditional-block task-condition="testing|test" context-check="testing">
IF current task involves testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get testing strategy from development/testing-strategy.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="api|endpoint|route" context-check="api">
IF current task involves API development:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get HonoJS patterns from stack-specific/hono-api.md"
    IF security:
      REQUEST: "Get API security from security/api-security.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="database|migration|drizzle" context-check="database">
IF current task involves database:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Drizzle patterns from stack-specific/drizzle-patterns.md"
    IF migration:
      REQUEST: "Get database migration strategy from development/database-migrations.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="state|store|zustand" context-check="state-management">
IF current task involves state management:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Zustand patterns from stack-specific/zustand-state.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="performance|optimization" context-check="performance">
IF current task involves performance:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Core Web Vitals from performance/core-web-vitals.md"
    IF bundle optimization:
      REQUEST: "Get bundle optimization from performance/bundle-optimization.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="auth|security" context-check="security">
IF current task involves security:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get authentication from security/authentication.md"
    IF API security:
      REQUEST: "Get API security from security/api-security.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="server-action|next-safe-action|form|action" context-check="server-actions">
IF current task involves server actions:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get server action patterns from stack-specific/next-safe-action.md"
    REQUEST: "Get server action security from security/server-actions.md"
    IF authentication needed:
      REQUEST: "Get server action auth patterns from security/authentication.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="deploy|ci|cd" context-check="deployment">
IF current task involves deployment:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get CI/CD from development/ci-cd.md"
    REQUEST: "Get Vercel deployment from stack-specific/vercel-deployment.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="monitoring|logging" context-check="monitoring">
IF current task involves monitoring:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get monitoring patterns from performance/monitoring.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="ai|llm|embedding" context-check="ai">
IF current task involves AI features:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get AI patterns from stack-specific/vercel-ai.md"
  </context_fetcher_strategy>
</conditional-block>



<conditional-block task-condition="dependencies|vulnerability|scanning" context-check="dependency-security">
IF current task involves dependency security:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get dependency scanning from security/dependency-scanning.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="query|tanstack|react-query" context-check="tanstack-query">
IF current task involves TanStack Query:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get TanStack Query patterns from stack-specific/tanstack-query.md"
  </context_fetcher_strategy>
</conditional-block>
