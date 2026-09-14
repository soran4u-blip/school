'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getBanners, saveBanner, deleteBanner } from '@/core/services/bannerService';
import { CMSBanner } from '@/core/types/masterData';
import { isBannerActive } from '@/lib/bannerLogic';
import BilingualTextField from '@/components/shared/BilingualTextField';
import ImageUploadField from '@/components/shared/ImageUploadField';
import { Megaphone, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const EMPTY_FORM: Partial<CMSBanner> = {
  id: '',
  title: { ar: '', en: '' },
  subtitle: { ar: '', en: '' },
  ctaText: { ar: '', en: '' },
  ctaLink: '',
  imageUrl: '',
  location: 'DIRECTORY_FEED',
  isActive: true,
  startDate: '',
  endDate: '',
  weight: 50,
};

export default function AdminBannersPage() {
  const { language, t } = useLanguage();
  const [banners, setBanners] = useState<CMSBanner[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<CMSBanner>>(EMPTY_FORM);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setBanners(await getBanners());
  };

  useLoadOnMount(loadData);

  const today = new Date().toISOString().slice(0, 10);

  const startAdd = () => {
    setForm({ ...EMPTY_FORM, id: crypto.randomUUID() });
    setIsAdding(true);
    setIsEditing(false);
  };

  const startEdit = (banner: CMSBanner) => {
    setForm(banner);
    setIsEditing(true);
    setIsAdding(false);
  };

  const closeForm = () => {
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.title?.ar || !form.title?.en || !form.subtitle?.ar || !form.subtitle?.en) {
      setMessage({ text: t('يرجى ملء الحقول الإلزامية', 'Please fill required fields'), type: 'error' });
      return;
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setMessage({ text: t('يجب أن يكون تاريخ البدء قبل تاريخ الانتهاء', 'The start date must be before the end date'), type: 'error' });
      return;
    }

    const banner: CMSBanner = {
      id: form.id,
      title: { ar: form.title.ar, en: form.title.en },
      subtitle: { ar: form.subtitle.ar, en: form.subtitle.en },
      ctaText: form.ctaText?.ar || form.ctaText?.en ? { ar: form.ctaText.ar || '', en: form.ctaText.en || '' } : undefined,
      ctaLink: form.ctaLink || undefined,
      imageUrl: form.imageUrl || undefined,
      location: 'DIRECTORY_FEED',
      isActive: form.isActive ?? true,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      weight: Number(form.weight) || 1,
    };

    setSaving(true);
    try {
      await saveBanner(banner);
      setMessage({ text: t('تم حفظ الإعلان بنجاح', 'Banner saved successfully'), type: 'success' });
      closeForm();
      await loadData();
    } catch {
      setMessage({ text: t('تعذر حفظ الإعلان', 'Could not save the banner'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner: CMSBanner) => {
    if (!confirm(t(`هل أنت متأكد من حذف هذا الإعلان؟`, `Delete this banner? This cannot be undone.`))) return;
    try {
      await deleteBanner(banner.id);
      setMessage({ text: t('تم حذف الإعلان', 'Banner deleted'), type: 'success' });
      await loadData();
    } catch {
      setMessage({ text: t('تعذر حذف الإعلان', 'Could not delete the banner'), type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-600" />
            <span>{t('إدارة الإعلانات', 'Ad Banners')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'حملات إعلانية تدور في الشريط الإعلاني بالصفحة الرئيسية، حسب تاريخ البدء والانتهاء والوزن النسبي.',
              'Campaigns that rotate through the homepage ad slot, scoped by start/end date and relative weight.'
            )}
          </p>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('+ إضافة إعلان جديد', '+ Add New Banner')}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">
              {isAdding ? t('إضافة إعلان جديد', 'Add Banner') : t('تعديل الإعلان', 'Edit Banner')}
            </h2>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <ImageUploadField
              label={t('صورة الإعلان (سيتم اقتصاصها لأبعاد 970×250 على الحاسوب و 300×250 على الجوال)', 'Banner image (cropped to 970×250 desktop / 300×250 mobile)')}
              value={form.imageUrl || ''}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              pathPrefix={`cms_banners/${form.id}`}
            />

            <BilingualTextField
              labelAr="العنوان الفرعي (اسم المُعلن)"
              labelEn="Eyebrow (advertiser name)"
              valueAr={form.title?.ar || ''}
              valueEn={form.title?.en || ''}
              onChangeAr={(v) => setForm({ ...form, title: { ...form.title!, ar: v } })}
              onChangeEn={(v) => setForm({ ...form, title: { ...form.title!, en: v } })}
              required
            />

            <BilingualTextField
              labelAr="العنوان الرئيسي"
              labelEn="Headline"
              valueAr={form.subtitle?.ar || ''}
              valueEn={form.subtitle?.en || ''}
              onChangeAr={(v) => setForm({ ...form, subtitle: { ...form.subtitle!, ar: v } })}
              onChangeEn={(v) => setForm({ ...form, subtitle: { ...form.subtitle!, en: v } })}
              required
            />

            <BilingualTextField
              labelAr="نص الزر (اختياري)"
              labelEn="Button text (optional)"
              valueAr={form.ctaText?.ar || ''}
              valueEn={form.ctaText?.en || ''}
              onChangeAr={(v) => setForm({ ...form, ctaText: { ar: v, en: form.ctaText?.en || '' } })}
              onChangeEn={(v) => setForm({ ...form, ctaText: { ar: form.ctaText?.ar || '', en: v } })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('رابط الإعلان', 'Destination link')}</label>
              <input
                type="url"
                dir="ltr"
                placeholder="https://example.com"
                value={form.ctaLink || ''}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('تاريخ البدء', 'Start date')}</label>
                <input
                  type="date"
                  value={form.startDate || ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('تاريخ الانتهاء', 'End date')}</label>
                <input
                  type="date"
                  value={form.endDate || ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوزن النسبي', 'Weight')}</label>
                <input
                  type="number"
                  min={1}
                  value={form.weight ?? 50}
                  onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{t('مفعّل', 'Active')}</span>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              {t(
                'لا حدّ زمنياً إن تُرك الحقل فارغاً. الوزن يحدد احتمال ظهور هذا الإعلان مقارنة بالإعلانات الأخرى النشطة حالياً.',
                'Leave a date blank for no bound on that side. Weight sets how often this shows relative to other currently-eligible banners.'
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ الإعلان', 'Save Banner')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('الإعلان', 'Banner')}</th>
              <th className="p-3 text-center">{t('المدة', 'Date range')}</th>
              <th className="p-3 text-center">{t('الوزن', 'Weight')}</th>
              <th className="p-3 text-center">{t('الحالة', 'Status')}</th>
              <th className="p-3 text-end">{t('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  {t('لا توجد إعلانات بعد', 'No banners yet')}
                </td>
              </tr>
            )}
            {banners.map((banner) => {
              const activeToday = isBannerActive(banner, today);
              return (
                <tr key={banner.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{language === 'en' ? banner.title.en : banner.title.ar}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{language === 'en' ? banner.subtitle.en : banner.subtitle.ar}</div>
                  </td>
                  <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                    {banner.startDate || '—'} → {banner.endDate || '—'}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-700">{banner.weight}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      activeToday ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {activeToday ? t('نشط اليوم', 'Active today') : (banner.isActive ? t('غير مجدول اليوم', 'Not scheduled today') : t('متوقف', 'Paused'))}
                    </span>
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => startEdit(banner)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(banner)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
