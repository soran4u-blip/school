import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { loadBookingAndVerifyPhone, listThreadMessages, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';

// GET /api/bookings/[id]/messages?phone=... — a guest (student) reads their thread for this booking.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const booking = await loadBookingAndVerifyPhone(adminDb, id, phone);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found for that phone number' }, { status: 404 });
  }

  const messages = await listThreadMessages(adminDb, id);
  return NextResponse.json({ success: true, messages });
}

// POST /api/bookings/[id]/messages — a guest (student) sends a message on their booking thread.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const phone = body?.phone?.trim();
  const text = body?.text?.trim();
  const senderName = body?.senderName?.trim() || 'Student';

  if (!phone || !text) {
    return NextResponse.json({ success: false, error: 'Missing phone or message text' }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const booking = await loadBookingAndVerifyPhone(adminDb, id, phone);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found for that phone number' }, { status: 404 });
  }

  const message = await sendThreadMessage(adminDb, booking, 'student', senderName, text);
  return NextResponse.json({ success: true, message });
}
