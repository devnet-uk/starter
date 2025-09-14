# Domain-Driven Design

## Domain Entities

### Rich Domain Models (Framework-Independent)
```typescript
// packages/core/src/domain/entities/Order.ts
import { Result } from '../shared/Result';
import { DomainEvent } from '../shared/DomainEvent';
import { AggregateRoot } from '../shared/AggregateRoot';
import { Entity } from '../shared/Entity';
import { ValueObject } from '../shared/ValueObject';

// Domain value objects extending base class
export class OrderId extends ValueObject {
  constructor(private readonly value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('Order ID cannot be empty');
    }
  }
  
  static create(value: string): Result<OrderId> {
    try {
      return Result.ok(new OrderId(value));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

export class CustomerId extends ValueObject {
  constructor(private readonly value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('Customer ID cannot be empty');
    }
  }
  
  static create(value: string): Result<CustomerId> {
    try {
      return Result.ok(new CustomerId(value));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

export class ProductId extends ValueObject {
  constructor(private readonly value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }
  }
  
  static create(value: string): Result<ProductId> {
    try {
      return Result.ok(new ProductId(value));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

// Domain events
export class OrderConfirmedEvent extends DomainEvent {
  constructor(
    public readonly orderId: OrderId,
    public readonly confirmedAt: Date = new Date()
  ) {
    super('OrderConfirmed', confirmedAt);
  }
}

export class OrderItemAddedEvent extends DomainEvent {
  constructor(
    public readonly orderId: OrderId,
    public readonly productId: string,
    public readonly quantity: number,
    occurredAt: Date = new Date()
  ) {
    super('OrderItemAdded', occurredAt);
  }
}

// Domain entity for order items extending base class
export class OrderItem extends Entity<ProductId> {
  constructor(
    productId: ProductId,
    private readonly unitPrice: number,
    private quantity: number
  ) {
    super(productId);
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (unitPrice <= 0) {
      throw new Error('Unit price must be positive');
    }
  }
  
  static create(productId: ProductId, unitPrice: number, quantity: number): Result<OrderItem> {
    try {
      return Result.ok(new OrderItem(productId, unitPrice, quantity));
    } catch (error) {
      return Result.fail(error.message);
    }
  }

  increaseQuantity(amount: number): Result<void> {
    if (amount <= 0) {
      return Result.fail('Amount must be positive');
    }
    this.quantity += amount;
    return Result.ok();
  }

  getQuantity(): number {
    return this.quantity;
  }

  calculateSubtotal(): number {
    return this.unitPrice * this.quantity;
  }
  
  get productId(): ProductId {
    return this.id;
  }
}

// Rich domain entity with business logic (NO FRAMEWORK DEPENDENCIES)
export class Order extends AggregateRoot<OrderId> {
  private items: OrderItem[] = [];
  private status: OrderStatus;
  
  constructor(
    id: OrderId,
    public readonly customerId: CustomerId,
    private createdAt: Date
  ) {
    super(id);
    this.status = OrderStatus.PENDING;
  }
  
  // Business logic in the entity
  addItem(productId: ProductId, unitPrice: number, quantity: number): Result<void> {
    if (this.status !== OrderStatus.PENDING) {
      return Result.fail('Cannot modify confirmed order');
    }
    
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    
    if (unitPrice <= 0) {
      return Result.fail('Unit price must be positive');
    }
    
    const existingItem = this.items.find(i => i.productId.equals(productId));
    if (existingItem) {
      const increaseResult = existingItem.increaseQuantity(quantity);
      if (increaseResult.isFailure) {
        return increaseResult;
      }
    } else {
      const itemResult = OrderItem.create(productId, unitPrice, quantity);
      if (itemResult.isFailure) {
        return Result.fail(itemResult.error!);
      }
      this.items.push(itemResult.value);
    }
    
    this.raise(new OrderItemAddedEvent(this.id, productId, quantity));
    return Result.ok();
  }
  
  confirm(): Result<void> {
    if (this.items.length === 0) {
      return Result.fail('Cannot confirm empty order');
    }
    
    if (!this.hasValidPayment()) {
      return Result.fail('Payment required');
    }
    
    this.status = OrderStatus.CONFIRMED;
    this.raise(new OrderConfirmedEvent(this.id));
    
    return Result.ok();
  }
  
  calculateTotal(): number {
    return this.items.reduce(
      (total, item) => total + item.calculateSubtotal(),
      0
    );
  }

  // Domain methods (business logic only)
  private hasValidPayment(): boolean {
    // Business rule - implement based on domain requirements
    return true; // Simplified for example
  }

  getItemCount(): number {
    return this.items.length;
  }

  canBeModified(): boolean {
    return this.status === OrderStatus.PENDING;
  }
  
  canBeConfirmed(): boolean {
    return this.status === OrderStatus.PENDING && this.items.length > 0;
  }
  
  getItems(): OrderItem[] {
    return [...this.items]; // Return copy to prevent external modification
  }
  
  calculateTotal(): Result<Money> {
    if (this.items.length === 0) {
      return Result.ok(Money.zero('USD'));
    }
    
    let total = 0;
    for (const item of this.items) {
      total += item.calculateSubtotal();
    }
    
    return Money.create({ amount: total, currency: 'USD' });
  }
}
```

