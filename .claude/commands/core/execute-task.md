--- 
description: Rules to initiate execution of a set of tasks using Agent OS
globs:
alwaysApply: false
version: 1.2
encoding: UTF-8
---

# Task Execution Rules

## Overview

Execute tasks for a given spec following three distinct phases:
1. Pre-execution setup (Steps 1-4)
2. Task execution loop (Step 5)
3. Post-execution tasks (Step 6)

**IMPORTANT**: All three phases MUST be completed. Do not stop after phase 2.

<pre_flight_check>
  EXECUTE: @.claude/commands/meta/pre-flight.md
</pre_flight_check>

<process_flow>

## Phase 1: Pre-Execution Setup

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

## Phase 2: Task Execution Loop

<step number="5" name="task_execution_loop">

### Step 5: Task Execution Loop

**IMPORTANT**: This is a loop. Execute ALL assigned tasks before proceeding to Phase 3.

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

  **IMPORTANT**: After loop completes, CONTINUE to Phase 3 (Step 6). Do not stop here.
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
  **IMPORTANT**: When all tasks complete, proceed to Step 6
</instructions>

</step>

## Phase 3: Post-Execution Tasks

<step number="6" name="post_execution_tasks">

### Step 6: Run the task completion steps

**CRITICAL**: This step MUST be executed after all tasks are implemented. Do not end the process without completing this phase.

After all tasks in tasks.md have been implemented, use @.claude/commands/core/post-execution-tasks.md to run our series of steps we always run when finishing and delivering a new feature.

<instructions>
  LOAD: @.claude/commands/core/post-execution-tasks.md once
  ACTION: execute all steps in the post-execution-tasks.md process_flow.
  **IMPORTANT**: This includes:
    - Running full test suite
    - Git workflow (commit, push, PR)
    - Verifying task completion
    - Updating roadmap (if applicable)
    - Creating recap document
    - Generating completion summary
    - Playing notification sound
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.claude/commands/meta/post-flight.md
</post_flight_check>
