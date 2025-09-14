# Mapper Pattern for Clean Architecture

## Overview
The Mapper pattern serves as a crucial bridge between domain and infrastructure layers in Clean Architecture, ensuring domain purity while enabling persistence and external service integration.

> **Core Principle**: Domain objects never know about persistence. Infrastructure mappers handle all transformations.

## Why Mappers Are Essential

### The Problem Without Mappers
```typescript
// ❌ VIOLATION: Domain entity knows about database
export class User {
  // Domain logic mixed with persistence concerns
  static dbSchema() {
    return pgTable('users', { /* schema */ }); // BREAKS CLEAN ARCHITECTURE
  }
  
  toDatabaseRow() {
    return { /* persistence format */ }; // DOMAIN SHOULDN'T KNOW THIS
  }
}
```

### The Solution With Mappers
```typescript
// ✅ CORRECT: Pure domain entity
export class User extends Entity<UserId> {
  constructor(
    id: UserId,
    private readonly email: Email,
    private readonly name: string
  ) {
    super(id);
    // Only business logic here
  }
  
  // Pure domain methods only
  changeEmail(newEmail: Email): Result<void> {
    // Business validation and logic
  }
}

// ✅ CORRECT: Infrastructure mapper handles conversion
export class UserMapper {
  static toDomain(row: UserRow): Result<User> {
    // Infrastructure knows about persistence format
  }
  
  static toPersistence(user: User): UserRow {
    // Infrastructure knows about domain format
  }
}
```

## Mapper Pattern Principles

### 1. Unidirectional Knowledge
- **Infrastructure → Domain**: Infrastructure knows about domain interfaces
- **Domain ← Infrastructure**: Domain never imports infrastructure

### 2. Mapping Direction Rules
- **Domain → Infrastructure**: Always succeeds (domain is valid by construction)
- **Infrastructure → Domain**: Can fail (validate external data)

### 3. Error Handling Strategy
- Use `Result<T>` pattern for fallible mappings
- Collect multiple validation errors when possible
- Provide clear error messages for debugging

## Core Mapper Types

### 1. Entity Mappers
Transform complex domain entities to/from persistence.

#### Basic Entity Mapper
```typescript
// packages/infrastructure/src/mappers/ProductMapper.ts
import { Product } from '@/core/domain/entities/Product';
import { ProductId } from '@/core/domain/value-objects/ProductId';
import { ProductName } from '@/core/domain/value-objects/ProductName';
import { Money } from '@/core/domain/value-objects/Money';
import { Result } from '@/core/domain/shared/Result';

export class ProductMapper {
  static toDomain(row: ProductRow): Result<Product> {
    // Validate and create value objects
    const productIdResult = ProductId.create(row.id);
    const nameResult = ProductName.create(row.name);
    const priceResult = Money.create(parseFloat(row.price), row.currency as Currency);
    
    // Collect validation errors
    const errors: string[] = [];
    if (productIdResult.isFailure) errors.push(`ID: ${productIdResult.error}`);
    if (nameResult.isFailure) errors.push(`Name: ${nameResult.error}`);
    if (priceResult.isFailure) errors.push(`Price: ${priceResult.error}`);
    
    if (errors.length > 0) {
      return Result.fail(`Product mapping failed: ${errors.join(', ')}`);
    }
    
    // Create domain entity
    return Product.create({
      id: productIdResult.value,
      name: nameResult.value,
      price: priceResult.value,
      description: row.description
    });
  }
  
  static toPersistence(product: Product): ProductRow {
    // Domain entity is always valid, so this always succeeds
    return {
      id: product.getId().toString(),
      name: product.getName().getValue(),
      price: product.getPrice().getAmount().toFixed(2),
      currency: product.getPrice().getCurrency(),
      description: product.getDescription()
    };
  }
}
```