## Value Objects

### Immutable Value Types with Zod Validation
```typescript
// packages/core/src/domain/value-objects/Email.ts
import { z } from 'zod';

// Zod schema for email validation
export const EmailSchema = z.string()
  .email('Invalid email format')
  .transform(val => val.toLowerCase())
  .refine(val => {
    // Additional business rules
    const blockedDomains = ['example.com', 'test.com'];
    const domain = val.split('@')[1];
    return !blockedDomains.includes(domain);
  }, 'Email domain not allowed');

export class Email {
  private readonly value: string;
  
  private constructor(value: string) {
    this.value = value;
  }
  
  static create(value: string): Result<Email> {
    try {
      const validatedEmail = EmailSchema.parse(value);
      return Result.ok(new Email(validatedEmail));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Result.fail(error.errors[0].message);
      }
      return Result.fail('Invalid email format');
    }
  }
  
  equals(other: Email): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

// packages/core/src/domain/value-objects/Money.ts
import { z } from 'zod';

// Zod schema for Money validation
export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD']);
export const MoneySchema = z.object({
  amount: z.number().nonnegative('Amount cannot be negative'),
  currency: CurrencySchema,
});

export type Currency = z.infer<typeof CurrencySchema>;
export type MoneyData = z.infer<typeof MoneySchema>;

export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {
    // Validate using Zod
    MoneySchema.parse({ amount, currency });
  }
  
  static create(data: MoneyData): Result<Money> {
    try {
      const validated = MoneySchema.parse(data);
      return Result.ok(new Money(validated.amount, validated.currency));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Result.fail(error.errors[0].message);
      }
      return Result.fail('Invalid money data');
    }
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply by negative number');
    }
    return new Money(this.amount * factor, this.currency);
  }
  
  static zero(currency: Currency = 'USD'): Money {
    return new Money(0, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toJSON(): MoneyData {
    return { amount: this.amount, currency: this.currency };
  }

  protected getEqualityComponents(): unknown[] {
    return [this.amount, this.currency];
  }
}
```

## Aggregates

