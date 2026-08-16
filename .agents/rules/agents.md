# Agent Guidance Rules

Use these rules when creating or updating project agent guidance.

## Skills

- Store project skills in `.agents/skills/<skill-name>/SKILL.md`.
- Use lowercase hyphen-case skill names.
- Keep skills short and consistent with the existing files in `.agents/skills`.
- Include only `name` and `description` in YAML frontmatter.
- Make `description` specific enough to trigger the skill in the right tasks.
- In the body, list required context and a short workflow.
- Reference `.agents/rules/*` instead of duplicating rule text in skills.
- Do not add `agents/openai.yaml`, scripts, references, assets, or extra docs
  unless the user explicitly asks or the skill cannot work without them.
- Add every new project skill to `AGENTS.md`.

## Rules

- Store project rules in `.agents/rules/<topic>.md`.
- Keep rules concise, task-focused, and reusable by multiple skills.
- Add every new project rule to `AGENTS.md`.
- Prefer updating an existing rule over creating overlapping guidance.
