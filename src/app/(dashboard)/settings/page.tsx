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
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  SettingsProfilePanel,
  SettingsPasswordPanel,
  SettingsThemePanel,
} from '@/components/settings/SettingsPanels';

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

      const storeUser = useAuthStore.getState().user;
      if (storeUser) {
        useAuthStore.getState().setUser({
          ...storeUser,
          displayName: displayName.trim(),
        });
      }

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
      const storagePath = `users/${auth.currentUser.uid}/profile/avatar.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: url });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      });

      setPhotoUrl(url);

      const storeUser = useAuthStore.getState().user;
      if (storeUser) {
        useAuthStore.getState().setUser({ ...storeUser, photoURL: url });
      }
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
        <SettingsProfilePanel
          photoUrl={photoUrl}
          initials={initials}
          photoUploading={photoUploading}
          displayName={displayName}
          email={user.email}
          profileError={profileError}
          profileSuccess={profileSuccess}
          profileSaving={profileSaving}
          userDisplayName={user.displayName}
          onPhotoUpload={handlePhotoUpload}
          onDisplayNameChange={setDisplayName}
          onSaveProfile={handleSaveProfile}
        />

        {isPasswordUser && (
          <SettingsPasswordPanel
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            passwordError={passwordError}
            passwordSuccess={passwordSuccess}
            passwordSaving={passwordSaving}
            onCurrent={setCurrentPassword}
            onNew={setNewPassword}
            onConfirm={setConfirmPassword}
            onChangePassword={handleChangePassword}
          />
        )}

        <SettingsThemePanel theme={theme} onThemeChange={handleThemeChange} />
      </div>
    </div>
  );
}
