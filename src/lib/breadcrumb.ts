const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Shared BreadcrumbList JSON-LD builder for the four detail-page types (institutions, tutors,
// jobs, community posts) — lets Google render breadcrumbs in search results.
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}
