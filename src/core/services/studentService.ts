import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/core/firebase/config';
import { Student } from '@/core/types/student';

export async function getStudent(uid: string): Promise<Student | null> {
  const snap = await getDoc(doc(db, 'students', uid));
  return snap.exists() ? (snap.data() as Student) : null;
}

// Profile fields only — fullName/phone/email are set at signup and not editable here.
export async function saveStudentProfile(
  uid: string,
  profile: { school?: string; studentLevelId?: string; subjectIds: string[] }
): Promise<void> {
  await setDoc(
    doc(db, 'students', uid),
    { ...profile, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
