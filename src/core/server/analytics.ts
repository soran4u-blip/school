import type { Firestore } from 'firebase-admin/firestore';
import {
  AnalyticsSnapshot,
  AnalyticsWeekPoint,
  AnalyticsFunnelRow,
  AnalyticsCount,
  AnalyticsGeoRow,
} from '@/core/types/analytics';

// Computes the /admin/analytics snapshot. See core/types/analytics.ts for why this is precomputed
// rather than derived per page view.
//
// Every read below uses `.select()` to name the fields it needs. That isn't cosmetic: an
// institution document carries descriptions, gallery URLs and program arrays, none of which
// matter to a weekly signup count, and Firestore bills and transfers the whole document
// otherwise. On the tutors and institutions collections this is the difference between pulling
// the entire directory across the wire and pulling three fields per row.

const WEEKS = 12;
const TOP_GOVERNORATES = 8;

function weekKey(iso: string): string {
  const d = new Date(iso);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay()); // Sunday
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
  return new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function tally<T extends string>(values: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  return counts;
}

export async function computeAnalyticsSnapshot(db: Firestore): Promise<AnalyticsSnapshot> {
  const startedAt = Date.now();

  const [institutions, tutors, employers, applications, jobs, jobApplications, reviews, inquiries, community, governorates] =
    await Promise.all([
      db.collection('institutions').select('createdAt', 'status', 'governorateId').get(),
      db.collection('tutors').select('createdAt', 'status', 'governorateId').get(),
      db.collection('employers').select('createdAt', 'status').get(),
      db.collection('applications').select('status', 'type').get(),
      db.collection('jobs').select('status', 'governorateId').get(),
      db.collection('jobApplications').select('status').get(),
      db.collection('reviews').select('status', 'rating').get(),
      db.collection('inquiries').select('status').get(),
      db.collection('communityPosts').select('status').get(),
      db.collection('locations_governorates').select('name').get(),
    ]);

  /* ---- weekly signups ---- */
  const weeks = lastNWeekKeys(WEEKS);
  const signupSeries: AnalyticsWeekPoint[] = weeks.map((week) => ({
    week,
    label: shortLabel(week),
    Institutions: 0,
    Tutors: 0,
    Employers: 0,
  }));
  const weekIndex = new Map(signupSeries.map((point, i) => [point.week, i]));
  const bumpWeek = (createdAt: unknown, field: 'Institutions' | 'Tutors' | 'Employers') => {
    if (typeof createdAt !== 'string') return;
    const i = weekIndex.get(weekKey(createdAt));
    if (i !== undefined) signupSeries[i][field] += 1;
  };
  institutions.docs.forEach((d) => bumpWeek(d.get('createdAt'), 'Institutions'));
  tutors.docs.forEach((d) => bumpWeek(d.get('createdAt'), 'Tutors'));
  employers.docs.forEach((d) => bumpWeek(d.get('createdAt'), 'Employers'));

  /* ---- join-application funnel ---- */
  const applicationRows = applications.docs.map((d) => ({
    status: String(d.get('status') || ''),
    type: String(d.get('type') || ''),
  }));
  const applicationFunnel: AnalyticsFunnelRow[] = ['PENDING', 'APPROVED', 'REJECTED'].map((status) => ({
    status,
    TUTOR: applicationRows.filter((a) => a.status === status && a.type === 'TUTOR').length,
    INSTITUTION: applicationRows.filter((a) => a.status === status && a.type === 'INSTITUTION').length,
    EMPLOYER: applicationRows.filter((a) => a.status === status && a.type === 'EMPLOYER').length,
  }));

  /* ---- hiring pipeline ---- */
  const jobApplicationStatuses = tally(jobApplications.docs.map((d) => String(d.get('status') || '')));
  const jobPipeline: AnalyticsCount[] = ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'].map((status) => ({
    status,
    count: jobApplicationStatuses[status] || 0,
  }));

  /* ---- community moderation ---- */
  const communityStatuses = tally(community.docs.map((d) => String(d.get('status') || '')));
  const communityBreakdown: AnalyticsCount[] = ['PENDING', 'APPROVED', 'REJECTED'].map((status) => ({
    status,
    count: communityStatuses[status] || 0,
  }));

  /* ---- geography ---- */
  const governorateNames = new Map<string, string>();
  governorates.docs.forEach((d) => {
    const name = d.get('name') as { en?: string } | undefined;
    governorateNames.set(d.id, name?.en || d.id);
  });
  const geoCounts = new Map<string, number>();
  const bumpGeo = (id: unknown) => {
    if (typeof id !== 'string' || !id) return;
    geoCounts.set(id, (geoCounts.get(id) || 0) + 1);
  };
  institutions.docs.forEach((d) => bumpGeo(d.get('governorateId')));
  tutors.docs.forEach((d) => bumpGeo(d.get('governorateId')));
  jobs.docs.forEach((d) => bumpGeo(d.get('governorateId')));
  const geoDistribution: AnalyticsGeoRow[] = [...geoCounts.entries()]
    .map(([governorateId, count]) => ({ governorateId, name: governorateNames.get(governorateId) || governorateId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_GOVERNORATES);

  /* ---- ratings ---- */
  const approvedRatings = reviews.docs
    .filter((d) => d.get('status') === 'APPROVED')
    .map((d) => Number(d.get('rating')) || 0);
  const avgRating = approvedRatings.length
    ? approvedRatings.reduce((sum, r) => sum + r, 0) / approvedRatings.length
    : null;

  /* ---- headline totals ---- */
  const activeInstitutions = institutions.docs.filter((d) => d.get('status') === 'ACTIVE').length;
  const activeTutors = tutors.docs.filter((d) => d.get('status') === 'ACTIVE').length;
  const hired = jobApplicationStatuses.HIRED || 0;
  const pendingApplications = applicationRows.filter((a) => a.status === 'PENDING').length;
  const pendingReviews = reviews.docs.filter((d) => d.get('status') === 'PENDING').length;
  const pendingInquiries = inquiries.docs.filter((d) => d.get('status') === 'NEW').length;
  const pendingCommunity = communityStatuses.PENDING || 0;

  return {
    id: 'latest',
    computedAt: new Date().toISOString(),
    computeMs: Date.now() - startedAt,
    totals: {
      institutions: institutions.size,
      tutors: tutors.size,
      employers: employers.size,
      activeListings: activeInstitutions + activeTutors,
      activeJobs: jobs.docs.filter((d) => d.get('status') === 'ACTIVE').length,
      jobApplications: jobApplications.size,
      hired,
      reviewsApproved: approvedRatings.length,
      inquiriesClosed: inquiries.docs.filter((d) => d.get('status') === 'CLOSED').length,
    },
    pending: {
      applications: pendingApplications,
      reviews: pendingReviews,
      inquiries: pendingInquiries,
      community: pendingCommunity,
      total: pendingApplications + pendingReviews + pendingInquiries + pendingCommunity,
    },
    hireRate: jobApplications.size > 0 ? (hired / jobApplications.size) * 100 : 0,
    avgRating,
    signupSeries,
    applicationFunnel,
    jobPipeline,
    communityBreakdown,
    geoDistribution,
  };
}

const SNAPSHOT_COLLECTION = 'analytics_snapshots';
const SNAPSHOT_DOC = 'latest';

export async function writeAnalyticsSnapshot(db: Firestore): Promise<AnalyticsSnapshot> {
  const snapshot = await computeAnalyticsSnapshot(db);
  await db.collection(SNAPSHOT_COLLECTION).doc(SNAPSHOT_DOC).set(snapshot);
  return snapshot;
}

export async function readAnalyticsSnapshot(db: Firestore): Promise<AnalyticsSnapshot | null> {
  const snap = await db.collection(SNAPSHOT_COLLECTION).doc(SNAPSHOT_DOC).get();
  return snap.exists ? (snap.data() as AnalyticsSnapshot) : null;
}
