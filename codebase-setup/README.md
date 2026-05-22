# Codebase Setup

> How to structure your project and write rules files so AI agents can navigate and work effectively

[← Back to handbook](../README.md)

---

## 📁 Folder Structure That Helps Agents Navigate

AI agents get confused by messy, inconsistent codebases. A clean structure that works well:

```
src/app/           → routes (e.g., Next.js pages)
src/components/    → UI components, organized by domain
src/use-cases/     → one file per user action (e.g., RegisterUser.ts)
src/services/      → auth, validation, cross-cutting concerns
src/lib/           → adapters to external APIs and services
docs/              → architecture docs, runbooks
scripts/           → dev.sh, test.sh, and other canonical commands
api/               → openapi.yaml (your API contract)
```

### What these terms mean

| Folder | Purpose |
|--------|---------|
| `src/use-cases/` | One file per user action; business logic isolated from framework and infrastructure |
| `src/services/` | Auth, logging, validation — cross-cutting concerns shared by multiple use cases |
| `src/lib/` | Adapters to external APIs and services (payment gateways, ORMs, email providers) |
| `docs/` | Architecture docs and runbooks for repeatable operational procedures |
| `scripts/` | Canonical dev/test/deploy commands (`dev.sh`, `test.sh`) |
| `api/openapi.yaml` | Machine-readable API contract; agents use it as source of truth for routes and schemas |

<details>
<summary><strong>Use cases</strong> (<code>src/use-cases/</code>)</summary>

One file per user-facing action (e.g., `RegisterUser.ts`, `PlaceOrder.ts`). From Clean Architecture: keeping each user intent isolated means an agent can find and modify one workflow without accidentally touching unrelated logic in a shared service.

```ts
export async function registerUser(email: string, password: string) {
  await authService.validatePassword(password); // service
  const user = await userRepo.create({ email }); // adapter
  await emailService.sendWelcome(user.email);    // adapter
  return user;
}
```
[Full annotated example →](../examples/use-cases/RegisterUser.ts)

</details>

<details>
<summary><strong>Cross-cutting concerns</strong> (<code>src/services/</code>)</summary>

Things like authentication, logging, and error handling that cut across multiple layers of the app. Centralizing them gives agents one place to look and one place to change, rather than hunting across files.

```ts
// src/services/auth.ts — imported by any use case that needs auth
export const authService = {
  requireAuth(req: Request) { /* validates JWT, throws if missing */ },
  validatePassword(password: string) { /* enforces strength rules  */ },
};
```
[Full annotated example →](../examples/services/auth.ts)

</details>

<details>
<summary><strong>Adapters</strong> (<code>src/lib/</code>)</summary>

Wrappers around third-party APIs and libraries (payment gateways, email providers, ORMs). Isolating vendor SDKs here means you can swap an external service without touching use-case code — and agents won't accidentally call a vendor SDK directly from business logic.

```ts
// src/lib/stripe.ts — use cases call this, never import 'stripe' directly
export const stripeAdapter = {
  chargeCard: (amountCents, token) => client.charges.create({ ... }),
  refundCharge: (chargeId) => client.refunds.create({ ... }),
};
```
[Full annotated example →](../examples/adapters/stripe.ts)

</details>

<details>
<summary><strong>Runbooks</strong> (<code>docs/</code>)</summary>

Step-by-step procedures for recurring operational tasks: how to deploy, how to roll back a release, how to rotate a secret. Agents can follow the same runbook a human would, rather than improvising.

```markdown
1. Confirm CI is green on `main`
2. `git tag v1.x.x && git push --tags`
3. `./scripts/deploy.sh production`
4. Check `/health` returns `200`
5. Rollback: `./scripts/rollback.sh v1.x.x`
```
[Full annotated example →](../examples/runbooks/deploy.md)

</details>

<details>
<summary><strong><code>openapi.yaml</code></strong></summary>

A machine-readable description of your REST API: every endpoint, parameter, and response schema in one file. Agents use it as the source of truth for your API contract, which reduces hallucinated routes and wrong parameter names.

```yaml
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        '201': { description: User created }
        '409': { description: Email already registered }
```
[Full annotated example →](../examples/openapi/users.yaml)

</details>

Also include at the root: `AGENTS.md`, `README.md`, and configuration files for your linter, formatter, and CI pipeline.

> [!TIP]
> The most important folder is `docs/` — AI assistants read it to understand your architecture. A well-maintained `docs/` folder pays off on every subsequent agent session.

---

## 🤖 Writing Rules Files for Your AI Agent

Think of `AGENTS.md` (or `CLAUDE.md` for Claude Code) as an onboarding document for an AI teammate. Keep it under 300 lines — every line costs context window tokens the agent could spend on your actual code — and include:

- **What this project is** — tech stack, architecture overview
- **How to set it up** — exact commands, copy-pasteable
- **How to run tests** — single-file and full suite
- **What the agent can do without asking** — e.g., read files, run linters
- **What requires human approval** — e.g., installing new dependencies, modifying CI
- **What is never allowed** — e.g., committing secrets, touching production configs

A ready-to-use template is at [`templates/AGENTS.md`](../templates/AGENTS.md).

### Rules file conventions (early 2026)

The current best practice is to have both:
- `AGENTS.md` at the repo root — universal, tool-agnostic baseline (works with Copilot, Cursor, etc.)
- `CLAUDE.md` for Claude Code specifics. Supports `@import` to keep it modular — each imported file is injected into the agent's context at startup:
  ```
  @import docs/architecture.md
  @import docs/runbooks.md
  ```
  Split long rules into focused sub-files (architecture, testing, security) and import only what's needed.
