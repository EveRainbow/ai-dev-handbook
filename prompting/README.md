# Prompting

> How to write effective prompts for code tasks and debugging

[← Back to handbook](../README.md)

---

> [!NOTE]
> **TL;DR** — Give the agent context + task + rules + a done condition. Use diffs, not rewrites. Define scope explicitly, or the agent will invent it.

## 🎯 The Golden Rule

> [!IMPORTANT]
> **Say what you want, what you don't want, and what done looks like.**
> Vague prompts produce vague code. The time you spend writing a clear prompt saves 10x in review and correction.

---

## 💬 Anatomy of a Good Coding Prompt

```
[CONTEXT]   What is this codebase / module / function doing?
[TASK]      What do you want the agent to do?
[OUTPUT]    What does the result look like?
[RULES]     What must it NOT do? Any constraints?
```

### Bad prompt
```
# ❌ Vague — no context, no scope, no done condition
Add authentication to the app.
```

### Good prompt
```
# ✅ Clear — context, task, rules, and a verifiable done condition
Context: Next.js 14 app with PostgreSQL via Prisma.
Users table has email + hashed password fields.

Task: Add email/password auth using next-auth v5.
- Create NextAuth config at /src/lib/auth.ts
- Add the [...nextauth] route handler
- Add session provider to root layout
- Protect /dashboard and all routes under it with middleware

Rules:
- Credentials provider only — no OAuth
- Do not modify the database schema (users table exists)
- Use bcrypt (already installed) for password comparison

Done when: User can log in at /login and is redirected to /dashboard.
Unauthenticated access to /dashboard redirects to /login.
```

---

## 📋 Agentic prompting is not chat prompting

Chatting with an AI is about clarity of intent. Agentic prompting is about defining an **execution contract** — the scope, edit format, verification criteria, and termination condition the agent must follow across multiple steps.

Without this contract, agents drift: they edit files they shouldn't, loop indefinitely, or silently invent APIs that don't exist.

An execution contract answers four questions before you hand off:

| Contract element | What to specify |
| --- | --- |
| **Scope** | Which files the agent can touch; which it must not |
| **Edit format** | Diffs or targeted edits — not full-file rewrites |
| **Done condition** | What passing looks like (a test, a lint check, a specific output) |
| **Escalation** | Stop and ask when stuck — don't guess and continue |

