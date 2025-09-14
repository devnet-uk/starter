# [Category Name] - Category Dispatcher (Template)
<!-- Category dispatcher (routing-only). See overview.md for human context. -->

<!-- Example routing block: replace keywords, context-check, and path -->
<conditional-block task-condition="keyword-a|keyword-b|keyword-c" context-check="unique-context-id">
IF current task involves [condition]:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get [content] from [relative-path].md[#anchor]"
  </context_fetcher_strategy>
</conditional-block>

<!-- Notes:
- Keep dispatchers routing-only (no guidance content).
- task-condition keywords: lowercase, specific, minimally overlapping.
- context-check must be globally unique (validator enforces uniqueness).
- REQUEST phrasing must include " from ", and referenced paths/anchors must exist.
- Ensure ≤3 hops from root dispatcher to final standard.
-->
