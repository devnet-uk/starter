# Engineering OS

**Better planning and execution for AI-assisted software development**

## What is Engineering OS?

Engineering OS is a system for working with AI agents to build software the right way—your way. It provides structured workflows, consistent standards, and specialized agents that help you plan, build, and deliver quality software faster and more reliably.

### Key Benefits

- 📋 **Structured Planning**: Clear product mission, roadmap, and feature specs
- ⚙️ **Proven Workflows**: Pre-built commands for common development tasks
- 📚 **Consistent Standards**: Automatically applied best practices and code quality
- 🤖 **Specialized Agents**: Purpose-built helpers for specific operations
- 🚀 **Team Alignment**: Everyone builds using the same high-quality approaches

## Quick Start

### Essential Commands

```bash
# Set up a new project
/plan-product

# Analyze existing codebase  
/analyze-product

# Plan a new feature
/create-spec "User authentication system"

# Generate task checklist
/create-tasks

# Build the feature with standards
/execute-tasks
```

## How It Works

Engineering OS follows a simple, proven workflow:

1. **📋 Plan** your product with clear mission and roadmap
2. **📄 Spec** features with detailed requirements and technical approach  
3. **✅ Execute** tasks with standards automatically applied
4. **🚢 Deliver** tested, documented code via pull requests

Verification gate: During `/execute-tasks`, a blocking verification step enforces the loaded standards (with profile variables like PROJECT_TYPE/PROJECT_COVERAGE). Work isn’t marked complete or merged until all BLOCKING tests pass.

### Example: Building User Authentication

```bash
# 1. Plan the feature
/create-spec "User registration and login with email verification"

# Creates detailed specification:
# - User stories and requirements
# - Technical implementation plan  
# - Database schema changes
# - API endpoints needed
# - Security considerations

# 2. Generate tasks  
/create-tasks

# Creates executable checklist:
# □ 1. Database Schema
#   □ 1.1 Create users table
#   □ 1.2 Add email verification fields
# □ 2. API Endpoints
#   □ 2.1 POST /auth/register
#   □ 2.2 POST /auth/login
# □ 3. Frontend Components
#   □ 3.1 Registration form
#   □ 3.2 Login form

# 3. Build with standards
/execute-tasks

# Implements with best practices:
# - Creates git branch
# - Follows security standards
# - Writes comprehensive tests
# - Documents all changes
# - Creates pull request
```

## Core Components

### 1. Commands (.claude/commands/)
Pre-built workflows for common development tasks:

| Command | Purpose | What It Creates |
|---------|---------|-----------------|
| `/plan-product` | Set up new project | Product mission, tech stack, roadmap |
| `/analyze-product` | Analyze existing code | Product context from codebase |
| `/create-spec` | Plan new features | Detailed feature specifications |
| `/create-tasks` | Generate task lists | Executable checklists from specs |
| `/execute-tasks` | Build features | Tested code with documentation |
| `/refactor-codebase` | Improve existing code | Phased refactoring plans with metrics |

### 2. Standards (docs/standards/)
Best practices automatically applied during development:

- **Architecture**: Clean architecture, DDD, SOLID principles
- **Code Style**: TypeScript, React, CSS, naming conventions  
- **Security**: API security, authentication, dependency scanning
- **Development**: Testing, CI/CD, git workflow, documentation
- **Performance**: Bundle optimization, Core Web Vitals, monitoring
- **Stack-Specific**: Drizzle, Hono, Next.js, Vercel, Zustand patterns

### Planning Guidance

See Planning Guiding Principles for how to plan with verifications and gates:
- docs/EngineeringOS/planning-guiding-principles.md
 - docs/EngineeringOS/dsl/authoring-guide.md

### 3. Agents (.claude/agents/)
Specialized helpers that work together seamlessly:

