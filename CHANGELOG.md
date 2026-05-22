# Changelog

Notable updates to the AI Dev Handbook, newest first.

---

## May 2026

**New chapter: Plugins** ([`tools/plugins/`](tools/plugins/README.md))
Package skills, agents, hooks, MCP/LSP servers, and settings as a versioned, shareable unit. Covers manifest schema, the standalone-vs-plugin decision, local dev with `--plugin-dir` / `--plugin-url`, migration from `.claude/`, team marketplaces, and versioning.

**Backup isolation rule (PocketOS)** ([`security/`](security/README.md))
After the PocketOS incident — a Cursor + Claude Opus 4.6 session wiped a production database *and* its Railway backups in nine seconds — the handbook now states the underlying rule: any path an agent can reach is in scope for destruction; backups belong on a different trust boundary. Pair with an `AGENTS.md` rule that hard-stops destructive commands.

**Deterministic guardrails with hooks** ([`security/`](security/README.md), [`ci-and-quality/`](ci-and-quality/README.md))
Two new sections on Claude Code hooks: `PreToolUse` to refuse edits to protected files (`.env`, `.git/`, `package-lock.json`, `migrations/`) and `PostToolUse` to run a formatter on every agent edit. Bridges the gap between advisory `AGENTS.md` rules and deterministic enforcement.

**Permission modes ladder** ([`security/`](security/README.md))
Five-level table from manual approval → accept edits → plan only → classifier-gated → full bypass. Names the difference between `auto` (classifier-gated) and `bypassPermissions` (no checks) — they get conflated in practice and shouldn't.

**Agent evaluation pattern** ([`ci-and-quality/`](ci-and-quality/README.md))
When you run an agent on a loop in CI, you also need to track whether the agent itself is regressing. 20–50 real-failure tasks, code-based graders over LLM-as-judge, `pass@1` and `pass^3` as the headline metrics, transcripts read weekly.

**REVIEW.md to tune AI PR reviewers** ([`ci-and-quality/`](ci-and-quality/README.md))
A repo-root file that managed Code Review services and self-hosted reviewer bots read for review-specific instructions. Cap nits, define what blocks merge, skip CI-enforced paths.

**Multi-step prompt patterns** ([`prompting/`](prompting/README.md))
The taxonomy of multi-prompt structures: chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer. Pair with the existing execution-contract guidance — multi-step doesn't excuse loose handoffs.

**Rules-file deletion test + path-scoped rules** ([`codebase-setup/`](codebase-setup/README.md))
For every line in `CLAUDE.md`, ask whether removing it would make the agent more likely to fail. If not, cut it. For guidance that only applies to part of the codebase, lift it into `.claude/rules/*.md` with a `paths:` glob.

**Prompt caching for stable prefixes** ([`workflow/`](workflow/README.md))
~78% input-cost reduction on agent loops where the system prompt and rules files stay stable across turns. Concrete `cache_control` config, minimum prefix sizes, 5-min vs 1-hour TTL trade-off.

**Plan mode, subagents-for-investigation, `/goal`, `/rewind`, `@claude` PR mentions** ([`workflow/`](workflow/README.md))
Five additions to the workflow chapter: explicit plan mode (Shift+Tab → Ctrl+G → implement); read-heavy work delegated to `.claude/agents/*` subagents; `/goal <condition>` for autonomous loop-until-condition; `/rewind` as first-line recovery before reaching for git; `@claude` on PR threads for async agent review.

**Tools chapter — Claude Code description refreshed** ([`tools/`](tools/README.md))
Description now reflects current surface area: terminal CLI, VS Code, JetBrains, Desktop app, web. Mentions checkpoints and the Claude Agent SDK.

---

## March 2026

**Cursor Cloud Agents**
Cursor can now run agents in cloud virtual machines, not just on your local machine. The agent builds and runs the code it writes, then returns a pull request with video, screenshots, and logs as proof it works. Over 35% of these automated fixes are being merged. This is a significant upgrade to the "Verify" step of PEV.

**Claude Code: Agent Teams**
Experimental "Agent Teams" allow parallel agents working in separate Git worktrees simultaneously, so multiple tasks can run without stepping on each other.

**Rules files standardized**
The new best practice is to have both:
- `AGENTS.md` at the repo root — universal, tool-agnostic baseline (works with Copilot, Cursor, etc.)
- `CLAUDE.md` for Claude Code specifics, with `@import` support to keep it modular
- `.cursor/rules/*.mdc` for Cursor-specific file-scoped rules

The old monolithic `.cursorrules` file still works but is no longer recommended.
