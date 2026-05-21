'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher';

type TypingUser = {
  userId: string;
  username: string;
  expiresAt: number;
};

export function TypingIndicator({
  channelName,
  currentUserId
}: {
  channelName: string; // e.g. "private-channel-abc123"
  currentUserId: string;
}) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const cleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup expired typing indicators every second
  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      setTypingUsers((prev) => prev.filter((u) => u.expiresAt > Date.now()));
    }, 1000);
    return () => {
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  // Subscribe to typing events
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    channel.bind('typing:start', (data: { userId: string; username: string }) => {
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const existing = prev.find((u) => u.userId === data.userId);
        if (existing) {
          return prev.map((u) =>
            u.userId === data.userId ? { ...u, expiresAt: Date.now() + 5000 } : u
          );
        }
        return [...prev, { userId: data.userId, username: data.username, expiresAt: Date.now() + 5000 }];
      });
    });

    channel.bind('typing:stop', (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    return () => {
      channel.unbind('typing:start');
      channel.unbind('typing:stop');
      pusher.unsubscribe(channelName);
    };
  }, [channelName, currentUserId]);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.username);
  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else if (names.length === 3) {
    text = `${names[0]}, ${names[1]}, and ${names[2]} are typing`;
  } else {
    text = 'Several people are typing';
  }

  return (
    <div className="flex items-center gap-1.5 px-4 pb-1 pt-0">
      <TypingDots />
      <span className="text-xs text-zinc-400">
        <strong className="font-semibold text-zinc-300">{text}</strong>...
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

// ============ Hook to emit typing events ============

export function useTypingEmitter({
  channelName,
  currentUserId,
  currentUsername
}: {
  channelName: string;
  currentUserId: string;
  currentUsername: string;
}) {
  const lastTypingRef = useRef<number>(0);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emitTyping = useCallback(() => {
    const now = Date.now();
    // Only emit every 3 seconds to avoid spam
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;

    // Fire typing:start via API
    fetch('/api/pusher/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelName,
        event: 'typing:start',
        data: { userId: currentUserId, username: currentUsername }
      })
    }).catch(() => {});

    // Auto-stop after 5 seconds of no typing
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = setTimeout(() => {
      fetch('/api/pusher/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          event: 'typing:stop',
          data: { userId: currentUserId }
        })
      }).catch(() => {});
    }, 5000);
  }, [channelName, currentUserId, currentUsername]);

  const stopTyping = useCallback(() => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    lastTypingRef.current = 0;
    fetch('/api/pusher/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelName,
        event: 'typing:stop',
        data: { userId: currentUserId }
      })
    }).catch(() => {});
  }, [channelName, currentUserId]);

  return { emitTyping, stopTyping };
}
