import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';

const createRoleSchema = z.object({
  name: z.string().min(1).max(64),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  permissions: z.string().optional()
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  permissions: z.string().optional(),
  position: z.number().int().min(0).optional()
});

// GET: List roles for a server
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
    select: { id: true }
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roles = await db.role.findMany({
    where: { serverId: params.serverId },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { users: true } }
    }
  });

  return NextResponse.json({ roles });
}

// POST: Create a new role
export async function POST(
  req: Request,
  { params }: { params: { serverId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only owner/admin can manage roles
  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId: session.user.id } },
    select: { role: true }
  });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get highest position
  const lastRole = await db.role.findFirst({
    where: { serverId: params.serverId },
    orderBy: { position: 'desc' },
    select: { position: true }
  });

  const role = await db.role.create({
    data: {
      serverId: params.serverId,
      name: parsed.data.name,
      color: parsed.data.color || '#99AAB5',
      permissions: parsed.data.permissions || DEFAULT_PERMISSIONS.toString(),
      position: (lastRole?.position ?? -1) + 1
    }
  });

  return NextResponse.json({ role }, { status: 201 });
}
