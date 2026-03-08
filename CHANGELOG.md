# Changelog

Notable updates to the AI Dev Handbook, newest first.

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
