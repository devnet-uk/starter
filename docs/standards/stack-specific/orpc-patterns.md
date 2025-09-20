# oRPC Patterns

<!-- 
Routing: This standard is reached via:
1. Root: "orpc|rpc|procedure" -> stack-specific dispatcher
2. Stack-specific: "orpc|rpc|procedure|type-safe-api|streaming-api" -> this file
3. Alternative: Architecture -> integration -> RPC patterns section
-->

## Overview

oRPC is a modern, type-safe RPC framework that provides end-to-end type safety with first-class OpenAPI support. It integrates seamlessly with our existing HonoJS infrastructure while offering enhanced type inference and reduced boilerplate compared to traditional REST APIs.

We keep this standard as a living reference so every team can reuse the same contract-first patterns, even though Engineering OS itself does not ship product features. When the upstream project evolves, refresh the guidance here instead of scattering one-off tips in implementation repos.

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
import { implement } from '@orpc/server'
import { appContract } from '@workspace/contracts/rpc/app.contract'

const os = implement(appContract)

export const getById = os.users.getById
  .handler(async ({ input, context }) => {
    return await context.userRepository.findById(input.id)
  })

export const list = os.users.list
  .handler(async ({ input, context }) => {
    const result = await context.userRepository.findPaginated(input)
    return {
      items: result.items,
      nextCursor: result.nextCursor,
    }
  })

export const create = os.users.create
  .handler(async ({ input, context }) => {
    return await context.createUserUseCase.execute(input)
  })

export const update = os.users.update
  .handler(async ({ input, context }) => {
    const { id, ...data } = input
    return await context.updateUserUseCase.execute(id, data)
  })

export const watchUser = os.users.watchUser
  .handler(async ({ input, context }) => {
    return context.userEventStream.watchUser(input.id)
  })
```

### Main Router Assembly
```typescript
// packages/api/procedures/router.ts
import { implement } from '@orpc/server'
import { appContract } from '@workspace/contracts/rpc/app.contract'
import * as users from './users/router'
import * as auth from './auth/router'
import * as posts from './posts/router'

const os = implement(appContract)

export const appRouter = os.router({
  users: {
    getById: users.getById,
    list: users.list,
    create: users.create,
    update: users.update,
    watchUser: users.watchUser,
  },
  auth: auth.router,
  posts: posts.router,
})

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

### RPC Router Contract Definition (recommended)
```typescript
// packages/contracts/rpc/users.contract.ts
import { oc } from '@orpc/contract'
import { z } from 'zod'
import { UserSchema, CreateUserSchema, UpdateUserSchema } from '../schemas/user'

export const usersContract = {
  getById: oc
    .input(z.object({ id: z.string().uuid() }))
    .output(UserSchema),

  list: oc
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .output(z.object({
      items: z.array(UserSchema),
      nextCursor: z.string().uuid().optional(),
    })),

  create: oc
    .input(CreateUserSchema)
    .output(UserSchema),

  update: oc
    .input(UpdateUserSchema.extend({ id: z.string().uuid() }))
    .output(UserSchema),

  watchUser: oc
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any()), // Replace with DurableEventIterator output when streaming is implemented
} as const

export const appContract = {
  users: usersContract,
} as const

export type UsersContract = typeof usersContract
export type AppContract = typeof appContract
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
import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient } from '@orpc/client'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppRouter } from '@workspace/contracts/rpc/clients'

const link = new RPCLink({
  url: '/rpc',
  headers: () => ({
    Authorization: `Bearer ${getAuthToken()}`,
  }),
})

const client = createORPCClient<AppRouter>(link)
export const orpc = createTanstackQueryUtils(client)

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUser(id: string) {
  return useSuspenseQuery(
    orpc.users.getById.queryOptions({
      input: { id },
      enabled: !!id,
    }),
  )
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.users.create.mutationOptions({
      onSuccess: (user) => {
        queryClient.invalidateQueries({ queryKey: orpc.users.key() })
        queryClient.setQueryData(orpc.users.getById.key({ input: { id: user.id } }), user)
      },
    }),
  )
}
```

### Next.js SSR Instrumentation
```typescript
// apps/web/src/instrumentation.ts
import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '@workspace/contracts/rpc/clients'

declare global {
  // Share the server-side client across requests during SSR
  // eslint-disable-next-line no-var
  var $client: RouterClient<AppRouter> | undefined
}

export async function register() {
  globalThis.$client = createORPCClient<AppRouter>(
    new RPCLink({
      url: process.env.NEXT_PUBLIC_ORIGIN ? `${process.env.NEXT_PUBLIC_ORIGIN}/rpc` : '/rpc',
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    }),
  )
}

// apps/web/src/lib/orpc.client.ts
import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '@workspace/contracts/rpc/clients'

const browserLink = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${window.location.origin}/rpc`
  },
})

export const client: RouterClient<AppRouter> =
  globalThis.$client ?? createORPCClient<AppRouter>(browserLink)
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
import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'

const errorBase = os.errors({
  VALIDATION_ERROR: {
    data: z.object({ fieldErrors: z.record(z.string(), z.array(z.string())).optional() }),
  },
  NOT_FOUND: {},
  INTERNAL_ERROR: {},
})

