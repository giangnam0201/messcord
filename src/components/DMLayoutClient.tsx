'use client';

import { usePathname } from 'next/navigation';

/**
 * On mobile:
 * - /channels/me (no conversation open) → show sidebar full width
 * - /channels/me/[id] (conversation open) → show chat full width, hide sidebar
 *
 * On desktop (md+):
 * - Always show both side by side
 */
export function DMLayoutClient({
  sidebar,
  children
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const isInConversation = /^\/channels\/me\/[^/]+/.test(pathname);

  return (
    <>
      {/* Sidebar: visible on desktop always, on mobile only when NOT in a conversation */}
      <div className={`h-full shrink-0 ${isInConversation ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        {sidebar}
      </div>
      {/* Chat: visible on desktop always, on mobile only when IN a conversation */}
      <div className={`h-full min-w-0 flex-1 flex-row ${isInConversation ? 'flex' : 'hidden md:flex'}`}>
        {children}
      </div>
    </>
  );
}
