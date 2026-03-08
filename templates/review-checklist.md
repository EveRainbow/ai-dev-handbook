# Human Review Checklist

Use this checklist before approving any AI-generated pull request.

> [!TIP]
> For a quick review, focus on **Security** and **Intent & Scope**. For a thorough review, work through all four sections in order.

---

## 🎯 Intent & Scope

- [ ] Is the AI's reasoning for this change documented? *(in the PR description or inline comments)*
- [ ] Is the PR small and focused on one thing? *(target: under 300 lines changed, one logical concern)*

## 🧪 Quality

- [ ] Does CI pass (tests, linting, type-checking)?
- [ ] Are new tests included for the changed logic?
- [ ] Are any new APIs verified against actual documentation (not hallucinated)?
- [ ] Does the code follow the project's established patterns?

## 🔒 Security

- [ ] Do security scans show no new critical vulnerabilities? *(critical = CVSS 7.0+; check the report your CI scan tool generates)*
- [ ] Are there any hardcoded secrets or tokens?
- [ ] Have new dependencies been checked against official registries? *(npm.org, PyPI, pkg.go.dev — verify name, version, and publisher)*
- [ ] Is sensitive data (PII) handled correctly? *(PII = email, name, IP address, device ID; must be encrypted at rest and in transit, never logged in plaintext)*

## ⚙️ Operations

- [ ] Is there a rollback plan? *(for schema changes: migration has a `down()` method; for deploys: previous release is tagged and re-deployable)*
- [ ] Is the new code observable (logging, metrics)? *(new endpoints log requests at INFO level; errors at ERROR with stack trace; new background jobs emit a completion metric)*
- [ ] Is documentation updated? *(README, JSDoc/docstrings, API docs, or migration notes — whichever applies to this change)*
