# HonoJS API Patterns

> Target the HonoJS version defined in `docs/standards/tech-stack.md` (currently 4.9.7 with Zod-OpenAPI).

### Best Practices Checklist

- Use a shared factory via `createFactory<Env>()` to register cross-cutting middleware once and generate typed apps, routers, and middleware without repeating generics.
- Keep the `Env` definition (`Bindings`, `Variables`) authoritative and instantiate `factory.createApp()`/`new Hono<Env>()` so `c.env`/`c.var` stay type-safe in handlers and middlewares.
- Group routes with `app.route()` / `.basePath()` and keep middleware registration close to the routes they protect; prefer route-level middleware for expensive work.
- Validate every input with `@hono/zod-validator` or typed RPC interfaces and generate OpenAPI docs via `@hono/zod-openapi`.
- Export a single `app.fetch` entrypoint per runtime adapter (Cloudflare/Vercel/Node) and avoid mixing runtime-specific APIs inside business logic.
- Centralize error handling with `app.onError`/`app.notFound`, log structured diagnostics, and surface sanitized JSON responses.
- Leverage Hono middleware for security (CORS, secure headers, rate limiting, bearer/basic auth) and caching (`hono/cache` or runtime caches) instead of hand-rolled solutions.
- Prefer streaming helpers (`c.stream`, `c.streamText`, `c.sse`) for long-running responses and WebSocket or queue integrations for real-time workloads.
- Wire `@hono/prometheus`, `@hono/middleware/otel`, or custom logging middleware before route registration to ensure consistent observability.
- Cover APIs with request-level tests using `app.request`, `@hono/testing`, or `bun test`/`vitest` harnesses so contracts stay executable.

## Shared Factory & Typed Context

Use a single factory instance per application boundary so domain routers, middlewares, and runtime adapters all share Env types and initialization logic.

```typescript
// api/factory.ts
import { createFactory } from 'hono/factory';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from '@hono/request-id';

import type { Env } from './runtime';

export const apiFactory = createFactory<Env>({
  initApp: (app) => {
    app.use('*', contextStorage());
    app.use('*', requestId());
    app.use('*', logger());
    app.use('*', cors({ origin: ['https://app.example.com'], credentials: true }));
    app.use('*', secureHeaders());
  },
});
```

Compose controller pipelines with `apiFactory.createHandlers(logger(), middleware, handler)` so shared middleware keeps type inference without manual generics.

Augment `ContextVariableMap` when third-party middleware attaches new variables so `c.get()` stays typed even outside modules that import your `Env`.

```typescript
// api/context.d.ts
import type { AppUser } from './domain/users';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    user?: AppUser;
  }
}
```

## API Structure

### Route Organization
```typescript
// api/index.ts
import { apiFactory } from './factory';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { postRoutes } from './routes/posts';

// Global middleware is registered once in apiFactory.initApp
const app = apiFactory.createApp().basePath('/api');

// Example auth middleware that enriches context
app.use('*', async (c, next) => {
  const token = c.req.header('authorization')?.replace('Bearer ', '');
  if (token) {
    const user = await verifyToken(token, c.env.DATABASE_URL);
    if (user) c.set('user', user);
  }
  return next();
});

// Mount feature routers (each router handles its own local middleware)
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/posts', postRoutes);

// OpenAPI document endpoint (auto-detect host)
app.doc('/api/docs', (c) => ({
  openapi: '3.1.0',
  info: { title: 'Example API', version: '1.0.0' },
  servers: [{ url: new URL(c.req.url).origin, description: 'Current environment' }],
}));

// Domain-specific error handling & observability
app.onError((err, c) => {
  c.req.raw.cf?.waitUntil(reportError(err, { requestId: c.var.requestId }));

  if (err instanceof ValidationError) {
    return c.json({ message: err.message, fields: err.fields }, 400);
  }

  if (err instanceof AuthError) {
    return c.json({ message: err.message }, 401);
  }

  if (err instanceof NotFoundError) {
    return c.json({ message: err.message }, 404);
  }

  return c.json({ message: 'Unexpected server error', requestId: c.var.requestId }, 500);
});

app.notFound((c) => c.json({ message: 'Route not found', requestId: c.var.requestId }, 404));

export default app;
```

