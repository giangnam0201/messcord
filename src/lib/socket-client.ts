// DEPRECATED: Socket.IO is no longer used.
// Real-time is handled via Pusher (see src/lib/pusher.ts).
// This file is kept to avoid import errors during migration.

export function getSocket(): never {
  throw new Error(
    'Socket.IO is no longer used. Use Pusher for real-time messaging.'
  );
}
