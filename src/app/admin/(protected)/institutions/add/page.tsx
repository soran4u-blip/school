'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates, getCategories, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutionById, getInstitutionVerificationDocuments, saveInstitution } from '@/core/services/institutionService';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import { Building2, Save, AlertCircle, ArrowRight, Plus, Trash2 } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';

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

const emptyForm: Partial<Institution> = {
  id: '',
  slug: '',
  name: { ar: '', en: '' },
  categoryId: '',
  governorateId: '',
  logoUrl: '',
  coverImageUrl: '',
  tagline: { ar: '', en: '' },
  description: { ar: '', en: '' },
  address: { ar: '', en: '' },
  contact: {
    phonePrimary: '',
    whatsappNumber: '',
    email: '',
    website: '',
  },
  establishedYear: new Date().getFullYear(),
  genderPolicy: 'CO_ED',
  languagesOfInstruction: ['AR'],
  tuition: { min: 0, max: 0, currency: 'USD', period: 'YEAR' },
  taxonomyIds: [],
  isVerified: false,
  verificationBadgeLabel: { ar: '', en: '' },
  status: 'ACTIVE',
  isFeatured: false,
  facilities: [],
  metrics: { ratingAvg: 0, reviewCount: 0 },
};

function InstitutionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { language, t } = useLanguage();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [form, setForm] = useState<Partial<Institution>>(emptyForm);
  const [facilitiesText, setFacilitiesText] = useState('');
  const [programs, setPrograms] = useState<InstitutionProgram[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const addProgram = () => setPrograms([...programs, emptyProgram()]);
  const removeProgram = (id: string) => setPrograms(programs.filter(p => p.id !== id));
  const updateProgram = (id: string, patch: Partial<InstitutionProgram>) =>
    setPrograms(programs.map(p => (p.id === id ? { ...p, ...patch } : p)));

  useEffect(() => {
    async function load() {
      const [govs, cats, taxes] = await Promise.all([
        getGovernorates(false),
        getCategories(false),
        getTaxonomies(undefined, false),
      ]);
      setGovernorates(govs);
      setCategories(cats);
      setTaxonomies(taxes);

      if (editId) {
        const [existing, docs] = await Promise.all([
          getInstitutionById(editId),
          getInstitutionVerificationDocuments(editId),
        ]);
        if (existing) {
          setForm(existing);
          setFacilitiesText((existing.facilities || []).join(', '));
          setPrograms(existing.programs || []);
        }
        setVerificationDocuments(docs);
      }
    }
    load();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id || !form.name?.ar || !form.name?.en || !form.categoryId || !form.governorateId) {
      setMessage({ text: t('يرجى ملء الحقول الإلزامية (المعرف، الاسم، الفئة، المحافظة)', 'Please fill required fields (ID, name, category, governorate)'), type: 'error' });
      return;
    }

    setSaving(true);
    const id = form.id.toLowerCase().trim().replace(/\s+/g, '-');

    const institution: Institution = {
      id,
      slug: form.slug?.trim() || id,
      name: { ar: form.name.ar, en: form.name.en, ku: form.name.ku || '' },
      categoryId: form.categoryId,
      governorateId: form.governorateId,
      logoUrl: form.logoUrl || 'https://placehold.co/200x200?text=Logo',
      coverImageUrl: form.coverImageUrl || 'https://placehold.co/1200x400?text=Cover',
      tagline: { ar: form.tagline?.ar || '', en: form.tagline?.en || '' },
      description: { ar: form.description?.ar || '', en: form.description?.en || '' },
      address: { ar: form.address?.ar || '', en: form.address?.en || '' },
      contact: {
        phonePrimary: form.contact?.phonePrimary || '',
        whatsappNumber: form.contact?.whatsappNumber || '',
        email: form.contact?.email || '',
        ...(form.contact?.website && { website: form.contact.website }),
      },
      establishedYear: Number(form.establishedYear) || new Date().getFullYear(),
      genderPolicy: form.genderPolicy || 'CO_ED',
      languagesOfInstruction: form.languagesOfInstruction?.length ? form.languagesOfInstruction : ['AR'],
      tuition: {
        min: Number(form.tuition?.min) || 0,
        max: Number(form.tuition?.max) || 0,
        currency: form.tuition?.currency || 'USD',
        period: form.tuition?.period || 'YEAR',
      },
      taxonomyIds: form.taxonomyIds || [],
      isVerified: form.isVerified ?? false,
      verificationBadgeLabel: {
        ar: form.verificationBadgeLabel?.ar || 'قيد المراجعة',
        en: form.verificationBadgeLabel?.en || 'Under Review',
      },
      status: form.status || 'ACTIVE',
      isFeatured: form.isFeatured ?? false,
      metrics: form.metrics || { ratingAvg: 0, reviewCount: 0 },
      facilities: facilitiesText.split(',').map(f => f.trim()).filter(Boolean),
      programs,
      createdAt: form.createdAt || '',
      updatedAt: form.updatedAt || '',
    };

    try {
      await saveInstitution(institution);
      setMessage({ text: t('تم حفظ المؤسسة بنجاح', 'Institution saved successfully'), type: 'success' });
      setTimeout(() => router.push('/admin/institutions'), 900);
    } catch {
      setMessage({ text: t('حدث خطأ أثناء الحفظ', 'Failed to save institution'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            <span>{editId ? t('تعديل بيانات المؤسسة', 'Edit Institution') : t('إضافة مؤسسة تعليمية جديدة', 'Add New Institution')}</span>
          </h1>
        </div>
        <Link href="/admin/institutions" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
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
        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('معرّف المؤسسة (ID)', 'Institution ID')} *</label>
            <input
              type="text"
              disabled={!!editId}
              value={form.id || ''}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="e.g. baghdad-tech-institute"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الرابط المختصر (Slug)', 'Slug')}</label>
            <input
              type="text"
              value={form.slug || ''}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={t('اتركه فارغاً لاستخدام المعرف', 'Leave empty to use ID')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالعربية', 'Name (Arabic)')} *</label>
            <input
              type="text"
              value={form.name?.ar || ''}
              onChange={(e) => setForm({ ...form, name: { ...form.name!, ar: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'Name (English)')} *</label>
            <input
              type="text"
              value={form.name?.en || ''}
              onChange={(e) => setForm({ ...form, name: { ...form.name!, en: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الفئة', 'Category')} *</label>
            <select
              value={form.categoryId || ''}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              required
            >
              <option value="">{t('اختر الفئة', 'Select category')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{language === 'en' ? c.name.en : c.name.ar}</option>
              ))}
            </select>
          </div>
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
        </div>

        {/* Media */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label={t('شعار المؤسسة', 'Institution Logo')}
            value={form.logoUrl || ''}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            pathPrefix={`institutions/${form.id || 'draft'}`}
          />
          <ImageUploadField
            label={t('صورة الغلاف', 'Cover Image')}
            value={form.coverImageUrl || ''}
            onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            pathPrefix={`institutions/${form.id || 'draft'}`}
          />
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالعربية', 'Description (Arabic)')}</label>
            <textarea
              value={form.description?.ar || ''}
              onChange={(e) => setForm({ ...form, description: { ...form.description!, ar: e.target.value } })}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالإنجليزية', 'Description (English)')}</label>
            <textarea
              value={form.description?.en || ''}
              onChange={(e) => setForm({ ...form, description: { ...form.description!, en: e.target.value } })}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('العنوان بالعربية', 'Address (Arabic)')}</label>
          <input
            type="text"
            value={form.address?.ar || ''}
            onChange={(e) => setForm({ ...form, address: { ar: e.target.value, en: form.address?.en || '' } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
            <input
              type="text"
              value={form.contact?.phonePrimary || ''}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact!, phonePrimary: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
            <input
              type="text"
              value={form.contact?.whatsappNumber || ''}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact!, whatsappNumber: e.target.value } })}
              placeholder="9647801234567"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
            <input
              type="email"
              value={form.contact?.email || ''}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact!, email: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الموقع الإلكتروني', 'Website')}</label>
            <input
              type="text"
              value={form.contact?.website || ''}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact!, website: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنة التأسيس', 'Established Year')}</label>
            <input
              type="number"
              value={form.establishedYear || ''}
              onChange={(e) => setForm({ ...form, establishedYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('نظام الطلاب', 'Gender Policy')}</label>
            <select
              value={form.genderPolicy || 'CO_ED'}
              onChange={(e) => setForm({ ...form, genderPolicy: e.target.value as Institution['genderPolicy'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="CO_ED">{t('مختلط', 'Co-Educational')}</option>
              <option value="BOYS_ONLY">{t('طلاب فقط', 'Boys Only')}</option>
              <option value="GIRLS_ONLY">{t('طالبات فقط', 'Girls Only')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('حالة النشر', 'Status')}</label>
            <select
              value={form.status || 'ACTIVE'}
              onChange={(e) => setForm({ ...form, status: e.target.value as Institution['status'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ACTIVE">{t('نشط', 'Active')}</option>
              <option value="PENDING">{t('قيد المراجعة', 'Pending')}</option>
              <option value="SUSPENDED">{t('موقوف', 'Suspended')}</option>
            </select>
          </div>
        </div>

        {/* Tuition */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأدنى للقسط', 'Tuition Min')}</label>
            <input
              type="number"
              value={form.tuition?.min ?? 0}
              onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, min: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأعلى للقسط', 'Tuition Max')}</label>
            <input
              type="number"
              value={form.tuition?.max ?? 0}
              onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, max: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('العملة', 'Currency')}</label>
            <select
              value={form.tuition?.currency || 'USD'}
              onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, currency: e.target.value as 'IQD' | 'USD' } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="USD">USD</option>
              <option value="IQD">IQD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الدورية', 'Period')}</label>
            <select
              value={form.tuition?.period || 'YEAR'}
              onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="YEAR">{t('سنوي', 'Yearly')}</option>
              <option value="SEMESTER">{t('فصلي', 'Semester')}</option>
              <option value="COURSE">{t('دورة', 'Course')}</option>
            </select>
          </div>
        </div>

        {/* Taxonomy multi-select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('الاعتمادات والمناهج', 'Accreditations & Curricula')}</label>
          <div className="flex flex-wrap gap-2">
            {taxonomies.map(tax => {
              const checked = form.taxonomyIds?.includes(tax.id) || false;
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
                      const ids = new Set(form.taxonomyIds || []);
                      if (e.target.checked) ids.add(tax.id); else ids.delete(tax.id);
                      setForm({ ...form, taxonomyIds: Array.from(ids) });
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

        {/* Academic Programs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700">{t('البرامج الأكاديمية والأقساط', 'Academic Programs & Tuition')}</label>
            <button
              type="button"
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
                      type="button"
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
        </div>

        {verificationDocuments.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <span className="text-xs font-bold text-amber-800">{t('وثائق الاعتماد المرفوعة', 'Uploaded Accreditation Documents')}</span>
            <div className="flex flex-wrap gap-2">
              {verificationDocuments.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-blue-700 hover:underline"
                >
                  {t(`مستند ${idx + 1}`, `Document ${idx + 1}`)}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.isVerified ?? false}
              onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>{t('معتمد رسمياً', 'Officially Verified')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.isFeatured ?? false}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="rounded text-amber-600"
            />
            <span>{t('مميز في الواجهة', 'Featured on Homepage')}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ المؤسسة', 'Save Institution')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddInstitutionPage() {
  return (
    <Suspense fallback={null}>
      <InstitutionForm />
    </Suspense>
  );
}
