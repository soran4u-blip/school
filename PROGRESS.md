# Eduraq — Iraq Education Directory
## Session Continuity Progress Ledger
**Last Updated:** 2026-09-04 (Session 3 — Phase 5 + Post-Launch Hardening + Tutor Booking System + Workflow Enhancements + Production Deploy Complete) | **Stack:** Next.js 16.3.4 + Firebase + Tailwind CSS v4 + TypeScript  
**Build Status:** ✅ `npm run build` PASSED — 28/28 routes compiled (0 TypeScript errors) | ✅ `npm test` — 7/7 passing  
**Live Site:** ✅ **https://school--school-4bcd6.us-east4.hosted.app** — deployed via Firebase App Hosting, auto-deploys on push to `main`/`master` (kept in sync, see Phase 9)  
**Live Firebase:** `firestore.rules` (covers tutor reviews too) + `storage.rules` + `bookings` composite index deployed to project `school-4bcd6`. Anonymous Auth confirmed enabled and working.  
**GitHub:** https://github.com/soran4u-blip/school (branches `main` and `master` — kept identical; App Hosting backend "school" in `us-east4` watches this repo)

---

## ✅ PHASE 6: Post-Launch Hardening — COMPLETE

- [x] **Image uploads** — `src/components/shared/ImageUploadField.tsx` + `src/core/firebase/storage.ts`, wired into institution (logo/cover) and tutor (photo) forms; `storage.rules` deployed live
- [x] **Delete support** — `deleteInstitution`/`deleteTutor` in `masterDataService.ts`, confirm-guarded delete buttons in both admin tables
- [x] **Institution programs editor** — repeatable add/edit/remove rows for `InstitutionProgram[]` (name, faculty, duration, tuition) in the institution add/edit form, previously only settable via the seed script
- [x] **Spam protection** — `src/lib/spamGuard.ts`: honeypot field + 30s client-side cooldown on both the public review and inquiry forms, layered on top of the `firestore.rules` field validation from Phase 5
- [x] **`next/image` conversion** — homepage, `/explore`, and the institution profile page now use `next/image` for institution/tutor photos; `next.config.ts` `images.remotePatterns` allowlists Firebase Storage, Google user-content, Unsplash, and placehold.co (the actual domains currently in use — admin-pasted URLs from other domains will still need `remotePatterns` updated, or stay as plain `<img>`, which is what admin table thumbnails and the upload-field preview still use)
- [x] **Test foundation** — Vitest + jsdom set up (`npm test`), 7 unit tests covering `src/lib/utils.ts` and `src/lib/spamGuard.ts`; no component/integration tests yet
- [ ] Full App Check / server-side rate limiting — not implemented; the honeypot + cooldown only deters unsophisticated bots

---

## ✅ PHASE 7: Tutor Booking System — COMPLETE

Tutors now get their own accounts to manage a weekly availability calendar and two price points; students book individual or group sessions publicly, with group cost split evenly across whoever joins.

**Data model**
- [x] `src/core/types/tutor.ts` — added `groupRate` (total pot for a group session), `groupMaxSize`, `availability: AvailabilitySlot[]` (weekly recurring `{dayOfWeek, startTime, endTime}` pattern). `hourlyRate` continues to mean the individual-session price.
- [x] `src/core/types/booking.ts` — new `Booking` type: one Firestore doc per session slot, `participants[]` grows as students join a group, `pricePerStudent` recalculated on each join.
- [x] `firestore.indexes.json` — composite index (`tutorId` + `date`) for the slot-status query — **deployed live** (had to be created manually via the Firebase Console; the service account lacks IAM permission to create indexes via API).

