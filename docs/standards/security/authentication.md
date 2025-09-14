# Authentication & Authorization

## Better-Auth Configuration (v1.3.7+)

### Setup
```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { 
  twoFactor, 
  organization, 
  passkey,
  emailOTP,
  admin,
  apiKey,
  jwt
} from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'postgresql'
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session if > 1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minute cache
    }
  },
  
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ['read:user', 'user:email']
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  
  plugins: [
    // Two-factor authentication
    twoFactor({
      issuer: 'YourApp',
      totpOptions: {
        period: 30,
        digits: 6,
        algorithm: 'SHA1'
      },
      backupCodes: {
        count: 10,
        length: 8
      }
    }),
    
    // Organization management
    organization({
      allowUserToCreateOrganization: true,
      organizationRole: true,
      invitationExpiresIn: 60 * 60 * 24 * 7 // 7 days
    }),
    
    // Passkey authentication
    passkey({
      rpName: 'YourApp',
      rpID: process.env.NEXT_PUBLIC_APP_URL!,
      origin: process.env.NEXT_PUBLIC_APP_URL!,
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred'
      }
    }),
    
    // Email OTP verification
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Send OTP to user's email
        await sendEmail({
          to: email,
          subject: `Your verification code: ${otp}`,
          html: `Your verification code is: <strong>${otp}</strong>`
        });
      }
    }),
    
    // Admin functionality
    admin({
      defaultRole: 'user',
      adminRoles: ['admin', 'superadmin'],
      impersonationSessionDuration: 60 * 60 * 24 // 1 day
    }),
    
    // API key authentication
    apiKey({
      apiKeyHeaders: ['x-api-key', 'authorization'],
      defaultKeyLength: 64,
      defaultPrefix: 'pk_',
      maximumPrefixLength: 10,
      requireName: true,
      keyExpiration: {
        defaultExpiresIn: 60 * 60 * 24 * 365, // 1 year
        maxExpiresIn: 365 // days
      },
      rateLimit: {
        enabled: true,
        timeWindow: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      }
    }),
    
    // JWT tokens
    jwt({
      expiresIn: 60 * 60, // 1 hour
      algorithm: 'HS256'
    })
  ],
  
  rateLimit: {
    window: 60 * 15, // 15 minutes
    max: 10,
    customRules: {
      '/auth/signin': { max: 5, window: 60 * 15 },
      '/auth/signup': { max: 3, window: 60 * 60 }
    }
  },
  
  logger: {
    level: 'info',
    disabled: false
  },
  
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
    'http://localhost:3000', // Development
    'http://localhost:3001'  // Testing
  ]
});
```

### Client Configuration (v1.3.7+)
```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/client';
import { 
  twoFactorClient,
  organizationClient,
  passkeyClient,
  emailOTPClient,
  adminClient,
  apiKeyClient,
  jwtClient
} from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    // Two-factor authentication client
    twoFactorClient(),
    
    // Organization management client  
    organizationClient(),
    
    // Passkey authentication client
    passkeyClient(),
    
    // Email OTP client
    emailOTPClient(),
    
    // Admin functionality client
    adminClient(),
    
    // API key management client
    apiKeyClient(),
    
    // JWT client
    jwtClient()
  ]
});

export const {
  signIn,
  signUp, 
  signOut,
  useSession,
  getSession
} = authClient;
```

### Session Management with React Query
```typescript
// hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authClient.getSession(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
  
  const signOut = useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/login');
    },
    onError: (error) => {
      console.error('Sign out error:', error);
    }
  });
  
  const impersonate = useMutation({
    mutationFn: (userId: string) => authClient.admin.impersonate({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
  
  return {
    // User data
    user: session?.user,
    session,
    
    // Loading states
    isLoading,
    error,
    isAuthenticated: !!session?.user,
    
    // Actions
    signOut: signOut.mutate,
    impersonate: impersonate.mutate,
    
    // Utility functions
    hasRole: (role: string) => session?.user?.role === role,
    hasPermission: (permission: string) => {
      // Implement permission checking logic
      return session?.user?.permissions?.includes(permission);
    }
  };
}

// Hook for organization context
export function useOrganization() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['auth', 'organizations'],
    queryFn: () => authClient.organization.listOrganizations(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  return {
    organizations: organizations?.data || [],
    isLoading
  };
}
```

