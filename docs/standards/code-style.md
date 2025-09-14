# Code Style Guide - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="formatting|indentation|line-length|file-organization|general-formatting" context-check="general-formatting">
IF current task involves general formatting standards:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get general formatting from code-style/general-formatting.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="typescript|types" context-check="typescript">
IF current task involves TypeScript:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get TypeScript style from code-style/typescript-style.md"
    REQUEST: "Get naming conventions from code-style/naming-conventions.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="react|component" context-check="react">
IF current task involves React:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get React patterns from code-style/react-patterns.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="css|tailwind" context-check="css">
IF current task involves styling:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get CSS style from code-style/css-style.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="html|jsx" context-check="html">
IF current task involves HTML/JSX:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get HTML style from code-style/html-style.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="server-action|next-safe-action|form|action" context-check="server-actions-style">
IF current task involves server actions:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get server action patterns from stack-specific/next-safe-action.md"
    REQUEST: "Get server action security from security/server-actions.md"
    IF naming conventions needed:
      REQUEST: "Get naming conventions from code-style/naming-conventions.md"
  </context_fetcher_strategy>
</conditional-block>
