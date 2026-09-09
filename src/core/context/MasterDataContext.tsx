'use client';

import React, { createContext, useContext } from 'react';
import { Category, Governorate } from '@/core/types/masterData';

// Site chrome (Navbar, Footer) needs the category and governorate lists on every page. Each of
// them used to fetch both from Firestore in its own useEffect, so a single page load produced two
// duplicate reads from the browser — on top of whatever the page itself fetched, and again on
// every navigation.
//
// The root layout reads them once on the server (from the cached snapshot in
// core/server/data/masterData.ts) and provides them here. Nothing in this context is
// user-specific, which is what makes a single shared server read correct.

export interface MasterData {
  categories: Category[];
  governorates: Governorate[];
}

const MasterDataContext = createContext<MasterData>({ categories: [], governorates: [] });

export function MasterDataProvider({ value, children }: { value: MasterData; children: React.ReactNode }) {
  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData(): MasterData {
  return useContext(MasterDataContext);
}
