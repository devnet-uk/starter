# Infrastructure Patterns

## Overview
Infrastructure layer implementation patterns that properly separate framework concerns from domain logic. This layer contains all the technical details that the domain layer is independent from.

> **Critical Rule**: Infrastructure layer implements interfaces defined in the domain layer. Never let domain code depend on infrastructure implementations.

> Align DrizzleORM, database drivers, and runtime versions with the entries in `docs/standards/tech-stack.md` when following these patterns.

## Repository Pattern Implementation

### Domain Interface (Pure Contract)
```typescript
// packages/core/src/domain/interfaces/IOrderRepository.ts
import { Result } from '../shared/Result';
import { Order } from '../entities/Order';
import { OrderId, CustomerId } from '../value-objects';

export interface IOrderRepository {
  save(order: Order): Promise<Result<void>>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  exists(id: OrderId): Promise<boolean>;
  delete(id: OrderId): Promise<Result<void>>;
}
```

### Infrastructure Implementation (Framework Details)
```typescript
// packages/infrastructure/src/repositories/DrizzleOrderRepository.ts
import { IOrderRepository } from '@/core/domain/interfaces/IOrderRepository';
import { Order, OrderStatus } from '@/core/domain/entities/Order';
import { OrderId, CustomerId } from '@/core/domain/value-objects';
import { Result } from '@/core/domain/shared/Result';
import { db } from '../config/database';
import { orders, orderItems, orderEvents } from '../schemas/orderSchema';
import { eq, and } from 'drizzle-orm';

export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private database = db) {}

  async save(order: Order): Promise<Result<void>> {
    try {
      await this.database.transaction(async (tx) => {
        // Convert domain entity to database format
        const orderData = this.toDatabaseFormat(order);
        
        // Upsert order with DrizzleORM 0.44.5+
        await tx.insert(orders)
          .values(orderData)
          .onConflictDoUpdate({
            target: orders.id,
            set: {
              status: orderData.status,
              updatedAt: new Date(),
            },
          });

        // Handle order items
        await this.saveOrderItems(tx, order);
        
        // Save domain events
        await this.saveDomainEvents(tx, order);
        
        // Mark events as committed
        order.markEventsAsCommitted();
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save order: ${error.message}`);
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    try {
      const result = await this.database
        .select()
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.id, id.toString()));

      if (result.length === 0) {
        return null;
      }

      // Convert database format to domain entity
      return this.toDomainEntity(result);
    } catch (error) {
      // In production, use proper logging interface like ILogger
      // this.logger.error('Failed to find order', { orderId: id.toString(), error });
      return null;
    }
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    const results = await this.database
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.customerId, customerId.toString()));

    return this.groupAndConvertToEntities(results);
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const results = await this.database
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.status, status));

    return this.groupAndConvertToEntities(results);
  }

  async exists(id: OrderId): Promise<boolean> {
    const result = await this.database
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id.toString()))
      .limit(1);

    return result.length > 0;
  }

  async delete(id: OrderId): Promise<Result<void>> {
    try {
      await this.database.transaction(async (tx) => {
        // Delete order items first (foreign key constraint)
        await tx.delete(orderItems).where(eq(orderItems.orderId, id.toString()));
        
        // Delete order events
        await tx.delete(orderEvents).where(eq(orderEvents.orderId, id.toString()));
        
        // Delete order
        await tx.delete(orders).where(eq(orders.id, id.toString()));
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete order: ${error.message}`);
    }
  }

  // Private mapping methods
  private toDatabaseFormat(order: Order): any {
    return {
      id: order.id.toString(),
      customerId: order.customerId.toString(),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: new Date(),
    };
  }

  private toDomainEntity(results: any[]): Order {
    const orderData = results[0].orders;
    const itemsData = results
      .filter(r => r.order_items)
      .map(r => r.order_items);

    // Reconstruct domain entity
    const order = new Order(
      new OrderId(orderData.id),
      new CustomerId(orderData.customerId),
      orderData.createdAt
    );

    // Add items
    itemsData.forEach(item => {
      order.addItem(item.productId, item.quantity, item.unitPrice);
    });

    return order;
  }

  private async saveOrderItems(tx: any, order: Order): Promise<void> {
    const items = order.getItems();
    
    if (items.length > 0) {
      // Delete existing items
      await tx.delete(orderItems)
        .where(eq(orderItems.orderId, order.id.toString()));
      
      // Insert current items
      await tx.insert(orderItems)
        .values(
          items.map(item => ({
            orderId: order.id.toString(),
            productId: item.productId,
            quantity: item.getQuantity(),
            unitPrice: item.unitPrice,
            subtotal: item.calculateSubtotal(),
          }))
        );
    }
  }

  private async saveDomainEvents(tx: any, order: Order): Promise<void> {
    const events = order.getUncommittedEvents();
    
    if (events.length > 0) {
      await tx.insert(orderEvents)
        .values(
          events.map(event => ({
            id: event.eventId,
            orderId: order.id.toString(),
            eventType: event.eventType,
            eventData: JSON.stringify(event),
            occurredAt: event.occurredAt,
          }))
        );
    }
  }

  private groupAndConvertToEntities(results: any[]): Order[] {
    const orderGroups = new Map<string, any[]>();
    
    results.forEach(result => {
      const orderId = result.orders.id;
      if (!orderGroups.has(orderId)) {
        orderGroups.set(orderId, []);
      }
      orderGroups.get(orderId)!.push(result);
    });

    return Array.from(orderGroups.values())
      .map(group => this.toDomainEntity(group));
  }
}
```

### Database Schema (Separate from Domain)
```typescript
// packages/infrastructure/src/schemas/orderSchema.ts
import { pgTable, uuid, timestamp, text, integer, numeric, jsonb } from 'drizzle-orm/pg-core';

// Database tables (NOT domain entities)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  customerId: uuid('customer_id').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'shipped', 'delivered'] })
    .notNull().default('pending'),
  
  // DrizzleORM 0.44.5+ automatic timestamps
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const orderEvents = pgTable('order_events', {
  id: uuid('id').primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data').notNull(),
  
  occurredAt: timestamp('occurred_at', { mode: 'date', precision: 3 })
    .notNull().defaultNow(),
});
```

## External Service Integration

### Domain Interface (Anti-Corruption Layer)
```typescript
// packages/core/src/domain/interfaces/IEmailService.ts
import { Result } from '../shared/Result';
import { Email } from '../value-objects/Email';

export interface IEmailService {
  sendWelcomeEmail(email: Email, name: string): Promise<Result<void>>;
  sendOrderConfirmation(email: Email, orderDetails: OrderConfirmationData): Promise<Result<void>>;
  sendPasswordReset(email: Email, resetToken: string): Promise<Result<void>>;
}

export interface OrderConfirmationData {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}
```

### Infrastructure Implementation
```typescript
// packages/infrastructure/src/services/SendGridEmailService.ts
import { IEmailService, OrderConfirmationData } from '@/core/domain/interfaces/IEmailService';
import { Email } from '@/core/domain/value-objects/Email';
import { Result } from '@/core/domain/shared/Result';
import sgMail from '@sendgrid/mail';

export class SendGridEmailService implements IEmailService {
  constructor(private apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendWelcomeEmail(email: Email, name: string): Promise<Result<void>> {
    try {
      const msg = {
        to: email.toString(),
        from: 'noreply@company.com',
        subject: 'Welcome to Our Platform',
        html: this.generateWelcomeTemplate(name),
      };

      await sgMail.send(msg);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to send welcome email: ${error.message}`);
    }
  }

  async sendOrderConfirmation(email: Email, orderDetails: OrderConfirmationData): Promise<Result<void>> {
    try {
      const msg = {
        to: email.toString(),
        from: 'orders@company.com',
        subject: `Order Confirmation - ${orderDetails.orderNumber}`,
        html: this.generateOrderConfirmationTemplate(orderDetails),
      };

      await sgMail.send(msg);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to send order confirmation: ${error.message}`);
    }
  }

  async sendPasswordReset(email: Email, resetToken: string): Promise<Result<void>> {
    try {
      const msg = {
        to: email.toString(),
        from: 'security@company.com',
        subject: 'Password Reset Request',
        html: this.generatePasswordResetTemplate(resetToken),
      };

      await sgMail.send(msg);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to send password reset email: ${error.message}`);
    }
  }

  private generateWelcomeTemplate(name: string): string {
    return `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining our platform.</p>
    `;
  }

  private generateOrderConfirmationTemplate(order: OrderConfirmationData): string {
    const itemsList = order.items
      .map(item => `<li>${item.name} x${item.quantity} - $${item.price}</li>`)
      .join('');
    
    return `
      <h1>Order Confirmation</h1>
      <p>Order Number: ${order.orderNumber}</p>
      <ul>${itemsList}</ul>
      <p><strong>Total: $${order.total}</strong></p>
    `;
  }

  private generatePasswordResetTemplate(resetToken: string): string {
    return `
      <h1>Password Reset</h1>
      <p>Click <a href="https://app.company.com/reset?token=${resetToken}">here</a> to reset your password.</p>
      <p>This link expires in 1 hour.</p>
    `;
  }
}
```

## Domain-Infrastructure Mapping Patterns

### Hexagonal Architecture Mappers
Following hexagonal architecture principles, mappers serve as adapters between domain and infrastructure layers.

<conditional-block task-condition="mapper|mapping|dto|data-transfer|entity-mapping|aggregate-mapper" context-check="mapper-pattern-details">
IF task requires detailed implementation of mappers for entities, aggregates, or DTOs:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get detailed mapper patterns from architecture/mapper-pattern.md"
  </context_fetcher_strategy>
</conditional-block>

<conditional-block task-condition="value-object|vo-mapping|primitive-obsession|domain-primitive|complex-vo" context-check="value-object-mapping-details">
IF task requires detailed implementation of value object mapping:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get detailed value object mapping patterns from architecture/value-object-mapping.md"
  </context_fetcher_strategy>
</conditional-block>

### 1. Entity Mappers
Transform domain entities to/from database representations.

```typescript
// packages/infrastructure/src/mappers/OrderMapper.ts
import { Order, OrderStatus } from '@/core/domain/entities/Order';
import { OrderId, CustomerId } from '@/core/domain/value-objects';
import { Money, Currency } from '@/core/domain/value-objects/Money';
import { Result } from '@/core/domain/shared/Result';
import { OrderRow, OrderItemRow } from '../schemas/orderSchema';

