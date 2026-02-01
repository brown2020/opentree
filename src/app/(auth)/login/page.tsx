import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In - OpenTree',
  description: 'Sign in to your OpenTree account',
};

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome back
      </h2>
      <LoginForm />
    </>
  );
}
