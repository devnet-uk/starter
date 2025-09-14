# Billing Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [Use Case Patterns](./use-case-patterns.md), [Multi-tenancy Patterns](./multi-tenancy-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing billing systems following Clean Architecture principles. It covers payment processing, subscription management, webhook handling, and integration with payment providers while maintaining domain isolation and testability.

## Architecture Layers

### Domain Layer

#### Core Billing Entities

**Subscription Domain Entity**
```typescript
// packages/core/domain/billing/entities/Subscription.ts
import { AggregateRoot } from '@repo/domain/base/AggregateRoot';
import { Result } from '@repo/domain/base/Result';

export class Subscription extends AggregateRoot {
  private constructor(
    private readonly _id: SubscriptionId,
    private readonly _customerId: CustomerId,
    private _status: SubscriptionStatus,
    private _productId: ProductId,
    private _currentPeriodStart: Date,
    private _currentPeriodEnd: Date,
    private _trialEnd: Date | null,
    private _canceledAt: Date | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    customerId: CustomerId;
    productId: ProductId;
    trialPeriodDays?: number;
  }): Result<Subscription> {
    const now = new Date();
    const trialEnd = props.trialPeriodDays 
      ? new Date(now.getTime() + props.trialPeriodDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = new Subscription(
      SubscriptionId.create(),
      props.customerId,
      trialEnd ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
      props.productId,
      now,
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialEnd,
      null
    );

    subscription.addDomainEvent(new SubscriptionCreatedEvent(subscription));
    return Result.ok(subscription);
  }

  public cancel(): Result<void> {
    if (this._status === SubscriptionStatus.CANCELED) {
      return Result.fail(new DomainError('Subscription is already canceled'));
    }

    this._status = SubscriptionStatus.CANCELED;
    this._canceledAt = new Date();

    this.addDomainEvent(new SubscriptionCanceledEvent(this));
    return Result.ok();
  }

  public updateStatus(newStatus: SubscriptionStatus): Result<void> {
    if (this._status === newStatus) {
      return Result.ok();
    }

    const oldStatus = this._status;
    this._status = newStatus;

    this.addDomainEvent(new SubscriptionStatusChangedEvent(
      this,
      oldStatus,
      newStatus
    ));

    return Result.ok();
  }

  // Getters
  public get id(): SubscriptionId { return this._id; }
  public get customerId(): CustomerId { return this._customerId; }
  public get status(): SubscriptionStatus { return this._status; }
  public get isActive(): boolean { 
    return this._status === SubscriptionStatus.ACTIVE; 
  }
  public get isCanceled(): boolean { 
    return this._status === SubscriptionStatus.CANCELED; 
  }
}
```

**Purchase Domain Entity**
```typescript
// packages/core/domain/billing/entities/Purchase.ts
export class Purchase extends AggregateRoot {
  private constructor(
    private readonly _id: PurchaseId,
    private readonly _customerId: CustomerId,
    private readonly _type: PurchaseType,
    private readonly _productId: ProductId,
    private _status: PurchaseStatus,
    private readonly _subscriptionId: SubscriptionId | null,
    private readonly _createdAt: Date
  ) {
    super(_id.value);
  }

  public static createOneTime(props: {
    customerId: CustomerId;
    productId: ProductId;
  }): Result<Purchase> {
    const purchase = new Purchase(
      PurchaseId.create(),
      props.customerId,
      PurchaseType.ONE_TIME,
      props.productId,
      PurchaseStatus.PENDING,
      null,
      new Date()
    );

    purchase.addDomainEvent(new PurchaseCreatedEvent(purchase));
    return Result.ok(purchase);
  }

  public static createSubscription(props: {
    customerId: CustomerId;
    productId: ProductId;
    subscriptionId: SubscriptionId;
  }): Result<Purchase> {
    const purchase = new Purchase(
      PurchaseId.create(),
      props.customerId,
      PurchaseType.SUBSCRIPTION,
      props.productId,
      PurchaseStatus.ACTIVE,
      props.subscriptionId,
      new Date()
    );

    purchase.addDomainEvent(new PurchaseCreatedEvent(purchase));
    return Result.ok(purchase);
  }

  public complete(): Result<void> {
    if (this._status === PurchaseStatus.COMPLETED) {
      return Result.ok();
    }

    this._status = PurchaseStatus.COMPLETED;
    this.addDomainEvent(new PurchaseCompletedEvent(this));
    return Result.ok();
  }

  // Getters
  public get id(): PurchaseId { return this._id; }
  public get customerId(): CustomerId { return this._customerId; }
  public get type(): PurchaseType { return this._type; }
  public get status(): PurchaseStatus { return this._status; }
}
```

