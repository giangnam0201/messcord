import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ChatPanelClient } from '@/components/ChatPanelClient';
import type { ChatMessage } from '@/components/MessageList';

type ChatPanelProps =
  | {
      kind: 'channel';
      channelId: string;
      channelName: string;
    }
  | {
      kind: 'dm';
      conversationId: string;
      otherName: string;
    };

export async function ChatPanel(props: ChatPanelProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true
    }
  });
  if (!user) return null;

  let messagesRaw;
  if (props.kind === 'channel') {
    messagesRaw = await db.message.findMany({
      where: { channelId: props.channelId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
  } else {
    messagesRaw = await db.message.findMany({
      where: { conversationId: props.conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  const initial: ChatMessage[] = messagesRaw.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    author: m.author
  }));

  if (props.kind === 'channel') {
    return (
      <ChatPanelClient
        kind="channel"
        channelId={props.channelId}
        channelName={props.channelName}
        initial={initial}
        currentUser={user}
      />
    );
  }

  return (
    <ChatPanelClient
      kind="dm"
      conversationId={props.conversationId}
      otherName={props.otherName}
      initial={initial}
      currentUser={user}
    />
  );
}
