'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      aria-label="Sign out"
      title="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
