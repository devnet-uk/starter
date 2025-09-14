# Engineering OS Standards - Root Dispatcher

<!-- Root dispatcher. Routes to category dispatchers based on task. Contains no rules. -->

<!-- Route to DESIGNING SYSTEMS standards -->
<conditional-block task-condition="designing|design|architect|architecture|pattern|structure|organize|system-design|clean-architecture|ddd|domain-driven|feature-sliced|solid|resilience|use-case|orchestration|transaction|multi-tenant|rbac|permissions|tenant-isolation|streaming|websocket|sse|real-time|ai-chat|billing|subscription|payment|stripe|invoice|checkout|webhook|pricing|plan|background-job|notification|search|elasticsearch|indexing|faceted-search|full-text|aggregation|relevance|cache|caching|redis|memory|distributed|invalidation|eviction|ttl|write-through|audit|logging|compliance|event-sourcing|forensic|trail|sox|gdpr|hipaa|pci">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get system design routing from architecture/architecture.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Route to WRITING CODE standards -->
<conditional-block task-condition="writing|write|coding|syntax|style|convention|format-style|typescript-style|react|css|html|jsx|naming|conventions">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get code writing routing from code-style.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Route to OPTIMIZING SYSTEMS standards -->
<conditional-block task-condition="optimizing|optimize|performance|improve|bundle|optimization|core-web-vitals|monitoring|metrics">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get system optimization routing from performance/performance.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Route to SECURING APPLICATIONS standards -->
<conditional-block task-condition="securing|secure|security|protect|auth|authentication|api-security|dependency|scanning|server-action|vulnerability">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get application security routing from security/security.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Route to CONFIGURING TOOLS standards -->
<conditional-block task-condition="configuring|configure|setup|tool|config|setting|install|ci-cd|testing-config|code-review|git-setup|documentation-setup|database-config|migration-config|typescript-config|tsconfig|biome|biomejs|lint-config|format-config|package-scripts|npm-scripts|pnpm-scripts|type-checking|script-config">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get tool configuration routing from development/development.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Route to USING LIBRARIES standards -->
<conditional-block task-condition="using|use|library|framework|stack-specific|drizzle|hono|next-safe-action|tanstack|query|vercel|ai|zustand|state|orpc|rpc|procedure">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get library usage routing from stack-specific/stack-specific.md"
  </context_fetcher_strategy>
</conditional-block>

<!-- Fallback for best practices -->
<conditional-block task-condition="best-practices|general-guidance|principles|core-principles">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get best practices from best-practices.md"
  </context_fetcher_strategy>
</conditional-block>
