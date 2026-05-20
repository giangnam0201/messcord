import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000)
});

async function loadAuthorizedConversation(
  conversationId: string,
  userId: string
): Promise<
  | { ok: true; conversationId: string }
  | { ok: false; status: 404 | 403 }
> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true }
  });
  if (!conversation) return { ok: false, status: 404 };

  const membership = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true }
  });
  if (!membership) return { ok: false, status: 403 };

  return { ok: true, conversationId: conversation.id };
}

export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await loadAuthorizedConversation(
    params.conversationId,
    session.user.id
  );
  if (!result.ok) {
    const error =
      result.status === 404 ? 'Conversation not found' : 'Forbidden';
    return NextResponse.json({ error }, { status: result.status });
  }

  const messages = await db.message.findMany({
    where: { conversationId: result.conversationId, deletedAt: null },
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
  { params }: { params: { conversationId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await loadAuthorizedConversation(
    params.conversationId,
    session.user.id
  );
  if (!result.ok) {
    const error =
      result.status === 404 ? 'Conversation not found' : 'Forbidden';
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
      conversationId: result.conversationId,
      authorId: session.user.id,
      content: parsed.data.content
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  });

  return NextResponse.json({ message });
}
