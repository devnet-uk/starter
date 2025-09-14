# Frontend-Backend Integration Strategy

## Overview

This document defines how our **Feature-Sliced Design (FSD)** frontend applications integrate with **Clean Architecture** backend services through a **contract-driven development** approach. The `packages/contracts` package serves as the type-safe bridge ensuring end-to-end type safety from database to UI.

## Architecture Bridge

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (FSD)    │    │  Contracts Package  │    │ Backend (Clean Arch)│
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Pages/Features  │ │◄──►│ │ API Schemas     │ │◄──►│ │ Controllers     │ │
│ │                 │ │    │ │ (Zod)           │ │    │ │                 │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Entities (UI)   │ │◄──►│ │ Domain Types    │ │◄──►│ │ Use Cases       │ │
│ │                 │ │    │ │                 │ │    │ │                 │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Shared Utils    │ │◄──►│ │ Common Schemas  │ │◄──►│ │ Domain Models   │ │
│ │                 │ │    │ │                 │ │    │ │                 │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Contracts Package Structure

The `packages/contracts` directory implements a **zero-dependency architecture**:

```
packages/contracts/
├── api/                    # HTTP API contracts
│   ├── auth/              # Authentication endpoints
│   │   ├── login.ts       # POST /api/auth/login
│   │   ├── register.ts    # POST /api/auth/register
│   │   └── index.ts       # Re-exports
│   ├── users/             # User management endpoints
│   │   ├── create.ts      # POST /api/users
│   │   ├── get.ts         # GET /api/users/:id
│   │   ├── list.ts        # GET /api/users
│   │   └── index.ts
│   └── index.ts           # All API contracts
├── domain/                # Business domain types
│   ├── user.ts           # User entity types
│   ├── auth.ts           # Authentication types
│   └── index.ts          # Re-exports
├── schemas/              # Reusable validation schemas
│   ├── common.ts         # Common validators (UUID, email, etc.)
│   ├── pagination.ts     # Pagination schemas
│   └── index.ts          # Re-exports
└── package.json          # Zero external dependencies
```

### Zero Dependencies Principle

The contracts package **MUST NOT** depend on any other monorepo packages or external libraries except Zod:

```json
{
  "name": "@workspace/contracts",
  "dependencies": {
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "workspace:*"
  }
}
```

## Type-Safe Data Flow

### 1. Schema Definition (Contracts)

```typescript
// packages/contracts/api/users/create.ts
import { z } from 'zod'
import { UserSchema } from '../../domain/user'

// Zod 4.1.0+ with enhanced validation and OpenAPI metadata
export const CreateUserRequest = z.object({
  email: z.string().email().openapi({ 
    example: 'user@example.com',
    description: 'User email address'
  }),
  name: z.string().min(1).max(100).openapi({ 
    example: 'John Doe',
    description: 'User full name'
  }),
  role: z.enum(['admin', 'user']).default('user').openapi({
    example: 'user',
    description: 'User role in the system'
  }),
  department: z.string().optional().openapi({
    example: 'Engineering',
    description: 'User department (optional)'
  }),
}).openapi('CreateUserRequest')

export const CreateUserResponse = UserSchema.openapi('CreateUserResponse')

// Enhanced error schema with detailed field errors
export const CreateUserError = z.object({
  message: z.string().openapi({ 
    example: 'Validation failed',
    description: 'Error message'
  }),
  fields: z.record(z.array(z.string())).optional().openapi({
    example: { email: ['Invalid email format'] },
    description: 'Field-specific validation errors'
  }),
}).openapi('CreateUserError')

export type CreateUserRequest = z.infer<typeof CreateUserRequest>
export type CreateUserResponse = z.infer<typeof CreateUserResponse>
export type CreateUserError = z.infer<typeof CreateUserError>

// Enhanced API contract with full OpenAPI metadata
export const createUserContract = {
  method: 'POST' as const,
  path: '/api/users',
  summary: 'Create a new user',
  description: 'Creates a new user account with the provided information',
  tags: ['users'],
  operationId: 'createUser',
  request: CreateUserRequest,
  responses: {
    201: CreateUserResponse,
    400: CreateUserError,
    409: z.object({
      message: z.literal('User already exists'),
      conflictField: z.string(),
    }).openapi('UserConflictError'),
  },
  security: [{ bearerAuth: [] }],
} as const
```

### 2. Backend Implementation (HonoJS 4.9.4+ + Clean Architecture)

