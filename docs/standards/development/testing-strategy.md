# Testing Strategy

## Test Pyramid

### Unit Tests (70%)

<conditional-block task-condition="unit|unit-test" context-check="unit-testing-patterns">
IF task only involves unit testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load unit testing patterns from development/testing-strategy.md#unit-tests-70"
  </context_fetcher_strategy>
</conditional-block>

```typescript
// Vitest 3.2.4+ with enhanced features
import { describe, it, expect, vi } from 'vitest';
import { calculateDiscount } from './pricing';

describe('calculateDiscount', () => {
  it('should apply percentage discount correctly', () => {
    const result = calculateDiscount(100, 0.2);
    expect(result).toBe(80);
  });
  
  it('should handle zero discount', () => {
    const result = calculateDiscount(100, 0);
    expect(result).toBe(100);
  });
  
  it('should throw for negative amounts', () => {
    expect(() => calculateDiscount(-100, 0.2)).toThrow('Invalid amount');
  });
  
  // Vitest 3.2.4+ enhanced assertions
  it('should handle edge cases with floating point precision', () => {
    const result = calculateDiscount(123.45, 0.1);
    expect(result).toBeCloseTo(111.105, 3);
  });
  
  // Enhanced mock utilities
  it('should log discount calculations', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    calculateDiscount(100, 0.15);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Applied 15% discount/)
    );
    
    consoleSpy.mockRestore();
  });
});

// Concurrent test execution (Vitest 3.2.4+)
describe.concurrent('Parallel Business Logic Tests', () => {
  it.concurrent('calculates tax correctly', async () => {
    const result = await calculateTax(100, 0.08);
    expect(result).toBe(108);
  });
  
  it.concurrent('applies bulk discount', async () => {
    const result = await calculateBulkDiscount([100, 200, 300]);
    expect(result).toBe(540); // 10% bulk discount
  });
});
```

### Integration Tests (20%)

<conditional-block task-condition="integration|integration-test" context-check="integration-testing-patterns">
IF task only involves integration testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load integration testing patterns from development/testing-strategy.md#integration-tests-20"
  </context_fetcher_strategy>
</conditional-block>

```typescript
// Test module interactions
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './UserService';
import { createTestDatabase } from '@/test/utils';

describe('UserService Integration', () => {
  let service: UserService;
  let db: TestDatabase;
  
  beforeEach(async () => {
    db = await createTestDatabase();
    service = new UserService(db);
  });
  
  it('should create and retrieve user', async () => {
    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    const retrieved = await service.findById(user.id);
    expect(retrieved).toEqual(user);
  });
});
```

### E2E Tests (10%)
```typescript
// Critical user paths
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('[name="email"]', 'new@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

## Domain Layer Testing (Clean Architecture)

<conditional-block task-condition="domain|domain-testing|clean-architecture|unit-test" context-check="domain-testing-patterns">
IF task involves domain layer testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load domain testing patterns from development/testing-strategy.md#domain-layer-testing-clean-architecture"
  </context_fetcher_strategy>
</conditional-block>

### Pure Unit Tests (No Infrastructure Dependencies)

Domain layer tests must be completely isolated from frameworks, databases, and external services.

```typescript
// packages/core/src/domain/entities/__tests__/Order.test.ts
import { describe, it, expect } from 'vitest';
import { Order, OrderId, CustomerId } from '../Order';
import { OrderItemAddedEvent } from '../events/OrderItemAddedEvent';
import { Result } from '../../shared/Result';

