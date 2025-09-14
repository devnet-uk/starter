# Refactoring Patterns and Best Practices

## Context
Systematic refactoring patterns and best practices for improving code quality while maintaining safety and reliability.

## Core Refactoring Principles

### 1. Safety First
- **Test Coverage**: Maintain or increase test coverage during refactoring
- **Small Steps**: Make incremental changes that can be easily verified
- **Behavior Preservation**: Never change external behavior during refactoring
- **Rollback Plan**: Always have a clear path to revert changes

### 2. Metrics-Driven Approach
- **Baseline Measurement**: Capture metrics before starting
- **Progress Tracking**: Monitor improvements throughout the process
- **Success Validation**: Verify targets are met before proceeding
- **Regression Detection**: Alert on any metric degradation

### 3. Risk-Based Phasing
- **Phase 1 (Low Risk)**: Automated fixes, formatting, simple improvements
- **Phase 2 (Medium Risk)**: Structural changes with limited scope
- **Phase 3 (High Risk)**: Architectural changes requiring comprehensive validation

## Refactoring Patterns by Type

### Code Quality Improvements

#### Extract Method Pattern
```typescript
// Before: Long method with multiple responsibilities
function processUserData(userData: any) {
  // Validation logic (20 lines)
  // Transformation logic (15 lines)
  // Persistence logic (10 lines)
  // Notification logic (8 lines)
}

// After: Extracted methods with single responsibilities  
function processUserData(userData: UserData) {
  const validatedData = validateUserData(userData);
  const transformedData = transformUserData(validatedData);
  const savedUser = persistUser(transformedData);
  notifyUserCreated(savedUser);
  return savedUser;
}
```

#### Extract Custom Hook Pattern (React)
```typescript
// Before: Component with repeated state logic
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
}

// After: Custom hook extraction
function useUser(id: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
  
  return { user, loading, error };
}
```

#### Type Safety Improvements
```typescript
// Before: Using 'any' type
function processData(data: any) {
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    value: item.value
  }));
}

// After: Proper type definitions
interface RawDataItem {
  id: string;
  name: string;
  value: number;
}

interface ProcessedDataItem {
  id: string;
  name: string; 
  value: number;
}

function processData(data: RawDataItem[]): ProcessedDataItem[] {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    value: item.value
  }));
}
```

### Architectural Improvements

#### Layer Separation Pattern
```typescript
// Before: Mixed concerns in component
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Direct database access in component (violation)
    db.users.findById(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
}

// After: Proper layer separation
// Domain layer
export class UserRepository {
  async findById(id: string): Promise<User> {
    return db.users.findById(id);
  }
}

// Use case layer  
export class GetUserUseCase {
  constructor(private userRepo: UserRepository) {}
  
  async execute(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }
}

// Presentation layer
function UserProfile({ userId }: { userId: string }) {
  const { user } = useUser(userId); // Custom hook handles use case
  return <div>{user?.name}</div>;
}
```

#### Dependency Injection Pattern
```typescript
// Before: Hard-coded dependencies
class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    const smtp = new SMTPClient(); // Hard-coded dependency
    return smtp.send({ to, subject, body });
  }
}

// After: Injected dependencies
interface IEmailProvider {
  send(email: Email): Promise<void>;
}

class EmailService {
  constructor(private emailProvider: IEmailProvider) {}
  
  async sendEmail(to: string, subject: string, body: string) {
    return this.emailProvider.send({ to, subject, body });
  }
}

// Registration
const emailService = new EmailService(new SMTPProvider());
```

### Performance Optimizations

#### Bundle Optimization Pattern
```typescript
// Before: Large bundle imports
import * as _ from 'lodash';
import moment from 'moment';

function formatData(data: any[]) {
  return _.map(data, item => ({
    ...item,
    date: moment(item.date).format('YYYY-MM-DD')
  }));
}

// After: Tree-shakeable imports
import { map } from 'lodash-es';
import { format } from 'date-fns';

function formatData(data: DataItem[]): FormattedItem[] {
  return map(data, item => ({
    ...item,
    date: format(new Date(item.date), 'yyyy-MM-dd')
  }));
}
```

#### Lazy Loading Pattern
```typescript
// Before: Eager imports
import { HeavyComponent } from './HeavyComponent';
import { ComplexChart } from './ComplexChart';

// After: Dynamic imports with React.lazy
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const ComplexChart = lazy(() => import('./ComplexChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <Suspense fallback={<Loading />}>
        {showChart && <ComplexChart />}
      </Suspense>
    </div>
  );
}
```

