import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// For uploads where the uploader (e.g. a guest job applicant) has write access to the path but
// no read access to it under storage.rules — calling getDownloadURL() right after upload would
// 403 (it needs to read the object's metadata to fetch its token). Just upload and hand back the
// path; whoever actually has read rights (e.g. the institution reviewing the application) resolves
// the real download URL themselves via resolveDownloadURL(), reusing the token Storage already
// generated on the object at creation time regardless of who could read it back.
export async function uploadFileOnly(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return path;
}

export async function resolveDownloadURL(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}
