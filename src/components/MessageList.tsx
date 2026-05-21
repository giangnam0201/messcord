import { format } from 'date-fns';

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
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
              <span className="w-10 shrink-0" />
              <p className="whitespace-pre-wrap break-words text-sm text-zinc-100">
                {msg.content}
              </p>
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
              <p className="whitespace-pre-wrap break-words text-sm text-zinc-100">
                {msg.content}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
