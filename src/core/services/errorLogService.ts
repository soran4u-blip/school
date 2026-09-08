import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { ErrorLog } from '../types/errorLog';

// Superadmin-only, per firestore.rules — client SDK read is fine here since writes are already
// locked to the Admin SDK.
export async function getRecentErrorLogs(max = 200): Promise<ErrorLog[]> {
  const q = query(collection(db, 'errorLogs'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ErrorLog));
}

export async function deleteErrorLog(id: string): Promise<void> {
  await deleteDoc(doc(db, 'errorLogs', id));
}
