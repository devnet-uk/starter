# devnet Engineering OS Integration

## Overview

devnet leverages the Engineering OS DSL system throughout implementation for optimal context management and workflow automation. This document outlines the integration patterns and usage.

## DSL System Usage Throughout devnet

### Enhanced Engineering OS Integration (devnet-Specific)

devnet leverages the Engineering OS Standards Augmentation with **bidirectional verification** to ensure quality gates are correctly applied:

#### Verification-Driven Implementation
```bash
# When Engineering OS detects keywords like:
# - "Enhanced Quality Gates"  
# - "devnet 98% coverage"
# - "greenfield" + "Development Environment Configuration"

# Enhanced Process:
# 1. Consults: local-quality.md, testing-strategy.md, git-workflow.md
# 2. Extracts verification templates from standards
# 3. Generates project-specific verification tests (98% for devnet)
# 4. Implements configuration to pass verification tests
# 5. Executes verification before task completion
# 6. Reports: ✅ All verifications passed OR ❌ Failures with details
```

#### Enhanced Command Workflow with Verification
```bash
1. /create-spec "Feature with Enhanced Quality Gates..."
   # → Parses requirements: coverage %, commit scopes, etc.
   # → Generates verification test suite from standards
   
2. /create-tasks
   # → Generates TDD tasks + implementation + verification tasks
   
3. /execute-tasks 
   # → Implements configuration
   # → Runs verification tests (must pass)
   # → Reports verification results
```

## Standards Consultation Pattern

Each phase should begin with standards consultation:

```bash
# Standards loading via context-fetcher agent
REQUEST: "Consult the standards knowledge base for guidance relevant to the current task. 
Start at the root dispatcher located at @docs/standards/standards.md and follow the 
routing logic to retrieve the necessary guidance."
```

### Conditional Standards Loading

The system automatically loads relevant standards based on task keywords:

- `typescript|interface` → TypeScript patterns
- `react|component` → React/FSD patterns  
- `api|security` → API security standards
- `domain|clean-architecture` → Clean Architecture patterns
- `testing|coverage` → Testing strategies
- `performance|optimization` → Performance patterns

## Key Engineering OS Commands

### Primary Workflow Commands
```bash
/create-spec    # Generate detailed feature specifications
/create-tasks   # Break specifications into actionable tasks
/execute-tasks  # Implement following Clean Architecture
```

### Analysis and Planning Commands
```bash
/plan-product   # Define product mission and roadmap
/analyze-product # Analyze existing codebase
```

### Specialized Agent Commands
```bash
@agent:context-fetcher    # Retrieve standards and documentation
@agent:git-workflow      # Git operations and branch management
@agent:test-runner       # Test execution and failure analysis
@agent:project-manager   # Task tracking and progress updates
@agent:verification-runner # Extract and execute verification tests from standards
```

## Hierarchical DSL Navigation

### Standards DSL Structure

The devnet implementation follows the three-tier hierarchy:

1. **Root Dispatcher** (`@docs/standards/standards.md`)
   - Entry point for all standards access
   - Routes to category-level dispatchers
   - Contains no actual content, only routing logic

2. **Category Dispatchers** (e.g., `architecture/architecture.md`)
   - Route to specific standards within their domain
   - Use more granular task conditions
   - May contain minimal contextual information

3. **Standard Files** (e.g., `architecture/clean-architecture.md`)
   - Contain actual best practices and guidance
   - Include embedded verification blocks
   - Focus on content, not routing

### devnet-Specific Navigation Examples

#### Architecture Standards
```xml
<plan-conditional task-condition="domain|entities|clean-architecture" context-check="phoenix-clean-architecture">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Clean Architecture patterns from architecture/clean-architecture.md"
  </context_fetcher_strategy>
</plan-conditional>
```

#### Testing Standards
```xml
<plan-conditional task-condition="testing|coverage|verification" context-check="phoenix-testing-strategy">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get testing strategy from development/testing-strategy.md"
  </context_fetcher_strategy>
</plan-conditional>
```

## Variable Substitution Patterns

### Comprehensive Variable Substitution for devnet

```bash
# Project Configuration Variables
${PROJECT_COVERAGE} → 98 (devnet greenfield standard)
${PROJECT_TYPE} → greenfield (clean slate rebuild)
${PROJECT_NAME} → devnet (project identifier)
${PROJECT_PHASES} → phase-0:phase-7 (structured development)

# Domain Layer Variables (100% coverage requirement)
${DOMAIN_COVERAGE_THRESHOLD} → 100 (domain purity requirement)

# Infrastructure Variables
${NODE_VERSION} → 22 (LTS version requirement)
${PORT_WEB} → 4000 (devnet web application)
${PORT_API} → 4001 (devnet API server)

# Testing Variables
${PACKAGE_MANAGER} → pnpm (workspace management)
${TESTING_FRAMEWORK} → vitest (devnet choice)
```

