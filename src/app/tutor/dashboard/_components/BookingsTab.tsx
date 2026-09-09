'use client';

import React from 'react';
import { Users, User, MessageCircle, Phone, Check, ListChecks, UserX, X } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Booking } from '@/core/types/booking';
import MessageThreadPanel from '@/components/shared/MessageThreadPanel';
import { MessageThreads } from '@/lib/useMessageThreads';

// The tutor dashboard's Bookings tab: the request queue with its status actions and the
// per-booking message thread.
export default function BookingsTab({
  bookings,
  handleBookingStatus,
  threads,
}: {
  bookings: Booking[];
  handleBookingStatus: (booking: Booking, status: Booking['status']) => void;
  threads: MessageThreads;
}) {
  const { t } = useLanguage();

  return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد حجوزات بعد', 'No bookings yet')}</div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {booking.type === 'GROUP' ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                      <span className="font-bold text-sm text-slate-900">{booking.date}</span>
                      <span className="text-xs text-slate-500 font-mono">{booking.startTime}–{booking.endTime}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                        booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                        booking.status === 'CANCELLED' || booking.status === 'NO_SHOW' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {booking.type === 'GROUP'
                        ? t(`مجموعة (${booking.participants.length}/${booking.maxGroupSize})`, `Group (${booking.participants.length}/${booking.maxGroupSize})`)
                        : t('جلسة فردية', 'Individual session')}
                      {' • '}
                      <span className="font-bold font-mono">{booking.pricePerStudent.iqd.toLocaleString()} IQD/{t('طالب', 'student')}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {booking.participants.map((p, i) => (
                        <span key={i} className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {p.name} — <span dir="ltr">{p.phone}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => threads.toggle(booking.id)}
                        className={`p-2 rounded-lg ${threads.expandedId === booking.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title={t('مراسلة', 'Message')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleBookingStatus(booking, 'CONFIRMED')}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                          title={t('تأكيد', 'Confirm')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleBookingStatus(booking, 'COMPLETED')}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                            title={t('اكتملت الجلسة', 'Mark Completed')}
                          >
                            <ListChecks className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBookingStatus(booking, 'NO_SHOW')}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                            title={t('لم يحضر الطالب', 'Mark No-show')}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                        <button
                          onClick={() => {
                            if (booking.status === 'CONFIRMED' && !confirm(t('هذا الحجز مؤكد بالفعل. هل تريد إلغاءه فعلاً؟', 'This booking is already confirmed. Cancel it anyway?'))) {
                              return;
                            }
                            handleBookingStatus(booking, 'CANCELLED');
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                          title={t('إلغاء', 'Cancel')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>

                {threads.expandedId === booking.id && (
                  <MessageThreadPanel threadId={booking.id} threads={threads} ownRole="tutor" />
                )}
                </div>
              ))
            )}
          </div>
  );
}
