# Authentication Patterns Standards

This document defines comprehensive authentication patterns for implementing secure user authentication following Clean Architecture principles.

## Core Authentication Patterns

### 1. Multi-Factor Authentication (MFA) Patterns

#### TOTP (Time-based One-Time Password) Implementation
```typescript
// Domain Interface
interface IMFAService {
  enableTOTP(userId: string, password: string): Promise<Result<TOTPSetupData>>
  verifyTOTP(userId: string, code: string, trustDevice?: boolean): Promise<Result<boolean>>
  generateBackupCodes(userId: string): Promise<Result<string[]>>
}

// Use Case Implementation
class EnableMFAUseCase {
  constructor(
    private mfaService: IMFAService,
    private userRepository: IUserRepository
  ) {}

  async execute(command: EnableMFACommand): Promise<Result<TOTPSetupData>> {
    // Validate user credentials
    const user = await this.userRepository.findById(command.userId)
    if (!user) return Result.fail('User not found')

    // Enable TOTP with Better Auth patterns
    const setupResult = await this.mfaService.enableTOTP(
      command.userId, 
      command.password
    )
    
    if (setupResult.isSuccess) {
      // Update user MFA status
      user.enableMFA()
      await this.userRepository.save(user)
    }

    return setupResult
  }
}
```

#### SMS/Email OTP Patterns
```typescript
interface IOTPService {
  sendOTP(contact: string, type: 'sms' | 'email'): Promise<Result<void>>
  verifyOTP(contact: string, code: string): Promise<Result<boolean>>
}

// Better Auth OTP Integration
class BetterAuthOTPService implements IOTPService {
  async sendOTP(email: string, type: 'email'): Promise<Result<void>> {
    try {
      await this.auth.api.sendEmailOTP({
        body: { email, type: 'verify-email' }
      })
      return Result.ok()
    } catch (error) {
      return Result.fail(`Failed to send OTP: ${error.message}`)
    }
  }
}
```

### 2. Session Management Patterns

#### Secure Session Configuration
```typescript
// Better Auth Session Configuration
export const sessionConfig = {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 24 hours
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 * 1000 // 5 minutes
    }
  }
}

// Domain Session Entity
class UserSession extends Entity<SessionProps> {
  public static create(props: CreateSessionProps): Result<UserSession> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.userId, argumentName: 'userId' },
      { argument: props.expiresAt, argumentName: 'expiresAt' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new UserSession({
      ...props,
      createdAt: new Date(),
      isActive: true
    }))
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  public extend(duration: number): void {
    this.props.expiresAt = new Date(Date.now() + duration)
    this.props.updatedAt = new Date()
  }
}
```

### 3. Password Reset Security Patterns

#### Secure Token Generation and Validation
```typescript
// Domain Service for Password Reset
class PasswordResetService implements IPasswordResetService {
  constructor(
    private tokenGenerator: ISecureTokenGenerator,
    private emailService: IEmailService,
    private userRepository: IUserRepository
  ) {}

  async initiateReset(email: string): Promise<Result<void>> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      // Return success to prevent email enumeration
      return Result.ok()
    }

    // Generate secure token with expiration
    const token = await this.tokenGenerator.generate({
      userId: user.id.toString(),
      purpose: 'password_reset',
      expiresIn: 3600 // 1 hour
    })

    // Better Auth Reset Email Pattern
    await this.emailService.sendPasswordReset({
      to: user.email,
      resetUrl: `${process.env.APP_URL}/reset-password?token=${token}`,
      expiresIn: '1 hour'
    })

    return Result.ok()
  }

  async validateResetToken(token: string): Promise<Result<string>> {
    const validation = await this.tokenGenerator.validate(token)
    if (!validation.isValid) {
      return Result.fail('Invalid or expired reset token')
    }

    return Result.ok(validation.userId)
  }
}

// Better Auth Integration
export const authConfig = betterAuth({
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        template: 'password-reset',
        data: { resetUrl: url, expiresIn: '1 hour' }
      })
    },
    onPasswordReset: async ({ user }) => {
      // Log security event
      await auditLogger.log('password_reset', { userId: user.id })
    }
  }
})
```

### 4. JWT Token Management Patterns