```typescript
// packages/api/controllers/users.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { CreateUserRequest, CreateUserResponse, CreateUserError, createUserContract } from '@workspace/contracts'
import { createUserUseCase } from '../use-cases/createUserUseCase'

// HonoJS 4.9.4+ with full OpenAPI integration
const usersController = new OpenAPIHono()

// Define OpenAPI route from contract
const createUserRoute = createRoute({
  method: createUserContract.method,
  path: createUserContract.path,
  summary: createUserContract.summary,
  description: createUserContract.description,
  operationId: createUserContract.operationId,
  tags: createUserContract.tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserContract.request,
        },
      },
      description: 'User data to create',
      required: true,
    },
    headers: z.object({
      authorization: z.string().openapi({
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
        description: 'Bearer token for authentication',
      }),
    }),
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createUserContract.responses[201],
        },
      },
      description: 'User created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: createUserContract.responses[400],
        },
      },
      description: 'Validation error - Invalid input data',
    },
    409: {
      content: {
        'application/json': {
          schema: createUserContract.responses[409],
        },
      },
      description: 'Conflict - User already exists',
    },
  },
  security: createUserContract.security,
})

// Type-safe route implementation
usersController.openapi(createUserRoute, async (c) => {
  const validated = c.req.valid('json') // Type: CreateUserRequest
  
  try {
    // Clean Architecture: Call use case
    const result = await createUserUseCase.execute(validated)
    
    if (result.isFailure) {
      return c.json({
        message: result.error,
        fields: result.fieldErrors || undefined,
      } satisfies CreateUserError, 400)
    }
    
    return c.json(result.value, 201) // Type: CreateUserResponse
  } catch (error) {
    if (error.code === 'USER_EXISTS') {
      return c.json({
        message: 'User already exists',
        conflictField: error.field,
      }, 409)
    }
    throw error
  }
})

export { usersController }
```

### 3. Frontend Data Fetching (TanStack Query 5.85.5+ + FSD)

```typescript
// apps/web/src/shared/api/users.ts
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { CreateUserRequest, CreateUserResponse, CreateUserError } from '@workspace/contracts'

// Enhanced API client with error handling
class UsersAPIClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        ...options?.headers
      },
      ...options,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new APIError(error, response.status)
    }
    
    return response.json()
  }
  
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  
  async getUsers(params: GetUsersRequest): Promise<GetUsersResponse> {
    const searchParams = new URLSearchParams(params as any)
    return this.request(`/api/users?${searchParams}`)
  }
}

const usersAPI = new UsersAPIClient()

// TanStack Query 5.85.5+ with Suspense support
export const usersQueryOptions = {
  all: () => ['users'] as const,
  lists: () => [...usersQueryOptions.all(), 'list'] as const,
  list: (params: GetUsersRequest) => [...usersQueryOptions.lists(), params] as const,
  details: () => [...usersQueryOptions.all(), 'detail'] as const,
  detail: (id: string) => [...usersQueryOptions.details(), id] as const,
}

// Suspense query for server-side rendering
export const getUsersQueryOptions = (params: GetUsersRequest) => 
  queryOptions({
    queryKey: usersQueryOptions.list(params),
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

// Suspense hook for React 19 streaming
export const useUsersWithSuspense = (params: GetUsersRequest) => {
  return useSuspenseQuery(getUsersQueryOptions(params))
}

// Enhanced mutation with optimistic updates
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersAPI.createUser(data),
    onMutate: async (newUser: CreateUserRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersQueryOptions.lists() })
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueriesData({ queryKey: usersQueryOptions.lists() })
      
      // Optimistically update
      queryClient.setQueriesData<GetUsersResponse>(
        { queryKey: usersQueryOptions.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            users: [
              ...old.users,
              { 
                ...newUser, 
                id: `temp-${Date.now()}`, // Temporary ID
                createdAt: new Date().toISOString(),
              } as CreateUserResponse,
            ],
          }
        }
      )
      
      return { previousUsers }
    },
    onError: (error: APIError, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      // Handle specific error types
      if (error.status === 409) {
        toast.error('User with this email already exists')
      } else if (error.status === 400) {
        const validationError = error.data as CreateUserError
        handleValidationErrors(validationError.fields)
      }
    },
    onSuccess: (user: CreateUserResponse, variables, context) => {
      // Update with real data
      queryClient.setQueriesData<GetUsersResponse>(
        { queryKey: usersQueryOptions.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            users: old.users.map(u => 
              u.id.startsWith('temp-') && u.email === user.email ? user : u
            ),
          }
        }
      )
      
      // Set individual query cache
      queryClient.setQueryData(usersQueryOptions.detail(user.id), user)
      
      toast.success('User created successfully')
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: usersQueryOptions.lists() })
    },
    retry: (failureCount, error: APIError) => {
      // Don't retry validation errors or conflicts
      if (error.status === 400 || error.status === 409) return false
      return failureCount < 3
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

### 4. Feature Implementation (FSD with React 19)

```typescript
// apps/web/src/features/create-user/ui/create-user-form.tsx
'use client'
import { useCreateUser } from '../../../shared/api/users'
import { CreateUserRequest } from '@workspace/contracts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'

