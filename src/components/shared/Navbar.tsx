'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Category, Governorate } from '@/core/types/masterData';
import { 
  GraduationCap,
  MapPin,
  Languages,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedGov, setSelectedGov] = useState<string>('');

  useEffect(() => {
    async function loadNavData() {
      const [cats, govs] = await Promise.all([
        MasterDataService.getCategories(),
        MasterDataService.getGovernorates()
      ]);
      setCategories(cats);
      setGovernorates(govs);
    }
    loadNavData();
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-[#0B192C] flex items-center justify-center text-[#F1C40F] shadow-sm group-hover:bg-[#1E3E62] transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#0B192C]">
                  Eduraq
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {t('موثق', 'Vetted')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('دليل العراق التعليمي الموحد', 'Iraq Unified Education Directory')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Loaded dynamically from Master Data) */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link 
              href="/explore" 
              className={`text-sm font-semibold transition-colors ${pathname === '/explore' ? 'text-[#0B192C] border-b-2 border-[#0B192C] pb-1' : 'text-slate-600 hover:text-[#1E3E62]'}`}
            >
              {t('استكشف الكل', 'Explore All')}
            </Link>
            <Link
              href="/jobs"
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${pathname === '/jobs' ? 'text-[#0B192C] border-b-2 border-[#0B192C] pb-1' : 'text-slate-600 hover:text-[#1E3E62]'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              {t('الوظائف', 'Jobs')}
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="text-sm font-medium text-slate-600 hover:text-[#0B192C] transition-colors"
              >
                {language === 'en' ? cat.name.en : cat.name.ar}
              </Link>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Dynamic Governorate Quick Picker */}
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400 me-1.5" />
              <select 
                value={selectedGov}
                onChange={(e) => {
                  setSelectedGov(e.target.value);
                  if (e.target.value) {
                    window.location.href = `/explore?governorate=${e.target.value}`;
                  }
                }}
                className="bg-transparent border-none outline-hidden text-xs font-semibold cursor-pointer text-slate-700"
              >
                <option value="">{t('كافة المحافظات (18)', 'All Governorates (18)')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {language === 'en' ? g.name.en : g.name.ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              title="Toggle Language (AR / EN)"
            >
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Account Login (tutors, schools, students, etc.) */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t('تسجيل الدخول', 'Login')}</span>
            </Link>

            {/* Join as Tutor/Institution CTA */}
            <Link
              href="/apply"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#F1C40F]" />
              <span>{t('انضم إلينا', '+ Join Eduraq')}</span>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#0B192C] py-1.5"
          >
            {t('استكشف كافة المؤسسات', 'Explore All Listings')}
          </Link>
          <Link
            href="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#0B192C] py-1.5"
          >
            {t('الوظائف الشاغرة', 'Job Openings')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore?category=${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600 py-1"
            >
              {language === 'en' ? cat.name.en : cat.name.ar}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-lg"
            >
              {t('تسجيل الدخول', 'Login')}
            </Link>
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold bg-[#0B192C] text-white rounded-lg"
            >
              {t('انضم إلينا كأستاذ أو مؤسسة', '+ Join as Tutor or Institution')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
