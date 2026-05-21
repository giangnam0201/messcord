import { createUploadthing, type FileRouter } from 'uploadthing/next';

import { auth } from '@/lib/auth';

const f = createUploadthing();

export const ourFileRouter = {
  messageAttachment: f({
    image: { maxFileSize: '8MB', maxFileCount: 5 },
    video: { maxFileSize: '64MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 3 },
    'application/zip': { maxFileSize: '8MB', maxFileCount: 1 }
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name, size: file.size };
    }),

  avatarUpload: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  serverIcon: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
