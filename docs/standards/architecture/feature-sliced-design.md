# Feature-Sliced Design

## Overview
Feature-Sliced Design organizes code by business features rather than technical layers. With React 19 Server Components, this architecture adapts to support server-side rendering and client-side interactivity boundaries.

> **Integration Note**: See [Integration Strategy](./integration-strategy.md) for how Feature-Sliced Design frontend applications integrate with Clean Architecture backend services through type-safe contracts.

## React Server Components Integration

### Server/Client Component Boundaries
```typescript
// Server Components (no directive needed)
// - Pages layer components
// - Data-fetching components  
// - Static UI components

// Client Components (require 'use client')
// - Interactive features
// - State management components
// - Event handling components
```

## Layer Hierarchy

### App Layer (Initialization)
```
/src/app/
├── layout.tsx          # Root Server Component
├── page.tsx            # Home page Server Component
├── providers/          # Client-side providers
│   ├── ClientProviders.tsx  # 'use client' wrapper
│   ├── ThemeProvider.tsx    # Client Component
│   ├── AuthProvider.tsx     # Client Component  
│   └── QueryProvider.tsx    # Client Component
├── globals.css         # Global styles
└── actions/            # Server Actions
    ├── auth.ts         # 'use server' auth actions
    └── api.ts          # 'use server' API actions
```

**RSC Pattern:**
```typescript
// app/layout.tsx (Server Component)
import { ClientProviders } from './providers/ClientProviders';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  return (
    <html>
      <body>
        <ClientProviders session={session}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

// app/providers/ClientProviders.tsx (Client Component)
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';

export function ClientProviders({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session: Session | null;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Processes Layer (Cross-cutting flows)
```
/src/processes/
├── auth/               # Authentication flow
│   ├── ui/
│   │   └── AuthFlow.tsx
│   └── model/
│       └── authMachine.ts
└── payment/            # Payment processing
    ├── ui/
    └── model/
```

### Pages Layer (Routes)
```
/src/app/
├── dashboard/
│   ├── page.tsx        # Server Component (data fetching)
│   ├── loading.tsx     # Loading UI
│   ├── error.tsx       # Error boundary
│   └── components/     # Page-specific components
│       ├── DashboardStats.tsx      # Server Component
│       └── DashboardFilters.tsx    # Client Component
└── profile/
    ├── page.tsx        # Server Component
    └── components/
        ├── ProfileInfo.tsx         # Server Component
        └── ProfileSettings.tsx     # Client Component
```

**RSC Pattern:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react';
import { DashboardStats } from './components/DashboardStats';
import { DashboardFilters } from './components/DashboardFilters';

export default async function DashboardPage() {
  // Fetch data on server
  const initialStats = await fetchDashboardStats();
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Client Component for interactivity */}
      <DashboardFilters />
      
      {/* Server Component with Suspense for streaming */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats initialData={initialStats} />
      </Suspense>
    </div>
  );
}

// app/dashboard/components/DashboardFilters.tsx (Client Component)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardFilters() {
  const [filters, setFilters] = useState({});
  const router = useRouter();
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    router.push(`/dashboard?${new URLSearchParams(newFilters)}`);
  };
  
  return (
    <div className="filters">
      {/* Interactive filter UI */}
    </div>
  );
}
```

### Features Layer (User actions)
```
/src/features/
├── create-post/
│   ├── ui/
│   │   ├── CreatePostButton.tsx    # Client Component
│   │   ├── CreatePostModal.tsx     # Client Component
│   │   └── CreatePostForm.tsx      # Client Component
│   ├── actions/
│   │   └── createPost.ts           # Server Action
│   └── model/
│       └── useCreatePost.ts        # Client-side hook
└── search-users/
    ├── ui/
    │   ├── SearchInput.tsx          # Client Component
    │   └── SearchResults.tsx        # Server Component
    ├── actions/
    │   └── searchUsers.ts           # Server Action
    └── model/
        └── useSearchUsers.ts        # Client-side hook
```

