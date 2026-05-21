'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type InviteInfo = {
  code: string;
  server: { id: string; name: string; iconUrl: string | null; _count: { members: number } };
  memberCount: number;
  expiresAt: string | null;
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invite/${code}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error || 'Invalid invite link');
          return;
        }
        const data = await res.json();
        setInvite(data.invite);
      } catch {
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await fetch(`/api/invite/${code}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        router.push(`/channels/${data.serverId}`);
      } else {
        setError(data?.error || 'Failed to join');
      }
    } catch {
      setError('Failed to join server');
    } finally {
      setJoining(false);
    }
  }

  function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-discord-darkest p-4">
        <Loader2 className="h-8 w-8 animate-spin text-discord-accent" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-discord-darkest p-4">
        <div className="w-full max-w-sm rounded-lg bg-discord-dark p-6 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-xl font-semibold text-zinc-50">Invalid Invite</h1>
          <p className="mb-4 text-sm text-zinc-400">{error || 'This invite link is invalid or has expired.'}</p>
          <Button onClick={() => router.push('/channels/me')} variant="secondary" className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-discord-darkest p-4">
      <div className="w-full max-w-sm rounded-lg bg-discord-dark p-6 text-center shadow-xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          You&apos;ve been invited to join
        </p>

        {/* Server icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-discord-accent text-2xl font-bold text-white">
          {invite.server.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invite.server.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(invite.server.name)
          )}
        </div>

        <h1 className="mb-1 text-xl font-bold text-zinc-50">{invite.server.name}</h1>

        <div className="mb-6 flex items-center justify-center gap-1 text-sm text-zinc-400">
          <Users className="h-4 w-4" />
          <span>{invite.memberCount} {invite.memberCount === 1 ? 'member' : 'members'}</span>
        </div>

        <Button onClick={handleJoin} disabled={joining} className="w-full" size="lg">
          {joining ? 'Joining...' : 'Accept Invite'}
        </Button>
      </div>
    </div>
  );
}
