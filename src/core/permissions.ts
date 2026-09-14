// The admin permission model, in one place.
//
// There used to be exactly one admin role — `superadmin` — and every check in firestore.rules,
// proxy.ts and the API routes named it directly. That works until a second person needs access
// and the only options are "everything" or "nothing". These three roles split the admin surface
// along the line the work actually falls on: moderating what users submit, versus editing the
// directory and its taxonomies.
//
// Deliberately kept free of server imports so proxy.ts, the API routes, the sidebar and
// firestore.rules can all be reasoned about against the same table.

export type AdminRole = 'superadmin' | 'moderator' | 'editor';
export type AppRole = AdminRole | 'tutor' | 'student' | 'institution' | 'employer';

export type Permission =
  /** Reach the admin area at all. */
  | 'admin:read'
  /** Approve or reject join applications. */
  | 'applications:write'
  /** Moderate reviews and answer inquiries. */
  | 'reviews:write'
  /** Moderate community posts. */
  | 'community:write'
  /** Create, edit, verify, feature or delete institutions, tutors, employers and jobs. */
  | 'directory:write'
  /** Edit governorates, cities, categories and taxonomies. */
  | 'masterData:write'
  /** Change site-wide settings and run counter maintenance. */
  | 'settings:write'
  /** Overwrite master data wholesale from seedData.json. */
  | 'seed:run'
  /** View the audit trail. */
  | 'audit:read'
  /** View platform analytics. */
  | 'analytics:read';

const ADMIN_BASELINE: Permission[] = ['admin:read', 'analytics:read'];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  // Everything, including the two things nobody else gets: settings and re-seeding.
  superadmin: [
    ...ADMIN_BASELINE,
    'applications:write',
    'reviews:write',
    'community:write',
    'directory:write',
    'masterData:write',
    'settings:write',
    'seed:run',
    'audit:read',
  ],

  // The submission queues. Reads the directory but cannot change it — in particular cannot verify,
  // feature or delete a listing, which are the levers worth keeping narrow.
  moderator: [...ADMIN_BASELINE, 'applications:write', 'reviews:write', 'community:write', 'audit:read'],

  // The directory and the taxonomies behind it. No settings, no seeding, and no audit log — an
  // editor shouldn't be reading the record of everyone else's actions.
  editor: [...ADMIN_BASELINE, 'directory:write', 'masterData:write'],
};

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === 'superadmin' || role === 'moderator' || role === 'editor';
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!isAdminRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Which permission each admin route needs. proxy.ts turns a request path into a permission with
// this, so a role that can't use a section can't load it either — the sidebar hiding a link is
// presentation, not a control.
const ROUTE_PERMISSIONS: Array<[prefix: string, permission: Permission]> = [
  ['/admin/applications', 'applications:write'],
  ['/admin/reviews', 'reviews:write'],
  ['/admin/community', 'community:write'],
  ['/admin/institutions', 'directory:write'],
  ['/admin/tutors', 'directory:write'],
  ['/admin/employers', 'directory:write'],
  ['/admin/jobs', 'directory:write'],
  ['/admin/bookings', 'directory:write'],
  ['/admin/locations', 'masterData:write'],
  ['/admin/categories', 'masterData:write'],
  ['/admin/taxonomies', 'masterData:write'],
  ['/admin/settings', 'settings:write'],
  ['/admin/errors', 'settings:write'],
  ['/admin/audit', 'audit:read'],
  ['/admin/analytics', 'analytics:read'],
  // API equivalents, for the routes a scoped role could otherwise call directly.
  ['/api/admin/listings', 'directory:write'],
  ['/api/admin/tutors', 'directory:write'],
  ['/api/admin/applications', 'applications:write'],
  ['/api/admin/reviews', 'reviews:write'],
  ['/api/admin/audit', 'audit:read'],
  ['/api/admin/analytics', 'analytics:read'],
  ['/api/admin/maintenance', 'settings:write'],
  ['/api/admin/settings', 'settings:write'],
  ['/api/applications', 'applications:write'],
  ['/api/seed', 'seed:run'],
];

/**
 * The permission a path requires, or 'admin:read' for anything else under /admin — an unlisted
 * admin page defaults to needing admin access rather than to being open.
 */
export function permissionForPath(pathname: string): Permission {
  for (const [prefix, permission] of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return permission;
  }
  return 'admin:read';
}
