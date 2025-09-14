# Server Actions Security

## Security Fundamentals

### Server Actions as Public Endpoints

**Critical Security Principle**: All Next.js server actions are publicly accessible HTTP endpoints. Anyone can invoke them directly, bypassing your UI entirely. Always assume malicious actors can:

- Call actions with arbitrary parameters
- Bypass client-side validation
- Attempt injection attacks
- Perform reconnaissance on your API surface
- Execute actions at high frequency (DoS attempts)

## Input Validation and Sanitization

### Comprehensive Input Validation
```typescript
// ✅ Proper validation with next-safe-action + Zod
import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

const userInputSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(254, "Email too long") // RFC 5321 limit
    .transform(email => email.toLowerCase().trim()),
  
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
    .transform(name => name.trim()),
  
  age: z.number()
    .int("Age must be a whole number")
    .min(13, "Must be at least 13 years old") // COPPA compliance
    .max(150, "Invalid age"),
  
  website: z.string()
    .url("Invalid URL format")
    .optional()
    .refine(url => !url || !url.includes('javascript:'), "Invalid URL scheme"),
});

export const updateUserProfile = actionClient
  .metadata({ actionName: "updateUserProfile", requiresAuth: true })
  .inputSchema(userInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Input is guaranteed to be validated and sanitized
    const { email, name, age, website } = parsedInput;
    
    // Additional business logic validation
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.id !== ctx.user.id) {
      return returnValidationErrors(userInputSchema, {
        email: { _errors: ["Email already in use"] },
      });
    }
    
    // Proceed with update
    return await updateUser(ctx.user.id, { email, name, age, website });
  });
```

### File Upload Security
```typescript
// File upload with comprehensive security checks
const fileUploadSchema = zfd.formData({
  file: zfd.file(z.instanceof(File)
    .refine(file => file.size > 0, "File cannot be empty")
    .refine(file => file.size <= 10 * 1024 * 1024, "File too large (max 10MB)")
    .refine(file => {
      const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'application/pdf',
        'text/plain',
      ];
      return allowedTypes.includes(file.type);
    }, "File type not allowed")
    .refine(async file => {
      // Check file signature (magic bytes) to prevent MIME spoofing
      const buffer = await file.arrayBuffer();
      const signature = new Uint8Array(buffer.slice(0, 4));
      return isValidFileSignature(signature, file.type);
    }, "File signature doesn't match declared type")),
  
  category: z.enum(['avatar', 'document', 'attachment']),
});

export const uploadFile = authActionClient
  .metadata({ actionName: "uploadFile", requiresAuth: true, rateLimit: 3 })
  .inputSchema(fileUploadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { file, category } = parsedInput;
    
    // Additional security: scan file content
    const scanResult = await scanFileForMalware(file);
    if (!scanResult.safe) {
      throw new ActionError("File failed security scan", true);
    }
    
    // Generate secure filename to prevent path traversal
    const secureFilename = generateSecureFilename(file.name);
    const storagePath = `uploads/${ctx.user.id}/${category}/${secureFilename}`;
    
    const uploadResult = await uploadToSecureStorage(file, storagePath);
    
    return {
      fileId: uploadResult.fileId,
      filename: secureFilename,
      url: uploadResult.publicUrl,
    };
  });

function isValidFileSignature(signature: Uint8Array, mimeType: string): boolean {
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };
  
  const expectedSignature = signatures[mimeType];
  if (!expectedSignature) return false;
  
  return expectedSignature.every((byte, index) => signature[index] === byte);
}
```

## Authentication and Authorization

