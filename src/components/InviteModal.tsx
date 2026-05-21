'use client';

import { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function InviteModal({
  serverId,
  serverName,
  onClose
}: {
  serverId: string;
  serverName: string;
  onClose: () => void;
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateInvite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${serverId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Failed to create invite');
        return;
      }
      const data = await res.json();
      const url = `${window.location.origin}/invite/${data.invite.code}`;
      setInviteUrl(url);
    } catch {
      setError('Failed to create invite');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Auto-generate on mount
  useState(() => {
    generateInvite();
  });

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
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-zinc-50">
          Invite friends to {serverName}
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Share this link with others to grant access to your server.
        </p>

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        {inviteUrl ? (
          <div className="flex items-center gap-2 rounded-md bg-discord-darker p-3">
            <LinkIcon className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-sm text-zinc-100 focus:outline-none select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant={copied ? 'success' : 'default'}
              onClick={copyLink}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-discord-accent border-t-transparent" />
          </div>
        ) : (
          <Button onClick={generateInvite} className="w-full">
            Generate Invite Link
          </Button>
        )}

        <p className="mt-3 text-xs text-zinc-500">
          This invite link never expires by default. You can create time-limited invites from Server Settings.
        </p>
      </div>
    </div>
  );
}
