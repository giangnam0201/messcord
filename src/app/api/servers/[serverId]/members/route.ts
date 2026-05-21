import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const joinServerSchema = z.object({
  inviteCode: z.string().optional() // For future invite system
});

// GET: List members of a server
export async function GET(
  _req: Request,
  { params }: { params: { serverId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify membership
  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId: session.user.id } },
    select: { id: true }
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const members = await db.serverMember.findMany({
    where: { serverId: params.serverId },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          isNitro: true
        }
      }
    }
  });

  return NextResponse.json({ members });
}

// POST: Join a server
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
    select: { id: true }
  });
  if (!server) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  // Check if already a member
  const existing = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId: session.user.id } },
    select: { id: true }
  });
  if (existing) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 });
  }

  const member = await db.serverMember.create({
    data: {
      serverId: params.serverId,
      userId: session.user.id,
      role: 'MEMBER'
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  });

  return NextResponse.json({ member }, { status: 201 });
}
