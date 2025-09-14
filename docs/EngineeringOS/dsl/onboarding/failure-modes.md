# Common Failure Modes and Fixes

- Wrong directory
  - Symptom: verification cannot find workspace files.
  - Fix: switch to the product repo; confirm with `pwd` and expected folders.

- Fake scripts
  - Symptom: scripts use `echo` and pass without doing work.
  - Fix: replace with real commands; verification will re-check.

- Missing TypeScript base config
  - Symptom: type checking rules not applied across workspace.
  - Fix: add `tsconfig.base.json` from standards templates.

- Missing git hooks
  - Symptom: pre-commit does not run checks.
  - Fix: ensure `"prepare": "husky install"` and initialize `.husky`.

- Coverage threshold not enforced
  - Symptom: tests pass with low coverage.
  - Fix: configure coverage to meet project target (for example, `98`).

