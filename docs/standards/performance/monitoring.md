# Performance Monitoring

## Application Performance Monitoring

### Sentry Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Profiling
  profilesSampleRate: 0.1,
  
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', /^https:\/\/yourapp\.com/],
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

### Custom Performance Metrics
```typescript
// utils/performance.ts
export function measurePerformance(metricName: string, fn: () => void) {
  const startMark = `${metricName}-start`;
  const endMark = `${metricName}-end`;
  
  performance.mark(startMark);
  fn();
  performance.mark(endMark);
  
  performance.measure(metricName, startMark, endMark);
  
  const measure = performance.getEntriesByName(metricName)[0];
  
  // Send to analytics
  sendMetric({
    name: metricName,
    duration: measure.duration,
    timestamp: Date.now()
  });
  
  // Clean up
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(metricName);
}
```

## Logging Strategy

### Structured Logging
```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  },
  redact: {
    paths: ['password', 'email', 'token'],
    censor: '[REDACTED]'
  }
});

export class Logger {
  static info(message: string, data?: any) {
    logger.info({ ...data, timestamp: new Date().toISOString() }, message);
  }
  
  static error(message: string, error: Error, data?: any) {
    logger.error({
      ...data,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date().toISOString()
    }, message);
  }
  
  static metric(name: string, value: number, tags?: Record<string, string>) {
    logger.info({
      metric: name,
      value,
      tags,
      timestamp: new Date().toISOString()
    }, 'metric');
  }
}
```

### API Request Logging
```typescript
// middleware/logging.ts
export function loggingMiddleware(c: Context, next: Next) {
  const start = performance.now();
  const requestId = crypto.randomUUID();
  
  Logger.info('API Request', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    ip: c.req.header('x-forwarded-for')
  });
  
  return next().finally(() => {
    const duration = performance.now() - start;
    
    Logger.info('API Response', {
      requestId,
      duration,
      status: c.res.status,
      path: c.req.path
    });
    
    // Alert on slow requests
    if (duration > 1000) {
      Logger.warn('Slow API Request', {
        requestId,
        duration,
        path: c.req.path
      });
    }
  });
}
```

## Real-Time Monitoring Dashboard

### Metrics Collection
```typescript
// lib/metrics.ts
interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private buffer: Metric[] = [];
  private interval: NodeJS.Timeout;
  
  constructor() {
    // Flush metrics every 10 seconds
    this.interval = setInterval(() => this.flush(), 10000);
  }
  
  record(metric: Metric) {
    this.buffer.push(metric);
    
    // Flush if buffer is large
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }
  
  private async flush() {
    if (this.buffer.length === 0) return;
    
    const metrics = [...this.buffer];
    this.buffer = [];
    
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify(metrics)
      });
    } catch (error) {
      Logger.error('Failed to send metrics', error);
      // Re-add metrics to buffer
      this.buffer.unshift(...metrics);
    }
  }
}

export const metrics = new MetricsCollector();
```

## Alerting Rules

### Performance Alerts
```yaml
# monitoring/alerts.yml
alerts:
  - name: high_error_rate
    condition: error_rate > 0.01
    duration: 5m
    action: page_oncall
    
  - name: slow_response_time
    condition: p95_latency > 1000ms
    duration: 10m
    action: notify_slack
    
  - name: memory_usage_high
    condition: memory_usage > 90%
    duration: 5m
    action: page_oncall
    
  - name: database_connection_pool_exhausted
    condition: available_connections < 2
    duration: 1m
    action: page_oncall
```

## RPC Performance Monitoring

<conditional-block task-condition="orpc|rpc|procedure|remote-procedure-call|rpc-metrics|rpc-monitoring|rpc-performance" context-check="rpc-performance-monitoring">
IF task involves RPC performance monitoring:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get RPC performance monitoring from performance/monitoring.md"
  </context_fetcher_strategy>
</conditional-block>

### oRPC Procedure Metrics

