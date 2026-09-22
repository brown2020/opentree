'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ThemePreference = 'system' | 'light' | 'dark';

export function SettingsProfilePanel(props: {
  photoUrl: string | null;
  initials: string;
  photoUploading: boolean;
  displayName: string;
  email: string | null | undefined;
  profileError: string | null;
  profileSuccess: boolean;
  profileSaving: boolean;
  userDisplayName: string | null | undefined;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDisplayNameChange: (v: string) => void;
  onSaveProfile: () => void;
}) {
  const p = props;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
      <div className="mb-6 flex items-center gap-4">
        {p.photoUrl ? (
          <Image src={p.photoUrl} alt="Profile" width={64} height={64}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white ring-2 ring-gray-200 dark:ring-gray-700">
            {p.initials}
          </div>
        )}
        <div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              {p.photoUploading ? 'Uploading...' : 'Change Photo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={p.onPhotoUpload} disabled={p.photoUploading} />
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG, or WebP. Max 5MB.</p>
        </div>
      </div>
      <div className="space-y-4">
        <Input label="Display Name" value={p.displayName} onChange={(e) => p.onDisplayNameChange(e.target.value)} />
        <div>
          <div className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</div>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {p.email}
          </p>
        </div>
        {p.profileError && <p className="text-sm text-red-600 dark:text-red-400">{p.profileError}</p>}
        {p.profileSuccess && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile updated successfully.</p>
        )}
        <Button onClick={p.onSaveProfile} loading={p.profileSaving}
          disabled={!p.displayName.trim() || p.displayName.trim() === p.userDisplayName}>
          Save Profile
        </Button>
      </div>
    </section>
  );
}

export function SettingsPasswordPanel(props: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string | null;
  passwordSuccess: boolean;
  passwordSaving: boolean;
  onCurrent: (v: string) => void;
  onNew: (v: string) => void;
  onConfirm: (v: string) => void;
  onChangePassword: () => void;
}) {
  const p = props;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
      <div className="space-y-4">
        <Input label="Current Password" type="password" value={p.currentPassword}
          onChange={(e) => p.onCurrent(e.target.value)} placeholder="Enter current password" />
        <Input label="New Password" type="password" value={p.newPassword}
          onChange={(e) => p.onNew(e.target.value)} placeholder="At least 8 characters" />
        <Input label="Confirm New Password" type="password" value={p.confirmPassword}
          onChange={(e) => p.onConfirm(e.target.value)} placeholder="Re-enter new password" />
        {p.passwordError && <p className="text-sm text-red-600 dark:text-red-400">{p.passwordError}</p>}
        {p.passwordSuccess && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Password changed successfully.</p>
        )}
        <Button onClick={p.onChangePassword} loading={p.passwordSaving}
          disabled={!p.currentPassword || !p.newPassword || !p.confirmPassword}>
          Change Password
        </Button>
      </div>
    </section>
  );
}

export function SettingsThemePanel(props: {
  theme: ThemePreference;
  onThemeChange: (t: ThemePreference) => void;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
      <div className="grid grid-cols-3 gap-3">
        {(['system', 'light', 'dark'] as const).map((opt) => (
          <button key={opt} onClick={() => props.onThemeChange(opt)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              props.theme === opt
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              {opt === 'system' && (
                <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {opt === 'light' && (
                <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              {opt === 'dark' && (
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{opt}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
