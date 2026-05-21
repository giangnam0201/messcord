import { notFound, redirect } from 'next/navigation';
import { Hash } from 'lucide-react';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ServerIndexPage({
  params
}: {
  params: { serverId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  const membership = await db.serverMember.findUnique({
    where: { serverId_userId: { serverId: params.serverId, userId } },
    select: { id: true }
  });
  if (!membership) notFound();

  const firstText = await db.channel.findFirst({
    where: { serverId: params.serverId, type: 'TEXT' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: { id: true }
  });

  if (firstText) {
    redirect(`/channels/${params.serverId}/${firstText.id}`);
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col items-center justify-center bg-discord-dark px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-discord-darker text-zinc-300">
        <Hash className="h-7 w-7" />
      </div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-100">
        No text channels yet
      </h1>
      <p className="max-w-sm text-sm text-zinc-400">
        Ask the server owner to create a channel, or use the
        <span className="font-mono text-zinc-200"> + </span>
        button beside &quot;Text Channels&quot; in the sidebar.
      </p>
    </section>
  );
}
