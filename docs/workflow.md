# Workflow

## Core pipeline

1. Ingest a business brief.
2. Determine which 21st categories are relevant to the brief.
3. Check private cache coverage for those categories.
4. If relevant categories are incomplete in cache, inspect live 21st category pages and item inventories.
5. Enumerate actual items found and separate cached items from live-discovered items.
6. Route the brief into primary and optional categories using the category index and feature signals.
7. Load primary-category references through a provider after discovery.
8. Pause with one short question if a clarification could materially change category selection.
9. Select the strongest reference for each required section.
10. Expand into optional categories only when confidence is weak or coverage is incomplete.
11. Compose a unified visual direction from the chosen sections.
12. Apply brand tokens and copy direction rules.
13. Output a compact build spec for a downstream coding agent.

## Why this is spec first

Spec-first output keeps token use lower and makes the system easier to review before generating code.

## Provider model

The engine talks to a provider rather than directly to a specific source.

- `CatalogProvider`: uses repo metadata only
- `ManualRuntimeProvider`: stub adapter shaped for future live/private access
- `TwentyFirstCacheProvider`: reads the local private 21st cache

This keeps the engine stable while leaving room for a future live 21st provider.

Current expectation for agents using this repo:

- do not confuse `cached categories` with `all discoverable 21st items`
- use cache as a private accelerator
- inspect live 21st pages for relevant categories when cache coverage is partial
- only claim broad 21st-backed direction when actual items have been enumerated

## Collector model

The collector is separate from ranking/build-spec generation.

- Pass 1: collect every category and visible template card from 21st into the private cache
- Pass 2: let the engine query that cache during build-spec runs

The collector path expects a session export or equivalent browser-captured data source. It now merges repeated inputs into a durable private cache instead of overwriting the cache from one source file.

Private cache layers:

- `categories.json`: visible category names and counts
- `templates.json`: lightweight item index
- `items/*.json`: private item-detail records with normalized recipe metadata plus prompt/code recipe content for reuse

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

When another agent uses this repo for a real website project, `healthy` cache is the only state where private cache alone is enough. In `incomplete` or `stale` states, the agent should expand into live 21st discovery for the relevant categories before presenting 21st as the main source of direction.

## Discovery rule

For 21st-backed website work, the agent should always be able to name:

- which categories it inspected
- which actual 21st items it found
- which of those items were already cached
- which items were selected as references

If it cannot do that, it should not describe its understanding as full 21st coverage.

## Prompt-and-code recipes

For collected 21st items that include deeper integration material, the private cache can store:

- source prompt/integration instructions
- primary component code
- dependency/support-file code
- package install requirements
- demo usage code
- asset notes
- adaptation guidance

This lets downstream agents learn how a pattern is built, not just that it exists, while keeping the richer material private under `.local/21st-cache/`.

## Interactive pause

If the engine detects that auth/dashboard-style categories may matter but the brief does not clearly answer that, it returns a structured clarification result instead of pretending the decision is obvious.

## Compliance rule

Use reference patterns as inspiration only. Rich collected 21st-derived material stays local/private under `.local/21st-cache/`; tracked repo files remain metadata-only and engine-only.
