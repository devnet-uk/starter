# TypeScript Style Guide

<!-- Monorepo-specific guidance -->
<conditional-block task-condition="monorepo|workspace|pnpm|turbo" context-check="monorepo-tsconfig-context">
IF the current task involves a monorepo:
  NOTE: For monorepo environments, the TypeScript configuration requires a different structure involving a root `tsconfig.base.json`. The following compiler options should be placed in the base file. For the complete structural guide, refer to the Monorepo Initialization Guide.
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get TypeScript Configuration section from development/monorepo-setup.md#6-typescript-configuration"
  </context_fetcher_strategy>
</conditional-block>

## Type System Configuration

### Strict TypeScript Settings (5.9+)
```json
// tsconfig.json
{
  "compilerOptions": {
    // Core strict settings
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    
    // Enhanced strictness (5.9+)
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    
    // Additional safety checks
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Enhanced error reporting (5.9+)
    "noErrorTruncation": true,
    "assumeChangesOnlyAffectDirectDependencies": false,
    
    // Module resolution improvements
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    
    // Performance optimizations
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    
    // Modern JavaScript features
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    
    // Path mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  
  // Include/exclude patterns
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "dist",
    "build"
  ]
}
```

## Type Definitions

### Prefer Interfaces for Objects
```typescript
// ✅ Interface for object shapes
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

interface UserProfile {
  name: string;
  bio?: string;
  avatar?: string;
}

// ✅ Type for unions, intersections, utilities
type Status = 'pending' | 'active' | 'suspended';
type ID = string | number;
type Nullable<T> = T | null;
type ReadonlyUser = Readonly<User>;
```

### Generic Types
```typescript
// ✅ Constrained generics
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ Default generics
interface ApiResponse<T = unknown, E = Error> {
  data?: T;
  error?: E;
  loading: boolean;
}

// ✅ Conditional types
type IsArray<T> = T extends any[] ? true : false;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// ✅ Const type parameters (TypeScript 5.9+)
function createTuple<const T extends readonly unknown[]>(...args: T): T {
  return args;
}

// Preserves exact tuple type
const tuple = createTuple('hello', 42, true); // Type: readonly ['hello', 42, true]

// ✅ Const assertions with generics
function asConst<const T>(value: T): T {
  return value;
}

const config = asConst({
  theme: 'dark',
  version: '1.0.0',
  features: ['auth', 'billing']
}); // All properties have literal types

// ✅ Template literal types with const
type EventName<T extends string> = `on${Capitalize<T>}`;
type CreateEventHandlers<const T extends readonly string[]> = {
  [K in T[number] as EventName<K>]: (data: any) => void;
};

const events = ['click', 'hover', 'focus'] as const;
type Handlers = CreateEventHandlers<typeof events>;
// Result: { onClick: (data: any) => void; onHover: (data: any) => void; onFocus: (data: any) => void }
```

### Utility Types Usage
```typescript
// Built-in utilities
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type ReadonlyUser = Readonly<User>;
type UserKeys = keyof User;
type NameOnly = Pick<User, 'name'>;
type WithoutEmail = Omit<User, 'email'>;
type UserRecord = Record<string, User>;

// Custom utilities
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

### Satisfies Operator (TypeScript 5.9+)
```typescript
// ✅ Use satisfies for type safety while preserving literal types
const userConfig = {
  name: 'John',
  age: 30,
  roles: ['admin', 'user'] as const,
  settings: {
    theme: 'dark',
    notifications: true
  }
} satisfies UserConfig;

// Type is preserved as literal, not widened to string
userConfig.settings.theme; // Type: 'dark', not string

// ✅ Satisfies with computed properties
const statusMap = {
  pending: { color: 'yellow', priority: 1 },
  active: { color: 'green', priority: 2 },
  suspended: { color: 'red', priority: 3 }
} satisfies Record<Status, { color: string; priority: number }>;

// ✅ Ensure all enum values are handled
const statusHandlers = {
  [Status.PENDING]: () => handlePending(),
  [Status.ACTIVE]: () => handleActive(), 
  [Status.SUSPENDED]: () => handleSuspended()
} satisfies Record<Status, () => void>;

// ✅ API response validation
const apiResponse = {
  data: userData,
  status: 200,
  headers: responseHeaders
} satisfies ApiResponse<User>;
```

## Type Guards and Assertions

### Type Guards
```typescript
// ✅ User-defined type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

// ✅ Discriminated unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}

// Usage
const result = await fetchUser();
if (isSuccess(result)) {
  console.log(result.data); // TypeScript knows data exists
}
```

### Assertion Functions
```typescript
// ✅ Assertion functions
function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is not defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

// Usage
function processUser(user: User | null) {
  assertDefined(user, 'User is required');
  // TypeScript knows user is not null here
  console.log(user.email);
}
```
