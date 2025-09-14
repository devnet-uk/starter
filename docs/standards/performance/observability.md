# Observability Foundation

## Overview

This document outlines the foundational strategy for observability, ensuring our systems are transparent, debuggable, and maintainable. Our approach is built on the three pillars of observability: **Logs**, **Metrics**, and **Traces**.

We standardize on the [OpenTelemetry](https://opentelemetry.io/) (OTel) framework for generating and collecting telemetry data. This provides a vendor-agnostic, unified approach to instrumentation. The local setup for this stack is defined in the [Local Development Environment](./../development/local-environment.md) standard.

## Core Components

1.  **Structured Logging**: For event-based monitoring. We use **Pino** for its performance and structured JSON output, automatically correlated with traces.
2.  **Distributed Tracing**: For request flow analysis. We use **OpenTelemetry** to generate traces, visualized locally with **Jaeger**.
3.  **Metrics**: For aggregated performance data. We use **OpenTelemetry** to generate metrics, which are scraped by **Prometheus**.

## 1. OpenTelemetry Setup

We use `@vercel/otel` to simplify OpenTelemetry setup in Next.js.

### Step 1: Install Dependencies
```bash
pnpm add @vercel/otel @opentelemetry/instrumentation-pino pino
```

### Step 2: Enable Instrumentation Hook
In `next.config.mjs`, enable the experimental instrumentation hook.
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
export default nextConfig;
```

### Step 3: Configure the SDK
Create `instrumentation.ts` in your project root (`/src` if applicable). This initializes the OTel SDK and automatically injects trace context into Pino logs.

**File: `instrumentation.ts`**
```typescript
import { registerOTel } from '@vercel/otel';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

export function register() {
  registerOTel({
    serviceName: 'your-app-name',
    instrumentations: [
      new PinoInstrumentation({
        // This option links logs to traces
        logHook: (span, record) => {
            record['resource.service.name'] = span.resource.attributes['service.name'];
        },
      }),
    ],
  });
}
```

## 2. Structured Logging & Trace Correlation

Create a centralized Pino logger. The `PinoInstrumentation` will automatically add the `trace_id` and `span_id` to every log entry made within a traced request.

**File: `lib/logger.ts`**
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV,
    service: 'web-app',
  },
});
```

**Example Log Output:**
When you use `logger.info(...)` inside an API route, the output will look like this, enabling direct correlation in your observability platform:
```json
{
  "level": 30,
  "time": 1678886400000,
  "msg": "User logged in successfully.",
  "userId": "123",
  "trace_id": "d61b4e4af1032e0aae279d12f3ab0159",
  "span_id": "d140da862204f2a2",
  "trace_flags": "01"
}
```

## 3. Custom Metrics

Here’s how to define and record a custom metric.

### Step 1: Initialize a Meter
```typescript
// lib/metrics.ts
import { metrics } from '@opentelemetry/api';

export const meter = metrics.getMeter('your-app-meter');

export const orderCounter = meter.createCounter('orders_processed', {
  description: 'Counts the number of processed orders',
  unit: '1',
});
```

### Step 2: Record a Metric
```typescript
import { orderCounter } from '@/lib/metrics';

export async function processNewOrder(order) {
  // ... processing logic
  
  // Increment the counter with attributes
  orderCounter.add(1, {
    'order.status': 'success',
    'order.value': order.total,
  });
}
```
These metrics will be exposed on the `/metrics` endpoint for Prometheus to scrape, as configured in the local Docker Compose setup.

## RPC Metrics

For procedure-level metrics (latency percentiles, error rates, payload sizes), see RPC performance monitoring patterns in `performance/monitoring.md#rpc-performance-monitoring`. Use OpenTelemetry timers/counters where possible and correlate with trace spans (`rpc.procedure`).
