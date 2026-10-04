import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, type } = await req.json();

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

    const updatedChannel = await db.channel.update({
      where: { id: params.channelId },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type })
      }
    });

    return NextResponse.json({ channel: updatedChannel });
  } catch (error) {
    console.error('[CHANNEL_PATCH_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
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

    await db.channel.delete({
      where: { id: params.channelId }
    });

    return NextResponse.json({ success: true, id: params.channelId });
  } catch (error) {
    console.error('[CHANNEL_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
