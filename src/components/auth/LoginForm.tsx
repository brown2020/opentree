'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, sendEmailLinkSignIn } from '@/lib/firebase/auth';
import { loginSchema, type LoginFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialLoginButtons } from './SocialLoginButtons';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [sendingEmailLink, setSendingEmailLink] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email');

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      if (message.includes('invalid-credential')) {
        setError('Invalid email or password');
      } else if (message.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(message);
      }
    }
  };

  const handleSendEmailLink = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setSendingEmailLink(true);

    try {
      await sendEmailLinkSignIn(emailValue);
      setEmailLinkSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send sign-in link';
      setError(message);
    } finally {
      setSendingEmailLink(false);
    }
  };

  if (emailLinkSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg
            className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Check your email
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a sign-in link to <strong>{emailValue}</strong>. Click the link
          in the email to sign in.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEmailLinkSent(false)}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SocialLoginButtons onError={setError} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign In
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleSendEmailLink}
            disabled={sendingEmailLink}
            className="text-emerald-600 hover:text-emerald-500 disabled:opacity-50"
          >
            {sendingEmailLink ? 'Sending...' : 'Send me a sign-in link'}
          </button>
          <Link
            href="/forgot-password"
            className="text-emerald-600 hover:text-emerald-500"
          >
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
