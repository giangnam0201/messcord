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
  avatarUrl
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const label = displayName || username;
  return (
    <div className="flex items-center gap-2 border-t border-discord-darkest bg-discord-darkest/60 px-2 py-2">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-xs font-semibold text-white">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(label) || '?'
        )}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-zinc-100">{label}</p>
        <p className="truncate text-xs text-zinc-400">@{username}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
