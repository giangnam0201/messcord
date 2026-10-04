import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return new NextResponse('Content required', { status: 400 });
    }

    const existingMessage = await db.message.findUnique({
      where: { id: params.messageId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    if (!existingMessage || existingMessage.channelId !== params.channelId) {
      return new NextResponse('Message not found', { status: 404 });
    }

    if (existingMessage.authorId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const updatedMessage = await db.message.update({
      where: { id: params.messageId },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    // Broadcast via Pusher
    const channelName = `private-channel-${params.channelId}`;
    await pusherServer.trigger(channelName, 'message:update', updatedMessage);

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('[MESSAGE_PATCH_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const existingMessage = await db.message.findUnique({
      where: { id: params.messageId }
    });

    if (!existingMessage || existingMessage.channelId !== params.channelId) {
      return new NextResponse('Message not found', { status: 404 });
    }

    if (existingMessage.authorId !== session.user.id) {
      // Check if user is server owner/admin
      const channel = await db.channel.findUnique({
        where: { id: params.channelId },
        select: { serverId: true }
      });

      let isAllowed = false;
      if (channel) {
        const member = await db.serverMember.findUnique({
          where: { serverId_userId: { serverId: channel.serverId, userId: session.user.id } }
        });
        if (member && (member.role === 'OWNER' || member.role === 'ADMIN' || member.role === 'MODERATOR')) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    // Soft delete message
    await db.message.update({
      where: { id: params.messageId },
      data: { deletedAt: new Date() }
    });

    // Broadcast deletion via Pusher
    const channelName = `private-channel-${params.channelId}`;
    await pusherServer.trigger(channelName, 'message:delete', { id: params.messageId });

    return NextResponse.json({ success: true, id: params.messageId });
  } catch (error) {
    console.error('[MESSAGE_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
