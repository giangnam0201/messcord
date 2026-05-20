'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getSocket } from '@/lib/socket-client';

export type MessageTarget =
  | { type: 'channel'; id: string }
  | { type: 'conversation'; id: string };

export function MessageInput({
  target,
  placeholder
}: {
  target: MessageTarget;
  placeholder: string;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url =
    target.type === 'channel'
      ? `/api/channels/${target.id}/messages`
      : `/api/conversations/${target.id}/messages`;

  async function send() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? 'Could not send message.');
        return;
      }
      const data = (await res.json()) as { message: { id: string } };
      setContent('');

      // Best-effort real-time fan-out (FEAT-003 server handler will broadcast).
      try {
        if (typeof window !== 'undefined') {
          const socket = getSocket();
          socket.emit('message:send', {
            target,
            messageId: data.message.id
          });
        }
      } catch {
        // ignore socket errors in FEAT-002
      }

      // Refresh the server component so the new message appears.
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="rounded-lg bg-zinc-700/60 px-4 py-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={submitting}
          className="block w-full resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