#### Repository Interfaces

**Subscription Repository**
```typescript
// packages/core/domain/billing/repositories/ISubscriptionRepository.ts
export interface ISubscriptionRepository extends IRepository<Subscription> {
  findByCustomerId(customerId: CustomerId): Promise<Subscription[]>;
  findByProviderSubscriptionId(providerId: string): Promise<Subscription | null>;
  findActiveByCustomerId(customerId: CustomerId): Promise<Subscription[]>;
  findExpiringSubscriptions(before: Date): Promise<Subscription[]>;
}
```

**Purchase Repository**
```typescript
// packages/core/domain/billing/repositories/IPurchaseRepository.ts
export interface IPurchaseRepository extends IRepository<Purchase> {
  findByCustomerId(customerId: CustomerId): Promise<Purchase[]>;
  findBySubscriptionId(subscriptionId: SubscriptionId): Promise<Purchase | null>;
  findByProviderTransactionId(transactionId: string): Promise<Purchase | null>;
}
```

### Application Layer

#### Payment Gateway Interface

**Core Gateway Interface**
```typescript
// packages/core/interfaces/billing/IPaymentGateway.ts
export interface IPaymentGateway {
  createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<Result<CheckoutSession>>;
  createCustomerPortalSession(request: CreatePortalSessionRequest): Promise<Result<PortalSession>>;
  retrieveSubscription(subscriptionId: string): Promise<Result<ProviderSubscription>>;
  cancelSubscription(subscriptionId: string): Promise<Result<void>>;
  updateSubscriptionSeats(subscriptionId: string, seats: number): Promise<Result<void>>;
  processWebhook(payload: string | Buffer, signature: string): Promise<Result<WebhookEvent>>;
}

export interface CreateCheckoutSessionRequest {
  type: 'subscription' | 'one-time';
  productId: string;
  customerId?: string;
  customerEmail?: string;
  organizationId?: string;
  userId?: string;
  seats?: number;
  trialPeriodDays?: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  paymentStatus: 'open' | 'paid' | 'unpaid';
  metadata: Record<string, string>;
}
```

#### Use Cases

**Create Checkout Session Use Case**
```typescript
// packages/api/src/use-cases/billing/CreateCheckoutSessionUseCase.ts
export class CreateCheckoutSessionUseCase implements IUseCase<CreateCheckoutSessionCommand, CheckoutSessionResponse> {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: CreateCheckoutSessionCommand): Promise<Result<CheckoutSessionResponse>> {
    try {
      // Validate organization if provided
      if (command.organizationId) {
        const organization = await this.organizationRepository.findById(
          new OrganizationId(command.organizationId)
        );
        if (!organization) {
          return Result.fail(new NotFoundError('Organization not found'));
        }
      }

      // Validate user if provided
      if (command.userId) {
        const user = await this.userRepository.findById(
          new UserId(command.userId)
        );
        if (!user) {
          return Result.fail(new NotFoundError('User not found'));
        }
      }

      // Create checkout session
      const sessionResult = await this.paymentGateway.createCheckoutSession({
        type: command.type,
        productId: command.productId,
        customerId: command.customerId,
        customerEmail: command.email,
        organizationId: command.organizationId,
        userId: command.userId,
        seats: command.seats,
        trialPeriodDays: command.trialPeriodDays,
        successUrl: command.successUrl,
        cancelUrl: command.cancelUrl
      });

      if (sessionResult.isFailure) {
        return Result.fail(sessionResult.error);
      }

      return Result.ok({
        sessionId: sessionResult.value.id,
        url: sessionResult.value.url
      });

    } catch (error) {
      return Result.fail(new ApplicationError('Failed to create checkout session', error));
    }
  }
}
```