#### Advanced Entity Mapper with Relationships
```typescript
// packages/infrastructure/src/mappers/OrderMapper.ts
export class OrderMapper {
  static async toDomain(
    orderRow: OrderRow,
    itemRows: OrderItemRow[],
    customerMapper: CustomerMapper
  ): Promise<Result<Order>> {
    // Map base entity
    const orderResult = this.mapOrderEntity(orderRow);
    if (orderResult.isFailure) {
      return Result.fail(`Order entity: ${orderResult.error}`);
    }
    
    const order = orderResult.value;
    
    // Map related entities
    for (const itemRow of itemRows) {
      const itemResult = await this.mapOrderItem(itemRow);
      if (itemResult.isFailure) {
        return Result.fail(`Order item: ${itemResult.error}`);
      }
      
      const addResult = order.addItem(itemResult.value);
      if (addResult.isFailure) {
        return Result.fail(`Adding item: ${addResult.error}`);
      }
    }
    
    return Result.ok(order);
  }
  
  static toPersistenceWithRelations(order: Order): {
    orderRow: OrderRow;
    itemRows: OrderItemRow[];
  } {
    const orderRow = this.toPersistence(order);
    const itemRows = order.getItems().map(item => ({
      id: generateId(),
      orderId: order.getId().toString(),
      productId: item.getProductId().toString(),
      quantity: item.getQuantity(),
      unitPrice: item.getUnitPrice().getAmount().toFixed(2),
      currency: item.getUnitPrice().getCurrency()
    }));
    
    return { orderRow, itemRows };
  }
}
```

### 2. Value Object Mappers
Handle complex value object transformations.

#### Single-Column Value Object
```typescript
// Simple value object → single database column
export class EmailMapper {
  static toDomain(value: string): Result<Email> {
    return Email.create(value);
  }
  
  static toPersistence(email: Email): string {
    return email.getValue();
  }
}
```

#### Multi-Column Value Object
```typescript
// Complex value object → multiple database columns
export class MoneyMapper {
  static toDomain(amount: string, currency: string): Result<Money> {
    return Money.create(parseFloat(amount), currency as Currency);
  }
  
  static toPersistence(money: Money): { amount: string; currency: string } {
    return {
      amount: money.getAmount().toFixed(2),
      currency: money.getCurrency()
    };
  }
}

// Usage in entity mapper
export class OrderMapper {
  static toDomain(row: OrderRow): Result<Order> {
    const totalResult = MoneyMapper.toDomain(row.totalAmount, row.totalCurrency);
    // ... use totalResult in order creation
  }
  
  static toPersistence(order: Order): OrderRow {
    const total = MoneyMapper.toPersistence(order.getTotal());
    return {
      // ... other fields
      totalAmount: total.amount,
      totalCurrency: total.currency
    };
  }
}
```

#### JSON-Serialized Value Object
```typescript
// Collection value object → JSON database column
export class TagsMapper {
  static toDomain(tagsJson: string[]): Result<ProductTags> {
    const tags: Tag[] = [];
    
    for (const tagValue of tagsJson) {
      const tagResult = Tag.create(tagValue);
      if (tagResult.isFailure) {
        return Result.fail(`Invalid tag: ${tagResult.error}`);
      }
      tags.push(tagResult.value);
    }
    
    return ProductTags.create(tags);
  }
  
  static toPersistence(productTags: ProductTags): string[] {
    return productTags.getTags().map(tag => tag.getValue());
  }
}
```

### 3. Aggregate Mappers
Handle complex aggregates spanning multiple tables.

