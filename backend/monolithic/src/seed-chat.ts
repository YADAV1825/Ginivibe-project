import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Starting Chat Cleanup and Re-seeding...');

  // Clear existing chat data
  await prisma.message.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  console.log('Deleted old messages and conversations.');

  const mainUser = await prisma.user.findUnique({
    where: { email: 'yrohit1825@gmail.com' }
  });

  if (!mainUser) {
    console.error('Could not find main user!');
    return;
  }

  // Find other users
  const otherUsers = await prisma.user.findMany({
    where: { NOT: { id: mainUser.id } },
    take: 5
  });

  if (otherUsers.length === 0) {
    console.error('No other users found to chat with!');
    return;
  }

  const englishMessages = [
    "Hey! How are you doing?",
    "That sounds great, count me in!",
    "Are you free this weekend for a quick meetup?",
    "I just saw the post you shared, hilarious 😂",
    "Have you checked out the new AI matching feature?",
    "Let me know if you need any help with that.",
    "Awesome, looking forward to it!"
  ];

  for (let i = 0; i < otherUsers.length; i++) {
    const otherUser = otherUsers[i];
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: mainUser.id },
            { userId: otherUser.id }
          ]
        }
      }
    });

    // Create a few messages
    for (let j = 0; j < 3; j++) {
      const isMine = j % 2 !== 0;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: isMine ? mainUser.id : otherUser.id,
          text: englishMessages[(i * 3 + j) % englishMessages.length]
        }
      });
    }
    console.log(`Created conversation with ${otherUser.username}`);
  }

  console.log('✅ Seeded English messages.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
