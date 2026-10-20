'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getTutorById, getTutorVerificationRequest, saveTutor } from '@/core/services/tutorService';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { UserCheck, Save, AlertCircle, ArrowRight } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';
import { TUTORS_COPY } from '../Tutors.i18n';
import { buildTutor, emptyForm, hasRequiredFields } from './tutorFormModel';
import { DeliveryModePicker, TaxonomyPicker } from './TutorPickers';

export default function TutorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { language } = useLanguage();
  const t = useT(TUTORS_COPY);

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [form, setForm] = useState<Partial<Tutor>>(emptyForm);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [govs, subs, levels] = await Promise.all([
        getGovernorates(false),
        getTaxonomies('SUBJECT', false),
        getTaxonomies('STUDENT_LEVEL', false),
      ]);
      setGovernorates(govs);
      setSubjects(subs);
      setStudentLevels(levels);

      if (editId) {
        const [existing, verification] = await Promise.all([
          getTutorById(editId),
          getTutorVerificationRequest(editId),
        ]);
        if (existing) setForm(existing);
        setVerificationDocuments(verification.documents);
      }
    }
    load();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasRequiredFields(form)) {
      setMessage({ text: t('requiredFields'), type: 'error' });
      return;
    }

    setSaving(true);
    const tutor = buildTutor(form);

    try {
      await saveTutor(tutor);
      setMessage({ text: t('saved'), type: 'success' });
      setTimeout(() => router.push('/admin/tutors'), 900);
    } catch {
      setMessage({ text: t('saveFailed'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" />
          <span>{editId ? t('formTitleEdit') : t('formTitleNew')}</span>
        </h1>
        <Link href="/admin/tutors" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowRight className="w-4 h-4" />
          <span>{t('backToList')}</span>
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('tutorId')} *</label>
            <input
              type="text"
              disabled={!!editId}
              value={form.id || ''}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="e.g. ahmed-physics-tutor"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
              required
            />
          </div>
          <ImageUploadField
            label={t('photo')}
            value={form.photoUrl || ''}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            pathPrefix={`tutors/${form.id || 'draft'}`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('nameAr')} *</label>
            <input
              type="text"
              value={form.fullName?.ar || ''}
              onChange={(e) => setForm({ ...form, fullName: { ...form.fullName!, ar: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('nameEn')} *</label>
            <input
              type="text"
              value={form.fullName?.en || ''}
              onChange={(e) => setForm({ ...form, fullName: { ...form.fullName!, en: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('titleAr')}</label>
            <input
              type="text"
              placeholder="أستاذ الفيزياء للفرع العلمي"
              value={form.title?.ar || ''}
              onChange={(e) => setForm({ ...form, title: { ...form.title!, ar: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('titleEn')}</label>
            <input
              type="text"
              placeholder="Senior Physics Instructor"
              value={form.title?.en || ''}
              onChange={(e) => setForm({ ...form, title: { ...form.title!, en: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('bio')}</label>
          <textarea
            value={form.bio?.ar || ''}
            onChange={(e) => setForm({ ...form, bio: { ar: e.target.value, en: form.bio?.en || '' } })}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')} *</label>
            <select
              value={form.governorateId || ''}
              onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              required
            >
              <option value="">{t('selectGovernorate')}</option>
              {governorates.map(g => (
                <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('hourlyRateIqd')}</label>
            <input
              type="number"
              value={form.hourlyRate?.iqd ?? 0}
              onChange={(e) => setForm({ ...form, hourlyRate: { iqd: Number(e.target.value), usd: form.hourlyRate?.usd || 0 } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('yearsExp')}</label>
            <input
              type="number"
              value={form.yearsOfExperience ?? 0}
              onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('groupTotal')}</label>
            <input
              type="number"
              value={form.groupRate?.iqd ?? 0}
              onChange={(e) => setForm({ ...form, groupRate: { iqd: Number(e.target.value), usd: form.groupRate?.usd || 0 } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('groupSplit')}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('groupMax')}</label>
            <input
              type="number"
              min={2}
              value={form.groupMaxSize ?? 4}
              onChange={(e) => setForm({ ...form, groupMaxSize: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsappNumber')}</label>
            <input
              type="text"
              placeholder="9647801234567"
              value={form.whatsappNumber || ''}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        <DeliveryModePicker form={form} setForm={setForm} />

        <TaxonomyPicker form={form} setForm={setForm} field="subjectIds" items={subjects} label={t('subjects')} emptyText={t('noSubjects')} />

        <TaxonomyPicker form={form} setForm={setForm} field="studentLevelIds" items={studentLevels} label={t('levels')} emptyText={t('noLevels')} />

        {verificationDocuments.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <span className="text-xs font-bold text-amber-800">{t('verificationDocs')}</span>
            <div className="flex flex-wrap gap-2">
              {verificationDocuments.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-blue-700 hover:underline"
                >
                  {t('document', { n: idx + 1 })}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('publishStatus')}</label>
            <select
              value={form.status || 'PENDING'}
              onChange={(e) => setForm({ ...form, status: e.target.value as Tutor['status'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ACTIVE">{t('statusActive')}</option>
              <option value="PENDING">{t('statusPending')}</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.isVerified ?? false}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>{t('identityVerified')}</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('saving') : t('saveTutor')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
