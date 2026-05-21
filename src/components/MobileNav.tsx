'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button - only shows on small screens */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-2 top-2 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-discord-darker text-zinc-300 shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-[320px] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-2 mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
