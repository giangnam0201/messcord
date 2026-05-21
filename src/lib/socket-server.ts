import type { IncomingHttpHeaders } from 'node:http';
import type { Server, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';

import { db } from './db';

type SocketData = {
  userId?: string;
  username?: string;
  voiceChannelId?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseEvents = Record<string, (...args: any[]) => void>;
type AppSocket = Socket<LooseEvents, LooseEvents, LooseEvents, SocketData>;

// userId -> set of socket ids
const presence = new Map<string, Set<string>>();

async function authenticateSocket(
  socket: AppSocket
): Promise<{ userId: string; username: string } | null> {
  const cookie = socket.handshake.headers.cookie;
  if (!cookie) {
    // eslint-disable-next-line no-console
    console.warn('[socket auth] no cookie header');
    return null;
  }
  const fakeReq = {
    headers: { cookie } as IncomingHttpHeaders
  };
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      // eslint-disable-next-line no-console
      console.warn('[socket auth] no NEXTAUTH_SECRET');
      return null;
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[socket auth] cookie len=',
      cookie.length,
      'has session-token=',
      cookie.includes('next-auth.session-token')
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = await getToken({ req: fakeReq as any, secret });
    if (!token) {
      // eslint-disable-next-line no-console
      console.warn('[socket auth] getToken returned null');
      return null;
    }
    const userId =
      (token as { id?: string }).id ?? (token.sub as string | undefined);
    if (!userId) {
      // eslint-disable-next-line no-console
      console.warn('[socket auth] no userId in token, keys=', Object.keys(token));
      return null;
    }
    const username =
      (token as { username?: string }).username ?? (token.name as string) ?? '';
    return { userId, username };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[socket auth] getToken threw', err);
    return null;
  }
}

function channelRoom(id: string): string {
  return `channel:${id}`;
}
function conversationRoom(id: string): string {
  return `conversation:${id}`;
}
function voiceRoom(id: string): string {
  return `voice:${id}`;
}
function serverRoom(id: string): string {
  return `server:${id}`;
}
function userRoom(id: string): string {
  return `user:${id}`;
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as unknown as AppSocket;

    const auth = await authenticateSocket(socket);
    if (!auth) {
      socket.disconnect(true);
      return;
    }

    socket.data.userId = auth.userId;
    socket.data.username = auth.username;
    socket.data.voiceChannelId = null;
    const userId = auth.userId;

    // Join personal room
    socket.join(userRoom(userId));

    // Discover server memberships and join those rooms
    let memberships: { serverId: string }[] = [];
    try {
      memberships = await db.serverMember.findMany({
        where: { userId },
        select: { serverId: true }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load memberships for socket', err);
    }
    for (const m of memberships) {
      socket.join(serverRoom(m.serverId));
    }

    // Presence tracking
    let userSockets = presence.get(userId);
    const wasOffline = !userSockets || userSockets.size === 0;
    if (!userSockets) {
      userSockets = new Set();
      presence.set(userId, userSockets);
    }
    userSockets.add(socket.id);
    if (wasOffline) {
      for (const m of memberships) {
        io.to(serverRoom(m.serverId)).emit('presence:online', { userId });
      }
    }

    // ---------- text channel rooms ----------
    socket.on('channel:join', async (payload: unknown) => {
      const channelId =
        typeof payload === 'object' && payload !== null
          ? (payload as { channelId?: unknown }).channelId
          : undefined;
      if (typeof channelId !== 'string') return;
      try {
        const channel = await db.channel.findUnique({
          where: { id: channelId },
          select: { id: true, serverId: true }
        });
        if (!channel) return;
        const member = await db.serverMember.findUnique({
          where: {
            serverId_userId: { serverId: channel.serverId, userId }
          },
          select: { id: true }
        });
        if (!member) return;
        socket.join(channelRoom(channelId));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('channel:join error', err);
      }
    });

    socket.on('channel:leave', (payload: unknown) => {
      const channelId =
        typeof payload === 'object' && payload !== null
          ? (payload as { channelId?: unknown }).channelId
          : undefined;
      if (typeof channelId === 'string') socket.leave(channelRoom(channelId));
    });

    socket.on('conversation:join', async (payload: unknown) => {
      const conversationId =
        typeof payload === 'object' && payload !== null
          ? (payload as { conversationId?: unknown }).conversationId
          : undefined;
      if (typeof conversationId !== 'string') return;
      try {
        const member = await db.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
          select: { id: true }
        });
        if (!member) return;
        socket.join(conversationRoom(conversationId));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('conversation:join error', err);
      }
    });

    socket.on('conversation:leave', (payload: unknown) => {
      const conversationId =
        typeof payload === 'object' && payload !== null
          ? (payload as { conversationId?: unknown }).conversationId
          : undefined;
      if (typeof conversationId === 'string') {
        socket.leave(conversationRoom(conversationId));
      }
    });

    // ---------- message send ----------
    socket.on('message:send', async (payload: unknown) => {
      try {
        if (typeof payload !== 'object' || payload === null) return;
        const {
          targetType,
          targetId,
          content,
          clientId
        } = payload as {
          targetType?: unknown;
          targetId?: unknown;
          content?: unknown;
          clientId?: unknown;
        };
        if (typeof targetId !== 'string') return;
        if (typeof content !== 'string') return;
        const trimmed = content.trim();
        if (!trimmed || trimmed.length > 4000) return;

        let room: string | null = null;
        if (targetType === 'channel') {
          const channel = await db.channel.findUnique({
            where: { id: targetId },
            select: { id: true, serverId: true, type: true }
          });
          if (!channel || channel.type !== 'TEXT') return;
          const member = await db.serverMember.findUnique({
            where: {
              serverId_userId: { serverId: channel.serverId, userId }
            },
            select: { id: true }
          });
          if (!member) return;
          const message = await db.message.create({
            data: {
              channelId: channel.id,
              authorId: userId,
              content: trimmed
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true
                }
              }
            }
          });
          room = channelRoom(channel.id);
          io.to(room).emit('message:new', {
            ...message,
            clientId: typeof clientId === 'string' ? clientId : undefined
          });
        } else if (targetType === 'conversation') {
          const member = await db.conversationMember.findUnique({
            where: {
              conversationId_userId: { conversationId: targetId, userId }
            },
            select: { id: true }
          });
          if (!member) return;
          const message = await db.message.create({
            data: {
              conversationId: targetId,
              authorId: userId,
              content: trimmed
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true
                }
              }
            }
          });
          room = conversationRoom(targetId);
          io.to(room).emit('message:new', {
            ...message,
            clientId: typeof clientId === 'string' ? clientId : undefined
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('message:send error', err);
      }
    });

    // ---------- typing indicators ----------
    function typingRoomFor(payload: unknown): string | null {
      if (typeof payload !== 'object' || payload === null) return null;
      const { targetType, targetId } = payload as {
        targetType?: unknown;
        targetId?: unknown;
      };
      if (typeof targetId !== 'string') return null;
      if (targetType === 'channel') return channelRoom(targetId);
      if (targetType === 'conversation') return conversationRoom(targetId);
      return null;
    }

    socket.on('typing:start', (payload: unknown) => {
      const room = typingRoomFor(payload);
      if (!room) return;
      socket
        .to(room)
        .emit('typing:start', { userId, username: socket.data.username });
    });

    socket.on('typing:stop', (payload: unknown) => {
      const room = typingRoomFor(payload);
      if (!room) return;
      socket.to(room).emit('typing:stop', { userId });
    });

    // ---------- presence query ----------
    socket.on(
      'presence:list',
      async (payload: unknown, ack?: (reply: unknown) => void) => {
        const serverId =
          typeof payload === 'object' && payload !== null
            ? (payload as { serverId?: unknown }).serverId
            : undefined;
        if (typeof serverId !== 'string') {
          if (typeof ack === 'function') ack({ users: [] });
          return;
        }
        try {
          const member = await db.serverMember.findUnique({
            where: { serverId_userId: { serverId, userId } },
            select: { id: true }
          });
          if (!member) {
            if (typeof ack === 'function') ack({ serverId, users: [] });
            return;
          }
          const all = await db.serverMember.findMany({
            where: { serverId },
            select: { userId: true }
          });
          const users = all
            .map((m) => m.userId)
            .filter((uid) => (presence.get(uid)?.size ?? 0) > 0);
          const reply = { serverId, users };
          if (typeof ack === 'function') ack(reply);
          else socket.emit('presence:list', reply);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('presence:list error', err);
          if (typeof ack === 'function') ack({ serverId, users: [] });
        }
      }
    );

    // ---------- voice signaling ----------
    socket.on('voice:join', async (payload: unknown) => {
      const channelId =
        typeof payload === 'object' && payload !== null
          ? (payload as { channelId?: unknown }).channelId
          : undefined;
      if (typeof channelId !== 'string') return;
      try {
        const channel = await db.channel.findUnique({
          where: { id: channelId },
          select: { id: true, serverId: true, type: true }
        });
        if (!channel || channel.type !== 'VOICE') return;
        const member = await db.serverMember.findUnique({
          where: {
            serverId_userId: { serverId: channel.serverId, userId }
          },
          select: { id: true }
        });
        if (!member) return;

        const room = voiceRoom(channelId);

        // Build peer list of sockets already in the room BEFORE this socket joins.
        const existing = io.sockets.adapter.rooms.get(room);
        const peers: { userId: string; socketId: string }[] = [];
        if (existing) {
          for (const sid of existing) {
            if (sid === socket.id) continue;
            const peer = io.sockets.sockets.get(sid) as
              | AppSocket
              | undefined;
            if (peer?.data.userId) {
              peers.push({ userId: peer.data.userId, socketId: sid });
            }
          }
        }

        socket.join(room);
        socket.data.voiceChannelId = channelId;

        socket.emit('voice:peer-list', { channelId, peers });

        socket.to(room).emit('voice:peer-joined', {
          channelId,
          userId,
          socketId: socket.id
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('voice:join error', err);
      }
    });

    socket.on('voice:leave', (payload: unknown) => {
      const channelId =
        typeof payload === 'object' && payload !== null
          ? ((payload as { channelId?: unknown }).channelId as
              | string
              | undefined)
          : undefined;
      const cid =
        typeof channelId === 'string' ? channelId : socket.data.voiceChannelId;
      if (!cid) return;
      const room = voiceRoom(cid);
      socket.leave(room);
      socket.data.voiceChannelId = null;
      socket.to(room).emit('voice:peer-left', {
        channelId: cid,
        userId,
        socketId: socket.id
      });
    });

    socket.on('voice:signal', (payload: unknown) => {
      if (typeof payload !== 'object' || payload === null) return;
      const { to, description, candidate } = payload as {
        to?: unknown;
        description?: unknown;
        candidate?: unknown;
      };
      if (typeof to !== 'string') return;
      io.to(to).emit('voice:signal', {
        from: socket.id,
        fromUserId: userId,
        description: description ?? null,
        candidate: candidate ?? null
      });
    });

    // ---------- disconnect cleanup ----------
    socket.on('disconnect', () => {
      const vcid = socket.data.voiceChannelId;
      if (vcid) {
        socket.to(voiceRoom(vcid)).emit('voice:peer-left', {
          channelId: vcid,
          userId,
          socketId: socket.id
        });
        socket.data.voiceChannelId = null;
      }

      const set = presence.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          presence.delete(userId);
          // Best effort: notify each server room the user was a member of.
          (async () => {
            try {
              const ms = await db.serverMember.findMany({
                where: { userId },
                select: { serverId: true }
              });
              for (const m of ms) {
                io.to(serverRoom(m.serverId)).emit('presence:offline', {
                  userId
                });
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('presence:offline broadcast failed', err);
            }
          })();
        }
      }
    });
  });
}
