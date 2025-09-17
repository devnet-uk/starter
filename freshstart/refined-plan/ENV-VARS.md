# Environment Variables for Refined DevNet Plan Execution

These variables mirror the controls defined in `devnet-plan/ENV-VARS.md` and remain the canonical source for configuring Engineering OS workflows. Set them in your shell profile or load them via direnv; never commit secrets.

- `DEVNET_HOME` — absolute path to the primary implementation repository (default: `~/Projects/devnet`).
- `ENGINEERING_OS_HOME` — absolute path to the standards reference repository (default: `~/Projects/devnet.starter`).
- `DEVNET_PORT_API` — local API port (default `4000`).
- `DEVNET_PORT_WEB` — local web port (default `4001`).
- `DEVNET_GIT_REMOTE` — canonical GitHub remote URL for the implementation repo (example: `git@github.com:your-org/devnet.git`). Keep this in sync with `origin` when bootstrapping.
- `VERIFICATION_MODE` — `blocking` (default) or `advisory`; affects `/execute-tasks` runner behavior.
- `DEVNET_EOS_AUTOMATE` — set to `true` to have Claude run `pnpm eos:run` automatically where noted; unset/false keeps the manual slash-command steps.

Tip: Keep the JSON sample in `freshstart/refined-plan/plan-config.example.json` synchronized with these defaults so agents can resolve paths/ports automatically.
