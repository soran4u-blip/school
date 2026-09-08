export interface ErrorLog {
  id: string;
  source: 'client' | 'server';
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  role?: string; // custom claim role of whoever hit this, if known (student/tutor/institution/...)
  createdAt: string;
}
