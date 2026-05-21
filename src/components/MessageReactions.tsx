'use client';

import { useState, useEffect } from 'react';
import { Smile, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { getPusherClient } from '@/lib/pusher';

const EmojiPicker = dynamic(() => import('@/components/EmojiPicker'), {
  ssr: false,
  loading: () => null
});

export type ReactionGroup = {
  emoji: string;
  count: number;
  users: { id: string; username: string }[];
  userReacted: boolean;
};

export function MessageReactions({
  messageId,
  channelName,
  currentUserId,
  initialReactions = []
}: {
  messageId: string;
  channelName: string;
  currentUserId: string;
  initialReactions?: ReactionGroup[];
}) {
  const [reactions, setReactions] = useState<ReactionGroup[]>(initialReactions);
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // Listen for real-time reaction updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    channel.bind('reaction:add', (data: { messageId: string; userId: string; emoji: string; user: { id: string; username: string } }) => {
      if (data.messageId !== messageId) return;
      setReactions(prev => {
        const existing = prev.find(r => r.emoji === data.emoji);
        if (existing) {
          return prev.map(r =>
            r.emoji === data.emoji
              ? {
                  ...r,
                  count: r.count + 1,
                  users: [...r.users, data.user],
                  userReacted: data.userId === currentUserId ? true : r.userReacted
                }
              : r
          );
        }
        return [...prev, {
          emoji: data.emoji,
          count: 1,
          users: [data.user],
          userReacted: data.userId === currentUserId
        }];
      });
    });

    channel.bind('reaction:remove', (data: { messageId: string; userId: string; emoji: string }) => {
      if (data.messageId !== messageId) return;
      setReactions(prev => {
        return prev
          .map(r => {
            if (r.emoji !== data.emoji) return r;
            return {
              ...r,
              count: r.count - 1,
              users: r.users.filter(u => u.id !== data.userId),
              userReacted: data.userId === currentUserId ? false : r.userReacted
            };
          })
          .filter(r => r.count > 0);
      });
    });

    return () => {
      channel.unbind('reaction:add');
      channel.unbind('reaction:remove');
    };
  }, [channelName, messageId, currentUserId]);

  async function toggleReaction(emoji: string) {
    // Optimistic update
    setReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing?.userReacted) {
        // Remove
        const updated = prev.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.count - 1, userReacted: false, users: r.users.filter(u => u.id !== currentUserId) }
            : r
        ).filter(r => r.count > 0);
        return updated;
      }
      if (existing) {
        return prev.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, userReacted: true, users: [...r.users, { id: currentUserId, username: '' }] }
            : r
        );
      }
      return [...prev, { emoji, count: 1, users: [{ id: currentUserId, username: '' }], userReacted: true }];
    });

    // API call
    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, emoji })
    }).catch(() => {});
  }

  function handleEmojiSelect(emoji: string) {
    setShowPicker(false);
    toggleReaction(emoji);
  }

  if (reactions.length === 0 && !showPicker) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => toggleReaction(reaction.emoji)}
          onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
          onMouseLeave={() => setHoveredEmoji(null)}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
            reaction.userReacted
              ? 'border-discord-accent/60 bg-discord-accent/20 text-discord-accent'
              : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500'
          )}
          title={reaction.users.map(u => u.username).filter(Boolean).join(', ') || 'React'}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          title="Add Reaction"
        >
          <Plus className="h-3 w-3" />
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-50">
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