export class OrderMapper {
  /**
   * Maps database row to domain entity
   * Can fail if database contains invalid data
   */
  static toDomain(
    orderRow: OrderRow, 
    itemRows: OrderItemRow[] = []
  ): Result<Order> {
    const errors: string[] = [];
    
    // Map value objects with validation
    const orderIdResult = OrderId.create(orderRow.id);
    if (orderIdResult.isFailure) {
      errors.push(`Invalid order ID: ${orderIdResult.error}`);
    }
    
    const customerIdResult = CustomerId.create(orderRow.customerId);
    if (customerIdResult.isFailure) {
      errors.push(`Invalid customer ID: ${customerIdResult.error}`);
    }
    
    const statusResult = OrderStatus.create(orderRow.status);
    if (statusResult.isFailure) {
      errors.push(`Invalid status: ${statusResult.error}`);
    }
    
    const totalResult = Money.create(
      parseFloat(orderRow.totalAmount),
      orderRow.totalCurrency as Currency
    );
    if (totalResult.isFailure) {
      errors.push(`Invalid total: ${totalResult.error}`);
    }
    
    // Return combined errors if validation failed
    if (errors.length > 0) {
      return Result.fail(`Order mapping failed: ${errors.join(', ')}`);
    }
    
    // Create domain entity
    const orderResult = Order.reconstitute({
      id: orderIdResult.value,
      customerId: customerIdResult.value,
      status: statusResult.value,
      total: totalResult.value,
      createdAt: orderRow.createdAt
    });
    
    if (orderResult.isFailure) {
      return Result.fail(`Failed to create order: ${orderResult.error}`);
    }
    
    const order = orderResult.value;
    
    // Map order items
    for (const itemRow of itemRows) {
      const itemResult = this.mapOrderItem(itemRow);
      if (itemResult.isFailure) {
        return Result.fail(`Invalid order item: ${itemResult.error}`);
      }
      
      order.addItem(itemResult.value);
    }
    
    return Result.ok(order);
  }
  
