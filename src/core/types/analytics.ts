// A precomputed snapshot of the platform-wide metrics shown on /admin/analytics.
//
// The analytics page used to fetch ten collections in full from the browser and derive everything
// in JS on every page view — the one place pagination couldn't fix, because its numbers are
// cross-entity aggregates rather than a list. Computing it server-side on a schedule turns that
// into one scan per period regardless of how many times the page is opened, and keeps the
// breakdowns correct instead of trading them away for a page size.
//
// The scan is still a scan. That's the right trade at this size: the next step up is maintaining
// each of these as a counter updated on every write, which is a lot of moving parts to keep
// honest for a page a handful of admins open. The repair-from-source pattern in
// core/server/ratings.ts is what that would need, applied to every figure below.

export interface AnalyticsWeekPoint {
  week: string; // ISO date of the week's Sunday — the sort key
  label: string; // e.g. 'Mar 3'
  Institutions: number;
  Tutors: number;
  Employers: number;
}

export interface AnalyticsFunnelRow {
  status: string;
  TUTOR: number;
  INSTITUTION: number;
  EMPLOYER: number;
}

export interface AnalyticsCount {
  status: string;
  count: number;
}

export interface AnalyticsGeoRow {
  governorateId: string;
  name: string; // resolved server-side, so the client needs no governorate lookup
  count: number;
}

export interface AnalyticsSnapshot {
  id: string; // always 'latest'
  computedAt: string;
  // How long the computation took, so a future scheduled run can be judged against its budget.
  computeMs: number;

  totals: {
    institutions: number;
    tutors: number;
    employers: number;
    activeListings: number;
    activeJobs: number;
    jobApplications: number;
    hired: number;
    reviewsApproved: number;
    inquiriesClosed: number;
  };
  pending: {
    applications: number;
    reviews: number;
    inquiries: number;
    community: number;
    total: number;
  };
  hireRate: number; // percent
  avgRating: number | null; // across approved reviews; null when there are none

  signupSeries: AnalyticsWeekPoint[];
  applicationFunnel: AnalyticsFunnelRow[];
  jobPipeline: AnalyticsCount[];
  communityBreakdown: AnalyticsCount[];
  geoDistribution: AnalyticsGeoRow[];
}
