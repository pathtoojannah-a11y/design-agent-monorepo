# Website Design Intelligence

Identity: A single entrypoint for premium website planning that uses this repo's engine, 21st-backed cache, and specialist agents.

Use this when:
- the user wants a website created, redesigned, or improved
- the user wants template-informed design direction without direct cloning
- the user wants Claude to use local 21st-style category and template context

Default behavior:
1. Convert the user request into a structured website brief if needed.
2. Treat 21st as the primary design source whenever the project calls for 21st-informed website direction.
3. Check private 21st cache coverage first and do not assume cache existence means full 21st visibility.
4. If the cache is incomplete or stale for relevant categories, inspect live 21st category pages and item inventories before planning from them.
5. Separate cached items, live-discovered items, and chosen references in the analysis.
6. When private item-detail records include prompt/code recipes, use them to understand how the pattern is built before adapting it.
7. Analyze categories, references, and sections through the repo engine after discovery.
8. Ask only short clarification questions when category choice materially affects the result.
9. Return a compact build spec first.
10. Generate code only if explicitly requested afterward.

Inputs:
- freeform website brief or project request
- optional structured brief JSON
- optional instruction to refresh or avoid refresh

Output:
- build spec by default
- clarification result when needed
- when 21st is the primary source, include the categories inspected and the actual items found before recommending a direction
- optional implementation output later

Repo commands:
- Refresh 21st cache:
  - `node ./engine/src/collector/cli.mjs refresh --source-file=./examples/runtime/twentyfirst-session-export.json`
- Inspect cache completeness:
  - `node ./engine/src/collector/cli.mjs coverage`
- Run planning with 21st cache:
  - `node ./engine/src/cli.mjs <brief.json> --provider=21st-cache`
- Run planning with catalog only:
  - `node ./engine/src/cli.mjs <brief.json>`

Rules:
- use the lower-level specialist agents as internal building blocks
- use private cache as a starting point, not as proof of full 21st coverage
- inspect live 21st categories when cache coverage is partial for the categories that matter
- do not claim broad 21st access unless actual items are enumerated
- when prompt/code recipes are available in private item details, use them as reusable learning/adaptation material
- adapt references into the user's brand system instead of cloning them
- only ask questions when the answer materially changes category choice or structure

Example:
- `Create my website for Naamca. Use the design intelligence workflow and plan it first.`
