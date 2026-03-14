# Design Agent Monorepo

Public, reusable monorepo for section-based design intelligence and agent-driven website planning.

This repo ships two things:

- reusable Codex and Claude agent definitions for design-reference workflows
- a lightweight engine that evaluates curated reference metadata and produces compact build specs

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
npm test
```

## Output model

The default engine output is a compact JSON build spec containing:

- selected sections
- section rationale
- visual direction
- brand adaptation
- copy direction
- implementation prompt
- non-cloning constraints

## Compliance model

This repo stores metadata only:

- source URLs
- screenshot paths or image references
- section tags and style notes
- business-fit metadata

It does not store mirrored template code or proprietary assets.
