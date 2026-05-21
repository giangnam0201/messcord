'use client';

import { useState } from 'react';
import { X, Camera, Crown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  isNitro: boolean;
  status: string;
  customStatus: string | null;
  createdAt: string;
};

export function UserProfileModal({
  user,
  onClose,
  editable = false
}: {
  user: UserProfile;
  onClose: () => void;
  editable?: boolean;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          avatarUrl: avatarUrl || null,
          bio: bio || '',
          customStatus: customStatus || null
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Failed to update profile');
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-discord-dark shadow-xl overflow-hidden">
        {/* Banner */}
        <div
          className="h-24 w-full"
          style={{
            backgroundColor: user.bannerUrl ? undefined : '#5865f2',
            backgroundImage: user.bannerUrl ? `url(${user.bannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="relative -mt-12 ml-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-discord-dark bg-discord-accent text-xl font-bold text-white">
            {(editable ? avatarUrl : user.avatarUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(editable ? avatarUrl : user.avatarUrl) || ''}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(user.displayName || user.username)
            )}
          </div>
          {user.isNitro && (
            <span className="absolute -right-1 bottom-0 rounded-full bg-discord-dark p-0.5">
              <Crown className="h-4 w-4 text-yellow-400" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-3">
          {editable ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={64}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Avatar URL
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Custom Status
                </label>
                <Input
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={128}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  About Me
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-zinc-700 bg-discord-darker px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-discord-accent focus:outline-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-50">
                  {user.displayName || user.username}
                </h2>
                {user.isNitro && (
                  <span className="rounded bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    NITRO
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400">@{user.username}</p>
              {user.customStatus && (
                <p className="mt-1 text-sm text-zinc-300">{user.customStatus}</p>
              )}
              {user.bio && (
                <div className="mt-3 border-t border-zinc-700 pt-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase text-zinc-400">About Me</h3>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}
              <div className="mt-3 border-t border-zinc-700 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase text-zinc-400">Member Since</h3>
                <p className="text-sm text-zinc-300">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
