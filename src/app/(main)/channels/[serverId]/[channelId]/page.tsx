import { notFound, redirect } from 'next/navigation';

import { ChatPanel } from '@/components/ChatPanel';
import { MembersList } from '@/components/MembersList';
import { VoiceRoom } from '@/components/VoiceRoom';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ChannelPage({
  params
}: {
  params: { serverId: string; channelId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const channel = await db.channel.findUnique({
    where: { id: params.channelId },
    select: { id: true, serverId: true, name: true, type: true }
  });
  if (!channel || channel.serverId !== params.serverId) notFound();

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
    select: { id: true }
  });
  if (!membership) notFound();

  if (channel.type === 'VOICE') {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true
      }
    });
    if (!user) notFound();
    return (
      <>
        <VoiceRoom
          channelId={channel.id}
          channelName={channel.name}
          currentUser={user}
        />
        <MembersList serverId={channel.serverId} />
      </>
    );
  }

  return (
    <>
      <ChatPanel
        kind="channel"
        channelId={channel.id}
        channelName={channel.name}
      />
      <MembersList serverId={channel.serverId} />
    </>
  );
}
