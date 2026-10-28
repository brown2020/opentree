'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  sendVerificationEmail,
  refreshUserEmailVerified,
  getCurrentUser,
  ensureOwnUserDoc,
  ensureUserDirectory,
} from '@/lib/firebase/auth';
import { authErrorMessage } from '@/lib/firebase/authErrors';
import { resolvePendingInvitesForUser } from '@/lib/firebase/members';
import {
  syncAuthSessionCookie,
  completeClientSignOut,
} from '@/lib/auth/session';
import {
  VERIFICATION_RESEND_COOLDOWN_MS,
  isVerificationRateLimitMessage,
  presentVerificationError,
  readVerificationEmailNotice,
  rememberVerificationEmailError,
  resendCooldownSeconds,
} from '@/lib/auth/verificationNotice';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

export default function VerifyEmailPage() {
  const { user, emailVerified, initialized } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const redirectingRef = useRef(false);
  const autoSendStarted = useRef(false);
  const cooldownSeconds = resendCooldownSeconds(resendAvailableAt, now);

  const beginResendCooldown = useCallback(() => {
    setResendAvailableAt(Date.now() + VERIFICATION_RESEND_COOLDOWN_MS);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (resendAvailableAt == null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);

  useEffect(() => {
    if (!initialized || redirectingRef.current) return;

    if (!user) {
      redirectingRef.current = true;
      window.location.replace('/login');
      return;
    }

    if (emailVerified) {
      redirectingRef.current = true;
      void (async () => {
        const current = getCurrentUser();
        if (current) {
          try {
            await ensureOwnUserDoc(current);
          } catch {
            // The profile is created again on the next verified session.
          }
          try {
            await ensureUserDirectory(current);
          } catch {
            // Directory lookup stays best-effort.
          }
        }
        try {
          await syncAuthSessionCookie(user, true);
        } catch {
          /* continue */
        }
        window.location.replace('/');
      })();
    }
  }, [initialized, user, emailVerified]);

  const handleResendEmail = useCallback(async () => {
    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError('You are not signed in. Please log in again.');
        return;
      }
      await sendVerificationEmail(currentUser);
      setMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (err) {
      const message = presentVerificationError(authErrorMessage(err));
      rememberVerificationEmailError(message);
      setError(message);
      if (isVerificationRateLimitMessage(message)) beginResendCooldown();
    } finally {
      setSending(false);
    }
  }, [beginResendCooldown]);

  useEffect(() => {
    if (!initialized || !user || emailVerified || autoSendStarted.current) return;
    const notice = readVerificationEmailNotice();
    if (notice.error) {
      const shown = presentVerificationError(notice.error);
      setError(shown);
      if (isVerificationRateLimitMessage(shown)) beginResendCooldown();
      return;
    }
    if (notice.sent) {
      setMessage('Verification email sent. Check your inbox and spam folder.');
      return;
    }
    autoSendStarted.current = true;
    void handleResendEmail();
  }, [initialized, user, emailVerified, handleResendEmail, beginResendCooldown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);

    try {
      const isVerified = await refreshUserEmailVerified();
      if (isVerified) {
        useAuthStore.getState().setEmailVerified(true);
        const current = useAuthStore.getState().user;
        if (current) {
          try {
            await syncAuthSessionCookie(current, true);
          } catch {
            /* continue to home */
          }
          if (current.email) {
            void resolvePendingInvitesForUser(
              current.uid,
              current.email,
              current.displayName
            );
          }
        }
        window.location.assign('/');
      } else {
        setError('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await completeClientSignOut();
    } catch {
      window.location.assign('/login');
    }
  };

  if (!initialized || !user || emailVerified) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg
          className="h-8 w-8 text-emerald-700 dark:text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {sending
            ? 'Sending a verification email to'
            : message
              ? 'We sent a verification email to'
              : 'Verification is still needed for'}
        </p>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {user.email}
        </p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {message
          ? 'Click the link in that email to verify your account.'
          : 'Use the button below to send the verification email, then click the link in the message.'}
      </p>

      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          className="w-full"
          onClick={handleCheckVerification}
          loading={checking}
        >
          I&apos;ve verified my email
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendEmail}
          loading={sending}
          disabled={cooldownSeconds > 0}
        >
          {cooldownSeconds > 0
            ? `Resend in ${cooldownSeconds}s`
            : message
              ? 'Resend verification email'
              : 'Send verification email'}
        </Button>

        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
