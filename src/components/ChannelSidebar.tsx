'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Hash, Plus, Volume2 } from 'lucide-react';

import { CreateChannelModal } from '@/components/CreateChannelModal';
import { UserPanel } from '@/components/UserPanel';
import { cn } from '@/lib/utils';

export type ChannelSidebarChannel = {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
};

export function ChannelSidebar({
  serverId,
  serverName,
  channels,
  isOwner,
  user
}: {
  serverId: string;
  serverName: string;
  channels: ChannelSidebarChannel[];
  isOwner: boolean;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}) {
  const pathname = usePathname() ?? '';
  const match = pathname.match(/^\/channels\/[^/]+\/([^/]+)/);
  const activeChannelId = match ? match[1]! : null;
  const [createType, setCreateType] = useState<'TEXT' | 'VOICE' | null>(null);

  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  function renderHeader(
    label: string,
    type: 'TEXT' | 'VOICE'
  ) {
    return (
      <div className="flex items-center justify-between px-1 pb-1 pt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setCreateType(type)}
            aria-label={`Create ${label.toLowerCase()} channel`}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  function renderChannel(channel: ChannelSidebarChannel) {
    const Icon = channel.type === 'VOICE' ? Volume2 : Hash;
    const active = channel.id === activeChannelId;
    return (
      <li key={channel.id}>
        <Link
          href={`/channels/${serverId}/${channel.id}`}
          className={cn(
            'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700/40 hover:text-zinc-100',
            active && 'bg-zinc-700/60 text-zinc-50'
          )}
        >
          <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">{channel.name}</span>
        </Link>
      </li>
    );
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-discord-darker">
      <div className="flex h-12 items-center border-b border-discord-darkest px-4 shadow-sm">
        <h2 className="truncate text-sm font-semibold text-zinc-50">
          {serverName}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {renderHeader('Text Channels', 'TEXT')}
        <ul className="flex flex-col gap-0.5">
          {textChannels.length === 0 ? (
            <li className="px-2 py-1 text-xs text-zinc-500">
              No text channels
            </li>
          ) : (
            textChannels.map(renderChannel)
          )}
        </ul>

        {renderHeader('Voice Channels', 'VOICE')}
        <ul className="flex flex-col gap-0.5">
          {voiceChannels.length === 0 ? (
            <li className="px-2 py-1 text-xs text-zinc-500">
              No voice channels
            </li>
          ) : (
            voiceChannels.map(renderChannel)
          )}
        </ul>
      </div>

      <UserPanel
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />

      {createType ? (
        <CreateChannelModal
          serverId={serverId}
          defaultType={createType}
          onClose={() => setCreateType(null)}
        />
      ) : null}
    </aside>
  );
}
