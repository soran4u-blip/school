import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import seedData from '@/core/seed/seedData.json';

// Initialize admin SDK inline (server-side only)
function getAdminDb() {
  let app: App;
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'school-4bcd6',
    });
  } else {
    app = getApps()[0];
  }
  const dbName = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb';
  return getFirestore(app, dbName);
}

export async function POST() {
  try {
    const db = getAdminDb();
    const results: string[] = [];

    // 1. Seed Governorates
    for (const gov of seedData.governorates) {
      await db.collection('locations_governorates').doc(gov.id).set(gov);
    }
    results.push(`✅ ${seedData.governorates.length} governorates seeded`);

    // 2. Seed Cities under their Governorate subcollection
    for (const city of seedData.cities) {
      await db
        .collection('locations_governorates')
        .doc(city.governorateId)
        .collection('cities')
        .doc(city.id)
        .set(city);
    }
    results.push(`✅ ${seedData.cities.length} cities seeded`);

    // 3. Seed Categories
    for (const cat of seedData.categories) {
      await db.collection('categories').doc(cat.id).set(cat);
    }
    results.push(`✅ ${seedData.categories.length} categories seeded`);

    // 4. Seed Taxonomies
    for (const tax of seedData.taxonomies) {
      await db.collection('taxonomies_master').doc(tax.id).set(tax);
    }
    results.push(`✅ ${seedData.taxonomies.length} taxonomy items seeded`);

    // 5. Seed Institutions
    for (const inst of seedData.institutions) {
      const { programs, ...instData } = inst as any;
      await db.collection('institutions').doc(inst.id).set(instData);
      if (programs && programs.length > 0) {
        for (const prog of programs) {
          await db
            .collection('institutions')
            .doc(inst.id)
            .collection('programs')
            .doc(prog.id)
            .set(prog);
        }
      }
    }
    results.push(`✅ ${seedData.institutions.length} institutions seeded`);

    // 6. Seed Tutors
    for (const tutor of seedData.tutors) {
      await db.collection('tutors').doc(tutor.id).set(tutor);
    }
    results.push(`✅ ${seedData.tutors.length} tutors seeded`);

    // 7. Seed System Settings
    await db.collection('system_settings').doc('global').set(seedData.systemSettings);
    results.push(`✅ System settings seeded`);

    return NextResponse.json({
      success: true,
      message: `Firestore database '${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb'}' seeded successfully!`,
      results,
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error', stack: error.stack },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to this endpoint to seed Firestore with the Iraq Education Directory master data.',
    database: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb',
    project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'school-4bcd6',
  });
}
