import { MessagesSquare } from 'lucide-react';

export default function DMHomePage() {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col items-center justify-center bg-discord-dark px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-discord-darker text-zinc-300">
        <MessagesSquare className="h-7 w-7" />
      </div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-100">
        Your direct messages
      </h1>
      <p className="max-w-sm text-sm text-zinc-400">
        Type a username in the search above to start a new conversation. Try
        chatting with <span className="font-mono text-zinc-200">bob</span> or
        <span className="font-mono text-zinc-200"> carol</span>.
      </p>
    </section>
  );
}
