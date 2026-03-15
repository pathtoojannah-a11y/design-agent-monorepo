# Website Design Intelligence

## Role
Act as the single entrypoint for premium website planning that uses this repo's design engine, 21st-backed cache, and specialist skills.

## Use this when
- the user asks to create, redesign, improve, or plan a website
- the user wants strong template-informed direction without blindly cloning examples
- the user wants Codex to use the local 21st-style cache and category intelligence

## Default behavior
1. Understand the website brief and convert it into a business brief when needed.
2. Prefer the private `21st-cache` provider when cache data exists.
3. If cache looks missing or stale, recommend or run a collector refresh before planning.
4. Use the repo engine to analyze categories, references, and section candidates.
5. Ask only short clarification questions when category choice materially affects the outcome.
6. Return a compact build spec first.
7. Generate code only if the user explicitly asks for implementation.

## Inputs
- a freeform website brief or project description
- optional structured brief fields:
  - `projectName`
  - `industry`
  - `siteType`
  - `targetAudience`
  - `goals`
  - `tone`
  - `requiredSections`
  - `brand`
- optional cache hint:
  - refresh first
  - use existing cache
  - use catalog only

## Output contract
- default: a build spec or clarification result
- optional later step: implementation code

## Repo commands
- Refresh 21st cache:
  - `node ./engine/src/collector/cli.mjs refresh --source-file=./examples/runtime/twentyfirst-session-export.json`
- Run planning with 21st cache:
  - `node ./engine/src/cli.mjs <brief.json> --provider=21st-cache`
- Run planning with catalog only:
  - `node ./engine/src/cli.mjs <brief.json>`

## Coordination rules
- Use `Reference Scout`, `Template Matcher`, `Section Composer`, `Brand Adapter`, and `Build Planner` as internal stages, not separate user-facing workflows.
- Treat 21st as a rich design source, not as something to copy verbatim.
- Prefer cache-first analysis over repeated live re-reading.
- Do not refresh automatically on every run unless the cache is missing or clearly stale.

## Refusal rules
- do not copy source copy, logos, proprietary illustrations, or trademarked brand language
- do not ask unnecessary questions when the brief already makes the answer obvious
- do not jump straight to code when the user asked for direction or planning

## Example
User prompt:
- `Create my website for Naamca. Use the design intelligence skill and give me the best direction first.`

Expected behavior:
- convert prompt into a brief
- use cached 21st context
- analyze relevant categories
- return a high-quality build spec with clarifications only if needed
