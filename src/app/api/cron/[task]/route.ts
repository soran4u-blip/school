import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { SCHEDULED_TASKS, isAuthorizedCronCall } from '@/core/server/scheduledTasks';
import { revalidatePublicData } from '@/core/server/data/cache';
import { logServerError } from '@/core/server/errorLog';
import { recordAuditEvent, SYSTEM_ACTOR } from '@/core/server/auditLog';
import { errorMessage, errorStack } from '@/lib/errors';

// POST /api/cron/[task] — the entry point a scheduler calls. See core/server/scheduledTasks.ts
// for the task list and why this authenticates on a shared secret rather than a session.
//
// Deliberately not under /api/admin: proxy.ts guards that prefix with a superadmin session
// cookie, which a cron service has no way to present.
export async function POST(request: NextRequest, { params }: { params: Promise<{ task: string }> }) {
  const secret = request.headers.get('x-cron-secret');
  if (!isAuthorizedCronCall(secret)) {
    // Same response whether the secret is wrong or the task doesn't exist — an unauthorized
    // caller shouldn't be able to enumerate task names.
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { task: taskName } = await params;
  const task = SCHEDULED_TASKS[taskName];
  if (!task) {
    return NextResponse.json({ success: false, error: 'Unknown task' }, { status: 404 });
  }

  const startedAt = Date.now();
  try {
    const result = await task.run(adminDb);

    // Counter repairs and the analytics recompute both change what the public pages should show.
    if (taskName === 'counters') revalidatePublicData('institutions', 'tutors', 'jobs');

    await recordAuditEvent(adminDb, {
      actor: SYSTEM_ACTOR,
      action: 'task.run',
      targetType: 'system',
      targetId: taskName,
      summary: `Scheduled task '${taskName}' completed`,
      metadata: { durationMs: Date.now() - startedAt },
    });

    return NextResponse.json({ success: true, task: taskName, durationMs: Date.now() - startedAt, result });
  } catch (error) {
    // A scheduled failure has nobody watching the response, so it has to reach the error log.
    console.error(`Scheduled task '${taskName}' failed:`, error);
    await logServerError(`Scheduled task '${taskName}' failed`, {
      stack: errorStack(error),
      url: request.url,
    });
    return NextResponse.json(
      { success: false, task: taskName, error: errorMessage(error, 'Task failed') },
      { status: 500 }
    );
  }
}