### Aggregate Root Pattern with Event Sourcing
```typescript
// packages/core/src/domain/aggregates/Cart.ts
import { AggregateRoot } from '../shared/AggregateRoot';
import { DomainEvent } from '../shared/DomainEvent';
import { CartId } from '../value-objects/CartId';
import { CustomerId } from '../value-objects/CustomerId';
import { Money } from '../value-objects/Money';
import { Result } from '../shared/Result';

// Domain events
export class ProductAddedToCartEvent extends DomainEvent {
  constructor(
    public readonly cartId: CartId,
    public readonly productId: ProductId,
    public readonly quantity: number,
    occurredAt?: Date
  ) {
    super('ProductAddedToCart', occurredAt);
  }
}

export class CartCheckedOutEvent extends DomainEvent {
  constructor(
    public readonly cartId: CartId,
    public readonly orderId: OrderId,
    occurredAt?: Date
  ) {
    super('CartCheckedOut', occurredAt);
  }
}

export interface CartItem {
  productId: ProductId;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

export class Cart extends AggregateRoot<CartId> {
  private items: Map<string, CartItem> = new Map();
  
  constructor(
    id: CartId,
    private readonly customerId: CustomerId,
    private readonly createdAt: Date = new Date()
  ) {
    super(id);
  }
  
  addProduct(productId: ProductId, quantity: number, unitPrice: Money): Result<void> {
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    
    const itemKey = productId.toString();
    const existingItem = this.items.get(itemKey);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const subtotal = unitPrice.multiply(newQuantity);
      
      this.items.set(itemKey, {
        productId,
        quantity: newQuantity,
        unitPrice,
        subtotal
      });
    } else {
      const subtotal = unitPrice.multiply(quantity);
      this.items.set(itemKey, {
        productId,
        quantity,
        unitPrice,
        subtotal
      });
    }
    
    this.raise(new ProductAddedToCartEvent(this.id, productId, quantity));
    return Result.ok();
  }
  
  checkout(): Result<void> {
    if (this.items.size === 0) {
      return Result.fail('Cart is empty');
    }
    
    this.raise(new CartCheckedOutEvent(this.id, OrderId.create()));
    this.clear();
    
    return Result.ok();
  }
  
  private clear(): void {
    this.items.clear();
  }
  
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }
  
  getTotalValue(): Money {
    let total = Money.zero();
    
    for (const item of this.items.values()) {
      total = total.add(item.subtotal);
    }
    
    return total;
  }
}
```

## Domain Services

### Pure Business Logic with Repository Interfaces
```typescript
// packages/core/src/domain/services/PricingService.ts
import { Result } from '../shared/Result';

// Domain interfaces (NO IMPLEMENTATION DETAILS)
export interface IDiscountRepository {
  findActiveDiscountsForCustomer(customerId: CustomerId): Promise<Discount[]>;
}

export interface ITaxCalculator {
  calculateTax(amount: Money, location: Address): Result<Money>;
}

// Domain value object for discounts
export class Discount extends ValueObject {
  constructor(
    private readonly type: 'percentage' | 'fixed_amount',
    private readonly value: number,
    private readonly validFrom: Date,
    private readonly validUntil: Date
  ) {
    super();
    if (value < 0) {
      throw new Error('Discount value cannot be negative');
    }
  }
  
  static create(
    type: 'percentage' | 'fixed_amount',
    value: number,
    validFrom: Date,
    validUntil: Date
  ): Result<Discount> {
    try {
      return Result.ok(new Discount(type, value, validFrom, validUntil));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  apply(amount: Money): Result<Money> {
    if (!this.isActive()) {
      return Result.fail('Discount is not currently active');
    }
    
    if (this.type === 'percentage') {
      if (this.value > 100) {
        return Result.fail('Percentage discount cannot exceed 100%');
      }
      const discountFactor = (100 - this.value) / 100;
      return amount.multiply(discountFactor);
    } else {
      const discountAmount = Money.create({ 
        amount: this.value, 
        currency: amount.getCurrency() 
      });
      if (discountAmount.isFailure) {
        return discountAmount;
      }
      return amount.subtract(discountAmount.value);
    }
  }
  
  isActive(): boolean {
    const now = new Date();
    return now >= this.validFrom && now <= this.validUntil;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.type, this.value, this.validFrom, this.validUntil];
  }
}

// Pure domain service (NO DATABASE/FRAMEWORK DEPENDENCIES)
export class PricingService {
  constructor(
    private discountRepo: IDiscountRepository,
    private taxCalculator: ITaxCalculator
  ) {}
  
  async calculateOrderTotal(order: Order, customer: Customer): Promise<Result<Money>> {
    // Calculate base subtotal using domain logic
    const subtotal = order.calculateTotal();
    if (subtotal.isFailure) {
      return subtotal;
    }
    
    try {
      // Fetch discounts through repository interface
      const discounts = await this.discountRepo.findActiveDiscountsForCustomer(customer.id);
      
      // Apply discounts using domain logic
      const discountedResult = this.applyDiscounts(subtotal.value, discounts);
      if (discountedResult.isFailure) {
        return discountedResult;
      }
      
      // Calculate taxes using domain service
      const taxResult = this.taxCalculator.calculateTax(discountedResult.value, customer.getAddress());
      if (taxResult.isFailure) {
        return taxResult;
      }
      
      // Final total calculation
      return discountedResult.value.add(taxResult.value);
      
    } catch (error) {
      return Result.fail(`Pricing calculation failed: ${error.message}`);
    }
  }
  
  private applyDiscounts(amount: Money, discounts: Discount[]): Result<Money> {
    let currentAmount = amount;
    
    for (const discount of discounts) {
      if (discount.isActive()) {
        const discountResult = discount.apply(currentAmount);
        if (discountResult.isFailure) {
          return discountResult;
        }
        currentAmount = discountResult.value;
      }
    }
    
    return Result.ok(currentAmount);
  }
  
  // Business rule validation
  validateDiscountEligibility(customer: Customer, discount: Discount): Result<void> {
    if (!discount.isActive()) {
      return Result.fail('Discount is not currently active');
    }
    
    // Add more business rules as needed
    if (customer.isNew() && discount.getType() === 'percentage') {
      return Result.fail('New customers are not eligible for percentage discounts');
    }
    
    return Result.ok();
  }
}
```

