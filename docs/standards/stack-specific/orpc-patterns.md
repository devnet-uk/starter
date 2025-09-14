# oRPC Patterns

<!-- 
Routing: This standard is reached via:
1. Root: "orpc|rpc|procedure" -> stack-specific dispatcher
2. Stack-specific: "orpc|rpc|procedure|type-safe-api|streaming-api" -> this file
3. Alternative: Architecture -> integration -> RPC patterns section
-->

## Overview

oRPC is a modern, type-safe RPC framework that provides end-to-end type safety with first-class OpenAPI support. It integrates seamlessly with our existing HonoJS infrastructure while offering enhanced type inference and reduced boilerplate compared to traditional REST APIs.

### When to Use oRPC

**Use oRPC for:**
- Internal service-to-service communication within the monorepo
- Type-safe API procedures with minimal boilerplate  
- Real-time features requiring streaming or subscriptions
- Migration from tRPC to a lighter alternative
- APIs where end-to-end type safety is critical

**Use REST instead for:**
- Public APIs consumed by external clients
- APIs requiring specific HTTP semantics (status codes, headers)
- Complex caching strategies with HTTP cache control
- Legacy system integration

## Router Organization

### Feature-Based Structure
```typescript
// packages/api/procedures/users/router.ts
import { os } from '@orpc/server'
import { z } from 'zod'
import { CreateUserSchema, GetUserSchema, UpdateUserSchema } from '@workspace/contracts'

export const usersRouter = {
  // Query procedures
  getById: os
    .input(z.object({ id: z.string().uuid() }))
    .output(GetUserSchema)
    .handler(async ({ input, context }) => {
      return await context.userRepository.findById(input.id)
    }),

  list: os
    .input(z.object({ 
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20)
    }))
    .output(z.array(GetUserSchema))
    .handler(async ({ input, context }) => {
      return await context.userRepository.findPaginated(input)
    }),

  // Mutation procedures  
  create: os
    .input(CreateUserSchema)
    .output(GetUserSchema)
    .handler(async ({ input, context }) => {
      return await context.createUserUseCase.execute(input)
    }),

  update: os
    .input(UpdateUserSchema.extend({ id: z.string().uuid() }))
    .output(GetUserSchema)
    .handler(async ({ input, context }) => {
      const { id, ...data } = input
      return await context.updateUserUseCase.execute(id, data)
    }),

  // Streaming procedure (event iterator)
  watchUser: os
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      return context.userEventStream.watchUser(input.id)
    }),
}
```

### Main Router Assembly
```typescript
// packages/api/procedures/router.ts
import { usersRouter } from './users/router'
import { authRouter } from './auth/router'
import { postsRouter } from './posts/router'

export const appRouter = {
  users: usersRouter,
  auth: authRouter,
  posts: postsRouter,
}

export type AppRouter = typeof appRouter
```

## Hono Integration

### Basic Hono Adapter Setup
```typescript
// packages/api/index.ts
import { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { appRouter } from './procedures/router'
import { createContext } from './context'

const app = new Hono()

// Global middleware (shared with REST routes)
app.use('*', cors())
app.use('*', logger())

// Create oRPC handler
const rpcHandler = new RPCHandler(appRouter, {
  plugins: [
    // Add authentication, rate limiting, etc.
  ]
})

// Mount oRPC at /rpc path
app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: await createContext(c)
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})

// Continue with REST routes...
app.route('/api', restRoutes)

export default app
```

### Request Body Handling
```typescript
// Handle Hono body parsing conflicts
const BODY_PARSER_METHODS = new Set(['arrayBuffer', 'blob', 'formData', 'json', 'text'] as const)
type BodyParserMethod = typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never

app.use('/rpc/*', async (c, next) => {
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        return () => c.req[prop as BodyParserMethod]()
      }
      return Reflect.get(target, prop, target)
    }
  })

  const { matched, response } = await rpcHandler.handle(request, {
    prefix: '/rpc',
    context: await createContext(c)
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})
```

## Contract Integration

### Shared Schema Approach
```typescript
// packages/contracts/schemas/user.ts  
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']),
  createdAt: z.string().datetime(),
}).openapi('User')

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
}).openapi('CreateUserRequest')

export const UpdateUserSchema = CreateUserSchema.partial().openapi('UpdateUserRequest')

export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
```