### Typed Environment & Runtime Adapters
```typescript
// api/runtime.ts
import { handle } from 'hono/cloudflare-workers';
import { handle as handleNode } from 'hono/node-server';
import { handle as handleVercel } from 'hono/vercel';
import type { KVNamespace, Queue } from '@cloudflare/workers-types';

import api from './index';

export { api as app };

export type Env = {
  Bindings: {
    DATABASE_URL: string;
    AUTH_SECRET: string;
    QUEUE: Queue; // Cloudflare Queue binding (import type from @cloudflare/workers-types)
    ARTICLE_KV: KVNamespace;
    DATA_CACHE: KVNamespace;
    ADMIN_PASSWORD: string;
    SENTRY_DSN?: string;
    RUNTIME_ENV: 'development' | 'staging' | 'production';
  };
  Variables: {
    requestId: string;
    user?: AppUser;
  };
};

// Cloudflare Workers entrypoint
export default handle(api);

// Node runtime entrypoint (e.g. pnpm dev)
export const startNode = () =>
  handleNode(api, { port: Number(process.env.PORT ?? 3000) });

// Vercel Edge/Node entrypoint
export const config = { runtime: 'edge' };
export const GET = handleVercel(api);
export const POST = handleVercel(api);
```

### Typed Validation & OpenAPI
```typescript
// routes/users.ts
import { cache } from 'hono/cache';
import { createRoute, z } from '@hono/zod-openapi';
import { apiFactory } from '../factory';

const UserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('User');

const CreateUserBody = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    password: z.string().min(12),
  })
  .openapi('CreateUserBody');

const GetUserParams = z.object({ id: z.string().uuid() }).openapi('GetUserParams');

// createUser/getUserById live in service layer and must honour domain invariants
const users = apiFactory.createApp();

const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  request: { body: { content: { 'application/json': { schema: CreateUserBody } } } },
  responses: {
    201: {
      description: 'User created',
      content: { 'application/json': { schema: UserSchema } },
    },
  },
});

users.openapi(createUserRoute, async (c) => {
  const input = c.req.valid('json');
  const user = await createUser(input, c.env.DATABASE_URL);
  return c.json(user, 201);
});

users.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    request: { params: GetUserParams },
    middleware: [cache({ cacheName: 'user-cache', cacheControl: 'max-age=60' })],
    responses: {
      200: {
        description: 'User',
        content: { 'application/json': { schema: UserSchema } },
      },
      404: { description: 'User not found' },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = await getUserById(id);
    return user ? c.json(user) : c.json({ message: 'User not found' }, 404);
  },
);

export const userRoutes = users;
```

## Testing & Contract Coverage

Exercise the Hono app directly in unit and integration tests so request/response behaviour stays verifiable across runtimes.

```typescript
// tests/users.spec.ts
import { describe, expect, it } from 'vitest';
import type { KVNamespace, Queue } from '@cloudflare/workers-types';

import api from '../api';
import type { Env } from '../api/runtime';

const mockEnv: Env['Bindings'] = {
  DATABASE_URL: 'http://127.0.0.1:9000',
  AUTH_SECRET: 'test-secret',
  QUEUE: { send: async () => undefined } as unknown as Queue,
  ARTICLE_KV: { get: async () => null } as unknown as KVNamespace,
  DATA_CACHE: { get: async () => null } as unknown as KVNamespace,
  ADMIN_PASSWORD: 'insecure',
  SENTRY_DSN: undefined,
  RUNTIME_ENV: 'test',
};

describe('users', () => {
  it('creates a user', async () => {
    const res = await api.request(
      'http://example.com/api/users',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer integration-test',
        },
        body: JSON.stringify({ email: 'demo@example.com', name: 'Demo', password: 'hunter2-hono' }),
      },
      mockEnv,
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ email: 'demo@example.com' });
  });
});
```

