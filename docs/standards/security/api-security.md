# API Security

## Input Validation

### Zod Schemas
```typescript
// schemas/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase()),
  
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  
  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name'),
  
  age: z.number()
    .int('Age must be whole number')
    .min(13, 'Must be at least 13')
    .max(120, 'Invalid age')
});

// Strict parsing
export function validateCreateUser(data: unknown) {
  return createUserSchema.parse(data); // Throws on invalid
}

// Safe parsing
export function safeValidateCreateUser(data: unknown) {
  return createUserSchema.safeParse(data); // Returns result object
}
```

### SQL Injection Prevention
```typescript
// ✅ Using Drizzle ORM (parameterized queries)
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, userInput));

// ✅ Using prepared statements
const statement = db.prepare(
  'SELECT * FROM users WHERE email = $1'
);
const result = await statement.execute([userInput]);

// ❌ Never do this
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

## Rate Limiting

### API Rate Limiter
```typescript
// middleware/rateLimit.ts
import { Hono } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  
  keyGenerator: (c) => {
    return c.req.header('x-forwarded-for') || 
           c.req.header('x-real-ip') || 
           'unknown';
  },
  
  handler: (c) => {
    return c.json({
      error: 'Too many requests, please try again later.'
    }, 429);
  },
  
  skip: (c) => {
    // Skip rate limiting for admin users
    const user = c.get('user');
    return user?.role === 'admin';
  }
});

// Apply different limits to different routes
export const strictLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5, // Only 5 requests per window for auth routes
});

app.use('/api/auth/*', strictLimiter);
app.use('/api/*', limiter);
```

### DDoS Protection
```typescript
// middleware/ddos.ts
const requestCounts = new Map<string, number>();

export function ddosProtection(threshold = 50) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const key = `${ip}:${Date.now() / 1000 | 0}`; // Per second
    
    const count = (requestCounts.get(key) || 0) + 1;
    requestCounts.set(key, count);
    
    // Clean old entries
    if (Math.random() < 0.01) {
      const now = Date.now() / 1000 | 0;
      for (const [k] of requestCounts) {
        const time = parseInt(k.split(':')[1]);
        if (now - time > 60) {
          requestCounts.delete(k);
        }
      }
    }
    
    if (count > threshold) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    return next();
  };
}
```

## CORS Configuration

### Strict CORS Policy
```typescript
// middleware/cors.ts
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://app.yourdomain.com',
      'https://staging.yourdomain.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    return allowedOrigins.includes(origin) ? origin : null;
  },
  
  credentials: true,
  
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],
  
  exposeHeaders: ['X-Total-Count', 'X-Page-Count'],
  
  maxAge: 86400, // 24 hours
});
```

## API Key Management

### Secure API Keys
```typescript
// lib/apiKey.ts
import crypto from 'crypto';

export class ApiKeyManager {
  // Generate secure API key
  static generate(): string {
    const prefix = 'sk_live_';
    const key = crypto.randomBytes(32).toString('base64url');
    return `${prefix}${key}`;
  }
  
  // Hash API key for storage
  static hash(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
  }
  
  // Verify API key
  static async verify(providedKey: string): Promise<boolean> {
    const hashedKey = this.hash(providedKey);
    
    const validKey = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.hashedKey, hashedKey))
      .limit(1);
    
    if (!validKey[0]) return false;
    
    // Check if expired
    if (validKey[0].expiresAt && validKey[0].expiresAt < new Date()) {
      return false;
    }
    
    // Update last used
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, validKey[0].id));
    
    return true;
  }
}

