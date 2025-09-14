# React Patterns

## React 19 Server Components

### Server Component Directives
```typescript
// ✅ Server Component (default - no directive needed)
// Runs on server, can access databases directly
export async function UserList() {
  const users = await db.query.users.findMany();
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// ✅ Client Component - runs in browser
'use client';

import { useState, useEffect } from 'react';

export function InteractiveButton({ children }) {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {children} ({count})
    </button>
  );
}

// ✅ Server Actions - server functions callable from client
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  await db.insert(posts).values({ title, content });
  revalidatePath('/posts');
}
```

### RSC Boundaries and Composition
```typescript
// ✅ Server Component containing Client Components
export async function PostPage({ id }: { id: string }) {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id)
  });
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      
      {/* Client Component for interactivity */}
      <LikeButton postId={id} initialLikes={post.likes} />
      
      {/* Server Component for comments */}
      <CommentsSection postId={id} />
    </article>
  );
}

// ✅ Client Component that accepts Server Component children
'use client';

export function ClientWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={isExpanded ? 'expanded' : 'collapsed'}>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        Toggle
      </button>
      {isExpanded && children}
    </div>
  );
}
```

### Async Components and Streaming
```typescript
// ✅ Async Server Component with Suspense
export async function AsyncUserProfile({ userId }: { userId: string }) {
  // This will automatically stream
  const [user, posts] = await Promise.all([
    fetchUser(userId),
    fetchUserPosts(userId)
  ]);
  
  return (
    <div>
      <UserInfo user={user} />
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts posts={posts} />
      </Suspense>
    </div>
  );
}

// ✅ Error boundaries for Server Components
export function UserProfileWithError({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<ProfileError />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <AsyncUserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Component Structure

### Function Components
```typescript
// ✅ Preferred component structure
import { useState, useCallback, useMemo } from 'react';
import type { FC } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
  className?: string;
}

export const UserProfile: FC<UserProfileProps> = ({ 
  userId, 
  onUpdate,
  className 
}) => {
  // 1. State declarations
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. Custom hooks
  const { user, loading, error } = useUser(userId);
  
  // 3. Memoized values
  const fullName = useMemo(
    () => `${user?.firstName} ${user?.lastName}`,
    [user?.firstName, user?.lastName]
  );
  
  // 4. Callbacks
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  const handleSave = useCallback((data: UserData) => {
    updateUser(data);
    onUpdate?.(data);
    setIsEditing(false);
  }, [onUpdate]);
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [userId]);
  
  // 6. Early returns
  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;
  
  // 7. Main render
  return (
    <div className={cn('user-profile', className)}>
      {/* Component JSX */}
    </div>
  );
};
```

## Custom Hooks

### Hook Patterns
```typescript
// ✅ Properly structured custom hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// ✅ Hook with cleanup
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: HTMLElement | Window = window
) {
  const savedHandler = useRef(handler);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) => {
      savedHandler.current(event);
    };
    
    element.addEventListener(eventName, eventListener as EventListener);
    
    return () => {
      element.removeEventListener(eventName, eventListener as EventListener);
    };
  }, [eventName, element]);
}
```

## State Management Patterns

### Local State
```typescript
// ✅ Use state for UI state
const [isOpen, setIsOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState<Tab>('profile');

// ✅ Use reducer for complex state
interface State {
  loading: boolean;
  error: Error | null;
  data: Data | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Data }
  | { type: 'FETCH_ERROR'; payload: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { loading: false, error: null, data: action.payload };
    case 'FETCH_ERROR':
      return { loading: false, error: action.payload, data: null };
    default:
      return state;
  }
}
```

## Performance Optimization

### Memoization
```typescript
// ✅ Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props.data);
}, [props.data]);

// ✅ Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  dispatch({ type: 'SELECT', payload: id });
}, [dispatch]);

// ✅ Memoize child components
const MemoizedChild = memo(ExpensiveChild, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.id === nextProps.id;
});
```

### Code Splitting
```typescript
// ✅ Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// ✅ Conditional loading
function Dashboard() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowAnalytics(true)}>
        Show Analytics
      </button>
      {showAnalytics && (
        <Suspense fallback={<Loading />}>
          <AnalyticsPanel />
        </Suspense>
      )}
    </>
  );
}
```

## Error Boundaries

### Error Boundary Implementation
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
    Sentry.captureException(error, {
      contexts: { react: errorInfo }
    });
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}
```
