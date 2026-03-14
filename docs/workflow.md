# Workflow

## Core pipeline

1. Ingest a business brief.
2. Route the brief into primary and optional categories using the category index and feature signals.
3. Load only primary-category references first through a provider.
4. Pause with one short question if a clarification could materially change category selection.
5. Select the strongest reference for each required section.
6. Expand into optional categories only when confidence is weak or coverage is incomplete.
7. Compose a unified visual direction from the chosen sections.
8. Apply brand tokens and copy direction rules.
9. Output a compact build spec for a downstream coding agent.

## Why this is spec first

Spec-first output keeps token use lower and makes the system easier to review before generating code.

## Provider model

The engine talks to a provider rather than directly to a specific source.

- `CatalogProvider`: uses repo metadata only
- `ManualRuntimeProvider`: stub adapter shaped for future live/private access

This keeps the engine stable while leaving room for a future live 21st provider.

## Interactive pause

If the engine detects that auth/dashboard-style categories may matter but the brief does not clearly answer that, it returns a structured clarification result instead of pretending the decision is obvious.

## Compliance rule

Use reference patterns as inspiration only. Do not store or reproduce third-party code, copy, logos, or assets.
