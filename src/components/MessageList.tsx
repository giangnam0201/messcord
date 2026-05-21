import { format } from 'date-fns';

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  attachments?: string | null;
  stickerIds?: string | null;
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
    url.includes('media.tenor.com');
}

function isGifUrl(url: string): boolean {
  return /\.gif(\?.*)?$/i.test(url) ||
    url.includes('tenor.com') ||
    url.includes('media.tenor.com');
}

function MessageContent({ content }: { content: string }) {
  // Check if the entire message is a single URL (image/gif embed)
  const trimmed = content.trim();
  if (isImageUrl(trimmed) && !trimmed.includes(' ') && !trimmed.includes('\n')) {
    return (
      <div className="mt-1 max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trimmed}
          alt="embedded media"
          className={`rounded-lg max-h-72 w-auto object-contain ${isGifUrl(trimmed) ? '' : ''}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Regular text with basic link detection
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = trimmed.split(urlRegex);

  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-100">
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          // Reset lastIndex since we're reusing the regex
          urlRegex.lastIndex = 0;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
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
        const grouped = Boolean(sameAuthor && withinWindow);

        const label = msg.author.displayName || msg.author.username;

        if (grouped) {
          return (
            <li
              key={msg.id}
              className="group flex items-start gap-3 rounded px-2 py-0.5 hover:bg-zinc-800/40"
            >
              <span className="w-10 shrink-0 pt-0.5 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100">
                {format(createdAt, 'h:mm a')}
              </span>
              <div className="min-w-0 flex-1">
                <MessageContent content={msg.content} />
              </div>
            </li>
          );
        }

        return (
          <li
            key={msg.id}
            className="group flex items-start gap-3 rounded px-2 pb-0.5 pt-3 hover:bg-zinc-800/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-sm font-semibold text-white">
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
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-zinc-50">
                  {label}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatStamp(createdAt)}
                </span>
              </div>
              <MessageContent content={msg.content} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
