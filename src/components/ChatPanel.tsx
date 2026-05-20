import { db } from '@/lib/db';
import { ChatHeader } from '@/components/ChatHeader';
import { MessageInput } from '@/components/MessageInput';
import { MessageList, type ChatMessage } from '@/components/MessageList';

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

  const messages: ChatMessage[] = messagesRaw.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    author: m.author
  }));

  if (props.kind === 'channel') {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
        <ChatHeader kind="channel" name={props.channelName} />
        <MessageList messages={messages} />
        <MessageInput
          target={{ type: 'channel', id: props.channelId }}
          placeholder={`Message #${props.channelName}`}
        />
      </section>
    );
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      <ChatHeader kind="dm" name={props.otherName} />
      <MessageList messages={messages} />
      <MessageInput
        target={{ type: 'conversation', id: props.conversationId }}
        placeholder={`Message @${props.otherName}`}
      />
    </section>
  );
}
