# AI Dev Handbook

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

> An opinionated, plain-English handbook for shipping production code with AI agents — workflow, prompting, security, and verification in one place.
> *Written with AI assistance*

**For** solo devs, AI tinkerers, and eng leads figuring out how to work seriously with AI tools — not just vibe code.

Work in progress — contributions welcome.

**→ New here? Start with [Workflow](workflow/) — the full cycle from Day 0 to production.**

---

## 🧭 Core Principles

- **Treat AI-generated code as untrusted** until it passes automated tests, security scans, and human review
- **Structure every task** — atomic units of work with explicit acceptance checks yield far better results than vague requests
- **Verify everything** — AI tools are fast and confident, but they hallucinate APIs, phantom packages, and outdated patterns

---

## 📚 Guides

| Guide | What it covers |
|---|---|
| [Tools](tools/) | Which AI coding tool to use for which task — vibe coding, manual assist, agentic workflows, [agent skills](tools/skills/), [plugins](tools/plugins/) |
| [Workflow](workflow/) | The Plan → Execute → Verify loop and the full Day 0 → production cycle |
| [Codebase Setup](codebase-setup/) | Folder structure and how to write effective rules files for your AI agent |
| [Prompting](prompting/) | How to write effective prompts for debugging and code tasks |
| [CI & Quality](ci-and-quality/) | Automated checks every PR must pass before merging |
| [Security](security/) | Least-privilege model for AI agents and MCP tools |
| [Verification](verification/) | Defending against hallucinations, phantom packages, and outdated patterns |

---

## 🛠️ Templates

Ready-to-use files — copy them directly into your project:

| Template | What it is |
|---|---|
| [`templates/AGENTS.md`](templates/AGENTS.md) | Rules file for your AI agent (works with Cursor, Claude Code, Copilot, and others) |
| [`templates/review-checklist.md`](templates/review-checklist.md) | Human review checklist for AI-generated pull requests |

---

## 💡 The Short Version

AI coding tools have grown up. The industry now has a name for the mature approach: **agentic engineering**.

- **Vibe coding** (describing what you want and getting code back) is great for prototypes and UI work
- **Agentic engineering** is the production-ready version — it adds structure, checkpoints, and verification
- **The golden rule:** treat all AI-generated code as untrusted until it passes automated tests, security scans, and human review

---

## 🤝 Contributing

This handbook improves through real-world experience — yours included. If you've found something that works (or doesn't), please share it.

**Quick ways to help:**
- Fix a typo or broken link → open a PR directly
- Spot outdated advice → open an issue
- Have a workflow pattern worth sharing → open an issue or draft a PR

[See CONTRIBUTING.md for full guidelines →](CONTRIBUTING.md)

---

*[CHANGELOG](CHANGELOG.md) · [Contributing](CONTRIBUTING.md) · [License](LICENSE) · Written with AI assistance · Written with AI assistance by [Eve](https://eveko.dev)*
