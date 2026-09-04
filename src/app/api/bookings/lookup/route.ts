import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const snap = await adminDb.collection('bookings').where('participantPhones', 'array-contains', phone).get();

  const tutorIds = [...new Set(snap.docs.map((d) => (d.data() as Booking).tutorId))];
  const tutors = new Map<string, Tutor>();
  await Promise.all(
    tutorIds.map(async (id) => {
      const t = await adminDb!.collection('tutors').doc(id).get();
      if (t.exists) tutors.set(id, t.data() as Tutor);
    })
  );

  const bookings = snap.docs
    .map((d) => d.data() as Booking)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map((b) => {
      const tutor = tutors.get(b.tutorId);
      return {
        id: b.id,
        tutorId: b.tutorId,
        tutorName: tutor?.fullName || null,
        tutorWhatsapp: tutor?.whatsappNumber || null,
        type: b.type,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        pricePerStudent: b.pricePerStudent,
        groupSize: b.type === 'GROUP' ? b.participants.length : undefined,
        maxGroupSize: b.type === 'GROUP' ? b.maxGroupSize : undefined,
      };
    });

  return NextResponse.json({ success: true, bookings });
}