**Process Payment Webhook Use Case**
```typescript
// packages/api/src/use-cases/billing/ProcessPaymentWebhookUseCase.ts
export class ProcessPaymentWebhookUseCase implements IUseCase<ProcessWebhookCommand, void> {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly customerService: ICustomerService,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(command: ProcessWebhookCommand): Promise<Result<void>> {
    try {
      // Verify webhook signature and parse event
      const webhookResult = await this.paymentGateway.processWebhook(
        command.payload,
        command.signature
      );

      if (webhookResult.isFailure) {
        return Result.fail(webhookResult.error);
      }

      const event = webhookResult.value;

      // Process event based on type
      const result = await this.processWebhookEvent(event);
      if (result.isFailure) {
        return Result.fail(result.error);
      }

      return Result.ok();

    } catch (error) {
      return Result.fail(new ApplicationError('Webhook processing failed', error));
    }
  }

  private async processWebhookEvent(event: WebhookEvent): Promise<Result<void>> {
    return await this.unitOfWork.transaction(async () => {
      switch (event.type) {
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event);
        
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCanceled(event);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event);
        
        default:
          return Result.ok(); // Ignore unhandled events
      }
    });
  }

  private async handleCheckoutCompleted(event: WebhookEvent): Promise<Result<void>> {
    const { mode, metadata, customerId, productId } = event.data;

    if (mode === 'subscription') {
      // Subscription will be handled by subscription.created event
      return Result.ok();
    }

    // Handle one-time payment
    const purchaseResult = Purchase.createOneTime({
      customerId: new CustomerId(customerId),
      productId: new ProductId(productId)
    });

    if (purchaseResult.isFailure) {
      return Result.fail(purchaseResult.error);
    }

    const purchase = purchaseResult.value;
    purchase.complete();

    await this.purchaseRepository.save(purchase);

    // Associate customer with organization/user
    if (metadata.organizationId || metadata.userId) {
      const customerResult = await this.customerService.associateCustomer({
        customerId: customerId,
        organizationId: metadata.organizationId,
        userId: metadata.userId
      });

      if (customerResult.isFailure) {
        return Result.fail(customerResult.error);
      }
    }

    return Result.ok();
  }

  private async handleSubscriptionCreated(event: WebhookEvent): Promise<Result<void>> {
    const { id, customerId, productId, status, metadata } = event.data;

    const subscriptionResult = Subscription.create({
      customerId: new CustomerId(customerId),
      productId: new ProductId(productId)
    });

    if (subscriptionResult.isFailure) {
      return Result.fail(subscriptionResult.error);
    }

    const subscription = subscriptionResult.value;
    
    // Update status based on Stripe status
    const statusUpdateResult = subscription.updateStatus(
      this.mapStripeStatus(status)
    );
    if (statusUpdateResult.isFailure) {
      return Result.fail(statusUpdateResult.error);
    }

    await this.subscriptionRepository.save(subscription);

    // Create purchase record
    const purchaseResult = Purchase.createSubscription({
      customerId: new CustomerId(customerId),
      productId: new ProductId(productId),
      subscriptionId: subscription.id
    });

    if (purchaseResult.isFailure) {
      return Result.fail(purchaseResult.error);
    }

    await this.purchaseRepository.save(purchaseResult.value);

    // Associate customer with organization/user
    if (metadata.organizationId || metadata.userId) {
      const customerResult = await this.customerService.associateCustomer({
        customerId: customerId,
        organizationId: metadata.organizationId,
        userId: metadata.userId
      });

      if (customerResult.isFailure) {
        return Result.fail(customerResult.error);
      }
    }

    return Result.ok();
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active': return SubscriptionStatus.ACTIVE;
      case 'trialing': return SubscriptionStatus.TRIAL;
      case 'past_due': return SubscriptionStatus.PAST_DUE;
      case 'canceled': return SubscriptionStatus.CANCELED;
      case 'unpaid': return SubscriptionStatus.UNPAID;
      default: return SubscriptionStatus.INCOMPLETE;
    }
  }
}
```

### Infrastructure Layer

#### Stripe Implementation

