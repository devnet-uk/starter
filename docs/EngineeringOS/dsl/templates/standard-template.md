# [Standard Title] (Template)

## Overview
Brief description of the standard's purpose and scope. Keep guidance focused and actionable.

## Guidance
- Provide clear rules and examples.
- Prefer section anchors that are stable and descriptive.

### Example Section
Add details, patterns, and code snippets as needed.

```typescript
// Example snippet
export function example() {
  return 'ok';
}
```

<!-- Optional: Route to related standards via conditional blocks -->
<conditional-block task-condition="related-keyword-a|related-keyword-b" context-check="related-example-context">
IF related context is needed:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get related content from path/to/related-standard.md#anchor"
  </context_fetcher_strategy>
</conditional-block>

<!-- Optional: Verification block template -->
<verification-block context-check="example-verification-unique-id">
  <verification_definitions>
    <test name="example_test">
      TEST: test -f package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "package.json must exist in the project root"
      DESCRIPTION: "Ensures a Node project is initialized."
    </test>
  </verification_definitions>
</verification-block>

<!-- Notes:
- Standards contain guidance; dispatchers contain routing only.
- context-check IDs must be globally unique.
- Verification TEST commands must follow governance (no network, no writes).
- Use REQUEST phrasing "Get … from …" in conditional blocks.
-->
