'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InquiryModal from './InquiryModal';
import ApplyModal from './ApplyModal';
import ProgramsTab from './_components/ProgramsTab';
import ReviewsTab from './_components/ReviewsTab';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import { Review } from '@/core/types/review';
import { AdmissionApplicationStatus } from '@/core/types/admission';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { uploadFileOnly } from '@/core/firebase/storage';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { localeHref } from '@/lib/locale';
import { formatCurrency } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import {
  MapPin,
  ShieldCheck,
  Star,
  Calendar,
  Users,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Clock,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Send,
  } from 'lucide-react';

// The interactive half of the institution profile. Everything this component needs to render is
// fetched on the server and handed in as props — see ./page.tsx. It used to fetch the institution,
// its governorate, category and reviews from Firestore in the browser, which meant crawlers saw an
// empty page and every visitor paid for their own reads.
export default function InstitutionProfile({
  institution,
  governorate,
  category,
  initialReviews,
}: {
  institution: Institution;
  governorate: Governorate | null;
  category: Category | null;
  initialReviews: Review[];
}) {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'facilities' | 'admissions' | 'reviews'>('overview');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [myApplicationStatus, setMyApplicationStatus] = useState<Record<string, AdmissionApplicationStatus>>({});

  const [applyProgram, setApplyProgram] = useState<InstitutionProgram | null>(null);
  const [applyForm, setApplyForm] = useState({ message: '' });
  const [applyDocumentPaths, setApplyDocumentPaths] = useState<string[]>([]);
  const [applyDocumentNames, setApplyDocumentNames] = useState<string[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Server-provided. A newly submitted review starts PENDING, so it never joins this list
  // client-side — it appears after moderation, on the next server render.
  const reviews = initialReviews;
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 5, comment: '', hp: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ fullName: '', phone: '', email: '', message: '', hp: '' });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    trackEvent('institution_profile_view', {
      institution_id: institution.id,
      institution_slug: institution.slug,
      institution_category: institution.categoryId,
    });
  }, [institution.categoryId, institution.id, institution.slug]);

  useEffect(() => {
    async function loadMyApplications() {
      if (!currentUser || !institution) return;
      try {
        const res = await fetch('/api/account/admission-applications');
        const data = await res.json();
        if (data.success) {
          const statuses: Record<string, AdmissionApplicationStatus> = {};
          for (const app of data.applications) {
            if (app.institutionId === institution.id) statuses[app.programId] = app.status;
          }
          setMyApplicationStatus(statuses);
        }
      } catch {
        // Best-effort — the Apply button just won't reflect an existing application if this fails.
      }
    }
    loadMyApplications();
  }, [currentUser, institution]);

  const openApply = (program: InstitutionProgram) => {
    if (!currentUser) {
      trackEvent('institution_apply_login_required', {
        institution_id: institution.id,
        institution_slug: institution.slug,
        program_id: program.id,
      });
      router.push(`/login?redirect=${encodeURIComponent(`/institutions/${institution.slug}`)}`);
      return;
    }
    trackEvent('institution_apply_start', {
      institution_id: institution.id,
      institution_slug: institution.slug,
      program_id: program.id,
    });
    setApplyProgram(program);
    setApplyForm({ message: '' });
    setApplyDocumentPaths([]);
    setApplyDocumentNames([]);
    setApplyResult(null);
  };

  const closeApply = () => {
    setApplyProgram(null);
    setApplyResult(null);
  };

  const handleApplyDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !applyProgram || !institution || !currentUser) return;

    const allowed = ['image/', 'application/pdf'];
    if (!allowed.some((prefix) => file.type.startsWith(prefix))) {
      setApplyResult({ success: false, message: t('يرجى اختيار ملف PDF أو صورة', 'Please select a PDF or image file') });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApplyResult({ success: false, message: t('الحد الأقصى لحجم الملف 5 ميغابايت', 'Max file size is 5MB') });
      return;
    }

    setUploadingDocument(true);
    try {
      const path = `admission-applications/${institution.id}/${applyProgram.id}/${currentUser.uid}/${Date.now()}-${file.name}`;
      await uploadFileOnly(file, path);
      setApplyDocumentPaths((prev) => [...prev, path]);
      setApplyDocumentNames((prev) => [...prev, file.name]);
    } catch {
      setApplyResult({ success: false, message: t('تعذر رفع الملف', 'Failed to upload the file') });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !applyProgram) return;
    setApplySubmitting(true);
    try {
      const res = await fetch('/api/admission-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          programId: applyProgram.id,
          ...(applyForm.message.trim() && { message: applyForm.message.trim() }),
          ...(applyDocumentPaths.length > 0 && { documentUrls: applyDocumentPaths }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApplyResult({ success: false, message: data.error || t('تعذر إرسال طلبك', 'Failed to submit your application') });
        return;
      }
      setApplyResult({ success: true, message: t('تم إرسال طلبك بنجاح! يمكنك متابعة حالته من حسابك.', 'Your application was submitted! You can track its status from your account.') });
      trackEvent('institution_application_submitted', {
        institution_id: institution.id,
        institution_slug: institution.slug,
        program_id: applyProgram.id,
      });
      setMyApplicationStatus((prev) => ({ ...prev, [applyProgram.id]: 'SUBMITTED' }));
    } catch {
      setApplyResult({ success: false, message: t('تعذر إرسال طلبك', 'Failed to submit your application') });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    setReviewError('');

    if (reviewForm.hp) return; // honeypot tripped — silently drop

    if (!reviewForm.reviewerName.trim() || !reviewForm.comment.trim()) {
      setReviewError(t('يرجى إدخال الاسم والتعليق', 'Please enter your name and comment'));
      return;
    }

    if (isCooldownActive('review')) {
      setReviewError(t('يرجى الانتظار قليلاً قبل إرسال تقييم آخر', 'Please wait a moment before submitting another review'));
      return;
    }

    setReviewSubmitting(true);
    try {
      // Always goes through the server route now (firestore.rules denies client-side review
      // creates entirely). A real, logged-in student is checked for an actual ACCEPTED admission
      // application and gets the "Verified" badge; a guest is rate-limited by IP instead of uid
      // and never verified.
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          ...(!(currentUser && !currentUser.isAnonymous) && { reviewerName: reviewForm.reviewerName.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }
      markSubmitted('review');
      setReviewSubmitted(true);
      setReviewForm({ reviewerName: '', rating: 5, comment: '', hp: '' });
    } catch {
      setReviewError(t('تعذر إرسال التقييم، حاول مرة أخرى', 'Failed to submit review, please try again'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    if (inquiryForm.hp) return; // honeypot tripped — silently drop
    if (!inquiryForm.fullName.trim() || !inquiryForm.phone.trim()) return;

    if (isCooldownActive('inquiry')) {
      setInquiryError(t('يرجى الانتظار قليلاً قبل إرسال طلب آخر', 'Please wait a moment before submitting another request'));
      return;
    }

    setInquiryError('');
    setInquirySubmitting(true);
    try {
      const email = inquiryForm.email.trim();
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          fullName: inquiryForm.fullName.trim(),
          phone: inquiryForm.phone.trim(),
          ...(email && { email }),
          message: inquiryForm.message.trim(),
          honeypot: inquiryForm.hp,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setInquiryError(data.error || t('تعذر إرسال الطلب، حاول مرة أخرى', 'Could not send your request. Please try again.'));
        return;
      }

      markSubmitted('inquiry');
      setInquirySubmitted(true);
      trackEvent('institution_inquiry_submitted', {
        institution_id: institution.id,
        institution_slug: institution.slug,
        has_email: Boolean(email),
      });
      setInquiryForm({ fullName: '', phone: '', email: '', message: '', hp: '' });
    } catch {
      setInquiryError(t('تعذر إرسال الطلب، حاول مرة أخرى', 'Could not send your request. Please try again.'));
    } finally {
      setInquirySubmitting(false);
    }
  };

  const setProfileTab = (tab: 'overview' | 'programs' | 'facilities' | 'admissions' | 'reviews') => {
    setActiveTab(tab);
    trackEvent('institution_profile_tab_view', {
      institution_id: institution.id,
      institution_slug: institution.slug,
      tab,
    });
  };

  const openInquiry = () => {
    setInquiryError('');
    setInquirySubmitted(false);
    setInquiryOpen(true);
    trackEvent('institution_inquiry_open', {
      institution_id: institution.id,
      institution_slug: institution.slug,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Hero Cover Banner (Ported from Stitch Screen 3) */}
      <div className="relative h-72 sm:h-96 w-full bg-[#0B192C] overflow-hidden">
        <Thumbnail
          src={institution.coverImageUrl}
          alt={institution.name.en}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
          fallbackClassName="absolute inset-0 bg-transparent"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B192C] via-[#0B192C]/40 to-transparent"></div>

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Link href="/" className="hover:text-white transition-colors">{t('الرئيسية', 'Home')}</Link>
            <span>/</span>
            <Link href={localeHref('/explore', language)} className="hover:text-white transition-colors">{t('الدليل التعليمي', 'Directory')}</Link>
            <span>/</span>
            <span className="text-amber-300 font-bold">{language === 'en' ? institution.name.en : institution.name.ar}</span>
          </div>

          {/* Profile Header info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 pb-4">
            <Thumbnail
              src={institution.logoUrl}
              alt={institution.name.en}
              width={112}
              height={112}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-2xl bg-white shrink-0"
            />

            <div className="space-y-2 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-600 text-white">
                  {category ? (language === 'en' ? category.name.en : category.name.ar) : institution.categoryId}
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'en' ? institution.verificationBadgeLabel.en : institution.verificationBadgeLabel.ar}</span>
                </span>
              </div>

               <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                 {language === 'en' ? institution.name.en : institution.name.ar}
               </h1>

               <p className="max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed">
                 {language === 'en' ? institution.tagline.en : institution.tagline.ar}
               </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : institution.governorateId}</span>
                  <span>-</span>
                  <span>{language === 'en' ? institution.address.en : institution.address.ar}</span>
                </div>

                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-md text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{institution.metrics.ratingAvg}</span>
                  <span className="text-slate-400 font-normal">({institution.metrics.reviewCount} {t('تقييم', 'reviews')})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Ribbon Bar */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-start">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('سنة التأسيس', 'Established')}</span>
              <span className="font-extrabold text-xs text-slate-800">{institution.establishedYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('نظام الطلاب', 'Gender Policy')}</span>
              <span className="font-extrabold text-xs text-slate-800">
                {institution.genderPolicy === 'CO_ED' ? t('مختلط (ذكور وإناث)', 'Co-Educational') : t('أحادي', 'Single Gender')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('متوسط القسط السنوي', 'Tuition Tier')}</span>
              <span className="font-extrabold text-xs text-slate-800">
                {institution.tuition.min === 0
                  ? t('مجاني بالكامل', '100% Free')
                  : `${formatCurrency(institution.tuition.min, institution.tuition.currency, language)} - ${formatCurrency(institution.tuition.max, institution.tuition.currency, language)}`}
              </span>
            </div>
          </div>

          {/* Only shown when the institution actually reported a rate. This used to fall back to a
              hardcoded 92%, which published an invented statistic for every institution that had
              never supplied one. */}
          {typeof institution.metrics.graduateEmploymentRate === 'number' && (
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('نسبة توظيف الخريجين', 'Graduate Rate')}</span>
                <span className="font-extrabold text-xs text-emerald-600 font-mono">
                  {institution.metrics.graduateEmploymentRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center Tabbed Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs Bar */}
             <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1" role="tablist" aria-label={t('أقسام الملف', 'Profile sections')}>
               <button
                 onClick={() => setProfileTab('overview')}
                 role="tab"
                 aria-selected={activeTab === 'overview'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'overview' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('نظرة عامة والاعتماد', 'Overview & Accreditation')}
              </button>

               <button
                 onClick={() => setProfileTab('programs')}
                 role="tab"
                 aria-selected={activeTab === 'programs'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'programs' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('الكليات والبرامج والأقساط', 'Programs & Tuition')}
              </button>

               <button
                 onClick={() => setProfileTab('facilities')}
                 role="tab"
                 aria-selected={activeTab === 'facilities'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'facilities' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('المرافق والخدمات', 'Campus Facilities')}
              </button>

               <button
                 onClick={() => setProfileTab('admissions')}
                 role="tab"
                 aria-selected={activeTab === 'admissions'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'admissions' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('شروط القبول ومعدلات الوزاري', 'Admission Requirements')}
              </button>

               <button
                 onClick={() => setProfileTab('reviews')}
                 role="tab"
                 aria-selected={activeTab === 'reviews'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'reviews' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('التقييمات والآراء', 'Reviews')}
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#0B192C] mb-3">
                    {t('عن المؤسسة ورؤيتها التعليمية', 'About the Institution')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {language === 'en' ? institution.description.en : institution.description.ar}
                  </p>
                </div>

                {/* Accreditation Details Card */}
                 <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{t('حالة الاعتماد والترخيص الحكومي الرسمي', 'Official Accreditation Status')}</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {t(
                      'هذه المؤسسة معتمدة ومرخصة رسمياً من وزارة التعليم العالي والبحث العلمي العراقية أو وزارة التربية وتخضع لإشراف لجان التقييم الأكاديمي والامتحانات الوطنية.',
                      'This institution is officially recognized and accredited by the Iraqi Ministry of Higher Education or Ministry of Education.'
                    )}
                   </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                     <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                       {t('لغات التدريس', 'Languages of instruction')}
                     </span>
                     <span className="text-xs font-extrabold text-slate-800">
                       {institution.languagesOfInstruction?.length
                         ? institution.languagesOfInstruction.map((code) => ({ AR: 'العربية', EN: 'English', KU: 'Kurdish', FR: 'Français' }[code])).join('، ')
                         : t('غير محددة', 'Not specified')}
                     </span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                     <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                       {t('آخر تحديث للملف', 'Profile updated')}
                     </span>
                     <span className="text-xs font-extrabold text-slate-800">
                       {new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(institution.updatedAt))}
                     </span>
                   </div>
                 </div>

                 {institution.galleryUrls && institution.galleryUrls.length > 0 && (
                   <div>
                     <h3 className="text-sm font-extrabold text-[#0B192C] mb-3">
                       {t('صور من الحرم والمرافق', 'Campus & facilities')}
                     </h3>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                       {institution.galleryUrls.slice(0, 4).map((url, index) => (
                         <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                           <Thumbnail
                             src={url}
                             alt={`${institution.name.en} ${index + 1}`}
                             fill
                             sizes="(max-width: 640px) 50vw, 25vw"
                             className="object-cover"
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            )}

            {/* Tab 2: Programs & Tuition */}
            {activeTab === 'programs' && (
              <ProgramsTab institution={institution} myApplicationStatus={myApplicationStatus} openApply={openApply} />
            )}

            {/* Tab 3: Campus Facilities */}
            {activeTab === 'facilities' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-lg font-extrabold text-[#0B192C]">
                  {t('المرافق والخدمات الجامعية والمدرسية', 'Campus Facilities')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {institution.facilities?.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Admissions */}
            {activeTab === 'admissions' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-lg font-extrabold text-[#0B192C]">
                  {t('شروط القبول ومستمسكات التقديم', 'Admissions & Requirements')}
                </h2>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-1">{t('المستمسكات المطلوبة:', 'Required Documents:')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
                      <li>{t('وثيقة تخرج السادس الإعدادي مصدقة من المديرية العامة للتربية', 'Certified 6th Preparatory graduation certificate')}</li>
                      <li>{t('البطاقة الوطنية الموحدة وصور شخصية حديثة خلفية بيضاء (عدد 6)', 'Unified National ID & passport photos')}</li>
                      <li>{t('الفحص الطبي واستمارة اللياقة الصحية للقبول', 'Official medical fitness examination sheet')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Reviews */}
            {activeTab === 'reviews' && (
              <ReviewsTab
                institution={institution}
                reviews={reviews}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                reviewSubmitting={reviewSubmitting}
                reviewSubmitted={reviewSubmitted}
                reviewError={reviewError}
                onSubmitReview={handleSubmitReview}
              />
            )}
          </div>

          {/* Right Column: Sticky Admissions CTA & Contact Card */}
          <aside className="lg:col-span-4 sticky top-28 space-y-6">
            
            {/* Direct WhatsApp Admissions Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('شعبة شؤون الطلبة والتسجيل', 'Student Admissions Office')}</span>
                <h3 className="text-base font-extrabold text-[#0B192C]">
                  {t('تواصل مباشر مع قسم القبول', 'Direct Admissions Inquiry')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('استفسر عن المقاعد المتبقية، الأقساط، والمنح عبر واتساب فوراً.', 'Chat directly with admissions officers on WhatsApp.')}
                </p>
              </div>

              {/* In-app chat, for students who'd rather not hand over a WhatsApp number. Only
                  shown once the institution has a linked account to receive it — conversations are
                  keyed by Auth uid, so institution.userId (not institution.id) is the recipient. */}
              {institution.userId && (
                <button
                 onClick={async () => {
                   trackEvent('institution_chat_start', {
                     institution_id: institution.id,
                     institution_slug: institution.slug,
                   });
                   try {
                      const res = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          recipientId: institution.userId,
                          recipientRole: 'institution',
                          recipientName: language === 'en' ? institution.name.en : institution.name.ar,
                          recipientPhone: institution.contact?.phonePrimary,
                          context: {
                            type: 'institution',
                            title: language === 'en' ? `Admissions — ${institution.name.en}` : `القبول — ${institution.name.ar}`,
                            id: institution.id,
                          },
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.conversation) {
                        router.push(`/messages?conversationId=${data.conversation.id}`);
                      } else {
                        router.push('/login');
                      }
                    } catch {
                      router.push('/login');
                    }
                  }}
                  className="w-full py-3.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('مراسلة فورية', 'Chat Now')}</span>
                </button>
              )}

              {/* Direct WhatsApp CTA Button — hidden when no number is set, which otherwise
                  produced a broken `wa.me/` link. */}
              {institution.contact?.whatsappNumber && (
                 <a
                   href={`https://wa.me/${institution.contact.whatsappNumber}?text=${encodeURIComponent(
                    t(
                      `مرحباً، أود الاستفسار عن القبول والتسجيل في ${institution.name.ar}`,
                      `Hi, I'd like to ask about admissions at ${institution.name.en || institution.name.ar}`
                    )
                   )}`}
                   onClick={() => trackEvent('institution_whatsapp_click', {
                     institution_id: institution.id,
                     institution_slug: institution.slug,
                   })}
                   target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('مراسلة عبر واتساب الرسمي', 'Chat on Official WhatsApp')}</span>
                </a>
              )}

              <button
                 onClick={openInquiry}
                className="w-full py-3 border-2 border-[#0B192C] text-[#0B192C] hover:bg-[#0B192C] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t('طلب معلومات إضافية', 'Request More Info')}</span>
              </button>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center gap-3 text-slate-700" dir="ltr">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                   <a href={`tel:${institution.contact.phonePrimary}`} className="font-semibold font-mono hover:text-blue-700">
                     {institution.contact.phonePrimary}
                   </a>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                   <a href={`mailto:${institution.contact.email}`} className="font-medium hover:text-blue-700">
                     {institution.contact.email}
                   </a>
                </div>

                {institution.contact.website && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                     <a
                       href={institution.contact.website}
                       onClick={() => trackEvent('institution_website_click', {
                         institution_id: institution.id,
                         institution_slug: institution.slug,
                       })}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:underline font-semibold"
                     >
                      {t('الموقع الإلكتروني الرسمي', 'Official Website')}
                    </a>
                  </div>
                )}

                {institution.contact.workingHours && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{language === 'en' ? institution.contact.workingHours.en : institution.contact.workingHours.ar}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <InquiryModal
          institution={institution}
          form={inquiryForm}
          setForm={setInquiryForm}
          onSubmit={handleSubmitInquiry}
           submitting={inquirySubmitting}
           submitted={inquirySubmitted}
           error={inquiryError}
           onClose={() => { setInquiryOpen(false); setInquirySubmitted(false); setInquiryError(''); }}
        />
      )}

      {applyProgram && (
        <ApplyModal
          institution={institution}
          applyProgram={applyProgram}
          applyForm={applyForm}
          setApplyForm={setApplyForm}
          applyDocumentNames={applyDocumentNames}
          uploadingDocument={uploadingDocument}
          onDocument={handleApplyDocument}
          onSubmit={handleSubmitApply}
          submitting={applySubmitting}
          result={applyResult}
          onClose={closeApply}
        />
      )}

      <Footer />
    </div>
  );
}