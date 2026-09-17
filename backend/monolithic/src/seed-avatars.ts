import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const users = await prisma.user.findMany();
  for (let i = 0; i < users.length; i++) {
    const avatarIndex = String(i % 50).padStart(3, '0');
    await prisma.user.update({
      where: { id: users[i].id },
      data: { profilePic: `http://localhost:3004/avatars/image_${avatarIndex}.png` }
    });
  }
  console.log('✅ Seeded avatars for users.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
