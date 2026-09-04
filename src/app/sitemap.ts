import type { MetadataRoute } from 'next';
import { MasterDataService } from '@/core/services/masterDataService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: 'daily', priority: 0.9 },
  ];

  const institutions = await MasterDataService.getInstitutions({ status: 'ACTIVE' });
  const institutionRoutes: MetadataRoute.Sitemap = institutions.map((inst) => ({
    url: `${siteUrl}/institutions/${inst.slug}`,
    lastModified: inst.updatedAt ? new Date(inst.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...institutionRoutes];
}
