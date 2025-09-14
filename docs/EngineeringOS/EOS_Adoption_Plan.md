# Engineering OS Adoption Plan: A Virtual Dry Run

This document provides a comprehensive, step-by-step guide for adopting and utilizing Engineering OS (EOS) on an existing monolith project. It is based on a deep analysis of the EOS framework files and includes critical details about how the system operates.

## Phase 1: Onboarding the Monolith

**Goal:** To integrate your existing project with EOS, establishing a baseline understanding of its purpose, technology, and current state.

### Step 1: Initiate the Analysis

#### Your Command
Execute the following command at the root of your project:
```
/analyze-product
```

#### What Happens & Your Role
This command initiates a structured, two-way dialogue.

1.  **Automated Scan:** The system first performs a high-level scan of your codebase, looking at file structures and configuration (`package.json`, etc.) to make an initial assessment.
2.  **Interactive Dialogue:** This is the most critical part of the onboarding. The system will then prompt you for essential context that it cannot guess. **Your detailed answers are required for the process to succeed.** Expect questions like:
    *   *"Based on my analysis, I can see you're building a [Project Type]. To properly set up, I need to understand:"*
    *   *"1. **Product Vision:** What is the main problem this solves? Who are the target users?"*
    *   *"2. **Roadmap:** What are the next 1-3 major features you plan to build?"*
    *   *"3. **Team Preferences:** Are there any unwritten coding standards you follow?"*

The system then combines its automated analysis with your answers to create a comprehensive picture of the project.

#### Outcome
A new `docs/product/` directory is created and populated with foundational documents (`mission.md`, `tech-stack.md`, etc.). The `roadmap.md` will accurately reflect the project's state by placing all identified existing features into a **"Phase 0: Already Completed"** section.

---

## Phase 2: The Refactoring Assessment

**Goal:** To get a data-driven, objective analysis of how your monolith's code compares to the EOS standards and to generate a safe, phased plan for alignment.

### Step 2: Run the Refactoring Analysis

#### Your Command
Provide a clear, high-level goal for the refactoring effort:
```
/refactor-codebase "Align the monolith with EOS standards for Clean Architecture and improve overall code quality."
```

#### What Happens & Your Role
This command executes a non-interactive, intensive analysis.

1.  **Infrastructure Validation (Step 0):** Before any analysis, the system performs critical safety checks. It will verify you have a clean Git working directory and check if necessary analysis tools (`madge`, `knip`, `type-coverage`) are installed. **Be prepared for it to prompt you for permission to install these tools** via `pnpm add -D ...` if they are missing. The process will not proceed if the environment is unsafe.
2.  **Parallel Analysis:** Specialized agents (`code-analyzer`, `dependency-mapper`, `metrics-tracker`) are launched in parallel to collect hard data on code complexity, circular dependencies, dead code, test coverage, and bundle size.
3.  **Synthesis & Planning:** The AI synthesizes the raw data from the tools to generate a detailed, risk-assessed refactoring plan.

Your role is to grant permission for any required tool installations and then wait for the analysis to complete.

#### Outcome
A new directory, such as `docs/product/refactoring/YYYY-MM-DD-eos-alignment/`, is created. This directory contains the complete, phased refactoring plan, broken down into `phase-1-low-risk/`, `phase-2-medium-risk/`, etc. **No code has been changed yet.** This step only produces the plan.

---

## Phase 3: Executing the First Refactoring Phase

**Goal:** To begin the actual refactoring by executing the safest "quick wins" identified in Phase 2, demonstrating value and building confidence in the process.

### Step 3: Generate and Execute Low-Risk Tasks

#### Your Commands
This is a two-step process for each phase.

1.  **Create the Task List:** Point the system to the spec for the phase you want to execute.
    ```
    /create-tasks --spec "docs/product/refactoring/YYYY-MM-DD-eos-alignment/phase-1-low-risk/spec.md"
    ```
2.  **Execute the Tasks:**
    ```
    /execute-tasks
    ```

#### What Happens & Your Role
The `/create-tasks` command converts the plan for Phase 1 into an executable checklist. The `/execute-tasks` command then begins working through that list. It will:
*   Create a new Git branch (e.g., `refactor/phase-1-low-risk`).
*   Perform the code changes (e.g., apply linting fixes, remove dead code).
*   Run tests to validate the changes.
*   Check for running development servers and ask for permission to shut them down to avoid conflicts.

Your role is to monitor the process and, upon completion, review the pull request that the system generates.

#### Outcome
A new pull request containing the low-risk refactoring changes, ready for your review and merge. The baseline metrics for your project should already show improvement.

---

## Phase 4: Developing a New Feature with EOS

**Goal:** To use the fully configured system for day-to-day development, ensuring all new code is built to standard from the very beginning.

### Step 4: Plan, Task, and Build a New Feature

#### Your Commands
This follows a three-step sequence for each new feature.

1.  **Create the Spec:**
    ```
    /create-spec "Implement a user profile page where users can update their name and avatar."
    ```
2.  **Create the Tasks:**
    ```
    /create-tasks
    ```
3.  **Execute the Build:**
    ```
    /execute-tasks
    ```

#### What Happens & Your Role
1.  `/create-spec` generates a detailed specification document for your review.
2.  `/create-tasks` converts the approved spec into a detailed checklist. **Note:** The system is hardwired for a Test-Driven Development (TDD) workflow, so the tasks will be structured accordingly (e.g., "1.1 Write tests for profile page," "1.2 Create profile component," etc.).
3.  `/execute-tasks` has the AI work through the checklist on a new feature branch, applying all relevant standards as it goes.

Your role is to provide the initial feature request and to review the outputs at each stage (the spec, and the final pull request).

#### Outcome
A new, fully tested, standards-compliant feature, delivered in a pull request.

## Critical Advice & Key Insights

*   **You are the Director:** The AI is a powerful actor, but you are the director. The quality of your input during the interactive onboarding and in your feature specifications directly determines the quality of the final output.
*   **Trust the Phased, Data-Driven Process:** Resist the temptation to refactor everything at once. The `/refactor-codebase` command is designed to be a safe, incremental process. Execute phase by phase, and validate the results with the metrics provided.
*   **A Note on System Design:** The EOS command files consistently use `<pre_flight_check>` and `<post_flight_check>` hooks. This indicates a robust, well-architected system that handles setup, teardown, and state management reliably, adding confidence to the entire workflow.
