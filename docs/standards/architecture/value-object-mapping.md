# Value Object Mapping Patterns

## Overview
This guide covers how to map complex domain value objects to database representations while maintaining Clean Architecture principles. All database mapping occurs in the infrastructure layer, keeping domain objects pure.

> **Key Principle**: Value objects contain only business logic. Database mapping is handled by infrastructure mappers.

## Core Mapping Strategies

### 1. Simple Value Objects
Value objects that map to a single database column.

#### Domain Layer (Pure)
```typescript
// packages/core/src/domain/value-objects/Email.ts
export class Email extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }
  
  static create(value: string): Result<Email> {
    const trimmed = value.toLowerCase().trim();
    
    if (!this.isValidFormat(trimmed)) {
      return Result.fail('Invalid email format');
    }
    
    return Result.ok(new Email(trimmed));
  }
  
  private static isValidFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  getValue(): string {
    return this.value;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
```

#### Infrastructure Layer (Database Schema)
```typescript
// packages/infrastructure/src/schemas/userSchema.ts
import { pgTable, varchar, uuid } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
});

export type UserRow = typeof usersTable.$inferSelect;
```

#### Infrastructure Layer (Mapper)
```typescript
// packages/infrastructure/src/mappers/UserMapper.ts
export class UserMapper {
  static toDomain(row: UserRow): Result<User> {
    const emailResult = Email.create(row.email);
    if (emailResult.isFailure) {
      return Result.fail(`Invalid email in database: ${emailResult.error}`);
    }
    
    const userIdResult = UserId.create(row.id);
    if (userIdResult.isFailure) {
      return Result.fail(`Invalid user ID: ${userIdResult.error}`);
    }
    
    return User.create({
      id: userIdResult.value,
      email: emailResult.value,
      name: row.name
    });
  }
  
  static toPersistence(user: User): UserRow {
    return {
      id: user.getId().toString(),
      email: user.getEmail().getValue(),
      name: user.getName()
    };
  }
}
```

### 2. Complex Value Objects (Multi-Column)
Value objects that span multiple database columns.

#### Domain Layer (Pure)
```typescript
// packages/core/src/domain/value-objects/Money.ts
export class Money extends ValueObject {
  constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {
    super();
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }
  
  static create(amount: number, currency: Currency): Result<Money> {
    try {
      return Result.ok(new Money(amount, currency));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  add(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('Cannot add different currencies');
    }
    return Result.ok(new Money(this.amount + other.amount, this.currency));
  }
  
  getAmount(): number { return this.amount; }
  getCurrency(): Currency { return this.currency; }
  
  protected getEqualityComponents(): unknown[] {
    return [this.amount, this.currency];
  }
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';
```

#### Infrastructure Layer (Database Schema)
```typescript
// packages/infrastructure/src/schemas/orderSchema.ts
import { pgTable, numeric, text, uuid } from 'drizzle-orm/pg-core';

export const ordersTable = pgTable('orders', {
  id: uuid('id').primaryKey(),
  // Money value object maps to two columns
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  totalCurrency: text('total_currency', { 
    enum: ['USD', 'EUR', 'GBP', 'CAD'] 
  }).notNull(),
  customerId: uuid('customer_id').notNull(),
});

export type OrderRow = typeof ordersTable.$inferSelect;
```

#### Infrastructure Layer (Mapper)
```typescript
// packages/infrastructure/src/mappers/OrderMapper.ts
export class OrderMapper {
  static toDomain(row: OrderRow): Result<Order> {
    // Map Money value object from multiple columns
    const totalResult = Money.create(
      parseFloat(row.totalAmount), 
      row.totalCurrency as Currency
    );
    
    if (totalResult.isFailure) {
      return Result.fail(`Invalid money value: ${totalResult.error}`);
    }
    
    const customerIdResult = CustomerId.create(row.customerId);
    if (customerIdResult.isFailure) {
      return Result.fail(`Invalid customer ID: ${customerIdResult.error}`);
    }
    
    return Order.create({
      id: OrderId.create(row.id).value,
      total: totalResult.value,
      customerId: customerIdResult.value
    });
  }
  
  static toPersistence(order: Order): OrderRow {
    const total = order.getTotal();
    
    return {
      id: order.getId().toString(),
      totalAmount: total.getAmount().toString(),
      totalCurrency: total.getCurrency(),
      customerId: order.getCustomerId().toString()
    };
  }
}
```

