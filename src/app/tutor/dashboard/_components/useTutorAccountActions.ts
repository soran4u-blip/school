'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useT } from '@/lib/useT';
import { saveTutor, deleteTutor } from '@/core/services/tutorService';
import { Tutor } from '@/core/types/tutor';
import { Booking } from '@/core/types/booking';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

type Notice = { text: string; type: 'success' | 'error' };

// Account-management actions of the tutor dashboard's Profile tab: change password, pause/resume
// the public profile, and delete the account. Owns the form state those actions need.
export function useTutorAccountActions({
  tutor,
  setTutor,
  tutorId,
  bookings,
  setMessage,
}: {
  tutor: Tutor | null;
  setTutor: (tutor: Tutor | null) => void;
  tutorId: string | null;
  bookings: Booking[];
  setMessage: (message: Notice | null) => void;
}) {
  const router = useRouter();
  const t = useT(TUTOR_DASHBOARD_COPY);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Notice | null>(null);
  const [pausing, setPausing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user?.email) return;
    if (newPassword.length < 6) {
      setPasswordMessage({ text: t('newPasswordShort'), type: 'error' });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage({ text: t('passwordChanged'), type: 'success' });
    } catch {
      setPasswordMessage({ text: t('currentPasswordWrong'), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email || !tutorId) return;
    setDeleteError('');

    if (!confirm(t('confirmDeleteAccount'))) {
      return;
    }

    setDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // Cancel any bookings still in play before the tutor doc disappears from under them. Goes
      // through the same API route as a normal cancel (rather than a direct client write) so the
      // participant students' bookingViews mirrors stay in sync too.
      await Promise.all(
        bookings
          .filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED')
          .map((b) =>
            fetch(`/api/tutor/bookings/${b.id}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'CANCELLED' }),
            })
          )
      );

      await deleteTutor(tutorId);
      await deleteUser(user);
      router.push('/');
    } catch {
      setDeleteError(t('incorrectPassword'));
    } finally {
      setDeletingAccount(false);
    }
  };

  // Pause/resume only, between ACTIVE and SUSPENDED. This used to toggle ACTIVE<->PENDING, which
  // conflated "paused by me" with "not yet approved by an admin" and let an unreviewed tutor
  // publish themselves into the directory. firestore.rules now permits an owner only the
  // ACTIVE<->SUSPENDED transition; approval happens in /admin/tutors.
  const handleTogglePause = async () => {
    if (!tutor || tutor.status === 'PENDING') return;
    const status = tutor.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (status === 'SUSPENDED' && !confirm(t('confirmPause'))) {
      return;
    }
    setPausing(true);
    try {
      await saveTutor({ ...tutor, status });
      setTutor({ ...tutor, status });
      setMessage({
        text: status === 'SUSPENDED'
          ? t('profilePaused')
          : t('profileResumed'),
        type: 'success',
      });
    } catch {
      setMessage({ text: t('statusUpdateFailed'), type: 'error' });
    } finally {
      setPausing(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    changingPassword,
    passwordMessage,
    handleChangePassword,
    pausing,
    handleTogglePause,
    deletePassword,
    setDeletePassword,
    deletingAccount,
    deleteError,
    handleDeleteAccount,
  };
}
