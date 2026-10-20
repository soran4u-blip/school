'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import ApplySuccess from './_components/ApplySuccess';
import Footer from '@/components/shared/Footer';
import { getGovernorates, getTaxonomies, getCategories } from '@/core/services/masterDataService';
import { createApplication } from '@/core/services/applicationService';
import { Governorate, TaxonomyItem, Category } from '@/core/types/masterData';
import { ApplicationType } from '@/core/types/application';
import { UserPlus, Building2, GraduationCap, Briefcase, Loader2, Users } from 'lucide-react';
import { useT } from '@/lib/useT';
import { APPLY_COPY } from './Apply.i18n';

export default function ApplyPage() {
  const router = useRouter();
  const t = useT(APPLY_COPY);

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
      setError(t('fillRequired'));
      return;
    }

    if (type === 'INSTITUTION' && !categoryId) {
      setError(t('selectCategory'));
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
      setError(t('submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <ApplySuccess submittedId={submittedId} />;

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
            {t('joinTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('joinIntro')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 rounded-xl p-1.5">
          <button
            type="button"
            onClick={() => setType('TUTOR')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'TUTOR' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <GraduationCap className="w-4 h-4" />
            {t('typeTutor')}
          </button>
          <button
            type="button"
            onClick={() => setType('INSTITUTION')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'INSTITUTION' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <Building2 className="w-4 h-4" />
            {t('typeInstitution')}
          </button>
          <button
            type="button"
            onClick={() => setType('EMPLOYER')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all ${type === 'EMPLOYER' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-500'}`}
          >
            <Briefcase className="w-4 h-4" />
            {t('typeEmployer')}
          </button>
          {/* Not a real ApplicationType — students/parents don't get reviewed like the roles
              above, they just create an account directly (the flow /login's "New student?"
              link already points to). Routes there instead of changing `type`. */}
          <button
            type="button"
            onClick={() => router.push('/account/signup')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all text-slate-500 hover:text-[#0B192C]"
          >
            <Users className="w-4 h-4" />
            {t('typeStudent')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {type === 'INSTITUTION'
                ? t('institutionName')
                : type === 'EMPLOYER'
                  ? t('companyName')
                  : t('fullName')} *
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
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('email')} *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('phone')} *</label>
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
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('whatsapp')}</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={t('optional')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('governorate')} *</label>
              <select
                required
                value={governorateId}
                onChange={(e) => setGovernorateId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('selectGovernorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name.en} / {g.name.ar}</option>
                ))}
              </select>
            </div>
          </div>

          {type === 'TUTOR' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('yearsExperience')}</label>
                <input
                  type="number"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('subjectsTeach')}</label>
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
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('gradesTeach')}</label>
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
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('employerType')} *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmployerType('COMPANY')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    employerType === 'COMPANY' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {t('company')}
                </button>
                <button
                  type="button"
                  onClick={() => setEmployerType('NGO')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    employerType === 'NGO' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {t('ngo')}
                </button>
              </div>
            </div>
          )}

          {type === 'INSTITUTION' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('institutionCategory')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('selectCategoryOption')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en} / {c.name.ar}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {type === 'INSTITUTION'
                ? t('aboutInstitution')
                : type === 'EMPLOYER'
                  ? t('aboutCompany')
                  : t('aboutYou')}
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
            {t('submit')}
          </button>
        </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
