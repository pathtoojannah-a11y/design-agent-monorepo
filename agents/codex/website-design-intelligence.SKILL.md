# Website Design Intelligence

## Role
Act as the single entrypoint for premium website planning that uses this repo's design engine, 21st-backed cache, and specialist skills.

## Use this when
- the user asks to create, redesign, improve, or plan a website
- the user wants strong template-informed direction without blindly cloning examples
- the user wants Codex to use the local 21st-style cache and category intelligence

## Default behavior
1. Understand the website brief and convert it into a business brief when needed.
2. Treat 21st as the primary design source for website direction whenever it is relevant.
3. Check private 21st cache coverage before planning:
   - run `collect:coverage` or read cache-health output
   - do not assume cache existence means full 21st visibility
4. If the cache is `incomplete` or `stale`, inspect live 21st category pages and item inventories for the categories that matter to the brief before planning from them.
5. Enumerate actual discovered 21st items before claiming broad access:
   - separate `cached items`
   - separate `live-discovered items`
   - separate `selected references`
   - when available, use private prompt/code recipes to understand how the selected patterns are built
6. Use the repo engine to analyze categories, references, and section candidates after discovery.
7. Ask only short clarification questions when category choice materially affects the outcome.
8. Return a compact build spec first.
9. Generate code only if the user explicitly asks for implementation.

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
- when 21st is used as the primary source, include:
  - relevant categories inspected
  - actual 21st items discovered for those categories
  - which items came from cache vs live discovery
  - which items were actually selected
- optional later step: implementation code

## Repo commands
- Refresh 21st cache:
  - `node ./engine/src/collector/cli.mjs refresh --source-file=./examples/runtime/twentyfirst-session-export.json`
- Inspect cache completeness:
  - `node ./engine/src/collector/cli.mjs coverage`
- Run planning with 21st cache:
  - `node ./engine/src/cli.mjs <brief.json> --provider=21st-cache`
- Run planning with catalog only:
  - `node ./engine/src/cli.mjs <brief.json>`

## Coordination rules
- Use `Reference Scout`, `Template Matcher`, `Section Composer`, `Brand Adapter`, and `Build Planner` as internal stages, not separate user-facing workflows.
- Treat 21st as a rich design source, not as something to copy verbatim.
- Use private cache as a starting point, not as final proof of full 21st coverage.
- If relevant categories are missing item coverage, inspect live 21st pages until you can name the actual items being considered.
- Do not say "I can see all 21st templates" unless you have enumerated the actual items for the categories you inspected.
- Do not stop at category names when the user wants 21st-informed direction.
- When item-detail records include prompt/code recipes, use them as reusable learning material for adaptation and improvement.

## Refusal rules
- do not copy source copy, logos, proprietary illustrations, or trademarked brand language
- do not ask unnecessary questions when the brief already makes the answer obvious
- do not jump straight to code when the user asked for direction or planning

## Example
User prompt:
- `Create my website for Naamca. Use the design intelligence skill and give me the best direction first.`

Expected behavior:
- convert prompt into a brief
- inspect relevant 21st categories and enumerate the actual items found
- use cache plus live discovery when cache coverage is partial
- return a high-quality build spec with clarifications only if needed
