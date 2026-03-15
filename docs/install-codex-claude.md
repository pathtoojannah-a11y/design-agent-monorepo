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

## Main repo commands

- Analyze with 21st cache:
  - `node .\\engine\\src\\cli.mjs .\\examples\\briefs\\saas-ai-platform.json --provider=21st-cache`
- Analyze with catalog only:
  - `node .\\engine\\src\\cli.mjs .\\examples\\briefs\\saas-ai-platform.json`
- Inspect cached category:
  - `node .\\engine\\src\\collector\\cli.mjs inspect-category --name=Heroes`

## How the entrypoint should behave

- analyze first
- use 21st cache when available
- ask only needed clarification questions
- produce a build spec before code
- generate code only when explicitly requested
