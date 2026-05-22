# Claude Code Plugins

> Package skills, agents, hooks, MCP servers, and settings as a versioned, shareable unit

[← Back to Tools](../README.md) · [← Back to handbook](../../README.md)

---

> [!NOTE]
> **TL;DR** — A plugin is a directory with a `.claude-plugin/plugin.json` manifest plus any combination of `skills/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, and `settings.json`. Plugins are how you ship a Claude Code setup across a team or community — namespaced, versioned, installable.

## 🤔 Standalone `.claude/` or plugin?

Both layouts hold the same kinds of files (skills, hooks, agents, MCP configs). The difference is whether you want the setup to be one-project-private or repeatable across projects and contributors.

| Approach | Skill names look like | Fits when |
|---|---|---|
| **Standalone** — files placed directly under the repo's `.claude/` | `/hello` | One-project setup. Personal experiments. Anything you don't expect to share. |
| **Plugin** — a directory with a `.claude-plugin/plugin.json` manifest | `/my-plugin:hello` | Sharing across your team or the community. Versioned releases. The same setup reused across multiple projects. |

Start in standalone `.claude/` while you iterate on a skill or hook. Convert to a plugin when the setup is worth handing to someone else — the file format inside the plugin is identical to standalone, only the wrapper changes. The tradeoff is namespacing: plugin skills always carry a `<plugin-name>:` prefix so two plugins with the same skill name can coexist. For team-shared content the prefix is worth the safety.

Source: [Create plugins](https://code.claude.com/docs/en/plugins).

---

## 🚀 Minimal plugin

Three files. One directory.

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── hello/
        └── SKILL.md
```

`my-plugin/.claude-plugin/plugin.json`:

```json
{
  "name": "my-plugin",
  "description": "Greets the user",
  "version": "1.0.0",
  "author": { "name": "Your Name" }
}
```

`my-plugin/skills/hello/SKILL.md`:

```markdown
---
description: Greet the user warmly
---

Greet the user warmly and ask how you can help.
```

Test locally:

```bash
claude --plugin-dir ./my-plugin
```

Then in the session: `/my-plugin:hello`. As you edit the plugin, run `/reload-plugins` in the session to pick up the changes without restarting Claude Code.

> [!WARNING]
> Only `plugin.json` lives inside `.claude-plugin/`. Everything else — `skills/`, `agents/`, `hooks/`, `.mcp.json`, `settings.json` — goes at the **plugin root**, not inside `.claude-plugin/`. Misplacing them is the most common reason a plugin loads silently and does nothing.

---

## 📁 What a plugin can contain

A plugin is a small, well-defined directory tree. Every component is optional except the manifest.

| Path | What lives there |
|---|---|
| `.claude-plugin/plugin.json` | The manifest — name, description, version, author. The only required file. |
| `skills/<name>/SKILL.md` | Skills. Each becomes `/plugin-name:skill-name` when the plugin is enabled. See [skills](../skills/README.md). |
| `commands/<name>.md` | Legacy flat-file commands. Use `skills/` instead for anything new — same capabilities, better directory structure. |
| `agents/<name>.md` | Custom subagent definitions your plugin's users can dispatch. |
| `hooks/hooks.json` | Lifecycle hooks (`PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`). Same JSON schema as the `hooks` object in `.claude/settings.json` — see the [hooks section in `security/`](../../security/README.md). |
| `.mcp.json` | MCP server configurations bundled with the plugin — so installing the plugin also wires up its required tool servers. |
| `.lsp.json` | LSP server configurations. Gives Claude real-time code intelligence for languages without a built-in provider. Users still need the language-server binary installed. |
| `monitors/monitors.json` | Background monitors — a command whose stdout lines become in-session notifications (think `tail -F error.log`). Claude Code starts each monitor automatically when the plugin is active. |
| `bin/` | Executables added to the Bash tool's `PATH` while the plugin is enabled. Useful when your skills want to call a plugin-shipped helper script by name. |
| `settings.json` | Default settings applied when the plugin is enabled. Currently honors the `agent` key (set the main-thread agent) and `subagentStatusLine`; unknown keys are silently ignored. |

The manifest schema is short:

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Lowercase identifier. Becomes the skill namespace (`/<name>:<skill>`). |
| `description` | Yes | One-line summary shown in the plugin manager. |
| `version` | Recommended | Semantic version. Without it, the git commit SHA becomes the version and every commit is a new "release" for installed users. |
| `author` | Optional | `{ "name", "email", "url" }` — attribution. |
| `homepage`, `repository`, `license` | Optional | Used for discovery and licensing metadata. See [plugins-reference](https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema). |

