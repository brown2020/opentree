const SENT_KEY = 'ot-verify-email-sent';
const ERROR_KEY = 'ot-verify-email-error';

export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

export const VERIFICATION_RATE_LIMIT_MESSAGE =
  'Too many verification emails were requested. Please wait a minute before using Resend.';

export function isVerificationRateLimitMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return /too many/i.test(message) || /too-many-requests/i.test(message);
}

export function presentVerificationError(message: string): string {
  return isVerificationRateLimitMessage(message) ? VERIFICATION_RATE_LIMIT_MESSAGE : message;
}

export function resendCooldownSeconds(availableAt: number | null, now: number): number {
  if (availableAt == null || !Number.isFinite(availableAt) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.ceil((availableAt - now) / 1000));
}

export interface NoticeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): NoticeStorage | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

export function rememberVerificationEmailSent(storage: NoticeStorage | null = defaultStorage()): void {
  storage?.setItem(SENT_KEY, '1');
  storage?.removeItem(ERROR_KEY);
}

export function rememberVerificationEmailError(
  message: string,
  storage: NoticeStorage | null = defaultStorage()
): void {
  storage?.setItem(ERROR_KEY, message);
  storage?.removeItem(SENT_KEY);
}

export function readVerificationEmailNotice(
  storage: NoticeStorage | null = defaultStorage()
): { sent: boolean; error: string | null } {
  if (!storage) return { sent: false, error: null };
  const error = storage.getItem(ERROR_KEY);
  return {
    sent: storage.getItem(SENT_KEY) === '1',
    error: error && error.trim() ? error : null,
  };
}
