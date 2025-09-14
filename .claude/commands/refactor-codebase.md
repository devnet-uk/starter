---
description: Comprehensive refactoring workflow with automated analysis and phased execution
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Refactor Codebase

## Overview

Analyze existing codebase for refactoring opportunities and generate phased refactoring plans with automated safety validation.

<pre_flight_check>
  EXECUTE: @.claude/commands/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="0" name="infrastructure_validation">

### Step 0: Infrastructure Validation

Validate that the necessary infrastructure is in place for refactoring operations.

<validation_checks>
  <product_context>
    CHECK: /docs/product/ directory exists
    IF missing:
      INFORM: "No product documentation found"
      SUGGEST: "Run /analyze-product first to establish context"
      DECISION: Continue with limited context OR exit
  </product_context>
  
  <standards_check>
    CHECK: /docs/standards/standards.md exists
    IF missing:
      WARN: "Standards not found - refactoring will use defaults"
      CONTINUE: With built-in best practices
  </standards_check>

  <local_dev_check>
    CHECK: .devcontainer/docker-compose.yml exists
    IF missing:
      WARN: "No devcontainer setup found. Some environment checks may be skipped."
  </local_dev_check>

  <observability_check>
    CHECK: instrumentation.ts or src/instrumentation.ts exists
    IF missing:
      WARN: "No OpenTelemetry instrumentation found. Observability refactoring opportunities may be suggested."
  </observability_check>
  
  <tools_check>
    CHECK: node_modules for: madge, knip, type-coverage, dependency-cruiser
    IF missing any:
      PROMPT: "Missing refactoring tools: [list]. Install now? (Y/n)"
      IF yes:
        RUN: pnpm add -D madge@^8.0.0 knip@^5.63.0 type-coverage@^2.29.7 dependency-cruiser@^17.0.1
      IF no:
        WARN: "Limited analysis available without tools"
  </tools_check>
  
  <git_check>
    CHECK: .git directory exists
    CHECK: git status --porcelain (clean working tree)
    IF not clean:
      WARN: "Uncommitted changes detected"
      SUGGEST: "Commit or stash changes first"
  </git_check>
</validation_checks>

<decision_matrix>
  IF all checks pass:
    PROCEED to Step 1
  IF critical missing (no git):
    EXIT with error and guidance
  IF warnings only:
    PROMPT: "Continue with limitations? (Y/n)"
    IF no: EXIT with guidance
    IF yes: PROCEED to Step 1
</decision_matrix>

<instructions>
  ACTION: Validate infrastructure prerequisites
  CHECK: Product docs, standards, tools, git status
  PROMPT: Install missing tools if needed
  DECISION: Exit or continue based on validation results
</instructions>

</step>

<step number="1" name="prerequisites_check">

### Step 1: Prerequisites Check

Verify system state before beginning analysis.

<system_checks>
  <development_server>
    CHECK: Running development servers (port scans)
    IF found:
      PROMPT: "Development server detected. Stop before proceeding? (Y/n)"
      IF yes: WAIT for user to stop server
      IF no: WARN about potential port conflicts
  </development_server>
  
  <git_status>
    VERIFY: Git working directory is clean
    CONFIRM: On appropriate branch for refactoring
    SUGGEST: Create backup branch if needed
  </git_status>
</system_checks>

<instructions>
  ACTION: Check system prerequisites
  VERIFY: Development server status
  CONFIRM: Git working directory state
  PROCEED: Only when environment is ready
</instructions>

</step>

<step number="2" name="parallel_analysis" subagent="multiple">

### Step 2: Parallel Analysis

Execute comprehensive codebase analysis using specialized subagents running in parallel.

<parallel_execution max="AUTO_DETECT">
  <invoke subagent="code-analyzer" name="quality_analysis">
    <instructions>
      ACTION: Use code-analyzer subagent
      REQUEST: "Analyze codebase for refactoring opportunities
                Focus on: code quality, complexity, patterns
                Tools: BiomeJS, madge, knip, type-coverage
                Output: Structured analysis with priorities"
    </instructions>
  </invoke>
  
  <invoke subagent="dependency-mapper" name="dependency_analysis">
    <instructions>
      ACTION: Use dependency-mapper subagent
      REQUEST: "Map package and module dependencies
                Analyze: Turbo graph, circular dependencies
                Calculate: Refactoring blast radius
                Identify: Safe refactoring boundaries"
    </instructions>
  </invoke>
  
  <invoke subagent="metrics-tracker" name="baseline_metrics">
    <instructions>
      ACTION: Use metrics-tracker subagent
      REQUEST: "Capture baseline metrics for comparison
                Collect: Type coverage, bundle sizes, test coverage
                Measure: Performance baselines (if applicable)
                Store: For later comparison"
    </instructions>
  </invoke>
</parallel_execution>

<synchronization>
  WAIT: For all parallel subagents to complete
  AGGREGATE: Results from all analysis subagents
  VALIDATE: Analysis completeness before proceeding
</synchronization>

<instructions>
  ACTION: Execute parallel analysis using multiple subagents
  COORDINATE: Three specialized analysis streams
  SYNC: Wait for all analysis to complete
  AGGREGATE: Combine results for spec generation
</instructions>

</step>

<step number="3" subagent="context-fetcher" name="load_standards">

### Step 3: Load Refactoring Standards

Load relevant standards and patterns for refactoring guidance.

