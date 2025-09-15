# Option 4: Phoenix Rebuild - Comprehensive Implementation Plan

## Executive Summary

Complete greenfield rebuild of DevNet SaaS Application Template using perfect Clean Architecture principles in a **separate repository** at `~/Projects/devnet-phoenix/`. This plan leverages the Engineering OS framework throughout all phases with commit/push points at major milestones.

## Repository Setup Requirements

### GitHub Repository Creation
✅ **Repository Created:** https://github.com/devnet-uk/devnet-phoenix.git

The GitHub repository has been created and is ready for the initial push.

## Timeline: 16-20 Weeks

### Phase 0: Infrastructure & Project Setup (Week 0)
### Phase 1: Core Domain Layer (Weeks 1-3)  
### Phase 2: Use Cases & Business Logic (Weeks 4-6)
### Phase 3: Infrastructure Layer (Weeks 7-9)
### Phase 4: Interface Adapters (Weeks 10-12)
### Phase 5: Presentation Layer (Weeks 13-15)
### Phase 6: Migration & Deployment (Weeks 16-18)
### Phase 7: Optimization & Handover (Weeks 19-20)

---

## Phase 0: Infrastructure & Project Setup (Week 0)

### Objectives
- Create new Phoenix repository structure
- Configure monorepo workspace
- Setup Engineering OS framework
- Establish development environment

### Implementation Steps

#### Step 0.1: Create Phoenix Repository
```bash
# Create new directory structure (SEPARATE from current project)
mkdir ~/Projects/devnet-phoenix
cd ~/Projects/devnet-phoenix

# Initialize git repository
git init
git branch -M main

# Add remote origin to the created GitHub repository
git remote add origin https://github.com/devnet-uk/devnet-phoenix.git
```

#### Step 0.2: Initialize Monorepo Structure
```bash
# Create base structure
mkdir -p apps packages docs tooling .claude

# Initialize pnpm workspace
pnpm init

# Create workspace configuration
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
EOF

# Copy Engineering OS framework
cp -r ~/Projects/devnet.clean_architecture/.claude/* .claude/
cp -r ~/Projects/devnet.clean_architecture/docs/EngineeringOS docs/
cp -r ~/Projects/devnet.clean_architecture/docs/standards docs/
```

#### Step 0.3: Setup Core Packages
```bash
# Create core packages structure
mkdir -p packages/core/{domain,use-cases,interfaces}
mkdir -p packages/infrastructure/{database,services,config}
mkdir -p packages/contracts/{api,domain,schemas}
mkdir -p packages/ui/{components,design-tokens}
mkdir -p packages/auth
mkdir -p packages/api

# Initialize each package
for pkg in packages/*/; do
  cd $pkg
  pnpm init
  cd ../..
done
```

#### Step 0.4: Configure Development Environment
```bash
# Install base dependencies
pnpm add -w -D typescript@5.9.0 @types/node@22 turbo@2.5.6 tsup vitest @biomejs/biome@2.2.2

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@devnet/core": ["./packages/core/src"],
      "@devnet/contracts": ["./packages/contracts/src"],
      "@devnet/infrastructure": ["./packages/infrastructure/src"]
    }
  }
}
EOF

# Setup Turbo configuration
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {},
    "test": {}
  }
}
EOF
```

#### Step 0.5: Create CLAUDE.md
```bash
cat > CLAUDE.md << 'EOF'
# Phoenix Project - Clean Architecture Rebuild

This is the Phoenix rebuild of DevNet SaaS Application Template.

## Architecture
- Pure Clean Architecture implementation
- Domain-Driven Design with rich models
- Contract-Driven Development
- Feature-Sliced Design for frontend

## Status
Currently in active development - migrating from legacy codebase.

## Development
- Legacy system: http://localhost:3000
- Phoenix system: http://localhost:4000
EOF
```

