import { deleteCookie } from "cookies-next";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  reload,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { rememberVerificationEmailSent } from '@/lib/auth/verificationNotice';
import { auth, db } from './config';
import { verificationContinueUrl } from './authErrors';
import { deliverVerificationEmail } from './verificationEmail';

const googleProvider = new GoogleAuthProvider();

// ============ Email/Password Auth ============

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(user, { displayName });

  // Profile and directory docs wait until the email is verified. Writing them
  // now fails: the ID token omits email until then, and /verify-email would
  // surface that Firestore denial.
  await sendVerificationEmail(user);

  return user;
}

export async function signIn(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signOut(): Promise<void> {
  // Explicitly delete auth cookies before signing out
  deleteCookie("authToken", { path: "/" });
  deleteCookie("__session", { path: "/" });

  // Clear localStorage auth artifacts
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("emailForSignIn");
  }

  await firebaseSignOut(auth);
}

// ============ Google Auth ============

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const { user } = await signInWithPopup(auth, googleProvider);

  // Check if user document exists, create if not
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email?.toLowerCase() ?? '',
      displayName: user.displayName ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await ensureUserDirectory(user);

  return user;
}

// ============ Email Link (Passwordless) Auth ============

function getActionCodeSettings() {
  return {
    url: typeof window !== 'undefined' ? `${window.location.origin}/email-link` : '',
    handleCodeInApp: true,
  };
}

export async function sendEmailLinkSignIn(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
  // Store email in localStorage for later retrieval
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email);
  }
}

export function isEmailLinkSignIn(link: string): boolean {
  return isSignInWithEmailLink(auth, link);
}

export async function completeEmailLinkSignIn(
  email: string,
  link: string
): Promise<FirebaseUser> {
  const { user } = await firebaseSignInWithEmailLink(auth, email, link);

  // Clear stored email
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('emailForSignIn');
  }

  // Check if user document exists, create if not
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email?.toLowerCase() ?? '',
      displayName: user.email?.split('@')[0] || 'User',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await ensureUserDirectory(user);

  return user;
}

export async function ensureOwnUserDoc(user: FirebaseUser): Promise<void> {
  const email = user.email?.trim().toLowerCase() ?? '';
  if (!email) return;

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  await setDoc(userRef, {
    email,
    displayName: user.displayName ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function ensureUserDirectory(user: FirebaseUser): Promise<void> {
  const email = user.email?.trim().toLowerCase() ?? '';
  if (!email) return;

  const directoryRef = doc(db, 'userDirectory', email);
  const existing = await getDoc(directoryRef);
  const displayName = user.displayName ?? null;

  if (!existing.exists()) {
    await setDoc(directoryRef, {
      uid: user.uid,
      email,
      displayName,
    });
    return;
  }

  if (existing.data().uid === user.uid && existing.data().displayName !== displayName) {
    await updateDoc(directoryRef, { displayName });
  }
}

export async function clearStoredProfilePhotoUrl(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists() || !Object.prototype.hasOwnProperty.call(snap.data(), 'photoURL')) return;
  await updateDoc(userRef, {
    photoURL: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export function getStoredEmailForSignIn(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('emailForSignIn');
}

// ============ Email Verification ============

let verificationSend: Promise<void> | null = null;

export async function sendVerificationEmail(user: FirebaseUser): Promise<void> {
  if (verificationSend) return verificationSend;

  const continueUrl =
    typeof window === 'undefined' ? null : verificationContinueUrl(window.location.origin);
  const run = deliverVerificationEmail(user, continueUrl, sendEmailVerification).then(() => {
    rememberVerificationEmailSent();
  });
  verificationSend = run.finally(() => {
    verificationSend = null;
  });
  return verificationSend;
}

export async function refreshUserEmailVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  await reload(user);
  return user.emailVerified;
}

export function isUserEmailVerified(user: FirebaseUser | null): boolean {
  if (!user) return false;
  // Google users are always verified
  const isGoogleUser = user.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );
  return isGoogleUser || user.emailVerified;
}

// ============ Password Reset ============

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ============ Auth State ============

export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
