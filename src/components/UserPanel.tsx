'use client';

import { useState } from 'react';
import { Settings, Mic, Headphones } from 'lucide-react';

import { SignOutButton } from '@/components/SignOutButton';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export function UserPanel({
  username,
  displayName,
  avatarUrl,
  status = 'online'
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status?: string;
}) {
  const label = displayName || username;
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  const statusColors: Record<string, string> = {
    online: 'bg-emerald-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    invisible: 'bg-zinc-500'
  };

  return (
    <div className="flex items-center gap-2 border-t border-discord-darkest bg-discord-darkest/60 px-2 py-2">
      <div className="relative">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-xs font-semibold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(label) || '?'
          )}
        </div>
        <span
          aria-hidden
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darkest ${statusColors[status] || statusColors.online}`}
        />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-zinc-100">{label}</p>
        <p className="truncate text-xs text-zinc-400">@{username}</p>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className={`flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-700 ${muted ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-100'}`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <Mic className="h-4 w-4" />
          {muted && <span className="absolute h-5 w-0.5 rotate-45 bg-red-400 rounded" />}
        </button>
        <button
          type="button"
          onClick={() => setDeafened(!deafened)}
          className={`flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-700 ${deafened ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-100'}`}
          title={deafened ? 'Undeafen' : 'Deafen'}
        >
          <Headphones className="h-4 w-4" />
        </button>
        <SignOutButton />
      </div>
    </div>
  );
}
