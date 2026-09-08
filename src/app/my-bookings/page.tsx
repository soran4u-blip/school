import { redirect } from 'next/navigation';

// Booking now requires a student account — the old phone-lookup flow has been retired
// in favor of /account, which is gated behind login.
export default function MyBookingsPage() {
  redirect('/account');
}
