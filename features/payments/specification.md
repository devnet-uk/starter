# Payment System - Comprehensive Feature Specification

> **Generated from Feature Manifest Analysis**  
> **Total Features**: 16 features (0 high complexity, 0 medium complexity, 16 low complexity)  
> **Domain**: Payment Processing & Subscription Management  
> **Status**: Clean Architecture Migration - Phase 1 Day 3

## Overview

The payment system provides comprehensive subscription management and payment processing capabilities with support for multiple payment providers. The system handles subscription lifecycles, seat-based billing, payment provider abstraction, and webhook processing to ensure reliable revenue operations across different payment platforms.

## User Stories

### Subscription Management
**As an organization owner**, I want to manage my organization's subscription plan, so that I can control costs and ensure my team has access to the features they need.

**Detailed Workflow:**
- Owner can view current subscription status and billing information
- Owner can upgrade or downgrade subscription plans
- Owner can add or remove subscription seats based on team size
- Owner can cancel subscriptions with proper confirmation and grace periods
- Owner receives notifications about billing cycles, failures, and renewals
- Subscription changes are reflected immediately in feature access

### Multi-Provider Payment Processing
**As a platform administrator**, I want to support multiple payment providers, so that I can optimize payment success rates and provide flexibility for different markets.

**Detailed Workflow:**
- System supports multiple payment providers (Stripe, LemonSqueezy, Polar, Creem)
- Payment provider selection based on customer location or preferences
- Automatic fallback to secondary providers if primary fails
- Unified interface for all payment operations regardless of provider
- Provider-specific optimizations and feature support
- Consolidated reporting across all payment providers

### Seat-Based Billing Management
**As an organization admin**, I want to manage subscription seats dynamically, so that I can scale my subscription based on actual team size and usage.

**Detailed Workflow:**
- Admin can view current seat usage vs. allocated seats
- Admin can increase seats immediately for new team members
- Admin can decrease seats with proration handling
- System enforces seat limits and prevents over-usage
- Billing automatically adjusts for mid-cycle seat changes
- Usage analytics help optimize seat allocation

## Feature Scope

### 1. **Multi-Provider Payment Integration** - Support for Stripe, LemonSqueezy, Polar, and Creem providers
### 2. **Subscription Lifecycle Management** - Complete subscription CRUD operations and state management
### 3. **Seat-Based Billing** - Dynamic seat management with proration and usage enforcement
### 4. **Webhook Processing** - Secure webhook handling for payment and subscription events
### 5. **Payment Provider Abstraction** - Unified interface across different payment providers
### 6. **Subscription Plans & Pricing** - Flexible plan configuration and pricing management
### 7. **Billing Analytics** - Revenue tracking and subscription analytics
### 8. **Payment Security** - PCI compliance and secure payment processing

## API Contracts (Request/Response Schemas)

### Subscription Management Endpoints

#### GET /payments/subscriptions
```typescript
// Query Parameters
interface GetSubscriptionsParams {
  organizationId: string;
  status?: 'active' | 'canceled' | 'past_due' | 'trialing';
}

// Response
interface GetSubscriptionsResponse {
  subscriptions: Array<{
    id: string;
    organizationId: string;
    planId: string;
    planName: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    seats: {
      current: number;
      maximum: number;
      used: number;
    };
    billing: {
      amount: number;
      currency: string;
      interval: 'month' | 'year';
      nextBillingDate: string;
    };
    provider: 'stripe' | 'lemonsqueezy' | 'polar' | 'creem';
    createdAt: string;
    updatedAt: string;
  }>;
}
```

#### POST /payments/subscriptions
```typescript
// Request
interface CreateSubscriptionRequest {
  organizationId: string;
  planId: string;
  seats: number;
  paymentMethodId?: string;
  trialDays?: number;
  successUrl?: string;
  cancelUrl?: string;
}

// Response
interface CreateSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    clientSecret?: string; // For payment confirmation
    hostedPageUrl?: string; // For redirect-based providers
  };
  message: 'Subscription created successfully';
}
```

#### PUT /payments/subscriptions/{subscriptionId}
```typescript
// Request
interface UpdateSubscriptionRequest {
  planId?: string; // Plan change
  seats?: number; // Seat adjustment
  paymentMethodId?: string; // Payment method update
}

// Response
interface UpdateSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    effectiveDate: string;
    prorationAmount?: number;
  };
  message: 'Subscription updated successfully';
}
```

#### POST /payments/subscriptions/{subscriptionId}/cancel
```typescript
// Request
interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean; // true = cancel at end, false = cancel immediately
  reason?: string;
}

// Response
interface CancelSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: 'canceled' | 'active'; // active if cancelAtPeriodEnd=true
    canceledAt: string;
    endsAt: string;
  };
  refundAmount?: number;
  message: 'Subscription canceled successfully';
}
```

### Seat Management Endpoints

