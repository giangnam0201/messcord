'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { ContextMenuProvider } from '@/components/ContextMenu';
import { SearchModal, useSearchShortcut } from '@/components/SearchModal';

function SearchWrapper({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSearchShortcut();
  return (
    <>
      {children}
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ContextMenuProvider>
          <SearchWrapper>{children}</SearchWrapper>
        </ContextMenuProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
