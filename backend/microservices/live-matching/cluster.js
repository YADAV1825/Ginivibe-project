/**
 * Cluster Manager
 * Runs the server on all available CPU cores using Node.js cluster module.
 * Each worker is an independent process handling WebSocket connections.
 *
 * With Redis adapter, workers + multiple machines can all share state.
 * Without Redis, each worker is independent (load balancer needs sticky sessions).
 *
 * Usage: node cluster.js (instead of node server.js)
 */

const cluster = require('cluster');
const os = require('os');

const MAX_WORKERS = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`[Cluster] Primary process ${process.pid} starting ${MAX_WORKERS} workers...`);

  // Fork workers
  for (let i = 0; i < MAX_WORKERS; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Cluster] Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`);
    setTimeout(() => cluster.fork(), 1000); // Brief delay to avoid rapid crash loops
  });

  // Graceful shutdown
  function shutdownAll(signal) {
    console.log(`[Cluster] Received ${signal}. Shutting down all workers...`);
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill(signal);
    }
    setTimeout(() => process.exit(0), 10000);
  }

  process.on('SIGTERM', () => shutdownAll('SIGTERM'));
  process.on('SIGINT', () => shutdownAll('SIGINT'));

  // Report status
  let readyWorkers = 0;
  cluster.on('message', (worker, msg) => {
    if (msg === 'ready') {
      readyWorkers++;
      if (readyWorkers === MAX_WORKERS) {
        console.log(`[Cluster] All ${MAX_WORKERS} workers ready. Server is fully operational.`);
      }
    }
  });
} else {
  // Worker process — run the actual server
  require('./server.js');

  // Notify primary that we're ready
  if (process.send) {
    process.send('ready');
  }
}