- `app.request(input, init, env)` accepts path strings, Request objects, or URL strings and optionally a bindings object; pass deterministic mocks for Cloudflare resources.
- Reach for `@hono/testing` helpers when you need streaming assertions, multipart parsing, or to emulate runtime-specific quirks in CI.
- Snapshot the OpenAPI doc (`expect(await api.request('/api/docs').json()).toMatchSnapshot()`) to detect contract drift alongside schema updates.
- Keep verification blocks or smoke tests aligned with your API contracts so schema changes fail fast before deployment.

## Observability & Telemetry

Register metrics and tracing middleware before routes so instrumentation captures every request.

```typescript
// api/index.ts (excerpt)
import { prometheus } from '@hono/prometheus';
import { otel } from '@hono/otel';

const { registerMetrics, printMetrics } = prometheus();

app.use('*', registerMetrics);
app.use('*', otel({ serviceName: 'engineering-os-api' }));

app.get('/metrics', printMetrics);
```

- Export metrics on `/metrics` and wire OpenTelemetry to your preferred exporter (Console/OTLP) in local development.
- Register tracing once during bootstrap so downstream routers inherit span context (`contextStorage` keeps async locals intact).
- Emit structured logs inside `app.onError` with the request ID stored on `c.var.requestId` for correlation across traces and metrics.

## oRPC Integration with Hono

### Basic oRPC Adapter Setup

oRPC integrates seamlessly with HonoJS through the fetch adapter, allowing you to run both REST and RPC endpoints in the same application:

```typescript
// api/index.ts
import { RPCHandler } from '@orpc/server/fetch';
import { appRouter } from './procedures/router';
import { userRoutes } from './routes/users';
import { apiFactory } from './factory';

// Cross-cutting middleware already registered via apiFactory.initApp
const app = apiFactory.createApp();

// Create oRPC handler
const rpcHandler = new RPCHandler(appRouter);

// Mount oRPC at /rpc path
app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {
      user: c.var.user,
      requestId: c.var.requestId,
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

// Continue with REST routes
app.route('/users', userRoutes);

export default app;
```

### Handling Request Body Conflicts

When using both Hono middleware and oRPC, prevent body parsing conflicts:

```typescript
const BODY_PARSER_METHODS = new Set(['arrayBuffer', 'blob', 'formData', 'json', 'text']);

app.use('/rpc/*', async (c, next) => {
  // Proxy request to handle body parsing correctly
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (BODY_PARSER_METHODS.has(prop as any)) {
        return () => c.req[prop as any]();
      }
      return Reflect.get(target, prop, target);
    }
  });

  const { matched, response } = await rpcHandler.handle(request, {
    prefix: '/rpc',
    context: await createRPCContext(c)
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});
```

### Shared Middleware Between REST and RPC

Leverage Hono middleware for both REST and RPC endpoints:

```typescript
// middleware/auth.ts  
export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const user = await verifyToken(token);
  c.set('user', user);
  await next();
});

// Apply to both REST and RPC routes
app.use('/protected/*', authMiddleware); // REST routes
app.use('/rpc/*', authMiddleware);       // RPC procedures will have access via context
```

## Streaming & Realtime Patterns

