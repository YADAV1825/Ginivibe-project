import 'dotenv/config';
import app from './app';
import { prisma } from './infrastructure/postgres/client';

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, () => {
  console.log(`Non-Live Matching Service running on port ${PORT}`);
});

// Production Hardening: Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received: closing HTTP server`);
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    console.log('Database connections closed cleanly');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Trigger restart
