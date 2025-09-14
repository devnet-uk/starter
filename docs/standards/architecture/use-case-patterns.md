# Use Case Layer Patterns

This document defines comprehensive patterns for implementing the use case (application) layer following Clean Architecture principles.

## Overview

The Use Case layer orchestrates domain logic through domain interfaces without coupling to infrastructure. This layer contains application-specific business rules that orchestrate the flow of data to and from entities and directs those entities to use their enterprise-wide business rules to achieve the goals of the use case.

## Core Use Case Patterns

### 1. Command/Query Separation (CQRS-lite)

#### Command Use Cases (Write Operations)
```typescript
// Command DTO
interface CreateUserCommand {
  email: string
  name: string
  password: string
  organizationId?: string
}

// Command Use Case
class CreateUserUseCase implements IUseCase<CreateUserCommand, User> {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<User>> {
    // 1. Validate command
    const validationResult = this.validateCommand(command)
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error)
    }

    // 2. Check business rules
    const existingUser = await this.userRepository.findByEmail(command.email)
    if (existingUser) {
      return Result.fail('User with this email already exists')
    }

    // 3. Create domain entity
    const userResult = User.create({
      email: Email.create(command.email).getValue(),
      name: command.name,
      password: await Password.create(command.password).getValue()
    })

    if (userResult.isFailure) {
      return Result.fail(userResult.error)
    }

    // 4. Persist through repository
    const user = userResult.getValue()
    await this.userRepository.save(user)

    // 5. Execute side effects
    await this.emailService.sendWelcomeEmail(user)
    await this.eventPublisher.publish(new UserCreatedEvent(user))

    return Result.ok(user)
  }

  private validateCommand(command: CreateUserCommand): Result<void> {
    if (!command.email || !command.name || !command.password) {
      return Result.fail('Missing required fields')
    }
    return Result.ok()
  }
}
```

#### Query Use Cases (Read Operations)
```typescript
// Query DTO
interface GetUserByIdQuery {
  userId: string
  includeOrganization?: boolean
}

// Query Result DTO
interface UserDetailsDTO {
  id: string
  email: string
  name: string
  organization?: OrganizationDTO
  createdAt: Date
}

// Query Use Case
class GetUserDetailsUseCase implements IUseCase<GetUserByIdQuery, UserDetailsDTO> {
  constructor(
    private userRepository: IUserRepository,
    private organizationRepository: IOrganizationRepository
  ) {}

  async execute(query: GetUserByIdQuery): Promise<Result<UserDetailsDTO>> {
    const user = await this.userRepository.findById(query.userId)
    
    if (!user) {
      return Result.fail('User not found')
    }

    let organization: Organization | undefined
    if (query.includeOrganization && user.organizationId) {
      organization = await this.organizationRepository.findById(user.organizationId)
    }

    // Map domain to DTO
    const dto: UserDetailsDTO = {
      id: user.id.toString(),
      email: user.email.value,
      name: user.name,
      organization: organization ? this.mapOrganizationToDTO(organization) : undefined,
      createdAt: user.createdAt
    }

    return Result.ok(dto)
  }
}
```

### 2. Transaction Management Patterns

#### Unit of Work Pattern
```typescript
interface IUnitOfWork {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

class TransferFundsUseCase {
  constructor(
    private accountRepository: IAccountRepository,
    private unitOfWork: IUnitOfWork
  ) {}

  async execute(command: TransferFundsCommand): Promise<Result<void>> {
    await this.unitOfWork.begin()

    try {
      // Load aggregates
      const sourceAccount = await this.accountRepository.findById(command.sourceAccountId)
      const targetAccount = await this.accountRepository.findById(command.targetAccountId)

      if (!sourceAccount || !targetAccount) {
        await this.unitOfWork.rollback()
        return Result.fail('Account not found')
      }

      // Execute domain logic
      const withdrawResult = sourceAccount.withdraw(command.amount)
      if (withdrawResult.isFailure) {
        await this.unitOfWork.rollback()
        return Result.fail(withdrawResult.error)
      }

      targetAccount.deposit(command.amount)

      // Persist changes
      await this.accountRepository.save(sourceAccount)
      await this.accountRepository.save(targetAccount)

      // Commit transaction
      await this.unitOfWork.commit()

      return Result.ok()
    } catch (error) {
      await this.unitOfWork.rollback()
      return Result.fail(`Transaction failed: ${error.message}`)
    }
  }
}
```

### 3. Cross-Aggregate Orchestration