describe('Order Entity', () => {
  let orderId: OrderId;
  let customerId: CustomerId;
  let order: Order;

  beforeEach(() => {
    orderId = OrderId.create();
    customerId = CustomerId.create();
    order = new Order(orderId, customerId, new Date());
  });

  describe('addItem', () => {
    it('should add item successfully with valid data', () => {
      // Arrange
      const productId = 'product-123';
      const quantity = 2;

      // Act
      const result = order.addItem(productId, quantity);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(order.getItemCount()).toBe(2);
      
      // Verify domain event was raised
      const events = order.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderItemAddedEvent);
      expect(events[0].productId).toBe(productId);
    });

    it('should fail when quantity is zero or negative', () => {
      // Act & Assert
      const resultZero = order.addItem('product-123', 0);
      const resultNegative = order.addItem('product-123', -1);

      expect(resultZero.isFailure).toBe(true);
      expect(resultZero.error).toBe('Quantity must be positive');
      
      expect(resultNegative.isFailure).toBe(true);
      expect(resultNegative.error).toBe('Quantity must be positive');
      
      // No events should be raised for failures
      expect(order.getUncommittedEvents()).toHaveLength(0);
    });

    it('should fail when order is already confirmed', () => {
      // Arrange
      order.addItem('product-123', 1); // Add item first
      order.confirm(); // Confirm order

      // Act
      const result = order.addItem('product-456', 1);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Cannot modify confirmed order');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total correctly with multiple items', () => {
      // Arrange
      order.addItem('product-1', 2); // Assume $10 each = $20
      order.addItem('product-2', 1); // Assume $15 each = $15

      // Act
      const total = order.calculateTotal();

      // Assert - This is pure business logic testing
      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
    });

    it('should return zero for empty order', () => {
      // Act
      const total = order.calculateTotal();

      // Assert
      expect(total).toBe(0);
    });
  });
});
```

### Value Object Testing

Value objects must test immutability, equality, and validation rules.

```typescript
// packages/core/src/domain/value-objects/__tests__/Email.test.ts
import { describe, it, expect } from 'vitest';
import { Email } from '../Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email successfully', () => {
      // Act
      const result = Email.create('user@example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.toString()).toBe('user@example.com');
    });

    it('should normalize email to lowercase', () => {
      // Act
      const result = Email.create('User@Example.COM');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.toString()).toBe('user@example.com');
    });

    it('should fail for invalid email formats', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        '@example.com',
        'user@',
        'user space@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = Email.create(email);
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Invalid email format');
      });
    });

    it('should fail for blocked domains', () => {
      // Act
      const result = Email.create('user@test.com');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email domain not allowed');
    });
  });

  describe('equals', () => {
    it('should be equal when emails are the same', () => {
      // Arrange
      const email1 = Email.create('user@example.com').value;
      const email2 = Email.create('user@example.com').value;

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal when emails are different', () => {
      // Arrange
      const email1 = Email.create('user1@example.com').value;
      const email2 = Email.create('user2@example.com').value;

      // Act & Assert
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
```

### Domain Service Testing

Domain services orchestrate complex business logic across multiple entities.

```typescript
// packages/core/src/domain/services/__tests__/PricingService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingService } from '../PricingService';
import { Order } from '../../entities/Order';
import { IDiscountRepository } from '../../interfaces/IDiscountRepository';
import { ITaxCalculator } from '../../interfaces/ITaxCalculator';
import { Currency } from '../../value-objects/Money';

describe('PricingService', () => {
  let pricingService: PricingService;
  let mockDiscountRepo: vi.MockedObject<IDiscountRepository>;
  let mockTaxCalculator: vi.MockedObject<ITaxCalculator>;

  beforeEach(() => {
    mockDiscountRepo = {
      findEligibleDiscounts: vi.fn()
    };
    
    mockTaxCalculator = {
      calculateTax: vi.fn()
    };

    pricingService = new PricingService(mockDiscountRepo, mockTaxCalculator);
  });

  it('should calculate total with discounts and tax', async () => {
    // Arrange
    const order = createTestOrder(); // Test helper
    const customerId = 'customer-123';
    const region = 'CA';

    mockDiscountRepo.findEligibleDiscounts.mockResolvedValue([
      createDiscount('percentage', 10) // 10% discount
    ]);
    mockTaxCalculator.calculateTax.mockResolvedValue(9); // $9 tax

    // Act
    const result = await pricingService.calculateOrderTotal(order, customerId, region);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockDiscountRepo.findEligibleDiscounts).toHaveBeenCalledWith(customerId, expect.any(Date));
    expect(mockTaxCalculator.calculateTax).toHaveBeenCalledWith(90, region); // $100 - 10% = $90
  });

  it('should handle discount repository failures gracefully', async () => {
    // Arrange
    const order = createTestOrder();
    mockDiscountRepo.findEligibleDiscounts.mockRejectedValue(new Error('Database error'));

    // Act
    const result = await pricingService.calculateOrderTotal(order, 'customer-123', 'CA');

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Failed to calculate order total');
  });

  // Test helpers for domain objects
  function createTestOrder(): Order {
    const order = new Order(OrderId.create(), CustomerId.create(), new Date());
    order.addItem('product-1', 10, 10.00); // $100 total
    return order;
  }

  function createDiscount(type: 'percentage' | 'fixed', value: number) {
    return new Discount('discount-1', type, value, new Date(), new Date());
  }
});
```

### In-Memory Repository Pattern for Testing

Use in-memory repositories to test domain logic without database dependencies.

```typescript
// packages/core/src/domain/__tests__/test-doubles/InMemoryOrderRepository.ts
import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { Order } from '../../entities/Order';
import { OrderId, CustomerId } from '../../value-objects';
import { OrderStatus } from '../../entities/Order';
import { Result } from '../../shared/Result';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, Order>();
  private shouldFailOnSave = false;

  async save(order: Order): Promise<Result<void>> {
    if (this.shouldFailOnSave) {
      return Result.fail('Simulated save failure');
    }
    
    this.orders.set(order.id.toString(), order);
    return Result.ok();
  }

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id.toString()) || null;
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId.equals(customerId));
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.status === status);
  }

  async exists(id: OrderId): Promise<boolean> {
    return this.orders.has(id.toString());
  }

  async delete(id: OrderId): Promise<Result<void>> {
    this.orders.delete(id.toString());
    return Result.ok();
  }

  // Test helpers
  simulateSaveFailure(): void {
    this.shouldFailOnSave = true;
  }

  clear(): void {
    this.orders.clear();
    this.shouldFailOnSave = false;
  }

  getAll(): Order[] {
    return Array.from(this.orders.values());
  }
}
```

### Use Case Testing with In-Memory Repositories

```typescript
// packages/core/src/use-cases/__tests__/CreateOrderUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase, CreateOrderCommand } from '../CreateOrderUseCase';
import { InMemoryOrderRepository } from '../../domain/__tests__/test-doubles/InMemoryOrderRepository';
import { OrderId, CustomerId } from '../../domain/value-objects';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepository: InMemoryOrderRepository;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    useCase = new CreateOrderUseCase(orderRepository);
  });

  it('should create order successfully', async () => {
    // Arrange
    const command = new CreateOrderCommand({
      customerId: CustomerId.create().toString(),
      items: [
        { productId: 'product-1', quantity: 2 }
      ]
    });

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(orderRepository.getAll()).toHaveLength(1);
    
    const savedOrder = orderRepository.getAll()[0];
    expect(savedOrder.customerId.toString()).toBe(command.customerId);
    expect(savedOrder.getItemCount()).toBe(2);
  });

  it('should fail when repository save fails', async () => {
    // Arrange
    orderRepository.simulateSaveFailure();
    const command = new CreateOrderCommand({
      customerId: CustomerId.create().toString(),
      items: [{ productId: 'product-1', quantity: 1 }]
    });

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Simulated save failure');
  });

  it('should validate command before processing', async () => {
    // Arrange
    const invalidCommand = new CreateOrderCommand({
      customerId: '', // Invalid
      items: [] // Empty
    });

    // Act
    const result = await useCase.execute(invalidCommand);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(orderRepository.getAll()).toHaveLength(0);
  });
});
```

### Property-Based Testing for Domain Logic

Use property-based testing for complex business rules.

```typescript
// packages/core/src/domain/value-objects/__tests__/Money.property.test.ts
import { describe, it, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { Money, Currency } from '../Money';

describe('Money Property-Based Tests', () => {
  test.prop([
    fc.float({ min: 0, max: 10000, noNaN: true }),
    fc.constantFrom(...Object.values(Currency))
  ])('addition should be commutative', (amount1, currency) => {
    // Arrange
    const money1 = Money.create(amount1, currency).value;
    const money2 = Money.create(amount1, currency).value;

    // Act
    const sum1 = money1.add(money2).value;
    const sum2 = money2.add(money1).value;

    // Assert
    expect(sum1.equals(sum2)).toBe(true);
  });

  test.prop([
    fc.float({ min: 0, max: 1000, noNaN: true }),
    fc.constantFrom(...Object.values(Currency))
  ])('subtraction should be inverse of addition', (amount, currency) => {
    // Arrange
    const money = Money.create(amount, currency).value;
    const zero = Money.zero(currency);

    // Act
    const result = money.add(zero).value.subtract(zero).value;

    // Assert
    expect(result.equals(money)).toBe(true);
  });
});
```

### Domain Testing Best Practices

1. **100% Test Coverage Required**: Domain layer contains critical business logic
2. **No Infrastructure Dependencies**: Use in-memory implementations only
3. **Test Domain Events**: Verify events are raised for business state changes
4. **Test Business Rules**: Every business constraint must have a test
5. **Property-Based Testing**: Use for mathematical operations and invariants
6. **Fast Execution**: All domain tests should run in milliseconds

### Domain Test Utilities

```typescript
// packages/core/src/domain/__tests__/test-utils/DomainTestHelper.ts
export class DomainTestHelper {
  // Factory methods for domain objects
  static createValidEmail(value = 'test@example.com'): Email {
    return Email.create(value).value;
  }

  static createOrderId(): OrderId {
    return OrderId.create();
  }

  static createCustomerId(): CustomerId {
    return CustomerId.create();
  }

  // Result assertion helpers
  static assertSuccess<T>(result: Result<T>): T {
    if (result.isFailure) {
      throw new Error(`Expected success but got failure: ${result.error}`);
    }
    return result.value;
  }

  static assertFailure<T>(result: Result<T>, expectedError?: string): string {
    if (result.isSuccess) {
      throw new Error('Expected failure but got success');
    }
    if (expectedError && !result.error!.includes(expectedError)) {
      throw new Error(`Expected error to contain "${expectedError}" but got "${result.error}"`);
    }
    return result.error!;
  }

  // Event assertion helpers
  static assertEventRaised<T extends DomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): T {
    const events = aggregate.getUncommittedEvents();
    const event = events.find(e => e instanceof eventType);
    
    if (!event) {
      throw new Error(`Expected ${eventType.name} to be raised but found: ${events.map(e => e.constructor.name)}`);
    }
    
    return event as T;
  }

  static assertNoEventsRaised(aggregate: AggregateRoot<any>): void {
    const events = aggregate.getUncommittedEvents();
    if (events.length > 0) {
      throw new Error(`Expected no events but found: ${events.map(e => e.constructor.name)}`);
    }
  }
}
```

## Contract Testing

<conditional-block task-condition="contract|api-contract" context-check="contract-testing-patterns">
IF task involves contract testing:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load contract testing patterns from development/testing-strategy.md#contract-testing"
  </context_fetcher_strategy>
</conditional-block>

### API Contract Tests
```typescript
// tests/contracts/api.contract.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAPIValidator } from 'express-openapi-validator';
import { loadOpenAPISpec } from '@/utils/openapi';
import app from '@/api';

