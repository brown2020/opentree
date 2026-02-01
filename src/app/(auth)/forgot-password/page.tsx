'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { resetPassword } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    try {
      await resetPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      if (message.includes('user-not-found')) {
        // Don't reveal if user exists - still show success
        setSubmitted(true);
      } else if (message.includes('too-many-requests')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError(message);
      }
    }
  };

  if (submitted) {
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
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            If an account exists for <strong>{emailValue}</strong>, we sent a
            password reset link. Check your inbox and spam folder.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full">Back to login</Button>
          </Link>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-emerald-600 hover:text-emerald-500"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Forgot your password?
      </h2>
      <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

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

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
}