### 3. Collection Value Objects
Value objects containing collections mapped to JSON or separate tables.

#### Domain Layer (Pure)
```typescript
// packages/core/src/domain/value-objects/Address.ts
export class Address extends ValueObject {
  constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly country: string,
    private readonly postalCode: string
  ) {
    super();
  }
  
  static create(data: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  }): Result<Address> {
    if (!data.street?.trim()) {
      return Result.fail('Street is required');
    }
    
    if (!data.postalCode?.trim()) {
      return Result.fail('Postal code is required');
    }
    
    return Result.ok(new Address(
      data.street.trim(),
      data.city.trim(),
      data.country.trim(),
      data.postalCode.trim()
    ));
  }
  
  getStreet(): string { return this.street; }
  getCity(): string { return this.city; }
  getCountry(): string { return this.country; }
  getPostalCode(): string { return this.postalCode; }
  
  protected getEqualityComponents(): unknown[] {
    return [this.street, this.city, this.country, this.postalCode];
  }
}

// Collection of addresses
export class ShippingAddresses extends ValueObject {
  private constructor(private readonly addresses: Address[]) {
    super();
  }
  
  static create(addresses: Address[]): Result<ShippingAddresses> {
    if (addresses.length === 0) {
      return Result.fail('At least one address is required');
    }
    
    return Result.ok(new ShippingAddresses([...addresses]));
  }
  
  getAddresses(): readonly Address[] {
    return [...this.addresses];
  }
  
  protected getEqualityComponents(): unknown[] {
    return this.addresses.map(addr => addr.getEqualityComponents());
  }
}
```

#### Infrastructure Layer (JSON Mapping)
```typescript
// packages/infrastructure/src/schemas/customerSchema.ts
import { pgTable, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';

export const customersTable = pgTable('customers', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Store addresses as JSON
  shippingAddresses: jsonb('shipping_addresses').$type<AddressData[]>().notNull(),
});

// Interface for JSON serialization
interface AddressData {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export type CustomerRow = typeof customersTable.$inferSelect;
```

#### Infrastructure Layer (JSON Mapper)
```typescript
// packages/infrastructure/src/mappers/CustomerMapper.ts
export class CustomerMapper {
  static toDomain(row: CustomerRow): Result<Customer> {
    // Map JSON array to value objects
    const addressesResult = this.mapAddressesFromJson(row.shippingAddresses);
    if (addressesResult.isFailure) {
      return Result.fail(`Invalid addresses: ${addressesResult.error}`);
    }
    
    const customerIdResult = CustomerId.create(row.id);
    if (customerIdResult.isFailure) {
      return Result.fail(`Invalid customer ID: ${customerIdResult.error}`);
    }
    
    return Customer.create({
      id: customerIdResult.value,
      name: row.name,
      shippingAddresses: addressesResult.value
    });
  }
  
  static toPersistence(customer: Customer): CustomerRow {
    const addresses = customer.getShippingAddresses().getAddresses();
    
    return {
      id: customer.getId().toString(),
      name: customer.getName(),
      shippingAddresses: addresses.map(addr => ({
        street: addr.getStreet(),
        city: addr.getCity(),
        country: addr.getCountry(),
        postalCode: addr.getPostalCode()
      }))
    };
  }
  
  private static mapAddressesFromJson(
    addressesData: AddressData[]
  ): Result<ShippingAddresses> {
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

### 4. Enum Value Objects
Value objects representing constrained sets of values.

#### Domain Layer (Pure)
```typescript
// packages/core/src/domain/value-objects/OrderStatus.ts
export class OrderStatus extends ValueObject {
  private constructor(private readonly value: OrderStatusValue) {
    super();
  }
  
