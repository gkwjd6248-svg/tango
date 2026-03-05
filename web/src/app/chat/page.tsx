'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineChatAlt2 } from 'react-icons/hi';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi, ChatRoom } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import { formatRelativeTime } from '@/lib/utils';
import { CountryFlag } from '@/components/CountryFlag';

const EVENT_TYPE_COLORS: Record<string, string> = {
  milonga: 'bg-primary-700',
  festival: 'bg-purple-700',
  workshop: 'bg-blue-600',
  practica: 'bg-amber-500',
  concert: 'bg-green-600',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  milonga: 'M',
  festival: 'F',
  workshop: 'W',
  practica: 'P',
  concert: 'C',
};

function ChatRoomRow({ room }: { room: ChatRoom }) {
  const { t } = useTranslation();
  const bgColor = EVENT_TYPE_COLORS[room.event.eventType] || 'bg-warm-500';
  const icon = EVENT_TYPE_ICONS[room.event.eventType] || room.event.title[0]?.toUpperCase();
  const hasCountry = !!room.event.countryCode;

  return (
    <Link
      href={`/events/${room.event.id}/chat`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors border-b border-warm-100 dark:border-warm-800 last:border-b-0"
    >
      {/* Event type avatar */}
      <div
        className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        <span className="text-white text-lg font-bold">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate">{room.event.title}</h3>
          <span className="text-[11px] text-warm-400 flex-shrink-0">
            {room.lastMessage ? formatRelativeTime(room.lastMessage.createdAt) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-warm-500 dark:text-warm-400 truncate">
            {room.lastMessage ? (
              <>
                <span className="font-medium text-warm-600 dark:text-warm-400">
                  {room.lastMessage.user.nickname}:
                </span>{' '}
                {room.lastMessage.message}
              </>
            ) : (
              <span className="italic text-warm-400">{t.events.noChatMessages}</span>
            )}
          </p>

          {room.messageCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-700 text-white text-[10px] font-bold flex items-center justify-center">
              {room.messageCount > 99 ? '99+' : room.messageCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-warm-400 capitalize">{room.event.eventType}</span>
          <span className="text-warm-300 dark:text-warm-600 text-[10px]">&bull;</span>
          <span className="text-[10px] text-warm-400">{room.event.city}</span>
          {hasCountry && <CountryFlag code={room.event.countryCode} size={12} />}
        </div>
      </div>
    </Link>
  );
}

function ChatRoomsList() {
  const { t } = useTranslation();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const rooms = await eventsApi.getMyChatRooms();
      setChatRooms(rooms);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-[#1A1410] pt-16">
      {/* Header */}
      <div className="bg-white dark:bg-warm-900 border-b border-warm-100 dark:border-warm-800">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center">
              <HiOutlineChatAlt2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-warm-900 dark:text-warm-100">{t.nav.partyChat}</h1>
              <p className="text-xs text-warm-400">{t.events.chatRooms}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="bg-white dark:bg-warm-900 mt-2 rounded-xl">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-warm-100 dark:border-warm-800 last:border-b-0">
                <div className="w-12 h-12 rounded-full bg-warm-200 dark:bg-warm-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-warm-100 dark:bg-warm-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
              <HiOutlineChatAlt2 className="w-8 h-8 text-warm-300" />
            </div>
            <h2 className="text-warm-600 dark:text-warm-400 font-medium mb-1">{t.events.noChatRooms}</h2>
            <p className="text-warm-400 text-sm mb-6">{t.events.noChatRoomsSubtext}</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              {t.nav.events}
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-warm-900 mt-2 rounded-xl shadow-sm overflow-hidden">
            {chatRooms.map((room) => (
              <ChatRoomRow key={room.event.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatRoomsList />
    </AuthGuard>
  );
}
