import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC), settings, { merge: true });
  return getSystemSettings();
}
