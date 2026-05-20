import { notFound, redirect } from 'next/navigation';

import { ChatPanel } from '@/components/ChatPanel';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DMConversationPage({
  params
}: {
  params: { conversationId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const conversation = await db.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  if (!conversation) notFound();

  const isMember = conversation.participants.some((p) => p.userId === userId);
  if (!isMember) notFound();

  const other = conversation.participants.find((p) => p.userId !== userId);
  const otherName = other
    ? other.user.displayName || other.user.username
    : 'Unknown';

  return (
    <ChatPanel
      kind="dm"
      conversationId={conversation.id}
      otherName={otherName}
    />
  );
}
