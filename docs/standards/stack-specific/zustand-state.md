# Zustand State Management

> Align Zustand usage with the version defined in `docs/standards/tech-stack.md` (currently 5.0.8+).

We maintain this standard as the single source of truth for global client state in Engineering OS projects. Refresh it when upstream guidance changes so product repos can depend on a vetted playbook rather than duplicating ad-hoc snippets.

## Best Practices Checklist

- Reach for Zustand only when React component state or server/cache solutions (e.g. TanStack Query) are insufficient; keep stores small and purpose-driven.
- Keep state, actions, and derived selectors typed and colocated; expose a helper hook that forces selectors and optional equality functions to avoid over-rendering.
- Never create stores inside render paths. Build the vanilla store once, then scope per request (SSR) or per module (CSR) with `createStore`.
- Use middleware intentionally: add `immer` for ergonomic mutations, `devtools` for inspection, and `persist` only after partializing sensitive data.
- Prefer async actions that wrap service calls, handle failure, and surface loading/error flags inside the store rather than mutating in components.
- Guard hydration/persistence with `_hasHydrated` flags when rendering on the server or in Next.js RSC/SSR, and rehydrate manually when `skipHydration` is enabled.

## Store Architecture

### Canonical Store Builder

```typescript
// app/state/appStore.ts
import type { StateCreator } from 'zustand';
import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist, createJSONStorage, StateStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark';

type AppState = {
  user: User | null;
  theme: Theme;
  sidebarOpen: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
};

type AppActions = {
  setUser(user: User | null): void;
  toggleTheme(): void;
  setSidebar(open: boolean): void;
  setHasHydrated(value: boolean): void;
};

export type AppStore = AppState & AppActions;

const appStoreCreator: StateCreator<AppStore> = (set, get) => ({
  user: null,
  theme: 'light',
  sidebarOpen: true,
  isAuthenticated: false,
  hasHydrated: false,
  setUser: (user) => {
    set((state) => {
      state.user = user;
      state.isAuthenticated = Boolean(user);
    }, false, 'app/setUser');
  },
  toggleTheme: () => {
    set((state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    }, false, 'app/toggleTheme');
  },
  setSidebar: (open) => {
    set((state) => {
      state.sidebarOpen = open;
    }, false, 'app/setSidebar');
  },
  setHasHydrated: (value) => {
    set({ hasHydrated: value }, false, 'app/setHasHydrated');
  },
});

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage));

const withMiddleware = devtools(
  persist(
    immer(appStoreCreator),
    {
      name: 'app-store',
      storage,
      partialize: (state) => ({ user: state.user, theme: state.theme }),
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);

export const createAppStore = () => createStore<AppStore>()(withMiddleware);

export const appStore = createAppStore();

export const useAppStore = <T>(selector: (state: AppStore) => T, equalityFn?: (a: T, b: T) => boolean) =>
  useStore(appStore, selector, equalityFn);
```

Key points:

- Export both the vanilla store (`appStore`) for non-React usage (tests, service modules) and a typed hook factory (`useAppStore`) that enforces selector usage.
- Wrap the state creator with `immer` only when mutation ergonomics outweigh the bundle overhead; otherwise update immutably with object spreads.
- Default to `createJSONStorage` with explicit storage providers, *never* rely on implicit globals when rendering on the server.
- `skipHydration` prevents React hydration mismatches. Expose a hydration effect that calls `appStore.persist.rehydrate()` from the first client-side layout effect.

### Slicing for Larger Domains

Compose slices to keep responsibility boundaries thin while sharing a single store instance:

```typescript
// app/state/authSlice.ts
import { StateCreator } from 'zustand';

export type AuthSlice = {
  user: User | null;
  token: string | null;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): void;
};

export const createAuthSlice: StateCreator<AuthSlice, [['zustand/devtools', never]]> = (set) => ({
  user: null,
  token: null,
  async login(credentials) {
    const { user, token } = await loginApi(credentials);
    set({ user, token }, false, 'auth/login');
  },
  logout() {
    set({ user: null, token: null }, false, 'auth/logout');
  },
});

// app/state/uiSlice.ts
export type UiSlice = {
  sidebarOpen: boolean;
  setSidebar(open: boolean): void;
};

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarOpen: true,
  setSidebar: (open) => set({ sidebarOpen: open }),
});

type AppSlices = AuthSlice & UiSlice;

export const createRootStore = () =>
  createStore<AppSlices>()((...args) => ({
    ...createAuthSlice(...args),
    ...createUiSlice(...args),
  }));
```

- Instantiate the root store at module scope (`const appStore = createRootStore();`) and export a selector-enforcing hook just like the single-store pattern.
- Keep cross-slice communication explicit. Use derived selectors instead of reading other slices directly during `set` calls to avoid hidden dependencies.
- Provide devtools action names (`set(..., false, 'slice/action')`) so traces remain readable.

## Selectors and Derived Data

- Always pass selectors to `useAppStore` to prevent broad subscriptions. Re-export `shallow` or custom comparators when a component needs multiple fields.
- Derive computed values inside selectors rather than storing them when they can be calculated cheaply.
- Use `subscribeWithSelector` middleware for high-frequency listeners (e.g., charts) to avoid full-state subscriptions.

```typescript
import { shallow } from 'zustand/shallow';

const [theme, isSidebarOpen] = useAppStore(
  (state) => [state.theme, state.sidebarOpen],
  shallow
);

const permissions = useAppStore((state) => selectPermissions(state.user));
```

## Async Logic and Side Effects

- Encapsulate API calls inside store actions. Surface `status` flags so components do not need to track request state manually.
- Throw errors (for error boundaries) or return discriminated unions instead of mutating global error strings.
- Avoid mutating stores from `useEffect` without guards; wrap updates in `startTransition` if they trigger expensive tree work.

```typescript
type AuthStatus = 'idle' | 'loading' | 'error';

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  status: 'idle' as AuthStatus,
  async login(credentials) {
    set({ status: 'loading' });
    try {
      const { user, token } = await loginApi(credentials);
      set({ user, token, status: 'idle' });
    } catch (error) {
      set({ status: 'error' });
      throw error;
    }
  },
});
```

## Persistence, Hydration, and Next.js RSC

- Enable persistence only for data that survives reloads (tokens, feature flags). Use `partialize` and consider encrypting or delegating secure data to HTTP-only cookies.
- When using Next.js App Router, create the store in a module (`app/state/appStore.ts`) and wrap client components with a provider that runs hydration once:

```tsx
'use client';

import { useEffect } from 'react';
import { appStore, useAppStore } from '~/app/state/appStore';

export function AppStateHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void appStore.persist.rehydrate();
  }, []);

  const hydrated = useAppStore((state) => state.hasHydrated);
  if (!hydrated) return null;

  return <>{children}</>;
}
```

- For server components that need preloaded state, initialize a temporary store per request and serialise only the data you must hydrate. Avoid sharing singleton stores across requests to prevent data leakage.

## Testing Stores

- Test stores without React by importing the vanilla store or creating a fresh instance per test. Use React Testing Library + `renderHook` when asserting rendering behaviour.

```typescript
import { act } from '@testing-library/react';
import { createAppStore } from '~/app/state/appStore';

const createTestAppStore = () => createAppStore();

it('logs in the user', async () => {
  const store = createTestAppStore();
  await act(() => store.getState().login({ email, password }));
  expect(store.getState().user).toMatchObject({ email });
});
```

- Reset stores between tests by calling `store.setState(initialState, true)` or recreating the store to avoid leakage between spec files.

## Tooling and DevTools

- Enable `devtools` middleware only in development and guard it against server execution. Set `anonymousActionType` or explicit action names for better traces.
- Provide explicit configuration for the Redux DevTools extension (e.g., `store.devtools = { enabled: import.meta.env.DEV }`) when debugging complex stores.

## References

- Zustand documentation: https://zustand.docs.pmnd.rs
- Engineering OS tech stack registry: `docs/standards/tech-stack.md`