**Stripe Payment Gateway**
```typescript
// packages/payments/src/gateways/StripePaymentGateway.ts
import Stripe from 'stripe';
import { IPaymentGateway } from '@repo/core/interfaces/billing/IPaymentGateway';

export class StripePaymentGateway implements IPaymentGateway {
  private readonly stripe: Stripe;

  constructor(secretKey: string, options?: Stripe.StripeConfig) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
      ...options
    });
  }

  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<Result<CheckoutSession>> {
    try {
      const metadata = {
        organizationId: request.organizationId || null,
        userId: request.userId || null,
      };

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: request.type === 'subscription' ? 'subscription' : 'payment',
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        line_items: [{
          quantity: request.seats ?? 1,
          price: request.productId,
        }],
        customer: request.customerId,
        customer_email: request.customerEmail,
        metadata,
        ...(request.type === 'one-time' ? {
          payment_intent_data: { metadata },
          customer_creation: 'always',
        } : {
          subscription_data: {
            metadata,
            trial_period_days: request.trialPeriodDays,
          },
        }),
      };

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      return Result.ok({
        id: session.id,
        url: session.url!,
        paymentStatus: session.payment_status,
        metadata: session.metadata || {}
      });

    } catch (error) {
      return Result.fail(new PaymentGatewayError('Failed to create checkout session', error));
    }
  }

  async processWebhook(payload: string | Buffer, signature: string): Promise<Result<WebhookEvent>> {
    try {
      // Critical: Use raw, unmodified request body for signature verification
      // Context7 Pattern: Body must be exactly as received from Stripe (UTF-8 encoded)
      const event = await this.stripe.webhooks.constructEvent(
        payload, // Raw body - never parse before verification
        signature, // From 'Stripe-Signature' header
        process.env.STRIPE_WEBHOOK_SECRET! // Must start with 'whsec_'
      );

      // Idempotency check - prevent duplicate processing
      if (await this.eventStore.exists(event.id)) {
        // Event already processed, return success without reprocessing
        return Result.ok(this.mapStripeEvent(event));
      }

      // Store event ID for idempotency
      await this.eventStore.recordProcessedEvent(event.id, new Date());

      return Result.ok(this.mapStripeEvent(event));

    } catch (error) {
      // Context7 Pattern: Specific error handling for signature verification
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        // Common causes: wrong endpoint secret, modified body, incorrect header
        return Result.fail(new PaymentGatewayError(
          'Webhook signature verification failed', 
          error,
          { 
            errorType: 'SIGNATURE_VERIFICATION_ERROR',
            troubleshooting: 'Check endpoint secret, raw body handling, and signature header'
          }
        ));
      }
      
      // Handle other Stripe webhook errors
      if (error instanceof Stripe.errors.StripeError) {
        return Result.fail(new PaymentGatewayError(
          `Stripe webhook error: ${error.message}`, 
          error,
          { errorType: 'STRIPE_WEBHOOK_ERROR' }
        ));
      }

      return Result.fail(new PaymentGatewayError(
        'Webhook processing failed', 
        error,
        { errorType: 'UNKNOWN_WEBHOOK_ERROR' }
      ));
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Result<void>> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return Result.ok();
    } catch (error) {
      return Result.fail(new PaymentGatewayError('Failed to cancel subscription', error));
    }
  }

  async updateSubscriptionSeats(subscriptionId: string, seats: number): Promise<Result<void>> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      if (!subscription) {
        return Result.fail(new PaymentGatewayError('Subscription not found'));
      }

      await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          quantity: seats,
        }],
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(new PaymentGatewayError('Failed to update subscription', error));
    }
  }

  private mapStripeEvent(stripeEvent: Stripe.Event): WebhookEvent {
    return {
      id: stripeEvent.id,
      type: stripeEvent.type,
      data: stripeEvent.data.object,
      created: new Date(stripeEvent.created * 1000)
    };
  }
}
```

**Legacy Stripe Wrapper**
```typescript
// packages/payments/src/legacy/StripeWrapper.ts
import { getStripeClient } from '../provider/stripe/index';
import { StripePaymentGateway } from '../gateways/StripePaymentGateway';

/**
 * Wrapper to integrate existing Stripe implementation with Clean Architecture
 * This allows gradual migration from legacy patterns to domain-driven approach
 */
export class LegacyStripeWrapper {
  private readonly gateway: StripePaymentGateway;
  
  constructor() {
    const stripeClient = getStripeClient();
    this.gateway = new StripePaymentGateway(process.env.STRIPE_SECRET_KEY!);
  }

  /**
   * Wraps legacy createCheckoutLink function
   */
  async createCheckoutLink(options: any): Promise<string | null> {
    const result = await this.gateway.createCheckoutSession({
      type: options.type,
      productId: options.productId,
      customerId: options.customerId,
      customerEmail: options.email,
      organizationId: options.organizationId,
      userId: options.userId,
      seats: options.seats,
      trialPeriodDays: options.trialPeriodDays,
      successUrl: options.redirectUrl || '',
      cancelUrl: options.redirectUrl || ''
    });

    return result.isSuccess ? result.value.url : null;
  }

  /**
   * Wraps legacy webhook handler
   */
  async handleWebhook(req: Request): Promise<Response> {
    const signature = req.headers.get('stripe-signature');
    const payload = await req.text();

    if (!signature || !payload) {
      return new Response('Invalid request', { status: 400 });
    }

    const result = await this.gateway.processWebhook(payload, signature);
    
    if (result.isFailure) {
      return new Response('Webhook processing failed', { status: 400 });
    }

    return new Response(null, { status: 204 });
  }
}
```

