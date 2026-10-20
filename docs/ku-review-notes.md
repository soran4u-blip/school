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

## WP4b — community (`src/app/community/**`)

Dictionary: `src/app/community/Community.i18n.ts`. Drafted by Claude, not native-reviewed.

- `/community` has no `/ku` URL tree by design (see `community/layout.tsx`: posts are user-written,
  single-language content), so the UI follows the saved language preference only.
- User posts and replies are shown as submitted; only the surrounding UI is translated.
- Uncertain terms: «کۆمەڵگە» (community), «فۆرومی ئینتەراکتیڤی دایک و باوکان» (interactive parents
  forum), «چاوەڕێی وەڵام» (awaiting reply), «سوودبەخش» (helpful), the relative-time phrasing
  («… لەمەوبەر»), and «باخچەی منداڵان» for kindergarten.
- The trending-topic chips keep Arabic search terms (posts are mostly Arabic) with translated labels.

## WP4c — dashboards, admin, account, jobs, events, legal

Everything below is a Claude draft, not native-reviewed. **Privacy and Terms (`src/app/privacy/Privacy.i18n.ts`,
`src/app/terms/Terms.i18n.ts`) need a legal-minded native reviewer before launch**; the Sorani is deliberately literal.
Uncertain terms flagged by the drafting passes:

- Legal: نهێنیێتی (privacy), بەرپرسیارێتی (liability), دانوستان (negotiation), کووکییەکان (cookies), هەڵگرتنی ئەبری (cloud storage).
- Events: وۆرکشۆپ, ڕۆژی کراوە, پێشانگا, دانیشتنی ناساندن, ڕێکخراو.
- Jobs/login: دەوام (employment type), ئەرکەکان / مەرجەکان (responsibilities / requirements), وشەی نهێنی (password), لەدوورەوە (remote), کۆمپانیا, CV kept in Latin.
- Admin: هاوپۆل / پۆلێن / بڕگە (category / taxonomy / item), وەزاری, شیکارییەکان (analytics), تۆماری کردارەکان (audit log),
  داواکارییەکانی پەیوەستبوون (join applications), هەڵەکانی سیستەم (system errors), تەختەی ڕاگەیاندنی بەپەلە (ticker), باشوور / باکوور / ڕۆژئاوا (region names).
- Dashboards: پرسیار (inquiry), ئامرازەکان (facilities), دروشم (tagline), ژمارەی شوێن (seats), وەرزانە / خول (semester / course),
  کاتی بەشێک / کاتی تەواو (part / full time), لیستی چاوەڕوانی (waitlisted), کشاوەتەوە (withdrawn), دامەزرا (hired), ژیاننامە (resume), بە کاتی ڕاگیرا (paused).
- Tutor/account: حیجز (booking), گرووپ (group), تاکەکەسی (individual), بلۆککردنی ڕۆژ (block date), ناوچەی مەترسی (danger zone),
  سەرپەرشتیار (parent / guardian in the apply form), the new delivery-mode labels ئۆنلاین / بەرەوڕوو / تێکەڵ, and the confirm / verification sentences.

Known gaps (not string translation):

- No admin or owner form has a Sorani input field (`LocalizedString.ku` is supported by the type but nothing edits it),
  so institution/tutor/category names stay Arabic or English for Sorani readers until fields are added.
- Raw status enums (PENDING, CONFIRMED, APPROVED, ...) are still shown as-is in a few lists, as they always were.
- `EMPLOYMENT_LABELS` (jobs) and `AvailabilityTab` `DAY_LABELS` have no `ku`; `completeness.missingFields`
  (`lib/publishingGuardrails`) has no `ku`. These fall back to Arabic.
- Admin institutions list shows `name.en` on the secondary line for Sorani readers.
