import { redirect } from 'next/navigation';

import { ServerSidebar } from '@/components/ServerSidebar';
import { MobileNav } from '@/components/MobileNav';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function MainLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const servers = await db.server.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, iconUrl: true }
  });

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex">
        <ServerSidebar servers={servers} />
      </div>

      {/* Mobile navigation - swipe/hamburger menu */}
      <MobileNav>
        <ServerSidebar servers={servers} />
      </MobileNav>

      <div className="flex h-full min-w-0 flex-1 flex-row">{children}</div>
    </div>
  );
}