// Middleware to validate API key
export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }
  
  const valid = await ApiKeyManager.verify(apiKey);
  
  if (!valid) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  return next();
}
```

## OWASP Top 10 Protection

### Security Checklist
```typescript
// security/checklist.ts
export const securityChecklist = {
  // A01: Broken Access Control
  accessControl: {
    implemented: ['RBAC', 'JWT validation', 'Session management'],
    middleware: 'auth.middleware.ts'
  },
  
  // A02: Cryptographic Failures
  cryptography: {
    passwordHashing: 'argon2id',
    dataEncryption: 'AES-256-GCM',
    tlsVersion: '1.3'
  },
  
  // A03: Injection
  injection: {
    sqlPrevention: 'Parameterized queries via Drizzle',
    inputValidation: 'Zod schemas',
    commandInjection: 'No shell command execution'
  },
  
  // A04: Insecure Design
  design: {
    threatModeling: true,
    securityReviews: true,
    principleOfLeastPrivilege: true
  },
  
  // A05: Security Misconfiguration
  configuration: {
    headers: 'Security headers configured',
    errorHandling: 'Generic error messages',
    defaultDeny: true
  },
  
  // A06: Vulnerable Components
  components: {
    dependencyScanning: 'Snyk, npm audit',
    updateSchedule: 'Monthly',
    sbom: true // Software Bill of Materials
  },
  
  // A07: Identification and Authentication
  authentication: {
    mfa: 'TOTP, WebAuthn',
    passwordPolicy: 'zxcvbn score >= 3',
    sessionTimeout: '7 days'
  },
  
  // A08: Software and Data Integrity
  integrity: {
    codeSignatures: true,
    cicd: 'Protected branches, signed commits',
    backups: 'Daily with encryption'
  },
  
  // A09: Logging and Monitoring
  logging: {
    securityEvents: true,
    auditTrail: true,
    monitoring: 'Sentry, CloudWatch'
  },
  
  // A10: SSRF
  ssrf: {
    urlValidation: true,
    allowlist: true,
    internalNetworkBlocked: true
  }
};
```

## Server Actions Security

<conditional-block task-condition="server-action-security|action-validation|server-auth" context-check="api-security-server-actions">
IF task involves server action security:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get server action security section from security/api-security.md"
  </context_fetcher_strategy>
</conditional-block>

### Server Actions vs API Routes Comparison

```typescript
// API Route Security (Traditional)
// /api/users/[id]/route.ts
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  // Manual authentication check
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Manual input validation
  const body = await req.json();
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error }, 
      { status: 400 }
    );
  }
  
  // Manual rate limiting
  await checkRateLimit(session.user.id, 'update-user');
  
  // Business logic
  const user = await updateUser(params.id, result.data);
  return NextResponse.json(user);
}

// Server Action Security (Next-Safe-Action)
// actions/user-actions.ts
export const updateUser = authActionClient
  .metadata({ actionName: "updateUser", rateLimit: 5 })
  .inputSchema(updateUserSchema) // Automatic validation
  .action(async ({ parsedInput, ctx }) => {
    // Authentication and rate limiting handled by middleware
    // Input already validated and typed
    const user = await updateUserInDatabase(ctx.user.id, parsedInput);
    return { success: true, user };
  });
```

### Key Security Differences

| Aspect | API Routes | Server Actions (with next-safe-action) |
|--------|------------|----------------------------------------|
| **Input Validation** | Manual validation required | Automatic with Zod schemas |
| **Authentication** | Manual session checks | Middleware-based authentication |
| **Rate Limiting** | Custom implementation needed | Built-in middleware support |
| **Error Handling** | Manual error response formatting | Consistent error handling |
| **Type Safety** | Limited TypeScript integration | End-to-end type safety |
| **CSRF Protection** | Manual CSRF token validation | Built-in CSRF protection |
| **Public Endpoints** | ⚠️ All API routes are public | ⚠️ All server actions are public |

### Server Action Security Best Practices

#### 1. Always Use Validation Middleware
```typescript
// ✅ Proper server action with validation
export const createPost = authActionClient
  .metadata({ actionName: "createPost", requiresAuth: true })
  .inputSchema(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(10000),
    tags: z.array(z.string()).max(10),
  }))
  .action(async ({ parsedInput, ctx }) => {
    // Input is guaranteed to be validated
    const post = await createPostInDatabase({
      ...parsedInput,
      authorId: ctx.user.id,
    });
    
    revalidatePath('/posts');
    return { success: true, postId: post.id };
  });

