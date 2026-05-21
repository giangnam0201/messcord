import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createLiveKitToken } from '@/lib/livekit';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
  }

  // Verify the user has access to this voice channel
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { id: true, serverId: true, name: true, type: true }
  });

  if (!channel || (channel.type !== 'VOICE' && channel.type !== 'VIDEO')) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId: session.user.id } },
    select: { id: true }
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, displayName: true }
  });

  const participantName = user?.displayName || user?.username || 'User';
  const roomName = `voice-${channelId}`;

  try {
    const token = await createLiveKitToken(
      roomName,
      session.user.id,
      participantName
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('LiveKit token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 500 }
    );
  }
}
