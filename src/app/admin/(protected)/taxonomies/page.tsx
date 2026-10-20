'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useT } from '@/lib/useT';
import { TAXONOMIES_COPY } from './Taxonomies.i18n';
import { getTaxonomies, saveTaxonomy } from '@/core/services/masterDataService';
import { TaxonomyItem, TaxonomyType } from '@/core/types/masterData';
import { 
  Tags, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Save, 
  AlertCircle,
  ShieldCheck,
  BookMarked,
  Award,
  GraduationCap
} from 'lucide-react';

export default function AdminTaxonomiesPage() {
  const t = useT(TAXONOMIES_COPY);
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [activeTab, setActiveTab] = useState<TaxonomyType>('ACCREDITATION');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<Partial<TaxonomyItem>>({
    id: '',
    type: 'ACCREDITATION',
    code: '',
    name: { ar: '', en: '' },
    badgeStyle: 'emerald',
    isActive: true,
    displayOrder: 1,
  });

  const loadData = async () => {
    const list = await getTaxonomies(undefined, false);
    setTaxonomies(list);
  };

  useLoadOnMount(loadData);

  const filteredTaxonomies = taxonomies.filter(tx => tx.type === activeTab);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name?.ar || !form.name?.en) {
      setMessage({ text: t('fillRequired'), type: 'error' });
      return;
    }

    const item: TaxonomyItem = {
      id: form.id.toLowerCase().trim().replace(/\s+/g, '-'),
      type: form.type || activeTab,
      code: form.code || form.id.toUpperCase(),
      name: {
        ar: form.name.ar,
        en: form.name.en,
      },
      badgeStyle: form.badgeStyle || 'emerald',
      isActive: form.isActive ?? true,
      displayOrder: Number(form.displayOrder) || taxonomies.length + 1,
    };

    await saveTaxonomy(item);
    setMessage({ text: t('saved'), type: 'success' });
    setIsAdding(false);
    setIsEditing(false);
    await loadData();
  };

  const startEdit = (item: TaxonomyItem) => {
    setForm(item);
    setIsEditing(true);
    setIsAdding(false);
  };

  const startAdd = () => {
    setForm({
      id: '',
      type: activeTab,
      code: '',
      name: { ar: '', en: '' },
      badgeStyle: activeTab === 'ACCREDITATION' ? 'emerald' : 'blue',
      isActive: true,
      displayOrder: filteredTaxonomies.length + 1,
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
            <Tags className="w-6 h-6 text-emerald-600" />
            <span>{t('title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('intro')}
          </p>
        </div>

        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('addNew')}</span>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { setActiveTab('ACCREDITATION'); setIsAdding(false); setIsEditing(false); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ACCREDITATION' ? 'border-[#0B192C] text-[#0B192C]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('tabAccreditation')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('CURRICULUM'); setIsAdding(false); setIsEditing(false); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'CURRICULUM' ? 'border-[#0B192C] text-[#0B192C]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>{t('tabCurriculum')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('SUBJECT'); setIsAdding(false); setIsEditing(false); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SUBJECT' ? 'border-[#0B192C] text-[#0B192C]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t('tabSubject')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('STUDENT_LEVEL'); setIsAdding(false); setIsEditing(false); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'STUDENT_LEVEL' ? 'border-[#0B192C] text-[#0B192C]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{t('tabLevel')}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">
              {isAdding ? t('formAdd') : t('formEdit')}
            </h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('nameAr')} *</label>
                <input
                  type="text"
                  required
                  value={form.name?.ar || ''}
                  onChange={(e) => setForm({ ...form, name: { ...form.name!, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('nameEn')} *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('idLabel')} *</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={form.id || ''}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. acc-mohesr"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('codeFull')}</label>
                <input
                  type="text"
                  value={form.code || ''}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MOHESR"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('badgeStyle')}</label>
                <select
                  value={form.badgeStyle || 'emerald'}
                  onChange={(e) => setForm({ ...form, badgeStyle: e.target.value as TaxonomyItem['badgeStyle'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 bg-white"
                >
                  <option value="emerald">{t('badgeEmerald')}</option>
                  <option value="blue">{t('badgeBlue')}</option>
                  <option value="amber">{t('badgeAmber')}</option>
                  <option value="slate">{t('badgeSlate')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setIsEditing(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveItem')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Taxonomies List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('colNameAr')}</th>
              <th className="p-3 text-start">{t('colNameEn')}</th>
              <th className="p-3 text-start">{t('colCode')}</th>
              <th className="p-3 text-center">{t('colBadge')}</th>
              <th className="p-3 text-end">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTaxonomies.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-900">{item.name.ar}</td>
                <td className="p-3 text-slate-600">{item.name.en}</td>
                <td className="p-3 font-mono text-slate-400">{item.code}</td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.badgeStyle === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.badgeStyle === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    item.badgeStyle === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    <Check className="w-3 h-3" />
                    {item.name.en}
                  </span>
                </td>
                <td className="p-3 text-end">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
