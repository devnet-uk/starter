# Error Recovery Patterns

### Recovery Strategy Configuration
```typescript
// lib/errorRecovery.ts
export enum RecoveryStrategy {
  EXPONENTIAL_BACKOFF = 'exponential-backoff',
  LINEAR_BACKOFF = 'linear-backoff',
  CIRCUIT_BREAKER = 'circuit-breaker',
  FALLBACK = 'fallback',
  RETRY_WITH_JITTER = 'retry-with-jitter',
  BULKHEAD = 'bulkhead',
}

export interface ErrorRecoveryConfig {
  network: {
    strategy: RecoveryStrategy.EXPONENTIAL_BACKOFF;
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    fallback: 'cached-data' | 'default-response' | 'error-page';
  };
  database: {
    strategy: RecoveryStrategy.CIRCUIT_BREAKER;
    threshold: number;
    timeout: number;
    halfOpenRequests: number;
    resetTimeout: number;
  };
  external_api: {
    strategy: RecoveryStrategy.RETRY_WITH_JITTER;
    maxRetries: number;
    baseDelay: number;
    maxJitter: number;
  };
  ai_service: {
    strategy: RecoveryStrategy.BULKHEAD;
    maxConcurrent: number;
    queueSize: number;
    timeout: number;
  };
}

export const errorRecoveryStrategies: ErrorRecoveryConfig = {
  network: {
    strategy: RecoveryStrategy.EXPONENTIAL_BACKOFF,
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    fallback: 'cached-data',
  },
  database: {
    strategy: RecoveryStrategy.CIRCUIT_BREAKER,
    threshold: 5,
    timeout: 30000,
    halfOpenRequests: 3,
    resetTimeout: 60000,
  },
  external_api: {
    strategy: RecoveryStrategy.RETRY_WITH_JITTER,
    maxRetries: 3,
    baseDelay: 1000,
    maxJitter: 500,
  },
  ai_service: {
    strategy: RecoveryStrategy.BULKHEAD,
    maxConcurrent: 10,
    queueSize: 50,
    timeout: 120000,
  },
};
```

### Implementation Patterns

#### Exponential Backoff
```typescript
// lib/recovery/exponentialBackoff.ts
export class ExponentialBackoff {
  constructor(
    private maxRetries: number = 3,
    private initialDelay: number = 1000,
    private maxDelay: number = 30000,
    private multiplier: number = 2
  ) {}

  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries - 1) {
          throw lastError;
        }
        
        const delay = Math.min(
          this.initialDelay * Math.pow(this.multiplier, attempt),
          this.maxDelay
        );
        
        onRetry?.(attempt + 1, delay);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Circuit Breaker
```typescript
// lib/recovery/circuitBreaker.ts
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private halfOpenRequests: number = 0;
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private halfOpenLimit: number = 3,
    private resetTimeout: number = 120000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime! < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenRequests = 0;
    }
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequests >= this.halfOpenLimit) {
        throw new Error('Circuit breaker is HALF_OPEN, limit reached');
      }
      this.halfOpenRequests++;
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenLimit) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequests = 0;
  }
}
```

#### Retry with Jitter
```typescript
// lib/recovery/retryWithJitter.ts
export class RetryWithJitter {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxJitter: number = 500
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries - 1) {
          throw lastError;
        }
        
        const jitter = Math.random() * this.maxJitter;
        const delay = this.baseDelay + jitter;
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Bulkhead Pattern
```typescript
// lib/recovery/bulkhead.ts
export class Bulkhead {
  private running: number = 0;
  private queue: Array<() => void> = [];
  
  constructor(
    private maxConcurrent: number = 10,
    private maxQueueSize: number = 50,
    private timeout: number = 30000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueueSize) {
        throw new Error('Bulkhead queue is full');
      }
      
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const index = this.queue.indexOf(resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
          reject(new Error('Bulkhead timeout'));
        }, this.timeout);
        
        const wrappedResolve = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        
        this.queue.push(wrappedResolve);
      });
    }
    
    this.running++;
    
    try {
      return await fn();
    } finally {
      this.running--;
      
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }
  
  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      available: this.maxConcurrent - this.running,
    };
  }
}
```

### Fallback Strategies

#### Cache Fallback
```typescript
// lib/recovery/fallbacks/cacheFallback.ts
export class CacheFallback<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  
  constructor(private ttl: number = 3600000) {} // 1 hour default
  
  async executeWithFallback(
    key: string,
    fn: () => Promise<T>,
    validator?: (data: T) => boolean
  ): Promise<{ data: T; fromCache: boolean }> {
    try {
      const result = await fn();
      
      if (!validator || validator(result)) {
        this.cache.set(key, { data: result, timestamp: Date.now() });
        return { data: result, fromCache: false };
      }
      
      throw new Error('Validation failed');
    } catch (error) {
      const cached = this.cache.get(key);
      
      if (cached) {
        const age = Date.now() - cached.timestamp;
        
        if (age < this.ttl) {
          // Log through proper logging interface
          // this.logger?.warn('Using cached data due to error', { error, cacheAge: age });
          return { data: cached.data, fromCache: true };
        }
      }
      
      throw error;
    }
  }
  
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
```