### Session-Based Authentication
```typescript
// Secure session middleware integration with Better-Auth
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export const authMiddleware = createMiddleware()
  .define(async ({ next }) => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token")?.value;
    
    if (!sessionToken) {
      throw new ActionError("Authentication required", true);
    }
    
    // Validate session with Better-Auth
    const session = await auth.api.getSession({
      headers: { 
        cookie: `better-auth.session_token=${sessionToken}` 
      },
    });
    
    if (!session?.user) {
      // Clear invalid session cookie
      cookieStore.delete("better-auth.session_token");
      throw new ActionError("Invalid session. Please sign in again.", true);
    }
    
    // Check session expiry
    const now = Date.now();
    const sessionExpiry = new Date(session.session.expiresAt).getTime();
    
    if (now > sessionExpiry) {
      throw new ActionError("Session expired. Please sign in again.", true);
    }
    
    // Check if session needs refresh (within 24 hours of expiry)
    const refreshThreshold = 24 * 60 * 60 * 1000; // 24 hours
    if (sessionExpiry - now < refreshThreshold) {
      // Trigger session refresh in the background
      auth.api.refreshSession({ 
        headers: { cookie: `better-auth.session_token=${sessionToken}` }
      }).catch(console.error);
    }
    
    return next({ 
      ctx: { 
        user: session.user,
        session: session.session,
      } 
    });
  });
```

### Role-Based Authorization
```typescript
// RBAC middleware with granular permissions
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

const permissions = {
  admin: [
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' },
    { resource: 'system', action: 'configure' },
  ],
  moderator: [
    { resource: 'user', action: 'update', conditions: { not_admin: true } },
    { resource: 'content', action: 'moderate' },
  ],
  user: [
    { resource: 'profile', action: 'update', conditions: { own_profile: true } },
    { resource: 'content', action: 'create' },
  ],
};

function hasPermission(
  userRole: string, 
  resource: string, 
  action: string,
  context?: Record<string, any>
): boolean {
  const rolePermissions = permissions[userRole] || [];
  
  const matchingPermission = rolePermissions.find(
    p => p.resource === resource && p.action === action
  );
  
  if (!matchingPermission) return false;
  
  // Check conditions if present
  if (matchingPermission.conditions && context) {
    return Object.entries(matchingPermission.conditions).every(([key, value]) => {
      if (key === 'own_profile') {
        return context.targetUserId === context.currentUserId;
      }
      if (key === 'not_admin') {
        return context.targetUserRole !== 'admin';
      }
      return context[key] === value;
    });
  }
  
  return true;
}

export const requirePermission = (resource: string, action: string) => {
  return createMiddleware<{ 
    ctx: { user: User; session: Session } 
  }>().define(async ({ next, ctx }) => {
    const { user } = ctx;
    
    if (!hasPermission(user.role, resource, action)) {
      throw new ActionError(
        `Insufficient permissions for ${action} on ${resource}`, 
        true
      );
    }
    
    return next();
  });
};

// Usage in actions
export const deleteUser = authActionClient
  .use(requirePermission('user', 'delete'))
  .metadata({ actionName: "deleteUser" })
  .inputSchema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = parsedInput;
    
    // Additional context-specific permission check
    const targetUser = await getUserById(userId);
    if (!hasPermission(ctx.user.role, 'user', 'delete', {
      targetUserRole: targetUser.role,
      currentUserId: ctx.user.id,
    })) {
      throw new ActionError("Cannot delete this user", true);
    }
    
    await deleteUserFromDatabase(userId);
    
    return { success: true };
  });
```

## Rate Limiting and DoS Protection

### Advanced Rate Limiting
```typescript
// Redis-based distributed rate limiting
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipIf?: (context: any) => boolean;
  keyGenerator?: (context: any) => string;
}

const rateLimitRules: Record<string, RateLimitRule> = {
  // Authentication actions - very strict
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: ({ clientInput }) => `login:${clientInput.email}`,
  },
  
  // Registration - prevent spam
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: ({ headers }) => `register:${headers.get('x-forwarded-for')}`,
  },
  
  // File uploads - prevent abuse
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipIf: ({ user }) => user.role === 'admin',
  },
  
  // Default for other actions
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
};

export const rateLimitMiddleware = createMiddleware()
  .define(async ({ next, metadata }) => {
    const actionName = metadata.actionName;
    const rule = rateLimitRules[actionName] || rateLimitRules.default;
    
    // Skip if condition met
    if (rule.skipIf && rule.skipIf({ user: ctx.user, clientInput, headers })) {
      return next();
    }
    
    // Generate rate limit key
    const defaultKey = `rate_limit:${actionName}:${getClientIP()}`;
    const key = rule.keyGenerator 
      ? rule.keyGenerator({ clientInput, headers, user: ctx.user })
      : defaultKey;
    
    // Check current count
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= rule.maxRequests) {
      const ttl = await redis.ttl(key);
      throw new ActionError(
        `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`, 
        true
      );
    }
    
    // Increment count
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    if (count === 0) {
      pipeline.expire(key, Math.ceil(rule.windowMs / 1000));
    }
    await pipeline.exec();
    
    return next();
  });
```

