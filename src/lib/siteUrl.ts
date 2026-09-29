// The site's public origin, for canonical URLs, Open Graph tags, JSON-LD, robots.txt and the sitemap.
//
// NEXT_PUBLIC_SITE_URL wins when set (a custom domain). Otherwise, on Vercel, the production
// domain Vercel injects at build and run time — without this fallback, a deploy that simply never
// set NEXT_PUBLIC_SITE_URL published robots.txt and sitemap.xml pointing search engines at
// http://localhost:3000. localhost remains the answer only for local development.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export const siteUrl = resolveSiteUrl();
