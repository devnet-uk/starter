# DevNet Implementation Troubleshooting Guide

> **Solutions for common issues encountered during DevNet implementation**

## Quick Diagnosis

### System Health Check

Run this comprehensive check to identify issues:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 DevNet System Diagnosis:"
echo "Date: $(date)"
echo "Working Directory: $(pwd)"
echo ""

# Environment
echo "🌍 Environment:"
echo "- DEVNET_HOME: ${DEVNET_HOME:-'❌ UNSET'}"
echo "- Node: $(node --version 2>/dev/null || echo '❌ MISSING')"
echo "- pnpm: $(pnpm --version 2>/dev/null || echo '❌ MISSING')"
echo "- Git: $(git status >/dev/null 2>&1 && echo '✅ WORKING' || echo '❌ NOT A GIT REPO')"
echo ""

# Build Status
echo "🔨 Build Status:"
pnpm build >/dev/null 2>&1 && echo "- Build: ✅ SUCCESS" || echo "- Build: ❌ FAILING"
pnpm verify:local >/dev/null 2>&1 && echo "- Verification: ✅ PASSING" || echo "- Verification: ❌ FAILING"
echo ""

# Phase Status
echo "📋 Phase Status:"
if [ -f DEVNET-CHECKPOINT.txt ]; then
  grep -E "Phase [A-E].*COMPLETE|Phase [A-E].*✅" DEVNET-CHECKPOINT.txt | tail -3
else
  echo "❌ No checkpoint file found"
fi
```

## Phase-Specific Issues

### Phase A: Foundation Issues

**Issue**: `pnpm verify:local` command not found
```bash
# Solution: Add verify script to package.json
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check if script exists
grep -q "verify:local" package.json || echo "❌ Script missing"

# If missing, ask Claude Code to add:
# "scripts": { "verify:local": "pnpm lint && pnpm type-check && pnpm test" }
```

**Issue**: Git hooks not working
```bash
# Solution: Reinstall Husky
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check Husky installation
[ -d .husky ] && echo "✅ Husky directory exists" || echo "❌ Husky missing"

# Reinstall if needed
pnpm install
pnpm prepare

# Test pre-commit hook
echo "test" | git hash-object --stdin  # Should not error
```

**Issue**: TypeScript/Biome configuration errors
```bash
# Solution: Check configuration files
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Verify config files exist
[ -f tsconfig.base.json ] && echo "✅ TypeScript config" || echo "❌ Missing tsconfig.base.json"
[ -f biome.json ] && echo "✅ Biome config" || echo "❌ Missing biome.json"

# Test configurations
pnpm biome check . --diagnostic-level=info
pnpm tsc --noEmit
```

### Phase B: Architecture Issues

**Issue**: Circular dependency errors
```bash
# Solution: Check package dependencies
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "📦 Package Dependency Check:"
echo "- Contracts deps: $(grep -A10 '"dependencies"' packages/contracts/package.json | grep '@repo/' || echo 'none')"
echo "- Core deps: $(grep -A10 '"dependencies"' packages/core/package.json | grep '@repo/' || echo 'none')"
echo "- Infrastructure deps: $(grep -A10 '"dependencies"' packages/infrastructure/package.json | grep '@repo/' || echo 'none')"

# Correct dependency direction:
# Contracts: No @repo/ dependencies
# Core: Can depend on @repo/contracts
# Infrastructure: Can depend on @repo/contracts and @repo/core
```

**Issue**: OpenAPI generation fails
```bash
# Solution: Check contracts package setup
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Verify build script exists
grep -q "build:openapi" packages/contracts/package.json && echo "✅ Script exists" || echo "❌ Missing build:openapi script"

# Test OpenAPI generation
pnpm --filter @repo/contracts build:openapi

# If failing, check Zod schema exports
find packages/contracts/src -name "*.ts" | head -5
```

**Issue**: Architecture tests failing
```bash
# Solution: Check dependency cruiser or architecture rules
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check if dependency cruiser exists
[ -f .dependency-cruiser.config.js ] && echo "✅ Dependency cruiser config" || echo "❌ Missing config"

