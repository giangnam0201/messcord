import { notFound, redirect } from 'next/navigation';

import { ChannelSidebar } from '@/components/ChannelSidebar';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ServerLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { serverId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const server = await db.server.findUnique({
    where: { id: params.serverId },
    include: {
      channels: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, type: true }
      }
    }
  });

  if (!server) notFound();

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: server.id, userId } },
    select: { id: true }
  });
  if (!membership) notFound();

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, displayName: true, avatarUrl: true }
  });
  if (!me) {
    redirect('/login');
  }

  const channels = server.channels.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type === 'VOICE' ? ('VOICE' as const) : ('TEXT' as const)
  }));

  const isOwner = server.ownerId === userId;

  return (
    <>
      <ChannelSidebar
        serverId={server.id}
        serverName={server.name}
        channels={channels}
        isOwner={isOwner}
        user={me}
      />
      <div className="flex h-full min-w-0 flex-1 flex-row">{children}</div>
    </>
  );
}
