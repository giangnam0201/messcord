import type { Metadata } from 'next';

import { Providers } from '@/components/Providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Messcord',
  description: 'A Discord-style chat and voice app.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-discord-darkest text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
