'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { UserCheck, Save, AlertCircle, ArrowRight } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';

const emptyForm: Partial<Tutor> = {
  id: '',
  fullName: { ar: '', en: '' },
  title: { ar: '', en: '' },
  bio: { ar: '', en: '' },
  photoUrl: '',
  governorateId: '',
  hourlyRate: { iqd: 0, usd: 0 },
  groupRate: { iqd: 0, usd: 0 },
  groupMaxSize: 4,
  availability: [],
  deliveryMode: ['IN_PERSON'],
  subjectIds: [],
  studentLevelIds: [],
  whatsappNumber: '',
  phone: '',
  yearsOfExperience: 0,
  isVerified: false,
  verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
  status: 'PENDING',
  ratingAvg: 0,
  reviewCount: 0,
};

function TutorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { language, t } = useLanguage();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [form, setForm] = useState<Partial<Tutor>>(emptyForm);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [govs, subs] = await Promise.all([
        MasterDataService.getGovernorates(false),
        MasterDataService.getTaxonomies('SUBJECT', false),
      ]);
      setGovernorates(govs);
      setSubjects(subs);

      if (editId) {
        const existing = await MasterDataService.getTutorById(editId);
        if (existing) setForm(existing);
      }
    }
    load();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id || !form.fullName?.ar || !form.fullName?.en || !form.governorateId) {
      setMessage({ text: t('يرجى ملء الحقول الإلزامية (المعرف، الاسم، المحافظة)', 'Please fill required fields (ID, name, governorate)'), type: 'error' });
      return;
    }

    setSaving(true);
    const id = form.id.toLowerCase().trim().replace(/\s+/g, '-');

    const tutor: Tutor = {
      id,
      fullName: { ar: form.fullName.ar, en: form.fullName.en },
      title: { ar: form.title?.ar || '', en: form.title?.en || '' },
      bio: { ar: form.bio?.ar || '', en: form.bio?.en || '' },
      photoUrl: form.photoUrl || 'https://placehold.co/200x200?text=Tutor',
      governorateId: form.governorateId,
      hourlyRate: { iqd: Number(form.hourlyRate?.iqd) || 0, usd: Number(form.hourlyRate?.usd) || 0 },
      groupRate: { iqd: Number(form.groupRate?.iqd) || 0, usd: Number(form.groupRate?.usd) || 0 },
      groupMaxSize: Number(form.groupMaxSize) || 4,
      availability: form.availability || [],
      deliveryMode: form.deliveryMode?.length ? form.deliveryMode : ['IN_PERSON'],
      subjectIds: form.subjectIds || [],
      studentLevelIds: form.studentLevelIds || [],
      whatsappNumber: form.whatsappNumber || '',
      phone: form.phone || '',
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      isVerified: form.isVerified ?? false,
      verificationBadgeLabel: {
        ar: form.verificationBadgeLabel?.ar || 'قيد المراجعة',
        en: form.verificationBadgeLabel?.en || 'Under Review',
      },
      status: form.status || 'PENDING',
      ratingAvg: form.ratingAvg || 0,
      reviewCount: form.reviewCount || 0,
      createdAt: form.createdAt || '',
      updatedAt: form.updatedAt || '',
    };

    try {
      await MasterDataService.saveTutor(tutor);
      setMessage({ text: t('تم حفظ بيانات الأستاذ بنجاح', 'Tutor saved successfully'), type: 'success' });
      setTimeout(() => router.push('/admin/tutors'), 900);
    } catch {
      setMessage({ text: t('حدث خطأ أثناء الحفظ', 'Failed to save tutor'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDeliveryMode = (mode: 'ONLINE' | 'IN_PERSON' | 'HYBRID') => {
    const set = new Set(form.deliveryMode || []);
    if (set.has(mode)) set.delete(mode); else set.add(mode);
    setForm({ ...form, deliveryMode: Array.from(set) });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" />
          <span>{editId ? t('تعديل بيانات الأستاذ', 'Edit Tutor') : t('تسجيل أستاذ خصوصي جديد', 'Register New Tutor')}</span>
        </h1>
        <Link href="/admin/tutors" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowRight className="w-4 h-4" />
          <span>{t('العودة للقائمة', 'Back to list')}</span>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('معرّف الأستاذ (ID)', 'Tutor ID')} *</label>
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
            label={t('الصورة الشخصية', 'Photo')}
            value={form.photoUrl || ''}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            pathPrefix={`tutors/${form.id || 'draft'}`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم الكامل بالعربية', 'Full Name (Arabic)')} *</label>
            <input
              type="text"
              value={form.fullName?.ar || ''}
              onChange={(e) => setForm({ ...form, fullName: { ...form.fullName!, ar: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم الكامل بالإنجليزية', 'Full Name (English)')} *</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('اللقب المهني بالعربية', 'Title (Arabic)')}</label>
            <input
              type="text"
              placeholder="أستاذ الفيزياء للفرع العلمي"
              value={form.title?.ar || ''}
              onChange={(e) => setForm({ ...form, title: { ...form.title!, ar: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('اللقب المهني بالإنجليزية', 'Title (English)')}</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('نبذة تعريفية', 'Bio')}</label>
          <textarea
            value={form.bio?.ar || ''}
            onChange={(e) => setForm({ ...form, bio: { ar: e.target.value, en: form.bio?.en || '' } })}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('المحافظة', 'Governorate')} *</label>
            <select
              value={form.governorateId || ''}
              onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              required
            >
              <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
              {governorates.map(g => (
                <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('سعر الساعة (دينار)', 'Hourly Rate (IQD)')}</label>
            <input
              type="number"
              value={form.hourlyRate?.iqd ?? 0}
              onChange={(e) => setForm({ ...form, hourlyRate: { iqd: Number(e.target.value), usd: form.hourlyRate?.usd || 0 } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنوات الخبرة', 'Years of Experience')}</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('إجمالي سعر الجلسة الجماعية (دينار)', 'Group Session Total (IQD)')}</label>
            <input
              type="number"
              value={form.groupRate?.iqd ?? 0}
              onChange={(e) => setForm({ ...form, groupRate: { iqd: Number(e.target.value), usd: form.groupRate?.usd || 0 } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('يُقسّم على عدد الطلاب المنضمين', 'Split evenly across students who join')}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأقصى لحجم المجموعة', 'Max Group Size')}</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
            <input
              type="text"
              placeholder="9647801234567"
              value={form.whatsappNumber || ''}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Delivery Mode */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('طريقة التدريس', 'Delivery Mode')}</label>
          <div className="flex gap-2">
            {(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map(mode => {
              const checked = form.deliveryMode?.includes(mode) || false;
              return (
                <label
                  key={mode}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                    checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleDeliveryMode(mode)} />
                  {mode.replace('_', ' ')}
                </label>
              );
            })}
          </div>
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('المواد الدراسية', 'Subjects')}</label>
          <div className="flex flex-wrap gap-2">
            {subjects.map(sub => {
              const checked = form.subjectIds?.includes(sub.id) || false;
              return (
                <label
                  key={sub.id}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                    checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={(e) => {
                      const ids = new Set(form.subjectIds || []);
                      if (e.target.checked) ids.add(sub.id); else ids.delete(sub.id);
                      setForm({ ...form, subjectIds: Array.from(ids) });
                    }}
                  />
                  {language === 'en' ? sub.name.en : sub.name.ar}
                </label>
              );
            })}
            {subjects.length === 0 && (
              <span className="text-[11px] text-slate-400">{t('لا توجد مواد دراسية مضافة بعد. أضفها من صفحة الاعتمادات والمناهج.', 'No subjects yet. Add some from Taxonomies.')}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('حالة النشر', 'Status')}</label>
            <select
              value={form.status || 'PENDING'}
              onChange={(e) => setForm({ ...form, status: e.target.value as Tutor['status'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ACTIVE">{t('نشط', 'Active')}</option>
              <option value="PENDING">{t('قيد المراجعة', 'Pending')}</option>
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
              <span>{t('موثّق الهوية', 'Identity Verified')}</span>
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
            <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ بيانات الأستاذ', 'Save Tutor')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddTutorPage() {
  return (
    <Suspense fallback={null}>
      <TutorForm />
    </Suspense>
  );
}
