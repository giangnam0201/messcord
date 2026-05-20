'use client';

import { Volume2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ChatHeader } from '@/components/ChatHeader';

export function VoiceRoom({
  channelId: _channelId,
  channelName
}: {
  channelId: string;
  channelName: string;
}) {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      <ChatHeader kind="channel" name={channelName} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-discord-darker text-zinc-300">
          <Volume2 className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Voice room - real-time audio coming soon
        </h2>
        <p className="max-w-sm text-sm text-zinc-400">
          Voice chat is wired up in a follow-up release. For now, this is a
          placeholder so you can see how voice channels appear in the sidebar.
        </p>
        <Button variant="secondary" disabled>
          Connect
        </Button>
      </div>
    </section>
  );
}
