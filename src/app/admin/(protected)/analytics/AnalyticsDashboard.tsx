'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { AnalyticsSnapshot } from '@/core/types/analytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Building2,
  Briefcase,
  Star,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { intlLocale } from '@/lib/locales';
import { useT } from '@/lib/useT';
import { ANALYTICS_COPY } from './Analytics.i18n';

const NAVY = '#0B192C';
const NAVY2 = '#1E3E62';
const GOLD = '#F1C40F';
const EMERALD = '#10B981';
const SLATE = '#94A3B8';
const RED = '#EF4444';

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-xs p-5';

// Renders a precomputed snapshot — see core/types/analytics.ts for why the figures are computed
// on a schedule rather than derived here. This component does no data fetching beyond asking for
// a fresh snapshot when the admin presses Refresh.
export default function AnalyticsDashboard({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const { language } = useLanguage();
  const t = useT(ANALYTICS_COPY);
  const router = useRouter();
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState('');

  // Colour is presentation, so it's applied here rather than stored in the snapshot.
  const pipeline = snapshot.jobPipeline.map((row) => ({
    ...row,
    fill: row.status === 'HIRED' ? EMERALD : row.status === 'REJECTED' ? RED : NAVY2,
  }));
  const COMMUNITY_LABELS: Record<string, { key: 'statusPending' | 'statusApproved' | 'statusRejected'; fill: string }> = {
    PENDING: { key: 'statusPending', fill: GOLD },
    APPROVED: { key: 'statusApproved', fill: EMERALD },
    REJECTED: { key: 'statusRejected', fill: RED },
  };
  const community = snapshot.communityBreakdown.map((row) => ({
    name: COMMUNITY_LABELS[row.status] ? t(COMMUNITY_LABELS[row.status].key) : row.status,
    value: row.count,
    fill: COMMUNITY_LABELS[row.status]?.fill || SLATE,
  }));

  const handleRecompute = async () => {
    setRecomputing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/analytics/recompute', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Recompute failed');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('refreshFailed'));
    } finally {
      setRecomputing(false);
    }
  };

  const computedAt = new Date(snapshot.computedAt).toLocaleString(language === 'en' ? 'en-GB' : intlLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          {t('title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap -mt-4">
        <p className="text-xs text-slate-400">
          {t('lastComputed')} {computedAt}
        </p>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
          <span>{recomputing ? t('recomputing') : t('recompute')}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 -mt-4">{error}</div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('activeListings')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{snapshot.totals.activeListings}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('activeJobs')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{snapshot.totals.activeJobs}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('hireRate')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{snapshot.hireRate.toFixed(1)}%</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pendingReview')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{snapshot.pending.total}</div>
        </div>
      </div>

      {/* Signups over time */}
      <div className={CARD}>
        <h2 className="font-bold text-slate-900 mb-1">{t('signupsTitle')}</h2>
        <p className="text-xs text-slate-500 mb-4">{t('signupsHint')}</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={snapshot.signupSeries} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: SLATE }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Institutions" stroke={NAVY2} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Tutors" stroke={GOLD} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Employers" stroke={EMERALD} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Join-application funnel */}
        <div className={CARD}>
          <h2 className="font-bold text-slate-900 mb-1">{t('applicationsByStatus')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={snapshot.applicationFunnel} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="INSTITUTION" stackId="a" fill={NAVY2} />
              <Bar dataKey="TUTOR" stackId="a" fill={GOLD} />
              <Bar dataKey="EMPLOYER" stackId="a" fill={EMERALD} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs pipeline */}
        <div className={CARD}>
          <h2 className="font-bold text-slate-900 mb-1">{t('jobPipeline')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipeline} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 11, fill: SLATE }} />
              <Tooltip />
              <Bar dataKey="count">
                {pipeline.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Community breakdown */}
        <div className={CARD}>
          <h2 className="font-bold text-slate-900 mb-1">{t('communityPosts')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={community} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {community.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic distribution */}
        <div className={CARD}>
          <h2 className="font-bold text-slate-900 mb-1">{t('geoTitle')}</h2>
          <p className="text-xs text-slate-500 mb-2">{t('geoHint')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={snapshot.geoDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: SLATE }} />
              <Tooltip />
              <Bar dataKey="count" fill={NAVY2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reviews summary */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-slate-900">{t('reviewsInquiries')}</h2>
          {snapshot.avgRating !== null && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {snapshot.avgRating.toFixed(1)} {t('avgRating')}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-2xl font-black text-slate-900">{snapshot.pending.reviews}</div>
            <div className="text-xs text-slate-500">{t('reviewsPending')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{snapshot.totals.reviewsApproved}</div>
            <div className="text-xs text-slate-500">{t('reviewsApproved')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{snapshot.pending.inquiries}</div>
            <div className="text-xs text-slate-500">{t('newInquiries')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{snapshot.totals.inquiriesClosed}</div>
            <div className="text-xs text-slate-500">{t('inquiriesClosed')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
