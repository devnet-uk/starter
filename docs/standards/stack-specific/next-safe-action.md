# Next-Safe-Action Patterns

## Overview

Next-safe-action provides type-safe, validated server actions for Next.js applications with built-in middleware support, error handling, and end-to-end type safety. This library addresses the security concerns inherent in server actions while maintaining excellent developer experience.

## Installation and Setup

### Dependencies
```bash
npm install next-safe-action zod
```

### Basic Client Configuration
```typescript
// lib/safe-action.ts
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

// Base client with standardized error handling
export const actionClient = createSafeActionClient({
  // Flatten validation errors by default so clients receive ergonomic field maps
  defaultValidationErrorsShape: "flattened",
  // Handle server errors with proper logging and sanitization
  handleServerError(error, utils) {
    const { clientInput, bindArgsClientInputs, metadata, ctx } = utils;

    console.error("Server action error:", {
      error: error.message,
      stack: error.stack,
      clientInput,
      bindArgsClientInputs,
      metadata,
      ctx,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === "production") {
      // Forward structured payloads to your observability pipeline (Sentry, Datadog, etc.)
    }

    if (error instanceof ActionError && error.expose) {
      return error.message;
    }

    if (process.env.NODE_ENV === "development") {
      return error.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

// Custom error classes for controlled exposure
export class ActionError extends Error {
  constructor(message: string, public expose: boolean = false) {
    super(message);
    this.name = "ActionError";
  }
}
```

## Action Client Patterns

### Base Client with Logging Middleware
```typescript
// lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

const baseClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      rateLimit: z.number().optional(),
      requiresAuth: z.boolean().default(false),
    });
  },
  handleServerError(e) {
    console.error("Action error:", e.message);
    return "Internal server error occurred";
  },
}).use(async ({ next, clientInput, metadata }) => {
  // Logging middleware - runs for all actions
  console.log("LOGGING MIDDLEWARE");
  
  const startTime = performance.now();
  const result = await next();
  const endTime = performance.now();
  
  console.log("Action execution:", {
    name: metadata.actionName,
    duration: `${endTime - startTime}ms`,
    success: !!result.data,
    clientInput,
  });
  
  return result;
});

export { baseClient as actionClient };
```

### Authentication Client
```typescript
// lib/safe-action.ts (continued)
import { cookies } from "next/headers";
import { auth } from "@/lib/auth"; // Better-Auth instance

export const authActionClient = actionClient
  .use(async ({ next, metadata }) => {
    // Skip auth check if not required
    if (!metadata.requiresAuth) {
      return next();
    }
    
    const cookieStore = cookies();
    const session = cookieStore.get("better-auth.session_token")?.value;
    
    if (!session) {
      throw new ActionError("Authentication required", true);
    }
    
    // Validate session with Better-Auth
    const sessionData = await auth.api.getSession({
      headers: { 
        cookie: `better-auth.session_token=${session}` 
      },
    });
    
    if (!sessionData?.user) {
      throw new ActionError("Invalid session", true);
    }
    
    // Add user context for subsequent middleware/actions
    return next({ 
      ctx: { 
        user: sessionData.user,
        sessionId: sessionData.session.id,
      } 
    });
  });
```

### Admin Client with Role Validation
```typescript
// lib/safe-action.ts (continued)
export const adminActionClient = authActionClient
  .use(async ({ next, ctx }) => {
    const { user } = ctx;
    
    if (!user || user.role !== 'admin') {
      throw new ActionError("Admin access required", true);
    }
    
    return next({ 
      ctx: { 
        ...ctx,
        isAdmin: true,
      } 
    });
  });
```

