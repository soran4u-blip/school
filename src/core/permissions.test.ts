import { describe, it, expect } from 'vitest';
import { hasPermission, isAdminRole, permissionForPath, ROLE_PERMISSIONS, AdminRole, Permission } from './permissions';

// The permission table is duplicated by necessity — firestore.rules can't import TypeScript — so
// these assert the intent in the place a reader will look for it, and fail loudly if someone
// widens a role without meaning to.

describe('isAdminRole', () => {
  it('accepts the three admin roles', () => {
    expect(isAdminRole('superadmin')).toBe(true);
    expect(isAdminRole('moderator')).toBe(true);
    expect(isAdminRole('editor')).toBe(true);
  });

  it('rejects account roles and absent roles', () => {
    for (const role of ['tutor', 'student', 'institution', 'employer', '', undefined, null]) {
      expect(isAdminRole(role as string | undefined)).toBe(false);
    }
  });
});

describe('hasPermission', () => {
  it('gives superadmin everything', () => {
    const everyPermission = new Set<Permission>();
    (Object.keys(ROLE_PERMISSIONS) as AdminRole[]).forEach((role) =>
      ROLE_PERMISSIONS[role].forEach((p) => everyPermission.add(p))
    );
    for (const permission of everyPermission) {
      expect(hasPermission('superadmin', permission)).toBe(true);
    }
  });

  it('lets a moderator work the queues but not the directory', () => {
    expect(hasPermission('moderator', 'applications:write')).toBe(true);
    expect(hasPermission('moderator', 'reviews:write')).toBe(true);
    expect(hasPermission('moderator', 'community:write')).toBe(true);
    expect(hasPermission('moderator', 'directory:write')).toBe(false);
    expect(hasPermission('moderator', 'masterData:write')).toBe(false);
  });

  it('lets an editor change the directory but not moderate', () => {
    expect(hasPermission('editor', 'directory:write')).toBe(true);
    expect(hasPermission('editor', 'masterData:write')).toBe(true);
    expect(hasPermission('editor', 'applications:write')).toBe(false);
    expect(hasPermission('editor', 'reviews:write')).toBe(false);
    expect(hasPermission('editor', 'community:write')).toBe(false);
  });

  it('reserves settings and seeding for the superadmin', () => {
    for (const role of ['moderator', 'editor'] as AdminRole[]) {
      expect(hasPermission(role, 'settings:write')).toBe(false);
      expect(hasPermission(role, 'seed:run')).toBe(false);
    }
  });

  it('keeps the audit log away from editors', () => {
    expect(hasPermission('superadmin', 'audit:read')).toBe(true);
    expect(hasPermission('moderator', 'audit:read')).toBe(true);
    expect(hasPermission('editor', 'audit:read')).toBe(false);
  });

  it('grants nothing to a non-admin', () => {
    expect(hasPermission('tutor', 'admin:read')).toBe(false);
    expect(hasPermission(undefined, 'admin:read')).toBe(false);
  });
});

describe('permissionForPath', () => {
  it('maps admin sections to their permission', () => {
    expect(permissionForPath('/admin/applications')).toBe('applications:write');
    expect(permissionForPath('/admin/reviews')).toBe('reviews:write');
    expect(permissionForPath('/admin/institutions')).toBe('directory:write');
    expect(permissionForPath('/admin/taxonomies')).toBe('masterData:write');
    expect(permissionForPath('/admin/settings')).toBe('settings:write');
    expect(permissionForPath('/admin/audit')).toBe('audit:read');
  });

  it('covers nested paths under a section', () => {
    expect(permissionForPath('/admin/institutions/add')).toBe('directory:write');
    expect(permissionForPath('/api/admin/listings/tutors/abc123')).toBe('directory:write');
  });

  it('does not let a prefix match a different section', () => {
    // '/admin/institutions' must not match '/admin/institutionsomething'.
    expect(permissionForPath('/admin/institutionsomething')).toBe('admin:read');
  });

  it('defaults an unlisted admin path to needing admin access', () => {
    expect(permissionForPath('/admin')).toBe('admin:read');
    expect(permissionForPath('/admin/something-new')).toBe('admin:read');
  });

  it('keeps seeding behind its own permission', () => {
    expect(permissionForPath('/api/seed')).toBe('seed:run');
  });
});
