const FIREBASE_CODE = /\((auth\/[a-z0-9-]+)\)/i;

export function firebaseErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && code.startsWith('auth/')) return code;
  }
  if (error instanceof Error) {
    const match = error.message.match(FIREBASE_CODE);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

/**
 * A continue URL on an unlisted host (a Vercel preview, for example) makes
 * Firebase reject the whole send. Dropping the continue URL lets the message
 * go out through the default handler.
 */
export function shouldRetryVerificationWithoutContinueUrl(
  error: unknown,
  continueUrl: string | null | undefined
): boolean {
  if (!continueUrl) return false;
  return firebaseErrorCode(error) === 'auth/unauthorized-continue-uri';
}

export function verificationContinueUrl(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return `${url.origin}/verify-email`;
  } catch {
    return null;
  }
}

export function authErrorMessage(error: unknown): string {
  switch (firebaseErrorCode(error)) {
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not available on this address. This site is not in the Firebase authorized domains list. Use email and password, or open the primary site.';
    case 'auth/unauthorized-continue-uri':
      return 'This site is not allowed as the link inside the verification email, so the email was not sent.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/network-request-failed':
      return 'The request did not finish. Check your connection and try again.';
    default:
      if (error instanceof Error && error.message.trim()) return error.message;
      return 'Something went wrong. Please try again.';
  }
}