```typescript
// packages/infrastructure/src/mappers/CartAggregateMapper.ts
export class CartAggregateMapper {
  static async toDomain(
    cartRow: CartRow,
    itemRows: CartItemRow[],
    paymentRows: PaymentRow[]
  ): Promise<Result<Cart>> {
    // Map root entity
    const cartResult = this.mapCartRoot(cartRow);
    if (cartResult.isFailure) {
      return Result.fail(`Cart root: ${cartResult.error}`);
    }
    
    const cart = cartResult.value;
    
    // Map child entities
    const itemsResult = await this.mapCartItems(itemRows);
    if (itemsResult.isFailure) {
      return Result.fail(`Cart items: ${itemsResult.error}`);
    }
    
    const paymentsResult = await this.mapPayments(paymentRows);
    if (paymentsResult.isFailure) {
      return Result.fail(`Payments: ${paymentsResult.error}`);
    }
    
    // Reconstitute aggregate
    return cart.reconstitute({
      items: itemsResult.value,
      payments: paymentsResult.value
    });
  }
  
  static toPersistenceRows(cart: Cart): AggregateRows {
    return {
      cartRow: this.mapCartRoot(cart),
      itemRows: this.mapCartItems(cart.getItems()),
      paymentRows: this.mapPayments(cart.getPayments()),
      eventRows: this.mapDomainEvents(cart.getUncommittedEvents())
    };
  }
  
  private static mapCartRoot(cart: Cart): CartRow {
    return {
      id: cart.getId().toString(),
      customerId: cart.getCustomerId().toString(),
      status: cart.getStatus().getValue(),
      totalAmount: cart.getTotal().getAmount().toFixed(2),
      totalCurrency: cart.getTotal().getCurrency(),
      createdAt: cart.getCreatedAt(),
      updatedAt: new Date()
    };
  }
}

interface AggregateRows {
  cartRow: CartRow;
  itemRows: CartItemRow[];
  paymentRows: PaymentRow[];
  eventRows: EventRow[];
}
```

## Advanced Mapping Patterns

### 4. Polymorphic Mappers
Handle inheritance and polymorphic entities.

```typescript
// packages/infrastructure/src/mappers/PaymentMethodMapper.ts
export class PaymentMethodMapper {
  static toDomain(row: PaymentMethodRow): Result<PaymentMethod> {
    switch (row.type) {
      case 'CREDIT_CARD':
        return this.mapCreditCard(row);
      case 'BANK_TRANSFER':
        return this.mapBankTransfer(row);
      case 'DIGITAL_WALLET':
        return this.mapDigitalWallet(row);
      default:
        return Result.fail(`Unknown payment method type: ${row.type}`);
    }
  }
  
  static toPersistence(paymentMethod: PaymentMethod): PaymentMethodRow {
    const baseRow = {
      id: paymentMethod.getId().toString(),
      customerId: paymentMethod.getCustomerId().toString(),
      isActive: paymentMethod.isActive()
    };
    
    if (paymentMethod instanceof CreditCard) {
      return {
        ...baseRow,
        type: 'CREDIT_CARD',
        cardNumber: paymentMethod.getCardNumber().getMasked(),
        expiryMonth: paymentMethod.getExpiry().getMonth(),
        expiryYear: paymentMethod.getExpiry().getYear(),
        cardholderName: paymentMethod.getCardholderName()
      };
    }
    
    if (paymentMethod instanceof BankTransfer) {
      return {
        ...baseRow,
        type: 'BANK_TRANSFER',
        accountNumber: paymentMethod.getAccountNumber().getMasked(),
        routingNumber: paymentMethod.getRoutingNumber(),
        bankName: paymentMethod.getBankName()
      };
    }
    
    // ... handle other types
  }
  
  private static mapCreditCard(row: PaymentMethodRow): Result<CreditCard> {
    const cardNumberResult = CardNumber.create(row.cardNumber);
    const expiryResult = CardExpiry.create(row.expiryMonth, row.expiryYear);
    
    if (cardNumberResult.isFailure) {
      return Result.fail(`Card number: ${cardNumberResult.error}`);
    }
    
    if (expiryResult.isFailure) {
      return Result.fail(`Expiry: ${expiryResult.error}`);
    }
    
    return CreditCard.create({
      id: PaymentMethodId.create(row.id).value,
      customerId: CustomerId.create(row.customerId).value,
      cardNumber: cardNumberResult.value,
      expiry: expiryResult.value,
      cardholderName: row.cardholderName,
      isActive: row.isActive
    });
  }
}
```

