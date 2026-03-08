## 1. Project Overview
Brief summary of purpose, tech stack (e.g., Next.js 14, Postgres, Stripe), and architecture.

## 2. Install & Environment
Node 22 LTS; pnpm 9. Run: pnpm i
Env: copy .env.example to .env; never commit secrets.

## 3. Key Commands
Typecheck one file:  pnpm tsc --noEmit path/to/file.ts
Test one spec:       pnpm vitest run path/to/file.test.ts
Full test suite:     pnpm test (use only when explicitly asked)

## 4. Where Things Live
API handlers:  apps/api/src/api/[resource]/route.ts
Shared UI:     packages/ui (no default exports — named exports are easier for agents to discover via static analysis)

## 5. Code Style
Named exports, 2-space indent. See packages/ui/Button.tsx as reference. *(Replace with a real path from your project.)*
Commits: Conventional Commits — format: type(scope): description
  # e.g., feat(auth): add JWT refresh endpoint
  # e.g., fix(payments): handle Stripe webhook timeout
  # types: feat | fix | docs | refactor | test | chore

## 6. Git Rules
Use git mv for renames (not mv + git add) — this preserves file history in git log and avoids git treating the rename as a delete + create.
Keep PRs small and focused.

## 7. Testing
Any PR must add or update tests for touched logic.

## 8. What the Agent Can Do
✅ Without asking:  read files, run tsc/eslint/prettier, run single-file tests
⚠️ Ask first:       install packages, delete/move many files, run full build, modify CI
🚫 Never:           commit secrets, touch production config, rewrite git history

## 9. Escalation
Changes affecting owned paths → request review from CODEOWNERS.
  # CODEOWNERS is a file at .github/CODEOWNERS that auto-assigns reviewers by directory.
Risky ops (schema migration, secrets) → open a PR and tag @team/owners.

## 10. Done Checklist
[ ] Typecheck/lint each changed file
[ ] Unit tests pass
[ ] No secrets added
[ ] CI security scans pass
