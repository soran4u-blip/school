'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { CommunityPost } from '@/core/types/community';
import { Bookmark, ChevronRight, MapPin, MessageCircle, Share2, Sparkles, ThumbsUp } from 'lucide-react';
import { COMMUNITY_COPY } from '../Community.i18n';
import { formatTimeAgo } from '../communityTime';

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

export default function CommunityPostCard({
  post,
  governorateName,
  isLiked,
  isSaved,
  copied,
  onToggleHelpful,
  onToggleSaved,
  onShare,
}: {
  post: CommunityPost;
  governorateName: string;
  isLiked: boolean;
  isSaved: boolean;
  copied: boolean;
  onToggleHelpful: (e: React.MouseEvent) => void;
  onToggleSaved: () => void;
  onShare: (e: React.MouseEvent) => void;
}) {
  const { language } = useLanguage();
  const t = useT(COMMUNITY_COPY);
  const isRtl = language !== 'en';
  const govName = governorateName;
  const postHref = `/community/${post.slug || post.id}`;
  const avatar = getAvatarStyles(post.authorName);
  const helpfulCount = post.helpfulCount || 0;
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
                {t('repliesCount', { n: post.replyCount })}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{t('awaitingReply')}</span>
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
                ? t('beFirstReply')
                : t('repliesLong', { n: post.replyCount })}
            </span>
          </Link>

          {/* Helpful Like Button */}
          <button
            type="button"
            onClick={onToggleHelpful}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isLiked
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
            <span>
              {helpfulCount > 0 && helpfulCount} {t('helpful')}
            </span>
          </button>

          {/* Save discussion for later */}
          <button type="button" onClick={onToggleSaved} aria-pressed={isSaved} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${isSaved ? 'bg-[#D9F27C]/40 text-[#123D35]' : 'bg-slate-50 hover:bg-emerald-50 text-slate-600'}`} title={isSaved ? t('unsave') : t('saveLater')}>
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} /><span className="hidden sm:inline">{isSaved ? t('saved') : t('save')}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title={t('share')}
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied && (
              <span className="text-[10px] text-emerald-600 font-bold">{t('copied')}</span>
            )}
          </button>
        </div>

        {/* Direct View Thread Action */}
        <Link
          href={postHref}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#123D35] group-hover:text-[#28675A] transition-colors"
        >
          <span>
            {t('readFull')}
          </span>
          {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </Link>
      </div>
    </article>
  );
}
