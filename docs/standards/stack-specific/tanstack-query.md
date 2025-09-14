# TanStack Query Patterns

## Query Configuration

### Query Client Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Query Patterns
```typescript
// hooks/useUser.ts
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Suspense query
export function useUserSuspense(userId: string) {
  return useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
}

// Infinite query
export function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 3, // Limit cached pages
  });
}
```

### Mutation Patterns
```typescript
// hooks/useUpdateUser.ts
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUser,
    
    onMutate: async (newUser) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['user', newUser.id] });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['user', newUser.id]);
      
      // Optimistically update
      queryClient.setQueryData(['user', newUser.id], newUser);
      
      return { previousUser };
    },
    
    onError: (err, newUser, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user', newUser.id], context.previousUser);
      }
    },
    
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}
```
