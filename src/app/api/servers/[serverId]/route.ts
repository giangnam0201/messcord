import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const server = await db.server.findUnique({
      where: { id: params.serverId },
      select: { ownerId: true }
    });

    if (!server) {
      return new NextResponse('Server not found', { status: 404 });
    }

    if (server.ownerId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await db.server.delete({
      where: { id: params.serverId }
    });

    return NextResponse.json({ success: true, id: params.serverId });
  } catch (error) {
    console.error('[SERVER_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
