import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAKhjvTJemiFRhl-xxGNtOxbkqkjZTJe5A',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'school-4bcd6.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'school-4bcd6',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'school-4bcd6.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '100385437421',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:100385437421:web:7c4a4f7c56ea93e379bee4',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-CNN53515TM',
};

// Singleton instance initialization
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use named Firestore database 'schooldb'
const DB_NAME = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb';
const db: Firestore = initializeFirestore(app, {}, DB_NAME);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, auth, storage, firebaseConfig };