export const errorHandler = errorBase.middleware(async ({ next, errors }) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof ValidationError) {
      throw errors.VALIDATION_ERROR({
        message: error.message,
        data: { fieldErrors: error.fieldErrors },
      })
    }

    if (error instanceof NotFoundError) {
      throw errors.NOT_FOUND({
        message: error.message,
      })
    }

    console.error('RPC Internal Error:', error)
    throw new ORPCError('INTERNAL_ERROR', {
      message: 'An internal server error occurred',
    })
  }
})
```

### Frontend Error Handling
```typescript
import { createSafeClient, isDefinedError } from '@orpc/client'
import { client } from './rpc-client'

const safeClient = createSafeClient(client)

export async function submitUser(input: CreateUser) {
  const { error, data } = await safeClient.users.create(input)

  if (error) {
    if (isDefinedError(error) && error.code === 'VALIDATION_ERROR') {
      return handleValidationError(error.data?.fieldErrors)
    }

    if (isDefinedError(error) && error.code === 'NOT_FOUND') {
      return handleNotFoundError()
    }

    return showGenericError()
  }

  return data
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
import { call } from '@orpc/server'
import { getById, create } from '../procedures/users/router'
import { createMockContext } from '../__mocks__/context'

describe('Users RPC Router', () => {
  let mockContext: ReturnType<typeof createMockContext>

  beforeEach(() => {
    mockContext = createMockContext()
  })

  test('getById returns user when found', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
    mockContext.userRepository.findById.mockResolvedValue(mockUser)

    const result = await call(getById, {
      input: { id: '1' },
      context: mockContext,
    })

    expect(result).toEqual(mockUser)
    expect(mockContext.userRepository.findById).toHaveBeenCalledWith('1')
  })

  test('create validates input and calls use case', async () => {
    const input = { name: 'New User', email: 'new@example.com' }
    const createdUser = { id: '2', ...input }

    mockContext.createUserUseCase.execute.mockResolvedValue(createdUser)

    const result = await call(create, {
      input,
      context: mockContext,
    })

    expect(result).toEqual(createdUser)
    expect(mockContext.createUserUseCase.execute).toHaveBeenCalledWith(input)
  })
})
```

### Integration Testing with RPCHandler
```typescript
// packages/api/__tests__/integration/rpc.test.ts
import { RPCHandler } from '@orpc/server/fetch'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { appRouter } from '../procedures/router'
import { createContext } from '../context'

const handler = new RPCHandler(appRouter, {
  createContext: async (request) => createContext({ request }),
})

function createTestClient() {
  return createORPCClient<typeof appRouter>(
    new RPCLink({
      url: 'http://test/rpc',
      fetch: async (input, init) => {
        const request = new Request(typeof input === 'string' ? input : input.url, init)
        const { matched, response } = await handler.handle(request, { prefix: '/rpc' })

        if (!matched) {
          throw new Error('Request did not match RPC handler')
        }

        return response
      },
    }),
  )
}

test('full RPC flow with real handler', async () => {
  const client = createTestClient()
  const user = await client.users.getById({ id: '1' })

  expect(user).toMatchObject({ id: '1' })
})
```

### Contract Testing
```typescript
// Ensure client and server contracts match
import { appContract } from '@workspace/contracts/rpc/app.contract'
import { appRouter } from '../procedures/router'

test('client contract matches server implementation', () => {
  const implementedProcedures = Object.keys(appRouter.users)
  const contractProcedures = Object.keys(appContract.users)

  expect(implementedProcedures.sort()).toEqual(contractProcedures.sort())
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
// packages/api/handler.ts
import { RPCHandler } from '@orpc/server/fetch'
import { withOtel } from '@orpc/otel'
import { appRouter } from './procedures/router'

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [withOtel()],
})

// packages/observability/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ORPCInstrumentation } from '@orpc/otel'

export const sdk = new NodeSDK({
  instrumentations: [new ORPCInstrumentation()],
})

void sdk.start()
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
      TEST: "rg -q '@orpc/server' package.json && rg -q '@orpc/client' package.json && rg -q '@orpc/contract' package.json"
      REQUIRED: true
      ERROR: "oRPC packages not installed. Run: pnpm add @orpc/server @orpc/client @orpc/openapi @orpc/contract"
      FIX_COMMAND: "pnpm add @orpc/server @orpc/client @orpc/openapi @orpc/contract"
      DESCRIPTION: "Verifies oRPC core + contract packages are installed"
    </test>
    
    <test name="orpc_hono_adapter_configured">
      TEST: "rg -q '@orpc/server/fetch' packages/api"
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
      TEST: "rg -q '@orpc/contract' packages/contracts"
      REQUIRED: false
      ERROR: "oRPC client types not exported from contracts"
      DESCRIPTION: "Verifies type-safe client exports"
      DEPENDS_ON: ["orpc_packages_installed"]
    </test>
    
    <test name="orpc_openapi_generation">
      TEST: "rg -q '@orpc/openapi' package.json && (test -f packages/api/openapi-from-orpc.json || rg -n 'OpenAPIGenerator|withOpenAPI' packages/api/ >/dev/null)"
      REQUIRED: false
      ERROR: "oRPC OpenAPI generation not configured"
      FIX_COMMAND: "Add OpenAPI generation using @orpc/openapi in packages/api"
      DESCRIPTION: "Checks OpenAPI spec generation from oRPC"
      DEPENDS_ON: ["orpc_packages_installed"]
    </test>
    
    <test name="orpc_testing_setup">
      TEST: "rg -q 'from \'@orpc/server\'.*call' packages/api/__tests__ || rg -q 'RPCHandler' packages/api/__tests__ || test -f packages/api/__tests__/procedures/"
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
