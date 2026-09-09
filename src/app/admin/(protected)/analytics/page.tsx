import { adminDb } from '@/core/firebase/admin';
import { readAnalyticsSnapshot } from '@/core/server/analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import AnalyticsEmptyState from './AnalyticsEmptyState';

// Reads the precomputed snapshot rather than deriving the figures per page view — see
// core/types/analytics.ts. The snapshot is produced by the scheduled `analytics` task, or on
// demand from the Recompute button.
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const snapshot = adminDb ? await readAnalyticsSnapshot(adminDb) : null;
  if (!snapshot) return <AnalyticsEmptyState />;
  return <AnalyticsDashboard snapshot={snapshot} />;
}
