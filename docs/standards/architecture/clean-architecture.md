# Clean Architecture

## Overview
Clean Architecture ensures business logic is independent of frameworks, UI, database, and external services.

> **Integration Notes**: 
> - See [Domain Utilities](./domain-utilities.md) for shared base classes and Result pattern
> - See [Infrastructure Patterns](./infrastructure-patterns.md) for proper framework implementation
> - See [Integration Strategy](./integration-strategy.md) for frontend/backend integration
> - See docs/EngineeringOS/dsl/verification/examples/domain-layer-verification.yaml for automated architecture compliance checks

## Domain Purity Rules

### The Sacred Dependency Rule
**Source code dependencies ONLY point inward**. Inner layers NEVER depend on outer layers.

### Critical Domain Layer Rules
1. **ZERO Framework Dependencies**
   - ❌ NO ORM imports (Drizzle, Prisma, TypeORM)
   - ❌ NO HTTP imports (Hono, Express, Fetch)
   - ❌ NO database clients (PostgreSQL, Redis)
   - ❌ NO external service SDKs (AWS, Stripe, SendGrid)

2. **NO Database Schema Methods**
   ```typescript
   // ❌ WRONG: Database concerns in domain
   class Email {
     static dbType() {
       return text('email').notNull(); // VIOLATION!
     }
   }
   
   // ✅ CORRECT: Pure domain value object
   class Email {
     private constructor(private readonly value: string) {}
     
     static create(value: string): Result<Email> {
       // Only business validation
     }
     
     getValue(): string { return this.value; }
   }
   ```

3. **Infrastructure Mapping Only**
   ```typescript
   // ❌ WRONG: Domain object knows about persistence
   class User {
     toDatabaseFormat() { /* VIOLATION! */ }
   }
   
   // ✅ CORRECT: Infrastructure handles mapping
   // packages/infrastructure/mappers/UserMapper.ts
   export class UserMapper {
     static toDomain(row: UserRow): User { /* mapping */ }
     static toPersistence(user: User): UserRow { /* mapping */ }
   }
   ```

4. **Interfaces Belong to Domain**
   - Domain defines `IUserRepository` interface
   - Infrastructure implements `DrizzleUserRepository`
   - Use cases depend on interface, not implementation

### Domain Layer Contents
**What belongs in domain:**
- ✅ Entities and Value Objects
- ✅ Domain Services
- ✅ Repository Interfaces
- ✅ Domain Events
- ✅ Business Rules and Validation
- ✅ Result Pattern and Domain Utilities

**What does NOT belong in domain:**
- ❌ Database schemas or ORM entities
- ❌ HTTP request/response objects
- ❌ Framework-specific code
- ❌ External service clients
- ❌ UI components or presentation logic

## Layer Structure

### 1. Core Layer (innermost)
```typescript
// packages/core/src/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    private readonly createdAt: Date
  ) {}
  
  isActive(): boolean {
    const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30;
  }
  
  canPerformAction(action: string): boolean {
    // Business rule independent of any framework
    return this.isActive() && this.permissions.includes(action);
  }
}
```

### 2. Use Cases Layer
```typescript
// packages/core/src/use-cases/CreateUserUseCase.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger
  ) {}
  
  async execute(input: CreateUserInput): Promise<Result<User>> {
    // Business logic orchestration
    try {
      // Validate business rules
      if (!this.isValidEmail(input.email)) {
        return Result.fail('Invalid email format');
      }
      
      // Check uniqueness
      const exists = await this.userRepository.existsByEmail(input.email);
      if (exists) {
        return Result.fail('Email already registered');
      }
      
      // Create entity
      const user = new User(
        generateId(),
        input.email,
        input.name,
        new Date()
      );
      
      // Persist
      await this.userRepository.save(user);
      
      // Side effects
      await this.emailService.sendWelcome(user);
      this.logger.info('User created', { userId: user.id });
      
      return Result.ok(user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      return Result.fail('Internal error');
    }
  }
}
```

### 3. Interface Adapters Layer
```typescript
// packages/api/src/controllers/UserController.ts
export class UserController {
  constructor(private createUser: CreateUserUseCase) {}
  
  async handleCreateUser(c: Context) {
    const data = c.req.valid('json');
    
    const result = await this.createUser.execute({
      email: data.email,
      name: data.name
    });
    
    if (result.isFailure) {
      return c.json({ error: result.error }, 400);
    }
    
    return c.json(UserMapper.toDTO(result.value), 201);
  }
}
```