### 5. Event Mappers
Handle domain events for event sourcing.

```typescript
// packages/infrastructure/src/mappers/DomainEventMapper.ts
export class DomainEventMapper {
  static toPersistence(event: DomainEvent): EventRow {
    return {
      id: generateId(),
      aggregateId: event.getAggregateId(),
      eventType: event.constructor.name,
      eventData: JSON.stringify(event.toJSON()),
      version: event.getVersion(),
      occurredAt: event.getOccurredAt(),
      metadata: JSON.stringify(event.getMetadata())
    };
  }
  
  static toDomain(row: EventRow): Result<DomainEvent> {
    try {
      const eventData = JSON.parse(row.eventData);
      const metadata = JSON.parse(row.metadata);
      
      // Factory method based on event type
      return this.createEventFromType(row.eventType, eventData, metadata);
    } catch (error) {
      return Result.fail(`Failed to deserialize event: ${error.message}`);
    }
  }
  
  private static createEventFromType(
    eventType: string,
    eventData: any,
    metadata: any
  ): Result<DomainEvent> {
    switch (eventType) {
      case 'OrderCreatedEvent':
        return OrderCreatedEvent.fromJSON(eventData, metadata);
      case 'OrderCancelledEvent':
        return OrderCancelledEvent.fromJSON(eventData, metadata);
      case 'PaymentProcessedEvent':
        return PaymentProcessedEvent.fromJSON(eventData, metadata);
      default:
        return Result.fail(`Unknown event type: ${eventType}`);
    }
  }
}
```

## Testing Mappers

### Unit Testing Strategy
```typescript
// packages/infrastructure/src/mappers/__tests__/UserMapper.test.ts
describe('UserMapper', () => {
  describe('toPersistence', () => {
    it('should map valid domain entity to persistence format', () => {
      // Arrange
      const user = User.create({
        id: UserId.create('test-id').value,
        email: Email.create('test@example.com').value,
        name: 'Test User'
      }).value;
      
      // Act
      const result = UserMapper.toPersistence(user);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User'
      });
    });
  });
  
  describe('toDomain', () => {
    it('should map valid persistence data to domain entity', () => {
      // Arrange
      const row: UserRow = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      // Act
      const result = UserMapper.toDomain(row);
      
      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.getId().toString()).toBe('test-id');
      expect(result.value.getEmail().getValue()).toBe('test@example.com');
      expect(result.value.getName()).toBe('Test User');
    });
    
    it('should fail when mapping invalid persistence data', () => {
      // Arrange
      const row: UserRow = {
        id: '',
        email: 'invalid-email',
        name: ''
      };
      
      // Act
      const result = UserMapper.toDomain(row);
      
      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('ID');
      expect(result.error).toContain('email');
      expect(result.error).toContain('name');
    });
    
    it('should handle edge cases gracefully', () => {
      const testCases = [
        { row: null, expectedError: 'null data' },
        { row: {}, expectedError: 'missing fields' },
        { row: { id: 'valid', email: '', name: 'Test' }, expectedError: 'email' }
      ];
      
      testCases.forEach(({ row, expectedError }) => {
        const result = UserMapper.toDomain(row as any);
        expect(result.isFailure).toBe(true);
        expect(result.error.toLowerCase()).toContain(expectedError);
      });
    });
  });
  
  describe('round-trip mapping', () => {
    it('should preserve data integrity in both directions', () => {
      // Arrange
      const originalUser = User.create({
        id: UserId.create('test-id').value,
        email: Email.create('test@example.com').value,
        name: 'Test User'
      }).value;
      
      // Act
      const persistenceFormat = UserMapper.toPersistence(originalUser);
      const reconstructedResult = UserMapper.toDomain(persistenceFormat);
      
      // Assert
      expect(reconstructedResult.isSuccess).toBe(true);
      const reconstructedUser = reconstructedResult.value;
      
      expect(reconstructedUser.getId().toString()).toBe(originalUser.getId().toString());
      expect(reconstructedUser.getEmail().getValue()).toBe(originalUser.getEmail().getValue());
      expect(reconstructedUser.getName()).toBe(originalUser.getName());
    });
  });
});
```

