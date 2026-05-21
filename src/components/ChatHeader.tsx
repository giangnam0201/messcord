import { Hash, AtSign } from 'lucide-react';

export function ChatHeader({
  kind,
  name
}: {
  kind: 'channel' | 'dm';
  name: string;
}) {
  const Icon = kind === 'channel' ? Hash : AtSign;
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-discord-darkest bg-discord-dark px-4 shadow-sm">
      <Icon className="h-5 w-5 text-zinc-500" />
      <h1 className="truncate text-sm font-semibold text-zinc-50">{name}</h1>
    </header>
  );
}