**Server-side booking logic** (Admin SDK, bypasses client rules — keeps the group price-split transactional and never exposes other students' names/phone numbers to the public)
- [x] `POST /api/bookings` — creates an individual booking, starts a new group, or joins an existing group (`runTransaction` recomputes `pricePerStudent = groupRate / participants.length`); rejects double-booking a slot and bookings outside the tutor's availability pattern.
- [x] `GET /api/tutors/[tutorId]/slots` — sanitized slot-status feed (open / booked / group X-of-Y + price) for the public calendar, participant PII stripped.

**Tutor accounts & dashboard**
- [x] Extended the existing superadmin auth system rather than building a parallel one: `src/proxy.ts` and `/api/auth/session` now branch on `role: 'superadmin' | 'tutor'`; `firestore.rules` gained `isOwnerTutor()` keyed off a `tutorId` custom claim.
- [x] `src/app/tutor/login/page.tsx`, `src/app/tutor/dashboard/(layout+page).tsx` — tutor signs in, edits weekly availability + both prices, and approves/cancels bookings (own bookings only, enforced by rules).
- [x] `scripts/set-tutor-claim.mjs <email> <tutorId>` — bootstrap script granting `role: 'tutor'` + linking a Firebase Auth user to a `Tutor` doc (mirrors `set-admin-claim.mjs`).

**Public booking UI**
- [x] `src/app/tutors/[id]/page.tsx` (new — this route didn't exist before) — tutor profile with pricing cards and a 14-day calendar; each open slot offers "Book Individually" / "Start a Group", each in-progress group under capacity offers "Join (`X`/`Y`)" with the live per-student price.
- [x] `src/app/tutors/page.tsx` (new) — tutor directory listing, filterable by governorate.
- [x] Fixed a **pre-existing dead link** found while exploring the system as a tutor: the homepage's "Explore All Tutors" button pointed at `/explore?category=tutors`, but `/explore` only ever queried institutions, never tutors — silently broken. Repointed to the new `/tutors` listing.

**Bugs found and fixed while verifying this end-to-end**
- [x] `getMergedInstitutions()`/`getMergedTutors()` (added in Phase 5) issued an **unfiltered** `collection(db, 'institutions'|'tutors')` read. Firestore's rule engine denies that for any unauthenticated caller whenever the rule is data-dependent (`resource.data.status == 'ACTIVE'`) — so every anonymous visitor (the entire public site) was silently falling back to stale in-memory seed data on every load. Signed-in superadmin sessions never hit this (their branch of the rule is unconditionally true), which is why it went unnoticed all session. Fixed by retrying with a `where('status','==','ACTIVE')` filter on permission-denied.
- [x] `/api/tutors/[tutorId]/slots` had no `try/catch` around its Firestore query — a missing index (a real, temporary condition while the index above was building) took down the whole route with an unhandled 500, and the calling page had no `finally`, so the UI got stuck on an infinite loading spinner. Both now fail gracefully.
- [x] Verified live end-to-end (real browser session, not just curl): individual booking → slot shows "Booked"; group booking (1 student, full pot price) → second student joins → price correctly recalculates to `groupRate / 2`; tutor dashboard reads both bookings, confirms one, and a live availability edit is immediately reflected. All test data cleaned up afterward.
- [x] **No entry point to `/tutor/login` anywhere in the UI** — only the superadmin link existed in the navbar. Added a "Tutor Portal" link to the navbar (desktop + mobile) and the footer's Platform & Admin section.

### Full student walkthrough (find tutor → book → communicate) — found and fixed 2 more real bugs

- [x] **Booking failed with "Tutor not found" for any tutor never individually migrated to Firestore** (only `tutor-ahmed-alkaabi` had been, from earlier testing) — `/api/bookings` correctly only trusts the live database, not stale seed JSON, so this wasn't a bug in that route, but exposed that the reference dataset had never actually been pushed to Firestore (Phase 5's built-in "Seed Database" flow had never been run). Ran it — all 18 governorates, 6 cities, 6 categories, 11 taxonomy items, 4 institutions, and both tutors are now live in Firestore.
- [x] **Timezone day-of-week bug (real, user-facing)**: the booking calendar's `nextNDays()` computed `dayOfWeek` from a local `Date` but the `date` string via `toISOString()` (UTC) — these disagree by a day whenever local time is past midnight but UTC hasn't rolled over yet, which is every night between ~9pm–3am Iraq time (UTC+3). The server then independently recomputed day-of-week from that already-wrong date string via its own timezone-sensitive `new Date(dateStr)`, compounding the error. Net effect: booking a calendar slot labeled "Sunday" could be rejected with "Selected time is outside tutor availability" because the server thought it was Friday. Fixed on both sides: the client now builds the date string from the same local `Date` object's fields (no UTC round-trip), and the server parses `YYYY-MM-DD` as pure calendar components via `Date.UTC(...).getUTCDay()`, immune to server timezone entirely.
- [x] **No way to actually follow up with the tutor about a specific booking** — the WhatsApp button was a bare link with no message, and closing the booking modal lost all context. Added a pre-filled WhatsApp message to the profile's main button (mentions the tutor by name) and a new "Confirm via WhatsApp" button in the booking success state, pre-filled with the exact date/time just booked.

All six flagged workflow gaps were then addressed — see Phase 8 below.

---

## ✅ PHASE 8: Workflow Enhancements (Reviews, Booking Lifecycle, Discovery) — COMPLETE

- [x] **Tutor reviews** — `Review` type now takes either `institutionId` or `tutorId` (additive change, institution reviews untouched). `masterDataService.getApprovedTutorReviews()` added; `updateReviewStatus()` generalized to recompute either an institution's `metrics.ratingAvg` or a tutor's top-level `ratingAvg`/`reviewCount` depending on which field is set. Tutor profile page gained the same review-list + submission-form section institutions already had, honeypot/cooldown included. `firestore.rules`' `isValidReview()` now accepts either target — deployed live. Verified end-to-end: anonymous sign-in → submit → admin-side approve → tutor's `ratingAvg` recomputed correctly.
- [x] **Student booking lifecycle (no accounts needed)** — `Booking` gained a denormalized `participantPhones: string[]` (kept in sync on create/join) purely so a student can be found by phone without exposing a raw participants-array query. New endpoints: `GET /api/bookings/lookup?phone=` (sanitized — a student sees only their own booking's tutor/date/price, never other participants in the same group) and `POST /api/bookings/cancel` (verifies the phone is actually on the booking; solo booking → cancelled, group booking with others still in it → that participant is removed and `pricePerStudent` is recomputed for whoever remains). New public page `/my-bookings` ties it together with a Cancel button and a WhatsApp shortcut to the tutor. Linked from the footer and from the booking-success state on the tutor profile page. Verified via curl and the live UI: lookup, cancel, and phone-mismatch rejection all behave correctly.
- [x] **Admin-wide bookings view** — `src/app/admin/(protected)/bookings/page.tsx`, filterable by tutor, added to the sidebar nav. Uses `MasterDataService.getAllBookings()`, which `firestore.rules` already permitted for superadmin (no rules change needed).
- [x] **Booking subject capture** — `Booking.subjectId` (optional). The booking modal on the tutor profile page only shows a subject dropdown when the tutor actually teaches more than one subject (single-subject tutors don't need to ask); shown in both the tutor dashboard and admin bookings list.
- [x] **`/tutors` listing filters** — added subject, delivery-mode (online/in-person/hybrid), and sort-by (rating/price) alongside the existing governorate filter.
- [x] **Slot-status polling** — the tutor profile page now refetches `/api/tutors/[id]/slots` every 20s while open, so a slot another student just filled doesn't sit visibly stale (the server-side transaction was already safe against actual double-booking; this closes the *appearance* gap, not a data-integrity one).

---

## ✅ PHASE 9: Production Deployment — COMPLETE

Live at **https://school--school-4bcd6.us-east4.hosted.app** via Firebase App Hosting, auto-deploying on push.

- [x] Repo pushed to `https://github.com/soran4u-blip/school` (`master`), then connected to Firebase App Hosting via the console (which requires a real Google/GitHub identity in a browser — done by the user; API automation isn't possible for this step).
- [x] **IAM**: the deploy service account (`firebase-adminsdk-fbsvc@school-4bcd6.iam.gserviceaccount.com`) needed `roles/firebaseapphosting.admin` and `roles/secretmanager.admin` granted (one-time console action by the user) before status/build-log inspection via API was possible.
- [x] **Bug found and fixed: build failures on the App Hosting build server.** Root cause was a real `npm install` peer-dependency conflict (`vitest@5` wants `@types/node@^22`, project pins `^20`) that only "worked" locally because of a `--legacy-peer-deps` flag typed at the CLI — which never reached the build server's own `npm ci`. Fixed properly with a committed `.npmrc` (`legacy-peer-deps=true`), verified locally with a from-scratch `npm ci` before pushing.
- [x] **Cleaned up `X_SCHOOL_001`**, a stray env-var artifact from the App Hosting console's secret-linking UI, unrelated to anything the app reads.
- [x] **Branch divergence found and reconciled**: the App Hosting console's GitHub connection flow created a `main` branch independently of the `master` branch already pushed, and a direct edit landed on `main` (correctly authored by the user, not lost). Fast-forwarded both `main` and `master` to the same final commit — no history rewritten, no force-push used.
- [x] Verified live, not just "build succeeded": homepage, `/sitemap.xml`, `/tutors`, `/admin/login` all return 200; `/admin` correctly 307-redirects an unauthenticated request — the proxy auth guard is active in production.
- [x] Updated `NEXT_PUBLIC_SITE_URL` in `apphosting.yaml` to the real deployed URL once known, for correct SEO metadata/sitemap output.
- [ ] Custom domain not set up (still on the `*.hosted.app` default).
- [ ] `firestore.indexes.json`'s existing 3 non-booking indexes (institutions×2, tutors×1) were never explicitly deployed via CLI — not currently blocking anything since no live query needs them yet, but worth doing before adding filters that would.

### Post-deploy student walkthrough on the *live* production URL — found and fixed one more real bug

- [x] **Bug found and fixed: booking API returned "Server not configured" in production only.** The `firebase-service-account-key` Secret Manager secret held only a fragment of the private key (missing the JSON wrapper, `client_email`, etc.) — likely a partial copy-paste during the console setup — so `JSON.parse()` in `src/core/firebase/admin.ts` threw and the Admin SDK silently never initialized (caught, logged, left `adminDb` null). Fixed by adding a corrected secret version from the same value already verified working locally. **Important lesson recorded here**: adding a new secret version alone did *not* fix it — the already-running Cloud Run revision doesn't re-resolve secrets, and even creating a new rollout that reused the same build/image reused the existing revision without re-binding it either. Only an actual fresh build (a real code push) forced a new revision that correctly re-resolved the secret.
- [x] Verified end-to-end **directly against the live production API** (not just "build succeeded"): individual booking → succeeds with correct price; group booking (1 student, full pot) → second student joins → price splits correctly (70,000 → 35,000 each); one participant cancels → remaining student's price correctly reverts to the full pot (70,000); `/api/tutors/[id]/slots` never exposes other participants' names/phones. All test bookings cleaned up afterward.
- [x] Confirmed the timezone fix from Phase 7 generalizes correctly under a *different* server timezone than local dev (Cloud Run vs. this machine's UTC+3) — calendar day labels matched real calendar weekdays on production too.

---

## ✅ PHASE 1: Project Scaffolding — COMPLETE

- [x] Next.js 16.3.4 initialized in `d:/SOM/Coding/school` (App Router, TypeScript, Tailwind v4, ESLint, `src/`)
- [x] Firebase + firebase-admin + lucide-react + clsx + tailwind-merge installed
- [x] `globals.css` configured with Academic Trust design tokens (Navy `#0B192C`, Gold `#F1C40F`, Emerald `#10B981`)
- [x] Google Fonts: Cairo (Arabic) + Plus Jakarta Sans loaded

---

## ✅ PHASE 2: Core Architecture & Data Layer — COMPLETE

### TypeScript Types (Zero-Hardcoding Schemas)
- [x] `src/core/types/masterData.ts` — Governorate, City, District, Category, TaxonomyItem, QuickSearchTag, SystemSettings
- [x] `src/core/types/institution.ts` — Institution, InstitutionProgram, InstitutionContact
- [x] `src/core/types/tutor.ts` — Tutor with delivery modes and subject IDs

### Firebase Configuration
- [x] `src/core/firebase/config.ts` — Client SDK singleton (env-driven)
- [x] `src/core/firebase/admin.ts` — Admin SDK using modular `firebase-admin/app` imports (v12+ compatible)
- [x] `firestore.rules` — RBAC: public read on active listings, superadmin write on all
- [x] `firestore.indexes.json` — Composite indexes for multi-facet search

### Seed Data (Complete Iraq Master Data)
- [x] `src/core/seed/seedData.json` — All 18 Iraqi governorates with lat/lng, regions, codes
- [x] 6 categories (universities, schools, institutes, training_centers, ngos, tutors)
- [x] 11 taxonomy items (MoHESR, MoE, IB, Cambridge, Iraqi/British/American curricula, 4 Wazari subjects)
- [x] 4 sample institutions (AUB Baghdad, Baghdad Int'l Academy, Erbil Tech Institute, UNICEF Basra Hub)
- [x] 2 vetted tutors + 4 quick-search tags + systemSettings with emergency announcement

### Master Data Service
- [x] `src/core/services/masterDataService.ts` — Dual-mode (Firestore live + in-memory JSON fallback)
- [x] Full CRUD: `saveGovernorate()`, `saveCity()`, `saveCategory()`, `saveTaxonomy()`, `saveInstitution()`, `deleteGovernorate()`, `updateSystemSettings()`

### Language & i18n
- [x] `src/core/context/LanguageContext.tsx` — AR/EN toggle, RTL/LTR switching, localStorage persistence

---

## ✅ PHASE 3: Public UI Pages — COMPLETE

### Shared Components
- [x] `src/components/shared/Navbar.tsx` — Dynamic categories + governorate switcher + AR|EN toggle + admin link
- [x] `src/components/shared/Footer.tsx` — Dynamic categories + top 8 governorates + admin links

### Public Pages (Ported from Approved Stitch Screens)
- [x] `src/app/page.tsx` — Homepage: Emergency ticker, OmniSearch hero, dynamic category cards, featured institutions, all-18-governorates explorer, tutor showcase, CTA banner
- [x] `src/app/explore/page.tsx` — Directory: Faceted sidebar (categories, governorates, accreditations), sort, institutions card feed
- [x] `src/app/institutions/[slug]/page.tsx` — Institution profile: Cover hero, quick stats ribbon, 4 content tabs, sticky WhatsApp admissions card

---

## ✅ PHASE 4: Superadmin Control Center — COMPLETE

### Admin Layout & Pages (All Built)
- [x] `src/app/admin/layout.tsx` — Dark sidebar with 7 nav sections + live DB status indicator
- [x] `src/app/admin/page.tsx` — Dashboard with live metrics + zero-hardcoding banner
- [x] `src/app/admin/locations/page.tsx` — Master-detail CRUD for governorates & cities (zero hardcoding)
- [x] `src/app/admin/categories/page.tsx` — Categories manager with icon picker
- [x] `src/app/admin/taxonomies/page.tsx` — Accreditations / Curricula / Subjects tabs
- [x] `src/app/admin/institutions/page.tsx` — Table with one-click verify/feature toggles
- [x] `src/app/admin/tutors/page.tsx` — Tutors table with verification status
- [x] `src/app/admin/settings/page.tsx` — Emergency ticker, exchange rate, contact info

---

## 🚧 PHASE 5: NEXT STEPS (Resuming Session)

### Step 1 — Create `.env.local` with Firebase credentials
```
d:/SOM/Coding/school/.env.local
```
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=eduraq-iraq.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eduraq-iraq
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=eduraq-iraq.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_USE_FIRESTORE=false
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Step 2 — Firebase Auth & Admin Route Guard — ✅ COMPLETE
- [x] `src/proxy.ts` — Protects `/admin/**` and `/api/seed/**` (Next.js 16 renamed `middleware.ts` → `proxy.ts`); verifies an httpOnly session cookie via Admin SDK and checks the `role: 'superadmin'` custom claim; redirects HTML routes to `/admin/login`, returns 401 JSON for API routes
- [x] `src/app/api/auth/session/route.ts` — POST verifies the client ID token + role claim and mints a 5-day httpOnly session cookie; DELETE clears it
- [x] `src/app/admin/login/page.tsx` — Email/password login for superadmin, outside the protected route group so it renders without the admin sidebar
- [x] `src/app/admin/(protected)/` — All existing admin pages moved into a route group with their own layout (sidebar + logout button), sibling to `login/`
- [x] `scripts/set-admin-claim.mjs` — Bootstrap script to grant `role: 'superadmin'` to a user by email via Admin SDK (`node --env-file=.env.local scripts/set-admin-claim.mjs <email>`)
- [x] Granted `superadmin` claim to `soran.mohsin@outlook.com`
- [x] Verified end-to-end: `/admin` redirects to login when signed out, session cookie flow works, `/admin/institutions` and `/api/seed` are both blocked without a valid superadmin session

### Step 3 — Firestore Live Seeder — ✅ COMPLETE (pre-existing)
- [x] `src/app/api/seed/route.ts` — POST endpoint to push seedData.json to live Firestore (now also protected by `src/proxy.ts`)

### Step 4 — Reviews & Inquiries Modules — ✅ COMPLETE
- [x] `src/core/types/review.ts` — `Review` & `Inquiry` interfaces
- [x] `MasterDataService` — `createReview`/`getApprovedReviews`/`getAllReviews`/`updateReviewStatus` (auto-recomputes institution `metrics.ratingAvg`/`reviewCount` on approval), `createInquiry`/`getAllInquiries`/`updateInquiryStatus`
- [x] Review submission form + reviews tab on `institutions/[slug]/page.tsx` — visitors are signed in anonymously (`signInAnonymously`) to satisfy the `isAuthenticated()` Firestore rule, review starts as `PENDING`
- [x] "Request More Info" inquiry modal on the institution profile — public write, no auth required
- [x] `src/app/admin/(protected)/reviews/page.tsx` — moderation UI: approve/reject reviews, triage inquiries (New/Contacted/Closed); added to the admin sidebar nav
- [x] Verified end-to-end live: inquiry submit → persisted in Firestore → visible via Admin SDK → cleaned up
- [ ] **Manual step still needed:** enable **Anonymous Authentication** in Firebase Console (Authentication → Sign-in method) — required for the review flow specifically; confirmed failing with `ADMIN_ONLY_OPERATION` until enabled

### Step 5 — Add/Edit Forms (Institutions & Tutors) — ✅ COMPLETE
- [x] `src/app/admin/(protected)/institutions/add/page.tsx` — full creation + edit form (same page, `?edit=<id>` query param), wired to Edit icons in the institutions table
- [x] `src/app/admin/(protected)/tutors/add/page.tsx` — same pattern for tutors
- [x] Fixed a latent bug found along the way: `src/core/services/masterDataService.ts` — `getInstitutions`/`saveInstitution`/`getTutors`/`saveTutor` previously only ever read/wrote the in-memory seed store, never Firestore, even with `NEXT_PUBLIC_USE_FIRESTORE=true`. Now merges Firestore docs over the in-memory fallback and persists writes to Firestore.
- [x] Image uploads: `src/core/firebase/storage.ts` + `src/components/shared/ImageUploadField.tsx` (upload button with URL-paste fallback, 5MB/image-type limit) wired into logo/cover (institutions) and photo (tutors) fields
- [x] `storage.rules` — superadmin-only writes, public read, size/type validation — deployed to the live default bucket
- [x] Verified end-to-end live (as an authenticated superadmin): image upload → Storage → institution Firestore save, using the newly deployed rules

### Step 6 — SEO Metadata & Sitemap — ✅ COMPLETE
- [x] `src/app/institutions/[slug]/layout.tsx` — `generateMetadata()` (title/description/OG/Twitter/canonical) since the page itself is a client component
- [x] `src/app/sitemap.ts` — dynamic sitemap over all `ACTIVE` institutions + static routes
- [x] `src/app/robots.ts` — disallows `/admin/`, points at the sitemap
- [x] Root `src/app/layout.tsx` — `metadataBase`, title template, default OG/Twitter tags
- [x] `NEXT_PUBLIC_SITE_URL` added to `.env.local` (currently `http://localhost:3000` — **update to the real production URL after deploying**)
- [x] Verified live: `/sitemap.xml` renders correctly, institution page `<title>` resolves without the double "Eduraq" template bug

### Step 7 — Deployment — ⚠️ CONFIG READY, NOT YET LIVE
- [x] `.firebaserc` + `firebase.json` (Firestore rules/indexes for the named `schooldb` database + Storage rules)
- [x] `apphosting.yaml` — Next.js 16 has `proxy.ts`, API routes, and cookies, so it cannot be a static export; this targets **Firebase App Hosting** (managed Cloud Run), not classic static Firebase Hosting
- [x] **`firestore.rules` deployed to the live project** — found and fixed a real gap: the rules file existed in the repo but had never actually been deployed, so the live database was still on Firebase's default deny-all rules and every client read/write was silently falling back to in-memory data. Deployed via the Firebase Rules REST API (service-account auth) since the `firebase` CLI has no interactive login available in this environment.
- [x] **`storage.rules` deployed to the live default bucket**
- [x] Firestore rules hardened with field validation on public write paths (`isValidReview()`/`isValidInquiry()`): required fields, length caps, `rating` bounded 1–5, and the referenced `institutionId` must actually exist — reduces (but doesn't eliminate — no App Check/rate limiting yet) spam/garbage submissions
- [ ] `firestore.indexes.json` not deployed — not currently needed (no composite Firestore queries in the app yet), deploy before adding any
- [ ] **No live deploy performed.** Needs either an interactive `firebase login` (not available in this sandboxed session) run by you, or connecting the repo through Firebase Console → App Hosting → GitHub integration. Once linked, `apphosting.yaml` handles the rest — update `NEXT_PUBLIC_SITE_URL` in it to the real URL first.

---

## 📁 Complete File Map

```
d:/SOM/Coding/school/
├── PROGRESS.md                                  ← This file
├── firestore.rules                              ← Firestore security rules (deployed live)
├── firestore.indexes.json                       ← Composite indexes (not yet deployed)
├── storage.rules                                ← Firebase Storage security rules (deployed live)
├── firebase.json / .firebaserc                  ← Firebase CLI project config
├── apphosting.yaml                              ← Firebase App Hosting config (Next.js SSR target)
├── scripts/set-admin-claim.mjs                  ← Bootstrap: grant role:superadmin by email
├── src/
│   ├── proxy.ts                                 ← Route guard for /admin/** + /api/seed/** (Next 16 "proxy", was middleware)
│   ├── lib/utils.ts                             ← cn(), formatCurrencyIQD/USD
│   ├── core/
│   │   ├── context/LanguageContext.tsx          ← AR/EN/KU language provider
│   │   ├── firebase/
│   │   │   ├── config.ts                        ← Client Firebase SDK
│   │   │   ├── admin.ts                         ← Server Firebase Admin SDK
│   │   │   └── storage.ts                       ← uploadImage() helper
│   │   ├── seed/seedData.json                   ← 18 govs + all master data
│   │   ├── services/masterDataService.ts        ← Firestore-backed data service (institutions/tutors/reviews/inquiries)
│   │   └── types/
│   │       ├── masterData.ts                    ← Core data interfaces
│   │       ├── institution.ts                   ← Institution interfaces
│   │       ├── tutor.ts                         ← Tutor interfaces
│   │       └── review.ts                        ← Review & Inquiry interfaces
│   ├── components/shared/
│   │   ├── Navbar.tsx                           ← Dynamic bilingual navbar
│   │   ├── Footer.tsx                           ← Dynamic bilingual footer
│   │   └── ImageUploadField.tsx                 ← Reusable Storage image upload + URL fallback
│   └── app/
│       ├── layout.tsx                           ← Root layout + LanguageProvider + default SEO metadata
│       ├── sitemap.ts / robots.ts                ← SEO
│       ├── globals.css                          ← Academic Trust design tokens
│       ├── page.tsx                             ← Homepage (Stitch Screen 1 ✅)
│       ├── explore/page.tsx                     ← Directory (Stitch Screen 2 ✅)
│       ├── institutions/[slug]/
│       │   ├── page.tsx                         ← Profile (Stitch Screen 3 ✅) + reviews tab + inquiry modal
│       │   └── layout.tsx                       ← generateMetadata() for SEO
│       ├── api/
│       │   ├── auth/session/route.ts            ← Login session cookie (POST) / logout (DELETE)
│       │   └── seed/route.ts                    ← Push seedData.json to live Firestore (superadmin-only)
│       └── admin/
│           ├── login/page.tsx                   ← Superadmin login (outside the protected group)
│           └── (protected)/                     ← Route group wrapped by the sidebar layout
│               ├── layout.tsx                   ← Admin sidebar shell + logout
│               ├── page.tsx                     ← Dashboard overview
│               ├── locations/page.tsx           ← Governorates & Cities CRUD ✅
│               ├── categories/page.tsx          ← Categories manager ✅
│               ├── taxonomies/page.tsx          ← Accreditations & Subjects ✅
│               ├── institutions/page.tsx        ← Institutions table ✅
│               ├── institutions/add/page.tsx    ← Institution create/edit form (?edit=<id>) ✅
│               ├── tutors/page.tsx              ← Tutors table ✅
│               ├── tutors/add/page.tsx          ← Tutor create/edit form (?edit=<id>) ✅
│               ├── reviews/page.tsx             ← Reviews & inquiries moderation ✅
│               └── settings/page.tsx            ← System settings & CMS ✅
```
