'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

type GifResult = {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
};

export default function GifPicker({
  onSelect,
  onClose
}: {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const params = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/gif${params}`);
      if (res.ok) {
        const data = await res.json();
        setGifs(data.gifs || []);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs('');
  }, [fetchGifs]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchGifs]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="w-[400px] max-h-[420px] rounded-lg bg-discord-darker border border-zinc-700 shadow-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b border-zinc-700 px-3 py-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Tenor"
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : gifs.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {query ? 'No GIFs found' : 'GIF API not configured. Set NEXT_PUBLIC_TENOR_API_KEY.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="overflow-hidden rounded hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-700 px-3 py-1.5">
        <p className="text-[10px] text-zinc-500 text-center">Powered by Tenor</p>
      </div>
    </div>
  );
}
