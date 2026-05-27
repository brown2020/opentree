'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  isEmailLinkSignIn,
  completeEmailLinkSignIn,
  getStoredEmailForSignIn,
} from '@/lib/firebase/auth';
import { navigateAfterSignIn } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

export default function EmailLinkPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const signInAttempted = useRef(false);

  useEffect(() => {
    const handleEmailLink = async () => {
      if (signInAttempted.current) return;
      signInAttempted.current = true;

      // Check if this is a valid email link
      const link = window.location.href;
      if (!isEmailLinkSignIn(link)) {
        setError('Invalid sign-in link. Please request a new one.');
        setProcessing(false);
        return;
      }

      // Try to get email from localStorage
      const storedEmail = getStoredEmailForSignIn();
      if (storedEmail) {
        try {
          await completeEmailLinkSignIn(storedEmail, link);
          await navigateAfterSignIn(router);
        } catch (err) {
          signInAttempted.current = false;
          const message = err instanceof Error ? err.message : 'Failed to sign in';
          if (message.includes('invalid-action-code')) {
            setError('This sign-in link has expired or already been used. Please request a new one.');
          } else {
            setError(message);
          }
          setProcessing(false);
        }
      } else {
        // Need user to provide email
        signInAttempted.current = false;
        setNeedsEmail(true);
        setProcessing(false);
      }
    };

    handleEmailLink();
  }, [router]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const link = window.location.href;
      await completeEmailLinkSignIn(email, link);
      await navigateAfterSignIn(router);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      if (message.includes('invalid-action-code')) {
        setError('This sign-in link has expired or already been used. Please request a new one.');
      } else if (message.includes('invalid-email')) {
        setError('The email address does not match the one used to request this link.');
      } else {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  if (processing) {
    return <FullPageLoader />;
  }

  if (error && !needsEmail) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Unable to sign in
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>

        <Button className="w-full" onClick={() => router.push('/login')}>
          Back to login
        </Button>
      </div>
    );
  }

  if (needsEmail) {
    return (
      <>
        <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Confirm your email
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Please enter the email address you used to request the sign-in link.
        </p>

        <form onSubmit={handleSubmitEmail} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" className="w-full" loading={submitting}>
            Continue
          </Button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              Back to login
            </button>
          </p>
        </form>
      </>
    );
  }

  return <FullPageLoader />;
}
