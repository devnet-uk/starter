# Agent-Standards Integration

## Overview

This document defines how Claude Code agents should integrate with project standards to ensure consistency while maintaining agent expertise and performance.

## Architecture Principles

### Single Source of Truth
- Standards files contain all rules, conventions, and patterns
- Agents reference standards dynamically, not hard-coded rules
- Updates to standards propagate automatically to all agents

### Separation of Concerns
- **Standards**: What the rules are
- **Agents**: How to apply the rules (expertise and decision logic)
- **Commands**: When to load which standards (orchestration)

### Performance Optimization
- Standards loaded once per agent invocation
- Cached within agent context for session duration
- Graceful degradation when standards unavailable

## Agent Integration Pattern

### Agent Structure
```markdown
---
name: [agent-name]
description: [agent description]
tools: Read, [other tools]
standards_dependencies:
  - path: docs/standards/[category]/[standard].md
    sections: [specific sections if needed]
    required: true|false
---

## Initialization

When invoked, load required standards:
1. READ: @docs/standards/[standard].md[#section]
2. CACHE: Standards in context for this session
3. VALIDATE: Standards loaded successfully

## Core Expertise
[Agent-specific logic, decision trees, workflows]

## Standards Application
Apply loaded standards for:
- [Specific use case 1]
- [Specific use case 2]

## Fallback Behavior
If standards unavailable:
- Use conservative defaults
- Warn user about missing standards
- Continue with core functionality
```

### Standards Loading Best Practices

#### Load Specific Sections
```markdown
## Initialization
READ: @docs/standards/development/git-workflow.md#branch-naming
READ: @docs/standards/development/git-workflow.md#commit-convention
```

#### Load Complete Standards
```markdown
## Initialization
READ: @docs/standards/development/testing-strategy.md
```

#### Conditional Loading
```markdown
## Initialization
IF task involves API work:
  READ: @docs/standards/stack-specific/hono-api.md
IF task involves database:
  READ: @docs/standards/development/database-migrations.md
```

## Command Integration Pattern

### Standards Orchestration
Commands should ensure relevant standards are available before invoking agents:

```xml
<step number="X" subagent="[agent-name]" name="[step-name]">
  
  <standards_preparation>
    <conditional_load>
      IF task involves [condition]:
        ENSURE: @docs/standards/[standard].md available
        VERIFY: Standard loaded successfully
    </conditional_load>
  </standards_preparation>
  
  <instructions>
    ACTION: Use [agent-name] subagent
    CONTEXT: Standards pre-verified as available
  </instructions>
  
</step>
```

### Dynamic Standards Detection
```xml
<standards_detection>
  ANALYZE: Task description for keywords
  DETERMINE: Required standards based on:
    - Task type (testing, git, api, etc.)
    - File extensions mentioned
    - Technology stack references
  LOAD: Determined standards before agent invocation
</standards_detection>
```

## Standards DSL Requirements

### Conditional Blocks
All standards must include EOS DSL conditional blocks:

```markdown
<conditional-block task-condition="keyword1|keyword2" context-check="unique-id">
IF current task involves [condition]:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Load [specific content] from [path]"
  </context_fetcher_strategy>
</conditional-block>
```

### Granular Loading
Standards should support both complete and partial loading:

```markdown
<!-- Complete standard -->
<conditional-block task-condition="git|workflow" context-check="git-complete">
  READ: @docs/standards/development/git-workflow.md
</conditional-block>

<!-- Specific section -->
<conditional-block task-condition="branch" context-check="git-branch-only">
  READ: @docs/standards/development/git-workflow.md#branch-naming
</conditional-block>
```

## Agent Categories and Standards

### Git Operations (git-workflow agent)
**Standards**: `development/git-workflow.md`
**Sections**: branch-naming, commit-convention, pr-process
**Usage**: Every git operation

