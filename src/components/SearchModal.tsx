'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Hash, AtSign, MessageSquare, X, Loader2 } from 'lucide-react';

type SearchResult = {
  type: 'user' | 'channel' | 'server';
  id: string;
  name: string;
  subtitle?: string;
  href: string;
};

export function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [convRes, srvRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/servers')
      ]);
      const allResults: SearchResult[] = [];

      if (convRes.ok) {
        const data = await convRes.json();
        for (const c of data.conversations || []) {
          for (const p of c.participants || []) {
            const u = p.user;
            if (!u) continue;
            const name = u.displayName || u.username;
            if (name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase())) {
              allResults.push({ type: 'user', id: c.id, name, subtitle: `@${u.username}`, href: `/channels/me/${c.id}` });
            }
          }
        }
      }

      if (srvRes.ok) {
        const sData = await srvRes.json();
        for (const s of sData.servers || []) {
          if (s.name.toLowerCase().includes(q.toLowerCase())) {
            allResults.push({ type: 'server', id: s.id, name: s.name, subtitle: `${s.channels?.length || 0} channels`, href: `/channels/${s.id}` });
          }
          for (const ch of s.channels || []) {
            if (ch.name.toLowerCase().includes(q.toLowerCase())) {
              allResults.push({ type: 'channel', id: ch.id, name: `#${ch.name}`, subtitle: s.name, href: `/channels/${s.id}/${ch.id}` });
            }
          }
        }
      }

      setResults(allResults.slice(0, 10));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { router.push(results[selectedIdx].href); onClose(); }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'user': return <AtSign className="h-4 w-4" />;
      case 'channel': return <Hash className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-[15vh] px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-discord-dark shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-zinc-700 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-400" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }} onKeyDown={handleKeyDown} placeholder="Search users, servers, channels..." className="flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none" />
          {query && <button onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-200"><X className="h-4 w-4" /></button>}
          <kbd className="hidden rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center">
              {query ? <p className="text-sm text-zinc-500">No results for &ldquo;{query}&rdquo;</p> : <p className="text-sm text-zinc-400">Type to search users, servers, or channels</p>}
            </div>
          ) : (
            <ul>
              {results.map((r, idx) => (
                <li key={`${r.type}-${r.id}-${idx}`}>
                  <button onClick={() => { router.push(r.href); onClose(); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${idx === selectedIdx ? 'bg-discord-accent/20 text-zinc-50' : 'text-zinc-300 hover:bg-zinc-700/50'}`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-zinc-300">{getIcon(r.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      {r.subtitle && <p className="truncate text-xs text-zinc-500">{r.subtitle}</p>}
                    </div>
                    <span className="text-[10px] uppercase text-zinc-600">{r.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function useSearchShortcut() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((v) => !v); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  return { open, setOpen };
}