export const CreateUserForm = () => {
  const { mutate: createUser, isPending, error, isError } = useCreateUser()
  
  // React Hook Form with Zod validation
  const form = useForm<CreateUserRequest>({
    resolver: zodResolver(CreateUserRequest),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  })
  
  const handleSubmit = form.handleSubmit((data) => {
    // Type is guaranteed by contract
    createUser(data, {
      onSuccess: (user) => {
        form.reset()
        // Navigate or show success message
      },
    })
  })
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          {...form.register('name')}
          type="text"
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          {...form.register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="role">Role</label>
        <select
          {...form.register('role')}
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isPending || !form.formState.isValid}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create User'}
      </button>
      
      {isError && (
        <div className="text-red-500 text-sm">
          {error?.message || 'Failed to create user'}
        </div>
      )}
    </form>
  )
}

// apps/web/src/features/user-list/ui/user-list.tsx
import { Suspense } from 'react'
import { useUsersWithSuspense } from '../../../shared/api/users'
import { GetUsersRequest } from '@workspace/contracts'

// React 19 Suspense component
export const UserList = ({ params }: { params: GetUsersRequest }) => {
  return (
    <Suspense fallback={<UserListSkeleton />}>
      <UserListContent params={params} />
    </Suspense>
  )
}

function UserListContent({ params }: { params: GetUsersRequest }) {
  // This will suspend until data is available
  const { data: users } = useUsersWithSuspense(params)
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}

// Server Component with Promise streaming (React 19)
// apps/web/src/app/users/page.tsx
import { Suspense } from 'react'
import { getUsersQueryOptions } from '../../shared/api/users'
import { UserList } from '../../features/user-list/ui/user-list'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string }
}) {
  const params = {
    page: parseInt(searchParams.page || '1'),
    search: searchParams.search || '',
  }
  
  // Prefetch data on server
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(getUsersQueryOptions(params))
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Users</h1>
        
        <div className="mb-6">
          <CreateUserForm />
        </div>
        
        <UserList params={params} />
      </div>
    </HydrationBoundary>
  )
}

function UserListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-32 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}
```

## Implementation Patterns

### API Client Generation

Generate type-safe API clients from contracts:

```typescript
// scripts/generate-api-client.ts
import { writeFileSync } from 'fs'
import * as contracts from '@workspace/contracts'

// Auto-generate client based on contracts
const generateClient = () => {
  const clientCode = Object.entries(contracts)
    .map(([name, contract]) => generateEndpoint(name, contract))
    .join('\n')
    
  writeFileSync('apps/web/src/shared/api/generated.ts', clientCode)
}
```

### OpenAPI Integration

```typescript
// packages/api/openapi.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { createRoute } from '@hono/zod-openapi'
import { createUserContract } from '@workspace/contracts'

const route = createRoute({
  method: createUserContract.method,
  path: createUserContract.path,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserContract.request,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createUserContract.responses[201],
        },
      },
      description: 'User created successfully',
    },
  },
})
```

### Database Integration (DrizzleORM 0.44.4+ + PostgreSQL 17.6)

```typescript
// packages/infrastructure/database/schema.ts
import { pgTable, uuid, varchar, timestamp, boolean, integer, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  department: varchar('department', { length: 100 }),
  emailVerified: boolean('email_verified').default(false).notNull(),
  
  // DrizzleORM 0.44.4+ $onUpdate features
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
  
  // PostgreSQL 17.6 generated columns
  searchVector: text('search_vector')
    .generatedAlwaysAs(sql`to_tsvector('english', name || ' ' || email)`, { mode: 'stored' }),
    
  // Version tracking with $onUpdateFn
  version: integer('version').default(1)
    .$onUpdateFn(() => sql`version + 1`),
  
  deletedAt: timestamp('deleted_at', { mode: 'date', precision: 3 }),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  searchIdx: index('users_search_idx').using('gin', table.searchVector),
  activeUsersIdx: index('users_active_idx')
    .on(table.email)
    .where(sql`deleted_at IS NULL`),
}))

