# Performance Standards - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="bundle|optimization|webpack|rollup|vite|tree-shaking|code-splitting" context-check="bundle-optimization">
IF current task involves bundle optimization:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get bundle optimization from performance/bundle-optimization.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="core-web-vitals|lcp|inp|cls|performance-metrics|lighthouse" context-check="core-web-vitals">
IF current task involves Core Web Vitals:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Core Web Vitals from performance/core-web-vitals.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="monitoring|metrics|logging|observability|telemetry|apm|opentelemetry|pino|tracing|rpc-streaming|procedure-batching|rpc-caching|rpc-metrics" context-check="observability-monitoring">
IF current task involves monitoring or observability:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get observability foundation from performance/observability.md"
    REQUEST: "Get monitoring patterns from performance/monitoring.md"
  </context_fetcher_strategy>
</conditional-block>