  /**
   * Maps domain entity to database row
   * Always succeeds (domain entity is valid by construction)
   */
  static toPersistence(order: Order): OrderRow {
    const total = order.getTotal();
    
    return {
      id: order.getId().toString(),
      customerId: order.getCustomerId().toString(),
      status: order.getStatus().getValue(),
      totalAmount: total.getAmount().toFixed(2),
      totalCurrency: total.getCurrency(),
      createdAt: order.getCreatedAt(),
      updatedAt: new Date()
    };
  }
  
  private static mapOrderItem(itemRow: OrderItemRow): Result<OrderItem> {
    const productIdResult = ProductId.create(itemRow.productId);
    if (productIdResult.isFailure) {
      return Result.fail(`Invalid product ID: ${productIdResult.error}`);
    }
    
    const priceResult = Money.create(
      parseFloat(itemRow.unitPrice),
      itemRow.currency as Currency
    );
    if (priceResult.isFailure) {
      return Result.fail(`Invalid price: ${priceResult.error}`);
    }
    
    return OrderItem.create({
      productId: productIdResult.value,
      quantity: itemRow.quantity,
      unitPrice: priceResult.value
    });
  }
}
```

### 2. Value Object Mappers
Handle complex value object transformations.

```typescript
// packages/infrastructure/src/mappers/ContactInfoMapper.ts
export class ContactInfoMapper {
  /**
   * Maps nested value object to flattened database columns
   */
  static toPersistence(contactInfo: ContactInfo): ContactRow {
    const email = contactInfo.getEmail();
    const phone = contactInfo.getPhone();
    const address = contactInfo.getAddress();
    
    return {
      // Email value object → single column
      email: email.getValue(),
      
      // Phone value object → multiple columns
      phoneNumber: phone.getNumber(),
      phoneCountryCode: phone.getCountryCode(),
      
      // Address value object → multiple columns
      addressStreet: address.getStreet(),
      addressCity: address.getCity(),
      addressCountry: address.getCountry(),
      addressPostalCode: address.getPostalCode()
    };
  }
  