### 4. Infrastructure Layer
```typescript
// packages/infrastructure/src/repositories/DrizzleUserRepository.ts
export class DrizzleUserRepository implements IUserRepository {
  constructor(private db: DrizzleClient) {}
  
  async save(user: User): Promise<void> {
    await this.db.insert(users).values({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    });
  }
  
  async findById(id: string): Promise<User | null> {
    const row = await this.db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return row ? UserMapper.toDomain(row) : null;
  }
}
```

## Critical Architecture Rules

### 1. The Dependency Rule (SACRED)
- **Source code dependencies ONLY point inward**
- **Inner layers NEVER import from outer layers**
- **Use dependency injection to provide implementations**
- **Interfaces belong to the layer that uses them**

### 2. Framework Independence Rule
- **Domain layer has ZERO framework dependencies**
- **All framework code stays in Infrastructure layer**
- **Use interfaces to abstract external concerns**

### 3. Database Independence Rule
- **Domain entities are NOT database records**
- **Repository interfaces define persistence contracts**
- **Database schemas map to domain entities via repositories**

### 4. Testability Rule
- **Domain layer: 100% unit test coverage**
- **Use cases: Mock all external dependencies**
- **Infrastructure: Integration tests with real services**

### 5. Business Logic Centralization
- **ALL business rules belong in Domain layer**
- **Controllers ONLY handle HTTP concerns**
- **Use cases ONLY orchestrate domain operations**

## Folder Structure with Layer Enforcement

```
packages/
├── core/                           # DOMAIN + USE CASES LAYERS
│   ├── src/
│   │   ├── domain/                 # 🔒 PURE DOMAIN (No framework imports)
│   │   │   ├── entities/           # Business entities with logic
│   │   │   ├── value-objects/      # Immutable value types
│   │   │   ├── services/           # Domain services for complex logic
│   │   │   ├── interfaces/         # Repository contracts
│   │   │   ├── events/             # Domain event definitions
│   │   │   ├── specifications/     # Business rule specifications
│   │   │   └── shared/             # Result, Entity, ValueObject base classes
│   │   │       ├── Result.ts
│   │   │       ├── Entity.ts
│   │   │       ├── ValueObject.ts
│   │   │       ├── AggregateRoot.ts
│   │   │       └── DomainEvent.ts
│   │   └── use-cases/              # 🔄 APPLICATION LAYER
│   │       ├── commands/           # Command objects
│   │       ├── queries/            # Query objects
│   │       ├── dtos/               # Data transfer objects
│   │       └── services/           # Application services
│   └── tests/                      # Pure unit tests (no DB/HTTP)
├── infrastructure/                 # 🔧 INFRASTRUCTURE LAYER
│   ├── src/
│   │   ├── repositories/           # Database implementations
│   │   │   ├── DrizzleOrderRepository.ts
│   │   │   └── DrizzleUserRepository.ts
│   │   ├── services/               # External service integrations
│   │   │   ├── SendGridEmailService.ts
│   │   │   └── StripePaymentService.ts
│   │   ├── schemas/                # Database schemas (Drizzle tables)
│   │   │   ├── orderSchema.ts
│   │   │   └── userSchema.ts
│   │   ├── config/                 # Database connections, environment
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── eventstore/             # Event sourcing implementation
│   │   │   └── PostgreSQLEventStore.ts
│   │   └── container/              # Dependency injection
│   │       └── DIContainer.ts
│   └── tests/                      # Integration tests (with DB)
├── api/                            # 🌐 INTERFACE ADAPTERS LAYER
│   ├── src/
│   │   ├── controllers/            # HTTP request handlers
│   │   │   ├── OrderController.ts
│   │   │   └── UserController.ts
│   │   ├── middleware/             # Authentication, validation
│   │   │   ├── authMiddleware.ts
│   │   │   └── validationMiddleware.ts
│   │   ├── routes/                 # API route definitions
│   │   │   ├── orderRoutes.ts
│   │   │   └── userRoutes.ts
│   │   ├── dtos/                   # Request/response DTOs
│   │   │   ├── CreateOrderDto.ts
│   │   │   └── UserDto.ts
│   │   └── validators/             # Input validation schemas
│   │       ├── orderValidators.ts
│   │       └── userValidators.ts
│   └── tests/                      # API integration tests
└── web/                            # 🖥️ UI LAYER (if applicable)
    ├── src/
    │   ├── pages/                  # Next.js pages or React components
    │   ├── components/             # UI components
    │   └── hooks/                  # React hooks for API calls
    └── tests/                      # UI component tests
```

