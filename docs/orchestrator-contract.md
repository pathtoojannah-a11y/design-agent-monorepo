# Orchestrator Contract

## Purpose

The top-level website design intelligence entrypoint wraps the lower-level repo workflow into one user-facing capability for Codex and Claude.

## Input

- freeform website prompt or brief
- optional structured brief JSON
- optional instruction to refresh cache
- optional instruction to generate code after planning

## Default output

- build spec if enough information exists
- clarification result if a short question is required to choose the right categories

## Internal flow

1. Interpret the prompt as a website brief.
2. Treat 21st as the primary reference source when the project asks for 21st-informed direction.
3. Check private cache health and identify the relevant 21st categories for the brief.
4. If relevant categories are incomplete in cache, inspect live 21st category pages and item inventories before relying on 21st as the main source.
5. Route categories and analyze references after discovery.
6. Surface cache health and discovery scope when the private 21st arsenal is stale or incomplete.
7. Return build spec first.
8. Only hand off to code generation if explicitly requested.

## Non-goals

- no direct template cloning
- no mandatory refresh on every run
- no code-first default

## Cache behavior

- The orchestrator should treat `21st-cache` as authoritative only when cache health is `healthy`.
- When cache health is `incomplete` or `stale`, the orchestrator should not imply full 21st coverage from cache alone.
- In those states, the orchestrator should direct the agent to inspect live 21st items for the relevant categories before making strong 21st-backed claims.
- Component-level recipes from the private cache should be normalized toward React + TypeScript + Tailwind + shadcn-style integration for downstream reuse.
- When prompt/code recipe content exists for a collected item, downstream agents should use it as a reusable learning/adaptation asset rather than rediscovering the implementation from scratch.
- Stored `promptRecipe` fields are canonical collected source material; any generic integration defaults should be exposed as derived runtime guidance instead of being written back into cache records.

## Valid 21st-backed output

A website-planning run should not count as strongly 21st-backed if it only knows category names.

Valid 21st-backed output should identify:

- relevant categories inspected
- actual items found in those categories
- which items came from cache
- which items came from live discovery
- which items were selected as references
