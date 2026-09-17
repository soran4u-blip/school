'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';

export const DASHBOARD_BY_ROLE: Record<string, string> = {
  tutor: '/tutor/dashboard',
  student: '/account',
  institution: '/institution/dashboard',
  employer: '/employer/dashboard',
};

// The signed-in user's dashboard path, or null when signed out — the single source of truth for
// "is this visitor logged in" that both the Navbar and the Footer render their login/account link
// from, so the two never disagree about auth state.
export function useAccountPath(): string | null {
  const [accountPath, setAccountPath] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccountPath(null);
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role as string | undefined;
      setAccountPath((role && DASHBOARD_BY_ROLE[role]) || null);
    });
    return () => unsub();
  }, []);

  return accountPath;
}