// packages/infrastructure/repositories/user-repository.ts
import { CreateUserRequest, CreateUserResponse } from '@workspace/contracts'
import { db } from '../database'
import { users } from '../database/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export class UserRepository {
  async create(data: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // DrizzleORM 0.44.4+ with enhanced error handling
      const [user] = await db
        .insert(users)
        .values({
          ...data,
          // $onUpdate fields are handled automatically
        })
        .returning()
      
      return user // Type matches CreateUserResponse
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new UserExistsError('User with this email already exists')
      }
      throw error
    }
  }
  
  async findById(id: string): Promise<CreateUserResponse | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt)
      ))
      .limit(1)
    
    return user ?? null
  }
  
  async findByEmail(email: string): Promise<CreateUserResponse | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        isNull(users.deletedAt)
      ))
      .limit(1)
    
    return user ?? null
  }
  
  // PostgreSQL 17.6 full-text search using generated column
  async searchUsers(query: string, limit = 10): Promise<CreateUserResponse[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        sql`search_vector @@ to_tsquery('english', ${query})`,
        isNull(users.deletedAt)
      ))
      .orderBy(sql`ts_rank(search_vector, to_tsquery('english', ${query})) DESC`)
      .limit(limit)
  }
  
  async update(id: string, data: Partial<CreateUserRequest>): Promise<CreateUserResponse | null> {
    // DrizzleORM automatically handles $onUpdate fields
    const [user] = await db
      .update(users)
      .set(data) // updatedAt and version will be updated automatically
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt)
      ))
      .returning()
    
    return user ?? null
  }
  
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt)
      ))
    
    return result.rowCount > 0
  }
  
  // Batch operations with transaction
  async createMultiple(usersData: CreateUserRequest[]): Promise<CreateUserResponse[]> {
    return await db.transaction(async (tx) => {
      const results: CreateUserResponse[] = []
      
      for (const userData of usersData) {
        const [user] = await tx
          .insert(users)
          .values(userData)
          .returning()
        results.push(user)
      }
      
      return results
    })
  }
}

// Live queries for real-time updates (DrizzleORM 0.44.4+)
// packages/infrastructure/live-queries/user-live-queries.ts
import { useLiveQuery } from 'drizzle-orm/live'
import { db } from '../database'
import { users } from '../database/schema'
import { eq, isNull } from 'drizzle-orm'

export function useUsersLive() {
  const { data, error, updatedAt } = useLiveQuery(
    db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt))
  )
  
  return { users: data, error, lastUpdated: updatedAt }
}

export function useUserLive(userId: string) {
  const { data, error, updatedAt } = useLiveQuery(
    db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        isNull(users.deletedAt)
      ))
      .limit(1)
  )
  
  return { user: data?.[0], error, lastUpdated: updatedAt }
}
```

## Validation Strategy

### Three-Layer Validation

1. **Client-side validation** (UX optimization)
2. **API endpoint validation** (Security boundary)
3. **Business logic validation** (Domain rules)

```typescript
// Client-side (React Hook Form + Zod)
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CreateUserRequest } from '@workspace/contracts'

const form = useForm<CreateUserRequest>({
  resolver: zodResolver(CreateUserRequest), // Same schema as API
})

// API validation (automatic with zValidator)
app.post('/api/users', zValidator('json', CreateUserRequest), handler)

// Domain validation (business rules)
class CreateUserUseCase {
  async execute(data: CreateUserRequest) {
    // Additional business logic validation
    await this.validateBusinessRules(data)
    return this.userRepository.create(data)
  }
}
```

## Testing Strategy

### Contract Testing

```typescript
// packages/contracts/__tests__/api.test.ts
import { CreateUserRequest, CreateUserResponse } from '../api/users/create'

describe('User Creation Contract', () => {
  test('validates request schema', () => {
    const validRequest = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    }
    
    expect(CreateUserRequest.parse(validRequest)).toEqual(validRequest)
  })
  
  test('rejects invalid request', () => {
    const invalidRequest = { email: 'invalid-email' }
    
    expect(() => CreateUserRequest.parse(invalidRequest)).toThrow()
  })
})
```

### Integration Testing

```typescript
// packages/api/__tests__/integration.test.ts
import { testClient } from 'hono/testing'
import { CreateUserRequest } from '@workspace/contracts'
import { app } from '../src/app'

test('creates user with valid data', async () => {
  const client = testClient(app)
  const userData: CreateUserRequest = {
    email: 'test@example.com',
    name: 'Test User',
  }
  
  const response = await client.api.users.$post({ json: userData })
  
  expect(response.status).toBe(201)
  const user = await response.json()
  expect(user.email).toBe(userData.email)
})
```

## Deployment and Versioning

### Semantic Versioning

```json
{
  "name": "@workspace/contracts",
  "version": "1.2.0",
  "publishConfig": {
    "registry": "https://npm.company.com"
  }
}
```

### Breaking Change Management

```typescript
// packages/contracts/api/users/create.v2.ts
export const CreateUserRequestV2 = CreateUserRequest.extend({
  department: z.string().optional(), // Non-breaking addition
})