```typescript
// Server-Sent Events (SSE) via hono/streaming
import { streamSSE } from 'hono/streaming';

app.get('/events', async (c) => {
  return streamSSE(c, async (stream) => {
    const cancel = new AbortController();
    c.executionCtx.waitUntil(() => cancel.abort());

    stream.writeSSE({ data: JSON.stringify({ type: 'connected' }) });

    const sub = subscribeToTopic('notifications', (payload) =>
      stream.writeSSE({ event: 'notification', data: JSON.stringify(payload) })
    );

    stream.onAbort(() => sub.unsubscribe());
  });
});

// Streaming large responses chunk-by-chunk
app.get('/reports/:id/export', (c) =>
  c.stream(async (stream) => {
    for await (const chunk of exportReport(c.req.param('id'))) {
      await stream.write(chunk);
    }
  }, { status: 200, headers: { 'content-type': 'text/csv' } })
);

// WebSocket relay (Cloudflare / Bun adapters expose c.env for bindings)
app.get('/ws', (c) =>
  c.websocket((socket) => {
    socket.onMessage((event) => broadcast(event.data));
  })
);
```

## Caching & Edge Storage

```typescript
import { cache } from 'hono/cache';

// Leverage runtime HTTP cache (Cloudflare Workers example)
app.use('/articles/*', cache({ cacheName: 'articles', cacheControl: 's-maxage=120' }));

app.get('/articles/:slug', async (c) => {
  const { slug } = c.req.param();
  const article = await c.env.ARTICLE_KV.get(slug, 'json');
  if (!article) {
    return c.json({ message: 'Not found' }, 404, {
      'cache-control': 'no-store',
    });
  }

  // Warm background caches (Queue/KV) without blocking response
  c.executionCtx.waitUntil(revalidateArticle(slug));
  return c.json(article, 200, { 'cache-control': 'max-age=60, stale-while-revalidate=30' });
});

// Cache adapter for expensive RPC results
import { createMiddleware } from 'hono/factory';
const memoize = createMiddleware<Env>(async (c, next) => {
  const cacheKey = `user:${c.req.raw.url}`;
  const cached = await c.env.DATA_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  await next();
  if (c.res.ok) {
    c.executionCtx.waitUntil(
      c.env.DATA_CACHE.put(cacheKey, await c.res.clone().text(), { expirationTtl: 120 }),
    );
  }
});

app.route('/users', users.use(memoize));
```

## Security & Access Control

```typescript
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from '@hono/rate-limiter';
import { basicAuth } from 'hono/basic-auth';
import { bearerAuth } from 'hono/bearer-auth';
import { createMiddleware } from 'hono/factory';

app.use('*', secureHeaders());

// Apply rate limiting per IP
app.use(
  '/auth/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 30,
    keyGenerator: (c) => c.req.header('cf-connecting-ip') ?? c.req.ip ?? 'anon',
    onLimitReached: (c) => c.json({ message: 'Too many requests' }, 429),
  }),
);

// Protect administrative endpoints
const adminAuth = createMiddleware<Env>(async (c, next) =>
  basicAuth({ username: 'admin', password: c.env.ADMIN_PASSWORD })(c, next),
);
app.use('/admin/*', adminAuth);

// API key or JWT enforcement
const serviceTokenAuth = createMiddleware<Env>((c, next) =>
  bearerAuth({ token: c.env.AUTH_SECRET })(c, next),
);
app.use('/api/protected/*', serviceTokenAuth);

// Multi-tenant guard ensures bound user is present
app.use('/tenant/*', (c, next) => {
  if (!c.var.user) return c.json({ message: 'Unauthorized' }, 401);
  if (!c.var.user.tenantId) return c.json({ message: 'Tenant required' }, 403);
  return next();
});
```

## Observability & Error Reporting

```typescript
import { prometheus } from '@hono/prometheus';
import { sentry } from '@hono/sentry';
import { createMiddleware } from 'hono/factory';

const metrics = prometheus({ options: { defaultMetricsEnabled: true } });
app.use('*', metrics.middleware);
app.get('/metrics', metrics.getMetrics());

const sentryMiddleware = createMiddleware<Env>((c, next) =>
  sentry({
    dsn: c.env.SENTRY_DSN,
    environment: c.env.RUNTIME_ENV,
    release: process.env.COMMIT_SHA,
  })(c, next),
);
app.use('*', sentryMiddleware);

app.onError((err, c) => {
  c.executionCtx.waitUntil(reportError(err, { requestId: c.var.requestId }));
  return c.json({ message: 'Unexpected server error', requestId: c.var.requestId }, 500);
});

// Structured logging helper
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  console.log(JSON.stringify({
    requestId: c.var.requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: +(performance.now() - start).toFixed(2),
  }));
});
```

