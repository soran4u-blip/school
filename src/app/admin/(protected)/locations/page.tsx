'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates, getCities, saveGovernorate, saveCity, deleteGovernorate } from '@/core/services/masterDataService';
import { Governorate, City } from '@/core/types/masterData';
import {
  MapPin,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import GovernoratesList from './_components/GovernoratesList';
import GovernorateForm from './_components/GovernorateForm';
import CitiesPanel from './_components/CitiesPanel';

export default function AdminLocationsPage() {
  const { t } = useLanguage();
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

  // Declared before loadData, which calls it — the other way round it was read from the temporal
  // dead zone of its own `const`, so loadData closed over whichever version happened to exist
  // rather than the current one.
  const selectGovernorate = async (gov: Governorate) => {
    setSelectedGov(gov);
    const cityList = await getCities(gov.id, false);
    setCities(cityList);
  };

  const loadData = async () => {
    const list = await getGovernorates(false);
    setGovernorates(list);
    if (list.length > 0 && !selectedGov) {
      await selectGovernorate(list[0]);
    }
  };

  useLoadOnMount(loadData);

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

    await saveGovernorate(newGov);
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

    await saveCity(newCity);
    setMessage({ text: t('تم حفظ المدينة/المنطقة بنجاح', 'City saved successfully'), type: 'success' });
    setIsAddingCity(false);
    const updated = await getCities(selectedGov.id, false);
    setCities(updated);
  };

  const handleDeleteGov = async (id: string) => {
    if (confirm(t('هل أنت متأكد من حذف هذه المحافظة؟', 'Are you sure you want to delete this governorate?'))) {
      await deleteGovernorate(id);
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

        <GovernoratesList
          governorates={governorates}
          selectedGov={selectedGov}
          onSelect={selectGovernorate}
          onEdit={startEditGov}
          onDelete={handleDeleteGov}
        />

        {/* Right Column: Add/Edit Governorate Form OR Cities Manager */}
        <div className="lg:col-span-7 space-y-6">

          {(isAddingGov || isEditingGov) && (
            <GovernorateForm
              govForm={govForm}
              setGovForm={setGovForm}
              isAddingGov={isAddingGov}
              isEditingGov={isEditingGov}
              onSubmit={handleSaveGovernorate}
              onCancel={() => { setIsAddingGov(false); setIsEditingGov(false); }}
            />
          )}

          {selectedGov && (
            <CitiesPanel
              selectedGov={selectedGov}
              cities={cities}
              isAddingCity={isAddingCity}
              setIsAddingCity={setIsAddingCity}
              cityForm={cityForm}
              setCityForm={setCityForm}
              onSubmitCity={handleSaveCity}
            />
          )}
        </div>
      </div>
    </div>
  );
}