describe('API Contract Tests', () => {
  let validator: OpenAPIValidator;
  let openApiSpec: any;
  
  beforeAll(async () => {
    openApiSpec = await loadOpenAPISpec();
    validator = new OpenAPIValidator({
      apiSpec: openApiSpec,
      validateRequests: true,
      validateResponses: true,
    });
  });
  
  describe('User Endpoints', () => {
    it('GET /users should match OpenAPI schema', async () => {
      const response = await app.request('/users', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      const data = await response.json();
      
      // Validate response structure
      expect(response.status).toBe(200);
      expect(() => validator.validateResponse('get', '/users', response.status, data))
        .not.toThrow();
    });
    
    it('POST /users should validate request and response', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePassword123!'
      };
      
      const response = await app.request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      // Validate request matched schema
      expect(() => validator.validateRequest('post', '/users', { body: userData }))
        .not.toThrow();
      
      // Validate response matched schema
      expect(() => validator.validateResponse('post', '/users', response.status, data))
        .not.toThrow();
    });
    
    it('should reject invalid request data', async () => {
      const invalidData = {
        email: 'not-an-email',
        name: '',
        // missing password
      };
      
      const response = await app.request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
    });
  });
  
  describe('Consumer-Driven Contracts', () => {
    it('should fulfill frontend consumer contract', async () => {
      // Contract defined by frontend team
      const frontendContract = {
        endpoint: '/api/users/profile',
        expectedFields: ['id', 'email', 'name', 'avatar', 'createdAt'],
        optionalFields: ['bio', 'location', 'website'],
      };
      
      const response = await app.request(frontendContract.endpoint, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      const data = await response.json();
      
      // Verify all expected fields are present
      frontendContract.expectedFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });
      
      // Verify no unexpected fields
      const allAllowedFields = [
        ...frontendContract.expectedFields,
        ...frontendContract.optionalFields
      ];
      
      Object.keys(data).forEach(field => {
        expect(allAllowedFields).toContain(field);
      });
    });
    
    it('should fulfill mobile consumer contract', async () => {
      // Contract defined by mobile team  
      const mobileContract = {
        endpoint: '/api/users/profile',
        maxResponseTime: 500, // ms
        maxPayloadSize: 5000, // bytes
        requiredHeaders: ['x-api-version', 'x-request-id'],
      };
      
      const startTime = performance.now();
      const response = await app.request(mobileContract.endpoint, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      const responseText = await response.text();
      
      // Performance requirements
      expect(responseTime).toBeLessThan(mobileContract.maxResponseTime);
      expect(responseText.length).toBeLessThan(mobileContract.maxPayloadSize);
      
      // Required headers
      mobileContract.requiredHeaders.forEach(header => {
        expect(response.headers.get(header)).toBeTruthy();
      });
    });
  });
});