## Tool-Specific Refactoring Guides

### BiomeJS Auto-Fixes
```bash
# Safe automated fixes (Phase 1)
biome check --apply
```

**What it fixes:**
- Code formatting inconsistencies
- Import sorting and organization
- Simple linting violations
- Unused variable removal

### madge Circular Dependency Resolution
```bash
# Identify circular dependencies
madge --circular src/

# Strategies for resolution:
# 1. Extract shared interfaces/types
# 2. Use dependency injection
# 3. Extract common functionality to utilities
# 4. Implement event-driven communication
```

### knip Dead Code Elimination
```bash
# Find unused code
knip --config knip.json

# Safe removal patterns:
# 1. Remove unused exports from leaf modules
# 2. Eliminate unused utility functions
# 3. Remove obsolete configuration files
# 4. Clean up unused dependencies
```

### TypeScript Type Improvements
```bash
# Identify untyped code
type-coverage --detail

# Improvement strategies:
# 1. Add explicit return types
# 2. Replace 'any' with proper types
# 3. Use strict TypeScript compiler options
# 4. Generate types from runtime schemas
```

## Refactoring Safety Checklist

### Before Starting
- [ ] All tests are passing
- [ ] Git working directory is clean
- [ ] Baseline metrics captured
- [ ] Rollback plan documented
- [ ] Success criteria defined

### During Refactoring
- [ ] Make small, atomic changes
- [ ] Run tests after each change
- [ ] Commit frequently with descriptive messages
- [ ] Monitor metrics continuously
- [ ] Document architectural decisions

### After Each Phase
- [ ] Full test suite passes
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Metrics validated against targets
- [ ] Documentation updated

## Risk Assessment Matrix

| Change Type | Risk Level | Validation Required | Rollback Complexity |
|------------|------------|--------------------|--------------------|
| Formatting | Very Low | Unit tests | Git revert |
| Extract method | Low | Unit + integration | Git revert |
| Type additions | Low | Type checking + tests | Git revert |
| API changes | High | Full test suite + manual | Complex migration |
| Architecture | Very High | All tests + performance | Significant effort |

## Common Anti-Patterns to Avoid

### 1. Big Bang Refactoring
❌ **Don't**: Refactor entire system at once
✅ **Do**: Incremental, phased approach with validation gates

### 2. Changing Behavior During Refactoring  
❌ **Don't**: Add new features while refactoring
✅ **Do**: Preserve exact external behavior, add features separately

### 3. Skipping Tests
❌ **Don't**: Refactor without comprehensive tests
✅ **Do**: Ensure test coverage before and after changes

### 4. Ignoring Dependencies
❌ **Don't**: Refactor without understanding impact
✅ **Do**: Map dependencies and assess blast radius

### 5. Premature Optimization
❌ **Don't**: Optimize before measuring
✅ **Do**: Profile first, optimize based on data

## Success Metrics and Targets

### Code Quality
- **Type Coverage**: Target 85%+ (from baseline)
- **Cyclomatic Complexity**: <10 per function
- **Code Duplication**: <5% of codebase
- **Test Coverage**: Maintain or improve existing levels

### Performance
- **Bundle Size**: No increase (or justified increases)
- **Build Time**: No significant degradation (<10% slower)
- **Runtime Performance**: Maintain or improve Core Web Vitals
- **Memory Usage**: No memory leaks introduced

### Maintainability
- **Dependency Count**: Reduce where possible
- **Circular Dependencies**: Eliminate completely
- **Architecture Violations**: Zero layer violations
- **Documentation**: Up-to-date and comprehensive

## Integration with Engineering OS

### Standards Loading
This refactoring guidance integrates with Engineering OS through conditional loading:

```xml
<conditional-block task-condition="refactor|refactoring|cleanup|improve|optimize" context-check="refactoring">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get refactoring patterns from architecture/refactoring-patterns.md"
  </context_fetcher_strategy>
</conditional-block>
```

### Command Integration
- Used by `/refactor-codebase` command for guidance
- Provides patterns for subagent recommendations
- Defines success criteria for metrics-tracker
- Offers safety guidelines for implementation

### Quality Gates
- Integrates with BiomeJS for automated quality checks
- Provides thresholds for metrics validation
- Defines rollback triggers and procedures
- Establishes review criteria for architectural changes