  static create(value: string): Result<OrderStatus> {
    if (!this.isValidStatus(value)) {
      return Result.fail(`Invalid order status: ${value}`);
    }
    
    return Result.ok(new OrderStatus(value as OrderStatusValue));
  }
  
  // Named constructors for type safety
  static pending(): OrderStatus {
    return new OrderStatus('PENDING');
  }
  
  static confirmed(): OrderStatus {
    return new OrderStatus('CONFIRMED');
  }
  
  static shipped(): OrderStatus {
    return new OrderStatus('SHIPPED');
  }
  
  static delivered(): OrderStatus {
    return new OrderStatus('DELIVERED');
  }
  
  getValue(): OrderStatusValue {
    return this.value;
  }
  
  isPending(): boolean { return this.value === 'PENDING'; }
  isConfirmed(): boolean { return this.value === 'CONFIRMED'; }
  isShipped(): boolean { return this.value === 'SHIPPED'; }
  isDelivered(): boolean { return this.value === 'DELIVERED'; }
  
  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatusValue, OrderStatusValue[]> = {
      'PENDING': ['CONFIRMED'],
      'CONFIRMED': ['SHIPPED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': []
    };
    
    return transitions[this.value].includes(newStatus.value);
  }
  
  private static isValidStatus(value: string): value is OrderStatusValue {
    return ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(value);
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

type OrderStatusValue = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
```

#### Infrastructure Layer (Database Enum)
```typescript
// packages/infrastructure/src/schemas/orderSchema.ts
import { pgTable, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'
]);

export const ordersTable = pgTable('orders', {
  id: uuid('id').primaryKey(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  customerId: uuid('customer_id').notNull(),
});
```

## Advanced Patterns

### 5. Nested Value Objects
Complex value objects containing other value objects.

#### Domain Layer (Pure)
```typescript
// packages/core/src/domain/value-objects/ContactInfo.ts
export class ContactInfo extends ValueObject {
  constructor(
    private readonly email: Email,
    private readonly phone: PhoneNumber,
    private readonly address: Address
  ) {
    super();
  }
  
  static create(data: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      country: string;
      postalCode: string;
    };
  }): Result<ContactInfo> {
    const emailResult = Email.create(data.email);
    if (emailResult.isFailure) {
      return Result.fail(`Email: ${emailResult.error}`);
    }
    
    const phoneResult = PhoneNumber.create(data.phone);
    if (phoneResult.isFailure) {
      return Result.fail(`Phone: ${phoneResult.error}`);
    }
    
    const addressResult = Address.create(data.address);
    if (addressResult.isFailure) {
      return Result.fail(`Address: ${addressResult.error}`);
    }
    
    return Result.ok(new ContactInfo(
      emailResult.value,
      phoneResult.value,
      addressResult.value
    ));
  }
  
  getEmail(): Email { return this.email; }
  getPhone(): PhoneNumber { return this.phone; }
  getAddress(): Address { return this.address; }
  
  protected getEqualityComponents(): unknown[] {
    return [
      this.email.getEqualityComponents(),
      this.phone.getEqualityComponents(),
      this.address.getEqualityComponents()
    ];
  }
}
```

#### Infrastructure Layer (Flattened Mapping)
```typescript
// packages/infrastructure/src/schemas/contactSchema.ts
export const contactsTable = pgTable('contacts', {
  id: uuid('id').primaryKey(),
  // Email value object
  email: varchar('email', { length: 255 }).notNull(),
  // Phone value object
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  phoneCountryCode: varchar('phone_country_code', { length: 5 }).notNull(),
  // Address value object
  addressStreet: varchar('address_street', { length: 255 }).notNull(),
  addressCity: varchar('address_city', { length: 100 }).notNull(),
  addressCountry: varchar('address_country', { length: 100 }).notNull(),
  addressPostalCode: varchar('address_postal_code', { length: 20 }).notNull(),
});
```

#### Infrastructure Layer (Nested Mapper)
```typescript
// packages/infrastructure/src/mappers/ContactMapper.ts
export class ContactMapper {
  static toDomain(row: ContactRow): Result<Contact> {
    const contactInfoResult = ContactInfo.create({
      email: row.email,
      phone: `${row.phoneCountryCode}${row.phoneNumber}`,
      address: {
        street: row.addressStreet,
        city: row.addressCity,
        country: row.addressCountry,
        postalCode: row.addressPostalCode
      }
    });
    
    if (contactInfoResult.isFailure) {
      return Result.fail(`Invalid contact info: ${contactInfoResult.error}`);
    }
    
    return Contact.create({
      id: ContactId.create(row.id).value,
      contactInfo: contactInfoResult.value
    });
  }
  
