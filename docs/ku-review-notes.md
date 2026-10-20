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
