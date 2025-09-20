# TanStack Query Patterns

> Reference `docs/standards/tech-stack.md` for the supported TanStack Query version (currently 5.87.4+).

We keep this standard as the canonical playbook for server-state management across Engineering OS repos. Refresh it when the upstream TanStack guidance evolves so product work can depend on a single, vetted source instead of copying ad-hoc snippets into implementation repos.

### Best Practices Checklist

- Centralise the `QueryClient` and provider in `app/providers.tsx` (or equivalent) so every route shares the same defaults and caches.
- Define query factories with `queryOptions` and reuse them for `useQuery`, `useSuspenseQuery`, `prefetchQuery`, `ensureQueryData`, and `useQueries`.
- Encode every variable dependency in the `queryKey`, guard optional queries with `enabled`, and keep keys stable (IDs, slugs, enums vs raw objects).
- Ensure fetchers return typed promises and cap retries to retryable failures; do not blindly retry 4xx responses.
- Use optimistic updates that snapshot, mutate, rollback on error, and then invalidate with `refetchType: 'active'`.
- Prefetch from React Server Components (RSC) with `fetchQuery`/`ensureQueryData`, hydrate via `HydrationBoundary`, and leave derived UI to client components.
- Use `select`, `placeholderData`, and `structuralSharing` to minimise rerenders for list-heavy views.

## Query Client Configuration

### Default Query Client

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return true;
  const status = 'status' in error ? Number((error as { status?: number }).status) : undefined;
  return status === undefined || status >= 500;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 5 * 60_000, // 5 minutes
      retry: (failureCount, error) => failureCount < 2 && isRetryableError(error),
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
      retry: 1,
    },
  },
});
```

Keep retry logic idempotent-aware; wrap destructive mutations in server-side checks instead of leaning on automatic retries. When a group of queries or mutations share identical behaviour, register defaults once:

```typescript
// Called during bootstrap to avoid duplicating queryFn definitions
queryClient.setQueryDefaults(['users'], {
  queryFn: fetchUsers,
  staleTime: 5 * 60_000,
});

queryClient.setMutationDefaults(['user', 'update'], {
  mutationFn: updateUser,
  networkMode: 'online',
});
```

### Provider Registration

```tsx
// app/providers.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '~/lib/queryClient';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
```

Prefer a shared provider file so tests and Storybook stories can reuse the same wrapper. Add listeners (focus, reconnect, online) in that file rather than deep in component trees.

## Query Factories & Key Discipline

```typescript
// lib/query-options/user.ts
import { queryOptions } from '@tanstack/react-query';

const userQuery = (userId: string) =>
  queryOptions({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

export const useUser = (userId: string) => useQuery(userQuery(userId));
export const useUserSuspense = (userId: string) => useSuspenseQuery(userQuery(userId));

export const ensureUser = (userId: string) =>
  queryClient.ensureQueryData(userQuery(userId));
```

Factories power a single source for keys, fetchers, and type inference. Reuse them with `useQueries` to run variable-length queries without violating the Rules of Hooks:

```typescript
// hooks/useUsers.ts
export function useUsers(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => userQuery(id)),
    combine: (results) => ({
      data: results.map((result) => result.data).filter(Boolean),
      isFetching: results.some((result) => result.isFetching),
    }),
  });
}
```

Ensure filters and pagination state live inside the `queryKey` so caches stay segmented:

```typescript
const postsQuery = ({ status, page }: { status: string; page: number }) =>
  queryOptions({
    queryKey: ['posts', { status, page }],
    queryFn: () => fetchPosts({ status, page }),
    placeholderData: (previous) => previous,
  });
```

## Query Patterns

```typescript
// Suspense-ready query
export const useAccountSuspense = (accountId: string) =>
  useSuspenseQuery(
    queryOptions({
      queryKey: ['account', accountId],
      queryFn: () => fetchAccount(accountId),
      staleTime: 2 * 60_000,
    }),
  );

// Derived data without extra rerenders
export const useTodoCount = () =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (todos) => todos.length,
  });

// Infinite scroll guards duplicate fetches
export const useInfinitePosts = (status: string) =>
  useInfiniteQuery({
    queryKey: ['posts', 'infinite', status],
    queryFn: ({ pageParam }) => fetchPosts({ status, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 3,
  });

// UI event
<List onEndReached={() => hasNextPage && !isFetching && fetchNextPage()} />;
```

- Prefer `placeholderData: (prev) => prev` over `initialData` for list caching when you want structural sharing.
- Co-locate query validators or schema parsing (Zod, Valibot) inside `queryFn` so you never cache malformed responses.
- Export `invalidate` helpers paired with each `queryOptions` factory to keep invalidation targets consistent.

## Mutation Patterns

```typescript
// hooks/useUpdateUser.ts
import { queryClient } from '~/lib/queryClient';

type UpdateUserInput = { id: string; name: string };

export const useUpdateUser = () => {
  return useMutation({
    mutationKey: ['user', 'update'],
    mutationFn: (input: UpdateUserInput) => updateUser(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['user', input.id] });

      const previous = queryClient.getQueryData(['user', input.id]);
      queryClient.setQueryData(['user', input.id], (user: User | undefined) =>
        user ? { ...user, ...input } : user,
      );

      return { previous };
    },
    onError: (_error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user', input.id], context.previous);
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: ['user', input.id],
        refetchType: 'active',
      });
    },
  });
};
```

- Always return the snapshot (`previous`) from `onMutate` so later callbacks can roll back reliably.
- Skip optimistic updates for destructive actions that cannot be reversed server-side; instead surface progress UI and wait for invalidation.
- Group related invalidations by helper (e.g., `invalidateUserList()`) that reads the query key from the factory to avoid typos.

## Prefetching, SSR, and Hydration

```tsx
// app/users/[id]/page.tsx (React Server Component)
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { userQuery } from '~/lib/query-options/user';

export default async function UserPage({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient();

  await queryClient.fetchQuery(userQuery(params.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* Avoid rendering derived counts here; let the client component read the cache. */}
      <UserProfile userId={params.id} />
    </HydrationBoundary>
  );
}
```

- Use `ensureQueryData` inside actions or loaders that might run multiple times to skip redundant fetches.
- Never access `queryClient.getQueryData` in an RSC outside hydration—it bypasses revalidation and risks stale HTML.
- When streaming, wrap subtrees in their own `HydrationBoundary` so incremental payloads hydrate independently.

## Testing & Tooling

- Prefer `@testing-library/react`'s `renderHook` with a shared `QueryClientProvider` wrapper; reset caches between tests to avoid state bleed.
- Silence network logs in tests by passing a custom `logger` to the `QueryClient` during test runs.
- Keep the React Query Devtools behind a development guard as shown in the provider example to avoid bundling it in production builds.

## Additional References

- `queryOptions` guide: https://tanstack.com/query/latest/docs/react/guides/query-options
- Render optimisation: https://tanstack.com/query/latest/docs/react/guides/render-optimizations
- Infinite queries: https://tanstack.com/query/latest/docs/react/guides/infinite-queries
- Advanced SSR patterns: https://tanstack.com/query/latest/docs/react/guides/advanced-ssr
