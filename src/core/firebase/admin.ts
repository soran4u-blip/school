import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

try {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'school-4bcd6',
      });
    } else {
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'school-4bcd6',
      });
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    const DB_NAME = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb';
    adminDb = getFirestore(app, DB_NAME);
    adminAuth = getAuth(app);
  }
} catch (error) {
  console.warn('Firebase Admin SDK notice:', error);
}

export { app, adminDb, adminAuth };
