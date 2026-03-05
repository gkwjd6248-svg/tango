'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaPaperPlane, FaGlobe } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi, TangoEvent, ChatMessage } from '@/lib/api/events';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';
import { getInitials } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';

type ChatMessageWithTranslation = ChatMessage & {
  translatedText?: string;
  showTranslated?: boolean;
};

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(dateStr: string, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return todayLabel;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayLabel;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDateSeparator(
  messages: ChatMessageWithTranslation[],
  index: number,
) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  const curr = new Date(messages[index].createdAt).toDateString();
  return prev !== curr;
}

function shouldShowAvatar(
  messages: ChatMessageWithTranslation[],
  index: number,
) {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.userId !== curr.userId) return true;
  // Show avatar if more than 5 min gap
  const gap = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return gap > 5 * 60 * 1000;
}

/* ------------------------------------------------------------------ */
/* ChatBubble                                                          */
/* ------------------------------------------------------------------ */

function ChatBubble({
  msg,
  isOwnMessage,
  onTranslate,
  isTranslating,
  showAvatar,
}: {
  msg: ChatMessageWithTranslation;
  isOwnMessage: boolean;
  onTranslate: (messageId: string) => void;
  isTranslating: boolean;
  showAvatar: boolean;
}) {
  const hasCountry = !!msg.user.countryCode;
  const initials = getInitials(msg.user.nickname);
  const displayText =
    msg.showTranslated && msg.translatedText ? msg.translatedText : msg.message;

  if (isOwnMessage) {
    return (
      <div className={`flex justify-end ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
        <div className="max-w-[78%] sm:max-w-[65%]">
          <div className="bg-primary-700 text-white rounded-2xl rounded-br-sm px-3.5 py-2 shadow-sm">
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
              {displayText}
            </p>
            {msg.showTranslated && msg.translatedText && (
              <p className="text-[10px] mt-1.5 pt-1.5 border-t border-white/20 italic text-white/60">
                {msg.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5">
              <button
                onClick={() => onTranslate(msg.id)}
                disabled={isTranslating}
                className={`transition-opacity disabled:opacity-30 ${
                  msg.showTranslated ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
                aria-label={msg.showTranslated ? 'Show original' : 'Translate'}
              >
                <FaGlobe size={9} />
              </button>
              <time className="text-[10px] opacity-60">{formatMessageTime(msg.createdAt)}</time>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
      {/* Avatar */}
      {showAvatar ? (
        <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-[11px] font-bold">{initials}</span>
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div className="max-w-[78%] sm:max-w-[65%]">
        {showAvatar && (
          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
            <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-400">
              {msg.user.nickname}
            </span>
            {hasCountry && <CountryFlag code={msg.user.countryCode!} size={13} />}
          </div>
        )}
        <div className="bg-white dark:bg-warm-800 rounded-2xl rounded-bl-sm px-3.5 py-2 shadow-sm border border-warm-100/60 dark:border-warm-700/60">
          <p className="text-[13.5px] leading-relaxed text-warm-900 dark:text-warm-100 whitespace-pre-wrap break-words">
            {displayText}
          </p>
          {msg.showTranslated && msg.translatedText && (
            <p className="text-[10px] mt-1.5 pt-1.5 border-t border-warm-100 dark:border-warm-700 italic text-warm-400">
              {msg.message}
            </p>
          )}
          <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5">
            <button
              onClick={() => onTranslate(msg.id)}
              disabled={isTranslating}
              className={`transition-colors disabled:opacity-30 ${
                msg.showTranslated
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-warm-300 hover:text-primary-700 dark:hover:text-primary-400'
              }`}
              aria-label={msg.showTranslated ? 'Show original' : 'Translate'}
            >
              <FaGlobe size={9} />
            </button>
            <time className="text-[10px] text-warm-400">
              {formatMessageTime(msg.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DateSeparator                                                       */
/* ------------------------------------------------------------------ */

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 rounded-full bg-warm-800/60 text-white text-[11px] font-medium shadow-sm">
        {label}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Event type styles                                                   */
/* ------------------------------------------------------------------ */

const EVENT_TYPE_COLORS: Record<string, string> = {
  milonga: 'bg-primary-700',
  festival: 'bg-purple-600',
  workshop: 'bg-blue-600',
  practica: 'bg-amber-500',
  concert: 'bg-green-600',
};

/* ------------------------------------------------------------------ */
/* Main Chat Component                                                 */
/* ------------------------------------------------------------------ */

function EventChat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();

  const [event, setEvent] = useState<TangoEvent | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithTranslation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isNearBottom = useCallback(() => {
    const el = messageContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((instant?: boolean) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'instant' as ScrollBehavior : 'smooth',
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    loadInitialData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventData, chatData] = await Promise.all([
        eventsApi.getEvent(id as string),
        eventsApi.getChatMessages(id as string),
      ]);
      setEvent(eventData);
      setMessages(chatData.items);
      setTimeout(() => scrollToBottom(true), 50);
      startPolling();
    } catch (err: any) {
      setError(err?.response?.status === 403 ? t.events.chatAccessDenied : t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const chatData = await eventsApi.getChatMessages(id as string);
        setMessages((prev) => {
          if (chatData.items.length !== prev.length) {
            const translationMap = new Map(
              prev.map((m) => [m.id, { translatedText: m.translatedText, showTranslated: m.showTranslated }]),
            );
            const merged = chatData.items.map((m) => ({
              ...m,
              ...translationMap.get(m.id),
            }));
            if (isNearBottom()) {
              setTimeout(() => scrollToBottom(), 100);
            }
            return merged;
          }
          return prev;
        });
      } catch {
        // silent
      }
    }, 5000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const sent = await eventsApi.sendChatMessage(id as string, newMessage.trim());
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(() => scrollToBottom(), 50);
    } catch {
      // silent
    } finally {
      setIsSending(false);
    }
  };

  const handleTranslate = async (messageId: string) => {
    const existing = messages.find((m) => m.id === messageId);
    if (existing?.translatedText) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, showTranslated: !m.showTranslated } : m)),
      );
      return;
    }
    setTranslatingId(messageId);
    try {
      const result = await eventsApi.translateChatMessage(id as string, messageId, locale);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, translatedText: result.translatedText, showTranslated: true }
            : m,
        ),
      );
    } catch {
      // silent
    } finally {
      setTranslatingId(null);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const typeBadgeColor = event ? (EVENT_TYPE_COLORS[event.eventType] || 'bg-warm-500') : '';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Chat Header ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800 px-4 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <Link
          href="/chat"
          className="p-2 -ml-2 rounded-lg text-warm-500 hover:text-warm-800 dark:hover:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-all"
        >
          <FaArrowLeft size={15} />
        </Link>

        {event && (
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-warm-900 dark:text-warm-100 text-sm truncate">{event.title}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${typeBadgeColor}`}
              />
              <span className="text-[11px] text-warm-400 capitalize">{event.eventType}</span>
              <span className="text-warm-300 dark:text-warm-600 text-[11px]">&bull;</span>
              <span className="text-[11px] text-warm-400">{event.city}</span>
              {event.countryCode && (
                <CountryFlag code={event.countryCode} size={12} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Message area ────────────────────────────────────────────── */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 scrollbar-thin"
        style={{
          background: 'linear-gradient(180deg, #f5edd4 0%, #e8d9b5 100%)',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/70 flex items-center justify-center">
              <FaArrowLeft size={20} className="text-warm-300" />
            </div>
            <p className="text-warm-700 text-sm font-medium mb-3">{error}</p>
            <button
              onClick={loadInitialData}
              className="px-5 py-2 rounded-xl bg-white text-warm-700 text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              {t.common.retry}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="px-4 py-2 rounded-full bg-warm-800/50 text-white text-sm inline-block">
                {t.events.noChatMessages}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={msg.id}>
                {shouldShowDateSeparator(messages, i) && (
                  <DateSeparator
                    label={getDateLabel(
                      msg.createdAt,
                      t.events.chatDateToday,
                      t.events.chatDateYesterday,
                    )}
                  />
                )}
                <ChatBubble
                  msg={msg}
                  isOwnMessage={msg.userId === user?.id}
                  onTranslate={handleTranslate}
                  isTranslating={translatingId === msg.id}
                  showAvatar={shouldShowAvatar(messages, i)}
                />
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────── */}
      {!error && (
        <div className="bg-white dark:bg-warm-900 border-t border-warm-100 dark:border-warm-800 px-3 sm:px-4 py-2.5 flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.events.chatInputPlaceholder}
                maxLength={2000}
                rows={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800
                           text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 dark:placeholder:text-warm-500
                           focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
                           resize-none overflow-hidden transition-colors"
                style={{ maxHeight: '128px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center
                         hover:bg-primary-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                         flex-shrink-0 shadow-sm"
              aria-label={t.events.sendMessage}
            >
              <FaPaperPlane size={14} className={isSending ? 'animate-pulse' : ''} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function EventChatPage() {
  return (
    <AuthGuard>
      <EventChat />
    </AuthGuard>
  );
}