### Testing (test-runner agent)
**Standards**: `development/testing-strategy.md`
**Sections**: Unit tests, integration tests, coverage requirements
**Usage**: Test execution and validation

### File Management (file-creator agent)
**Standards**: `code-style/naming-conventions.md`, `development/documentation.md`
**Sections**: File naming, template standards
**Usage**: File and directory creation

### Project Management (project-manager agent)
**Standards**: `development/documentation.md`, `architecture/clean-architecture.md`
**Sections**: Task tracking, documentation patterns
**Usage**: Task completion and documentation updates

## Performance Considerations

### Caching Strategy
```markdown
## Agent Performance
- Standards cached per agent invocation
- Cache duration: Single session only
- Cache invalidation: Automatic on new invocation
- Memory impact: <10% of context window
```

### Loading Optimization
```markdown
## Smart Loading
- Load only required sections when possible
- Use conditional-block tags for targeted loading
- Verify standards availability before proceeding
- Implement graceful degradation
```

## Error Handling

### Standards Unavailable
```markdown
## Fallback Pattern
IF standards cannot be loaded:
  LOG: "Warning: Standards not available, using defaults"
  USE: Conservative built-in defaults
  CONTINUE: With reduced functionality
  NOTIFY: User of degraded capabilities
```

### Validation Failures
```markdown
## Validation Pattern
AFTER loading standards:
  VERIFY: Content loaded successfully
  CHECK: Required sections present
  VALIDATE: Format is correct
  IF validation fails:
    FALLBACK: To default behavior
    WARN: User about potential inconsistencies
```

## Migration Guidelines

### Existing Agents
1. **Identify Duplications**: Find rules that exist in both agent and standards
2. **Extract Standards References**: Replace hard-coded rules with READ instructions
3. **Add Initialization**: Include standards loading in agent initialization
4. **Implement Fallbacks**: Ensure graceful degradation
5. **Test Performance**: Verify initialization time <500ms

### New Agents
1. **Standards-First Design**: Identify required standards before implementation
2. **Reference Architecture**: Use this integration pattern from start
3. **Minimize Hard-coding**: Keep only agent-specific logic internal
4. **Document Dependencies**: Clearly specify required standards

## Validation Tools

### Agent Validator
```bash
# Check agent-standard integration
claude-agent-validator/
├── check-standards-refs.js     # Verify agents reference standards
├── check-duplication.js        # Detect remaining duplication  
├── check-dsl-coverage.js       # Ensure DSL in all standards
└── performance-test.js         # Measure loading performance
```

### Quality Metrics
- Zero duplication between agents and standards
- All standards have EOS DSL coverage
- Agent initialization time <500ms
- Context window usage for standards <10%

## Best Practices

### Do
✅ Load standards during agent initialization
✅ Cache standards within agent context
✅ Implement graceful fallback behavior
✅ Keep agent expertise separate from rules
✅ Use conditional-block DSL in standards

### Don't
❌ Hard-code rules that exist in standards
❌ Load standards multiple times per session
❌ Fail completely when standards unavailable
❌ Mix agent logic with standard rules
❌ Skip error handling for standard loading

## Example Implementation

### Before (Hard-coded)
```markdown
## Branch Naming Rules
- feature/ - New features
- fix/ - Bug fixes
- chore/ - Maintenance

When creating branches, use these prefixes...
```

### After (Standards-integrated)
```markdown
## Initialization
READ: @docs/standards/development/git-workflow.md#branch-naming
CACHE: Branch naming conventions in context

## Branch Creation Logic
Apply loaded branch naming conventions when creating branches...
```

## Monitoring and Maintenance

### Performance Monitoring
- Track agent initialization times
- Monitor context window usage
- Measure cache hit rates
- Alert on performance degradation

### Standards Compliance
- Validate agent-standard alignment
- Check for emerging duplication
- Monitor standard usage patterns
- Ensure DSL coverage completeness

</conditional-block>
