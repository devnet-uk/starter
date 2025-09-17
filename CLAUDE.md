# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Engineering OS Integration

This project includes **Engineering OS** - a structured system for AI-assisted software development. Engineering OS provides workflows, standards, and specialized agents for consistent, high-quality development.

### Core Engineering OS Commands
- **`/plan-product`** - Set up new project with mission, roadmap, and tech stack
- **`/analyze-product`** - Analyze existing codebase and generate product context
- **`/create-spec`** - Plan new features with detailed specifications
- **`/create-tasks`** - Generate executable task checklists from specs
- **`/execute-tasks`** - Build features with automated standards compliance
- **`/refactor-codebase`** - Improve existing code with phased refactoring plans

### Standards and Verification
- **Standards Location**: `docs/standards/` - Automatically applied best practices
- **Standards Categories**: Architecture, Code Style, Security, Development, Performance, Stack-Specific
- **Validation**: `pnpm validate:standards` - Validate standards compliance
- **Verification**: `pnpm verify:local` - Run verification tests locally
- **Workflow**: All development includes blocking verification gates to ensure quality

## Development Commands

### Core Development
- **Development server**: `pnpm dev` - Starts all services with live reload
- **Build**: `pnpm build` - Builds all packages and applications
- **Start production**: `pnpm start` - Starts built applications
- **Lint**: `pnpm lint` (using Biome) or `biome lint .`
- **Format**: `pnpm format` (using Biome) or `biome format . --write`
- **Type check**: `pnpm --filter @repo/web type-check` for web app

### Database Operations (Drizzle ORM)
- **Generate migration**: `pnpm --filter @repo/database generate`
- **Apply migration**: `pnpm --filter @repo/database migrate`
- **Start local Postgres**: `docker compose up -d`

### Testing
- **E2E tests (interactive)**: `pnpm --filter @repo/web e2e`
- **E2E tests (CI)**: `pnpm --filter @repo/web e2e:ci`

### Package-specific Commands
- **Web app only**: `pnpm --filter @repo/web dev` (runs on http://localhost:3000)
- **Add Shadcn component**: `pnpm --filter @repo/web shadcn-ui`

### Project Validation
- **Standards validation**: `pnpm validate:standards`
- **Local verification**: `pnpm verify:local`
- **Governance linting**: `pnpm lint:governance`

## Architecture Overview

This is a **monorepo** using **pnpm workspaces** and **Turbo** for build orchestration. It's built on the supastarter.dev framework for Next.js SaaS applications, enhanced with Engineering OS for structured development.

### Directory Structure
- **`apps/web/`** - Next.js 15 App Router frontend application
- **`packages/`** - Shared backend packages:
  - `ai` - AI integration and services
  - `api` - API routes and server logic
  - `auth` - Authentication using better-auth
  - `database` - Drizzle ORM schema and database operations
  - `i18n` - Internationalization with next-intl
  - `logs` - Logging configuration
  - `mail` - Email providers and templates
  - `payments` - Payment processing
  - `storage` - File and image storage providers
  - `utils` - Shared utility functions
- **`config/`** - Application configuration
- **`tooling/`** - Build tools and configurations
- **`docs/`** - Engineering OS documentation and standards:
  - `EngineeringOS/` - Core Engineering OS documentation
  - `standards/` - Development standards and best practices
  - `eos/` - EOS-specific documentation

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: better-auth
- **State Management**: TanStack Query, nuqs for URL params
- **Build**: Turbo, pnpm workspaces
- **Linting/Formatting**: Biome
- **Testing**: Playwright for E2E

### Key Conventions
- **Server Components First**: Minimize 'use client' - favor React Server Components
- **File Structure**: Components in lowercase-with-dashes directories
- **TypeScript**: Use interfaces over types, avoid enums (use maps)
- **Imports**: All packages use `@repo/*` workspace references
- **Styling**: Mobile-first responsive design with Tailwind
- **Standards Compliance**: All code automatically follows docs/standards/ patterns

### Database Setup
The project uses **Drizzle ORM** (Prisma has been removed). Environment setup:
1. Copy `.env.local.example` to `.env.local`
2. Set `DATABASE_URL=postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db`
3. Start Postgres: `docker compose up -d`
4. Run migrations: `pnpm --filter @repo/database generate && pnpm --filter @repo/database migrate`

### Content Collections
- Uses `@content-collections/*` for docs/blog content
- Can be disabled via `DISABLE_CONTENT_COLLECTIONS=1` in `apps/web/.env.local`

### Package Manager
- **Required**: pnpm 10.14.0+
- **Node**: 20+
- Use `pnpm --filter <package>` to run commands in specific packages

## Engineering OS Workflow

### Recommended Development Flow
1. **Plan**: Use `/create-spec` to specify new features with detailed requirements
2. **Execute**: Use `/create-tasks` to generate task checklists, then `/execute-tasks` to implement
3. **Verify**: All tasks include automated verification against standards in `docs/standards/`
4. **Deliver**: Code is automatically tested, documented, and submitted via PR

### Standards Enforcement
- Standards are automatically loaded and applied based on task context
- Verification blocks in standards ensure compliance before task completion
- Use `pnpm verify:local` to test standards compliance locally
- CI/CD includes standards validation on all commits

### Specialized Agents Available
- `context-fetcher` - Retrieves relevant standards and documentation
- `file-creator` - Creates files with proper templates and structure
- `git-workflow` - Handles version control, branching, and PRs
- `test-runner` - Executes tests and analyzes failures
- `verification-runner` - Automated standards compliance checking