// Migration helper
export const migrateCreateUserRequest = (
  v1: CreateUserRequest
): CreateUserRequestV2 => ({
  ...v1,
  department: undefined,
})
```

## Benefits

1. **Type Safety**: End-to-end type checking from database to UI
2. **Single Source of Truth**: All API contracts defined once
3. **Automatic Validation**: Client and server use same schemas
4. **Documentation**: Self-documenting APIs via OpenAPI
5. **Refactoring Safety**: TypeScript catches breaking changes
6. **Testing**: Contract-based testing ensures compatibility
7. **Team Coordination**: Clear contracts between frontend/backend teams

## Migration Guide

### From Existing APIs

1. **Extract schemas** from existing API endpoints
2. **Create contracts** in the contracts package
3. **Update backend** to use zValidator with contracts
4. **Update frontend** to use typed API clients
5. **Add tests** to verify contract compliance

### Rollout Strategy

1. **Phase 1**: New endpoints use contracts
2. **Phase 2**: Migrate high-traffic endpoints
3. **Phase 3**: Complete migration of legacy endpoints

## Server Actions Integration (next-safe-action 8.x)

### Server Actions in Architecture

Server actions complement our contract-driven API approach by providing a direct, type-safe way to handle form submissions and user interactions. They work alongside traditional API routes but offer better DX for form-heavy applications.

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (FSD)    │    │  Server Actions     │    │ Backend (Clean Arch)│
│                     │    │  (next-safe-action) │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Form Components │ │◄──►│ │ Action Clients  │ │◄──►│ │ Use Cases       │ │
│ │ (useActionState)│ │    │ │ + Middleware    │ │    │ │                 │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Features        │ │◄──►│ │ Validation      │ │◄──►│ │ Repositories    │ │
│ │                 │ │    │ │ (Zod)           │ │    │ │                 │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Integration with Contracts Package

Server actions use the same validation schemas from our contracts package, ensuring consistency between API routes and server actions.

```typescript
// packages/contracts/actions/create-user.ts
import { z } from 'zod'
import { CreateUserRequest } from '../api/users/create'

// Reuse API contract schema for server actions
export const CreateUserActionInput = CreateUserRequest.extend({
  redirectTo: z.string().url().optional(),
})

export const CreateUserActionResult = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: CreateUserResponse,
    redirectTo: z.string().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    fieldErrors: z.record(z.array(z.string())).optional(),
  }),
])

export type CreateUserActionInput = z.infer<typeof CreateUserActionInput>
export type CreateUserActionResult = z.infer<typeof CreateUserActionResult>
```

### Server Action Implementation

```typescript
// packages/infrastructure/actions/user-actions.ts
'use server'

import { createSafeAction } from 'next-safe-action'
import { authActionClient } from './action-clients'
import { CreateUserActionInput, CreateUserActionResult } from '@workspace/contracts'
import { createUserUseCase } from '../use-cases/createUserUseCase'
import { revalidatePath, redirect } from 'next/navigation'

// Type-safe server action with authentication and rate limiting
export const createUserAction = authActionClient
  .schema(CreateUserActionInput)
  .action(async ({ parsedInput: data, ctx: { user } }): Promise<CreateUserActionResult> => {
    try {
      // Check authorization
      if (!user || user.role !== 'admin') {
        return {
          success: false,
          error: 'Insufficient permissions to create users',
        }
      }

      // Execute use case (Clean Architecture)
      const result = await createUserUseCase.execute(data)

      if (result.isFailure) {
        return {
          success: false,
          error: result.error,
          fieldErrors: result.fieldErrors,
        }
      }

      // Next.js cache revalidation
      revalidatePath('/users')
      revalidatePath(`/users/${result.value.id}`)

      // Optional redirect
      if (data.redirectTo) {
        redirect(data.redirectTo)
      }

      return {
        success: true,
        data: result.value,
      }
    } catch (error) {
      // Log error through proper logging interface
      // logger.error('Create user action failed', { error, context: 'user-creation' });
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  })

// Bulk operations with transaction support
export const createMultipleUsersAction = authActionClient
  .schema(z.object({
    users: z.array(CreateUserActionInput).min(1).max(100),
    notifyUsers: z.boolean().default(false),
  }))
  .action(async ({ parsedInput: { users, notifyUsers }, ctx: { user } }) => {
    // Authorization check
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    try {
      // Transaction-based bulk operation
      const results = await createUserUseCase.executeMultiple(users)
      
      // Background notification if requested
      if (notifyUsers) {
        await Promise.all(
          results.map(user => sendWelcomeEmail(user.email))
        )
      }

      revalidatePath('/users')

      return {
        success: true,
        data: results,
        message: `Successfully created ${results.length} users`,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create users',
      }
    }
  })
```

### Action Clients with Middleware

```typescript
// packages/infrastructure/actions/action-clients.ts
import { createSafeActionClient } from 'next-safe-action'
import { cookies } from 'next/headers'
import { auth } from '../auth/better-auth-config'
import { rateLimit } from '../middleware/rate-limit'

// Base action client
export const actionClient = createSafeActionClient({
  handleReturnedServerError: (e) => {
    // Never expose internal errors to client
    if (e instanceof ValidationError) {
      return e.message
    }
    
    // Log through proper error reporting system
    // logger.error('Server action error', { error: e, context: 'server-action' });
    return 'An unexpected error occurred'
  },
  handleServerErrorLog: (e) => {
    // Use proper logging interface instead of console
    // logger.error('Action server error', { error: e, timestamp: new Date() });
  },
  defineMetadataSchema: () => {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(false),
      rateLimit: z.object({
        requests: z.number(),
        window: z.number(), // seconds
      }).optional(),
    })
  },
})

