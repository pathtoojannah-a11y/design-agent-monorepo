# Design Agent Monorepo

Public, reusable monorepo for section-based design intelligence and agent-driven website planning.

This repo ships two things:

- reusable Codex and Claude agent definitions for design-reference workflows
- a lightweight engine that evaluates curated reference metadata and produces compact build specs

The main user-facing entrypoint is `Website Design Intelligence`, a top-level Codex/Claude skill/agent that wraps the repo workflow.

The system is built to learn from strong reference patterns without mirroring third-party source code or assets.

## Repo shape

- `agents/`: Codex and Claude agent definitions
- `catalog/`: metadata-only design references
- `engine/`: contracts, scoring logic, composition, CLI, and tests
- `examples/`: sample briefs and example outputs
- `docs/`: workflow and extension docs

## Quick start

```bash
npm run example:contractor
```

```bash
npm run example:saas
```

```bash
npm run example:portal
```

```bash
npm run collect:refresh -- --source-file=./examples/runtime/twentyfirst-session-export.json
```

```bash
npm test
```

## Main entrypoint

Use the top-level website-design orchestrator:

- Codex: [website-design-intelligence.SKILL.md](./agents/codex/website-design-intelligence.SKILL.md)
- Claude: [website-design-intelligence.md](./agents/claude/website-design-intelligence.md)

Install/use instructions:

- [install-codex-claude.md](./docs/install-codex-claude.md)
- [orchestrator-contract.md](./docs/orchestrator-contract.md)
- [other-project-bootstrap.md](./docs/other-project-bootstrap.md)

## Output model

The default engine output is a compact JSON build spec containing:

- selected sections
- section rationale
- visual direction
- brand adaptation
- copy direction
- component recipes when available from the private 21st arsenal
- implementation prompt
- non-cloning constraints

Private component recipes can include prompt-style integration guidance, dependency snippets, support-file code, demo usage, and adaptation notes for 21st-backed patterns.

When the brief is ambiguous and an extra category could materially change the result, the engine returns a structured `needs_clarification` response instead of guessing.

When the private 21st cache is stale or incomplete, the build spec now surfaces that cache-health state instead of implying full-library coverage.

## Provider modes

The CLI defaults to the local catalog-backed provider.

When a private 21st cache exists, the CLI now prefers `21st-cache` by default and falls back to `catalog` only when the cache is missing.

You can also use the manual runtime stub:

```bash
node ./engine/src/cli.mjs ./examples/briefs/saas-ai-platform.json --provider=manual-runtime --runtime-file=./examples/runtime/manual-runtime.json
```

You can also use the private 21st cache provider after collecting cache data:

```bash
node ./engine/src/cli.mjs ./examples/briefs/saas-ai-platform.json --provider=21st-cache
```

## Compliance model

This repo stores metadata only:

- source URLs
- screenshot paths or image references
- section tags and style notes
- business-fit metadata

It does not store mirrored template code or proprietary assets.

Richer prompt/code recipes derived from 21st items stay local/private under `.local/21st-cache/` and are not committed to the public repo.

## Private 21st cache

Collected 21st runtime data is written under `.local/21st-cache/`, which is gitignored.

The collector keeps three private cache layers:

- `categories.json`: visible category index
- `templates.json`: lightweight item index
- `items/*.json`: rich private item-detail records with normalized recipe metadata plus prompt/code recipe content

The collector can merge repeated browser/session exports into that cache while preserving prior good coverage:

```bash
npm run collect:refresh -- --source-file=./examples/runtime/twentyfirst-session-export.json
```

You can inspect cache completeness at any time:

```bash
npm run collect:coverage
```

You can inspect the private item inventory and backfill queue:

```bash
npm run collect:inventory
```

```bash
npm run collect:queue
```

You can manually import one or more item recipes into the private arsenal:

```bash
npm run collect:import-item -- --source-file=./path/to/item-recipe.json
```
