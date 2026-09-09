'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getCategories, saveCategory } from '@/core/services/masterDataService';
import { Category } from '@/core/types/masterData';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  X, 
  Save, 
  AlertCircle,
  GraduationCap,
  School,
  BookOpen,
  Award,
  HeartHandshake,
  UserCheck
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<Partial<Category>>({
    id: '',
    slug: '',
    name: { ar: '', en: '' },
    iconName: 'GraduationCap',
    description: { ar: '', en: '' },
    isActive: true,
    displayOrder: 1,
  });

  const loadCategories = async () => {
    const list = await getCategories(false);
    setCategories(list);
  };

  useLoadOnMount(loadCategories);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.name?.ar || !form.name?.en) {
      setMessage({ text: t('يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields'), type: 'error' });
      return;
    }

    const cat: Category = {
      id: form.id || form.slug,
      slug: form.slug.toLowerCase().trim().replace(/\s+/g, '-'),
      name: {
        ar: form.name.ar,
        en: form.name.en,
      },
      iconName: form.iconName || 'GraduationCap',
      description: {
        ar: form.description?.ar || '',
        en: form.description?.en || '',
      },
      isActive: form.isActive ?? true,
      displayOrder: Number(form.displayOrder) || categories.length + 1,
      institutionsCount: form.institutionsCount || 0,
    };

    await saveCategory(cat);
    setMessage({ text: t('تم حفظ الفئة بنجاح في قاعدة البيانات', 'Category saved successfully'), type: 'success' });
    setIsAdding(false);
    setIsEditing(false);
    await loadCategories();
  };

  const startEdit = (cat: Category) => {
    setForm(cat);
    setIsEditing(true);
    setIsAdding(false);
  };

  const startAdd = () => {
    setForm({
      id: '',
      slug: '',
      name: { ar: '', en: '' },
      iconName: 'BookOpen',
      description: { ar: '', en: '' },
      isActive: true,
      displayOrder: categories.length + 1,
    });
    setIsAdding(true);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-amber-600" />
            <span>{t('إدارة الفئات والتصنيفات التعليمية', 'Educational Categories Manager')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'تحديد وتعديل الفئات المستهدفة في الدليل (جامعات، مدارس، معاهد، مراكز تدريب، منظمات، تدريس خصوصي).',
              'Configure all educational categories, icons, and descriptions dynamically.'
            )}
          </p>
        </div>

        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('+ إضافة فئة تعليمية جديدة', '+ Add New Category')}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal/Drawer */}
      {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">
              {isAdding ? t('إضافة فئة تعليمية جديدة', 'Add Category') : t('تعديل الفئة', 'Edit Category')}
            </h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالعربية', 'Name (Arabic)')} *</label>
                <input
                  type="text"
                  required
                  value={form.name?.ar || ''}
                  onChange={(e) => setForm({ ...form, name: { ...form.name!, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'Name (English)')} *</label>
                <input
                  type="text"
                  required
                  value={form.name?.en || ''}
                  onChange={(e) => setForm({ ...form, name: { ...form.name!, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('المعرّف (Slug)', 'Slug')} *</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={form.slug || ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. vocational_academies"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('اسم الأيقونة', 'Icon')}</label>
                <select
                  value={form.iconName || 'GraduationCap'}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 bg-white"
                >
                  <option value="GraduationCap">GraduationCap (جامعات)</option>
                  <option value="School">School (مدارس)</option>
                  <option value="BookOpen">BookOpen (معاهد)</option>
                  <option value="Award">Award (مراكز تدريب)</option>
                  <option value="HeartHandshake">HeartHandshake (منظمات)</option>
                  <option value="UserCheck">UserCheck (أساتذة)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('ترتيب العرض', 'Order')}</label>
                <input
                  type="number"
                  value={form.displayOrder || 1}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالعربية', 'Description (AR)')}</label>
                <textarea
                  rows={2}
                  value={form.description?.ar || ''}
                  onChange={(e) => setForm({ ...form, description: { ...form.description!, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوصف بالإنجليزية', 'Description (EN)')}</label>
                <textarea
                  rows={2}
                  value={form.description?.en || ''}
                  onChange={(e) => setForm({ ...form, description: { ...form.description!, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setIsEditing(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('حفظ الفئة', 'Save Category')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  {cat.iconName === 'GraduationCap' && <GraduationCap className="w-5 h-5" />}
                  {cat.iconName === 'School' && <School className="w-5 h-5" />}
                  {cat.iconName === 'BookOpen' && <BookOpen className="w-5 h-5" />}
                  {cat.iconName === 'Award' && <Award className="w-5 h-5" />}
                  {cat.iconName === 'HeartHandshake' && <HeartHandshake className="w-5 h-5" />}
                  {cat.iconName === 'UserCheck' && <UserCheck className="w-5 h-5" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t('مفعّل', 'Active')}
                  </span>
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 mb-0.5">
                {language === 'en' ? cat.name.en : cat.name.ar}
              </h3>
              <p className="text-xs font-medium text-slate-400 mb-2">
                {language === 'en' ? cat.name.ar : cat.name.en}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {language === 'en' ? cat.description.en : cat.description.ar}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>{t('المعرّف:', 'Slug:')} <span className="font-mono text-slate-700">{cat.slug}</span></span>
              <span className="text-[#0B192C] font-bold">{cat.institutionsCount || 0} {t('مؤسسة', 'listings')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