// Authentication middleware
const authMiddleware = actionClient
  .use(async ({ next, metadata }) => {
    if (!metadata?.requiresAuth) {
      return next()
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('better-auth.session_token')?.value

    if (!sessionToken) {
      throw new Error('Authentication required')
    }

    const session = await auth.api.getSession({
      headers: { 'cookie': `better-auth.session_token=${sessionToken}` }
    })

    if (!session?.user) {
      throw new Error('Invalid session')
    }

    return next({ ctx: { user: session.user, session } })
  })

// Rate limiting middleware
const rateLimitMiddleware = authMiddleware
  .use(async ({ next, metadata, ctx }) => {
    if (metadata?.rateLimit) {
      const key = `rate_limit:${ctx.user?.id || 'anonymous'}:${metadata.actionName}`
      const allowed = await rateLimit(key, {
        requests: metadata.rateLimit.requests,
        window: metadata.rateLimit.window,
      })

      if (!allowed) {
        throw new Error('Rate limit exceeded')
      }
    }

    return next()
  })

// Pre-configured action clients
export const authActionClient = rateLimitMiddleware
  .metadata({
    requiresAuth: true,
    rateLimit: { requests: 10, window: 60 }, // 10 requests per minute
  })

export const publicActionClient = actionClient
  .metadata({
    requiresAuth: false,
    rateLimit: { requests: 5, window: 60 }, // 5 requests per minute for public actions
  })

// Admin-only action client
export const adminActionClient = authActionClient
  .use(async ({ next, ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Admin privileges required')
    }
    return next()
  })
  .metadata({
    requiresAuth: true,
    rateLimit: { requests: 50, window: 60 }, // Higher limits for admins
  })
```

### Frontend Integration with React 19

```typescript
// apps/web/src/features/create-user/ui/create-user-form.tsx
'use client'

import { useActionState, useOptimistic, startTransition } from 'react'
import { createUserAction } from '@workspace/infrastructure/actions/user-actions'
import { CreateUserActionInput } from '@workspace/contracts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function CreateUserForm() {
  // React 19 useActionState for server actions
  const [actionResult, formAction, isPending] = useActionState(
    createUserAction,
    null
  )

  // React Hook Form with contract validation
  const form = useForm<CreateUserActionInput>({
    resolver: zodResolver(CreateUserActionInput),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  })

  // Optimistic updates with React 19
  const [optimisticUsers, addOptimisticUser] = useOptimistic(
    [], // initial state
    (state, newUser: CreateUserActionInput) => [
      ...state,
      { ...newUser, id: `temp-${Date.now()}`, status: 'creating' }
    ]
  )

  const handleSubmit = form.handleSubmit((data) => {
    // Add optimistic update
    startTransition(() => {
      addOptimisticUser(data)
    })

    // Submit server action
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    
    formAction(formData)
  })

  // Handle server action result
  React.useEffect(() => {
    if (actionResult?.success) {
      form.reset()
      toast.success('User created successfully')
    } else if (actionResult?.fieldErrors) {
      // Set field errors from server validation
      Object.entries(actionResult.fieldErrors).forEach(([field, errors]) => {
        form.setError(field as keyof CreateUserActionInput, {
          message: errors[0],
        })
      })
    } else if (actionResult?.error) {
      toast.error(actionResult.error)
    }
  }, [actionResult, form])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          {...form.register('name')}
          type="text"
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          {...form.register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select
          {...form.register('role')}
          className="w-full px-3 py-2 border rounded"
          disabled={isPending}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending || !form.formState.isValid}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create User'}
      </button>

      {/* Display optimistic updates */}
      {optimisticUsers.length > 0 && (
        <div className="mt-4">
          <h3>Creating users...</h3>
          {optimisticUsers.map((user, index) => (
            <div key={index} className="text-gray-600">
              {user.name} ({user.email}) - {user.status}
            </div>
          ))}
        </div>
      )}
    </form>
  )
}
```

### Server Actions vs API Routes

| Aspect | Server Actions | API Routes |
|--------|---------------|------------|
| **Use Case** | Form submissions, user interactions | Data fetching, external integrations |
| **Type Safety** | Full end-to-end with next-safe-action | Contract-based with Zod validation |
| **Caching** | Automatic with revalidatePath/Tag | Manual with Next.js cache |
| **Error Handling** | Built-in with next-safe-action | Custom error boundaries |
| **Progressive Enhancement** | Native support | Requires JavaScript |
| **Performance** | Direct server execution | Network round trip |
| **Authentication** | Middleware-based | Route-level guards |
| **Rate Limiting** | Per-action middleware | Per-route middleware |

### Best Practices

1. **Use server actions for**:
   - Form submissions and mutations
   - User-initiated actions (create, update, delete)
   - Actions that benefit from progressive enhancement

2. **Use API routes for**:
   - Data fetching and queries  
   - External API integrations
   - Complex data transformations
   - Third-party webhook handlers

3. **Security considerations**:
   - Always validate input with Zod schemas
   - Implement authentication middleware
   - Use rate limiting for all actions
   - Sanitize error messages
   - Log security-relevant events

4. **Performance optimizations**:
   - Use optimistic updates for better UX
   - Implement proper cache revalidation
   - Batch operations when possible
   - Consider background processing for heavy operations

## Authentication Integration (Better-Auth 1.3.7+)

### Enhanced Session Management

```typescript
// packages/infrastructure/auth/better-auth-config.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../database"
import { 
  accounts, 
  sessions, 
  users, 
  verificationTokens 
} from "../database/auth-schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users,
      accounts,
      sessions,
      verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
  },
  plugins: [
    twoFactor({
      issuer: "MyApp",
    }),
    openAPI({
      path: "/api/auth/reference",
      tags: ["Authentication"],
    }),
  ],
})

