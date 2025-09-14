# devnet Architecture Overview

## Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│  Next.js 15.5 with Feature-Sliced Design  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Interface Adapters                │
│    HonoJS Controllers + Type-safe APIs     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│             Use Cases Layer                 │
│      Business Logic & Orchestration        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│              Domain Layer                   │
│    Entities, Services, Value Objects       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Infrastructure Layer              │
│  Database, External APIs, File System      │
└─────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 15.5+ |
| **API** | HonoJS | 4.9.4+ |
| **Database** | PostgreSQL + Drizzle ORM | 17.6 + 0.44.4+ |
| **Auth** | Better-Auth | 1.3.7+ |
| **Validation** | Zod | 4.1+ |
| **State Management** | TanStack Query + Zustand | 5.85+ + 5.0+ |
| **Styling** | TailwindCSS | 4.1+ |
| **Testing** | Vitest + Playwright | Latest |
| **Build** | Turborepo + pnpm | Latest |
| **Quality** | BiomeJS | 2.2.2+ |

## Monorepo Structure

```
devnet/
├── apps/
│   ├── web/                    # Next.js app (FSD)
│   └── api/                    # HonoJS API server
├── packages/
│   ├── core/
│   │   ├── domain/             # Domain layer
│   │   ├── use-cases/          # Use cases layer  
│   │   └── interfaces/         # Port definitions
│   ├── infrastructure/
│   │   ├── database/           # Drizzle repositories
│   │   ├── services/           # External services
│   │   └── config/             # Configuration
│   ├── contracts/              # API contracts (Zod)
│   ├── ui/                     # Shared UI components
│   └── auth/                   # Authentication logic
├── docs/
│   ├── EngineeringOS/          # Framework docs
│   ├── standards/              # Engineering standards
│   └── product/                # Product specifications
└── tooling/                    # Build configurations
```

## Development Environment

### Port Allocation
- **Legacy System**: http://localhost:3000 (current DevNet)
- **devnet System**: http://localhost:4000 (new devnet)
- **devnet API**: http://localhost:4001
- **Database**: PostgreSQL on 5432 (separate schemas)

### Environment Separation
```bash
# devnet .env.local
NEXT_PUBLIC_APP_URL=http://localhost:4000
API_URL=http://localhost:4001
DATABASE_URL=postgresql://...?schema=devnet

# Legacy .env.local (unchanged)
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001
DATABASE_URL=postgresql://...?schema=public
```

## Key Architectural Principles

### Clean Architecture Compliance
- **Domain Layer**: Pure business logic, no framework dependencies
- **Use Cases Layer**: Orchestrates business workflows
- **Interface Adapters**: Translates between external formats and internal models
- **Infrastructure Layer**: Implements ports defined in domain/use cases
- **Presentation Layer**: Depends only on interface adapters

### Domain-Driven Design
- Rich domain models with business behavior
- Aggregate boundaries with proper event handling
- Repository patterns for data access abstraction
- Domain events for cross-boundary communication

### Contract-Driven Development
- Type-safe APIs with Zod schemas
- Shared contracts between frontend and backend
- Zero duplication of type definitions
- Automatic validation on both client and server

## Repository Strategy

### GitHub Repository
- **Repository**: https://github.com/devnet-uk/devnet.git ✅
- **Status**: Created and ready for initial push
- **Approach**: Complete separation from legacy codebase

### Feature Migration
- **Total Features**: 436 features identified for migration
- **Migration Strategy**: Greenfield rebuild with improved architecture
- **Quality Standards**: 98% overall coverage, 100% domain coverage

## Success Metrics

### Architecture Compliance
- Clean Architecture compliance score: 10/10
- Dependency rule violations: 0
- Circular dependencies: 0
- Framework leakage into domain: 0

### Quality Metrics (devnet Greenfield Standard)
- Test coverage: 98% overall (100% for domain/use cases)
- API test coverage: 100% for contracts
- Infrastructure coverage: 95% minimum
- Presentation coverage: 95% minimum
- Code quality score: >8.5/10
- Security scan: 0 critical vulnerabilities

### Performance Targets
- Page load time: <2s (95th percentile)
- API response time: <200ms (95th percentile)
- Database query time: <100ms (95th percentile)
- Bundle size: <500KB initial load

### Business Continuity
- Feature parity: 100% (436/436 features)
- System integrity: 100% maintained
- User experience: Improved performance and usability
- Deployment downtime: <5 minutes
