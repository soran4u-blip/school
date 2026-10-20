'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getAllCommunityPosts, updateCommunityPostStatus, deleteCommunityPost } from '@/core/services/communityService';
import { getGovernorates } from '@/core/services/masterDataService';
import { CommunityPost } from '@/core/types/community';
import { Governorate } from '@/core/types/masterData';
import { Users, Check, X, Trash2, AlertCircle, MapPin } from 'lucide-react';
import { useT } from '@/lib/useT';
import { ADMIN_COMMUNITY_COPY } from './AdminCommunity.i18n';
import { pickLocalized } from '@/lib/localized';

export default function AdminCommunityPage() {
  const { language } = useLanguage();
  const t = useT(ADMIN_COMMUNITY_COPY);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allPosts, govs] = await Promise.all([
        getAllCommunityPosts(),
        getGovernorates(false),
      ]);
      setPosts(allPosts);
      setGovernorates(govs);
    } catch {
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useLoadOnMount(loadData);

  const governorateName = (id: string) => {
    const gov = governorates.find((g) => g.id === id);
    return gov ? pickLocalized(gov.name, language) : id;
  };

  const handleDecision = async (id: string, status: CommunityPost['status']) => {
    await updateCommunityPostStatus(id, status);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await deleteCommunityPost(id);
    await loadData();
  };

  const pending = posts.filter((p) => p.status === 'PENDING');
  const resolved = posts.filter((p) => p.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800">{t('pendingReview')} ({pending.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('loading')}</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('emptyPending')}</div>
          ) : (
            pending.map((post) => (
              <div key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{post.title}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      <MapPin className="w-3 h-3" />
                      {governorateName(post.governorateId)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{post.body}</p>
                  <p className="text-[11px] text-slate-400 font-semibold">{post.authorName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecision(post.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('approve')}
                  </button>
                  <button
                    onClick={() => handleDecision(post.id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800">{t('allDiscussions')} ({resolved.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {resolved.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('emptyAll')}</div>
          ) : (
            resolved.map((post) => (
              <div key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{post.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      post.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold">{governorateName(post.governorateId)} &middot; {post.replyCount} {t('replies')}</p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg text-[11px] font-bold shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('delete')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