| Agent | Handles | Used By |
|-------|---------|---------|
| `context-fetcher` | Standards & documentation retrieval | All commands |
| `file-creator` | File & directory creation with templates | create-spec, create-tasks |
| `git-workflow` | Version control, branching, PRs | execute-tasks |
| `test-runner` | Test execution & failure analysis | execute-tasks |
| `project-manager` | Task tracking & documentation | execute-tasks |
| `date-checker` | Date operations for file naming | create-spec, create-tasks |
| `verification-runner` | Automated standards compliance checking | create-spec, execute-tasks |
| `code-analyzer` | Parallel code quality analysis | refactor-codebase |
| `dependency-mapper` | Monorepo dependency impact analysis | refactor-codebase |
| `metrics-tracker` | Progress tracking and success validation | refactor-codebase |

### 4. Product Documentation (docs/product/)
Structured planning and context:

- **`mission.md`** - Product vision, users, key features
- **`roadmap.md`** - Development phases and priorities
- **`tech-stack.md`** - Technology choices and configurations  
- **`specs/`** - Individual feature specifications with tasks

## Development Workflows

### New Project Setup
```bash
/plan-product
# Creates complete product foundation:
# - Mission and value proposition
# - Target users and use cases
# - Technology stack decisions
# - Roadmap with development phases
```

### Existing Project Integration
```bash
/analyze-product  
# Analyzes your codebase and generates:
# - Product context from code patterns
# - Technology stack documentation
# - Development roadmap based on current features
```

### Feature Development Lifecycle
```bash
# 1. Plan the feature
/create-spec "User profile management system"

# 2. Generate executable tasks
/create-tasks  

# 3. Build with standards
/execute-tasks

# Result: Complete feature with tests, documentation, and PR
```

### Real Example: E-commerce Cart Feature

```bash
/create-spec "Shopping cart with persistent storage and checkout"

# Creates specification with:
# ✅ User stories (add items, persist cart, checkout flow)
# ✅ Technical requirements (database schema, API endpoints)  
# ✅ Security considerations (user sessions, payment data)
# ✅ Performance requirements (cart updates, checkout speed)

/create-tasks

# Generates detailed task list:
# □ 1. Database Schema
#   □ 1.1 Create cart_items table with Drizzle
#   □ 1.2 Add user relationship and constraints
#   □ 1.3 Write and run database migration
# □ 2. API Endpoints  
#   □ 2.1 POST /api/cart/add with validation
#   □ 2.2 GET /api/cart with user filtering
#   □ 2.3 DELETE /api/cart/:id with auth
# □ 3. Frontend Components
#   □ 3.1 CartItem component with quantity controls
#   □ 3.2 CartSummary with pricing calculations
#   □ 3.3 CheckoutButton with payment integration

/execute-tasks

# Implements everything with:
# ✅ Drizzle database patterns from standards
# ✅ HonoJS API security best practices  
# ✅ React component architecture standards
# ✅ Comprehensive test coverage
# ✅ Git workflow with feature branch and PR
```

