'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/ui/Input';
import { UserPanel } from '@/components/UserPanel';
import { cn } from '@/lib/utils';

export type DMConversation = {
  id: string;
  other: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export function DMSidebar({
  conversations,
  user
}: {
  conversations: DMConversation[];
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const match = pathname.match(/^\/channels\/me\/([^/]+)/);
  const activeConversationId = match ? match[1]! : null;
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!query.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query.trim() })
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? 'Could not start conversation.');
        return;
      }
      const data = (await res.json()) as { conversation: { id: string } };
      setQuery('');
      router.push(`/channels/me/${data.conversation.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-discord-darker">
      <div className="flex h-12 items-center border-b border-discord-darkest px-3 shadow-sm">
        <form onSubmit={onSubmit} className="w-full">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find or start a conversation"
            className="h-8 text-xs"
            disabled={submitting}
          />
        </form>
      </div>

      {error ? (
        <p className="px-3 pt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Direct Messages
          </span>
        </div>

        {conversations.length === 0 ? (
          <p className="px-2 py-2 text-xs text-zinc-500">
            No conversations yet. Type a username above to start one.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => {
              if (!c.other) return null;
              const active = c.id === activeConversationId;
              const label = c.other.displayName || c.other.username;
              return (
                <li key={c.id}>
                  <Link
                    href={`/channels/me/${c.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700/40 hover:text-zinc-100',
                      active && 'bg-zinc-700/60 text-zinc-50'
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-[10px] font-semibold text-white">
                      {c.other.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.other.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(label) || '?'
                      )}
                    </div>
                    <span className="truncate">{label}</span>
                    <span
                      aria-hidden
                      className="ml-auto h-2 w-2 shrink-0 rounded-full bg-zinc-600"
                      title="offline"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <UserPanel
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
    </aside>
  );
}
