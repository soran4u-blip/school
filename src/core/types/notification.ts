export type NotificationType =
  | 'CHAT_MESSAGE'
  | 'BOOKING_REQUEST'
  | 'BOOKING_STATUS'
  // A student applying to a program (institution-facing); ADMISSION_DECISION is the reply.
  | 'ADMISSION_APPLICATION'
  | 'ADMISSION_DECISION'
  | 'JOB_APPLICATION'
  | 'INQUIRY'
  | 'REVIEW'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: 'student' | 'tutor' | 'institution' | 'employer' | 'admin';
  type: NotificationType;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  linkUrl: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    conversationId?: string;
    bookingId?: string;
    senderName?: string;
    senderRole?: string;
    [key: string]: unknown;
  };
}
