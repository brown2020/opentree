import type { ActionCodeSettings, User } from 'firebase/auth';
import { shouldRetryVerificationWithoutContinueUrl } from './authErrors';

type SendEmailVerification = (
  user: User,
  actionCodeSettings?: ActionCodeSettings
) => Promise<void>;

/**
 * Send a verification email. When a continue URL is rejected because its host
 * is not an authorized domain, retry once without action code settings so the
 * message still goes out.
 */
export async function deliverVerificationEmail(
  user: User,
  continueUrl: string | null,
  send: SendEmailVerification
): Promise<void> {
  if (!continueUrl) {
    await send(user);
    return;
  }

  try {
    await send(user, { url: continueUrl, handleCodeInApp: false });
  } catch (error) {
    if (!shouldRetryVerificationWithoutContinueUrl(error, continueUrl)) {
      throw error;
    }
    await send(user);
  }
}