### Context Sharing Pattern

Share authenticated user and request context between REST and RPC:

```typescript
// context/rpc-context.ts
export async function createRPCContext(c: Context) {
  return {
    user: c.var.user,             // From auth middleware
    requestId: c.var.requestId,   // From request ID middleware  
    userRepository: new UserRepository(),
    // ... other dependencies
  };
}

// procedures/users/router.ts
export const usersRouter = createRouter({
  getProfile: createProcedure
    .output(UserSchema)
    .query(async ({ ctx }) => {
      // ctx.user is available from Hono middleware
      return await ctx.userRepository.findById(ctx.user.id);
    }),
});
```

## Middleware Patterns

### Authentication Middleware
```typescript
// middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const token = c.req.header('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const payload = await verify(token, c.env.AUTH_SECRET);
    c.set('user', payload as AppUser);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Usage
app.use('/protected/*', authMiddleware);
```

### Rate Limiting
```typescript
// middleware/rate-limit.ts
import { rateLimiter } from '@hono/rate-limiter';

export const apiRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to API routes
app.use('/api/*', apiRateLimit);
```

### Request Validation
```typescript
// middleware/validation.ts
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const validatePagination = zValidator('query', paginationSchema);

// Usage
app.get('/users', validatePagination, async (c) => {
  const { page, limit } = c.req.valid('query');
  // ... pagination logic
});
```

## Error Handling

### Custom Error Classes
```typescript
// errors/types.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

### Error Response Formatting
```typescript
// utils/errorResponse.ts
export const formatErrorResponse = (error: Error) => {
  if (error instanceof ValidationError) {
    return {
      type: 'validation_error',
      message: error.message,
      fields: error.fields,
    };
  }
  
  if (error instanceof AuthError) {
    return {
      type: 'auth_error',
      message: error.message,
    };
  }
  
  if (error instanceof NotFoundError) {
    return {
      type: 'not_found',
      message: error.message,
    };
  }
  
  return {
    type: 'internal_error',
    message: 'An unexpected error occurred',
  };
};
```

## Database Integration

### Repository Pattern
```typescript
// repositories/userRepository.ts
import { db } from '../db';
import { users, type User, type NewUser } from '../db/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
  
  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user ?? null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user ?? null;
  }
}
```

### Service Layer
```typescript
// services/userService.ts
import { UserRepository } from '../repositories/userRepository';
import { hash } from 'bcrypt';

export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async createUser(data: { email: string; name: string; password: string }) {
    // Check if user exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already exists', {
        email: ['Email is already taken'],
      });
    }
    
    // Hash password
    const passwordHash = await hash(data.password, 12);
    
    // Create user
    return this.userRepo.create({
      ...data,
      passwordHash,
    });
  }
}
```

## Enhanced OpenAPI Integration with Zod

### Advanced createRoute Pattern
```typescript
// schemas/user.ts - Enhanced schema definitions
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid().openapi({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique user identifier'
  }),
  name: z.string().min(1).max(100).openapi({ 
    example: 'John Doe',
    description: 'User full name'
  }),
  email: z.string().email().openapi({ 
    example: 'user@example.com',
    description: 'User email address'
  }),
  role: z.enum(['user', 'admin']).openapi({
    example: 'user',
    description: 'User role in the system'
  }),
  createdAt: z.string().datetime().openapi({
    example: '2024-01-01T00:00:00Z',
    description: 'User creation timestamp'
  }),
}).openapi('User');

