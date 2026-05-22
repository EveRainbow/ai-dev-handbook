# Security

> Least-privilege security model for AI agents and MCP tools

[← Back to handbook](../README.md)

---

AI agents can take real-world actions — write files, run commands, call APIs. That makes security hygiene more important than ever.

## 🔒 Least Privilege, Always

**MCP (Model Context Protocol)** — an open standard that lets AI agents connect to external tools: web browsers, terminals, databases, file systems, and external APIs. Each connection is an MCP server. Because agents can take real actions through these servers, controlling what they can access is critical.

```mermaid
graph LR
  Agent -- tool calls --> MCP[MCP Server]
  MCP -- read-only --> DB[(Database)]
  MCP -- scoped token --> API[External API]
```

When connecting agents to external tools via MCP, follow these principles:

- **Start read-only** — give agents write access only when absolutely needed, and only to what they need
- **Isolate high-risk tools** — anything touching the browser, filesystem, or terminal should run in a sandboxed container (a Docker container or VM with no network or filesystem access beyond what the specific task requires)
- **Require user consent** for any elevated permissions
- **Log everything** — audit all tool access so you can trace what the agent did and why. Each entry should record: timestamp, tool name, action, inputs, and outcome. [Full annotated example →](../examples/security/audit-log-entry.json)
- **Pin and review tool manifests** — treat them like code dependencies; don't blindly trust them. A manifest is the JSON/YAML file that declares what an MCP server can do and what permissions it requests — read it before installing.

---

## 🔍 MCP Server Vetting

> [!WARNING]
> Never install an MCP server you haven't read. A malicious server can exfiltrate code, credentials, or secrets through legitimate-looking tool calls.

Before adding an MCP server to your setup:

1. Review the server's manifest and source code if available
2. Confirm it's from a trusted publisher — look for: source-available code, an org-owned repository, a history of maintained releases, and publication in an official registry
3. Pin it to a specific version — don't use floating `latest` references
4. Scope its permissions to only what the current task requires — e.g., a file-reader MCP should have access to `src/` only, not your home directory
5. Remove it when the task is done if it's not needed ongoing

---

## ✅ Human Approval Gates

Some actions should always require explicit human approval before an agent proceeds:

- Database schema migrations
- Production deployments
- Installing new dependencies
- Modifying CI/CD configuration
- Any action that touches secrets or credentials

Build these gates into your workflow explicitly, not as an afterthought. In practice this means one of:

- A rule in your `AGENTS.md` / `CLAUDE.md`: `⚠️ Ask first: run database migrations, deploy to production`
- A GitHub Actions `environment:` block requiring a named reviewer before the job runs
- A CI step that pauses and posts a Slack/Teams message requesting sign-off

### Permission modes — from least to most autonomous

Most agentic tools ship multiple permission modes. The names differ between tools but the levels collapse to:

| Level | What runs without asking | When to use it |
|---|---|---|
| **Manual approval** | Reads only | Sensitive work; you want to inspect every action before it happens. |
| **Accept edits** | File edits inside the working directory | Iterating on code you're actively reviewing as it's written. |
| **Plan only** | Reads; produces a plan you approve before any change | Exploring an unfamiliar area before touching it. |
| **Classifier-gated** | Most actions, but a separate model blocks scope escalation, credential exfiltration, force-pushes to `main`, and similar high-risk patterns | Long unattended runs where you trust the general direction but not every individual call. |
| **Full bypass** | Everything, no checks | Disposable containers / VMs only — never on a machine that has access to anything you care about. |

In Claude Code these levels are named `default`, `acceptEdits`, `plan`, `auto`, and `bypassPermissions` respectively. Other agents use different names, but the same five-step ladder applies.

> [!WARNING]
> Classifier-gated mode is **not** full bypass. The classifier blocks deleting beyond scope, sending credentials externally, force-pushing to protected branches, and similar — it's a separate model running per tool call. Full bypass runs everything. Never run an agent in full-bypass mode outside an isolated environment.