## Verification Rules per Layer

### Domain Layer Verification
```bash
# Must pass these checks:
✅ No framework imports: grep -r "from.*drizzle\|from.*@hono" packages/core/src/domain/
✅ No database imports: grep -r "from.*pg\|from.*redis" packages/core/src/domain/
✅ No HTTP imports: grep -r "from.*axios\|from.*fetch" packages/core/src/domain/
✅ Result pattern used: grep -r "Result<" packages/core/src/domain/
✅ No console.log: grep -r "console\." packages/core/src/domain/
```

### Use Cases Layer Verification

<verification-block context-check="use-case-layer-verification">
  <verification_definitions>
    <test name="no_direct_database_access">
      TEST: ! grep -r "from.*drizzle\|from.*@prisma\|from.*typeorm\|from.*mongoose" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "Use cases must not import database libraries directly. Use repository interfaces instead."
      DESCRIPTION: "Ensures use cases are decoupled from database implementations by prohibiting direct ORM imports."
    </test>
    <test name="uses_domain_interfaces_only">
      TEST: grep -r "implements.*I[A-Z].*Repository\|I[A-Z].*Service" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "Use cases must depend on domain interfaces, not concrete implementations."
      DESCRIPTION: "Verifies use cases depend on domain contracts (interfaces) to preserve layer boundaries."
    </test>
    <test name="no_http_handling">
      TEST: ! grep -r "Request\|Response\|req\|res\|express\|hono\|fastify" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "Use cases must not handle HTTP concerns. HTTP handling belongs in controllers."
      DESCRIPTION: "Prevents leakage of transport concerns into use cases; HTTP belongs in interface adapters."
    </test>
    <test name="uses_result_pattern">
      TEST: grep -r "Result<\|Result\.ok\|Result\.fail" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "Use cases must use Result pattern for error handling."
      DESCRIPTION: "Asserts use of a Result<T> pattern for explicit, typed success/failure semantics."
    </test>
    <test name="has_execute_method">
      TEST: grep -r "async execute\|execute.*async" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "All use cases must have an execute method as the primary entry point."
      DESCRIPTION: "Ensures use cases expose a single orchestrating entry point for dependency injection and testing."
    </test>
    <test name="no_framework_dependencies">
      TEST: ! grep -r "from.*next\|from.*react\|from.*vue\|from.*angular" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "Use cases must not depend on frontend frameworks."
      DESCRIPTION: "Prevents coupling of use cases to UI frameworks; preserves portability across delivery mechanisms."
    </test>
    <test name="transaction_boundaries">
      TEST: grep -r "UnitOfWork\|Transaction\|@Transactional" packages/core/src/use-cases/ | head -3
      REQUIRED: false
      ERROR: "Consider implementing proper transaction boundaries for complex use cases."
      DESCRIPTION: "Encourages explicit transaction boundaries for multi-step business operations."
    </test>
  </verification_definitions>
</verification-block>

```bash
# Legacy verification commands (kept for reference):
✅ No direct DB access: ! grep -r "from.*drizzle" packages/core/src/use-cases/
✅ Uses interfaces only: grep -r "IRepository\|IService" packages/core/src/use-cases/
✅ No HTTP handling: ! grep -r "Request\|Response" packages/core/src/use-cases/
```

### Infrastructure Layer Rules
```bash
# All framework code must be here:
✅ Database schemas: find packages/infrastructure -name "*Schema.ts"
✅ Repository implementations: find packages/infrastructure -name "*Repository.ts"
✅ Service implementations: find packages/infrastructure -name "*Service.ts"
```

## What Goes Where - Explicit Layer Rules

### Core Layer (Domain) - MUST CONTAIN ONLY

