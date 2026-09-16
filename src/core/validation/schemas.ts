import { z } from 'zod';

// One schema per API route body, single source of truth for field limits shared across routes
// that previously hand-checked the same rules (required-ness, max lengths) inline. Kept in one
// file since each schema is small and route-specific — split out only if one grows complex
// enough to reuse elsewhere.

export const communityPostSchema = z.object({
  governorateId: z.string().min(1),
  authorName: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(3000),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().min(1),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().optional(),
  coverLetter: z.string().trim().max(3000).optional(),
  resumeUrl: z.string().min(1),
});

export const reviewSchema = z
  .object({
    tutorId: z.string().min(1).optional(),
    institutionId: z.string().min(1).optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(2000),
    reviewerName: z.string().trim().max(100).optional(),
  })
  .refine((v) => Boolean(v.tutorId) !== Boolean(v.institutionId), {
    message: 'Exactly one of tutorId/institutionId is required',
  });

export const inquirySchema = z.object({
  institutionId: z.string().min(1),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(200).optional(),
  message: z.string().trim().max(3000),
  honeypot: z.string().max(200).optional(),
});

export const inquiryAdminUpdateSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'APPLICATION_STARTED', 'CLOSED']).optional(),
    assignedTo: z.string().trim().max(200).nullable().optional(),
    assignedToName: z.string().trim().max(100).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    nextFollowUpAt: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid follow-up date').nullable().optional(),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), { message: 'Nothing to update' });

export const bookingSchema = z.object({
  tutorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: z.enum(['INDIVIDUAL', 'GROUP']).optional(),
  joinBookingId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  recurring: z.boolean().optional(),
  weeks: z.number().int().positive().optional(),
});

// Superadmin review moderation (/api/admin/reviews/[id]). Kept separate from reviewSchema,
// which describes a public submission — the two share no fields.
export const reviewModerationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const applicationRejectSchema = z.object({
  rejectionReason: z.string().trim().max(2000).optional(),
});

// A tutor submitting their own verification documents for review (/api/tutor/verification/submit).
export const tutorVerificationSubmitSchema = z.object({
  documents: z.array(z.string().trim().min(1)).min(1).max(10),
});

// Admin rejecting a tutor's verification request (/api/admin/tutors/[id]/verification/reject).
// Same shape as applicationRejectSchema but kept separate — the two describe unrelated decisions.
export const tutorVerificationRejectSchema = z.object({
  rejectionReason: z.string().trim().max(2000).optional(),
});

// Admin edits to a listing's trust/visibility fields (/api/admin/listings/[type]/[id]).
// `.refine` rejects an empty body so a no-op PATCH doesn't write an audit entry saying nothing
// happened.
export const listingAdminUpdateSchema = z
  .object({
    status: z.enum(['DRAFT', 'ACTIVE', 'PENDING', 'SUSPENDED']).optional(),
    isVerified: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.isVerified !== undefined || v.isFeatured !== undefined, {
    message: 'Nothing to update',
  });

// Superadmin edit to the single system_settings/global doc (/api/admin/settings). Every field is
// optional so the admin settings form can PATCH just the section it changed.
const localizedStringSchema = z.object({ ar: z.string(), en: z.string() });

export const systemSettingsUpdateSchema = z.object({
  siteName: localizedStringSchema.optional(),
  contactEmail: z.string().trim().max(200).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  contactWhatsApp: z.string().trim().max(30).optional(),
  exchangeRateUsdToIqd: z.number().positive().optional(),
  emergencyAnnouncement: z.object({
    enabled: z.boolean(),
    text: localizedStringSchema,
    level: z.enum(['INFO', 'WARNING', 'ALERT']),
  }).optional(),
});

export const admissionDecisionSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED']),
  decisionNote: z.string().trim().max(2000).optional(),
});

export const tutorBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
});

// Shared by every booking-thread message route (tutor and student sides).
export const threadMessageSchema = z.object({
  text: z.string().trim().min(1),
  senderName: z.string().trim().max(100).optional(),
});

// Same as threadMessageSchema, plus phone — for the guest (unauthenticated) inquiry-thread route,
// which verifies identity by phone number in the body rather than a session.
export const guestThreadMessageSchema = threadMessageSchema.extend({
  phone: z.string().trim().min(1),
});

export const inquiryThreadMessageSchema = threadMessageSchema.extend({
  phone: z.string().trim().min(1).optional(),
});

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().min(1),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

export const createConversationSchema = z.object({
  recipientId: z.string().min(1),
  recipientRole: z.enum(['student', 'tutor', 'institution', 'employer', 'admin']),
  recipientName: z.string().min(1).max(100),
  recipientPhone: z.string().optional(),
  context: z.object({
    type: z.enum(['tutor', 'institution', 'booking']).optional(),
    title: z.string().optional(),
    id: z.string().optional(),
  }).optional(),
});

export const clientErrorReportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(4000).optional(),
  url: z.string().max(500).optional(),
  severity: z.enum(['warning', 'error', 'fatal']).optional(),
});

export const sessionLoginSchema = z.object({
  idToken: z.string().min(1),
});

export const studentSignupSchema = z.object({
  idToken: z.string().min(1),
  fullName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});

export const admissionApplicationSchema = z.object({
  institutionId: z.string().min(1),
  programId: z.string().min(1),
  message: z.string().trim().max(3000).optional(),
  documentUrls: z.array(z.string()).max(10).optional(),
});
