import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['aman@gmail.com', 'aniket2345@gmail.com'] } }
  });
  console.log("Found users:", users.map(u => u.email));
  
  for (const u of users) {
    console.log(`\nFetching match for ${u.email} (ID: ${u.id})`);
    const res = await fetch('http://localhost:3003/api/matching/next', {
      headers: { 'x-user-id': u.id }
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  }
}
run().finally(() => prisma.$disconnect());
