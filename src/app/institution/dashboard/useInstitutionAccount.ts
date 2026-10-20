'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useT } from '@/lib/useT';
import { saveInstitution, deleteInstitution } from '@/core/services/institutionService';
import { Institution } from '@/core/types/institution';
import { INSTITUTION_COPY } from './Institution.i18n';

type Notice = { text: string; type: 'success' | 'error' };

// Account management for the Profile tab: change password, pause/resume the listing, and delete
// the account. Kept out of the dashboard page so that file stays about loading and saving data.
export function useInstitutionAccount({
  institution,
  institutionId,
  setInstitution,
  setMessage,
}: {
  institution: Institution | null;
  institutionId: string | null;
  setInstitution: (institution: Institution) => void;
  setMessage: (message: Notice | null) => void;
}) {
  const router = useRouter();
  const t = useT(INSTITUTION_COPY);
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
      setPasswordMessage({ text: t('passwordTooShort'), type: 'error' });
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

  // Pause/resume only. A PENDING profile is one an admin hasn't approved yet, and this button
  // used to walk it straight to ACTIVE — self-publishing an unreviewed listing into the public
  // directory. firestore.rules now allows an owner to move only between ACTIVE and SUSPENDED, so
  // this mirrors that: approval is requested here and granted from /admin/institutions.
  const handleTogglePause = async () => {
    if (!institution || !['ACTIVE', 'SUSPENDED'].includes(institution.status)) return;
    const status = institution.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (status === 'SUSPENDED' && !confirm(t('pauseConfirm'))) {
      return;
    }
    setPausing(true);
    try {
      await saveInstitution({ ...institution, status });
      setInstitution({ ...institution, status });
      setMessage({
        text: status === 'SUSPENDED' ? t('profilePaused') : t('profileResumed'),
        type: 'success',
      });
    } catch {
      setMessage({ text: t('statusUpdateFailed'), type: 'error' });
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email || !institutionId) return;
    setDeleteError('');

    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    setDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteInstitution(institutionId);
      await deleteUser(user);
      router.push('/');
    } catch {
      setDeleteError(t('incorrectPassword'));
    } finally {
      setDeletingAccount(false);
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
