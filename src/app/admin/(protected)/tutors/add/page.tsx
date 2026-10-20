'use client';

import React, { Suspense } from 'react';
import TutorForm from './TutorForm';

export default function AddTutorPage() {
  return (
    <Suspense fallback={null}>
      <TutorForm />
    </Suspense>
  );
}
