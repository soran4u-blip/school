export interface Student {
  id: string; // == Firebase Auth uid
  userId: string;
  fullName: string;
  phone: string;
  email: string;

  school?: string;
  studentLevelId?: string; // taxonomy id, type STUDENT_LEVEL
  subjectIds: string[]; // taxonomy ids, type SUBJECT — subjects of interest

  createdAt: string;
  updatedAt: string;
}
