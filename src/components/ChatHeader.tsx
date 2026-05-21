'use client';

import { useState } from 'react';
import { Hash, AtSign, Search } from 'lucide-react';
import { SearchModal } from '@/components/SearchModal';

export function ChatHeader({
  kind,
  name
}: {
  kind: 'channel' | 'dm';
  name: string;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const Icon = kind === 'channel' ? Hash : AtSign;

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-discord-darkest bg-discord-dark px-4 shadow-sm">
        <Icon className="h-5 w-5 text-zinc-500" />
        <h1 className="flex-1 truncate text-sm font-semibold text-zinc-50">{name}</h1>
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="flex h-7 items-center gap-1.5 rounded bg-zinc-900/60 px-2 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </header>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}