### Refactoring Existing Code
```bash
/refactor-codebase "Improve type safety and reduce bundle size"

# Analyzes codebase with parallel tools:
# - Code quality issues (BiomeJS, complexity)
# - Circular dependencies (madge) 
# - Dead code detection (knip)
# - Type coverage analysis (type-coverage)

# Generates phased refactoring plan:
# 📋 Phase 1: Low Risk (2-4 hours)
#   - Automated BiomeJS fixes
#   - Add missing TypeScript types
#   - Remove unused imports and variables
# 📋 Phase 2: Medium Risk (1-2 days)  
#   - Break circular dependencies
#   - Extract custom hooks
#   - Optimize component rendering
# 📋 Phase 3: High Risk (3+ days)
#   - Restructure for Clean Architecture
#   - Implement proper layer separation
#   - Major API refactoring with migration

# Execute each phase safely:
/create-tasks --spec "phase-1-low-risk"
/execute-tasks
# Validates: All tests pass, metrics improved, no regressions

## Validation & Verification Utilities

- Standards validator (Node ESM, zero-deps):
  - Run locally: `node scripts/validate-standards.mjs`
  - CI: GitHub Action `.github/workflows/validate-standards.yml` runs this on push/PR to `main`.

- Verification shim (Node ESM, zero-deps):
  - Run on specific standards files: 
    - `node scripts/verification-shim.mjs --files=docs/standards/development/git-workflow.md --mode=blocking`
  - Modes: `blocking` (default) or `advisory`.
  - Enforces allowlist (no network, no writes, no jq/yq); JSON/YAML parsing via Node, not external CLIs.

If `package.json` scripts are available, you can also run:

```bash
pnpm validate:standards   # or npm run validate:standards
pnpm verify:local -- --files=docs/standards/development/git-workflow.md --mode=blocking
```

/create-tasks --spec "phase-2-medium-risk"  
/execute-tasks
# Validates: Architecture compliance, performance maintained

# Results:
# ✅ Type coverage: 67% → 89% 
# ✅ Bundle size: -18KB (reduced)
# ✅ Code complexity: 34 → 12 (simplified)
# ✅ Zero circular dependencies
# ✅ All tests passing
```

## How Standards Work

Standards automatically ensure consistent, high-quality code:

1. **Smart Loading**: Only relevant standards loaded based on your task
2. **Automatic Application**: Best practices applied without manual effort
3. **Team Consistency**: Everyone follows the same proven patterns
4. **Quality Assurance**: Common mistakes and security issues prevented
5. **Automated Verification**: Standards include automated tests to verify compliance

### Example: React Component Standards
When you build a React component, the system automatically:

**Applies Standards:**
- TypeScript interfaces for props and state
- Proper component naming conventions  
- Testing patterns with React Testing Library
- Performance optimization (memo, callbacks)
- Accessibility requirements

**Verifies Compliance:**
- Tests exist for all components
- Coverage meets project thresholds (85-98%)
- TypeScript strict mode enabled
- No accessibility violations
- Performance best practices followed

## Customization

Adapt Engineering OS to your team's preferences:

### Custom Standards
Add your team's specific patterns to `docs/standards/`:
```bash
# Add new technology standard
docs/standards/stack-specific/your-framework.md

# Add custom code style  
docs/standards/code-style/your-patterns.md
```

### Custom Commands
Create workflows specific to your domain:
```bash
# Add deployment workflow
.claude/commands/deploy-production.md

# Add onboarding process
.claude/commands/setup-developer.md  
```

### Technology Stack
Configure your preferred technologies in:
```bash
docs/product/tech-stack.md
# Framework, database, styling, deployment choices
```

## Benefits for Teams

- **Faster Onboarding**: New developers follow established patterns immediately
- **Consistent Quality**: All code meets the same high standards
- **Reduced Review Time**: Less back-and-forth on style and architecture  
- **Better Collaboration**: Shared vocabulary and approaches across team
- **Scalable Growth**: System handles increasing complexity and team size

## Technical Implementation

For developers who want to understand or customize the DSL system:

- **[Agent Instructions](docs/EngineeringOS/dsl/AGENT-INSTRUCTIONS.md)** - How agents process commands and standards
- **[DSL Specification](docs/EngineeringOS/dsl/dsl-specification.md)** - Complete syntax and architecture reference
- **[DSL Developer Guide](docs/EngineeringOS/dsl/DSL-GUIDE.md)** - Practical guide for creating standards and commands
- **[Verification Authoring](docs/EngineeringOS/dsl/verification/)** - How to write verification blocks, schema, variables, and examples

## Get Started Today

1. **Try it**: Run `/plan-product` to set up your first project
2. **Build something**: Use `/create-spec` to plan a feature  
3. **Execute**: Run `/execute-tasks` to see standards in action
4. **Customize**: Modify standards to match your team's way of working

Engineering OS transforms how you work with AI agents—structured, consistent, and aligned with your team's standards.