// Pact Testing for Microservices
describe('Pact Contract Tests', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'UserService',
    port: 8080,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
  });
  
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  
  it('should get user details', async () => {
    // Define the expected interaction
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request for user details',
      withRequest: {
        method: 'GET',
        path: '/users/123',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: iso8601DateTimeWithMillis(),
        }),
      },
    });
    
    // Test the interaction
    const response = await fetch(`${provider.mockService.baseUrl}/users/123`, {
      headers: { Accept: 'application/json' },
    });
    
    const user = await response.json();
    expect(user.id).toBe('123');
    expect(user.name).toBe('John Doe');
    
    // Verify the interaction occurred
    await provider.verify();
  });
});
```

## Testing Patterns

### Test Structure (AAA)
```typescript
describe('Feature', () => {
  it('should behave correctly', () => {
    // Arrange
    const input = createTestData();
    const expected = { success: true };
    
    // Act
    const result = performAction(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

### Mock Service Worker Setup
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com'
    });
  }),
  
  http.post('/api/users', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      { id: '123', ...data },
      { status: 201 }
    );
  })
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should handle click events', () => {
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when prop is set', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Custom Test Utils
```typescript
// test/utils/render.tsx
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function render(ui: React.ReactElement, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { render };
```

## Contract Testing Configuration

