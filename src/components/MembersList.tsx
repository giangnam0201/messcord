import { db } from '@/lib/db';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    invisible: 'bg-zinc-500',
    offline: 'bg-zinc-500'
  };

  return (
    <span
      aria-hidden
      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darker ${colors[status] || colors.offline}`}
      title={status}
    />
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'text-yellow-400',
    ADMIN: 'text-red-400',
    MODERATOR: 'text-blue-400',
    MEMBER: 'text-zinc-400'
  };

  if (role === 'MEMBER') return null;

  return (
    <span className={`ml-1 text-[10px] font-medium ${colors[role] || ''}`}>
      {role === 'OWNER' ? '👑' : role === 'ADMIN' ? '⚡' : '🛡️'}
    </span>
  );
}

export async function MembersList({ serverId }: { serverId: string }) {
  const members = await db.serverMember.findMany({
    where: { serverId },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          isNitro: true
        }
      }
    }
  });

  const online = members.filter((m) => m.user.status !== 'invisible' && m.user.status !== 'offline');
  const offline = members.filter((m) => m.user.status === 'invisible' || m.user.status === 'offline');

  function renderGroup(label: string, group: typeof members) {
    if (group.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label} — {group.length}
        </h3>
        <ul className="flex flex-col gap-0.5">
          {group.map((m) => {
            const label = m.nickname || m.user.displayName || m.user.username;
            return (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-700/40 cursor-pointer"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-[10px] font-semibold text-white">
                  {m.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(label) || '?'
                  )}
                  <StatusDot status={m.user.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <p className="truncate text-sm text-zinc-300">{label}</p>
                    <RoleBadge role={m.role} />
                    {m.user.isNitro && (
                      <span className="ml-1 text-[10px]" title="Nitro subscriber">💎</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <aside className="hidden h-full w-60 shrink-0 overflow-y-auto bg-discord-darker px-2 py-3 lg:block">
      {renderGroup('Online', online)}
      {renderGroup('Offline', offline)}
    </aside>
  );
}
