'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, AtSign, Search, ArrowLeft } from 'lucide-react';
import { SearchModal } from '@/components/SearchModal';

export function ChatHeader({
  kind,
  name
}: {
  kind: 'channel' | 'dm';
  name: string;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const Icon = kind === 'channel' ? Hash : AtSign;

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-discord-darkest bg-discord-dark px-4 shadow-sm">
        {/* Back button on mobile for DMs */}
        {kind === 'dm' && (
          <button
            type="button"
            onClick={() => router.push('/channels/me')}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:text-zinc-100 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
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
