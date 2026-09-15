import { revalidateTag } from 'next/cache';
import { adminDb } from '@/core/firebase/admin';
import type { Firestore } from 'firebase-admin/firestore';

// Shared cache configuration for the public read layer.
//
// Public directory pages used to fetch Firestore from the browser, which meant one full
// collection read per visitor per page view, with the cost scaling on traffic × collection size
// and nothing in front of it. Reading on the server instead lets a single read serve every
// visitor for the length of the revalidate window.
//
// Filters and sorting still happen in memory over the cached snapshot rather than as Firestore
// queries. That's deliberate at this size: the directory is small enough to hold in one cached
// payload, and the alternative — a composite index per filter combination — still couldn't do the
// keyword substring matching the UI offers. The point at which the snapshot stops fitting in
// memory is the point to introduce a real search index (Algolia/Typesense) rather than more
// indexes; nothing below assumes otherwise.

export const CACHE_TAGS = {
  institutions: 'institutions',
  tutors: 'tutors',
  jobs: 'jobs',
  events: 'events',
  community: 'community',
  masterData: 'master-data',
} as const;

// Five minutes: long enough that a burst of traffic costs one read, short enough that an admin
// edit shows up without anyone reaching for a revalidate button. Writes that need to be visible
// immediately call revalidatePublicData() instead of waiting this out.
export const REVALIDATE_SECONDS = 300;

// The Admin SDK is initialised lazily and can legitimately be null (no service account
// configured). Server data functions need a definite value, and a clear error beats a
// `Cannot read properties of null` twelve frames deep.
export function requireAdminDb(): Firestore {
  if (!adminDb) {
    throw new Error(
      'Firebase Admin SDK is not configured — set FIREBASE_SERVICE_ACCOUNT_KEY. Server-side ' +
        'directory reads cannot fall back to anything: returning stale or empty data here would ' +
        'silently publish an empty directory.'
    );
  }
  return adminDb;
}

// Called after a server-side write that should be reflected publicly straight away.
//
// `{ expire: 0 }` rather than the generally-recommended 'max' profile: these callers are rare,
// admin-triggered actions (moderating a review, repairing counters, re-seeding) where the person
// who just performed the action needs to see its effect. 'max' would serve them stale content
// while revalidating in the background, so their own change would appear not to have happened.
// The cost is one blocking read on the next request, which at this frequency is nothing.
//
// Owner edits made with the client SDK from a dashboard can't call this — they never touch the
// server — so those surface within REVALIDATE_SECONDS instead.
export function revalidatePublicData(...tags: Array<keyof typeof CACHE_TAGS>): void {
  for (const tag of tags) revalidateTag(CACHE_TAGS[tag], { expire: 0 });
}

// Firestore documents come back as plain data; the document key is authoritative, so it is
// applied last and a stale or forged `id` field inside the document cannot shadow it.
export function withId<T>(id: string, data: FirebaseFirestore.DocumentData): T {
  return { ...data, id } as T;
}