#### Refresh Token Strategy
```typescript
// Domain Token Entity
class AuthToken extends ValueObject<TokenProps> {
  public static create(props: CreateTokenProps): Result<AuthToken> {
    // Validation logic
    return Result.ok(new AuthToken({
      accessToken: props.accessToken,
      refreshToken: props.refreshToken,
      expiresAt: new Date(Date.now() + props.expiresIn * 1000),
      tokenType: 'Bearer'
    }))
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  public needsRefresh(): boolean {
    const fiveMinutes = 5 * 60 * 1000
    return (this.props.expiresAt.getTime() - Date.now()) < fiveMinutes
  }
}

// Token Refresh Use Case
class RefreshTokenUseCase {
  async execute(refreshToken: string): Promise<Result<AuthToken>> {
    try {
      const response = await this.auth.api.refreshToken({
        body: { refreshToken }
      })

      return AuthToken.create({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn
      })
    } catch (error) {
      return Result.fail('Token refresh failed')
    }
  }
}
```

### 5. Account Registration Patterns

#### Secure User Registration with Validation
```typescript
// Registration Use Case with Better Auth
class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private passwordPolicy: IPasswordPolicy
  ) {}

  async execute(command: RegisterUserCommand): Promise<Result<User>> {
    // Domain validation
    const emailResult = Email.create(command.email)
    if (emailResult.isFailure) return Result.fail(emailResult.error)

    const passwordResult = await this.passwordPolicy.validate(command.password)
    if (passwordResult.isFailure) return Result.fail(passwordResult.error)

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(command.email)
    if (existingUser) return Result.fail('User already exists')

    // Better Auth Registration
    const authResult = await this.auth.api.signUp.email({
      body: {
        email: command.email,
        password: command.password,
        name: command.name
      }
    })

    if (!authResult.user) {
      return Result.fail('Registration failed')
    }

    // Create domain user
    const userResult = User.create({
      email: emailResult.getValue(),
      name: command.name,
      isEmailVerified: false
    })

    if (userResult.isSuccess) {
      await this.userRepository.save(userResult.getValue())
    }

    return userResult
  }
}
```

## Security Standards

### 1. Password Security
- **Minimum Length**: 12 characters
- **Complexity**: Mix of upper, lower, numbers, symbols
- **Hashing**: Use Better Auth's scrypt implementation
- **Storage**: Never store plaintext passwords

### 2. Token Security
- **JWT Expiry**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Longer-lived with rotation
- **Secure Storage**: HTTPOnly cookies for sessions
- **CSRF Protection**: Built-in Better Auth protection

### 3. Session Security
- **Secure Cookies**: HTTPOnly, Secure, SameSite
- **Session Timeout**: Configurable idle timeout
- **Concurrent Sessions**: Limit per user
- **Device Tracking**: IP and User-Agent logging

### 4. MFA Security
- **TOTP Window**: 30-second periods with ±1 period tolerance
- **Backup Codes**: One-time use, securely encrypted
- **Device Trust**: 30-day trust period with refresh
- **Rate Limiting**: Prevent brute force attacks

## Verification Standards

<verification-block context-check="authentication-patterns-verification">
  <verification_definitions>
    <test name="no_plaintext_passwords">
      TEST: ! grep -r "password.*=" packages/core/src/ | grep -v "hash\|encrypt\|secure"
      REQUIRED: true
      ERROR: "Passwords must never be stored in plaintext"
      DESCRIPTION: "Ensures passwords are never stored or assigned in plaintext anywhere in the codebase."
    </test>
    <test name="mfa_implementation_complete">
      TEST: grep -r "twoFactor\|TOTP\|MFA" packages/core/src/use-cases/
      REQUIRED: true
      ERROR: "MFA use cases must be implemented"
      DESCRIPTION: "Verifies presence of multi-factor authentication flows in use cases."
    </test>
    <test name="secure_session_config">
      TEST: grep -r "httpOnly.*true\|secure.*true" packages/auth/
      REQUIRED: true
      ERROR: "Session cookies must be secure"
      DESCRIPTION: "Checks session cookies are configured with secure and httpOnly flags."
    </test>
    <test name="password_reset_security">
      TEST: grep -r "resetPasswordTokenExpiresIn" packages/auth/
      REQUIRED: true
      ERROR: "Password reset tokens must have expiration"
      DESCRIPTION: "Ensures password reset tokens expire to reduce risk of token abuse."
    </test>
  </verification_definitions>
</verification-block>

## Better-Auth Database Integration

### Database Adapter Configuration with Drizzle ORM

