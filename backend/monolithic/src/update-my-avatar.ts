import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateAvatar() {
  await prisma.user.update({
    where: { email: 'yrohit1825@gmail.com' },
    data: { profilePic: 'http://localhost:3004/avatars/image_037.png' }
  });
  console.log('✅ Avatar updated.');
}

updateAvatar().catch(console.error).finally(() => prisma.$disconnect());