export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true 
}).extend({
  password: z.string().min(12).openapi({
    example: 'SecurePassword123!',
    description: 'User password (minimum 12 characters)'
  })
}).openapi('CreateUser');

export const ErrorSchema = z.object({
  message: z.string().openapi({ 
    example: 'Validation failed',
    description: 'Error message'
  }),
  code: z.string().optional().openapi({
    example: 'VALIDATION_ERROR',
    description: 'Error code for programmatic handling'
  }),
  fields: z.record(z.array(z.string())).optional().openapi({
    example: { email: ['Invalid email format'] },
    description: 'Field-specific validation errors'
  }),
}).openapi('Error');
```

### Route Definition with Enhanced Validation
```typescript
// routes/users.ts - Contract-first route definitions
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { UserSchema, CreateUserSchema, ErrorSchema } from '../schemas/user';

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        param: { name: 'id', in: 'path' },
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'User ID to retrieve'
      }),
    }),
    headers: z.object({
      authorization: z.string().openapi({
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
        description: 'Bearer token for authentication'
      }),
    }).optional(),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User retrieved successfully',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized - Invalid or missing token',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Retrieves a single user by their unique identifier with full type safety',
});

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
      description: 'User data to create',
      required: true,
    },
    headers: z.object({
      'content-type': z.literal('application/json').openapi({
        example: 'application/json',
        description: 'Content type must be application/json'
      }),
    }),
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User created successfully',
      headers: z.object({
        location: z.string().openapi({
          example: '/users/123e4567-e89b-12d3-a456-426614174000',
          description: 'Location of the created user'
        })
      }),
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Validation error - Invalid input data',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Conflict - User already exists',
    },
  },
  tags: ['Users'],
  summary: 'Create new user',
  description: 'Creates a new user with comprehensive validation and type safety',
});
```

### Enhanced App Implementation with Hook Validation
```typescript
// Initialize OpenAPI app with enhanced error handling
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: result.error.flatten().fieldErrors,
      }, 400);
    }
  }
});

// Implement routes with enhanced validation hooks
app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param');
  
  try {
    const user = await getUserById(id);
    
    if (!user) {
      return c.json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    return c.json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500);
  }
});

app.openapi(createUserRoute, async (c) => {
  const userData = c.req.valid('json');
  
  try {
    const user = await createUser(userData);
    
    // Set location header for created resource
    c.header('location', `/users/${user.id}`);
    
    return c.json(user, 201);
  } catch (error) {
    if (error.code === 'UNIQUE_VIOLATION') {
      return c.json({ 
        message: 'User already exists',
        code: 'DUPLICATE_EMAIL',
        fields: { email: ['Email already registered'] }
      }, 409);
    }
    throw error;
  }
}, 
// Enhanced validation hook with detailed error responses
(result, c) => {
  if (!result.success) {
    const errors = result.error.issues.reduce((acc, issue) => {
      const path = issue.path.join('.');
      if (!acc[path]) acc[path] = [];
      acc[path].push(issue.message);
      return acc;
    }, {});
    
    return c.json({
      message: 'Request validation failed',
      code: 'REQUEST_VALIDATION_ERROR',
      fields: errors
    }, 400);
  }
});

// Generate comprehensive OpenAPI specification
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Phoenix API',
    description: 'Production-ready API with comprehensive validation and type safety',
    contact: {
      name: 'API Support',
      email: 'api-support@phoenix.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://api.phoenix.dev/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.phoenix.dev/v1', 
      description: 'Staging server',
    },
    {
      url: 'http://localhost:4001/v1',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Organizations',
      description: 'Organization and tenant management',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for external integrations'
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { apiKey: [] }
  ],
});

// Enhanced Swagger UI with customization
import { swaggerUI } from '@hono/swagger-ui';

app.get('/docs', swaggerUI({ 
  url: '/openapi.json',
  config: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
  }
}));

