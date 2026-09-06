'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Institution } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import { Review } from '@/core/types/review';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
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
  CheckCircle2,
  ArrowLeft,
  Building2,
  GraduationCap,
  Sparkles,
  X,
  Send
} from 'lucide-react';
import { formatCurrencyUSD } from '@/lib/utils';

export default function InstitutionProfilePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = use(params);
  const { language, t } = useLanguage();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'facilities' | 'admissions' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 5, comment: '', hp: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ fullName: '', phone: '', email: '', message: '', hp: '' });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const inst = await MasterDataService.getInstitutionBySlug(resolvedParams.slug);
      if (inst) {
        setInstitution(inst);
        const [gov, cat, revs] = await Promise.all([
          MasterDataService.getGovernorateById(inst.governorateId),
          MasterDataService.getCategories().then(cats => cats.find(c => c.slug === inst.categoryId) || null),
          MasterDataService.getApprovedReviews(inst.id).catch(() => [])
        ]);
        setGovernorate(gov);
        setCategory(cat);
        setReviews(revs);
      }
      setLoading(false);
    }
    loadProfile();
  }, [resolvedParams.slug]);

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
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      await MasterDataService.createReview({
        institutionId: institution.id,
        reviewerName: reviewForm.reviewerName.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
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
      return;
    }

    setInquirySubmitting(true);
    try {
      const email = inquiryForm.email.trim();
      await MasterDataService.createInquiry({
        institutionId: institution.id,
        institutionName: institution.name.en,
        fullName: inquiryForm.fullName.trim(),
        phone: inquiryForm.phone.trim(),
        ...(email && { email }),
        message: inquiryForm.message.trim(),
      });
      markSubmitted('inquiry');
      setInquirySubmitted(true);
      setInquiryForm({ fullName: '', phone: '', email: '', message: '', hp: '' });
    } catch {
      // silently keep modal open; user can retry
    } finally {
      setInquirySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-600 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{t('جاري تحميل بيانات المؤسسة التعليمية...', 'Loading institution profile...')}</span>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('المؤسسة غير موجودة', 'Institution Not Found')}</h1>
          <p className="text-xs text-slate-500">{t('لم نتمكن من العثور على المؤسسة المطلوبة في دليل العراق.', 'The requested institution could not be found.')}</p>
          <Link href="/explore" className="px-5 py-2.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold">
            {t('العودة إلى الدليل', 'Back to Directory')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Hero Cover Banner (Ported from Stitch Screen 3) */}
      <div className="relative h-72 sm:h-96 w-full bg-[#0B192C] overflow-hidden">
        <Image
          src={institution.coverImageUrl}
          alt={institution.name.en}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B192C] via-[#0B192C]/40 to-transparent"></div>

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Link href="/" className="hover:text-white transition-colors">{t('الرئيسية', 'Home')}</Link>
            <span>/</span>
            <Link href="/explore" className="hover:text-white transition-colors">{t('الدليل التعليمي', 'Directory')}</Link>
            <span>/</span>
            <span className="text-amber-300 font-bold">{language === 'en' ? institution.name.en : institution.name.ar}</span>
          </div>

          {/* Profile Header info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 pb-4">
            <Image
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
                {institution.tuition.min === 0 ? t('مجاني بالكامل', '100% Free') : `$${institution.tuition.min.toLocaleString()} - $${institution.tuition.max.toLocaleString()}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('نسبة توظيف الخريجين', 'Graduate Rate')}</span>
              <span className="font-extrabold text-xs text-emerald-600 font-mono">
                {institution.metrics.graduateEmploymentRate || 92}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center Tabbed Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs Bar */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'overview' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('نظرة عامة والاعتماد', 'Overview & Accreditation')}
              </button>

              <button
                onClick={() => setActiveTab('programs')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'programs' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('الكليات والبرامج والأقساط', 'Programs & Tuition')}
              </button>

              <button
                onClick={() => setActiveTab('facilities')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'facilities' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('المرافق والخدمات', 'Campus Facilities')}
              </button>

              <button
                onClick={() => setActiveTab('admissions')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'admissions' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t('شروط القبول ومعدلات الوزاري', 'Admission Requirements')}
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
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
              </div>
            )}

            {/* Tab 2: Programs & Tuition */}
            {activeTab === 'programs' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-extrabold text-[#0B192C]">
                    {t('البرامج الأكاديمية والأقساط السنوية للعام الحالي', 'Academic Programs & Annual Tuition')}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">{institution.programs?.length || 0} {t('برنامج متاح', 'programs')}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {institution.programs && institution.programs.length > 0 ? (
                    institution.programs.map((prog) => (
                      <div key={prog.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            {language === 'en' ? prog.name.en : prog.name.ar}
                          </h3>
                          <span className="text-xs text-slate-500 font-semibold">
                            {language === 'en' ? prog.facultyName.en : prog.facultyName.ar} • {prog.durationYears} {t('سنوات دراسية', 'years')}
                          </span>
                          {prog.minBaccalaureateScore && (
                            <div className="mt-1">
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {t('الحد الأدنى لمعدل السادس الإعدادي:', 'Min Baccalaureate:')} {prog.minBaccalaureateScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-end">
                          <span className="block text-sm font-black text-[#0B192C]">
                            ${prog.tuitionAnnual.amount.toLocaleString()} / {t('سنوياً', 'year')}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {t('إمكانية التقسيط متاحة', 'Installments Available')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {t('لم يتم إدراج برامج تفصيلية حتى الآن. تواصل مع قسم التسجيل لمزيد من التفاصيل.', 'No specific programs listed.')}
                    </div>
                  )}
                </div>
              </div>
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
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-extrabold text-[#0B192C]">
                    {t('تقييمات وآراء الطلبة وأولياء الأمور', 'Student & Parent Reviews')}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">{reviews.length} {t('تقييم معتمد', 'approved reviews')}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="py-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{rev.reviewerName}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                        {rev.reply && institution && (
                          <div className="ms-4 ps-3 border-s-2 border-emerald-200 mt-2">
                            <span className="text-[10px] font-bold text-emerald-700">
                              {t(`رد ${institution.name.ar}`, `${institution.name.en}'s reply`)}
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed">{rev.reply.text}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {t('لا توجد تقييمات معتمدة بعد. كن أول من يشارك رأيه.', 'No approved reviews yet. Be the first to share your experience.')}
                    </div>
                  )}
                </div>

                {/* Write a Review */}
                <div className="pt-5 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 mb-3">{t('شارك تقييمك', 'Write a Review')}</h3>

                  {reviewSubmitted ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                      {t('شكراً لك! تم إرسال تقييمك وسيظهر بعد مراجعته من الإدارة.', 'Thank you! Your review was submitted and will appear after moderation.')}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={reviewForm.hp}
                        onChange={(e) => setReviewForm({ ...reviewForm, hp: e.target.value })}
                        className="absolute -left-[9999px] w-px h-px overflow-hidden"
                        aria-hidden="true"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t('اسمك', 'Your name')}
                          value={reviewForm.reviewerName}
                          onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                        />
                        <div className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                            >
                              <Star className={`w-4 h-4 ${i < reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        placeholder={t('اكتب تعليقك هنا...', 'Write your comment here...')}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      {reviewError && <p className="text-[11px] font-bold text-rose-600">{reviewError}</p>}
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        {reviewSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال التقييم', 'Submit Review')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
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

              {/* Direct WhatsApp CTA Button */}
              <a
                href={`https://wa.me/${institution.contact.whatsappNumber}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن القبول والتسجيل في ${institution.name.ar}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('مراسلة عبر واتساب الرسمي', 'Chat on Official WhatsApp')}</span>
              </a>

              <button
                onClick={() => setInquiryOpen(true)}
                className="w-full py-3 border-2 border-[#0B192C] text-[#0B192C] hover:bg-[#0B192C] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t('طلب معلومات إضافية', 'Request More Info')}</span>
              </button>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold font-mono">{institution.contact.phonePrimary}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{institution.contact.email}</span>
                </div>

                {institution.contact.website && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => { setInquiryOpen(false); setInquirySubmitted(false); }}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-[#0B192C] mb-1">
              {t('طلب معلومات إضافية', 'Request More Info')}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {t('سيتواصل معك قسم القبول في', 'The admissions office at')} {language === 'en' ? institution.name.en : institution.name.ar} {t('في أقرب وقت.', 'will get back to you shortly.')}
            </p>

            {inquirySubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                {t('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.', 'Your request was sent successfully! We will contact you soon.')}
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-3">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={inquiryForm.hp}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, hp: e.target.value })}
                  className="absolute -left-[9999px] w-px h-px overflow-hidden"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  required
                  placeholder={t('الاسم الكامل', 'Full name')}
                  value={inquiryForm.fullName}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder={t('رقم الهاتف', 'Phone number')}
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl font-mono"
                />
                <input
                  type="email"
                  placeholder={t('البريد الإلكتروني (اختياري)', 'Email (optional)')}
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <textarea
                  placeholder={t('رسالتك (اختياري)', 'Your message (optional)')}
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {inquirySubmitting ? t('جاري الإرسال...', 'Sending...') : t('إرسال الطلب', 'Send Request')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
