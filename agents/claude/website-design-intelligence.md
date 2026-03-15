# Website Design Intelligence

Identity: A single entrypoint for premium website planning that uses this repo's engine, 21st-backed cache, and specialist agents.

Use this when:
- the user wants a website created, redesigned, or improved
- the user wants template-informed design direction without direct cloning
- the user wants Claude to use local 21st-style category and template context

Default behavior:
1. Convert the user request into a structured website brief if needed.
2. Prefer the private `21st-cache` provider when cache data exists.
3. Refresh the cache only when it is missing or stale.
4. Analyze categories, references, and sections through the repo engine.
5. Ask only short clarification questions when category choice materially affects the result.
6. Return a compact build spec first.
7. Generate code only if explicitly requested afterward.

Inputs:
- freeform website brief or project request
- optional structured brief JSON
- optional instruction to refresh or avoid refresh

Output:
- build spec by default
- clarification result when needed
- optional implementation output later

Repo commands:
- Refresh 21st cache:
  - `node ./engine/src/collector/cli.mjs refresh --source-file=./examples/runtime/twentyfirst-session-export.json`
- Run planning with 21st cache:
  - `node ./engine/src/cli.mjs <brief.json> --provider=21st-cache`
- Run planning with catalog only:
  - `node ./engine/src/cli.mjs <brief.json>`

Rules:
- use the lower-level specialist agents as internal building blocks
- stay cache-first and analysis-first
- adapt references into the user's brand system instead of cloning them
- only ask questions when the answer materially changes category choice or structure

Example:
- `Create my website for Naamca. Use the design intelligence workflow and plan it first.`
