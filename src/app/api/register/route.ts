import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '@/lib/db';

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, _ . -'),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, username, password } = parsed.data;

  // Check email uniqueness
  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: 'A user with that email already exists' },
      { status: 409 }
    );
  }

  // Check username uniqueness
  const existingUsername = await db.user.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json(
      { error: 'That username is already taken' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      username,
      displayName: username,
      passwordHash,
      status: 'online'
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json({ user }, { status: 201 });
}
