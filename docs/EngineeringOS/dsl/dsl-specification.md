# Engineering OS Domain-Specific Language (DSL) Specification

## Overview

The Engineering OS employs a dual-DSL system designed to optimize LLM agent operations through surgical context management and hierarchical knowledge organization. This specification documents both DSLs: the **Standards DSL** for knowledge organization and the **Instructions DSL** for workflow automation.

## Purpose

The DSL system addresses key challenges in LLM-driven development:

1. **Context Window Optimization**: Load only relevant information to avoid context pollution
2. **Scalable Knowledge Management**: Support unlimited growth without performance degradation  
3. **Surgical Context Loading**: Precise information retrieval based on current task requirements
4. **Workflow Orchestration**: Structured, repeatable processes with clear decision points
5. **Agent Coordination**: Seamless delegation between specialized agents

## System Architecture

### Two-DSL Model

The Engineering OS uses two complementary DSLs:

1. **Standards DSL**: Located in `/docs/standards/`
   - **Purpose**: Knowledge base for best practices, patterns, and guidelines
   - **Entry Point**: Root dispatcher at `/docs/standards/standards.md`
   - **Architecture**: Hierarchical routing from general to specific guidance

2. **Instructions DSL**: Located in `.claude/commands/`
   - **Purpose**: Workflow definitions and process automation
   - **Architecture**: Step-by-step processes with subagent delegation

### Hierarchical Dispatcher Model

The Standards DSL implements a three-tier hierarchy:

1.  **Root Dispatcher** (`standards.md`)
    -   Entry point for all standards access
    -   Routes to category-level dispatchers
    -   Contains no actual content, only routing logic

2.  **Category Dispatchers** (e.g., `architecture/architecture.md`)
    -   Route to specific standards within their domain
    -   Use more granular task conditions
    -   May contain minimal contextual information

3.  **Standard Files** (e.g., `architecture/clean-architecture.md`)
    -   Contain actual best practices and guidance
    -   May reference other standards through conditional blocks
    -   Focus on content, not routing

### Intent-Based Dispatcher Architecture

The Standards DSL is not a passive collection of documents; it is an active **intent-based dispatcher system**. This architecture is designed to replace inefficient keyword searching with a deterministic, hierarchical routing mechanism.

-   **Context-First, Not Search-First**: The system is optimized for agents to find the precise context needed for a task without searching the entire knowledge base.
-   **Hierarchical Routing**: Agents ALWAYS start at the root dispatcher (`/docs/standards/standards.md`) and follow a path to the specific standard, guided by the `task-condition` attributes.
-   **Intent Matching**: The `task-condition` attribute of a `<conditional-block>` defines the "intent" of a task. The agent's role is to match the user's request to these predefined intents to find the correct guidance.

<!-- duplicated hierarchy section removed for brevity; authoritative definition appears above in Hierarchical Dispatcher Model -->

## Standards DSL Specification

### Core Syntax Elements

#### 1. Conditional Blocks

The fundamental construct for dynamic content loading:

```xml
<conditional-block task-condition="keyword1|keyword2|keyword3" context-check="example-unique-id-dsl">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Specific request for content retrieval"
  </context_fetcher_strategy>
</conditional-block>
```

**Attributes:**
- `task-condition`: Pipe-separated keywords that trigger the block when matched against current task
  - Case-insensitive matching
  - Supports partial word matching
  - OR logic between pipe-separated terms
  - Match against task descriptions, file extensions, and technology references
- `context-check`: Unique identifier to prevent duplicate content loading
  - Must be globally unique across all standards
  - Use descriptive names (e.g., `typescript-style-complete`)

#### 2. Context Fetcher Strategy

Defines how content should be retrieved:

```xml
<context_fetcher_strategy>
  USE: @agent:context-fetcher
  REQUEST: "Get [specific content] from [file-path]"
</context_fetcher_strategy>
```

**Request Patterns:**

