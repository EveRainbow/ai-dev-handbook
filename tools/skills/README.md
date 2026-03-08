# Agent Skills & Slash Commands

> Reusable, version-controlled instructions that extend what any AI agent can do

[← Back to Tools](../README.md) · [← Back to handbook](../../README.md)

---

## What a skill is

A **skill** — a directory containing a `SKILL.md` file with YAML frontmatter and markdown instructions. The `name` field becomes a `/slash-command`. The agent invokes the skill automatically when the conversation matches the description, or you invoke it manually with `/skill-name`.

Skills follow the [Agent Skills open standard](https://agentskills.io), open-sourced by Anthropic in late 2025 and now supported by Claude Code, GitHub Copilot, Cursor, OpenAI Codex, and 30+ other tools. A skill you write once runs unchanged across all compatible agents.

**Minimal example** — a skill at `.claude/skills/explain-code/SKILL.md`:

```yaml
---
name: explain-code
description: Explains code with analogies and ASCII diagrams. Use when the user asks "how does this work?"
---

When explaining code, always:
1. Start with an everyday analogy
2. Draw an ASCII diagram of the flow or structure
3. Walk through the code step by step
4. Highlight one common gotcha
```

Stored in the project at `.claude/skills/explain-code/SKILL.md`. Ask "how does this work?" and Claude loads and follows it automatically.

---

## Bundled skills

Bundled skills ship with Claude Code and are available in every session without any setup. They are prompt-based — they give Claude a detailed playbook and let it orchestrate the work using its tools, including spawning parallel agents.

| Skill | What it does |
|-------|-------------|
| `/simplify` | Reviews recently changed files for code reuse, quality, and efficiency — spawns 3 parallel review agents, aggregates findings, applies fixes |
| `/batch <instruction>` | Decomposes a large change into 5–30 independent units, spawns one background agent per unit in isolated git worktrees, each running tests and opening a PR |
| `/debug [description]` | Reads the current session's debug log to troubleshoot unexpected agent behaviour |
| `/loop [interval] <prompt>` | Runs a prompt on a recurring schedule while the session stays open — e.g. `/loop 5m check if the deploy finished` |
| `/claude-api` | Loads Claude API and Agent SDK reference for your project's language; also activates automatically when your code imports `anthropic` or `@anthropic-ai/sdk` |

---

## Creating a custom skill

### Where skills live

| Scope | Path | Applies to |
|-------|------|------------|
| Enterprise | Managed settings (admin-controlled) | All users in your org |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where the plugin is enabled |

Priority when names conflict: enterprise > personal > project. Plugin skills use a `plugin-name:skill-name` namespace and cannot conflict with other scopes.

### Directory structure

Each skill is a directory. Only `SKILL.md` is required; the rest are optional:

```
my-skill/
├── SKILL.md           # required — frontmatter + instructions
├── template.md        # optional — template for Claude to fill in
├── examples/
│   └── sample.md      # optional — example output showing expected format
└── scripts/
    └── validate.sh    # optional — script Claude can execute
```

Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files and link to them from `SKILL.md`.

### Frontmatter reference

```yaml
---
name: my-skill
description: What this skill does and when to use it
disable-model-invocation: true
allowed-tools: Read, Grep
---
```

| Field | Required | What it does |
|-------|----------|-------------|
| `name` | No | Slash-command name (default: directory name). Lowercase letters, numbers, hyphens. Max 64 chars. |
| `description` | Recommended | What the skill does + when to use it. Claude reads this to decide when to auto-invoke. |
| `argument-hint` | No | Hint shown during `/` autocomplete, e.g. `[issue-number]` or `[filename] [format]` |
| `disable-model-invocation` | No | `true` — only you can invoke. Use for `/deploy`, `/commit`, `/send-slack-message` |
| `user-invocable` | No | `false` — only Claude can invoke. Use for background knowledge, not commands |
| `allowed-tools` | No | Tools Claude can use without per-use approval when this skill is active |
| `model` | No | Override the model for this skill |
| `context` | No | `fork` — run the skill in an isolated subagent with no conversation history |
| `agent` | No | Which subagent type when `context: fork` — e.g. `Explore`, `Plan`, `general-purpose` |
| `hooks` | No | Lifecycle hooks scoped to this skill |

### Invocation control

By default, both you and Claude can invoke a skill. Two fields restrict this:

| Frontmatter | You invoke | Claude auto-invokes | Loaded into context |
|-------------|-----------|---------------------|---------------------|
| (default) | Yes | Yes | Description always; full content on invoke |
| `disable-model-invocation: true` | Yes | No | Not in context; full content loads when you invoke |
| `user-invocable: false` | No | Yes | Description always; full content on invoke |

Use `disable-model-invocation: true` for anything with side effects. You don't want Claude deciding to deploy because your code looks ready.

### Passing arguments

Use `$ARGUMENTS` anywhere in the skill content to receive what follows `/skill-name`. For positional arguments, use `$ARGUMENTS[N]` or the shorthand `$N` (0-based).

If `$ARGUMENTS` is not in the content, Claude Code appends `ARGUMENTS: <value>` to the end automatically.

```yaml
---
name: fix-issue
description: Fix a GitHub issue by number
disable-model-invocation: true
argument-hint: [issue-number]
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests covering the fix
5. Create a commit
```

Invoked as `/fix-issue 123` — Claude receives "Fix GitHub issue 123 following our coding standards..."

Positional example:

```yaml
---
name: migrate-component
description: Migrate a component from one framework to another
argument-hint: [component] [from] [to]
---

Migrate the $0 component from $1 to $2. Preserve all existing behaviour and tests.
```

`/migrate-component SearchBar React Vue` fills `$0`, `$1`, `$2` respectively.

### Shell preprocessing

Use `` !`command` `` to inject live shell output before Claude sees the prompt. The command runs immediately; Claude only sees the final result.

```yaml
---
name: pr-summary
description: Summarize the current pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

Summarize this pull request: what changed, why, and what to watch out for in review.
```

When this skill runs, each `` !`...` `` executes first and its output replaces the placeholder. Claude receives the fully-rendered prompt with actual PR data.

### Supporting files

Link to supporting files from `SKILL.md` so Claude knows what they contain and when to load them:

```markdown
## Additional resources
- Complete API reference: [reference.md](reference.md)
- Usage examples: [examples.md](examples.md)
```

Large reference docs, API specs, or example collections load only when the skill is invoked — they don't consume context at all times.

---

## Cross-tool portability

Skills follow the [Agent Skills open standard](https://agentskills.io) and run unchanged across compatible agents:

**Claude Code** — `.claude/skills/<name>/SKILL.md`
**GitHub Copilot** (VS Code + CLI) — `.github/skills/` or `.claude/skills/`
**Cursor, OpenAI Codex CLI, Windsurf, Goose, Gemini CLI, Roo Code, Amp, Factory** — all implement the same standard

A skill you write for Claude Code today works in Copilot or Cursor without modification. Commit `.claude/skills/` to version control and it travels with the repo.

---

## Context budget

Skill descriptions are loaded into context so Claude knows what's available. If you have many skills, they can exceed the budget.

- **Budget:** 2% of the context window (fallback: 16,000 characters)
- **Check:** run `/context` — Claude Code warns if any skills were excluded
- **Override:** set `SLASH_COMMAND_TOOL_CHAR_BUDGET=<chars>` in your environment

---

## Community & distribution

- Commit `.claude/skills/` to version control — skills travel with the repo and apply to the whole team
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — curated community skills, hooks, and commands
- skills.sh — primary hub for discovering and sharing packaged skills
- [tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills) — validated, cross-tool skill registry

---

### Terms used on this page

<details>
<summary><strong>skill</strong></summary>

A directory containing a `SKILL.md` file that extends an agent's capabilities. The frontmatter configures how and when the skill is invoked; the markdown body contains the instructions the agent follows.

</details>

<details>
<summary><strong>bundled skill</strong></summary>

A skill that ships with the tool and is available in every session without setup. Bundled skills are prompt-based — they orchestrate work using the agent's tools rather than executing fixed logic. Claude Code's bundled skills include `/simplify`, `/batch`, `/debug`, `/loop`, and `/claude-api`.

</details>

<details>
<summary><strong>slash command</strong></summary>

A `/name` invocation that triggers a skill directly. Slash commands were merged into the skills system in Claude Code v2.1.3. Existing `.claude/commands/` files continue to work; skills are the preferred location for new commands.

</details>

<details>
<summary><strong>context: fork</strong></summary>

A frontmatter field that runs the skill in an isolated subagent. The subagent receives the skill content as its task prompt and has no access to the current conversation history. Use it for research or analysis tasks that should run independently.

</details>