- `.cursor/rules/*.mdc` for Cursor-specific rules. MDC (Markdown with metadata) files can be scoped to specific file patterns — e.g., apply testing rules only when editing `*.test.ts` files — so agents get relevant context without noise from unrelated guidelines.

The old monolithic `.cursorrules` file still works but is no longer recommended.

### The deletion test

For every line in your rules file, ask: *Would removing this make the agent more likely to make a mistake?* If not, cut the line. Bloated rules files cause models to silently ignore instructions later in the file, so what's left needs to earn its place.

A working keep/cut heuristic:

| ✅ Keep | ❌ Cut |
|---|---|
| Bash commands the agent can't guess from `package.json` (`pnpm test:unit -- --shard 1/4`) | Things the agent can derive by reading the code itself |
| Code-style choices that deviate from language defaults | Standard conventions ("use camelCase", "indent with 2 spaces") |
| Environment quirks (`DATABASE_URL must point at the read replica for migrations to succeed`) | File-by-file descriptions of the repo layout |
| Repo etiquette — branch naming, PR title format, who owns what | Tutorials, generic advice ("write clean code"), motivational prose |
| Non-obvious gotchas (`auth-service retries 3x silently — don't add another wrapper`) | Anything the agent already gets right today without being told |

**Signal the file is too long:** the agent repeatedly violates a rule that's clearly stated there. Prune the rest, then re-test by watching whether behavior actually shifts — if it doesn't, the rule wasn't what was steering it.

Source: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

### Path-scoped rules

When guidance only applies to part of the codebase, lift it out of `CLAUDE.md` into `.claude/rules/*.md`. Each rule file's YAML frontmatter declares a `paths:` glob, and the agent only loads the rule when it's reading a matching file — so testing rules don't bloat sessions that aren't writing tests, API rules don't bloat sessions that aren't writing endpoints.

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API rules
- Every endpoint validates its input before touching the database.
- Return errors in the standard `{ code, message }` shape — see `src/lib/errors.ts`.
- New routes require an integration test under `tests/api/`.
```

Place at `.claude/rules/api.md`. The rule loads when the agent works in `src/api/`; sessions in `src/components/` never see it. Use the same pattern for security rules, test-writing rules, or anything else with a natural file-scope. This is the documented cure for "CLAUDE.md is too long."

Source: [How Claude remembers your project](https://code.claude.com/docs/en/memory).

---

## ⏰ Scheduling Maintenance Tasks

Agents can take on recurring responsibilities. Set up scheduled jobs to have an agent check for dependency updates, run linters, or do routine code cleanup — like a weekly chore list. This keeps technical debt from accumulating without requiring manual intervention.

Common tasks to schedule:

- **Dependency updates** — run `npm outdated` or `pip list --outdated`, open a draft PR with safe bumps
- **Lint and format sweeps** — catch style drift before it accumulates across many files
- **Dead code detection** — flag unused exports, unreachable routes, or stale feature flags
- **Secret scanning** — check for accidentally committed credentials or API keys

Use GitHub Actions `schedule:` triggers (cron syntax) or your CI provider's equivalent:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
```

Give each scheduled job a narrow scope and a clear, reviewable output (a PR, a failed check, a comment) — not a silent background change.

---

## 🔄 Starting on an Existing Codebase

The folder structure and rules file guidance above assumes a greenfield project. Most real work happens on existing codebases — incomplete types, missing tests, inconsistent patterns. Here's how to introduce AI agents without making things worse.

> [!NOTE]
> Ask the AI to generate a `CODEBASE.md` summary on Day 0 — it describes the tech stack, folder layout, and known inconsistencies. Every subsequent session benefits from that context without you having to re-explain it.

**1. Generate your AGENTS.md from the codebase, not from scratch.**

Ask the agent to read the repo and produce a first draft:

> "Read this repo and write an AGENTS.md describing: what the project does, the tech stack, how to run it and its tests, the main folder structure, and any inconsistencies you notice."

Then review and correct it. Agents are good at surface-level description; you'll need to add hard constraints (what's off-limits, what's known to be broken) by hand.

**2. Document inconsistencies explicitly.**

Legacy codebases have multiple competing patterns. Name them in AGENTS.md, or the agent will "fix" them in ways that break things:

```markdown
# Known inconsistencies
- Auth uses both sessions (old pages) and JWT (new API routes).
  New code must use JWT only. Do not modify existing session-based pages.
- Some services import from `../db` directly. New code should use `src/lib/db.ts`.
```

**3. Add tests before refactoring, not after.**

If a module has no tests, write minimal ones that capture current behavior before asking the agent to refactor it. Without them, you have no way to detect when the refactor breaks something.

**4. Add types incrementally.**

Don't enable `strict: true` in `tsconfig.json` across the whole codebase at once — you'll get hundreds of errors and the agent will try to fix them all in one shot, producing a diff that's impossible to review. Instead, type-check one file at a time:

```bash
tsc --strict src/use-cases/RegisterUser.ts --noEmit
```

Fix errors in that file, commit, then move to the next. Each file is a standalone, reviewable PR.

**5. Scope agent tasks to single files or single concerns.**

Don't say "clean up the auth module." Say "extract JWT validation from `src/routes/auth.ts` into a new `src/services/jwt.ts`, keeping all existing function signatures intact." Narrow scope = smaller diff = easier review = fewer surprises.
