import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createServerSchema = z.object({
  name: z.string().trim().min(1).max(64)
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const servers = await db.server.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: 'asc' },
    include: {
      channels: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
      }
    }
  });

  return NextResponse.json({ servers });
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

  const parsed = createServerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const { name } = parsed.data;

  const server = await db.server.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: [{ userId, role: 'OWNER' }]
      },
      channels: {
        create: [
          { name: 'general', type: 'TEXT', position: 0 },
          { name: 'Lounge', type: 'VOICE', position: 1 }
        ]
      }
    },
    include: {
      channels: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
      }
    }
  });

  return NextResponse.json({ server });
}
