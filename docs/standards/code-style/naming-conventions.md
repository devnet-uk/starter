# Naming Conventions

## File Naming

### Components
```
UserProfile.tsx       # React component
UserProfile.test.tsx  # Component test
UserProfile.stories.tsx # Storybook story
UserProfile.module.css # CSS module
```

### Utilities and Hooks
```
useAuth.ts           # Custom hook
formatDate.ts        # Utility function
constants.ts         # Constants
types.ts            # Type definitions
```

### API and Services
```
userService.ts       # Service class
userApi.ts          # API functions
userRepository.ts   # Repository pattern
```

## Variable Naming

### General Rules
```typescript
// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// Variables - camelCase
const userName = 'John';
let isLoading = false;

// Functions - camelCase, verb prefix
function fetchUser() {}
function calculateTotal() {}
function hasPermission() {}

// Classes - PascalCase
class UserService {}
class EventEmitter {}

// Interfaces/Types - PascalCase
interface User {}
type ApiResponse = {};

// Enums - PascalCase with UPPER_SNAKE_CASE values
enum Status {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### React Components
```typescript
// Components - PascalCase
function UserProfile() {}
const Button: FC<ButtonProps> = () => {};

// Props interfaces - ComponentNameProps
interface UserProfileProps {}
interface ButtonProps {}

// Event handlers - handle prefix
const handleClick = () => {};
const handleSubmit = () => {};

// Boolean props - is/has/should prefix
interface Props {
  isLoading: boolean;
  hasError: boolean;
  shouldAutoFocus: boolean;
}
```

### Hooks
```typescript
// Custom hooks - use prefix
function useAuth() {}
function useDebounce() {}
function usePrevious() {}

// Hook return values - descriptive names
const { user, isLoading, error } = useAuth();
const { data, refetch, isRefetching } = useQuery();
```

## Database Naming

### Drizzle ORM Patterns
For comprehensive Drizzle ORM naming conventions and patterns, see [Drizzle Patterns](../stack-specific/drizzle-patterns.md).
