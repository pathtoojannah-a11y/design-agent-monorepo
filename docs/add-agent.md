# Add an Agent

Add new agent definitions under:

- `agents/codex/`
- `agents/claude/`

Each agent file should include:

- identity and role
- expected inputs
- output contract
- selection rules
- refusal rules for direct copying
- short examples

Keep each agent focused on one stage of the pipeline so the repo stays composable.
