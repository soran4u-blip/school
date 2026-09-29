import { LocalizedString } from './masterData';

// Named EduEvent, not Event, to avoid shadowing the DOM Event type.
export interface EduEvent {
  id: string;
  slug?: string; // human-readable URL slug; optional since /events/[slug] falls back to id
  // Exactly one of these is set, depending on who posted it — same "exactly one owner" pattern
  // as Job's institutionId?/employerId?.
  institutionId?: string;
  employerId?: string;
  posterName?: string; // denormalized institution/employer name, avoids an extra fetch per card
  posterLogoUrl?: string; // denormalized
  posterType?: 'INSTITUTION' | 'NGO'; // set only when employerId is set, drives the public badge
  title: LocalizedString;
  description: LocalizedString;
  eventType: 'OPEN_HOUSE' | 'EXHIBITION' | 'WORKSHOP' | 'INFO_SESSION' | 'OTHER';
  governorateId: string;
  venue?: LocalizedString; // free-text address/venue name, ignored when isOnline
  isOnline: boolean;
  startDate: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD', for multi-day events
  registrationLink?: string;
  whatsappNumber?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  // Set when the institution/employer that posted this was deleted — see core/server/listingPostings.ts.
  closedByListingDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}
