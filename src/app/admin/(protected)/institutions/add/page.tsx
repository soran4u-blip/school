'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getGovernorates, getCategories, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutionById, getInstitutionVerificationDocuments, saveAdminInstitution } from '@/core/services/institutionService';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import { Building2, Save, AlertCircle, ArrowRight } from 'lucide-react';
import IdentityMediaFields from './_components/IdentityMediaFields';
import ContactDetailsTuitionFields from './_components/ContactDetailsTuitionFields';
import ProgramsAndStatusFields from './_components/ProgramsAndStatusFields';
import AdmissionsAndAccreditationFields from './_components/AdmissionsAndAccreditationFields';
import { useT } from '@/lib/useT';
import { INSTITUTION_FORM_COPY } from './InstitutionForm.i18n';

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
  admissions: {
    overview: { ar: '', en: '' },
    requiredDocuments: [],
    notes: { ar: '', en: '' },
  },
  accreditation: {
    authority: { ar: '', en: '' },
    details: { ar: '', en: '' },
    sourceUrl: '',
    verifiedAt: '',
    expiresAt: '',
  },
  establishedYear: undefined,
  genderPolicy: 'CO_ED',
  languagesOfInstruction: ['AR'],
  tuition: { min: 0, max: 0, currency: 'USD', period: 'YEAR' },
  taxonomyIds: [],
  isVerified: false,
  verificationBadgeLabel: { ar: '', en: '' },
  status: 'DRAFT',
  isFeatured: false,
  facilities: [],
  metrics: { ratingAvg: 0, reviewCount: 0 },
};

function InstitutionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const t = useT(INSTITUTION_FORM_COPY);

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
      setMessage({ text: t('requiredFields'), type: 'error' });
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
      logoUrl: form.logoUrl || '',
      coverImageUrl: form.coverImageUrl || '',
      tagline: { ar: form.tagline?.ar || '', en: form.tagline?.en || '' },
      description: { ar: form.description?.ar || '', en: form.description?.en || '' },
      address: { ar: form.address?.ar || '', en: form.address?.en || '' },
      contact: {
        phonePrimary: form.contact?.phonePrimary || '',
        whatsappNumber: form.contact?.whatsappNumber || '',
        email: form.contact?.email || '',
        ...(form.contact?.website && { website: form.contact.website }),
      },
      admissions: {
        overview: {
          ar: form.admissions?.overview?.ar || '',
          en: form.admissions?.overview?.en || '',
        },
        requiredDocuments: form.admissions?.requiredDocuments || [],
        notes: {
          ar: form.admissions?.notes?.ar || '',
          en: form.admissions?.notes?.en || '',
        },
      },
      accreditation: {
        authority: {
          ar: form.accreditation?.authority?.ar || '',
          en: form.accreditation?.authority?.en || '',
        },
        details: {
          ar: form.accreditation?.details?.ar || '',
          en: form.accreditation?.details?.en || '',
        },
        ...(form.accreditation?.sourceUrl && { sourceUrl: form.accreditation.sourceUrl }),
        verifiedAt: form.accreditation?.verifiedAt || '',
        ...(form.accreditation?.expiresAt && { expiresAt: form.accreditation.expiresAt }),
      },
      ...(form.establishedYear ? { establishedYear: Number(form.establishedYear) } : {}),
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
      status: form.status || 'DRAFT',
      isFeatured: form.isFeatured ?? false,
      metrics: form.metrics || { ratingAvg: 0, reviewCount: 0 },
      facilities: facilitiesText.split(',').map(f => f.trim()).filter(Boolean),
      programs,
      createdAt: form.createdAt || '',
      updatedAt: form.updatedAt || '',
    };

    try {
      await saveAdminInstitution(institution);
      setMessage({ text: t('saved'), type: 'success' });
      setTimeout(() => router.push('/admin/institutions'), 900);
    } catch {
      setMessage({ text: t('saveFailed'), type: 'error' });
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
            <span>{editId ? t('editTitle') : t('addTitle')}</span>
          </h1>
        </div>
        <Link href="/admin/institutions" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
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
        <IdentityMediaFields
          form={form}
          setForm={setForm}
          editId={editId}
          categories={categories}
          governorates={governorates}
        />

        <ContactDetailsTuitionFields
          form={form}
          setForm={setForm}
          taxonomies={taxonomies}
          facilitiesText={facilitiesText}
          setFacilitiesText={setFacilitiesText}
        />

        <AdmissionsAndAccreditationFields
          form={form}
          setForm={setForm}
        />

        <ProgramsAndStatusFields
          form={form}
          setForm={setForm}
          programs={programs}
          addProgram={addProgram}
          removeProgram={removeProgram}
          updateProgram={updateProgram}
          verificationDocuments={verificationDocuments}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('saving') : t('save')}</span>
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