// Type exports for contract integration
export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.User
```

### Contract Integration with Authentication

```typescript
// packages/contracts/auth/session.ts
import { z } from 'zod'

export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'user']),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
}).openapi('SessionUser')

export const GetSessionResponse = z.object({
  user: SessionUserSchema.nullable(),
  session: z.object({
    id: z.string(),
    expiresAt: z.string().datetime(),
    token: z.string(),
  }).nullable(),
}).openapi('GetSessionResponse')

// Server-side session validation
export const validateSessionContract = {
  method: 'GET' as const,
  path: '/api/auth/session',
  summary: 'Get current user session',
  responses: {
    200: GetSessionResponse,
    401: z.object({
      message: z.literal('Unauthorized'),
    }),
  },
} as const
```

### React 19 Server Components with Auth

```typescript
// apps/web/src/app/auth/session-provider.tsx
import { auth } from '@workspace/infrastructure/auth'
import { headers } from 'next/headers'

export async function getServerSession() {
  const headersList = headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })
  
  return session
}

// apps/web/src/app/layout.tsx (Server Component)
import { getServerSession } from './auth/session-provider'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  return (
    <html>
      <body>
        <ClientSessionProvider session={session}>
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  )
}

// Client-side session management
// apps/web/src/shared/auth/use-session.tsx
'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from './auth-client'

export const useSession = () => {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.session.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: true,
  })
}

export const useSignOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(['session'], null)
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
}
```

## oRPC Integration Patterns

### Contract-Driven RPC Development

oRPC follows the same contract-first principles as our REST APIs, using shared Zod schemas for end-to-end type safety:

```typescript
// packages/contracts/rpc/routers/users.ts
import { z } from 'zod'
import { UserSchema, CreateUserSchema } from '../../schemas/user'

