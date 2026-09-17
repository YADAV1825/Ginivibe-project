import { prisma } from './src/infrastructure/postgres/client';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('supersecret', 10);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@ginivibe.com' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    },
    create: {
      email: 'admin@ginivibe.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin user seeded: admin@ginivibe.com / supersecret');
}

main().catch(console.error).finally(() => prisma.$disconnect());
