---
description: Rules to initiate execution of a set of tasks
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Task Execution Rules

## Overview

Initiate execution of one or more tasks for a given spec.

<pre_flight_check>
  EXECUTE: @.claude/commands/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" name="task_assignment">

### Step 1: Task Assignment

Identify which tasks to execute from the spec (using spec_srd_reference file path and optional specific_tasks array), defaulting to the next uncompleted parent task if not specified.

<task_selection>
  <explicit>user specifies exact task(s)</explicit>
  <implicit>find next uncompleted task in tasks.md</implicit>
</task_selection>

<instructions>
  ACTION: Identify task(s) to execute
  DEFAULT: Select next uncompleted parent task if not specified
  CONFIRM: Task selection with user
</instructions>

</step>

<step number="2" subagent="context-fetcher" name="context_analysis">

### Step 2: Context Analysis with Standards

Use the context-fetcher subagent to gather minimal context for task understanding by always loading spec tasks.md, and conditionally loading project context and relevant standards based on task type.

<standards_detection>
  ANALYZE: Task description and files for keywords
  DETERMINE: Required standards based on:
    - Task type keywords (testing, api, git, documentation)
    - File extensions mentioned (.ts, .tsx, .test.js, .md)
    - Technology stack references (hono, drizzle, react)
  PREPARE: Identified standards for loading
</standards_detection>

<instructions>
  ACTION: Use context-fetcher subagent to:
    - REQUEST: "Get product pitch from mission-lite.md"
    - REQUEST: "Get spec summary from spec-lite.md"  
    - REQUEST: "Get technical approach from technical-spec.md"
    
  CONDITIONAL_STANDARDS: Load based on task analysis:
    - REQUEST: "Consult the standards knowledge base for guidance relevant to the current task. Start at the root dispatcher located at @docs/standards/standards.md and follow the routing logic to retrieve the necessary guidance."
    
  PROCESS: Returned information and standards
</instructions>


<context_gathering>
  <essential_docs>
    - tasks.md for task breakdown
  </essential_docs>
  <conditional_docs>
    - mission-lite.md for product alignment
    - spec-lite.md for feature summary
    - technical-spec.md for implementation details
  </conditional_docs>
  <conditional_standards>
    - standards/standards.md (root dispatcher that routes to relevant category standards)
  </conditional_standards>
</context_gathering>

</step>

<step number="3" name="development_server_check">

### Step 3: Check for Development Server

Check for any running development server and ask user permission to shut it down if found to prevent port conflicts.

<server_check_flow>
  <if_running>
    ASK user to shut down
    WAIT for response
  </if_running>
  <if_not_running>
    PROCEED immediately
  </if_not_running>
</server_check_flow>

<user_prompt>
  A development server is currently running.
  Should I shut it down before proceeding? (yes/no)
</user_prompt>

<instructions>
  ACTION: Check for running local development server
  CONDITIONAL: Ask permission only if server is running
  PROCEED: Immediately if no server detected
</instructions>

</step>

<step number="4" subagent="git-workflow" name="git_branch_management">

### Step 4: Git Branch Management

Use the git-workflow subagent to manage git branches to ensure proper isolation by creating or switching to the appropriate branch for the spec.

<instructions>
  ACTION: Use git-workflow subagent
  REQUEST: "Check and manage branch for spec: [SPEC_FOLDER]
            - Create branch if needed
            - Switch to correct branch
            - Handle any uncommitted changes"
  WAIT: For branch setup completion
</instructions>

<branch_naming>
  <source>spec folder name</source>
  <format>exclude date prefix</format>
  <example>
    - folder: 2025-03-15-password-reset
    - branch: password-reset
  </example>
</branch_naming>

</step>

<step number="5" name="task_execution_loop">

### Step 5: Task Execution Loop

Execute all assigned parent tasks and their subtasks using @.claude/commands/core/execute-task.md instructions, continuing until all tasks are complete.

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

<task_status_check>
  AFTER each task execution:
    CHECK tasks.md for remaining tasks
    IF all assigned tasks complete:
      PROCEED to next step
    ELSE:
      CONTINUE with next task
</task_status_check>

<instructions>
  ACTION: Load execute-task.md instructions once at start
  REUSE: Same instructions for each parent task iteration
  LOOP: Through all assigned parent tasks
  UPDATE: Task status after each completion
  VERIFY: All tasks complete before proceeding
  HANDLE: Blocking issues appropriately
