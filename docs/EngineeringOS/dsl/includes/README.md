# Includes Quick Guide

- Author shared snippets once here, then include them in many docs with quote-by-reference.
- After editing a source section, refresh dependent includes and verify with the linter.

## Compute or refresh includes

- Print include header and content for a source anchor:
```
node scripts/include-helper.mjs print \
  --source=docs/EngineeringOS/dsl/includes/common-snippets.md \
  --anchor=required-workspaces
```

- Refresh the include blocks in specific targets:
```
node scripts/include-helper.mjs refresh \
  --source=docs/EngineeringOS/dsl/includes/common-snippets.md \
  --anchor=required-workspaces \
  --targets=devnet-plan/phases/phase-2-use-cases.md,devnet-plan/phases/phase-3-infrastructure.md
```

- Refresh across the repository:
```
node scripts/include-helper.mjs refresh \
  --source=docs/EngineeringOS/dsl/includes/common-snippets.md \
  --anchor=required-workspaces \
  --all
```

## Verify includes

- Run the linter locally (non-blocking in CI):
```
node scripts/lint-quote-references.mjs
```

If it reports a hash mismatch or content drift, run the refresh step above.