## Role-Based Access Control (RBAC)

### Permission System
```typescript
// lib/permissions.ts
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings',
  
  // Organization permissions
  ORG_MANAGE = 'org:manage',
  ORG_BILLING = 'org:billing',
  ORG_MEMBERS = 'org:members'
}

export const rolePermissions: Record<string, Permission[]> = {
  user: [
    Permission.USER_READ,
    Permission.USER_WRITE
  ],
  admin: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.ADMIN_ACCESS,
    Permission.ADMIN_USERS,
    Permission.ADMIN_SETTINGS
  ],
  owner: [
    ...rolePermissions.admin,
    Permission.ORG_MANAGE,
    Permission.ORG_BILLING,
    Permission.ORG_MEMBERS
  ]
};

export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}
```

### Protected Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth.getSession(request);
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!hasPermission(session.user.role, Permission.ADMIN_ACCESS)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }
  
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (!session?.user && !request.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
};
```

## Multi-Factor Authentication

### TOTP Implementation
```typescript
// components/EnableTwoFactor.tsx
export function EnableTwoFactor() {
  const [qrCode, setQrCode] = useState<string>();
  const [secret, setSecret] = useState<string>();
  
  const enable = async () => {
    const { qrCode, secret, backupCodes } = await auth.twoFactor.enable();
    setQrCode(qrCode);
    setSecret(secret);
    
    // Show backup codes to user
    showBackupCodes(backupCodes);
  };
  
  const verify = async (code: string) => {
    const result = await auth.twoFactor.verify({ code });
    if (result.success) {
      toast.success('Two-factor authentication enabled');
    }
  };
  
  return (
    <div>
      {!qrCode ? (
        <button onClick={enable}>Enable 2FA</button>
      ) : (
        <>
          <img src={qrCode} alt="2FA QR Code" />
          <p>Secret: {secret}</p>
          <input
            type="text"
            placeholder="Enter verification code"
            onBlur={(e) => verify(e.target.value)}
          />
        </>
      )}
    </div>
  );
}
```

## Security Headers
```typescript
// next.config.js
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
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## Server Action Authentication

<conditional-block task-condition="server-action-auth|action-middleware|auth-middleware" context-check="server-action-authentication">
IF task involves server action authentication or middleware:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get server action authentication patterns from security/authentication.md including middleware integration, session validation, and Better-Auth patterns"
  </context_fetcher_strategy>
</conditional-block>

### Better-Auth Integration with Next-Safe-Action

#### Authentication Middleware for Server Actions
```typescript
// lib/safe-action.ts - Server action authentication middleware
import { createMiddleware } from "next-safe-action";
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
    const sessionData = await auth.api.getSession({
      headers: { 
        cookie: `better-auth.session_token=${sessionToken}` 
      },
    });
    
    if (!sessionData?.user) {
      // Clear invalid session cookie
      cookieStore.delete("better-auth.session_token");
      throw new ActionError("Invalid session. Please sign in again.", true);
    }
    
    // Check session expiry and refresh if needed
    const now = Date.now();
    const sessionExpiry = new Date(sessionData.session.expiresAt).getTime();
    
    if (now > sessionExpiry) {
      cookieStore.delete("better-auth.session_token");
      throw new ActionError("Session expired. Please sign in again.", true);
    }
    
    // Auto-refresh session if within 24 hours of expiry
    const refreshThreshold = 24 * 60 * 60 * 1000; // 24 hours
    if (sessionExpiry - now < refreshThreshold) {
      try {
        await auth.api.refreshSession({ 
          headers: { cookie: `better-auth.session_token=${sessionToken}` }
        });
      } catch (error) {
        console.warn("Session refresh failed:", error);
        // Continue with current session, will be handled on next request
      }
    }
    
    return next({ 
      ctx: { 
        user: sessionData.user,
        session: sessionData.session,
      } 
    });
  });

// Authenticated action client
export const authActionClient = actionClient.use(authMiddleware);
```