```typescript
// monitoring/rpc-metrics.ts
import { Logger, metrics } from '@/lib/logging';

export interface RpcMetrics {
  procedureName: string;
  duration: number;
  success: boolean;
  inputSize: number;
  outputSize: number;
  userId?: string;
  timestamp: number;
  error?: string;
}

export class RpcPerformanceMonitor {
  private static instance: RpcPerformanceMonitor;
  private metrics: Map<string, RpcMetrics[]> = new Map();
  
  static getInstance(): RpcPerformanceMonitor {
    if (!this.instance) {
      this.instance = new RpcPerformanceMonitor();
    }
    return this.instance;
  }
  
  async trackProcedureCall(
    procedureName: string,
    startTime: number,
    success: boolean,
    input: any,
    output: any,
    context: any,
    error?: Error
  ) {
    const duration = performance.now() - startTime;
    const inputSize = JSON.stringify(input).length;
    const outputSize = success ? JSON.stringify(output).length : 0;
    
    const metric: RpcMetrics = {
      procedureName,
      duration,
      success,
      inputSize,
      outputSize,
      userId: context.userId,
      timestamp: Date.now(),
      error: error?.message,
    };
    
    // Store in memory for aggregation
    if (!this.metrics.has(procedureName)) {
      this.metrics.set(procedureName, []);
    }
    this.metrics.get(procedureName)!.push(metric);
    
    // Log the metric
    Logger.metric('rpc_procedure_call', duration, {
      procedure: procedureName,
      success: success.toString(),
      userId: context.userId || 'anonymous',
    });
    
    // Alert on slow procedures
    if (duration > 5000) {
      Logger.warn('Slow RPC procedure', {
        procedure: procedureName,
        duration,
        userId: context.userId,
        inputSize,
        error: error?.message,
      });
    }
    
    // Alert on large payloads
    if (inputSize > 1024 * 1024 || outputSize > 1024 * 1024) { // 1MB
      Logger.warn('Large RPC payload', {
        procedure: procedureName,
        inputSize,
        outputSize,
        userId: context.userId,
      });
    }
    
    // Send to external monitoring
    await this.sendMetricToMonitoring(metric);
  }
  
  getMetricsSummary(procedureName: string, hours: number = 1): any {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const procedureMetrics = this.metrics.get(procedureName) || [];
    const recentMetrics = procedureMetrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return null;
    }
    
    const durations = recentMetrics.map(m => m.duration);
    const successCount = recentMetrics.filter(m => m.success).length;
    const errorCount = recentMetrics.length - successCount;
    
    return {
      totalCalls: recentMetrics.length,
      successRate: successCount / recentMetrics.length,
      errorRate: errorCount / recentMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      maxDuration: Math.max(...durations),
      topErrors: this.getTopErrors(recentMetrics),
    };
  }
  
  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
  
  private getTopErrors(metrics: RpcMetrics[]): Array<{ error: string; count: number }> {
    const errors = metrics.filter(m => m.error);
    const errorCounts = new Map<string, number>();
    
    errors.forEach(m => {
      const count = errorCounts.get(m.error!) || 0;
      errorCounts.set(m.error!, count + 1);
    });
    
    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  private async sendMetricToMonitoring(metric: RpcMetrics) {
    // Send to Sentry, DataDog, CloudWatch, etc.
    try {
      await fetch('/api/internal/metrics/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      Logger.error('Failed to send RPC metric', error as Error);
    }
  }
}

// Singleton instance
export const rpcMonitor = RpcPerformanceMonitor.getInstance();
```

### RPC Middleware Integration

```typescript
// middleware/rpc-monitoring.ts
import { createMiddleware } from '@orpc/server';
import { rpcMonitor } from '@/monitoring/rpc-metrics';

export const monitoringMiddleware = createMiddleware()
  .define(async ({ next, procedureName, input, context }) => {
    const startTime = performance.now();
    let output: any;
    let error: Error | undefined;
    let success = false;
    
    try {
      output = await next();
      success = true;
      return output;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      // Always track the call, regardless of success/failure
      await rpcMonitor.trackProcedureCall(
        procedureName,
        startTime,
        success,
        input,
        output,
        context,
        error
      );
    }
  });

// Apply to all procedures
export const monitoredRouter = createRouter().use(monitoringMiddleware);
```

### RPC Performance Dashboard

