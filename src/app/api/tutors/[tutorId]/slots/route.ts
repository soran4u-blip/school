import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tutorId: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { tutorId } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ success: false, error: 'Missing from/to date range' }, { status: 400 });
  }

  try {
    const snap = await adminDb
      .collection('bookings')
      .where('tutorId', '==', tutorId)
      .where('date', '>=', from)
      .where('date', '<=', to)
      .get();

    const slots = snap.docs
      .map((d) => d.data() as Booking)
      .filter((b) => b.status !== 'CANCELLED')
      .map((b) => ({
        bookingId: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        type: b.type,
        currentSize: b.participants.length,
        maxGroupSize: b.maxGroupSize,
        isFull: b.participants.length >= b.maxGroupSize,
        pricePerStudent: b.pricePerStudent,
      }));

    return NextResponse.json({ success: true, slots });
  } catch (e) {
    console.error('Failed to load booking slots:', e);
    // Degrade gracefully: an empty slot list just means every availability
    // slot renders as open, rather than breaking the booking calendar entirely.
    return NextResponse.json({ success: true, slots: [] });
  }
}
