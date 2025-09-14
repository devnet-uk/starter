# Stack-Specific Standards - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="drizzle|orm|database|query|schema|migration" context-check="drizzle-patterns">
IF current task involves Drizzle ORM:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Drizzle patterns from stack-specific/drizzle-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="hono|api|route|middleware|handler" context-check="hono-api">
IF current task involves HonoJS API:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get HonoJS patterns from stack-specific/hono-api.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="next-safe-action|server-action|action|form|validation" context-check="next-safe-action">
IF current task involves Next Safe Action:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Next Safe Action patterns from stack-specific/next-safe-action.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="tanstack|query|react-query|cache|mutation|optimistic" context-check="tanstack-query-dispatcher">
IF current task involves TanStack Query:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get TanStack Query patterns from stack-specific/tanstack-query.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="vercel|ai|llm|embedding|streaming|chat" context-check="vercel-ai">
IF current task involves Vercel AI:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get AI patterns from stack-specific/vercel-ai.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="vercel|deployment|edge|functions|environment" context-check="vercel-deployment">
IF current task involves Vercel deployment:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Vercel deployment from stack-specific/vercel-deployment.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="zustand|state|store|management|global-state" context-check="zustand-state">
IF current task involves Zustand state management:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Zustand patterns from stack-specific/zustand-state.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="orpc|rpc|procedure|type-safe-api|streaming-api|rpc-router|rpc-client|remote-procedure-call" context-check="orpc-patterns">
IF current task involves oRPC:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get oRPC patterns from stack-specific/orpc-patterns.md"
  </context_fetcher_strategy>
</conditional-block>
