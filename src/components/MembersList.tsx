import { db } from '@/lib/db';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
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
          avatarUrl: true
        }
      }
    }
  });

  // For FEAT-002, presence is not yet wired. Treat all members as offline.
  const owners = members.filter((m) => m.role === 'OWNER');
  const others = members.filter((m) => m.role !== 'OWNER');

  function renderGroup(label: string, group: typeof members) {
    if (group.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label} - {group.length}
        </h3>
        <ul className="flex flex-col gap-0.5">
          {group.map((m) => {
            const label = m.user.displayName || m.user.username;
            return (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-700/40"
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
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-discord-dark bg-zinc-500"
                    title="offline"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-300">{label}</p>
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
      {renderGroup('Owner', owners)}
      {renderGroup('Members', others)}
    </aside>
  );
}
