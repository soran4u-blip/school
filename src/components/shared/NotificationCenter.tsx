'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Calendar,
  GraduationCap,
  Briefcase,
  Star,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useNotifications } from '@/lib/useNotifications';
import { NotificationItem } from '@/core/types/notification';

function formatRelativeTime(isoString: string, lang: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return lang === 'ar' ? 'الآن' : 'Just now';
    if (diffMin < 60) return lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
    if (diffHours < 24) return lang === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return isoString.split('T')[0];
  } catch {
    return '';
  }
}

export default function NotificationCenter() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayedNotifications = tab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'CHAT_MESSAGE':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'BOOKING_REQUEST':
      case 'BOOKING_STATUS':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'ADMISSION_DECISION':
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case 'JOB_APPLICATION':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      case 'REVIEW':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative inline-block text-start" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title={t('الإشعارات', 'Notifications')}
        aria-label={t('الإشعارات', 'Notifications')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">{t('الإشعارات', 'Notifications')}</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 font-mono">
                  {unreadCount} {t('جديدة', 'new')}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('تحديد الكل كمقروء', 'Mark all read')}</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-3 pt-2 pb-1 gap-2 border-b border-slate-100 text-xs">
            <button
              onClick={() => setTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                tab === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('الكل', 'All')} ({notifications.length})
            </button>
            <button
              onClick={() => setTab('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                tab === 'unread'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('غير المقروءة', 'Unread')} ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>{tab === 'unread' ? t('لا توجد إشعارات غير مقروءة', 'No unread notifications') : t('لا توجد إشعارات بعد', 'No notifications yet')}</p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const titleText = (language === 'en' ? notif.title?.en : notif.title?.ar) || notif.title?.ar || notif.title?.en || '';
                const bodyText = (language === 'en' ? notif.body?.en : notif.body?.ar) || notif.body?.ar || notif.body?.en || '';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      notif.read ? 'hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 shrink-0 shadow-2xs mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${notif.read ? 'text-slate-800 font-semibold' : 'text-slate-950 font-bold'}`}>
                          {titleText}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatRelativeTime(notif.createdAt, language)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {bodyText}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
