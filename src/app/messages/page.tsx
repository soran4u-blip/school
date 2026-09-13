'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Search,
  MessageCircle,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useConversations } from '@/lib/useConversations';

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessagesPage() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('conversationId');

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeMessages,
    loading,
    messagesLoading,
    currentUserId,
    sendMessage,
  } = useConversations();

  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial conversation if passed in URL query
  useEffect(() => {
    if (initialConvId && conversations.some((c) => c.id === initialConvId)) {
      setActiveConversationId(initialConvId);
    } else if (!activeConversationId && conversations.length > 0 && window.innerWidth >= 1024) {
      // Auto select first conversation on desktop
      setActiveConversationId(conversations[0].id);
    }
  }, [initialConvId, conversations, activeConversationId, setActiveConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const recipient = activeConversation?.participants.find((p) => p.id !== currentUserId);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const otherParticipant = c.participants.find((p) => p.id !== currentUserId);
    return (
      otherParticipant?.name?.toLowerCase().includes(query) ||
      otherParticipant?.phone?.toLowerCase().includes(query) ||
      c.lastMessage?.text?.toLowerCase().includes(query)
    );
  });

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft.trim() || !activeConversationId || sending) return;

    const textToSend = draft.trim();
    setDraft('');
    setSending(true);

    try {
      await sendMessage(activeConversationId, textToSend);
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'tutor':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            <User className="w-2.5 h-2.5" />
            {t('أستاذ', 'Tutor')}
          </span>
        );
      case 'institution':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            <GraduationCap className="w-2.5 h-2.5" />
            {t('مؤسسة', 'Institution')}
          </span>
        );
      case 'employer':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            <Briefcase className="w-2.5 h-2.5" />
            {t('صاحب عمل', 'Employer')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            <User className="w-2.5 h-2.5" />
            {t('طالب', 'Student')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-[750px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-e border-slate-200 flex flex-col shrink-0 bg-white ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-extrabold text-lg text-slate-900">{t('الرسائل', 'Messages')}</h1>
              <span className="text-xs text-slate-400 font-mono">
                {conversations.length} {t('محادثة', 'chats')}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('بحث عن محادثة...', 'Search messages...')}
                className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Conversations List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
                {t('جاري تحميل المحادثات...', 'Loading conversations...')}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p>{t('لا توجد محادثات حتى الآن', 'No conversations yet')}</p>
                <p className="text-[11px] text-slate-400">
                  {t(
                    'يمكنك بدء محادثة من صفحة الأستاذ أو طلبات الحجز',
                    'Start chatting from a tutor profile or booking card'
                  )}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants.find((p) => p.id !== currentUserId);
                const unread = currentUserId ? conv.unreadCounts?.[currentUserId] || 0 : 0;
                const isSelected = conv.id === activeConversationId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 border-s-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                      {other?.name ? other.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {other?.name || t('مستخدم', 'User')}
                        </span>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {conv.lastMessage?.text || t('محادثة جديدة', 'New conversation')}
                        </p>
                        {unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation && recipient ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 md:hidden"
                  >
                    {language === 'ar' ? (
                      <ArrowRight className="w-5 h-5" />
                    ) : (
                      <ArrowLeft className="w-5 h-5" />
                    )}
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    {recipient.name ? recipient.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-900">{recipient.name}</h2>
                      {getRoleBadge(recipient.role)}
                    </div>
                    {recipient.phone && (
                      <a
                        href={`tel:${recipient.phone}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        {recipient.phone}
                      </a>
                    )}
                  </div>
                </div>

                {activeConversation.context?.title && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {activeConversation.context.title}
                  </span>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messagesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-300" />
                    {t('تحميل الرسائل...', 'Loading messages...')}
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                    <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p>{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                    <p className="text-[11px]">
                      {t('أرسل أول رسالة لبدء المحادثة', 'Send a message to start the conversation')}
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs space-y-1 ${
                            isMine
                              ? 'bg-[#0B192C] text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          <div
                            className={`text-[9px] font-mono flex items-center justify-end ${
                              isMine ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('اكتب رسالة...', 'Type a message...')}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="p-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl shadow-xs transition-all disabled:opacity-40"
                  title={t('إرسال', 'Send')}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800">
                {t('مركز المحادثات والرسائل', 'Messages Center')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {t(
                  'اختر محادثة من القائمة الجانبية لبدء التواصل الفوري مع الطلاب أو الأساتذة',
                  'Select a conversation from the sidebar to chat in real-time with students or tutors'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