<instructions>
  ACTION: Use context-fetcher subagent
  REQUEST: "Consult the standards knowledge base for guidance relevant to refactoring. Start at the root dispatcher located at @docs/standards/standards.md and follow the routing logic to retrieve refactoring patterns and best practices."
  PROCESS: Returned standards for refactoring guidance
  CACHE: Standards in context for spec generation
</instructions>

</step>

<step number="4" name="analyze_results">

### Step 4: Analyze and Synthesize Results

Process analysis results to identify refactoring opportunities and assess risks.

<analysis_synthesis>
  <opportunity_identification>
    PARSE: Code quality issues from code-analyzer
    CORRELATE: Dependency issues with architectural problems
    PRIORITIZE: Issues by impact and effort required
    CATEGORIZE: By refactoring type (architecture, performance, maintainability)
  </opportunity_identification>
  
  <risk_assessment>
    EVALUATE: Blast radius from dependency-mapper
    ASSESS: Breaking change potential
    IDENTIFY: High-risk vs low-risk refactoring
    DETERMINE: Phasing strategy based on risk levels
  </risk_assessment>
  
  <success_criteria>
    ESTABLISH: Target metrics based on baselines
    DEFINE: Success thresholds for each refactoring type
    SET: Validation gates between phases
    PLAN: Rollback strategies for high-risk changes
  </success_criteria>
</analysis_synthesis>

<instructions>
  ACTION: Synthesize all analysis results
  IDENTIFY: Prioritized refactoring opportunities
  ASSESS: Risk levels and blast radius
  ESTABLISH: Success criteria and validation gates
</instructions>

</step>

<step number="5" subagent="file-creator" name="generate_specs">

### Step 5: Generate Phased Refactoring Specs

Create structured refactoring specifications organized into risk-based phases.

<spec_structure>
  Base directory: docs/product/refactoring/YYYY-MM-DD-{refactoring-name}/
  
  Files to create:
  - analysis.md           # Consolidated analysis findings
  - refactor-plan.md      # Master plan with all phases
  - phase-1-low-risk/
    ├── spec.md          # Low-risk automated fixes
    └── tasks.md         # Generated tasks
  - phase-2-medium-risk/
    ├── spec.md          # Medium-risk improvements  
    └── tasks.md         # Generated tasks
  - phase-3-high-risk/   # (if needed)
    ├── spec.md          # High-risk architectural changes
    └── tasks.md         # Generated tasks
</spec_structure>

<phase_organization>
  <phase_1_low_risk>
    TYPE: Automated fixes and safe improvements
    EXAMPLES: BiomeJS auto-fixes, unused imports, simple type additions
    VALIDATION: Unit tests only
    ESTIMATED_TIME: 1-4 hours
  </phase_1_low_risk>
  
  <phase_2_medium_risk>
    TYPE: Structural improvements with limited scope
    EXAMPLES: Extract methods, simplify components, optimize imports
    VALIDATION: Unit + integration tests
    ESTIMATED_TIME: 1-2 days
  </phase_2_medium_risk>
  
  <phase_3_high_risk>
    TYPE: Architectural changes and major refactoring
    EXAMPLES: Layer separation, API changes, major restructuring
    VALIDATION: Full test suite + manual testing
    ESTIMATED_TIME: 3+ days
  </phase_3_high_risk>
</phase_organization>

<instructions>
  ACTION: Use file-creator subagent
  REQUEST: "Create phased refactoring specification structure
            Base: Analysis findings and risk assessment
            Generate: Phase-based specs with tasks
            Include: Success metrics and validation criteria"
  ORGANIZE: Phases by risk level (low → medium → high)
  SPECIFY: Clear success criteria for each phase
</instructions>

</step>

<step number="6" name="present_plan">

### Step 6: Present Refactoring Plan

Present the generated refactoring plan to the user for review and approval.

<presentation_format>
  ## 🔧 Refactoring Analysis Complete
  
  ### Issues Found:
  - Code Quality: [count] issues ([top 3 categories])
  - Architecture: [violations found]
  - Performance: [opportunities identified]
  - Maintainability: [metrics and scores]
  
  ### Proposed Refactoring Plan:
  
  **Phase 1: Low Risk** (Est. [time])
  - [list of automated fixes]
  - ✅ Safe automated changes
  - 🧪 Unit tests only
  
  **Phase 2: Medium Risk** (Est. [time])  
  - [list of structural improvements]
  - ⚡ Moderate impact changes
  - 🧪 Integration tests required
  
  **Phase 3: High Risk** (Est. [time])
  - [list of architectural changes]
  - 🔥 High impact changes
  - 🧪 Full test suite + manual validation
  
  ### Success Metrics:
  - Type Coverage: [current]% → [target]%
  - Bundle Size: [current] → [target]
  - Code Complexity: [current] → [target]
  - Test Coverage: [current]% → [target]%
  
  ### Next Steps:
  1. Review generated specs in docs/product/refactoring/
  2. Execute phases individually: /create-tasks /execute-tasks
  3. Validate metrics after each phase
</presentation_format>

<user_guidance>
  INFORM: "Refactoring plan generated with [X] phases"
  GUIDE: "Review specs, then execute phases individually"
  RECOMMEND: "Start with Phase 1 for quick wins"
  WARN: "Always run tests between phases"
</user_guidance>

<instructions>
  ACTION: Present comprehensive refactoring plan
  SUMMARIZE: Analysis findings and proposed phases
  GUIDE: User to next steps
  RECOMMEND: Best practices for execution
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.claude/commands/meta/post-flight.md
</post_flight_check>
