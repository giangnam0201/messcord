'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getPusherClient } from '@/lib/pusher';
import type { ChatMessage } from '@/components/MessageList';

export type MessageTargetKind = 'channel' | 'conversation';

export type UseChannelMessagesArgs = {
  targetType: MessageTargetKind;
  targetId: string;
  initial: ChatMessage[];
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

/**
 * Subscribes to real-time messages via Pusher for the given target,
 * tracks the message list, and exposes an optimistic `sendMessage`.
 */
export function useChannelMessages({
  targetType,
  targetId,
  initial,
  currentUser
}: UseChannelMessagesArgs): {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
} {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const targetRef = useRef({ targetType, targetId });
  targetRef.current = { targetType, targetId };

  // Reset when the target changes
  useEffect(() => {
    setMessages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  // Subscribe to Pusher channel for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = targetType === 'channel'
      ? `private-channel-${targetId}`
      : `private-conversation-${targetId}`;

    const channel = pusher.subscribe(channelName);

    channel.bind('message:new', (incoming: ChatMessage & { clientId?: string }) => {
      setMessages((prev) => {
        // De-dupe by id
        if (prev.some((m) => m.id === incoming.id)) return prev;

        // Replace optimistic placeholder
        if (incoming.clientId) {
          const idx = prev.findIndex(
            (m) => (m as ChatMessage & { clientId?: string }).clientId === incoming.clientId
          );
          if (idx !== -1) {
            const next = prev.slice();
            next[idx] = incoming;
            return next;
          }
        }
        return [...prev, incoming];
      });
    });

    channel.bind('message:update', (updated: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    });

    channel.bind('message:delete', (data: { id: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [targetType, targetId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Optimistic message
      const optimistic: ChatMessage & { clientId: string } = {
        id: `tmp_${clientId}`,
        clientId,
        content: trimmed,
        createdAt: new Date().toISOString(),
        author: currentUser
      };
      setMessages((prev) => [...prev, optimistic]);

      // Send via API (which triggers Pusher broadcast)
      const endpoint = targetType === 'channel'
        ? `/api/channels/${targetId}/messages`
        : `/api/conversations/${targetId}/messages`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed, clientId })
        });

        if (res.ok) {
          const data = await res.json();
          // Replace optimistic with real message
          setMessages((prev) =>
            prev.map((m) =>
              (m as ChatMessage & { clientId?: string }).clientId === clientId
                ? { ...data.message, clientId }
                : m
            )
          );
        }
      } catch {
        // Remove optimistic message on failure
        setMessages((prev) =>
          prev.filter((m) => (m as ChatMessage & { clientId?: string }).clientId !== clientId)
        );
      }
    },
    [targetType, targetId, currentUser]
  );

  return { messages, sendMessage };
}