**Complete File Loading:**
```xml
REQUEST: "Get complete TypeScript patterns from code-style/typescript-style.md"
```

**Section-Specific Loading:**
```xml
REQUEST: "Get branch naming section from development/git-workflow.md#branch-naming"
```

**Routing Requests:**
```xml
REQUEST: "Get architecture routing from architecture/architecture.md"
```

#### 3. Control Flow Logic

Within conditional blocks, simple control structures determine execution:

```
IF current task involves [condition]:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher  
    REQUEST: "Load specific guidance"
  </context_fetcher_strategy>
```

Alternative patterns:
```
IF this [section] already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using [section] already in context"
ELSE:
  READ: The following [content]
```

### Task Condition Patterns

#### Category-Level Conditions
Used in root dispatcher for broad categorization:

```xml
<!-- Architecture -->
<conditional-block task-condition="designing-architecture|architecture|clean-architecture|ddd|domain-driven|feature-sliced|solid|resilience">

<!-- Security -->  
<conditional-block task-condition="auditing-security|security|auth|authentication|api-security|dependency|scanning|server-action">

<!-- Performance -->
<conditional-block task-condition="optimizing-performance|performance|bundle|optimization|core-web-vitals|monitoring|metrics">
```

#### Specific-Level Conditions
Used in category dispatchers for targeted routing:

```xml
<!-- Clean Architecture -->
<conditional-block task-condition="clean-architecture|layers|dependency-inversion" context-check="example-clean-architecture">

<!-- API Security -->
<conditional-block task-condition="api-security|authentication|authorization|rate-limiting|cors|csrf" context-check="example-api-security">
```

#### Technology-Specific Conditions
Used for stack-specific standards:

```xml
<!-- Drizzle ORM -->
<conditional-block task-condition="drizzle|orm|database|query|schema|migration" context-check="example-drizzle-patterns">

<!-- React Components -->
<conditional-block task-condition="react|component|hook|jsx|props|state|effect" context-check="react-patterns">
```

#### 4. Verification Blocks

Embedded compliance testing blocks within standards files. These are not routed to but are extracted by the `verification-runner` subagent from loaded standards.

**Syntax:**
```xml
<verification-block context-check="example-verification-unique-id-1">
  <verification_definitions>
    <test name="descriptive_test_name">
      TEST: "shell command to execute"
      REQUIRED: true | false
      BLOCKING: true | false
      ERROR: "Clear error message with fix suggestion"
      FIX_COMMAND: "Specific command to fix the issue"
      DESCRIPTION: "What this test validates"
      DEPENDS_ON: ["prerequisite_test_name"]
      VARIABLES: ["PROJECT_COVERAGE"]
    </test>
  </verification_definitions>
</verification-block>
```

**`verification_block` Attributes:**
- `context-check`: **Required**. A globally unique identifier for the verification block. Used for caching and preventing duplicate processing.

**`test` Definition Elements:**
- `name`: **Required**. A unique identifier for the test within the block (snake_case).
- `TEST`: **Required**. The shell command to be executed for validation. It supports variable substitution.
- `REQUIRED`: **Required**. A boolean (`true` or `false`) indicating if the test's failure should mark the overall verification as failed.
- `BLOCKING`: **Optional**. A boolean. If `true`, a failure in this test will halt the entire verification process immediately. Defaults to the value of `REQUIRED`.
- `ERROR`: **Required**. A user-friendly error message to display if the test fails. Supports variable substitution.
- `FIX_COMMAND`: **Optional**. A specific, copy-pastable command or instruction that helps the user fix the error.
- `DESCRIPTION`: **Required**. A brief explanation of what the test is validating.
- `DEPENDS_ON`: **Optional**. An array of `name` values of other tests within the same block that must pass before this test can run.
- `VARIABLES`: **Optional**. An array of variable names (e.g., "PROJECT_COVERAGE") used in the `TEST` or `ERROR` strings, indicating to the runner what context is needed.