### 🔄 Commit Point 1: Project Infrastructure
```bash
git add .
git commit -m "feat: initialize Phoenix project infrastructure

- Setup monorepo structure with pnpm workspaces
- Configure TypeScript and Turbo
- Add Engineering OS framework
- Establish package architecture"

git push -u origin main
```

---

## Phase 1: Core Domain Layer (Weeks 1-3)

### Using Engineering OS Commands

#### Week 1: Domain Entities Spec
```bash
# Create domain entities specification
/create-spec "Core Domain Entities - User, Organization, AI Chat models with rich business logic"

# After spec review
/create-tasks

# Execute implementation
/execute-tasks
```

### 🔄 Commit Point 2: Domain Entities Complete
```bash
git add .
git commit -m "feat(domain): implement core domain entities

- User entity with business rules
- Organization entity with membership logic
- AI Chat entity with conversation management
- Rich domain models with behavior"

git push
```

#### Week 2: Domain Services Spec
```bash
/create-spec "Domain Services - Business rule enforcement, cross-entity operations"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 3: Domain Services Complete
```bash
git add .
git commit -m "feat(domain): add domain services layer

- Authorization service with dual-context
- Subscription management service
- AI conversation orchestration service
- Cross-entity business rule enforcement"

git push
```

#### Week 3: Domain Events & Value Objects
```bash
/create-spec "Domain Events and Value Objects - Event system, Email, Money, UserId value objects"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 4: Domain Layer Complete
```bash
git add .
git commit -m "feat(domain): complete domain layer implementation

- Domain event system
- Value objects for type safety
- Aggregate root patterns
- Domain validation rules"

git push
git tag -a "v0.1.0-domain" -m "Domain layer complete"
git push --tags
```

---

## Phase 2: Use Cases & Business Logic (Weeks 4-6)

#### Week 4: Authentication Use Cases
```bash
/create-spec "Authentication Use Cases - Sign up, sign in, password reset, MFA, session management"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 5: Auth Use Cases Complete
```bash
git add .
git commit -m "feat(use-cases): implement authentication workflows

- User registration with validation
- Multi-factor authentication
- Password reset flow
- Session management"

git push
```

#### Week 5: Organization Management Use Cases
```bash
/create-spec "Organization Use Cases - Create, invite members, manage roles, billing"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 6: Organization Use Cases Complete
```bash
git add .
git commit -m "feat(use-cases): add organization management

- Organization creation and setup
- Member invitation system
- Role-based access control
- Billing and subscription management"

git push
```

#### Week 6: AI Chat Use Cases
```bash
/create-spec "AI Chat Use Cases - Create conversations, streaming responses, history management"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 7: Use Cases Layer Complete
```bash
git add .
git commit -m "feat(use-cases): complete business logic layer

- AI chat conversation management
- Streaming response handling
- Token usage tracking
- Conversation persistence"

git push
git tag -a "v0.2.0-use-cases" -m "Use cases layer complete"
git push --tags
```

---

## Phase 3: Infrastructure Layer (Weeks 7-9)

#### Week 7: Database Infrastructure
```bash
/create-spec "Database Infrastructure - PostgreSQL setup, Drizzle ORM repositories, migrations"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 8: Database Layer Complete
```bash
git add .
git commit -m "feat(infrastructure): implement database layer

- PostgreSQL connection management
- Drizzle ORM configuration
- Repository implementations
- Migration system setup"

git push
```

#### Week 8: External Services
```bash
/create-spec "External Services - OpenAI integration, Stripe payments, Email service, Analytics"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 9: External Services Complete
```bash
git add .
git commit -m "feat(infrastructure): add external service integrations

- OpenAI/Anthropic AI providers
- Stripe payment processing
- Email service (Resend/SendGrid)
- Analytics and monitoring"