export { app as userRoutes };
```

## Contract-First API Development

### zod-endpoints Pattern
```typescript
// contracts/api/users.ts
import { createEndpoint } from 'zod-endpoints';
import { z } from 'zod';

export const getUserEndpoint = createEndpoint({
  method: 'get',
  path: '/users/:id',
  params: z.object({ 
    id: z.string().uuid().openapi({ 
      example: '123e4567-e89b-12d3-a456-426614174000' 
    }) 
  }),
  response: z.object({ 
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.string().email().openapi({ example: 'john@example.com' }),
    createdAt: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
  }).openapi('User'),
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Retrieves a single user by their unique identifier'
});

export const createUserEndpoint = createEndpoint({
  method: 'post',
  path: '/users',
  body: z.object({
    name: z.string().min(3).openapi({ example: 'John Doe' }),
    email: z.string().email().openapi({ example: 'john@example.com' })
  }).openapi('CreateUser'),
  response: z.object({ 
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string().datetime()
  }).openapi('User'),
  tags: ['Users'],
  summary: 'Create new user',
  description: 'Creates a new user with the provided information'
});
```

### Contract Implementation
```typescript
// api/routes/users.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { getUserEndpoint, createUserEndpoint } from '@/contracts/api/users';

const app = new OpenAPIHono();

// Implement contract endpoints
app.openapi(getUserEndpoint.route, async (c) => {
  const { id } = c.req.valid('param');
  const user = await getUserById(id);
  
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }
  
  return c.json(user);
});

app.openapi(createUserEndpoint.route, async (c) => {
  const userData = c.req.valid('json');
  
  try {
    const user = await createUser(userData);
    return c.json(user, 201);
  } catch (error) {
    if (error.code === 'UNIQUE_VIOLATION') {
      return c.json({ 
        message: 'User already exists',
        fields: { email: ['Email already registered'] }
      }, 409);
    }
    throw error;
  }
});

export { app as userRoutes };
```

### Advanced OpenAPI Patterns
```typescript
// Conditional schemas based on user role
const UserResponseSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('admin'),
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    permissions: z.array(z.string()),
    lastLogin: z.string().datetime(),
  }),
  z.object({
    role: z.literal('user'),
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    profile: z.object({
      bio: z.string().optional(),
      avatar: z.string().url().optional(),
    }).optional(),
  }),
]).openapi('UserResponse');

// Polymorphic response handling
const NotificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    recipient: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
    message: z.string().max(160),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
    badge: z.number().optional(),
  }),
]).openapi('Notification');
```

## Testing Patterns

### API Route Testing
```typescript
// tests/routes/users.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';

