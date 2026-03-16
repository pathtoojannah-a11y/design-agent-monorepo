# Install For Codex And Claude

## Goal

Use this repo as one reusable website-design capability instead of manually invoking individual specialist agents.

## Codex install

Create a local skill directory and copy the top-level skill file there:

```powershell
New-Item -ItemType Directory -Force "$HOME\\.codex\\skills\\website-design-intelligence" | Out-Null
Copy-Item ".\\agents\\codex\\website-design-intelligence.SKILL.md" "$HOME\\.codex\\skills\\website-design-intelligence\\SKILL.md" -Force
```

Then use prompts like:

```text
Create my website for Naamca. Use the website design intelligence skill and give me the best direction first.
```

## Claude install

Create a Claude agent file from the repo entrypoint:

```powershell
New-Item -ItemType Directory -Force "$HOME\\.claude\\agents" | Out-Null
Copy-Item ".\\agents\\claude\\website-design-intelligence.md" "$HOME\\.claude\\agents\\website-design-intelligence.md" -Force
```

Then use prompts like:

```text
Create my website for Naamca. Use website design intelligence and plan it before coding.
```

## Before first serious run

Populate the private 21st cache:

```powershell
node .\\engine\\src\\collector\\cli.mjs refresh --source-file=.\\examples\\runtime\\twentyfirst-session-export.json
```

Check how complete the private cache actually is:

```powershell
node .\\engine\\src\\collector\\cli.mjs coverage
```

Important rule:

- cache exists != full 21st visibility
- if coverage is incomplete for categories that matter to the project, the agent should inspect live 21st category pages and item inventories before planning from them
- the agent should not say it "sees all templates" unless it can list the actual items it found
- when private item-detail records include prompt/code recipes, the agent should use them to understand how the pattern is built and how to adapt it

## Main repo commands

- Analyze with 21st cache:
  - `node .\\engine\\src\\cli.mjs .\\examples\\briefs\\saas-ai-platform.json --provider=21st-cache`
- Analyze with catalog only:
  - `node .\\engine\\src\\cli.mjs .\\examples\\briefs\\saas-ai-platform.json`
- Inspect cached category:
  - `node .\\engine\\src\\collector\\cli.mjs inspect-category --name=Heroes`
- Inspect cache health:
  - `node .\\engine\\src\\collector\\cli.mjs coverage`

## How the entrypoint should behave

- analyze first
- use 21st as the primary design source when relevant
- inspect actual 21st items for relevant categories before recommending a direction
- use cache as a private accelerator, not as final proof of full 21st coverage
- ask only needed clarification questions
- produce a build spec before code
- generate code only when explicitly requested

## Bootstrap Prompt For Other Projects

Use this when starting a new redesign/build thread in another project:

```text
Use Website Design Intelligence from:
C:\Users\abe\OneDrive\website-design-intelligence

Treat 21st as the primary design source for this website.
Do not assume the local 21st cache is full coverage just because it exists.

First:
1. Check private 21st cache coverage.
2. Determine the relevant 21st categories for this brief.
3. If coverage is incomplete for those categories, inspect live 21st category pages and item inventories.
4. Enumerate the actual 21st items found.
5. Separate:
   - cached items
   - live-discovered items
   - selected references
6. Use private prompt/code recipes when available to understand how the chosen patterns are built.

Then:
7. Analyze the patterns you found.
8. Propose the strongest direction.
9. Adapt that direction to the target brand/site.
10. Give a build spec before coding.

Do not claim broad 21st access unless you can name the actual templates/components you inspected.
```
