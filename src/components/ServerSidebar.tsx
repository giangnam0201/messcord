'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Plus } from 'lucide-react';

import { CreateServerModal } from '@/components/CreateServerModal';
import { cn } from '@/lib/utils';

export type ServerSidebarItem = {
  id: string;
  name: string;
  iconUrl: string | null;
};

function deriveActive(pathname: string | null): {
  activeServerId: string | null;
  homeActive: boolean;
} {
  if (!pathname) return { activeServerId: null, homeActive: false };
  const match = pathname.match(/^\/channels\/([^/]+)/);
  if (!match) return { activeServerId: null, homeActive: false };
  const segment = match[1]!;
  if (segment === 'me') return { activeServerId: null, homeActive: true };
  return { activeServerId: segment, homeActive: false };
}

function ServerPill({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute -left-3 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all',
        active ? 'h-8' : 'h-0 group-hover:h-4'
      )}
    />
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export function ServerSidebar({
  servers
}: {
  servers: ServerSidebarItem[];
}) {
  const pathname = usePathname();
  const { activeServerId, homeActive } = deriveActive(pathname);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <aside className="flex h-full w-[72px] flex-col items-center gap-2 bg-discord-darkest py-3 shrink-0">
      <div className="group relative">
        <ServerPill active={homeActive} />
        <Link
          href="/channels/me"
          aria-label="Direct messages"
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-3xl bg-discord-darker text-zinc-200 transition-all hover:rounded-2xl hover:bg-discord-accent hover:text-white',
            homeActive && 'rounded-2xl bg-discord-accent text-white'
          )}
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>

      <div className="my-1 h-px w-8 bg-zinc-700" />

      <ul className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {servers.map((server) => {
          const active = server.id === activeServerId;
          return (
            <li key={server.id} className="group relative">
              <ServerPill active={active} />
              <Link
                href={`/channels/${server.id}`}
                title={server.name}
                aria-label={server.name}
                className={cn(
                  'flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-discord-darker text-sm font-semibold text-zinc-200 transition-all hover:rounded-2xl hover:bg-discord-accent hover:text-white',
                  active && 'rounded-2xl bg-discord-accent text-white'
                )}
              >
                {server.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={server.iconUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(server.name) || '?'
                )}
              </Link>
            </li>
          );
        })}

        <li className="group relative">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            aria-label="Create a server"
            className="flex h-12 w-12 items-center justify-center rounded-3xl bg-discord-darker text-emerald-400 transition-all hover:rounded-2xl hover:bg-emerald-600 hover:text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </li>
      </ul>

      {showCreate ? (
        <CreateServerModal onClose={() => setShowCreate(false)} />
      ) : null}
    </aside>
  );
}
