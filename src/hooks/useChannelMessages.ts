'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getSocket } from '@/lib/socket-client';
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

type IncomingMessage = ChatMessage & {
  channelId?: string | null;
  conversationId?: string | null;
  clientId?: string;
};

/**
 * Subscribes to real-time messages for the given target (channel or conversation),
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

  const joinEvent = targetType === 'channel' ? 'channel:join' : 'conversation:join';
  const leaveEvent =
    targetType === 'channel' ? 'channel:leave' : 'conversation:leave';
  const joinPayload = useMemo(
    () =>
      targetType === 'channel'
        ? { channelId: targetId }
        : { conversationId: targetId },
    [targetType, targetId]
  );

  // Reset when the target changes (e.g. user navigates between channels).
  useEffect(() => {
    setMessages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit(joinEvent, joinPayload);

    const handler = (incoming: IncomingMessage) => {
      const t = targetRef.current;
      const matches =
        t.targetType === 'channel'
          ? incoming.channelId === t.targetId
          : incoming.conversationId === t.targetId;
      if (!matches) return;

      setMessages((prev) => {
        // De-dupe by id (server may broadcast to the sender too).
        if (prev.some((m) => m.id === incoming.id)) return prev;

        // Replace any optimistic placeholder with the same clientId.
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
    };
    socket.on('message:new', handler);

    return () => {
      socket.off('message:new', handler);
      socket.emit(leaveEvent, joinPayload);
    };
  }, [joinEvent, leaveEvent, joinPayload]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = getSocket();
      const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const optimistic: ChatMessage & { clientId: string } = {
        id: `tmp_${clientId}`,
        clientId,
        content: trimmed,
        createdAt: new Date(),
        author: currentUser
      };
      setMessages((prev) => [...prev, optimistic]);

      socket.emit('message:send', {
        targetType,
        targetId,
        content: trimmed,
        clientId
      });
    },
    [targetType, targetId, currentUser]
  );

  return { messages, sendMessage };
}