  /**
   * Maps flattened database columns to nested value object
   */
  static toDomain(row: ContactRow): Result<ContactInfo> {
    return ContactInfo.create({
      email: row.email,
      phone: {
        number: row.phoneNumber,
        countryCode: row.phoneCountryCode
      },
      address: {
        street: row.addressStreet,
        city: row.addressCity,
        country: row.addressCountry,
        postalCode: row.addressPostalCode
      }
    });
  }
}
```

### 3. Collection Mappers
Handle arrays and collections with JSON or separate tables.

```typescript
// packages/infrastructure/src/mappers/ShippingAddressesMapper.ts
export class ShippingAddressesMapper {
  /**
   * Maps collection value object to JSON column
   */
  static toJsonPersistence(addresses: ShippingAddresses): AddressData[] {
    return addresses.getAddresses().map(address => ({
      street: address.getStreet(),
      city: address.getCity(),
      country: address.getCountry(),
      postalCode: address.getPostalCode()
    }));
  }
  
  /**
   * Maps JSON column to collection value object
   */
  static fromJsonToDomain(addressesData: AddressData[]): Result<ShippingAddresses> {
    const addresses: Address[] = [];
    
    for (const addressData of addressesData) {
      const addressResult = Address.create(addressData);
      if (addressResult.isFailure) {
        return Result.fail(`Invalid address: ${addressResult.error}`);
      }
      addresses.push(addressResult.value);
    }
    
    return ShippingAddresses.create(addresses);
  }
}
```

### 4. Aggregate Mappers
Handle complex aggregates with multiple entities.

```typescript
// packages/infrastructure/src/mappers/CartMapper.ts
export class CartMapper {
  /**
   * Maps aggregate with entities to multiple table rows
   */
  static toPersistenceRows(cart: Cart): {
    cartRow: CartRow;
    itemRows: CartItemRow[];
  } {
    const cartRow: CartRow = {
      id: cart.getId().toString(),
      customerId: cart.getCustomerId().toString(),
      status: cart.getStatus().getValue(),
      createdAt: cart.getCreatedAt(),
      updatedAt: new Date()
    };
    
    const itemRows: CartItemRow[] = cart.getItems().map(item => ({
      id: generateId(),
      cartId: cart.getId().toString(),
      productId: item.getProductId().toString(),
      quantity: item.getQuantity(),
      unitPrice: item.getUnitPrice().getAmount().toFixed(2),
      currency: item.getUnitPrice().getCurrency(),
      subtotal: item.getSubtotal().getAmount().toFixed(2)
    }));
    
    return { cartRow, itemRows };
  }
  