> **Critical Note**: This domain service contains ONLY business logic. Repository implementations, database queries, and external service calls are handled in the infrastructure layer. The service depends only on interfaces defined in the domain.

## Bounded Contexts

### Context Mapping with Pure Domain Interfaces
```typescript
// Separate contexts with clear boundaries (DOMAIN LAYER ONLY)

// Cross-context domain interfaces
export interface IInventoryService {
  checkAvailability(productId: ProductId, quantity: number): Promise<Result<boolean>>;
  reserve(productId: ProductId, quantity: number): Promise<Result<ReservationId>>;
}

// Domain repository interface (NO IMPLEMENTATION)
export interface IOrderRepository {
  save(order: Order): Promise<Result<void>>;
  findById(id: OrderId): Promise<Result<Order | null>>;
  findByCustomer(customerId: CustomerId): Promise<Result<Order[]>>;
}

// Value object for reservation tracking
export class ReservationId extends ValueObject {
  constructor(private readonly value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('Reservation ID cannot be empty');
    }
  }
  
  static create(value?: string): ReservationId {
    return new ReservationId(value ?? ReservationId.generateId());
  }
  
  private static generateId(): string {
    return `reservation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  toString(): string {
    return this.value;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}

// Domain service orchestrating cross-context operations
export class OrderService {
  constructor(
    private inventoryService: IInventoryService,
    private orderRepo: IOrderRepository
  ) {}
  
  async placeOrder(order: Order): Promise<Result<void>> {
    // Validate order state
    if (!order.canBeConfirmed()) {
      return Result.fail('Order is not in a valid state for placement');
    }
    
    // Check inventory availability for all items
    const availabilityCheck = await this.checkInventoryAvailability(order);
    if (availabilityCheck.isFailure) {
      return availabilityCheck;
    }
    
    // Reserve inventory items
    const reservationResult = await this.reserveInventory(order);
    if (reservationResult.isFailure) {
      return Result.fail(`Inventory reservation failed: ${reservationResult.error}`);
    }
    
    // Apply domain business rules
    const confirmResult = order.confirm();
    if (confirmResult.isFailure) {
      return confirmResult;
    }
    
    // Persist the order
    return await this.orderRepo.save(order);
  }
  
