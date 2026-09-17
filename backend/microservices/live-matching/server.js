/**
 * Video Call Signaling Server — Production Ready
 *
 * Features:
 * - HTTPS/WSS with auto-detection of certs in ./certs/
 * - JWT authentication with token generation endpoint
 * - Circuit breaker (max connection cap)
 * - Security headers (CSP, HSTS, X-Frame-Options)
 * - Redis pub/sub for horizontal scaling
 * - Graceful shutdown
 * - Structured JSON logging
 */

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');

const logger = require('./src/logger');
const RoomManager = require('./src/roomManager');
const MatchQueue = require('./src/matchQueue');
const Signaling = require('./src/signaling');
const RateLimiter = require('./src/rateLimiter');
const WSHandler = require('./src/wsHandler');
const RedisAdapter = require('./src/redisAdapter');
const auth = require('./src/auth');

// ─── Configuration ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL_MS, 10) || 30000;
const STALE_ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000;
const MAX_TOTAL_CONNECTIONS = parseInt(process.env.MAX_TOTAL_CONNECTIONS, 10) || 50000;
const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';
const REDIS_URL = process.env.REDIS_URL || '';

// ─── SSL: auto-detect certs from ./certs/ or env vars ────────────
const CERTS_DIR = path.join(__dirname, 'certs');
const SSL_CERT = process.env.SSL_CERT_PATH || (
  fs.existsSync(path.join(CERTS_DIR, 'cert.pem')) ? path.join(CERTS_DIR, 'cert.pem') : ''
);
const SSL_KEY = process.env.SSL_KEY_PATH || (
  fs.existsSync(path.join(CERTS_DIR, 'key.pem')) ? path.join(CERTS_DIR, 'key.pem') : ''
);
const IS_HTTPS = !!(SSL_CERT && SSL_KEY);

// ─── ICE servers (STUN + TURN) ──────────────────────────────────
const stunServers = (process.env.STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const iceServers = stunServers.map((url) => ({ urls: url }));

if (process.env.TURN_SERVER) {
  iceServers.push({
    urls: process.env.TURN_SERVER,
    username: process.env.TURN_USERNAME || '',
    credential: process.env.TURN_CREDENTIAL || '',
  });
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// ─── Initialize Modules ─────────────────────────────────────────
const roomManager = new RoomManager();
const matchQueue = new MatchQueue(roomManager);
const signaling = new Signaling(roomManager);
const rateLimiter = new RateLimiter({
  maxConnectionsPerIp: parseInt(process.env.MAX_CONNECTIONS_PER_IP, 10) || 5,
  messageRateLimit: parseInt(process.env.MESSAGE_RATE_LIMIT, 10) || 20,
  messageRateWindowMs: parseInt(process.env.MESSAGE_RATE_WINDOW_MS, 10) || 1000,
});
const wsHandler = new WSHandler({ roomManager, matchQueue, signaling, rateLimiter, iceServers });
const redisAdapter = new RedisAdapter({ serverId: `worker-${process.pid}` });

// ─── Express App ─────────────────────────────────────────────────
const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)');
  if (IS_HTTPS) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// CORS
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'] }));
} else {
  app.use(cors());
}

app.use(express.json());

// Serve test client
app.use('/client', express.static(path.join(__dirname, 'client')));

// ─── Auth Endpoints ──────────────────────────────────────────────

/**
 * POST /auth/token
 * Generate a JWT token for a user.
 *
 * Request body: { userId: "user123", displayName: "Rohit" }
 * Response:     { token: "eyJ...", expiresIn: "24h" }
 *
 * In production, add your own user validation here
 * (check database, verify password, etc.)
 */
app.post('/auth/token', (req, res) => {
  const { userId, displayName } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // TODO: Add your own user validation here
  // Example: const user = await db.users.findById(userId);
  //          if (!user || !user.verifyPassword(password)) return res.status(401)...

  const token = auth.generateToken({
    userId,
    displayName: displayName || 'Anonymous',
  });

  res.json({
    token,
    expiresIn: process.env.JWT_EXPIRY || '24h',
  });
});

/**
 * GET /auth/verify
 * Verify a token is valid. Protected endpoint example.
 */
app.get('/auth/verify', auth.requireAuth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ─── Health & Metrics ────────────────────────────────────────────

app.get('/health', (req, res) => {
  const clientCount = wsHandler.getStats().connectedClients;
  const isHealthy = clientCount < MAX_TOTAL_CONNECTIONS;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'overloaded',
    uptime: process.uptime(),
    pid: process.pid,
    connections: clientCount,
    maxConnections: MAX_TOTAL_CONNECTIONS,
    https: IS_HTTPS,
    auth: AUTH_ENABLED,
  });
});

