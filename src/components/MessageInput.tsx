'use client';

import { useRef, useState, useCallback } from 'react';
import { Smile, Paperclip, Gift, Plus, Send } from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('@/components/EmojiPicker'), {
  ssr: false,
  loading: () => null
});

const GifPicker = dynamic(() => import('@/components/GifPicker'), {
  ssr: false,
  loading: () => null
});

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const send = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      onSend(trimmed);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, onSend]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleEmojiSelect(emoji: string) {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  function handleGifSelect(gifUrl: string) {
    onSend(gifUrl);
    setShowGif(false);
  }

  return (
    <div className="relative px-4 pb-6 pt-2">
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 z-50">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}
      {showGif && (
        <div className="absolute bottom-full left-4 mb-2 z-50">
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-zinc-700/60 px-4 py-2">
        <button
          type="button"
          onClick={() => { setShowGif(false); setShowEmoji(false); }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-zinc-100 transition-colors"
          aria-label="Attach file"
        >
          <Plus className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={submitting}
          className="block flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="GIF"
            title="Send a GIF"
          >
            <Gift className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Emoji"
            title="Pick an emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          {content.trim() && (
            <button
              type="button"
              onClick={send}
              disabled={submitting}
              className="flex h-7 w-7 items-center justify-center rounded bg-discord-accent text-white hover:bg-discord-accent/80 transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
