# Verification Governance

Status: Draft for greenfield rollout

## Purpose
Define safe, deterministic, and portable execution rules for verification tests embedded in Engineering OS standards.

## Mode
- Default: `blocking` — any BLOCKING=true failure halts execution; tasks cannot be completed until fixed.
- Optional: `advisory` — do not halt; report failures and let the caller decide (must be explicitly set).

## Safety Policy
- No network access by default (no `curl`, `wget`, `git fetch`, package installs).
- No file mutations (no writes, chmod, sed -i) in tests.
- Read-only Git usage only (e.g., `git log`, `git branch --show-current`).
- 30s timeout per test; independent tests may run in parallel.
- Cross-platform compatibility (macOS/Linux) is required; prefer portable commands.

## Command Allowlist (default)
- Shell builtins and safe primitives: `test`, `ls`, `cat`, `grep`, `sed`.
- Git read-only: `git` commands that do not modify state (e.g., `git log`, `git branch --show-current`).
- JSON/YAML parsing: performed via Node ESM in the verification shim; do not rely on external CLI tools.

Disallowed by default:
- Network access: `curl`, `wget`, external API calls, package installs.
- State changes: file writes, `chmod`, `sed -i`, `git fetch`/`git push`/`git commit`.
- External CLI JSON/YAML parsers: `jq`, `yq`.

## Variable Substitution
Runner must substitute variables before execution, with deterministic extraction and fallbacks:
- `${PROJECT_TYPE}`: `greenfield` (default for this repo), otherwise detect from repo indicators.
- `${PROJECT_COVERAGE}`: extract from config/scripts; fallback by profile (greenfield → 98%).
- `${PACKAGE_MANAGER}`: detect from lockfile preference.
- `${PROJECT_PHASES}`: detect from roadmap/commits; default `false`.

## Routing and Scope
- Standards must be loaded via the root dispatcher and category dispatchers, honoring weighted intent precedence:
  1) security 2) development 3) architecture 4) performance 5) stack-specific 6) best-practices.
- Verification extraction is limited to the standards actually loaded into context by the routing rules.

## Output and Errors
- Provide clear pass/fail summary, with failed tests listed and actionable `FIX_COMMAND` where safe.
- Halt immediately on BLOCKING=true failures in `blocking` mode.
- Record skipped tests due to failed dependencies or missing prerequisites.

## Profiles
- Greenfield (default here): strict; BLOCKING for critical checks (type safety, fake scripts, coverage threshold, essential git hygiene).
- Advisory usage must be explicitly set by the caller; default remains `blocking` for this repo.

## Cross-Platform Guidance
- Avoid `sed -i` in-place edits; prefer read-only checks or Node parsing via the shim.
- Avoid OS-specific `stat` flags; use portable patterns.

## Authoring Guidance (summary)
- Keep tests non-destructive and independent where possible.
- Prefer read-only assertions and provide `FIX_COMMAND` suggestions.
- Gate strict checks via variables/profiles when applicable.

