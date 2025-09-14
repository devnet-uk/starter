# HonoJS API Patterns

## API Structure

### Route Organization
```typescript
// api/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { postRoutes } from './routes/posts';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', compress());
app.use('*', secureHeaders());

// Mount routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/posts', postRoutes);

// Global error handler
app.onError((err, c) => {
  // Log the full error for internal diagnostics
  Logger.error('API Error', err, {
    path: c.req.path,
    method: c.req.method,
    requestId: c.get('requestId'), // Assuming a request ID middleware exists
  });
  
  // Return a sanitized, user-friendly response
  if (err instanceof ValidationError) {
    return c.json({ message: err.message, fields: err.fields }, 400);
  }
  
  if (err instanceof AuthError) {
    return c.json({ message: err.message }, 401);
  }

  if (err instanceof NotFoundError) {
    return c.json({ message: err.message }, 404);
  }
  
  return c.json({ message: 'An internal server error occurred.' }, 500);
});

export default app;
```

### Typed Routes with Zod
```typescript
// routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(12),
});

const userRoutes = new Hono()
  .post(
    '/',
    zValidator('json', createUserSchema),
    async (c) => {
      const data = c.req.valid('json');
      
      const user = await createUser(data);
      
      return c.json(user, 201);
    }
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    
    const user = await getUserById(id);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  });

export { userRoutes };
```

## oRPC Integration with Hono

### Basic oRPC Adapter Setup

oRPC integrates seamlessly with HonoJS through the fetch adapter, allowing you to run both REST and RPC endpoints in the same application:

```typescript
// api/index.ts
import { Hono } from 'hono';
import { RPCHandler } from '@orpc/server/fetch';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { appRouter } from './procedures/router';
import { userRoutes } from './routes/users';

const app = new Hono();

// Global middleware (shared between REST and RPC)
app.use('*', cors());
app.use('*', logger());

// Create oRPC handler
const rpcHandler = new RPCHandler(appRouter);

// Mount oRPC at /rpc path
app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {
      user: c.get('user'), // Share context with REST routes
      requestId: c.get('requestId'),
    }
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

### Context Sharing Pattern

Share authenticated user and request context between REST and RPC:

```typescript
// context/rpc-context.ts
export async function createRPCContext(c: Context) {
  return {
    user: c.get('user'),           // From auth middleware
    requestId: c.get('requestId'), // From request ID middleware  
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

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set('user', payload);
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
// middleware/rateLimit.ts
import { rateLimiter } from 'hono-rate-limiter';

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