**Phoenix-Specific Better-Auth Setup**
```typescript
// packages/auth/src/config/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL for Phoenix
    schema: {
      // Custom schema mapping if needed
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verificationTokens,
    },
    usePlural: false, // Phoenix uses singular table names
  }),
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 * 1000 // 5 minutes
    }
  },

  // Email and password configuration
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async (url, user) => {
      // Integrate with notification-patterns.md
      await this.emailService.sendPasswordResetEmail(user.email, url);
    },
    sendVerificationEmail: async (url, user) => {
      await this.emailService.sendVerificationEmail(user.email, url);
    },
  },

  // Security settings
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // Disable for production security
    },
    generateId: () => crypto.randomUUID(), // Use secure ID generation
  },

  // CSRF protection (enabled by default)
  csrf: {
    enabled: true,
    sameSite: "lax"
  },

  // Social OAuth configuration (Phoenix requirements)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ["openid", "email", "profile"],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});

// Export typed client for frontend
export type Auth = typeof auth;
```

**Database Schema for Better-Auth (Drizzle)**
```typescript
// packages/infrastructure/src/database/schema/auth.ts
import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  jsonb,
  primaryKey 
} from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  
  // Phoenix custom fields
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  organizationRole: varchar('organization_role', { length: 50 }),
  
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 })
    .defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
});

export const sessions = pgTable('session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date', precision: 3 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 })
    .defaultNow().notNull(),
});

export const accounts = pgTable('account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 100 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at', { mode: 'date', precision: 3 }),
  password: varchar('password', { length: 255 }), // For email/password
}, (table) => ({
  pk: primaryKey(table.providerId, table.accountId),
}));

export const verificationTokens = pgTable('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(), // email or user ID
  value: varchar('value', { length: 255 }).notNull(), // token value
  expiresAt: timestamp('expires_at', { mode: 'date', precision: 3 }).notNull(),
  
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 })
    .defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey(table.identifier, table.value),
}));
```

**Infrastructure Service Implementation**
```typescript
// packages/infrastructure/src/auth/BetterAuthService.ts
import { IAuthenticationService } from '@/core/domain/interfaces/IAuthenticationService';
import { Result } from '@/core/domain/shared/Result';
import { auth } from './config/auth';

export class BetterAuthService implements IAuthenticationService {
  async signIn(email: string, password: string): Promise<Result<UserSession>> {
    try {
      const response = await auth.api.signInEmail({
        body: {
          email,
          password,
          rememberMe: true,
        },
      });

      if (!response.data?.user) {
        return Result.fail('Authentication failed');
      }

      // Map to domain entity
      const session = UserSession.create({
        userId: response.data.user.id,
        email: response.data.user.email,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return session;
    } catch (error) {
      return Result.fail(`Authentication failed: ${error.message}`);
    }
  }

  async signUp(userData: CreateUserData): Promise<Result<User>> {
    try {
      const response = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          callbackURL: '/verify-email',
        },
      });

      if (!response.data?.user) {
        return Result.fail('Registration failed');
      }

      // Map to domain entity
      const userResult = User.create({
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name,
        emailVerified: response.data.user.emailVerified,
      });

      return userResult;
    } catch (error) {
      return Result.fail(`Registration failed: ${error.message}`);
    }
  }
}
```

## Implementation Guidelines

### 1. Better Auth Integration
- Use Better Auth plugins for MFA, JWT, and social auth
- Implement domain interfaces that abstract Better Auth specifics
- Follow Better Auth security best practices
- Configure proper session and cookie settings

### 2. Error Handling
- Use Result pattern for all authentication operations
- Never expose internal error details to clients
- Implement proper audit logging for security events
- Handle network failures gracefully

### 3. Testing Patterns
```typescript
// In-Memory Test Implementation
class InMemoryAuthService implements IAuthService {
  private users = new Map<string, User>()
  private sessions = new Map<string, UserSession>()

  async authenticate(email: string, password: string): Promise<Result<UserSession>> {
    const user = this.users.get(email)
    if (!user || !user.validatePassword(password)) {
      return Result.fail('Invalid credentials')
    }

    const session = UserSession.create({
      userId: user.id.toString(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    })

    this.sessions.set(session.getValue().id.toString(), session.getValue())
    return session
  }
}
```

### 4. Monitoring and Auditing
- Log all authentication events
- Monitor failed login attempts
- Track MFA usage and device trust
- Alert on suspicious activities

This authentication patterns standard ensures secure, maintainable, and testable authentication implementations following Clean Architecture principles while leveraging Better Auth's comprehensive feature set.
