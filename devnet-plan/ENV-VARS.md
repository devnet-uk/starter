# Environment Variables for devnet plan execution

Set these variables in your shell profile or a local `.env` (do not commit secrets):

- `DEVNET_HOME` — absolute path to the devnet implementation repository (example: `~/Projects/devnet`).
- `ENGINEERING_OS_HOME` — absolute path to the Engineering OS repository (example: `~/Projects/devnet.clean_architecture`).
- `DEVNET_PORT_API` — application programming interface port (default `4000`).
- `DEVNET_PORT_WEB` — web application port (default `4001`).
- `VERIFICATION_MODE` — `blocking` (default) or `advisory` for verification runs.

Recommended: keep a checked-in example config (`devnet-plan/plan-config.example.json`) and load it in your editor workspace for agents to reference when resolving paths.