git push
```

#### Week 9: Authentication Infrastructure
```bash
/create-spec "Auth Infrastructure - Better-Auth setup, session management, OAuth providers"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 10: Infrastructure Complete
```bash
git add .
git commit -m "feat(infrastructure): complete infrastructure layer

- Better-Auth integration
- Session persistence
- OAuth provider setup
- Security middleware"

git push
git tag -a "v0.3.0-infrastructure" -m "Infrastructure layer complete"
git push --tags
```

---

## Phase 4: Interface Adapters (Weeks 10-12)

#### Week 10: API Controllers
```bash
/create-spec "API Controllers - HonoJS REST endpoints, request validation, response formatting"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 11: API Controllers Complete
```bash
git add .
git commit -m "feat(api): implement REST API controllers

- HonoJS route handlers
- Request validation with Zod
- Response formatting
- Error handling middleware"

git push
```

#### Week 11: Contract-Driven Bridge
```bash
/create-spec "Contract Implementation - Type-safe API contracts, Zod schemas, OpenAPI generation"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 12: Contracts Complete
```bash
git add .
git commit -m "feat(contracts): add contract-driven development

- Type-safe API contracts
- Shared Zod schemas
- OpenAPI documentation
- End-to-end type safety"

git push
```

#### Week 12: WebSocket & Streaming
```bash
/create-spec "Real-time Features - WebSocket setup, AI streaming, live updates"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 13: Interface Adapters Complete
```bash
git add .
git commit -m "feat(adapters): complete interface adapters layer

- WebSocket connections
- Server-sent events
- AI streaming handlers
- Real-time subscriptions"

git push
git tag -a "v0.4.0-adapters" -m "Interface adapters complete"
git push --tags
```

---

## Phase 5: Presentation Layer (Weeks 13-15)

#### Week 13: Next.js App Setup with FSD
```bash
/create-spec "Next.js Application - App router setup, Feature-Sliced Design structure, layouts"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 14: Next.js Foundation Complete
```bash
git add .
git commit -m "feat(web): initialize Next.js with FSD

- Next.js 15.5 app router
- Feature-Sliced Design structure
- Layout components
- Routing configuration"

git push
```

#### Week 14: Core Features UI
```bash
/create-spec "Core UI Features - Authentication flows, Dashboard, Organization management UI"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 15: Core Features Complete
```bash
git add .
git commit -m "feat(web): implement core feature UIs

- Authentication pages
- User dashboard
- Organization management
- Settings interfaces"

git push
```

#### Week 15: AI Chat Interface
```bash
/create-spec "AI Chat UI - Conversation interface, streaming responses, history view"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 16: Presentation Layer Complete
```bash
git add .
git commit -m "feat(web): complete presentation layer

- AI chat interface
- Streaming response display
- Conversation history
- Responsive design"

git push
git tag -a "v0.5.0-presentation" -m "Presentation layer complete"
git push --tags
```

---

## Phase 6: Migration & Deployment (Weeks 16-18)

#### Week 16: Data Migration
```bash
/create-spec "Data Migration - Migration scripts, data transformation, validation"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 17: Data Migration Ready
```bash
git add .
git commit -m "feat(migration): add data migration system

- Migration scripts for all entities
- Data transformation logic
- Validation and rollback
- Progress tracking"

git push
```

#### Week 17: Parallel Deployment
```bash
/create-spec "Deployment Setup - Vercel configuration, environment setup, monitoring"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 18: Deployment Ready
```bash
git add .
git commit -m "feat(deployment): configure production deployment

- Vercel configuration
- Environment variables
- Monitoring setup
- Performance optimization"

git push
```

#### Week 18: Cutover Strategy
```bash
/create-spec "Cutover Plan - Feature flags, gradual migration, rollback procedures"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 19: Cutover Complete
```bash
git add .
git commit -m "feat(migration): implement cutover strategy

- Feature flag system
- Gradual user migration
- Rollback procedures
- Health monitoring"

