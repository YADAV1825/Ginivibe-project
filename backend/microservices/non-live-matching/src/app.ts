import express from 'express';
import cors from 'cors';
import matchingRoutes from './api/routes/matching.routes';
import followRoutes from './api/routes/follow.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/matching', matchingRoutes);
app.use('/api/follow', followRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'non-live-matching' }));

export default app;