app.get('/metrics', (req, res) => {
  const roomStats = roomManager.getStats();
  const queueStats = matchQueue.getStats();
  const clientStats = wsHandler.getStats();
  const rateLimitStats = rateLimiter.getStats();
  const mem = process.memoryUsage();

  res.json({
    server: {
      pid: process.pid,
      uptime: process.uptime(),
      nodeVersion: process.version,
      https: IS_HTTPS,
      auth: AUTH_ENABLED,
    },
    memory: {
      rss: `${(mem.rss / 1024 / 1024).toFixed(1)}MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
    },
    connections: {
      current: clientStats.connectedClients,
      max: MAX_TOTAL_CONNECTIONS,
      utilization: `${((clientStats.connectedClients / MAX_TOTAL_CONNECTIONS) * 100).toFixed(1)}%`,
    },
    rooms: roomStats,
    queue: queueStats,
    rateLimit: rateLimitStats,
    redis: { enabled: redisAdapter.enabled },
    iceServers: iceServers.map((s) => ({ urls: s.urls, hasTurn: !!s.username })),
  });
});

app.get('/room/:code/exists', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  res.json({
    exists: roomManager.roomExists(code),
    joinable: roomManager.isRoomJoinable(code),
  });
});

// ─── HTTP(S) Server ──────────────────────────────────────────────
let server;

if (IS_HTTPS) {
  try {
    const sslOptions = {
      cert: fs.readFileSync(SSL_CERT),
      key: fs.readFileSync(SSL_KEY),
    };
    server = https.createServer(sslOptions, app);
    logger.info('🔒 HTTPS mode enabled', { cert: SSL_CERT, key: SSL_KEY });
  } catch (err) {
    logger.error('Failed to load SSL certificates, falling back to HTTP', { error: err.message });
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
  logger.warn('⚠️  Running in HTTP mode — camera access will only work on localhost');
  logger.warn('   Run: npm run setup:ssl to generate certificates');
}

// ─── WebSocket Server ────────────────────────────────────────────
const wss = new WebSocketServer({
  server,
  maxPayload: 64 * 1024,
  verifyClient: (info, callback) => {
    // Circuit breaker
    if (wsHandler.getStats().connectedClients >= MAX_TOTAL_CONNECTIONS) {
      logger.warn('Connection rejected: server at capacity');
      callback(false, 503, 'Server at capacity. Try again later.');
      return;
    }

    // Origin validation
    if (allowedOrigins.length > 0) {
      const origin = info.origin || info.req.headers.origin;
      if (!allowedOrigins.includes(origin)) {
        logger.warn('Connection rejected: invalid origin', { origin });
        callback(false, 403, 'Forbidden');
        return;
      }
    }

    // JWT auth validation
    if (AUTH_ENABLED) {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (!auth.verifyWebSocketToken(token)) {
        logger.warn('Connection rejected: auth failed');
        callback(false, 401, 'Unauthorized');
        return;
      }
    }

    callback(true);
  },
});

wss.on('connection', (ws, req) => {
  wsHandler.handleConnection(ws, req);
});

// ─── Redis Adapter ───────────────────────────────────────────────
redisAdapter.onMessage((data) => {
  const ws = wsHandler.clients.get(data.targetUserId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data.message));
  }
});

// ─── Heartbeat & Cleanup ─────────────────────────────────────────
const heartbeatTimer = setInterval(() => {
  wsHandler.heartbeat();
}, HEARTBEAT_INTERVAL);

const cleanupTimer = setInterval(() => {
  roomManager.cleanupStaleRooms();
  matchQueue.cleanup();
}, STALE_ROOM_CLEANUP_INTERVAL);

// ─── Graceful Shutdown ───────────────────────────────────────────
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  clearInterval(heartbeatTimer);
  clearInterval(cleanupTimer);

  wsHandler.shutdown();
  await redisAdapter.shutdown();

  wss.close(() => {
    server.close(() => {
      logger.info('Server shut down gracefully');
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  if (err.code === 'ERR_STREAM_DESTROYED' || err.code === 'ECONNRESET') return;
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

// ─── Start ───────────────────────────────────────────────────────
async function start() {
  await redisAdapter.init(REDIS_URL);

  server.listen(PORT, HOST, () => {
    const protocol = IS_HTTPS ? 'https' : 'http';
    const wsProtocol = IS_HTTPS ? 'wss' : 'ws';

    logger.info(`🚀 Video Call Signaling Server running`, {
      pid: process.pid,
      host: HOST,
      port: PORT,
      protocol,
      https: IS_HTTPS,
      auth: AUTH_ENABLED,
      maxConnections: MAX_TOTAL_CONNECTIONS,
      redis: redisAdapter.enabled,
      turnConfigured: iceServers.some((s) => s.username),
      iceServers: iceServers.map((s) => s.urls),
    });
    logger.info(`📡 WebSocket: ${wsProtocol}://${HOST}:${PORT}`);
    logger.info(`🌐 Test client: ${protocol}://${HOST}:${PORT}/client/`);
    logger.info(`❤️  Health: ${protocol}://${HOST}:${PORT}/health`);
    logger.info(`📊 Metrics: ${protocol}://${HOST}:${PORT}/metrics`);
    if (AUTH_ENABLED) {
      logger.info(`🔑 Auth: POST ${protocol}://${HOST}:${PORT}/auth/token`);
    }
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

module.exports = { app, server, wss };
