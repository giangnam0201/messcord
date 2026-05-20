import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.dev' },
    update: {},
    create: {
      email: 'alice@demo.dev',
      username: 'alice',
      displayName: 'Alice',
      passwordHash
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.dev' },
    update: {},
    create: {
      email: 'bob@demo.dev',
      username: 'bob',
      displayName: 'Bob',
      passwordHash
    }
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@demo.dev' },
    update: {},
    create: {
      email: 'carol@demo.dev',
      username: 'carol',
      displayName: 'Carol',
      passwordHash
    }
  });

  // Find or create the demo server (idempotent by owner+name).
  let server = await prisma.server.findFirst({
    where: { ownerId: alice.id, name: 'Messcord HQ' }
  });
  if (!server) {
    server = await prisma.server.create({
      data: {
        name: 'Messcord HQ',
        ownerId: alice.id
      }
    });
  }

  // Owner + member rows
  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: alice.id } },
    update: { role: 'OWNER' },
    create: { serverId: server.id, userId: alice.id, role: 'OWNER' }
  });
  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: bob.id } },
    update: {},
    create: { serverId: server.id, userId: bob.id, role: 'MEMBER' }
  });
  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: carol.id } },
    update: {},
    create: { serverId: server.id, userId: carol.id, role: 'MEMBER' }
  });

  // Channels (idempotent by serverId+name)
  async function ensureChannel(name: string, type: 'TEXT' | 'VOICE', position: number) {
    const existing = await prisma.channel.findFirst({
      where: { serverId: server!.id, name }
    });
    if (existing) return existing;
    return prisma.channel.create({
      data: { serverId: server!.id, name, type, position }
    });
  }

  const general = await ensureChannel('general', 'TEXT', 0);
  await ensureChannel('random', 'TEXT', 1);
  await ensureChannel('Lounge', 'VOICE', 2);

  // Welcome messages in #general (only if the channel has no messages yet)
  const generalCount = await prisma.message.count({ where: { channelId: general.id } });
  if (generalCount === 0) {
    await prisma.message.createMany({
      data: [
        {
          channelId: general.id,
          authorId: alice.id,
          content: 'Welcome to Messcord HQ! 🎉'
        },
        {
          channelId: general.id,
          authorId: bob.id,
          content: 'Hey everyone, glad to be here.'
        },
        {
          channelId: general.id,
          authorId: carol.id,
          content: 'Hello world!'
        }
      ]
    });
  }

  // DM conversation between alice and bob (idempotent)
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: alice.id } } },
        { participants: { some: { userId: bob.id } } }
      ]
    }
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: alice.id }, { userId: bob.id }]
        }
      }
    });
  }

  const dmCount = await prisma.message.count({
    where: { conversationId: conversation.id }
  });
  if (dmCount === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          authorId: alice.id,
          content: 'Hey Bob, want to test the DMs?'
        },
        {
          conversationId: conversation.id,
          authorId: bob.id,
          content: 'Sure! This works.'
        }
      ]
    });
  }

  console.log('Seed complete.');
  console.log(`  users: ${alice.email}, ${bob.email}, ${carol.email}`);
  console.log(`  server: ${server.name} (${server.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