#### Default Response Fallback
```typescript
// lib/recovery/fallbacks/defaultResponse.ts
export class DefaultResponseFallback {
  async executeWithDefault<T>(
    fn: () => Promise<T>,
    defaultValue: T,
    shouldUseDefault?: (error: Error) => boolean
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      
      if (!shouldUseDefault || shouldUseDefault(err)) {
        // Log through proper logging interface
        // this.logger?.warn('Using default response due to error', { error: err, defaultUsed: true });
        return defaultValue;
      }
      
      throw error;
    }
  }
}
```

### Integration with TanStack Query
```typescript
// hooks/useQueryWithRecovery.ts
import { useQuery } from '@tanstack/react-query';
import { ExponentialBackoff } from '@/lib/recovery/exponentialBackoff';
import { CacheFallback } from '@/lib/recovery/fallbacks/cacheFallback';

export function useQueryWithRecovery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: {
    fallbackData?: T;
    maxRetries?: number;
    cacheTime?: number;
  }
) {
  const backoff = new ExponentialBackoff(options?.maxRetries || 3);
  const cacheFallback = new CacheFallback<T>(options?.cacheTime);
  
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const cacheKey = key.join(':');
      
      return cacheFallback.executeWithFallback(
        cacheKey,
        () => backoff.execute(() => fetcher())
      );
    },
    retry: false, // We handle retries ourselves
    staleTime: 60000,
    placeholderData: options?.fallbackData,
  });
}
```

### Error Monitoring Integration
```typescript
// lib/recovery/monitoring.ts
import { Logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export class RecoveryMonitor {
  static logRecoveryAttempt(
    strategy: RecoveryStrategy,
    attempt: number,
    context: Record<string, any>
  ): void {
    Logger.info('Recovery attempt', {
      strategy,
      attempt,
      ...context,
    });
    
    Sentry.addBreadcrumb({
      category: 'recovery',
      message: `Recovery attempt ${attempt} using ${strategy}`,
      level: 'info',
      data: context,
    });
  }
  
  static logRecoverySuccess(
    strategy: RecoveryStrategy,
    attempts: number,
    duration: number,
    context: Record<string, any>
  ): void {
    Logger.info('Recovery successful', {
      strategy,
      attempts,
      duration,
      ...context,
    });
    
    Sentry.metrics.distribution('recovery.duration', duration, {
      tags: { strategy, success: 'true' },
    });
  }
  
  static logRecoveryFailure(
    strategy: RecoveryStrategy,
    error: Error,
    attempts: number,
    context: Record<string, any>
  ): void {
    Logger.error('Recovery failed', error, {
      strategy,
      attempts,
      ...context,
    });
    
    Sentry.captureException(error, {
      tags: { recovery_strategy: strategy },
      extra: { attempts, ...context },
    });
  }
  
  static logUIError(
    error: Error,
    errorInfo: React.ErrorInfo
  ): void {
    Logger.error('UI Error Boundary', error, {
      componentStack: errorInfo.componentStack,
    });
    
    Sentry.captureException(error, {
      tags: { component: 'react-error-boundary' },
      extra: { componentStack: errorInfo.componentStack },
    });
  }
}
```

## React 19 Error Boundaries with Modern Patterns

```typescript
// components/resilience/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ModernResilienceMonitor } from '@/lib/monitoring/resilience';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<unknown>;
  resetOnPropsChange?: boolean;
  isolateErrorScope?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModernErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const config = modernResilienceConfig.ui.errorBoundary;
    
    // Log error with modern monitoring
    ModernResilienceMonitor.logUIError(error, errorInfo);
    
    // Custom error handler
    config.onError?.(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }
  
  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (resetKey, index) => resetKey !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetError();
        }
      }
    }
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback, isolateErrorScope } = this.props;
    
    if (hasError && error) {
      if (Fallback) {
        return <Fallback error={error} retry={this.resetError} />;
      }
      
      // Default error UI with modern design
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            <button onClick={this.resetError} className="retry-button">
              Try again
            </button>
          </div>
        </div>
      );
    }
    
    // Isolate error scope if configured
    if (isolateErrorScope) {
      return <div className="error-isolation-scope">{children}</div>;
    }
    
    return children;
  }
}

// Hook for programmatic error boundary reset
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
}

// React 19 Suspense integration
export function SuspenseWithErrorBoundary({ 
  children,
  fallback,
  errorFallback 
}: {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}) {
  return (
    <ModernErrorBoundary 
      fallback={errorFallback}
      isolateErrorScope={true}
      resetOnPropsChange={true}
    >
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        {children}
      </React.Suspense>
    </ModernErrorBoundary>
  );
}
```

## Best Practices Summary

### Do's ✅
- Use TanStack Query 5.85.5+ with Suspense for automatic error boundaries
- Implement DrizzleORM connection pooling with circuit breakers
- Configure Better-Auth session refresh with fallback to re-authentication
- Use HonoJS middleware stack for API resilience
- Implement React 19 error boundaries with isolated scopes
- Monitor all resilience patterns with structured logging
- Use PostgreSQL 17.6 health checks for database monitoring

### Don'ts ❌
- Don't ignore connection pool limits in high-traffic scenarios
- Don't expose sensitive error details in production API responses
- Don't cache authentication tokens without expiration validation
- Don't skip error boundary isolation for critical UI components
- Don't implement retry logic without exponential backoff
- Don't ignore circuit breaker states in monitoring dashboards

This modern resilience strategy ensures our application can handle failures gracefully while maintaining optimal user experience across all layers of the technology stack.