</instructions>

</step>

<step number="6" subagent="verification-runner" name="verify_implementation">

### Step 6: Verify Implementation Standards (Mode-Driven)

Use the verification-runner subagent to execute all verification tests from loaded standards against the current implementation to ensure compliance with Engineering OS standards.

  <verification_settings>
    MODE: blocking | advisory
    DEFAULT: blocking
    DESCRIPTION:
      - blocking: HALT on any BLOCKING=true failure; task completion is prevented until fixed
      - advisory: Do not halt; report critical failures and allow user to decide whether to proceed
  </verification_settings>
  
  NOTE: Set verification mode via session/environment (e.g., `VERIFICATION_MODE=blocking|advisory`). Default is `blocking`.

<instructions>
  ACTION: Use verification-runner subagent
  REQUEST: "Execute all verification tests from loaded standards against current implementation using mode=${VERIFICATION_MODE:-blocking}"
  WAIT: For verification completion
  PROCESS: Verification results
  IF MODE=blocking AND verification_failures_detected:
    BLOCK: Task completion until all critical issues resolved
    REPORT: Failed tests with specific fix suggestions and FIX_COMMAND instructions
    REQUIRE: User to fix all BLOCKING=true failures before continuing
    LOG: All bypass attempts for audit trail
    EXIT: With error status (blocking failure)
  ELSE IF MODE=advisory AND verification_failures_detected:
    RECOMMEND: Fix critical failures before proceeding
    PROMPT: "Verification found X critical issues and Y warnings. Continue (not recommended) or fix issues first?"
    WAIT: For user decision
    PROCEED: Based on user choice
  ELSE:
    CONFIRM: Implementation meets all standards requirements
    LOG: Verification success for compliance tracking
    PROCEED: To task completion
</instructions>

<verification_workflow>
  <extract_tests>
    - Parse verification blocks from all loaded standards
    - Identify applicable tests for current implementation
    - Build dependency graph for test execution order
    - Flag BLOCKING=true tests as mandatory
  </extract_tests>
  <variable_substitution>
    - Detect PROJECT_COVERAGE, PROJECT_TYPE, PROJECT_PHASES
    - Apply project-specific values to test commands and error messages
    - Validate all variables have been substituted
  </variable_substitution>
  <execute_tests>
    - Run tests in dependency order with 30s timeout per test
    - Execute independent tests in parallel for efficiency
    - Capture detailed results for pass/fail analysis
    - HALT execution on any BLOCKING=true test failure WHEN MODE=blocking
    - DO NOT halt on failures WHEN MODE=advisory; continue to report
  </execute_tests>
  <report_results>
    - Provide clear summary of verification status
    - Detail any failed tests with actionable fix suggestions
    - Include FIX_COMMAND for each failure when available
    - Generate audit log entry for all verification attempts
  </report_results>
</verification_workflow>

<failure_handling>
  <blocking_mode>
    CONDITIONS:
      - Any test marked with BLOCKING=true
      - Security vulnerabilities
      - Coverage below project requirements
      - Missing required git hooks
      - Type errors or build failures
      - Fake implementations (echo statements in scripts)
    ACTION: BLOCK task completion; REQUIRE fixes before proceeding
    NO_BYPASS_ALLOWED:
      ERROR: "Verification failures must be fixed. Bypassing verification compromises Engineering OS quality standards."
      REQUIRE: All BLOCKING=true tests must pass
      AUDIT: Log all bypass attempts for compliance review
  </blocking_mode>
  <advisory_mode>
    ACTION: Strongly recommend fixing critical failures before proceeding
    USER_CHOICE:
      PROMPT: "Verification found X critical issues and Y warnings. Continue (not recommended) or fix issues first?"
      WAIT: For user decision
      PROCEED: Based on user choice
  </advisory_mode>
</failure_handling>

</step>

<step number="7" name="complete_tasks">

### Step 7: Run the task completion steps

After all tasks in tasks.md have been implemented and verified, use @.claude/commands/core/post-execution-tasks.md to run our series of steps we always run when finishing and delivering a new feature.

<instructions>
  LOAD: @.claude/commands/core/post-execution-tasks.md once
  ACTION: execute all steps in the complete-tasks.md process_flow.
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.claude/commands/meta/post-flight.md
</post_flight_check>
