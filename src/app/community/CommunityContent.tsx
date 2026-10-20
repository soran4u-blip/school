'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { getApprovedCommunityPosts, getCommunityPostById, hasLikedCommunityPost, toggleCommunityPostLike } from '@/core/services/communityService';
import { Governorate } from '@/core/types/masterData';
import { CommunityPost } from '@/core/types/community';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import {
  MessageCircle,
  MapPin,
  Plus,
  RefreshCw,
  Users,
  Search,
  Flame,
  Clock,
  HelpCircle,
  Sparkles,
  Share2,
  Bookmark,
  ThumbsUp,
  ShieldCheck,
  Building2,
  GraduationCap,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';

interface CommunityContentProps {
  initialGovernorate?: string;
  initialPosts?: CommunityPost[];
  initialGovernorates?: Governorate[];
}

// Fallback governorates in case master data is still initializing
const DEFAULT_GOVERNORATES: Governorate[] = [
  { id: 'baghdad', name: { ar: 'بغداد', en: 'Baghdad' }, code: 'BG', region: 'CENTRAL', lat: 33.3152, lng: 44.3661, isActive: true, displayOrder: 1 },
  { id: 'erbil', name: { ar: 'أربيل', en: 'Erbil' }, code: 'ER', region: 'KURDISTAN', lat: 36.1901, lng: 44.0091, isActive: true, displayOrder: 2 },
  { id: 'basra', name: { ar: 'البصرة', en: 'Basra' }, code: 'BS', region: 'SOUTH', lat: 30.5081, lng: 47.7835, isActive: true, displayOrder: 3 },
  { id: 'sulaymaniyah', name: { ar: 'السليمانية', en: 'Sulaymaniyah' }, code: 'SU', region: 'KURDISTAN', lat: 35.5558, lng: 45.4351, isActive: true, displayOrder: 4 },
  { id: 'najaf', name: { ar: 'النجف', en: 'Najaf' }, code: 'NJ', region: 'CENTRAL', lat: 32.0259, lng: 44.3462, isActive: true, displayOrder: 5 },
  { id: 'karbala', name: { ar: 'كربلاء', en: 'Karbala' }, code: 'KR', region: 'CENTRAL', lat: 32.616, lng: 44.0249, isActive: true, displayOrder: 6 },
  { id: 'ninawa', name: { ar: 'نينوى', en: 'Nineveh' }, code: 'NI', region: 'NORTH', lat: 36.34, lng: 43.13, isActive: true, displayOrder: 7 },
  { id: 'kirkuk', name: { ar: 'كركوك', en: 'Kirkuk' }, code: 'KI', region: 'NORTH', lat: 35.4681, lng: 44.3922, isActive: true, displayOrder: 8 },
];

function formatTimeAgo(isoString: string, language: string): string {
  try {
    const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (language === 'en') {
      if (minutes < 5) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      if (days < 30) return `${days}d ago`;
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (minutes < 5) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours === 1) return 'منذ ساعة';
    if (hours === 2) return 'منذ ساعتين';
    if (hours < 11) return `منذ ${hours} ساعات`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return 'أمس';
    if (days === 2) return 'منذ يومين';
    if (days < 11) return `منذ ${days} أيام`;
    return `منذ ${days} يوماً`;
  } catch {
    return language === 'en' ? 'Recently' : 'مؤخراً';
  }
}

// Generate pastel avatar styling based on the author's name
function getAvatarStyles(name: string) {
  const colors = [
    { bg: 'bg-blue-100 text-emerald-800 border-[#D5E3DC]' },
    { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    { bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    { bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const color = colors[sum % colors.length];
  const initial = (name.trim()[0] || '؟').toUpperCase();
  return { className: color.bg, initial };
}

export default function CommunityContent({
  initialGovernorate,
  initialPosts,
  initialGovernorates,
}: CommunityContentProps) {
  const { language, t } = useLanguage();
  const isRtl = language !== 'en';

  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts || []);
  const [governorates, setGovernorates] = useState<Governorate[]>(initialGovernorates || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState('');

  // Interactive filters & tabs
  const [selectedGov, setSelectedGov] = useState(initialGovernorate || 'all');
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'latest' | 'unanswered' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [likedRealPostIds, setLikedRealPostIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // Read after mount so server and first client render match; deferred to keep setState out of
  // the effect body.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem('eduraq-community-saved-posts');
        if (saved) setSavedPostIds(new Set(JSON.parse(saved) as string[]));
      } catch { /* Continue without persisted preferences if storage is blocked. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleSavedPost = useCallback((postId: string) => {
    setSavedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      try { window.localStorage.setItem('eduraq-community-saved-posts', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // Real posts need a stable identity to record a "helpful" like against — an anonymous
  // Firebase Auth session, same identity model createCommunityReply already relies on.
  const ensureAnonUid = useCallback(async (): Promise<string> => {
    if (auth.currentUser) return auth.currentUser.uid;
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let timeoutId: number | undefined;
    try {
      const result = await Promise.race([
        Promise.all([getGovernorates(), getApprovedCommunityPosts()]),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('Community load timed out')), 8000);
        }),
      ]);
      const [govs, list] = result;
      setGovernorates(govs && govs.length > 0 ? govs : DEFAULT_GOVERNORATES);
      // Only render approved posts from the service; never substitute fabricated activity.
      setPosts(list || []);
    } catch {
      setGovernorates(DEFAULT_GOVERNORATES);
      setError(t('تعذر تحميل النقاشات. تحقق من اتصالك ثم حاول مرة أخرى.', 'We couldn’t load discussions. Check your connection and try again.'));
      setPosts([]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [t]);

  // The server only passes initialPosts when it found some; without them `loading` starts true
  // and nothing else would ever clear it. Runs once so a language switch doesn't refetch.
  const initialLoadStarted = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialLoadStarted.current) return;
      initialLoadStarted.current = true;
      if (!initialPosts) {
        void load();
      } else if (!initialGovernorates || initialGovernorates.length === 0) {
        getGovernorates()
          .then((g) => setGovernorates(g && g.length > 0 ? g : DEFAULT_GOVERNORATES))
          .catch(() => setGovernorates(DEFAULT_GOVERNORATES));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialPosts, initialGovernorates, load]);

  // Once real posts are known, check which of them the current visitor already liked, so a
  // reload doesn't just show every "helpful" button as unliked (the bug this was added to fix).
  // Also re-fetch each post's live helpfulCount directly (uncached getCommunityPostById) rather
  // than trusting `posts`, since the server-rendered initialPosts comes from
  // getPublicCommunityPosts() which is unstable_cache'd for 5 minutes — a like toggle has no
  // server route to call revalidateTag from, so a fresh full-page load would otherwise show a
  // stale (often zero) count for up to that long.
  // Keyed on the id set (not the `posts` array itself) so an optimistic helpfulCount bump from
  // handleToggleHelpful doesn't re-trigger this and re-fetch everything again.
  const realPostIdsKey = useMemo(
    () => posts.map((p) => p.id).join(','),
    [posts]
  );
  useEffect(() => {
    const realPostIds = realPostIdsKey ? realPostIdsKey.split(',') : [];
    if (realPostIds.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const uid = await ensureAnonUid();
        const [likedResults, freshPosts] = await Promise.all([
          Promise.all(realPostIds.map((id) => hasLikedCommunityPost(id, uid))),
          Promise.all(realPostIds.map((id) => getCommunityPostById(id))),
        ]);
        if (cancelled) return;
        setLikedRealPostIds(new Set(realPostIds.filter((_, i) => likedResults[i])));
        const freshCounts = new Map(freshPosts.filter(Boolean).map((p) => [p!.id, p!.helpfulCount || 0]));
        setPosts((prev) => prev.map((p) => (freshCounts.has(p.id) ? { ...p, helpfulCount: freshCounts.get(p.id) } : p)));
      } catch {
        // A stale count / not-liked-state here is a soft failure — the UI just falls back to
        // whatever the server-rendered snapshot had.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [realPostIdsKey, ensureAnonUid]);

  // Combine governorates list
  const activeGovernorates = useMemo(() => {
    return governorates.length > 0 ? governorates : DEFAULT_GOVERNORATES;
  }, [governorates]);

  // Filtering & Sorting Logic
  const filteredAndSortedPosts = useMemo(() => {
    let list = [...posts];

    // Governorate Filter
    if (selectedGov !== 'all') {
      list = list.filter((p) => p.governorateId === selectedGov);
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
      );
    }

    // Active Tab Logic
    if (activeTab === 'saved') {
      list = list.filter((p) => savedPostIds.has(p.id));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (activeTab === 'hot') {
      // Most replies first
      list.sort((a, b) => b.replyCount - a.replyCount);
    } else if (activeTab === 'latest') {
      // Newest first
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (activeTab === 'unanswered') {
      // 0 replies
      list = list.filter((p) => p.replyCount === 0);
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      // Default: mix of new and hot
      list.sort((a, b) => {
        if (a.replyCount > 0 && b.replyCount === 0) return -1;
        if (b.replyCount > 0 && a.replyCount === 0) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    }

    return list;
  }, [posts, selectedGov, searchQuery, activeTab, savedPostIds]);

  // Calculations for governorate counts
  const govCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      counts[p.governorateId] = (counts[p.governorateId] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Community Statistics
  const handleToggleHelpful = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const wasLiked = likedRealPostIds.has(postId);
    const delta = wasLiked ? -1 : 1;

    // Optimistic update: flip the like state and bump the post's own helpfulCount immediately.
    setLikedRealPostIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, helpfulCount: Math.max(0, (p.helpfulCount || 0) + delta) } : p))
    );

    (async () => {
      try {
        const uid = await ensureAnonUid();
        const result = await toggleCommunityPostLike(postId, uid);
        // Reconcile with the server's actual resulting count in case of a race.
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, helpfulCount: result.helpfulCount } : p)));
      } catch {
        // Revert the optimistic update on failure (e.g. offline, or the post got unapproved).
        setLikedRealPostIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, helpfulCount: Math.max(0, (p.helpfulCount || 0) - delta) } : p))
        );
      }
    })();
  };

  const handleShare = async (e: React.MouseEvent, post: CommunityPost) => {
    e.preventDefault();
    e.stopPropagation();
    // Mock sample posts don't have real pages — share the community listing instead
    const path = post.id.startsWith('mock-') ? '/community' : `/community/${post.slug || post.id}`;
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedId(post.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      // ignore
    }
  };

  const popularTopics = [
    { label: t('المناهج الدولية', 'International Curricula'), query: 'دولية' },
    { label: t('أقساط المدارس الأهلية', 'Private School Fees'), query: 'أقساط' },
    { label: t('خطوط النقل المدرسي', 'School Transport'), query: 'نقل' },
    { label: t('رياض الأطفال والحضانات', 'Kindergartens & KG'), query: 'رياض الأطفال' },
    { label: t('امتحانات الثالث والسادس', 'Ministerial Exams'), query: 'متوسط' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      {/* =========================================================================
          HERO BANNER: Warm, Engaging Parent & Student Community Hub
      ========================================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#123D35] via-[#174A40] to-[#28675A] text-white pt-7 pb-9 sm:pt-9 sm:pb-11 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        {/* Subtle decorative background glowing orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D9F27C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-5">
          {/* Breadcrumb & Community Tag */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
            <span className="text-slate-400">{t('الرئيسية', 'Home')}</span>
            <span className="text-slate-600">/</span>
            <span className="text-[#D9F27C] font-bold">{t('دليل العراق التعليمي', 'Eduraq Directory')}</span>
            <span className="text-slate-600">/</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[#D9F27C] text-[11px] font-extrabold tracking-wide">
              <Sparkles className="w-3 h-3" />
              <span>{t('منتدى الأهالي التفاعلي', 'Interactive Parents Forum')}</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                {t(
                  'اسأل، شارك، وتواصل مع أهالي وطلاب العراق',
                  'Ask, Share, and Connect with Iraq’s Parent & Student Community'
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                {t(
                  'مساحة موثوقة لتبادل التجارب الحقيقية حول المدارس الأهلية والحكومية، المناهج، الأقساط، خطوط النقل، والمدرسين الخصوصيين في كافة المحافظات.',
                  'A trusted platform to share real experiences regarding private & public schools, curricula, tuition fees, bus transport, and private tutors across Iraq.'
                )}
              </p>
            </div>

            {/* Quick Action Button in Hero */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                href="/community/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#123D35] font-extrabold text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all transform active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{t('طرح سؤال جديد', 'Ask a Question')}</span>
              </Link>
            </div>
          </div>

          {/* Integrated Community Search Bar */}
          <div className="pt-2">
            <div className="relative max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/15 shadow-xl flex items-center gap-2">
              <div className="ps-3 text-slate-300">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                aria-label={t('البحث في نقاشات المجتمع', 'Search community discussions')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'ابحث في تجارب وأسئلة الأهالي (مثال: المنهاج البريطاني، باصات اليرموك، أقساط الروضة...)',
                  'Search questions & experiences (e.g. British curriculum, school buses, nursery fees...)'
                )}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-hidden py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('مسح البحث', 'Clear search')}
                  className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  title={t('مسح', 'Clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN LAYOUT: 2-Column Responsive Feed & Community Sidebar
      ========================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* =======================================================================
              FEED COLUMN (8 COLS)
          ======================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search is in the hero; keep filters close to the results. */}
            {/* Filter Tabs & Governorate Chips */}
            <div className="space-y-4">
              {/* Tab Navigation (All, Hot, Latest, Unanswered) */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8E6DE] bg-white p-2 sm:p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    aria-pressed={activeTab === 'all'}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'all'
                        ? 'bg-[#123D35] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t('كل النقاشات', 'All Discussions')}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {posts.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('hot')}
                    aria-pressed={activeTab === 'hot'}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'hot'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{t('الأنشط تفاعلاً', 'Hot / Trending')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('latest')}
                    aria-pressed={activeTab === 'latest'}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'latest'
                        ? 'bg-[#123D35] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('الأحدث', 'Latest')}</span>
                  </button>

                  <button type="button" onClick={() => setActiveTab('saved')} aria-pressed={activeTab === 'saved'} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'saved' ? 'bg-[#123D35] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Bookmark className="w-3.5 h-3.5" /><span>{t('المحفوظات', 'Saved')}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{savedPostIds.size}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('unanswered')}
                    aria-pressed={activeTab === 'unanswered'}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'unanswered'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t('بانتظار إجابة', 'Needs Help')}</span>
                  </button>
                </div>

                {/* Counter indicator */}
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 shrink-0 ms-auto">
                  {filteredAndSortedPosts.length} {t('نقاش معروض', 'showing')}
                </div>
              </div>

              {/* Governorate Filter Chips (Horizontal Scrollable) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedGov('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                    selectedGov === 'all'
                      ? 'bg-[#123D35] text-white border-[#123D35] shadow-sm'
                      : 'bg-white text-slate-700 border-[#E8E6DE] hover:border-slate-300'
                  }`}
                >
                  {t('كافة المحافظات', 'All Governorates')}
                </button>

                {activeGovernorates.map((gov) => {
                  const count = govCounts[gov.id] || 0;
                  const isSelected = selectedGov === gov.id;
                  const govName = language === 'en' ? gov.name.en : gov.name.ar;

                  return (
                    <button
                      key={gov.id}
                      type="button"
                      onClick={() => setSelectedGov(gov.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#123D35] text-white border-[#123D35] shadow-sm'
                          : 'bg-white text-slate-700 border-[#E8E6DE] hover:border-slate-300'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 ${isSelected ? 'text-[#D9F27C]' : 'text-slate-400'}`} />
                      <span>{govName}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Search / Filter Banner */}
            {(searchQuery || selectedGov !== 'all' || activeTab !== 'all') && (
              <div className="bg-emerald-50/70 border border-[#D5E3DC] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{t('الفلاتر النشطة:', 'Active filters:')}</span>
                  {selectedGov !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                      {activeGovernorates.find((g) => g.id === selectedGov)?.name[language === 'en' ? 'en' : 'ar'] || selectedGov}
                      <button onClick={() => setSelectedGov('all')} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                      &quot;{searchQuery}&quot;
                      <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {activeTab !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                      {activeTab === 'hot' && t('الأنشط', 'Hot')}
                      {activeTab === 'latest' && t('الأحدث', 'Latest')}
                      {activeTab === 'unanswered' && t('بانتظار إجابة', 'Unanswered')}
                      {activeTab === 'saved' && t('المحفوظات', 'Saved')}
                      <button onClick={() => setActiveTab('all')} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedGov('all');
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  className="text-[#28675A] hover:text-emerald-900 font-bold underline shrink-0"
                >
                  {t('إعادة ضبط الفلاتر', 'Reset')}
                </button>
              </div>
            )}

            {/* Content States: Loading, Error, Empty, or Post Cards */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-[#E8E6DE] p-6 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-32 h-3.5 bg-slate-200 rounded-sm" />
                        <div className="w-20 h-2.5 bg-slate-100 rounded-sm" />
                      </div>
                    </div>
                    <div className="w-3/4 h-4 bg-slate-200 rounded-sm" />
                    <div className="w-full h-12 bg-slate-100 rounded-sm" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white p-12 rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800">{t('تعذر تحميل المجتمع', 'Community unavailable')}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#123D35] text-white rounded-xl text-xs font-bold hover:bg-[#28675A] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('حاول مرة أخرى', 'Try again')}</span>
                </button>
              </div>
            ) : filteredAndSortedPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedPosts.map((post) => {
                  const gov = activeGovernorates.find((g) => g.id === post.governorateId);
                  const govName = gov ? (language === 'en' ? gov.name.en : gov.name.ar) : post.governorateId;
                  const postHref = `/community/${post.slug || post.id}`;
                  const avatar = getAvatarStyles(post.authorName);
                  const helpfulCount = post.helpfulCount || 0;
                  const isLiked = likedRealPostIds.has(post.id);
                  const hasReplies = post.replyCount > 0;

                  return (
                    <article
                      key={post.id}
                      className="group bg-white rounded-2xl border border-[#E8E6DE] shadow-sm hover:shadow-md hover:border-[#B8CFC4] transition-all duration-200 p-4 sm:p-5"
                    >
                      {/* Post Header: Author, Verification, Time, and Governorate Pill */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${avatar.className}`}
                          >
                            {avatar.initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors">
                                {post.authorName}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatTimeAgo(post.createdAt, language)}
                            </span>
                          </div>
                        </div>

                        {/* Badges: Governorate and Answer Status */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-[#D5E3DC]">
                            <MapPin className="w-3 h-3 text-[#28675A]" />
                            <span>{govName}</span>
                          </span>

                          {hasReplies ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>
                                {post.replyCount} {t('ردود', 'replies')}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>{t('بانتظار إجابة', 'Awaiting reply')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Title */}
                      <Link href={postHref} className="block mt-3.5">
                        <h2 className="font-black text-base sm:text-lg text-slate-900 leading-snug group-hover:text-[#28675A] transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Body Snippet */}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed mt-2">
                        {post.body}
                      </p>

                      {/* Footer Actions: Engagement Bar */}
                      <div className="flex items-center justify-between gap-4 mt-4 pt-3.5 border-t border-slate-100 flex-wrap">
                        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold text-slate-500">
                          {/* Reply Link */}
                          <Link
                            href={postHref}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-[#28675A] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {post.replyCount === 0
                                ? t('كن أول من يرد', 'Be the first to reply')
                                : `${post.replyCount} ${t('ردود ومشاركات', 'replies')}`}
                            </span>
                          </Link>

                          {/* Helpful Like Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleHelpful(e, post.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                              isLiked
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                            <span>
                              {helpfulCount > 0 && helpfulCount} {t('مفيد', 'Helpful')}
                            </span>
                          </button>

                          {/* Save discussion for later */}
                          <button type="button" onClick={() => toggleSavedPost(post.id)} aria-pressed={savedPostIds.has(post.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${savedPostIds.has(post.id) ? 'bg-[#D9F27C]/40 text-[#123D35]' : 'bg-slate-50 hover:bg-emerald-50 text-slate-600'}`} title={savedPostIds.has(post.id) ? t('إزالة من المحفوظات', 'Remove saved discussion') : t('حفظ لوقت لاحق', 'Save discussion for later')}>
                            <Bookmark className={`w-3.5 h-3.5 ${savedPostIds.has(post.id) ? 'fill-current' : ''}`} /><span className="hidden sm:inline">{savedPostIds.has(post.id) ? t('محفوظ', 'Saved') : t('حفظ', 'Save')}</span>
                          </button>

                          {/* Share Button */}
                          <button
                            type="button"
                            onClick={(e) => void handleShare(e, post)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                            title={t('مشاركة النقاش', 'Share discussion')}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            {copiedId === post.id && (
                              <span className="text-[10px] text-emerald-600 font-bold">{t('تم النسخ!', 'Copied!')}</span>
                            )}
                          </button>
                        </div>

                        {/* Direct View Thread Action */}
                        <Link
                          href={postHref}
                          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#123D35] group-hover:text-[#28675A] transition-colors"
                        >
                          <span>
                            {t('قراءة التفاصيل والردود', 'Read full discussion')}
                          </span>
                          {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Rich Empty State */
              <div className="bg-white p-12 rounded-2xl border border-[#E8E6DE] text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#28675A] flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {searchQuery ? t('لم نجد نقاشات تطابق بحثك', 'No matching discussions found') : t('لا توجد نقاشات بعد في هذا الفلتر', 'No discussions yet')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {searchQuery
                    ? t(
                        'جرب البحث بكلمة أخرى أو تصفح كل المحافظات لطرح سؤالك على الأهالي.',
                        'Try searching for different keywords or explore all governorates.'
                      )
                    : t(
                        'كن أول من يطرح سؤالاً أو يشارك تجربته مع مجتمع الأهالي والطلاب هنا.',
                        'Be the first to ask a question or share your experience with the community.'
                      )}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  {(searchQuery || selectedGov !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGov('all');
                        setActiveTab('all');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      {t('إلغاء الفلاتر', 'Clear Filters')}
                    </button>
                  )}
                  <Link
                    href="/community/new"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('طرح هذا السؤال الآن', 'Ask this question now')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* =======================================================================
              SIDEBAR COLUMN (4 COLS)
          ======================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Widget 1: Community Guidelines & Safe Space */}
            <div className="bg-white rounded-2xl border border-[#E8E6DE] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {t('مساحة آمنة وموثوقة', 'Safe & Trusted Community')}
                  </h3>
                  <p className="text-[11px] text-slate-400">{t('إرشادات المشاركة والنقاش', 'Community Rules')}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('تجارب واقعية حيادية تساعد الأهالي على اتخاذ قرارات صحيحة.', 'Authentic parent experiences helping families make informed choices.')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('حوار محترم وبناء؛ تراجع الإدارة كافة المنشورات قبل النشر.', 'Respectful dialogue; all questions are moderated prior to publishing.')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('يمنع الإعلان التجاري غير المرخص أو الترويج المضلل.', 'No unauthorized promotional spam or misleading advertisements.')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/community/new"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#123D35] rounded-xl text-xs font-bold border border-[#E8E6DE] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('ابدأ نقاشاً مع المجتمع', 'Start a Discussion')}</span>
                </Link>
              </div>
            </div>

            {/* Widget 2: Popular Community Topics */}
            <div className="bg-white rounded-2xl border border-[#E8E6DE] p-4 sm:p-5 shadow-sm space-y-3.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{t('مواضيع متداولة وشائعة', 'Trending Topics')}</span>
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {popularTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchQuery(topic.query)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#28675A] border border-[#E8E6DE] transition-colors"
                  >
                    #{topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Widget 3: Directory Bridge CTA */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>{t('تبحث عن مدرسة موثقة مباشرة؟', 'Looking for verified schools?')}</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {t(
                  'استكشف دليل المدارس، رياض الأطفال، والمعاهد المعتمدة مع تفاصيل الأقساط والمناهج والمواقع الجغرافية.',
                  'Explore accredited schools, nurseries, and institutes with tuition, curricula, and map locations.'
                )}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1 text-xs font-black text-amber-950 hover:underline"
                >
                  <span>{t('استعراض الدليل الشامل', 'Explore Directory')}</span>
                  {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
                <span className="text-amber-400">|</span>
                <Link
                  href="/tutors"
                  className="inline-flex items-center gap-1 text-xs font-black text-amber-950 hover:underline"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('المدرسين الخصوصيين', 'Private Tutors')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