#### Role-Based Authorization Middleware
```typescript
// lib/safe-action.ts (continued)
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' },
    { resource: 'system', action: 'configure' },
    { resource: 'content', action: 'moderate' },
  ],
  moderator: [
    { resource: 'user', action: 'update', conditions: { not_admin: true } },
    { resource: 'content', action: 'moderate' },
    { resource: 'content', action: 'delete' },
  ],
  user: [
    { resource: 'profile', action: 'update', conditions: { own_profile: true } },
    { resource: 'content', action: 'create' },
    { resource: 'content', action: 'update', conditions: { own_content: true } },
  ],
};

export const requirePermission = (resource: string, action: string) => {
  return createMiddleware<{ 
    ctx: { user: User; session: Session } 
  }>().define(async ({ next, ctx }) => {
    const { user } = ctx;
    
    const userPermissions = rolePermissions[user.role] || [];
    const hasPermission = userPermissions.some(
      p => p.resource === resource && p.action === action
    );
    
    if (!hasPermission) {
      throw new ActionError(
        `Insufficient permissions for ${action} on ${resource}`, 
        true
      );
    }
    
    return next({ ctx });
  });
};

// Role-specific action clients
export const adminActionClient = authActionClient
  .use(requirePermission('system', 'configure'));

export const moderatorActionClient = authActionClient
  .use(requirePermission('content', 'moderate'));
```

#### Conditional Authentication Middleware
```typescript
// lib/safe-action.ts (continued)
export const optionalAuthMiddleware = createMiddleware()
  .define(async ({ next, metadata }) => {
    // Check if authentication is required for this action
    if (!metadata.requiresAuth) {
      return next({ ctx: { user: null, session: null } });
    }
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token")?.value;
    
    if (!sessionToken) {
      throw new ActionError("Authentication required for this action", true);
    }
    
    const sessionData = await auth.api.getSession({
      headers: { 
        cookie: `better-auth.session_token=${sessionToken}` 
      },
    });
    
    if (!sessionData?.user) {
      throw new ActionError("Valid session required", true);
    }
    
    return next({ 
      ctx: { 
        user: sessionData.user,
        session: sessionData.session,
      } 
    });
  });

// Flexible action client that supports both authenticated and public actions
export const flexibleActionClient = actionClient.use(optionalAuthMiddleware);
```

### Authentication Server Actions