**Variable Substitution:**
Verification tests support dynamic variable substitution to adapt to project-specific contexts. The `verification-runner` is responsible for replacing placeholders like `${VAR_NAME}`.

-   **`${PROJECT_TYPE}`**: Auto-detected project type (e.g., "greenfield", "legacy").
-   **`${PROJECT_COVERAGE}`**: Required test coverage threshold from project configuration.
-   **`${PROJECT_NAME}`**: The name of the project.
-   **`${GIT_HOOKS}`**: A space-separated list of required git hooks.
-   **`${PROJECT_PHASES}`**: A boolean (`true`|`false`) indicating if the project uses a formal phased development model.

**Execution Model:**
1.  **Embedding**: Verification blocks are authored directly within standard `.md` files.
2.  **Extraction**: The `verification-runner` agent scans loaded standards content for these blocks.
3.  **Execution**: The runner executes the `TEST` command for each test, respecting `DEPENDS_ON` ordering.
4.  **Reporting**: Results are aggregated, and failures are reported using the `ERROR` and `FIX_COMMAND` text.

### Profiles and Conditional Blocking

Use project profiles (e.g., greenfield, standard, legacy) to tune strictness at runtime without duplicating tests. Drive behavior with variables and conditional TEST expressions:

- Common variables: `${PROJECT_TYPE}`, `${PROJECT_COVERAGE}`, `${NODE_VERSION}`, `${PORT_WEB}`, `${PORT_API}`.
- Gating pattern: `TEST: test "${PROJECT_TYPE}" != "greenfield" || <enforced-check>` with `REQUIRED: true`, `BLOCKING: true` for greenfield-only requirements.
- Layer-based severity guidelines:
  - Domain/use-cases: strict and BLOCKING (Biome strict, TS strict, type-check, coverage).
  - Infrastructure/UI: basics BLOCKING (scripts real, TS baseline), extras advisory unless gated by profile.

Keep verification definitions embedded in relevant standards; commands set variables and enforce blocking at execution time (e.g., `/execute-tasks` Step 6).

#### 4. Verification Blocks

Embedded compliance testing blocks within standards files:

```xml
<verification-block context-check="example-verification-unique-id-2">
  <verification_definitions>
    <test name="descriptive_test_name">
      TEST: shell command to execute
      REQUIRED: true|false
      BLOCKING: true|false
      ERROR: "Clear error message with fix suggestion"
      FIX_COMMAND: "Specific command to fix the issue"
      DESCRIPTION: "What this test validates"
      DEPENDS_ON: ["prerequisite_test_name"]
    </test>
    <test name="another_test">
      TEST: command with ${VARIABLE} substitution
      REQUIRED: true
      BLOCKING: true
      ERROR: "Fix by running: suggested command"
      FIX_COMMAND: "Run specific fix command here"
      BYPASS_REQUIRES: "Architectural decision document required for bypass"
      DESCRIPTION: "Additional validation logic"
    </test>
  </verification_definitions>
</verification-block>
```

**Verification Block Attributes:**
- `context-check`: Unique identifier for caching verification definitions
  - Must be globally unique across all verification blocks
  - Used to prevent duplicate extraction from the same standard

**Test Definition Elements:**
- `name`: Unique identifier for the test within the verification block
- `TEST`: Shell command to execute (supports variable substitution)
- `REQUIRED`: Boolean indicating if test failure should block workflow
- `BLOCKING`: Boolean indicating if test failure should halt execution immediately (optional, defaults to REQUIRED value)
- `ERROR`: User-friendly error message with actionable fix suggestions
- `FIX_COMMAND`: Specific command or instruction to fix the failing test (optional but recommended)
- `BYPASS_REQUIRES`: Documentation explaining what's needed to bypass this test (optional, for exceptional cases)
- `DESCRIPTION`: Explanation of what the test validates (required for all tests)
- `DEPENDS_ON`: Array of test names that must pass before this test runs (optional, for test ordering)