### API Layer

#### REST Controllers

**Billing Controller**
```typescript
// packages/api/src/controllers/billing/BillingController.ts
export class BillingController {
  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private readonly createPortalSessionUseCase: CreatePortalSessionUseCase,
    private readonly processWebhookUseCase: ProcessPaymentWebhookUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase
  ) {}

  async createCheckout(c: Context): Promise<Response> {
    const validation = CreateCheckoutSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ error: 'Invalid request', details: validation.error }, 400);
    }

    const command = new CreateCheckoutSessionCommand(validation.data);
    const result = await this.createCheckoutSessionUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({
      sessionId: result.value.sessionId,
      url: result.value.url
    });
  }

  async handleWebhook(c: Context): Promise<Response> {
    const signature = c.req.header('stripe-signature');
    const payload = await c.req.text();

    if (!signature) {
      return c.text('Missing signature', 400);
    }

    const command = new ProcessWebhookCommand({
      payload,
      signature,
      provider: 'stripe'
    });

    const result = await this.processWebhookUseCase.execute(command);

    if (result.isFailure) {
      return c.text(`Webhook error: ${result.error.message}`, 400);
    }

    return c.text('', 204);
  }
}
```

## Testing Patterns

### Unit Tests

**Domain Entity Tests**
```typescript
// packages/core/domain/billing/__tests__/Subscription.test.ts
describe('Subscription Domain Entity', () => {
  describe('create', () => {
    it('should create subscription with trial period', () => {
      const result = Subscription.create({
        customerId: new CustomerId('cust_123'),
        productId: new ProductId('prod_123'),
        trialPeriodDays: 14
      });

      expect(result.isSuccess).toBe(true);
      const subscription = result.value;
      expect(subscription.status).toBe(SubscriptionStatus.TRIAL);
    });
  });

  describe('cancel', () => {
    it('should cancel active subscription', () => {
      const subscription = createTestSubscription();
      
      const result = subscription.cancel();
      
      expect(result.isSuccess).toBe(true);
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.isCanceled).toBe(true);
    });
  });
});
```

**Use Case Tests**
```typescript
// packages/api/src/use-cases/billing/__tests__/ProcessPaymentWebhookUseCase.test.ts
describe('ProcessPaymentWebhookUseCase', () => {
  let useCase: ProcessPaymentWebhookUseCase;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockPurchaseRepository: jest.Mocked<IPurchaseRepository>;

  beforeEach(() => {
    mockPaymentGateway = createMockPaymentGateway();
    mockPurchaseRepository = createMockPurchaseRepository();
    
    useCase = new ProcessPaymentWebhookUseCase(
      mockPaymentGateway,
      mockPurchaseRepository,
      mockSubscriptionRepository,
      mockCustomerService,
      mockUnitOfWork
    );
  });

  it('should process checkout.session.completed event', async () => {
    const webhookEvent: WebhookEvent = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        mode: 'payment',
        customerId: 'cust_123',
        productId: 'prod_123',
        metadata: { organizationId: 'org_123' }
      },
      created: new Date()
    };

    mockPaymentGateway.processWebhook.mockResolvedValue(Result.ok(webhookEvent));

    const command = new ProcessWebhookCommand({
      payload: 'webhook_payload',
      signature: 'webhook_signature',
      provider: 'stripe'
    });

    const result = await useCase.execute(command);

    expect(result.isSuccess).toBe(true);
    expect(mockPurchaseRepository.save).toHaveBeenCalled();
  });
});
```

### Integration Tests

