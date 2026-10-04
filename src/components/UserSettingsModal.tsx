'use client';

import { useState } from 'react';
import { X, User, Image, Smile, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserSettingsModal({
  user,
  onClose
}: {
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status?: string;
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName || user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [status, setStatus] = useState(user.status || 'online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || null,
          status
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update profile');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-lg bg-[#2b2d31] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700/60 pb-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <User className="h-5 w-5 text-discord-accent" /> User Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded bg-red-500/10 p-2 text-xs font-semibold text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-300">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-discord-accent"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-300">
              Avatar URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-discord-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-300">
              Online Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-discord-accent"
            >
              <option value="online">🟢 Online</option>
              <option value="idle">🌙 Idle</option>
              <option value="dnd">⛔ Do Not Disturb</option>
              <option value="invisible">⚪ Invisible</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-discord-accent px-5 py-2 text-sm font-medium text-white hover:bg-discord-accent/80 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
