'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Governorate, City } from '@/core/types/masterData';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ChevronRight, 
  Layers, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export default function AdminLocationsPage() {
  const { language, t } = useLanguage();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isEditingGov, setIsEditingGov] = useState(false);
  const [isAddingGov, setIsAddingGov] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for Governorate
  const [govForm, setGovForm] = useState<Partial<Governorate>>({
    id: '',
    name: { ar: '', en: '', ku: '' },
    code: '',
    region: 'CENTRAL',
    lat: 33.3152,
    lng: 44.3661,
    isActive: true,
    displayOrder: 1,
  });

  // Form states for City
  const [cityForm, setCityForm] = useState<Partial<City>>({
    id: '',
    name: { ar: '', en: '', ku: '' },
    slug: '',
    isActive: true,
    displayOrder: 1,
  });

  const loadData = async () => {
    const list = await MasterDataService.getGovernorates(false);
    setGovernorates(list);
    if (list.length > 0 && !selectedGov) {
      selectGovernorate(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectGovernorate = async (gov: Governorate) => {
    setSelectedGov(gov);
    const cityList = await MasterDataService.getCities(gov.id, false);
    setCities(cityList);
  };

  const handleSaveGovernorate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!govForm.id || !govForm.name?.ar || !govForm.name?.en) {
      setMessage({ text: t('يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields'), type: 'error' });
      return;
    }

    const newGov: Governorate = {
      id: govForm.id.toLowerCase().trim().replace(/\s+/g, '-'),
      name: {
        ar: govForm.name.ar,
        en: govForm.name.en,
        ku: govForm.name.ku || '',
      },
      code: govForm.code || govForm.id.substring(0, 2).toUpperCase(),
      region: govForm.region || 'CENTRAL',
      lat: Number(govForm.lat) || 33.3,
      lng: Number(govForm.lng) || 44.3,
      isActive: govForm.isActive ?? true,
      displayOrder: Number(govForm.displayOrder) || governorates.length + 1,
      institutionsCount: govForm.institutionsCount || 0,
    };

    await MasterDataService.saveGovernorate(newGov);
    setMessage({ 
      text: t('تم حفظ المحافظة بنجاح في قاعدة البيانات', 'Governorate saved successfully to master database'), 
      type: 'success' 
    });
    setIsAddingGov(false);
    setIsEditingGov(false);
    await loadData();
    selectGovernorate(newGov);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGov || !cityForm.id || !cityForm.name?.ar || !cityForm.name?.en) {
      setMessage({ text: t('يرجى إدخال اسم وقضاء المدينة', 'Please fill city details'), type: 'error' });
      return;
    }

    const newCity: City = {
      id: cityForm.id.toLowerCase().trim().replace(/\s+/g, '-'),
      governorateId: selectedGov.id,
      name: {
        ar: cityForm.name.ar,
        en: cityForm.name.en,
      },
      slug: cityForm.slug || cityForm.id,
      isActive: cityForm.isActive ?? true,
      displayOrder: Number(cityForm.displayOrder) || cities.length + 1,
    };

    await MasterDataService.saveCity(newCity);
    setMessage({ text: t('تم حفظ المدينة/المنطقة بنجاح', 'City saved successfully'), type: 'success' });
    setIsAddingCity(false);
    const updated = await MasterDataService.getCities(selectedGov.id, false);
    setCities(updated);
  };

  const handleDeleteGov = async (id: string) => {
    if (confirm(t('هل أنت متأكد من حذف هذه المحافظة؟', 'Are you sure you want to delete this governorate?'))) {
      await MasterDataService.deleteGovernorate(id);
      setMessage({ text: t('تم حذف المحافظة بنجاح', 'Governorate deleted'), type: 'success' });
      await loadData();
    }
  };

  const startEditGov = (gov: Governorate) => {
    setGovForm(gov);
    setIsEditingGov(true);
    setIsAddingGov(false);
  };

  const startAddGov = () => {
    setGovForm({
      id: '',
      name: { ar: '', en: '', ku: '' },
      code: '',
      region: 'CENTRAL',
      lat: 33.3,
      lng: 44.3,
      isActive: true,
      displayOrder: governorates.length + 1,
    });
    setIsAddingGov(true);
    setIsEditingGov(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>{t('إدارة المحافظات والمدن في العراق', 'Iraqi Governorates & Cities Manager')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'تحكم بنسبة 100% في كافة محافظات العراق الـ 18، إضافة وتعديل المدن والأقضية وتفعيلها فورياً.',
              '100% dynamic control over all 18 governorates, municipal cities, and regions in Iraq.'
            )}
          </p>
        </div>

        <button
          onClick={startAddGov}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('+ إضافة محافظة عراقية جديدة', '+ Add New Governorate')}</span>
        </button>
      </div>

      {/* Alert banner */}
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

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Governorates List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              {t('المحافظات المسجلة', 'Governorates List')} ({governorates.length})
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              {t('تحديث حي', 'Live Hydrated')}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {governorates.map((gov) => {
              const isSelected = selectedGov?.id === gov.id;
              return (
                <div
                  key={gov.id}
                  onClick={() => selectGovernorate(gov)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 border-s-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                      {gov.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{gov.name.ar}</span>
                        <span className="text-xs text-slate-500 font-medium">({gov.name.en})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {gov.region} • {gov.institutionsCount || 0} {t('مؤسسة', 'institutions')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditGov(gov);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                      title={t('تعديل', 'Edit')}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGov(gov.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                      title={t('حذف', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add/Edit Governorate Form OR Cities Manager */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Add or Edit Governorate Form */}
          {(isAddingGov || isEditingGov) ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-bold text-base text-slate-900">
                  {isAddingGov ? t('إضافة محافظة جديدة', 'Add New Governorate') : t('تعديل بيانات المحافظة', 'Edit Governorate')}
                </h2>
                <button
                  onClick={() => { setIsAddingGov(false); setIsEditingGov(false); }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGovernorate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('معرّف المحافظة (ID)', 'Governorate ID (slug)')} *</label>
                    <input
                      type="text"
                      disabled={isEditingGov}
                      value={govForm.id || ''}
                      onChange={(e) => setGovForm({ ...govForm, id: e.target.value })}
                      placeholder="e.g. halabja, baghdad"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 disabled:bg-slate-50 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('رمز المحافظة (Code)', 'Code')} *</label>
                    <input
                      type="text"
                      value={govForm.code || ''}
                      onChange={(e) => setGovForm({ ...govForm, code: e.target.value })}
                      placeholder="e.g. HL, BG"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالعربية', 'Name (Arabic)')} *</label>
                    <input
                      type="text"
                      value={govForm.name?.ar || ''}
                      onChange={(e) => setGovForm({ ...govForm, name: { ...govForm.name!, ar: e.target.value } })}
                      placeholder="مثال: حلبجة الشهيدة"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'Name (English)')} *</label>
                    <input
                      type="text"
                      value={govForm.name?.en || ''}
                      onChange={(e) => setGovForm({ ...govForm, name: { ...govForm.name!, en: e.target.value } })}
                      placeholder="e.g. Halabja"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('الإقليم / المنطقة', 'Region')}</label>
                    <select
                      value={govForm.region || 'CENTRAL'}
                      onChange={(e) => setGovForm({ ...govForm, region: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 bg-white"
                    >
                      <option value="CENTRAL">Central (الوسط)</option>
                      <option value="KURDISTAN">Kurdistan (إقليم كوردستان)</option>
                      <option value="SOUTH">South (الجنوب)</option>
                      <option value="NORTH">North (الشمال)</option>
                      <option value="WEST">West (الغرب)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('خط العرض (Lat)', 'Latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={govForm.lat || ''}
                      onChange={(e) => setGovForm({ ...govForm, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('خط الطول (Lng)', 'Longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={govForm.lng || ''}
                      onChange={(e) => setGovForm({ ...govForm, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={govForm.isActive ?? true}
                      onChange={(e) => setGovForm({ ...govForm, isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{t('المحافظة مفعّلة في نتائج البحث', 'Active in search results')}</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsAddingGov(false); setIsEditingGov(false); }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {t('إلغاء', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('حفظ التغييرات', 'Save Governorate')}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Cities & Municipal Districts Panel */}
          {selectedGov && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>{t('المدن والأقضية التابعة لـ', 'Cities & Districts in')}</span>
                    <span className="text-blue-600 font-black">{selectedGov.name.ar} ({selectedGov.name.en})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('إدارة المدن والبلديات ومناطق هذه المحافظة بدقة.', 'Manage specific cities and municipal zones.')}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingCity(!isAddingCity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('إضافة قضاء / مدينة', '+ Add City')}</span>
                </button>
              </div>

              {/* Add City Mini-Form */}
              {isAddingCity && (
                <form onSubmit={handleSaveCity} className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-3">
                  <h3 className="text-xs font-bold text-blue-900">{t('بيانات المدينة / القضاء الجديد', 'New City Details')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('المعرف (ID)', 'ID')}</label>
                      <input
                        type="text"
                        placeholder="e.g. mansour, karkh"
                        value={cityForm.id || ''}
                        onChange={(e) => setCityForm({ ...cityForm, id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('الاسم بالعربية', 'Arabic Name')}</label>
                      <input
                        type="text"
                        placeholder="مثال: المنصور"
                        value={cityForm.name?.ar || ''}
                        onChange={(e) => setCityForm({ ...cityForm, name: { ...cityForm.name!, ar: e.target.value } })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('الاسم بالإنجليزية', 'English Name')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Al-Mansour"
                        value={cityForm.name?.en || ''}
                        onChange={(e) => setCityForm({ ...cityForm, name: { ...cityForm.name!, en: e.target.value } })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCity(false)}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded"
                    >
                      {t('إلغاء', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                    >
                      {t('حفظ المدينة', 'Save City')}
                    </button>
                  </div>
                </form>
              )}

              {/* Cities Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-start">{t('الاسم بالعربية', 'Arabic')}</th>
                      <th className="p-3 text-start">{t('الاسم بالإنجليزية', 'English')}</th>
                      <th className="p-3 text-start">{t('المعرّف', 'Slug')}</th>
                      <th className="p-3 text-center">{t('الحالة', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cities.length > 0 ? (
                      cities.map((city) => (
                        <tr key={city.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{city.name.ar}</td>
                          <td className="p-3 text-slate-600">{city.name.en}</td>
                          <td className="p-3 font-mono text-slate-400">{city.slug}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" />
                              {t('مفعّل', 'Active')}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          {t('لم يتم إضافة مدن فرعية لهذه المحافظة بعد. اضغط على "+ إضافة قضاء / مدينة" لإضافة أول مدينة.', 'No cities registered yet for this governorate.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
