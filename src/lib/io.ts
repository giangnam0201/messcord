import type { Server } from 'socket.io';

/**
 * Singleton holder for the running Socket.io server instance, so route handlers
 * (which run inside Next.js but share the same Node process as server.ts) can
 * broadcast events after persisting data.
 */
let io: Server | null = null;

export function setIO(instance: Server): void {
  io = instance;
}

export function getIO(): Server | null {
  return io;
}
