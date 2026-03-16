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
- `TwentyFirstCacheProvider`: reads the local private 21st cache

This keeps the engine stable while leaving room for a future live 21st provider.

## Collector model

The collector is separate from ranking/build-spec generation.

- Pass 1: collect every category and visible template card from 21st into the private cache
- Pass 2: let the engine query that cache during build-spec runs

The collector path expects a session export or equivalent browser-captured data source. It now merges repeated inputs into a durable private cache instead of overwriting the cache from one source file.

Private cache layers:

- `categories.json`: visible category names and counts
- `templates.json`: lightweight item index
- `items/*.json`: private item-detail records with normalized recipe metadata for reuse

## Refresh behavior

- `collect:refresh`: merge the provided source exports into the private cache
- `collect:stale`: reuse the cache only if it is fresh and healthy, otherwise refresh it
- `collect:coverage`: inspect cache completeness and stale state
- `collect:inspect-category`: inspect one cached category and its templates
- `collect:inspect-template`: inspect one cached template plus its private item-detail record

## Cache health

The 21st cache is treated as authoritative only when it is healthy.

- `healthy`: every visible collected category has at least one item record and the cache is fresh
- `incomplete`: one or more visible collected categories still have zero items
- `stale`: the cache is older than the configured max age or the latest refresh did not revisit all previously known categories

Build-spec runs now surface cache health and missing/stale coverage warnings instead of implying full-library coverage when the private cache is thin.

## Interactive pause

If the engine detects that auth/dashboard-style categories may matter but the brief does not clearly answer that, it returns a structured clarification result instead of pretending the decision is obvious.

## Compliance rule

Use reference patterns as inspiration only. Rich collected 21st-derived material stays local/private under `.local/21st-cache/`; tracked repo files remain metadata-only and engine-only.