#### PUT /payments/subscriptions/{subscriptionId}/seats
```typescript
// Request
interface SetSubscriptionSeatsRequest {
  seats: number;
  effectiveDate?: string; // For scheduled changes
}

// Response
interface SetSubscriptionSeatsResponse {
  success: boolean;
  subscription: {
    id: string;
    seats: {
      previous: number;
      current: number;
      effectiveDate: string;
    };
    billing: {
      prorationAmount: number;
      nextBillingDate: string;
      newMonthlyAmount: number;
    };
  };
  message: 'Subscription seats updated successfully';
}
```

#### GET /payments/subscriptions/{subscriptionId}/seat-usage
```typescript
// Response
interface GetSeatUsageResponse {
  subscription: {
    id: string;
    allocatedSeats: number;
    usedSeats: number;
    availableSeats: number;
  };
  members: Array<{
    userId: string;
    userName: string;
    email: string;
    joinedAt: string;
    lastActiveAt: string;
    role: string;
  }>;
  usage: {
    currentBillingPeriod: {
      start: string;
      end: string;
      averageUsage: number;
      peakUsage: number;
    };
  };
}
```

### Payment Plans Endpoints

#### GET /payments/plans
```typescript
// Query Parameters
interface GetPlansParams {
  currency?: string;
  interval?: 'month' | 'year';
  provider?: 'stripe' | 'lemonsqueezy' | 'polar' | 'creem';
}

// Response
interface GetPlansResponse {
  plans: Array<{
    id: string;
    name: string;
    description: string;
    features: string[];
    pricing: {
      amount: number;
      currency: string;
      interval: 'month' | 'year';
      trialDays: number;
    };
    limits: {
      seats: {
        min: number;
        max: number;
        includedSeats: number;
        additionalSeatPrice: number;
      };
      features: Record<string, number | boolean>;
    };
    provider: string;
    isPopular: boolean;
    isActive: boolean;
  }>;
}
```

### Webhook Endpoints

#### POST /payments/webhooks/{provider}
```typescript
// Webhook event structure (varies by provider)
interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any; // Provider-specific object
  };
  created: number;
  livemode: boolean;
}

// Response
interface WebhookResponse {
  received: boolean;
  processed: boolean;
  message?: string;
}
```

### Billing Analytics Endpoints

#### GET /payments/analytics/revenue
```typescript
// Query Parameters
interface GetRevenueAnalyticsParams {
  organizationId?: string;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  provider?: string;
}

// Response
interface GetRevenueAnalyticsResponse {
  revenue: {
    total: number;
    currency: string;
    period: string;
  };
  breakdown: Array<{
    date: string;
    amount: number;
    subscriptions: number;
    newCustomers: number;
    churn: number;
  }>;
  metrics: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    churnRate: number;
    avgRevenuePerUser: number;
  };
}
```

## UI/UX Requirements

### Subscription Management Interface
- **Subscription Dashboard**: Overview of current subscription status and billing
- **Plan Comparison**: Visual comparison of available subscription plans
- **Usage Metrics**: Real-time display of seat usage and feature consumption
- **Billing History**: Table of past invoices and payment history

### Payment Method Management
- **Payment Method Cards**: Visual cards for saved payment methods
- **Add Payment Method**: Secure form for adding credit cards or bank accounts
- **Default Payment Method**: Clear indication and management of default payment
- **Payment Security**: Visual security indicators and PCI compliance messaging

### Seat Management Interface
- **Seat Usage Indicator**: Progress bar showing seat utilization
- **Member List**: Table of organization members consuming seats
- **Seat Adjustment**: Simple controls for increasing/decreasing seats
- **Cost Calculator**: Real-time pricing calculation for seat changes

### Billing & Invoicing
- **Invoice Display**: Professional invoice layout with download options
- **Payment Status**: Clear status indicators for payment success/failure
- **Proration Details**: Detailed breakdown of prorated charges
- **Tax Information**: Display of applicable taxes and billing address

### Subscription Status Components
- **Status Badges**: Color-coded badges for subscription statuses
- **Alert Messages**: Important notifications about billing issues or changes
- **Action Buttons**: Context-appropriate actions (upgrade, cancel, retry payment)
- **Progress Indicators**: Visual progress for subscription changes and payments

## Business Rules and Validation Logic

### Subscription Rules
- **Minimum Seats**: Each subscription must have at least 1 seat
- **Maximum Seats**: Seat limits based on plan constraints and organization size
- **Seat Enforcement**: Cannot exceed allocated seats without upgrading
- **Grace Period**: 3-day grace period for failed payments before service suspension

### Billing Rules
- **Proration**: All mid-cycle changes are prorated to the day
- **Currency Consistency**: All charges within a subscription use the same currency
- **Tax Calculation**: Automatic tax calculation based on billing address
- **Payment Retry**: Automatic retry logic for failed payments (3 attempts over 7 days)

### Plan Change Rules
- **Upgrade Immediate**: Plan upgrades take effect immediately
- **Downgrade End of Period**: Plan downgrades occur at the end of current billing period
- **Feature Access**: Feature access changes immediately with plan changes
- **Data Retention**: Downgrade data retention policies (e.g., storage limits)

