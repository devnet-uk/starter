# EOS Command Wrapper Plan

## Context
- Current refined plan requires manual `/create-spec`, `/create-tasks`, and `/execute-tasks` invocations in Claude Code.
- Claude cannot trigger its own slash commands; an external driver must submit them via the API/SDK.
- Goal: make EOS runs automatable while keeping user oversight and auditability.

## Objectives
- Provide ways to run slash-command triplets without manual typing.
- Maintain clarity in plan artifacts (`<user-action-required>`) for human execution when automation is unavailable.
- Preserve safety guardrails: explicit initiation, observable logs, ability to abort.

## Assumptions & Constraints
- We have access to the Claude Messages API/SDK for scripted interactions.
- Automation must respect rate limits and wait for each command’s completion before continuing.
- Need to record EOS outcomes back into `DEVNET-CHECKPOINT.txt` or similar tracking files.
- Solution should be optional (manual path remains valid).
- Toggle default behavior with the `DEVNET_EOS_AUTOMATE` environment variable (`true` means run the CLI automatically; anything else keeps manual prompts).

## Options

### Option 1 — Single-Run CLI Wrapper
- Implemented in this repo as `pnpm eos:run --spec "Contracts package bootstrap — zod schemas..."` (see `scripts/eos-run.mjs`). The plan instructs agents to check `DEVNET_EOS_AUTOMATE` to decide between this command and manual slash entries.
- Script behaviour:
  1. Send `/create-spec "<spec>"` to Claude.
  2. Wait for completion (stream or poll message status).
  3. Issue `/create-tasks` once the spec is ready.
  4. After tasks finish, trigger `/execute-tasks`.
  5. Capture outputs; optionally append to `DEVNET-CHECKPOINT.txt` or dedicated log.
- Command options:
  - `--conversation <id>` to reuse an existing thread.
  - `--dry-run` to print the three slash commands without sending them.
  - `--output <file>` to save JSONL logs per step.
- Phase docs can show both manual steps and the single command:
  ```bash
  pnpm eos:run --spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation..."
  ```
- Advantages: guarantees correct ordering, fewer user actions, easier integration with CI or makefiles.
- Considerations: still need graceful error handling (e.g., if `/create-tasks` fails, report and exit), plus ensuring the Claude Code CLI session is authenticated.

### Option 2 — Task Orchestrator Hook
- Integrate execution into an existing pipeline (Turbo task, GitHub Action, or local script) that calls the SDK wrapper when prerequisites are green.
- Can update `DEVNET-CHECKPOINT.txt` automatically upon success.
- Pros: fits existing automation workflows, centralizes verification.
- Cons: higher setup complexity; CI secrets management required.

### Option 3 — Tool-Calling Harness
- Run Claude via the API in tool-calling mode with a custom tool `triggerEOSCycle(params)`.
- Tool implementation issues slash commands sequentially and returns status to the conversation.
- Pros: keeps conversational flow while encapsulating automation logic.
- Cons: more advanced integration; must build and host the tool service.

### Option 4 — JSON Instruction + Executor Pattern
- Adjust plan outputs to emit structured JSON describing EOS cycles; external executor translates JSON into actual slash commands via SDK.
- Allows toggling automation by running (or not running) the executor.
- Pros: clear contract between plan and automation; future-proof for other agents.
- Cons: requires plan authoring updates and a separate watcher process.

## Evaluation Criteria
- Effort to implement and maintain.
- Compatibility with current infrastructure (local dev, CI).
- Observability: logging, error reporting, checkpoints.
- Security and session handling (Claude Code login state, repo access).
- Reversibility if automation misbehaves.

## Recommended Next Steps
1. Decide whether to prototype Option 1 (quickest path) or jump to an orchestrated solution.
2. Draft SDK script requirements: authentication, command sequencing, success detection, logging.
3. Validate with a dry run against a non-production Claude workspace.
4. Document runbook in `docs/standards/operations/eos-automation.md` if adopted.
5. Keep `<user-action-required>` blocks in phase files as fallback instructions.

## Open Questions
- Where should automation store run logs and outputs?
- Do we need a per-phase approval gate before automation fires slash commands?
- How will we detect command failure or partial completion, and who gets notified?