### RPC Router Contract Definition
```typescript
// packages/contracts/rpc/routers/users.ts
import { z } from 'zod'
import { UserSchema, CreateUserSchema, UpdateUserSchema } from '../../schemas/user'

export const usersRouterContract = {
  getById: {
    input: z.object({ id: z.string().uuid() }),
    output: UserSchema,
    method: 'query' as const,
  },
  
  create: {
    input: CreateUserSchema,
    output: UserSchema,
    method: 'mutation' as const,
  },
  
  watchUser: {
    input: z.object({ id: z.string().uuid() }),
    output: UserSchema,
    method: 'subscription' as const,
  },
} as const

export type UsersRouterContract = typeof usersRouterContract
```

### Client Type Generation
```typescript
// packages/contracts/rpc/clients/index.ts
import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '../../api/procedures/router'

export type AppRouterClient = RouterClient<AppRouter>

// Generate typed client
export function createTypedClient(baseUrl: string) {
  const link = new RPCLink({ url: `${baseUrl}/rpc` })
  return createORPCClient<AppRouter>(link)
}

// Export for frontend consumption
export { type AppRouter }
```

## Frontend Integration

### TanStack Query Integration
```typescript
// apps/web/src/shared/api/rpc-client.ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '@workspace/contracts/rpc/clients'

const rpcLink = new RPCLink({
  url: '/rpc',
  headers: () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
  }),
})

export const rpcClient = createORPCClient<AppRouter>(rpcLink)

// TanStack Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUser(id: string) {
  return useQuery({
    queryKey: ['rpc', 'users', 'getById', { id }],
    queryFn: () => rpcClient.users.getById({ id }),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateUser) => rpcClient.users.create(data),
    onSuccess: (user) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['rpc', 'users'] })
      // Set individual user cache
      queryClient.setQueryData(['rpc', 'users', 'getById', { id: user.id }], user)
    },
  })
}
```

### Subscription Patterns (Event Iterator)
```typescript
// Real-time user updates via Event Iterator
export function useUserSubscription(id: string) {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const iterator = await rpcClient.users.watchUser({ id })
        for await (const updatedUser of iterator) {
          if (!active) break
          setUser(updatedUser)
          queryClient.setQueryData(['rpc', 'users', 'getById', { id }], updatedUser)
        }
      } catch (error) {
        console.error('Subscription error:', error)
      }
    })()

    return () => { active = false }
  }, [id, queryClient])

  return user
}
```

## Procedure Naming Conventions

### Naming Patterns
- **Queries**: Use verb-first naming (getById, listAll, findByEmail)
- **Mutations**: Use action verbs (create, update, delete, archive)
- **Subscriptions**: Use "watch" prefix (watchUser, watchPosts)

```typescript
// Good naming examples (os builder)
import { os } from '@orpc/server'

export const postsRouter = {
  // Queries
  getById: os.handler(async () => {/* ... */}),
  listRecent: os.handler(async () => {/* ... */}),
  findByAuthor: os.handler(async () => {/* ... */}),
  searchByTitle: os.handler(async () => {/* ... */}),

  // Mutations
  create: os.handler(async () => {/* ... */}),
  update: os.handler(async () => {/* ... */}),
  delete: os.handler(async () => {/* ... */}),
  publish: os.handler(async () => {/* ... */}),
  archive: os.handler(async () => {/* ... */}),

  // Streaming
  watchPost: os.handler(async () => {/* return async iterator */}),
  watchComments: os.handler(async () => {/* return async iterator */}),
}
```

## Error Handling

### Structured Error Types
```typescript
// packages/contracts/schemas/errors.ts
import { z } from 'zod'

export const RPCErrorSchema = z.object({
  code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  path: z.string().optional(),
}).openapi('RPCError')

export type RPCError = z.infer<typeof RPCErrorSchema>
```

### Error Middleware
```typescript
// packages/api/middleware/error-handler.ts
import { os } from '@orpc/server'

export const errorHandler = os.middleware(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof ValidationError) {
      throw {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.fieldErrors,
      }
    }
    
    if (error instanceof NotFoundError) {
      throw {
        code: 'NOT_FOUND', 
        message: error.message,
      }
    }
    
    // Log internal errors but don't expose details
    console.error('RPC Internal Error:', error)
    throw {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
    }
  }
})
```

