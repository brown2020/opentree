'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/firebase/auth';
import { waitForAuthHydration } from '@/lib/auth/session';
import { signupSchema, type SignupFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialLoginButtons } from './SocialLoginButtons';

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    try {
      await signUp(data.email, data.password, data.displayName);
      try {
        await waitForAuthHydration();
      } catch {
        // AuthProvider may still be syncing.
      }
      router.push('/verify-email');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account';
      if (message.includes('email-already-in-use')) {
        setError('An account with this email already exists');
      } else if (message.includes('weak-password')) {
        setError('Password is too weak');
      } else {
        setError(message);
      }
    }
  };

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
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create Account
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
