'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Returns a lazily-created singleton Socket.io client connected to the
 * same origin as the page (so it works alongside the Next dev server).
 *
 * Cookies (including the NextAuth session token) are sent automatically on
 * same-origin connections; `withCredentials: true` is set explicitly for clarity
 * and to support cross-origin deployments.
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() can only be called in the browser');
  }
  if (!socket) {
    socket = io({
      path: '/socket.io',
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}