Source: [Permission modes](https://code.claude.com/docs/en/permission-modes), [Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode).

---

## 💾 Backup Isolation

Any path an agent can reach is in scope for destruction. **Backups belong on a different trust boundary from production** — a separate account, a separate provider, or behind a write-only token the agent doesn't hold. Same project + same credentials = the backups go down with the database.

The PocketOS incident in April 2026 made this concrete: a Cursor session running Claude Opus 4.6 decided to "fix" an unrelated issue by dropping the production database. No confirmation prompt fired. The Railway backups lived in the same project the agent could already touch, so those went too — the full wipe took nine seconds. Data was eventually recovered, but the recovery path involved provider escalation, not anything the team controlled.

The defense is a hard, repo-level rule in `AGENTS.md` / `CLAUDE.md`:

```
Never run destructive commands without an explicit, human-typed
confirmation in the same turn. Destructive includes:

  - DROP TABLE, TRUNCATE, DELETE FROM <table> without a WHERE clause
  - rm -rf, mv to /dev/null, shred
  - terraform destroy, kubectl delete, helm uninstall
  - any schema migration that drops columns or tables
  - force-push to a protected branch

If you're unsure whether a command is destructive, ask first.
```

Pair the rule with infrastructure: move backups to an account or provider the agent has no write credentials for. Advisory rules in `AGENTS.md` reduce blast radius; separate trust boundaries cap it.

Source: [The Independent](https://www.independent.co.uk/tech/claude-ai-agent-deletes-startup-anthropic-b2966176.html), [Euronews](https://www.euronews.com/next/2026/04/28/an-ai-agent-deleted-a-companys-entire-database-in-9-seconds-then-wrote-an-apology).

---

## 🪝 Deterministic Guardrails with Hooks

Rules in `AGENTS.md` are advisory — the agent reads them, weighs them against the request, and may decide to ignore them. Hooks are deterministic: a shell command runs at a defined lifecycle point and can refuse a tool call before it executes. For anything you genuinely cannot afford to leave to instruction-following, register a hook.

A `PreToolUse` hook that blocks edits to sensitive files, declared in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }
        ]
      }
    ]
  }
}
```

The hook script reads the JSON event from stdin, checks `tool_input.file_path` against a blocklist (`.env`, anything under `.git/`, `package-lock.json`, anything under `migrations/`), and exits with code `2` to deny. Whatever it prints to stderr is fed back to the agent so it can adjust its next action.

```bash
#!/usr/bin/env bash
# .claude/hooks/protect-files.sh
file=$(jq -r '.tool_input.file_path' <&0)
case "$file" in
  *.env|*/.git/*|*/package-lock.json|*/migrations/*)
    echo "Editing $file requires human review." 1>&2
    exit 2
    ;;
esac
```

Run `chmod +x` after creating the script. Use the same pattern with `"matcher": "Bash"` to block shell commands containing `rm -rf`, `curl | sh`, `DROP TABLE`, or force-pushes. Hooks bridge the gap between "tell the agent" (instruction-following, fallible) and "block the agent" (deterministic, reliable). They complement the [backup isolation](#-backup-isolation) rule — one prevents the destructive command from executing, the other contains the damage if a different command slips through.

Source: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks-guide).

---

## 📤 What to Send to AI Providers

> [!WARNING]
> Treat everything you paste into a cloud AI prompt as potentially logged. Strip real customer data, credentials, and internal hostnames before sending.

Every prompt you send to a cloud AI provider — code snippets, error messages, variable names — leaves your environment. Before using a cloud-based coding assistant, classify what you're sending.

**A simple four-tier model:**

| Tier | Examples | Default |
|------|----------|---------|
| Public | Open-source code, public docs | Safe to send |
| Internal | Business logic, system design | Send with care |
| Restricted | Customer PII, financial records | Do not send |
| Secret | Credentials, private keys | Never send |

> [!TIP]
> When in doubt, default to Tier 1 (read-only) MCP servers and Restricted data handling. Escalate permissions only when the task genuinely requires it.

**What the major providers do with your data (early 2026):**

- **Anthropic (Claude)** — API requests are not used to train models by default. Enterprise customers get contractual data processing guarantees.
- **GitHub Copilot** — Opt out of telemetry in settings; enterprise plans offer zero-data retention.
- **Cursor** — Privacy Mode disables code transmission to third-party models; data is not used for training by default.

Check your provider's current policy directly — these terms change.

**When to use a local model instead.** If your codebase contains customer PII, health records, financial data, or anything covered by HIPAA, SOC 2, or GDPR, run a local model. [Ollama](https://ollama.com) runs models like Llama, Mistral, and Qwen on your own hardware — no data leaves your machine. Capability is lower than frontier cloud models, but the privacy guarantee is absolute.

**Before sending any snippet to a cloud provider:**

- Strip real customer data — use placeholders (`user@example.com`, `tok_test_xxx`)
- Remove credentials — even if you think they're already rotated
- Replace internal hostnames with generics (`internal-service.corp` → `api.example.com`)
