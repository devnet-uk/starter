# SOLID Principles in TypeScript/React

## Single Responsibility Principle (SRP)

### Custom Hooks - One Concern
```typescript
// ✅ Each hook has single responsibility
const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
};

const useUserPermissions = (user: User | null) => {
  return useMemo(() => {
    if (!user) return [];
    return calculatePermissions(user);
  }, [user]);
};

// Component composes hooks
function UserProfile({ userId }: Props) {
  const { user, loading } = useUser(userId);
  const permissions = useUserPermissions(user);
  
  if (loading) return <Skeleton />;
  return <Profile user={user} permissions={permissions} />;
}
```

## Open/Closed Principle (OCP)

### Extensible Components
```typescript
// Base component open for extension
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

const buttonVariants = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
  danger: 'bg-red-500 text-white',
};

// Closed for modification, open for extension
export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants[variant], sizeClasses[size])} {...props} />
  );
}
```

## Liskov Substitution Principle (LSP)

### Consistent Component Contracts
```typescript
// Base interface
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Substitutable implementations
export const TextInput: React.FC<InputProps> = ({ value, onChange, disabled }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  />
);

export const TextArea: React.FC<InputProps> = ({ value, onChange, disabled }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  />
);

// Can use either without breaking the contract
<FormField component={TextInput} {...props} />
<FormField component={TextArea} {...props} />
```

## Interface Segregation Principle (ISP)

### Focused Interfaces
```typescript
// ❌ Fat interface
interface UserActions {
  updateProfile: (data: ProfileData) => void;
  changePassword: (password: string) => void;
  deleteAccount: () => void;
  exportData: () => void;
  updateNotifications: (settings: NotificationSettings) => void;
}

// ✅ Segregated interfaces
interface ProfileActions {
  updateProfile: (data: ProfileData) => void;
}

interface SecurityActions {
  changePassword: (password: string) => void;
  deleteAccount: () => void;
}

interface DataActions {
  exportData: () => void;
}

// Components only depend on what they need
function ProfileForm({ actions }: { actions: ProfileActions }) {
  // Only uses updateProfile
}
```

## Dependency Inversion Principle (DIP)

### Abstraction over Concretion
```typescript
// Define abstractions
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

interface INotificationService {
  send(message: string, userId: string): Promise<void>;
}

// High-level module depends on abstractions
class UserService {
  constructor(
    private repo: IUserRepository,
    private notifier: INotificationService
  ) {}
  
  async updateUser(id: string, data: UpdateData) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error('User not found');
    
    user.update(data);
    await this.repo.save(user);
    await this.notifier.send('Profile updated', user.id);
  }
}

// Low-level modules implement abstractions
class DrizzleUserRepository implements IUserRepository {
  async findById(id: string) {
    // Drizzle implementation
  }
}

class EmailNotificationService implements INotificationService {
  async send(message: string, userId: string) {
    // Email implementation
  }
}
```