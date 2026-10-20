import { Governorate } from '@/core/types/masterData';

// Fallback governorates in case master data is still initializing
export const DEFAULT_GOVERNORATES: Governorate[] = [
  { id: 'baghdad', name: { ar: 'بغداد', en: 'Baghdad' }, code: 'BG', region: 'CENTRAL', lat: 33.3152, lng: 44.3661, isActive: true, displayOrder: 1 },
  { id: 'erbil', name: { ar: 'أربيل', en: 'Erbil' }, code: 'ER', region: 'KURDISTAN', lat: 36.1901, lng: 44.0091, isActive: true, displayOrder: 2 },
  { id: 'basra', name: { ar: 'البصرة', en: 'Basra' }, code: 'BS', region: 'SOUTH', lat: 30.5081, lng: 47.7835, isActive: true, displayOrder: 3 },
  { id: 'sulaymaniyah', name: { ar: 'السليمانية', en: 'Sulaymaniyah' }, code: 'SU', region: 'KURDISTAN', lat: 35.5558, lng: 45.4351, isActive: true, displayOrder: 4 },
  { id: 'najaf', name: { ar: 'النجف', en: 'Najaf' }, code: 'NJ', region: 'CENTRAL', lat: 32.0259, lng: 44.3462, isActive: true, displayOrder: 5 },
  { id: 'karbala', name: { ar: 'كربلاء', en: 'Karbala' }, code: 'KR', region: 'CENTRAL', lat: 32.616, lng: 44.0249, isActive: true, displayOrder: 6 },
  { id: 'ninawa', name: { ar: 'نينوى', en: 'Nineveh' }, code: 'NI', region: 'NORTH', lat: 36.34, lng: 43.13, isActive: true, displayOrder: 7 },
  { id: 'kirkuk', name: { ar: 'كركوك', en: 'Kirkuk' }, code: 'KI', region: 'NORTH', lat: 35.4681, lng: 44.3922, isActive: true, displayOrder: 8 },
];
