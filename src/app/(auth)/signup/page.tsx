import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up - OpenTree',
  description: 'Create your OpenTree account',
};

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Create your account
      </h2>
      <SignupForm />
    </>
  );
}
