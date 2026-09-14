'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { useMasterData } from '@/core/context/MasterDataContext';
import { localeHref } from '@/lib/locale';
import {
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Languages,
  PlusCircle,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Users,
  ChevronDown,
  Menu,
  X,
  LogOut,
  MessageCircle,
  MessageCircleMore,
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useTotalUnreadMessages } from '@/lib/useTotalUnreadMessages';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  tutor: '/tutor/dashboard',
  student: '/account',
  institution: '/institution/dashboard',
  employer: '/employer/dashboard',
};

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  // Provided by the root layout from one server-side read, rather than fetched here on every
  // page load — see core/context/MasterDataContext.tsx.
  const { categories, governorates, systemSettings } = useMasterData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const [accountPath, setAccountPath] = useState<string | null>(null);
  const unreadMessages = useTotalUnreadMessages();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccountPath(null);
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role as string | undefined;
      setAccountPath((role && DASHBOARD_BY_ROLE[role]) || null);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(auth);
    setAccountPath(null);
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const isExploreActive = pathname === '/explore';
  const isJobsActive = pathname === '/jobs';
  const isTutorsActive = pathname === '/tutors';
  const isCommunityActive = pathname === '/community';

  const navPill = (active: boolean) =>
    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
      active ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-white hover:text-[#0B192C]'
    }`;

  return (
    <header className="sticky top-0 z-50 shadow-xs">
      {/* Utility strip — contact info + quiet account/language actions, off the main bar */}
      <div className="hidden lg:block bg-[#0B192C] text-white/80 text-[11px]">
        <div className="max-w-6xl mx-auto px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {systemSettings.contactEmail && (
              <a href={`mailto:${systemSettings.contactEmail}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail className="w-3 h-3" />
                {systemSettings.contactEmail}
              </a>
            )}
            {systemSettings.contactPhone && (
              <a href={`tel:${systemSettings.contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors" dir="ltr">
                <Phone className="w-3 h-3" />
                {systemSettings.contactPhone}
              </a>
            )}
            {systemSettings.contactWhatsApp && (
              <a
                href={`https://wa.me/${systemSettings.contactWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <MessageCircleMore className="w-3 h-3" />
                {t('واتساب', 'WhatsApp')}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="flex items-center gap-1 hover:text-white transition-colors">
              <Languages className="w-3 h-3" />
              {language === 'ar' ? 'English' : 'عربي'}
            </button>
            {accountPath ? (
              <>
                <Link href={accountPath} className="flex items-center gap-1 hover:text-white transition-colors">
                  <UserCheck className="w-3 h-3" />
                  {t('حسابي', 'My Account')}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-white transition-colors">
                  <LogOut className="w-3 h-3" />
                  {t('تسجيل الخروج', 'Log Out')}
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-1 hover:text-white transition-colors">
                <UserCheck className="w-3 h-3" />
                {t('تسجيل الدخول', 'Login')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main bar — CTA / logo / nav, logo centered as the visual anchor */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="hidden lg:grid grid-cols-3 items-center h-[76px]">
            <Link href={localeHref('/', language)} className="justify-self-start flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#0B192C] flex items-center justify-center text-[#F1C40F] shadow-sm group-hover:bg-[#1E3E62] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#0B192C]">Eduraq</span>
              <span className="hidden xl:flex text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                {t('موثق', 'Vetted')}
              </span>
            </Link>

            <div className="justify-self-center flex items-center rounded-full p-1 gap-1 bg-slate-100/80">
              <div className="relative" ref={exploreRef}>
                <button onClick={() => setExploreOpen((v) => !v)} className={navPill(isExploreActive || exploreOpen)}>
                  {t('استكشف', 'Explore')}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>

                {exploreOpen && (
                  <div className="absolute top-full mt-2 end-0 w-[520px] bg-white rounded-2xl border border-slate-200 shadow-lg p-5 grid grid-cols-2 gap-6 text-start">
                    <div>
                      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                        {t('الفئات', 'Categories')}
                      </h3>
                      <div className="space-y-0.5">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`${localeHref('/explore', language)}?category=${cat.slug}`}
                            onClick={() => setExploreOpen(false)}
                            className="block px-2 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C] transition-colors"
                          >
                            {language === 'en' ? cat.name.en : cat.name.ar}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                        {t('حسب المحافظة', 'By Governorate')}
                      </h3>
                      <div className="space-y-0.5">
                        {governorates.slice(0, 6).map((gov) => (
                          <Link
                            key={gov.id}
                            href={`${localeHref('/explore', language)}?governorate=${gov.id}`}
                            onClick={() => setExploreOpen(false)}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C] transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {language === 'en' ? gov.name.en : gov.name.ar}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={localeHref('/explore', language)}
                      onClick={() => setExploreOpen(false)}
                      className="col-span-2 flex items-center justify-center gap-1.5 mt-1 pt-3 border-t border-slate-100 text-sm font-bold text-blue-700 hover:text-blue-900"
                    >
                      {t('عرض كل المؤسسات والفلاتر', 'View all listings & filters')}
                    </Link>
                  </div>
                )}
              </div>

              <Link href={localeHref('/jobs', language)} className={navPill(isJobsActive)}>
                <Briefcase className="w-3.5 h-3.5" />
                {t('الوظائف', 'Jobs')}
              </Link>

              <Link href={localeHref('/tutors', language)} className={navPill(isTutorsActive)}>
                <UserCheck className="w-3.5 h-3.5" />
                {t('الأساتذة', 'Tutors')}
              </Link>

              <Link href="/community" className={navPill(isCommunityActive)}>
                <Users className="w-3.5 h-3.5" />
                {t('المجتمع', 'Community')}
              </Link>
            </div>

            <div className="justify-self-end flex items-center gap-2.5">
              {accountPath && (
                <>
                  <Link
                    href="/messages"
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title={t('الرسائل', 'Messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 end-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <NotificationCenter />
                </>
              )}
              <Link
                href="/apply"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#F1C40F]" />
                <span>{t('انضم إلينا', 'Join Eduraq')}</span>
              </Link>
            </div>
          </div>

          {/* Mobile bar */}
          <div className="flex lg:hidden items-center justify-between h-16">
            <Link href={localeHref('/', language)} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-lg bg-[#0B192C] flex items-center justify-center text-[#F1C40F] shadow-sm group-hover:bg-[#1E3E62] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#0B192C]">Eduraq</span>
            </Link>
            <div className="flex items-center gap-1.5">
              {accountPath && (
                <>
                  <Link
                    href="/messages"
                    className="relative p-1.5 text-slate-600 hover:text-slate-900"
                    title={t('الرسائل', 'Messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-0 end-0 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <NotificationCenter />
                </>
              )}
              <button onClick={toggleLanguage} className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded">
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:text-slate-900">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1">
          <button
            onClick={() => setMobileExploreOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-bold text-[#0B192C] py-2"
          >
            <span>{t('استكشف', 'Explore')}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${mobileExploreOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileExploreOpen && (
            <div className="ps-3 space-y-0.5 pb-2">
              <Link
                href={localeHref('/explore', language)}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-blue-700 py-1.5"
              >
                {t('عرض الكل والفلاتر', 'View all & filters')}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`${localeHref('/explore', language)}?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-slate-600 py-1.5"
                >
                  {language === 'en' ? cat.name.en : cat.name.ar}
                </Link>
              ))}
            </div>
          )}

          <Link
            href={localeHref('/jobs', language)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#0B192C] py-2"
          >
            {t('الوظائف الشاغرة', 'Job Openings')}
          </Link>

          <Link
            href={localeHref('/tutors', language)}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#0B192C] py-2"
          >
            {t('الأساتذة الخصوصيون', 'Private Tutors')}
          </Link>

          <Link
            href="/community"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#0B192C] py-2"
          >
            {t('مجتمع الأهالي', 'Community')}
          </Link>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {accountPath ? (
              <>
                <Link
                  href={accountPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg"
                >
                  {t('حسابي', 'My Account')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-center py-2 text-xs font-bold text-red-700 border border-red-200 rounded-lg"
                >
                  {t('تسجيل الخروج', 'Log Out')}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg"
              >
                {t('تسجيل الدخول', 'Login')}
              </Link>
            )}
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold bg-[#0B192C] text-white rounded-lg"
            >
              {t('انضم إلينا كأستاذ أو مؤسسة', 'Join as Tutor or Institution')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