### Integration Testing with Repository
```typescript
// packages/infrastructure/src/repositories/__tests__/DrizzleUserRepository.test.ts
describe('DrizzleUserRepository with UserMapper', () => {
  it('should save and retrieve user through mapper', async () => {
    // Arrange
    const user = User.create({
      id: UserId.create('test-id').value,
      email: Email.create('test@example.com').value,
      name: 'Test User'
    }).value;
    
    const repository = new DrizzleUserRepository(testDb, UserMapper);
    
    // Act
    const saveResult = await repository.save(user);
    const retrievedUser = await repository.findById(user.getId());
    
    // Assert
    expect(saveResult.isSuccess).toBe(true);
    expect(retrievedUser).toBeTruthy();
    expect(retrievedUser.getId().toString()).toBe('test-id');
    expect(retrievedUser.getEmail().getValue()).toBe('test@example.com');
  });
});
```

## Performance Considerations

### 1. Lazy Loading with Mappers
```typescript
export class OrderAggregateMapper {
  static toDomainLazy(orderRow: OrderRow): Result<Order> {
    // Create order without loading items initially
    return Order.createLazy({
      id: OrderId.create(orderRow.id).value,
      customerId: CustomerId.create(orderRow.customerId).value,
      itemsLoader: () => this.loadOrderItems(orderRow.id)
    });
  }
  
  private static async loadOrderItems(orderId: string): Promise<OrderItem[]> {
    const itemRows = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
    
    return itemRows.map(row => this.mapOrderItem(row).value);
  }
}
```

### 2. Batch Mapping
```typescript
export class ProductMapper {
  static toDomainBatch(rows: ProductRow[]): Result<Product>[] {
    return rows.map(row => this.toDomain(row));
  }
  
  static toPersistenceBatch(products: Product[]): ProductRow[] {
    return products.map(product => this.toPersistence(product));
  }
}
```

### 3. Caching Strategies
```typescript
export class CategoryMapper {
  private static cache = new Map<string, Category>();
  
  static toDomainWithCache(row: CategoryRow): Result<Category> {
    const cached = this.cache.get(row.id);
    if (cached) {
      return Result.ok(cached);
    }
    
    const result = this.toDomain(row);
    if (result.isSuccess) {
      this.cache.set(row.id, result.value);
    }
    
    return result;
  }
}
```

## Best Practices Summary

### 1. Design Principles
- **Single Responsibility**: One mapper per aggregate root
- **Fail Fast**: Validate early and fail with clear errors
- **Immutability**: Don't modify inputs during mapping
- **Type Safety**: Use TypeScript strictly, leverage Drizzle's type inference

### 2. Error Handling
- Use `Result<T>` pattern for fallible operations
- Collect multiple validation errors when possible
- Provide context in error messages
- Handle edge cases explicitly

### 3. Performance
- Consider lazy loading for large aggregates
- Implement caching for frequently accessed entities
- Use batch operations when appropriate
- Profile mapper performance in critical paths

### 4. Testing
- Test both mapping directions
- Include edge cases and error scenarios
- Test round-trip data integrity
- Integration test with actual repositories

### 5. Architecture Compliance
- Keep mappers in infrastructure layer only
- Never import mappers in domain layer
- Use dependency injection for mapper configuration
- Maintain clear separation between mapping and business logic

The Mapper pattern is essential for maintaining Clean Architecture principles while enabling practical persistence and integration needs. When implemented correctly, mappers provide a robust, testable, and maintainable bridge between domain and infrastructure concerns.