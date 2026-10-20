'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { localeHref } from '@/lib/locale';
import { trackEvent } from '@/lib/analytics';
import { Phone, Mail, Globe, Clock, MessageSquare, MessageCircle, Send } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from '../Institution.i18n';

// The sticky right-hand card: in-app chat, WhatsApp, "request more info" and the contact details.
export default function ContactCard({ institution, openInquiry }: { institution: Institution; openInquiry: () => void }) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);
  const institutionName = pickLocalized(institution.name, language);

  return (
    <aside className="lg:col-span-4 sticky top-28 space-y-6">

      {/* Direct WhatsApp Admissions Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('office')}</span>
          <h3 className="text-base font-extrabold text-[#0B192C]">
            {t('directInquiry')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('directBody')}
          </p>
        </div>

        {/* In-app chat, for students who'd rather not hand over a WhatsApp number. Only
            shown once the institution has a linked account to receive it — conversations are
            keyed by Auth uid, so institution.userId (not institution.id) is the recipient. */}
        {institution.userId && (
          <button
           onClick={async () => {
             trackEvent('institution_chat_start', {
               institution_id: institution.id,
               institution_slug: institution.slug,
             });
             try {
                const res = await fetch('/api/conversations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipientId: institution.userId,
                    recipientRole: 'institution',
                    recipientName: institutionName,
                    recipientPhone: institution.contact?.phonePrimary,
                    context: {
                      type: 'institution',
                      title: t('chatContextTitle', { name: institutionName }),
                      id: institution.id,
                    },
                  }),
                });
                const data = await res.json();
                if (data.success && data.conversation) {
                  router.push(`/messages?conversationId=${data.conversation.id}`);
                } else {
                  router.push(localeHref('/login', language));
                }
              } catch {
                router.push(localeHref('/login', language));
              }
            }}
            className="w-full py-3.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('chatNow')}</span>
          </button>
        )}

        {/* Direct WhatsApp CTA Button — hidden when no number is set, which otherwise
            produced a broken `wa.me/` link. */}
        {institution.contact?.whatsappNumber && (
           <a
             href={`https://wa.me/${institution.contact.whatsappNumber}?text=${encodeURIComponent(
              t('whatsappMessage', { name: institutionName })
             )}`}
             onClick={() => trackEvent('institution_whatsapp_click', {
               institution_id: institution.id,
               institution_slug: institution.slug,
             })}
             target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('whatsappOfficial')}</span>
          </a>
        )}

        <button
           onClick={openInquiry}
          className="w-full py-3 border-2 border-[#123D35] text-[#123D35] hover:bg-[#123D35] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{t('requestInfo')}</span>
        </button>

        <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          {institution.contact?.phonePrimary && (
            <div className="flex items-center gap-3 text-slate-700" dir="ltr">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`tel:${institution.contact.phonePrimary.replace(/\s+/g, '')}`} className="font-semibold font-mono hover:text-blue-700">
                {institution.contact.phonePrimary}
              </a>
            </div>
          )}

          {institution.contact?.email && (
            <div className="flex items-center gap-3 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`mailto:${institution.contact.email}`} className="font-medium hover:text-blue-700">
                {institution.contact.email}
              </a>
            </div>
          )}

          {institution.contact.website && (
            <div className="flex items-center gap-3 text-slate-700">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
               <a
                 href={institution.contact.website}
                 onClick={() => trackEvent('institution_website_click', {
                   institution_id: institution.id,
                   institution_slug: institution.slug,
                 })}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-blue-600 hover:underline font-semibold"
               >
                {t('website')}
              </a>
            </div>
          )}

          {institution.contact.workingHours && (
            <div className="flex items-center gap-3 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{pickLocalized(institution.contact.workingHours, language)}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
