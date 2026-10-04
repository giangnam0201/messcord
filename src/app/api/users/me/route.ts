import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        isNitro: true,
        bio: true,
        customStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[USERS_ME_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { displayName, avatarUrl, status } = await req.json();

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName && { displayName: displayName.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl ? avatarUrl.trim() : null }),
        ...(status && { status })
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[USERS_ME_PATCH_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
