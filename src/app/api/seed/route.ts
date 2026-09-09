import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import seedData from '@/core/seed/seedData.json';
import { revalidatePublicData } from '@/core/server/data/cache';
import { recordAuditEvent } from '@/core/server/auditLog';
import { errorMessage, errorStack } from '@/lib/errors';
import { logServerError } from '@/core/server/errorLog';


// This overwrites master data (governorates, categories, institutions...) wholesale — restricted
// to superadmin so it can't be triggered by an unauthenticated POST against a guessable path.
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'seed:run');
  if (auth.error) return auth.error;

  try {
    const db = auth.context.db;
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
    // Programs are an array on the institution document — that is where the institution
    // dashboard writes them (saveInstitution) and the only place the public profile reads them
    // from. An earlier version of this seeder split them off into a `programs` subcollection
    // instead, which nothing has ever read, so every seeded institution showed an empty
    // Programs tab.
    for (const inst of seedData.institutions) {
      await db.collection('institutions').doc(inst.id).set(inst);
    }
    results.push(`✅ ${seedData.institutions.length} institutions seeded`);

    // 6. Seed Tutors
    for (const tutor of seedData.tutors) {
      await db.collection('tutors').doc(tutor.id).set(tutor);
    }
    results.push(`✅ ${seedData.tutors.length} tutors seeded`);

    // 7. Seed Quick Search Tags
    for (const tag of seedData.quickSearchTags) {
      await db.collection('quick_search_tags').doc(tag.id).set(tag);
    }
    results.push(`✅ ${seedData.quickSearchTags.length} quick search tags seeded`);

    // 8. Seed System Settings
    await db.collection('system_settings').doc('global').set(seedData.systemSettings);
    results.push(`✅ System settings seeded`);

    // Seeding rewrites master data wholesale; every cached public snapshot is now stale.
    await recordAuditEvent(db, {
      actor: auth.context.user,
      action: 'database.seed',
      targetType: 'system',
      targetId: 'seed',
      summary: 'Re-seeded master data from seedData.json',
      request,
    });
    revalidatePublicData('institutions', 'tutors', 'jobs', 'masterData');

    return NextResponse.json({
      success: true,
      message: `Firestore database '${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb'}' seeded successfully!`,
      results,
    });

  } catch (error: unknown) {
    console.error('Seed error:', error);
    // The stack used to be returned in the response body. Even on a superadmin-only route that
    // is more than the caller needs; it goes to the error log instead.
    await logServerError('Seed failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Seeding failed') },
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
