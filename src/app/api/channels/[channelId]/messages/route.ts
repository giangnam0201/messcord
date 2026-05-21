import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  clientId: z.string().optional(),
  replyToId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  stickerIds: z.array(z.string()).optional()
});

async function loadAuthorizedChannel(
  channelId: string,
  userId: string
): Promise<
  | { ok: true; channel: { id: string; serverId: string } }
  | { ok: false; status: 404 | 403 }
> {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { id: true, serverId: true }
  });
  if (!channel) return { ok: false, status: 404 };

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
    select: { id: true }
  });
  if (!membership) return { ok: false, status: 403 };

  return { ok: true, channel };
}

export async function GET(
  _req: Request,
  { params }: { params: { channelId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await loadAuthorizedChannel(params.channelId, session.user.id);
  if (!result.ok) {
    const error = result.status === 404 ? 'Channel not found' : 'Forbidden';
    return NextResponse.json({ error }, { status: result.status });
  }

  const messages = await db.message.findMany({
    where: { channelId: result.channel.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  });

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await loadAuthorizedChannel(params.channelId, session.user.id);
  if (!result.ok) {
    const error = result.status === 404 ? 'Channel not found' : 'Forbidden';
    return NextResponse.json({ error }, { status: result.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const message = await db.message.create({
    data: {
      channelId: result.channel.id,
      authorId: session.user.id,
      content: parsed.data.content,
      replyToId: parsed.data.replyToId || null,
      attachments: parsed.data.attachments ? JSON.stringify(parsed.data.attachments) : null,
      stickerIds: parsed.data.stickerIds ? JSON.stringify(parsed.data.stickerIds) : null
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  });

  // Real-time broadcast via Pusher
  try {
    await pusherServer.trigger(
      `private-channel-${result.channel.id}`,
      'message:new',
      { ...message, clientId: parsed.data.clientId }
    );
  } catch (err) {
    console.error('Pusher trigger failed:', err);
  }

  return NextResponse.json({ message });
}