git push
git tag -a "v1.0.0-beta" -m "Beta release - migration ready"
git push --tags
```

---

## Phase 7: Optimization & Handover (Weeks 19-20)

#### Week 19: Performance Optimization
```bash
/create-spec "Performance Optimization - Caching, query optimization, bundle size"
/create-tasks
/execute-tasks
```

### 🔄 Commit Point 20: Optimization Complete
```bash
git add .
git commit -m "perf: optimize application performance

- Implement caching strategies
- Optimize database queries
- Reduce bundle size
- Add performance monitoring"

git push
```

#### Week 20: Documentation & Handover
```bash
/create-spec "Documentation - Architecture docs, API docs, deployment guide, runbooks"
/create-tasks
/execute-tasks
```

### 🔄 Final Commit: Production Ready
```bash
git add .
git commit -m "docs: complete documentation and handover

- Architecture documentation
- API documentation
- Deployment guides
- Operational runbooks"

git push
git tag -a "v1.0.0" -m "Production release - Phoenix complete"
git push --tags
```

---

## Parallel Development Strategy

### Port Configuration
- **Legacy System**: http://localhost:3000 (current DevNet)
- **Phoenix System**: http://localhost:4000 (new Phoenix)
- **Phoenix API**: http://localhost:4001
- **Database**: PostgreSQL on 5432 (shared initially, separate later)

### Development Workflow
1. Both systems run simultaneously during development
2. Phoenix development in `~/Projects/devnet-phoenix/`
3. Legacy reference in `~/Projects/devnet.clean_architecture/`
4. No code sharing - only reference and analysis

### Environment Separation
```bash
# Phoenix .env.local
NEXT_PUBLIC_APP_URL=http://localhost:4000
API_URL=http://localhost:4001
DATABASE_URL=postgresql://...?schema=phoenix

# Legacy .env.local (unchanged)
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001
DATABASE_URL=postgresql://...?schema=public
```

---

## Risk Mitigation

### Commit Strategy Benefits
- **Atomic Progress**: Each commit represents a complete, working feature
- **Easy Rollback**: Can revert to any previous milestone
- **Progress Tracking**: Clear visibility of implementation progress
- **Team Collaboration**: Multiple developers can work on tagged versions
- **Continuous Integration**: CI/CD triggered on each push

### Backup Points
- Tag major milestones for easy reference
- Create branches for experimental features
- Maintain feature flags for gradual rollout
- Keep legacy system running until Phoenix is proven

---

## Success Metrics

### Per-Phase Validation
- **Domain Layer**: All entities have 100% test coverage
- **Use Cases**: Business logic isolated from frameworks
- **Infrastructure**: All external dependencies abstracted
- **Adapters**: Type-safe contracts end-to-end
- **Presentation**: Lighthouse score > 95
- **Migration**: Zero data loss, < 5 minute downtime
- **Optimization**: 50% performance improvement

### Final Validation
- All 436 features successfully migrated
- Clean Architecture compliance score: 10/10
- Test coverage > 80% for business logic
- Zero critical security vulnerabilities
- Performance metrics exceed legacy system

---

## Team Requirements

### Core Team (4-6 developers)
- **Lead Architect**: Clean Architecture expert
- **2 Backend Engineers**: Domain/Use Cases focus
- **2 Frontend Engineers**: FSD/React expertise
- **DevOps Engineer**: Infrastructure/deployment

### Engineering OS Proficiency
All team members should be familiar with:
- `/create-spec` command usage
- `/create-tasks` workflow
- `/execute-tasks` implementation
- Engineering OS standards documentation

---

## Conclusion

This Phoenix rebuild plan provides:
- ✅ Complete Clean Architecture implementation
- ✅ Systematic Engineering OS integration
- ✅ Regular commit/push points for progress tracking
- ✅ Separate repository for clean separation
- ✅ Parallel development capability
- ✅ Zero-downtime migration strategy
- ✅ Comprehensive risk mitigation

The plan ensures perfect architectural compliance while maintaining business continuity throughout the migration process.