# Run architecture checks
pnpm lint:architecture 2>/dev/null || echo "❌ Architecture linting not configured"
```

### Phase C: Domain Issues

**Issue**: Test coverage below 100%
```bash
# Solution: Generate coverage report and identify gaps
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Run coverage report
pnpm --filter @repo/core test -- --coverage

# Check coverage files
find packages/core -name "coverage" -type d | head -1

# Common gaps:
# - Missing error path tests
# - Uncovered guard clauses
# - Domain event emission not tested
```

**Issue**: Domain event tests failing
```bash
# Solution: Check event emission and handlers
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find domain events
find packages/core -name "*Event*.ts" | head -5

# Common issues:
# - Events not properly emitted in use cases
# - Event handlers not tested
# - Missing event metadata (timestamp, correlation ID)
```

**Issue**: Repository interface mismatches
```bash
# Solution: Verify interface implementations
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check repository interfaces
find packages/infrastructure -name "*Repository*.ts" | head -3

# Check implementations (should be in-memory for testing)
find packages/core -name "*Repository*.ts" -o -name "*InMemory*.ts" | head -3

# Ensure interfaces match implementations
```

### Phase D: Delivery Issues

**Issue**: API routes not found/404 errors
```bash
# Solution: Check API route registration
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Verify API package structure
find packages/api/src -name "*route*.ts" | head -5

# Check route registration in main API file
find packages/api -name "index.ts" -o -name "app.ts" | head -1

# Test API server locally
pnpm --filter @repo/api dev &
curl http://localhost:4000/health  # Should return health status
```

**Issue**: Frontend build failures after FSD migration
```bash
# Solution: Check TypeScript path mapping
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Verify tsconfig.json paths
grep -A10 '"paths"' apps/web/tsconfig.json

# Should include:
# "@/shared/*": ["./src/shared/*"]
# "@/features/*": ["./src/features/*"]
# etc.

# Check import statements
grep -r "from '@/" apps/web/src | head -3
```

**Issue**: E2E tests failing or flaky
```bash
# Solution: Debug Playwright setup and test isolation
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check Playwright installation
pnpm --filter @repo/web e2e --version

# Run tests in debug mode
pnpm --filter @repo/web e2e --debug

# Common issues:
# - Test data not properly seeded/cleaned
# - Race conditions (missing waits)
# - Selector issues (elements not found)
# - Authentication state not properly managed
```

### Phase E: Production Issues

**Issue**: Health check endpoints failing
```bash
# Solution: Check health check implementation
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Test health endpoints
curl http://localhost:4000/health 2>/dev/null || echo "❌ Health endpoint not responding"
curl http://localhost:4000/ready 2>/dev/null || echo "❌ Ready endpoint not responding"

# Check implementation
find packages/api -name "*health*" -o -name "*status*" | head -3
```

**Issue**: Security scan failures
```bash
# Solution: Review and update dependencies
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Run security audit
pnpm audit

# Check for high/critical vulnerabilities
pnpm audit --audit-level=high

# Update dependencies
pnpm update

# Check specific vulnerability
pnpm audit --json | jq '.vulnerabilities'
```

**Issue**: Deployment pipeline failures
```bash
# Solution: Check CI/CD configuration
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Verify GitHub Actions workflows
find .github/workflows -name "*.yml" | head -3

