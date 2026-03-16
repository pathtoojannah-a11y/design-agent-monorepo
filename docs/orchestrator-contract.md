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
2. Prefer `21st-cache` if populated.
3. Fall back to `catalog` if cache is missing.
4. Route categories and analyze references.
5. Surface cache health when the private 21st arsenal is stale or incomplete.
6. Return build spec first.
7. Only hand off to code generation if explicitly requested.

## Non-goals

- no direct template cloning
- no mandatory refresh on every run
- no code-first default

## Cache behavior

- The orchestrator should treat `21st-cache` as authoritative only when cache health is `healthy`.
- When cache health is `incomplete` or `stale`, the orchestrator should still plan from the available arsenal but must surface that state instead of implying full 21st coverage.
- Component-level recipes from the private cache should be normalized toward React + TypeScript + Tailwind + shadcn-style integration for downstream reuse.
