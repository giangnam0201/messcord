// This file is kept for backwards compatibility but is no longer used.
// Real-time is now handled via Pusher (see src/lib/pusher.ts).
// Voice/video is handled via LiveKit (see src/lib/livekit.ts).

export function getIO(): null {
  return null;
}

export function setIO(): void {
  // no-op
}
