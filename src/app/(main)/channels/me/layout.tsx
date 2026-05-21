import { redirect } from 'next/navigation';

import { DMSidebar, type DMConversation } from '@/components/DMSidebar';
import { DMLayoutClient } from '@/components/DMLayoutClient';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DMLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, displayName: true, avatarUrl: true }
  });
  if (!me) {
    redirect('/login');
  }

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
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

  const dmList: DMConversation[] = conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== userId);
    return {
      id: c.id,
      other: other
        ? {
            id: other.user.id,
            username: other.user.username,
            displayName: other.user.displayName,
            avatarUrl: other.user.avatarUrl
          }
        : null
    };
  });

  return (
    <DMLayoutClient sidebar={<DMSidebar conversations={dmList} user={me} />}>
      {children}
    </DMLayoutClient>
  );
}
