import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { SystemSettings } from '../types/masterData';

// Site-wide settings — a single document, read on nearly every page (Navbar/Footer contact
// details, the exchange rate, the emergency banner).

const SETTINGS_COLLECTION = 'system_settings';
const SETTINGS_DOC = 'global';

// Used only when the settings document doesn't exist yet (a fresh project, before /api/seed has
// run). Deliberately minimal: enough for the chrome to render without `undefined` leaking into
// the UI, not a second source of truth for real content.
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  siteName: { ar: 'إيدوراك', en: 'Eduraq' },
  contactEmail: '',
  contactPhone: '',
  contactWhatsApp: '',
  exchangeRateUsdToIqd: 1500,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
  if (!snap.exists()) return DEFAULT_SYSTEM_SETTINGS;
  return { ...DEFAULT_SYSTEM_SETTINGS, ...(snap.data() as Partial<SystemSettings>) };
}

// Goes through the server (not a direct client-SDK setDoc, despite this being a single Firestore
// merge write) so it can call revalidatePublicData() — Navbar/Footer/HomeContent read this doc
// through getPublicSystemSettings(), which is unstable_cache'd; without an explicit revalidate a
// saved change wouldn't reach visitors for up to REVALIDATE_SECONDS.
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Could not save settings');
  }
  return getSystemSettings();
}
