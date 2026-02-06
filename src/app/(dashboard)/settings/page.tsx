'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type ThemePreference = 'system' | 'light' | 'dark';

export default function SettingsPage() {
  const { user } = useAuth();

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Photo state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<ThemePreference>('system');

  // Check from Firebase auth directly (providerData isn't in our User type)
  const isPasswordUser = auth.currentUser?.providerData.some(
    (p) => p.providerId === 'password'
  );

  const loadTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('theme') as ThemePreference | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoURL || null);
    }
    loadTheme();
  }, [user, loadTheme]);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });

      // Update Firestore user doc too
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp(),
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be smaller than 5MB');
      return;
    }

    setPhotoUploading(true);
    setProfileError(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `users/${auth.currentUser.uid}/profile.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: url });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      });

      setPhotoUrl(url);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to upload photo'
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
          setPasswordError('Current password is incorrect');
        } else {
          setPasswordError(err.message);
        }
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme);
    if (typeof window === 'undefined') return;

    localStorage.setItem('theme', newTheme);

    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const initials =
    user.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profile
          </h2>

          {/* Photo */}
          <div className="mb-6 flex items-center gap-4">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt="Profile"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white ring-2 ring-gray-200 dark:ring-gray-700">
                {initials}
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  {photoUploading ? 'Uploading...' : 'Change Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                {user.email}
              </p>
            </div>

            {profileError && (
              <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Profile updated successfully.
              </p>
            )}

            <Button
              onClick={handleSaveProfile}
              loading={profileSaving}
              disabled={!displayName.trim() || displayName.trim() === user.displayName}
            >
              Save Profile
            </Button>
          </div>
        </section>

        {/* Password Section (only for email/password users) */}
        {isPasswordUser && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Change Password
            </h2>

            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />

              {passwordError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Password changed successfully.
                </p>
              )}

              <Button
                onClick={handleChangePassword}
                loading={passwordSaving}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Change Password
              </Button>
            </div>
          </section>
        )}

        {/* Theme Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Appearance
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {(['system', 'light', 'dark'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleThemeChange(opt)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  theme === opt
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  {opt === 'system' && (
                    <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {opt === 'light' && (
                    <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {opt === 'dark' && (
                    <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
