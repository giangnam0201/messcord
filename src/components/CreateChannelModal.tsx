'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ChannelType = 'TEXT' | 'VOICE';

export function CreateChannelModal({
  serverId,
  defaultType = 'TEXT',
  onClose
}: {
  serverId: string;
  defaultType?: ChannelType;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>(defaultType);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type })
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? 'Could not create channel.');
        return;
      }
      const data = (await res.json()) as { channel: { id: string } };
      onClose();
      router.push(`/channels/${serverId}/${data.channel.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-lg bg-discord-dark p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-center text-xl font-semibold text-zinc-50">
          Create channel
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Channel Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('TEXT')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  type === 'TEXT'
                    ? 'border-discord-accent bg-discord-accent/10 text-zinc-100'
                    : 'border-zinc-700 bg-discord-darker text-zinc-300'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setType('VOICE')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  type === 'VOICE'
                    ? 'border-discord-accent bg-discord-accent/10 text-zinc-100'
                    : 'border-zinc-700 bg-discord-darker text-zinc-300'
                }`}
              >
                Voice
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Channel Name
            </label>
            <Input
              required
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'TEXT' ? 'new-channel' : 'Lounge'}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
