import { InstitutionProgram } from '@/core/types/institution';
import { Job } from '@/core/types/job';
import { EduEvent } from '@/core/types/event';

// Blank records the dashboard's "add" buttons start editing from.
export function emptyJob(institutionId: string): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    institutionId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    employmentType: 'FULL_TIME',
    governorateId: '',
    isRemote: false,
    status: 'DRAFT',
  };
}

export function emptyEvent(institutionId: string): Omit<EduEvent, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    institutionId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    eventType: 'OPEN_HOUSE',
    governorateId: '',
    isOnline: false,
    startDate: '',
    status: 'DRAFT',
  };
}

export function emptyProgram(): InstitutionProgram {
  return {
    id: `prog-${Date.now()}`,
    name: { ar: '', en: '' },
    facultyName: { ar: '', en: '' },
    degreeLevelId: 'bachelor',
    // Iraqi institutions price in dinars far more often than dollars; the owner can switch it
    // per-program now that the editor exposes a currency control.
    tuitionAnnual: { amount: 0, currency: 'IQD' },
    durationYears: 4,
    isActive: true,
    isAcceptingApplications: true,
  };
}