```typescript
// app/admin/rpc-monitoring/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface RpcDashboardData {
  procedures: Array<{
    name: string;
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
  }>;
  alerts: Array<{
    procedure: string;
    type: 'slow_response' | 'high_error_rate' | 'large_payload';
    message: string;
    timestamp: number;
  }>;
}

export default function RpcMonitoringDashboard() {
  const [data, setData] = useState<RpcDashboardData | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/admin/rpc-metrics?range=${timeRange}`);
      const dashboardData = await response.json();
      setData(dashboardData);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, [timeRange]);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">RPC Performance Monitoring</h1>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>
      
      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Active Alerts</h2>
          {data.alerts.map((alert, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <span className="text-red-700">{alert.message}</span>
              <span className="text-sm text-red-600">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Procedure Performance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Procedure
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total Calls
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Avg Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                P95 Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Error Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.procedures.map((proc, i) => (
              <tr key={i} className={proc.errorRate > 0.05 ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {proc.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {proc.totalCalls.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    proc.successRate > 0.99 
                      ? 'bg-green-100 text-green-800'
                      : proc.successRate > 0.95
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(proc.successRate * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={proc.avgDuration > 1000 ? 'text-red-600 font-semibold' : ''}>
                    {proc.avgDuration.toFixed(0)}ms
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={proc.p95Duration > 5000 ? 'text-red-600 font-semibold' : ''}>
                    {proc.p95Duration.toFixed(0)}ms
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    proc.errorRate === 0
                      ? 'bg-green-100 text-green-800'
                      : proc.errorRate < 0.01
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(proc.errorRate * 100).toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### RPC Performance Alerting

```typescript
// monitoring/rpc-alerts.ts
export interface RpcAlert {
  type: 'slow_response' | 'high_error_rate' | 'large_payload' | 'suspicious_activity';
  procedure: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: any;
  timestamp: number;
}

export class RpcAlerting {
  private alertThresholds = {
    slowResponse: 5000, // 5 seconds
    highErrorRate: 0.05, // 5%
    largePayload: 1024 * 1024, // 1MB
    suspiciousCallRate: 1000, // calls per minute
  };
  
  private activeAlerts: Map<string, RpcAlert> = new Map();
  
  async checkProcedureHealth(procedureName: string) {
    const metrics = rpcMonitor.getMetricsSummary(procedureName, 1);
    
    if (!metrics) return;
    
    const alerts: RpcAlert[] = [];
    
    // Check for slow responses
    if (metrics.p95Duration > this.alertThresholds.slowResponse) {
      alerts.push({
        type: 'slow_response',
        procedure: procedureName,
        severity: metrics.p95Duration > 10000 ? 'critical' : 'high',
        message: `Procedure ${procedureName} has slow P95 response time: ${metrics.p95Duration}ms`,
        metrics: { p95Duration: metrics.p95Duration },
        timestamp: Date.now(),
      });
    }
    
    // Check for high error rates
    if (metrics.errorRate > this.alertThresholds.highErrorRate) {
      alerts.push({
        type: 'high_error_rate',
        procedure: procedureName,
        severity: metrics.errorRate > 0.2 ? 'critical' : 'high',
        message: `Procedure ${procedureName} has high error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
        metrics: { errorRate: metrics.errorRate, topErrors: metrics.topErrors },
        timestamp: Date.now(),
      });
    }
    
    // Check for suspicious activity
    if (metrics.totalCalls > this.alertThresholds.suspiciousCallRate) {
      alerts.push({
        type: 'suspicious_activity',
        procedure: procedureName,
        severity: 'medium',
        message: `Procedure ${procedureName} has unusually high call volume: ${metrics.totalCalls} calls/hour`,
        metrics: { totalCalls: metrics.totalCalls },
        timestamp: Date.now(),
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }
  
  private async processAlert(alert: RpcAlert) {
    const alertKey = `${alert.procedure}:${alert.type}`;
    const existingAlert = this.activeAlerts.get(alertKey);
    
    // De-duplicate alerts (don't re-send the same alert within 30 minutes)
    if (existingAlert && (Date.now() - existingAlert.timestamp) < 30 * 60 * 1000) {
      return;
    }
    
    this.activeAlerts.set(alertKey, alert);
    
    // Log the alert
    Logger.warn('RPC Performance Alert', {
      type: alert.type,
      procedure: alert.procedure,
      severity: alert.severity,
      message: alert.message,
      metrics: alert.metrics,
    });
    
    // Send to external alerting systems based on severity
    switch (alert.severity) {
      case 'critical':
        await this.sendPagerDutyAlert(alert);
        await this.sendSlackAlert(alert);
        break;
      case 'high':
        await this.sendSlackAlert(alert);
        break;
      case 'medium':
        await this.sendEmailAlert(alert);
        break;
    }
  }
  
  private async sendSlackAlert(alert: RpcAlert) {
    // Implementation depends on your Slack setup
    const webhook = process.env.SLACK_ALERT_WEBHOOK;
    if (!webhook) return;
    
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 RPC Performance Alert: ${alert.message}`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Procedure', value: alert.procedure, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Metrics', value: JSON.stringify(alert.metrics, null, 2) },
          ],
        }],
      }),
    });
  }
  
  private async sendPagerDutyAlert(alert: RpcAlert) {
    // Implementation for PagerDuty integration
  }
  
  private async sendEmailAlert(alert: RpcAlert) {
    // Implementation for email alerts
  }
}

// Initialize alerting system
export const rpcAlerting = new RpcAlerting();

// Check all procedures every 5 minutes
setInterval(async () => {
  const procedures = ['user.getProfile', 'user.updateProfile', 'posts.create']; // Configure as needed
  
  for (const procedure of procedures) {
    await rpcAlerting.checkProcedureHealth(procedure);
  }
}, 5 * 60 * 1000);
```

## Performance Monitoring Verification

<verification-block context-check="performance-monitoring-verification">
  <verification_definitions>
    <test name="sentry_configuration">
      TEST: "test -f sentry.client.config.ts && grep -q 'tracesSampleRate' sentry.client.config.ts"
      REQUIRED: true
      ERROR: "Sentry performance monitoring not configured. Set up Sentry with performance tracing."
      DESCRIPTION: "Verifies Sentry APM is properly configured"
    </test>
    
    <test name="structured_logging">
      TEST: "grep -r 'pino\\|Logger' packages/api packages/core --include='*.ts' | head -3"
      REQUIRED: true
      ERROR: "Structured logging not implemented. Add structured logging with Pino."
      DESCRIPTION: "Ensures structured logging is in place"
    </test>
    
    <test name="api_request_logging">
      TEST: "grep -r 'loggingMiddleware\\|Logger.*API.*Request' packages/api --include='*.ts'"
      REQUIRED: true
      ERROR: "API request logging not configured. Add logging middleware to track requests."
      DESCRIPTION: "Verifies API requests are being logged"
    </test>
    
    <test name="performance_metrics_collection">
      TEST: "grep -r 'MetricsCollector\\|performance\\.mark\\|measurePerformance' packages/ --include='*.ts'"
      REQUIRED: false
      ERROR: "Performance metrics collection not implemented"
      FIX_COMMAND: "Add custom performance metrics using Performance API"
      DESCRIPTION: "Checks for custom performance monitoring"
    </test>
    
    <test name="rpc_performance_monitoring">
      TEST: "grep -r 'rpcMonitor\\|RpcPerformanceMonitor\\|trackProcedureCall' packages/api --include='*.ts'"
      REQUIRED: false
      ERROR: "RPC performance monitoring not configured"
      FIX_COMMAND: "Add RPC performance monitoring middleware"
      DESCRIPTION: "Verifies RPC procedures are being monitored"
    </test>
    
    <test name="rpc_metrics_dashboard">
      TEST: "test -f packages/frontend/src/app/admin/rpc-monitoring/ || grep -r 'RpcDashboardData\\|rpc.*monitoring' packages/frontend/src/"
      REQUIRED: false
      ERROR: "RPC metrics dashboard not implemented"
      FIX_COMMAND: "Create RPC monitoring dashboard in admin section"
      DESCRIPTION: "Checks for RPC performance visualization"
    </test>
    
    <test name="alerting_configuration">
      TEST: "grep -r 'sendSlackAlert\\|sendPagerDutyAlert\\|alert.*webhook' packages/ --include='*.ts'"
      REQUIRED: false
      ERROR: "Performance alerting not configured"
      FIX_COMMAND: "Configure performance alerts for slow responses and high error rates"
      DESCRIPTION: "Verifies performance alerting is set up"
    </test>
    
    <test name="monitoring_environment_variables">
      TEST: "grep -r 'SENTRY_DSN\\|SLACK_ALERT_WEBHOOK\\|LOG_LEVEL' .env* || echo 'Check .env files'"
      REQUIRED: false
      ERROR: "Monitoring environment variables not configured"
      FIX_COMMAND: "Add monitoring configuration to environment variables"
      DESCRIPTION: "Checks for required monitoring environment configuration"
    </test>
    
    <test name="rpc_alerting_thresholds">
      TEST: "grep -r 'alertThresholds\\|slowResponse.*5000\\|highErrorRate' packages/api --include='*.ts'"
      REQUIRED: false
      ERROR: "RPC alerting thresholds not configured"
      FIX_COMMAND: "Configure RPC performance alerting with appropriate thresholds"
      DESCRIPTION: "Verifies RPC alerting thresholds are set"
    </test>
  </verification_definitions>
</verification-block>
