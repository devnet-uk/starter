# Practice Sandbox

Purpose
- Safe place to practice the command flow and see verification failures.

Setup
- Create a tiny repo with a single `package.json` missing real scripts (uses `echo`).
- Omit `tsconfig.base.json` and `.husky` to trigger common failures.

Exercise
1) Run `/create-spec` for minimal setup.
2) Run `/create-tasks`.
3) Run `/execute-tasks` and observe blocking failures.
4) Apply each Fix Command printed by verification, then re-run.

Expected
- Verification blocks failures on fake scripts and TypeScript config until fixed.
- After fixes, verification passes and post-execution tasks run.

