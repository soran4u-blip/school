export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;

  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, cleanParams);
    return;
  }

  window.dataLayer?.push(['event', name, cleanParams]);
}