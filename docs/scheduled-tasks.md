# Scheduled tasks

Periodic background work runs as plain HTTP endpoints in the Next.js server rather than as a
second runtime (Cloud Functions). A scheduler calls the URL; the task runs with the same Admin
SDK and the same code as everything else.

The task list lives in [`src/core/server/scheduledTasks.ts`](../src/core/server/scheduledTasks.ts).

| Task | Endpoint | What it does | Suggested schedule |
| --- | --- | --- | --- |
| `analytics` | `POST /api/cron/analytics` | Recomputes the `/admin/analytics` snapshot. | Hourly |
| `counters` | `POST /api/cron/counters` | Rebuilds rating aggregates and job applicant counts from source. | Nightly |
| `saved-search-alerts` | `POST /api/cron/saved-search-alerts` | Pushes a notification when a new listing matches a student's saved search. | Every 15–30 min |

## Authentication

A cron service can't present a Firebase session cookie, so these endpoints authenticate on a
shared secret in the `x-cron-secret` header, compared in constant time. **If `CRON_SECRET` is
unset every call is rejected** — an unset variable must never be the thing that leaves an endpoint
open.

Create the secret before the first deploy:

```bash
firebase apphosting:secrets:set cron-secret
```

`apphosting.yaml` already references it as a runtime-only secret.

## Wiring up Cloud Scheduler

One job per task. Replace `<SECRET>` with the value stored above and `<HOST>` with the deployed
hostname.

```bash
gcloud scheduler jobs create http eduraq-analytics \
  --project school-4bcd6 \
  --schedule "0 * * * *" \
  --time-zone "Asia/Baghdad" \
  --uri "https://<HOST>/api/cron/analytics" \
  --http-method POST \
  --headers "x-cron-secret=<SECRET>" \
  --attempt-deadline 300s
```

```bash
gcloud scheduler jobs create http eduraq-counters \
  --project school-4bcd6 \
  --schedule "30 2 * * *" \
  --time-zone "Asia/Baghdad" \
  --uri "https://<HOST>/api/cron/counters" \
  --http-method POST \
  --headers "x-cron-secret=<SECRET>" \
  --attempt-deadline 600s
```

```bash
gcloud scheduler jobs create http eduraq-saved-search-alerts \
  --project school-4bcd6 \
  --schedule "*/20 * * * *" \
  --time-zone "Asia/Baghdad" \
  --uri "https://<HOST>/api/cron/saved-search-alerts" \
  --http-method POST \
  --headers "x-cron-secret=<SECRET>" \
  --attempt-deadline 300s
```

## Writing a new task

Add an entry to `SCHEDULED_TASKS`. Two rules:

- **Idempotent.** A scheduler retries on timeout, so a task must be safe to run twice.
- **Safe alongside live traffic.** Nothing prevents two runs overlapping, and none of these take
  a lock.

Every run — success or failure — is recorded. Successes land in the audit log at `/admin/audit`
attributed to `system`; failures go to the error log at `/admin/errors`, because a scheduled
failure has nobody watching the HTTP response.

## Verifying by hand

```bash
curl -X POST -H "x-cron-secret: <SECRET>" https://<HOST>/api/cron/counters
```

An admin can also run the analytics and counter tasks from the UI — `/admin/analytics` has a
Recompute button and `/admin/settings` has "Check & repair counters". Those go through
`/api/admin/...` with a session instead, and are attributed to the admin rather than to `system`.
