'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  sendVerificationEmail,
  refreshUserEmailVerified,
  signOut,
  getCurrentUser,
} from '@/lib/firebase/auth';
import { syncAuthSessionCookie } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, emailVerified, initialized } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already verified or not logged in
  useEffect(() => {
    if (initialized) {
      if (!user) {
        router.replace('/login');
      } else if (emailVerified) {
        router.replace('/');
      }
    }
  }, [initialized, user, emailVerified, router]);

  const handleResendEmail = async () => {
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
      setMessage('Verification email sent! Check your inbox.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send email';
      if (msg.includes('too-many-requests')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  };

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
          syncAuthSessionCookie(current, true);
        }
        router.replace('/');
      } else {
        setError('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check verification status');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!initialized || !user || emailVerified) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg
          className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
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
          We sent a verification email to
        </p>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {user.email}
        </p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Click the link in the email to verify your account. If you don&apos;t see
        the email, check your spam folder.
      </p>

      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
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
          className="w-full"
          onClick={handleCheckVerification}
          loading={checking}
        >
          I&apos;ve verified my email
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResendEmail}
          loading={sending}
        >
          Resend verification email
        </Button>

        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
