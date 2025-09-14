---
description: devnet dispatcher (slim, routing-first)
version: 0.2.0
last_updated: 2025-09-11
---

# devnet Implementation Dispatcher (Slim)

This dispatcher is routing-first for low token use. For global guidance, see:
- devnet-plan/context/agent-conventions.md

## Agent Routing Hint

Use status to select the phase, then execute the inner REQUEST of the matching plan-conditional. Prefer three hops: manifest → overview → anchor.

## Current Phase Navigation

Based on checkpoint status, route to the appropriate phase:

<plan-conditional task-condition="infrastructure|setup|phase-0|project-setup" context-check="phase-0-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 0 from devnet-plan/phases/phase-0-infrastructure.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="domain|entities|phase-1|domain-layer" context-check="phase-1-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 1 from devnet-plan/phases/phase-1-domain.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="use-cases|business-logic|phase-2|authentication" context-check="phase-2-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 2 from devnet-plan/phases/phase-2-use-cases.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="infrastructure|database|external-services|phase-3" context-check="phase-3-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 3 from devnet-plan/phases/phase-3-infrastructure.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="interface-adapters|api|controllers|phase-4" context-check="phase-4-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 4 from devnet-plan/phases/phase-4-interface-adapters.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="presentation|ui|nextjs|phase-5" context-check="phase-5-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 5 from devnet-plan/phases/phase-5-presentation.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="deployment|production|phase-6" context-check="phase-6-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 6 from devnet-plan/phases/phase-6-deployment.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="documentation|optimization|phase-7" context-check="phase-7-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase 7 from devnet-plan/phases/phase-7-documentation.md"
  </context_fetcher_strategy>
</plan-conditional>

## Critical Status Update

Reset requested: Planning set to Phase 0, Step 1.
Phase 0 Status: ⏳ Not started
Next Action: Begin Phase 0 - Repository Infrastructure Specification

## Context Fetch Budget (Three Hops)

- Hop 1: Load `devnet-plan/manifest.json` (phase → path, summary_anchor)
- Hop 2: Load target phase file and fetch `## Overview`
- Hop 3: Fetch a specific anchor within the same phase