### Frontend Error Handling
```typescript
// Error boundary for RPC errors
export function handleRPCError(error: unknown) {
  if (isRPCError(error)) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return handleValidationError(error)
      case 'NOT_FOUND':
        return handleNotFoundError(error)
      case 'UNAUTHORIZED':
        return redirectToLogin()
      default:
        return showGenericError()
    }
  }
  
  return showGenericError()
}
```

## Security Patterns

<conditional-block task-condition="rpc-security|procedure-auth|rpc-rate-limit" context-check="orpc-security-routing">
IF task involves RPC security implementation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get comprehensive API security patterns from security/api-security.md#rpc-security-patterns"
  </context_fetcher_strategy>
</conditional-block>

### Authentication Middleware
```typescript
// packages/api/middleware/auth.ts
import { os } from '@orpc/server'
import { auth } from '@workspace/infrastructure/auth'

type SessionUser = { id: string; role?: string }
type Session = { user: SessionUser }

export const requireAuth = os
  .$context<{ headers: Headers; user?: SessionUser; session?: Session }>()
  .middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  })
  
  if (!session?.user) {
    throw new Error('UNAUTHORIZED: Authentication required')
  }
  
  return next({
    context: {
      ...context,
      user: session.user,
      session,
    },
  })
})

// Role-based authorization
export const requireRole = (role: string) => 
  os.$context<{ user?: { role?: string } }>()
    .middleware(async ({ context, next }) => {
      if (!context.user || context.user.role !== role) {
        throw new Error(`FORBIDDEN: ${role} role required`)
      }
      return next()
    })
```

### Rate Limiting
```typescript
// packages/api/middleware/rate-limit.ts
import { os } from '@orpc/server'
import { rateLimiter } from '@workspace/infrastructure/rate-limit'

export const rateLimit = (options: { requests: number; window: number }) =>
  os.$context<{ user?: { id: string }; ip?: string; procedure?: string }>()
    .middleware(async ({ context, next }) => {
      const key = `rpc:${context.user?.id || context.ip}:${context.procedure}`
      const allowed = await rateLimiter.check(key, options)
      if (!allowed) {
        throw new Error('RATE_LIMIT_EXCEEDED: Too many requests')
      }
      return next()
    })
```

## Performance Patterns

### Batching Support
```typescript
// Server-side batching via plugin
import { RPCHandler } from '@orpc/server/fetch'
import { BatchHandlerPlugin } from '@orpc/server/plugins'

const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new BatchHandlerPlugin()],
})
```

### Streaming Responses
```typescript
// Server-side streaming via async iterator
import { os } from '@orpc/server'
import { z } from 'zod'

export const chatRouter = {
  streamMessages: os
    .input(z.object({ roomId: z.string() }))
    .handler(async ({ input, context }) => {
      return context.messageStream.subscribe(input.roomId)
    }),
}
```

### Caching Strategies
```typescript
// Procedure-level caching (os.use)
export const usersRouter = {
  getById: os
    .input(z.object({ id: z.string().uuid() }))
    .output(UserSchema)
    .use(cache({ ttl: 5 * 60 * 1000 })) // 5 minute cache
    .handler(async ({ input, context }) => {
      return await context.userRepository.findById(input.id)
    }),
}
```

## Testing Patterns

### Unit Testing Procedures
```typescript
// packages/api/__tests__/procedures/users.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { createTRPCMsw } from 'msw-trpc'
import { usersRouter } from '../procedures/users/router'
import { createMockContext } from '../__mocks__/context'

describe('Users RPC Router', () => {
  let mockContext: ReturnType<typeof createMockContext>
  
  beforeEach(() => {
    mockContext = createMockContext()
  })
  
  test('getById returns user when found', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
    mockContext.userRepository.findById.mockResolvedValue(mockUser)
    
    const result = await usersRouter.getById({
      input: { id: '1' },
      ctx: mockContext,
    })
    
    expect(result).toEqual(mockUser)
    expect(mockContext.userRepository.findById).toHaveBeenCalledWith('1')
  })
  
  test('create validates input and calls use case', async () => {
    const input = { name: 'New User', email: 'new@example.com' }
    const createdUser = { id: '2', ...input }
    
    mockContext.createUserUseCase.execute.mockResolvedValue(createdUser)
    
    const result = await usersRouter.create({
      input,
      ctx: mockContext,
    })
    
    expect(result).toEqual(createdUser)
    expect(mockContext.createUserUseCase.execute).toHaveBeenCalledWith(input)
  })
})
```