**Variable Substitution Support:**
Verification tests support dynamic variable substitution:
- `${PROJECT_TYPE}`: Auto-detected project type (react, node, fullstack, etc.)
- `${PROJECT_COVERAGE}`: Coverage threshold from project configuration
- `${TYPESCRIPT_VERSION}`: Detected TypeScript version
- `${PACKAGE_MANAGER}`: Detected package manager (npm, pnpm, yarn)
- `${BUILD_TOOL}`: Detected build tool (vite, webpack, next, etc.)
- `${TEST_FRAMEWORK}`: Detected testing framework (vitest, jest, playwright)

**Verification System Architecture:**

1. **Embedding Phase**: Verification blocks are authored within standards files
2. **Loading Phase**: Standards are loaded through normal DSL conditional routing
3. **Extraction Phase**: verification-runner subagent scans loaded standards for verification blocks
4. **Execution Phase**: Extracted tests execute with variable substitution applied
5. **Reporting Phase**: Results aggregated with compliance status and actionable feedback

**Key Design Principles:**
- **No Separate Files**: Verifications exist within standards, not as standalone files
- **Context Coupling**: Verifications are automatically available when their parent standard loads
- **Runtime Extraction**: verification-runner dynamically discovers verification blocks
- **Variable Substitution**: Tests adapt to specific project configurations
- **Blocking Enforcement**: BLOCKING tests halt execution immediately on failure, no bypass allowed
- **Graceful Degradation**: Optional tests don't block workflow on failure
- **Actionable Feedback**: FIX_COMMAND provides specific remediation steps
- **Test Dependencies**: DEPENDS_ON ensures tests run in logical order

### When to Add a Standard vs. Extend Routing

Add a new standard file when:
- There is a distinct, reusable body of guidance not covered elsewhere (new domain/pattern).
- Multiple categories or dispatchers will route to this content.
- The standard will include its own verification blocks relevant to its scope.

Extend routing (don’t add a new standard) when:
- You only need to expose an existing standard to a new intent via additional `task-condition` keywords.
- You can link to a precise section (anchor) in an existing standard to avoid duplication.
- The addition is small, incremental guidance better placed as a subsection of an existing standard.

Avoid:
- Creating dispatcher-like files with routing logic inside standards (dispatchers are routing-only; standards are content-only).
- Duplicating content across multiple standards — prefer anchors and conditional routing.

Author checks before submitting:
- Ensure ≤3 hops from root to the new/updated content.
- Verify all anchors referenced exist and are stable.
- Guarantee global uniqueness of `context-check` IDs.
- Confirm phrasing of `REQUEST:` matches the approved pattern ("Get … from …").

## Instructions DSL Specification

### Core Syntax Elements

#### 1. YAML Frontmatter

Every instruction file begins with metadata:

```yaml
---
description: Brief description of the instruction's purpose
globs: [Optional file patterns this instruction applies to]
alwaysApply: false [Optional boolean for auto-application]
version: 1.0
encoding: UTF-8
---
```

**Fields:**
- `description`: Human-readable purpose statement
- `globs`: File patterns that trigger automatic application
- `alwaysApply`: Boolean for instructions that should always run
- `version`: Semantic version for change tracking
- `encoding`: Character encoding specification

#### 2. Process Flow Container

The main workflow container:

```xml
<process_flow>
  <!-- All workflow steps go here -->
</process_flow>
```

#### 3. Step Definition

The fundamental workflow unit:

```xml
<step number="1" name="descriptive_name" subagent="optional-agent">
  
### Step 1: Human Readable Title

Description of what this step accomplishes.

<instructions>
  ACTION: Specific action to take
  CONDITION: Optional conditional logic
  DELEGATE: Optional delegation to subagent
</instructions>

</step>
```

**Attributes:**
- `number`: Sequential execution order (must be sequential starting from 1)
- `name`: Unique identifier (snake_case format)
- `subagent`: Optional agent for delegation

