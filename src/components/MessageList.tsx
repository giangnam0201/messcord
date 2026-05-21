'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu';
import { MessageReactions } from '@/components/MessageReactions';

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  attachments?: string | null;
  stickerIds?: string | null;
  replyTo?: { id: string; content: string; author: { username: string } } | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  clientId?: string;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

function formatStamp(d: Date): string {
  const now = new Date();
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) {
    return `Today at ${format(d, 'h:mm a')}`;
  }
  return format(d, 'MMM d, yyyy h:mm a');
}

function isImageUrl(url: string): boolean {
  return /\.(gif|png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(url) ||
    url.includes('tenor.com') ||
    url.includes('giphy.com') ||
    url.includes('media.tenor.com') ||
    url.includes('media.giphy.com') ||
    url.includes('media0.giphy.com') ||
    url.includes('media1.giphy.com') ||
    url.includes('media2.giphy.com') ||
    url.includes('media3.giphy.com') ||
    url.includes('media4.giphy.com');
}

// ============ Markdown Renderer ============

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Code blocks ```code```
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      nodes.push(
        <pre key={key++} className="my-1 rounded bg-zinc-900 p-2 text-xs overflow-x-auto">
          <code className="text-zinc-200">{codeBlockMatch[2]}</code>
        </pre>
      );
      remaining = remaining.slice(codeBlockMatch[0].length);
      continue;
    }

    // Inline code `code`
    const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
    if (inlineCodeMatch) {
      nodes.push(
        <code key={key++} className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-200">
          {inlineCodeMatch[1]}
        </code>
      );
      remaining = remaining.slice(inlineCodeMatch[0].length);
      continue;
    }

    // Spoiler ||text||
    const spoilerMatch = remaining.match(/^\|\|([^|]+)\|\|/);
    if (spoilerMatch) {
      nodes.push(<SpoilerText key={key++} text={spoilerMatch[1]} />);
      remaining = remaining.slice(spoilerMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      nodes.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      nodes.push(<del key={key++} className="line-through opacity-60">{strikeMatch[1]}</del>);
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // URLs
    const urlMatch = remaining.match(/^(https?:\/\/[^\s<]+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      if (isImageUrl(url)) {
        nodes.push(
          <span key={key++} className="block mt-1 max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="embedded" className="rounded-lg max-h-72 w-auto object-contain" loading="lazy" />
          </span>
        );
      } else {
        nodes.push(
          <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
            {url}
          </a>
        );
      }
      remaining = remaining.slice(url.length);
      continue;
    }

    // Blockquote > text (at start of line)
    const blockquoteMatch = remaining.match(/^> (.+?)(\n|$)/);
    if (blockquoteMatch) {
      nodes.push(
        <span key={key++} className="flex items-start gap-1">
          <span className="mt-0.5 h-full w-1 shrink-0 rounded bg-zinc-600" />
          <span className="text-zinc-300">{blockquoteMatch[1]}</span>
        </span>
      );
      remaining = remaining.slice(blockquoteMatch[0].length);
      continue;
    }

    // @mentions
    const mentionMatch = remaining.match(/^@(\w+)/);
    if (mentionMatch) {
      nodes.push(
        <span key={key++} className="rounded bg-discord-accent/20 px-0.5 text-discord-accent cursor-pointer hover:bg-discord-accent/30">
          @{mentionMatch[1]}
        </span>
      );
      remaining = remaining.slice(mentionMatch[0].length);
      continue;
    }

    // #channel references
    const channelMatch = remaining.match(/^#(\w[\w-]*)/);
    if (channelMatch) {
      nodes.push(
        <span key={key++} className="rounded bg-discord-accent/20 px-0.5 text-discord-accent cursor-pointer hover:bg-discord-accent/30">
          #{channelMatch[1]}
        </span>
      );
      remaining = remaining.slice(channelMatch[0].length);
      continue;
    }

    // Newline
    if (remaining[0] === '\n') {
      nodes.push(<br key={key++} />);
      remaining = remaining.slice(1);
      continue;
    }

    // Regular character - collect until next special
    const nextSpecial = remaining.slice(1).search(/[`*~|@#\n]|https?:\/\/|^> /);
    if (nextSpecial === -1) {
      nodes.push(<span key={key++}>{remaining}</span>);
      remaining = '';
    } else {
      nodes.push(<span key={key++}>{remaining.slice(0, nextSpecial + 1)}</span>);
      remaining = remaining.slice(nextSpecial + 1);
    }
  }

  return nodes;
}

// ============ Spoiler Component ============

function SpoilerText({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(true)}
      className={`rounded px-0.5 cursor-pointer transition-all ${
        revealed ? 'bg-zinc-700/40 text-zinc-200' : 'bg-zinc-700 text-transparent hover:bg-zinc-600'
      }`}
    >
      {text}
    </span>
  );
}

// ============ Message Content ============

function MessageContent({ content }: { content: string }) {
  const trimmed = content.trim();

  // Pure image/gif URL = just show the image
  if (isImageUrl(trimmed) && !trimmed.includes(' ') && !trimmed.includes('\n')) {
    return (
      <div className="mt-1 max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trimmed}
          alt="embedded media"
          className="rounded-lg max-h-72 w-auto object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-100">
      {renderMarkdown(trimmed)}
    </p>
  );
}

// ============ Reply Preview ============

function ReplyPreview({ reply }: { reply: { content: string; author: { username: string } } }) {
  return (
    <div className="mb-0.5 flex items-center gap-1 text-xs text-zinc-400">
      <span className="h-3 w-5 border-l-2 border-t-2 border-zinc-600 rounded-tl" />
      <span className="font-medium text-zinc-300">@{reply.author.username}</span>
      <span className="truncate max-w-[300px] opacity-70">{reply.content}</span>
    </div>
  );
}

// ============ Message List ============

export function MessageList({
  messages,
  currentUserId,
  pusherChannelName
}: {
  messages: ChatMessage[];
  currentUserId?: string;
  pusherChannelName?: string;
}) {
  const { showMessageMenu } = useMessageContextMenu({
    currentUserId: currentUserId || '',
    onReply: (msg) => {
      // TODO: wire up reply in ChatPanelClient
    },
    onDelete: async (msgId) => {
      // TODO: wire up delete API
    },
    onPin: async (msgId) => {
      // TODO: wire up pin API
    }
  });

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-zinc-500">
          This is the beginning of the conversation.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-4">
      {messages.map((msg, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null;
        const createdAt = new Date(msg.createdAt);
        const sameAuthor = prev && prev.author.id === msg.author.id;
        const withinWindow =
          prev &&
          createdAt.getTime() - new Date(prev.createdAt).getTime() <
            FIVE_MINUTES_MS;
        const grouped = Boolean(sameAuthor && withinWindow) && !msg.replyTo;

        const label = msg.author.displayName || msg.author.username;

        if (grouped) {
          return (
            <li
              key={msg.id}
              className="group flex items-start gap-3 rounded px-2 py-0.5 hover:bg-zinc-800/40"
              onContextMenu={(e) => showMessageMenu(e, msg)}
            >
              <span className="w-10 shrink-0 pt-0.5 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100">
                {format(createdAt, 'h:mm a')}
              </span>
              <div className="min-w-0 flex-1">
                <MessageContent content={msg.content} />
                {pusherChannelName && currentUserId && (
                  <MessageReactions
                    messageId={msg.id}
                    channelName={pusherChannelName}
                    currentUserId={currentUserId}
                  />
                )}
              </div>
            </li>
          );
        }

        return (
          <li
            key={msg.id}
            className="group flex items-start gap-3 rounded px-2 pb-0.5 pt-3 hover:bg-zinc-800/40"
            onContextMenu={(e) => showMessageMenu(e, msg)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-sm font-semibold text-white cursor-pointer">
              {msg.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.author.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(label) || '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              {msg.replyTo && <ReplyPreview reply={msg.replyTo} />}
              <div className="flex items-baseline gap-2">
                <span className="cursor-pointer text-sm font-semibold text-zinc-50 hover:underline">
                  {label}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatStamp(createdAt)}
                </span>
              </div>
              <MessageContent content={msg.content} />
              {pusherChannelName && currentUserId && (
                <MessageReactions
                  messageId={msg.id}
                  channelName={pusherChannelName}
                  currentUserId={currentUserId}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