#### Saga Pattern for Complex Workflows
```typescript
class CreateOrderSaga {
  constructor(
    private orderRepository: IOrderRepository,
    private inventoryService: IInventoryService,
    private paymentService: IPaymentService,
    private shippingService: IShippingService,
    private eventBus: IEventBus
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<Order>> {
    const compensations: Array<() => Promise<void>> = []

    try {
      // Step 1: Reserve inventory
      const reservationResult = await this.inventoryService.reserve(command.items)
      if (reservationResult.isFailure) {
        return Result.fail('Insufficient inventory')
      }
      compensations.push(() => this.inventoryService.cancelReservation(reservationResult.getValue()))

      // Step 2: Process payment
      const paymentResult = await this.paymentService.charge(command.paymentDetails)
      if (paymentResult.isFailure) {
        await this.compensate(compensations)
        return Result.fail('Payment failed')
      }
      compensations.push(() => this.paymentService.refund(paymentResult.getValue()))

      // Step 3: Create order
      const orderResult = Order.create({
        customerId: command.customerId,
        items: command.items,
        paymentId: paymentResult.getValue().id,
        reservationId: reservationResult.getValue().id
      })

      if (orderResult.isFailure) {
        await this.compensate(compensations)
        return Result.fail(orderResult.error)
      }

      const order = orderResult.getValue()
      await this.orderRepository.save(order)

      // Step 4: Schedule shipping
      await this.shippingService.schedule(order)

      // Publish success event
      await this.eventBus.publish(new OrderCreatedEvent(order))

      return Result.ok(order)
    } catch (error) {
      await this.compensate(compensations)
      return Result.fail(`Order creation failed: ${error.message}`)
    }
  }

  private async compensate(compensations: Array<() => Promise<void>>): Promise<void> {
    for (const compensation of compensations.reverse()) {
      await compensation()
    }
  }
}
```

### 4. Use Case Composition

#### Composite Use Cases
```typescript
class CompleteOnboardingUseCase {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private createOrganizationUseCase: CreateOrganizationUseCase,
    private sendWelcomeEmailUseCase: SendWelcomeEmailUseCase,
    private createDefaultSettingsUseCase: CreateDefaultSettingsUseCase
  ) {}

  async execute(command: OnboardingCommand): Promise<Result<OnboardingResult>> {
    // Step 1: Create user
    const userResult = await this.createUserUseCase.execute({
      email: command.email,
      name: command.name,
      password: command.password
    })

    if (userResult.isFailure) {
      return Result.fail(userResult.error)
    }

    const user = userResult.getValue()

    // Step 2: Create organization if provided
    let organization: Organization | undefined
    if (command.organizationName) {
      const orgResult = await this.createOrganizationUseCase.execute({
        name: command.organizationName,
        ownerId: user.id.toString()
      })

      if (orgResult.isFailure) {
        // Rollback user creation
        await this.rollbackUserCreation(user.id)
        return Result.fail(orgResult.error)
      }

      organization = orgResult.getValue()
    }

    // Step 3: Create default settings
    await this.createDefaultSettingsUseCase.execute({
      userId: user.id.toString(),
      organizationId: organization?.id.toString()
    })

    // Step 4: Send welcome email
    await this.sendWelcomeEmailUseCase.execute({
      userId: user.id.toString(),
      includeOnboardingGuide: true
    })

    return Result.ok({
      user,
      organization,
      onboardingComplete: true
    })
  }
}
```

### 5. Error Handling and Validation

#### Validation Patterns
```typescript
abstract class BaseUseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<Result<TResponse>>

  protected validate(request: TRequest): Result<void> {
    const errors: string[] = []

    // Use validation library or custom validators
    const validationResult = this.getValidator().validate(request)
    
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => {
        errors.push(`${error.property}: ${error.message}`)
      })
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }

  protected abstract getValidator(): IValidator<TRequest>
}

// Specific validation implementation
class CreateProductUseCase extends BaseUseCase<CreateProductCommand, Product> {
  protected getValidator(): IValidator<CreateProductCommand> {
    return new CreateProductValidator()
  }

  async execute(command: CreateProductCommand): Promise<Result<Product>> {
    // Validation is handled by base class
    const validationResult = this.validate(command)
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error)
    }

    // Business logic here
    // ...
  }
}
```

## Testing Patterns

