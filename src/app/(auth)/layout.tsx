import { GuestGuard } from '@/components/auth/GuestGuard';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-600">OpenTree</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build your family tree
          </p>
        </div>
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          {children}
        </div>
      </div>
    </GuestGuard>
  );
}