**RSC Pattern:**
```typescript
// features/create-post/actions/createPost.ts (Server Action)
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  // Validate and create post
  const post = await db.posts.create({
    data: { title, content, authorId: userId }
  });
  
  // Revalidate and redirect
  revalidatePath('/posts');
  redirect(`/posts/${post.id}`);
}

// features/create-post/ui/CreatePostButton.tsx (Client Component)
'use client';

import { useState } from 'react';
import { CreatePostModal } from './CreatePostModal';

export function CreatePostButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create Post
      </button>
      
      {isOpen && (
        <CreatePostModal 
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// features/create-post/ui/CreatePostModal.tsx (Client Component)
'use client';

import { createPost } from '../actions/createPost';

export function CreatePostModal({ onClose }) {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" />
      <textarea name="content" placeholder="Post content" />
      <button type="submit">Create Post</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
}
```

### Entities Layer (Business entities)
```
/src/entities/
├── user/
│   ├── model/
│   │   ├── User.ts
│   │   └── userStore.ts
│   ├── ui/
│   │   ├── UserCard.tsx
│   │   └── UserAvatar.tsx
│   └── api/
│       └── userApi.ts
└── post/
    ├── model/
    ├── ui/
    └── api/
```

### Shared Layer (Reusable utilities)
```
/src/shared/
├── ui/              # UI kit components
├── api/             # API client setup
├── lib/             # Utilities
└── config/          # Configuration
```

## Import Rules
- Layers can only import from layers below
- No circular dependencies between slices  
- Features cannot import from other features
- Server Components cannot import Client Components
- Client Components can import Server Components as children
- Server Actions can only be called from Client Components or other Server Actions

## Public API Pattern
```typescript
// entities/user/index.ts
export { UserCard, UserAvatar } from './ui';
export { type User, userStore } from './model';
export { fetchUser } from './api';
```

## RSC-Specific Patterns

### Component Composition
```typescript
// Server Component (pages/dashboard)
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  
  return (
    <div>
      {/* Pass data to Client Component */}
      <DashboardFilters initialData={data.filters} />
      
      {/* Compose Server Components */}
      <DashboardStats data={data.stats} />
    </div>
  );
}

// Client Component (features/dashboard-filters)
'use client';

export function DashboardFilters({ initialData }) {
  const [filters, setFilters] = useState(initialData);
  
  return (
    <div>
      {/* Interactive elements */}
    </div>
  );
}
```

### Data Fetching Patterns

#### Server Components (Direct Async)
```typescript
// entities/user/api/userApi.ts (Server-side)
export async function fetchUser(id: string) {
  const user = await db.users.findUnique({ where: { id } });
  return user;
}

// entities/user/ui/UserCard.tsx (Server Component)
export async function UserCard({ userId }: { userId: string }) {
  const user = await fetchUser(userId);
  
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Client Components with `use` Hook (React 19)
```typescript
// Server Component passing Promise to Client Component
export default async function UserPage({ params }) {
  const userPromise = fetchUser(params.id);
  
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserDetails userPromise={userPromise} />
      </Suspense>
    </div>
  );
}

// entities/user/ui/UserDetails.tsx (Client Component)
'use client';

import { use } from 'react';

export function UserDetails({ userPromise }) {
  const user = use(userPromise);
  
  return (
    <div className="user-details">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Streaming with Suspense
```typescript
// Server Component with Promise streaming
export async function UserProfilePage({ userId }) {
  // Start both requests concurrently  
  const userPromise = fetchUser(userId);
  const postsPromise = fetchUserPosts(userId);
  
  return (
    <div>
      {/* Show user data immediately when available */}
      <Suspense fallback={<UserSkeleton />}>
        <UserCard userId={userId} />
      </Suspense>
      
      {/* Show posts when available */}
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts postsPromise={postsPromise} />
      </Suspense>
    </div>
  );
}
```

### Server Actions Integration
```typescript
// features/user-profile/actions/updateProfile.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  await db.users.update({
    where: { id: userId },
    data: { name, email }
  });
  
  revalidatePath('/profile');
}

// features/user-profile/ui/ProfileForm.tsx (Client Component)
'use client';

import { updateProfile } from '../actions/updateProfile';

export function ProfileForm({ user }) {
  return (
    <form action={updateProfile}>
      <input name="name" defaultValue={user.name} />
      <input name="email" defaultValue={user.email} />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

## Benefits
- Clear feature boundaries
- Parallel development  
- Easy to understand business logic
- Reduced coupling between features
- **RSC Benefits:**
  - Optimal performance with server-side data fetching
  - Reduced client bundle size
  - Better SEO and initial page load
  - Progressive enhancement with client-side interactivity