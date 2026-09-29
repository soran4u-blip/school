import { SoftDeleteFields } from './softDelete';

// Companies/NGOs — a narrower account type than Institution: can only post and manage jobs
// (including internships), no public directory profile page, no programs/reviews/inquiries.
export interface Employer extends SoftDeleteFields {
  id: string;
  userId?: string; // linked Firebase Auth uid, same convention as Institution/Tutor
  name: string;
  type: 'COMPANY' | 'NGO';
  logoUrl?: string;
  description?: string;
  governorateId: string;
  contact: {
    phone: string;
    whatsappNumber: string;
    email: string;
  };
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}
