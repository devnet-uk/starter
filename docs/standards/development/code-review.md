# Code Review Standards

## Review Checklist

### Architecture
- [ ] Follows Clean Architecture principles
- [ ] Dependencies point inward
- [ ] No circular dependencies
- [ ] Appropriate abstraction level
- [ ] SOLID principles applied

### Code Quality
- [ ] Clear variable/function names
- [ ] No commented-out code
- [ ] No console.logs in production code
- [ ] Appropriate error handling
- [ ] Type safety maintained

### Testing
- [ ] Tests included for new code
- [ ] Tests are meaningful (not just coverage)
- [ ] Edge cases covered
- [ ] Mocks are appropriate
- [ ] Tests follow AAA pattern

### Performance
- [ ] No N+1 queries
- [ ] Appropriate memoization
- [ ] Bundle size impact considered
- [ ] Database queries optimized
- [ ] Images/assets optimized

### Security
- [ ] Input validation present
- [ ] No sensitive data in logs
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

#### Server Actions (next-safe-action)
- [ ] Server actions use next-safe-action client
- [ ] Input schemas defined with Zod validation
- [ ] Authentication middleware applied when required
- [ ] Rate limiting middleware configured appropriately
- [ ] Error handling doesn't leak sensitive information
- [ ] Server actions don't expose internal implementation details
- [ ] CSRF protection enabled for state-changing operations
- [ ] Session validation implemented correctly
- [ ] No direct database access in server actions (use repositories)
- [ ] Audit logging for sensitive operations

### Documentation
- [ ] Complex logic documented
- [ ] API changes documented
- [ ] Breaking changes noted
- [ ] README updated if needed
- [ ] ADR created for decisions

## Review Process

### For Authors
```markdown
## PR Description Template

### What does this PR do?
Brief description of changes

### Why are we making this change?
Context and motivation

### How should this be tested?
1. Step-by-step testing instructions
2. Include test data if needed

### Screenshots (if UI changes)
Before | After

### Breaking Changes
- List any breaking changes
- Migration instructions

### Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs
- [ ] Follows code style
- [ ] Self-review completed
```

### For Reviewers

#### First Pass (Architecture)
- Does this belong here?
- Is the approach correct?
- Are there simpler alternatives?
- Will this scale?

#### Second Pass (Implementation)
- Is the code readable?
- Are there edge cases?
- Is error handling appropriate?
- Are tests sufficient?

#### Final Pass (Polish)
- Naming conventions followed?
- No typos or formatting issues?
- Comments helpful and accurate?

### Review Comments

#### Effective Feedback
```typescript
// ❌ Bad: "This is wrong"
// ✅ Good: "Consider using Array.filter() here for better readability"

// ❌ Bad: "Don't do this"
// ✅ Good: "This could cause N+1 queries. Consider using a join or dataloader"

// ❌ Bad: "Fix formatting"
// ✅ Good: "Run 'pnpm format' to fix formatting issues"
```

#### Comment Prefixes
- `[nit]` - Minor issue, not blocking
- `[blocking]` - Must fix before merge
- `[question]` - Clarification needed
- `[suggestion]` - Consider this alternative
- `[praise]` - Good pattern to highlight

### Response Times
- Initial review: Within 4 hours
- Follow-up: Within 2 hours
- Blocking issues: Within 1 hour

### Approval Requirements
- 2 approvals for main branch
- 1 approval for feature branches
- Code owner approval for critical paths
