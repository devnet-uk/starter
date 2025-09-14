# Configuring Tools - Category Dispatcher
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<conditional-block task-condition="ci-cd|continuous-integration|continuous-deployment|pipeline|github-actions" context-check="ci-cd">
IF current task involves configuring CI/CD:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get CI/CD from development/ci-cd.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="code-review|review|pr|pull-request|review-process|approval" context-check="code-review">
IF current task involves configuring code review:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get code review process from development/code-review.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="database|migration|schema|drizzle-kit|sql" context-check="database-migrations">
IF current task involves configuring database migrations:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get database migration strategy from development/database-migrations.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="documentation|docs|readme|api-docs|jsdoc" context-check="documentation">
IF current task involves configuring documentation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get documentation standards from development/documentation.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="git|workflow|branch|commit|merge|rebase" context-check="git-workflow">
IF current task involves configuring Git workflow:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Git workflow from development/git-workflow.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="testing|test|unit|integration|e2e|tdd|jest|vitest" context-check="testing-strategy">
IF current task involves configuring testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get testing strategy from development/testing-strategy.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="monorepo|setup|init|turbo|pnpm|workspace" context-check="monorepo-setup">
IF current task involves configuring a monorepo:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get monorepo setup guide from development/monorepo-setup.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="local-environment|docker|devcontainer|dotenv|local-ssl" context-check="local-environment-setup">
IF current task involves configuring the local development environment:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get local environment setup guide from development/local-environment.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="pre-commit|husky|lint-staged|quality-gate|local-quality" context-check="local-quality-gates">
IF current task involves configuring pre-commit hooks or local quality gates:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get local quality gates from development/local-quality.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="metrics|quality-metrics|dashboard|tracking|coverage-report" context-check="development-metrics">
IF current task involves configuring development metrics or quality tracking:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get development metrics from development/metrics.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="typescript|tsconfig|type-checking|strict-mode|declaration" context-check="typescript-config">
IF current task involves configuring TypeScript:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get TypeScript configuration templates from development/typescript-config.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="biome|biomejs|linting|formatting|lint-config|format-config" context-check="biome-config">
IF current task involves configuring BiomeJS:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get BiomeJS configuration templates from development/biome-config.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="package-scripts|npm-scripts|pnpm-scripts|fake-scripts|script-config" context-check="package-scripts">
IF current task involves configuring package.json scripts:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get package scripts templates from development/package-scripts.md"
  </context_fetcher_strategy>
</conditional-block>
