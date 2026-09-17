import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting Gini AI Data Cleanup...');

  const lunas = await prisma.character.findMany({
    where: {
      name: {
        contains: 'Luna'
      }
    }
  });
  
  if (lunas.length === 0) {
    console.log('No "Luna" characters found.');
  } else {
    for (const luna of lunas) {
      console.log(`Deleting ${luna.name} (${luna.id})...`);
      // First delete associated messages and sessions to avoid constraint errors
      const sessions = await prisma.chatSession.findMany({ where: { characterId: luna.id }});
      for (const session of sessions) {
        await prisma.message.deleteMany({ where: { chatSessionId: session.id }});
      }
      await prisma.chatSession.deleteMany({ where: { characterId: luna.id }});
      await prisma.character.delete({ where: { id: luna.id } });
      console.log(`✅ Deleted ${luna.name}.`);
    }
  }

  console.log('✅ Gini AI Cleanup complete.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