**Stripe Integration Test**
```typescript
// packages/payments/__tests__/integration/StripePaymentGateway.test.ts
describe('StripePaymentGateway Integration', () => {
  let gateway: StripePaymentGateway;

  beforeAll(() => {
    gateway = new StripePaymentGateway(process.env.STRIPE_TEST_KEY!);
  });

  it('should create checkout session', async () => {
    const request: CreateCheckoutSessionRequest = {
      type: 'subscription',
      productId: 'price_test_123',
      customerEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const result = await gateway.createCheckoutSession(request);

    expect(result.isSuccess).toBe(true);
    expect(result.value.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  it('should process webhook with valid signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123' } }
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!
    });

    const result = await gateway.processWebhook(payload, signature);

    expect(result.isSuccess).toBe(true);
  });
});
```

## Error Handling

### Domain Errors

```typescript
// packages/core/domain/billing/errors/BillingErrors.ts
export class SubscriptionNotFoundError extends DomainError {
  constructor(subscriptionId: string) {
    super(`Subscription not found: ${subscriptionId}`);
  }
}

export class InvalidSubscriptionStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} subscription with status: ${currentStatus}`);
  }
}

export class PaymentGatewayError extends InfrastructureError {
  constructor(message: string, cause?: Error) {
    super(`Payment gateway error: ${message}`, cause);
  }
}
```

### Resilience Patterns

**Retry Pattern for Payment Operations**
```typescript
// packages/payments/src/resilience/PaymentRetryPolicy.ts
export class PaymentRetryPolicy {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = PaymentRetryPolicy.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0 && PaymentRetryPolicy.isRetryableError(error)) {
        const delay = PaymentRetryPolicy.calculateDelay(
          PaymentRetryPolicy.MAX_RETRIES - retries
        );
        
        await PaymentRetryPolicy.sleep(delay);
        return PaymentRetryPolicy.executeWithRetry(operation, retries - 1);
      }
      
      throw error;
    }
  }

  private static isRetryableError(error: any): boolean {
    // Retry on network errors, rate limits, and temporary server errors
    return error.code === 'rate_limit_error' ||
           error.code === 'api_error' ||
           (error.statusCode >= 500 && error.statusCode < 600);
  }

  private static calculateDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = PaymentRetryPolicy.BASE_DELAY * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// packages/payments/src/caching/BillingCacheManager.ts
export class BillingCacheManager {
  constructor(private readonly cacheService: ICacheService) {}

  async getCachedCustomerSubscriptions(customerId: string): Promise<Subscription[] | null> {
    const cacheKey = this.getSubscriptionCacheKey(customerId);
    return await this.cacheService.get(cacheKey, Subscription[]);
  }

  async setCachedCustomerSubscriptions(
    customerId: string, 
    subscriptions: Subscription[]
  ): Promise<void> {
    const cacheKey = this.getSubscriptionCacheKey(customerId);
    await this.cacheService.set(cacheKey, subscriptions, 300); // 5 minutes
  }

  async invalidateCustomerCache(customerId: string): Promise<void> {
    const pattern = `billing:customer:${customerId}:*`;
    await this.cacheService.deletePattern(pattern);
  }

  private getSubscriptionCacheKey(customerId: string): string {
    return `billing:customer:${customerId}:subscriptions`;
  }
}
```

## Security Patterns

### Webhook Security

```typescript
// packages/api/src/middleware/WebhookSecurityMiddleware.ts
export class WebhookSecurityMiddleware {
  static verifyStripeSignature() {
    return async (c: Context, next: () => Promise<void>) => {
      const signature = c.req.header('stripe-signature');
      const payload = await c.req.text();

      if (!signature) {
        return c.text('Missing signature', 401);
      }

      try {
        // Signature verification is handled in the gateway
        // This middleware can add additional security checks
        const timestamp = WebhookSecurityMiddleware.extractTimestamp(signature);
        const now = Date.now() / 1000;
        
        // Reject webhooks older than 5 minutes
        if (now - timestamp > 300) {
          return c.text('Webhook too old', 400);
        }

        await next();
      } catch (error) {
        return c.text('Invalid signature', 401);
      }
    };
  }

  private static extractTimestamp(signature: string): number {
    const timestampMatch = signature.match(/t=(\d+)/);
    return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
  }
}
```

## Monitoring & Observability

### Metrics Collection

```typescript
// packages/payments/src/monitoring/BillingMetrics.ts
export class BillingMetrics {
  private static readonly metrics = {
    checkoutSessions: createCounter('billing_checkout_sessions_total'),
    webhookEvents: createCounter('billing_webhook_events_total'),
    paymentFailures: createCounter('billing_payment_failures_total'),
    subscriptionChanges: createCounter('billing_subscription_changes_total')
  };

