'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getGovernorates, getTaxonomies, getCategories } from '@/core/services/masterDataService';
import { createApplication } from '@/core/services/applicationService';
import { Governorate, TaxonomyItem, Category } from '@/core/types/masterData';
import { ApplicationType } from '@/core/types/application';
import { UserPlus, Building2, GraduationCap, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';

export default function ApplyPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [type, setType] = useState<ApplicationType>('TUTOR');
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [employerType, setEmployerType] = useState<'COMPANY' | 'NGO'>('COMPANY');
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [studentLevelIds, setStudentLevelIds] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [message, setMessage] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  useEffect(() => {
    async function load() {
      const [govs, subs, levels, cats] = await Promise.all([
        getGovernorates(),
        getTaxonomies('SUBJECT'),
        getTaxonomies('STUDENT_LEVEL'),
        getCategories(),
      ]);
      setGovernorates(govs);
      setSubjects(subs);
      setStudentLevels(levels);
      setCategories(cats);
    }
    load();
  }, []);

  const toggleSubject = (id: string) => {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleStudentLevel = (id: string) => {
    setStudentLevelIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !governorateId) {
      setError(t('يرجى ملء جميع الحقول الإلزامية', 'Please fill in all required fields'));
      return;
    }

    if (type === 'INSTITUTION' && !categoryId) {
      setError(t('يرجى اختيار نوع المؤسسة', 'Please select an institution category'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createApplication({
        type,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim() || undefined,
        governorateId,
        categoryId: type === 'INSTITUTION' ? categoryId || undefined : undefined,
        employerType: type === 'EMPLOYER' ? employerType : undefined,
        subjectIds: type === 'TUTOR' ? subjectIds : undefined,
        studentLevelIds: type === 'TUTOR' ? studentLevelIds : undefined,
        yearsOfExperience: type === 'TUTOR' && yearsOfExperience ? Number(yearsOfExperience) : undefined,
        message: message.trim(),
      });
      setSubmittedId(created.id);
      setSubmitted(true);
    } catch {
      setError(t('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'Something went wrong submitting your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">
            {t('تم إرسال طلبك بنجاح', 'Application Submitted')}
          </h1>
          <p className="text-sm text-slate-600">
            {t(
              'سيراجع فريقنا طلبك وسنتواصل معك عبر البريد الإلكتروني أو الواتساب بمجرد الموافقة.',
              "Our team will review your application and reach out by email or WhatsApp once it's approved."
            )}
          </p>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <div className="font-bold text-slate-600">{t('رقم المرجع', 'Reference number')}</div>
            <div className="font-mono text-slate-700 break-all">{submittedId}</div>
          </div>
          <p className="text-xs text-slate-500">
            {t('يمكنك متابعة حالة طلبك في أي وقت من صفحة', 'You can check your application status anytime on the')}{' '}
            <Link href="/apply/status" className="font-bold text-emerald-700 hover:underline">
              {t('صفحة حالة الطلب', 'application status page')}
            </Link>
            {t(' باستخدام بريدك الإلكتروني.', ' using your email address.')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold transition-colors"
          >
            {t('العودة للموقع الرئيسي', 'Back to Home')}
          </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 px-4 py-12">
        <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">
            {t('انضم إلى Eduraq', 'Join Eduraq')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('قدّم طلبك كأستاذ خصوصي، مؤسسة تعليمية، أو شركة/منظمة لنشر فرص العمل — سيراجعه فريقنا قبل التفعيل.', 'Apply as a private tutor, an educational institution, or a company/NGO to post job openings — our team reviews every application before activation.')}
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-xl p-1.5">
          <button
            type="button"
            onClick={() => setType('TUTOR')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'TUTOR' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <GraduationCap className="w-4 h-4" />
            {t('أستاذ خصوصي', 'Private Tutor')}
          </button>
          <button
            type="button"
            onClick={() => setType('INSTITUTION')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'INSTITUTION' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <Building2 className="w-4 h-4" />
            {t('مؤسسة تعليمية', 'Institution')}
          </button>
          <button
            type="button"
            onClick={() => setType('EMPLOYER')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'EMPLOYER' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <Briefcase className="w-4 h-4" />
            {t('شركة / منظمة', 'Company / NGO')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {type === 'INSTITUTION'
                ? t('اسم المؤسسة', 'Institution Name')
                : type === 'EMPLOYER'
                  ? t('اسم الشركة أو المنظمة', 'Company / Organization Name')
                  : t('الاسم الكامل', 'Full Name')} *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('البريد الإلكتروني', 'Email')} *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('رقم الهاتف', 'Phone')} *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('رقم الواتساب', 'WhatsApp Number')}</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={t('اختياري', 'Optional')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('المحافظة', 'Governorate')} *</label>
              <select
                required
                value={governorateId}
                onChange={(e) => setGovernorateId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name.en} / {g.name.ar}</option>
                ))}
              </select>
            </div>
          </div>

          {type === 'TUTOR' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('سنوات الخبرة', 'Years of Experience')}</label>
                <input
                  type="number"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('المواد التي تدرّسها', 'Subjects You Teach')}</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        subjectIds.includes(s.id)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {s.name.en} / {s.name.ar}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('الصفوف التي تدرّسها', 'Grades You Teach')}</label>
                <div className="flex flex-wrap gap-2">
                  {studentLevels.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => toggleStudentLevel(lvl.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        studentLevelIds.includes(lvl.id)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {lvl.name.en} / {lvl.name.ar}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'EMPLOYER' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('النوع', 'Type')} *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmployerType('COMPANY')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    employerType === 'COMPANY' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {t('شركة', 'Company')}
                </button>
                <button
                  type="button"
                  onClick={() => setEmployerType('NGO')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    employerType === 'NGO' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {t('منظمة غير حكومية', 'NGO')}
                </button>
              </div>
            </div>
          )}

          {type === 'INSTITUTION' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('نوع المؤسسة *', 'Institution Category *')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('اختر النوع', 'Select category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en} / {c.name.ar}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {type === 'INSTITUTION'
                ? t('نبذة عن المؤسسة', 'Tell us about your institution')
                : type === 'EMPLOYER'
                  ? t('نبذة عن الشركة أو المنظمة', 'Tell us about your company or organization')
                  : t('نبذة عنك ومؤهلاتك', 'Tell us about yourself and your qualifications')}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('إرسال الطلب', 'Submit Application')}
          </button>
        </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
