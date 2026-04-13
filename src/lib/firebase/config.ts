import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } | null {
  if (!firebaseConfig.apiKey) return null;
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
}

const firebase = initFirebase();

export const auth = firebase?.auth as Auth;
export const db = firebase?.db as Firestore;
export const storage = firebase?.storage as FirebaseStorage;
export default firebase?.app as FirebaseApp;
