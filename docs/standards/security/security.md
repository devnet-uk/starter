# Security Standards - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="api-security|authentication|authorization|rate-limiting|cors|csrf|rpc-security|procedure-auth|rpc-rate-limit" context-check="api-security">
IF current task involves API security:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get API security from security/api-security.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="authentication|auth|login|jwt|session|oauth|clerk" context-check="authentication">
IF current task involves authentication:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get authentication from security/authentication.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="authentication-patterns|mfa|totp|password-reset|session-management|auth-patterns|better-auth|use-case-auth" context-check="authentication-patterns">
IF current task involves authentication patterns, MFA, password reset, or session management:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get authentication patterns from security/authentication-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="dependency|vulnerability|scanning|npm-audit|snyk|security-updates" context-check="dependency-scanning">
IF current task involves dependency scanning:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get dependency scanning from security/dependency-scanning.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="server-action|next-safe-action|form|action|validation|sanitization" context-check="server-actions-security">
IF current task involves server actions:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get server action security from security/server-actions.md"
  </context_fetcher_strategy>
</conditional-block>
