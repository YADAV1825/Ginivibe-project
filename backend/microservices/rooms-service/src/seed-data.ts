import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from './generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  // ESM-only package inside a CommonJS service: dynamic import.
  const { faker } = await import('@faker-js/faker');
  console.log('🌱 Starting Rooms Seeding...');

  // The creatorId needs to be a valid user ID from Auth. We can just use the user we saw in the logs or generate a fake one.
  const creatorId = '76f6f0ff-a994-4c78-8cc0-d59d18bfef74';

  for (let i = 0; i < 5; i++) {
    await prisma.room.create({
      data: {
        name: faker.company.catchPhrase(),
        creatorId: creatorId,
        type: 'TEXT',
        visibility: 'OPEN',
        isActive: true,
        maxCapacity: 30
      }
    });
  }

  console.log('✅ Seeded public rooms.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
