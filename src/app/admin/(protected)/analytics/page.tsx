'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { Employer } from '@/core/types/employer';
import { Application } from '@/core/types/application';
import { Job, JobApplication } from '@/core/types/job';
import { Review, Inquiry } from '@/core/types/review';
import { CommunityPost } from '@/core/types/community';
import { Governorate } from '@/core/types/masterData';
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
} from 'lucide-react';

const NAVY = '#0B192C';
const NAVY2 = '#1E3E62';
const GOLD = '#F1C40F';
const EMERALD = '#10B981';
const SLATE = '#94A3B8';
const RED = '#EF4444';

type Loaded = {
  institutions: Institution[];
  tutors: Tutor[];
  employers: Employer[];
  applications: Application[];
  jobs: Job[];
  jobApplications: JobApplication[];
  reviews: Review[];
  inquiries: Inquiry[];
  communityPosts: CommunityPost[];
  governorates: Governorate[];
};

function weekKey(iso: string): string {
  const d = new Date(iso);
  // Start-of-week (Sunday) date, used as both the sort key and the label.
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return start.toISOString().slice(0, 10);
}

function lastNWeekKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    keys.push(weekKey(d.toISOString()));
  }
  return [...new Set(keys)];
}

function shortLabel(key: string): string {
  const d = new Date(key);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-xs p-5';

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    async function load() {
      const [
        institutions,
        tutors,
        employers,
        applications,
        jobs,
        jobApplications,
        reviews,
        inquiries,
        communityPosts,
        governorates,
      ] = await Promise.all([
        MasterDataService.getInstitutions({ status: 'ALL' }),
        MasterDataService.getTutors({ status: 'ALL' }),
        MasterDataService.getAllEmployers(),
        MasterDataService.getAllApplications(),
        MasterDataService.getAllJobs(),
        MasterDataService.getAllJobApplications(),
        MasterDataService.getAllReviews(),
        MasterDataService.getAllInquiries(),
        MasterDataService.getAllCommunityPosts(),
        MasterDataService.getGovernorates(false),
      ]);
      setData({
        institutions,
        tutors,
        employers,
        applications,
        jobs,
        jobApplications,
        reviews,
        inquiries,
        communityPosts,
        governorates,
      });
    }
    load();
  }, []);

  const govName = useMemo(() => {
    const map = new Map<string, string>();
    data?.governorates.forEach((g) => map.set(g.id, g.name.en));
    return (id: string) => map.get(id) || id;
  }, [data]);

  const signupSeries = useMemo(() => {
    if (!data) return [];
    const weeks = lastNWeekKeys(12);
    const counts = weeks.map((w) => ({
      week: w,
      label: shortLabel(w),
      Institutions: 0,
      Tutors: 0,
      Employers: 0,
    }));
    const idx = new Map(counts.map((c, i) => [c.week, i]));
    const bump = (createdAt: string, field: 'Institutions' | 'Tutors' | 'Employers') => {
      const key = weekKey(createdAt);
      const i = idx.get(key);
      if (i !== undefined) counts[i][field]++;
    };
    data.institutions.forEach((i) => bump(i.createdAt, 'Institutions'));
    data.tutors.forEach((tu) => bump(tu.createdAt, 'Tutors'));
    data.employers.forEach((e) => bump(e.createdAt, 'Employers'));
    return counts;
  }, [data]);

  const applicationFunnel = useMemo(() => {
    if (!data) return [];
    const statuses: Application['status'][] = ['PENDING', 'APPROVED', 'REJECTED'];
    return statuses.map((status) => ({
      status,
      TUTOR: data.applications.filter((a) => a.status === status && a.type === 'TUTOR').length,
      INSTITUTION: data.applications.filter((a) => a.status === status && a.type === 'INSTITUTION').length,
      EMPLOYER: data.applications.filter((a) => a.status === status && a.type === 'EMPLOYER').length,
    }));
  }, [data]);

  const jobPipeline = useMemo(() => {
    if (!data) return [];
    const statuses: JobApplication['status'][] = ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'];
    return statuses.map((status) => ({
      status,
      count: data.jobApplications.filter((a) => a.status === status).length,
      fill: status === 'HIRED' ? EMERALD : status === 'REJECTED' ? RED : NAVY2,
    }));
  }, [data]);

  const communityBreakdown = useMemo(() => {
    if (!data) return [];
    return [
      { name: t('قيد المراجعة', 'Pending'), value: data.communityPosts.filter((p) => p.status === 'PENDING').length, fill: GOLD },
      { name: t('منشور', 'Approved'), value: data.communityPosts.filter((p) => p.status === 'APPROVED').length, fill: EMERALD },
      { name: t('مرفوض', 'Rejected'), value: data.communityPosts.filter((p) => p.status === 'REJECTED').length, fill: RED },
    ];
  }, [data, t]);

  const geoDistribution = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    const bump = (id: string) => counts.set(id, (counts.get(id) || 0) + 1);
    data.institutions.forEach((i) => bump(i.governorateId));
    data.tutors.forEach((tu) => bump(tu.governorateId));
    data.jobs.forEach((j) => bump(j.governorateId));
    return [...counts.entries()]
      .map(([id, count]) => ({ name: govName(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data, govName]);

  const avgRating = useMemo(() => {
    if (!data || data.reviews.length === 0) return null;
    const approved = data.reviews.filter((r) => r.status === 'APPROVED');
    if (approved.length === 0) return null;
    return approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    const pendingApplications = data.applications.filter((a) => a.status === 'PENDING').length;
    const pendingReviews = data.reviews.filter((r) => r.status === 'PENDING').length + data.inquiries.filter((i) => i.status === 'NEW').length;
    const pendingCommunity = data.communityPosts.filter((p) => p.status === 'PENDING').length;
    const activeListings = data.institutions.filter((i) => i.status === 'ACTIVE').length + data.tutors.filter((t) => t.status === 'ACTIVE').length;
    const hired = data.jobApplications.filter((a) => a.status === 'HIRED').length;
    const hireRate = data.jobApplications.length > 0 ? (hired / data.jobApplications.length) * 100 : 0;
    return {
      pendingTotal: pendingApplications + pendingReviews + pendingCommunity,
      activeListings,
      activeJobs: data.jobs.filter((j) => j.status === 'ACTIVE').length,
      hireRate,
    };
  }, [data]);

  if (!data || !stats) {
    return (
      <div className="max-w-6xl">
        <p className="text-sm text-slate-500">{t('جاري تحميل التحليلات...', 'Loading analytics...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          {t('التحليلات', 'Analytics')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('نظرة عامة على أداء المنصة عبر جميع الأقسام.', 'Platform-wide health across every section.')}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('القوائم النشطة', 'Active Listings')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{stats.activeListings}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('الوظائف النشطة', 'Active Jobs')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{stats.activeJobs}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('معدل التوظيف', 'Hire Rate')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{stats.hireRate.toFixed(1)}%</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('بانتظار المراجعة', 'Pending Review')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{stats.pendingTotal}</div>
        </div>
      </div>

      {/* Signups over time */}
      <div className={CARD}>
        <h2 className="font-bold text-slate-900 mb-1">{t('التسجيلات الجديدة (آخر 12 أسبوعًا)', 'New Signups (last 12 weeks)')}</h2>
        <p className="text-xs text-slate-500 mb-4">{t('المؤسسات، الأساتذة، والشركات/المنظمات المعتمدة أسبوعيًا.', 'Approved institutions, tutors, and employers by week.')}</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={signupSeries} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
          <h2 className="font-bold text-slate-900 mb-1">{t('طلبات الانضمام حسب النوع والحالة', 'Join Applications by Type & Status')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applicationFunnel} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
          <h2 className="font-bold text-slate-900 mb-1">{t('مسار طلبات التوظيف', 'Job Application Pipeline')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={jobPipeline} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 11, fill: SLATE }} />
              <Tooltip />
              <Bar dataKey="count">
                {jobPipeline.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Community breakdown */}
        <div className={CARD}>
          <h2 className="font-bold text-slate-900 mb-1">{t('منشورات المجتمع', 'Community Posts')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={communityBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {communityBreakdown.map((entry, i) => (
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
          <h2 className="font-bold text-slate-900 mb-1">{t('التوزيع الجغرافي (أعلى 8 محافظات)', 'Geographic Distribution (top 8)')}</h2>
          <p className="text-xs text-slate-500 mb-2">{t('مؤسسات + أساتذة + وظائف', 'Institutions + tutors + jobs')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={geoDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          <h2 className="font-bold text-slate-900">{t('التقييمات والاستفسارات', 'Reviews & Inquiries')}</h2>
          {avgRating !== null && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)} {t('متوسط التقييم', 'avg rating')}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-2xl font-black text-slate-900">{data.reviews.filter((r) => r.status === 'PENDING').length}</div>
            <div className="text-xs text-slate-500">{t('تقييمات قيد المراجعة', 'Reviews pending')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{data.reviews.filter((r) => r.status === 'APPROVED').length}</div>
            <div className="text-xs text-slate-500">{t('تقييمات منشورة', 'Reviews approved')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{data.inquiries.filter((i) => i.status === 'NEW').length}</div>
            <div className="text-xs text-slate-500">{t('استفسارات جديدة', 'New inquiries')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{data.inquiries.filter((i) => i.status === 'CLOSED').length}</div>
            <div className="text-xs text-slate-500">{t('استفسارات مغلقة', 'Inquiries closed')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
