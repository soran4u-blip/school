'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates, getCategories, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutionById, saveInstitution, deleteInstitution, getInstitutionVerificationDocuments, saveInstitutionVerificationDocuments } from '@/core/services/institutionService';
import { getInstitutionInquiries, updateInquiryStatus, getApprovedReviews, replyToReview } from '@/core/services/reviewService';
import { getInstitutionJobs, getInstitutionJobApplications, updateJob, createJob } from '@/core/services/jobService';
import { getThreadMessages, sendInstitutionMessage } from '@/core/services/messagingService';
import Link from 'next/link';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Inquiry, Review } from '@/core/types/review';
import { Job } from '@/core/types/job';
import { ThreadMessage } from '@/core/types/message';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import { getInstitutionCompleteness } from '@/lib/utils';
import {
  Building2, Save, AlertCircle, Plus, Trash2, Send, Star, Mail, Phone,
  KeyRound, PauseCircle, PlayCircle, ShieldCheck, MessageCircle, Rocket,
  Briefcase, Users, ExternalLink,
} from 'lucide-react';

const EMPLOYMENT_LABELS: Record<Job['employmentType'], { ar: string; en: string }> = {
  FULL_TIME: { ar: 'دوام كامل', en: 'Full-time' },
  PART_TIME: { ar: 'دوام جزئي', en: 'Part-time' },
  CONTRACT: { ar: 'عقد', en: 'Contract' },
  INTERNSHIP: { ar: 'تدريب', en: 'Internship' },
};

function emptyJob(institutionId: string): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    institutionId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    employmentType: 'FULL_TIME',
    governorateId: '',
    isRemote: false,
    status: 'DRAFT',
  };
}

