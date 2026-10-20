'use client';

import LegalPage from './LegalPage';
import { PRIVACY_CONTENT } from './Privacy.i18n';

export default function PrivacyPolicyPage() {
  return <LegalPage content={PRIVACY_CONTENT} />;
}