✅ **Allowed:**
- Business entities with pure business logic
- Value objects with validation and business rules
- Domain services for complex business operations
- Domain events for business state changes
- Repository interfaces (contracts only)
- Domain specifications for business rules
- Aggregate roots managing entity clusters
- Business exceptions and domain errors
- Pure functions and calculations

❌ **NEVER Allowed:**
- ORM imports (Drizzle, Prisma, TypeORM)
- Database clients (PostgreSQL, MongoDB, Redis)
- HTTP libraries (Axios, Fetch, Express)
- External service SDKs (AWS, Stripe, SendGrid)
- Framework-specific code (Next.js, Hono)
- File system operations
- Console.log statements (use proper logging interfaces)

```typescript
// ✅ Good - Pure domain entity
export class Order extends AggregateRoot<OrderId> {
  private items: OrderItem[] = [];
  
  addItem(productId: string, quantity: number): Result<void> {
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    // Pure business logic only
    this.items.push(new OrderItem(productId, quantity));
    this.raise(new OrderItemAddedEvent(this.id, productId));
    return Result.ok();
  }
}

// ❌ VIOLATION EXAMPLE - DO NOT COPY THIS CODE
import { pgTable } from 'drizzle-orm/pg-core'; // ARCHITECTURE VIOLATION!
export class Order {
  // ❌ Framework dependency in domain layer - BREAKS Clean Architecture
}
```

### Use Cases Layer (Application) - MUST CONTAIN ONLY

✅ **Allowed:**
- Application services orchestrating business logic
- Use case implementations
- Application-specific DTOs and commands
- Dependency injection of domain interfaces
- Cross-cutting concern interfaces (logging, caching)
- Application exceptions and error handling
- Transaction coordination
- Domain event publishing

❌ **NEVER Allowed:**
- Direct database access (must use repositories)
- HTTP request/response handling
- Framework-specific routing
- UI components or markup
- Direct external service calls (must use interfaces)

```typescript
// ✅ Good - Pure use case orchestration
export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private emailService: IEmailService
  ) {}
  
  async execute(command: CreateOrderCommand): Promise<Result<OrderDto>> {
    // Orchestrate domain logic through interfaces
    const order = Order.create(command.customerId);
    const saveResult = await this.orderRepo.save(order);
    return saveResult.map(() => OrderDto.fromDomain(order));
  }
}
```

### Interface Adapters Layer - MUST CONTAIN ONLY

✅ **Allowed:**
- Controllers handling HTTP requests/responses
- API routes and endpoint definitions
- Request/response DTOs and validation
- Authentication and authorization
- Input validation and sanitization
- Error response formatting
- API documentation and OpenAPI specs

❌ **NEVER Allowed:**
- Business logic (must delegate to use cases)
- Direct database access
- Complex calculations or business rules
- Domain entity creation (use factories in domain)

```typescript
// ✅ Good - Controller delegates to use case
export class OrderController {
  constructor(private createOrder: CreateOrderUseCase) {}
  
  async handleCreateOrder(c: Context) {
    const command = CreateOrderCommand.fromRequest(c.req);
    const result = await this.createOrder.execute(command);
    
    if (result.isFailure) {
      return c.json({ error: result.error }, 400);
    }
    
    return c.json(result.value, 201);
  }
}
```

### Infrastructure Layer - MUST CONTAIN ALL

✅ **Required:**
- Repository implementations (Drizzle, Prisma, etc.)
- Database schemas and migrations
- External service integrations (AWS, Stripe)
- Configuration and environment variables
- Logging implementations
- Caching implementations
- Event store implementations
- Email/SMS service implementations
- File storage implementations
- All framework-specific code

```typescript
// ✅ Good - All framework code in infrastructure
export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private db: DrizzleDatabase) {} // Framework dependency OK here
  
  async save(order: Order): Promise<Result<void>> {
    // Convert domain entity to database format
    const orderData = {
      id: order.id.toString(),
      customerId: order.customerId.toString(),
      status: order.status,
    };
    
    await this.db.insert(orders).values(orderData);
    return Result.ok();
  }
}
```

## Layer Dependency Rules

### The Dependency Rule (CRITICAL)
1. **Inner layers NEVER depend on outer layers**
2. **Source code dependencies ONLY point inward**
3. **Use dependency injection to invert control flow**
4. **Interfaces belong to the layer that uses them**

