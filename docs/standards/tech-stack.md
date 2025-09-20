# Technical Stack

## Core Technologies

### Application Framework

- **Framework**: Next.js 15.5.3 with App Router
- **Runtime**: Node.js 22 LTS
- **Package Manager**: pnpm 10.16.0
- **Build Tool**: Turbo 2.5.6
- **CSS Processing**: @tailwindcss/vite or @tailwindcss/postcss

### Languages

- **TypeScript**: 5.9.2 (strict mode enabled)
- **React**: 19.1.1+
- **React Native**: 0.81.4
- **Expo (managed runtime)**: 54

### Database

- **Database System**: PostgreSQL 17.6
- **ORM**: DrizzleORM 0.44.5+
- **Migration Tool**: Drizzle Kit
- **Connection Pooling**: PgBouncer
- **Vector Support**: pgvector (for AI features)

### API Layer

- **REST Framework**: HonoJS 4.9.7 with Zod-OpenAPI
- **RPC Framework**: oRPC 1.x with Hono adapter
- **Validation**: Zod 4.1.8+
- **Server Action Security**: next-safe-action 8.0.11+
- **API Documentation**: OpenAPI via @hono/zod-openapi
- **Rate Limiting**: Hono rate-limit middleware

#### API Pattern Selection Matrix

| Pattern                   | Use Case                                           | Technology          | Example                                       |
| ------------------------- | -------------------------------------------------- | ------------------- | --------------------------------------------- |
| REST (Hono + Zod-OpenAPI) | Public APIs, External integrations, HTTP semantics | HonoJS + OpenAPI    | User CRUD, Webhooks, Third-party integrations |
| RPC (oRPC + Hono)         | Internal services, Type-safe procedures, Streaming | oRPC + Hono adapter | Service-to-service calls, Real-time features  |
| Server Actions            | Form submissions, Progressive enhancement          | next-safe-action    | User forms, Direct mutations                  |

#### API Pattern Decision Tree

```
1. Is it a form submission? → Server Action
2. Is it a public API for external consumers? → REST
3. Does it need specific HTTP semantics (status codes, headers)? → REST
4. Is it internal service communication? → oRPC
5. Does it need real-time updates or streaming? → oRPC with subscriptions
6. Is end-to-end type safety critical? → oRPC
7. Default → REST (most compatible)
```

### State Management

- **Client State**: Zustand 5.0.8+
- **Server State**: TanStack Query 5.87.4+
- **Form State**: React Hook Form 7.62+
- **Atomic State**: Jotai (for complex scenarios)

### Styling

- **CSS Framework**: TailwindCSS 4.1.13+
- **Build Integration**: @tailwindcss/vite (preferred) or @tailwindcss/postcss
- **Component Variants**: Class Variance Authority (CVA)
- **Icons**: Lucide React
- **Fonts**: Variable fonts via next/font

### Authentication

- **Auth Solution**: Better-Auth 1.3.9+
- **Session Management**: Iron Session
- **MFA**: TOTP + WebAuthn/Passkeys
- **RBAC**: Custom implementation with Better-Auth

### Testing

- **Unit Testing**: Vitest 3.2.4+
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright 1.55.0+
- **API Mocking**: MSW 2.11.2+
- **Coverage**: 80% minimum for business logic

### Development Tools

- **Linting/Formatting**: BiomeJS 2.2.4+
- **Git Hooks**: Husky + lint-staged
- **Commit Standards**: Conventional Commits
- **CI/CD**: GitHub Actions
- **Code Analysis**: SonarCloud
- **Security Scanning**: Snyk, Gitleaks (_placeholder tools_)

### Hosting & Infrastructure

- **Application Hosting**: Azure Container Apps (ACA)
- **Database Hosting**: Azure DB for PostgreSQL
- **Global CDN & WAF**: Azure Front Door Standard
- **In-Memory Store**: Azure Cache for Redis (Managed Redis)
- **Search Platform**: Azure AI Search
- **Queue System**: BullMQ (requires Redis)
- **Notification Providers**:
  - **Email/SMS**: Azure Communication Services
  - **Push**: Azure Notification Hubs (for Firebase Cloud Messaging (FCM) & Apple Push Notification Service (APNS))
- **Monitoring & Logging**: Azure Monitor & Log Analytics
- **Secret Management**: Azure Key Vault
- **Preview Hosting / Backup**: Vercel (feature previews, short-lived fallback only)

### AI Integration

