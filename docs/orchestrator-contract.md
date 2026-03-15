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
5. Return build spec first.
6. Only hand off to code generation if explicitly requested.

## Non-goals

- no direct template cloning
- no mandatory refresh on every run
- no code-first default
