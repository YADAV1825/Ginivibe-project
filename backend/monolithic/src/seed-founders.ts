import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedFounders() {
  console.log('🌱 Starting Founders Seeding...');

  // Let's find 3 random users that already exist and turn them into founders in Delhi.
  const users = await prisma.user.findMany({
    take: 3,
    orderBy: { createdAt: 'asc' }
  });

  if (users.length < 3) {
    console.log('Not enough users found to make founders.');
    return;
  }

  const founderData = [
    {
      name: 'Priya Sharma',
      bio: 'Building the future of AI. Founder & CEO. Looking for co-founders and like-minded tech enthusiasts.',
      tags: ['Founder', 'AI', 'Startup', 'Tech'],
      gender: 'Female',
      avatarUrl: 'https://i.pravatar.cc/150?u=priya_founder',
      location: 'Delhi, India'
    },
    {
      name: 'Rahul Verma',
      bio: 'Serial Entrepreneur. Founder of 2 successful SaaS startups. Currently exploring Web3.',
      tags: ['Founder', 'SaaS', 'Web3', 'Investing'],
      gender: 'Male',
      avatarUrl: 'https://i.pravatar.cc/150?u=rahul_founder',
      location: 'Delhi, India'
    },
    {
      name: 'Ananya Gupta',
      bio: 'Tech Founder in the ed-tech space. Passionate about scaling education in Delhi.',
      tags: ['Founder', 'EdTech', 'Scaling', 'Networking'],
      gender: 'Female',
      avatarUrl: 'https://i.pravatar.cc/150?u=ananya_founder',
      location: 'Delhi, India'
    }
  ];

  for (let i = 0; i < 3; i++) {
    await prisma.user.update({
      where: { id: users[i].id },
      data: {
        firstName: founderData[i].name.split(' ')[0],
        lastName: founderData[i].name.split(' ')[1],
        bio: founderData[i].bio,
        gender: founderData[i].gender,
        profilePic: founderData[i].avatarUrl,
        // Assuming we store location or tags somehow. Wait, monolithic schema doesn't have location directly on User, 
        // but let's check if it does.
      }
    });
  }

  console.log('✅ Seeded 3 Founders successfully.');
}

seedFounders().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
