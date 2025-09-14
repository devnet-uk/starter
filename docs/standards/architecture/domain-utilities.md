# Domain Utilities

## Overview
Shared utility classes and patterns for domain layer implementation. These utilities ensure consistency across all domain entities, value objects, and services while maintaining framework independence.

> **Critical Rule**: Domain utilities must have ZERO framework dependencies. No ORM, HTTP, database, or external service imports allowed.

## Result Pattern

### Result<T> Implementation
```typescript
// packages/core/src/domain/shared/Result.ts
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly error?: string,
    private readonly _value?: T
  ) {}

  static ok<T>(value?: T): Result<T> {
    return new Result(true, undefined, value);
  }

  static fail<T>(error: string): Result<T> {
    return new Result(false, error);
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  get value(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  // Functional programming helpers
  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!);
    }
    return Result.ok(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!);
    }
    return fn(this.value);
  }

  onSuccess(fn: (value: T) => void): Result<T> {
    if (this.isSuccess) {
      fn(this.value);
    }
    return this;
  }

  onFailure(fn: (error: string) => void): Result<T> {
    if (this.isFailure) {
      fn(this.error!);
    }
    return this;
  }
}
```

### Usage Examples
```typescript
// Domain method example
export class Order {
  addItem(productId: string, quantity: number): Result<void> {
    if (!productId) {
      return Result.fail('Product ID is required');
    }
    
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    
    // Business logic
    this.items.push(new OrderItem(productId, quantity));
    return Result.ok();
  }
}

// Chaining results
const result = order.addItem('product-123', 5)
  .flatMap(() => order.calculateTotal())
  .map(total => total * 1.1); // Add tax

if (result.isSuccess) {
  // Success case - use result.value for further processing
  const finalTotal = result.value;
} else {
  // Failure case - handle error appropriately
  return Result.fail(`Order processing failed: ${result.error}`);
}
```

## Base Classes

### Entity Base Class
```typescript
// packages/core/src/domain/shared/Entity.ts
export abstract class Entity<TId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId>): boolean {
    if (this === other) {
      return true;
    }

    if (!(other instanceof Entity)) {
      return false;
    }

    return this._id === other._id;
  }

  toString(): string {
    return `${this.constructor.name}(${this._id})`;
  }
}
```

### Value Object Base Class
```typescript
// packages/core/src/domain/shared/ValueObject.ts
export abstract class ValueObject {
  protected constructor() {}

  // Subclasses must implement this to define equality
  protected abstract getEqualityComponents(): unknown[];

  equals(other: ValueObject): boolean {
    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    const thisComponents = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();

    if (thisComponents.length !== otherComponents.length) {
      return false;
    }

    return thisComponents.every((component, index) => 
      component === otherComponents[index]
    );
  }

  hashCode(): string {
    const components = this.getEqualityComponents();
    return components.map(c => String(c)).join('|');
  }
}
```

### Aggregate Root Base Class
```typescript
// packages/core/src/domain/shared/AggregateRoot.ts
import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    super(id);
  }

  // Domain events management
  protected raise(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  // Version for optimistic concurrency control
  private _version: number = 0;

  get version(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }
}
```

### Domain Event Base Class
```typescript
// packages/core/src/domain/shared/DomainEvent.ts
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  protected constructor(
    public readonly eventType: string,
    occurredAt?: Date
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = occurredAt ?? new Date();
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Metadata for event processing
  getMetadata(): EventMetadata {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt,
      version: 1
    };
  }
}

export interface EventMetadata {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  version: number;
}
```

## Domain Specifications

### Specification Pattern
```typescript
// packages/core/src/domain/shared/Specification.ts
export abstract class Specification<T> {
  abstract isSatisfiedBy(entity: T): boolean;

  and(other: Specification<T>): AndSpecification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): OrSpecification<T> {
    return new OrSpecification(this, other);
  }

  not(): NotSpecification<T> {
    return new NotSpecification(this);
  }
}

export class AndSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }
}

export class OrSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }
}

export class NotSpecification<T> extends Specification<T> {
  constructor(private specification: Specification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.specification.isSatisfiedBy(entity);
  }
}
```

## Domain Guards