  static toPersistence(contact: Contact): ContactRow {
    const info = contact.getContactInfo();
    const email = info.getEmail();
    const phone = info.getPhone();
    const address = info.getAddress();
    
    return {
      id: contact.getId().toString(),
      email: email.getValue(),
      phoneNumber: phone.getNumber(),
      phoneCountryCode: phone.getCountryCode(),
      addressStreet: address.getStreet(),
      addressCity: address.getCity(),
      addressCountry: address.getCountry(),
      addressPostalCode: address.getPostalCode()
    };
  }
}
```

## Error Handling in Mapping

### Robust Mapping with Validation
```typescript
export class ProductMapper {
  static toDomain(row: ProductRow): Result<Product> {
    const errors: string[] = [];
    
    // Validate and create value objects
    const nameResult = ProductName.create(row.name);
    if (nameResult.isFailure) {
      errors.push(`Name: ${nameResult.error}`);
    }
    
    const priceResult = Money.create(
      parseFloat(row.priceAmount), 
      row.priceCurrency as Currency
    );
    if (priceResult.isFailure) {
      errors.push(`Price: ${priceResult.error}`);
    }
    
    const skuResult = ProductSku.create(row.sku);
    if (skuResult.isFailure) {
      errors.push(`SKU: ${skuResult.error}`);
    }
    
    // Return combined errors if any validation failed
    if (errors.length > 0) {
      return Result.fail(`Product mapping failed: ${errors.join(', ')}`);
    }
    
    return Product.create({
      id: ProductId.create(row.id).value,
      name: nameResult.value,
      price: priceResult.value,
      sku: skuResult.value
    });
  }
}
```

## Best Practices

### 1. Mapping Direction
- **Domain → Database**: Always succeeds (domain is valid)
- **Database → Domain**: Can fail (validate database data)

### 2. Error Handling
- Use `Result<T>` pattern for database-to-domain mapping
- Collect multiple validation errors when possible
- Provide clear error messages for debugging

### 3. Performance Considerations
- Cache complex mappings when appropriate
- Use batch operations for collection mappings
- Consider lazy loading for expensive value object creation

### 4. Testing Strategy
```typescript
// Test mapping in both directions
describe('UserMapper', () => {
  it('should map valid domain to persistence', () => {
    const user = User.create({
      id: UserId.create('test-id').value,
      email: Email.create('test@example.com').value,
      name: 'Test User'
    }).value;
    
    const row = UserMapper.toPersistence(user);
    
    expect(row.email).toBe('test@example.com');
    expect(row.name).toBe('Test User');
  });
  
  it('should map valid persistence to domain', () => {
    const row: UserRow = {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    const result = UserMapper.toDomain(row);
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.getEmail().getValue()).toBe('test@example.com');
  });
  
  it('should fail mapping invalid persistence data', () => {
    const row: UserRow = {
      id: 'test-id',
      email: 'invalid-email',
      name: 'Test User'
    };
    
    const result = UserMapper.toDomain(row);
    
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Invalid email');
  });
});
```

### 5. Architecture Compliance
- Keep ALL mapping logic in infrastructure layer
- Domain objects never know about database structure
- Use dependency injection to inject mappers into repositories
- Maintain clear separation between domain and persistence models

This mapping strategy ensures clean separation of concerns while providing type-safe, robust data transformation between domain and database layers.