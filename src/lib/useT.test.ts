import { describe, expect, it } from 'vitest';
import { translate, type CopyDict } from './useT';

const COPY = {
  title: { ar: 'عنوان', en: 'Title', ku: 'ناونیشان' },
  count: { ar: '{n} نتيجة', en: '{n} results', ku: '{n} ئەنجام' },
  blankKu: { ar: 'عربي', en: 'English', ku: '' },
} satisfies CopyDict;

describe('translate', () => {
  it('reads the requested language', () => {
    expect(translate(COPY, 'title', 'ar')).toBe('عنوان');
    expect(translate(COPY, 'title', 'en')).toBe('Title');
    expect(translate(COPY, 'title', 'ku')).toBe('ناونیشان');
  });

  it('fills placeholders and leaves unknown ones intact', () => {
    expect(translate(COPY, 'count', 'ku', { n: 3 })).toBe('3 ئەنجام');
    expect(translate(COPY, 'count', 'en', {})).toBe('{n} results');
  });

  it('falls back from a blank Sorani value to Arabic', () => {
    expect(translate(COPY, 'blankKu', 'ku')).toBe('عربي');
  });
});
