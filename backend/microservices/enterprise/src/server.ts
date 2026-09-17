import app from './app';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables
dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 3005;

async function start() {
  try {
    // Here we would initialize DB connections (PostgreSQL/Prisma, Redis)
    // await initDatabase();
    
    const server = http.createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 GiniVibe Enterprise Platform running on port ${PORT}`);
      console.log(`❤️  Health check available at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        // Close DB connections here
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start enterprise server:', error);
    process.exit(1);
  }
}

start();
