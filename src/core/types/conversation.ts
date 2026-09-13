export interface ConversationParticipant {
  id: string; // Auth UID
  role: 'student' | 'tutor' | 'institution' | 'employer' | 'admin';
  name: string;
  phone?: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[]; // For query: array-contains current user UID
  participants: ConversationParticipant[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCounts: Record<string, number>; // { [userId]: number }
  createdAt: string;
  updatedAt: string;
  context?: {
    type?: 'tutor' | 'institution' | 'booking';
    title?: string;
    id?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'tutor' | 'institution' | 'employer' | 'admin';
  text: string;
  createdAt: string;
  readBy?: string[];
}
