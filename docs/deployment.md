# Deployment

The app runs on **Vercel** only. Pushing to `master` deploys production at
<https://school-alpha-henna.vercel.app>; every other branch gets a preview URL.

Firebase is still the backend (Auth, the `schooldb` Firestore database, Storage), but it no longer
hosts the app. Firebase App Hosting was retired on 2026-09-29, and `apphosting.yaml` went with it.
The env var list below replaces it.

## Environment variables (Vercel → Project → Settings → Environment Variables)

The Firebase client config is public by design. It ships in the browser bundle, so these values
are safe to keep in the repo:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAKhjvTJemiFRhl-xxGNtOxbkqkjZTJe5A` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `school-4bcd6.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `school-4bcd6` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `school-4bcd6.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `100385437421` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:100385437421:web:7c4a4f7c56ea93e379bee4` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-CNN53515TM` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_NAME` | `schooldb` |
| `NEXT_PUBLIC_USE_FIRESTORE` | `true` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BCEprbsmTiJVf7V4Rz89i-Lc0p5t0VlOdFfsjNZNXISX-8fcsKfTE1hJfFATMaNq8KdsYcwVwb6DIMqeQzeuX48` |
| `NEXT_PUBLIC_SITE_URL` | Optional. Set it once there's a custom domain. Without it, [`src/lib/siteUrl.ts`](../src/lib/siteUrl.ts) uses Vercel's production domain. |

Secrets. Set these in Vercel only, never in the repo:

| Variable | What it is |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | The full service-account JSON for the Admin SDK. Every server route needs it, which is why data pages are `force-dynamic` rather than prerendered. |
| `VAPID_PRIVATE_KEY` | Web-push private key; pairs with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. |
| `CRON_SECRET` | Shared secret for `/api/cron/[task]`. If it's unset, every cron call is rejected. See [scheduled-tasks.md](scheduled-tasks.md). |

A `NEXT_PUBLIC_*` value is baked in at build time, so after changing one, redeploy for it to take
effect.

## Firebase rules and indexes

These don't deploy with the app. Deploy them from the CLI whenever `firestore.rules`,
`firestore.indexes.json` or `storage.rules` change:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project school-4bcd6
```