#### Login Action with Security Features
```typescript
// actions/auth-actions.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
  turnstileToken: z.string().min(1, "Captcha verification required"),
});

export const loginUser = actionClient
  .metadata({ 
    actionName: "loginUser", 
    rateLimit: 3, // Very strict rate limiting
    requiresAuth: false // Public action
  })
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { email, password, rememberMe, turnstileToken } = parsedInput;
    
    // Rate limiting by email to prevent brute force attacks
    const rateLimitKey = `login:${email}`;
    const isRateLimited = await rateLimit.check(rateLimitKey, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
    });
    
    if (isRateLimited) {
      throw new ActionError(
        "Too many login attempts. Please try again in 15 minutes.",
        true
      );
    }
    
    // Verify Turnstile captcha token
    const captchaValid = await verifyTurnstileToken(turnstileToken);
    if (!captchaValid) {
      return returnValidationErrors(loginSchema, {
        turnstileToken: { _errors: ["Captcha verification failed"] },
      });
    }
    
    try {
      // Attempt login with Better-Auth
      const result = await auth.api.signIn.email({
        body: {
          email,
          password,
          rememberMe,
        },
      });
      
      if (!result.data?.session) {
        // Increment rate limit on failed attempt
        await rateLimit.increment(rateLimitKey);
        
        return returnValidationErrors(loginSchema, {
          password: { _errors: ["Invalid email or password"] },
        });
      }
      
      // Reset rate limit on successful login
      await rateLimit.reset(rateLimitKey);
      
      // Log successful authentication
      await logAuthEvent({
        type: 'login_success',
        userId: result.data.user.id,
        email: result.data.user.email,
        rememberMe,
        timestamp: new Date(),
      });
      
      // Redirect based on user role or intended destination
      const redirectTo = getRedirectPath(result.data.user.role);
      redirect(redirectTo);
      
    } catch (error) {
      // Increment rate limit on failed attempt
      await rateLimit.increment(rateLimitKey);
      
      await logAuthEvent({
        type: 'login_failed',
        email,
        error: error.message,
        timestamp: new Date(),
      });
      
      return returnValidationErrors(loginSchema, {
        _errors: ["Login failed. Please check your credentials."],
      });
    }
  });

function getRedirectPath(userRole: string): string {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/moderator/dashboard';
    default:
      return '/dashboard';
  }
}
```

#### Registration Action with Email Verification
```typescript
// actions/auth-actions.ts (continued)
const registerSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")  
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  confirmPassword: z.string(),
  turnstileToken: z.string().min(1, "Captcha verification required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const registerUser = actionClient
  .metadata({ 
    actionName: "registerUser", 
    rateLimit: 2, // Stricter rate limiting for registration
    requiresAuth: false 
  })
  .inputSchema(registerSchema)
  .action(async ({ parsedInput }) => {
    const { email, name, password, turnstileToken } = parsedInput;
    
    // Rate limiting by IP for registration
    const clientIP = getClientIP();
    const rateLimitKey = `register:${clientIP}`;
    const isRateLimited = await rateLimit.check(rateLimitKey, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
    });
    
    if (isRateLimited) {
      throw new ActionError(
        "Too many registration attempts. Please try again in 1 hour.",
        true
      );
    }
    
    // Verify captcha
    const captchaValid = await verifyTurnstileToken(turnstileToken);
    if (!captchaValid) {
      return returnValidationErrors(registerSchema, {
        turnstileToken: { _errors: ["Captcha verification failed"] },
      });
    }
    
    try {
      // Create user with Better-Auth
      const result = await auth.api.signUp.email({
        body: {
          email,
          name,
          password,
        },
      });
      
      if (!result.data?.user) {
        return returnValidationErrors(registerSchema, {
          _errors: ["Registration failed. Please try again."],
        });
      }
      
      // Send email verification
      await auth.api.sendVerificationEmail({
        body: {
          email,
          callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        },
      });
      
      await logAuthEvent({
        type: 'registration_success',
        userId: result.data.user.id,
        email: result.data.user.email,
        timestamp: new Date(),
      });
      
      return {
        success: true,
        message: "Registration successful! Please check your email to verify your account.",
        userId: result.data.user.id,
      };
      
    } catch (error) {
      await rateLimit.increment(rateLimitKey);
      
      await logAuthEvent({
        type: 'registration_failed',
        email,
        error: error.message,
        timestamp: new Date(),
      });
      
      // Handle specific error cases
      if (error.message.includes('email already exists')) {
        return returnValidationErrors(registerSchema, {
          email: { _errors: ["An account with this email already exists"] },
        });
      }
      
      return returnValidationErrors(registerSchema, {
        _errors: ["Registration failed. Please try again."],
      });
    }
  });
```

