import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { MatchingApplicationService } from './src/application/matching.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ginivibe' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email })));

  const service = new MatchingApplicationService();
  if (users.length > 0) {
    for (const u of users) {
      console.log(`\n--- Matching for ${u.email} ---`);
      try {
        const match = await service.getNextMatch(u.id);
        console.log("Match:", match);
      } catch (e) {
        console.error("Error matching:", e.message);
      }
    }
  }
}
run().finally(() => prisma.$disconnect());