export const usersRPCContract = {
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
```

### RPC Router Organization in packages/api

oRPC procedures are organized alongside REST controllers:

```
packages/api/
├── controllers/     # REST endpoints
├── procedures/      # oRPC procedures  
│   ├── users/
│   │   └── router.ts
│   ├── auth/
│   │   └── router.ts
│   └── router.ts    # Main router assembly
├── middleware/      # Shared between REST & RPC
└── routes/          # REST route definitions
```

### Shared Zod Schemas Between REST and RPC

Both REST and RPC endpoints use the same validation schemas from the contracts package:

```typescript
// packages/api/procedures/users/router.ts
import { CreateUserSchema, UpdateUserSchema, UserSchema } from '@workspace/contracts'

export const usersRouter = createRouter({
  create: createProcedure
    .input(CreateUserSchema)  // Same schema as REST
    .output(UserSchema)       // Same schema as REST
    .mutation(async ({ input, ctx }) => {
      return await ctx.createUserUseCase.execute(input)
    }),
})

// packages/api/controllers/users.ts  
app.post('/', zValidator('json', CreateUserSchema), async (c) => {
  const data = c.req.valid('json') // Same validation as RPC
  return c.json(await createUserUseCase.execute(data))
})
```

### Type-Safe Client Generation

The contracts package exports typed clients for frontend consumption:

```typescript
// packages/contracts/rpc/clients/index.ts
import type { AppRouter } from '../../../api/procedures/router'
export type { AppRouter }

export function createTypedRPCClient(baseUrl: string) {
  return createClient<AppRouter>(`${baseUrl}/rpc`)
}

// Frontend usage (apps/web/src/shared/api/rpc-client.ts)
import { createTypedRPCClient } from '@workspace/contracts/rpc/clients'
export const rpcClient = createTypedRPCClient(process.env.NEXT_PUBLIC_API_URL!)
```

### Migration Path from REST to RPC

1. **Parallel Implementation**: Create RPC procedures alongside existing REST endpoints
2. **Gradual Frontend Migration**: Switch frontend calls one feature at a time
3. **Feature Flags**: Use feature flags to control RPC vs REST usage
4. **Shared Business Logic**: Both REST and RPC use the same use cases and repositories

```typescript
// Migration strategy example
export function useUserApi(id: string, useRPC = false) {
  if (useRPC && isFeatureEnabled('rpc-users')) {
    return useRPCUser(id)
  }
  return useRESTUser(id)  // Fallback to REST
}
```

### RPC vs REST Decision Matrix

| Scenario | Pattern | Reason |
|----------|---------|---------|
| Public API for mobile app | REST | External consumers, HTTP semantics |
| Admin dashboard internal calls | oRPC | Type safety, rapid development |
| Real-time chat features | oRPC | Built-in streaming support |
| Webhook endpoints | REST | External systems expect HTTP |
| Form submissions | Server Actions | Progressive enhancement |
| Service-to-service calls | oRPC | Type safety, performance |

This integration strategy ensures our frontend and backend remain loosely coupled yet type-safe, enabling independent development while maintaining data consistency, API reliability, and secure authentication flows across both REST and RPC patterns.

## Integration Verification

<verification-block context-check="integration-rpc-verification">
  <verification_definitions>
    <test name="contract_driven_development">
      TEST: "test -d packages/contracts && grep -r 'z\\.' packages/contracts/ | head -3"
      REQUIRED: true
      ERROR: "Contract-driven development not implemented. Create shared Zod schemas in packages/contracts."
      DESCRIPTION: "Verifies shared contract definitions exist between REST and RPC"
    </test>
    
    <test name="rpc_rest_coexistence">
      TEST: "grep -r 'RPCHandler\\|orpc' packages/api/ && grep -r 'app\\.get\\|app\\.post' packages/api/"
      REQUIRED: false
      ERROR: "RPC and REST patterns should coexist in packages/api"
      DESCRIPTION: "Ensures both REST and RPC endpoints are available"
      DEPENDS_ON: ["contract_driven_development"]
    </test>
    
    <test name="shared_middleware_integration">
      TEST: "grep -r 'middleware.*auth\\|auth.*middleware' packages/api/ && grep -r 'use.*middleware' packages/api/"
      REQUIRED: true
      ERROR: "Shared middleware not properly integrated across REST and RPC"
      DESCRIPTION: "Verifies authentication and security middleware is shared"
    </test>
    
    <test name="client_side_abstraction">
      TEST: "grep -r 'useRPC\\|useREST\\|createClient' packages/frontend/src/"
      REQUIRED: false
      ERROR: "Client-side abstraction layer not implemented"
      FIX_COMMAND: "Create abstraction hooks that can switch between REST and RPC clients"
      DESCRIPTION: "Checks for unified client interface patterns"
    </test>
    
    <test name="migration_path_documentation">
      TEST: "grep -r 'migration\\|gradual.*adoption\\|feature.*flag' docs/ | head -3"
      REQUIRED: false
      ERROR: "Migration documentation not found"
      DESCRIPTION: "Verifies gradual migration strategies are documented"
    </test>
    
    <test name="integration_testing">
      TEST: "test -d __tests__/integration || grep -r 'integration.*test\\|e2e.*test' __tests__/"
      REQUIRED: false
      ERROR: "Integration tests for REST/RPC interoperability not found"
      FIX_COMMAND: "Create integration tests that verify both REST and RPC work together"
      DESCRIPTION: "Ensures end-to-end testing covers both patterns"
      VARIABLES: ["PROJECT_COVERAGE"]
    </test>
  </verification_definitions>
</verification-block>