#### Session Management Actions
```typescript
// actions/auth-actions.ts (continued)
export const logoutUser = authActionClient
  .metadata({ actionName: "logoutUser" })
  .action(async ({ ctx }) => {
    try {
      // Logout with Better-Auth
      await auth.api.signOut({
        headers: {
          cookie: `better-auth.session_token=${ctx.session.id}`
        }
      });
      
      // Clear all auth cookies
      const cookieStore = await cookies();
      cookieStore.delete("better-auth.session_token");
      
      await logAuthEvent({
        type: 'logout_success',
        userId: ctx.user.id,
        timestamp: new Date(),
      });
      
      redirect('/login');
      
    } catch (error) {
      throw new ActionError("Logout failed", true);
    }
  });

export const refreshSession = authActionClient
  .metadata({ actionName: "refreshSession" })
  .action(async ({ ctx }) => {
    try {
      const result = await auth.api.refreshSession({
        headers: {
          cookie: `better-auth.session_token=${ctx.session.id}`
        }
      });
      
      if (!result.data?.session) {
        throw new ActionError("Session refresh failed", true);
      }
      
      return {
        success: true,
        expiresAt: result.data.session.expiresAt,
      };
      
    } catch (error) {
      // Force re-authentication
      redirect('/login');
    }
  });

// Change password with current password verification
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export const changePassword = authActionClient
  .metadata({ actionName: "changePassword", rateLimit: 3 })
  .inputSchema(changePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { currentPassword, newPassword } = parsedInput;
    
    try {
      // Verify current password first
      const loginResult = await auth.api.signIn.email({
        body: {
          email: ctx.user.email,
          password: currentPassword,
        },
      });
      
      if (!loginResult.data?.session) {
        return returnValidationErrors(changePasswordSchema, {
          currentPassword: { _errors: ["Current password is incorrect"] },
        });
      }
      
      // Update password
      await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
        },
        headers: {
          cookie: `better-auth.session_token=${ctx.session.id}`
        }
      });
      
      await logAuthEvent({
        type: 'password_changed',
        userId: ctx.user.id,
        timestamp: new Date(),
      });
      
      return {
        success: true,
        message: "Password changed successfully",
      };
      
    } catch (error) {
      return returnValidationErrors(changePasswordSchema, {
        _errors: ["Failed to change password. Please try again."],
      });
    }
  });
```

#### Two-Factor Authentication Actions
```typescript
// actions/2fa-actions.ts
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const enableTwoFactorSchema = z.object({
  totpCode: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

export const enableTwoFactor = authActionClient
  .metadata({ actionName: "enableTwoFactor", rateLimit: 5 })
  .inputSchema(enableTwoFactorSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { totpCode } = parsedInput;
    
    try {
      // Enable 2FA with Better-Auth
      const result = await auth.twoFactor.enable({
        body: {
          code: totpCode,
        },
        headers: {
          cookie: `better-auth.session_token=${ctx.session.id}`
        }
      });
      
      if (!result.success) {
        return returnValidationErrors(enableTwoFactorSchema, {
          totpCode: { _errors: ["Invalid verification code"] },
        });
      }
      
      await logAuthEvent({
        type: '2fa_enabled',
        userId: ctx.user.id,
        timestamp: new Date(),
      });
      
      return {
        success: true,
        backupCodes: result.backupCodes,
        message: "Two-factor authentication enabled successfully",
      };
      
    } catch (error) {
      return returnValidationErrors(enableTwoFactorSchema, {
        _errors: ["Failed to enable two-factor authentication"],
      });
    }
  });

const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

export const verifyTwoFactor = authActionClient
  .metadata({ actionName: "verifyTwoFactor", rateLimit: 10 })
  .inputSchema(verifyTwoFactorSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { code } = parsedInput;
    
    try {
      const result = await auth.twoFactor.verify({
        body: { code },
        headers: {
          cookie: `better-auth.session_token=${ctx.session.id}`
        }
      });
      
      if (!result.success) {
        return returnValidationErrors(verifyTwoFactorSchema, {
          code: { _errors: ["Invalid verification code"] },
        });
      }
      
      return {
        success: true,
        verified: true,
      };
      
    } catch (error) {
      return returnValidationErrors(verifyTwoFactorSchema, {
        code: { _errors: ["Verification failed"] },
      });
    }
  });
```