describe('User Routes', () => {
  beforeEach(async () => {
    // Clean database
    await clearDatabase();
  });
  
  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword123',
    };
    
    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    expect(res.status).toBe(201);
    
    const user = await res.json();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.passwordHash).toBeUndefined(); // Should not return password
  });
  
  it('should return 400 for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      name: 'Test User',
      password: 'securepassword123',
    };
    
    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    expect(res.status).toBe(400);
    
    const error = await res.json();
    expect(error.fields.email).toBeDefined();
  });
});
```

## Best Practices

### Performance
- Use streaming responses for large datasets
- Implement proper caching headers
- Use compression middleware
- Optimize database queries with proper indexing

### Security
- Always validate input with Zod schemas
- Use secure headers middleware
- Implement rate limiting
- Sanitize error messages in production
- Use HTTPS in production

### Code Organization
- Separate routes, services, and repositories
- Use dependency injection for testability
- Implement proper error handling
- Document APIs with OpenAPI
- Write comprehensive tests

## Hono API Verification

<verification-block context-check="hono-api-verification">
  <verification_definitions>
    <test name="hono_framework_installed">
      TEST: "grep -q '\"hono\"' package.json"
      REQUIRED: true
      ERROR: "Hono framework not installed. Run: npm install hono"
      DESCRIPTION: "Verifies Hono framework is installed"
    </test>
    
    <test name="hono_zod_openapi_integration">
      TEST: "grep -q '@hono/zod-openapi' package.json"
      REQUIRED: true
      ERROR: "Hono Zod OpenAPI integration not installed. Run: npm install @hono/zod-openapi"
      DESCRIPTION: "Ensures type-safe API documentation is available"
      DEPENDS_ON: ["hono_framework_installed"]
    </test>
    
    <test name="hono_api_structure">
      TEST: "test -f packages/api/index.ts && grep -q 'new.*Hono\\|OpenAPIHono' packages/api/index.ts"
      REQUIRED: true
      ERROR: "Hono API application not properly structured in packages/api/index.ts"
      DESCRIPTION: "Verifies main Hono application setup"
      DEPENDS_ON: ["hono_framework_installed"]
    </test>
    
    <test name="hono_middleware_usage">
      TEST: "grep -r 'app\\.use\\|middleware' packages/api/ | head -3"
      REQUIRED: true
      ERROR: "Hono middleware not properly configured"
      DESCRIPTION: "Checks that middleware is being used"
      DEPENDS_ON: ["hono_api_structure"]
    </test>
    
    <test name="hono_route_validation">
      TEST: "grep -r 'z\\.object\\|createRoute' packages/api/ | head -3"
      REQUIRED: true
      ERROR: "Hono routes lack input validation. Add Zod schemas to route definitions."
      DESCRIPTION: "Ensures all routes use proper validation"
      DEPENDS_ON: ["hono_zod_openapi_integration"]
    </test>
    
    <test name="hono_orpc_integration">
      TEST: "grep -r 'RPCHandler\\|@orpc/server/fetch' packages/api/ | head -1"
      REQUIRED: false
      ERROR: "oRPC integration with Hono not configured"
      FIX_COMMAND: "Add oRPC Hono adapter in packages/api/index.ts"
      DESCRIPTION: "Verifies oRPC and REST coexistence in Hono"
      DEPENDS_ON: ["hono_api_structure"]
    </test>
    
    <test name="hono_openapi_docs">
      TEST: "grep -r 'openapi.*json\\|swagger' packages/api/ || test -f packages/api/openapi.json"
      REQUIRED: false
      ERROR: "OpenAPI documentation not generated"
      FIX_COMMAND: "Add OpenAPI spec generation to packages/api"
      DESCRIPTION: "Checks for API documentation generation"
      DEPENDS_ON: ["hono_zod_openapi_integration"]
    </test>
    
    <test name="hono_error_handling">
      TEST: "grep -r 'onError\\|errorHandler' packages/api/"
      REQUIRED: true
      ERROR: "Hono error handling not implemented"
      FIX_COMMAND: "Add global error handler middleware"
      DESCRIPTION: "Verifies proper error handling is in place"
      DEPENDS_ON: ["hono_api_structure"]
    </test>
    
    <test name="hono_cors_configured">
      TEST: "grep -r 'cors\\|CORS' packages/api/"
      REQUIRED: true
      ERROR: "CORS not configured for Hono API"
      FIX_COMMAND: "Add CORS middleware with proper origin restrictions"
      DESCRIPTION: "Ensures CORS is properly configured"
      DEPENDS_ON: ["hono_middleware_usage"]
    </test>

    <test name="hono_testing_setup">
      TEST: "test -d packages/api/__tests__ && grep -r 'supertest\\|app\\.request' packages/api/__tests__/"
      REQUIRED: false
      ERROR: "Hono API testing not set up"
      FIX_COMMAND: "Create test files using Hono's testing utilities"
      DESCRIPTION: "Verifies API testing infrastructure"
      VARIABLES: ["PROJECT_COVERAGE"]
    </test>
  </verification_definitions>
</verification-block>