Source: [Plugins reference](https://code.claude.com/docs/en/plugins-reference).

---

## 🔁 Local development loop

`--plugin-dir` loads a plugin from a path without installing it — the fastest dev loop while authoring.

```bash
# Load a single plugin from a directory
claude --plugin-dir ./my-plugin

# Load multiple plugins (repeat the flag)
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two

# Load a zipped archive (v2.1.128+)
claude --plugin-dir ./my-plugin.zip

# Load a remote zip artifact — e.g. a CI build
claude --plugin-url https://example.com/my-plugin.zip
```

Inside the session, `/reload-plugins` re-reads skills, agents, hooks, MCP servers, and LSP servers without restarting Claude Code. If a `--plugin-dir` plugin shares its name with an already-installed plugin, the local copy wins for that session — useful for testing edits against a published version.

> [!WARNING]
> `--plugin-url` fetches and executes plugin code from a URL. Only point it at archives you control or trust. The same trust posture applies as installing any plugin from any source — see [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins).

---

## 🔀 Migrating from standalone `.claude/`

If you already have skills and hooks under `.claude/`, converting to a plugin is mechanical — the inner file formats don't change.

```bash
# 1. Scaffold the plugin directory and manifest
mkdir -p my-plugin/.claude-plugin
cat > my-plugin/.claude-plugin/plugin.json <<'EOF'
{
  "name": "my-plugin",
  "description": "Migrated from standalone configuration",
  "version": "1.0.0"
}
EOF

# 2. Copy existing components (any that exist)
cp -r .claude/commands my-plugin/ 2>/dev/null || true
cp -r .claude/agents   my-plugin/ 2>/dev/null || true
cp -r .claude/skills   my-plugin/ 2>/dev/null || true
```

Hooks move from the `hooks` object in `.claude/settings.json` into `my-plugin/hooks/hooks.json` — same schema, just a different home:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }
        ]
      }
    ]
  }
}
```

Verify everything loads:

```bash
claude --plugin-dir ./my-plugin
```

Once the plugin works, remove the originals from `.claude/` to avoid running the same skill twice from two sources.

| Before (standalone `.claude/`) | After (plugin) |
|---|---|
| `.claude/commands/<name>.md` | `my-plugin/commands/<name>.md` |
| `.claude/skills/<name>/SKILL.md` | `my-plugin/skills/<name>/SKILL.md` |
| `.claude/agents/<name>.md` | `my-plugin/agents/<name>.md` |
| Hooks in `.claude/settings.json` | `my-plugin/hooks/hooks.json` |
| Manual copy to share | `/plugin install` from a marketplace |

---

## 👥 Sharing inside a team

A **marketplace** is a git repository that lists one or more plugins. For internal team use, host it on whatever Git provider your team already uses — GitHub Enterprise, GitLab self-hosted, an internal Gitea — and add team members' Claude Code to it. They install plugins from the marketplace with `/plugin install <plugin-name>`.

Two team-level patterns the official docs cover:

- **Per-user marketplace.** Each developer adds the team's marketplace to their personal Claude Code config and chooses which plugins to install. Best when plugins are optional opt-ins.
- **Repo-level (auto-enabling) plugins.** A marketplace can be tied to a specific repo so anyone who clones it gets the plugins enabled for that workspace automatically. Best when the plugin is mandatory for the project to work (e.g., a plugin that ships the project's CI-specific skills).

Schema for the marketplace itself is documented at [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces); the team-config side is at [Configure team marketplaces](https://code.claude.com/docs/en/discover-plugins#configure-team-marketplaces).

For broader distribution, Anthropic accepts plugin submissions to the official marketplace via the in-product forms at [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit) or [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit).

---

## 📦 Versioning

| Strategy | Use when |
|---|---|
| Explicit `version` in `plugin.json` (`"1.0.0"`) | Production plugins. Users only see updates when you bump the field. Predictable rollout. |
| Omit `version`; distribute via git | Internal or experimental plugins. The commit SHA becomes the version, so every commit is a release for installed users. Fast iteration; less stable. |

For shared plugins, pick explicit versions and bump them deliberately — your users' workflows depend on yours.

---

## 🛠️ Debugging

- **Wrong directory placement.** Skills, agents, or hooks not appearing? Check they're at the plugin root, not nested inside `.claude-plugin/`. This is the most common silent-fail mode.
- **Test components one at a time.** Try each skill via its slash command. Run `/agents` to confirm custom agents are listed. Hook failures are often silent unless you check the exit code — temporarily make the hook script `set -x` and watch what runs.
- **Use `/reload-plugins` aggressively** while authoring. Forgetting it is the most common "why isn't my change showing up" cause.
- **Settings precedence.** `settings.json` inside a plugin can override Claude Code defaults but is itself overridable by managed (enterprise) settings. Unknown keys are silently ignored — typos won't error.

Full CLI debugging surface is documented at [plugins-reference § Debugging](https://code.claude.com/docs/en/plugins-reference#debugging-and-development-tools).

---

### 📖 Terms used on this page

<details>
<summary><strong>plugin</strong></summary>

A directory with a `.claude-plugin/plugin.json` manifest plus any combination of skills, agents, hooks, MCP servers, LSP servers, monitors, executables, and default settings. The unit of distribution for Claude Code configurations.

</details>

<details>
<summary><strong>manifest</strong></summary>

The `plugin.json` file at `.claude-plugin/plugin.json`. Carries `name` (which becomes the skill namespace), `description`, `version`, and optional metadata. The only required file in a plugin.

</details>

<details>
<summary><strong>marketplace</strong></summary>

A git repository hosting one or more plugins and the metadata to install them. Can be public (Anthropic's official marketplace) or private (your team's internal repo). Users install with `/plugin install <name>`.

</details>

<details>
<summary><strong>namespace prefix</strong></summary>

Plugin skills are always invoked as `/<plugin-name>:<skill-name>` (e.g. `/my-plugin:hello`). Prevents collisions between plugins. The `name` field in `plugin.json` controls the prefix.

</details>

<details>
<summary><strong><code>/reload-plugins</code></strong></summary>

In-session command that reloads all plugin content — skills, agents, hooks, MCP servers, LSP servers — without restarting Claude Code. The fastest dev loop while authoring a plugin.

</details>

<details>
<summary><strong><code>--plugin-dir</code> / <code>--plugin-url</code></strong></summary>

CLI flags that load a plugin without installing it. `--plugin-dir` points at a local path (or a `.zip` archive on Claude Code 2.1.128+). `--plugin-url` fetches a remote `.zip`. Both load the plugin for that session only — useful for development and testing.

</details>
