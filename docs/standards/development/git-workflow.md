# Git Workflow

## Trunk-Based Development

### Branch Strategy
```bash
main (trunk)
├── feature/add-user-auth      # Short-lived (< 2 days)
├── fix/payment-validation      # Bug fixes
└── chore/update-dependencies  # Maintenance
```

### Branch Naming

<conditional-block task-condition="branch|branching" context-check="git-branch-naming">
IF task only involves branch creation or naming:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load branch naming conventions from development/git-workflow.md#branch-naming"
  </context_fetcher_strategy>
</conditional-block>

- `feature/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `refactor/` - Code improvements
- `docs/` - Documentation only
- `test/` - Test additions/fixes
- `perf/` - Performance improvements

### Commit Convention

<conditional-block task-condition="commit|committing" context-check="git-commit-format">
IF task only involves commit creation or formatting:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load commit conventions from development/git-workflow.md#commit-convention"
  </context_fetcher_strategy>
</conditional-block>

```bash
# Format: <type>(<scope>): <subject>
feat(auth): add OAuth2 integration
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
test(user): add integration tests for profile update
perf(db): optimize user query with index
refactor(ui): simplify button component logic
chore(deps): update dependencies to latest versions

# Breaking change
feat(api)!: change user endpoint response format

BREAKING CHANGE: The user endpoint now returns nested data structure
```

### Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding missing tests
- `chore` - Changes to build process or auxiliary tools
- `revert` - Reverts a previous commit

<!-- Verification block for git workflow configuration -->
<verification-block context-check="verification-git-workflow">
  <verification_definitions>
    <test name="git_repository_initialized">
      TEST: test -d .git
      REQUIRED: true
      ERROR: "Git repository not initialized. Run 'git init' to initialize repository."
      DESCRIPTION: "Asserts the repository is initialized to enable further git-related checks."
    </test>
    <test name="git_remote_origin_configured">
      TEST: git remote -v | grep -q '^origin\s'
      REQUIRED: true
      BLOCKING: true
      ERROR: "Git remote 'origin' is not configured. Add it with: git remote add origin <url>"
      FIX_COMMAND: "git remote add origin <url>"
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Ensures a default remote named 'origin' is set for pushing and CI integration."
    </test>
    <test name="default_branch_main">
      TEST: git symbolic-ref refs/remotes/origin/HEAD | grep -q 'refs/remotes/origin/main' || git branch -r | grep -q 'origin/main'
      REQUIRED: false
      ERROR: "Default branch should be 'main' for new repositories. Consider renaming from 'master'."
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Encourages using 'main' as the default branch on new repositories for consistency."
    </test>
    <test name="conventional_commit_format">
      TEST: git log -1 --pretty=format:"%s" | grep -E '^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+' || test $(git rev-list --count HEAD) -eq 0
      REQUIRED: false
      ERROR: "Latest commit doesn't follow conventional commit format: type(scope): description"
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Checks the latest commit message follows Conventional Commits to improve readability and automation."
    </test>
    <test name="branch_naming_convention">
      TEST: git branch --show-current | grep -E '^(feature|fix|chore|refactor|docs|test|perf)/[a-z0-9-]+$' || git branch --show-current | grep -E '^(main|master|develop)$'
      REQUIRED: false
      ERROR: "Current branch doesn't follow naming convention: type/description-with-hyphens"
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Encourages descriptive, type-prefixed branch names for clarity and tooling support."
    </test>
    <test name="no_merge_commits_on_feature">
      TEST: git branch --show-current | grep -E '^(main|master|develop)$' || ! git log --oneline -10 | grep -q '^[a-f0-9]* Merge '
      REQUIRED: false
      ERROR: "Feature branch contains merge commits. Use rebase workflow instead."
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Discourages merge commits on feature branches to keep history linear and easier to review."
    </test>
    <test name="phase_scopes_in_commits">
      TEST: test "${PROJECT_PHASES}" != "true" || git log --oneline -5 | grep -E '\(phase-[0-7]\):' || test $(git rev-list --count HEAD) -eq 0
      REQUIRED: false
      VARIABLES: ["PROJECT_PHASES"]
      ERROR: "Phased project commits should include phase scopes like (phase-0), (phase-1), etc."
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "When phases are used, ensures commit scope reflects the current phase for traceability."
    </test>
    <test name="working_dir_matches_project_name">
      TEST: test -z "${PROJECT_NAME}" || test "$(basename "$(pwd)")" = "${PROJECT_NAME}"
      REQUIRED: false
      BLOCKING: false
      VARIABLES: ["PROJECT_NAME"]
      ERROR: "Working directory does not match ${PROJECT_NAME}. Switch to the correct repo directory."
      FIX_COMMAND: "cd ~/Projects/${PROJECT_NAME}"
      DEPENDS_ON: ["git_repository_initialized"]
      DESCRIPTION: "Advisory: encourages running commands from the ${PROJECT_NAME} directory to reduce context errors."
    </test>
  </verification_definitions>
</verification-block>

### Pull Request Process

<conditional-block task-condition="pr|pull-request|pullrequest" context-check="git-pr-template">
IF task involves creating pull requests:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load PR template from development/git-workflow.md#pull-request-process"
  </context_fetcher_strategy>
</conditional-block>

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.logs left
- [ ] Breaking changes documented
```

### Git Hooks (Husky)

<conditional-block task-condition="husky|git-hooks|pre-commit" context-check="git-hooks-detailed">
IF task involves git hooks or pre-commit setup:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get detailed git hooks setup from development/local-quality.md#pre-commit-hooks-configuration"
  </context_fetcher_strategy>
</conditional-block>

#### Basic Configuration

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "test:pre-commit": "vitest related --run",
    "coverage:check": "vitest run --coverage --threshold=80"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

#### Hook Implementation

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit quality checks..."

# BiomeJS checks
pnpm biome check --apply . || exit 1

# Type checking  
pnpm type-check || exit 1

# Tests for changed files
pnpm test:pre-commit || exit 1

# Coverage threshold
pnpm coverage:check || exit 1

echo "✅ Pre-commit checks passed!"
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1"
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Full test suite
pnpm test || exit 1

# Build verification
pnpm build || exit 1

# Security audit
pnpm audit --audit-level moderate || exit 1

echo "✅ Pre-push checks passed!"
```

#### Lint-Staged Configuration

```json
// .lintstagedrc.json
{
  "*.{ts,tsx,js,jsx}": [
    "biome check --apply",
    "vitest related --run --passWithNoTests"
  ],
  "*.{json,md,yml}": [
    "biome format --write"
  ]
}
```

### Merge Strategy
- Squash and merge for feature branches
- Rebase and merge for fixes
- Create merge commit for releases

### Protected Branch Rules
- Require PR reviews (min 2)
- Require status checks to pass
- Require branches to be up to date
- Include administrators in restrictions
- Require conversation resolution

</conditional-block>