  /**
   * Maps multiple table rows to aggregate
   */
  static toDomain(
    cartRow: CartRow,
    itemRows: CartItemRow[]
  ): Result<Cart> {
    const cartResult = this.mapCartEntity(cartRow);
    if (cartResult.isFailure) {
      return Result.fail(`Invalid cart: ${cartResult.error}`);
    }
    
    const cart = cartResult.value;
    
    // Map cart items
    for (const itemRow of itemRows) {
      const itemResult = this.mapCartItem(itemRow);
      if (itemResult.isFailure) {
        return Result.fail(`Invalid cart item: ${itemResult.error}`);
      }
      
      cart.addItem(itemResult.value);
    }
    
    return Result.ok(cart);
  }
  
  private static mapCartEntity(row: CartRow): Result<Cart> {
    const cartIdResult = CartId.create(row.id);
    const customerIdResult = CustomerId.create(row.customerId);
    const statusResult = CartStatus.create(row.status);
    
    if (cartIdResult.isFailure) {
      return Result.fail(`Invalid cart ID: ${cartIdResult.error}`);
    }
    
    if (customerIdResult.isFailure) {
      return Result.fail(`Invalid customer ID: ${customerIdResult.error}`);
    }
    
    if (statusResult.isFailure) {
      return Result.fail(`Invalid status: ${statusResult.error}`);
    }
    
    return Cart.reconstitute({
      id: cartIdResult.value,
      customerId: customerIdResult.value,
      status: statusResult.value,
      createdAt: row.createdAt
    });
  }
  
  private static mapCartItem(row: CartItemRow): Result<CartItem> {
    const productIdResult = ProductId.create(row.productId);
    const unitPriceResult = Money.create(
      parseFloat(row.unitPrice),
      row.currency as Currency
    );
    
    if (productIdResult.isFailure) {
      return Result.fail(`Invalid product ID: ${productIdResult.error}`);
    }
    
    if (unitPriceResult.isFailure) {
      return Result.fail(`Invalid unit price: ${unitPriceResult.error}`);
    }
    
    return CartItem.create({
      productId: productIdResult.value,
      quantity: row.quantity,
      unitPrice: unitPriceResult.value
    });
  }
}
```

### 5. Transaction-Safe Repository with Mappers
Integrate mappers with repository pattern and transactions.

```typescript
// packages/infrastructure/src/repositories/DrizzleOrderRepository.ts
export class DrizzleOrderRepository implements IOrderRepository {
  constructor(
    private database = db,
    private mapper = OrderMapper
  ) {}
  