### Integration Testing with MSW
```typescript
// packages/api/__tests__/integration/rpc.test.ts
import { setupServer } from 'msw/node'
import { createTRPCMsw } from 'msw-trpc'
import { appRouter } from '../procedures/router'
import { createClient } from '@orpc/client/fetch'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('full RPC flow with mocked dependencies', async () => {
  const trpcMsw = createTRPCMsw(appRouter)
  
  server.use(
    trpcMsw.users.getById.query(() => ({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    }))
  )
  
  const link = new RPCLink({ url: '/rpc' })
  const client = createORPCClient<typeof appRouter>(link)
  const user = await client.users.getById({ id: '1' })
  
  expect(user.name).toBe('Test User')
})
```

### Contract Testing
```typescript
// Ensure client and server contracts match
test('client contract matches server implementation', () => {
  const clientContract = usersRouterContract
  const serverProcedures = Object.keys(usersRouter)
  const clientProcedures = Object.keys(clientContract)
  
  expect(serverProcedures.sort()).toEqual(clientProcedures.sort())
})
```

## Migration Strategies

### From REST to oRPC
```typescript
// 1. Create equivalent oRPC procedures (os style)
export const usersRouter = {
  // REST: GET /api/users/:id -> RPC: users.getById
  getById: os
    .input(z.object({ id: z.string() }))
    .output(UserSchema)
    .handler(async ({ input, context }) => {
      // Reuse existing service logic
      return await context.userService.findById(input.id)
    }),

  // REST: POST /api/users -> RPC: users.create
  create: os
    .input(CreateUserSchema)
    .output(UserSchema)
    .handler(async ({ input, context }) => {
      return await context.userService.create(input)
    }),
}

// 2. Gradual frontend migration
// Keep REST client as fallback during transition
export function useUserWithFallback(id: string) {
  const rpcQuery = useRPCUser(id, { enabled: false })
  const restQuery = useRESTUser(id, { enabled: !rpcQuery.isSuccess })
  
  return rpcQuery.isSuccess ? rpcQuery : restQuery
}
```

### From tRPC to oRPC
```typescript
// tRPC to oRPC mapping
const trpcRouter = t.router({/* ... */})

// Becomes oRPC with os builder
const orpcRouter = {
  users: {
    getById: os
      .input(z.object({ id: z.string() }))
      .output(UserSchema)
      .handler(({ input }) => getUserById(input.id)),
  }
}
```

## OpenAPI Integration

### Automatic Spec Generation
```typescript
// packages/api/openapi.ts
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { appRouter } from './procedures/router'

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

// Serve spec at /rpc/openapi.json
app.get('/rpc/openapi.json', async (c) => {
  const spec = await generator.generate(appRouter, {
    info: { title: 'MyApp RPC API', version: '1.0.0' },
    servers: [{ url: '/rpc', description: 'RPC endpoint' }],
    tags: [
      { name: 'users', description: 'User management' },
      { name: 'auth', description: 'Authentication' },
    ],
  })
  return c.json(spec)
})
```

### Documentation Generation
```typescript
// Generate comprehensive API docs
import { serve } from '@hono/swagger-ui'

// Swagger UI for RPC endpoints
app.get('/rpc/docs', serve({ url: '/rpc/openapi.json' }))
```

## Monitoring & Observability

<conditional-block task-condition="rpc-metrics|procedure-tracing|rpc-streaming|monitoring" context-check="rpc-observability-patterns">
IF task involves RPC monitoring or observability:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get RPC monitoring patterns from performance/observability.md#rpc-metrics"
  </context_fetcher_strategy>
</conditional-block>

### OpenTelemetry Integration
```typescript
// packages/api/middleware/telemetry.ts
import { os } from '@orpc/server'
import { trace, SpanStatusCode } from '@opentelemetry/api'

export const telemetryMiddleware = os.middleware(async ({ context, next }) => {
  const tracer = trace.getTracer('orpc-server')

  return tracer.startActiveSpan(`rpc.${context.procedure}`, async (span) => {
    span.setAttributes({
      'rpc.procedure': context.procedure,
      'rpc.user_id': context.user?.id,
      'rpc.tenant_id': context.tenantId,
    })

    try {
      const result = await next()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      span.setStatus({ code: SpanStatusCode.ERROR, message })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
})
```