  static recordCheckoutSession(type: 'subscription' | 'one-time'): void {
    BillingMetrics.metrics.checkoutSessions.inc({ type });
  }

  static recordWebhookEvent(eventType: string, success: boolean): void {
    BillingMetrics.metrics.webhookEvents.inc({ 
      event_type: eventType,
      success: success.toString()
    });
  }

  static recordPaymentFailure(reason: string): void {
    BillingMetrics.metrics.paymentFailures.inc({ reason });
  }

  static recordSubscriptionChange(action: string): void {
    BillingMetrics.metrics.subscriptionChanges.inc({ action });
  }
}
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/billing/entities/Subscription.ts"
    - "packages/core/domain/billing/entities/Purchase.ts"
    - "packages/core/domain/billing/repositories/ISubscriptionRepository.ts"
    - "packages/core/interfaces/billing/IPaymentGateway.ts"
    - "packages/api/src/use-cases/billing/CreateCheckoutSessionUseCase.ts"
    - "packages/api/src/use-cases/billing/ProcessPaymentWebhookUseCase.ts"
    - "packages/payments/src/gateways/StripePaymentGateway.ts"
    - "packages/api/src/controllers/billing/BillingController.ts"

  contains:
    - file: "packages/core/domain/billing/entities/Subscription.ts"
      pattern: "class Subscription extends AggregateRoot"
    
    - file: "packages/core/domain/billing/entities/Purchase.ts" 
      pattern: "class Purchase extends AggregateRoot"
    
    - file: "packages/payments/src/gateways/StripePaymentGateway.ts"
      pattern: "implements IPaymentGateway"
    
    - file: "packages/api/src/use-cases/billing/ProcessPaymentWebhookUseCase.ts"
      pattern: "stripe.webhooks.constructEventAsync"

  patterns:
    - name: "Domain Event Publishing"
      files: ["packages/core/domain/billing/entities/*.ts"]
      pattern: "this.addDomainEvent"
    
    - name: "Result Pattern Usage"
      files: ["packages/api/src/use-cases/billing/*.ts"]
      pattern: "Result\\.(ok|fail)"
    
    - name: "Clean Architecture Layering"
      constraint: "domain entities must not import infrastructure"
      verify: "no_imports"
      from: "packages/core/domain/**/*.ts"
      to: "packages/infrastructure/**/*.ts"

commands:
  - name: "test:billing"
    description: "Run billing domain and use case tests"
    command: "pnpm test packages/core/domain/billing packages/api/src/use-cases/billing"
  
  - name: "test:billing:integration"
    description: "Run billing integration tests"
    command: "pnpm test packages/payments/__tests__/integration"
  
  - name: "lint:billing"
    description: "Lint billing-related code"
    command: "pnpm lint packages/core/domain/billing packages/api/src/use-cases/billing packages/payments/src"
```

## Key Implementation Notes

1. **Domain-First Approach**: Always start with domain entities and business rules before implementing infrastructure concerns.

2. **Gateway Pattern**: Use the Gateway pattern to abstract payment provider specifics from the domain layer.

3. **Webhook Idempotency**: Ensure webhook processing is idempotent using unique event IDs and database constraints.

4. **Transaction Boundaries**: Use Unit of Work pattern to ensure consistency across multiple repository operations.

5. **Error Boundaries**: Implement proper error handling with domain-specific exceptions and meaningful error messages.

6. **Testing Strategy**: Maintain high test coverage with unit tests for domain logic and integration tests for external services.

7. **Security First**: Always verify webhook signatures and implement proper authentication for administrative endpoints.
   - **Critical**: Use raw, unmodified request body for signature verification (never parse JSON before verification)
   - **Endpoint Secret**: Must start with 'whsec_' prefix and match the configured webhook endpoint
   - **Error Handling**: Distinguish between signature verification errors and other webhook processing errors
   - **Headers**: Extract signature from 'Stripe-Signature' header exactly as received
   - **Common Issues**: Wrong endpoint secret, modified request body, or missing signature header

8. **Monitoring**: Implement comprehensive metrics and logging for billing operations to enable quick issue diagnosis.

This pattern provides a robust, testable, and maintainable approach to billing system implementation while maintaining Clean Architecture principles and leveraging battle-tested payment processing patterns.