import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const createInviteSchema = z.object({
  maxUses: z.number().int().min(0).max(1000).optional(),
  expiresInHours: z.number().int().min(0).max(168).optional() // max 7 days
});

// GET: List invites for a server
export async function GET(
  _req: Request,
  { params }: { params: { serverId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId: session.user.id } },
    select: { role: true }
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invites = await db.invite.findMany({
    where: { serverId: params.serverId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ invites });
}

// POST: Create an invite
export async function POST(
  req: Request,
  { params }: { params: { serverId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId: session.user.id } },
    select: { role: true }
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = createInviteSchema.safeParse(body);
  const maxUses = parsed.success ? parsed.data.maxUses : undefined;
  const expiresInHours = parsed.success ? parsed.data.expiresInHours : undefined;

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.invite.findUnique({ where: { code } });
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null;

  const invite = await db.invite.create({
    data: {
      code,
      serverId: params.serverId,
      creatorId: session.user.id,
      maxUses: maxUses || null,
      expiresAt
    }
  });

  return NextResponse.json({ invite }, { status: 201 });
}
