'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Governorate, TaxonomyItem, Category } from '@/core/types/masterData';
import { ApplicationType } from '@/core/types/application';
import { UserPlus, Building2, GraduationCap, CheckCircle2, Loader2 } from 'lucide-react';

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
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [studentLevelIds, setStudentLevelIds] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [message, setMessage] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const [govs, subs, levels, cats] = await Promise.all([
        MasterDataService.getGovernorates(),
        MasterDataService.getTaxonomies('SUBJECT'),
        MasterDataService.getTaxonomies('STUDENT_LEVEL'),
        MasterDataService.getCategories(),
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
      await MasterDataService.createApplication({
        type,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim() || undefined,
        governorateId,
        categoryId: type === 'INSTITUTION' ? categoryId || undefined : undefined,
        subjectIds: type === 'TUTOR' ? subjectIds : undefined,
        studentLevelIds: type === 'TUTOR' ? studentLevelIds : undefined,
        yearsOfExperience: type === 'TUTOR' && yearsOfExperience ? Number(yearsOfExperience) : undefined,
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(t('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'Something went wrong submitting your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
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
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold transition-colors"
          >
            {t('العودة للموقع الرئيسي', 'Back to Home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">
            {t('انضم إلى Eduraq', 'Join Eduraq')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('قدّم طلبك كأستاذ خصوصي أو كمؤسسة تعليمية — سيراجعه فريقنا قبل التفعيل.', 'Apply as a private tutor or an educational institution — our team reviews every application before activation.')}
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {type === 'INSTITUTION' ? t('اسم المؤسسة', 'Institution Name') : t('الاسم الكامل', 'Full Name')} *
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
    </div>
  );
}
