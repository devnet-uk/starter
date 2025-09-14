# Workspace Checks

Confirm you are in the correct repository and workspace.

```
pwd  # should end with your product repository name (for example, devnet)
ls packages/  # should list expected workspace packages (for example, core, infrastructure)
```

If the directory does not match, switch to the product repository before continuing.

# Verification Note

Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.

# Commit Rules

Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.

# Workspace Quick Check

Quick single-line check to confirm you are in the expected product repository directory.

```
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```

# Required Workspaces

These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
