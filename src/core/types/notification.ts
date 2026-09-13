export type NotificationType =
  | 'CHAT_MESSAGE'
  | 'BOOKING_REQUEST'
  | 'BOOKING_STATUS'
  | 'ADMISSION_DECISION'
  | 'JOB_APPLICATION'
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