### In-Memory Test Implementations
```typescript
// Test doubles for use case testing
class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, User>()

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(u => u.email.value === email) || null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id.toString(), user)
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id)
  }
}

// Use case test
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let userRepository: InMemoryUserRepository
  let emailService: MockEmailService
  let eventPublisher: MockEventPublisher

  beforeEach(() => {
    userRepository = new InMemoryUserRepository()
    emailService = new MockEmailService()
    eventPublisher = new MockEventPublisher()
    useCase = new CreateUserUseCase(userRepository, emailService, eventPublisher)
  })

  it('should create a user successfully', async () => {
    const command: CreateUserCommand = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePassword123!'
    }

    const result = await useCase.execute(command)

    expect(result.isSuccess).toBe(true)
    expect(result.getValue().email.value).toBe('test@example.com')
    expect(emailService.sentEmails).toHaveLength(1)
    expect(eventPublisher.publishedEvents).toHaveLength(1)
  })

  it('should fail if user already exists', async () => {
    const existingUser = User.create({
      email: Email.create('test@example.com').getValue(),
      name: 'Existing User',
      password: await Password.create('password').getValue()
    }).getValue()

    await userRepository.save(existingUser)

    const command: CreateUserCommand = {
      email: 'test@example.com',
      name: 'New User',
      password: 'Password123!'
    }

    const result = await useCase.execute(command)

    expect(result.isFailure).toBe(true)
    expect(result.error).toContain('already exists')
  })
})
```

## Verification Standards

<verification-block context-check="use-case-patterns-verification">
  <verification_definitions>
    <test name="no_direct_database_access">
      TEST: ! grep -r "from.*drizzle\|from.*@prisma\|from.*typeorm\|from.*mongoose" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "Use cases must not import database libraries directly. Use repository interfaces instead."
      DESCRIPTION: "Prevents persistence concerns from leaking into use cases; use repositories instead."
    </test>
    <test name="uses_domain_interfaces_only">
      TEST: grep -r "implements.*I[A-Z].*Repository\|I[A-Z].*Service" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "Use cases must depend on domain interfaces, not concrete implementations."
      DESCRIPTION: "Ensures use cases depend on domain-level interfaces for loose coupling."
    </test>
    <test name="no_http_handling">
      TEST: ! grep -r "Request\|Response\|req\|res\|express\|hono\|fastify" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "Use cases must not handle HTTP concerns. HTTP handling belongs in controllers."
      DESCRIPTION: "Guards against transport logic in use cases to maintain layer separation."
    </test>
    <test name="uses_result_pattern">
      TEST: grep -r "Result<\|Result\.ok\|Result\.fail" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "Use cases must use Result pattern for error handling."
      DESCRIPTION: "Confirms errors are represented via Result<T> for predictable control flow."
    </test>
    <test name="has_execute_method">
      TEST: grep -r "async execute\|execute.*async" packages/core/src/use-cases/ | head -5
      REQUIRED: true
      ERROR: "All use cases must have an execute method as the primary entry point."
      DESCRIPTION: "Verifies an explicit execute() entry point for orchestration and testability."
    </test>
    <test name="dto_separation">
      TEST: ls packages/core/src/use-cases/dtos/ 2>/dev/null || echo "DTOs directory exists"
      REQUIRED: false
      ERROR: "Consider creating a dtos directory for Data Transfer Objects."
      DESCRIPTION: "Encourages explicit DTO separation to keep use case inputs/outputs cleanly defined."
    </test>
    <test name="test_coverage">
      TEST: grep -q "coverage.*100" packages/core/package.json || grep -q "threshold.*100" packages/core/jest.config.js 2>/dev/null
      REQUIRED: true
      ERROR: "Use case layer must have 100% test coverage requirement."
      DESCRIPTION: "Enforces strict coverage for use cases to reduce regressions in core business flows."
    </test>
  </verification_definitions>
</verification-block>

## Implementation Guidelines

### 1. Dependency Injection
- Use constructor injection for all dependencies
- Depend on interfaces, not implementations
- Use IoC container for dependency resolution

### 2. Error Handling
- Always use Result<T> pattern
- Never throw exceptions for business errors
- Log technical errors, return business errors

### 3. Transaction Boundaries
- One use case = one transaction boundary
- Use Unit of Work pattern for complex transactions
- Implement compensating transactions for distributed operations

### 4. Testing Strategy
- 100% coverage requirement for use cases
- Use in-memory implementations for testing
- Test both success and failure paths
- Verify side effects (events, emails)

### 5. Performance Considerations
- Implement pagination for queries
- Use projections to avoid loading full aggregates
- Consider caching for read-heavy operations
- Implement async operations where appropriate

This use case patterns standard ensures proper orchestration of domain logic while maintaining clean separation from infrastructure concerns.