// ❌ Unsafe server action without validation
export async function unsafeCreatePost(formData: FormData) {
  "use server";
  
  // No authentication check!
  // No input validation!
  const title = formData.get('title') as string; // Could be null/malicious
  const content = formData.get('content') as string;
  
  // Vulnerable to injection attacks
  await db.execute(`INSERT INTO posts (title, content) VALUES ('${title}', '${content}')`);
}
```

#### 2. Implement Proper Authentication Chains
```typescript
// Layered authentication for sensitive operations
export const deleteUser = actionClient
  .use(authMiddleware) // Basic authentication
  .use(requirePermission('user', 'delete')) // Permission check
  .use(requireOwnershipOrAdmin) // Ownership validation
  .metadata({ actionName: "deleteUser", rateLimit: 2 })
  .inputSchema(z.object({
    userId: z.string().uuid(),
    reason: z.string().min(10).max(500),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, reason } = parsedInput;
    
    // Additional security: prevent self-deletion for admins
    if (ctx.user.role === 'admin' && userId === ctx.user.id) {
      throw new ActionError("Admins cannot delete their own accounts", true);
    }
    
    // Log security event
    await logSecurityEvent({
      action: 'user_deletion',
      performedBy: ctx.user.id,
      targetUser: userId,
      reason,
      timestamp: new Date(),
    });
    
    await deleteUserFromDatabase(userId);
    
    revalidatePath('/admin/users');
    return { success: true };
  });
```

#### 3. Rate Limiting for Server Actions
```typescript
// Advanced rate limiting with Redis
const serverActionRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: (req) => {
    // Different limits based on action type
    const action = req.headers.get('x-action-name');
    
    switch (action) {
      case 'login':
      case 'register':
        return 5; // Very strict for auth
      case 'upload':
        return 10; // Moderate for uploads
      case 'search':
        return 100; // More lenient for reads
      default:
        return 30; // Default limit
    }
  },
  keyGenerator: (req) => {
    // Use combination of IP and user ID if available
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userId = req.headers.get('x-user-id');
    return userId ? `${userId}:${ip}` : ip;
  },
  standardHeaders: true,
});

// Apply to all server actions via middleware
export const rateLimitedActionClient = actionClient
  .use(async ({ next, metadata }) => {
    // Server-side rate limiting logic
    await enforceRateLimit(metadata.actionName);
    return next();
  });