### Setup Contract Testing
```json
// package.json
{
  "scripts": {
    "test:contracts": "vitest run --config vitest.contract.config.ts",
    "test:pact": "jest --testMatch='**/*.pact.test.ts'",
    "pact:publish": "pact-broker publish ./pacts --consumer-app-version=$npm_package_version",
    "test:all": "pnpm test:unit && pnpm test:integration && pnpm test:contracts && pnpm test:e2e"
  },
  "devDependencies": {
    "@pact-foundation/pact": "^12.1.0",
    "express-openapi-validator": "^5.1.2",
    "openapi-types": "^12.1.3"
  }
}
```

### Contract Test Config
```typescript
// vitest.contract.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.contract.test.ts'],
    environment: 'node',
    setupFiles: ['./test/setup/contracts.ts'],
    globalSetup: './test/setup/global-contracts.ts',
  },
});
```

### CI/CD Integration
```yaml
# .github/workflows/contracts.yml
name: Contract Tests

on:
  pull_request:
    paths:
      - 'packages/api/**'
      - 'apps/web/src/api/**'
      - 'openapi.yaml'

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run contract tests
        run: pnpm test:contracts
      
      - name: Publish Pacts
        if: github.ref == 'refs/heads/main'
        run: pnpm pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      
      - name: Can-i-deploy check
        run: |
          npx @pact-foundation/pact can-i-deploy \
            --pacticipant Frontend \
            --version ${{ github.sha }} \
            --to production
```

## Coverage Requirements

<conditional-block task-condition="coverage|greenfield|legacy-project" context-check="coverage-requirements">
IF task involves coverage requirements:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get coverage requirements from development/testing-strategy.md#coverage-requirements"
  </context_fetcher_strategy>
</conditional-block>

### Standard Projects (Existing Codebase)
- Overall: 80% minimum
- Business logic: 90% minimum  
- API routes: 85% minimum
- UI components: 70% minimum
- Utilities: 95% minimum
- Contract compliance: 100% required

### Greenfield Projects (New from Scratch)
For brand new projects with no legacy constraints:

- **Overall: 95% minimum** (significantly higher than standard)
- **Domain Layer: 100% required** (no exceptions for business rules)
- **Use Cases Layer: 100% required** (all business logic must be tested)
- **Infrastructure Layer: 90% minimum** (database, external services)
- **Interface Adapters: 95% minimum** (API contracts, controllers)
- **Presentation Layer: 85% minimum** (UI components, pages)
- **Utilities: 100% required** (shared functions must be bulletproof)
- **Contract compliance: 100% required**

### Coverage Validation

