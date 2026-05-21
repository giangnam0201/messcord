import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice',
      passwordHash,
      status: 'online',
      bio: 'Hey there! I love coding and gaming.',
      isNitro: true
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob',
      passwordHash,
      status: 'idle',
      bio: 'Music producer and developer.'
    }
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie',
      passwordHash,
      status: 'dnd'
    }
  });

  // Create a server
  const server = await prisma.server.upsert({
    where: { id: 'seed-server-1' },
    update: {},
    create: {
      id: 'seed-server-1',
      name: 'Messcord Hub',
      description: 'The official Messcord community server',
      ownerId: alice.id
    }
  });

  // Create channels
  await prisma.channel.upsert({
    where: { id: 'seed-channel-general' },
    update: {},
    create: {
      id: 'seed-channel-general',
      serverId: server.id,
      name: 'general',
      type: 'TEXT',
      topic: 'General discussion',
      position: 0
    }
  });

  await prisma.channel.upsert({
    where: { id: 'seed-channel-random' },
    update: {},
    create: {
      id: 'seed-channel-random',
      serverId: server.id,
      name: 'random',
      type: 'TEXT',
      topic: 'Off-topic chat',
      position: 1
    }
  });

  await prisma.channel.upsert({
    where: { id: 'seed-channel-voice' },
    update: {},
    create: {
      id: 'seed-channel-voice',
      serverId: server.id,
      name: 'Lounge',
      type: 'VOICE',
      position: 2
    }
  });

  await prisma.channel.upsert({
    where: { id: 'seed-channel-video' },
    update: {},
    create: {
      id: 'seed-channel-video',
      serverId: server.id,
      name: 'Stream Room',
      type: 'VIDEO',
      position: 3
    }
  });

  // Add members
  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: alice.id } },
    update: {},
    create: { serverId: server.id, userId: alice.id, role: 'OWNER' }
  });

  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: bob.id } },
    update: {},
    create: { serverId: server.id, userId: bob.id, role: 'ADMIN' }
  });

  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: server.id, userId: charlie.id } },
    update: {},
    create: { serverId: server.id, userId: charlie.id, role: 'MEMBER' }
  });

  // Create roles
  await prisma.role.upsert({
    where: { id: 'seed-role-everyone' },
    update: {},
    create: {
      id: 'seed-role-everyone',
      serverId: server.id,
      name: '@everyone',
      color: '#99AAB5',
      isDefault: true,
      position: 0
    }
  });

  await prisma.role.upsert({
    where: { id: 'seed-role-mod' },
    update: {},
    create: {
      id: 'seed-role-mod',
      serverId: server.id,
      name: 'Moderator',
      color: '#3498db',
      position: 1
    }
  });

  await prisma.role.upsert({
    where: { id: 'seed-role-vip' },
    update: {},
    create: {
      id: 'seed-role-vip',
      serverId: server.id,
      name: 'VIP',
      color: '#f1c40f',
      position: 2
    }
  });

  // Create a DM conversation
  const conversation = await prisma.conversation.upsert({
    where: { id: 'seed-convo-1' },
    update: {},
    create: { id: 'seed-convo-1' }
  });

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: alice.id } },
    update: {},
    create: { conversationId: conversation.id, userId: alice.id }
  });

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: bob.id } },
    update: {},
    create: { conversationId: conversation.id, userId: bob.id }
  });

  // Create some sample messages
  await prisma.message.createMany({
    data: [
      {
        channelId: 'seed-channel-general',
        authorId: alice.id,
        content: 'Welcome to Messcord! 🎉'
      },
      {
        channelId: 'seed-channel-general',
        authorId: bob.id,
        content: 'Hey everyone! Great to be here.'
      },
      {
        channelId: 'seed-channel-general',
        authorId: charlie.id,
        content: 'This is awesome! Love the voice chat feature.'
      },
      {
        conversationId: conversation.id,
        authorId: alice.id,
        content: 'Hey Bob, how are you?'
      },
      {
        conversationId: conversation.id,
        authorId: bob.id,
        content: 'Doing great! Check out this GIF: https://media.tenor.com/images/cool.gif'
      }
    ],
    skipDuplicates: true
  });

  // Friendship between Alice and Bob
  await prisma.friendship.upsert({
    where: { requesterId_addresseeId: { requesterId: alice.id, addresseeId: bob.id } },
    update: {},
    create: {
      requesterId: alice.id,
      addresseeId: bob.id,
      status: 'ACCEPTED'
    }
  });

  console.log('✅ Seed complete!');
  console.log('   Users: alice@example.com, bob@example.com, charlie@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