```

#### 4. Secure File Upload Actions
```typescript
// Comprehensive file upload security
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const uploadFile = authActionClient
  .metadata({ actionName: "uploadFile", rateLimit: 5 })
  .inputSchema(zfd.formData({
    file: zfd.file(z.instanceof(File)
      .refine(file => file.size > 0 && file.size <= MAX_FILE_SIZE, 
        `File must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      .refine(file => ALLOWED_TYPES.includes(file.type), 
        `File type must be one of: ${ALLOWED_TYPES.join(', ')}`)
      .refine(async (file) => {
        // Virus scan integration
        return await scanFileForMalware(file);
      }, 'File failed security scan')),
    category: z.enum(['avatar', 'document', 'media']),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { file, category } = parsedInput;
    
    // Additional security checks
    const fileBuffer = await file.arrayBuffer();
    const fileSignature = getFileSignature(fileBuffer);
    
    if (!isValidFileType(fileSignature, file.type)) {
      throw new ActionError("File signature doesn't match declared type", true);
    }
    
    // Generate secure storage path
    const fileName = generateSecureFileName(file.name);
    const storagePath = `uploads/${ctx.user.id}/${category}/${fileName}`;
    
    // Upload with access controls
    const result = await uploadToSecureStorage(file, storagePath, {
      userId: ctx.user.id,
      contentType: file.type,
      category,
    });
    
    // Log upload event
    await logFileUpload({
      userId: ctx.user.id,
      fileName: file.name,
      fileSize: file.size,
      category,
      storagePath: result.path,
    });
    
    return {
      fileId: result.fileId,
      url: result.publicUrl,
      fileName,
    };
  });
```

### Security Monitoring for Server Actions

#### Action Security Metrics Dashboard
```typescript
// Monitoring middleware for security events
export const securityMonitoringMiddleware = createMiddleware()
  .define(async ({ next, clientInput, metadata }) => {
    const startTime = Date.now();
    const actionName = metadata.actionName;
    
    try {
      const result = await next();
      
      // Log successful action
      await logActionMetric({
        action: actionName,
        success: true,
        duration: Date.now() - startTime,
        userId: ctx.user?.id,
        timestamp: new Date(),
      });
      
      return result;
      
    } catch (error) {
      // Log security events
      const isSecurityError = error instanceof ActionError || 
                            error.message.includes('Unauthorized') ||
                            error.message.includes('Rate limit');
      
      if (isSecurityError) {
        await logSecurityEvent({
          type: 'action_security_violation',
          action: actionName,
          error: error.message,
          userId: ctx.user?.id,
          clientInput: sanitizeInputForLogging(clientInput),
          severity: getSeverityLevel(error),
          timestamp: new Date(),
        });
        
        // Alert for critical security events
        if (getSeverityLevel(error) === 'critical') {
          await sendSecurityAlert({
            type: 'critical_action_failure',
            action: actionName,
            error: error.message,
            userId: ctx.user?.id,
          });
        }
      }
      
      throw error;
    }
  });

// Security event analysis
interface SecurityMetrics {
  totalActions: number;
  failedActions: number;
  rateLimitViolations: number;
  authFailures: number;
  suspiciousPatterns: string[];
  topFailedActions: Array<{ action: string; count: number }>;
}

export async function generateSecurityReport(
  timeframe: 'hour' | 'day' | 'week' = 'day'
): Promise<SecurityMetrics> {
  const since = getTimeframeBoundary(timeframe);
  
  const events = await db
    .select()
    .from(securityEvents)
    .where(gte(securityEvents.timestamp, since));
  
  return {
    totalActions: events.length,
    failedActions: events.filter(e => !e.success).length,
    rateLimitViolations: events.filter(e => 
      e.error?.includes('Rate limit')).length,
    authFailures: events.filter(e => 
      e.error?.includes('Unauthorized')).length,
    suspiciousPatterns: detectSuspiciousPatterns(events),
    topFailedActions: getTopFailedActions(events),
  };
}
```

### Server Action Security Checklist

#### Pre-Production Security Review ✅

**Input Security**
- [ ] All server actions use Zod validation schemas
- [ ] File uploads have size and type restrictions  
- [ ] SQL injection protection via parameterized queries
- [ ] XSS prevention through input sanitization
- [ ] Path traversal prevention in file operations

**Authentication & Authorization**
- [ ] Protected actions require authentication middleware
- [ ] Role-based permissions implemented where needed
- [ ] Session validation includes expiry checks
- [ ] Admin actions have additional authorization layers

**Rate Limiting & DoS Prevention**
- [ ] Rate limiting implemented for all public actions
- [ ] Stricter limits on authentication/sensitive operations
- [ ] File upload rate limiting in place
- [ ] DDoS protection configured at infrastructure level

**Error Handling & Logging**
- [ ] Error messages sanitized to prevent information disclosure
- [ ] All security events logged with sufficient detail
- [ ] Monitoring and alerting configured for security violations
- [ ] Request IDs for security event correlation

**Infrastructure Security**
- [ ] HTTPS enforced in production
- [ ] Security headers properly configured
- [ ] Database connections encrypted
- [ ] File storage has proper access controls

The key advantage of using next-safe-action is that it provides a standardized, secure-by-default approach to server actions, reducing the likelihood of security vulnerabilities compared to manual API route implementations.

## RPC Security Patterns

<conditional-block task-condition="orpc|rpc|procedure|remote-procedure-call|rpc-security|rpc-auth|rpc-validation" context-check="rpc-security-patterns">
IF task involves RPC security patterns:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get RPC security patterns from security/api-security.md"
  </context_fetcher_strategy>
</conditional-block>

### oRPC Security Architecture

```typescript
// types/rpc-security.ts
import { z } from 'zod'
import { os } from '@orpc/server'

// Base security context for all RPC procedures
export const SecurityContext = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  permissions: z.array(z.string()).default([]),
  rateLimitKey: z.string(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
})

// Authenticated middleware
export const requireAuthenticated = os
  .$context<z.infer<typeof SecurityContext>>()
  .middleware(async ({ context, next }) => {
    if (!context.userId) {
      throw new Error('Authentication required')
    }
    return next()
  })

// Admin-only middleware
export const requireAdmin = os
  .$context<z.infer<typeof SecurityContext>>()
  .middleware(async ({ context, next }) => {
    if (context.role !== 'admin') {
      throw new Error('Administrator access required')
    }
    return next()
  })
```

### RPC Authentication Middleware

```typescript
// middleware/rpc-auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { rateLimiter } from 'hono-rate-limiter';

export const rpcAuthMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const apiKey = c.req.header('X-API-Key');
  
  let userId: string | undefined;
  let role: string | undefined;
  let permissions: string[] = [];
  
  // JWT Authentication
  if (token) {
    try {
      const payload = await verify(token, process.env.JWT_SECRET!);
      userId = payload.sub as string;
      role = payload.role as string;
      permissions = (payload.permissions as string[]) || [];
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401);
    }
  }
  
  // API Key Authentication
  if (apiKey && !userId) {
    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    userId = keyData.userId;
    role = keyData.role;
    permissions = keyData.permissions;
  }
  
  // Set security context
  c.set('securityContext', {
    userId,
    role,
    permissions,
    rateLimitKey: userId || c.req.header('x-forwarded-for') || 'anonymous',
    ipAddress: c.req.header('x-forwarded-for') || 'unknown',
    userAgent: c.req.header('user-agent'),
    sessionId: c.req.header('x-session-id'),
  });
  
  await next();
});

// Rate limiting for RPC procedures
export const rpcRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: (c) => {
    const context = c.get('securityContext');
    
    // Higher limits for authenticated users
    if (context.userId) {
      return context.role === 'admin' ? 1000 : 100;
    }
    
    // Lower limits for anonymous users
    return 20;
  },
  keyGenerator: (c) => {
    const context = c.get('securityContext');
    return context.rateLimitKey;
  },
});
```

### Secure RPC Router Implementation

```typescript
// routers/secure-user-router.ts
import { os } from '@orpc/server'
import { z } from 'zod'

// Input validation schemas
const getUserSchema = z.object({
  userId: z.string().uuid(),
});

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

// Secure user procedures (os style)
export const secureUserRouter = {
  // Public procedure with rate limiting
  getPublicProfile: os
    .input(getUserSchema)
    .output(z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
      createdAt: z.date(),
    }))
    .handler(async ({ input, context }) => {
      await enforceRateLimit(context.rateLimitKey, 'get-profile', 100)
      const user = await getUserById(input.userId)
      if (!user) throw new Error('User not found')
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      }
    }),

  // Authenticated procedure with ownership validation
  updateProfile: os
    .use(requireAuthenticated)
    .input(updateUserSchema)
    .output(z.object({
      success: z.boolean(),
      user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
    }))
    .handler(async ({ input, context }) => {
      if (context.userId !== input.userId && context.role !== 'admin') {
        throw new Error('Permission denied')
      }
      await enforceRateLimit(context.rateLimitKey, 'update-profile', 10)
      const sanitizedInput = {
        ...input,
        name: input.name?.trim(),
        email: input.email?.toLowerCase().trim(),
      }
      const updatedUser = await updateUserSecurely(sanitizedInput)
      await logSecurityEvent({
        action: 'user_profile_update',
        userId: context.userId,
        targetUserId: input.userId,
        changes: Object.keys(input).filter((k) => k !== 'userId'),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      })
      return { success: true, user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email } }
    }),

  // Admin-only procedure with comprehensive security
  deleteUser: os
    .use(requireAuthenticated)
    .use(requireAdmin)
    .input(deleteUserSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .handler(async ({ input, context }) => {
      if (context.userId === input.userId) {
        throw new Error('Cannot delete your own account')
      }
      await enforceRateLimit(context.rateLimitKey, 'delete-user', 2)
      const hasDeletePermission = context.permissions.includes('users:delete')
      if (!hasDeletePermission) {
        throw new Error('Insufficient permissions')
      }
      await logSecurityEvent({
        action: 'user_deletion',
        severity: 'high',
        userId: context.userId,
        targetUserId: input.userId,
        reason: input.reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date(),
      })
      await deleteUserSecurely(input.userId, { deletedBy: context.userId, reason: input.reason })
      return { success: true, message: 'User successfully deleted' }
    }),
}
```

### RPC Input Validation & Sanitization

```typescript
// utils/rpc-validation.ts
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOM purify instance for server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Advanced validation schemas for RPC
export const secureStringSchema = z.string()
  .min(1, 'String cannot be empty')
  .max(1000, 'String too long')
  .transform(val => purify.sanitize(val.trim()));

export const secureEmailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim());

export const secureIdSchema = z.string()
  .uuid('Invalid ID format');

export const secureFileUploadSchema = z.object({
  filename: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
  content: z.string().max(10 * 1024 * 1024), // 10MB base64 limit
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
  ]),
});

// SQL injection prevention for dynamic queries
export function sanitizeForDatabase(input: string): string {
  return input.replace(/['"\\]/g, '\\$&');
}

// XSS prevention for RPC responses
export function sanitizeRpcOutput<T>(data: T): T {
  if (typeof data === 'string') {
    return purify.sanitize(data) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeRpcOutput(item)) as T;
  }
  
  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeRpcOutput(value);
    }
    return sanitized;
  }
  
  return data;
}
```

### RPC Error Handling & Security

```typescript
// utils/rpc-errors.ts
export class RpcSecurityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 403,
    public readonly shouldLog: boolean = true
  ) {
    super(message);
    this.name = 'RpcSecurityError';
  }
}

export class RpcValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'RpcValidationError';
  }
}

// Secure error handler for RPC procedures
export function handleRpcError(error: unknown, context: { userId?: string; ipAddress?: string }) {
  // Log security-related errors
  if (error instanceof RpcSecurityError && error.shouldLog) {
    logSecurityEvent({
      action: 'rpc_security_violation',
      error: error.message,
      code: error.code,
      userId: context.userId,
      ipAddress: context.ipAddress,
      severity: 'high',
    });
  }
  
  // Sanitize error messages for production
  if (process.env.NODE_ENV === 'production') {
    if (error instanceof RpcSecurityError) {
      return {
        error: 'Access denied',
        code: 'FORBIDDEN',
      };
    }
    
    if (error instanceof RpcValidationError) {
      return {
        error: 'Invalid input provided',
        field: error.field,
        code: 'VALIDATION_ERROR',
      };
    }
    
    // Generic error for unknown issues
    return {
      error: 'An error occurred',
      code: 'INTERNAL_ERROR',
    };
  }
  
  // Development mode: return detailed errors
  return {
    error: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack,
  };
}
```

### RPC Security Monitoring

```typescript
// monitoring/rpc-security.ts
interface RpcSecurityMetrics {
  totalRequests: number;
  authFailures: number;
  rateLimitViolations: number;
  validationErrors: number;
  procedureCallFrequency: Record<string, number>;
  suspiciousIPs: string[];
  topErrors: Array<{ error: string; count: number }>;
}

export class RpcSecurityMonitor {
  private metrics: Map<string, number> = new Map();
  private suspiciousActivity: Map<string, number> = new Map();
  
  async trackProcedureCall(
    procedureName: string,
    context: { userId?: string; ipAddress?: string },
    success: boolean,
    error?: unknown
  ) {
    // Track call frequency
    const callKey = `procedure:${procedureName}`;
    this.metrics.set(callKey, (this.metrics.get(callKey) || 0) + 1);
    
    // Track failures
    if (!success) {
      const errorKey = `error:${procedureName}`;
      this.metrics.set(errorKey, (this.metrics.get(errorKey) || 0) + 1);
      
      // Detect suspicious patterns
      if (error instanceof RpcSecurityError) {
        const ipKey = `suspicious:${context.ipAddress}`;
        const count = (this.suspiciousActivity.get(ipKey) || 0) + 1;
        this.suspiciousActivity.set(ipKey, count);
        
        // Alert on repeated security violations
        if (count > 10) {
          await this.sendSecurityAlert({
            type: 'repeated_security_violations',
            ip: context.ipAddress,
            procedure: procedureName,
            count,
          });
        }
      }
    }
    
    // Log to persistent storage
    await this.persistSecurityEvent({
      type: 'rpc_call',
      procedure: procedureName,
      success,
      userId: context.userId,
      ipAddress: context.ipAddress,
      error: error?.message,
      timestamp: new Date(),
    });
  }
  
  async generateSecurityReport(hours: number = 24): Promise<RpcSecurityMetrics> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const events = await this.getSecurityEvents(since);
    
    return {
      totalRequests: events.length,
      authFailures: events.filter(e => 
        e.error?.includes('Authentication required')).length,
      rateLimitViolations: events.filter(e => 
        e.error?.includes('Rate limit')).length,
      validationErrors: events.filter(e => 
        e.error?.includes('Validation')).length,
      procedureCallFrequency: this.getProcedureFrequencies(events),
      suspiciousIPs: this.getSuspiciousIPs(),
      topErrors: this.getTopErrors(events),
    };
  }
  
  private async sendSecurityAlert(alert: unknown) {
    // Implementation depends on alerting system
    // Could integrate with Slack, PagerDuty, etc.
    console.warn('Security Alert:', alert);
  }
  
  private getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousActivity.entries())
      .filter(([, count]) => count > 5)
      .map(([ip]) => ip.replace('suspicious:', ''));
  }
}

// Global RPC security monitor instance
export const rpcSecurityMonitor = new RpcSecurityMonitor();
```

### RPC Security Best Practices Checklist

#### Authentication & Authorization ✅
- [ ] All sensitive procedures require authentication
- [ ] Role-based access control implemented
- [ ] API key validation for service-to-service calls
- [ ] Session management with proper expiration
- [ ] Multi-factor authentication for admin procedures

#### Input Validation & Sanitization ✅
- [ ] All inputs validated with Zod schemas
- [ ] XSS prevention through output sanitization
- [ ] SQL injection prevention via parameterized queries
- [ ] File upload security with type/size validation
- [ ] Path traversal prevention in file operations

#### Rate Limiting & DoS Prevention ✅
- [ ] Rate limiting implemented per user/IP
- [ ] Different limits for different procedure types
- [ ] Burst protection for rapid successive calls
- [ ] Resource-intensive procedures have strict limits
- [ ] Monitoring for unusual traffic patterns

#### Error Handling & Information Disclosure ✅
- [ ] Generic error messages in production
- [ ] Detailed logging for security events
- [ ] No sensitive data in error responses
- [ ] Proper error codes for different failure types
- [ ] Stack traces excluded from public responses

#### Monitoring & Alerting ✅
- [ ] Security event logging for all procedures
- [ ] Real-time monitoring for suspicious activity
- [ ] Automated alerts for security violations
- [ ] Regular security metrics reporting
- [ ] Audit trails for sensitive operations

## Security Verification

<verification-block context-check="api-security-verification">
  <verification_definitions>
    <test name="input_validation_schemas">
      TEST: grep -r "z\." packages/api packages/core --include="*.ts" | head -5
      REQUIRED: true
      ERROR: "All API endpoints must use Zod schemas for input validation. Add validation schemas to your routes."
      DESCRIPTION: "Ensures all API inputs are properly validated using Zod schemas"
    </test>
    <test name="no_sql_injection_vulnerabilities">
      TEST: ! grep -r "\${.*}" packages/api packages/core --include="*.ts" | grep -E "(SELECT|INSERT|UPDATE|DELETE)"
      REQUIRED: true
      ERROR: "Potential SQL injection vulnerability detected. Use parameterized queries or ORM methods."
      DESCRIPTION: "Checks for string interpolation in SQL queries that could lead to injection attacks"
    </test>
    <test name="rate_limiting_configured">
      TEST: grep -r "rateLimiter\|rate.*limit" packages/api --include="*.ts" | head -3
      REQUIRED: true
      ERROR: "Rate limiting must be configured for API routes. Implement rate limiting middleware."
      DESCRIPTION: "Verifies that rate limiting is implemented for API protection"
    </test>
    <test name="cors_configuration_present">
      TEST: grep -r "cors\|CORS" packages/api --include="*.ts" | head -3
      REQUIRED: true
      ERROR: "CORS must be properly configured. Add CORS middleware with restricted origins."
      DESCRIPTION: "Ensures CORS is configured to prevent unauthorized cross-origin requests"
    </test>
    <test name="no_hardcoded_secrets">
      TEST: ! grep -r "sk_live_\|secret.*=.*['\"][^'\"]*['\"]" packages/api packages/core --include="*.ts"
      REQUIRED: true
      ERROR: "Hardcoded secrets detected. Move secrets to environment variables."
      DESCRIPTION: "Prevents secrets from being committed to code repository"
    </test>
    <test name="authentication_middleware_present">
      TEST: grep -r "auth.*middleware\|authMiddleware\|requireAuth" packages/api --include="*.ts" | head -3
      REQUIRED: true
      ERROR: "Authentication middleware not found. Implement auth middleware for protected routes."
      DESCRIPTION: "Verifies authentication middleware exists for protected endpoints"
    </test>
    <test name="server_action_validation">
      TEST: grep -r "inputSchema\|actionClient" packages/api --include="*.ts" | head -3
      REQUIRED: false
      ERROR: "Consider using next-safe-action for server actions with built-in validation."
      DESCRIPTION: "Checks if server actions use proper validation frameworks"
    </test>
    <test name="error_handling_secure">
      TEST: ! grep -r "error.*password\|error.*token\|error.*secret" packages/api --include="*.ts"
      REQUIRED: true
      ERROR: "Error messages may leak sensitive information. Use generic error messages."
      DESCRIPTION: "Ensures error messages don't expose sensitive information"
    </test>
    <test name="rpc_authentication_configured">
      TEST: grep -r "rpcAuthMiddleware\|createProcedure.*auth\|authenticatedProcedure" packages/api --include="*.ts" | head -3
      REQUIRED: false
      ERROR: "RPC authentication not configured. Add authentication middleware for RPC procedures."
      DESCRIPTION: "Verifies RPC procedures have proper authentication"
    </test>
    <test name="rpc_input_validation">
      TEST: grep -r "contract.*input.*z\\\\\.\|inputSchema.*z\\\\\." packages/api --include="*.ts" | head -3
      REQUIRED: false
      ERROR: "RPC procedures lack input validation. Add Zod schemas to procedure contracts."
      DESCRIPTION: "Ensures all RPC procedures validate inputs with Zod"
    </test>
    <test name="rpc_rate_limiting">
      TEST: grep -r "rpcRateLimiter\|procedure.*rateLim\|enforceRateLimit" packages/api --include="*.ts" | head -2
      REQUIRED: false
      ERROR: "RPC rate limiting not implemented. Add rate limiting to RPC procedures."
      DESCRIPTION: "Verifies RPC procedures have rate limiting protection"
    </test>
    <test name="rpc_security_monitoring">
      TEST: grep -r "rpcSecurityMonitor\|trackProcedureCall\|logSecurityEvent.*rpc" packages/api --include="*.ts" | head -2
      REQUIRED: false
      ERROR: "RPC security monitoring not configured. Add security event tracking for procedures."
      DESCRIPTION: "Checks for RPC security monitoring and logging"
    </test>
    <test name="rpc_error_sanitization">
      TEST: grep -r "handleRpcError\|RpcSecurityError\|production.*error" packages/api --include="*.ts" | head -2
      REQUIRED: false
      ERROR: "RPC error sanitization not implemented. Add production-safe error handling."
      DESCRIPTION: "Verifies RPC errors are properly sanitized in production"
    </test>
  </verification_definitions>
</verification-block>
