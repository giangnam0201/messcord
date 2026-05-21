'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  PhoneOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { ChatHeader } from '@/components/ChatHeader';
import { getSocket } from '@/lib/socket-client';
import { MeshClient } from '@/lib/webrtc';

type RemotePeer = {
  socketId: string;
  userId: string;
  stream: MediaStream;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

function PeerTile({
  label,
  stream,
  muted,
  deafened,
  isLocal
}: {
  label: string;
  stream: MediaStream | null;
  muted?: boolean;
  deafened?: boolean;
  isLocal?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (!stream) {
      setHasVideo(false);
      return;
    }

    function update() {
      setHasVideo(stream!.getVideoTracks().some((t) => t.readyState !== 'ended'));
    }
    update();
    stream.addEventListener('addtrack', update);
    stream.addEventListener('removetrack', update);
    const tracks = stream.getVideoTracks();
    for (const t of tracks) {
      t.addEventListener('ended', update);
    }
    return () => {
      stream.removeEventListener('addtrack', update);
      stream.removeEventListener('removetrack', update);
      for (const t of tracks) {
        t.removeEventListener('ended', update);
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-discord-darker p-4">
      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-2xl font-semibold text-white">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        ) : (
          (initials(label) || '?')
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-100">
        <span>{label}</span>
        {muted ? <MicOff className="h-4 w-4 text-red-400" /> : null}
        {deafened ? <VolumeX className="h-4 w-4 text-red-400" /> : null}
      </div>
      {!isLocal ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audioRef}
          autoPlay
          muted={Boolean(deafened)}
          className="hidden"
        />
      ) : null}
    </div>
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
  const router = useRouter();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotes, setRemotes] = useState<RemotePeer[]>([]);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meshRef = useRef<MeshClient | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Lifecycle: getUserMedia, start MeshClient, cleanup on unmount.
  useEffect(() => {
    let cancelled = false;
    let mesh: MeshClient | null = null;
    let stream: MediaStream | null = null;

    async function init() {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error('getUserMedia is not available in this environment');
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);

        const socket = getSocket();
        mesh = new MeshClient(
          socket,
          channelId,
          stream,
          ({ socketId, userId, stream: remoteStream }) => {
            setRemotes((prev) => {
              if (prev.some((p) => p.socketId === socketId)) {
                return prev.map((p) =>
                  p.socketId === socketId
                    ? { socketId, userId, stream: remoteStream }
                    : p
                );
              }
              return [...prev, { socketId, userId, stream: remoteStream }];
            });
          },
          ({ socketId }) => {
            setRemotes((prev) => prev.filter((p) => p.socketId !== socketId));
          }
        );
        meshRef.current = mesh;
        mesh.start();
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('VoiceRoom init failed', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Could not access your microphone.'
          );
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (mesh) mesh.stop();
      meshRef.current = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [channelId]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const next = !muted;
    setMuted(next);
    for (const t of localStream.getAudioTracks()) {
      t.enabled = !next;
    }
  }, [localStream, muted]);

  const toggleDeafen = useCallback(() => {
    setDeafened((d) => !d);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (screenSharing) {
      // Turn off: stop the screen stream and clear the outbound video.
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      mesh.replaceVideoTrack(null);
      setScreenSharing(false);
      return;
    }
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getDisplayMedia
      ) {
        throw new Error('Screen capture is not supported in this browser');
      }
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      const track = display.getVideoTracks()[0];
      if (!track) {
        display.getTracks().forEach((t) => t.stop());
        throw new Error('No video track in screen capture');
      }
      screenStreamRef.current = display;
      mesh.replaceVideoTrack(track);
      setScreenSharing(true);
      track.addEventListener('ended', () => {
        if (screenStreamRef.current) {
          screenStreamRef.current = null;
        }
        mesh.replaceVideoTrack(null);
        setScreenSharing(false);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Screen share failed', err);
      setError(
        err instanceof Error ? err.message : 'Could not start screen share.'
      );
    }
  }, [screenSharing]);

  const disconnect = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.stop();
      meshRef.current = null;
    }
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    router.back();
  }, [localStream, router]);

  const localLabel =
    `${currentUser.displayName || currentUser.username} (you)`.trim();

  // Build the local "screen-sharing" preview stream separately so the local
  // tile shows the screen capture even though the audio element is muted.
  const localPreviewStream = (() => {
    if (!localStream) return null;
    if (screenSharing && screenStreamRef.current) {
      const combined = new MediaStream();
      for (const t of screenStreamRef.current.getVideoTracks()) {
        combined.addTrack(t);
      }
      return combined;
    }
    return localStream;
  })();

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      <ChatHeader kind="channel" name={channelName} />
      <div className="flex flex-1 flex-col px-6 py-6">
        {error ? (
          <div className="mb-4 rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!localStream && !error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-300">
            <Volume2 className="h-7 w-7" />
            <p className="text-sm">Connecting to voice...</p>
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
            <PeerTile
              label={localLabel}
              stream={localPreviewStream}
              muted={muted}
              deafened={deafened}
              isLocal
            />
            {remotes.map((peer) => (
              <PeerTile
                key={peer.socketId}
                label={peer.userId.slice(0, 6)}
                stream={peer.stream}
                deafened={deafened}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-discord-darkest pt-4">
          <Button
            variant={muted ? 'danger' : 'secondary'}
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <MicOff className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {muted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            variant={deafened ? 'danger' : 'secondary'}
            onClick={toggleDeafen}
            aria-pressed={deafened}
            aria-label={deafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones className="mr-2 h-4 w-4" />
            {deafened ? 'Undeafen' : 'Deafen'}
          </Button>
          <Button
            variant={screenSharing ? 'danger' : 'secondary'}
            onClick={() => void toggleScreenShare()}
            aria-pressed={screenSharing}
          >
            <Monitor className="mr-2 h-4 w-4" />
            {screenSharing ? 'Stop Sharing' : 'Screen Share'}
          </Button>
          <Button variant="danger" onClick={disconnect}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>
    </section>
  );
}
