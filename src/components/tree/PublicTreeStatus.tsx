'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function PublicTreeLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function PublicTreeNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tree not found</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This tree may be private or the link is incorrect.
      </p>
      <Link href="/signup" className="mt-6">
        <Button>Create your own tree</Button>
      </Link>
    </div>
  );
}

export function PublicTreePrivate() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">This tree is private</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        The owner has not made this tree publicly viewable. Log in if you have
        been invited as a member.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/login"><Button variant="outline">Log in</Button></Link>
        <Link href="/signup"><Button>Sign up free</Button></Link>
      </div>
    </div>
  );
}
