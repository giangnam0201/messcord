import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createConversationSchema = z.object({
  username: z.string().trim().min(1).max(64)
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: session.user.id } } },
    orderBy: { createdAt: 'desc' },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const targetUsername = parsed.data.username;
  const userId = session.user.id;

  // First user matching username (we don't enforce username uniqueness in the
  // schema, but the seed/UI use unique usernames; use findFirst defensively).
  const target = await db.user.findFirst({
    where: { username: targetUsername },
    select: { id: true, username: true, displayName: true, avatarUrl: true }
  });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (target.id === userId) {
    return NextResponse.json(
      { error: 'Cannot start a conversation with yourself' },
      { status: 400 }
    );
  }

  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: target.id } } }
      ]
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });
  if (existing) {
    return NextResponse.json({ conversation: existing });
  }

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: target.id }]
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json({ conversation });
}