- **AI SDK**: Vercel AI SDK 5.0.44+
- **LLM Provider**: OpenAI / Anthropic
- **Vector Database**: Pinecone / pgvector
- **Embeddings**: OpenAI text-embedding-3

### Monorepo Structure

```
/
├── apps/
│   ├── web/                 # Next.js (Feature-Sliced Design)
│   │   ├── src/
│   │   │   ├── app/         # App initialization
│   │   │   ├── processes/   # Cross-cutting flows
│   │   │   ├── pages/       # Route pages
│   │   │   ├── features/    # User actions
│   │   │   ├── entities/    # Business entities UI
│   │   │   └── shared/      # Shared utilities
│   │   └── ...
│   └── mobile/              # React Native (Feature-Sliced Design)
│       └── src/
│           └── [same FSD structure]
│
├── packages/
│   ├── core/                # Domain logic (DDD + Clean Architecture)
│   │   ├── domain/          # Rich domain models
│   │   ├── use-cases/       # Application business rules
│   │   └── interfaces/      # Port interfaces
│   │
│   ├── infrastructure/      # External services (Clean Architecture)
│   │   ├── database/        # DrizzleORM schemas & repositories
│   │   ├── services/        # Third-party integrations
│   │   └── config/          # Configuration
│   │
│   ├── api/                 # HonoJS API (Clean Architecture)
│   │   ├── controllers/     # HTTP REST controllers
│   │   ├── procedures/      # oRPC procedures
│   │   ├── middleware/      # API middleware (shared)
│   │   └── routes/          # Route definitions
│   │
│   ├── ui/                  # Shared UI components library
│   │   ├── components/      # Reusable React components
│   │   └── design-tokens/   # Design system tokens
│   │
│   └── contracts/           # Type-safe API contracts (zero dependencies)
│       ├── api/             # HTTP REST endpoint schemas (request/response)
│       │   ├── auth/        # Authentication endpoints
│       │   ├── users/       # User management endpoints
│       │   └── index.ts     # All API contracts
│       ├── rpc/             # oRPC procedure definitions
│       │   ├── routers/     # Type-safe router definitions
│       │   │   ├── users.ts # User procedure router
│       │   │   └── auth.ts  # Auth procedure router
│       │   ├── procedures/  # Individual procedure types
│       │   └── clients/     # Generated client exports
│       ├── domain/          # Business domain types & entities
│       │   ├── user.ts      # User entity types
│       │   ├── auth.ts      # Authentication types
│       │   └── index.ts     # Re-exports
│       └── schemas/         # Reusable validation schemas (shared by REST & RPC)
│           ├── common.ts    # Common validators (UUID, email, etc.)
│           ├── pagination.ts # Pagination schemas
│           └── index.ts     # Re-exports
│
└── tools/                   # Build tools and scripts
```

## Architectural Patterns by Layer

- **Frontend Apps** (`apps/web`, `apps/mobile`): Feature-Sliced Design
- **Backend Services** (`packages/api`): Clean Architecture
- **Business Logic** (`packages/core`): Domain-Driven Design with Clean Architecture
- **Shared Libraries** (`packages/ui`, `packages/contracts`): Component-based architecture

## Contract-Driven Development

The `packages/contracts` package implements our **contract-first API strategy**:

### Core Principles

- **Single Source of Truth**: All API schemas defined once in contracts
- **Zero Dependencies**: Contracts package has no dependencies on other monorepo packages
- **Type Safety**: End-to-end type checking from database to UI
- **Automatic Validation**: Both client and server use identical schemas

### Technology Integration

- **Zod Schemas**: Define request/response validation and TypeScript types
- **Hono Integration**: `zValidator` uses contracts for API endpoint validation
- **TanStack Query**: Type-safe hooks generated from contract definitions
- **OpenAPI Generation**: Automatic API documentation from Zod schemas

### Benefits

✅ **Prevents API Breaking Changes**: TypeScript catches contract violations  
✅ **Eliminates Type Drift**: Client/server always use same type definitions  
✅ **Self-Documenting APIs**: OpenAPI specs generated from code  
✅ **Faster Development**: Auto-complete and type checking across stack  
✅ **Reliable Refactoring**: Rename operations update entire codebase

> **Implementation Details**: See [Integration Strategy](./architecture/integration-strategy.md) for complete implementation patterns and examples.

## Version Policy

- Use exact versions for production dependencies
- Use workspace protocol for internal packages: `workspace:*`
- Monthly dependency updates with automated testing
- Security patches within 48 hours
- Breaking changes require migration guide
