'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InquiryModal from './InquiryModal';
import ApplyModal from './ApplyModal';
import ProfileHeader from './ProfileHeader';
import ContactCard from './_components/ContactCard';
import { OverviewTab, FacilitiesTab, AdmissionsTab } from './_components/ProfileSections';
import ProgramsTab from './_components/ProgramsTab';
import ReviewsTab from './_components/ReviewsTab';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import { Review } from '@/core/types/review';
import { AdmissionApplicationStatus } from '@/core/types/admission';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getStudent } from '@/core/services/studentService';
import { uploadFileOnly } from '@/core/firebase/storage';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { localeHref } from '@/lib/locale';
import { trackEvent } from '@/lib/analytics';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from './Institution.i18n';

const PROFILE_TABS = [
  { id: 'overview', label: 'tabOverview' },
  { id: 'programs', label: 'tabPrograms' },
  { id: 'facilities', label: 'tabFacilities' },
  { id: 'admissions', label: 'tabAdmissions' },
  { id: 'reviews', label: 'tabReviews' },
] as const;
type ProfileTab = (typeof PROFILE_TABS)[number]['id'];

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
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
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

  useEffect(() => {
    if (!currentUser || !institution) return;
    const programId = new URLSearchParams(window.location.search).get('programId');
    const program = institution.programs?.find((item) => item.id === programId);
    if (!program) return;

    const timer = window.setTimeout(() => {
      setActiveTab('programs');
      setApplyProgram(program);
      setApplyForm({ message: '' });
      setApplyDocumentPaths([]);
      setApplyDocumentNames([]);
      setApplyResult(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUser, institution]);

  const openApply = (program: InstitutionProgram) => {
    if (!currentUser) {
      trackEvent('institution_apply_login_required', {
        institution_id: institution.id,
        institution_slug: institution.slug,
        program_id: program.id,
      });
      const profilePath = localeHref(`/institutions/${institution.slug}`, language);
      const returnPath = `${profilePath}?programId=${encodeURIComponent(program.id)}`;
      router.push(`${localeHref('/login', language)}?redirect=${encodeURIComponent(returnPath)}`);
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
      setApplyResult({ success: false, message: t('fileTypeError') });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApplyResult({ success: false, message: t('fileSizeError') });
      return;
    }

    setUploadingDocument(true);
    try {
      const path = `admission-applications/${institution.id}/${applyProgram.id}/${currentUser.uid}/${Date.now()}-${file.name}`;
      await uploadFileOnly(file, path);
      setApplyDocumentPaths((prev) => [...prev, path]);
      setApplyDocumentNames((prev) => [...prev, file.name]);
    } catch {
      setApplyResult({ success: false, message: t('uploadFailed') });
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
        setApplyResult({ success: false, message: data.error || t('applyFailed') });
        return;
      }
      setApplyResult({ success: true, message: t('applySuccess') });
      trackEvent('institution_application_submitted', {
        institution_id: institution.id,
        institution_slug: institution.slug,
        program_id: applyProgram.id,
      });
      setMyApplicationStatus((prev) => ({ ...prev, [applyProgram.id]: 'SUBMITTED' }));
    } catch {
      setApplyResult({ success: false, message: t('applyFailed') });
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
      setReviewError(t('reviewNameComment'));
      return;
    }

    if (isCooldownActive('review')) {
      setReviewError(t('reviewWait'));
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
      setReviewError(t('reviewFailed'));
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
      setInquiryError(t('inquiryWait'));
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
        setInquiryError(data.error || t('inquiryFailed'));
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
      setInquiryError(t('inquiryFailed'));
    } finally {
      setInquirySubmitting(false);
    }
  };

  const setProfileTab = (tab: ProfileTab) => {
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

    // Prefill from the signed-in student's own profile so they don't retype what's already on
    // their account. Only fills fields still blank, so it never clobbers something they typed.
    if (currentUser) {
      getStudent(currentUser.uid).then((student) => {
        if (!student) return;
        setInquiryForm((prev) => ({
          ...prev,
          fullName: prev.fullName || student.fullName || '',
          phone: prev.phone || student.phone || '',
          email: prev.email || student.email || '',
        }));
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <ProfileHeader institution={institution} governorate={governorate} category={category} />

      {/* Main Profile Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center Tabbed Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs Bar */}
            <div className="bg-white rounded-2xl p-1.5 border border-[#E8E6DE] shadow-sm flex flex-wrap gap-1" role="tablist" aria-label={t('sections')}>
              {PROFILE_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setProfileTab(id)}
                  role="tab"
                  aria-selected={activeTab === id}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === id ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t(label)}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
                <OverviewTab institution={institution} />
            )}

            {/* Tab 2: Programs & Tuition */}
            {activeTab === 'programs' && (
              <ProgramsTab institution={institution} myApplicationStatus={myApplicationStatus} openApply={openApply} />
            )}

            {/* Tab 3: Campus Facilities */}
            {activeTab === 'facilities' && (
                <FacilitiesTab institution={institution} />
            )}

            {/* Tab 4: Admissions */}
            {activeTab === 'admissions' && (
                <AdmissionsTab institution={institution} openInquiry={openInquiry} />
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
          <ContactCard institution={institution} openInquiry={openInquiry} />
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