### Cancellation Rules
- **Immediate Cancellation**: Admin can cancel with immediate effect (with refund calculation)
- **End of Period**: Default cancellation preserves access until period end
- **Refund Policy**: Prorated refunds for unused time on annual plans
- **Data Retention**: 30-day data retention after cancellation

## Database Schema Requirements

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_subscription_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'lemonsqueezy', 'polar', 'creem')),
  plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'paused')),
  seats INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('month', 'year')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint per organization (one active subscription)
  UNIQUE(organization_id) WHERE status = 'active'
);
```

### Subscription Items Table (for detailed billing)
```sql
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  provider_item_id VARCHAR(255) NOT NULL,
  price_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount INTEGER NOT NULL, -- Amount per unit in cents
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Methods Table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_payment_method_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', etc.
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  last_four VARCHAR(4),
  expires_month INTEGER,
  expires_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure only one default per organization
  UNIQUE(organization_id) WHERE is_default = true
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  provider_invoice_id VARCHAR(255) NOT NULL,
  number VARCHAR(100),
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_total INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Webhook Events Table
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate processing
  UNIQUE(provider, provider_event_id)
);
```

### Indexes for Performance
```sql
-- Subscription queries
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_provider ON subscriptions(provider);

-- Payment method queries
CREATE INDEX idx_payment_methods_organization_id ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

-- Invoice queries
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Webhook processing
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);
```

## Integration Requirements

### Payment Provider Integration
- **Stripe Integration**: Complete Stripe API integration with webhooks
- **LemonSqueezy Integration**: LemonSqueezy subscription management
- **Polar Integration**: Polar recurring billing integration  
- **Creem Integration**: Creem payment processing integration
- **Provider Abstraction**: Unified interface across all providers

### Webhook Processing
- **Secure Webhook Handling**: Signature verification for all providers
- **Idempotent Processing**: Prevent duplicate webhook processing
- **Event Retry Logic**: Automatic retry for failed webhook processing
- **Dead Letter Queue**: Failed webhook event storage for manual processing

### Tax Calculation Integration
- **Tax Service Integration**: Integration with tax calculation services
- **Address Validation**: Billing address validation for tax calculation
- **Tax Rate Updates**: Automatic tax rate updates based on jurisdiction
- **Compliance Reporting**: Tax compliance reporting and remittance

### Analytics Integration
- **Revenue Tracking**: Integration with business intelligence tools
- **Customer Metrics**: Customer lifetime value and churn analytics
- **Performance Monitoring**: Payment success rate monitoring
- **Fraud Detection**: Integration with fraud detection services

## Test Scenarios

### Unit Tests
- **Payment Provider Abstraction**: Unified interface testing across providers
- **Subscription Lifecycle**: State transitions and business logic
- **Seat Management**: Seat allocation and proration calculations
- **Webhook Processing**: Event parsing and processing logic

### Integration Tests
- **Payment Flow**: End-to-end payment processing with each provider
- **Webhook Handling**: Webhook event processing and database updates  
- **Subscription Management**: Complete subscription lifecycle testing
- **Billing Calculations**: Accurate proration and tax calculations

### End-to-End Tests
- **Complete Subscription Journey**:
  - Organization signs up → selects plan → enters payment → subscription active
  - Mid-cycle seat adjustment → proration calculation → billing update
  - Plan upgrade → immediate access → billing adjustment
  - Subscription cancellation → access preservation → final billing

### Security Tests
- **Payment Security**: PCI compliance validation and secure data handling
- **Webhook Security**: Signature verification and replay attack prevention
- **Data Encryption**: Sensitive payment data encryption at rest and in transit
- **Access Control**: Payment management permission enforcement

### Performance Tests
- **High Volume Processing**: Webhook processing under high load
- **Concurrent Operations**: Multiple simultaneous subscription operations
- **Provider Failover**: Performance during provider service interruptions
- **Database Performance**: Billing queries with large datasets

## Implementation Notes

### Architecture Alignment
- **Clean Architecture**: Payment domain logic separated from providers
- **Provider Abstraction**: Common interface for all payment providers
- **Use Cases**: Payment and subscription management use cases
- **Repository Pattern**: Subscription and payment data abstractions

### Security Considerations
- **PCI Compliance**: Proper handling of payment card information
- **Webhook Security**: Cryptographic signature verification
- **Data Minimization**: Store minimal payment-related data
- **Access Controls**: Strict access controls for payment operations

### Performance Optimization
- **Caching Strategy**: Cache subscription and plan data
- **Asynchronous Processing**: Background processing for webhooks
- **Database Optimization**: Efficient queries for billing operations
- **Provider Optimization**: Optimized API calls to payment providers

### Error Handling & Reliability
- **Payment Retry Logic**: Sophisticated retry mechanisms for failed payments
- **Provider Fallback**: Automatic fallback to secondary providers
- **Graceful Degradation**: Service continuity during provider outages
- **Comprehensive Logging**: Detailed logging for payment troubleshooting

---

*This specification provides comprehensive coverage of the 16 payment system features extracted from the codebase, ensuring complete feature parity during Clean Architecture migration.*