### Custom Metrics
```typescript
// packages/api/middleware/metrics.ts
import { os } from '@orpc/server'
import { metrics } from '@workspace/infrastructure/metrics'

export const metricsMiddleware = os.middleware(async ({ context, next }) => {
  const startTime = Date.now()
  
  try {
    const result = await next()
    
    // Record success metrics
    metrics.counter('rpc.requests.total', {
      procedure: String(context.procedure),
      status: 'success',
    }).inc()
    
    metrics.histogram('rpc.request.duration', {
      procedure: String(context.procedure),
    }).observe(Date.now() - startTime)
    
    return result
  } catch (error) {
    // Record error metrics
    metrics.counter('rpc.requests.total', {
      procedure: String(context.procedure),
      status: 'error',
      error_code: error.code,
    }).inc()
    
    throw error
  }
})
```

<verification-block context-check="verification-orpc-setup">
  <verification_definitions>
    <test name="orpc_packages_installed">
      TEST: "grep -q '@orpc/server' package.json && grep -q '@orpc/client' package.json"
      REQUIRED: true
      ERROR: "oRPC packages not installed. Run: pnpm add @orpc/server @orpc/client @orpc/openapi"
      FIX_COMMAND: "pnpm add @orpc/server @orpc/client @orpc/openapi"
      DESCRIPTION: "Verifies oRPC core packages are installed"
    </test>
    
    <test name="orpc_hono_adapter_configured">
      TEST: "grep -q 'RPCHandler.*Hono\\|@orpc/server/fetch' packages/api/"
      REQUIRED: false
      ERROR: "oRPC Hono adapter not configured in packages/api"
      FIX_COMMAND: "Add RPCHandler import and setup in packages/api/index.ts"
      DESCRIPTION: "Verifies Hono adapter integration"
      DEPENDS_ON: ["orpc_packages_installed"]
    </test>
    
    <test name="orpc_procedures_directory">
      TEST: "test -d packages/api/procedures"
      REQUIRED: false
      ERROR: "oRPC procedures directory not found"
      FIX_COMMAND: "mkdir -p packages/api/procedures"
      DESCRIPTION: "Checks for oRPC procedures organization"
    </test>
    
    <test name="orpc_contracts_integration">
      TEST: "grep -r 'RouterClient\\|RPCClient\\|AppRouter' packages/contracts/"
      REQUIRED: false
      ERROR: "oRPC client types not exported from contracts"
      DESCRIPTION: "Verifies type-safe client exports"
      DEPENDS_ON: ["orpc_packages_installed"]
    </test>
    
    <test name="orpc_openapi_generation">
      TEST: "grep -q '@orpc/openapi' package.json && (test -f packages/api/openapi-from-orpc.json || rg -n 'OpenAPIGenerator|generateOpenAPIDocument' packages/api/ >/dev/null)"
      REQUIRED: false
      ERROR: "oRPC OpenAPI generation not configured"
      FIX_COMMAND: "Add OpenAPI generation using @orpc/openapi in packages/api"
      DESCRIPTION: "Checks OpenAPI spec generation from oRPC"
      DEPENDS_ON: ["orpc_packages_installed"]
    </test>
    
    <test name="orpc_testing_setup">
      TEST: "grep -q 'describe.*procedure\\|test.*RPC\\|createTRPCMsw' packages/api/__tests__/ || test -f packages/api/__tests__/procedures/"
      REQUIRED: false
      ERROR: "No RPC procedure tests found"
      FIX_COMMAND: "Create test files for RPC procedures in packages/api/__tests__/procedures/"
      DESCRIPTION: "Verifies RPC testing patterns are implemented"
      VARIABLES: ["PROJECT_TYPE"]
    </test>
    
    <test name="orpc_router_structure">
      TEST: "test -f packages/api/procedures/router.ts || grep -q 'createRouter' packages/api/procedures/"
      REQUIRED: false
      ERROR: "Main oRPC router not found"
      FIX_COMMAND: "Create packages/api/procedures/router.ts with main router assembly"
      DESCRIPTION: "Checks for main router structure"
      DEPENDS_ON: ["orpc_procedures_directory"]
    </test>
  </verification_definitions>
</verification-block>
