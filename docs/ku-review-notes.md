# Kurdish Sorani (ckb) — drafts awaiting native-speaker review

Every Sorani string in the codebase was drafted by an AI model and has **not** been reviewed by a
native speaker. Do not treat any of it as final. Each work package appends a section below listing
what it drafted and anything it was unsure about.

## WP2 — `/ku` routes and SEO metadata (src/app/ku/**, src/lib/seo.ts)

Page titles and descriptions:

| Where | Sorani draft | English meaning |
|---|---|---|
| `/ku` (home) title | پلاتفۆرمی دۆزینەوەی پەروەردەی عێراق | Iraq's Education Discovery Platform |
| `/ku` (home) description | قوتابخانە، زانکۆ، پەیمانگا و مامۆستای تایبەت لە سەرانسەری عێراق بدۆزەرەوە و بەراوردیان بکە… | Discover and compare schools, universities, institutes and private tutors across Iraq… |
| `/ku/explore` | قوتابخانە، زانکۆ و پەیمانگاکان بپشکنە | Explore schools, universities and institutes |
| `/ku/tutors` | مامۆستای تایبەت لە عێراق بدۆزەرەوە | Find private tutors in Iraq |
| `/ku/jobs` | هەلی کاری پەروەردەیی لە عێراق | Education jobs in Iraq |
| `/ku/events` | چالاکییە پەروەردەییەکان لە عێراق | Education events in Iraq |
| `/ku/login` | چوونەژوورەوە | Log in |
| `/ku/my-applications` | داواکارییەکانی کارم | My job applications |

Breadcrumb and not-found wording (`SEO_LABELS`, `NOT_FOUND_TITLES` in `src/lib/seo.ts`): سەرەکی (Home),
گەڕان (Explore), مامۆستایان (Tutors), هەلی کار (Jobs); مامۆستا / دامەزراوە / هەلی کار نەدۆزرایەوە (… not found).

Questions for the reviewer:
- Is "دامەزراوە" the natural word for "institution" here, or would "پەیمانگا"/"دەزگا" read better?
- Is "هەلی کار" the usual phrase for "job" on listing sites?
- Is "گەڕان" right for the "Explore" nav label (vs. "دۆزینەوە" / "پشکنین")?

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
