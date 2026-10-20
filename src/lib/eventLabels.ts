import { EduEvent } from '@/core/types/event';

export const EVENT_TYPE_LABELS: Record<EduEvent['eventType'], { ar: string; en: string; ku: string }> = {
  OPEN_HOUSE: { ar: 'يوم مفتوح', en: 'Open House', ku: 'ڕۆژی کراوە' },
  EXHIBITION: { ar: 'معرض', en: 'Exhibition', ku: 'پێشانگا' },
  WORKSHOP: { ar: 'ورشة عمل', en: 'Workshop', ku: 'وۆرکشۆپ' },
  INFO_SESSION: { ar: 'جلسة تعريفية', en: 'Info Session', ku: 'دانیشتنی ناساندن' },
  OTHER: { ar: 'فعالية أخرى', en: 'Other', ku: 'ڕووداوێکی تر' },
};
