# CI & Quality

> Automated checks every pull request must pass before merging

[← Back to handbook](../README.md)

---

Every pull request should be blocked from merging unless it passes all of the following.

> [!NOTE]
> **Every PR checklist:** lint + type-check → unit/integration tests (≥80% coverage) → SAST + SCA + secret scan → preview deploy + E2E tests.

## 🧪 Code Quality

- **Linting and formatting** — ESLint + Prettier (JS/TS), Ruff (Python), golangci-lint (Go), Clippy (Rust), Checkstyle (Java)
- **Type checking** — TypeScript's `tsc` or Python's `mypy`
- **Unit and integration tests** — minimum 80% line coverage. Exclude generated files, config files, and migration scripts from coverage measurement. For legacy codebases that can't hit 80% yet, track the trend: coverage must not decrease PR over PR.

## 🔒 Security

- **SAST** (Static Application Security Testing) — tools like Semgrep or Snyk catch things like SQL injection and insecure defaults (e.g., using `Math.random()` for cryptographic values instead of `crypto.randomUUID()`, or passing user input to `eval()`)
- **SCA** (Software Composition Analysis) — checks your dependencies for known vulnerabilities and malicious packages. Output typically shows: package name, installed version, CVE ID, severity (Critical / High / Medium / Low), and the fixed version to upgrade to.
- **Secret scanning** — ensures no API keys or credentials slipped into the code
- **License compliance** — new dependencies must match your org's open-source policy

## 🚀 Deployment

- **Preview deploy** — a throwaway deployment of the PR created automatically by tools like Vercel, Netlify, or Railway. Every PR gets its own URL; the environment is torn down after merge.
- **End-to-end tests** against that preview — E2E tests drive the actual UI through real user flows (login → action → result), unlike unit or integration tests which test individual functions or service boundaries. Tools: Playwright, Cypress.

---

## 🤖 Why This Matters for AI-Generated Code

AI agents are fast and confident, but they can introduce subtle bugs, hallucinated APIs, and outdated patterns. Automated checks are your primary safety net — they catch most problems before a human reviewer even opens the PR. A failing build is often the fastest way to discover that an agent misunderstood a library or invented a function that doesn't exist.

See [verification](../verification/README.md) for strategies to catch the issues that CI alone won't surface.

---

## ⚠️ AI-Generated Test Pitfalls

High test coverage from AI-written tests can be misleading. Agents often produce tests that confirm their own implementation rather than verify correct behavior.

> [!WARNING]
> **The circular test problem.** When an agent writes a function and its tests in the same session, the tests frequently mirror the implementation's logic instead of specifying the intended behavior:


```ts
// Agent writes this function:
function discount(price: number, pct: number) {
  return price - (price * pct) / 100;
}

// Agent writes this test — it passes, but proves nothing:
test('discount', () => {
  expect(discount(100, 10)).toBe(100 - (100 * 10) / 100); // circular
});

// A real test checks behavior with a hardcoded expected value:
test('10% discount on $100 returns $90', () => {
  expect(discount(100, 10)).toBe(90);
});
```

When reviewing AI-generated tests, check that assertions use hardcoded expected values — not expressions derived from the same formula as the implementation.

**Ask for tests before code.** Giving the agent the test specification first — and asking it to write code that makes those tests pass — breaks the circular loop. This is test-driven development applied to agent sessions, and it produces better-specified behavior.

**Property-based testing as a defense.** Instead of example-based tests, property-based tests generate random inputs and verify invariants. Agents cannot write circular property tests because the invariant must be stated independently of any specific implementation:

```ts
import fc from 'fast-check'; // also: hypothesis (Python), quickcheck (Haskell/Rust)

test('discount never exceeds the original price', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0 }), fc.float({ min: 0, max: 100 }),
      (price, pct) => discount(price, pct) <= price
    )
  );
});
```

**Validate your tests with mutation testing.** Mutation testing tools (Stryker for JS/TS, mutmut for Python) automatically introduce small bugs into your code and check whether your tests catch them.

> [!TIP]
> Run mutation testing weekly in CI — not on every PR. It's slow (several minutes even for small suites), but running it regularly catches test-coverage drift before it becomes a problem. A mutation that survives means your tests aren't covering that path — and high line coverage is irrelevant if mutations survive:

```bash
npx stryker run   # reports which mutations your tests missed
```

A test suite that catches 80%+ of mutations is a far stronger signal than one that merely hits 80% line coverage.

---

### 📖 Terms used on this page

<details>
<summary><strong>SAST</strong> — Static Application Security Testing</summary>

Analyzes source code without running it, looking for known vulnerability patterns: SQL injection, insecure randomness, use of `eval()`, hardcoded credentials. Tools: Semgrep, Snyk Code, CodeQL. Runs in CI; zero runtime required.

</details>

<details>
<summary><strong>SCA</strong> — Software Composition Analysis</summary>

Scans your dependency tree for packages with known CVEs (Common Vulnerabilities and Exposures). Output shows: package name, installed version, CVE ID, severity, and the fixed version to upgrade to. Tools: Snyk, Dependabot, OWASP Dependency-Check.

</details>

<details>
<summary><strong>Mutation testing</strong></summary>

A technique that automatically introduces small bugs ("mutations") into your code — flipping `>` to `>=`, replacing `&&` with `||` — then re-runs your test suite. If a mutated version still passes all tests, those tests aren't actually verifying that logic. Tools: Stryker (JS/TS), mutmut (Python).

</details>

<details>
<summary><strong>Property-based testing</strong></summary>

Instead of asserting `f(3) === 9`, you assert an invariant that must hold for *any* valid input: `f(x) >= 0` for all non-negative `x`. The testing library generates hundreds of random inputs to try to break your invariant. This is immune to the circular test problem — the property is stated independently of the implementation. Tools: fast-check (JS/TS), Hypothesis (Python), QuickCheck (Haskell/Rust).

</details>
