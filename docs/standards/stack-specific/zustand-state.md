# Zustand State Management

## Store Patterns

### Basic Store
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // State
  user: User | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Computed
  isAuthenticated: () => boolean;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        user: null,
        theme: 'light',
        sidebarOpen: true,
        
        // Actions
        setUser: (user) => set((state) => {
          state.user = user;
        }),
        
        toggleTheme: () => set((state) => {
          state.theme = state.theme === 'light' ? 'dark' : 'light';
        }),
        
        setSidebarOpen: (open) => set((state) => {
          state.sidebarOpen = open;
        }),
        
        // Computed
        isAuthenticated: () => !!get().user,
      })),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          theme: state.theme,
        }),
      }
    )
  )
);
```

### Sliced Pattern
```typescript
// stores/authSlice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  token: null,
  
  login: async (credentials) => {
    const { user, token } = await loginApi(credentials);
    set({ user, token });
  },
  
  logout: () => {
    set({ user: null, token: null });
  },
});

// stores/index.ts
export const useStore = create<AuthSlice & UISlice>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
}));
```
