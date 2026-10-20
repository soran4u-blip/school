'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Category } from '@/core/types/masterData';
import { useT } from '@/lib/useT';
import { HOME_COPY } from './Home.i18n';

const tiles = [
  { slug: 'schools', title: 'catSchools', desc: 'catSchoolsDesc', image: 'photo-1562774053-701939374585' },
  { slug: 'universities', title: 'catUniversities', desc: 'catUniversitiesDesc', image: 'photo-1564981797816-1043664bf78d' },
  { slug: 'tutors', title: 'catTutors', desc: 'catTutorsDesc', image: 'photo-1509062522246-3755977927d7' },
  { slug: 'training_centers', title: 'catTraining', desc: 'catTrainingDesc', image: 'photo-1522202176988-66273c2fd55f' },
  { slug: 'opportunities', title: 'catOpportunities', desc: 'catOpportunitiesDesc', image: 'photo-1498243691581-b145c3f54a5a' },
  { slug: 'community', title: 'catCommunity', desc: 'catCommunityDesc', image: 'photo-1529390079861-591de354faf5' },
] as const;

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const { language } = useLanguage();
  const t = useT(HOME_COPY);
  return <section className="bg-white px-4 py-3 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => {
        const category = categories.find((item) => item.slug === tile.slug);
        const href = tile.slug === 'tutors' ? localeHref('/tutors', language) : tile.slug === 'community' ? '/community' : tile.slug === 'opportunities' ? localeHref('/events', language) : `${localeHref('/explore', language)}?category=${category?.slug || tile.slug}`;
        return <Link key={tile.slug} href={href} className="group overflow-hidden rounded-xl border border-[#e9e7e0] bg-white transition hover:-translate-y-0.5 hover:border-[#b8d3c9] hover:shadow-lg">
          <div className="relative h-20 overflow-hidden bg-[#edf3ef] sm:h-24">
            <Image src={`https://images.unsplash.com/${tile.image}?auto=format&fit=crop&w=500&q=75`} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw" onError={(event) => { event.currentTarget.style.display = "none"; }} className="object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#092e29]/40 to-transparent" />
          </div>
          <div className="flex items-start justify-between gap-1 p-2.5 sm:p-3">
            <div><h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">{t(tile.title)}</h3><p className="mt-1 hidden text-[10px] leading-4 text-slate-500 sm:block">{t(tile.desc)}</p></div>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#17695a] rtl:rotate-180" />
          </div>
        </Link>;
      })}
    </div>
  </section>;
}