  async save(order: Order): Promise<Result<void>> {
    try {
      await this.database.transaction(async (tx) => {
        // Map domain entity to persistence format
        const orderRow = this.mapper.toPersistence(order);
        
        // Save order
        await tx.insert(ordersTable)
          .values(orderRow)
          .onConflictDoUpdate({
            target: ordersTable.id,
            set: {
              status: orderRow.status,
              totalAmount: orderRow.totalAmount,
              updatedAt: new Date()
            }
          });
        
        // Save order items
        await this.saveOrderItems(tx, order);
        
        // Save domain events
        await this.saveDomainEvents(tx, order);
        
        // Mark events as committed
        order.markEventsAsCommitted();
      });
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save order: ${error.message}`);
    }
  }
  
  async findById(id: OrderId): Promise<Order | null> {
    try {
      const orderRows = await this.database
        .select()
        .from(ordersTable)
        .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
        .where(eq(ordersTable.id, id.toString()));
      
      if (orderRows.length === 0) {
        return null;
      }
      
      // Group by order
      const orderRow = orderRows[0].orders;
      const itemRows = orderRows
        .filter(row => row.order_items)
        .map(row => row.order_items);
      
      // Map to domain entity
      const orderResult = this.mapper.toDomain(orderRow, itemRows);
      if (orderResult.isFailure) {
        // Log error but don't throw - data corruption handling
        console.error(`Failed to map order ${id}: ${orderResult.error}`);
        return null;
      }
      
      return orderResult.value;
    } catch (error) {
      console.error(`Database error finding order ${id}:`, error);
      return null;
    }
  }
  
  private async saveOrderItems(tx: any, order: Order): Promise<void> {
    const items = order.getItems();
    
    if (items.length > 0) {
      // Delete existing items
      await tx.delete(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.getId().toString()));
      
      // Map and insert current items
      const itemRows = items.map(item => ({
        id: generateId(),
        orderId: order.getId().toString(),
        productId: item.getProductId().toString(),
        quantity: item.getQuantity(),
        unitPrice: item.getUnitPrice().getAmount().toFixed(2),
        currency: item.getUnitPrice().getCurrency(),
        subtotal: item.getSubtotal().getAmount().toFixed(2)
      }));
      
      await tx.insert(orderItemsTable).values(itemRows);
    }
  }
}
```

### Best Practices for Infrastructure Mapping

1. **Error Handling**: Always use Result pattern for database-to-domain mapping
2. **Validation**: Validate all data when mapping from persistence to domain
3. **Type Safety**: Use Drizzle's type inference for database row types
4. **Transaction Safety**: Map within database transactions for consistency
5. **Performance**: Batch operations and use efficient queries
6. **Testing**: Test both directions of mapping with edge cases
7. **Separation**: Keep mapping logic separate from repository logic when complex

This approach ensures clean separation between domain and infrastructure while maintaining type safety and robust error handling.

## Event Sourcing Infrastructure

### Domain Event Store Interface
```typescript
// packages/core/src/domain/interfaces/IEventStore.ts
import { DomainEvent } from '../shared/DomainEvent';
import { Result } from '../shared/Result';

export interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<Result<void>>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, fromDate?: Date): Promise<DomainEvent[]>;
}

export interface EventMetadata {
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
}
```

### PostgreSQL Event Store Implementation
```typescript
// packages/infrastructure/src/eventstore/PostgreSQLEventStore.ts
import { IEventStore } from '@/core/domain/interfaces/IEventStore';
import { DomainEvent } from '@/core/domain/shared/DomainEvent';
import { Result } from '@/core/domain/shared/Result';
import { db } from '../config/database';
import { events } from '../schemas/eventSchema';
import { eq, gte, and } from 'drizzle-orm';

export class PostgreSQLEventStore implements IEventStore {
  async saveEvents(
    aggregateId: string, 
    domainEvents: DomainEvent[], 
    expectedVersion: number
  ): Promise<Result<void>> {
    try {
      await db.transaction(async (tx) => {
        // Check version for optimistic concurrency control
        const lastEvent = await tx
          .select({ version: events.version })
          .from(events)
          .where(eq(events.aggregateId, aggregateId))
          .orderBy(events.version)
          .limit(1);

        const currentVersion = lastEvent[0]?.version || 0;
        if (currentVersion !== expectedVersion) {
          throw new Error(`Concurrency conflict. Expected version ${expectedVersion}, got ${currentVersion}`);
        }

        // Save events
        const eventData = domainEvents.map((event, index) => ({
          id: event.eventId,
          aggregateId,
          eventType: event.eventType,
          eventData: JSON.stringify(event),
          version: expectedVersion + index + 1,
          occurredAt: event.occurredAt,
        }));

        await tx.insert(events).values(eventData);
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save events: ${error.message}`);
    }
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const conditions = [eq(events.aggregateId, aggregateId)];
    
    if (fromVersion) {
      conditions.push(gte(events.version, fromVersion));
    }

    const results = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.version);

    return results.map(row => this.deserializeEvent(row));
  }

  async getEventsByType(eventType: string, fromDate?: Date): Promise<DomainEvent[]> {
    const conditions = [eq(events.eventType, eventType)];
    
    if (fromDate) {
      conditions.push(gte(events.occurredAt, fromDate));
    }

    const results = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.occurredAt);

    return results.map(row => this.deserializeEvent(row));
  }

  private deserializeEvent(row: any): DomainEvent {
    const eventData = JSON.parse(row.eventData);
    
    // Reconstruct domain event based on type
    switch (row.eventType) {
      case 'OrderConfirmed':
        return new OrderConfirmedEvent(
          eventData.orderId,
          new Date(eventData.confirmedAt)
        );
      case 'OrderItemAdded':
        return new OrderItemAddedEvent(
          eventData.orderId,
          eventData.productId,
          eventData.quantity,
          new Date(eventData.occurredAt)
        );
      default:
        throw new Error(`Unknown event type: ${row.eventType}`);
    }
  }
}
```

### Event Schema
```typescript
// packages/infrastructure/src/schemas/eventSchema.ts
import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').primaryKey(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data').notNull(),
  version: integer('version').notNull(),
  
  occurredAt: timestamp('occurred_at', { mode: 'date', precision: 3 })
    .notNull().defaultNow(),
    
  // Indexes for performance
}, (table) => ({
  aggregateIdx: index('aggregate_id_version_idx').on(table.aggregateId, table.version),
  typeIdx: index('event_type_occurred_idx').on(table.eventType, table.occurredAt),
}));
```

## Dependency Injection Container

### Container Configuration
```typescript
// packages/infrastructure/src/container/DIContainer.ts
import { Container } from 'inversify';
import { IOrderRepository } from '@/core/domain/interfaces/IOrderRepository';
import { IEmailService } from '@/core/domain/interfaces/IEmailService';
import { IEventStore } from '@/core/domain/interfaces/IEventStore';
import { DrizzleOrderRepository } from '../repositories/DrizzleOrderRepository';
import { SendGridEmailService } from '../services/SendGridEmailService';
import { PostgreSQLEventStore } from '../eventstore/PostgreSQLEventStore';

