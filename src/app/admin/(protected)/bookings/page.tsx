'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getAllBookings } from '@/core/services/bookingService';
import { getTutors } from '@/core/services/tutorService';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { pickLocalized } from '@/lib/localized';
import { Calendar, Users, User, Phone, AlertCircle } from 'lucide-react';
import { useT } from '@/lib/useT';
import { BOOKINGS_COPY } from './Bookings.i18n';

export default function AdminBookingsPage() {
  const { language } = useLanguage();
  const t = useT(BOOKINGS_COPY);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filterTutor, setFilterTutor] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [allBookings, tutorList] = await Promise.all([
          getAllBookings(),
          getTutors({}),
        ]);
        setBookings(allBookings);
        setTutors(tutorList);
      } catch {
        setError(t('loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const tutorName = (id: string) => {
    const tutor = tutors.find((x) => x.id === id);
    return tutor ? pickLocalized(tutor.fullName, language) : id;
  };

  const filtered = filterTutor === 'all' ? bookings : bookings.filter((b) => b.tutorId === filterTutor);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <select
          value={filterTutor}
          onChange={(e) => setFilterTutor(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="all">{t('allTutors')}</option>
          {tutors.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>{pickLocalized(tutor.fullName, language)}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 font-bold">
          {t('results')} <span className="text-slate-900 font-black">{filtered.length}</span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('empty')}</div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {b.type === 'GROUP' ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                  <span className="font-bold text-sm text-slate-900">{tutorName(b.tutorId)}</span>
                  <span className="text-xs text-slate-500 font-mono">{b.date} {b.startTime}–{b.endTime}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                    b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                    b.status === 'CANCELLED' || b.status === 'NO_SHOW' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {b.type === 'GROUP' ? t('group', { count: b.participants.length, max: b.maxGroupSize }) : t('individual')}
                  {' • '}<span className="font-bold font-mono">{b.pricePerStudent.iqd.toLocaleString()} IQD/{t('student')}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {b.participants.map((p, i) => (
                    <span key={i} className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {p.name} — <span dir="ltr">{p.phone}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
