import { EduEvent } from '@/core/types/event';

export const EVENT_TYPE_LABELS: Record<EduEvent['eventType'], { ar: string; en: string }> = {
  OPEN_HOUSE: { ar: 'يوم مفتوح', en: 'Open House' },
  EXHIBITION: { ar: 'معرض', en: 'Exhibition' },
  WORKSHOP: { ar: 'ورشة عمل', en: 'Workshop' },
  INFO_SESSION: { ar: 'جلسة تعريفية', en: 'Info Session' },
  OTHER: { ar: 'فعالية أخرى', en: 'Other' },
};
