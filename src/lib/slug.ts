// Shared slug generator for every public detail-page entity (institutions, tutors, jobs,
// community posts). Keeps any-language letters (Arabic included) rather than stripping them to
// ASCII — an Arabic name slug (e.g. "مدرسة-النور-a1b2c3") is valid, indexable, and preferred for
// an Arabic-first audience over transliterating or falling back to a generic label.
export function slugify(name: string, uniqueSuffix: string, fallback: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || fallback}-${uniqueSuffix}`;
}
