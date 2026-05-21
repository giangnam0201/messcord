import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';

const reactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(32)
});

// POST: Add a reaction
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { messageId, emoji } = parsed.data;
  const userId = session.user.id;

  // Verify message exists
  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { id: true, channelId: true, conversationId: true }
  });
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  // Check if reaction already exists (toggle off)
  const existing = await db.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } }
  });

  if (existing) {
    // Remove reaction
    await db.reaction.delete({ where: { id: existing.id } });

    // Broadcast removal
    const channelName = message.channelId
      ? `private-channel-${message.channelId}`
      : `private-conversation-${message.conversationId}`;
    try {
      await pusherServer.trigger(channelName, 'reaction:remove', {
        messageId,
        userId,
        emoji
      });
    } catch {}

    return NextResponse.json({ removed: true, messageId, emoji });
  }

  // Add reaction
  const reaction = await db.reaction.create({
    data: { messageId, userId, emoji },
    include: {
      user: { select: { id: true, username: true, displayName: true } }
    }
  });

  // Broadcast
  const channelName = message.channelId
    ? `private-channel-${message.channelId}`
    : `private-conversation-${message.conversationId}`;
  try {
    await pusherServer.trigger(channelName, 'reaction:add', {
      messageId,
      userId,
      emoji,
      user: reaction.user
    });
  } catch {}

  return NextResponse.json({ added: true, reaction });
}

// GET: Get reactions for a message
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');

  if (!messageId) {
    return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
  }

  const reactions = await db.reaction.findMany({
    where: { messageId },
    include: {
      user: { select: { id: true, username: true, displayName: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group reactions by emoji
  const grouped: Record<string, { emoji: string; count: number; users: { id: string; username: string }[]; userReacted: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], userReacted: false };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push({ id: r.user.id, username: r.user.username });
    if (r.userId === session.user.id) {
      grouped[r.emoji].userReacted = true;
    }
  }

  return NextResponse.json({ reactions: Object.values(grouped) });
}
