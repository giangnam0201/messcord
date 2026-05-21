import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { channelName, event, data } = body as {
    channelName?: string;
    event?: string;
    data?: unknown;
  };

  if (!channelName || !event || !data) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Only allow typing events
  if (event !== 'typing:start' && event !== 'typing:stop') {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  try {
    await pusherServer.trigger(channelName, event, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Pusher typing trigger failed:', err);
    return NextResponse.json({ error: 'Failed to trigger event' }, { status: 500 });
  }
}
