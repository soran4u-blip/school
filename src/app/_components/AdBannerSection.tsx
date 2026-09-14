'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { CMSBanner } from '@/core/types/masterData';
import { pickWeightedBanner } from '@/lib/bannerLogic';

// How long one campaign stays up before the next weighted-random draw. Long enough to actually
// read the headline, short enough that a visitor who lingers on the homepage still sees more than
// one campaign — a single draw per page load only ever showed one banner to anyone who didn't
// reload, which read as "not rotating" even though the distribution across many page loads really
// was proportional to each campaign's weight.
const ROTATE_INTERVAL_MS = 6000;
const FADE_MS = 300;

// The homepage's in-feed ad slot. An advertiser's creative is still supplied at one of the two
// standard IAB ratios (300x250 Medium Rectangle on mobile, 970x250 Billboard from the sm
// breakpoint up), but the card itself fills the same content width as every sibling homepage
// section (the max-w-7xl on the wrapping <section>) rather than being capped at the literal
// 970px — capping the width left dead gray gutters on either side on any screen wider than that,
// since the page's content column is ~1280px. Keeping the aspect-ratio and dropping the width cap
// scales the creative up proportionally instead.
//
// `banners` has already been filtered to today's eligible campaigns server-side (see
// getPublicActiveBanners).
export default function AdBannerSection({ banners }: { banners: CMSBanner[] }) {
  const { language, t } = useLanguage();
  const [banner, setBanner] = useState(() => pickWeightedBanner(banners));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (banners.length < 2) return; // nothing else to rotate through
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      // A background tab redrawing every 6s costs nothing visible but still burns a timer; skip it.
      if (document.hidden) return;

      setVisible(false);
      window.setTimeout(() => {
        setBanner((current) => {
          // A plain weighted draw can land on the same campaign twice in a row (expected — that's
          // what "weighted" means), but a tick where nothing visibly changes reads as broken, not
          // as "still rotating, just landed on the same one." Redraw once more, excluding the
          // current pick, so every tick is a visible change.
          const next = pickWeightedBanner(banners);
          if (next && current && next.id === current.id) {
            return pickWeightedBanner(banners.filter((b) => b.id !== current.id)) ?? next;
          }
          return next;
        });
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `banners` is a stable server-fetched prop for the lifetime of this page view
  }, []);

  if (!banner || !banner.imageUrl) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-4">
      <a
        href={banner.ctaLink || '#'}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg w-full aspect-[300/250] sm:aspect-[970/250] block transition-opacity"
        style={{ transitionDuration: `${FADE_MS}ms`, opacity: visible ? 1 : 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary advertiser-supplied URL, not worth configuring next/image's remote-host allowlist for */}
        <img src={banner.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* The text panel below sits wherever the flex column's cross-axis start is — the right
            edge in RTL (Arabic), the left edge in LTR (English), since it's positioned purely by
            document flow/dir, not an explicit side. The scrim has to darken THAT side; a single
            fixed angle only ever gets one of the two languages right; the other renders text over
            the near-transparent tail of the gradient with too little contrast against a busy photo. */}
        <div
          className="absolute inset-0"
          style={{
            background: language === 'ar'
              ? 'linear-gradient(260deg, rgba(11,25,44,0.95) 0%, rgba(11,25,44,0.88) 45%, rgba(11,25,44,0.15) 85%)'
              : 'linear-gradient(100deg, rgba(11,25,44,0.95) 0%, rgba(11,25,44,0.88) 45%, rgba(11,25,44,0.15) 85%)',
          }}
        />
        <span className="absolute top-2.5 start-2.5 z-10 bg-white/15 backdrop-blur text-slate-200 text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full tracking-wide">
          {t('إعلان', 'Ad')}
        </span>
        <div className="absolute inset-0 flex flex-col justify-center gap-1.5 sm:gap-2.5 text-white p-4 sm:p-9 max-w-[92%] sm:max-w-[56%]">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide text-[#F1C40F]">
            {language === 'en' ? banner.title.en : banner.title.ar}
          </span>
          <h3 className="text-sm sm:text-2xl font-extrabold leading-snug">
            {language === 'en' ? banner.subtitle.en : banner.subtitle.ar}
          </h3>
          {banner.ctaText && (
            <span className="mt-1 self-start bg-[#F1C40F] text-[#0B192C] font-extrabold text-[10px] sm:text-xs px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full">
              {language === 'en' ? banner.ctaText.en : banner.ctaText.ar}
            </span>
          )}
        </div>
      </a>
    </section>
  );
}
