# Example: Four-Block Debugging Prompt

Use this when you have a failing error and want a root cause, a diff fix, and a regression test in one shot. The four blocks give the AI everything it needs without over-explaining.

[← Back to Prompting guide](../../prompting/README.md)

---

## 🐛 The prompt

```markdown
**1. The error**

TypeError: Cannot read properties of undefined (reading 'email')
    at sendWelcomeEmail (src/use-cases/RegisterUser.ts:18:28)
    at async registerUser (src/use-cases/RegisterUser.ts:12:3)
    at async POST (src/app/register/route.ts:9:18)

**2. The relevant code**

// src/use-cases/RegisterUser.ts
export async function registerUser(email: string, password: string) {
  await authService.validatePassword(password);
  const user = await userRepo.create({ email });
  await emailService.sendWelcome(user.email); // line 18 — crashes here
  return user;
}

// src/lib/db.ts — userRepo.create implementation
async create(data: { email: string }) {
  const result = await db.query(
    'INSERT INTO users (email) VALUES ($1)',
    [data.email]
  );
  return result.rows[0]; // returns undefined if INSERT returns no rows
}

**3. The environment**

- Node 20.11.0
- TypeScript 5.3
- pg (node-postgres) 8.11

**4. Expected vs. actual**

Expected: userRepo.create() returns the newly inserted user row including its id and email.
Actual: it returns undefined — the INSERT statement runs but result.rows[0] is empty.

Please respond with:
- Root cause (one paragraph)
- Proposed fix (as a diff)
- Rationale (why this fix is correct)
- A regression test that would catch this bug
```

---

> [!NOTE]
> A well-structured response mirrors the four blocks — root cause, diff, rationale, regression test — each addressed in order. If the AI skips a block or merges them, ask it to separate them explicitly.

## ✅ What a good AI response looks like

**Root cause:** PostgreSQL `INSERT` statements do not return rows by default. `result.rows[0]` is `undefined` because the query has no `RETURNING` clause. When `userRepo.create()` returns `undefined`, the call to `user.email` on line 18 throws.

**Proposed fix:**

```diff
  async create(data: { email: string }) {
    const result = await db.query(
-     'INSERT INTO users (email) VALUES ($1)',
+     'INSERT INTO users (email) VALUES ($1) RETURNING id, email, created_at',
      [data.email]
    );
    return result.rows[0];
  }
```

**Rationale:** Adding `RETURNING id, email, created_at` tells PostgreSQL to return the inserted row immediately, so `result.rows[0]` is the full user object. This is the idiomatic pg pattern for getting the inserted record without a second SELECT query.

**Regression test:**

```ts
// src/lib/db.test.ts
it('userRepo.create returns the inserted user', async () => {
  const user = await userRepo.create({ email: 'test@example.com' });

  expect(user).toBeDefined();
  expect(user.email).toBe('test@example.com');
  expect(user.id).toBeDefined();
});
```