### Rate Limiting Client
```typescript
// lib/safe-action.ts (continued)
import { headers } from "next/headers";

// Prefer a durable store (Upstash, Redis, database) in real deployments.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitedActionClient = actionClient
  .use(async ({ next, clientInput, metadata }) => {
    const limit = metadata.rateLimit || 10; // default 10 requests
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    // Create unique key based on IP and action
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor || 'unknown';
    const key = `${ip}:${metadata.actionName}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else if (record.count >= limit) {
      throw new ActionError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`, true);
    } else {
      record.count++;
    }
    
    return next();
  });
```

## Action Definitions

### Basic Validated Action
```typescript
// actions/user-actions.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  bio: z.string().max(500).optional(),
});

export const updateProfile = actionClient
  .metadata({ 
    actionName: "updateProfile",
    requiresAuth: true,
    rateLimit: 5 
  })
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    
    // Update user profile in database
    const updatedUser = await updateUserProfile(user.id, parsedInput);
    
    // Revalidate relevant pages
    revalidatePath("/profile");
    
    return {
      success: true,
      user: updatedUser,
    };
  });
```

### Action with Custom Validation Errors
```typescript
// actions/auth-actions.ts
"use server";

import { authActionClient } from "@/lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const loginUser = actionClient
  .metadata({ actionName: "loginUser", rateLimit: 3 })
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput;
    
    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return returnValidationErrors(loginSchema, {
        email: { _errors: ["No account found with this email"] },
      });
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return returnValidationErrors(loginSchema, {
        password: { _errors: ["Invalid password"] },
      });
    }
    
    // Create session
    const session = await createSession(user.id);
    
    return {
      success: true,
      redirectTo: "/dashboard",
    };
  });
```

### File Upload Action
```typescript
// actions/upload-actions.ts
"use server";

import { authActionClient } from "@/lib/safe-action";
import { zfd } from "zod-form-data";
import { z } from "zod";

const fileUploadSchema = zfd.formData({
  file: zfd.file(z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 
      "File must be JPEG, PNG, or WebP")),
  description: zfd.text(z.string().max(200).optional()),
});

export const uploadFile = authActionClient
  .metadata({ actionName: "uploadFile", requiresAuth: true })
  .inputSchema(fileUploadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { file, description } = parsedInput;
    const { user } = ctx;
    
    // Upload to storage service
    const uploadResult = await uploadToS3(file, {
      userId: user.id,
      description,
      timestamp: new Date(),
    });
    
    // Save file metadata to database
    const fileRecord = await saveFileRecord({
      userId: user.id,
      originalName: file.name,
      storagePath: uploadResult.path,
      size: file.size,
      mimeType: file.type,
      description,
    });
    
    return {
      success: true,
      fileId: fileRecord.id,
      url: uploadResult.publicUrl,
    };
  });
```

### Optimistic Update Action
```typescript
// actions/todo-actions.ts
"use server";

import { authActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  completed: z.boolean().default(false),
});

export type Todo = z.infer<typeof createTodoSchema>;

export const createTodo = authActionClient
  .metadata({ actionName: "createTodo", requiresAuth: true })
  .inputSchema(createTodoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create todo in database
    const todo = await createTodoInDatabase({
      ...parsedInput,
      userId: user.id,
      createdAt: new Date(),
    });
    
    revalidatePath("/todos");
    
    return {
      todo,
      success: true,
    };
  });
```

### Action with Bound Arguments
```typescript
// actions/onboarding-actions.ts
"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

const onboardingSchema = z.object({
  username: z.string().min(3).max(30),
});

export const onboardUser = actionClient
  .inputSchema(onboardingSchema)
  .bindArgsSchemas<[userId: z.ZodString, inviteCode: z.ZodString]>([
    z.string().uuid(),
    z.string().length(8),
  ])
  .action(async ({ parsedInput: { username }, bindArgsParsedInputs: [userId, inviteCode] }) => {
    await activateInvite({ userId, inviteCode, username });

    return { success: true };
  });

// Client component - invalid bound args now throw ActionBindArgsValidationError server-side (v8+)
const boundOnboardUser = onboardUser.bind(null, session.user.id, inviteCodeFromURL);
```

### Throw Validation Errors for Client-Side try/catch
```typescript
// actions/account-actions.ts
"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

const changeEmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const changeEmail = actionClient
  .inputSchema(changeEmailSchema)
  .action(
    async ({ parsedInput: { email }, ctx }) => {
      await updateUserEmail({ userId: ctx.user.id, email });

      return { success: true };
    },
    {
      throwValidationErrors: {
        overrideErrorMessage: async (errors) =>
          errors.email?._errors?.join(" ") ?? "Invalid email",
      },
    }
  );
```

## Client-Side Integration

### React Hook Form Integration
```typescript
// components/forms/UpdateProfileForm.tsx
"use client";

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; // or your toast system of choice
import { updateProfile } from "@/actions/user-actions";

const formSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function UpdateProfileForm({ user }: { user: User }) {
  const { form, action, handleSubmitWithAction } = useHookFormAction(
    updateProfile,
    zodResolver(formSchema),
    {
      formProps: {
        defaultValues: {
          name: user.name,
          email: user.email,
          bio: user.bio ?? "",
        },
      },
      actionProps: {
        onSuccess: ({ data }) => {
          toast.success("Profile updated successfully!");
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError);
          }
        },
      },
    }
  );

  const {
    register,
    formState: { errors },
  } = form;
  const { isExecuting, hasSucceeded, result } = action;

  return (
    <form onSubmit={handleSubmitWithAction} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input {...register("name")} id="name" disabled={isExecuting} />
        {/* Validation errors are mapped automatically by the adapter */}
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          {...register("email")}
          id="email"
          type="email"
          disabled={isExecuting}
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea {...register("bio")} id="bio" disabled={isExecuting} />
        {errors.bio && <p className="error">{errors.bio.message}</p>}
      </div>

      {result?.serverError && <p className="error">{result.serverError}</p>}

      <button type="submit" disabled={isExecuting}>
        {isExecuting ? "Updating..." : hasSucceeded ? "Saved" : "Update Profile"}
      </button>
    </form>
  );
}
```

### Optimistic Updates
```typescript
// components/TodoList.tsx
"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { createTodo, type Todo } from "@/actions/todo-actions";
import { v4 as uuidv4 } from "uuid";

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const { execute, optimisticState, isPending } = useOptimisticAction(
    createTodo,
    {
      currentState: initialTodos,
      updateFn: (state, input) => {
        // Optimistically add the new todo immediately after execute()
        return [...state, input];
      },
    }
  );
  
  const handleAddTodo = (title: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      completed: false,
    };
    
    execute(newTodo);
  };
  
  return (
    <div>
      <AddTodoForm onAdd={handleAddTodo} />
      <div className="todo-list">
        {optimisticState.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
      {isPending && <p className="text-muted">Saving…</p>}
    </div>
  );
}
```

## Error Handling Patterns

### Global Error Boundaries
```typescript
// components/ServerActionErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ServerActionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Server action error boundary:", error, errorInfo);
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error);
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error?.message}
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Structured Error Response
```typescript
// lib/error-handling.ts
export interface ActionErrorResponse {
  type: 'validation' | 'authentication' | 'authorization' | 'server';
  message: string;
  field?: string;
  code?: string;
}

export function handleActionError(error: any): ActionErrorResponse {
  if (error.validationErrors) {
    const firstFieldError = Object.entries(error.validationErrors)[0];
    if (firstFieldError) {
      const [field, fieldErrors] = firstFieldError;
      return {
        type: 'validation',
        message: fieldErrors._errors?.[0] || 'Validation failed',
        field,
        code: 'VALIDATION_ERROR',
      };
    }
  }
  
  if (error.serverError?.includes('Authentication required')) {
    return {
      type: 'authentication',
      message: 'Please sign in to continue',
      code: 'AUTH_REQUIRED',
    };
  }
  
  if (error.serverError?.includes('Admin access')) {
    return {
      type: 'authorization',
      message: 'You do not have permission to perform this action',
      code: 'INSUFFICIENT_PERMISSIONS',
    };
  }
  
  return {
    type: 'server',
    message: error.serverError || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}
```

- Pair `throwValidationErrors` with a `try/catch` on the client when you need to short-circuit UI logic instead of mapping field errors.
- When `throwValidationErrors` is enabled, `useAction(...).result.serverError` remains `undefined`; rely on the thrown error or provided lifecycle callbacks for messaging.

## Testing Patterns

### Action Testing
```typescript
// __tests__/actions/user-actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { updateProfile } from '@/actions/user-actions';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('updateProfile', () => {
  it('should update profile successfully', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    };
    
    // Mock the database update
    vi.mocked(updateUserProfile).mockResolvedValue(mockUser);
    
    const result = await updateProfile({
      name: 'John Smith',
      email: 'john.smith@example.com',
    });
    
    expect(result.data?.success).toBe(true);
    expect(result.data?.user.name).toBe('John Smith');
    expect(result.validationErrors).toBeUndefined();
    expect(result.serverError).toBeUndefined();
  });
  
  it('should return validation errors for invalid input', async () => {
    const result = await updateProfile({
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: not an email
    });
    
    expect(result.data).toBeUndefined();
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors?.name?._errors).toContain('Name is required');
    expect(result.validationErrors?.email?._errors).toContain('Invalid email format');
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/auth-flow.test.ts
import { describe, it, expect } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { loginUser } from '@/actions/auth-actions';

describe('Auth Flow Integration', () => {
  it('should handle complete login flow', async () => {
    // Test successful login
    const loginResult = await loginUser({
      email: 'test@example.com',
      password: 'validPassword123',
    });
    
    expect(loginResult.data?.success).toBe(true);
    expect(loginResult.data?.redirectTo).toBe('/dashboard');
    
    // Verify session was created
    // ... additional assertions
  });
  
  it('should handle rate limiting', async () => {
    // Simulate multiple rapid requests
    const promises = Array(5).fill(null).map(() =>
      loginUser({
        email: 'test@example.com',
        password: 'wrongPassword',
      })
    );
    
    const results = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResults = results.filter(
      result => result.serverError?.includes('Rate limit exceeded')
    );
    
    expect(rateLimitedResults.length).toBeGreaterThan(0);
  });
});
```

## Best Practices

### Do's ✅
- Validate every input with Zod (or TypeSchema-supported) schemas and keep types in sync end-to-end
- Configure explicit error handling: flatten validation errors, sanitize messages, and forward structured telemetry
- Layer middleware for cross-cutting concerns (auth, rate limiting, metadata) instead of duplicating logic per action
- Reach for the official adapters (`useHookFormAction`, `useHookFormOptimisticAction`) to wire forms and optimistic UI
- Exercise both happy-path and failure-path tests (including optimistic flows and middleware behaviour)
- Opt into `throwValidationErrors` when the caller should fail fast via try/catch rather than inspecting `validationErrors`

### Don'ts ❌
- Never expose sensitive error details or log credentials/tokens
- Don't skip validation for "trusted" inputs or mutate schemas dynamically
- Avoid expensive operations without rate limiting, backgrounding, or caching strategies
- Keep actions decoupled from UI components and honour middleware return values
- Don't depend on in-memory stores for rate limiting—back with Redis/Upstash (or similar) instead
- Remember v8+ throws on invalid bind args; catch and log server-side to aid debugging

### Security Considerations
- All server actions are public endpoints - treat them as such
- Validate all inputs, even from trusted sources
- Use authentication middleware for protected actions
- Implement rate limiting for sensitive operations
- Log all action executions for audit trails
- Use HTTPS in production environments
- Sanitize all user inputs before database operations
- Implement proper session management with Better-Auth

### Performance Optimization
- Use middleware judiciously - each adds overhead
- Cache expensive validation operations
- Implement proper database connection pooling
- Use optimistic updates to improve perceived performance
- Monitor action execution times
- Consider pagination for large datasets
- Implement proper indexing for database queries used in actions
