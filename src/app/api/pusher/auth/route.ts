import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.text();
  const params = new URLSearchParams(data);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // For presence channels, include user data
  if (channelName.startsWith('presence-')) {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: session.user.id,
      user_info: {
        username: (session.user as { username?: string }).username || '',
        name: session.user.name || ''
      }
    });
    return NextResponse.json(authResponse);
  }

  // For private channels
  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