```
┌────────────────────────────────────────────┐
│          Infrastructure Layer              │
│  ┌──────────────────────────────────────┐    │
│  │      Interface Adapters Layer      │    │
│  │  ┌─────────────────────────────┐    │    │
│  │  │      Use Cases Layer       │    │    │
│  │  │  ┌─────────────────────┐    │    │    │
│  │  │  │     Core Layer     │    │    │    │
│  │  │  │   (Domain)         │    │    │    │
│  │  │  │                    │    │    │    │
│  │  │  └─────────────────────┘    │    │    │
│  │  └─────────────────────────────┘    │    │
│  └──────────────────────────────────────┘    │
└────────────────────────────────────────────┘

 Dependencies ONLY flow inward (→)
```

### Dependency Inversion Examples

```typescript
// ❌ Bad - Use case depends on infrastructure
import { DrizzleOrderRepository } from '../infrastructure/repositories';

export class CreateOrderUseCase {
  constructor(private orderRepo: DrizzleOrderRepository) {} // Direct dependency!
}

// ✅ Good - Use case depends on interface
import { IOrderRepository } from '../domain/interfaces';

export class CreateOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {} // Interface dependency
}

// Infrastructure implements the interface
export class DrizzleOrderRepository implements IOrderRepository {
  // Implementation details
}
```

## Architecture Benefits

### Development Benefits
- **Testability**: Business logic testable in isolation
- **Flexibility**: Easy to change frameworks, databases, or external services
- **Maintainability**: Clear separation of concerns and responsibilities
- **Scalability**: Each layer can evolve independently
- **Team Productivity**: Clear boundaries enable parallel development
- **Refactoring Safety**: Changes in outer layers don't affect business logic

### Business Benefits
- **Independence**: Business rules don't depend on technical details
- **Longevity**: Business logic survives technology changes
- **Quality**: High test coverage ensures business rule correctness
- **Agility**: Can quickly adapt to new requirements or technologies

## Common Violations and Fixes

### ❌ Violation: Domain Entity with ORM
```typescript
// ❌ VIOLATION EXAMPLE - DO NOT COPY THIS CODE
import { pgTable, text } from 'drizzle-orm/pg-core';

export class User {
  // ❌ ARCHITECTURE VIOLATION - Database schema in domain layer
  static schema = pgTable('users', { ... }); // BREAKS Clean Architecture!
}
```

### ✅ Solution: Separate Domain and Infrastructure
```typescript
// Domain layer - Pure business logic
export class User extends Entity<UserId> {
  constructor(id: UserId, email: Email, name: string) {
    super(id);
    // Pure domain logic only
  }
}

// Infrastructure layer - Database concerns
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
});
```

### ❌ Violation: Use Case with Direct Database Access
```typescript
// DON'T DO THIS
import { db } from '../database';

export class CreateUserUseCase {
  async execute(data: any) {
    // Direct database access in use case
    return db.insert(users).values(data);
  }
}
```

### ✅ Solution: Use Repository Interface
```typescript
// Use case depends on interface
export class CreateUserUseCase {
  constructor(private userRepo: IUserRepository) {}
  
  async execute(command: CreateUserCommand): Promise<Result<User>> {
    const user = User.create(command.email, command.name);
    return this.userRepo.save(user);
  }
}
```

### ❌ Violation: Controller with Business Logic
```typescript
// DON'T DO THIS
export class UserController {
  async createUser(req: Request) {
    // Business logic in controller
    if (!req.body.email || req.body.email.length < 5) {
      return { error: 'Invalid email' };
    }
    
    const total = req.body.orders.reduce((sum, o) => sum + o.amount, 0);
    // More business logic...
  }
}
```

### ✅ Solution: Delegate to Use Case
```typescript
// Controller only handles HTTP concerns
export class UserController {
  constructor(private createUser: CreateUserUseCase) {}
  
  async handleCreateUser(req: Request) {
    const command = CreateUserCommand.fromRequest(req);
    const result = await this.createUser.execute(command);
    
    return result.isSuccess
      ? { data: result.value, status: 201 }
      : { error: result.error, status: 400 };
  }
}
```
