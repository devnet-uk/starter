# Engineering OS Quickstart (30-minute guided run)

This walkthrough demonstrates the full flow using a tiny sample spec.

- Create a sample spec folder (today’s date + `sample`)
- Run `/create-tasks` and then `/execute-tasks`
- Observe verification in blocking mode, fix one failure, re-run

Steps
1) Create spec
```
/create-spec "Sample Setup — minimal repo config with strict TypeScript and Biome"
```
2) Generate tasks
```
/create-tasks
```
3) Execute tasks (verification runs in Step 6)
```
/execute-tasks
```
4) If verification fails, follow the printed Fix Command(s), then run `/execute-tasks` again.

Expected outcome
- One or more simple blocking failures (for example, missing TypeScript base config) fixed and green.
- `verification-runner` output shows passed checks, then post-execution steps run.

Notes
- Always consult standards through `docs/standards/standards.md` routed by the command; do not grep the tree.
- Keep the editor workspace open to both the product repo and this repository.