### CSRF Protection
```typescript
// CSRF token validation middleware
import { createHash, randomBytes } from "crypto";

export const csrfMiddleware = createMiddleware()
  .define(async ({ next, clientInput, headers }) => {
    // Skip for GET-like operations or if explicitly disabled
    if (metadata.skipCSRF) {
      return next();
    }
    
    const csrfToken = headers.get('x-csrf-token') || clientInput._csrfToken;
    const sessionId = ctx.session?.id;
    
    if (!csrfToken || !sessionId) {
      throw new ActionError("CSRF token required", true);
    }
    
    // Validate CSRF token
    const expectedToken = generateCSRFToken(sessionId);
    const isValid = await verifyCSRFToken(csrfToken, expectedToken);
    
    if (!isValid) {
      throw new ActionError("Invalid CSRF token", true);
    }
    
    return next();
  });

function generateCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET!;
  return createHash('sha256')
    .update(`${sessionId}:${secret}`)
    .digest('hex');
}

async function verifyCSRFToken(provided: string, expected: string): Promise<boolean> {
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(provided, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

## SQL Injection Prevention

### Safe Database Queries
```typescript
// ✅ Proper parameterized queries with Drizzle ORM
import { db } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";
import { eq, and, like, inArray } from "drizzle-orm";

export const searchUsers = actionClient
  .metadata({ actionName: "searchUsers", requiresAuth: true })
  .inputSchema(z.object({
    query: z.string().min(1).max(100).trim(),
    roles: z.array(z.enum(['user', 'admin', 'moderator'])).optional(),
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).default(0),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { query, roles, limit, offset } = parsedInput;
    
    // ✅ Safe: Using Drizzle's parameterized queries
    const conditions = [
      like(users.name, `%${query}%`), // Automatically parameterized
    ];
    
    if (roles && roles.length > 0) {
      conditions.push(inArray(users.role, roles)); // Safe array handling
    }
    
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .execute();
    
    return { users: results };
  });

