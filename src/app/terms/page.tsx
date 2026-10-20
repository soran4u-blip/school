'use client';

import LegalPage from '../privacy/LegalPage';
import { TERMS_CONTENT } from './Terms.i18n';

export default function TermsPage() {
  return <LegalPage content={TERMS_CONTENT} />;
}
