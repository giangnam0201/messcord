'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { Loader2 } from 'lucide-react';

import { ChatHeader } from '@/components/ChatHeader';

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100% - 60px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export function VoiceRoom({
  channelId,
  channelName,
  currentUser
}: {
  channelId: string;
  channelName: string;
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch(`/api/livekit?channelId=${channelId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Failed to get voice token');
        }
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to voice');
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, [channelId]);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (loading) {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col items-center justify-center bg-discord-dark">
        <Loader2 className="h-8 w-8 animate-spin text-discord-accent" />
        <p className="mt-3 text-sm text-zinc-400">Connecting to voice...</p>
      </section>
    );
  }

  if (error || !token || !livekitUrl) {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
        <ChatHeader kind="channel" name={channelName} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <div className="rounded-lg bg-red-900/30 px-4 py-3 text-center">
            <p className="text-sm text-red-200">
              {error || 'Voice chat is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL in your environment variables.'}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Get free LiveKit credentials at{' '}
            <a
              href="https://livekit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-discord-accent hover:underline"
            >
              livekit.io
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      <ChatHeader kind="channel" name={channelName} />
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          token={token}
          serverUrl={livekitUrl}
          connect={true}
          video={false}
          audio={true}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoGrid />
          <RoomAudioRenderer />
          <ControlBar
            variation="minimal"
            controls={{
              microphone: true,
              camera: true,
              screenShare: true,
              leave: true
            }}
          />
        </LiveKitRoom>
      </div>
    </section>
  );
}