// ❌ Never do this - vulnerable to SQL injection
async function vulnerableSearch(query: string) {
  // NEVER: Direct string interpolation
  const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`;
  return await db.execute(sql);
}

// ✅ If you must use raw SQL, use parameters
async function safeRawSQL(query: string) {
  return await db.execute(
    'SELECT id, name, email FROM users WHERE name ILIKE $1 LIMIT $2',
    [`%${query}%`, 20]
  );
}
```

## Error Handling and Information Disclosure

### Secure Error Messages
```typescript
// Secure error handling that prevents information disclosure
export class SecureActionError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "SecureActionError";
  }
}

export const secureActionClient = createSafeActionClient({
  handleServerError(error, utils) {
    const { clientInput, metadata } = utils;
    
    // Log full error details securely (server-side only)
    const errorContext = {
      timestamp: new Date().toISOString(),
      action: metadata.actionName,
      userId: utils.ctx?.user?.id,
      clientInput: sanitizeForLogging(clientInput),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      requestId: generateRequestId(),
    };
    
    // Log to secure logging service
    secureLogger.error("Action error", errorContext);
    
    // Send to monitoring service (without sensitive data)
    if (process.env.NODE_ENV === 'production') {
      monitoringService.captureException(error, {
        tags: { action: metadata.actionName },
        extra: { requestId: errorContext.requestId },
      });
    }
    
    // Return sanitized error to client
    if (error instanceof SecureActionError) {
      return {
        message: error.userMessage,
        code: error.code,
        requestId: errorContext.requestId,
      };
    }
    
    // Database constraint violations
    if (error.code === '23505') { // Unique constraint violation
      return {
        message: "This value is already in use",
        code: "DUPLICATE_VALUE",
        requestId: errorContext.requestId,
      };
    }
    
    if (error.code === '23503') { // Foreign key violation
      return {
        message: "Referenced item not found",
        code: "INVALID_REFERENCE",
        requestId: errorContext.requestId,
      };
    }
    
    // Default secure message for production
    return {
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "An error occurred while processing your request",
      code: "INTERNAL_ERROR",
      requestId: errorContext.requestId,
    };
  },
});

function sanitizeForLogging(data: any): any {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 
    'authorization', 'cookie', 'ssn', 'creditcard'
  ];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const isKeySensitive = sensitiveKeys.some(
      sensitive => key.toLowerCase().includes(sensitive)
    );
    
    if (isKeySensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

## Audit Logging and Monitoring

### Comprehensive Audit Trail
```typescript
// Audit logging middleware for compliance and security
interface AuditEvent {
  timestamp: string;
  action: string;
  userId?: string;
  sessionId?: string;
  clientIP: string;
  userAgent: string;
  resource?: string;
  resourceId?: string;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

export const auditMiddleware = createMiddleware()
  .define(async ({ next, clientInput, metadata }) => {
    const startTime = Date.now();
    const clientIP = getClientIP();
    const userAgent = headers().get('user-agent') || 'unknown';
    
    const baseEvent: Partial<AuditEvent> = {
      timestamp: new Date().toISOString(),
      action: metadata.actionName,
      userId: ctx.user?.id,
      sessionId: ctx.session?.id,
      clientIP,
      userAgent,
      metadata: {
        inputs: sanitizeForAudit(clientInput),
        rateLimit: metadata.rateLimit,
      },
    };
    
    try {
      const result = await next();
      
      // Log successful action
      const auditEvent: AuditEvent = {
        ...baseEvent,
        success: true,
        metadata: {
          ...baseEvent.metadata,
          duration: Date.now() - startTime,
          outputKeys: result.data ? Object.keys(result.data) : [],
        },
      } as AuditEvent;
      
      await logAuditEvent(auditEvent);
      
      return result;
      
    } catch (error) {
      // Log failed action
      const auditEvent: AuditEvent = {
        ...baseEvent,
        success: false,
        error: error.message,
        metadata: {
          ...baseEvent.metadata,
          duration: Date.now() - startTime,
          errorType: error.constructor.name,
        },
      } as AuditEvent;
      
      await logAuditEvent(auditEvent);
      
      throw error;
    }
  });

async function logAuditEvent(event: AuditEvent): Promise<void> {
  // Log to multiple destinations for redundancy
  const promises = [
    // Primary audit log (database)
    db.insert(auditLogs).values(event),
    
    // Secondary audit log (external service)
    externalAuditService.log(event),
    
    // Security monitoring system
    securityMonitor.recordEvent(event),
  ];
  
  // Don't block action execution on audit failures
  await Promise.allSettled(promises);
}

function sanitizeForAudit(data: any): any {
  // Remove passwords but keep usernames, emails for audit trail
  const sensitiveKeys = ['password', 'token', 'secret', 'key'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const isKeySensitive = sensitiveKeys.some(
      sensitive => key.toLowerCase().includes(sensitive)
    );
    
    if (isKeySensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

## Security Headers and Environment

### Security Configuration
```typescript
// next.config.js - Security headers for server actions
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Required for Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Environment Security
```bash
# .env.example - Security-related environment variables
NODE_ENV=production

# Database security
DATABASE_URL="postgresql://user:password@localhost:5432/db?sslmode=require"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Auth secrets (generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-here"
CSRF_SECRET="your-csrf-secret-here"

# Rate limiting
REDIS_URL="redis://localhost:6379"

# File upload security
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp,application/pdf"

# Monitoring and logging
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"

# External services
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET_NAME="your-secure-bucket"
```

## Security Testing

### Security Test Suite
```typescript
// __tests__/security/server-actions.security.test.ts
import { describe, it, expect } from 'vitest';
import { updateUserProfile } from '@/actions/user-actions';

describe('Server Action Security', () => {
  describe('Input Validation', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "' UNION SELECT * FROM passwords --",
      ];
      
      for (const maliciousInput of maliciousInputs) {
        const result = await updateUserProfile({
          name: maliciousInput,
          email: "test@example.com",
        });
        
        expect(result.validationErrors).toBeDefined();
        expect(result.data).toBeUndefined();
      }
    });
    
    it('should reject XSS payloads', async () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
      ];
      
      for (const payload of xssPayloads) {
        const result = await updateUserProfile({
          name: payload,
          email: "test@example.com",
        });
        
        expect(result.validationErrors).toBeDefined();
      }
    });
    
    it('should enforce file size limits', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt');
      
      const result = await uploadFile({
        file: largeFile,
        category: 'document',
      });
      
      expect(result.validationErrors?.file).toBeDefined();
    });
  });
  
  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      // Mock no session
      vi.mocked(cookies).mockReturnValue({
        get: () => undefined,
      });
      
      const result = await updateUserProfile({
        name: "Test User",
        email: "test@example.com",
      });
      
      expect(result.serverError).toContain("Authentication required");
    });
    
    it('should reject expired sessions', async () => {
      const expiredSession = {
        user: { id: 'user-1', role: 'user' },
        session: { 
          id: 'session-1', 
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expired
        },
      };
      
      vi.mocked(auth.api.getSession).mockResolvedValue(expiredSession);
      
      const result = await updateUserProfile({
        name: "Test User",
        email: "test@example.com",
      });
      
      expect(result.serverError).toContain("Session expired");
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(6).fill(null).map(() =>
        loginUser({
          email: "test@example.com",
          password: "password123",
        })
      );
      
      const results = await Promise.all(requests);
      const rateLimitedResults = results.filter(
        result => result.serverError?.includes("Rate limit")
      );
      
      expect(rateLimitedResults.length).toBeGreaterThan(0);
    });
  });
});
```

## Security Checklist

### Pre-Deployment Security Review

#### Input Validation ✅
- [ ] All inputs validated with Zod schemas
- [ ] File uploads have size and type restrictions
- [ ] File signatures verified to prevent MIME spoofing
- [ ] SQL injection protection via parameterized queries
- [ ] XSS prevention through input sanitization
- [ ] Path traversal prevention in file operations

#### Authentication & Authorization ✅
- [ ] All protected actions require valid authentication
- [ ] Session validation includes expiry checks
- [ ] Role-based permissions properly enforced
- [ ] Admin actions have additional authorization layers
- [ ] Invalid sessions are properly cleared

#### Rate Limiting & DoS Protection ✅
- [ ] Rate limiting implemented for all public actions
- [ ] Stricter limits on authentication endpoints
- [ ] File upload rate limiting in place
- [ ] Redis-based distributed rate limiting for scalability

#### Error Handling ✅
- [ ] Error messages sanitized to prevent information disclosure
- [ ] Comprehensive audit logging implemented
- [ ] Monitoring and alerting configured
- [ ] Request IDs for error tracking

#### Security Headers ✅
- [ ] HSTS header configured
- [ ] CSP policy restricts resource loading
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing

#### Environment Security ✅
- [ ] All secrets stored in environment variables
- [ ] Production environment hardened
- [ ] Database connections use SSL
- [ ] File storage permissions properly configured

### Security Best Practices Summary

#### Always Do ✅
- Validate all inputs server-side with schemas
- Implement proper authentication and authorization
- Use rate limiting on all public endpoints
- Log all security-relevant events
- Sanitize error messages for production
- Use HTTPS in production environments
- Implement proper session management
- Regular security testing and audits

#### Never Do ❌
- Trust client-side validation alone
- Expose sensitive error details to clients
- Skip rate limiting on any public endpoint
- Log sensitive data (passwords, tokens, PII)
- Use string interpolation in SQL queries
- Store secrets in code or version control
- Ignore security headers configuration
- Deploy without security testing

This comprehensive security framework ensures that server actions remain secure while providing excellent developer experience and maintaining performance.