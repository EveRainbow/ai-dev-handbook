# Verification

> Defending against hallucinations, phantom packages, and outdated patterns

[← Back to handbook](../README.md)

---

## 🧠 The Core Mindset

> [!IMPORTANT]
> Treat all AI-generated code as untrusted: verify every new package against the official registry, run the test suite, and read every diff before approving.

Think of AI coding assistants as a very fast, very confident junior developer. They ship code quickly and rarely hesitate — but they sometimes invent APIs that don't exist, recommend packages that were never published, or reach for patterns that were deprecated years ago. Common problems to watch for:

- **Hallucinated APIs** — calling functions or methods that don't exist
- **Phantom packages** — recommending library versions that were never published (a significant portion of AI dependency recommendations point to non-existent versions). This is a supply-chain risk: an attacker can publish a malicious package under the exact name and version the AI invented.
- **Outdated patterns** — suggesting deprecated or insecure approaches that were common in older training data
- **Over-engineering** — adding unnecessary abstractions "just in case"

### What these look like in practice

<details>
<summary><strong>Hallucinated API</strong></summary>

The AI suggests a method that doesn't exist in the library:

```ts
// AI wrote this — .toUppercaseString() does not exist
const label = status.toUppercaseString();

// Correct:
const label = status.toUpperCase();
```

This can pass TypeScript if the type is `any` or `unknown`, and fails silently at runtime.

</details>

<details>
<summary><strong>Phantom package</strong></summary>

The AI recommends a version that was never published:

```json
"dependencies": {
  "some-auth-lib": "^5.0.0-beta.3"
}
```

Only `4.x` was ever released. `npm install` either fails or — in a supply-chain attack — installs a malicious package someone published at that exact name and version.

</details>

<details>
<summary><strong>Outdated pattern</strong></summary>

The AI suggests an approach that was standard in older documentation but is now deprecated or insecure:

```ts
// AI wrote this — Buffer() constructor deprecated since Node 6, removed in Node 22
const buf = new Buffer(userInput);

// Correct:
const buf = Buffer.from(userInput);
```

This happens because training data includes years of old tutorials and Stack Overflow answers.

</details>

[More examples with context →](../examples/verification/hallucination-examples.md)

---

## 🛡️ How to Defend Against Hallucinations

**1. Give the agent live context**
Use MCP servers that connect to real package registries and documentation sources so the agent can look things up rather than guess. An agent that can query npm or PyPI directly is much less likely to invent a package version. Find available servers in the [official MCP server registry](https://github.com/modelcontextprotocol/servers).

**2. Let CI catch it**
A failed build is the fastest way to find a hallucinated API. Don't skip the test suite.

**3. Check dependencies manually**
Reviewers should personally verify every new package against the official registry before approving. Don't assume the agent got it right.

**4. Write tests**
A failing integration test often means the agent misunderstood how a library actually behaves. Tests are the ground truth.

> [!TIP]
> The single most reliable habit: before accepting any new package or API, ask the AI to explain *why* it exists and where to find its official docs. If it can't point you to a real source, treat it as unverified.

---

## ✅ The Human Review Checklist

For a complete PR review checklist covering intent, quality, security, and operations, see [`templates/review-checklist.md`](../templates/review-checklist.md).
