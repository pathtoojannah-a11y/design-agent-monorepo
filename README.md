# Template Scout Starter

This repo gives you a simple agent-friendly workflow for picking the best landing-page direction from a catalog of template patterns, then adapting that pattern into your own brand system.

## What it does

- Reads a project brief from `briefs/example-brief.json`
- Scores each entry in `data/template-catalog.json`
- Selects the best-fit pattern
- Produces a brand adaptation plan and prompt seed for later implementation

## Run it

```bash
npm run select-template
```

Or run a different brief directly:

```bash
node ./src/run-template-selector.mjs ./briefs/example-brief.json
```

## Files

- `briefs/example-brief.json`: your business brief, goals, brand colors, fonts, and required sections
- `data/template-catalog.json`: reusable template patterns inspired by strong modern landing-page structures
- `src/run-template-selector.mjs`: scoring and adaptation logic

## How to use this with agents

Use the generated `promptSeed` as the handoff prompt to your build agent.

Suggested flow:

1. A scout agent gathers strong reference pages or 21st-style components.
2. This repo scores the best structural fit against the client brief.
3. A design agent rewrites colors, typography, spacing, and motion.
4. A build agent turns the chosen direction into code.

## How to connect this to 21st later

Right now the catalog is local and manual. That is deliberate so the workflow works immediately.

Later, you can replace or enrich `data/template-catalog.json` with:

- 21st Magic outputs
- manually curated 21st component/page references
- your own internal winning templates

The key rule is simple: reuse structure, not exact branding.
