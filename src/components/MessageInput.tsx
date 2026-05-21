'use client';

import { useRef, useState } from 'react';

export type MessageTarget =
  | { type: 'channel'; id: string }
  | { type: 'conversation'; id: string };

export function MessageInput({
  placeholder,
  onSend
}: {
  placeholder: string;
  onSend: (content: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function send() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      onSend(trimmed);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
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
    </div>
  );
}
