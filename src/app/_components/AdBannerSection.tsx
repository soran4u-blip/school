'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { CMSBanner } from '@/core/types/masterData';
import { pickWeightedBanner } from '@/lib/bannerLogic';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { HOME_COPY } from './Home.i18n';

const ROTATE_INTERVAL_MS = 6000;
const FADE_MS = 300;

// This remains a client component because a campaign is selected at random and rotates while the
// visitor stays on the page. The layout intentionally keeps the campaign copy on a solid panel:
// advertiser images can now be any colour or level of detail without compromising readability.
export default function AdBannerSection({ banners }: { banners: CMSBanner[] }) {
  const { language } = useLanguage();
  const t = useT(HOME_COPY);
  const [banner, setBanner] = useState(() => pickWeightedBanner(banners));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (banners.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      if (document.hidden) return;

      setVisible(false);
      window.setTimeout(() => {
        setBanner((current) => {
          const next = pickWeightedBanner(banners);
          if (next && current && next.id === current.id) {
            return pickWeightedBanner(banners.filter((item) => item.id !== current.id)) ?? next;
          }
          return next;
        });
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [banners]);

  if (!banner?.imageUrl) return null;

  const eyebrow = pickLocalized(banner.title, language);
  const headline = pickLocalized(banner.subtitle, language);
  const cta = pickLocalized(banner.ctaText, language);
  const hasLink = Boolean(banner.ctaLink);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-3 sm:py-5">
      <a
        href={banner.ctaLink || undefined}
        target={hasLink ? '_blank' : undefined}
        rel={hasLink ? 'noopener noreferrer sponsored' : undefined}
        aria-label={hasLink ? `${headline} — ${t('openAd')}` : undefined}
        className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-[#0B192C] shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)] sm:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] sm:rounded-3xl transition-all duration-300 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_22px_48px_-26px_rgba(15,23,42,0.75)]"
        style={{ transitionDuration: `${FADE_MS}ms`, opacity: visible ? 1 : 0 }}
      >
        <div className="relative flex min-h-48 flex-col justify-between overflow-hidden p-5 text-white sm:min-h-[15.5rem] sm:p-8">
          <div className="absolute inset-0 bg-linear-to-br from-[#152d4a] via-[#0B192C] to-[#071220]" />
          <div className="absolute -top-20 -start-16 h-52 w-52 rounded-full bg-[#F1C40F]/10 blur-3xl" />

          <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5D76E] sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F1C40F]" />
            {t('sponsored')}
          </div>

          <div className="relative my-5 max-w-xl sm:my-7">
            {eyebrow && <p className="mb-2 text-[11px] font-bold tracking-wide text-slate-300 sm:text-xs">{eyebrow}</p>}
            <h3 className="text-lg font-extrabold leading-snug text-balance sm:text-3xl">{headline}</h3>
          </div>

          <div className="relative flex items-center justify-between gap-4">
            {cta && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F1C40F] px-4 py-2 text-[11px] font-extrabold text-[#0B192C] transition-transform duration-300 group-hover:scale-[1.02] sm:px-5 sm:py-2.5 sm:text-xs">
                {cta}
                {hasLink && <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </span>
            )}
            {banners.length > 1 && (
              <span className="ms-auto flex gap-1" aria-label={t('rotatingAd')}>
                {banners.slice(0, 4).map((item) => (
                  <span key={item.id} className={`h-1.5 rounded-full transition-all duration-300 ${item.id === banner.id ? 'w-5 bg-[#F1C40F]' : 'w-1.5 bg-white/25'}`} />
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="relative order-first min-h-36 overflow-hidden sm:order-none sm:min-h-[15.5rem]">
          {/* Arbitrary advertiser-supplied URLs are intentionally rendered without next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0B192C]/35 via-transparent to-transparent sm:bg-linear-to-s from-[#0B192C]/25 via-transparent to-transparent" />
          <span className="absolute top-3 end-3 rounded-full border border-white/20 bg-slate-950/45 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur-md">
            {t('ad')}
          </span>
        </div>
      </a>
    </section>
  );
}