### Guard Clauses for Validation
```typescript
// packages/core/src/domain/shared/Guard.ts
export class Guard {
  static againstNull<T>(value: T | null | undefined, parameterName: string): asserts value is T {
    if (value == null) {
      throw new Error(`${parameterName} cannot be null or undefined`);
    }
  }

  static againstEmpty(value: string, parameterName: string): asserts value is string {
    if (!value || value.trim().length === 0) {
      throw new Error(`${parameterName} cannot be empty`);
    }
  }

  static againstNegativeOrZero(value: number, parameterName: string): void {
    if (value <= 0) {
      throw new Error(`${parameterName} must be positive`);
    }
  }

  static againstNegative(value: number, parameterName: string): void {
    if (value < 0) {
      throw new Error(`${parameterName} cannot be negative`);
    }
  }

  static againstInvalidRange(
    value: number,
    min: number,
    max: number,
    parameterName: string
  ): void {
    if (value < min || value > max) {
      throw new Error(`${parameterName} must be between ${min} and ${max}`);
    }
  }

  static againstInvalidEmail(email: string, parameterName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`${parameterName} is not a valid email format`);
    }
  }

  // Result-based guards (preferred for domain layer)
  static checkNotNull<T>(value: T | null | undefined, message: string): Result<T> {
    if (value == null) {
      return Result.fail(message);
    }
    return Result.ok(value);
  }

  static checkNotEmpty(value: string, message: string): Result<string> {
    if (!value || value.trim().length === 0) {
      return Result.fail(message);
    }
    return Result.ok(value);
  }

  static checkPositive(value: number, message: string): Result<number> {
    if (value <= 0) {
      return Result.fail(message);
    }
    return Result.ok(value);
  }
}
```

## Common Value Objects

### Identity Value Objects
```typescript
// packages/core/src/domain/shared/Identity.ts
export class UniqueId extends ValueObject {
  constructor(private readonly value: string) {
    super();
    Guard.againstEmpty(value, 'value');
  }

  static create(value?: string): UniqueId {
    return new UniqueId(value ?? this.generateId());
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toString(): string {
    return this.value;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

// Strongly-typed identifiers
export class UserId extends UniqueId {
  static create(value?: string): UserId {
    return new UserId(value ?? UniqueId.generateId());
  }
}

export class ProductId extends UniqueId {
  static create(value?: string): ProductId {
    return new ProductId(value ?? UniqueId.generateId());
  }
}
```

### Common Business Value Objects
```typescript
// packages/core/src/domain/value-objects/Email.ts
export class Email extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  static create(value: string): Result<Email> {
    return Guard.checkNotEmpty(value, 'Email is required')
      .flatMap(email => {
        const trimmed = email.toLowerCase().trim();
        
        if (!this.isValidFormat(trimmed)) {
          return Result.fail('Invalid email format');
        }

        if (this.isBlockedDomain(trimmed)) {
          return Result.fail('Email domain not allowed');
        }

        return Result.ok(new Email(trimmed));
      });
  }

  private static isValidFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isBlockedDomain(email: string): boolean {
    const blockedDomains = ['example.com', 'test.com'];
    const domain = email.split('@')[1];
    return blockedDomains.includes(domain);
  }

  toString(): string {
    return this.value;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
```

## Usage Guidelines

### 1. Framework Independence Rules
- **NEVER import** ORM libraries (Drizzle, Prisma, TypeORM)
- **NEVER import** HTTP libraries (Express, Hono, Fetch)
- **NEVER import** database clients (PostgreSQL, Redis)
- **NEVER import** external services (AWS, Stripe)

### 2. Result Pattern Usage
- All domain methods MUST return `Result<T>` or throw domain exceptions
- Use `Result.ok()` for success cases
- Use `Result.fail()` with descriptive error messages
- Chain operations with `flatMap()` and `map()`

### 3. Base Class Usage
- Entities MUST extend `Entity<TId>` with strongly-typed IDs  
- Value objects MUST extend `ValueObject` and implement `getEqualityComponents()`
- Aggregates MUST extend `AggregateRoot<TId>` for event handling
- Domain events MUST extend `DomainEvent`

### 4. Validation Patterns
- Use `Guard` class for defensive programming
- Prefer Result-based guards in domain methods
- Throw exceptions only for programming errors
- Return failed Results for business rule violations

### 5. Testing Support
```typescript
// Domain testing utilities
export class DomainTestHelper {
  static createValidEmail(): Email {
    return Email.create('test@example.com').value;
  }

  static createUserId(): UserId {
    return UserId.create();
  }

  static assertSuccess<T>(result: Result<T>): T {
    if (result.isFailure) {
      throw new Error(`Expected success but got failure: ${result.error}`);
    }
    return result.value;
  }

  static assertFailure<T>(result: Result<T>): string {
    if (result.isSuccess) {
      throw new Error('Expected failure but got success');
    }
    return result.error!;
  }
}
```

## Architecture Compliance

These utilities enforce domain layer purity by:

1. **Zero Dependencies**: No framework imports allowed
2. **Consistent Patterns**: Same approach across all domains
3. **Type Safety**: Strong typing with proper error handling  
4. **Testability**: Clean interfaces for unit testing
5. **Immutability**: Value objects are immutable by design

All domain utilities must be tested at 100% coverage and verified for framework independence.