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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// ============ Email/Password Auth ============

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(user, { displayName });

  // Send verification email
  await sendEmailVerification(user);

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email?.toLowerCase() ?? '',
    displayName,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

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
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

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
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

export function getStoredEmailForSignIn(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('emailForSignIn');
}

// ============ Email Verification ============

export async function sendVerificationEmail(user: FirebaseUser): Promise<void> {
  await sendEmailVerification(user);
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