# Check workflow syntax
for file in .github/workflows/*.yml; do
  echo "Checking $file:"
  yamllint "$file" 2>/dev/null || echo "⚠️ Install yamllint to check syntax"
done

# Common issues:
# - Missing environment variables in CI
# - Docker build context issues
# - Authentication/secrets not configured
```

## Common Error Patterns

### Build Errors

**"Module not found" errors**
```bash
# Check workspace configuration
grep -A5 -B5 "packages" pnpm-workspace.yaml

# Verify package names match
find packages -name "package.json" -exec grep -l '"name"' {} \; | xargs grep '"name"'

# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install
```

**TypeScript compilation errors**
```bash
# Check TypeScript configuration
pnpm tsc --noEmit

# Common fixes:
# - Update path mappings in tsconfig.json
# - Fix import/export statements
# - Check for missing type declarations
```

**Biome/ESLint errors**
```bash
# Run linting with details
pnpm lint --diagnostic-level=verbose

# Auto-fix issues
pnpm format --write
pnpm lint --apply

# Check for configuration conflicts
find . -name ".eslintrc*" -o -name "prettier.config*" | head -5
```

### Runtime Errors

**Port already in use**
```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different ports
export DEVNET_PORT_API=4002
export DEVNET_PORT_WEB=4003
```

**Database connection errors**
```bash
# Check database status
docker ps | grep postgres

# Restart database
docker-compose -f ~/Projects/devnet-database.yml restart

# Check connection string
echo $DATABASE_URL
```

**API/Frontend integration errors**
```bash
# Check API server is running
curl http://localhost:4000/api/health

# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:4000/api/auth/status
```

## Performance Issues

### Slow Build Times

```bash
# Check build performance
time pnpm build

# Enable turbo cache
export TURBO_CACHE_DIR=.turbo

# Clear build cache
rm -rf .turbo dist packages/*/dist

# Check for large dependencies
find node_modules -name "*.js" -size +1M | head -10
```

### High Memory Usage

```bash
# Monitor memory during build/test
top -p $(pgrep node)

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Run tests with memory profiling
pnpm test -- --detectOpenHandles --forceExit
```

### Slow Test Execution

```bash
# Run tests with timing
pnpm test -- --verbose

# Check for slow tests
pnpm test -- --listTests | head -10

# Parallelize test execution
pnpm test -- --maxWorkers=4
```

## Recovery Procedures

### Complete Reset

If all else fails, completely reset to a known good state:

```bash
# Stop all processes
pkill -f "node.*devnet"
pkill -f "pnpm.*dev"

# Reset git to last known good commit
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git log --oneline -10  # Find good commit
git reset --hard <commit-hash>
git clean -fd

# Clear all dependencies and caches
rm -rf node_modules packages/*/node_modules
rm -rf .turbo dist packages/*/dist
rm -rf coverage packages/*/coverage

# Reinstall everything
pnpm install
pnpm build
pnpm verify:local
```

### Phase-Specific Recovery

**Reset to Phase A completion:**
```bash
git reset --hard $(git log --grep="phase-a" --oneline | head -1 | cut -d' ' -f1)
```

**Reset to Phase B completion:**
```bash
git reset --hard $(git log --grep="phase-b" --oneline | head -1 | cut -d' ' -f1)
```

**Reset to specific step:**
```bash
# Find commit for specific step
git log --oneline --grep="step-b1\|contracts"
git reset --hard <commit-hash>
```

## Getting Help

### Debug Information to Collect

When asking for help, include:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "DevNet Debug Information:"
echo "========================"
echo "Date: $(date)"
echo "OS: $(uname -a)"
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo "Working directory: $(pwd)"
echo ""

echo "Phase Status:"
[ -f DEVNET-CHECKPOINT.txt ] && tail -5 DEVNET-CHECKPOINT.txt || echo "No checkpoint file"
echo ""

echo "Build Status:"
pnpm build >/dev/null 2>&1 && echo "Build: ✅" || echo "Build: ❌"
pnpm verify:local >/dev/null 2>&1 && echo "Verify: ✅" || echo "Verify: ❌"
echo ""

echo "Error Details:"
# Include specific error messages here
```

### Support Resources

- **Environment Setup**: [environment-setup.md](environment-setup.md)
- **Recovery Procedures**: [recovery-procedures.md](recovery-procedures.md)
- **Main Guide**: [EXECUTION-GUIDE.md](EXECUTION-GUIDE.md)

### External Resources

- [Node.js Troubleshooting](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [pnpm Troubleshooting](https://pnpm.io/troubleshooting)
- [Git Troubleshooting](https://git-scm.com/docs/git-help)
- [TypeScript Troubleshooting](https://www.typescriptlang.org/docs/handbook/troubleshooting.html)

---

**Remember**: When in doubt, the recovery procedures can always get you back to a known good state. Don't hesitate to reset and restart from a clean checkpoint if issues become complex.