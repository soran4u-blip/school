'use client';

import { useEffect, useState } from 'react';

/**
 * Runs an async loader once, on mount.
 *
 * Ten admin pages plus a couple of public ones each wrote the same three lines —
 * `useEffect(() => { loadData(); }, [])` — with the same missing-dependency suppression, so this
 * puts the pattern in one place. Capturing the loader from the first render means a
 * newly-created closure on each subsequent render doesn't retrigger it, which is exactly what
 * those pages wanted from the empty dependency array.
 *
 * A deliberate note on `react-hooks/set-state-in-effect`: that rule fires on any effect that
 * transitively calls setState, which includes every fetch-on-mount. Its general remedy — fetch on
 * the server and pass the result in as props — is what the public pages now do, and is the reason
 * they were converted.
 *
 * The admin pages are the deliberate exception, and not merely a deferral. They read through the
 * client SDK, which means firestore.rules enforces the scoped-role model on every read: a
 * moderator physically cannot pull an editor-only collection, because the database refuses. Moving
 * those reads to the Admin SDK would bypass rules entirely and put the whole permission model back
 * on hand-written checks in each server page — trading an enforced boundary for a remembered one,
 * on a surface with no SEO and a handful of users. The extra render pass is the price of that, and
 * it is the right way round.
 *
 * So this suppression is permanent for the admin surface rather than a placeholder. Centralising
 * it means one place to review instead of a dozen inline disables.
 */
export function useLoadOnMount(load: () => Promise<void> | void): void {
  // useState's lazy initialiser pins the first render's closure without writing a ref during
  // render, which is itself a hook-rules violation.
  const [initialLoad] = useState(() => load);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);
}
