'use client';

import React from 'react';
import { Plus, CalendarDays, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { EduEvent } from '@/core/types/event';
import { Governorate } from '@/core/types/masterData';
import { EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { EVENTS_MANAGER_COPY } from './SharedPanels.i18n';

export type DraftEvent = EduEvent | Omit<EduEvent, 'id' | 'createdAt' | 'updatedAt'>;

// Shared events create/edit/list panel for both the institution and employer(NGO) dashboards —
// mirrors JobsTab.tsx's shape and behavior (inline editor, status toggle, no delete UI), factored
// into one component since both dashboards need the identical form/list.
export default function EventsManager({
  events,
  governorates,
  editingEvent,
  setEditingEvent,
  handleSaveEvent,
  handleEventStatus,
  savingEvent,
  onCreateNew,
}: {
  events: EduEvent[];
  governorates: Governorate[];
  editingEvent: DraftEvent | null;
  setEditingEvent: (event: DraftEvent | null) => void;
  handleSaveEvent: () => void;
  handleEventStatus: (eventId: string, status: EduEvent['status']) => void;
  savingEvent: boolean;
  onCreateNew: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(EVENTS_MANAGER_COPY);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-600" />
          <span>{t('events')}</span>
        </h2>
        {!editingEvent && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('postEvent')}</span>
          </button>
        )}
      </div>

      {editingEvent && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('titleAr')}
              value={editingEvent.title.ar}
              onChange={(e) => setEditingEvent({ ...editingEvent, title: { ...editingEvent.title, ar: e.target.value } })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              placeholder={t('titleEn')}
              value={editingEvent.title.en}
              onChange={(e) => setEditingEvent({ ...editingEvent, title: { ...editingEvent.title, en: e.target.value } })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              rows={3}
              placeholder={t('descAr')}
              value={editingEvent.description.ar}
              onChange={(e) => setEditingEvent({ ...editingEvent, description: { ...editingEvent.description, ar: e.target.value } })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
            />
            <textarea
              rows={3}
              placeholder={t('descEn')}
              value={editingEvent.description.en}
              onChange={(e) => setEditingEvent({ ...editingEvent, description: { ...editingEvent.description, en: e.target.value } })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={editingEvent.eventType}
              onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value as EduEvent['eventType'] })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            >
              {(Object.keys(EVENT_TYPE_LABELS) as EduEvent['eventType'][]).map((key) => (
                <option key={key} value={key}>{pickLocalized(EVENT_TYPE_LABELS[key], language)}</option>
              ))}
            </select>
            <select
              value={editingEvent.governorateId}
              onChange={(e) => setEditingEvent({ ...editingEvent, governorateId: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            >
              <option value="">{t('selectGovernorate')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
              ))}
            </select>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('startDate')}</label>
              <input
                type="date"
                value={editingEvent.startDate || ''}
                onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('endDate')}</label>
              <input
                type="date"
                value={editingEvent.endDate || ''}
                onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('registrationLink')}
              value={editingEvent.registrationLink || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, registrationLink: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              placeholder={t('whatsapp')}
              value={editingEvent.whatsappNumber || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, whatsappNumber: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('venue')}
              value={editingEvent.venue?.ar || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, venue: { ar: e.target.value, en: editingEvent.venue?.en || '' } })}
              disabled={editingEvent.isOnline}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
            />
            <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={editingEvent.isOnline}
                onChange={(e) => setEditingEvent({ ...editingEvent, isOnline: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span>{t('online')}</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setEditingEvent(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveEvent}
              disabled={savingEvent || !editingEvent.title.ar.trim() || !editingEvent.title.en.trim() || !editingEvent.governorateId || !editingEvent.startDate}
              className="px-4 py-2 text-xs font-bold bg-[#0B192C] text-white rounded-lg disabled:opacity-60"
            >
              {savingEvent ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-[11px] text-slate-400">{t('noEvents')}</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-900">{pickLocalized(ev.title, language)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ev.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : ev.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {ev.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
                  <CalendarDays className="w-3 h-3" />
                  <span>{ev.startDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingEvent(ev)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                >
                  {t('edit')}
                </button>
                {ev.status === 'ACTIVE' ? (
                  <button onClick={() => handleEventStatus(ev.id, 'CLOSED')} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold">
                    {t('close')}
                  </button>
                ) : (
                  <button onClick={() => handleEventStatus(ev.id, 'ACTIVE')} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold">
                    {t('publish')}
                  </button>
                )}
                <a href={`/events/${ev.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-slate-700">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