These patterns apply most in the **Plan** phase of the [PEV loop](../workflow/README.md#plan--execute--verify-pev) — structure your request before handing off to the agent.

---

## 📝 Rules files as persistent prompts

`CLAUDE.md`, `AGENTS.md`, and `.cursor/rules` are your standing prompt — re-read by the agent at the start of every session. They replace context you'd otherwise repeat in every inline prompt.

**What belongs in a rules file:**
- Build and test commands (`npm run build`, `go test ./...`)
- Pointers to style — reference a file by path, don't copy its content
- Hard constraints (`Never commit secrets`, `Do not modify vendor/`)
- Tool contracts: which CLI tools the agent may invoke

**What belongs in the inline prompt:**
- Task-specific acceptance criteria
- Temporary scope restrictions for this task only

**Size limit:** Keep rules files under ~200 lines. Beyond that, models start silently ignoring instructions. Reference files rather than embedding their contents — copied snippets go stale and bloat context.

**Negative constraints don't reliably stick.** `Do not touch src/middleware.ts` has very low adherence in practice. Use allowlists and sandboxing for anything that genuinely must not be touched. See [security](../security/README.md) for enforcement patterns.

See [codebase-setup](../codebase-setup/README.md) for how to structure and scope rules files across a repo.

---

## 🖊️ How to frame a task

**State scope explicitly.** Name the files the agent should edit. Name the files it should not.

**Define done as something verifiable.** "Done when `npm test` passes" beats "done when the feature works." Agents without a test oracle loop indefinitely or give up prematurely.

**Ask for diffs, not rewrites.** Requesting a unified diff instead of a full-file rewrite more than tripled success rates in refactoring benchmarks (20% → 61% on the Aider benchmark). Diffs are cheaper to generate and faster to review.

```
Only modify src/auth.ts and src/auth.test.ts.
Do not touch src/middleware.ts.
Return changes as a unified diff.
Done when: `npm test -- --testPathPattern=auth` passes with no failures.
If stuck after 3 attempts, stop and describe the blocker.
```

**Don't prompt for chain-of-thought unless the task is genuinely novel.** Modern reasoning models (Claude 4.x, o-series) perform chain-of-thought internally. Asking them to "think step by step" adds tokens without improving output.

---

## 🔁 Prompt Patterns

### The Refactor Pattern
```
Refactor [file/function] to [goal].
Keep the public API identical — no behavior changes.
All existing tests must still pass.
```

### The Test-First Pattern
```
Write failing tests for [feature] based on this spec: [spec].
Do not write implementation yet.
```

Then in a follow-up:
```
Now make the tests pass. Do not modify the tests.
```

### The Explain-Then-Build Pattern
```
Before writing any code, explain your approach to [task] in 3-5 bullet points.
Wait for my approval before proceeding.
```

Use this for risky or architectural tasks.

### The Rubber Duck Pattern
```
I'm trying to [goal]. Here's what I've tried: [description].
Here's the error I'm seeing: [error].
What is likely wrong and how would you fix it?
```

---

## 💡 Giving Examples

Examples outperform long descriptions every time.

```
Convert these API responses to follow our standard format.

Current format (bad):
{ "data": { "userId": 123, "userName": "alice" } }

Target format (good):
{ "id": 123, "name": "alice", "type": "user" }

Apply this to all files in /src/api/handlers/.
```

---

## 🔧 Iterating on Output

Don't rewrite your whole prompt when output is wrong. Correct precisely:

```
Almost — but the middleware should redirect to /login?next=[original_url]
so users land back on the page they tried to visit. Fix that part only.
```

Surgical corrections are faster than starting over.

---

## 🐛 The Debugging Prompt

When asking an AI to debug something, package your context in four parts:

1. **The error** — paste the error message and top 10–30 lines of the stack trace
2. **The relevant code** — just the function or file involved, not the whole codebase
3. **Your environment** — language version, framework version, key library versions
4. **Expected vs. actual behavior** — one sentence each

Then ask for: root cause, proposed fix as a diff, rationale, and suggested regression tests.

[Full filled-in example →](../examples/prompts/debug-prompt.md)

---

## 🚫 Anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| "Make this better" | No definition of better |
| "Fix the bug" | Agent doesn't know which bug |
| "Rewrite this whole module" | Scope is too large to verify |
| Full-file rewrites | High merge-conflict risk; hard to review — ask for diffs instead |
| No done condition | Agents without a success criterion loop, stall, or produce silent wrong output |
| Hallucinated packages | Agent invents APIs/packages when docs are missing — see [verification](../verification/README.md) |
| Over-long rules files | Beyond ~200–500 lines, instructions are silently dropped |

---

## 🗑️ What's obsolete (as of 2025–2026)

| Used to be standard | Why it's outdated | Replace with |
| --- | --- | --- |
| Long few-shot chain-of-thought prompts | Reasoning models do CoT internally | Zero-shot task framing with explicit scope |
| "Think step by step" | Unnecessary overhead on modern models | State the task; let the model reason |
| JSON mode for structured output | Superseded | Structured Outputs with JSON Schema |
| Long persona prompts ("you are a senior engineer…") | Minimal effect on 2025+ models | Concrete rules in `AGENTS.md` |
| Copying code snippets into rules files | Goes stale, bloats context | Reference the file by path |

---

### 📖 Terms used on this page

<details>
<summary><strong>Execution contract</strong></summary>

The upfront agreement between you and the agent: which files it can modify, what edit format to use, what "done" looks like, and what to do when stuck. Without it, agents make unbounded assumptions about scope and termination.

</details>

<details>
<summary><strong>Unified diff</strong></summary>

A compact, patch-file format showing exactly what changed line-by-line. Lines prefixed with `+` were added, `-` removed. Requesting diffs instead of full rewrites reduces token cost, makes review easier, and measurably improves patch apply rates.

```diff
- const id = Math.random();
+ const id = crypto.randomUUID();
```

</details>

<details>
<summary><strong>Context rot</strong></summary>

The quality degradation that occurs as context windows fill up. Beyond ~512K tokens, model recall drops measurably — one benchmark showed 93% → 78% recall at 1M tokens. The fix is passing only relevant chunks, not the full codebase.

</details>

<details>
<summary><strong>Slopsquatting</strong></summary>

A supply-chain attack where a malicious package is published under a name that matches a common AI hallucination. The agent invents a package name; a matching malicious package exists; the install succeeds. Mitigate by validating package metadata before install. See [verification](../verification/README.md).

</details>

<details>
<summary><strong>Stack trace</strong></summary>

The chain of function calls active when an error occurred, printed top-to-bottom. Pasting the top 10–30 lines gives the AI the context it needs to locate the failure without the noise of the full trace.

</details>

<details>
<summary><strong>Regression test</strong></summary>

A test that verifies a previously-working behavior still works after a change. "Add regression tests" means: write a test that would have caught this bug, so it can't silently return in a future PR.

</details>

<details>
<summary><strong>Hallucination</strong></summary>

When an AI confidently generates plausible-but-wrong content — a method that doesn't exist, a package version that was never published, an API that was removed years ago. See [verification](../verification/README.md) for how to defend against it.

</details>