// Dependency injection symbols
export const TYPES = {
  OrderRepository: Symbol.for('OrderRepository'),
  EmailService: Symbol.for('EmailService'),
  EventStore: Symbol.for('EventStore'),
};

// Container configuration
export function createContainer(): Container {
  const container = new Container();
  
  // Repository bindings
  container.bind<IOrderRepository>(TYPES.OrderRepository)
    .to(DrizzleOrderRepository)
    .inSingletonScope();
  
  // Service bindings
  container.bind<IEmailService>(TYPES.EmailService)
    .toDynamicValue(() => new SendGridEmailService(process.env.SENDGRID_API_KEY!))
    .inSingletonScope();
  
  // Event store binding
  container.bind<IEventStore>(TYPES.EventStore)
    .to(PostgreSQLEventStore)
    .inSingletonScope();
  
  return container;
}
```

## Testing Infrastructure Components

### Repository Testing
```typescript
// packages/infrastructure/src/repositories/__tests__/DrizzleOrderRepository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleOrderRepository } from '../DrizzleOrderRepository';
import { Order } from '@/core/domain/entities/Order';
import { OrderId, CustomerId } from '@/core/domain/value-objects';
import { createTestDatabase, cleanDatabase } from '../../test-utils/database';

describe('DrizzleOrderRepository', () => {
  let repository: DrizzleOrderRepository;
  let testDb: any;
  
  beforeEach(async () => {
    testDb = await createTestDatabase();
    repository = new DrizzleOrderRepository(testDb);
  });
  
  afterEach(async () => {
    await cleanDatabase(testDb);
  });

  it('should save and retrieve order correctly', async () => {
    // Given
    const orderId = OrderId.create();
    const customerId = CustomerId.create();
    const order = new Order(orderId, customerId, new Date());
    order.addItem('product-1', 2, 10.00);
    
    // When
    const saveResult = await repository.save(order);
    const retrievedOrder = await repository.findById(orderId);
    
    // Then
    expect(saveResult.isSuccess).toBe(true);
    expect(retrievedOrder).not.toBeNull();
    expect(retrievedOrder!.id.equals(orderId)).toBe(true);
    expect(retrievedOrder!.getItemCount()).toBe(2);
  });

  it('should handle save failures gracefully', async () => {
    // Given - invalid order data that would cause database constraint violation
    const order = null as any;
    
    // When
    const result = await repository.save(order);
    
    // Then
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Failed to save order');
  });
});
```

## Key Infrastructure Principles

### 1. Interface Segregation
- **Domain defines contracts** - Infrastructure implements them
- **Single responsibility** - Each service has one reason to change
- **Dependency inversion** - Depend on abstractions, not concretions

### 2. Framework Isolation
- **All framework code** stays in infrastructure layer
- **Domain interfaces** define what infrastructure must provide
- **Anti-corruption layers** translate between domains and external systems

### 3. Database Patterns
- **Repository pattern** for data access abstraction
- **Unit of Work** for transaction management
- **Data mappers** convert between domain entities and database records

### 4. Event Handling
- **Event sourcing** for complete audit trails
- **Event store** as append-only log
- **Event handlers** for cross-aggregate communication

### 5. Testing Strategies
- **Integration tests** for infrastructure components
- **Test databases** for repository testing
- **Mock external services** for service testing
- **Contract tests** ensure interface compliance

This infrastructure layer properly implements the technical details while keeping the domain layer pure and focused on business logic.