function emptyProgram(): InstitutionProgram {
  return {
    id: `prog-${Date.now()}`,
    name: { ar: '', en: '' },
    facultyName: { ar: '', en: '' },
    degreeLevelId: 'bachelor',
    tuitionAnnual: { amount: 0, currency: 'USD' },
    durationYears: 4,
    isActive: true,
  };
}

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'profile' | 'programs' | 'jobs' | 'inquiries' | 'reviews'>('profile');
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [facilitiesText, setFacilitiesText] = useState('');
  const [programs, setPrograms] = useState<InstitutionProgram[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicationCounts, setJobApplicationCounts] = useState<Record<string, number>>({});
  const [editingJob, setEditingJob] = useState<Job | Omit<Job, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [savingJob, setSavingJob] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);
  const [reviewReplyDrafts, setReviewReplyDrafts] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pausing, setPausing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult();
        const id = tokenResult.claims.institutionId as string | undefined;
        if (!id) return;
        setInstitutionId(id);
        const [inst, govs, cats, taxes, instInquiries, instReviews, verifDocs, instJobs, instApplications] = await Promise.all([
          getInstitutionById(id),
          getGovernorates(false),
          getCategories(false),
          getTaxonomies(undefined, false),
          getInstitutionInquiries(id),
          getApprovedReviews(id),
          getInstitutionVerificationDocuments(id),
          getInstitutionJobs(id),
          getInstitutionJobApplications(id),
        ]);
        setInstitution(inst);
        setFacilitiesText((inst?.facilities || []).join(', '));
        setPrograms(inst?.programs || []);
        setGovernorates(govs);
        setCategories(cats);
        setTaxonomies(taxes);
        setInquiries(instInquiries);
        setReviews(instReviews);
        setVerificationDocuments(verifDocs);
        setJobs(instJobs);
        const counts: Record<string, number> = {};
        for (const app of instApplications) counts[app.jobId] = (counts[app.jobId] || 0) + 1;
        setJobApplicationCounts(counts);
      } catch {
        setMessage({ text: t('تعذر تحميل بيانات لوحة التحكم', 'Failed to load dashboard data'), type: 'error' });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProgram = () => setPrograms([...programs, emptyProgram()]);
  const removeProgram = (id: string) => setPrograms(programs.filter((p) => p.id !== id));
  const updateProgram = (id: string, patch: Partial<InstitutionProgram>) =>
    setPrograms(programs.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const handleSave = async () => {
    if (!institution) return;
    setSaving(true);
    try {
      const updated: Institution = {
        ...institution,
        facilities: facilitiesText.split(',').map((f) => f.trim()).filter(Boolean),
        programs,
      };
      await Promise.all([
        saveInstitution(updated),
        saveInstitutionVerificationDocuments(institution.id, verificationDocuments),
      ]);
      setMessage({ text: t('تم حفظ التغييرات بنجاح', 'Changes saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ التغييرات', 'Failed to save changes'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleThread = async (inquiryId: string) => {
    if (expandedThreadId === inquiryId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(inquiryId);
    if (!threadMessages[inquiryId]) {
      setLoadingThreadId(inquiryId);
      try {
        const messages = await getThreadMessages(inquiryId);
        setThreadMessages((prev) => ({ ...prev, [inquiryId]: messages }));
      } finally {
        setLoadingThreadId(null);
      }
    }
  };

  const handleSendMessage = async (inquiry: Inquiry) => {
    const text = messageDrafts[inquiry.id]?.trim();
    if (!text || !institution) return;
    setSendingThreadId(inquiry.id);
    try {
      const sent = await sendInstitutionMessage(inquiry, institution.name.en || institution.name.ar, text);
      setThreadMessages((prev) => ({ ...prev, [inquiry.id]: [...(prev[inquiry.id] || []), sent] }));
      setMessageDrafts((prev) => ({ ...prev, [inquiry.id]: '' }));
      if (inquiry.status === 'NEW') {
        await updateInquiryStatus(inquiry.id, 'CONTACTED');
        setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? { ...i, status: 'CONTACTED' } : i)));
      }
    } finally {
      setSendingThreadId(null);
    }
  };

  const handleSaveJob = async () => {
    if (!editingJob || !institution) return;
    setSavingJob(true);
    try {
      if ('id' in editingJob) {
        await updateJob(editingJob.id, editingJob);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...editingJob } : j)));
      } else {
        const created = await createJob({
          ...editingJob,
          posterName: institution.name.en || institution.name.ar,
          posterLogoUrl: institution.logoUrl,
        });
        setJobs((prev) => [created, ...prev]);
      }
      setEditingJob(null);
      setMessage({ text: t('تم حفظ الوظيفة بنجاح', 'Job saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ الوظيفة', 'Failed to save the job'), type: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const handleJobStatus = async (jobId: string, status: Job['status']) => {
    await updateJob(jobId, { status });
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const handleInquiryStatus = async (inquiryId: string, status: Inquiry['status']) => {
    await updateInquiryStatus(inquiryId, status);
    setInquiries((prev) => prev.map((i) => (i.id === inquiryId ? { ...i, status } : i)));
  };

  const handleReplyToReview = async (reviewId: string) => {
    const text = reviewReplyDrafts[reviewId]?.trim();
    if (!text) return;
    setReplyingReviewId(reviewId);
    try {
      await replyToReview(reviewId, text);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: { text, createdAt: new Date().toISOString() } } : r)));
      setReviewReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    } finally {
      setReplyingReviewId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user?.email) return;
    if (newPassword.length < 6) {
      setPasswordMessage({ text: t('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'New password must be at least 6 characters'), type: 'error' });
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
      setPasswordMessage({ text: t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'), type: 'success' });
    } catch {
      setPasswordMessage({ text: t('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTogglePause = async () => {
    if (!institution) return;
    const wasPending = institution.status === 'PENDING';
    const status = institution.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (status === 'SUSPENDED' && !confirm(t('سيتم إخفاء ملف مؤسستك من الدليل العام. هل تريد المتابعة؟', "Your institution's profile will be hidden from the public directory. Continue?"))) {
      return;
    }
    setPausing(true);
    try {
      await saveInstitution({ ...institution, status });
      setInstitution({ ...institution, status });
      setMessage({
        text: status === 'SUSPENDED'
          ? t('تم إيقاف ملف مؤسستك مؤقتاً', 'Your institution profile is now paused')
          : wasPending
            ? t('تم نشر ملف مؤسستك في الدليل العام!', 'Your institution profile is now live in the public directory!')
            : t('تم تفعيل ملف مؤسستك مجدداً', 'Your institution profile is active again'),
        type: 'success',
      });
    } catch {
      setMessage({ text: t('تعذر تحديث حالة الملف', 'Failed to update profile status'), type: 'error' });
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email || !institutionId) return;
    setDeleteError('');

    if (!confirm(t(
      'سيتم حذف ملف مؤسستك وحسابك نهائياً ولن يظهر في الدليل العام بعد الآن. هذا الإجراء لا يمكن التراجع عنه.',
      "This will permanently delete your institution's profile and account — it will no longer appear in the public directory. This cannot be undone."
    ))) {
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
      setDeleteError(t('كلمة المرور غير صحيحة', 'Incorrect password'));
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  if (!institutionId || !institution) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 font-bold">
        {!institutionId
          ? t('لم يتم ربط هذا الحساب بملف مؤسسة. تواصل مع الإدارة.', 'This account is not linked to an institution profile. Contact the administrator.')
          : (message?.text || t('تعذر تحميل بيانات الملف. حاول تحديث الصفحة.', 'Failed to load your profile data. Try refreshing the page.'))}
      </div>
    );
  }

  const pendingInquiries = inquiries.filter((i) => i.status === 'NEW').length;
  const pendingReviewReplies = reviews.filter((r) => !r.reply).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">
          {language === 'en' ? institution.name.en : institution.name.ar}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t('إدارة ملف مؤسستك، البرامج، الاستفسارات، والتقييمات', 'Manage your institution profile, programs, inquiries, and reviews')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-lg">
        <button onClick={() => setTab('profile')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'profile' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الملف الشخصي', 'Profile')}
        </button>
        <button onClick={() => setTab('programs')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'programs' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('البرامج', 'Programs')}
        </button>
        <button onClick={() => setTab('jobs')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'jobs' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الوظائف', 'Jobs')}
        </button>
        <button onClick={() => setTab('inquiries')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'inquiries' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الاستفسارات', 'Inquiries')} {pendingInquiries > 0 && <span className="ms-1 text-amber-400">({pendingInquiries})</span>}
        </button>
        <button onClick={() => setTab('reviews')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'reviews' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('التقييمات', 'Reviews')} {pendingReviewReplies > 0 && <span className="ms-1 text-amber-400">({pendingReviewReplies})</span>}
        </button>
      </div>

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-sm text-slate-900">{t('البيانات الأساسية', 'Basic Details')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadField
                label={t('شعار المؤسسة', 'Institution Logo')}
                value={institution.logoUrl || ''}
                onChange={(url) => setInstitution({ ...institution, logoUrl: url })}
                pathPrefix={`institutions/${institution.id}`}
              />
              <ImageUploadField
                label={t('صورة الغلاف', 'Cover Image')}
                value={institution.coverImageUrl || ''}
                onChange={(url) => setInstitution({ ...institution, coverImageUrl: url })}
                pathPrefix={`institutions/${institution.id}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالعربية', 'Name (Arabic)')}</label>
                <input
                  type="text"
                  value={institution.name?.ar || ''}
                  onChange={(e) => setInstitution({ ...institution, name: { ...institution.name, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'Name (English)')}</label>
                <input
                  type="text"
                  value={institution.name?.en || ''}
                  onChange={(e) => setInstitution({ ...institution, name: { ...institution.name, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الشعار التعريفي بالعربية', 'Tagline (Arabic)')}</label>
                <input
                  type="text"
                  value={institution.tagline?.ar || ''}
                  onChange={(e) => setInstitution({ ...institution, tagline: { ...institution.tagline, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الشعار التعريفي بالإنجليزية', 'Tagline (English)')}</label>
                <input
                  type="text"
                  value={institution.tagline?.en || ''}
                  onChange={(e) => setInstitution({ ...institution, tagline: { ...institution.tagline, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالعربية', 'Description (Arabic)')}</label>
                <textarea
                  rows={3}
                  value={institution.description?.ar || ''}
                  onChange={(e) => setInstitution({ ...institution, description: { ...institution.description, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالإنجليزية', 'Description (English)')}</label>
                <textarea
                  rows={3}
                  value={institution.description?.en || ''}
                  onChange={(e) => setInstitution({ ...institution, description: { ...institution.description, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('العنوان', 'Address')}</label>
              <input
                type="text"
                value={institution.address?.ar || ''}
                onChange={(e) => setInstitution({ ...institution, address: { ar: e.target.value, en: institution.address?.en || '' } })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الفئة', 'Category')}</label>
                <select
                  value={institution.categoryId || ''}
                  onChange={(e) => setInstitution({ ...institution, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">{t('اختر الفئة', 'Select category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{language === 'en' ? c.name.en : c.name.ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('المحافظة', 'Governorate')}</label>
                <select
                  value={institution.governorateId || ''}
                  onChange={(e) => setInstitution({ ...institution, governorateId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
                <input
                  type="text"
                  value={institution.contact?.phonePrimary || ''}
                  onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, phonePrimary: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
                <input
                  type="text"
                  value={institution.contact?.whatsappNumber || ''}
                  onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, whatsappNumber: e.target.value } })}
                  placeholder="9647801234567"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
                <input
                  type="email"
                  value={institution.contact?.email || ''}
                  onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, email: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الموقع الإلكتروني', 'Website')}</label>
                <input
                  type="text"
                  value={institution.contact?.website || ''}
                  onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, website: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنة التأسيس', 'Established Year')}</label>
                <input
                  type="number"
                  value={institution.establishedYear || ''}
                  onChange={(e) => setInstitution({ ...institution, establishedYear: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('نظام الطلاب', 'Gender Policy')}</label>
                <select
                  value={institution.genderPolicy || 'CO_ED'}
                  onChange={(e) => setInstitution({ ...institution, genderPolicy: e.target.value as Institution['genderPolicy'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CO_ED">{t('مختلط', 'Co-Educational')}</option>
                  <option value="BOYS_ONLY">{t('طلاب فقط', 'Boys Only')}</option>
                  <option value="GIRLS_ONLY">{t('طالبات فقط', 'Girls Only')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأدنى للقسط', 'Tuition Min')}</label>
                <input
                  type="number"
                  value={institution.tuition?.min ?? 0}
                  onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, min: Number(e.target.value) } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأعلى للقسط', 'Tuition Max')}</label>
                <input
                  type="number"
                  value={institution.tuition?.max ?? 0}
                  onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, max: Number(e.target.value) } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('العملة', 'Currency')}</label>
                <select
                  value={institution.tuition?.currency || 'USD'}
                  onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, currency: e.target.value as 'IQD' | 'USD' } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="IQD">IQD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الدورية', 'Period')}</label>
                <select
                  value={institution.tuition?.period || 'YEAR'}
                  onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="YEAR">{t('سنوي', 'Yearly')}</option>
                  <option value="SEMESTER">{t('فصلي', 'Semester')}</option>
                  <option value="COURSE">{t('دورة', 'Course')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t('الاعتمادات والمناهج', 'Accreditations & Curricula')}</label>
              <div className="flex flex-wrap gap-2">
                {taxonomies.map((tax) => {
                  const checked = institution.taxonomyIds?.includes(tax.id) || false;
                  return (
                    <label
                      key={tax.id}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                        checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const ids = new Set(institution.taxonomyIds || []);
                          if (e.target.checked) ids.add(tax.id); else ids.delete(tax.id);
                          setInstitution({ ...institution, taxonomyIds: Array.from(ids) });
                        }}
                      />
                      {language === 'en' ? tax.name.en : tax.name.ar}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('المرافق (مفصولة بفاصلة)', 'Facilities (comma-separated)')}</label>
              <input
                type="text"
                value={facilitiesText}
                onChange={(e) => setFacilitiesText(e.target.value)}
                placeholder="Library, Sports Complex, Science Labs"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">{t('وثائق الاعتماد', 'Accreditation Documents')}</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('ارفع وثائق الاعتماد الرسمية لمساعدة الإدارة على توثيق مؤسستك — هذه الوثائق خاصة ولا تظهر للعامة.', "Upload official accreditation documents to help the admin verify your institution — these documents are private and never shown publicly.")}
            </p>
            <DocumentUploadField
              label=""
              value={verificationDocuments}
              onChange={setVerificationDocuments}
              pathPrefix={`institutions/${institution.id}/verification`}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}</span>
            </button>
          </div>

          {institution.status === 'PENDING' ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-sm text-slate-900">{t('نشر الملف في الدليل العام', 'Publish to the Directory')}</h2>
              </div>
              <p className="text-xs text-slate-500">
                {t(
                  'ملفك غير منشور بعد ولا يظهر لزوار الموقع. أكمل المعلومات التالية ثم انشره.',
                  "Your profile isn't published yet and can't be seen by visitors. Complete the following, then publish."
                )}
              </p>
              {(() => {
                const completeness = getInstitutionCompleteness(institution);
                if (completeness.complete) {
                  return (
                    <button
                      onClick={handleTogglePause}
                      disabled={pausing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{pausing ? t('جاري النشر...', 'Publishing...') : t('نشر الملف الآن', 'Publish Now')}</span>
                    </button>
                  );
                }
                return (
                  <div className="space-y-2">
                    <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                      {completeness.missingFields.map((f) => (
                        <li key={f.en} className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{t(f.ar, f.en)}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{t('أكمل المعلومات أعلاه أولاً', 'Complete the fields above first')}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                {institution.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
                <h2 className="font-bold text-sm text-slate-900">{t('ظهور الملف للعامة', 'Directory Visibility')}</h2>
              </div>
              <p className="text-xs text-slate-500">
                {institution.status === 'ACTIVE'
                  ? t('ملف مؤسستك ظاهر حالياً في الدليل العام.', "Your institution's profile is currently visible in the public directory.")
                  : t('ملف مؤسستك متوقف مؤقتاً ولن يظهر في الدليل العام.', "Your institution's profile is paused and hidden from the public directory.")}
              </p>
              <button
                onClick={handleTogglePause}
                disabled={pausing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60 ${
                  institution.status === 'ACTIVE' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                {institution.status === 'ACTIVE' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                <span>
                  {pausing ? t('جاري التحديث...', 'Updating...') : institution.status === 'ACTIVE' ? t('إيقاف الملف مؤقتاً', 'Pause Profile') : t('تفعيل الملف مجدداً', 'Resume Profile')}
                </span>
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-sm text-slate-900">{t('تغيير كلمة المرور', 'Change Password')}</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('كلمة المرور الحالية', 'Current Password')}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('كلمة المرور الجديدة', 'New Password')}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
              {passwordMessage && (
                <p className={`text-xs font-bold px-3 py-2 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {passwordMessage.text}
                </p>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-60"
              >
                {changingPassword ? t('جاري التغيير...', 'Changing...') : t('تحديث كلمة المرور', 'Update Password')}
              </button>
            </form>
          </div>

          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-sm text-rose-900">{t('منطقة الخطر', 'Danger Zone')}</h2>
            </div>
            <p className="text-xs text-rose-700">
              {t('حذف حساب مؤسستك نهائياً — سيُخفى الملف عن العامة. لا يمكن التراجع عن هذا الإجراء.', "Permanently delete your institution's account — the profile disappears from the directory. This cannot be undone.")}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-sm">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('كلمة المرور للتأكيد', 'Password to confirm')}
                className="flex-1 w-full px-3 py-2 text-xs border border-rose-200 rounded-lg"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || !deletePassword}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingAccount ? t('جاري الحذف...', 'Deleting...') : t('حذف الحساب نهائياً', 'Delete Account')}</span>
              </button>
            </div>
            {deleteError && (
              <p className="text-xs font-bold px-3 py-2 rounded-lg bg-rose-100 text-rose-800">{deleteError}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'programs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">{t('البرامج الأكاديمية والأقساط', 'Academic Programs & Tuition')}</h2>
            <button
              onClick={addProgram}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('إضافة برنامج', 'Add Program')}</span>
            </button>
          </div>

          {programs.length === 0 ? (
            <p className="text-[11px] text-slate-400">{t('لا توجد برامج مضافة بعد', 'No programs added yet')}</p>
          ) : (
            <div className="space-y-3">
              {programs.map((prog) => (
                <div key={prog.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t('اسم البرنامج (عربي)', 'Program name (Arabic)')}
                      value={prog.name.ar}
                      onChange={(e) => updateProgram(prog.id, { name: { ...prog.name, ar: e.target.value } })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder={t('اسم البرنامج (إنجليزي)', 'Program name (English)')}
                      value={prog.name.en}
                      onChange={(e) => updateProgram(prog.id, { name: { ...prog.name, en: e.target.value } })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder={t('الكلية', 'Faculty')}
                      value={prog.facultyName.en}
                      onChange={(e) => updateProgram(prog.id, { facultyName: { ar: e.target.value, en: e.target.value } })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder={t('عدد السنوات', 'Years')}
                      value={prog.durationYears}
                      onChange={(e) => updateProgram(prog.id, { durationYears: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      placeholder={t('القسط السنوي', 'Annual Tuition')}
                      value={prog.tuitionAnnual.amount}
                      onChange={(e) => updateProgram(prog.id, { tuitionAnnual: { ...prog.tuitionAnnual, amount: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                    <button
                      onClick={() => removeProgram(prog.id)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('حذف', 'Remove')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ البرامج', 'Save Programs')}</span>
            </button>
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>{t('الوظائف الشاغرة', 'Job Postings')}</span>
              </h2>
              {!editingJob && (
                <button
                  onClick={() => setEditingJob(emptyJob(institution.id))}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('نشر وظيفة جديدة', 'Post a Job')}</span>
                </button>
              )}
            </div>

            {editingJob && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={t('المسمى الوظيفي (عربي)', 'Job title (Arabic)')}
                    value={editingJob.title.ar}
                    onChange={(e) => setEditingJob({ ...editingJob, title: { ...editingJob.title, ar: e.target.value } })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={t('المسمى الوظيفي (إنجليزي)', 'Job title (English)')}
                    value={editingJob.title.en}
                    onChange={(e) => setEditingJob({ ...editingJob, title: { ...editingJob.title, en: e.target.value } })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <textarea
                    rows={3}
                    placeholder={t('الوصف الوظيفي (عربي)', 'Description (Arabic)')}
                    value={editingJob.description.ar}
                    onChange={(e) => setEditingJob({ ...editingJob, description: { ...editingJob.description, ar: e.target.value } })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
                  />
                  <textarea
                    rows={3}
                    placeholder={t('الوصف الوظيفي (إنجليزي)', 'Description (English)')}
                    value={editingJob.description.en}
                    onChange={(e) => setEditingJob({ ...editingJob, description: { ...editingJob.description, en: e.target.value } })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <select
                    value={editingJob.employmentType}
                    onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value as Job['employmentType'] })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  >
                    {(Object.keys(EMPLOYMENT_LABELS) as Job['employmentType'][]).map((key) => (
                      <option key={key} value={key}>{language === 'en' ? EMPLOYMENT_LABELS[key].en : EMPLOYMENT_LABELS[key].ar}</option>
                    ))}
                  </select>
                  <select
                    value={editingJob.governorateId}
                    onChange={(e) => setEditingJob({ ...editingJob, governorateId: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editingJob.applicationDeadline || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, applicationDeadline: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingJob.isRemote}
                      onChange={(e) => setEditingJob({ ...editingJob, isRemote: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span>{t('عن بُعد', 'Remote')}</span>
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {t('إلغاء', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSaveJob}
                    disabled={savingJob || !editingJob.title.ar.trim() || !editingJob.title.en.trim() || !editingJob.governorateId}
                    className="px-4 py-2 text-xs font-bold bg-[#0B192C] text-white rounded-lg disabled:opacity-60"
                  >
                    {savingJob ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
                  </button>
                </div>
              </div>
            )}

            {jobs.length === 0 ? (
              <p className="text-[11px] text-slate-400">{t('لم تنشر أي وظيفة بعد', 'No jobs posted yet')}</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{language === 'en' ? job.title.en : job.title.ar}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : job.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
                        <Users className="w-3 h-3" />
                        <span>{jobApplicationCounts[job.id] || 0} {t('متقدم', 'applicants')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/institution/dashboard/jobs/${job.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('المتقدمون', 'Applicants')}</span>
                      </Link>
                      <button
                        onClick={() => setEditingJob(job)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        {t('تعديل', 'Edit')}
                      </button>
                      {job.status === 'ACTIVE' ? (
                        <button onClick={() => handleJobStatus(job.id, 'CLOSED')} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold">
                          {t('إغلاق', 'Close')}
                        </button>
                      ) : (
                        <button onClick={() => handleJobStatus(job.id, 'ACTIVE')} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold">
                          {t('نشر', 'Publish')}
                        </button>
                      )}
                      <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-slate-700">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد استفسارات بعد', 'No inquiries yet')}</div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{inq.fullName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inq.status === 'NEW' ? 'bg-blue-50 text-blue-700' : inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleThread(inq.id)}
                    className={`p-2 rounded-lg ${expandedThreadId === inq.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={t('مراسلة', 'Message')}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inq.phone}</span>
                  {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>}
                </div>
                {inq.message && <p className="text-xs text-slate-600">{inq.message}</p>}

                <select
                  value={inq.status}
                  onChange={(e) => handleInquiryStatus(inq.id, e.target.value as Inquiry['status'])}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${
                    inq.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="NEW">{t('جديد', 'New')}</option>
                  <option value="CONTACTED">{t('تم التواصل', 'Contacted')}</option>
                  <option value="CLOSED">{t('مغلق', 'Closed')}</option>
                </select>

                {expandedThreadId === inq.id && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                    <div className="max-h-56 overflow-y-auto space-y-2">
                      {loadingThreadId === inq.id ? (
                        <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                      ) : (threadMessages[inq.id]?.length || 0) === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                      ) : (
                        threadMessages[inq.id].map((msg) => (
                          <div key={msg.id} className={`flex ${msg.senderRole === 'institution' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                              msg.senderRole === 'institution' ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
                            }`}>
                              <p>{msg.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageDrafts[inq.id] || ''}
                        onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(inq); }}
                        placeholder={t('اكتب رسالة...', 'Write a message...')}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      <button
                        onClick={() => handleSendMessage(inq)}
                        disabled={sendingThreadId === inq.id || !messageDrafts[inq.id]?.trim()}
                        className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                        title={t('إرسال', 'Send')}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد تقييمات معتمدة بعد', 'No approved reviews yet')}</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{review.reviewerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{review.comment}</p>
                </div>

                {review.reply ? (
                  <div className="ms-4 ps-3 border-s-2 border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700">{t('ردّك', 'Your reply')}</span>
                    <p className="text-xs text-slate-600">{review.reply.text}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reviewReplyDrafts[review.id] || ''}
                      onChange={(e) => setReviewReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReplyToReview(review.id); }}
                      placeholder={t('اكتب رداً علنياً...', 'Write a public reply...')}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleReplyToReview(review.id)}
                      disabled={replyingReviewId === review.id || !reviewReplyDrafts[review.id]?.trim()}
                      className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                      title={t('نشر الرد', 'Post reply')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
