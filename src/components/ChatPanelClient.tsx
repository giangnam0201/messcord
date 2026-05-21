'use client';

import { ChatHeader } from '@/components/ChatHeader';
import { MessageInput } from '@/components/MessageInput';
import { MessageList, type ChatMessage } from '@/components/MessageList';
import { TypingIndicator, useTypingEmitter } from '@/components/TypingIndicator';
import { useChannelMessages } from '@/hooks/useChannelMessages';

type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type ChatPanelClientProps =
  | {
      kind: 'channel';
      channelId: string;
      channelName: string;
      initial: ChatMessage[];
      currentUser: CurrentUser;
    }
  | {
      kind: 'dm';
      conversationId: string;
      otherName: string;
      initial: ChatMessage[];
      currentUser: CurrentUser;
    };

export function ChatPanelClient(props: ChatPanelClientProps) {
  const targetType = props.kind === 'channel' ? 'channel' : 'conversation';
  const targetId =
    props.kind === 'channel' ? props.channelId : props.conversationId;

  const pusherChannelName = targetType === 'channel'
    ? `private-channel-${targetId}`
    : `private-conversation-${targetId}`;

  const { messages, sendMessage } = useChannelMessages({
    targetType,
    targetId,
    initial: props.initial,
    currentUser: props.currentUser
  });

  const { emitTyping, stopTyping } = useTypingEmitter({
    channelName: pusherChannelName,
    currentUserId: props.currentUser.id,
    currentUsername: props.currentUser.displayName || props.currentUser.username
  });

  function handleSend(content: string) {
    stopTyping();
    sendMessage(content);
  }

  if (props.kind === 'channel') {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
        <ChatHeader kind="channel" name={props.channelName} />
        <MessageList messages={messages} currentUserId={props.currentUser.id} />
        <TypingIndicator channelName={pusherChannelName} currentUserId={props.currentUser.id} />
        <MessageInput
          onSend={handleSend}
          onTyping={emitTyping}
          placeholder={`Message #${props.channelName}`}
        />
      </section>
    );
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      <ChatHeader kind="dm" name={props.otherName} />
      <MessageList messages={messages} currentUserId={props.currentUser.id} />
      <TypingIndicator channelName={pusherChannelName} currentUserId={props.currentUser.id} />
      <MessageInput
        onSend={handleSend}
        onTyping={emitTyping}
        placeholder={`Message @${props.otherName}`}
      />
    </section>
  );
}