**Available Subagents:**
- `context-fetcher`: Targeted information retrieval
- `git-workflow`: Git operations and branch management  
- `file-creator`: File and directory creation
- `test-runner`: Test execution and analysis
- `project-manager`: Task tracking and documentation
- `date-checker`: Date and time operations
- `verification-runner`: Extract and execute verification tests from loaded standards

#### 4. Action Keywords

Within `<instructions>` blocks, specific keywords direct agent behavior:

**Primary Actions:**
- `ACTION`: Direct command to execute
- `REQUEST`: Specific request (usually to subagents)
- `EXECUTE`: Run another instruction file
- `LOAD`: Load content for reference
- `USE`: Specify which agent to use

**Control Flow:**
- `WAIT`: Pause for external input or completion
- `VERIFY`: Check conditions or state
- `CONFIRM`: Seek user confirmation
- `PROCEED`: Continue to next step
- `DELEGATE`: Pass control to another agent

**Data Operations:**
- `PROCESS`: Handle returned information
- `COMBINE`: Merge multiple data sources
- `EXTRACT`: Pull specific information
- `ANALYZE`: Examine and understand data
- `APPLY`: Use information in implementation

#### 5. Pre and Post Flight Checks

Bookend operations that run before and after main workflow:

```xml
<pre_flight_check>
  EXECUTE: @.claude/commands/meta/pre-flight.md
</pre_flight_check>

<!-- Main process_flow here -->

<post_flight_check>
  EXECUTE: @.claude/commands/meta/post-flight.md
</post_flight_check>
```

#### 6. Nested Flow Control

Complex decision trees using nested tags:

```xml
<option_a_flow>
  <trigger_phrases>
    - "what's next?"
  </trigger_phrases>
  <actions>
    1. CHECK @docs/product/roadmap.md
    2. FIND next uncompleted item
    3. SUGGEST item to user
    4. WAIT for approval
  </actions>
</option_a_flow>

<option_b_flow>
  <trigger>user describes specific spec idea</trigger>
  <accept>any format, length, or detail level</accept>
  <proceed>to context gathering</proceed>
</option_b_flow>
```

#### 7. Loop Constructs

For iterative operations:

```xml
<execution_flow>
  LOAD @.claude/commands/core/execute-task.md ONCE

  FOR each parent_task assigned in Step 1:
    EXECUTE instructions from execute-task.md with:
      - parent_task_number
      - all associated subtasks
    WAIT for task completion
    UPDATE tasks.md status
  END FOR
</execution_flow>

<loop_logic>
  <continue_conditions>
    - More unfinished parent tasks exist
    - User has not requested stop
  </continue_conditions>
  <exit_conditions>
    - All assigned tasks marked complete
    - User requests early termination
    - Blocking issue prevents continuation
  </exit_conditions>
</loop_logic>
```

## Validation Rules

### Standards DSL

1. **Dispatcher Purity**: Dispatchers contain only routing logic, no content
2. **Conditional Coverage**: All content must be within conditional blocks
3. **Unique Context IDs**: Context-check values must be globally unique
4. **Routing Completeness**: All task conditions must route somewhere
5. **No Circular Routes**: Dispatchers cannot route to themselves
6. **Maximum Routing Depth**: 3 hops maximum from root to content

### Instructions DSL

1. **Sequential Steps**: Step numbers must be sequential and start at 1
2. **Unique Step Names**: Step names must be unique within a file
3. **Valid Subagents**: Subagent references must match available agents
4. **Balanced Flight Checks**: Pre-flight must have matching post-flight
5. **Action Keyword Usage**: Must use defined action keywords correctly

### Cross-DSL Integration