## Context Management Strategy

### Context Clear Points

devnet implements strategic context clears at major phase boundaries:

```bash
# Clear context at phase boundaries to optimize token usage
# Maintain workflow continuity through checkpoint system

# Primary Clear Points:
# - Phase 0 → Phase 1 (Infrastructure → Domain)
# - Phase 1 → Phase 2 (Domain → Use Cases)
# - Phase 2 → Phase 3 (Use Cases → Infrastructure)
# [etc...]

# Benefits:
# - 50% reduction in context window usage per phase
# - 30% faster response times after clearing
# - Improved embedded verification accuracy with focused context
```

### Context Efficiency Metrics

Target performance metrics for devnet DSL usage:

- **Standards Loading**: <10% of context window per phase
- **Dispatcher Routing**: <100ms per hop
- **Standard File Loading**: <500ms per file
- **Context Check**: <50ms
- **Total Initialization**: <2s for complex tasks
- **Memory Efficiency**: No duplicate content loading

## Engineering OS File Structure Integration

### Documentation Standards Paths
```bash
# Architecture Standards
@docs/standards/architecture/clean-architecture.md
@docs/standards/architecture/domain-driven-design.md
@docs/standards/architecture/feature-sliced-design.md

# Code Style Standards  
@docs/standards/code-style/typescript-style.md
@docs/standards/code-style/react-patterns.md
@docs/standards/code-style/css-style.md

# Development Standards
@docs/standards/development/git-workflow.md
@docs/standards/development/testing-strategy.md
@docs/standards/development/local-quality.md

# Security Standards
@docs/standards/security/authentication-patterns.md
@docs/standards/security/api-security.md

# Performance Standards
@docs/standards/performance/core-web-vitals.md
@docs/standards/performance/bundle-optimization.md
```

### Command Reference Locations
```bash
# Primary Commands
.claude/commands/create-spec.md
.claude/commands/create-tasks.md  
.claude/commands/execute-tasks.md

# Specialized Agents
.claude/agents/context-fetcher.md
.claude/agents/verification-runner.md
.claude/agents/git-workflow.md
```

## Integration with devnet Plan Structure

### DSL Routing to devnet Files

The devnet DSL dispatcher (`devnet-plan/implementation-plan.md`) uses conditional blocks to route to appropriate phase files:

```xml
<plan-conditional task-condition="domain|entities|phase-1" context-check="phase-1-domain">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 1 domain implementation from devnet-plan/phases/phase-1-domain.md"
  </context_fetcher_strategy>
</plan-conditional>
```

### Context Module Integration

Context modules are available on demand through DSL routing:

```xml
<plan-conditional task-condition="verification|testing|compliance" context-check="phoenix-verification-context">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get verification framework from devnet-plan/context/verification-framework.md"
  </context_fetcher_strategy>
</plan-conditional>
```

## Performance Optimization

### Context Window Management

**Do:**
- Use conditional blocks to filter content
- Check for already-loaded content via context-check
- Load specific sections when possible
- Follow hierarchical routing (Root → Category → Standard)

**Don't:**
- Load entire file hierarchies
- Bypass conditional filtering
- Reload content already in context
- Skip dispatcher levels

### Token Usage Optimization

devnet achieves optimal token usage through:

1. **Surgical Context Loading** - Only relevant phase content loaded
2. **Hierarchical Routing** - Maximum 3 hops from root to content
3. **Conditional Filtering** - Content loaded only when keywords match
4. **Context Caching** - Standards cached within session
5. **Variable Substitution** - Project-specific values applied dynamically

## Error Handling

### Standards DSL Errors
- **Missing Dispatcher**: Report specific routing path attempted
- **Condition Mismatch**: Skip section, continue processing  
- **Invalid Context ID**: Warning, continue with non-cached loading
- **Circular References**: Detect and break infinite routing loops

### Recovery Strategies
- **Fallback to Direct Loading**: If DSL routing fails
- **Context Clear and Restart**: If performance degrades
- **Manual Standards Loading**: If automated routing unavailable
- **Checkpoint-Based Recovery**: Resume from last known good state

## Benefits

- **Deterministic quality assurance** without rigid file copying
- **Context-aware verification** with project-specific requirements
- **Scalable pattern** for different project types and coverage thresholds
- **Token efficiency** through hierarchical DSL routing (<10% context usage)
- **Workflow continuity** through checkpoint integration
- **Automatic compliance** with embedded verification execution