**Greenfield Project Validation:**
```json
// package.json - Enhanced coverage thresholds
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:greenfield": "vitest run --coverage --threshold.lines=95 --threshold.functions=95 --threshold.branches=95 --threshold.statements=95",
    "coverage:domain": "vitest run --coverage --testMatch='**/domain/**/*.test.ts' --threshold.lines=100",
    "coverage:usecases": "vitest run --coverage --testMatch='**/usecases/**/*.test.ts' --threshold.lines=100"
  }
}
```

**Coverage Configuration:**
```typescript
// vitest.config.ts - Greenfield configuration
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Greenfield thresholds
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
        // Domain layer enforcement
        'src/domain/**': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100
        },
        // Use cases enforcement  
        'src/usecases/**': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100
        }
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/types/',
        'tests/setup/'
      ]
    }
  }
});
```

### Project Type Detection

**Automatic Detection Strategy:**
```bash
# In CI/CD or quality gates, detect project type
if [ -f "package.json" ] && grep -q "version.*0\." package.json; then
  echo "🌱 Greenfield project detected - applying enhanced coverage requirements"
  pnpm test:coverage:greenfield
else
  echo "🏢 Standard project detected - applying standard coverage requirements"  
  pnpm test:coverage
fi
```

<!-- Verification block for testing strategy and coverage -->
<verification-block context-check="verification-testing-coverage">
  <verification_definitions>
    <test name="vitest_installed">
      TEST: grep -q '"vitest"' package.json && npm list vitest >/dev/null 2>&1
      REQUIRED: true
      ERROR: "Vitest not installed. Run 'npm install --save-dev vitest' to add testing framework."
      DESCRIPTION: "Ensures the Vitest testing framework is installed for running tests."
    </test>
    <test name="test_scripts_exist">
      TEST: grep -q '"test"' package.json && grep -q '"test:coverage"' package.json
      REQUIRED: true
      ERROR: "Test scripts missing from package.json. Add 'test' and 'test:coverage' scripts."
      DESCRIPTION: "Requires standard test scripts to run tests and coverage in CI/local hooks."
    </test>
    <test name="coverage_threshold_configured">
      TEST: grep -q 'threshold.*${PROJECT_COVERAGE}' package.json || grep -q 'thresholds:' vitest.config.ts || grep -q 'thresholds:' vitest.config.js
      REQUIRED: true
      VARIABLES: ["PROJECT_COVERAGE"]
      ERROR: "Coverage threshold not configured for ${PROJECT_COVERAGE}% requirement. Update vitest config or package.json."
      DESCRIPTION: "Validates coverage thresholds are specified in config or package.json."
      DEPENDS_ON: ["test_scripts_exist"]
    </test>
    <test name="vitest_config_exists">
      TEST: test -f vitest.config.ts || test -f vitest.config.js || test -f vite.config.ts || test -f vite.config.js
      REQUIRED: true
      ERROR: "Vitest configuration missing. Create vitest.config.ts with coverage settings."
      DESCRIPTION: "Checks for configuration file presence to control test options and coverage."
    </test>
    <test name="test_directory_structure">
      TEST: test -d tests || test -d __tests__ || find . -name "*.test.ts" -o -name "*.test.js" | head -1
      REQUIRED: true
      ERROR: "No test files found. Create test files with .test.ts or .test.js extensions."
      DESCRIPTION: "Ensures tests are present in standard locations or using *.test.* naming."
    </test>
    <test name="coverage_reporters_configured">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || ((test -f vitest.config.ts && grep -Ei "reporter[s]?:.*(html|json|lcov)" vitest.config.ts) || (test -f vitest.config.js && grep -Ei "reporter[s]?:.*(html|json|lcov)" vitest.config.js) || grep -Ei 'coverage.*(html|json|lcov)' package.json)
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Coverage reporters (html, json, lcov) not detected. Configure Vitest to output at least one of these (required for greenfield)."
      FIX_COMMAND: "Add coverage.reporter: ['text','json','html','lcov'] to vitest.config.ts"
      DESCRIPTION: "Requires coverage reporters for greenfield; advisory otherwise"
      DEPENDS_ON: ["vitest_config_exists"]
    </test>
    <test name="greenfield_coverage_check">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || (grep -q 'threshold.*9[5-9]' package.json || grep -q 'lines:.*9[5-9]' vitest.config.ts)
      REQUIRED: false
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Greenfield project requires 95%+ coverage threshold. Update configuration."
      DESCRIPTION: "For greenfield projects, encourages 95%+ coverage thresholds."
      DEPENDS_ON: ["coverage_threshold_configured"]
    </test>
  </verification_definitions>
</verification-block>

</conditional-block>
