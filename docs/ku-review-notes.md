## WP4a — public pages

Every Sorani string in these areas is a **draft written by Claude, not reviewed by a native speaker**.
The dictionaries live in `*.i18n.ts` next to each feature (`SiteChrome`, `TrustCenter`, `Home`,
`Explore`, `Institution`, `TutorsList`, `TutorProfile`) plus a few inline `t(ar, en, ku)` calls in
`LoadingState`.

Terms the reviewer should look at first:

| Concept | Draft used | Why it is uncertain |
| --- | --- | --- |
| Booking (a tutor session) | حیجز / حیجزکردن | Common loan from Arabic; a native term such as «بەڵێندان» or «کاتدیاریکردن» may read better. |
| Governorate | پارێزگا | Standard in Iraqi Kurdish, but check against how the KRG's own sites write it. |
| Institution / listing | دامەزراوە | Used for schools, universities and training centres alike. |
| Directory | ڕێبەر | Could instead be «لیست» or «دایرێکتۆری». |
| Tutor / private tutor | مامۆستا / مامۆستای تایبەت | «وانەبێژ» is used once in the tutors recruitment banner. |
| Community (parents) | کۆمەڵگەی دایک و باوکان | Translates "مجتمع الأهالي"; the short nav label is just «کۆمەڵگە». |
| Verified / accredited | پشتڕاستکراو / دانپێدانان | «ڕەسمی» or «متمانەپێکراو» might be preferred for accreditation. |
| Trust Center | ناوەندی متمانە و پشتڕاستکردنەوە | |
| Ministry baccalaureate rate | ڕێژەی پۆلی شەشی ئامادەیی | Iraqi "السادس الإعدادي" has no fixed Sorani phrase. |
| Tuition | کرێی خوێندن | «پارەی خوێندن» is the alternative. |
| Shortlist | لیستی کورتکراوە | |
| WhatsApp | واتسئاپ | Spelling varies (واتساپ / واتسئەپ). |
| "Join Eduraq" | بەشدارمان بە | Imperative; a noun phrase may suit a button better. |

Known gaps in this slice (not Sorani-specific):

- `Explore` governorate options still show the raw `gov.region` enum (`CENTRAL`, `KURDISTAN`, …) in
  parentheses, as the Arabic and English pages do today; left unchanged.
- The institution profile's "languages of instruction" labels keep the existing Arabic/English values
  (the Arabic page prints `Kurdish` in Latin letters); only Sorani is new.
- `EVENT_TYPE_LABELS` (`src/lib/eventLabels.ts`) has no `ku` value yet — the home events section falls
  back to Arabic until WP3 adds it.
- `layout.tsx` metadata (titles/descriptions) for these routes is owned by WP2.
- Phone/WhatsApp message templates (pre-filled chat text) are translated like any other string.
