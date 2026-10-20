'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { getApprovedCommunityPosts, getCommunityPostById, hasLikedCommunityPost, toggleCommunityPostLike } from '@/core/services/communityService';
import { Governorate } from '@/core/types/masterData';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { COMMUNITY_COPY } from './Community.i18n';
import { DEFAULT_GOVERNORATES } from './communityGovernorates';
import CommunityHero from './_components/CommunityHero';
import CommunityFilters, { type CommunityTab } from './_components/CommunityFilters';
import CommunityPostCard from './_components/CommunityPostCard';
import CommunitySidebar from './_components/CommunitySidebar';
import { FeedEmpty, FeedError, FeedSkeleton } from './_components/CommunityStates';
import { CommunityPost } from '@/core/types/community';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';

interface CommunityContentProps {
  initialGovernorate?: string;
  initialPosts?: CommunityPost[];
  initialGovernorates?: Governorate[];
}

export default function CommunityContent({
  initialGovernorate,
  initialPosts,
  initialGovernorates,
}: CommunityContentProps) {
  const { language } = useLanguage();
  const t = useT(COMMUNITY_COPY);

  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts || []);
  const [governorates, setGovernorates] = useState<Governorate[]>(initialGovernorates || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState('');

  // Interactive filters & tabs
  const [selectedGov, setSelectedGov] = useState(initialGovernorate || 'all');
  const [activeTab, setActiveTab] = useState<CommunityTab>('all');
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
      setError(t('loadError'));
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <CommunityHero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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
            <CommunityFilters
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              totalCount={posts.length}
              savedCount={savedPostIds.size}
              shownCount={filteredAndSortedPosts.length}
              selectedGov={selectedGov}
              setSelectedGov={setSelectedGov}
              activeGovernorates={activeGovernorates}
              govCounts={govCounts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Content States: Loading, Error, Empty, or Post Cards */}
            {loading ? (
              <FeedSkeleton />
            ) : error ? (
              <FeedError message={error} onRetry={() => void load()} />
            ) : filteredAndSortedPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedPosts.map((post) => {
                  const gov = activeGovernorates.find((g) => g.id === post.governorateId);
                  const govName = gov ? pickLocalized(gov.name, language) : post.governorateId;
                  const isLiked = likedRealPostIds.has(post.id);

                  return (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      governorateName={govName}
                      isLiked={isLiked}
                      isSaved={savedPostIds.has(post.id)}
                      copied={copiedId === post.id}
                      onToggleHelpful={(e) => handleToggleHelpful(e, post.id)}
                      onToggleSaved={() => toggleSavedPost(post.id)}
                      onShare={(e) => void handleShare(e, post)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Rich Empty State */
              <FeedEmpty
                searching={Boolean(searchQuery)}
                filtered={Boolean(searchQuery) || selectedGov !== 'all'}
                onClearFilters={() => {
                  setSearchQuery('');
                  setSelectedGov('all');
                  setActiveTab('all');
                }}
              />
            )}
          </div>

          {/* =======================================================================
              SIDEBAR COLUMN (4 COLS)
          ======================================================================== */}
          <CommunitySidebar setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
