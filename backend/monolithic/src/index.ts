import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { createServer } from 'http';
import { initSocketServer } from './socket';

import authRoutes from './features/auth/routes';
import astrologyRoutes from './features/astrology/routes';
import feedRoutes from './features/feed/route';
import chatRoutes from './features/chat/route';
import callRoutes from './features/calls/call.routes';
import presenceRoutes from './features/presence/presence.routes';
import adRoutes from './features/ads/ad.routes';
import searchRoutes from './features/search/search.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/astrology', astrologyRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/analytics', adRoutes);
app.use('/api/search', searchRoutes);

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep event loop alive for Node 24 + tsx bug
setInterval(() => {}, 1000 * 60 * 60);