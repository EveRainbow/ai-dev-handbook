# Runbook: Deploy to Production

**When to use:** After a PR is merged to `main` and all CI checks pass.
**Who runs this:** Any engineer with production deploy access.

---

## Steps

1. **Confirm CI is green**
   GitHub Actions → verify the latest `main` run passed all checks.

2. **Tag the release**
   ```
   git tag v1.x.x && git push --tags
   ```
   Follow semantic versioning: bump minor for features, patch for fixes.

3. **Run the deploy script**
   ```
   ./scripts/deploy.sh production
   ```
   Builds the app, runs database migrations, pushes to the production cluster.

4. **Verify the deployment**
   - `/health` returns `200`
   - `/version` matches your new tag
   - Manually spot-check one critical user flow

5. **If something is wrong — rollback**
   ```
   ./scripts/rollback.sh v1.x.x
   ```
   Replace `v1.x.x` with the last known-good version tag.

---

## Contacts

- On-call engineer: PagerDuty schedule
- Production access issues: #infra in Slack
