import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Get invite info (public preview)
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const invite = await db.invite.findUnique({
    where: { code: params.code },
    include: {
      server: {
        select: { id: true, name: true, iconUrl: true, _count: { select: { members: true } } }
      }
    }
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  // Check expiry
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  // Check max uses
  if (invite.maxUses && invite.uses >= invite.maxUses) {
    return NextResponse.json({ error: 'This invite has reached its max uses' }, { status: 410 });
  }

  return NextResponse.json({
    invite: {
      code: invite.code,
      server: invite.server,
      expiresAt: invite.expiresAt,
      memberCount: invite.server._count.members
    }
  });
}

// POST: Accept/join via invite
export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invite = await db.invite.findUnique({
    where: { code: params.code },
    include: { server: { select: { id: true, name: true } } }
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  if (invite.maxUses && invite.uses >= invite.maxUses) {
    return NextResponse.json({ error: 'This invite has reached its max uses' }, { status: 410 });
  }

  // Check if already a member
  const existing = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: invite.serverId, userId: session.user.id } }
  });
  if (existing) {
    return NextResponse.json({ serverId: invite.serverId, alreadyMember: true });
  }

  // Join server
  await db.serverMember.create({
    data: {
      serverId: invite.serverId,
      userId: session.user.id,
      role: 'MEMBER'
    }
  });

  // Increment uses
  await db.invite.update({
    where: { id: invite.id },
    data: { uses: { increment: 1 } }
  });

  return NextResponse.json({ serverId: invite.serverId, joined: true });
}
