# Architecture Standards - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="clean-architecture|layers|dependency-inversion" context-check="clean-architecture">
IF current task involves Clean Architecture:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Clean Architecture from architecture/clean-architecture.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="domain-driven|ddd|domain|bounded-context|aggregate" context-check="domain-driven-design">
IF current task involves Domain-Driven Design:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Domain-Driven Design from architecture/domain-driven-design.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="feature-sliced|fsd|layers|segments|slices" context-check="feature-sliced-design">
IF current task involves Feature-Sliced Design:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Feature-Sliced Design from architecture/feature-sliced-design.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="solid|single-responsibility|open-closed|liskov|interface-segregation|dependency-inversion" context-check="solid-principles">
IF current task involves SOLID principles:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get SOLID principles from architecture/solid-principles.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="resilience|error-handling|retry|circuit-breaker|timeout|fallback" context-check="resilience-patterns">
IF current task involves resilience patterns:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get resilience patterns from architecture/resilience-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="integration|api|service|communication|messaging|rpc|orpc|remote-procedure" context-check="integration-strategy">
IF current task involves integration strategy:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get integration strategy from architecture/integration-strategy.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="agent|standards|integration|claude|ai-workflow" context-check="agent-standards-integration">
IF current task involves agent-standards integration:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get agent standards integration from architecture/agent-standards-integration.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="refactor|refactoring|cleanup|improve|optimize" context-check="refactoring-patterns">
IF current task involves refactoring or code improvement:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get refactoring patterns from architecture/refactoring-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="use-case|orchestration|workflow|transaction|command|query|cqrs" context-check="use-case-patterns">
IF current task involves use case layer implementation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get use case patterns from architecture/use-case-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="multi-tenant|rbac|permissions|tenant-isolation|organization|invitation|role-based" context-check="multi-tenancy-patterns">
IF current task involves multi-tenancy or role-based access control:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get multi-tenancy patterns from architecture/multi-tenancy-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="streaming|websocket|sse|real-time|server-sent|ai-chat|live-updates|chat-streaming" context-check="streaming-patterns">
IF current task involves streaming or real-time functionality:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get streaming patterns from architecture/streaming-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="billing|subscription|payment|stripe|invoice|checkout|webhook|pricing|plan" context-check="billing-patterns">
IF current task involves billing, payments, or subscription management:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get billing patterns from architecture/billing-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="background-job|queue|worker|async|job-processing|bull|retry|dead-letter|scheduled-task" context-check="background-job-patterns">
IF current task involves background job processing or queues:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get background job patterns from architecture/background-job-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="notification|email|sms|push|alert|template|nodemailer|transporter|delivery" context-check="notification-patterns">
IF current task involves notification systems or messaging:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get notification patterns from architecture/notification-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="search|elasticsearch|indexing|query|faceted-search|full-text|aggregation|relevance" context-check="search-patterns">
IF current task involves search functionality or indexing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get search patterns from architecture/search-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="cache|caching|redis|memory|distributed|invalidation|eviction|ttl|write-through" context-check="caching-patterns">
IF current task involves caching strategies or performance optimization:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get caching patterns from architecture/caching-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="audit|logging|compliance|event-sourcing|forensic|trail|sox|gdpr|hipaa|pci" context-check="audit-logging-patterns">
IF current task involves audit logging or compliance tracking:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get audit logging patterns from architecture/audit-logging-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="validation|architecture-test|archunit|compliance|architecture-validation|testing-architecture|verify-architecture" context-check="architecture-validation">
IF current task involves architecture validation or testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get architecture validation patterns from architecture/architecture-validation.md"
  </context_fetcher_strategy>
</conditional-block>