  private async checkInventoryAvailability(order: Order): Promise<Result<void>> {
    const items = order.getItems();
    
    for (const item of items) {
      const availabilityResult = await this.inventoryService.checkAvailability(
        item.productId,
        item.getQuantity()
      );
      
      if (availabilityResult.isFailure) {
        return Result.fail(`Inventory check failed: ${availabilityResult.error}`);
      }
      
      if (!availabilityResult.value) {
        return Result.fail(`Product ${item.productId} not available in requested quantity`);
      }
    }
    
    return Result.ok();
  }
  
  private async reserveInventory(order: Order): Promise<Result<ReservationId[]>> {
    const reservations: ReservationId[] = [];
    const items = order.getItems();
    
    for (const item of items) {
      const reservationResult = await this.inventoryService.reserve(
        item.productId,
        item.getQuantity()
      );
      
      if (reservationResult.isFailure) {
        return Result.fail(reservationResult.error!);
      }
      
      reservations.push(reservationResult.value);
    }
    
    return Result.ok(reservations);
  }
}

// Pure domain event handlers (NO CONSOLE STATEMENTS OR SIDE EFFECTS)
export class OrderDomainEventHandlers {
  static handleOrderConfirmed(event: OrderConfirmedEvent): Result<void> {
    // Pure business logic for order confirmation
    // No logging, no console statements, no side effects
    return Result.ok();
  }
  
  static handleOrderItemAdded(event: OrderItemAddedEvent): Result<void> {
    // Pure business logic for item addition
    // Domain rules can be applied here
    return Result.ok();
  }
}
```

> **Critical Note**: This context mapping shows ONLY domain interfaces and business logic. All repository implementations, database operations, and external service integrations are handled in the infrastructure layer. See `@docs/standards/architecture/infrastructure-patterns.md` for implementation details.

## Key Domain Principles

### 1. Framework Independence
- **No ORM imports** in domain layer
- **No database dependencies** in entities or value objects  
- **Pure business logic** only

### 2. Clean Boundaries
- **Domain entities** contain business rules
- **Value objects** are immutable and validated
- **Domain services** orchestrate complex business logic
- **Repository interfaces** define persistence contracts

### 3. Consistent Patterns
- All domain operations return `Result<T>`
- Value objects use static factory methods
- Aggregate roots manage entity clusters
- Domain events track business changes

## Additional Domain Classes

### Customer Entity and Address Value Object
```typescript
// packages/core/src/domain/entities/Customer.ts
import { Entity } from '../shared/Entity';
import { Result } from '../shared/Result';

export class Customer extends Entity<CustomerId> {
  constructor(
    id: CustomerId,
    private email: Email,
    private address: Address,
    private isNewCustomer: boolean = false
  ) {
    super(id);
  }
  
  static create(
    customerId: CustomerId,
    email: Email,
    address: Address,
    isNewCustomer: boolean = false
  ): Result<Customer> {
    return Result.ok(new Customer(customerId, email, address, isNewCustomer));
  }
  
  getAddress(): Address {
    return this.address;
  }
  
  updateAddress(newAddress: Address): Result<void> {
    this.address = newAddress;
    return Result.ok();
  }
  
  isNew(): boolean {
    return this.isNewCustomer;
  }
  
  getEmail(): Email {
    return this.email;
  }
}

// packages/core/src/domain/value-objects/Address.ts
export class Address extends ValueObject {
  constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly state: string,
    private readonly zipCode: string,
    private readonly country: string = 'USA'
  ) {
    super();
    this.validateAddress();
  }
  
  static create(
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string = 'USA'
  ): Result<Address> {
    try {
      return Result.ok(new Address(street, city, state, zipCode, country));
    } catch (error) {
      return Result.fail(error.message);
    }
  }
  
  private validateAddress(): void {
    if (!this.street?.trim()) {
      throw new Error('Street address is required');
    }
    if (!this.city?.trim()) {
      throw new Error('City is required');
    }
    if (!this.state?.trim()) {
      throw new Error('State is required');
    }
    if (!this.zipCode?.trim()) {
      throw new Error('ZIP code is required');
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }
  
  protected getEqualityComponents(): unknown[] {
    return [this.street, this.city, this.state, this.zipCode, this.country];
  }
}
```