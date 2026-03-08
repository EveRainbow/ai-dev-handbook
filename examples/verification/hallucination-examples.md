# Examples: AI Hallucination Patterns

Three common hallucination patterns from [verification/README.md](../../verification/README.md), with concrete before/after examples.

---

## 1. Hallucinated API

The AI calls a method that doesn't exist on the type.

**What the AI wrote:**
```ts
// The AI used .toUppercaseString() — this method does not exist
const displayStatus = order.status.toUppercaseString();
```

**The error at runtime:**
```
TypeError: order.status.toUppercaseString is not a function
```

**Why it happened:** The AI pattern-matched from similar method names it saw during training (`toString()`, `toUpperCase()`, `toLocaleString()`). It generated a plausible-sounding combination that doesn't exist.

**The fix:**
```ts
const displayStatus = order.status.toUpperCase();
```

**How to catch it:** TypeScript will flag this if the type is known (`string`). If the type is `any` or `unknown`, it compiles but fails at runtime — which is why strict TypeScript typing matters.

---

## 2. Phantom Package

The AI recommends a package version that was never published.

**What the AI wrote:**
```json
"dependencies": {
  "express-rate-limit": "^7.5.0"
}
```

**The reality:** Version `7.5.0` was never released. The latest at time of writing is `7.4.1`. Running `npm install` will either fail or — in a supply-chain attack — install a malicious package someone published at that exact name and version to intercept AI-generated dependency recommendations.

**How to catch it:**
1. Check the actual published versions: `npm view express-rate-limit versions`
2. Or look at the package page: [npmjs.com/package/express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
3. Use an SCA tool in CI that validates installed versions against known registries

**The fix:** Use the latest *actually published* version:
```json
"express-rate-limit": "^7.4.1"
```

---

## 3. Outdated Pattern

The AI suggests an approach that was standard in older documentation but is now deprecated or removed.

**What the AI wrote:**
```ts
// Creates a Buffer from user input — deprecated since Node 6, removed in Node 22
const buf = new Buffer(userInput);
```

**Why it happened:** The `Buffer()` constructor was the standard approach for years and appears in thousands of tutorials and Stack Overflow answers in the AI's training data. The AI doesn't know it was deprecated.

**The risk:** In addition to being broken in modern Node versions, the old constructor had security vulnerabilities (uninitialized memory exposure).

**The fix:**
```ts
// Use Buffer.from() for strings, Buffer.alloc() for fixed-size allocation
const buf = Buffer.from(userInput, 'utf8');
```

**Other common outdated patterns to watch for:**
| Old (AI may suggest) | Correct modern version |
|---|---|
| `new Buffer(n)` | `Buffer.alloc(n)` |
| `req.param('id')` (Express 3) | `req.params.id` (Express 4+) |
| `componentWillMount()` (React) | `useEffect(() => {}, [])` |
| `var` declarations | `const` / `let` |
| Callback-style `fs.readFile(path, cb)` | `await fs.promises.readFile(path)` |