1. **Valid References**: File paths in requests must exist
2. **Agent Compatibility**: Subagents must support requested operations
3. **Standards Loading**: Instructions must use hierarchical routing for standards
4. **Verification Authoring Location**: Authoring guidance (schema, profiles, variables, examples) resides under `docs/EngineeringOS/dsl/verification/` and is not part of standards routing. Runtime verification extracts `<verification-block>`s from loaded standards; it does not load authoring docs.

### Allowed Direct Fallback Paths (Documented Exceptions)
- In rare, explicitly documented cases a command may read a specific standard directly as a fallback (not as primary standards consult). Example: `plan-product` may fallback to `docs/standards/tech-stack.md` when user inputs are incomplete.
- Constraints for fallbacks:
  - Only for human-provided context gaps; not a substitute for routed standards consult
  - Kept minimal and stable; referenced paths must exist
  - The command must still perform the primary “consult standards via root dispatcher” for normative guidance

### Task-Condition Specificity Guidance
- Keep `task-condition` keywords specific and minimally overlapping. Prefer precise, lowercase terms.
- Good patterns: `code-review|pull-request|review-process`, `documentation|spec|template`, `api-security|rate-limiting|cors`.
- Avoid overly broad catch-alls in category dispatchers; when needed, scope them to anchors (e.g., `development/documentation.md#spec-templates`).

## Performance Requirements

### Target Metrics

- **Dispatcher routing**: <100ms per hop
- **Standard loading**: <500ms per file
- **Context check**: <50ms
- **Total initialization**: <2s for complex tasks
- **Context usage**: Standards <10% of context window
- **Memory efficiency**: No duplicate content loading

### Optimization Strategies

#### Context Window Management

**Do:**
- Use conditional blocks to filter content
- Check for already-loaded content via context-check
- Load specific sections when possible
- Cache standards within session

**Don't:**
- Load entire file hierarchies
- Bypass conditional filtering
- Reload content already in context
- Ignore context window limits

#### Routing Optimization

**Critical Rules:**
- Maximum 3 hops from root to content
- Use most specific keywords possible
- Follow dispatcher chain, don't skip levels
- Root dispatchers contain no content, only routing

## Error Handling

### Standards DSL Errors

- **Missing Dispatcher**: Report specific routing path attempted
- **Condition Mismatch**: Skip section, continue processing  
- **Invalid Context ID**: Warning, continue with non-cached loading
- **Circular References**: Detect and break infinite routing loops

### Instructions DSL Errors

- **Missing Step**: Fatal error, cannot continue workflow
- **Invalid Subagent**: Fallback to direct execution with warning
- **Syntax Error**: Report line and expected format
- **Resource Unavailable**: Graceful degradation where possible

## Version Control

### Semantic Versioning

DSL files use semantic versioning in frontmatter:
- **Major**: Breaking changes to DSL syntax
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, clarifications

### Change Management

1. **DSL Evolution**: Changes require updating specification
2. **Migration Guides**: Document upgrade paths for breaking changes
3. **Compatibility Matrix**: Track which agents support which DSL versions
4. **Deprecation Policy**: 6-month notice for breaking changes

## Integration Patterns

### Standards Loading in Instructions

Instructions often load relevant standards:

```xml
<step number="3" subagent="context-fetcher" name="consult_standards">

### Step 3: Consult Standards

<instructions>
  ACTION: Use context-fetcher subagent
  REQUEST: "Consult the standards knowledge base for guidance relevant to the current task. Start at the root dispatcher located at @docs/standards/standards.md and follow the routing logic to retrieve the necessary guidance."
  PROCESS: Returned standards and guidance
  APPLY: Relevant patterns to implementation
</instructions>

</step>
```

### Agent Initialization with Standards

Agent files specify which standards they need:

```markdown
## Initialization

When invoked, load required standards:
1. READ: @docs/standards/development/git-workflow.md
2. CACHE: Git standards in context for this session
3. VALIDATE: Standards loaded successfully
```

This specification serves as the authoritative reference for the Engineering OS DSL system, defining both the Standards DSL for knowledge management and the Instructions DSL for workflow automation.
