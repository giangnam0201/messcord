import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[^\s]+(?:[ -][^\s]+)*$/, 'Invalid channel name'),
  type: z.enum(['TEXT', 'VOICE'])
});

export async function POST(
  req: Request,
  { params }: { params: { serverId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const server = await db.server.findUnique({
    where: { id: params.serverId },
    select: { id: true, ownerId: true }
  });
  if (!server) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }
  if (server.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const last = await db.channel.findFirst({
    where: { serverId: server.id },
    orderBy: { position: 'desc' },
    select: { position: true }
  });
  const nextPosition = (last?.position ?? -1) + 1;

  const channel = await db.channel.create({
    data: {
      serverId: server.id,
      name: parsed.data.name,
      type: parsed.data.type,
      position: nextPosition
    }
  });

  return NextResponse.json({ channel });
}