### Authentication Security Patterns

#### Secure Session Management
```typescript
// lib/session-security.ts
export class SessionSecurityManager {
  static async validateSessionSecurity(sessionId: string, userId: string): Promise<boolean> {
    // Check for session hijacking indicators
    const sessionData = await getSessionData(sessionId);
    
    // Validate IP address consistency (with some flexibility for mobile users)
    const currentIP = getClientIP();
    if (sessionData.ipAddress && !isSimilarIP(sessionData.ipAddress, currentIP)) {
      await logSecurityEvent({
        type: 'suspicious_ip_change',
        userId,
        sessionId,
        oldIP: sessionData.ipAddress,
        newIP: currentIP,
      });
      
      // Force re-authentication for significant IP changes
      return false;
    }
    
    // Check for concurrent sessions from different locations
    const activeSessions = await getActiveSessionsForUser(userId);
    const suspiciousSessions = activeSessions.filter(session => 
      session.id !== sessionId && 
      !isSimilarIP(session.ipAddress, currentIP)
    );
    
    if (suspiciousSessions.length > 0) {
      await logSecurityEvent({
        type: 'concurrent_suspicious_sessions',
        userId,
        sessionId,
        suspiciousSessionCount: suspiciousSessions.length,
      });
    }
    
    return true;
  }
  
  static async invalidateAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await auth.api.invalidateOtherSessions({
      body: { userId, excludeSessionId: currentSessionId },
    });
    
    await logSecurityEvent({
      type: 'all_other_sessions_invalidated',
      userId,
      currentSessionId,
    });
  }
}

// Enhanced auth middleware with security checks
export const secureAuthMiddleware = createMiddleware()
  .define(async ({ next }) => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token")?.value;
    
    if (!sessionToken) {
      throw new ActionError("Authentication required", true);
    }
    
    const sessionData = await auth.api.getSession({
      headers: { 
        cookie: `better-auth.session_token=${sessionToken}` 
      },
    });
    
    if (!sessionData?.user) {
      throw new ActionError("Invalid session", true);
    }
    
    // Additional security validation
    const isSecure = await SessionSecurityManager.validateSessionSecurity(
      sessionData.session.id,
      sessionData.user.id
    );
    
    if (!isSecure) {
      // Force re-authentication
      cookieStore.delete("better-auth.session_token");
      throw new ActionError("Security validation failed. Please sign in again.", true);
    }
    
    return next({ 
      ctx: { 
        user: sessionData.user,
        session: sessionData.session,
      } 
    });
  });
```

### Best Practices for Server Action Authentication

#### Security Checklist ✅

**Authentication Flow**
- [ ] All protected actions use authentication middleware
- [ ] Session validation includes expiry and security checks
- [ ] Rate limiting implemented on all authentication endpoints
- [ ] Captcha verification for sensitive operations (login, register)
- [ ] Failed authentication attempts are logged and monitored

**Session Security**
- [ ] Session tokens are httpOnly and secure
- [ ] Session expiration is enforced server-side
- [ ] Concurrent session monitoring and management
- [ ] IP address validation for session hijacking prevention
- [ ] Automatic session refresh for active users

**Password Security**
- [ ] Strong password requirements enforced
- [ ] Current password verification for password changes
- [ ] Password changes are logged for audit
- [ ] Brute force protection with progressive delays

**Two-Factor Authentication**
- [ ] TOTP-based 2FA implementation
- [ ] Backup codes generated and stored securely
- [ ] 2FA verification rate limiting
- [ ] 2FA status changes logged for audit

**Error Handling**
- [ ] Generic error messages to prevent user enumeration
- [ ] Detailed error logging for security analysis
- [ ] Failed attempt monitoring and alerting
- [ ] Graceful handling of authentication edge cases

This comprehensive server action authentication system provides enterprise-grade security while maintaining excellent developer experience through next-safe-action's middleware architecture.
