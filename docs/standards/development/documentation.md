# Documentation Standards

## Code Documentation

### JSDoc for Public APIs

<conditional-block task-condition="jsdoc|typescript-docs" context-check="jsdoc-patterns">
IF task only involves JSDoc or TypeScript documentation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load JSDoc patterns from development/documentation.md#jsdoc-for-public-apis"
  </context_fetcher_strategy>
</conditional-block>

```typescript
/**
 * Creates a new user account with email verification
 * 
 * @param input - User registration data
 * @param options - Additional configuration options
 * @returns Promise resolving to created user or error
 * 
 * @throws {ValidationError} When input validation fails
 * @throws {DuplicateError} When email already exists
 * 
 * @example
 * ```typescript
 * const user = await createUser({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   name: 'John Doe'
 * }, { sendEmail: true });
 * ```
 * 
 * @since 1.0.0
 * @see {@link updateUser} For updating existing users
 */
export async function createUser(
  input: CreateUserInput,
  options?: CreateUserOptions
): Promise<Result<User>> {
  // Implementation
}
```

### Inline Comments
```typescript
// Use comments for "why", not "what"
// ❌ Bad: Increment counter
counter++;

// ✅ Good: Increment retry counter, max 3 attempts per rate limit window
retryCounter++;

// TODO(john): Implement caching by 2025-02-01
// FIXME: Handle edge case when array is empty
// NOTE: This is a workaround for issue #123
// PERF: Consider memoizing this expensive computation
// HACK: Temporary fix until upstream library is patched
```

## API Documentation

<conditional-block task-condition="api|openapi|swagger" context-check="api-documentation-patterns">
IF task involves API documentation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load API documentation patterns from development/documentation.md#api-documentation"
  </context_fetcher_strategy>
</conditional-block>

### OpenAPI Specification
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
  description: User management endpoints

paths:
  /api/v1/users:
    post:
      summary: Create new user
      description: |
        Creates a new user account with email verification.
        Sends welcome email unless specified otherwise.
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'
```

## Architectural Decision Records (ADRs)

<conditional-block task-condition="adr|decision-record|architecture-decision" context-check="adr-templates">
IF task involves architectural decision records:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load ADR templates from development/documentation.md#architectural-decision-records-adrs"
  </context_fetcher_strategy>
</conditional-block>

### ADR Template
```markdown
# ADR-001: Use Feature-Sliced Design for Frontend Architecture

## Status
Accepted

## Context
We need a scalable architecture for our growing frontend application that supports:
- Parallel development by multiple teams
- Clear separation of concerns
- Easy onboarding for new developers
- Maintainable codebase as it grows

## Decision
We will use Feature-Sliced Design (FSD) as our primary architectural pattern.

## Consequences

### Positive
- Clear feature boundaries reduce coupling
- Easier to understand business logic
- Parallel development without conflicts
- Consistent structure across the application

### Negative
- Learning curve for developers new to FSD
- More boilerplate for simple features
- Need to enforce import rules

## Alternatives Considered
1. **Traditional MVC** - Too coupled for our needs
2. **Atomic Design** - Too focused on UI, lacks business logic organization
3. **Domain-Driven Design** - Overkill for current complexity

## References
- [Feature-Sliced Design Docs](https://feature-sliced.design/)
- [Migration Guide](./migration-to-fsd.md)
```

</conditional-block>
