'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { auth } from '@/core/firebase/config';
import { signOut } from 'firebase/auth';
import { getAllApplications } from '@/core/services/applicationService';
import { getAllReviews, getAllInquiries } from '@/core/services/reviewService';
import { getAllCommunityPosts } from '@/core/services/communityService';
import {
  GraduationCap,
  LayoutDashboard,
  MapPin,
  FolderTree,
  Tags,
  Building2,
  UserCheck,
  Settings,
  ArrowRight,
  ShieldAlert,
  Home,
  LogOut,
  MessageSquareText,
  Calendar,
  FileCheck2,
  Briefcase,
  Users,
  BarChart3,
  Bug
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadPendingCounts() {
      try {
        const [applications, reviews, inquiries, communityPosts] = await Promise.all([
          getAllApplications(),
          getAllReviews(),
          getAllInquiries(),
          getAllCommunityPosts(),
        ]);
        setPendingCounts({
          '/admin/applications': applications.filter((a) => a.status === 'PENDING').length,
          '/admin/reviews': reviews.filter((r) => r.status === 'PENDING').length + inquiries.filter((i) => i.status === 'NEW').length,
          '/admin/community': communityPosts.filter((p) => p.status === 'PENDING').length,
        });
      } catch {
        // Non-critical — sidebar just won't show counts this load.
      }
    }
    loadPendingCounts();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(auth);
    router.push('/admin/login');
  };

  const navItems = [
    {
      href: '/admin',
      label: { ar: 'لوحة المؤشرات', en: 'Dashboard' },
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/analytics',
      label: { ar: 'التحليلات', en: 'Analytics' },
      icon: BarChart3,
    },
    {
      href: '/admin/locations',
      label: { ar: 'المحافظات والمدن', en: 'Governorates & Cities' },
      icon: MapPin,
      badge: 'Zero Hardcoding',
    },
    {
      href: '/admin/categories',
      label: { ar: 'الفئات والأنواع', en: 'Categories & Types' },
      icon: FolderTree,
    },
    {
      href: '/admin/taxonomies',
      label: { ar: 'الاعتمادات والمناهج', en: 'Accreditations & Taxonomies' },
      icon: Tags,
    },
    {
      href: '/admin/institutions',
      label: { ar: 'إدارة المؤسسات التعليمية', en: 'Institutions Directory' },
      icon: Building2,
    },
    {
      href: '/admin/tutors',
      label: { ar: 'إدارة الأساتذة الخصوصيين', en: 'Private Tutors' },
      icon: UserCheck,
    },
    {
      href: '/admin/bookings',
      label: { ar: 'كافة الحجوزات', en: 'All Bookings' },
      icon: Calendar,
    },
    {
      href: '/admin/jobs',
      label: { ar: 'الوظائف الشاغرة', en: 'Job Postings' },
      icon: Briefcase,
    },
    {
      href: '/admin/employers',
      label: { ar: 'الشركات والمنظمات', en: 'Companies & NGOs' },
      icon: Briefcase,
    },
    {
      href: '/admin/applications',
      label: { ar: 'طلبات الانضمام', en: 'Join Applications' },
      icon: FileCheck2,
    },
    {
      href: '/admin/reviews',
      label: { ar: 'التقييمات والاستفسارات', en: 'Reviews & Inquiries' },
      icon: MessageSquareText,
    },
    {
      href: '/admin/community',
      label: { ar: 'مجتمع الأهالي', en: 'Community' },
      icon: Users,
    },
    {
      href: '/admin/errors',
      label: { ar: 'أخطاء النظام', en: 'System Errors' },
      icon: Bug,
    },
    {
      href: '/admin/settings',
      label: { ar: 'إعدادات النظام واللافتات', en: 'System Settings & CMS' },
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-[#0B192C] text-white flex flex-col shrink-0 border-e border-slate-800 shadow-xl">
        {/* Top Branding */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3E62] flex items-center justify-center text-[#F1C40F]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Eduraq Admin
              </span>
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t('لوحة تحكم السوبر أدمن', 'Superadmin Suite')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1E3E62] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F1C40F]' : 'text-slate-400'}`} />
                  <span>{language === 'en' ? item.label.en : item.label.ar}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    {item.badge}
                  </span>
                )}
                {!item.badge && !!pendingCounts[item.href] && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center">
                    {pendingCounts[item.href]}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to Public Web App */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t('العودة للموقع الرئيسي', 'Back to Public Website')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-xs font-bold text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('تسجيل الخروج', 'Log Out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{t('إدارة النظام', 'Administration')}</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">
              {pathname === '/admin' ? t('نظرة عامة', 'Overview') : pathname.split('/').pop()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('قاعدة البيانات متصلة وجاهزة', 'Firebase Live Connected')}
            </span>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
