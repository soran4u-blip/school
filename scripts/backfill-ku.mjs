// Fill in Sorani (`ku`) for localized {ar, en} fields on existing directory documents (the demo /
// mock institutions, tutors, categories, taxonomies, ...) using the Arabic -> Sorani pairs already
// translated in src/core/seed/seedData.json. Only fields that have no `ku` yet are touched, and
// only when their Arabic text matches a seeded translation; everything else is listed as unmatched.
//
// Dry run by default (reads only, prints what it would change). Pass --write to apply.
// Usage: node --env-file=.env.local scripts/backfill-ku.mjs [--write]
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const write = process.argv.includes('--write');

const seed = JSON.parse(readFileSync(new URL('../src/core/seed/seedData.json', import.meta.url), 'utf8'));
const translations = new Map();
const isLocalized = (o) => o && typeof o === 'object' && typeof o.ar === 'string' && typeof o.en === 'string';
(function collect(o) {
  if (Array.isArray(o)) return o.forEach(collect);
  if (!o || typeof o !== 'object') return;
  if (isLocalized(o)) {
    if (o.ku) translations.set(o.ar.trim(), o.ku);
    return;
  }
  Object.values(o).forEach(collect);
})(seed);


// Demo accounts that exist in the live database but not in seedData.json. Real users' names and
// bios are deliberately not machine-translated here; they stay as written until the owner adds a
// Sorani version in their dashboard.
const EXTRA = {
  'قيد المراجعة': 'لە چاوەڕێی پێداچوونەوەدایە',
  'الجامعة الأمريكية في بغداد': 'زانکۆی ئەمریکیی بەغدا',
  'الجامعة الأمريكية في بغداد (AUIB) مؤسسة تعليمية في بغداد تقدم برامج البكالوريوس باللغة الإنجليزية.': 'زانکۆی ئەمریکیی بەغدا (AUIB) دامەزراوەیەکی پەروەردەییە لە بەغدا و بەرنامەی بەکالۆریۆس بە زمانی ئینگلیزی پێشکەش دەکات.',
  'يشترط للمتقدم أن يبلغ 18 عاماً أو أكثر خلال السنة التقويمية التي يتقدم فيها، وأن يستوفي متطلبات إتقان اللغة الإنجليزية وأي شروط إضافية يحددها البرنامج المختار.': 'داواکار دەبێت لە ساڵی ڕۆژژمێریی داواکارییەکەیدا تەمەنی 18 ساڵ یان زیاتر بێت، و مەرجەکانی شارەزایی لە زمانی ئینگلیزی و هەر مەرجێکی تری پڕۆگرامە هەڵبژێردراوەکە جێبەجێ بکات.',
  'تُدرّس جميع الصفوف باللغة الإنجليزية. يجب استيفاء متطلبات أكاديمية اللغة الإنجليزية قبل الالتحاق ببرنامج البكالوريوس.': 'هەموو پۆلەکان بە زمانی ئینگلیزی دەگوترێنەوە. دەبێت مەرجە ئەکادیمییەکانی زمانی ئینگلیزی جێبەجێ بکرێن پێش بەشداریکردن لە بەرنامەی بەکالۆریۆس.',
  'Airport Road, Baghdad - Iraq': 'ڕێگای فڕۆکەخانە، بەغدا - عێراق',
  'يونيسف العراق': 'یونیسێفی عێراق',
  'تعمل اليونيسف في العراق على إنقاذ حياة الأطفال والدفاع عن حقوقهم ومساعدتهم على تحقيق إمكاناتهم.': 'یونیسێف لە عێراق کار دەکات بۆ ڕزگارکردنی ژیانی منداڵان و بەرگریکردن لە مافەکانیان و یارمەتیدانیان بۆ گەیشتن بە توانایان.',
  'مجمع الأمم المتحدة (ديوان)، منطقة كرادة مريم، شارع حيفا، 10011 بغداد، العراق': 'کۆمەڵگەی نەتەوە یەکگرتووەکان (دیوان)، ناوچەی کەڕادەی مەریەم، شەقامی حەیفا، 10011 بەغدا، عێراق',
  'العنوان التجريبي، بغداد': 'ناونیشانی تاقیکارانە، بەغدا',
  'الأحد - الخميس، 8:00 ص - 3:00 م': 'یەکشەممە - پێنجشەممە، 8:00ی بەیانی - 3:00ی دوانیوەڕۆ',
  'مؤسسة تعليمية تجريبية لاختبار مسار المؤسسات.': 'دامەزراوەیەکی پەروەردەیی تاقیکارانە بۆ تاقیکردنەوەی ڕێڕەوی دامەزراوەکان.',
  'جامعة إدوراڤ التجريبية': 'زانکۆی ئێدوڕاڤی تاقیکارانە',
  'برنامج علوم الحاسوب التجريبي': 'پڕۆگرامی زانستی کۆمپیوتەری تاقیکارانە',
  'كلية الاختبار': 'کۆلێژی تاقیکردنەوە',
};
for (const [ar, ku] of Object.entries(EXTRA)) if (!translations.has(ar)) translations.set(ar, ku);

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb');

const unmatched = new Map(); // arabic text -> where it was found
let filled = 0;

// Returns a copy with `ku` added where possible, or the same reference when nothing changed.
function fill(value, where) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((v) => {
      const out = fill(v, where);
      if (out !== v) changed = true;
      return out;
    });
    return changed ? next : value;
  }
  if (!value || typeof value !== 'object') return value;
  if (isLocalized(value)) {
    if (value.ku || !value.ar.trim()) return value;
    const ku = translations.get(value.ar.trim());
    if (ku) {
      filled++;
      return { ...value, ku };
    }
    unmatched.set(value.ar.trim(), where);
    return value;
  }
  let changed = false;
  const next = {};
  for (const [k, v] of Object.entries(value)) {
    next[k] = fill(v, where);
    if (next[k] !== v) changed = true;
  }
  return changed ? next : value;
}

const COLLECTIONS = ['locations_governorates', 'categories', 'taxonomies_master', 'quick_search_tags', 'institutions', 'tutors', 'system_settings'];

async function process_(ref, data, where) {
  const updates = {};
  for (const [k, v] of Object.entries(data)) {
    const out = fill(v, `${where}.${k}`);
    if (out !== v) updates[k] = out;
  }
  if (Object.keys(updates).length === 0) return;
  console.log(`${write ? 'update' : 'would update'} ${where}: ${Object.keys(updates).join(', ')}`);
  if (write) await ref.update(updates);
}

for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get();
  for (const doc of snap.docs) {
    await process_(doc.ref, doc.data(), `${name}/${doc.id}`);
    if (name === 'locations_governorates') {
      const cities = await doc.ref.collection('cities').get();
      for (const city of cities.docs) await process_(city.ref, city.data(), `${name}/${doc.id}/cities/${city.id}`);
    }
  }
}

console.log(`\n${write ? 'Filled' : 'Would fill'} ${filled} field(s).`);
if (unmatched.size) {
  console.log(`${unmatched.size} Arabic text(s) have no seeded Sorani translation yet:`);
  for (const [ar, where] of unmatched) console.log(`  ${where}: ${ar.slice(0, 600)}`);
}
if (!write) console.log('\nDry run only. Re-run with --write to apply.');
